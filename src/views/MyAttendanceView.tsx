import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { api } from '../api';
import { AttendanceRecord } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { Modal } from '../components/Modal';
import { useToast } from '../context/ToastContext';
import { formatClockTime, formatLiveTimer, getElapsedSeconds } from '../utils/time';
import {
  Clock,
  Filter,
  Plus,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Play,
  Square,
  CheckCircle,
  MapPin,
  ShieldCheck,
  Wifi,
  Navigation,
} from 'lucide-react';

export const MyAttendanceView: React.FC = () => {
  const { showToast } = useToast();
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [summary, setSummary] = useState({
    total_days_logged: 0,
    total_hours_worked: 0,
    average_hours_per_day: 0,
    late_arrivals_count: 0,
    half_days_count: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Today's Live Attendance State
  const [todayAttendance, setTodayAttendance] = useState<{
    record: AttendanceRecord | null;
    status_summary: 'Not Started' | 'Checked In' | 'Checked Out';
  }>({ record: null, status_summary: 'Not Started' });
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [actionFeedback, setActionFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Correction Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAttendance, setSelectedAttendance] = useState<AttendanceRecord | null>(null);
  const [corrDate, setCorrDate] = useState('');
  const [corrCheckIn, setCorrCheckIn] = useState('09:00');
  const [corrCheckOut, setCorrCheckOut] = useState('18:00');
  const [corrReason, setCorrReason] = useState('');
  const [corrFeedback, setCorrFeedback] = useState<{ success?: boolean; message?: string }>({});
  const [isSubmittingCorr, setIsSubmittingCorr] = useState(false);

  const todayIsoDate = useMemo(() => new Date().toISOString().split('T')[0], []);

  const projectedCorrectionMinutes = useMemo(() => {
    if (!corrCheckIn || !corrCheckOut) return 0;
    const [hIn, mIn] = corrCheckIn.split(':').map(Number);
    const [hOut, mOut] = corrCheckOut.split(':').map(Number);
    return Math.max(0, (hOut * 60 + mOut) - (hIn * 60 + mIn));
  }, [corrCheckIn, corrCheckOut]);

  const loadTodayAttendance = useCallback(async () => {
    try {
      const res = await api.getTodayAttendance();
      if (res.success) {
        setTodayAttendance({
          record: res.record,
          status_summary: res.status_summary,
        });
        if (res.record && !res.record.check_out) {
          setElapsedSeconds(getElapsedSeconds(res.record.check_in));
        } else if (res.record && res.record.check_out) {
          setElapsedSeconds(res.record.total_minutes * 60);
        }
      }
    } catch (err) {
      console.error('Error fetching today attendance', err);
    }
  }, []);

  const fetchAttendance = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await api.getAttendanceHistory({
        status: statusFilter !== 'all' ? statusFilter : undefined,
        start_date: startDate || undefined,
        end_date: endDate || undefined,
        limit: 50,
      });
      if (res.success) {
        setRecords(res.records);
        setSummary(res.summary);
      }
    } catch (err) {
      console.error('Error fetching attendance history', err);
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter, startDate, endDate]);

  useEffect(() => {
    fetchAttendance();
    loadTodayAttendance();
  }, [fetchAttendance, loadTodayAttendance]);

  // Live timer tick when Checked In and active
  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    if (todayAttendance.record && !todayAttendance.record.check_out) {
      timer = setInterval(() => {
        setElapsedSeconds(getElapsedSeconds(todayAttendance.record!.check_in));
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
      await Promise.all([loadTodayAttendance(), fetchAttendance()]);
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
      await Promise.all([loadTodayAttendance(), fetchAttendance()]);
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

  const handleOpenCorrection = (att?: AttendanceRecord) => {
    setCorrFeedback({});
    if (att) {
      setSelectedAttendance(att);
      setCorrDate(att.work_date);
      setCorrCheckIn(
        new Date(att.check_in).toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' })
      );
      if (att.check_out) {
        setCorrCheckOut(
          new Date(att.check_out).toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' })
        );
      } else {
        setCorrCheckOut('18:00');
      }
    } else {
      setSelectedAttendance(null);
      setCorrDate(todayIsoDate);
      setCorrCheckIn('09:00');
      setCorrCheckOut('18:00');
    }
    setCorrReason('');
    setIsModalOpen(true);
  };

  const handleSubmitCorrection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!corrDate || !corrReason.trim()) {
      setCorrFeedback({ success: false, message: 'Work date and reason are required.' });
      return;
    }

    if (corrCheckOut <= corrCheckIn) {
      setCorrFeedback({
        success: false,
        message: 'Requested check-out time must be strictly later than check-in time.',
      });
      showToast('Requested check-out time must be after check-in time', 'warning');
      return;
    }

    if (corrDate > todayIsoDate) {
      setCorrFeedback({
        success: false,
        message: 'Attendance corrections cannot be submitted for future dates.',
      });
      showToast('Cannot submit correction for a future date', 'warning');
      return;
    }

    setIsSubmittingCorr(true);
    setCorrFeedback({});

    try {
      const reqIn = `${corrDate}T${corrCheckIn}:00Z`;
      const reqOut = `${corrDate}T${corrCheckOut}:00Z`;

      const res = await api.submitCorrectionRequest({
        attendance_id: selectedAttendance?.id || 'manual-entry',
        work_date: corrDate,
        requested_check_in: reqIn,
        requested_check_out: reqOut,
        reason: corrReason.trim(),
      });

      setCorrFeedback({ success: true, message: res.message });
      showToast('Attendance correction request submitted to admin', 'success');
      setTimeout(() => {
        setIsModalOpen(false);
      }, 1500);
    } catch (err: any) {
      setCorrFeedback({ success: false, message: err.message || 'Failed to submit correction request.' });
      showToast(err.message || 'Failed to submit correction', 'error');
    } finally {
      setIsSubmittingCorr(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header and Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-2xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 text-[11px] font-semibold border border-emerald-200">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              Biometric & Geofence Verified
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[11px] font-mono">
              <Wifi className="w-3 h-3 text-slate-400" />
              TLS Secure
            </span>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">Personal Attendance Record</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Verified check-in / check-out history, working duration, and correction requests
          </p>
        </div>
        <button
          onClick={() => handleOpenCorrection()}
          className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-[#0B1F3A] hover:bg-[#142C4E] rounded-lg transition-colors shadow-2xs shrink-0"
        >
          <Plus className="w-4 h-4" />
          Request Attendance Correction
        </button>
      </div>

      {/* Action feedback alert */}
      {actionFeedback && (
        <div
          className={`px-4 py-2.5 text-xs rounded-xl border flex items-center gap-2 ${
            actionFeedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-rose-50 text-rose-800 border-rose-200'
          }`}
        >
          {actionFeedback.type === 'success' ? (
            <CheckCircle className="w-4 h-4 shrink-0 text-emerald-600" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          )}
          <span>{actionFeedback.message}</span>
        </div>
      )}


      {/* Today's Active Session Quick-Action Card */}
      <div className="card-premium p-5 sm:p-6 bg-white/95 relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-sm sm:text-base font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              <Clock className="w-4 h-4 text-brand-accent" />
              Today's Live Attendance Station
            </h2>
            <p className="text-xs text-slate-500">Record check-in and check-out with biometric accuracy</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">Current Status:</span>
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

        <div className="pt-6 flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Live Timer Counter */}
          <div className="text-center md:text-left">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              {todayAttendance.status_summary === 'Checked In'
                ? '⚡ Active Working Session'
                : todayAttendance.status_summary === 'Checked Out'
                ? '✓ Completed Working Duration'
                : 'Session Ready to Begin'}
            </p>
            <div className="mt-1 font-mono text-4xl sm:text-5xl font-black tabular-nums text-slate-900 tracking-tight digital-glow">
              {formatTimer(elapsedSeconds)}
            </div>
            <div className="mt-2.5 text-xs text-slate-500 flex flex-wrap items-center justify-center md:justify-start gap-3">
              <span className="bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200">
                Check In:{' '}
                <strong className="text-slate-800 font-mono font-bold">
                  {todayAttendance.record
                    ? new Date(todayAttendance.record.check_in).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    : '--:--'}
                </strong>
              </span>
              <span className="bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200">
                Check Out:{' '}
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

          {/* Action Button */}
          <div className="w-full md:w-auto flex flex-col items-center">
            {todayAttendance.status_summary === 'Not Started' && (
              <button
                onClick={handleCheckIn}
                disabled={isActionLoading}
                className="w-full md:w-52 flex items-center justify-center gap-2 py-3.5 px-6 rounded-2xl font-bold text-xs text-white bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-600 hover:opacity-95 active:scale-[0.98] transition-all shadow-lg shadow-emerald-600/25 disabled:opacity-50 cursor-pointer"
              >
                <Play className="w-4 h-4 fill-current" />
                {isActionLoading ? 'Processing...' : 'Punch In Now'}
              </button>
            )}

            {todayAttendance.status_summary === 'Checked In' && (
              <button
                onClick={handleCheckOut}
                disabled={isActionLoading}
                className="w-full md:w-52 flex items-center justify-center gap-2 py-3.5 px-6 rounded-2xl font-bold text-xs text-white bg-gradient-to-r from-rose-600 via-rose-500 to-red-600 hover:opacity-95 active:scale-[0.98] transition-all shadow-lg shadow-rose-600/25 disabled:opacity-50 cursor-pointer"
              >
                <Square className="w-4 h-4 fill-current" />
                {isActionLoading ? 'Processing...' : 'Punch Out Now'}
              </button>
            )}

            {todayAttendance.status_summary === 'Checked Out' && (
              <div className="text-center p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold shadow-xs">
                <div className="flex items-center gap-1.5 justify-center">
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                  <span>Session Complete for Today</span>
                </div>
                <span className="block text-[11px] text-emerald-600 mt-0.5 font-mono">
                  Logged: {todayAttendance.record?.check_out ? (todayAttendance.record.total_minutes / 60).toFixed(1) : (elapsedSeconds / 3600).toFixed(1)} hrs
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
        <div className="card-premium-interactive p-4 sm:p-5 bg-white/95">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Days Logged</p>
          <p className="text-2xl sm:text-3xl font-black font-mono tabular-nums text-slate-900 mt-1">
            {summary.total_days_logged}
          </p>
          <span className="text-[11px] text-slate-500 mt-1 block">Recorded work sessions</span>
        </div>

        <div className="card-premium-interactive p-4 sm:p-5 bg-white/95">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Hours Worked</p>
          <p className="text-2xl sm:text-3xl font-black font-mono tabular-nums text-slate-900 mt-1">
            {summary.total_hours_worked} <span className="text-xs font-normal text-slate-400">hrs</span>
          </p>
          <span className="text-[11px] text-slate-500 mt-1 block">Cumulative time</span>
        </div>

        <div className="card-premium-interactive p-4 sm:p-5 bg-white/95">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Daily Average</p>
          <p className="text-2xl sm:text-3xl font-black font-mono tabular-nums text-slate-900 mt-1">
            {summary.average_hours_per_day} <span className="text-xs font-normal text-slate-400">hrs/d</span>
          </p>
          <span className="text-[11px] text-slate-500 mt-1 block">Per completed session</span>
        </div>

        <div className="card-premium-interactive p-4 sm:p-5 bg-white/95">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Late Arrivals</p>
          <p className="text-2xl sm:text-3xl font-black font-mono tabular-nums text-amber-600 mt-1">
            {summary.late_arrivals_count}
          </p>
          <span className="text-[11px] text-slate-500 mt-1 block">Past 9:15 AM window</span>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="card-premium p-4 bg-white/95 flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Interactive segmented status filter */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl overflow-x-auto no-scrollbar">
          {['all', 'present', 'late', 'half_day'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all capitalize whitespace-nowrap cursor-pointer ${
                statusFilter === st
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {st === 'all' ? 'All Records' : st.replace('_', ' ')}
            </button>
          ))}
        </div>

        {/* Date Filters */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="text-slate-500 font-medium">Date Range:</span>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="px-2.5 py-1.5 border border-slate-200 rounded-lg text-slate-700 bg-white"
          />
          <span className="text-slate-400">to</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="px-2.5 py-1.5 border border-slate-200 rounded-lg text-slate-700 bg-white"
          />
          {(startDate || endDate) && (
            <button
              onClick={() => {
                setStartDate('');
                setEndDate('');
              }}
              className="text-xs text-rose-600 hover:underline px-2"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Attendance Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/70 border-b border-slate-200 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Check In</th>
                <th className="py-3 px-4">Check Out</th>
                <th className="py-3 px-4 text-right">Duration</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Notes</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    Loading attendance records...
                  </td>
                </tr>
              ) : records.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    No attendance records found matching filters.
                  </td>
                </tr>
              ) : (
                records.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-semibold text-slate-900 whitespace-nowrap">
                      {r.work_date}
                    </td>
                    <td className="py-3 px-4 font-mono tabular-nums text-slate-600 whitespace-nowrap">
                      {formatClockTime(r.check_in)}
                    </td>
                    <td className="py-3 px-4 font-mono tabular-nums text-slate-600 whitespace-nowrap">
                      {r.check_out ? (
                        formatClockTime(r.check_out)
                      ) : (
                        <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-sans text-xs font-bold inline-flex items-center gap-1 border border-emerald-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          Currently Working
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      {!r.check_out && r.check_in ? (
                        <span className="font-mono tabular-nums font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md text-xs inline-flex items-center gap-1">
                          <Clock className="w-3 h-3 text-emerald-600 animate-pulse" />
                          {formatLiveTimer(r.check_in)} ({(getElapsedSeconds(r.check_in) / 3600).toFixed(1)} hrs)
                        </span>
                      ) : (
                        <span className="font-mono tabular-nums font-medium text-slate-900">
                          {(r.total_minutes / 60).toFixed(1)} hrs
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <StatusBadge status={r.status} />
                    </td>
                    <td className="py-3 px-4 text-slate-500 max-w-xs truncate">
                      {r.notes || '—'}
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <button
                        onClick={() => handleOpenCorrection(r)}
                        className="text-[11px] font-medium text-[#0B1F3A] hover:underline"
                      >
                        Request Fix
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Correction Request Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Request Attendance Correction"
        subtitle="Submit a formal correction request for admin review and database adjustment"
      >
        <form onSubmit={handleSubmitCorrection} className="space-y-4">
          {corrFeedback.message && (
            <div
              className={`p-3 text-xs rounded-lg flex items-start gap-2 ${
                corrFeedback.success
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-rose-50 text-rose-800 border border-rose-200'
              }`}
            >
              {corrFeedback.success ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              )}
              <span>{corrFeedback.message}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Work Date</label>
            <input
              type="date"
              required
              max={todayIsoDate}
              value={corrDate}
              onChange={(e) => setCorrDate(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B1F3A]/20 focus:border-[#0B1F3A]"
            />
            <span className="text-[10px] text-slate-400 mt-1 block">
              Corrections can only be requested for past or today's shifts.
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Requested Check In Time
              </label>
              <input
                type="time"
                required
                value={corrCheckIn}
                onChange={(e) => setCorrCheckIn(e.target.value)}
                className="w-full px-3 py-2 text-xs font-mono border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B1F3A]/20 focus:border-[#0B1F3A]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Requested Check Out Time
              </label>
              <input
                type="time"
                required
                value={corrCheckOut}
                onChange={(e) => setCorrCheckOut(e.target.value)}
                className="w-full px-3 py-2 text-xs font-mono border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B1F3A]/20 focus:border-[#0B1F3A]"
              />
            </div>
          </div>

          {/* Real-time Projected Shift Duration Preview */}
          <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs flex items-center justify-between">
            <span className="text-slate-500">Calculated Shift Duration:</span>
            {corrCheckOut > corrCheckIn ? (
              <span className="font-mono font-semibold text-slate-900">
                {Math.floor(projectedCorrectionMinutes / 60)} hrs {projectedCorrectionMinutes % 60} mins
                <span className="text-[11px] text-emerald-600 font-sans ml-1.5">
                  ({projectedCorrectionMinutes >= 240 ? 'Full Shift' : 'Half Day'})
                </span>
              </span>
            ) : (
              <span className="text-rose-600 font-medium">Check-out must be after check-in</span>
            )}
          </div>


          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Reason for Correction
            </label>
            <textarea
              required
              rows={3}
              value={corrReason}
              onChange={(e) => setCorrReason(e.target.value)}
              placeholder="Explain why the timestamp needs correction (e.g., workstation network outage, client meeting offsite, forgotten check-out)..."
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B1F3A]/20 focus:border-[#0B1F3A]"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-3.5 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmittingCorr}
              className="px-4 py-2 text-xs font-semibold text-white bg-[#0B1F3A] hover:bg-[#142C4E] rounded-lg transition-colors disabled:opacity-50"
            >
              {isSubmittingCorr ? 'Submitting...' : 'Submit Request'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
