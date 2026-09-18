import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { CertificateRecord, FacultyDashboardData, StudentRecord } from '../types';
import { StatsCard } from '../components/StatsCard';
import { CertificateModal } from '../components/CertificateModal';
import {
  FileCheck2,
  Clock,
  CheckCircle,
  AlertCircle,
  GraduationCap,
  Search,
  FileSpreadsheet,
  Eye,
  Filter,
  ShieldCheck,
  Building2,
  RefreshCw,
} from 'lucide-react';

interface FacultyDashboardProps {
  currentTab: string;
  onNavigateTab: (tab: string) => void;
}

export const FacultyDashboard: React.FC<FacultyDashboardProps> = ({
  currentTab,
  onNavigateTab,
}) => {
  const { user } = useAuth();
  const dept = user?.department || 'CSE';

  const [dashboardData, setDashboardData] = useState<FacultyDashboardData | null>(null);
  const [certificates, setCertificates] = useState<CertificateRecord[]>([]);
  const [students, setStudents] = useState<StudentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [exportLoading, setExportLoading] = useState(false);

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [filterYear, setFilterYear] = useState('');
  const [filterSection, setFilterSection] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');

  // Modals
  const [selectedCert, setSelectedCert] = useState<CertificateRecord | null>(null);

  const fetchFacultyData = async () => {
    setLoading(true);
    setError('');
    try {
      const [dashRes, certsRes, studsRes] = await Promise.all([
        api.getFacultyDashboard(),
        api.getFacultyCertificates({
          search: searchTerm,
          year: filterYear,
          section: filterSection,
          certificate_type: filterType,
          verification_status: filterStatus,
          date_from: filterDateFrom,
          date_to: filterDateTo,
        }),
        api.getFacultyStudents(),
      ]);

      setDashboardData(dashRes);
      setCertificates(certsRes.certificates);
      setStudents(studsRes.students);
    } catch (err: any) {
      setError(err.message || 'Failed to load faculty records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFacultyData();
  }, [searchTerm, filterYear, filterSection, filterType, filterStatus, filterDateFrom, filterDateTo]);

  const handleExportExcel = async () => {
    setExportLoading(true);
    try {
      await api.downloadFacultyExcel();
    } catch (err: any) {
      setError(err.message || 'Failed to export department Excel.');
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
      {/* Faculty Portal Banner with Department Security Confirmation */}
      <div className="bg-white p-6 rounded border border-[#E5E7EB] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase font-bold text-[#9D174D] tracking-wider bg-[#9D174D]/10 px-2 py-0.5 rounded">
              Faculty Portal
            </span>
            <span className="inline-flex items-center gap-1 text-[10px] font-mono font-semibold text-[#111827] bg-gray-100 px-2 py-0.5 rounded border border-gray-200">
              <ShieldCheck className="w-3 h-3 text-[#9D174D]" />
              DEPARTMENT SECURITY: {dept} ONLY
            </span>
          </div>
          <h2 className="text-xl font-bold tracking-tight text-gray-900 mt-1.5">
            {user?.full_name} • Department of {dept}
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Employee ID: <span className="font-mono font-medium">{user?.faculty_id}</span> • Authorized for {dept} verification and evaluation
          </p>
        </div>

        {/* Quick Actions */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            id="faculty-review-certs-btn"
            type="button"
            onClick={() => onNavigateTab('certificates')}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-[#9D174D] hover:bg-[#831340] rounded shadow-sm transition-colors"
          >
            <FileCheck2 className="w-4 h-4" />
            Review Certificates
          </button>
          <button
            id="faculty-search-btn"
            type="button"
            onClick={() => onNavigateTab('search')}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded transition-colors"
          >
            <Search className="w-4 h-4" />
            Search
          </button>
          <button
            id="faculty-export-excel-btn"
            type="button"
            onClick={handleExportExcel}
            disabled={exportLoading}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-[#9D174D] bg-white border border-[#9D174D] hover:bg-[#9D174D]/5 rounded transition-colors disabled:opacity-50"
          >
            <FileSpreadsheet className="w-4 h-4" />
            {exportLoading ? 'Exporting...' : 'Export Excel'}
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3 text-xs text-red-800 bg-red-50 border border-red-200 rounded">
          {error}
        </div>
      )}

      {/* 5 Faculty Department Statistics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatsCard
          id="stat-faculty-total"
          title={`Total ${dept} Certificates`}
          value={dashboardData?.stats.total_certificates ?? 0}
          description="Total student certificates in dept"
          icon={<FileCheck2 className="w-4 h-4" />}
          highlight={true}
        />
        <StatsCard
          id="stat-faculty-pending"
          title="Pending Verification"
          value={dashboardData?.stats.pending_certificates ?? 0}
          description="Awaiting your verification"
          icon={<Clock className="w-4 h-4" />}
        />
        <StatsCard
          id="stat-faculty-verified"
          title="Verified Certificates"
          value={dashboardData?.stats.verified_certificates ?? 0}
          description="Approved documents"
          icon={<CheckCircle className="w-4 h-4" />}
        />
        <StatsCard
          id="stat-faculty-unverified"
          title="Unverified / Rejected"
          value={dashboardData?.stats.unverified_certificates ?? 0}
          description="Ineligible or flagged"
          icon={<AlertCircle className="w-4 h-4" />}
        />
        <StatsCard
          id="stat-faculty-students"
          title={`Enrolled Students`}
          value={dashboardData?.stats.total_students ?? 0}
          description={`Students in ${dept}`}
          icon={<GraduationCap className="w-4 h-4" />}
        />
      </div>

      {/* TAB: DASHBOARD (Overview & Recent Pending) */}
      {currentTab === 'dashboard' && (
        <div className="space-y-6">
          <div className="bg-white rounded border border-[#E5E7EB] overflow-hidden">
            <div className="px-6 py-4 border-b border-[#E5E7EB] flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-gray-900">
                  Pending Verification Queue ({dept})
                </h3>
                <p className="text-xs text-gray-500">
                  Newly submitted certificates requiring faculty approval
                </p>
              </div>
              <button
                type="button"
                onClick={() => onNavigateTab('certificates')}
                className="text-xs font-semibold text-[#9D174D] hover:underline"
              >
                View All Certificates →
              </button>
            </div>

            {loading ? (
              <div className="p-8 text-center text-xs text-gray-500">Loading queue...</div>
            ) : dashboardData?.recent_pending.length === 0 ? (
              <div className="p-8 text-center text-xs text-gray-500">
                <CheckCircle className="w-8 h-8 mx-auto text-[#9D174D] mb-2" />
                All {dept} certificates are currently verified. No pending items in queue.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#F9FAFB] text-gray-500 font-semibold border-b border-[#E5E7EB]">
                    <tr>
                      <th className="px-5 py-3">Certificate</th>
                      <th className="px-4 py-3">Student Recipient</th>
                      <th className="px-4 py-3">Class</th>
                      <th className="px-4 py-3">Issuing Authority</th>
                      <th className="px-4 py-3">Uploaded By</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3 text-right">Review Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E5E7EB] text-gray-700">
                    {dashboardData?.recent_pending.map((c) => (
                      <tr key={c.id} className="hover:bg-gray-50/70 transition-colors">
                        <td className="px-5 py-3 font-medium text-gray-900">
                          {c.certificate_name}
                          <span className="block text-[11px] text-gray-400">{c.certificate_type}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-semibold text-gray-900 block">{c.student_name}</span>
                          <span className="font-mono text-gray-500 text-[11px]">{c.student_roll_number}</span>
                        </td>
                        <td className="px-4 py-3 text-gray-600">
                          {c.student_year} ({c.student_section})
                        </td>
                        <td className="px-4 py-3 text-gray-600">{c.organization}</td>
                        <td className="px-4 py-3 text-gray-600">{c.uploaded_by_name}</td>
                        <td className="px-4 py-3">{getStatusBadge('PENDING')}</td>
                        <td className="px-4 py-3 text-right">
                          <button
                            id={`review-pending-${c.id}-btn`}
                            type="button"
                            onClick={() => setSelectedCert(c)}
                            className="inline-flex items-center gap-1 px-3 py-1 bg-[#9D174D] text-white hover:bg-[#831340] rounded text-xs font-semibold"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            Review
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB: ALL CERTIFICATES or SEARCH */}
      {(currentTab === 'certificates' || currentTab === 'search') && (
        <div className="bg-white rounded border border-[#E5E7EB] overflow-hidden space-y-4">
          <div className="p-6 pb-2 border-b border-[#E5E7EB]">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4">
              <div>
                <h3 className="text-base font-bold text-gray-900">
                  {dept} Department Certificates
                </h3>
                <p className="text-xs text-gray-500">
                  Complete ledger of certificate documents for {dept} students
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-gray-500">
                  {certificates.length} Certificate{certificates.length === 1 ? '' : 's'} Found
                </span>
                <button
                  id="faculty-refresh-btn"
                  type="button"
                  onClick={fetchFacultyData}
                  className="p-1.5 text-gray-600 hover:text-gray-900 border border-gray-200 rounded"
                  title="Refresh records"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Filter Controls */}
            <div className="bg-[#F9FAFB] p-4 rounded border border-[#E5E7EB] space-y-3 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                {/* Search Term */}
                <div className="col-span-1 sm:col-span-2">
                  <label className="block text-gray-600 font-medium mb-1">
                    Search Student / Roll / Certificate / Organization
                  </label>
                  <div className="relative">
                    <input
                      id="faculty-search-input"
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="e.g. Aarav, 22CSE045, Hackathon, Coursera..."
                      className="w-full pl-8 pr-3 py-1.5 border border-gray-300 rounded bg-white text-gray-900 focus:outline-none focus:border-[#9D174D]"
                    />
                    <Search className="w-4 h-4 text-gray-400 absolute left-2.5 top-2" />
                  </div>
                </div>

                {/* Verification Status */}
                <div>
                  <label className="block text-gray-600 font-medium mb-1">Verification Status</label>
                  <select
                    id="faculty-filter-status"
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="w-full p-1.5 border border-gray-300 rounded bg-white text-gray-900 focus:outline-none focus:border-[#9D174D]"
                  >
                    <option value="">All Statuses</option>
                    <option value="PENDING">PENDING</option>
                    <option value="VERIFIED">VERIFIED</option>
                    <option value="UNVERIFIED">UNVERIFIED</option>
                  </select>
                </div>

                {/* Certificate Type */}
                <div>
                  <label className="block text-gray-600 font-medium mb-1">Certificate Type</label>
                  <select
                    id="faculty-filter-type"
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    className="w-full p-1.5 border border-gray-300 rounded bg-white text-gray-900 focus:outline-none focus:border-[#9D174D]"
                  >
                    <option value="">All Types</option>
                    <option value="Internship">Internship</option>
                    <option value="Hackathon">Hackathon</option>
                    <option value="Participation">Participation</option>
                    <option value="Course Completion">Course Completion</option>
                    <option value="Award">Award</option>
                    <option value="Workshop">Workshop</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-gray-200">
                {/* Year */}
                <div>
                  <label className="block text-gray-600 font-medium mb-1">Year</label>
                  <select
                    id="faculty-filter-year"
                    value={filterYear}
                    onChange={(e) => setFilterYear(e.target.value)}
                    className="w-full p-1.5 border border-gray-300 rounded bg-white text-gray-900 focus:outline-none focus:border-[#9D174D]"
                  >
                    <option value="">All Years</option>
                    <option value="1st Year">1st Year</option>
                    <option value="2nd Year">2nd Year</option>
                    <option value="3rd Year">3rd Year</option>
                    <option value="4th Year">4th Year</option>
                  </select>
                </div>

                {/* Section */}
                <div>
                  <label className="block text-gray-600 font-medium mb-1">Section</label>
                  <select
                    id="faculty-filter-section"
                    value={filterSection}
                    onChange={(e) => setFilterSection(e.target.value)}
                    className="w-full p-1.5 border border-gray-300 rounded bg-white text-gray-900 focus:outline-none focus:border-[#9D174D]"
                  >
                    <option value="">All Sections</option>
                    <option value="A">Section A</option>
                    <option value="B">Section B</option>
                    <option value="C">Section C</option>
                  </select>
                </div>

                {/* Department (Locked) */}
                <div>
                  <label className="block text-gray-600 font-medium mb-1">Department</label>
                  <input
                    type="text"
                    disabled
                    value={`${dept} (Locked)`}
                    className="w-full p-1.5 border border-gray-200 bg-gray-100 text-gray-500 rounded font-semibold"
                  />
                </div>

                {/* Clear filters button */}
                <div className="flex items-end">
                  <button
                    type="button"
                    onClick={() => {
                      setSearchTerm('');
                      setFilterYear('');
                      setFilterSection('');
                      setFilterType('');
                      setFilterStatus('');
                      setFilterDateFrom('');
                      setFilterDateTo('');
                    }}
                    className="w-full py-1.5 px-3 bg-white border border-gray-300 text-gray-600 hover:bg-gray-50 rounded font-medium text-xs"
                  >
                    Reset Filters
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Certificates Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F9FAFB] text-gray-500 font-semibold border-b border-[#E5E7EB]">
                <tr>
                  <th className="px-5 py-3">Certificate Name</th>
                  <th className="px-4 py-3">Student Name</th>
                  <th className="px-4 py-3">Roll Number</th>
                  <th className="px-4 py-3">Class</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Authority</th>
                  <th className="px-4 py-3">Uploaded By</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E7EB] text-gray-700">
                {certificates.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-5 py-8 text-center text-gray-500">
                      No certificates match the specified filter criteria.
                    </td>
                  </tr>
                ) : (
                  certificates.map((cert) => (
                    <tr key={cert.id} className="hover:bg-gray-50/70 transition-colors">
                      <td className="px-5 py-3 font-medium text-gray-900 max-w-[200px] truncate">
                        {cert.certificate_name}
                      </td>
                      <td className="px-4 py-3 font-semibold text-gray-900">
                        {cert.student_name}
                      </td>
                      <td className="px-4 py-3 font-mono text-[#9D174D] font-semibold whitespace-nowrap">
                        {cert.student_roll_number}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-gray-600">
                        {cert.student_year} ({cert.student_section})
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-gray-600">
                        {cert.certificate_type}
                      </td>
                      <td className="px-4 py-3 max-w-[150px] truncate text-gray-600">
                        {cert.organization}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-gray-500">
                        {cert.uploaded_by_name}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {getStatusBadge(cert.verification_status)}
                      </td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <button
                          id={`faculty-view-cert-${cert.id}-btn`}
                          type="button"
                          onClick={() => setSelectedCert(cert)}
                          className="inline-flex items-center gap-1 px-3 py-1 bg-white border border-[#9D174D] text-[#9D174D] hover:bg-[#9D174D]/5 rounded font-semibold text-xs transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          Review & Verify
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB: STUDENTS DIRECTORY */}
      {currentTab === 'students' && (
        <div className="bg-white rounded border border-[#E5E7EB] overflow-hidden">
          <div className="px-6 py-4 border-b border-[#E5E7EB] flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-gray-900">
                {dept} Department Student Directory
              </h3>
              <p className="text-xs text-gray-500">
                Registered and enrolled students under {dept} department
              </p>
            </div>
            <span className="text-xs font-semibold text-gray-700">
              {students.length} Students
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F9FAFB] text-gray-500 font-semibold border-b border-[#E5E7EB]">
                <tr>
                  <th className="px-5 py-3">Roll Number</th>
                  <th className="px-4 py-3">Student Name</th>
                  <th className="px-4 py-3">Email Address</th>
                  <th className="px-4 py-3">Year</th>
                  <th className="px-4 py-3">Section</th>
                  <th className="px-4 py-3">Total Certificates</th>
                  <th className="px-4 py-3">Verified Count</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E7EB] text-gray-700">
                {students.map((st) => (
                  <tr key={st.id} className="hover:bg-gray-50/70 transition-colors">
                    <td className="px-5 py-3 font-mono font-bold text-[#9D174D]">
                      {st.roll_number}
                    </td>
                    <td className="px-4 py-3 font-semibold text-gray-900">
                      {st.student_name}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {st.email || '—'}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{st.year}</td>
                    <td className="px-4 py-3 text-gray-600">{st.section}</td>
                    <td className="px-4 py-3 font-semibold text-gray-900">
                      {st.total_certificates || 0}
                    </td>
                    <td className="px-4 py-3 font-semibold text-[#9D174D]">
                      {st.verified_count || 0}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB: EXCEL EXPORT */}
      {currentTab === 'export' && (
        <div className="bg-white rounded border border-[#E5E7EB] p-8 max-w-2xl mx-auto text-center space-y-4">
          <div className="w-14 h-14 rounded-full bg-[#9D174D]/10 text-[#9D174D] flex items-center justify-center mx-auto">
            <FileSpreadsheet className="w-7 h-7" />
          </div>
          <h3 className="text-lg font-bold text-gray-900">
            Export {dept} Certificates to Excel (.xlsx)
          </h3>
          <p className="text-xs text-gray-600 leading-relaxed max-w-md mx-auto">
            Generate an official openpyxl-compatible formatted spreadsheet containing all student certificate records, verification audit logs, and document references belonging exclusively to your department ({dept}).
          </p>

          <div className="p-4 bg-[#F9FAFB] border border-[#E5E7EB] rounded text-left text-xs text-gray-600 space-y-1 max-w-md mx-auto font-mono">
            <p className="font-sans font-bold text-gray-800 mb-1">Standard Spreadsheet Columns:</p>
            <p>1. Certificate ID &nbsp; 2. Student Name</p>
            <p>3. Roll Number &nbsp;&nbsp;&nbsp;&nbsp; 4. Department ({dept})</p>
            <p>5. Year &amp; Section &nbsp;&nbsp; 6. Issuing Authority</p>
            <p>7. Verification Status &amp; Notes</p>
          </div>

          <button
            id="faculty-download-excel-action-btn"
            type="button"
            onClick={handleExportExcel}
            disabled={exportLoading}
            className="inline-flex items-center gap-2 px-6 py-2.5 text-xs font-semibold text-white bg-[#9D174D] hover:bg-[#831340] rounded shadow-sm transition-colors disabled:opacity-50"
          >
            <FileSpreadsheet className="w-4 h-4" />
            {exportLoading ? 'Compiling Excel...' : `Download ${dept} Excel Report`}
          </button>
        </div>
      )}

      {/* Certificate Modal */}
      {selectedCert && (
        <CertificateModal
          certificate={selectedCert}
          onClose={() => setSelectedCert(null)}
          onStatusUpdated={fetchFacultyData}
        />
      )}
    </div>
  );
};
