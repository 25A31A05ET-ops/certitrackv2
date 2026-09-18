import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { LoginView } from './views/LoginView';
import { StudentDashboard } from './views/StudentDashboard';
import { FacultyDashboard } from './views/FacultyDashboard';
import { AdminDashboard } from './views/AdminDashboard';

function MainLayout() {
  const { user, loading } = useAuth();
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FDFDFD] flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-3 border-[#9D174D] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-semibold text-gray-700">Loading CERTITRACK Portal...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#FDFDFD] flex flex-col">
        <Header />
        <main className="flex-1">
          <LoginView />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F9FAFB] flex flex-col">
      <Header onToggleMobileMenu={() => setMobileMenuOpen(!mobileMenuOpen)} />

      <div className="flex-1 flex">
        {/* Sidebar */}
        <Sidebar
          currentTab={currentTab}
          onSelectTab={setCurrentTab}
          isOpenMobile={mobileMenuOpen}
          onCloseMobile={() => setMobileMenuOpen(false)}
        />

        {/* Main Content Area */}
        <main className="flex-1 lg:pl-64 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {user.role === 'STUDENT' && (
            <StudentDashboard
              currentTab={currentTab}
              onNavigateTab={setCurrentTab}
            />
          )}

          {user.role === 'FACULTY' && (
            <FacultyDashboard
              currentTab={currentTab}
              onNavigateTab={setCurrentTab}
            />
          )}

          {user.role === 'SUPER_ADMIN' && (
            <AdminDashboard
              currentTab={currentTab}
              onNavigateTab={setCurrentTab}
            />
          )}
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainLayout />
    </AuthProvider>
  );
}
