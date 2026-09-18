import React from 'react';
import { useAuth } from '../context/AuthContext';
import { LogOut, UserCheck, Shield, GraduationCap, Building2 } from 'lucide-react';

interface HeaderProps {
  onToggleMobileMenu?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onToggleMobileMenu }) => {
  const { user, logout, quickDemoLogin } = useAuth();

  const getRoleBadge = () => {
    if (!user) return null;
    if (user.role === 'SUPER_ADMIN') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-white bg-[#9D174D] rounded">
          <Shield className="w-3.5 h-3.5" />
          Super Admin
        </span>
      );
    }
    if (user.role === 'FACULTY') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-[#9D174D] border border-[#9D174D] bg-[#9D174D]/5 rounded">
          <Building2 className="w-3.5 h-3.5" />
          Faculty • {user.department}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-[#4B5563] border border-[#D1D5DB] bg-white rounded">
        <GraduationCap className="w-3.5 h-3.5" />
        Student • {user.department || 'Enrolled'}
      </span>
    );
  };

  return (
    <header className="bg-white border-b border-[#E5E7EB] sticky top-0 z-30">
      {/* Demo Quick-Switch Bar for Evaluation */}
      <div className="bg-[#111827] text-white px-4 py-1.5 text-xs">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-gray-400 font-medium">Demo Switcher:</span>
            <div className="flex items-center gap-1.5">
              <button
                id="demo-superadmin-btn"
                type="button"
                onClick={() => quickDemoLogin('superadmin')}
                className={`px-2 py-0.5 rounded text-[11px] transition-colors ${
                  user?.role === 'SUPER_ADMIN'
                    ? 'bg-[#9D174D] text-white font-semibold'
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                }`}
                title="Login as Super Admin (superadmin / superadmin123)"
              >
                Super Admin
              </button>
              <button
                id="demo-cse-btn"
                type="button"
                onClick={() => quickDemoLogin('cse_faculty')}
                className={`px-2 py-0.5 rounded text-[11px] transition-colors ${
                  user?.role === 'FACULTY' && user?.department === 'CSE'
                    ? 'bg-[#9D174D] text-white font-semibold'
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                }`}
                title="Login as CSE Faculty (cse.faculty / faculty123)"
              >
                CSE Faculty
              </button>
              <button
                id="demo-ece-btn"
                type="button"
                onClick={() => quickDemoLogin('ece_faculty')}
                className={`px-2 py-0.5 rounded text-[11px] transition-colors ${
                  user?.role === 'FACULTY' && user?.department === 'ECE'
                    ? 'bg-[#9D174D] text-white font-semibold'
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                }`}
                title="Login as ECE Faculty (ece.faculty / faculty123)"
              >
                ECE Faculty
              </button>
              <button
                id="demo-student-btn"
                type="button"
                onClick={() => quickDemoLogin('student')}
                className={`px-2 py-0.5 rounded text-[11px] transition-colors ${
                  user?.role === 'STUDENT'
                    ? 'bg-[#9D174D] text-white font-semibold'
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                }`}
                title="Login as Demo Student (student / student123)"
              >
                Demo Student (CSE)
              </button>
            </div>
          </div>
          <span className="text-gray-400 hidden sm:inline text-[11px]">
            {user ? `Logged in as: ${user.full_name}` : 'Not logged in'}
          </span>
        </div>
      </div>

      {/* Main Header Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {onToggleMobileMenu && (
            <button
              id="mobile-menu-toggle-btn"
              onClick={onToggleMobileMenu}
              className="lg:hidden p-2 text-gray-600 hover:text-black rounded"
              aria-label="Toggle navigation menu"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          )}

          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-[#9D174D] text-white flex items-center justify-center font-bold text-lg rounded shadow-sm">
              C
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold tracking-tight text-[#111827]">
                  CERTITRACK
                </h1>
                <span className="text-[10px] uppercase tracking-wider font-semibold text-[#9D174D] bg-[#9D174D]/10 px-1.5 py-0.5 rounded">
                  Official Portal
                </span>
              </div>
              <p className="text-xs text-gray-500 hidden sm:block">
                Student Certificate Management & Verification System
              </p>
            </div>
          </div>
        </div>

        {user && (
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-3 border-r border-[#E5E7EB] pr-4">
              <div className="text-right">
                <p className="text-xs font-semibold text-[#111827]">{user.full_name}</p>
                <p className="text-[11px] text-gray-500">{user.email}</p>
              </div>
              {getRoleBadge()}
            </div>

            <button
              id="header-logout-btn"
              type="button"
              onClick={logout}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 hover:text-[#9D174D] hover:bg-gray-100 rounded transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
