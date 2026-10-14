import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LoginView } from './views/LoginView';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';

// Employee & Intern Views
import { EmployeeDashboard } from './views/EmployeeDashboard';
import { MyAttendanceView } from './views/MyAttendanceView';
import { WorkUpdatesView } from './views/WorkUpdatesView';
import { WorkHistoryView } from './views/WorkHistoryView';
import { LeaveRequestsView } from './views/LeaveRequestsView';
import { ProfileView } from './views/ProfileView';

// Admin Views
import { AdminDashboardView } from './views/AdminDashboardView';
import { AdminAttendanceView } from './views/AdminAttendanceView';
import { AdminWorkUpdatesView } from './views/AdminWorkUpdatesView';
import { AdminUsersView } from './views/AdminUsersView';
import { AdminApprovalsView } from './views/AdminApprovalsView';
import { AdminReportsView } from './views/AdminReportsView';
import { AdminSettingsView } from './views/AdminSettingsView';
import { AdminAuditLogsView } from './views/AdminAuditLogsView';

const SECTION_TITLES: Record<string, string> = {
  // Employee
  dashboard: 'Personal Workspace',
  'my-attendance': 'Biometric Attendance',
  'work-updates': 'Daily Work Report',
  'work-history': 'Work Update Archives',
  'leave-requests': 'Leave & Approvals',
  profile: 'Security & Profile',

  // Admin
  'admin-dashboard': 'Executive Overview',
  'admin-attendance': 'Attendance Management',
  'admin-work-updates': 'Daily Work Reviews',
  'admin-users': 'Team Directory',
  'admin-approvals': 'Approvals & Requests',
  'admin-reports': 'Reports & Analytics',
  'admin-settings': 'Company Shift Policies',
  'admin-audit-logs': 'Security Audit Trail',
};

const MainWorkspace: React.FC = () => {
  const { user, isLoading } = useAuth();
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Automatically switch default tab on login / role switch
  useEffect(() => {
    if (user?.role === 'admin') {
      setCurrentTab('admin-dashboard');
    } else {
      setCurrentTab('dashboard');
    }
  }, [user?.role]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center">
        <div className="w-10 h-10 rounded-xl bg-[#0B1F3A] flex items-center justify-center text-white font-bold text-base animate-pulse">
          BX
        </div>
        <p className="mt-4 text-xs font-semibold text-slate-500 tracking-wide uppercase">
          Loading BUILDREX Workspace...
        </p>
      </div>
    );
  }

  if (!user) {
    return <LoginView />;
  }

  const renderActiveView = () => {
    switch (currentTab) {
      // Employee & Intern Views
      case 'dashboard':
        return <EmployeeDashboard onNavigateTab={(tab) => setCurrentTab(tab)} />;
      case 'my-attendance':
        return <MyAttendanceView />;
      case 'work-updates':
        return <WorkUpdatesView />;
      case 'work-history':
        return <WorkHistoryView />;
      case 'leave-requests':
        return <LeaveRequestsView />;
      case 'profile':
        return <ProfileView />;

      // Admin Views
      case 'admin-dashboard':
        return <AdminDashboardView onNavigateTab={(tab) => setCurrentTab(tab)} />;
      case 'admin-attendance':
        return <AdminAttendanceView />;
      case 'admin-work-updates':
        return <AdminWorkUpdatesView />;
      case 'admin-users':
        return <AdminUsersView />;
      case 'admin-approvals':
        return <AdminApprovalsView />;
      case 'admin-reports':
        return <AdminReportsView />;
      case 'admin-settings':
        return <AdminSettingsView />;
      case 'admin-audit-logs':
        return <AdminAuditLogsView />;

      default:
        return user.role === 'admin' ? (
          <AdminDashboardView onNavigateTab={(tab) => setCurrentTab(tab)} />
        ) : (
          <EmployeeDashboard onNavigateTab={(tab) => setCurrentTab(tab)} />
        );
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col text-slate-900 selection:bg-[#0B1F3A] selection:text-white">
      {/* Top Navbar */}
      <Navbar
        onToggleMobileSidebar={() => setIsMobileSidebarOpen(true)}
        currentSectionTitle={SECTION_TITLES[currentTab] || 'Workspace'}
      />

      {/* Main Body with Sidebar + Content */}
      <div className="flex-1 flex max-w-[1600px] w-full mx-auto">
        <Sidebar
          currentTab={currentTab}
          setCurrentTab={setCurrentTab}
          isOpenMobile={isMobileSidebarOpen}
          onCloseMobile={() => setIsMobileSidebarOpen(false)}
        />

        <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          {renderActiveView()}
        </main>
      </div>
    </div>
  );
};

import { ToastProvider } from './context/ToastContext';

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <MainWorkspace />
      </AuthProvider>
    </ToastProvider>
  );
}

