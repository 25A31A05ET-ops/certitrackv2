import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import {
  AdminDashboardData,
  FacultyRecord,
  StudentRecord,
  CertificateRecord,
  Department,
} from '../types';
import { StatsCard } from '../components/StatsCard';
import { CertificateModal } from '../components/CertificateModal';
import {
  ShieldAlert,
  Users,
  GraduationCap,
  FileCheck2,
  Clock,
  CheckCircle,
  AlertCircle,
  FileSpreadsheet,
  Building,
  Check,
  X,
  Eye,
  Search,
  RefreshCw,
  Layers,
} from 'lucide-react';

interface AdminDashboardProps {
  currentTab: string;
  onNavigateTab: (tab: string) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  currentTab,
  onNavigateTab,
}) => {
  const { user } = useAuth();

  const [dashboardData, setDashboardData] = useState<AdminDashboardData | null>(null);
  const [facultyRequests, setFacultyRequests] = useState<FacultyRecord[]>([]);
  const [facultyList, setFacultyList] = useState<FacultyRecord[]>([]);
  const [students, setStudents] = useState<StudentRecord[]>([]);
  const [certificates, setCertificates] = useState<CertificateRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');

  // Filtering states
  const [adminDeptFilter, setAdminDeptFilter] = useState('ALL');
  const [adminSearch, setAdminSearch] = useState('');
  const [adminStatusFilter, setAdminStatusFilter] = useState('');
  const [exportDept, setExportDept] = useState('ALL');
  const [exportLoading, setExportLoading] = useState(false);

  // Selected Cert Modal
  const [selectedCert, setSelectedCert] = useState<CertificateRecord | null>(null);

  const fetchAdminData = async () => {
    setLoading(true);
    setError('');
    try {
      const [dashRes, reqsRes, facRes, certsRes, studsRes] = await Promise.all([
        api.getAdminDashboard(),
        api.getAdminFacultyRequests(),
        api.getAdminFacultyList(),
        api.getAdminCertificates({
          department: adminDeptFilter,
          search: adminSearch,
          verification_status: adminStatusFilter,
        }),
        api.getAdminStudents({
          department: adminDeptFilter,
          search: adminSearch,
        }),
      ]);

      setDashboardData(dashRes);
      setFacultyRequests(reqsRes.requests);
      setFacultyList(facRes.faculty);
      setCertificates(certsRes.certificates);
      setStudents(studsRes.students);
    } catch (err: any) {
      setError(err.message || 'Failed to load administrator data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, [adminDeptFilter, adminSearch, adminStatusFilter]);

  const handleApproveFaculty = async (id: number) => {
    setError('');
    setActionSuccess('');
    try {
      await api.approveFacultyRequest(id);
      setActionSuccess('Faculty access request approved successfully.');
      fetchAdminData();
    } catch (err: any) {
      setError(err.message || 'Failed to approve faculty request.');
    }
  };

  const handleRejectFaculty = async (id: number) => {
    setError('');
    setActionSuccess('');
    try {
      await api.rejectFacultyRequest(id);
      setActionSuccess('Faculty access request rejected.');
      fetchAdminData();
    } catch (err: any) {
      setError(err.message || 'Failed to reject faculty request.');
    }
  };

  const handleExportExcel = async () => {
    setExportLoading(true);
    try {
      await api.downloadAdminExcel(exportDept);
    } catch (err: any) {
      setError(err.message || 'Failed to generate Excel report.');
    } finally {
      setExportLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    if (status === 'VERIFIED') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-semibold text-[#9D174D] border border-[#9D174D] bg-[#9D174D]/5 rounded">
          <CheckCircle className="w-3 h-3" />
          VERIFIED
        </span>
      );
    }
    if (status === 'UNVERIFIED') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-semibold text-[#111827] border border-[#111827] bg-[#F3F4F6] rounded">
          <AlertCircle className="w-3 h-3" />
          UNVERIFIED
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium text-gray-700 border border-gray-300 bg-white rounded">
        <Clock className="w-3 h-3" />
        PENDING
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Super Admin Top Header */}
      <div className="bg-white p-6 rounded border border-[#E5E7EB] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] uppercase font-bold text-[#9D174D] tracking-wider bg-[#9D174D]/10 px-2 py-0.5 rounded">
            Institutional Oversight
          </span>
          <h2 className="text-xl font-bold tracking-tight text-gray-900 mt-1">
            Super Administrator Control Panel
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Full-spectrum institutional certificate records, multi-department audit & faculty access control
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            id="admin-requests-quick-btn"
            type="button"
            onClick={() => onNavigateTab('requests')}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-[#9D174D] hover:bg-[#831340] rounded shadow-sm transition-colors"
          >
            <ShieldAlert className="w-4 h-4" />
            Faculty Requests ({facultyRequests.length})
          </button>
          <button
            id="admin-export-quick-btn"
            type="button"
            onClick={() => onNavigateTab('export')}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-[#9D174D] bg-white border border-[#9D174D] hover:bg-[#9D174D]/5 rounded transition-colors"
          >
            <FileSpreadsheet className="w-4 h-4" />
            Excel Export
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3 text-xs text-red-800 bg-red-50 border border-red-200 rounded">
          {error}
        </div>
      )}
      {actionSuccess && (
        <div className="p-3 text-xs text-green-800 bg-green-50 border border-green-200 rounded">
          {actionSuccess}
        </div>
      )}

      {/* 5 Super Admin High-Level Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatsCard
          id="stat-admin-total-certs"
          title="Total Certificates"
          value={dashboardData?.stats.total_certificates ?? 0}
          description="College-wide records"
          icon={<FileCheck2 className="w-4 h-4" />}
          highlight={true}
        />
        <StatsCard
          id="stat-admin-pending-certs"
          title="Pending Verification"
          value={dashboardData?.stats.pending_certificates ?? 0}
          description="Awaiting faculty action"
          icon={<Clock className="w-4 h-4" />}
        />
        <StatsCard
          id="stat-admin-pending-fac"
          title="Pending Faculty Requests"
          value={dashboardData?.stats.pending_faculty_requests ?? 0}
          description="Signups awaiting approval"
          icon={<ShieldAlert className="w-4 h-4" />}
          highlight={(dashboardData?.stats.pending_faculty_requests ?? 0) > 0}
        />
        <StatsCard
          id="stat-admin-students"
          title="Total Students"
          value={dashboardData?.stats.total_students ?? 0}
          description="Registered students"
          icon={<GraduationCap className="w-4 h-4" />}
        />
        <StatsCard
          id="stat-admin-faculty"
          title="Total Faculty"
          value={dashboardData?.stats.total_faculty ?? 0}
          description="Verified instructors"
          icon={<Users className="w-4 h-4" />}
        />
      </div>

      {/* TAB: DASHBOARD (Includes Department Breakdown Table) */}
      {currentTab === 'dashboard' && (
        <div className="space-y-6">
          {/* Department Breakdown Table */}
          <div className="bg-white rounded border border-[#E5E7EB] overflow-hidden">
            <div className="px-6 py-4 border-b border-[#E5E7EB] flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-gray-900">Department-Wise Certificate Matrix</h3>
                <p className="text-xs text-gray-500">Live submission and verification metrics by academic branch</p>
              </div>
              <span className="text-xs font-semibold text-gray-500">
                5 Academic Branches
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F9FAFB] text-gray-500 font-semibold border-b border-[#E5E7EB]">
                  <tr>
                    <th className="px-5 py-3">Academic Department</th>
                    <th className="px-4 py-3">Enrolled Students</th>
                    <th className="px-4 py-3">Total Certificates</th>
                    <th className="px-4 py-3">Verified</th>
                    <th className="px-4 py-3">Pending Review</th>
                    <th className="px-4 py-3">Approval Rate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E7EB] text-gray-700">
                  {dashboardData?.departments.map((d) => {
                    const rate = d.certificate_count > 0
                      ? Math.round((d.verified_count / d.certificate_count) * 100)
                      : 0;
                    return (
                      <tr key={d.department} className="hover:bg-gray-50/70 transition-colors">
                        <td className="px-5 py-3.5 font-bold text-gray-900 flex items-center gap-2">
                          <Building className="w-4 h-4 text-[#9D174D]" />
                          {d.department} Engineering
                        </td>
                        <td className="px-4 py-3.5 font-medium text-gray-700">{d.student_count}</td>
                        <td className="px-4 py-3.5 font-bold text-gray-900">{d.certificate_count}</td>
                        <td className="px-4 py-3.5 font-semibold text-[#9D174D]">{d.verified_count}</td>
                        <td className="px-4 py-3.5 font-semibold text-gray-600">{d.pending_count}</td>
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-2">
                            <div className="w-24 bg-gray-200 h-2 rounded-full overflow-hidden">
                              <div
                                className="bg-[#9D174D] h-full rounded-full"
                                style={{ width: `${rate}%` }}
                              />
                            </div>
                            <span className="font-semibold text-gray-800">{rate}%</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB: FACULTY REQUESTS */}
      {currentTab === 'requests' && (
        <div className="bg-white rounded border border-[#E5E7EB] overflow-hidden">
          <div className="px-6 py-4 border-b border-[#E5E7EB] flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-gray-900">Pending Faculty Access Approvals</h3>
              <p className="text-xs text-gray-500">
                Newly registered instructors awaiting Super Admin validation before gaining access
              </p>
            </div>
            <span className="text-xs font-semibold text-[#9D174D] bg-[#9D174D]/10 px-2 py-0.5 rounded">
              {facultyRequests.length} Pending
            </span>
          </div>

          {facultyRequests.length === 0 ? (
            <div className="p-12 text-center text-xs text-gray-500 space-y-2">
              <CheckCircle className="w-10 h-10 mx-auto text-green-700" />
              <p className="font-semibold text-gray-700">All faculty access requests reviewed.</p>
              <p className="text-gray-400">No pending faculty accounts require action.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F9FAFB] text-gray-500 font-semibold border-b border-[#E5E7EB]">
                  <tr>
                    <th className="px-5 py-3">Instructor Name</th>
                    <th className="px-4 py-3">Faculty ID</th>
                    <th className="px-4 py-3">Official Email</th>
                    <th className="px-4 py-3">Department</th>
                    <th className="px-4 py-3">Requested At</th>
                    <th className="px-4 py-3 text-right">Decision</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E7EB] text-gray-700">
                  {facultyRequests.map((req) => (
                    <tr key={req.id} className="hover:bg-gray-50/70 transition-colors">
                      <td className="px-5 py-3.5 font-bold text-gray-900">{req.full_name}</td>
                      <td className="px-4 py-3.5 font-mono text-[#9D174D] font-semibold">{req.faculty_id}</td>
                      <td className="px-4 py-3.5 text-gray-600">{req.email}</td>
                      <td className="px-4 py-3.5 font-semibold text-gray-900">{req.department}</td>
                      <td className="px-4 py-3.5 text-gray-500 whitespace-nowrap">
                        {new Date(req.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3.5 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-2">
                          <button
                            id={`approve-faculty-${req.id}-btn`}
                            type="button"
                            onClick={() => handleApproveFaculty(req.id)}
                            className="inline-flex items-center gap-1 px-3 py-1 bg-[#9D174D] text-white hover:bg-[#831340] rounded font-semibold text-xs transition-colors"
                          >
                            <Check className="w-3.5 h-3.5" />
                            Approve
                          </button>
                          <button
                            id={`reject-faculty-${req.id}-btn`}
                            type="button"
                            onClick={() => handleRejectFaculty(req.id)}
                            className="inline-flex items-center gap-1 px-3 py-1 bg-white border border-gray-300 text-gray-700 hover:bg-gray-100 rounded font-semibold text-xs transition-colors"
                          >
                            <X className="w-3.5 h-3.5" />
                            Reject
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB: FACULTY MANAGEMENT */}
      {currentTab === 'faculty' && (
        <div className="bg-white rounded border border-[#E5E7EB] overflow-hidden">
          <div className="px-6 py-4 border-b border-[#E5E7EB] flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-gray-900">Faculty Directory & Status</h3>
              <p className="text-xs text-gray-500">All registered institutional faculty across all branches</p>
            </div>
            <span className="text-xs font-semibold text-gray-700">{facultyList.length} Faculty Members</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F9FAFB] text-gray-500 font-semibold border-b border-[#E5E7EB]">
                <tr>
                  <th className="px-5 py-3">Faculty Name</th>
                  <th className="px-4 py-3">Employee ID</th>
                  <th className="px-4 py-3">Email Address</th>
                  <th className="px-4 py-3">Department</th>
                  <th className="px-4 py-3">Approval Status</th>
                  <th className="px-4 py-3">Approved By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E7EB] text-gray-700">
                {facultyList.map((f) => (
                  <tr key={f.id} className="hover:bg-gray-50/70 transition-colors">
                    <td className="px-5 py-3.5 font-bold text-gray-900">{f.full_name}</td>
                    <td className="px-4 py-3.5 font-mono text-[#9D174D] font-semibold">{f.faculty_id}</td>
                    <td className="px-4 py-3.5 text-gray-600">{f.email}</td>
                    <td className="px-4 py-3.5 font-semibold text-gray-900">{f.department}</td>
                    <td className="px-4 py-3.5">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold ${
                          f.approval_status === 'APPROVED'
                            ? 'bg-[#9D174D]/10 text-[#9D174D] border border-[#9D174D]/30'
                            : f.approval_status === 'REJECTED'
                            ? 'bg-red-50 text-red-700 border border-red-200'
                            : 'bg-gray-100 text-gray-700 border border-gray-300'
                        }`}
                      >
                        {f.approval_status}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-gray-500">
                      {f.approved_by_name ? `${f.approved_by_name}` : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB: STUDENT MANAGEMENT */}
      {currentTab === 'students' && (
        <div className="bg-white rounded border border-[#E5E7EB] overflow-hidden space-y-4">
          <div className="p-6 pb-2 border-b border-[#E5E7EB]">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-3">
              <div>
                <h3 className="text-sm font-bold text-gray-900">Student Directory (Institutional)</h3>
                <p className="text-xs text-gray-500">Cross-department enrolled student registry</p>
              </div>

              {/* Department Filter */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500 font-medium">Department:</span>
                <select
                  id="admin-students-dept-filter"
                  value={adminDeptFilter}
                  onChange={(e) => setAdminDeptFilter(e.target.value)}
                  className="text-xs p-1.5 border border-gray-300 rounded bg-white font-semibold text-gray-900 focus:outline-none focus:border-[#9D174D]"
                >
                  <option value="ALL">All Departments</option>
                  <option value="CSE">CSE</option>
                  <option value="ECE">ECE</option>
                  <option value="EEE">EEE</option>
                  <option value="MECH">MECH</option>
                  <option value="CIVIL">CIVIL</option>
                </select>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F9FAFB] text-gray-500 font-semibold border-b border-[#E5E7EB]">
                <tr>
                  <th className="px-5 py-3">Roll Number</th>
                  <th className="px-4 py-3">Student Name</th>
                  <th className="px-4 py-3">Department</th>
                  <th className="px-4 py-3">Year</th>
                  <th className="px-4 py-3">Section</th>
                  <th className="px-4 py-3">Email Address</th>
                  <th className="px-4 py-3">Certificates</th>
                  <th className="px-4 py-3">Verified</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E7EB] text-gray-700">
                {students.map((s) => (
                  <tr key={s.id} className="hover:bg-gray-50/70 transition-colors">
                    <td className="px-5 py-3.5 font-mono font-bold text-[#9D174D]">{s.roll_number}</td>
                    <td className="px-4 py-3.5 font-semibold text-gray-900">{s.student_name}</td>
                    <td className="px-4 py-3.5 font-semibold text-gray-900">{s.department}</td>
                    <td className="px-4 py-3.5 text-gray-600">{s.year}</td>
                    <td className="px-4 py-3.5 text-gray-600">{s.section}</td>
                    <td className="px-4 py-3.5 text-gray-500">{s.email || '—'}</td>
                    <td className="px-4 py-3.5 font-bold text-gray-900">{s.total_certificates || 0}</td>
                    <td className="px-4 py-3.5 font-bold text-[#9D174D]">{s.verified_count || 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB: CERTIFICATE MANAGEMENT */}
      {currentTab === 'certificates' && (
        <div className="bg-white rounded border border-[#E5E7EB] overflow-hidden space-y-4">
          <div className="p-6 pb-2 border-b border-[#E5E7EB]">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-3">
              <div>
                <h3 className="text-sm font-bold text-gray-900">Institutional Certificate Ledger</h3>
                <p className="text-xs text-gray-500">Cross-department view and verification audit log</p>
              </div>

              {/* Filters */}
              <div className="flex flex-wrap items-center gap-2">
                <select
                  id="admin-certs-dept-filter"
                  value={adminDeptFilter}
                  onChange={(e) => setAdminDeptFilter(e.target.value)}
                  className="text-xs p-1.5 border border-gray-300 rounded bg-white font-semibold text-gray-900 focus:outline-none focus:border-[#9D174D]"
                >
                  <option value="ALL">All Departments</option>
                  <option value="CSE">CSE</option>
                  <option value="ECE">ECE</option>
                  <option value="EEE">EEE</option>
                  <option value="MECH">MECH</option>
                  <option value="CIVIL">CIVIL</option>
                </select>

                <select
                  id="admin-certs-status-filter"
                  value={adminStatusFilter}
                  onChange={(e) => setAdminStatusFilter(e.target.value)}
                  className="text-xs p-1.5 border border-gray-300 rounded bg-white font-medium text-gray-900 focus:outline-none focus:border-[#9D174D]"
                >
                  <option value="">All Statuses</option>
                  <option value="PENDING">PENDING</option>
                  <option value="VERIFIED">VERIFIED</option>
                  <option value="UNVERIFIED">UNVERIFIED</option>
                </select>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F9FAFB] text-gray-500 font-semibold border-b border-[#E5E7EB]">
                <tr>
                  <th className="px-5 py-3">Certificate Name</th>
                  <th className="px-4 py-3">Student Recipient</th>
                  <th className="px-4 py-3">Roll Number</th>
                  <th className="px-4 py-3">Dept</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Issuing Authority</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E7EB] text-gray-700">
                {certificates.map((cert) => (
                  <tr key={cert.id} className="hover:bg-gray-50/70 transition-colors">
                    <td className="px-5 py-3.5 font-medium text-gray-900 max-w-[200px] truncate">
                      {cert.certificate_name}
                    </td>
                    <td className="px-4 py-3.5 font-semibold text-gray-900">{cert.student_name}</td>
                    <td className="px-4 py-3.5 font-mono text-[#9D174D] font-semibold whitespace-nowrap">
                      {cert.student_roll_number}
                    </td>
                    <td className="px-4 py-3.5 font-semibold text-gray-900">{cert.student_department}</td>
                    <td className="px-4 py-3.5 text-gray-600">{cert.certificate_type}</td>
                    <td className="px-4 py-3.5 max-w-[150px] truncate text-gray-600">{cert.organization}</td>
                    <td className="px-4 py-3.5 whitespace-nowrap">{getStatusBadge(cert.verification_status)}</td>
                    <td className="px-4 py-3.5 text-right whitespace-nowrap">
                      <button
                        id={`admin-view-cert-${cert.id}-btn`}
                        type="button"
                        onClick={() => setSelectedCert(cert)}
                        className="inline-flex items-center gap-1 px-3 py-1 bg-white border border-[#9D174D] text-[#9D174D] hover:bg-[#9D174D]/5 rounded font-semibold text-xs transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        Audit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB: DEPARTMENTS */}
      {currentTab === 'departments' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {dashboardData?.departments.map((dep) => (
            <div key={dep.department} className="bg-white rounded border border-[#E5E7EB] p-5 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#E5E7EB]">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded bg-[#9D174D]/10 text-[#9D174D] flex items-center justify-center font-bold text-xs">
                    {dep.department}
                  </div>
                  <h4 className="font-bold text-gray-900">{dep.department} Department</h4>
                </div>
                <span className="text-[11px] font-semibold text-gray-500">{dep.student_count} Enrolled</span>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-gray-100">
                  <span className="text-gray-600">Total Submitted Certificates:</span>
                  <span className="font-bold text-gray-900">{dep.certificate_count}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-gray-100">
                  <span className="text-gray-600">Verified by Faculty:</span>
                  <span className="font-semibold text-[#9D174D]">{dep.verified_count}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-gray-600">Pending Review:</span>
                  <span className="font-semibold text-gray-700">{dep.pending_count}</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setAdminDeptFilter(dep.department);
                  onNavigateTab('certificates');
                }}
                className="w-full py-1.5 text-xs font-semibold text-[#9D174D] bg-[#9D174D]/5 hover:bg-[#9D174D]/10 rounded border border-[#9D174D]/20 transition-colors"
              >
                Inspect {dep.department} Certificates →
              </button>
            </div>
          ))}
        </div>
      )}

      {/* TAB: EXCEL EXPORT */}
      {currentTab === 'export' && (
        <div className="bg-white rounded border border-[#E5E7EB] p-8 max-w-2xl mx-auto text-center space-y-5">
          <div className="w-14 h-14 rounded-full bg-[#9D174D]/10 text-[#9D174D] flex items-center justify-center mx-auto">
            <FileSpreadsheet className="w-7 h-7" />
          </div>
          <h3 className="text-lg font-bold text-gray-900">
            Export Institutional Certificate Master Spreadsheet
          </h3>
          <p className="text-xs text-gray-600 max-w-md mx-auto leading-relaxed">
            Generate an openpyxl-compatible formatted Excel report. Super Administrator permissions allow exporting either the entire college database or isolating a specific department branch.
          </p>

          <div className="max-w-xs mx-auto text-left">
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Select Scope for Excel Export:
            </label>
            <select
              id="admin-export-scope-select"
              value={exportDept}
              onChange={(e) => setExportDept(e.target.value)}
              className="w-full text-xs p-2 border border-gray-300 rounded bg-white font-medium text-gray-900 focus:outline-none focus:border-[#9D174D]"
            >
              <option value="ALL">All Departments (College-Wide Master)</option>
              <option value="CSE">Computer Science & Engineering (CSE)</option>
              <option value="ECE">Electronics & Communication (ECE)</option>
              <option value="EEE">Electrical & Electronics (EEE)</option>
              <option value="MECH">Mechanical Engineering (MECH)</option>
              <option value="CIVIL">Civil Engineering (CIVIL)</option>
            </select>
          </div>

          <button
            id="admin-download-excel-btn"
            type="button"
            onClick={handleExportExcel}
            disabled={exportLoading}
            className="inline-flex items-center gap-2 px-6 py-2.5 text-xs font-semibold text-white bg-[#9D174D] hover:bg-[#831340] rounded shadow-sm transition-colors disabled:opacity-50"
          >
            <FileSpreadsheet className="w-4 h-4" />
            {exportLoading ? 'Compiling Master Spreadsheet...' : `Download Excel (${exportDept})`}
          </button>
        </div>
      )}

      {/* Certificate Modal */}
      {selectedCert && (
        <CertificateModal
          certificate={selectedCert}
          onClose={() => setSelectedCert(null)}
          onStatusUpdated={fetchAdminData}
        />
      )}
    </div>
  );
};
