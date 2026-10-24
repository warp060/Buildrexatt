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
  History,
} from 'lucide-react';

interface MobileDockProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
}

export const MobileDock: React.FC<MobileDockProps> = ({ currentTab, setCurrentTab }) => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const employeeItems = [
    { id: 'dashboard', label: 'Home', icon: LayoutDashboard },
    { id: 'my-attendance', label: 'Clock', icon: Clock },
    { id: 'work-updates', label: 'Report', icon: FileCheck2 },
    { id: 'work-history', label: 'History', icon: History },
    { id: 'profile', label: 'Profile', icon: User },
  ];

  const adminItems = [
    { id: 'admin-dashboard', label: 'Overview', icon: LayoutDashboard },
    { id: 'admin-attendance', label: 'Attendance', icon: Clock },
    { id: 'admin-work-updates', label: 'Reviews', icon: FileCheck2 },
    { id: 'admin-users', label: 'Team', icon: Users },
    { id: 'admin-approvals', label: 'Approvals', icon: ShieldCheck },
  ];

  const items = isAdmin ? adminItems : employeeItems;

  return (
    <div className="md:hidden fixed bottom-3 left-3 right-3 z-40">
      <nav
        aria-label="Mobile quick dock"
        className="mobile-app-dock rounded-xl flex items-center justify-around px-2 py-1.5 shadow-xl"
      >
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setCurrentTab(item.id)}
              className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-lg transition-all relative cursor-pointer ${
                isActive
                  ? 'text-white'
                  : 'text-slate-500 hover:text-slate-900 active:scale-95'
              }`}
            >
              {isActive && (
                <span className="absolute inset-0 bg-gradient-to-r from-[#0F5132] to-[#0B3D25] rounded-lg shadow-sm -z-10" />
              )}
              <Icon className="w-5 h-5 mb-0.5" />
              <span className={`text-[10px] font-semibold tracking-tight ${isActive ? 'text-white' : 'text-slate-600'}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>
    </div>
  );
};
