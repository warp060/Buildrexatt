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

  return (
    <div className="space-y-6">
      {/* Greeting Banner */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
            <span>{todayFormatted}</span>
            <span>·</span>
            <span className="capitalize">{user?.role} Portal</span>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 mt-1">
            Good day, {user?.name}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {user?.position} · {user?.department_name} ({user?.employee_code})
          </p>
        </div>

        {/* Action feedback alert */}
        {actionFeedback && (
          <div
            className={`px-4 py-2 text-xs rounded-lg border flex items-center gap-2 ${
              actionFeedback.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : 'bg-rose-50 text-rose-800 border-rose-200'
            }`}
          >
            {actionFeedback.type === 'success' ? (
              <CheckCircle className="w-4 h-4 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 shrink-0" />
            )}
            <span>{actionFeedback.message}</span>
          </div>
        )}
      </div>

      {/* Main Core Action Grid: Attendance Clock Card & Today's Work Report Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Attendance Action & Live Duration Counter */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-6 shadow-2xs">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-sm font-bold text-slate-900 tracking-tight">Today's Attendance Session</h2>
              <p className="text-xs text-slate-500">Official biometric attendance logging</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">Status:</span>
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

          <div className="py-6 flex flex-col md:flex-row items-center justify-between gap-6">
            {/* Live Timer Counter */}
            <div className="text-center md:text-left">
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                {todayAttendance.status_summary === 'Checked In'
                  ? 'Active Working Session'
                  : todayAttendance.status_summary === 'Checked Out'
                  ? 'Completed Working Duration'
                  : 'Session Not Started'}
              </p>
              <div className="mt-1 font-mono text-4xl sm:text-5xl font-bold tabular-nums text-slate-900 tracking-tight">
                {formatTimer(elapsedSeconds)}
              </div>
              <div className="mt-2 text-xs text-slate-500 flex items-center justify-center md:justify-start gap-3">
                <span>
                  Check In:{' '}
                  <strong className="text-slate-700 font-mono">
                    {todayAttendance.record
                      ? new Date(todayAttendance.record.check_in).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : '--:--'}
                  </strong>
                </span>
                <span>·</span>
                <span>
                  Check Out:{' '}
                  <strong className="text-slate-700 font-mono">
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
                  className="w-full md:w-48 flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl font-semibold text-xs text-white bg-[#0B1F3A] hover:bg-[#142C4E] active:scale-[0.99] transition-all shadow-sm disabled:opacity-50"
                >
                  <Play className="w-4 h-4 fill-current" />
                  {isActionLoading ? 'Processing...' : 'Check In Now'}
                </button>
              )}

              {todayAttendance.status_summary === 'Checked In' && (
                <button
                  onClick={handleCheckOut}
                  disabled={isActionLoading}
                  className="w-full md:w-48 flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl font-semibold text-xs text-white bg-rose-600 hover:bg-rose-700 active:scale-[0.99] transition-all shadow-sm disabled:opacity-50"
                >
                  <Square className="w-4 h-4 fill-current" />
                  {isActionLoading ? 'Processing...' : 'Check Out Now'}
                </button>
              )}

              {todayAttendance.status_summary === 'Checked Out' && (
                <div className="text-center p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium">
                  <div className="flex items-center gap-1.5 justify-center">
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                    <span>Attendance Complete Today</span>
                  </div>
                  <span className="block text-[11px] text-emerald-600 mt-0.5">
                    Total recorded: {(todayAttendance.record?.total_minutes! / 60).toFixed(1)} hrs
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between text-xs text-slate-500 gap-2">
            <span>Official shift: 09:00 AM - 06:00 PM (15m grace period)</span>
            <button
              onClick={() => onNavigateTab('my-attendance')}
              className="font-medium text-[#0B1F3A] hover:underline flex items-center gap-1"
            >
              View full attendance history <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Daily Work Update Card */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-sm font-bold text-slate-900 tracking-tight">Today's Daily Report</h2>
              <StatusBadge
                status={todayWorkUpdate.is_submitted ? 'submitted' : 'draft'}
                type="work_update"
              />
            </div>

            <div className="mt-4">
              {todayWorkUpdate.is_submitted ? (
                <div className="space-y-3">
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <p className="text-[11px] font-semibold text-slate-500">Project / Focus Area</p>
                    <p className="text-xs font-medium text-slate-900 mt-0.5 line-clamp-1">
                      {todayWorkUpdate.record?.project_details}
                    </p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <p className="text-[11px] font-semibold text-slate-500">Tasks Completed</p>
                    <p className="text-xs text-slate-700 mt-0.5 whitespace-pre-line line-clamp-2">
                      {todayWorkUpdate.record?.tasks_completed}
                    </p>
                  </div>
                  {todayWorkUpdate.record?.review_comment && (
                    <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200 text-xs text-emerald-900">
                      <p className="font-semibold text-[11px] text-emerald-700">Supervisor Review</p>
                      <p className="mt-0.5">{todayWorkUpdate.record.review_comment}</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="py-4 text-center">
                  <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center mx-auto mb-2">
                    <FileCheck2 className="w-5 h-5" />
                  </div>
                  <p className="text-xs font-semibold text-slate-800">Daily Report Pending</p>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Please submit your daily accomplishments, blockers, and next-day plan before 6:30 PM.
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100">
            <button
              onClick={() => onNavigateTab('work-updates')}
              className="w-full py-2.5 px-4 rounded-lg text-xs font-semibold text-white bg-[#0B1F3A] hover:bg-[#142C4E] transition-colors flex items-center justify-center gap-2"
            >
              {todayWorkUpdate.is_submitted ? 'View or Edit Report' : 'Draft / Submit Daily Report'}
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* KPI Stats Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Logged Hours (Recent)</p>
          <p className="text-xl font-bold font-mono tabular-nums text-slate-900 mt-1">
            {weekSummary.total_hours} <span className="text-xs font-normal text-slate-400">hrs</span>
          </p>
          <span className="text-[11px] text-slate-500 mt-1 block">Across {weekSummary.days_logged} recorded days</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Leave Balance</p>
          <p className="text-xl font-bold font-mono tabular-nums text-slate-900 mt-1">
            12 <span className="text-xs font-normal text-slate-400">days</span>
          </p>
          <span className="text-[11px] text-slate-500 mt-1 block">Casual & Sick allocated</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Reports Submitted</p>
          <p className="text-xl font-bold font-mono tabular-nums text-slate-900 mt-1">
            {recentUpdates.filter((u) => u.status === 'submitted' || u.status === 'reviewed').length}
          </p>
          <span className="text-[11px] text-slate-500 mt-1 block">Approved & current sprint</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Punctuality Score</p>
          <p className="text-xl font-bold font-mono tabular-nums text-slate-900 mt-1">
            96%
          </p>
          <span className="text-[11px] text-emerald-600 mt-1 block">On-time arrival threshold</span>
        </div>
      </div>

      {/* Split Grid: Recent Attendance Logs & Work Updates History */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Attendance */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Recent Attendance Records</h3>
            <button
              onClick={() => onNavigateTab('my-attendance')}
              className="text-xs font-medium text-[#0B1F3A] hover:underline"
            >
              View all
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {recentAttendance.length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center">No attendance logs available</p>
            ) : (
              recentAttendance.map((rec) => (
                <div key={rec.id} className="py-2.5 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-medium text-slate-800">{rec.work_date}</span>
                    <span className="text-slate-400 mx-1.5">·</span>
                    <span className="font-mono text-slate-500">
                      {new Date(rec.check_in).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      {' - '}
                      {rec.check_out
                        ? new Date(rec.check_out).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                        : 'Active'}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-mono tabular-nums text-slate-600">
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
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Recent Work Submissions</h3>
            <button
              onClick={() => onNavigateTab('work-history')}
              className="text-xs font-medium text-[#0B1F3A] hover:underline"
            >
              View all
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {recentUpdates.length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center">No recent work updates</p>
            ) : (
              recentUpdates.map((update) => (
                <div key={update.id} className="py-2.5 flex items-start justify-between text-xs gap-3">
                  <div className="min-w-0">
                    <p className="font-medium text-slate-900 truncate">{update.project_details}</p>
                    <div className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                      <span>{update.work_date}</span>
                      <span>·</span>
                      <span className="font-mono">{update.hours_spent} hrs</span>
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
