import React, { useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { CertificateType, Department } from '../types';
import { X, UploadCloud, User, Users, FileCheck, AlertCircle } from 'lucide-react';

interface UploadCertificateModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export const UploadCertificateModal: React.FC<UploadCertificateModalProps> = ({
  onClose,
  onSuccess,
}) => {
  const { user } = useAuth();

  // Who is this certificate for?
  const [recipientType, setRecipientType] = useState<'MY_CERTIFICATE' | 'OTHER_CERTIFICATE'>('MY_CERTIFICATE');

  // Student Details for Other Class Member
  const [classmateName, setClassmateName] = useState('');
  const [classmateRoll, setClassmateRoll] = useState('');
  const [classmateDept, setClassmateDept] = useState<Department>((user?.department as Department) || 'CSE');
  const [classmateYear, setClassmateYear] = useState('3rd Year');
  const [classmateSection, setClassmateSection] = useState('A');

  // Certificate Details
  const [certificateName, setCertificateName] = useState('');
  const [certificateType, setCertificateType] = useState<CertificateType>('Course Completion');
  const [organization, setOrganization] = useState('');
  const [issueDate, setIssueDate] = useState('');
  const [description, setDescription] = useState('');

  // File State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Status
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const validateAndSetFile = (file: File) => {
    setErrorMsg('');
    const validMimes = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg'];
    const validExtensions = ['.pdf', '.png', '.jpg', '.jpeg'];
    const ext = '.' + file.name.split('.').pop()?.toLowerCase();

    if (!validMimes.includes(file.type) && !validExtensions.includes(ext)) {
      setErrorMsg('Invalid file format. Supported formats: PDF, PNG, JPG, JPEG.');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setErrorMsg('File size exceeds the 10 MB maximum limit.');
      return;
    }

    setSelectedFile(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!selectedFile) {
      setErrorMsg('Please select or upload a certificate file.');
      return;
    }

    if (!certificateName.trim() || !organization.trim() || !issueDate) {
      setErrorMsg('Certificate Name, Issuing Authority, and Issue Date are required.');
      return;
    }

    if (recipientType === 'OTHER_CERTIFICATE') {
      if (!classmateName.trim() || !classmateRoll.trim()) {
        setErrorMsg('Please enter your classmate’s Full Name and Roll Number.');
        return;
      }
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('upload_type', recipientType);
      formData.append('certificate_file', selectedFile);
      formData.append('certificate_name', certificateName.trim());
      formData.append('certificate_type', certificateType);
      formData.append('organization', organization.trim());
      formData.append('issue_date', issueDate);
      formData.append('description', description.trim());

      if (recipientType === 'OTHER_CERTIFICATE') {
        formData.append('student_name', classmateName.trim());
        formData.append('roll_number', classmateRoll.trim().toUpperCase());
        formData.append('department', classmateDept);
        formData.append('year', classmateYear);
        formData.append('section', classmateSection.toUpperCase());
      }

      await api.uploadCertificate(formData);
      setSuccessMsg('Certificate uploaded successfully! Status is set to PENDING verification.');

      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1200);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to upload certificate. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col border border-[#E5E7EB] my-6">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#E5E7EB] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded bg-[#9D174D]/10 text-[#9D174D] flex items-center justify-center">
              <UploadCloud className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#111827]">Upload Certificate</h3>
              <p className="text-xs text-gray-500">Official Certificate Submission Portal</p>
            </div>
          </div>
          <button
            id="close-upload-modal-btn"
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 p-1.5 rounded hover:bg-gray-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
          {errorMsg && (
            <div className="p-3 text-red-800 bg-red-50 border border-red-200 rounded flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}
          {successMsg && (
            <div className="p-3 text-green-800 bg-green-50 border border-green-200 rounded flex items-start gap-2">
              <FileCheck className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Step 1: Who is this certificate for? */}
          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-800">
              1. Who is this certificate for?
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                id="option-my-certificate-btn"
                type="button"
                onClick={() => setRecipientType('MY_CERTIFICATE')}
                className={`p-3.5 rounded border text-left flex items-start gap-3 transition-colors ${
                  recipientType === 'MY_CERTIFICATE'
                    ? 'border-[#9D174D] bg-[#9D174D]/5 ring-1 ring-[#9D174D]'
                    : 'border-gray-200 hover:border-gray-300 bg-white'
                }`}
              >
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                    recipientType === 'MY_CERTIFICATE' ? 'bg-[#9D174D] text-white' : 'bg-gray-100 text-gray-500'
                  }`}
                >
                  <User className="w-3.5 h-3.5" />
                </div>
                <div>
                  <p className="font-bold text-gray-900">MY CERTIFICATE</p>
                  <p className="text-[11px] text-gray-500 mt-0.5">
                    Automatically fills your profile details ({user?.full_name}, {user?.roll_number})
                  </p>
                </div>
              </button>

              <button
                id="option-other-certificate-btn"
                type="button"
                onClick={() => setRecipientType('OTHER_CERTIFICATE')}
                className={`p-3.5 rounded border text-left flex items-start gap-3 transition-colors ${
                  recipientType === 'OTHER_CERTIFICATE'
                    ? 'border-[#9D174D] bg-[#9D174D]/5 ring-1 ring-[#9D174D]'
                    : 'border-gray-200 hover:border-gray-300 bg-white'
                }`}
              >
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                    recipientType === 'OTHER_CERTIFICATE' ? 'bg-[#9D174D] text-white' : 'bg-gray-100 text-gray-500'
                  }`}
                >
                  <Users className="w-3.5 h-3.5" />
                </div>
                <div>
                  <p className="font-bold text-gray-900">CLASSMEMBER'S CERTIFICATE</p>
                  <p className="text-[11px] text-gray-500 mt-0.5">
                    Upload on behalf of a peer (Stores you as uploader & classmate as student)
                  </p>
                </div>
              </button>
            </div>
          </div>

          {/* Recipient Details Display or Inputs */}
          {recipientType === 'MY_CERTIFICATE' ? (
            <div className="bg-[#F9FAFB] p-3.5 rounded border border-[#E5E7EB]">
              <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider block mb-2">
                Auto-Filled Profile Details
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <span className="text-gray-400 block text-[10px]">Student Name</span>
                  <span className="font-semibold text-gray-900">{user?.full_name}</span>
                </div>
                <div>
                  <span className="text-gray-400 block text-[10px]">Roll Number</span>
                  <span className="font-mono font-semibold text-[#9D174D]">{user?.roll_number}</span>
                </div>
                <div>
                  <span className="text-gray-400 block text-[10px]">Department</span>
                  <span className="font-medium text-gray-900">{user?.department}</span>
                </div>
                <div>
                  <span className="text-gray-400 block text-[10px]">Year & Section</span>
                  <span className="font-medium text-gray-900">{user?.year} ({user?.section})</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-[#F9FAFB] p-4 rounded border border-[#E5E7EB] space-y-3">
              <span className="text-[11px] font-semibold text-gray-700 uppercase tracking-wider block">
                Classmate Information
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-600 font-medium mb-1">Classmate Full Name *</label>
                  <input
                    id="classmate-name-input"
                    type="text"
                    required
                    value={classmateName}
                    onChange={(e) => setClassmateName(e.target.value)}
                    placeholder="e.g. Diya Sundaram"
                    className="w-full p-2 border border-gray-300 rounded bg-white text-gray-900 focus:outline-none focus:border-[#9D174D]"
                  />
                </div>
                <div>
                  <label className="block text-gray-600 font-medium mb-1">Roll Number *</label>
                  <input
                    id="classmate-roll-input"
                    type="text"
                    required
                    value={classmateRoll}
                    onChange={(e) => setClassmateRoll(e.target.value)}
                    placeholder="e.g. 22CSE046"
                    className="w-full p-2 border border-gray-300 rounded bg-white font-mono uppercase text-gray-900 focus:outline-none focus:border-[#9D174D]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-gray-600 font-medium mb-1">Department</label>
                  <select
                    id="classmate-dept-select"
                    value={classmateDept}
                    onChange={(e) => setClassmateDept(e.target.value as Department)}
                    className="w-full p-2 border border-gray-300 rounded bg-white text-gray-900 focus:outline-none focus:border-[#9D174D]"
                  >
                    <option value="CSE">CSE</option>
                    <option value="ECE">ECE</option>
                    <option value="EEE">EEE</option>
                    <option value="MECH">MECH</option>
                    <option value="CIVIL">CIVIL</option>
                  </select>
                </div>
                <div>
                  <label className="block text-gray-600 font-medium mb-1">Year</label>
                  <select
                    id="classmate-year-select"
                    value={classmateYear}
                    onChange={(e) => setClassmateYear(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded bg-white text-gray-900 focus:outline-none focus:border-[#9D174D]"
                  >
                    <option value="1st Year">1st Year</option>
                    <option value="2nd Year">2nd Year</option>
                    <option value="3rd Year">3rd Year</option>
                    <option value="4th Year">4th Year</option>
                  </select>
                </div>
                <div>
                  <label className="block text-gray-600 font-medium mb-1">Section</label>
                  <input
                    id="classmate-section-input"
                    type="text"
                    value={classmateSection}
                    onChange={(e) => setClassmateSection(e.target.value)}
                    placeholder="A"
                    maxLength={2}
                    className="w-full p-2 border border-gray-300 rounded bg-white uppercase text-gray-900 focus:outline-none focus:border-[#9D174D]"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Certificate Details */}
          <div className="space-y-3">
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-800">
              2. Certificate Details
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-gray-600 font-medium mb-1">Certificate Name *</label>
                <input
                  id="cert-name-input"
                  type="text"
                  required
                  value={certificateName}
                  onChange={(e) => setCertificateName(e.target.value)}
                  placeholder="e.g. AWS Certified Solutions Architect"
                  className="w-full p-2 border border-gray-300 rounded bg-white text-gray-900 focus:outline-none focus:border-[#9D174D]"
                />
              </div>

              <div>
                <label className="block text-gray-600 font-medium mb-1">Certificate Type *</label>
                <select
                  id="cert-type-select"
                  value={certificateType}
                  onChange={(e) => setCertificateType(e.target.value as CertificateType)}
                  className="w-full p-2 border border-gray-300 rounded bg-white text-gray-900 focus:outline-none focus:border-[#9D174D]"
                >
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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-gray-600 font-medium mb-1">
                  Organization / Issuing Authority *
                </label>
                <input
                  id="cert-org-input"
                  type="text"
                  required
                  value={organization}
                  onChange={(e) => setOrganization(e.target.value)}
                  placeholder="e.g. Amazon Web Services / IEEE / Infosys"
                  className="w-full p-2 border border-gray-300 rounded bg-white text-gray-900 focus:outline-none focus:border-[#9D174D]"
                />
              </div>

              <div>
                <label className="block text-gray-600 font-medium mb-1">Issue Date *</label>
                <input
                  id="cert-date-input"
                  type="date"
                  required
                  value={issueDate}
                  onChange={(e) => setIssueDate(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded bg-white text-gray-900 focus:outline-none focus:border-[#9D174D]"
                />
              </div>
            </div>

            <div>
              <label className="block text-gray-600 font-medium mb-1">
                Description / Additional Notes (Optional)
              </label>
              <textarea
                id="cert-desc-input"
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief summary or credential verification link..."
                className="w-full p-2 border border-gray-300 rounded bg-white text-gray-900 focus:outline-none focus:border-[#9D174D]"
              />
            </div>
          </div>

          {/* Step 3: File Upload (Drag & Drop + Browse) */}
          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-800">
              3. Upload Certificate Document (PDF, PNG, JPG, JPEG - max 10MB) *
            </label>

            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                dragActive
                  ? 'border-[#9D174D] bg-[#9D174D]/5'
                  : selectedFile
                  ? 'border-[#9D174D] bg-gray-50'
                  : 'border-gray-300 hover:border-gray-400 bg-[#F9FAFB]'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.png,.jpg,.jpeg"
                onChange={handleFileChange}
                className="hidden"
              />

              <UploadCloud className="w-8 h-8 mx-auto text-[#9D174D] mb-2" />

              {selectedFile ? (
                <div>
                  <p className="font-semibold text-gray-900">{selectedFile.name}</p>
                  <p className="text-[11px] text-gray-500 mt-0.5">
                    {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB • Click or drag to replace
                  </p>
                </div>
              ) : (
                <div>
                  <p className="font-medium text-gray-700">
                    Drag and drop your certificate file here, or{' '}
                    <span className="text-[#9D174D] font-semibold underline">browse</span>
                  </p>
                  <p className="text-[11px] text-gray-400 mt-1">
                    Supported: PDF, PNG, JPG, JPEG • Maximum size: 10 MB
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Footer Submit */}
          <div className="pt-4 border-t border-[#E5E7EB] flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              id="submit-certificate-btn"
              type="submit"
              disabled={loading}
              className="px-5 py-2 text-xs font-semibold text-white bg-[#9D174D] hover:bg-[#831340] rounded shadow-sm disabled:opacity-50 transition-colors"
            >
              {loading ? 'Uploading & Submitting...' : 'Upload & Submit Certificate'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
