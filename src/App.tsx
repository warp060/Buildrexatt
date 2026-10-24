import React, { useState, useEffect } from 'react';
import { Building2 } from 'lucide-react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { ThemeProvider } from './context/ThemeContext';
import { LoginView } from './views/LoginView';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { MobileDock } from './components/MobileDock';

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
  dashboard: 'Executive Hub',
  'my-attendance': 'Biometric Clock',
  'work-updates': 'Daily Work Report',
  'work-history': 'Work Update Archives',
  'leave-requests': 'Leave & Approvals',
  profile: 'Security & Profile',

  // Admin
  'admin-dashboard': 'Executive Overview',
  'admin-attendance': 'Attendance Records',
  'admin-work-updates': 'Work Reviews',
  'admin-users': 'Team Directory',
  'admin-approvals': 'Leave Approvals',
  'admin-reports': 'Reports & Analytics',
  'admin-settings': 'Shift Rules & System',
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
      <div className="min-h-screen bg-[#FAF9F5] flex flex-col items-center justify-center p-4">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#0F5132] to-[#0A3822] flex items-center justify-center text-white shadow-lg shadow-emerald-950/20 ring-1 ring-emerald-900/20 animate-pulse">
          <Building2 className="w-6 h-6 text-emerald-100" />
        </div>
        <p className="mt-4 text-xs font-bold text-slate-600 tracking-wider uppercase">
          Loading BUILDREX Workspace...
        </p>
      </div>
    );
  }

  if (!user) {
    return <LoginView />;
  }

  const renderActiveView = () => {
    // Strict RBAC Guard: non-admin users can never view admin panel tabs
    if (currentTab.startsWith('admin-') && user.role !== 'admin') {
      return <EmployeeDashboard onNavigateTab={(tab) => setCurrentTab(tab)} />;
    }

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
    <div className="min-h-screen flex flex-col text-slate-900 selection:bg-brand-primary selection:text-white">
      {/* Top Navbar */}
      <Navbar
        onToggleMobileSidebar={() => setIsMobileSidebarOpen(true)}
        currentSectionTitle={SECTION_TITLES[currentTab] || 'Workspace'}
      />

      {/* Main Body with Sidebar + Content */}
      <div className="flex-1 flex max-w-[1700px] w-full mx-auto">
        <Sidebar
          currentTab={currentTab}
          setCurrentTab={setCurrentTab}
          isOpenMobile={isMobileSidebarOpen}
          onCloseMobile={() => setIsMobileSidebarOpen(false)}
        />

        <main className="flex-1 min-w-0 p-3 sm:p-5 lg:p-8 overflow-y-auto pb-24 md:pb-10">
          {renderActiveView()}
        </main>
      </div>

      {/* Mobile Floating App Dock for Smartphones */}
      <MobileDock currentTab={currentTab} setCurrentTab={setCurrentTab} />
    </div>
  );
};

export default function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <MainWorkspace />
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}
