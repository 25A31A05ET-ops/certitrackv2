import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Department } from '../types';
import { Lock, Mail, User, Shield, Building2, GraduationCap, AlertCircle, CheckCircle } from 'lucide-react';

export const LoginView: React.FC = () => {
  const { login, quickDemoLogin } = useAuth();

  const [activeTab, setActiveTab] = useState<'LOGIN' | 'REGISTER_STUDENT' | 'FACULTY_REQUEST'>('LOGIN');

  // Login form state
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState('');

  // Student registration form state
  const [studName, setStudName] = useState('');
  const [studRoll, setStudRoll] = useState('');
  const [studEmail, setStudEmail] = useState('');
  const [studDept, setStudDept] = useState<Department>('CSE');
  const [studYear, setStudYear] = useState('3rd Year');
  const [studSec, setStudSec] = useState('A');
  const [studPass, setStudPass] = useState('');
  const [studConfirmPass, setStudConfirmPass] = useState('');
  const [regLoading, setRegLoading] = useState(false);
  const [regError, setRegError] = useState('');
  const [regSuccess, setRegSuccess] = useState('');

  // Faculty request form state
  const [facName, setFacName] = useState('');
  const [facId, setFacId] = useState('');
  const [facEmail, setFacEmail] = useState('');
  const [facDept, setFacDept] = useState<Department>('CSE');
  const [facPass, setFacPass] = useState('');
  const [facConfirmPass, setFacConfirmPass] = useState('');
  const [facLoading, setFacLoading] = useState(false);
  const [facError, setFacError] = useState('');
  const [facSuccess, setFacSuccess] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setLoginLoading(true);

    try {
      await login(identifier.trim(), password);
    } catch (err: any) {
      setLoginError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleStudentRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError('');
    setRegSuccess('');

    if (studPass !== studConfirmPass) {
      setRegError('Passwords do not match.');
      return;
    }

    setRegLoading(true);

    try {
      await api.registerStudent({
        full_name: studName.trim(),
        roll_number: studRoll.trim().toUpperCase(),
        email: studEmail.trim().toLowerCase(),
        password: studPass,
        confirm_password: studConfirmPass,
        department: studDept,
        year: studYear,
        section: studSec.trim().toUpperCase(),
      });
      setRegSuccess('Registration successful! Logging you in...');
      // Automatically log in
      await login(studEmail.trim().toLowerCase(), studPass);
    } catch (err: any) {
      setRegError(err.message || 'Registration failed.');
      setRegLoading(false);
    }
  };

  const handleFacultyRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setFacError('');
    setFacSuccess('');

    if (facPass !== facConfirmPass) {
      setFacError('Passwords do not match.');
      return;
    }

    setFacLoading(true);

    try {
      const res = await api.requestFacultyAccess({
        full_name: facName.trim(),
        faculty_id: facId.trim().toUpperCase(),
        email: facEmail.trim().toLowerCase(),
        department: facDept,
        password: facPass,
        confirm_password: facConfirmPass,
      });
      setFacSuccess(res.message);
      setFacName('');
      setFacId('');
      setFacEmail('');
      setFacPass('');
      setFacConfirmPass('');
    } catch (err: any) {
      setFacError(err.message || 'Faculty access request failed.');
    } finally {
      setFacLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8 bg-[#FDFDFD]">
      {/* College Emblem & Title */}
      <div className="max-w-md w-full text-center mb-6">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-lg bg-[#9D174D] text-white shadow-md font-bold text-2xl mb-3">
          CT
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-[#111827]">
          CERTITRACK
        </h2>
        <p className="text-xs text-gray-500 mt-1">
          Student Certificate Management & Academic Verification Portal
        </p>
      </div>

      {/* Main Authentication Card */}
      <div className="max-w-md w-full bg-white rounded-lg border border-[#E5E7EB] shadow-xs overflow-hidden">
        {/* Navigation Tabs */}
        <div className="flex border-b border-[#E5E7EB] bg-gray-50">
          <button
            id="tab-login-btn"
            type="button"
            onClick={() => setActiveTab('LOGIN')}
            className={`flex-1 py-3 text-xs font-semibold text-center border-b-2 transition-colors ${
              activeTab === 'LOGIN'
                ? 'border-[#9D174D] text-[#9D174D] bg-white'
                : 'border-transparent text-gray-500 hover:text-gray-900'
            }`}
          >
            Sign In
          </button>
          <button
            id="tab-register-btn"
            type="button"
            onClick={() => setActiveTab('REGISTER_STUDENT')}
            className={`flex-1 py-3 text-xs font-semibold text-center border-b-2 transition-colors ${
              activeTab === 'REGISTER_STUDENT'
                ? 'border-[#9D174D] text-[#9D174D] bg-white'
                : 'border-transparent text-gray-500 hover:text-gray-900'
            }`}
          >
            Student Register
          </button>
          <button
            id="tab-faculty-req-btn"
            type="button"
            onClick={() => setActiveTab('FACULTY_REQUEST')}
            className={`flex-1 py-3 text-xs font-semibold text-center border-b-2 transition-colors ${
              activeTab === 'FACULTY_REQUEST'
                ? 'border-[#9D174D] text-[#9D174D] bg-white'
                : 'border-transparent text-gray-500 hover:text-gray-900'
            }`}
          >
            Faculty Request
          </button>
        </div>

        <div className="p-6">
          {/* TAB 1: LOGIN */}
          {activeTab === 'LOGIN' && (
            <form onSubmit={handleLogin} className="space-y-4 text-xs">
              {loginError && (
                <div className="p-3 text-red-800 bg-red-50 border border-red-200 rounded flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  <span>{loginError}</span>
                </div>
              )}

              <div>
                <label className="block font-semibold text-gray-700 mb-1">
                  College Email or Username
                </label>
                <div className="relative">
                  <input
                    id="login-identifier-input"
                    type="text"
                    required
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="e.g. superadmin, cse.faculty, student"
                    className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded bg-white text-gray-900 focus:outline-none focus:border-[#9D174D]"
                  />
                  <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="login-password-input"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded bg-white text-gray-900 focus:outline-none focus:border-[#9D174D]"
                  />
                  <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                </div>
              </div>

              <button
                id="login-submit-btn"
                type="submit"
                disabled={loginLoading}
                className="w-full py-2.5 px-4 bg-[#9D174D] hover:bg-[#831340] text-white font-semibold rounded shadow-sm transition-colors disabled:opacity-50"
              >
                {loginLoading ? 'Authenticating...' : 'Sign In to CERTITRACK'}
              </button>

              {/* Quick Demo Credentials Box */}
              <div className="mt-5 pt-4 border-t border-[#E5E7EB] bg-[#F9FAFB] p-3 rounded text-[11px] text-gray-600">
                <p className="font-semibold text-gray-800 mb-1.5 flex items-center justify-between">
                  <span>Fast Demo Credentials:</span>
                  <span className="text-[10px] text-[#9D174D] font-normal">Click to auto-fill</span>
                </p>
                <div className="grid grid-cols-2 gap-1.5 font-mono">
                  <button
                    type="button"
                    onClick={() => {
                      setIdentifier('superadmin');
                      setPassword('superadmin123');
                    }}
                    className="text-left p-1.5 bg-white border border-gray-200 rounded hover:border-[#9D174D]"
                  >
                    <span className="font-semibold block text-gray-900">superadmin</span>
                    <span className="text-gray-400 text-[10px]">superadmin123</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIdentifier('cse.faculty');
                      setPassword('faculty123');
                    }}
                    className="text-left p-1.5 bg-white border border-gray-200 rounded hover:border-[#9D174D]"
                  >
                    <span className="font-semibold block text-gray-900">cse.faculty</span>
                    <span className="text-gray-400 text-[10px]">faculty123</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIdentifier('ece.faculty');
                      setPassword('faculty123');
                    }}
                    className="text-left p-1.5 bg-white border border-gray-200 rounded hover:border-[#9D174D]"
                  >
                    <span className="font-semibold block text-gray-900">ece.faculty</span>
                    <span className="text-gray-400 text-[10px]">faculty123</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIdentifier('student');
                      setPassword('student123');
                    }}
                    className="text-left p-1.5 bg-white border border-gray-200 rounded hover:border-[#9D174D]"
                  >
                    <span className="font-semibold block text-gray-900">student (CSE)</span>
                    <span className="text-gray-400 text-[10px]">student123</span>
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* TAB 2: STUDENT REGISTRATION */}
          {activeTab === 'REGISTER_STUDENT' && (
            <form onSubmit={handleStudentRegister} className="space-y-3 text-xs">
              {regError && (
                <div className="p-2.5 text-red-800 bg-red-50 border border-red-200 rounded flex items-start gap-1.5">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  <span>{regError}</span>
                </div>
              )}
              {regSuccess && (
                <div className="p-2.5 text-green-800 bg-green-50 border border-green-200 rounded flex items-start gap-1.5">
                  <CheckCircle className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />
                  <span>{regSuccess}</span>
                </div>
              )}

              <div>
                <label className="block font-medium text-gray-700 mb-1">Full Name *</label>
                <input
                  id="reg-name-input"
                  type="text"
                  required
                  value={studName}
                  onChange={(e) => setStudName(e.target.value)}
                  placeholder="e.g. Priya Sharma"
                  className="w-full p-2 border border-gray-300 rounded bg-white text-gray-900 focus:outline-none focus:border-[#9D174D]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-medium text-gray-700 mb-1">Roll Number *</label>
                  <input
                    id="reg-roll-input"
                    type="text"
                    required
                    value={studRoll}
                    onChange={(e) => setStudRoll(e.target.value)}
                    placeholder="e.g. 23CSE099"
                    className="w-full p-2 border border-gray-300 rounded bg-white font-mono uppercase text-gray-900 focus:outline-none focus:border-[#9D174D]"
                  />
                </div>
                <div>
                  <label className="block font-medium text-gray-700 mb-1">Department *</label>
                  <select
                    id="reg-dept-select"
                    value={studDept}
                    onChange={(e) => setStudDept(e.target.value as Department)}
                    className="w-full p-2 border border-gray-300 rounded bg-white text-gray-900 focus:outline-none focus:border-[#9D174D]"
                  >
                    <option value="CSE">CSE</option>
                    <option value="ECE">ECE</option>
                    <option value="EEE">EEE</option>
                    <option value="MECH">MECH</option>
                    <option value="CIVIL">CIVIL</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-medium text-gray-700 mb-1">College Email *</label>
                <input
                  id="reg-email-input"
                  type="email"
                  required
                  value={studEmail}
                  onChange={(e) => setStudEmail(e.target.value)}
                  placeholder="priya.cse@college.edu"
                  className="w-full p-2 border border-gray-300 rounded bg-white text-gray-900 focus:outline-none focus:border-[#9D174D]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-medium text-gray-700 mb-1">Year</label>
                  <select
                    id="reg-year-select"
                    value={studYear}
                    onChange={(e) => setStudYear(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded bg-white text-gray-900 focus:outline-none focus:border-[#9D174D]"
                  >
                    <option value="1st Year">1st Year</option>
                    <option value="2nd Year">2nd Year</option>
                    <option value="3rd Year">3rd Year</option>
                    <option value="4th Year">4th Year</option>
                  </select>
                </div>
                <div>
                  <label className="block font-medium text-gray-700 mb-1">Section</label>
                  <input
                    id="reg-sec-input"
                    type="text"
                    value={studSec}
                    onChange={(e) => setStudSec(e.target.value)}
                    placeholder="A"
                    maxLength={2}
                    className="w-full p-2 border border-gray-300 rounded bg-white uppercase text-gray-900 focus:outline-none focus:border-[#9D174D]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-medium text-gray-700 mb-1">Password *</label>
                  <input
                    id="reg-pass-input"
                    type="password"
                    required
                    value={studPass}
                    onChange={(e) => setStudPass(e.target.value)}
                    placeholder="Min 6 chars"
                    className="w-full p-2 border border-gray-300 rounded bg-white text-gray-900 focus:outline-none focus:border-[#9D174D]"
                  />
                </div>
                <div>
                  <label className="block font-medium text-gray-700 mb-1">Confirm Password *</label>
                  <input
                    id="reg-confirm-pass-input"
                    type="password"
                    required
                    value={studConfirmPass}
                    onChange={(e) => setStudConfirmPass(e.target.value)}
                    placeholder="Repeat password"
                    className="w-full p-2 border border-gray-300 rounded bg-white text-gray-900 focus:outline-none focus:border-[#9D174D]"
                  />
                </div>
              </div>

              <button
                id="student-register-submit-btn"
                type="submit"
                disabled={regLoading}
                className="w-full mt-2 py-2 px-4 bg-[#9D174D] hover:bg-[#831340] text-white font-semibold rounded shadow-sm transition-colors disabled:opacity-50"
              >
                {regLoading ? 'Registering...' : 'Complete Student Registration'}
              </button>
            </form>
          )}

          {/* TAB 3: FACULTY ACCESS REQUEST */}
          {activeTab === 'FACULTY_REQUEST' && (
            <form onSubmit={handleFacultyRequest} className="space-y-3 text-xs">
              <div className="p-2.5 bg-[#F9FAFB] border border-[#E5E7EB] rounded text-[11px] text-gray-600">
                <span className="font-semibold text-gray-900 block mb-0.5">Faculty Verification Notice:</span>
                Faculty accounts require Super Administrator approval before access is granted. Submissions remain PENDING until reviewed.
              </div>

              {facError && (
                <div className="p-2.5 text-red-800 bg-red-50 border border-red-200 rounded flex items-start gap-1.5">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  <span>{facError}</span>
                </div>
              )}
              {facSuccess && (
                <div className="p-2.5 text-green-800 bg-green-50 border border-green-200 rounded flex items-start gap-1.5">
                  <CheckCircle className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />
                  <span>{facSuccess}</span>
                </div>
              )}

              <div>
                <label className="block font-medium text-gray-700 mb-1">Full Name *</label>
                <input
                  id="fac-name-input"
                  type="text"
                  required
                  value={facName}
                  onChange={(e) => setFacName(e.target.value)}
                  placeholder="e.g. Dr. Sunita Rao"
                  className="w-full p-2 border border-gray-300 rounded bg-white text-gray-900 focus:outline-none focus:border-[#9D174D]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-medium text-gray-700 mb-1">Faculty / Employee ID *</label>
                  <input
                    id="fac-id-input"
                    type="text"
                    required
                    value={facId}
                    onChange={(e) => setFacId(e.target.value)}
                    placeholder="FAC-CSE-009"
                    className="w-full p-2 border border-gray-300 rounded bg-white font-mono uppercase text-gray-900 focus:outline-none focus:border-[#9D174D]"
                  />
                </div>
                <div>
                  <label className="block font-medium text-gray-700 mb-1">Department *</label>
                  <select
                    id="fac-dept-select"
                    value={facDept}
                    onChange={(e) => setFacDept(e.target.value as Department)}
                    className="w-full p-2 border border-gray-300 rounded bg-white text-gray-900 focus:outline-none focus:border-[#9D174D]"
                  >
                    <option value="CSE">CSE</option>
                    <option value="ECE">ECE</option>
                    <option value="EEE">EEE</option>
                    <option value="MECH">MECH</option>
                    <option value="CIVIL">CIVIL</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-medium text-gray-700 mb-1">Official College Email *</label>
                <input
                  id="fac-email-input"
                  type="email"
                  required
                  value={facEmail}
                  onChange={(e) => setFacEmail(e.target.value)}
                  placeholder="sunita.faculty@college.edu"
                  className="w-full p-2 border border-gray-300 rounded bg-white text-gray-900 focus:outline-none focus:border-[#9D174D]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-medium text-gray-700 mb-1">Password *</label>
                  <input
                    id="fac-pass-input"
                    type="password"
                    required
                    value={facPass}
                    onChange={(e) => setFacPass(e.target.value)}
                    placeholder="Min 6 chars"
                    className="w-full p-2 border border-gray-300 rounded bg-white text-gray-900 focus:outline-none focus:border-[#9D174D]"
                  />
                </div>
                <div>
                  <label className="block font-medium text-gray-700 mb-1">Confirm Password *</label>
                  <input
                    id="fac-confirm-pass-input"
                    type="password"
                    required
                    value={facConfirmPass}
                    onChange={(e) => setFacConfirmPass(e.target.value)}
                    placeholder="Repeat password"
                    className="w-full p-2 border border-gray-300 rounded bg-white text-gray-900 focus:outline-none focus:border-[#9D174D]"
                  />
                </div>
              </div>

              <button
                id="faculty-request-submit-btn"
                type="submit"
                disabled={facLoading}
                className="w-full mt-2 py-2 px-4 bg-[#9D174D] hover:bg-[#831340] text-white font-semibold rounded shadow-sm transition-colors disabled:opacity-50"
              >
                {facLoading ? 'Submitting Request...' : 'Submit Faculty Access Request'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
