import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { db } from './db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'certitrack_secret_college_jwt_key_2026';

export interface AuthUser {
  id: number;
  full_name: string;
  email: string;
  username: string;
  role: 'STUDENT' | 'FACULTY' | 'SUPER_ADMIN';
  department?: string; // For faculty or student
  faculty_id?: string;
  faculty_record_id?: number;
  approval_status?: 'PENDING' | 'APPROVED' | 'REJECTED';
  student_record_id?: number;
  roll_number?: string;
  year?: string;
  section?: string;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthUser;
}

export function generateToken(user: AuthUser): string {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

export function getFullUserProfile(userId: number): AuthUser | null {
  const user = db.prepare('SELECT id, full_name, email, username, role FROM users WHERE id = ?').get(userId) as any;
  if (!user) return null;

  const authUser: AuthUser = {
    id: user.id,
    full_name: user.full_name,
    email: user.email,
    username: user.username,
    role: user.role,
  };

  if (user.role === 'STUDENT') {
    const student = db.prepare('SELECT id, roll_number, department, year, section FROM students WHERE user_id = ?').get(user.id) as any;
    if (student) {
      authUser.student_record_id = student.id;
      authUser.roll_number = student.roll_number;
      authUser.department = student.department;
      authUser.year = student.year;
      authUser.section = student.section;
    }
  } else if (user.role === 'FACULTY') {
    const faculty = db.prepare('SELECT id, faculty_id, department, approval_status FROM faculty WHERE user_id = ?').get(user.id) as any;
    if (faculty) {
      authUser.faculty_record_id = faculty.id;
      authUser.faculty_id = faculty.faculty_id;
      authUser.department = faculty.department;
      authUser.approval_status = faculty.approval_status;
    }
  }

  return authUser;
}

export function authenticateToken(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required. Please log in.' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: number };
    const user = getFullUserProfile(decoded.id);

    if (!user) {
      return res.status(401).json({ error: 'User account not found.' });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired session token. Please log in again.' });
  }
}

export function requireRole(...allowedRoles: ('STUDENT' | 'FACULTY' | 'SUPER_ADMIN')[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: `Forbidden: requires one of [${allowedRoles.join(', ')}] role.` });
    }

    next();
  };
}

export function requireFaculty(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  if (req.user.role !== 'FACULTY') {
    return res.status(403).json({ error: 'Faculty access only.' });
  }

  if (req.user.approval_status !== 'APPROVED') {
    return res.status(403).json({
      error: 'Your faculty account is pending administrator approval or has been rejected. Contact Super Admin.',
      approval_status: req.user.approval_status || 'PENDING',
    });
  }

  next();
}

export function requireSuperAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!req.user || req.user.role !== 'SUPER_ADMIN') {
    return res.status(403).json({ error: 'Forbidden: Super Administrator access only.' });
  }
  next();
}

export function requireStudent(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!req.user || req.user.role !== 'STUDENT') {
    return res.status(403).json({ error: 'Forbidden: Student access only.' });
  }
  next();
}
