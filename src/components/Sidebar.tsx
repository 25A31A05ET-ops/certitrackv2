import React from 'react';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  UploadCloud,
  FileCheck2,
  User,
  Users,
  Search,
  FileSpreadsheet,
  ShieldAlert,
  GraduationCap,
  Building,
  LogOut,
} from 'lucide-react';

interface SidebarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  isOpenMobile,
  onCloseMobile,
}) => {
  const { user, logout } = useAuth();

  if (!user) return null;

  const handleTabClick = (tab: string) => {
    onSelectTab(tab);
    if (onCloseMobile) onCloseMobile();
  };

  const renderStudentNav = () => (
    <>
      <div className="px-3 py-2 text-[11px] font-semibold tracking-wider text-gray-400 uppercase">
        Student Portal
      </div>
      <nav className="space-y-1">
        <button
          id="nav-student-dashboard-btn"
          type="button"
          onClick={() => handleTabClick('dashboard')}
          className={`w-full flex items-center gap-3 px-3 py-2.5 text-xs font-medium rounded transition-colors ${
            currentTab === 'dashboard'
              ? 'bg-[#9D174D] text-white shadow-sm'
              : 'text-gray-700 hover:bg-gray-100 hover:text-black'
          }`}
        >
          <LayoutDashboard className="w-4 h-4" />
          Dashboard
        </button>

        <button
          id="nav-student-upload-btn"
          type="button"
          onClick={() => handleTabClick('upload')}
          className={`w-full flex items-center gap-3 px-3 py-2.5 text-xs font-medium rounded transition-colors ${
            currentTab === 'upload'
              ? 'bg-[#9D174D] text-white shadow-sm'
              : 'text-gray-700 hover:bg-gray-100 hover:text-black'
          }`}
        >
          <UploadCloud className="w-4 h-4" />
          Upload Certificate
        </button>

        <button
          id="nav-student-submissions-btn"
          type="button"
          onClick={() => handleTabClick('submissions')}
          className={`w-full flex items-center gap-3 px-3 py-2.5 text-xs font-medium rounded transition-colors ${
            currentTab === 'submissions'
              ? 'bg-[#9D174D] text-white shadow-sm'
              : 'text-gray-700 hover:bg-gray-100 hover:text-black'
          }`}
        >
          <FileCheck2 className="w-4 h-4" />
          My Submissions
        </button>

        <button
          id="nav-student-profile-btn"
          type="button"
          onClick={() => handleTabClick('profile')}
          className={`w-full flex items-center gap-3 px-3 py-2.5 text-xs font-medium rounded transition-colors ${
            currentTab === 'profile'
              ? 'bg-[#9D174D] text-white shadow-sm'
              : 'text-gray-700 hover:bg-gray-100 hover:text-black'
          }`}
        >
          <User className="w-4 h-4" />
          My Profile
        </button>
      </nav>
    </>
  );

  const renderFacultyNav = () => (
    <>
      <div className="px-3 py-2 text-[11px] font-semibold tracking-wider text-gray-400 uppercase">
        Faculty Portal ({user.department})
      </div>
      <nav className="space-y-1">
        <button
          id="nav-faculty-dashboard-btn"
          type="button"
          onClick={() => handleTabClick('dashboard')}
          className={`w-full flex items-center gap-3 px-3 py-2.5 text-xs font-medium rounded transition-colors ${
            currentTab === 'dashboard'
              ? 'bg-[#9D174D] text-white shadow-sm'
              : 'text-gray-700 hover:bg-gray-100 hover:text-black'
          }`}
        >
          <LayoutDashboard className="w-4 h-4" />
          Dashboard
        </button>

        <button
          id="nav-faculty-certificates-btn"
          type="button"
          onClick={() => handleTabClick('certificates')}
          className={`w-full flex items-center gap-3 px-3 py-2.5 text-xs font-medium rounded transition-colors ${
            currentTab === 'certificates'
              ? 'bg-[#9D174D] text-white shadow-sm'
              : 'text-gray-700 hover:bg-gray-100 hover:text-black'
          }`}
        >
          <FileCheck2 className="w-4 h-4" />
          All Certificates
        </button>

        <button
          id="nav-faculty-students-btn"
          type="button"
          onClick={() => handleTabClick('students')}
          className={`w-full flex items-center gap-3 px-3 py-2.5 text-xs font-medium rounded transition-colors ${
            currentTab === 'students'
              ? 'bg-[#9D174D] text-white shadow-sm'
              : 'text-gray-700 hover:bg-gray-100 hover:text-black'
          }`}
        >
          <GraduationCap className="w-4 h-4" />
          Students
        </button>

        <button
          id="nav-faculty-search-btn"
          type="button"
          onClick={() => handleTabClick('search')}
          className={`w-full flex items-center gap-3 px-3 py-2.5 text-xs font-medium rounded transition-colors ${
            currentTab === 'search'
              ? 'bg-[#9D174D] text-white shadow-sm'
              : 'text-gray-700 hover:bg-gray-100 hover:text-black'
          }`}
        >
          <Search className="w-4 h-4" />
          Search & Filters
        </button>

        <button
          id="nav-faculty-export-btn"
          type="button"
          onClick={() => handleTabClick('export')}
          className={`w-full flex items-center gap-3 px-3 py-2.5 text-xs font-medium rounded transition-colors ${
            currentTab === 'export'
              ? 'bg-[#9D174D] text-white shadow-sm'
              : 'text-gray-700 hover:bg-gray-100 hover:text-black'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4" />
          Excel Export
        </button>
      </nav>
    </>
  );

  const renderAdminNav = () => (
    <>
      <div className="px-3 py-2 text-[11px] font-semibold tracking-wider text-gray-400 uppercase">
        Super Administrator
      </div>
      <nav className="space-y-1">
        <button
          id="nav-admin-dashboard-btn"
          type="button"
          onClick={() => handleTabClick('dashboard')}
          className={`w-full flex items-center gap-3 px-3 py-2.5 text-xs font-medium rounded transition-colors ${
            currentTab === 'dashboard'
              ? 'bg-[#9D174D] text-white shadow-sm'
              : 'text-gray-700 hover:bg-gray-100 hover:text-black'
          }`}
        >
          <LayoutDashboard className="w-4 h-4" />
          Dashboard
        </button>

        <button
          id="nav-admin-requests-btn"
          type="button"
          onClick={() => handleTabClick('requests')}
          className={`w-full flex items-center gap-3 px-3 py-2.5 text-xs font-medium rounded transition-colors ${
            currentTab === 'requests'
              ? 'bg-[#9D174D] text-white shadow-sm'
              : 'text-gray-700 hover:bg-gray-100 hover:text-black'
          }`}
        >
          <ShieldAlert className="w-4 h-4" />
          Faculty Requests
        </button>

        <button
          id="nav-admin-faculty-btn"
          type="button"
          onClick={() => handleTabClick('faculty')}
          className={`w-full flex items-center gap-3 px-3 py-2.5 text-xs font-medium rounded transition-colors ${
            currentTab === 'faculty'
              ? 'bg-[#9D174D] text-white shadow-sm'
              : 'text-gray-700 hover:bg-gray-100 hover:text-black'
          }`}
        >
          <Users className="w-4 h-4" />
          Faculty Management
        </button>

        <button
          id="nav-admin-students-btn"
          type="button"
          onClick={() => handleTabClick('students')}
          className={`w-full flex items-center gap-3 px-3 py-2.5 text-xs font-medium rounded transition-colors ${
            currentTab === 'students'
              ? 'bg-[#9D174D] text-white shadow-sm'
              : 'text-gray-700 hover:bg-gray-100 hover:text-black'
          }`}
        >
          <GraduationCap className="w-4 h-4" />
          Student Management
        </button>

        <button
          id="nav-admin-certificates-btn"
          type="button"
          onClick={() => handleTabClick('certificates')}
          className={`w-full flex items-center gap-3 px-3 py-2.5 text-xs font-medium rounded transition-colors ${
            currentTab === 'certificates'
              ? 'bg-[#9D174D] text-white shadow-sm'
              : 'text-gray-700 hover:bg-gray-100 hover:text-black'
          }`}
        >
          <FileCheck2 className="w-4 h-4" />
          Certificate Management
        </button>

        <button
          id="nav-admin-departments-btn"
          type="button"
          onClick={() => handleTabClick('departments')}
          className={`w-full flex items-center gap-3 px-3 py-2.5 text-xs font-medium rounded transition-colors ${
            currentTab === 'departments'
              ? 'bg-[#9D174D] text-white shadow-sm'
              : 'text-gray-700 hover:bg-gray-100 hover:text-black'
          }`}
        >
          <Building className="w-4 h-4" />
          Departments
        </button>

        <button
          id="nav-admin-export-btn"
          type="button"
          onClick={() => handleTabClick('export')}
          className={`w-full flex items-center gap-3 px-3 py-2.5 text-xs font-medium rounded transition-colors ${
            currentTab === 'export'
              ? 'bg-[#9D174D] text-white shadow-sm'
              : 'text-gray-700 hover:bg-gray-100 hover:text-black'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4" />
          Excel Export
        </button>
      </nav>
    </>
  );

  return (
    <>
      {/* Mobile overlay */}
      {isOpenMobile && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden"
          onClick={onCloseMobile}
        />
      )}

      <aside
        className={`fixed top-16 bottom-0 left-0 w-64 bg-white border-r border-[#E5E7EB] z-40 flex flex-col justify-between p-4 transition-transform duration-200 lg:translate-x-0 ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="space-y-4 overflow-y-auto">
          {user.role === 'STUDENT' && renderStudentNav()}
          {user.role === 'FACULTY' && renderFacultyNav()}
          {user.role === 'SUPER_ADMIN' && renderAdminNav()}
        </div>

        {/* Bottom User info & Logout */}
        <div className="pt-4 border-t border-[#E5E7EB] space-y-3">
          <div className="bg-[#F9FAFB] p-2.5 rounded border border-[#E5E7EB]">
            <p className="text-[11px] font-semibold text-gray-900 truncate">{user.full_name}</p>
            <p className="text-[10px] text-gray-500 truncate">{user.email}</p>
            {user.roll_number && (
              <p className="text-[10px] font-mono text-[#9D174D] mt-0.5">Roll: {user.roll_number}</p>
            )}
            {user.department && (
              <p className="text-[10px] text-gray-600">Dept: {user.department}</p>
            )}
          </div>

          <button
            id="sidebar-logout-btn"
            type="button"
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium text-gray-700 hover:text-[#9D174D] hover:bg-gray-100 rounded border border-[#E5E7EB] transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </aside>
    </>
  );
};
