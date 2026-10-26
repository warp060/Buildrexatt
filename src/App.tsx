import React, { useState, useEffect } from 'react';
import { BuildrexLogo } from './components/BuildrexLogo';
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
      <div className="min-h-screen bg-[#07070B] flex flex-col items-center justify-center p-4 relative overflow-hidden">
        {/* Ambient neon radial background glow */}
        <div className="absolute w-96 h-96 rounded-full bg-purple-600/10 blur-3xl pointer-events-none -top-20 -left-20" />
        <div className="absolute w-96 h-96 rounded-full bg-cyan-600/10 blur-3xl pointer-events-none -bottom-20 -right-20" />

        <div className="relative flex flex-col items-center z-10">
          <div className="relative animate-pulse">
            <BuildrexLogo size="xl" variant="badge" glow={true} />
            <div className="absolute -inset-2 rounded-full bg-gradient-to-r from-purple-500/20 to-cyan-500/20 blur-md -z-10" />
          </div>

          <div className="mt-6 flex items-center gap-0.5">
            <h1 className="text-xl font-black tracking-tight text-white leading-none">BUILDRE</h1>
            <span className="text-xl font-black tracking-tight bg-gradient-to-tr from-purple-400 via-indigo-400 to-cyan-400 bg-clip-text text-transparent leading-none">X</span>
          </div>

          <span className="mt-1.5 text-[11px] font-bold tracking-widest uppercase bg-gradient-to-r from-purple-400 via-indigo-300 to-cyan-400 bg-clip-text text-transparent">
            FOR BUILDERS • BY BUILDERS
          </span>

          <div className="mt-5 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
            <span className="text-xs text-slate-400 font-medium">Initializing smart workspace...</span>
          </div>
        </div>
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
