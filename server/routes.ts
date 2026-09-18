import express, { Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import bcrypt from 'bcryptjs';
import ExcelJS from 'exceljs';
import { db } from './db.js';
import {
  AuthenticatedRequest,
  authenticateToken,
  generateToken,
  getFullUserProfile,
  requireFaculty,
  requireSuperAdmin,
  requireStudent,
} from './auth.js';

const router = express.Router();

const UPLOADS_DIR = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Multer Storage Configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `cert-${uniqueSuffix}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedMimes = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml'];
    const allowedExts = ['.pdf', '.png', '.jpg', '.jpeg', '.svg'];
    const ext = path.extname(file.originalname).toLowerCase();

    if (allowedMimes.includes(file.mimetype) || allowedExts.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, PNG, JPG, and JPEG certificates are supported (max 10MB).'));
    }
  },
});

// Middleware for multer error handling
function handleUpload(req: Request, res: Response, next: express.NextFunction) {
  upload.single('certificate_file')(req, res, (err: any) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ error: 'File size exceeds maximum allowed limit of 10 MB.' });
      }
      return res.status(400).json({ error: `File upload error: ${err.message}` });
    } else if (err) {
      return res.status(400).json({ error: err.message || 'Error processing uploaded file.' });
    }
    next();
  });
}

// ==========================================
// 1. AUTHENTICATION ROUTES
// ==========================================

// POST /api/auth/login
router.post('/auth/login', (req: Request, res: Response) => {
  const { identifier, email, username, password } = req.body;
  const loginKey = identifier || email || username;

  if (!loginKey || !password) {
    return res.status(400).json({ error: 'Email or username and password are required.' });
  }

  const cleanKey = loginKey.trim().toLowerCase();

  const user = db.prepare(`
    SELECT DISTINCT u.* FROM users u
    LEFT JOIN faculty f ON f.user_id = u.id
    LEFT JOIN students s ON s.user_id = u.id
    WHERE lower(u.email) = ?
       OR lower(u.username) = ?
       OR lower(COALESCE(f.faculty_id, '')) = ?
       OR lower(COALESCE(s.roll_number, '')) = ?
  `).get(cleanKey, cleanKey, cleanKey, cleanKey) as any;

  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials. User not found.' });
  }

  const isValid = bcrypt.compareSync(password, user.password_hash);
  if (!isValid) {
    return res.status(401).json({ error: 'Invalid password. Please check your credentials.' });
  }

  const profile = getFullUserProfile(user.id);
  if (!profile) {
    return res.status(500).json({ error: 'Failed to construct user session.' });
  }

  if (profile.role === 'FACULTY' && profile.approval_status === 'PENDING') {
    return res.status(403).json({
      error: 'Your faculty account is pending Super Admin review. You will be able to log in once approved.',
      approval_status: 'PENDING',
    });
  }

  if (profile.role === 'FACULTY' && profile.approval_status === 'REJECTED') {
    return res.status(403).json({
      error: 'Your faculty access request was rejected. Please contact the college Super Admin.',
      approval_status: 'REJECTED',
    });
  }

  const token = generateToken(profile);
  return res.json({
    token,
    user: profile,
  });
});

// POST /api/auth/register (Students)
router.post('/auth/register', (req: Request, res: Response) => {
  const {
    full_name,
    roll_number,
    email,
    password,
    confirm_password,
    department,
    year,
    section,
  } = req.body;

  if (!full_name || !roll_number || !email || !password || !confirm_password || !department || !year || !section) {
    return res.status(400).json({ error: 'All registration fields are required.' });
  }

  const cleanEmail = email.trim().toLowerCase();
  const cleanRoll = roll_number.trim().toUpperCase();

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(cleanEmail)) {
    return res.status(400).json({ error: 'Please provide a valid college email address.' });
  }

  if (password !== confirm_password) {
    return res.status(400).json({ error: 'Password and Confirm Password do not match.' });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
  }

  const allowedDepts = ['CSE', 'ECE', 'EEE', 'MECH', 'CIVIL'];
  if (!allowedDepts.includes(department.trim().toUpperCase())) {
    return res.status(400).json({ error: `Department must be one of: ${allowedDepts.join(', ')}` });
  }

  // Check unique email
  const existingEmail = db.prepare('SELECT id FROM users WHERE email = ?').get(cleanEmail);
  if (existingEmail) {
    return res.status(400).json({ error: 'An account with this email already exists. Please log in.' });
  }

  // Check unique roll number
  const existingRoll = db.prepare('SELECT id FROM students WHERE roll_number = ?').get(cleanRoll);
  if (existingRoll) {
    return res.status(400).json({ error: 'A student record with this roll number already exists.' });
  }

  const salt = bcrypt.genSaltSync(10);
  const passwordHash = bcrypt.hashSync(password, salt);
  const now = new Date().toISOString();

  const insertUser = db.prepare(`
    INSERT INTO users (full_name, email, username, password_hash, role, created_at)
    VALUES (?, ?, ?, ?, 'STUDENT', ?)
  `);

  const insertStudent = db.prepare(`
    INSERT INTO students (user_id, roll_number, department, year, section)
    VALUES (?, ?, ?, ?, ?)
  `);

  const registerTx = db.transaction(() => {
    const userRes = insertUser.run(full_name.trim(), cleanEmail, cleanRoll.toLowerCase(), passwordHash, now);
    const userId = userRes.lastInsertRowid as number;

    insertStudent.run(userId, cleanRoll, department.trim().toUpperCase(), year.trim(), section.trim().toUpperCase());
    return userId;
  });

  try {
    const newUserId = registerTx();
    const profile = getFullUserProfile(newUserId);
    if (!profile) throw new Error('Failed to retrieve new user profile');

    const token = generateToken(profile);
    return res.status(201).json({
      message: 'Student registration successful!',
      token,
      user: profile,
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'Registration failed: ' + err.message });
  }
});

// POST /api/faculty/request (Faculty Access Request)
router.post('/faculty/request', (req: Request, res: Response) => {
  const {
    full_name,
    faculty_id,
    email,
    department,
    password,
    confirm_password,
  } = req.body;

  if (!full_name || !faculty_id || !email || !department || !password || !confirm_password) {
    return res.status(400).json({ error: 'All fields are required for faculty access request.' });
  }

  const cleanEmail = email.trim().toLowerCase();
  const cleanFacultyId = faculty_id.trim().toUpperCase();

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(cleanEmail)) {
    return res.status(400).json({ error: 'Please provide a valid official college email.' });
  }

  if (password !== confirm_password) {
    return res.status(400).json({ error: 'Password and Confirm Password do not match.' });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
  }

  const allowedDepts = ['CSE', 'ECE', 'EEE', 'MECH', 'CIVIL'];
  if (!allowedDepts.includes(department.trim().toUpperCase())) {
    return res.status(400).json({ error: `Department must be one of: ${allowedDepts.join(', ')}` });
  }

  const existingEmail = db.prepare('SELECT id FROM users WHERE email = ?').get(cleanEmail);
  if (existingEmail) {
    return res.status(400).json({ error: 'An account with this email already exists.' });
  }

  const existingFacId = db.prepare('SELECT id FROM faculty WHERE faculty_id = ?').get(cleanFacultyId);
  if (existingFacId) {
    return res.status(400).json({ error: 'A faculty account with this Employee/Faculty ID already exists.' });
  }

  const salt = bcrypt.genSaltSync(10);
  const passwordHash = bcrypt.hashSync(password, salt);
  const now = new Date().toISOString();

  const insertUser = db.prepare(`
    INSERT INTO users (full_name, email, username, password_hash, role, created_at)
    VALUES (?, ?, ?, ?, 'FACULTY', ?)
  `);

  const insertFaculty = db.prepare(`
    INSERT INTO faculty (user_id, faculty_id, department, approval_status, created_at)
    VALUES (?, ?, ?, 'PENDING', ?)
  `);

  const facultyRequestTx = db.transaction(() => {
    const userRes = insertUser.run(full_name.trim(), cleanEmail, cleanFacultyId.toLowerCase(), passwordHash, now);
    const userId = userRes.lastInsertRowid as number;

    insertFaculty.run(userId, cleanFacultyId, department.trim().toUpperCase(), now);
    return userId;
  });

  try {
    facultyRequestTx();
    return res.status(201).json({
      message: 'Faculty access request submitted successfully. It is now PENDING approval by the Super Administrator.',
      status: 'PENDING',
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to submit faculty request: ' + err.message });
  }
});

// GET /api/auth/me
router.get('/auth/me', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  return res.json({ user: req.user });
});

// ==========================================
// 2. STUDENT ROUTES
// ==========================================

// GET /api/students/profile
router.get('/students/profile', authenticateToken, requireStudent, (req: AuthenticatedRequest, res: Response) => {
  const student = db.prepare(`
    SELECT s.id as student_id, s.roll_number, s.department, s.year, s.section,
           u.id as user_id, u.full_name, u.email, u.created_at
    FROM students s
    JOIN users u ON s.user_id = u.id
    WHERE u.id = ?
  `).get(req.user!.id);

  if (!student) {
    return res.status(404).json({ error: 'Student profile not found.' });
  }

  // Calculate statistics for this student's submissions
  const stats = db.prepare(`
    SELECT
      COUNT(*) as total_submitted,
      SUM(CASE WHEN verification_status = 'PENDING' THEN 1 ELSE 0 END) as pending_count,
      SUM(CASE WHEN verification_status = 'VERIFIED' THEN 1 ELSE 0 END) as verified_count,
      SUM(CASE WHEN verification_status = 'UNVERIFIED' THEN 1 ELSE 0 END) as unverified_count
    FROM certificates
    WHERE uploaded_by_user_id = ?
  `).get(req.user!.id) as any;

  return res.json({
    profile: student,
    stats: {
      total_submitted: stats.total_submitted || 0,
      pending_count: stats.pending_count || 0,
      verified_count: stats.verified_count || 0,
      unverified_count: stats.unverified_count || 0,
    },
  });
});

// GET /api/students/submissions
router.get('/students/submissions', authenticateToken, requireStudent, (req: AuthenticatedRequest, res: Response) => {
  // Show certificates submitted through the logged-in student's account
  const certificates = db.prepare(`
    SELECT
      c.id,
      c.certificate_name,
      c.certificate_type,
      c.organization,
      c.issue_date,
      c.file_name,
      c.file_size,
      c.verification_status,
      c.verification_notes,
      c.verified_at,
      c.uploaded_at,
      s.roll_number as student_roll_number,
      st_u.full_name as student_name,
      s.department as student_department,
      s.year as student_year,
      s.section as student_section,
      up_u.full_name as uploaded_by_name,
      v_u.full_name as verified_by_name
    FROM certificates c
    JOIN students s ON c.student_id = s.id
    LEFT JOIN users st_u ON s.user_id = st_u.id
    JOIN users up_u ON c.uploaded_by_user_id = up_u.id
    LEFT JOIN users v_u ON c.verified_by = v_u.id
    WHERE c.uploaded_by_user_id = ? OR s.user_id = ?
    ORDER BY c.uploaded_at DESC
  `).all(req.user!.id, req.user!.id);

  return res.json({ certificates });
});

// ==========================================
// 3. CERTIFICATE UPLOAD & MANAGEMENT
// ==========================================

// POST /api/certificates/upload
router.post('/certificates/upload', authenticateToken, requireStudent, handleUpload, (req: AuthenticatedRequest, res: Response) => {
  try {
    const file = req.file;
    if (!file) {
      return res.status(400).json({ error: 'Certificate file is required.' });
    }

    const {
      upload_type, // 'MY_CERTIFICATE' or 'OTHER_CERTIFICATE'
      student_name,
      roll_number,
      department,
      year,
      section,
      certificate_name,
      certificate_type,
      organization,
      issue_date,
      description,
    } = req.body;

    if (!certificate_name || !certificate_type || !organization || !issue_date) {
      if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
      return res.status(400).json({ error: 'Certificate Name, Type, Organization, and Issue Date are required.' });
    }

    let targetStudentId: number;
    const cleanDept = (department || '').trim().toUpperCase();

    if (upload_type === 'MY_CERTIFICATE') {
      if (!req.user!.student_record_id) {
        if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
        return res.status(400).json({ error: 'Student record not found for logged in user.' });
      }
      targetStudentId = req.user!.student_record_id;
    } else {
      // OTHER CLASS MEMBER'S CERTIFICATE
      if (!student_name || !roll_number || !department || !year || !section) {
        if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
        return res.status(400).json({ error: 'Classmate Name, Roll Number, Department, Year, and Section are required.' });
      }

      const cleanRoll = roll_number.trim().toUpperCase();

      // Check if student exists in DB
      let existingStudent = db.prepare(`
        SELECT s.id, u.full_name
        FROM students s
        LEFT JOIN users u ON s.user_id = u.id
        WHERE s.roll_number = ?
      `).get(cleanRoll) as any;

      if (!existingStudent) {
        // Create an institutional student placeholder entry for this classmate
        const placeholderUser = db.prepare(`
          INSERT INTO users (full_name, email, username, password_hash, role, created_at)
          VALUES (?, ?, ?, 'PLACEHOLDER_PASS', 'STUDENT', ?)
        `).run(
          student_name.trim(),
          `${cleanRoll.toLowerCase()}@college.edu`,
          cleanRoll.toLowerCase(),
          new Date().toISOString()
        );
        const newUserId = placeholderUser.lastInsertRowid as number;

        const insertStmt = db.prepare(`
          INSERT INTO students (user_id, roll_number, department, year, section)
          VALUES (?, ?, ?, ?, ?)
        `);
        const resInsert = insertStmt.run(newUserId, cleanRoll, cleanDept, year.trim(), section.trim().toUpperCase());
        targetStudentId = resInsert.lastInsertRowid as number;
      } else {
        targetStudentId = existingStudent.id;
      }
    }

    const now = new Date().toISOString();
    const insertCert = db.prepare(`
      INSERT INTO certificates (
        student_id,
        uploaded_by_user_id,
        certificate_name,
        certificate_type,
        organization,
        issue_date,
        file_name,
        file_path,
        file_mime,
        file_size,
        description,
        verification_status,
        uploaded_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'PENDING', ?)
    `);

    const result = insertCert.run(
      targetStudentId,
      req.user!.id, // Uploader is logged-in student
      certificate_name.trim(),
      certificate_type.trim(),
      organization.trim(),
      issue_date.trim(),
      file.originalname,
      file.path,
      file.mimetype,
      file.size,
      description ? description.trim() : null,
      now
    );

    return res.status(201).json({
      message: 'Certificate uploaded successfully. Verification status is PENDING review by department faculty.',
      certificate_id: result.lastInsertRowid,
      status: 'PENDING',
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to upload certificate: ' + err.message });
  }
});

// GET /api/certificates/:id
router.get('/certificates/:id', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const certId = parseInt(req.params.id, 10);
  if (isNaN(certId)) {
    return res.status(400).json({ error: 'Invalid certificate ID.' });
  }

  const cert = db.prepare(`
    SELECT
      c.*,
      s.roll_number as student_roll_number,
      COALESCE(st_u.full_name, 'Classmate') as student_name,
      s.department as student_department,
      s.year as student_year,
      s.section as student_section,
      up_u.full_name as uploaded_by_name,
      up_u.email as uploaded_by_email,
      v_u.full_name as verified_by_name
    FROM certificates c
    JOIN students s ON c.student_id = s.id
    LEFT JOIN users st_u ON s.user_id = st_u.id
    JOIN users up_u ON c.uploaded_by_user_id = up_u.id
    LEFT JOIN users v_u ON c.verified_by = v_u.id
    WHERE c.id = ?
  `).get(certId) as any;

  if (!cert) {
    return res.status(404).json({ error: 'Certificate not found.' });
  }

  // Authorization checks
  if (req.user!.role === 'STUDENT') {
    if (cert.uploaded_by_user_id !== req.user!.id && cert.student_id !== req.user!.student_record_id) {
      return res.status(403).json({ error: 'Forbidden: You can only view your own certificate submissions.' });
    }
  } else if (req.user!.role === 'FACULTY') {
    if (req.user!.approval_status !== 'APPROVED') {
      return res.status(403).json({ error: 'Faculty account not approved.' });
    }
    // Department Security check
    if (cert.student_department !== req.user!.department) {
      return res.status(403).json({ error: `Forbidden: You can only access certificates in the ${req.user!.department} department.` });
    }
  }

  return res.json({ certificate: cert });
});

// GET /api/certificates/:id/file (View / Download preview)
router.get('/certificates/:id/file', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const certId = parseInt(req.params.id, 10);
  if (isNaN(certId)) {
    return res.status(400).json({ error: 'Invalid certificate ID.' });
  }

  const cert = db.prepare(`
    SELECT c.file_path, c.file_name, c.file_mime, c.uploaded_by_user_id, c.student_id, s.department as student_department
    FROM certificates c
    JOIN students s ON c.student_id = s.id
    WHERE c.id = ?
  `).get(certId) as any;

  if (!cert) {
    return res.status(404).json({ error: 'Certificate record not found.' });
  }

  // Authorization check
  if (req.user!.role === 'STUDENT') {
    if (cert.uploaded_by_user_id !== req.user!.id && cert.student_id !== req.user!.student_record_id) {
      return res.status(403).json({ error: 'Forbidden: Access denied to this certificate file.' });
    }
  } else if (req.user!.role === 'FACULTY') {
    if (req.user!.approval_status !== 'APPROVED') {
      return res.status(403).json({ error: 'Faculty account not approved.' });
    }
    if (cert.student_department !== req.user!.department) {
      return res.status(403).json({ error: `Forbidden: File belongs to another department (${cert.student_department}).` });
    }
  }

  if (!fs.existsSync(cert.file_path)) {
    return res.status(404).json({ error: 'Certificate file not found on disk.' });
  }

  const isDownload = req.query.download === 'true';
  const disposition = isDownload ? 'attachment' : 'inline';

  res.setHeader('Content-Type', cert.file_mime || 'application/octet-stream');
  res.setHeader('Content-Disposition', `${disposition}; filename="${encodeURIComponent(cert.file_name)}"`);
  return res.sendFile(path.resolve(cert.file_path));
});

// POST /api/certificates/:id/verify
router.post('/certificates/:id/verify', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  if (req.user!.role !== 'FACULTY' && req.user!.role !== 'SUPER_ADMIN') {
    return res.status(403).json({ error: 'Forbidden: Only authorized Faculty or Super Admin can verify certificates.' });
  }

  if (req.user!.role === 'FACULTY' && req.user!.approval_status !== 'APPROVED') {
    return res.status(403).json({ error: 'Faculty account not approved.' });
  }

  const certId = parseInt(req.params.id, 10);
  const { status, notes } = req.body;

  if (!['VERIFIED', 'UNVERIFIED'].includes(status)) {
    return res.status(400).json({ error: "Status must be either 'VERIFIED' or 'UNVERIFIED'." });
  }

  const cert = db.prepare(`
    SELECT c.*, s.department as student_department
    FROM certificates c
    JOIN students s ON c.student_id = s.id
    WHERE c.id = ?
  `).get(certId) as any;

  if (!cert) {
    return res.status(404).json({ error: 'Certificate not found.' });
  }

  // Department security check for faculty
  if (req.user!.role === 'FACULTY' && cert.student_department !== req.user!.department) {
    return res.status(403).json({
      error: `Security Violation: Faculty from ${req.user!.department} cannot verify certificates from ${cert.student_department}.`,
    });
  }

  const now = new Date().toISOString();
  db.prepare(`
    UPDATE certificates
    SET verification_status = ?,
        verification_notes = ?,
        verified_by = ?,
        verified_at = ?
    WHERE id = ?
  `).run(status, notes ? notes.trim() : null, req.user!.id, now, certId);

  return res.json({
    message: `Certificate status updated to ${status}.`,
    verification_status: status,
    verified_by: req.user!.full_name,
    verified_at: now,
  });
});

// ==========================================
// 4. FACULTY ROUTES (STRICT DEPARTMENT ISOLATION)
// ==========================================

// GET /api/faculty/dashboard
router.get('/faculty/dashboard', authenticateToken, requireFaculty, (req: AuthenticatedRequest, res: Response) => {
  const dept = req.user!.department!;

  const stats = db.prepare(`
    SELECT
      COUNT(c.id) as total_certificates,
      SUM(CASE WHEN c.verification_status = 'PENDING' THEN 1 ELSE 0 END) as pending_certificates,
      SUM(CASE WHEN c.verification_status = 'VERIFIED' THEN 1 ELSE 0 END) as verified_certificates,
      SUM(CASE WHEN c.verification_status = 'UNVERIFIED' THEN 1 ELSE 0 END) as unverified_certificates
    FROM certificates c
    JOIN students s ON c.student_id = s.id
    WHERE s.department = ?
  `).get(dept) as any;

  const studentCount = db.prepare(`
    SELECT COUNT(*) as total_students
    FROM students
    WHERE department = ?
  `).get(dept) as any;

  // Recent pending submissions in this department
  const recentPending = db.prepare(`
    SELECT
      c.id,
      c.certificate_name,
      c.certificate_type,
      c.organization,
      c.issue_date,
      c.uploaded_at,
      s.roll_number as student_roll_number,
      COALESCE(st_u.full_name, 'Classmate') as student_name,
      s.year,
      s.section,
      up_u.full_name as uploaded_by_name
    FROM certificates c
    JOIN students s ON c.student_id = s.id
    LEFT JOIN users st_u ON s.user_id = st_u.id
    JOIN users up_u ON c.uploaded_by_user_id = up_u.id
    WHERE s.department = ? AND c.verification_status = 'PENDING'
    ORDER BY c.uploaded_at DESC
    LIMIT 5
  `).all(dept);

  return res.json({
    department: dept,
    stats: {
      total_certificates: stats.total_certificates || 0,
      pending_certificates: stats.pending_certificates || 0,
      verified_certificates: stats.verified_certificates || 0,
      unverified_certificates: stats.unverified_certificates || 0,
      total_students: studentCount.total_students || 0,
    },
    recent_pending: recentPending,
  });
});

// GET /api/faculty/certificates (with search & filters - strictly restricted to faculty's department)
router.get('/faculty/certificates', authenticateToken, requireFaculty, (req: AuthenticatedRequest, res: Response) => {
  // CRITICAL: Even if the user requests ?department=ECE, the backend MUST ALWAYS enforce the faculty's own department!
  const dept = req.user!.department!;

  const { search, year, section, certificate_type, verification_status, date_from, date_to } = req.query;

  let query = `
    SELECT
      c.id,
      c.certificate_name,
      c.certificate_type,
      c.organization,
      c.issue_date,
      c.file_name,
      c.file_size,
      c.verification_status,
      c.verification_notes,
      c.verified_at,
      c.uploaded_at,
      s.roll_number as student_roll_number,
      COALESCE(st_u.full_name, 'Classmate') as student_name,
      s.department as student_department,
      s.year as student_year,
      s.section as student_section,
      up_u.full_name as uploaded_by_name,
      v_u.full_name as verified_by_name
    FROM certificates c
    JOIN students s ON c.student_id = s.id
    LEFT JOIN users st_u ON s.user_id = st_u.id
    JOIN users up_u ON c.uploaded_by_user_id = up_u.id
    LEFT JOIN users v_u ON c.verified_by = v_u.id
    WHERE s.department = ?
  `;

  const params: any[] = [dept];

  if (search) {
    const s = `%${String(search).trim()}%`;
    query += ` AND (
      COALESCE(st_u.full_name, '') LIKE ? OR
      s.roll_number LIKE ? OR
      c.certificate_name LIKE ? OR
      c.organization LIKE ?
    )`;
    params.push(s, s, s, s);
  }

  if (year) {
    query += ' AND s.year = ?';
    params.push(String(year));
  }

  if (section) {
    query += ' AND s.section = ?';
    params.push(String(section));
  }

  if (certificate_type) {
    query += ' AND c.certificate_type = ?';
    params.push(String(certificate_type));
  }

  if (verification_status) {
    query += ' AND c.verification_status = ?';
    params.push(String(verification_status));
  }

  if (date_from) {
    query += ' AND c.issue_date >= ?';
    params.push(String(date_from));
  }

  if (date_to) {
    query += ' AND c.issue_date <= ?';
    params.push(String(date_to));
  }

  query += ' ORDER BY c.uploaded_at DESC';

  const certificates = db.prepare(query).all(...params);
  return res.json({ department: dept, certificates });
});

// GET /api/faculty/students
router.get('/faculty/students', authenticateToken, requireFaculty, (req: AuthenticatedRequest, res: Response) => {
  const dept = req.user!.department!;
  const { search, year, section } = req.query;

  let query = `
    SELECT
      s.id,
      s.roll_number,
      s.department,
      s.year,
      s.section,
      COALESCE(u.full_name, 'Unregistered / Classmate') as student_name,
      u.email,
      COUNT(c.id) as total_certificates,
      SUM(CASE WHEN c.verification_status = 'VERIFIED' THEN 1 ELSE 0 END) as verified_count
    FROM students s
    LEFT JOIN users u ON s.user_id = u.id
    LEFT JOIN certificates c ON s.id = c.student_id
    WHERE s.department = ?
  `;

  const params: any[] = [dept];

  if (search) {
    const s = `%${String(search).trim()}%`;
    query += ' AND (COALESCE(u.full_name, "") LIKE ? OR s.roll_number LIKE ?)';
    params.push(s, s);
  }

  if (year) {
    query += ' AND s.year = ?';
    params.push(String(year));
  }

  if (section) {
    query += ' AND s.section = ?';
    params.push(String(section));
  }

  query += ' GROUP BY s.id ORDER BY s.roll_number ASC';

  const students = db.prepare(query).all(...params);
  return res.json({ department: dept, students });
});

// GET /api/faculty/export (Excel export for faculty - strictly limited to their own department)
router.get('/faculty/export', authenticateToken, requireFaculty, async (req: AuthenticatedRequest, res: Response) => {
  const dept = req.user!.department!;

  try {
    const certificates = db.prepare(`
      SELECT
        c.id,
        COALESCE(st_u.full_name, 'Classmate') as student_name,
        s.roll_number,
        s.department,
        s.year,
        s.section,
        c.certificate_name,
        c.certificate_type,
        c.organization,
        c.issue_date,
        up_u.full_name as uploaded_by,
        c.uploaded_at,
        c.verification_status,
        c.verification_notes,
        COALESCE(v_u.full_name, 'N/A') as verified_by,
        c.verified_at,
        c.file_name
      FROM certificates c
      JOIN students s ON c.student_id = s.id
      LEFT JOIN users st_u ON s.user_id = st_u.id
      JOIN users up_u ON c.uploaded_by_user_id = up_u.id
      LEFT JOIN users v_u ON c.verified_by = v_u.id
      WHERE s.department = ?
      ORDER BY c.id ASC
    `).all(dept) as any[];

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'CERTITRACK System';
    workbook.created = new Date();

    const sheet = workbook.addWorksheet(`${dept} Certificates`);

    sheet.columns = [
      { header: 'Certificate ID', key: 'id', width: 14 },
      { header: 'Student Name', key: 'student_name', width: 22 },
      { header: 'Roll Number', key: 'roll_number', width: 16 },
      { header: 'Department', key: 'department', width: 14 },
      { header: 'Year', key: 'year', width: 12 },
      { header: 'Section', key: 'section', width: 10 },
      { header: 'Certificate Name', key: 'certificate_name', width: 32 },
      { header: 'Certificate Type', key: 'certificate_type', width: 18 },
      { header: 'Organization / Issuing Authority', key: 'organization', width: 30 },
      { header: 'Issue Date', key: 'issue_date', width: 14 },
      { header: 'Uploaded By', key: 'uploaded_by', width: 22 },
      { header: 'Uploaded On', key: 'uploaded_at', width: 20 },
      { header: 'Verification Status', key: 'verification_status', width: 18 },
      { header: 'Verification Notes', key: 'verification_notes', width: 30 },
      { header: 'Verified By', key: 'verified_by', width: 22 },
      { header: 'Verified At', key: 'verified_at', width: 20 },
      { header: 'Certificate File Name', key: 'file_name', width: 26 },
    ];

    // Style the header row in dark pink (#9D174D) and bold white text
    const headerRow = sheet.getRow(1);
    headerRow.height = 28;
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' }, name: 'Calibri', size: 11 };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF9D174D' },
    };
    headerRow.alignment = { vertical: 'middle', horizontal: 'center' };

    certificates.forEach((cert) => {
      const row = sheet.addRow({
        id: cert.id,
        student_name: cert.student_name,
        roll_number: cert.roll_number,
        department: cert.department,
        year: cert.year,
        section: cert.section,
        certificate_name: cert.certificate_name,
        certificate_type: cert.certificate_type,
        organization: cert.organization,
        issue_date: cert.issue_date,
        uploaded_by: cert.uploaded_by,
        uploaded_at: cert.uploaded_at ? cert.uploaded_at.split('T')[0] : '',
        verification_status: cert.verification_status,
        verification_notes: cert.verification_notes || '',
        verified_by: cert.verified_by,
        verified_at: cert.verified_at ? cert.verified_at.split('T')[0] : 'N/A',
        file_name: cert.file_name,
      });

      row.alignment = { vertical: 'middle' };
    });

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="CERTITRACK_${dept}_Certificates_${Date.now()}.xlsx"`
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to generate Excel export: ' + err.message });
  }
});

// ==========================================
// 5. SUPER ADMIN ROUTES (CROSS-DEPARTMENT ACCESS)
// ==========================================

// GET /api/admin/dashboard
router.get('/admin/dashboard', authenticateToken, requireSuperAdmin, (req: AuthenticatedRequest, res: Response) => {
  const totalStudents = (db.prepare('SELECT COUNT(*) as cnt FROM students').get() as any).cnt;
  const totalFaculty = (db.prepare("SELECT COUNT(*) as cnt FROM faculty WHERE approval_status = 'APPROVED'").get() as any).cnt;
  const pendingFacultyRequests = (db.prepare("SELECT COUNT(*) as cnt FROM faculty WHERE approval_status = 'PENDING'").get() as any).cnt;
  const totalCertificates = (db.prepare('SELECT COUNT(*) as cnt FROM certificates').get() as any).cnt;
  const pendingCertificates = (db.prepare("SELECT COUNT(*) as cnt FROM certificates WHERE verification_status = 'PENDING'").get() as any).cnt;
  const verifiedCertificates = (db.prepare("SELECT COUNT(*) as cnt FROM certificates WHERE verification_status = 'VERIFIED'").get() as any).cnt;
  const unverifiedCertificates = (db.prepare("SELECT COUNT(*) as cnt FROM certificates WHERE verification_status = 'UNVERIFIED'").get() as any).cnt;

  // Department breakdown
  const departmentBreakdown = db.prepare(`
    SELECT
      s.department,
      COUNT(DISTINCT s.id) as student_count,
      COUNT(c.id) as certificate_count,
      SUM(CASE WHEN c.verification_status = 'VERIFIED' THEN 1 ELSE 0 END) as verified_count,
      SUM(CASE WHEN c.verification_status = 'PENDING' THEN 1 ELSE 0 END) as pending_count
    FROM students s
    LEFT JOIN certificates c ON s.id = c.student_id
    GROUP BY s.department
  `).all();

  return res.json({
    stats: {
      total_students: totalStudents,
      total_faculty: totalFaculty,
      pending_faculty_requests: pendingFacultyRequests,
      total_certificates: totalCertificates,
      pending_certificates: pendingCertificates,
      verified_certificates: verifiedCertificates,
      unverified_certificates: unverifiedCertificates,
    },
    departments: departmentBreakdown,
  });
});

// GET /api/admin/faculty-requests
router.get('/admin/faculty-requests', authenticateToken, requireSuperAdmin, (req: AuthenticatedRequest, res: Response) => {
  const requests = db.prepare(`
    SELECT
      f.id,
      f.id as faculty_record_id,
      f.faculty_id,
      f.department,
      f.approval_status,
      f.created_at,
      u.id as user_id,
      u.full_name,
      u.email
    FROM faculty f
    JOIN users u ON f.user_id = u.id
    WHERE f.approval_status = 'PENDING'
    ORDER BY f.created_at DESC
  `).all();

  return res.json({ requests });
});

// POST /api/admin/faculty-requests/:id/approve
router.post('/admin/faculty-requests/:id/approve', authenticateToken, requireSuperAdmin, (req: AuthenticatedRequest, res: Response) => {
  const facId = parseInt(req.params.id, 10);
  const now = new Date().toISOString();

  const fac = db.prepare('SELECT id, user_id FROM faculty WHERE id = ?').get(facId) as any;
  if (!fac) {
    return res.status(404).json({ error: 'Faculty request not found.' });
  }

  db.prepare(`
    UPDATE faculty
    SET approval_status = 'APPROVED',
        approved_by = ?,
        approved_at = ?
    WHERE id = ?
  `).run(req.user!.id, now, facId);

  return res.json({ message: 'Faculty request APPROVED successfully.' });
});

// POST /api/admin/faculty-requests/:id/reject
router.post('/admin/faculty-requests/:id/reject', authenticateToken, requireSuperAdmin, (req: AuthenticatedRequest, res: Response) => {
  const facId = parseInt(req.params.id, 10);
  const fac = db.prepare('SELECT id, user_id FROM faculty WHERE id = ?').get(facId) as any;
  if (!fac) {
    return res.status(404).json({ error: 'Faculty request not found.' });
  }

  db.prepare(`
    UPDATE faculty
    SET approval_status = 'REJECTED'
    WHERE id = ?
  `).run(facId);

  return res.json({ message: 'Faculty request REJECTED.' });
});

// GET /api/admin/faculty
router.get('/admin/faculty', authenticateToken, requireSuperAdmin, (req: AuthenticatedRequest, res: Response) => {
  const faculty = db.prepare(`
    SELECT
      f.id,
      f.faculty_id,
      f.department,
      f.approval_status,
      f.created_at,
      f.approved_at,
      u.full_name,
      u.email,
      app_u.full_name as approved_by_name
    FROM faculty f
    JOIN users u ON f.user_id = u.id
    LEFT JOIN users app_u ON f.approved_by = app_u.id
    ORDER BY f.department ASC, f.created_at DESC
  `).all();

  return res.json({ faculty });
});

// GET /api/admin/students
router.get('/admin/students', authenticateToken, requireSuperAdmin, (req: AuthenticatedRequest, res: Response) => {
  const { department, search, year, section } = req.query;

  let query = `
    SELECT
      s.id,
      s.roll_number,
      s.department,
      s.year,
      s.section,
      COALESCE(u.full_name, 'Unregistered / Classmate') as student_name,
      u.email,
      COUNT(c.id) as total_certificates,
      SUM(CASE WHEN c.verification_status = 'VERIFIED' THEN 1 ELSE 0 END) as verified_count
    FROM students s
    LEFT JOIN users u ON s.user_id = u.id
    LEFT JOIN certificates c ON s.id = c.student_id
    WHERE 1=1
  `;

  const params: any[] = [];

  if (department && department !== 'ALL') {
    query += ' AND s.department = ?';
    params.push(String(department));
  }

  if (search) {
    const s = `%${String(search).trim()}%`;
    query += ' AND (COALESCE(u.full_name, "") LIKE ? OR s.roll_number LIKE ?)';
    params.push(s, s);
  }

  if (year) {
    query += ' AND s.year = ?';
    params.push(String(year));
  }

  if (section) {
    query += ' AND s.section = ?';
    params.push(String(section));
  }

  query += ' GROUP BY s.id ORDER BY s.department ASC, s.roll_number ASC';

  const students = db.prepare(query).all(...params);
  return res.json({ students });
});

// GET /api/admin/certificates
router.get('/admin/certificates', authenticateToken, requireSuperAdmin, (req: AuthenticatedRequest, res: Response) => {
  const { department, search, year, section, certificate_type, verification_status, date_from, date_to } = req.query;

  let query = `
    SELECT
      c.id,
      c.certificate_name,
      c.certificate_type,
      c.organization,
      c.issue_date,
      c.file_name,
      c.file_size,
      c.verification_status,
      c.verification_notes,
      c.verified_at,
      c.uploaded_at,
      s.roll_number as student_roll_number,
      COALESCE(st_u.full_name, 'Classmate') as student_name,
      s.department as student_department,
      s.year as student_year,
      s.section as student_section,
      up_u.full_name as uploaded_by_name,
      v_u.full_name as verified_by_name
    FROM certificates c
    JOIN students s ON c.student_id = s.id
    LEFT JOIN users st_u ON s.user_id = st_u.id
    JOIN users up_u ON c.uploaded_by_user_id = up_u.id
    LEFT JOIN users v_u ON c.verified_by = v_u.id
    WHERE 1=1
  `;

  const params: any[] = [];

  if (department && department !== 'ALL') {
    query += ' AND s.department = ?';
    params.push(String(department));
  }

  if (search) {
    const s = `%${String(search).trim()}%`;
    query += ` AND (
      COALESCE(st_u.full_name, '') LIKE ? OR
      s.roll_number LIKE ? OR
      c.certificate_name LIKE ? OR
      c.organization LIKE ?
    )`;
    params.push(s, s, s, s);
  }

  if (year) {
    query += ' AND s.year = ?';
    params.push(String(year));
  }

  if (section) {
    query += ' AND s.section = ?';
    params.push(String(section));
  }

  if (certificate_type) {
    query += ' AND c.certificate_type = ?';
    params.push(String(certificate_type));
  }

  if (verification_status) {
    query += ' AND c.verification_status = ?';
    params.push(String(verification_status));
  }

  if (date_from) {
    query += ' AND c.issue_date >= ?';
    params.push(String(date_from));
  }

  if (date_to) {
    query += ' AND c.issue_date <= ?';
    params.push(String(date_to));
  }

  query += ' ORDER BY c.uploaded_at DESC';

  const certificates = db.prepare(query).all(...params);
  return res.json({ certificates });
});

// GET /api/admin/export (Excel export: all departments or filtered by specific department)
router.get('/admin/export', authenticateToken, requireSuperAdmin, async (req: AuthenticatedRequest, res: Response) => {
  const { department } = req.query;
  const isSpecificDept = department && department !== 'ALL';

  try {
    let query = `
      SELECT
        c.id,
        COALESCE(st_u.full_name, 'Classmate') as student_name,
        s.roll_number,
        s.department,
        s.year,
        s.section,
        c.certificate_name,
        c.certificate_type,
        c.organization,
        c.issue_date,
        up_u.full_name as uploaded_by,
        c.uploaded_at,
        c.verification_status,
        c.verification_notes,
        COALESCE(v_u.full_name, 'N/A') as verified_by,
        c.verified_at,
        c.file_name
      FROM certificates c
      JOIN students s ON c.student_id = s.id
      LEFT JOIN users st_u ON s.user_id = st_u.id
      JOIN users up_u ON c.uploaded_by_user_id = up_u.id
      LEFT JOIN users v_u ON c.verified_by = v_u.id
    `;

    const params: any[] = [];
    if (isSpecificDept) {
      query += ' WHERE s.department = ?';
      params.push(String(department));
    }
    query += ' ORDER BY s.department ASC, c.id ASC';

    const certificates = db.prepare(query).all(...params) as any[];

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'CERTITRACK System (Super Admin)';
    workbook.created = new Date();

    const sheetName = isSpecificDept ? `${department} Certificates` : 'All Certificates';
    const sheet = workbook.addWorksheet(sheetName);

    sheet.columns = [
      { header: 'Certificate ID', key: 'id', width: 14 },
      { header: 'Student Name', key: 'student_name', width: 22 },
      { header: 'Roll Number', key: 'roll_number', width: 16 },
      { header: 'Department', key: 'department', width: 14 },
      { header: 'Year', key: 'year', width: 12 },
      { header: 'Section', key: 'section', width: 10 },
      { header: 'Certificate Name', key: 'certificate_name', width: 32 },
      { header: 'Certificate Type', key: 'certificate_type', width: 18 },
      { header: 'Organization / Issuing Authority', key: 'organization', width: 30 },
      { header: 'Issue Date', key: 'issue_date', width: 14 },
      { header: 'Uploaded By', key: 'uploaded_by', width: 22 },
      { header: 'Uploaded On', key: 'uploaded_at', width: 20 },
      { header: 'Verification Status', key: 'verification_status', width: 18 },
      { header: 'Verification Notes', key: 'verification_notes', width: 30 },
      { header: 'Verified By', key: 'verified_by', width: 22 },
      { header: 'Verified At', key: 'verified_at', width: 20 },
      { header: 'Certificate File Name', key: 'file_name', width: 26 },
    ];

    const headerRow = sheet.getRow(1);
    headerRow.height = 28;
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' }, name: 'Calibri', size: 11 };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF9D174D' }, // Academic Dark Pink
    };
    headerRow.alignment = { vertical: 'middle', horizontal: 'center' };

    certificates.forEach((cert) => {
      const row = sheet.addRow({
        id: cert.id,
        student_name: cert.student_name,
        roll_number: cert.roll_number,
        department: cert.department,
        year: cert.year,
        section: cert.section,
        certificate_name: cert.certificate_name,
        certificate_type: cert.certificate_type,
        organization: cert.organization,
        issue_date: cert.issue_date,
        uploaded_by: cert.uploaded_by,
        uploaded_at: cert.uploaded_at ? cert.uploaded_at.split('T')[0] : '',
        verification_status: cert.verification_status,
        verification_notes: cert.verification_notes || '',
        verified_by: cert.verified_by,
        verified_at: cert.verified_at ? cert.verified_at.split('T')[0] : 'N/A',
        file_name: cert.file_name,
      });
      row.alignment = { vertical: 'middle' };
    });

    const filePrefix = isSpecificDept ? `CERTITRACK_${department}` : 'CERTITRACK_ALL_DEPARTMENTS';
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${filePrefix}_${Date.now()}.xlsx"`
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to generate Excel export: ' + err.message });
  }
});

export default router;
