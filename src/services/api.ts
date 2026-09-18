import { User, CertificateRecord, FacultyDashboardData, AdminDashboardData, FacultyRecord, StudentRecord } from '../types';

const API_BASE = '/api';

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem('certitrack_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export const api = {
  // Auth
  async login(identifier: string, password: string):Promise<{ token: string; user: User }> {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Login failed');
    return data;
  },

  async registerStudent(formData: any): Promise<{ token: string; user: User; message: string }> {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Student registration failed');
    return data;
  },

  async requestFacultyAccess(formData: any): Promise<{ message: string; status: string }> {
    const res = await fetch(`${API_BASE}/faculty/request`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Faculty request failed');
    return data;
  },

  async getMe(): Promise<{ user: User }> {
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: getAuthHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to fetch current user');
    return data;
  },

  // Student Endpoints
  async getStudentProfile(): Promise<{ profile: any; stats: any }> {
    const res = await fetch(`${API_BASE}/students/profile`, {
      headers: getAuthHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to fetch student profile');
    return data;
  },

  async getStudentSubmissions(): Promise<{ certificates: CertificateRecord[] }> {
    const res = await fetch(`${API_BASE}/students/submissions`, {
      headers: getAuthHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to fetch submissions');
    return data;
  },

  async uploadCertificate(formData: FormData): Promise<{ message: string; certificate_id: number }> {
    const token = localStorage.getItem('certitrack_token');
    const res = await fetch(`${API_BASE}/certificates/upload`, {
      method: 'POST',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: formData,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to upload certificate');
    return data;
  },

  async getCertificate(id: number): Promise<{ certificate: CertificateRecord }> {
    const res = await fetch(`${API_BASE}/certificates/${id}`, {
      headers: getAuthHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to fetch certificate');
    return data;
  },

  async verifyCertificate(id: number, status: 'VERIFIED' | 'UNVERIFIED', notes?: string): Promise<any> {
    const res = await fetch(`${API_BASE}/certificates/${id}/verify`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ status, notes }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to verify certificate');
    return data;
  },

  getCertificateFileUrl(id: number, download = false): string {
    const token = localStorage.getItem('certitrack_token') || '';
    return `${API_BASE}/certificates/${id}/file?download=${download}`;
  },

  // Faculty Endpoints
  async getFacultyDashboard(): Promise<FacultyDashboardData> {
    const res = await fetch(`${API_BASE}/faculty/dashboard`, {
      headers: getAuthHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to fetch faculty dashboard');
    return data;
  },

  async getFacultyCertificates(filters?: Record<string, string>): Promise<{ department: string; certificates: CertificateRecord[] }> {
    const query = new URLSearchParams(filters || {}).toString();
    const res = await fetch(`${API_BASE}/faculty/certificates?${query}`, {
      headers: getAuthHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to fetch faculty certificates');
    return data;
  },

  async getFacultyStudents(filters?: Record<string, string>): Promise<{ department: string; students: StudentRecord[] }> {
    const query = new URLSearchParams(filters || {}).toString();
    const res = await fetch(`${API_BASE}/faculty/students?${query}`, {
      headers: getAuthHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to fetch faculty students');
    return data;
  },

  async downloadFacultyExcel(): Promise<void> {
    const token = localStorage.getItem('certitrack_token');
    const res = await fetch(`${API_BASE}/faculty/export`, {
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to export Excel');
    }

    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `CERTITRACK_Faculty_Export_${Date.now()}.xlsx`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  },

  // Admin Endpoints
  async getAdminDashboard(): Promise<AdminDashboardData> {
    const res = await fetch(`${API_BASE}/admin/dashboard`, {
      headers: getAuthHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to fetch admin dashboard');
    return data;
  },

  async getAdminFacultyRequests(): Promise<{ requests: FacultyRecord[] }> {
    const res = await fetch(`${API_BASE}/admin/faculty-requests`, {
      headers: getAuthHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to fetch faculty requests');
    return data;
  },

  async approveFacultyRequest(id: number): Promise<any> {
    const res = await fetch(`${API_BASE}/admin/faculty-requests/${id}/approve`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to approve faculty request');
    return data;
  },

  async rejectFacultyRequest(id: number): Promise<any> {
    const res = await fetch(`${API_BASE}/admin/faculty-requests/${id}/reject`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to reject faculty request');
    return data;
  },

  async getAdminFacultyList(): Promise<{ faculty: FacultyRecord[] }> {
    const res = await fetch(`${API_BASE}/admin/faculty`, {
      headers: getAuthHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to fetch faculty list');
    return data;
  },

  async getAdminStudents(filters?: Record<string, string>): Promise<{ students: StudentRecord[] }> {
    const query = new URLSearchParams(filters || {}).toString();
    const res = await fetch(`${API_BASE}/admin/students?${query}`, {
      headers: getAuthHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to fetch students list');
    return data;
  },

  async getAdminCertificates(filters?: Record<string, string>): Promise<{ certificates: CertificateRecord[] }> {
    const query = new URLSearchParams(filters || {}).toString();
    const res = await fetch(`${API_BASE}/admin/certificates?${query}`, {
      headers: getAuthHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to fetch certificates');
    return data;
  },

  async downloadAdminExcel(department?: string): Promise<void> {
    const token = localStorage.getItem('certitrack_token');
    const url = department && department !== 'ALL'
      ? `${API_BASE}/admin/export?department=${department}`
      : `${API_BASE}/admin/export`;

    const res = await fetch(url, {
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to export admin Excel');
    }

    const blob = await res.blob();
    const downloadUrl = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = `CERTITRACK_Admin_Export_${department || 'ALL'}_${Date.now()}.xlsx`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(downloadUrl);
  },
};
