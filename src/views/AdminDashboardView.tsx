import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../api';
import { DashboardStats, AttendanceRecord, User } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { TeamCredentialsModal } from '../components/TeamCredentialsModal';
import { formatClockTime, formatLiveTimer, getElapsedSeconds } from '../utils/time';
import {
  Users,
  CheckCircle2,
  Clock,
  UserX,
  CalendarDays,
  FileCheck2,
  AlertCircle,
  TrendingUp,
  ArrowRight,
  Shield,
  Building2,
  Activity,
  Cloud,
  Sparkles,
  Zap,
} from 'lucide-react';

interface AdminDashboardViewProps {
  onNavigateTab: (tabId: string) => void;
}

export const AdminDashboardView: React.FC<AdminDashboardViewProps> = ({ onNavigateTab }) => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isCredsModalOpen, setIsCredsModalOpen] = useState(false);
  const [recentAttendance, setRecentAttendance] = useState<AttendanceRecord[]>([]);
  const [todayAttendance, setTodayAttendance] = useState<AttendanceRecord[]>([]);
  const [unpunchedToday, setUnpunchedToday] = useState<User[]>([]);
  const [activeAttendanceTab, setActiveAttendanceTab] = useState<'today' | 'unpunched' | 'recent'>('today');

  // Live timer tick so active sessions count live every second
  const [, setLiveTick] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setLiveTick((t) => t + 1), 1000);
    return () => clearInterval(timer);
  }, []);
  const [departmentStats, setDepartmentStats] = useState<Array<{
    id: string;
    name: string;
    code: string;
    total_members: number;
    present_today: number;
    rate: number;
  }>>([]);
  const [trendDays, setTrendDays] = useState<Array<{
    date: string;
    present: number;
    late: number;
    rate: number;
  }>>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchDashboardData = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await api.getDashboardStats();
      if (res.success) {
        setStats(res.stats);
        setRecentAttendance(res.recent_attendance);
        setTodayAttendance(res.today_attendance || []);
        setUnpunchedToday(res.unpunched_today || []);
        setDepartmentStats(res.department_stats);
        setTrendDays(res.trend_days);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const todayStr = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div className="space-y-5 sm:space-y-6">
      {/* Top Header */}
      <div className="card-premium p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/95 relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 font-medium">
            <span>{todayStr}</span>
            <span className="text-slate-300">·</span>
            <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-bold text-[10px] uppercase">
              Operations Control
            </span>
            <span className="text-slate-300">·</span>
            <span className="inline-flex items-center gap-1 font-mono text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200/80">
              <Cloud className="w-3 h-3 text-emerald-600" />
              TiDB Cloud Connected
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 mt-1">
            Executive Attendance &amp; Workforce Command
          </h1>
          <p className="text-xs text-slate-500 mt-0.5 max-w-2xl">
            Real-time biometric attendance telemetries, sprint work reports, and shift operations
          </p>
        </div>

        {/* Quick action buttons */}
        <div className="relative z-10 flex flex-wrap items-center gap-2">
          <button
            onClick={() => setIsCredsModalOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2.5 text-xs font-bold text-emerald-950 bg-emerald-50/90 hover:bg-emerald-100 border border-emerald-200/90 rounded-lg transition-all shadow-2xs cursor-pointer active:scale-[0.98]"
            title="View All 22 Team Member Passwords & Direct Access"
          >
            <Users className="w-4 h-4 text-emerald-700" />
            <span className="hidden sm:inline">Team Passwords &amp; Access</span>
            <span className="sm:hidden">Passwords</span>
          </button>
          <button
            onClick={() => onNavigateTab('admin-approvals')}
            className="flex items-center gap-2 px-3.5 py-2.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-all shadow-2xs cursor-pointer active:scale-[0.98]"
          >
            <span>Leave &amp; Corrections</span>
            {(stats?.pending_leave_requests || 0) + (stats?.pending_corrections || 0) > 0 && (
              <span className="w-5 h-5 rounded-full bg-amber-500 text-white text-[10px] flex items-center justify-center font-black animate-pulse">
                {(stats?.pending_leave_requests || 0) + (stats?.pending_corrections || 0)}
              </span>
            )}
          </button>
          <button
            onClick={() => onNavigateTab('admin-work-updates')}
            className="flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-white bg-gradient-to-r from-[#0F5132] to-[#0A3822] hover:opacity-95 rounded-lg transition-all shadow-sm shadow-emerald-950/20 cursor-pointer active:scale-[0.98]"
          >
            <span>Review Work Reports</span>
            {(stats?.pending_work_updates || 0) > 0 && (
              <span className="w-5 h-5 rounded-full bg-white text-emerald-950 text-[10px] flex items-center justify-center font-black">
                {stats?.pending_work_updates}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* KPI Cards: Primary Attendance Statistics (6 cards responsive grid) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        {/* Card 1 */}
        <div className="card-premium-interactive p-4 bg-white/95">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Team</span>
            <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center">
              <Users className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className="text-2xl font-black font-mono tabular-nums text-slate-900 mt-2">
            {stats?.total_users || 0}
          </p>
          <span className="text-[10px] text-slate-500 mt-1 block truncate">
            {stats?.active_employees || 0} emp · {stats?.active_interns || 0} int
          </span>
        </div>

        {/* Card 2 */}
        <div className="card-premium-interactive p-4 bg-white/95">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Present Today</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className="text-2xl font-black font-mono tabular-nums text-emerald-600 mt-2">
            {stats?.present_today || 0}
          </p>
          <span className="text-[10px] text-emerald-700 mt-1 block font-semibold truncate">
            {stats?.attendance_rate_percent || 0}% turnout
          </span>
        </div>

        {/* Card 3 */}
        <div className="card-premium-interactive p-4 bg-white/95">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Clocked In</span>
            <div className="w-7 h-7 rounded-lg bg-cyan-50 text-cyan-600 flex items-center justify-center">
              <Zap className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className="text-2xl font-black font-mono tabular-nums text-cyan-600 mt-2">
            {stats?.currently_working || 0}
          </p>
          <span className="text-[10px] text-cyan-700 mt-1 block font-medium truncate">
            Active workstations
          </span>
        </div>

        {/* Card 4 */}
        <div className="card-premium-interactive p-4 bg-white/95">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Absent</span>
            <div className="w-7 h-7 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
              <UserX className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className="text-2xl font-black font-mono tabular-nums text-rose-600 mt-2">
            {stats?.absent_today || 0}
          </p>
          <span className="text-[10px] text-rose-700 mt-1 block font-medium truncate">
            Unrecorded shift
          </span>
        </div>

        {/* Card 5 */}
        <div className="card-premium-interactive p-4 bg-white/95">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Approved PTO</span>
            <div className="w-7 h-7 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <CalendarDays className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className="text-2xl font-black font-mono tabular-nums text-purple-600 mt-2">
            {stats?.on_leave_today || 0}
          </p>
          <span className="text-[10px] text-purple-700 mt-1 block font-medium truncate">
            Scheduled off
          </span>
        </div>

        {/* Card 6 */}
        <div className="card-premium-interactive p-4 bg-white/95">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Pending Logs</span>
            <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <FileCheck2 className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className="text-2xl font-black font-mono tabular-nums text-amber-600 mt-2">
            {stats?.pending_work_updates || 0}
          </p>
          <span className="text-[10px] text-amber-700 mt-1 block font-medium truncate">
            Awaiting signoff
          </span>
        </div>
      </div>

      {/* Middle Section: 7-Day Attendance Trend Chart & Department Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 sm:gap-6">
        {/* 7-Day Attendance Trend */}
        <div className="lg:col-span-2 card-premium p-5 sm:p-6 flex flex-col justify-between bg-white/95">
          <div>
            <div className="flex flex-wrap items-center justify-between pb-3 border-b border-slate-100 gap-2">
              <div>
                <h2 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <Activity className="w-4 h-4 text-brand-accent" />
                  7-Day Attendance &amp; Punctuality Trend
                </h2>
                <p className="text-[11px] text-slate-500 mt-0.5">Biometric logs categorized by on-time vs late window</p>
              </div>
              <div className="flex items-center gap-3 text-xs">
                <span className="flex items-center gap-1.5 text-slate-600 font-medium">
                  <span className="w-2.5 h-2.5 rounded-sm bg-brand-primary" /> On-Time
                </span>
                <span className="flex items-center gap-1.5 text-slate-600 font-medium">
                  <span className="w-2.5 h-2.5 rounded-sm bg-amber-500" /> Late
                </span>
              </div>
            </div>

            {/* Visual Bar Chart */}
            <div className="pt-6 pb-2">
              <div className="grid grid-cols-7 gap-2 sm:gap-4 items-end h-44">
                {trendDays.map((day) => {
                  const dayLabel = new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' });
                  const total = day.present || 0;
                  const late = day.late || 0;
                  const onTime = Math.max(0, total - late);
                  const heightPct = Math.min(100, Math.max(16, (total / 6) * 100));

                  return (
                    <div key={day.date} className="flex flex-col items-center h-full justify-end group">
                      <span className="text-[10px] font-mono font-bold text-slate-500 mb-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {total}
                      </span>
                      <div
                        className="w-full max-w-[42px] rounded-t-xl overflow-hidden flex flex-col justify-end bg-slate-100 shadow-2xs group-hover:ring-2 ring-brand-accent/50 transition-all"
                        style={{ height: `${heightPct}%` }}
                      >
                        {late > 0 && (
                          <div
                            className="bg-amber-500 w-full"
                            style={{ height: `${(late / (total || 1)) * 100}%` }}
                            title={`${late} Late`}
                          />
                        )}
                        <div
                          className="bg-brand-primary w-full flex-1"
                          title={`${onTime} On-Time`}
                        />
                      </div>
                      <div className="text-center mt-2.5">
                        <span className="block text-[11px] font-bold text-slate-800">{dayLabel}</span>
                        <span className="block text-[9px] font-mono text-slate-400">{day.date.slice(5)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between text-xs text-slate-500 gap-2">
            <span>Shift policy: 15m grace window with biometric verification</span>
            <button
              onClick={() => onNavigateTab('admin-reports')}
              className="text-brand-accent font-bold hover:underline flex items-center gap-1 cursor-pointer"
            >
              Export detailed analytics <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Department Attendance Breakdown */}
        <div className="card-premium p-5 sm:p-6 flex flex-col justify-between bg-white/95">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-brand-accent" />
                <h2 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                  Division Turnout
                </h2>
              </div>
              <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                Live
              </span>
            </div>

            <div className="space-y-4">
              {departmentStats.map((dept) => (
                <div key={dept.id} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-900 truncate">{dept.name}</span>
                    <span className="font-mono text-slate-600 tabular-nums font-semibold">
                      {dept.present_today}/{dept.total_members} ({dept.rate}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden p-0.5">
                    <div
                      className="bg-brand-gradient h-full rounded-full transition-all duration-500"
                      style={{ width: `${dept.rate}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100">
            <button
              onClick={() => onNavigateTab('admin-attendance')}
              className="w-full py-2.5 px-3 text-xs font-bold text-slate-700 bg-slate-100/90 hover:bg-slate-200 rounded-lg transition-all text-center cursor-pointer active:scale-[0.99]"
            >
              Filter Attendance by Division
            </button>
          </div>
        </div>
      </div>

      {/* Real-time Activity: Workforce Attendance Stream Table */}
      <div className="card-premium overflow-hidden bg-white/95">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-emerald-600" />
            <h2 className="text-xs font-black text-slate-900 uppercase tracking-wider">
              Live Workforce Attendance Stream
            </h2>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Filter Tabs */}
            <div className="flex items-center bg-slate-100 p-0.5 rounded-lg text-xs font-semibold">
              <button
                type="button"
                onClick={() => setActiveAttendanceTab('today')}
                className={`px-3 py-1 rounded-md transition-all cursor-pointer ${
                  activeAttendanceTab === 'today'
                    ? 'bg-white text-slate-900 shadow-2xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Punched In Today ({todayAttendance.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveAttendanceTab('unpunched')}
                className={`px-3 py-1 rounded-md transition-all cursor-pointer ${
                  activeAttendanceTab === 'unpunched'
                    ? 'bg-white text-slate-900 shadow-2xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Awaiting Punch-In ({unpunchedToday.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveAttendanceTab('recent')}
                className={`px-3 py-1 rounded-md transition-all cursor-pointer ${
                  activeAttendanceTab === 'recent'
                    ? 'bg-white text-slate-900 shadow-2xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Recent History
              </button>
            </div>

            <button
              onClick={() => onNavigateTab('admin-attendance')}
              className="text-xs font-bold text-brand-accent hover:underline cursor-pointer ml-2"
            >
              All records &rarr;
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200/90 text-[10px] font-black text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-4">Member</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Division</th>
                <th className="py-3 px-4">Clock In</th>
                <th className="py-3 px-4">Clock Out</th>
                <th className="py-3 px-4 text-right">Duration</th>
                <th className="py-3 px-4">Biometric Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {activeAttendanceTab === 'today' ? (
                todayAttendance.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      <div className="flex flex-col items-center gap-1.5">
                        <Clock className="w-5 h-5 text-slate-300" />
                        <span className="font-semibold text-slate-600">No team members have punched in today yet.</span>
                        <span className="text-[11px] text-slate-400">
                          {unpunchedToday.length} active employees & interns are currently awaiting shift check-in.
                        </span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  todayAttendance.map((rec) => (
                    <tr key={rec.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-bold text-slate-900 whitespace-nowrap">
                        {rec.user_name}
                        <span className="block text-[10px] font-mono text-slate-400 font-normal">
                          {rec.employee_code}
                        </span>
                      </td>
                      <td className="py-3 px-4 capitalize text-slate-600 whitespace-nowrap font-medium">
                        {rec.role}
                      </td>
                      <td className="py-3 px-4 text-slate-600 whitespace-nowrap">
                        {rec.department_name}
                      </td>
                      <td className="py-3 px-4 font-mono tabular-nums text-slate-600 whitespace-nowrap">
                        {rec.check_in ? formatClockTime(rec.check_in) : '--:--'}
                      </td>
                      <td className="py-3 px-4 font-mono tabular-nums text-slate-600 whitespace-nowrap">
                        {rec.check_out ? (
                          formatClockTime(rec.check_out)
                        ) : (
                          <span className="text-emerald-700 font-sans font-bold flex items-center gap-1.5 bg-emerald-50 border border-emerald-200/90 px-2.5 py-0.5 rounded-full text-xs">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            Currently Working
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        {!rec.check_out && rec.check_in ? (
                          <div className="inline-flex flex-col items-end">
                            <span className="inline-flex items-center gap-1 font-mono font-bold text-xs text-emerald-800 bg-emerald-50 border border-emerald-300/80 px-2 py-0.5 rounded-lg shadow-2xs">
                              <Clock className="w-3 h-3 text-emerald-600 animate-pulse" />
                              {formatLiveTimer(rec.check_in)}
                            </span>
                            <span className="text-[10px] font-mono text-emerald-700 mt-0.5 font-semibold">
                              {(getElapsedSeconds(rec.check_in) / 3600).toFixed(1)} hrs active
                            </span>
                          </div>
                        ) : (
                          <span className="font-mono tabular-nums font-bold text-slate-900">
                            {(rec.total_minutes / 60).toFixed(1)} hrs
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <StatusBadge status={rec.status} />
                      </td>
                    </tr>
                  ))
                )
              ) : activeAttendanceTab === 'unpunched' ? (
                unpunchedToday.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-emerald-600 font-semibold">
                      All team members have punched in today!
                    </td>
                  </tr>
                ) : (
                  unpunchedToday.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50/80 transition-colors opacity-85">
                      <td className="py-3 px-4 font-bold text-slate-900 whitespace-nowrap">
                        {u.name}
                        <span className="block text-[10px] font-mono text-slate-400 font-normal">
                          {u.employee_code}
                        </span>
                      </td>
                      <td className="py-3 px-4 capitalize text-slate-600 whitespace-nowrap font-medium">
                        {u.role}
                      </td>
                      <td className="py-3 px-4 text-slate-600 whitespace-nowrap">
                        {u.department_name || 'General'}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-400 whitespace-nowrap">
                        --:--
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-400 whitespace-nowrap">
                        --:--
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-slate-400 whitespace-nowrap">
                        0.0 hrs
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                          <UserX className="w-3 h-3 text-slate-400" />
                          Not Punched In
                        </span>
                      </td>
                    </tr>
                  ))
                )
              ) : (
                recentAttendance.map((rec) => (
                  <tr key={rec.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-bold text-slate-900 whitespace-nowrap">
                      {rec.user_name}
                      <span className="block text-[10px] font-mono text-slate-400 font-normal">
                        {rec.employee_code}
                      </span>
                    </td>
                    <td className="py-3 px-4 capitalize text-slate-600 whitespace-nowrap font-medium">
                      {rec.role}
                    </td>
                    <td className="py-3 px-4 text-slate-600 whitespace-nowrap">
                      {rec.department_name}
                    </td>
                    <td className="py-3 px-4 font-mono tabular-nums text-slate-600 whitespace-nowrap">
                      {rec.check_in ? formatClockTime(rec.check_in) : '--:--'}
                      <span className="block text-[9px] font-sans text-slate-400">{rec.work_date}</span>
                    </td>
                    <td className="py-3 px-4 font-mono tabular-nums text-slate-600 whitespace-nowrap">
                      {rec.check_out ? (
                        formatClockTime(rec.check_out)
                      ) : (
                        <span className="text-emerald-700 font-sans font-bold flex items-center gap-1.5 bg-emerald-50 border border-emerald-200/90 px-2.5 py-0.5 rounded-full text-xs">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          Currently Working
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      {!rec.check_out && rec.check_in ? (
                        <div className="inline-flex flex-col items-end">
                          <span className="inline-flex items-center gap-1 font-mono font-bold text-xs text-emerald-800 bg-emerald-50 border border-emerald-300/80 px-2 py-0.5 rounded-lg shadow-2xs">
                            <Clock className="w-3 h-3 text-emerald-600 animate-pulse" />
                            {formatLiveTimer(rec.check_in)}
                          </span>
                          <span className="text-[10px] font-mono text-emerald-700 mt-0.5 font-semibold">
                            {(getElapsedSeconds(rec.check_in) / 3600).toFixed(1)} hrs active
                          </span>
                        </div>
                      ) : (
                        <span className="font-mono tabular-nums font-bold text-slate-900">
                          {(rec.total_minutes / 60).toFixed(1)} hrs
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <StatusBadge status={rec.status} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <TeamCredentialsModal
        isOpen={isCredsModalOpen}
        onClose={() => setIsCredsModalOpen(false)}
      />
    </div>
  );
};
