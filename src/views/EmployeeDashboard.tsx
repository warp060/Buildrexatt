import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api';
import { AttendanceRecord, WorkUpdate, LeaveRequest } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import {
  Clock,
  Play,
  Square,
  FileCheck2,
  Calendar,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  CheckCircle,
  Clock4,
  ExternalLink,
  Sparkles,
  ShieldCheck,
  Zap,
  Award,
} from 'lucide-react';
import { useToast } from '../context/ToastContext';

interface EmployeeDashboardProps {
  onNavigateTab: (tabId: string) => void;
}

export const EmployeeDashboard: React.FC<EmployeeDashboardProps> = ({ onNavigateTab }) => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [todayAttendance, setTodayAttendance] = useState<{
    record: AttendanceRecord | null;
    status_summary: 'Not Started' | 'Checked In' | 'Checked Out';
  }>({ record: null, status_summary: 'Not Started' });

  const [todayWorkUpdate, setTodayWorkUpdate] = useState<{
    record: WorkUpdate | null;
    is_submitted: boolean;
  }>({ record: null, is_submitted: false });

  const [recentAttendance, setRecentAttendance] = useState<AttendanceRecord[]>([]);
  const [recentUpdates, setRecentUpdates] = useState<WorkUpdate[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [weekSummary, setWeekSummary] = useState({ total_hours: 0, days_logged: 0 });

  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [actionFeedback, setActionFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Fetch all dashboard data
  const loadDashboardData = useCallback(async () => {
    try {
      const [todayAttRes, todayWuRes, historyRes, wuRes, leaveRes] = await Promise.all([
        api.getTodayAttendance(),
        api.getTodayWorkUpdate(),
        api.getAttendanceHistory({ limit: 5 }),
        api.getMyWorkUpdates({ limit: 4 }),
        api.getMyLeaveRequests(),
      ]);

      if (todayAttRes.success) {
        setTodayAttendance({
          record: todayAttRes.record,
          status_summary: todayAttRes.status_summary,
        });

        if (todayAttRes.record && !todayAttRes.record.check_out) {
          const startTime = new Date(todayAttRes.record.check_in).getTime();
          const diffSec = Math.max(0, Math.floor((Date.now() - startTime) / 1000));
          setElapsedSeconds(diffSec);
        } else if (todayAttRes.record && todayAttRes.record.check_out) {
          setElapsedSeconds(todayAttRes.record.total_minutes * 60);
        }
      }

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
  }, [loadDashboardData]);

  // Live timer tick when Checked In and active
  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    if (todayAttendance.record && !todayAttendance.record.check_out) {
      timer = setInterval(() => {
        const startTime = new Date(todayAttendance.record!.check_in).getTime();
        setElapsedSeconds(Math.max(0, Math.floor((Date.now() - startTime) / 1000)));
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [todayAttendance.record]);

  const handleCheckIn = async () => {
    setIsActionLoading(true);
    setActionFeedback(null);
    try {
      const res = await api.checkIn();
      setActionFeedback({ type: 'success', message: res.message });
      showToast(res.message, 'success');
      await loadDashboardData();
    } catch (err: any) {
      setActionFeedback({ type: 'error', message: err.message });
      showToast(err.message, 'error');
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleCheckOut = async () => {
    setIsActionLoading(true);
    setActionFeedback(null);
    try {
      const res = await api.checkOut();
      setActionFeedback({ type: 'success', message: res.message });
      showToast(res.message, 'success');
      await loadDashboardData();
    } catch (err: any) {
      setActionFeedback({ type: 'error', message: err.message });
      showToast(err.message, 'error');
    } finally {
      setIsActionLoading(false);
    }
  };

  const formatTimer = (totalSec: number) => {
    const hours = Math.floor(totalSec / 3600);
    const minutes = Math.floor((totalSec % 3600) / 60);
    const seconds = totalSec % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  };

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
          <div className="w-12 h-12 rounded-2xl bg-brand-gradient text-white flex items-center justify-center font-black text-lg shadow-md shrink-0 ring-2 ring-white">
            {user?.name?.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 font-medium">
              <span>{todayFormatted}</span>
              <span className="text-slate-300">·</span>
              <span className="capitalize px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-semibold text-[10px]">
                {user?.role} Portal
              </span>
              <span className="text-slate-300">·</span>
              <span className="text-emerald-700 font-semibold flex items-center gap-1 text-[11px]">
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

        {/* Action feedback alert */}
        {actionFeedback && (
          <div
            className={`relative z-10 px-4 py-2.5 text-xs rounded-xl border flex items-center gap-2 ${
              actionFeedback.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200 shadow-xs'
                : 'bg-rose-50 text-rose-800 border-rose-200 shadow-xs'
            }`}
          >
            {actionFeedback.type === 'success' ? (
              <CheckCircle className="w-4 h-4 shrink-0 text-emerald-600" />
            ) : (
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
            )}
            <span className="font-medium">{actionFeedback.message}</span>
          </div>
        )}
      </div>

      {/* Main Core Action Grid: Attendance Clock Card & Today's Work Report Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 sm:gap-6">
        {/* Attendance Action & Live Duration Counter */}
        <div className="lg:col-span-2 card-premium p-5 sm:p-6 flex flex-col justify-between relative overflow-hidden bg-white/95">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-brand-accent pulse-dot" />
                <h2 className="text-sm sm:text-base font-extrabold text-slate-900 tracking-tight">
                  Biometric Attendance Station
                </h2>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">High-integrity biometric timestamping</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 hidden sm:inline">Status:</span>
              <StatusBadge
                status={
                  todayAttendance.status_summary === 'Checked In'
                    ? 'present'
                    : todayAttendance.status_summary === 'Checked Out'
                    ? 'present'
                    : 'absent'
                }
              />
            </div>
          </div>

          <div className="py-6 sm:py-8 flex flex-col md:flex-row items-center justify-between gap-6">
            {/* Live Timer Counter */}
            <div className="text-center md:text-left">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                {todayAttendance.status_summary === 'Checked In'
                  ? '⚡ Working Session Active'
                  : todayAttendance.status_summary === 'Checked Out'
                  ? '✓ Logged Working Duration'
                  : 'Session Ready to Begin'}
              </p>
              <div className="mt-2 font-mono text-4xl sm:text-6xl font-black tabular-nums text-slate-900 tracking-tight digital-glow">
                {formatTimer(elapsedSeconds)}
              </div>
              <div className="mt-3 text-xs text-slate-500 flex flex-wrap items-center justify-center md:justify-start gap-2.5">
                <span className="bg-slate-50 px-2 py-1 rounded-md border border-slate-200">
                  Clock In:{' '}
                  <strong className="text-slate-800 font-mono font-bold">
                    {todayAttendance.record
                      ? new Date(todayAttendance.record.check_in).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : '--:--'}
                  </strong>
                </span>
                <span className="bg-slate-50 px-2 py-1 rounded-md border border-slate-200">
                  Clock Out:{' '}
                  <strong className="text-slate-800 font-mono font-bold">
                    {todayAttendance.record?.check_out
                      ? new Date(todayAttendance.record.check_out).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : '--:--'}
                  </strong>
                </span>
              </div>
            </div>

            {/* Check In / Out Main CTA Button */}
            <div className="w-full md:w-auto flex flex-col items-center">
              {todayAttendance.status_summary === 'Not Started' && (
                <button
                  onClick={handleCheckIn}
                  disabled={isActionLoading}
                  className="w-full md:w-56 flex items-center justify-center gap-2.5 py-4 px-6 rounded-2xl font-bold text-sm text-white bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-600 hover:opacity-95 active:scale-[0.98] transition-all shadow-lg shadow-emerald-600/25 disabled:opacity-50 cursor-pointer"
                >
                  <Play className="w-5 h-5 fill-current" />
                  <span>{isActionLoading ? 'Timestamping...' : 'Punch In Now'}</span>
                </button>
              )}

              {todayAttendance.status_summary === 'Checked In' && (
                <button
                  onClick={handleCheckOut}
                  disabled={isActionLoading}
                  className="w-full md:w-56 flex items-center justify-center gap-2.5 py-4 px-6 rounded-2xl font-bold text-sm text-white bg-gradient-to-r from-rose-600 via-rose-500 to-red-600 hover:opacity-95 active:scale-[0.98] transition-all shadow-lg shadow-rose-600/25 disabled:opacity-50 cursor-pointer"
                >
                  <Square className="w-5 h-5 fill-current" />
                  <span>{isActionLoading ? 'Closing...' : 'Punch Out Now'}</span>
                </button>
              )}

              {todayAttendance.status_summary === 'Checked Out' && (
                <div className="w-full md:w-56 text-center p-4 rounded-2xl bg-emerald-50 border border-emerald-200/90 text-emerald-800 text-xs font-semibold shadow-xs">
                  <div className="flex items-center gap-1.5 justify-center">
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                    <span>Session Concluded</span>
                  </div>
                  <span className="block text-[11px] text-emerald-600 mt-1 font-mono font-bold">
                    Recorded: {(todayAttendance.record?.total_minutes! / 60).toFixed(1)} hrs worked
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between text-xs text-slate-500 gap-2">
            <span className="flex items-center gap-1.5">
              <Clock4 className="w-3.5 h-3.5 text-slate-400" />
              Standard Shift: 09:00 AM – 06:00 PM (15m grace window)
            </span>
            <button
              onClick={() => onNavigateTab('my-attendance')}
              className="font-bold text-brand-accent hover:underline flex items-center gap-1 cursor-pointer"
            >
              Full Attendance Record <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Daily Work Update Card */}
        <div className="card-premium p-5 sm:p-6 flex flex-col justify-between bg-white/95">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <FileCheck2 className="w-4 h-4 text-brand-accent" />
                <h2 className="text-sm font-extrabold text-slate-900 tracking-tight">Today's Work Report</h2>
              </div>
              <StatusBadge
                status={todayWorkUpdate.is_submitted ? 'submitted' : 'draft'}
                type="work_update"
              />
            </div>

            <div className="mt-4">
              {todayWorkUpdate.is_submitted ? (
                <div className="space-y-3">
                  <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-200/80">
                    <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Project / Focus Area</p>
                    <p className="text-xs font-bold text-slate-900 mt-0.5 line-clamp-1">
                      {todayWorkUpdate.record?.project_details}
                    </p>
                  </div>
                  <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-200/80">
                    <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Tasks Completed</p>
                    <p className="text-xs text-slate-700 mt-0.5 whitespace-pre-line line-clamp-2">
                      {todayWorkUpdate.record?.tasks_completed}
                    </p>
                  </div>
                  {todayWorkUpdate.record?.review_comment && (
                    <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-900">
                      <p className="font-bold text-[10px] uppercase text-emerald-700">Supervisor Review</p>
                      <p className="mt-0.5 text-xs font-medium">{todayWorkUpdate.record.review_comment}</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="py-5 text-center">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-brand-accent flex items-center justify-center mx-auto mb-3 shadow-2xs">
                    <FileCheck2 className="w-6 h-6" />
                  </div>
                  <p className="text-xs font-bold text-slate-900">Daily Log Pending</p>
                  <p className="text-[11px] text-slate-500 mt-1 max-w-xs mx-auto">
                    Record tasks completed, blockers encountered, and tomorrow's trajectory.
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100">
            <button
              onClick={() => onNavigateTab('work-updates')}
              className="w-full py-3 px-4 rounded-xl text-xs font-bold text-white bg-brand-gradient hover:opacity-95 transition-all flex items-center justify-center gap-2 shadow-sm cursor-pointer active:scale-[0.99]"
            >
              {todayWorkUpdate.is_submitted ? 'View or Edit Report' : 'Draft / Submit Daily Report'}
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* KPI Stats Strip — 4 Vibrant Executive Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
        {/* Metric 1 */}
        <div className="card-premium-interactive p-4 sm:p-5 bg-white/95">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Logged Time
            </span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-brand-accent flex items-center justify-center shadow-2xs">
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

        {/* Metric 2 */}
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

        {/* Metric 3 */}
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

        {/* Metric 4 */}
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
                      {new Date(rec.check_in).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      {' - '}
                      {rec.check_out
                        ? new Date(rec.check_out).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                        : 'Active'}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-mono tabular-nums font-bold text-slate-700">
                      {(rec.total_minutes / 60).toFixed(1)} hrs
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
