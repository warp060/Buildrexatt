import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../api';
import { DashboardStats, AttendanceRecord } from '../types';
import { StatusBadge } from '../components/StatusBadge';
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
} from 'lucide-react';

interface AdminDashboardViewProps {
  onNavigateTab: (tabId: string) => void;
}

export const AdminDashboardView: React.FC<AdminDashboardViewProps> = ({ onNavigateTab }) => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentAttendance, setRecentAttendance] = useState<AttendanceRecord[]>([]);
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
    <div className="space-y-6">
      {/* Top Header */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
            <span>{todayStr}</span>
            <span>·</span>
            <span>Executive Operations Control</span>
            <span>·</span>
            <span className="inline-flex items-center gap-1 font-mono text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
              <Cloud className="w-3 h-3 text-indigo-600" />
              TiDB Cloud Ready
            </span>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 mt-1">
            Enterprise Attendance & Work Dashboard
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time biometric attendance metrics, daily progress tracking, and workforce oversight
          </p>
        </div>

        {/* Quick action buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigateTab('admin-approvals')}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-[#0B1F3A] bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
          >
            <span>Review Pending Requests</span>
            {(stats?.pending_leave_requests || 0) + (stats?.pending_corrections || 0) > 0 && (
              <span className="w-5 h-5 rounded-full bg-amber-500 text-white text-[10px] flex items-center justify-center font-bold">
                {(stats?.pending_leave_requests || 0) + (stats?.pending_corrections || 0)}
              </span>
            )}
          </button>
          <button
            onClick={() => onNavigateTab('admin-work-updates')}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-[#0B1F3A] hover:bg-[#142C4E] rounded-lg transition-colors shadow-2xs"
          >
            <span>Review Daily Reports</span>
            {(stats?.pending_work_updates || 0) > 0 && (
              <span className="w-5 h-5 rounded-full bg-blue-500 text-white text-[10px] flex items-center justify-center font-bold">
                {stats?.pending_work_updates}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* KPI Cards Row 1: Primary Attendance Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Total Active Team</p>
          <p className="text-2xl font-bold font-mono tabular-nums text-slate-900 mt-1">
            {stats?.total_users || 0}
          </p>
          <span className="text-[10px] text-slate-500 mt-0.5 block">
            {stats?.active_employees || 0} emp · {stats?.active_interns || 0} intern
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Present Today</p>
          <p className="text-2xl font-bold font-mono tabular-nums text-emerald-700 mt-1">
            {stats?.present_today || 0}
          </p>
          <span className="text-[10px] text-emerald-600 mt-0.5 block">
            {stats?.attendance_rate_percent || 0}% attendance rate
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Currently Working</p>
          <p className="text-2xl font-bold font-mono tabular-nums text-blue-700 mt-1">
            {stats?.currently_working || 0}
          </p>
          <span className="text-[10px] text-blue-600 mt-0.5 block">Active workstations</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Absent Today</p>
          <p className="text-2xl font-bold font-mono tabular-nums text-rose-700 mt-1">
            {stats?.absent_today || 0}
          </p>
          <span className="text-[10px] text-slate-500 mt-0.5 block">Unaccounted absence</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">On Approved Leave</p>
          <p className="text-2xl font-bold font-mono tabular-nums text-purple-700 mt-1">
            {stats?.on_leave_today || 0}
          </p>
          <span className="text-[10px] text-slate-500 mt-0.5 block">Approved scheduled off</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Pending Submissions</p>
          <p className="text-2xl font-bold font-mono tabular-nums text-amber-700 mt-1">
            {stats?.pending_work_updates || 0}
          </p>
          <span className="text-[10px] text-amber-600 mt-0.5 block">Awaiting admin review</span>
        </div>
      </div>

      {/* Middle Section: 7-Day Attendance Trend Chart & Department Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 7-Day Attendance Trend */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-5 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  7-Day Attendance & Punctuality Trend
                </h2>
                <p className="text-[11px] text-slate-500">Daily check-in volume and late arrival ratio</p>
              </div>
              <div className="flex items-center gap-3 text-xs">
                <span className="flex items-center gap-1.5 text-slate-600">
                  <span className="w-2.5 h-2.5 rounded-sm bg-[#0B1F3A]" /> Present
                </span>
                <span className="flex items-center gap-1.5 text-slate-600">
                  <span className="w-2.5 h-2.5 rounded-sm bg-amber-500" /> Late Arrival
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
                  // Scale percentage relative to max team size (~6)
                  const heightPct = Math.min(100, Math.max(15, (total / 6) * 100));

                  return (
                    <div key={day.date} className="flex flex-col items-center h-full justify-end group">
                      <span className="text-[10px] font-mono text-slate-400 mb-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {total} staff
                      </span>
                      <div
                        className="w-full max-w-[40px] rounded-t-md overflow-hidden flex flex-col justify-end bg-slate-100"
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
                          className="bg-[#0B1F3A] w-full flex-1"
                          title={`${onTime} On-Time`}
                        />
                      </div>
                      <div className="text-center mt-2">
                        <span className="block text-[11px] font-medium text-slate-700">{dayLabel}</span>
                        <span className="block text-[9px] font-mono text-slate-400">{day.date.slice(5)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Standard workday grace window: 15 minutes</span>
            <button
              onClick={() => onNavigateTab('admin-reports')}
              className="text-[#0B1F3A] font-semibold hover:underline flex items-center gap-1"
            >
              Export full analytics <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Department Attendance Breakdown */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Department Attendance
              </h2>
              <span className="text-[11px] text-slate-400 font-mono">Real-time</span>
            </div>

            <div className="space-y-4">
              {departmentStats.map((dept) => (
                <div key={dept.id} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-900 truncate">{dept.name}</span>
                    <span className="font-mono text-slate-500 tabular-nums">
                      {dept.present_today}/{dept.total_members} ({dept.rate}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-[#0B1F3A] h-full rounded-full transition-all duration-300"
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
              className="w-full py-2 px-3 text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors text-center"
            >
              Filter Attendance by Department
            </button>
          </div>
        </div>
      </div>

      {/* Real-time Activity: Recent Attendance Stream Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-emerald-600" />
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Recent Attendance Check-Ins & Check-Outs
            </h2>
          </div>
          <button
            onClick={() => onNavigateTab('admin-attendance')}
            className="text-xs font-medium text-[#0B1F3A] hover:underline"
          >
            View all records
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/70 border-b border-slate-200 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4">Employee / Intern</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Department</th>
                <th className="py-3 px-4">Check In</th>
                <th className="py-3 px-4">Check Out</th>
                <th className="py-3 px-4 text-right">Total Hours</th>
                <th className="py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {recentAttendance.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-6 text-center text-slate-400">
                    No recent attendance records.
                  </td>
                </tr>
              ) : (
                recentAttendance.map((rec) => (
                  <tr key={rec.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-semibold text-slate-900 whitespace-nowrap">
                      {rec.user_name}
                      <span className="block text-[10px] font-mono text-slate-400 font-normal">
                        {rec.employee_code}
                      </span>
                    </td>
                    <td className="py-3 px-4 capitalize text-slate-600 whitespace-nowrap">
                      {rec.role}
                    </td>
                    <td className="py-3 px-4 text-slate-600 whitespace-nowrap">
                      {rec.department_name}
                    </td>
                    <td className="py-3 px-4 font-mono tabular-nums text-slate-600 whitespace-nowrap">
                      {new Date(rec.check_in).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="py-3 px-4 font-mono tabular-nums text-slate-600 whitespace-nowrap">
                      {rec.check_out ? (
                        new Date(rec.check_out).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                      ) : (
                        <span className="text-blue-600 font-sans font-medium">Currently Working</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums font-semibold text-slate-900 whitespace-nowrap">
                      {(rec.total_minutes / 60).toFixed(1)} hrs
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
    </div>
  );
};
