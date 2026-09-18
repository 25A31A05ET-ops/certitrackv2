import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import bcrypt from 'bcryptjs';

const DB_PATH = path.join(process.cwd(), 'certitrack.db');
const UPLOADS_DIR = path.join(process.cwd(), 'uploads');

if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

export const db = new Database(DB_PATH);
db.pragma('foreign_keys = ON');

export function initDatabase() {
  // Create USERS Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      full_name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      username TEXT UNIQUE,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('STUDENT', 'FACULTY', 'SUPER_ADMIN')),
      created_at TEXT NOT NULL
    );
  `);

  // Create STUDENTS Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS students (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER UNIQUE,
      roll_number TEXT UNIQUE NOT NULL,
      department TEXT NOT NULL CHECK(department IN ('CSE', 'ECE', 'EEE', 'MECH', 'CIVIL')),
      year TEXT NOT NULL,
      section TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
    );
  `);

  // Create FACULTY Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS faculty (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER UNIQUE NOT NULL,
      faculty_id TEXT UNIQUE NOT NULL,
      department TEXT NOT NULL CHECK(department IN ('CSE', 'ECE', 'EEE', 'MECH', 'CIVIL')),
      approval_status TEXT NOT NULL DEFAULT 'PENDING' CHECK(approval_status IN ('PENDING', 'APPROVED', 'REJECTED')),
      approved_by INTEGER,
      approved_at TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL
    );
  `);

  // Create CERTIFICATES Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS certificates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id INTEGER NOT NULL,
      uploaded_by_user_id INTEGER NOT NULL,
      certificate_name TEXT NOT NULL,
      certificate_type TEXT NOT NULL CHECK(certificate_type IN (
        'Internship', 'Hackathon', 'Participation', 'Course Completion', 'Award', 'Workshop', 'Other'
      )),
      organization TEXT NOT NULL,
      issue_date TEXT NOT NULL,
      file_name TEXT NOT NULL,
      file_path TEXT NOT NULL,
      file_mime TEXT NOT NULL,
      file_size INTEGER NOT NULL,
      description TEXT,
      verification_status TEXT NOT NULL DEFAULT 'PENDING' CHECK(verification_status IN ('PENDING', 'VERIFIED', 'UNVERIFIED')),
      verification_notes TEXT,
      verified_by INTEGER,
      verified_at TEXT,
      uploaded_at TEXT NOT NULL,
      FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE RESTRICT,
      FOREIGN KEY (uploaded_by_user_id) REFERENCES users(id) ON DELETE RESTRICT,
      FOREIGN KEY (verified_by) REFERENCES users(id) ON DELETE SET NULL
    );
  `);

  seedDemoData();
}

function createSampleCertificateFile(fileName: string, title: string, recipient: string, org: string): string {
  const filePath = path.join(UPLOADS_DIR, fileName);
  if (!fs.existsSync(filePath)) {
    // We create a clean SVG certificate that browsers can display or render as an image/document
    const svgContent = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 700" width="1000" height="700">
  <rect width="1000" height="700" fill="#FFFFFF"/>
  <rect x="30" y="30" width="940" height="640" fill="none" stroke="#9D174D" stroke-width="8"/>
  <rect x="45" y="45" width="910" height="610" fill="none" stroke="#E5E7EB" stroke-width="2"/>
  
  <!-- Header -->
  <text x="500" y="120" font-family="Inter, sans-serif" font-size="22" font-weight="600" fill="#9D174D" text-anchor="middle" letter-spacing="4">CERTIFICATE OF ACHIEVEMENT</text>
  <line x1="400" y1="140" x2="600" y2="140" stroke="#9D174D" stroke-width="2"/>
  
  <text x="500" y="210" font-family="Inter, sans-serif" font-size="16" fill="#6B7280" text-anchor="middle">This certificate is proudly presented to</text>
  
  <!-- Recipient -->
  <text x="500" y="280" font-family="Inter, sans-serif" font-size="34" font-weight="700" fill="#111827" text-anchor="middle">${recipient}</text>
  <line x1="300" y1="305" x2="700" y2="305" stroke="#E5E7EB" stroke-width="1.5"/>
  
  <!-- Body text -->
  <text x="500" y="360" font-family="Inter, sans-serif" font-size="16" fill="#374151" text-anchor="middle">for successfully completing the requirements for</text>
  <text x="500" y="410" font-family="Inter, sans-serif" font-size="24" font-weight="600" fill="#9D174D" text-anchor="middle">${title}</text>
  
  <!-- Issuing Authority -->
  <text x="500" y="460" font-family="Inter, sans-serif" font-size="16" fill="#4B5563" text-anchor="middle">issued by <tspan font-weight="600">${org}</tspan></text>
  
  <!-- Footer Seal & Signatures -->
  <circle cx="500" cy="550" r="45" fill="#9D174D" opacity="0.08"/>
  <circle cx="500" cy="550" r="40" fill="none" stroke="#9D174D" stroke-width="2"/>
  <text x="500" y="555" font-family="Inter, sans-serif" font-size="12" font-weight="700" fill="#9D174D" text-anchor="middle">VERIFIED</text>
  
  <line x1="180" y1="580" x2="360" y2="580" stroke="#9D174D" stroke-width="1.5"/>
  <text x="270" y="605" font-family="Inter, sans-serif" font-size="14" font-weight="500" fill="#4B5563" text-anchor="middle">Academic Dean</text>
  
  <line x1="640" y1="580" x2="820" y2="580" stroke="#9D174D" stroke-width="1.5"/>
  <text x="730" y="605" font-family="Inter, sans-serif" font-size="14" font-weight="500" fill="#4B5563" text-anchor="middle">Program Director</text>
</svg>`;
    fs.writeFileSync(filePath, svgContent);
  }
  return filePath;
}

function seedDemoData() {
  const userCount = db.prepare('SELECT COUNT(*) as cnt FROM users').get() as { cnt: number };
  if (userCount.cnt > 0) {
    return; // Already seeded
  }

  const salt = bcrypt.genSaltSync(10);
  const now = new Date().toISOString();

  // 1. Super Admin Account
  // Username: superadmin, Password: superadmin123
  const superadminHash = bcrypt.hashSync('superadmin123', salt);
  const superAdminStmt = db.prepare(`
    INSERT INTO users (full_name, email, username, password_hash, role, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  const superAdminRes = superAdminStmt.run(
    'College Super Administrator',
    'superadmin@college.edu',
    'superadmin',
    superadminHash,
    'SUPER_ADMIN',
    now
  );
  const superAdminId = superAdminRes.lastInsertRowid as number;

  // 2. Demo Approved Faculty: CSE & ECE
  const facultyHash = bcrypt.hashSync('faculty123', salt);
  
  // CSE Faculty: cse.faculty / faculty123
  const cseFacultyUser = db.prepare(`
    INSERT INTO users (full_name, email, username, password_hash, role, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run('Dr. Rajesh Sharma', 'cse.faculty@college.edu', 'cse.faculty', facultyHash, 'FACULTY', now);
  const cseFacultyUserId = cseFacultyUser.lastInsertRowid as number;

  db.prepare(`
    INSERT INTO faculty (user_id, faculty_id, department, approval_status, approved_by, approved_at, created_at)
    VALUES (?, ?, ?, 'APPROVED', ?, ?, ?)
  `).run(cseFacultyUserId, 'FAC-CSE-001', 'CSE', superAdminId, now, now);

  // ECE Faculty: ece.faculty / faculty123
  const eceFacultyUser = db.prepare(`
    INSERT INTO users (full_name, email, username, password_hash, role, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run('Prof. Ananya Sen', 'ece.faculty@college.edu', 'ece.faculty', facultyHash, 'FACULTY', now);
  const eceFacultyUserId = eceFacultyUser.lastInsertRowid as number;

  db.prepare(`
    INSERT INTO faculty (user_id, faculty_id, department, approval_status, approved_by, approved_at, created_at)
    VALUES (?, ?, ?, 'APPROVED', ?, ?, ?)
  `).run(eceFacultyUserId, 'FAC-ECE-002', 'ECE', superAdminId, now, now);

  // Pending Faculty Request: mech.faculty / faculty123
  const mechFacultyUser = db.prepare(`
    INSERT INTO users (full_name, email, username, password_hash, role, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run('Dr. Vikram Verma', 'mech.faculty@college.edu', 'mech.faculty', facultyHash, 'FACULTY', now);
  const mechFacultyUserId = mechFacultyUser.lastInsertRowid as number;

  db.prepare(`
    INSERT INTO faculty (user_id, faculty_id, department, approval_status, created_at)
    VALUES (?, ?, ?, 'PENDING', ?)
  `).run(mechFacultyUserId, 'FAC-MECH-003', 'MECH', now);

  // 3. Demo Student: student / student123 (CSE)
  const studentHash = bcrypt.hashSync('student123', salt);
  const demoStudentUser = db.prepare(`
    INSERT INTO users (full_name, email, username, password_hash, role, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run('Aarav Patel', 'student@college.edu', 'student', studentHash, 'STUDENT', now);
  const demoStudentUserId = demoStudentUser.lastInsertRowid as number;

  const demoStudentRec = db.prepare(`
    INSERT INTO students (user_id, roll_number, department, year, section)
    VALUES (?, ?, ?, ?, ?)
  `).run(demoStudentUserId, '22CSE045', 'CSE', '3rd Year', 'A');
  const demoStudentId = demoStudentRec.lastInsertRowid as number;

  // 4. Create at least 15 fictional students across CSE, ECE, EEE, MECH, CIVIL
  interface StudentSeed {
    name: string;
    email: string;
    roll: string;
    dept: 'CSE' | 'ECE' | 'EEE' | 'MECH' | 'CIVIL';
    year: string;
    section: string;
  }

  const fictionalStudents: StudentSeed[] = [
    { name: 'Diya Sundaram', email: 'diya.cse@college.edu', roll: '22CSE046', dept: 'CSE', year: '3rd Year', section: 'A' },
    { name: 'Rohan Mehra', email: 'rohan.cse@college.edu', roll: '23CSE012', dept: 'CSE', year: '2nd Year', section: 'B' },
    { name: 'Kavya Nair', email: 'kavya.cse@college.edu', roll: '21CSE089', dept: 'CSE', year: '4th Year', section: 'A' },
    { name: 'Aditya Iyer', email: 'aditya.ece@college.edu', roll: '22ECE018', dept: 'ECE', year: '3rd Year', section: 'A' },
    { name: 'Pooja Reddy', email: 'pooja.ece@college.edu', roll: '23ECE034', dept: 'ECE', year: '2nd Year', section: 'B' },
    { name: 'Siddharth Rao', email: 'siddharth.ece@college.edu', roll: '24ECE005', dept: 'ECE', year: '1st Year', section: 'A' },
    { name: 'Meera Menon', email: 'meera.eee@college.edu', roll: '22EEE007', dept: 'EEE', year: '3rd Year', section: 'A' },
    { name: 'Arjun Das', email: 'arjun.eee@college.edu', roll: '23EEE021', dept: 'EEE', year: '2nd Year', section: 'B' },
    { name: 'Sneha Kulkarni', email: 'sneha.eee@college.edu', roll: '21EEE042', dept: 'EEE', year: '4th Year', section: 'A' },
    { name: 'Varun Joshi', email: 'varun.mech@college.edu', roll: '22MECH014', dept: 'MECH', year: '3rd Year', section: 'A' },
    { name: 'Nikhil Bhat', email: 'nikhil.mech@college.edu', roll: '23MECH028', dept: 'MECH', year: '2nd Year', section: 'B' },
    { name: 'Gaurav Deshmukh', email: 'gaurav.mech@college.edu', roll: '21MECH003', dept: 'MECH', year: '4th Year', section: 'A' },
    { name: 'Ishita Roy', email: 'ishita.civil@college.edu', roll: '22CIVIL011', dept: 'CIVIL', year: '3rd Year', section: 'A' },
    { name: 'Manish Pandey', email: 'manish.civil@college.edu', roll: '23CIVIL025', dept: 'CIVIL', year: '2nd Year', section: 'B' },
    { name: 'Tanvi Chawla', email: 'tanvi.civil@college.edu', roll: '24CIVIL008', dept: 'CIVIL', year: '1st Year', section: 'A' },
  ];

  const studentMap: { [roll: string]: { studentId: number; userId: number; name: string; dept: string } } = {
    '22CSE045': { studentId: demoStudentId, userId: demoStudentUserId, name: 'Aarav Patel', dept: 'CSE' }
  };

  for (const s of fictionalStudents) {
    const sUser = db.prepare(`
      INSERT INTO users (full_name, email, username, password_hash, role, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(s.name, s.email, s.roll.toLowerCase(), studentHash, 'STUDENT', now);
    const uId = sUser.lastInsertRowid as number;

    const sRec = db.prepare(`
      INSERT INTO students (user_id, roll_number, department, year, section)
      VALUES (?, ?, ?, ?, ?)
    `).run(uId, s.roll, s.dept, s.year, s.section);
    const stId = sRec.lastInsertRowid as number;

    studentMap[s.roll] = { studentId: stId, userId: uId, name: s.name, dept: s.dept };
  }

  // 5. Create at least 30 fictional certificate records across varied types, years, sections, verification statuses
  // Must test:
  // - Aarav Patel uploaded his own certificates
  // - Aarav Patel uploaded a certificate for classmate Diya Sundaram (Testing Student A uploading for Student B!)
  // - Verified, Pending, Unverified certificates
  // - Multiple departments (CSE, ECE, EEE, MECH, CIVIL)

  interface CertSeed {
    roll: string;
    uploaderRoll: string;
    name: string;
    type: string;
    org: string;
    issueDate: string;
    status: 'PENDING' | 'VERIFIED' | 'UNVERIFIED';
    notes?: string;
    verifierUserId?: number;
  }

  const certificateSeedList: CertSeed[] = [
    // CSE Certificates (Reviewed by cseFacultyUserId)
    {
      roll: '22CSE045', // Aarav Patel
      uploaderRoll: '22CSE045', // Self
      name: 'Advanced Full Stack Web Development',
      type: 'Course Completion',
      org: 'Coursera & Meta',
      issueDate: '2025-08-15',
      status: 'VERIFIED',
      notes: 'Verified against Meta credentials verification hash.',
      verifierUserId: cseFacultyUserId,
    },
    {
      roll: '22CSE045', // Aarav Patel
      uploaderRoll: '22CSE045', // Self
      name: 'Smart India Hackathon Finalist',
      type: 'Hackathon',
      org: 'Ministry of Education Innovation Cell',
      issueDate: '2025-09-20',
      status: 'VERIFIED',
      notes: 'Valid certificate and prize distribution list verified.',
      verifierUserId: cseFacultyUserId,
    },
    {
      roll: '22CSE045', // Aarav Patel
      uploaderRoll: '22CSE045', // Self
      name: 'Cloud Computing Architecture Internship',
      type: 'Internship',
      org: 'Infosys Springboard',
      issueDate: '2025-11-10',
      status: 'PENDING',
    },
    {
      roll: '22CSE046', // Diya Sundaram (Classmate)
      uploaderRoll: '22CSE045', // Uploaded by Aarav Patel! (Test Scenario 8)
      name: 'National AI & Machine Learning Workshop',
      type: 'Workshop',
      org: 'IIT Madras Shaastra',
      issueDate: '2025-10-05',
      status: 'PENDING',
    },
    {
      roll: '22CSE046', // Diya Sundaram
      uploaderRoll: '22CSE046',
      name: 'AWS Certified Solutions Architect Associate',
      type: 'Course Completion',
      org: 'Amazon Web Services',
      issueDate: '2025-07-22',
      status: 'VERIFIED',
      notes: 'AWS digital badge validated.',
      verifierUserId: cseFacultyUserId,
    },
    {
      roll: '23CSE012', // Rohan Mehra
      uploaderRoll: '23CSE012',
      name: 'Data Structures & Algorithms in Java',
      type: 'Course Completion',
      org: 'NPTEL SWAYAM',
      issueDate: '2025-06-18',
      status: 'VERIFIED',
      notes: 'Score 88% verified on NPTEL portal.',
      verifierUserId: cseFacultyUserId,
    },
    {
      roll: '23CSE012', // Rohan Mehra
      uploaderRoll: '23CSE012',
      name: 'Regional Coding Marathon 2025',
      type: 'Participation',
      org: 'ACM Student Chapter',
      issueDate: '2025-10-12',
      status: 'UNVERIFIED',
      notes: 'The uploaded file is blurry and missing issuing authority signature. Please re-upload.',
      verifierUserId: cseFacultyUserId,
    },
    {
      roll: '21CSE089', // Kavya Nair
      uploaderRoll: '21CSE089',
      name: 'Cyber Security Red Team Internship',
      type: 'Internship',
      org: 'QuickHeal Security Labs',
      issueDate: '2025-09-01',
      status: 'VERIFIED',
      notes: 'Internship completion letter verified.',
      verifierUserId: cseFacultyUserId,
    },
    {
      roll: '21CSE089', // Kavya Nair
      uploaderRoll: '21CSE089',
      name: 'Best Innovation Paper Award',
      type: 'Award',
      org: 'IEEE International Conference on Computing',
      issueDate: '2025-12-04',
      status: 'PENDING',
    },

    // ECE Certificates (Reviewed by eceFacultyUserId)
    {
      roll: '22ECE018', // Aditya Iyer
      uploaderRoll: '22ECE018',
      name: 'Embedded Systems & IoT Specialization',
      type: 'Course Completion',
      org: 'Texas Instruments',
      issueDate: '2025-05-14',
      status: 'VERIFIED',
      notes: 'Approved TI university partner certification.',
      verifierUserId: eceFacultyUserId,
    },
    {
      roll: '22ECE018', // Aditya Iyer
      uploaderRoll: '22ECE018',
      name: 'VLSI Design & Cadence Virtuoso Workshop',
      type: 'Workshop',
      org: 'Cadence Design Systems',
      issueDate: '2025-08-30',
      status: 'PENDING',
    },
    {
      roll: '23ECE034', // Pooja Reddy
      uploaderRoll: '23ECE034',
      name: 'Robotics Autonomous Navigation Challenge',
      type: 'Hackathon',
      org: 'RoboNation Global',
      issueDate: '2025-07-19',
      status: 'VERIFIED',
      notes: 'First Runner-Up Trophy and certificate confirmed.',
      verifierUserId: eceFacultyUserId,
    },
    {
      roll: '23ECE034', // Pooja Reddy
      uploaderRoll: '23ECE034',
      name: '5G Communications Protocols Seminar',
      type: 'Participation',
      org: 'Telecom Regulatory Authority Chapter',
      issueDate: '2025-11-02',
      status: 'UNVERIFIED',
      notes: 'Date of event does not match academic semester schedule; please provide attendance confirmation.',
      verifierUserId: eceFacultyUserId,
    },
    {
      roll: '24ECE005', // Siddharth Rao
      uploaderRoll: '24ECE005',
      name: 'Arduino Microcontroller BootCamp',
      type: 'Course Completion',
      org: 'EdX',
      issueDate: '2025-10-25',
      status: 'PENDING',
    },
    {
      roll: '24ECE005', // Siddharth Rao
      uploaderRoll: '24ECE005',
      name: 'Electronics Circuit Design Fair',
      type: 'Participation',
      org: 'State Science & Tech Council',
      issueDate: '2025-11-15',
      status: 'PENDING',
    },

    // EEE Certificates
    {
      roll: '22EEE007', // Meera Menon
      uploaderRoll: '22EEE007',
      name: 'Renewable Solar Power Grid Integration',
      type: 'Internship',
      org: 'Tata Power Solar Systems',
      issueDate: '2025-07-10',
      status: 'VERIFIED',
      notes: 'Verified with official HR contact.',
      verifierUserId: superAdminId,
    },
    {
      roll: '22EEE007', // Meera Menon
      uploaderRoll: '22EEE007',
      name: 'Electric Vehicle Battery Management Workshop',
      type: 'Workshop',
      org: 'Society of Automotive Engineers',
      issueDate: '2025-09-12',
      status: 'PENDING',
    },
    {
      roll: '23EEE021', // Arjun Das
      uploaderRoll: '23EEE021',
      name: 'MATLAB Power Systems Simulation',
      type: 'Course Completion',
      org: 'MathWorks Certified',
      issueDate: '2025-06-05',
      status: 'VERIFIED',
      notes: 'Mathworks certificate serial verified.',
      verifierUserId: superAdminId,
    },
    {
      roll: '23EEE021', // Arjun Das
      uploaderRoll: '23EEE021',
      name: 'High Voltage Engineering Symposium',
      type: 'Participation',
      org: 'National Power Training Institute',
      issueDate: '2025-08-28',
      status: 'UNVERIFIED',
      notes: 'Certificate does not specify student name accurately.',
      verifierUserId: superAdminId,
    },
    {
      roll: '21EEE042', // Sneha Kulkarni
      uploaderRoll: '21EEE042',
      name: 'Smart Grid Automation Internship',
      type: 'Internship',
      org: 'Schneider Electric',
      issueDate: '2025-08-20',
      status: 'VERIFIED',
      notes: 'Excellent industrial training rating.',
      verifierUserId: superAdminId,
    },
    {
      roll: '21EEE042', // Sneha Kulkarni
      uploaderRoll: '21EEE042',
      name: 'National Clean Energy Hackathon',
      type: 'Hackathon',
      org: 'NITI Aayog',
      issueDate: '2025-10-18',
      status: 'PENDING',
    },

    // MECH Certificates
    {
      roll: '22MECH014', // Varun Joshi
      uploaderRoll: '22MECH014',
      name: 'SolidWorks 3D CAD Professional Certification',
      type: 'Course Completion',
      org: 'Dassault Systèmes',
      issueDate: '2025-05-30',
      status: 'VERIFIED',
      notes: 'CSWA verification number authenticated.',
      verifierUserId: superAdminId,
    },
    {
      roll: '22MECH014', // Varun Joshi
      uploaderRoll: '22MECH014',
      name: 'Formula Student Racing Chassis Fabrication',
      type: 'Award',
      org: 'SAE India Formula Student',
      issueDate: '2025-08-11',
      status: 'VERIFIED',
      notes: 'Team design award certificate confirmed.',
      verifierUserId: superAdminId,
    },
    {
      roll: '23MECH028', // Nikhil Bhat
      uploaderRoll: '23MECH028',
      name: 'ANSYS FEA Thermal Analysis Workshop',
      type: 'Workshop',
      org: 'ANSYS Innovation Courses',
      issueDate: '2025-09-14',
      status: 'PENDING',
    },
    {
      roll: '23MECH028', // Nikhil Bhat
      uploaderRoll: '23MECH028',
      name: 'Industrial Robotics Automation Training',
      type: 'Internship',
      org: 'KUKA Robotics India',
      issueDate: '2025-11-20',
      status: 'PENDING',
    },
    {
      roll: '21MECH003', // Gaurav Deshmukh
      uploaderRoll: '21MECH003',
      name: 'Lean Six Sigma Green Belt',
      type: 'Course Completion',
      org: 'KPMG Learning Academy',
      issueDate: '2025-04-10',
      status: 'VERIFIED',
      notes: 'Validated with KPMG verification portal.',
      verifierUserId: superAdminId,
    },
    {
      roll: '21MECH003', // Gaurav Deshmukh
      uploaderRoll: '21MECH003',
      name: 'Automotive IC Engine Overhauling',
      type: 'Participation',
      org: 'Bosch Training Center',
      issueDate: '2025-10-02',
      status: 'UNVERIFIED',
      notes: 'Certificate document expired or illegible stamp.',
      verifierUserId: superAdminId,
    },

    // CIVIL Certificates
    {
      roll: '22CIVIL011', // Ishita Roy
      uploaderRoll: '22CIVIL011',
      name: 'Revit BIM Architecture & Structural Modeling',
      type: 'Course Completion',
      org: 'Autodesk Certified Professional',
      issueDate: '2025-07-04',
      status: 'VERIFIED',
      notes: 'Autodesk credential link confirmed.',
      verifierUserId: superAdminId,
    },
    {
      roll: '22CIVIL011', // Ishita Roy
      uploaderRoll: '22CIVIL011',
      name: 'Earthquake Resistant Building Design Seminar',
      type: 'Participation',
      org: 'Indian Society of Earthquake Technology',
      issueDate: '2025-09-29',
      status: 'PENDING',
    },
    {
      roll: '23CIVIL025', // Manish Pandey
      uploaderRoll: '23CIVIL025',
      name: 'Metro Rail Viaduct Structural Inspection Internship',
      type: 'Internship',
      org: 'L&T Construction',
      issueDate: '2025-08-01',
      status: 'VERIFIED',
      notes: 'Approved site internship certificate.',
      verifierUserId: superAdminId,
    },
    {
      roll: '23CIVIL025', // Manish Pandey
      uploaderRoll: '23CIVIL025',
      name: 'GIS & Remote Sensing for Urban Planning',
      type: 'Workshop',
      org: 'ISRO Indian Institute of Remote Sensing',
      issueDate: '2025-11-18',
      status: 'PENDING',
    },
    {
      roll: '24CIVIL008', // Tanvi Chawla
      uploaderRoll: '24CIVIL008',
      name: 'Total Station Surveying & Geomatics',
      type: 'Workshop',
      org: 'Survey of India Training Institute',
      issueDate: '2025-10-10',
      status: 'PENDING',
    },
    {
      roll: '24CIVIL008', // Tanvi Chawla
      uploaderRoll: '24CIVIL008',
      name: 'Green Building Leadership Workshop',
      type: 'Other',
      org: 'Indian Green Building Council (IGBC)',
      issueDate: '2025-12-01',
      status: 'UNVERIFIED',
      notes: 'Certificate missing signature of national council chairman.',
      verifierUserId: superAdminId,
    }
  ];

  const insertCertStmt = db.prepare(`
    INSERT INTO certificates (
      student_id, uploaded_by_user_id, certificate_name, certificate_type, organization,
      issue_date, file_name, file_path, file_mime, file_size, description,
      verification_status, verification_notes, verified_by, verified_at, uploaded_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  let index = 1;
  for (const c of certificateSeedList) {
    const studentInfo = studentMap[c.roll];
    const uploaderInfo = studentMap[c.uploaderRoll] || studentMap['22CSE045'];
    if (!studentInfo || !uploaderInfo) continue;

    const fileName = `cert_${index}_${c.roll}.svg`;
    createSampleCertificateFile(fileName, c.name, studentInfo.name, c.org);
    const filePath = path.join(UPLOADS_DIR, fileName);

    const verifiedAt = c.status !== 'PENDING' ? new Date(Date.now() - 1000 * 60 * 60 * 24 * (35 - index)).toISOString() : null;
    const uploadedAt = new Date(Date.now() - 1000 * 60 * 60 * 24 * (40 - index)).toISOString();

    insertCertStmt.run(
      studentInfo.studentId,
      uploaderInfo.userId,
      c.name,
      c.type,
      c.org,
      c.issueDate,
      fileName,
      filePath,
      'image/svg+xml',
      3500,
      `Official certification obtained from ${c.org}. Verified credentials and transcript submitted.`,
      c.status,
      c.notes || null,
      c.verifierUserId || null,
      verifiedAt,
      uploadedAt
    );
    index++;
  }

  console.log(`Database seeded with demo users, 15 students, and ${index - 1} certificates.`);
}
