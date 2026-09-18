import React, { useState } from 'react';
import { CertificateRecord } from '../types';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { X, Download, ExternalLink, CheckCircle, AlertCircle, Clock, FileText, UserCheck } from 'lucide-react';

interface CertificateModalProps {
  certificate: CertificateRecord | null;
  onClose: () => void;
  onStatusUpdated?: () => void;
}

export const CertificateModal: React.FC<CertificateModalProps> = ({
  certificate,
  onClose,
  onStatusUpdated,
}) => {
  const { user } = useAuth();
  const [verifying, setVerifying] = useState(false);
  const [newStatus, setNewStatus] = useState<'VERIFIED' | 'UNVERIFIED'>('VERIFIED');
  const [verificationNotes, setVerificationNotes] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  if (!certificate) return null;

  const canVerify =
    (user?.role === 'SUPER_ADMIN') ||
    (user?.role === 'FACULTY' && user?.department === certificate.student_department);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setVerifying(true);

    try {
      await api.verifyCertificate(certificate.id, newStatus, verificationNotes);
      setSuccessMsg(`Certificate successfully marked as ${newStatus}.`);
      if (onStatusUpdated) onStatusUpdated();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update certificate verification status.');
    } finally {
      setVerifying(false);
    }
  };

  const getStatusBadge = (status: string) => {
    if (status === 'VERIFIED') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-[#9D174D] border border-[#9D174D] bg-[#9D174D]/5 rounded">
          <CheckCircle className="w-3.5 h-3.5" />
          VERIFIED
        </span>
      );
    }
    if (status === 'UNVERIFIED') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-[#111827] border border-[#111827] bg-[#F3F4F6] rounded">
          <AlertCircle className="w-3.5 h-3.5" />
          UNVERIFIED
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-gray-700 border border-gray-300 bg-white rounded">
        <Clock className="w-3.5 h-3.5" />
        PENDING
      </span>
    );
  };

  const fileUrl = api.getCertificateFileUrl(certificate.id);
  const downloadUrl = api.getCertificateFileUrl(certificate.id, true);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col border border-[#E5E7EB] my-8">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#E5E7EB] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-[#9D174D]/10 text-[#9D174D] flex items-center justify-center font-bold">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#111827]">
                {certificate.certificate_name}
              </h3>
              <p className="text-xs text-gray-500">
                Issued by {certificate.organization} • {certificate.certificate_type}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {getStatusBadge(certificate.verification_status)}
            <button
              id="close-cert-modal-btn"
              type="button"
              onClick={onClose}
              className="text-gray-400 hover:text-gray-700 p-1.5 rounded hover:bg-gray-100"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Metadata Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 bg-[#F9FAFB] p-4 rounded border border-[#E5E7EB] text-xs">
            <div>
              <span className="text-gray-500 block font-medium">Student Recipient</span>
              <span className="font-semibold text-gray-900">{certificate.student_name || 'Classmate'}</span>
            </div>
            <div>
              <span className="text-gray-500 block font-medium">Roll Number</span>
              <span className="font-mono font-semibold text-[#9D174D]">{certificate.student_roll_number}</span>
            </div>
            <div>
              <span className="text-gray-500 block font-medium">Department / Class</span>
              <span className="font-medium text-gray-900">
                {certificate.student_department} • {certificate.student_year} ({certificate.student_section})
              </span>
            </div>
            <div>
              <span className="text-gray-500 block font-medium">Issue Date</span>
              <span className="font-medium text-gray-900">{certificate.issue_date}</span>
            </div>
            <div>
              <span className="text-gray-500 block font-medium">Uploaded By</span>
              <span className="font-medium text-gray-900">{certificate.uploaded_by_name || 'Student'}</span>
            </div>
            <div>
              <span className="text-gray-500 block font-medium">Submission Timestamp</span>
              <span className="font-medium text-gray-700">
                {certificate.uploaded_at ? new Date(certificate.uploaded_at).toLocaleDateString() : 'N/A'}
              </span>
            </div>
          </div>

          {/* Verification Audit Note */}
          {certificate.verification_notes && (
            <div className="p-3 bg-white border border-[#E5E7EB] rounded text-xs">
              <span className="font-semibold text-gray-900 block mb-0.5">Verification Remarks:</span>
              <p className="text-gray-700">{certificate.verification_notes}</p>
              {certificate.verified_by_name && (
                <p className="text-[11px] text-gray-400 mt-1">
                  Verified by: {certificate.verified_by_name} on {new Date(certificate.verified_at || '').toLocaleDateString()}
                </p>
              )}
            </div>
          )}

          {/* Certificate Document Preview */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Document Preview ({certificate.file_name})
              </span>
              <div className="flex items-center gap-2">
                <a
                  id="preview-external-link"
                  href={fileUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-[#9D174D] hover:underline"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Open in New Tab
                </a>
                <a
                  id="download-cert-btn"
                  href={downloadUrl}
                  download={certificate.file_name}
                  className="inline-flex items-center gap-1 px-3 py-1 bg-white border border-[#9D174D] text-[#9D174D] hover:bg-[#9D174D]/5 text-xs font-semibold rounded"
                >
                  <Download className="w-3.5 h-3.5" />
                  Download File
                </a>
              </div>
            </div>

            <div className="border border-[#E5E7EB] rounded bg-gray-50 overflow-hidden min-h-[350px] max-h-[480px] flex items-center justify-center">
              <iframe
                src={fileUrl}
                title="Certificate Preview"
                className="w-full h-[450px] border-none bg-white"
              />
            </div>
          </div>

          {/* Verification Form for Faculty or Super Admin */}
          {canVerify && (
            <div className="border-t border-[#E5E7EB] pt-5">
              <div className="flex items-center gap-2 mb-3">
                <UserCheck className="w-4 h-4 text-[#9D174D]" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-900">
                  Faculty Verification Action
                </h4>
              </div>

              {errorMsg && (
                <div className="mb-3 p-2.5 text-xs text-red-700 bg-red-50 border border-red-200 rounded">
                  {errorMsg}
                </div>
              )}
              {successMsg && (
                <div className="mb-3 p-2.5 text-xs text-green-800 bg-green-50 border border-green-200 rounded">
                  {successMsg}
                </div>
              )}

              <form onSubmit={handleVerify} className="space-y-3 bg-[#F9FAFB] p-4 rounded border border-[#E5E7EB]">
                <div className="flex items-center gap-4">
                  <label className="text-xs font-medium text-gray-700">Set Verification Status:</label>
                  <div className="flex items-center gap-4">
                    <label className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-900 cursor-pointer">
                      <input
                        type="radio"
                        name="verif_status"
                        value="VERIFIED"
                        checked={newStatus === 'VERIFIED'}
                        onChange={() => setNewStatus('VERIFIED')}
                        className="text-[#9D174D] focus:ring-[#9D174D]"
                      />
                      VERIFIED (Approved)
                    </label>

                    <label className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-900 cursor-pointer">
                      <input
                        type="radio"
                        name="verif_status"
                        value="UNVERIFIED"
                        checked={newStatus === 'UNVERIFIED'}
                        onChange={() => setNewStatus('UNVERIFIED')}
                        className="text-[#9D174D] focus:ring-[#9D174D]"
                      />
                      UNVERIFIED (Requires revision/ineligible)
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Verification Notes / Feedback (Optional):
                  </label>
                  <textarea
                    id="verification-notes-input"
                    value={verificationNotes}
                    onChange={(e) => setVerificationNotes(e.target.value)}
                    rows={2}
                    placeholder="Provide verification credentials source or reasons if marked unverified..."
                    className="w-full text-xs p-2.5 border border-[#D1D5DB] rounded bg-white text-gray-900 focus:outline-none focus:border-[#9D174D]"
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <button
                    id="submit-verification-btn"
                    type="submit"
                    disabled={verifying}
                    className="px-4 py-2 bg-[#9D174D] text-white hover:bg-[#831340] text-xs font-semibold rounded transition-colors disabled:opacity-50"
                  >
                    {verifying ? 'Updating Status...' : 'Save Verification'}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-[#E5E7EB] bg-gray-50 flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-100"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
