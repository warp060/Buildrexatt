import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Bell,
  Menu,
  X,
  LogOut,
  User as UserIcon,
  Shield,
  Briefcase,
  GraduationCap,
  Clock,
  Check,
} from 'lucide-react';
import { UserRole } from '../types';

interface NavbarProps {
  onToggleMobileSidebar: () => void;
  currentSectionTitle: string;
}

export const Navbar: React.FC<NavbarProps> = ({ onToggleMobileSidebar, currentSectionTitle }) => {
  const { user, logout, quickDemoLogin, notifications, unreadCount, markNotificationRead, markAllNotificationsRead } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [currentTime, setCurrentTime] = useState<string>('');

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
        <span className="flex items-center gap-1 text-[11px] font-medium text-purple-700 bg-purple-50 px-2 py-0.5 rounded">
          <Shield className="w-3 h-3" /> Admin
        </span>
      );
    }
    if (role === 'intern') {
      return (
        <span className="flex items-center gap-1 text-[11px] font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded">
          <GraduationCap className="w-3 h-3" /> Intern
        </span>
      );
    }
    return (
      <span className="flex items-center gap-1 text-[11px] font-medium text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
        <Briefcase className="w-3 h-3" /> Employee
      </span>
    );
  };

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-slate-200">
      <div className="flex items-center justify-between gap-4 md:gap-8 px-4 sm:px-6 h-16">
        {/* Zone 1: Mobile Toggle + Wordmark */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={onToggleMobileSidebar}
            className="md:hidden p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg"
            aria-label="Toggle navigation drawer"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#0B1F3A] flex items-center justify-center text-white font-bold text-sm tracking-wider shadow-xs">
              BX
            </div>
            <span className="text-base font-bold tracking-tight text-slate-900 whitespace-nowrap">
              BUILDREX
            </span>
          </div>

          <span className="hidden sm:inline-block text-slate-300">/</span>
          <span className="hidden sm:inline-block text-xs font-medium text-slate-500 whitespace-nowrap">
            {currentSectionTitle}
          </span>
        </div>

        {/* Zone 2: Live Clock & Breadcrumb Status */}
        <div className="hidden lg:flex items-center gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-1.5 font-mono tabular-nums text-slate-600 bg-slate-50 px-2.5 py-1 rounded-md border border-slate-200">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>{currentTime}</span>
            <span className="text-slate-400">·</span>
            <span>PT (UTC-7)</span>
          </div>
        </div>

        {/* Zone 3: Actions (Persona Switcher, Notifications, Profile) */}
        <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
          {/* Quick Demo Switcher */}
          <div className="hidden md:flex items-center gap-1 bg-slate-100 p-1 rounded-lg text-xs font-medium border border-slate-200">
            <span className="text-slate-400 text-[10px] uppercase px-1.5 font-semibold">Demo:</span>
            <button
              onClick={() => quickDemoLogin('admin')}
              className={`px-2 py-1 rounded transition-colors whitespace-nowrap ${
                user?.role === 'admin'
                  ? 'bg-white text-slate-900 font-semibold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Admin
            </button>
            <button
              onClick={() => quickDemoLogin('employee')}
              className={`px-2 py-1 rounded transition-colors whitespace-nowrap ${
                user?.role === 'employee'
                  ? 'bg-white text-slate-900 font-semibold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Employee
            </button>
            <button
              onClick={() => quickDemoLogin('intern')}
              className={`px-2 py-1 rounded transition-colors whitespace-nowrap ${
                user?.role === 'intern'
                  ? 'bg-white text-slate-900 font-semibold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Intern
            </button>
          </div>

          {/* Notifications Dropdown */}
          <div className="relative">
            <button
              onClick={() => {
                setShowNotifications(!showNotifications);
                setShowProfileMenu(false);
              }}
              className="relative p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
              aria-label="View notifications"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500" />
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="flex items-center justify-between px-4 py-2 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-slate-900">Notifications</span>
                    {unreadCount > 0 && (
                      <span className="text-[10px] bg-rose-50 text-rose-700 font-medium px-1.5 py-0.5 rounded">
                        {unreadCount} unread
                      </span>
                    )}
                  </div>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllNotificationsRead}
                      className="text-[11px] text-[#0B1F3A] hover:underline font-medium"
                    >
                      Mark all read
                    </button>
                  )}
                </div>

                <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
                  {notifications.length === 0 ? (
                    <div className="p-6 text-center text-xs text-slate-400">
                      No notifications yet
                    </div>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n.id}
                        onClick={() => markNotificationRead(n.id)}
                        className={`p-3 text-left hover:bg-slate-50 transition-colors cursor-pointer ${
                          !n.read_at ? 'bg-slate-50/70' : ''
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-xs font-medium text-slate-900">{n.title}</p>
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
          <div className="relative">
            <button
              onClick={() => {
                setShowProfileMenu(!showProfileMenu);
                setShowNotifications(false);
              }}
              className="flex items-center gap-2.5 p-1.5 hover:bg-slate-100 rounded-lg transition-colors text-left"
            >
              <div className="w-8 h-8 rounded-full bg-[#0B1F3A] text-white flex items-center justify-center font-medium text-xs shadow-xs">
                {user?.name?.slice(0, 2).toUpperCase() || 'BX'}
              </div>
              <div className="hidden sm:block">
                <p className="text-xs font-semibold text-slate-900 leading-none truncate max-w-[120px]">
                  {user?.name}
                </p>
                <p className="text-[10px] text-slate-500 font-mono mt-0.5">{user?.employee_code}</p>
              </div>
            </button>

            {showProfileMenu && (
              <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="px-4 py-2 border-b border-slate-100">
                  <p className="text-xs font-semibold text-slate-900">{user?.name}</p>
                  <p className="text-xs text-slate-500 truncate">{user?.email}</p>
                  <div className="mt-2 flex items-center justify-between">
                    {getRoleBadge(user?.role)}
                    <span className="text-[10px] text-slate-400 font-mono">{user?.employee_code}</span>
                  </div>
                </div>

                <div className="py-1">
                  <div className="px-4 py-1.5 text-[11px] text-slate-500">
                    <span className="block font-medium text-slate-700">Department:</span>
                    <span>{user?.department_name || 'Unassigned'}</span>
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-1">
                  <button
                    onClick={logout}
                    className="w-full flex items-center gap-2 px-4 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 transition-colors"
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
