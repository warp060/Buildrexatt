import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api';
import { AttendanceRecord, WorkUpdate, LeaveRequest } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { formatClockTime, getElapsedSeconds } from '../utils/time';
import {
  Clock,
  FileCheck2,
  Calendar,
  ArrowRight,
  TrendingUp,
  Clock4,
  Zap,
  Award,
  History,
} from 'lucide-react';

interface EmployeeDashboardProps {
  onNavigateTab: (tabId: string) => void;
}

export const EmployeeDashboard: React.FC<EmployeeDashboardProps> = ({ onNavigateTab }) => {
  const { user } = useAuth();

  const [todayWorkUpdate, setTodayWorkUpdate] = useState<{
    record: WorkUpdate | null;
    is_submitted: boolean;
  }>({ record: null, is_submitted: false });

  const [recentAttendance, setRecentAttendance] = useState<AttendanceRecord[]>([]);
  const [recentUpdates, setRecentUpdates] = useState<WorkUpdate[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [weekSummary, setWeekSummary] = useState({ total_hours: 0, days_logged: 0 });

  // Fetch all dashboard data
  const loadDashboardData = useCallback(async () => {
    try {
      const [todayWuRes, historyRes, wuRes, leaveRes] = await Promise.all([
        api.getTodayWorkUpdate(),
        api.getAttendanceHistory({ limit: 5 }),
        api.getMyWorkUpdates({ limit: 4 }),
        api.getMyLeaveRequests(),
      ]);

      if (todayWuRes.success) {
        setTodayWorkUpdate({
          record: todayWuRes.record,
          is_submitted: todayWuRes.is_submitted,
        });
      }

      if (historyRes.success) {
        setRecentAttendance(historyRes.records);
        setWeekSummary({
          total_hours: historyRes.summary.total_hours_worked,
          days_logged: historyRes.summary.total_days_logged,
        });
      }

      if (wuRes.success) {
        setRecentUpdates(wuRes.records);
      }

      if (leaveRes.success) {
        setLeaveRequests(leaveRes.records);
      }
    } catch (err) {
      console.error('Failed to load employee dashboard data', err);
    }
  }, []);

  useEffect(() => {
    loadDashboardData();
    const interval = setInterval(() => {
      loadDashboardData();
    }, 8000);
    const handleFocus = () => loadDashboardData();
    window.addEventListener('focus', handleFocus);
    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
    };
  }, [loadDashboardData]);

  const todayFormatted = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className="space-y-5 sm:space-y-6">
      {/* Greeting Banner */}
      <div className="card-premium p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 relative overflow-hidden bg-white/95">
        <div className="absolute top-0 right-0 w-80 h-80 bg-brand-glow-subtle rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

        <div className="relative z-10 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#0F5132] to-[#0A3822] text-white flex items-center justify-center font-black text-lg shadow-sm shrink-0 ring-1 ring-emerald-900/20">
            {user?.name?.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 font-medium">
              <span>{todayFormatted}</span>
              <span className="text-slate-300">·</span>
              <span className="capitalize px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-semibold text-[10px]">
                {user?.role} Portal
              </span>
              <span className="text-slate-300">·</span>
              <span className="text-emerald-800 font-semibold flex items-center gap-1 text-[11px] bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/80">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 pulse-dot" />
                Active Session
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 mt-1">
              {getGreeting()}, {user?.name}
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              {user?.position} · {user?.department_name} ({user?.employee_code})
            </p>
          </div>
        </div>

        <div className="relative z-10 flex items-center gap-3">
          <button
            onClick={() => onNavigateTab('my-attendance')}
            className="flex items-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold text-[#0F5132] bg-emerald-50 hover:bg-emerald-100/80 border border-emerald-200/90 transition-all cursor-pointer group shadow-2xs"
          >
            <Clock className="w-4 h-4 text-[#0F5132]" />
            <span>Click to Present</span>
            <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
          </button>
        </div>
      </div>

      {/* KPI Stats Strip — 4 Executive Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
        {/* Metric 1: Logged Time */}
        <div className="card-premium-interactive p-4 sm:p-5 bg-white/95">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Logged Time
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-[#0F5132] flex items-center justify-center shadow-2xs">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black font-mono tabular-nums text-slate-900 mt-2">
            {weekSummary.total_hours} <span className="text-xs font-semibold text-slate-400">hrs</span>
          </p>
          <div className="mt-2 flex items-center gap-1.5 text-[11px] text-slate-500">
            <span className="font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.2 rounded font-mono">
              {weekSummary.days_logged} days
            </span>
            <span>logged this week</span>
          </div>
        </div>

        {/* Metric 2: Leave Balance */}
        <div className="card-premium-interactive p-4 sm:p-5 bg-white/95">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Leave Balance
            </span>
            <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center shadow-2xs">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black font-mono tabular-nums text-slate-900 mt-2">
            12 <span className="text-xs font-semibold text-slate-400">days</span>
          </p>
          <div className="mt-2 text-[11px] text-slate-500 flex items-center gap-1">
            <span className="font-semibold text-teal-600 bg-teal-50 px-1.5 py-0.2 rounded">
              Allocated
            </span>
            <span>Casual &amp; Sick PTO</span>
          </div>
        </div>

        {/* Metric 3: Reports Filed */}
        <div className="card-premium-interactive p-4 sm:p-5 bg-white/95">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Reports Filed
            </span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center shadow-2xs">
              <FileCheck2 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black font-mono tabular-nums text-slate-900 mt-2">
            {recentUpdates.filter((u) => u.status === 'submitted' || u.status === 'reviewed').length}
          </p>
          <div className="mt-2 text-[11px] text-slate-500 flex items-center gap-1">
            <span className="font-semibold text-purple-600 bg-purple-50 px-1.5 py-0.2 rounded">
              Current Sprint
            </span>
            <span>Verified work</span>
          </div>
        </div>

        {/* Metric 4: Punctuality Rate */}
        <div className="card-premium-interactive p-4 sm:p-5 bg-white/95">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Punctuality Rate
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shadow-2xs">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black font-mono tabular-nums text-slate-900 mt-2">
            96%
          </p>
          <div className="mt-2 text-[11px] text-emerald-600 flex items-center gap-1 font-semibold">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Top tier punctuality</span>
          </div>
        </div>
      </div>

      {/* Core Action Grid: Today's Work Report & Workspace Quick Access */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 sm:gap-6">
        {/* Today's Work Report (Spans 2 columns) */}
        <div className="lg:col-span-2 card-premium p-5 sm:p-6 flex flex-col justify-between bg-white/95">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <FileCheck2 className="w-4 h-4 text-[#0F5132]" />
                <h2 className="text-sm sm:text-base font-extrabold text-slate-900 tracking-tight">
                  Today's Work Report
                </h2>
              </div>
              <StatusBadge
                status={todayWorkUpdate.is_submitted ? 'submitted' : 'draft'}
                type="work_update"
              />
            </div>

            <div className="mt-4">
              {todayWorkUpdate.is_submitted ? (
                <div className="space-y-3">
                  <div className="p-3.5 bg-slate-50/80 rounded-xl border border-slate-200/80">
                    <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Project / Focus Area</p>
                    <p className="text-sm font-bold text-slate-900 mt-1">
                      {todayWorkUpdate.record?.project_details}
                    </p>
                  </div>
                  <div className="p-3.5 bg-slate-50/80 rounded-xl border border-slate-200/80">
                    <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Tasks &amp; Deliverables Completed</p>
                    <p className="text-xs text-slate-700 mt-1 whitespace-pre-line line-clamp-3">
                      {todayWorkUpdate.record?.tasks_completed}
                    </p>
                  </div>
                  {todayWorkUpdate.record?.review_comment && (
                    <div className="p-3.5 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-900">
                      <p className="font-bold text-[10px] uppercase text-emerald-700">Supervisor Review</p>
                      <p className="mt-1 text-xs font-medium">{todayWorkUpdate.record.review_comment}</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="py-7 text-center">
                  <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-[#0F5132] flex items-center justify-center mx-auto mb-3 shadow-2xs">
                    <FileCheck2 className="w-7 h-7" />
                  </div>
                  <p className="text-sm font-bold text-slate-900">Daily Log Pending</p>
                  <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                    Record tasks completed today, sprint milestones, blockers encountered, and tomorrow's trajectory for your supervisor's review.
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="mt-5 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
            <span className="text-xs text-slate-400">
              {todayWorkUpdate.is_submitted ? 'Submitted for supervisor review' : 'Daily submission required before shift conclusion'}
            </span>
            <button
              onClick={() => onNavigateTab('work-updates')}
              className="py-2.5 px-5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-[#0F5132] to-[#0A3822] hover:opacity-95 transition-all flex items-center justify-center gap-2 shadow-sm shadow-emerald-950/20 cursor-pointer active:scale-[0.99]"
            >
              {todayWorkUpdate.is_submitted ? 'View or Edit Report' : 'Draft / Submit Daily Report'}
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Quick Workspace Navigation & Schedule (Spans 1 column) */}
        <div className="card-premium p-5 sm:p-6 flex flex-col justify-between bg-white/95">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-[#0F5132]" />
                <h2 className="text-sm font-extrabold text-slate-900 tracking-tight">Workspace Hub</h2>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Shortcuts</span>
            </div>

            <div className="mt-4 space-y-2.5">
              <button
                onClick={() => onNavigateTab('my-attendance')}
                className="w-full p-3 rounded-xl border border-slate-200/90 hover:border-emerald-300 hover:bg-emerald-50/40 transition-all flex items-center justify-between group cursor-pointer text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 text-[#0F5132] flex items-center justify-center group-hover:scale-105 transition-transform">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900 group-hover:text-[#0F5132] transition-colors">
                      Click to Present
                    </p>
                    <p className="text-[10px] text-slate-400">Timestamp check-in &amp; check-out</p>
                  </div>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#0F5132] group-hover:translate-x-0.5 transition-all" />
              </button>

              <button
                onClick={() => onNavigateTab('leave')}
                className="w-full p-3 rounded-xl border border-slate-200/90 hover:border-teal-300 hover:bg-teal-50/40 transition-all flex items-center justify-between group cursor-pointer text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center group-hover:scale-105 transition-transform">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900 group-hover:text-teal-800 transition-colors">
                      Leave &amp; Corrections
                    </p>
                    <p className="text-[10px] text-slate-400">Apply for PTO or time adjustments</p>
                  </div>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-teal-700 group-hover:translate-x-0.5 transition-all" />
              </button>

              <button
                onClick={() => onNavigateTab('work-history')}
                className="w-full p-3 rounded-xl border border-slate-200/90 hover:border-indigo-300 hover:bg-indigo-50/40 transition-all flex items-center justify-between group cursor-pointer text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center group-hover:scale-105 transition-transform">
                    <History className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900 group-hover:text-indigo-800 transition-colors">
                      Work History
                    </p>
                    <p className="text-[10px] text-slate-400">Review all past submitted tasks</p>
                  </div>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-700 group-hover:translate-x-0.5 transition-all" />
              </button>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
            <span className="flex items-center gap-1.5">
              <Clock4 className="w-3.5 h-3.5 text-slate-400" />
              Shift: 09:00 AM – 06:00 PM
            </span>
            <span className="text-emerald-700 font-semibold font-mono">15m grace</span>
          </div>
        </div>
      </div>

      {/* Split Grid: Recent Attendance Logs & Work Updates History */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6">
        {/* Recent Attendance */}
        <div className="card-premium p-5 bg-white/95">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-brand-accent" />
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Recent Attendance Records</h3>
            </div>
            <button
              onClick={() => onNavigateTab('my-attendance')}
              className="text-xs font-bold text-brand-accent hover:underline cursor-pointer"
            >
              View all
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {recentAttendance.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">No attendance logs available</p>
            ) : (
              recentAttendance.map((rec) => (
                <div key={rec.id} className="py-3 flex items-center justify-between text-xs hover:bg-slate-50/80 px-2 rounded-xl transition-colors">
                  <div>
                    <span className="font-bold text-slate-900">{rec.work_date}</span>
                    <span className="text-slate-300 mx-2">·</span>
                    <span className="font-mono text-slate-500">
                      {formatClockTime(rec.check_in)}
                      {' - '}
                      {rec.check_out ? formatClockTime(rec.check_out) : 'Active'}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-mono tabular-nums font-bold text-slate-700">
                      {!rec.check_out ? (
                        <span className="text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded text-[11px] inline-flex items-center gap-1 font-mono font-bold">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          {(getElapsedSeconds(rec.check_in) / 3600).toFixed(1)} hrs
                        </span>
                      ) : (
                        `${(rec.total_minutes / 60).toFixed(1)} hrs`
                      )}
                    </span>
                    <StatusBadge status={rec.status} />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Work Updates */}
        <div className="card-premium p-5 bg-white/95">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
            <div className="flex items-center gap-2">
              <FileCheck2 className="w-4 h-4 text-brand-accent" />
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Recent Work Submissions</h3>
            </div>
            <button
              onClick={() => onNavigateTab('work-history')}
              className="text-xs font-bold text-brand-accent hover:underline cursor-pointer"
            >
              View all
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {recentUpdates.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">No recent work updates</p>
            ) : (
              recentUpdates.map((update) => (
                <div key={update.id} className="py-3 flex items-start justify-between text-xs gap-3 hover:bg-slate-50/80 px-2 rounded-xl transition-colors">
                  <div className="min-w-0">
                    <p className="font-bold text-slate-900 truncate">{update.project_details}</p>
                    <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                      <span className="font-medium">{update.work_date}</span>
                      <span className="text-slate-300">·</span>
                      <span className="font-mono font-semibold text-slate-700">{update.hours_spent} hrs logged</span>
                    </div>
                  </div>
                  <StatusBadge status={update.status} type="work_update" />
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
