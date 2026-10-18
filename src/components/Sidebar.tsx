import React from 'react';
import { useAuth } from '../context/AuthContext';
import { ThemeSelector } from './ThemeSelector';
import {
  LayoutDashboard,
  Clock,
  FileCheck2,
  CalendarDays,
  User,
  Users,
  ShieldCheck,
  BarChart3,
  Sliders,
  History,
  X,
  ChevronRight,
  Shield,
  Briefcase,
  GraduationCap,
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
    { id: 'dashboard', label: 'Overview', icon: LayoutDashboard, badge: null },
    { id: 'my-attendance', label: 'Biometric Clock', icon: Clock, badge: 'Live' },
    { id: 'work-updates', label: 'Daily Work Report', icon: FileCheck2, badge: null },
    { id: 'work-history', label: 'Work History', icon: History, badge: null },
    { id: 'leave-requests', label: 'Leave & Requests', icon: CalendarDays, badge: null },
    { id: 'profile', label: 'My Profile & ID', icon: User, badge: null },
  ];

  const adminNavItems = [
    { id: 'admin-dashboard', label: 'Executive Hub', icon: LayoutDashboard, badge: null },
    { id: 'admin-attendance', label: 'Attendance Records', icon: Clock, badge: 'Live' },
    { id: 'admin-work-updates', label: 'Work Reviews', icon: FileCheck2, badge: null },
    { id: 'admin-users', label: 'Team Directory', icon: Users, badge: null },
    { id: 'admin-approvals', label: 'Leave Approvals', icon: ShieldCheck, badge: 'Review' },
    { id: 'admin-reports', label: 'Analytics & Export', icon: BarChart3, badge: null },
    { id: 'admin-settings', label: 'Shift Rules & DB', icon: Sliders, badge: null },
  ];

  const navItems = isAdmin ? adminNavItems : employeeNavItems;

  const handleSelectTab = (id: string) => {
    setCurrentTab(id);
    onCloseMobile();
  };

  const getRoleIcon = () => {
    if (user?.role === 'admin') return <Shield className="w-3.5 h-3.5 text-purple-600" />;
    if (user?.role === 'intern') return <GraduationCap className="w-3.5 h-3.5 text-amber-600" />;
    return <Briefcase className="w-3.5 h-3.5 text-blue-600" />;
  };

  const navContent = (
    <div className="flex flex-col h-full bg-white/95 backdrop-blur-md border-r border-slate-200/90 w-64 select-none">
      {/* Brand Header inside Sidebar */}
      <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-brand-gradient flex items-center justify-center text-white font-extrabold text-sm tracking-wider shadow-sm ring-2 ring-white/80">
            BX
          </div>
          <div>
            <h2 className="text-sm font-extrabold tracking-tight text-slate-900 leading-none">BUILDREX</h2>
            <span className="text-[10px] text-brand-accent font-semibold tracking-wider uppercase">
              Smart Workspace
            </span>
          </div>
        </div>
        <button
          onClick={onCloseMobile}
          className="md:hidden p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          aria-label="Close navigation drawer"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <div className="px-3 pb-2 flex items-center justify-between">
          <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
            {isAdmin ? 'Administration Suite' : 'Personal Workspace'}
          </span>
          <span className="text-[9px] font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.2 rounded-full border border-emerald-200">
            v2.4
          </span>
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleSelectTab(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 text-xs font-semibold rounded-xl transition-all group cursor-pointer ${
                isActive
                  ? 'bg-brand-gradient text-white shadow-brand-glow shadow-md scale-[1.01]'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 active:scale-[0.99]'
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
              <div className="flex items-center gap-1.5">
                {item.badge && (
                  <span
                    className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider ${
                      isActive
                        ? 'bg-white/20 text-white'
                        : item.badge === 'Live'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
                {isActive && <ChevronRight className="w-3.5 h-3.5 text-white/80 shrink-0" />}
              </div>
            </button>
          );
        })}
      </div>

      {/* Mobile Drawer Theme Quick Switcher */}
      <div className="p-3 border-t border-slate-100 bg-slate-50/50 md:hidden">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Theme Palette:
          </span>
          <ThemeSelector variant="compact" />
        </div>
      </div>

      {/* Bottom User Card in Sidebar */}
      <div className="p-3 border-t border-slate-100 bg-slate-50/70">
        <div className="flex items-center gap-2.5 p-2 rounded-xl bg-white border border-slate-200/80 shadow-2xs">
          <div className="w-8 h-8 rounded-lg bg-brand-gradient text-white text-xs font-bold flex items-center justify-center shrink-0 shadow-xs">
            {user?.name?.slice(0, 1).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold text-slate-900 truncate leading-tight">{user?.name}</p>
            <div className="flex items-center gap-1 mt-0.5">
              {getRoleIcon()}
              <p className="text-[10px] text-slate-500 truncate capitalize font-medium">
                {user?.role} · {user?.employee_code}
              </p>
            </div>
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
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity duration-200"
            onClick={onCloseMobile}
          />
          <div className="relative z-10 w-72 max-w-[85vw] h-full shadow-2xl animate-in slide-in-from-left duration-200">
            {navContent}
          </div>
        </div>
      )}
    </>
  );
};
