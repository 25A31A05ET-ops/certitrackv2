export type Role = 'STUDENT' | 'FACULTY' | 'SUPER_ADMIN';

export type Department = 'CSE' | 'ECE' | 'EEE' | 'MECH' | 'CIVIL';

export type CertificateType =
  | 'Internship'
  | 'Hackathon'
  | 'Participation'
  | 'Course Completion'
  | 'Award'
  | 'Workshop'
  | 'Other';

export type VerificationStatus = 'PENDING' | 'VERIFIED' | 'UNVERIFIED';

export type FacultyApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface User {
  id: number;
  full_name: string;
  email: string;
  username: string;
  role: Role;
  department?: Department;
  faculty_id?: string;
  faculty_record_id?: number;
  approval_status?: FacultyApprovalStatus;
  student_record_id?: number;
  roll_number?: string;
  year?: string;
  section?: string;
}

export interface StudentRecord {
  id: number;
  roll_number: string;
  department: Department;
  year: string;
  section: string;
  student_name: string;
  email?: string;
  total_certificates?: number;
  verified_count?: number;
}

export interface FacultyRecord {
  id: number;
  faculty_id: string;
  department: Department;
  approval_status: FacultyApprovalStatus;
  created_at: string;
  approved_at?: string;
  full_name: string;
  email: string;
  approved_by_name?: string;
}

export interface CertificateRecord {
  id: number;
  student_id: number;
  uploaded_by_user_id: number;
  certificate_name: string;
  certificate_type: CertificateType;
  organization: string;
  issue_date: string;
  file_name: string;
  file_size: number;
  file_mime?: string;
  description?: string;
  verification_status: VerificationStatus;
  verification_notes?: string;
  verified_by?: number;
  verified_by_name?: string;
  verified_at?: string;
  uploaded_at: string;
  student_roll_number?: string;
  student_name?: string;
  student_department?: Department;
  student_year?: string;
  student_section?: string;
  uploaded_by_name?: string;
}

export interface FacultyDashboardData {
  department: Department;
  stats: {
    total_certificates: number;
    pending_certificates: number;
    verified_certificates: number;
    unverified_certificates: number;
    total_students: number;
  };
  recent_pending: CertificateRecord[];
}

export interface AdminDashboardData {
  stats: {
    total_students: number;
    total_faculty: number;
    pending_faculty_requests: number;
    total_certificates: number;
    pending_certificates: number;
    verified_certificates: number;
    unverified_certificates: number;
  };
  departments: {
    department: Department;
    student_count: number;
    certificate_count: number;
    verified_count: number;
    pending_count: number;
  }[];
}
