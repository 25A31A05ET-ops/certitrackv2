import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { CertificateRecord } from '../types';
import { StatsCard } from '../components/StatsCard';
import { CertificateModal } from '../components/CertificateModal';
import { UploadCertificateModal } from '../components/UploadCertificateModal';
import {
  UploadCloud,
  FileCheck2,
  Clock,
  CheckCircle,
  AlertCircle,
  Eye,
  User,
  Building,
  GraduationCap,
  Calendar,
  Layers,
} from 'lucide-react';

interface StudentDashboardProps {
  currentTab: string;
  onNavigateTab: (tab: string) => void;
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({
  currentTab,
  onNavigateTab,
}) => {
  const { user } = useAuth();

  const [stats, setStats] = useState({
    total_submitted: 0,
    pending_count: 0,
    verified_count: 0,
    unverified_count: 0,
  });
  const [submissions, setSubmissions] = useState<CertificateRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modals
  const [selectedCert, setSelectedCert] = useState<CertificateRecord | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const [profileRes, subRes] = await Promise.all([
        api.getStudentProfile(),
        api.getStudentSubmissions(),
      ]);
      setStats(profileRes.stats);
      setSubmissions(subRes.certificates);
    } catch (err: any) {
      setError(err.message || 'Failed to load student data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

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
      {/* Welcome Banner */}
      <div className="bg-white p-6 rounded border border-[#E5E7EB] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] uppercase font-bold text-[#9D174D] tracking-wider bg-[#9D174D]/10 px-2 py-0.5 rounded">
            Student Portal
          </span>
          <h2 className="text-xl font-bold tracking-tight text-gray-900 mt-1">
            Welcome back, {user?.full_name}
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Roll Number: <span className="font-mono font-semibold text-gray-900">{user?.roll_number}</span> • Department of {user?.department} • {user?.year} (Sec {user?.section})
          </p>
        </div>

        <button
          id="student-quick-upload-btn"
          type="button"
          onClick={() => setShowUploadModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-[#9D174D] hover:bg-[#831340] rounded shadow-sm transition-colors shrink-0"
        >
          <UploadCloud className="w-4 h-4" />
          Upload Certificate
        </button>
      </div>

      {error && (
        <div className="p-3 text-xs text-red-800 bg-red-50 border border-red-200 rounded">
          {error}
        </div>
      )}

      {/* 4 Dashboard Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          id="stat-my-uploaded"
          title="My Uploaded Certificates"
          value={stats.total_submitted}
          description="Total submissions under account"
          icon={<FileCheck2 className="w-4 h-4" />}
          highlight={true}
        />
        <StatsCard
          id="stat-pending"
          title="Pending Verification"
          value={stats.pending_count}
          description="Awaiting faculty review"
          icon={<Clock className="w-4 h-4" />}
        />
        <StatsCard
          id="stat-verified"
          title="Verified Certificates"
          value={stats.verified_count}
          description="Approved by department faculty"
          icon={<CheckCircle className="w-4 h-4" />}
        />
        <StatsCard
          id="stat-unverified"
          title="Unverified / Rejected"
          value={stats.unverified_count}
          description="Require corrections or review"
          icon={<AlertCircle className="w-4 h-4" />}
        />
      </div>

      {/* VIEW: DASHBOARD or SUBMISSIONS */}
      {(currentTab === 'dashboard' || currentTab === 'submissions') && (
        <div className="bg-white rounded border border-[#E5E7EB] overflow-hidden">
          <div className="px-6 py-4 border-b border-[#E5E7EB] flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-gray-900">
                {currentTab === 'submissions' ? 'My Certificate Submissions' : 'Recent Certificate Submissions'}
              </h3>
              <p className="text-xs text-gray-500">
                Certificates submitted through your account (personal & peer uploads)
              </p>
            </div>
            <span className="text-xs text-gray-500 font-medium">
              {submissions.length} Record{submissions.length === 1 ? '' : 's'}
            </span>
          </div>

          {loading ? (
            <div className="p-8 text-center text-xs text-gray-500">Loading certificate records...</div>
          ) : submissions.length === 0 ? (
            <div className="p-12 text-center text-xs text-gray-500 space-y-3">
              <FileCheck2 className="w-10 h-10 mx-auto text-gray-300" />
              <p className="font-semibold text-gray-700">No certificates uploaded yet.</p>
              <p className="text-gray-400">Click below to upload your first certificate or one for a classmate.</p>
              <button
                type="button"
                onClick={() => setShowUploadModal(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#9D174D] text-white rounded text-xs font-medium"
              >
                <UploadCloud className="w-3.5 h-3.5" />
                Upload Certificate
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F9FAFB] text-gray-500 font-semibold border-b border-[#E5E7EB]">
                  <tr>
                    <th className="px-5 py-3">Certificate Name</th>
                    <th className="px-4 py-3">Certificate Owner</th>
                    <th className="px-4 py-3">Type</th>
                    <th className="px-4 py-3">Organization</th>
                    <th className="px-4 py-3">Issue Date</th>
                    <th className="px-4 py-3">Uploaded On</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Remarks</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E7EB] text-gray-700">
                  {submissions.map((cert) => {
                    const isOwn = cert.student_roll_number === user?.roll_number;
                    return (
                      <tr key={cert.id} className="hover:bg-gray-50/70 transition-colors">
                        <td className="px-5 py-3.5 font-medium text-gray-900 max-w-[200px] truncate">
                          {cert.certificate_name}
                        </td>
                        <td className="px-4 py-3.5">
                          <span className="font-semibold text-gray-900 block truncate">
                            {cert.student_name || 'Classmate'}
                          </span>
                          <span className="font-mono text-[11px] text-gray-500">
                            {cert.student_roll_number} {isOwn ? '(You)' : '(Classmate)'}
                          </span>
                        </td>
                        <td className="px-4 py-3.5">
                          <span className="text-gray-600">{cert.certificate_type}</span>
                        </td>
                        <td className="px-4 py-3.5 text-gray-600 max-w-[150px] truncate">
                          {cert.organization}
                        </td>
                        <td className="px-4 py-3.5 text-gray-600 whitespace-nowrap">
                          {cert.issue_date}
                        </td>
                        <td className="px-4 py-3.5 text-gray-500 whitespace-nowrap">
                          {cert.uploaded_at ? new Date(cert.uploaded_at).toLocaleDateString() : 'N/A'}
                        </td>
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          {getStatusBadge(cert.verification_status)}
                        </td>
                        <td className="px-4 py-3.5 max-w-[180px] truncate text-gray-500">
                          {cert.verification_notes || '—'}
                        </td>
                        <td className="px-4 py-3.5 text-right whitespace-nowrap">
                          <button
                            id={`view-cert-${cert.id}-btn`}
                            type="button"
                            onClick={() => setSelectedCert(cert)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-[#9D174D] hover:bg-[#9D174D]/5 border border-[#9D174D] rounded"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            View
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* VIEW: PROFILE */}
      {currentTab === 'profile' && (
        <div className="bg-white rounded border border-[#E5E7EB] p-6 space-y-6">
          <div>
            <h3 className="text-base font-bold text-gray-900">Student Profile & Academic Record</h3>
            <p className="text-xs text-gray-500">
              Verified student record maintained in the college institutional database
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4 bg-[#F9FAFB] p-5 rounded border border-[#E5E7EB] text-xs">
              <h4 className="font-bold text-gray-900 uppercase tracking-wider text-[11px] pb-2 border-b border-gray-200">
                Institutional Details
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-gray-500 block">Full Name</span>
                  <span className="font-semibold text-gray-900 text-sm">{user?.full_name}</span>
                </div>
                <div>
                  <span className="text-gray-500 block">Roll Number</span>
                  <span className="font-mono font-bold text-[#9D174D] text-sm">{user?.roll_number}</span>
                </div>
                <div>
                  <span className="text-gray-500 block">Department</span>
                  <span className="font-semibold text-gray-900">{user?.department}</span>
                </div>
                <div>
                  <span className="text-gray-500 block">Year & Section</span>
                  <span className="font-semibold text-gray-900">{user?.year} (Sec {user?.section})</span>
                </div>
                <div className="col-span-2">
                  <span className="text-gray-500 block">College Email</span>
                  <span className="font-medium text-gray-900">{user?.email}</span>
                </div>
              </div>
            </div>

            <div className="space-y-4 bg-[#F9FAFB] p-5 rounded border border-[#E5E7EB] text-xs">
              <h4 className="font-bold text-gray-900 uppercase tracking-wider text-[11px] pb-2 border-b border-gray-200">
                Submissions & Verification Status
              </h4>
              <div className="space-y-3">
                <div className="flex justify-between items-center py-1.5 border-b border-gray-200">
                  <span className="text-gray-600">Total Uploaded Documents:</span>
                  <span className="font-bold text-gray-900">{stats.total_submitted}</span>
                </div>
                <div className="flex justify-between items-center py-1.5 border-b border-gray-200">
                  <span className="text-gray-600">Pending Review:</span>
                  <span className="font-semibold text-gray-700">{stats.pending_count}</span>
                </div>
                <div className="flex justify-between items-center py-1.5 border-b border-gray-200">
                  <span className="text-gray-600">Verified by Faculty:</span>
                  <span className="font-bold text-[#9D174D]">{stats.verified_count}</span>
                </div>
                <div className="flex justify-between items-center py-1.5">
                  <span className="text-gray-600">Unverified / Action Needed:</span>
                  <span className="font-semibold text-gray-900">{stats.unverified_count}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Certificate Preview Modal */}
      {selectedCert && (
        <CertificateModal
          certificate={selectedCert}
          onClose={() => setSelectedCert(null)}
          onStatusUpdated={fetchData}
        />
      )}

      {/* Upload Certificate Modal */}
      {showUploadModal && (
        <UploadCertificateModal
          onClose={() => setShowUploadModal(false)}
          onSuccess={fetchData}
        />
      )}
    </div>
  );
};
