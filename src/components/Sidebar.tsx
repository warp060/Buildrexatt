import React from 'react';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  Clock,
  FileCheck2,
  CalendarDays,
  User,
  Users,
  ShieldCheck,
  BarChart3,
  Building2,
  FileText,
  Sliders,
  History,
  X,
  ChevronRight,
} from 'lucide-react';

interface SidebarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  setCurrentTab,
  isOpenMobile,
  onCloseMobile,
}) => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const employeeNavItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'my-attendance', label: 'My Attendance', icon: Clock },
    { id: 'work-updates', label: 'Daily Work Update', icon: FileCheck2 },
    { id: 'work-history', label: 'Work History', icon: History },
    { id: 'leave-requests', label: 'Leave & Requests', icon: CalendarDays },
    { id: 'profile', label: 'My Profile', icon: User },
  ];

  const adminNavItems = [
    { id: 'admin-dashboard', label: 'Admin Overview', icon: LayoutDashboard },
    { id: 'admin-attendance', label: 'Attendance Records', icon: Clock },
    { id: 'admin-work-updates', label: 'Work Reviews', icon: FileCheck2 },
    { id: 'admin-users', label: 'Team & Directory', icon: Users },
    { id: 'admin-approvals', label: 'Leave & Corrections', icon: ShieldCheck },
    { id: 'admin-reports', label: 'Reports & Export', icon: BarChart3 },
    { id: 'admin-settings', label: 'Company & Rules', icon: Sliders },
    { id: 'admin-audit-logs', label: 'Audit Trail', icon: FileText },
  ];

  const navItems = isAdmin ? adminNavItems : employeeNavItems;

  const handleSelectTab = (id: string) => {
    setCurrentTab(id);
    onCloseMobile();
  };

  const navContent = (
    <div className="flex flex-col h-full bg-white border-r border-slate-200 w-64">
      {/* Brand Header inside Sidebar */}
      <div className="p-5 border-b border-slate-100 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-md bg-[#0B1F3A] flex items-center justify-center text-white font-bold text-xs tracking-wider">
              BX
            </div>
            <div>
              <h2 className="text-sm font-bold tracking-tight text-slate-900 leading-none">BUILDREX</h2>
              <span className="text-[10px] text-slate-400 font-medium">Attendance & Work OS</span>
            </div>
          </div>
        </div>
        <button
          onClick={onCloseMobile}
          className="md:hidden p-1 text-slate-400 hover:text-slate-700 rounded-md"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <div className="px-3 pb-2 text-[10px] font-semibold tracking-wider text-slate-400 uppercase">
          {isAdmin ? 'Administration' : 'Personal Workspace'}
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleSelectTab(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2 text-xs font-medium rounded-lg transition-colors group ${
                isActive
                  ? 'bg-[#0B1F3A] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
              }`}
            >
              <div className="flex items-center gap-2.5 truncate">
                <Icon
                  className={`w-4 h-4 shrink-0 transition-colors ${
                    isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-700'
                  }`}
                />
                <span className="truncate">{item.label}</span>
              </div>
              {isActive && <ChevronRight className="w-3.5 h-3.5 text-slate-300 shrink-0" />}
            </button>
          );
        })}
      </div>

      {/* Bottom User Card in Sidebar */}
      <div className="p-3 border-t border-slate-100 bg-slate-50/50">
        <div className="flex items-center gap-2.5 p-2 rounded-lg bg-white border border-slate-200/80 shadow-2xs">
          <div className="w-7 h-7 rounded-full bg-[#0B1F3A] text-white text-[11px] font-semibold flex items-center justify-center shrink-0">
            {user?.name?.slice(0, 1).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-slate-900 truncate leading-tight">{user?.name}</p>
            <p className="text-[10px] text-slate-500 truncate capitalize">{user?.role} · {user?.department_name || 'Team'}</p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col shrink-0 h-[calc(100vh-4rem)] sticky top-16 z-20">
        {navContent}
      </aside>

      {/* Mobile Drawer */}
      {isOpenMobile && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
            onClick={onCloseMobile}
          />
          <div className="relative z-10 w-72 max-w-[80vw] h-full shadow-2xl animate-in slide-in-from-left duration-200">
            {navContent}
          </div>
        </div>
      )}
    </>
  );
};
