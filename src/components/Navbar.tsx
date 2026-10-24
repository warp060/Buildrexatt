import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { ThemeSelector } from './ThemeSelector';
import {
  Bell,
  Menu,
  LogOut,
  Shield,
  Briefcase,
  GraduationCap,
  Clock,
  Sparkles,
  CheckCheck,
  Building2,
} from 'lucide-react';
import { UserRole } from '../types';

interface NavbarProps {
  onToggleMobileSidebar: () => void;
  currentSectionTitle: string;
}

export const Navbar: React.FC<NavbarProps> = ({ onToggleMobileSidebar, currentSectionTitle }) => {
  const { user, logout, notifications, unreadCount, markNotificationRead, markAllNotificationsRead } = useAuth();
  const { showToast } = useToast();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [currentTime, setCurrentTime] = useState<string>('');

  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true,
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const getRoleLabel = (role?: UserRole) => {
    if (role === 'admin') return 'Administrator';
    if (role === 'intern') return 'Intern';
    return 'Employee';
  };

  const getRoleBadge = (role?: UserRole) => {
    if (role === 'admin') {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md border border-purple-200">
          <Shield className="w-3 h-3" /> Admin
        </span>
      );
    }
    if (role === 'intern') {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
          <GraduationCap className="w-3 h-3" /> Intern
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
        <Briefcase className="w-3 h-3" /> Employee
      </span>
    );
  };

  return (
    <header className="sticky top-0 z-30 glass-navbar">
      <div className="flex items-center justify-between gap-2 sm:gap-4 md:gap-8 px-3.5 sm:px-6 h-16 max-w-[1700px] mx-auto w-full">
        {/* Zone 1: Mobile Toggle + Wordmark */}
        <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
          <button
            onClick={onToggleMobileSidebar}
            className="md:hidden p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            aria-label="Toggle navigation drawer"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#0F5132] to-[#0A3822] flex items-center justify-center text-white shadow-sm ring-1 ring-emerald-900/20">
              <Building2 className="w-4 h-4 text-emerald-100" />
            </div>
            <div className="hidden min-[380px]:block">
              <span className="text-base font-extrabold tracking-tight text-slate-900 leading-none block">
                BUILDREX
              </span>
              <span className="text-[10px] font-bold text-[#0F5132] tracking-wider uppercase block">
                Workforce OS
              </span>
            </div>
          </div>

          <span className="hidden sm:inline-block text-slate-300 font-light">/</span>
          <span className="hidden sm:inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 whitespace-nowrap bg-white/90 px-2.5 py-1 rounded-md border border-slate-200/80 shadow-2xs">
            {currentSectionTitle}
          </span>
        </div>

        {/* Zone 2: Live Clock & Live Status Pill */}
        <div className="hidden lg:flex items-center gap-3 text-xs text-slate-500">
          <div className="flex items-center gap-1.5 font-mono tabular-nums text-slate-700 bg-white/95 px-3 py-1 rounded-lg border border-slate-200/80 shadow-2xs">
            <Clock className="w-3.5 h-3.5 text-brand-accent" />
            <span className="font-semibold">{currentTime}</span>
            <span className="text-slate-300">·</span>
            <span className="text-[11px] text-slate-400 font-sans">Live Sync</span>
          </div>

          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 pulse-dot" />
            <span>Biometric Core Active</span>
          </div>
        </div>

        {/* Zone 3: Actions (Theme Selector, Demo Switcher, Notifications, Profile) */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
          {/* Active Verified Role Badge (Static RBAC badge) */}
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-100/90 border border-slate-200/80 text-xs shadow-2xs">
            <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">Role:</span>
            {getRoleBadge(user?.role)}
          </div>

          {/* Theme Color Selector Pill */}
          <ThemeSelector variant="compact" />

          {/* Notifications Dropdown */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => {
                setShowNotifications(!showNotifications);
                setShowProfileMenu(false);
              }}
              className="relative p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-all cursor-pointer border border-slate-200/60 bg-white/70 shadow-2xs"
              aria-label="View notifications"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[9px] font-bold text-white shadow-xs animate-bounce">
                  {unreadCount}
                </span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white/95 backdrop-blur-xl rounded-xl shadow-xl border border-slate-200/90 p-3 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="flex items-center justify-between pb-2.5 px-1 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900 tracking-tight">Notifications</span>
                    {unreadCount > 0 ? (
                      <span className="text-[10px] bg-rose-50 text-rose-700 font-semibold px-2 py-0.5 rounded-md border border-rose-200">
                        {unreadCount} new
                      </span>
                    ) : (
                      <span className="text-[10px] bg-slate-100 text-slate-600 font-medium px-2 py-0.5 rounded-md">
                        All caught up
                      </span>
                    )}
                  </div>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllNotificationsRead}
                      className="text-[11px] text-[#0F5132] hover:underline font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      <CheckCheck className="w-3.5 h-3.5" />
                      Mark all read
                    </button>
                  )}
                </div>

                <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 pt-1">
                  {notifications.length === 0 ? (
                    <div className="py-8 text-center text-xs text-slate-400">
                      No notifications yet
                    </div>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n.id}
                        onClick={() => markNotificationRead(n.id)}
                        className={`p-2.5 text-left rounded-lg hover:bg-slate-50 transition-colors cursor-pointer my-0.5 ${
                          !n.read_at ? 'bg-emerald-50/60 border border-emerald-100/90' : ''
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-xs font-semibold text-slate-900">{n.title}</p>
                          <span className="text-[10px] text-slate-400 font-mono shrink-0">
                            {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-2">{n.message}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* User Profile & Menu */}
          <div className="relative" ref={profileRef}>
            <button
              onClick={() => {
                setShowProfileMenu(!showProfileMenu);
                setShowNotifications(false);
              }}
              className="flex items-center gap-2 p-1 sm:p-1.5 hover:bg-slate-100 rounded-lg transition-all text-left cursor-pointer border border-slate-200/60 bg-white/70 shadow-2xs"
            >
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#0F5132] to-[#0A3822] text-white flex items-center justify-center font-bold text-xs shadow-xs ring-1 ring-emerald-900/20">
                {user?.name?.slice(0, 2).toUpperCase() || 'BX'}
              </div>
              <div className="hidden sm:block">
                <p className="text-xs font-bold text-slate-900 leading-none truncate max-w-[110px]">
                  {user?.name}
                </p>
                <p className="text-[10px] text-slate-500 font-mono mt-0.5">{user?.employee_code}</p>
              </div>
            </button>

            {showProfileMenu && (
              <div className="absolute right-0 mt-2 w-64 bg-white/95 backdrop-blur-xl rounded-xl shadow-xl border border-slate-200/90 p-3 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="pb-3 border-b border-slate-100">
                  <p className="text-xs font-bold text-slate-900">{user?.name}</p>
                  <p className="text-xs text-slate-500 truncate">{user?.email}</p>
                  <div className="mt-2 flex items-center justify-between">
                    {getRoleBadge(user?.role)}
                    <span className="text-[10px] text-slate-400 font-mono">{user?.employee_code}</span>
                  </div>
                </div>

                <div className="py-2 text-[11px] text-slate-500 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Department:</span>
                    <span className="font-semibold text-slate-700">{user?.department_name || 'General'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Position:</span>
                    <span className="font-medium text-slate-700 truncate max-w-[140px]">{user?.position || 'Member'}</span>
                  </div>
                </div>

                {/* Mobile Demo Switcher inside menu */}
                {/* Verified Role Information */}
                <div className="md:hidden py-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                    Role:
                  </span>
                  {getRoleBadge(user?.role)}
                </div>

                <div className="border-t border-slate-100 pt-2">
                  <button
                    onClick={logout}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
