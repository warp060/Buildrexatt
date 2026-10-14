import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../api';
import { LeaveRequest } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { Modal } from '../components/Modal';
import { Calendar, Plus, CheckCircle2, AlertCircle, Clock } from 'lucide-react';

export const LeaveRequestsView: React.FC = () => {
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // New Request Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [leaveType, setLeaveType] = useState('casual');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');
  const [modalFeedback, setModalFeedback] = useState<{ success?: boolean; message?: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchLeaves = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await api.getMyLeaveRequests();
      if (res.success) {
        setRequests(res.records);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLeaves();
  }, [fetchLeaves]);

  const handleOpenModal = () => {
    const today = new Date().toISOString().split('T')[0];
    setStartDate(today);
    setEndDate(today);
    setLeaveType('casual');
    setReason('');
    setModalFeedback({});
    setIsModalOpen(true);
  };

  const calculateDays = () => {
    if (!startDate || !endDate) return 1;
    const s = new Date(startDate);
    const e = new Date(endDate);
    const diff = Math.round((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    return Math.max(1, diff);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!startDate || !endDate || !reason.trim()) return;
    setIsSubmitting(true);
    setModalFeedback({});

    try {
      const res = await api.submitLeaveRequest({
        leave_type: leaveType,
        start_date: startDate,
        end_date: endDate,
        reason: reason.trim(),
      });

      setModalFeedback({ success: true, message: res.message });
      await fetchLeaves();
      setTimeout(() => {
        setIsModalOpen(false);
      }, 1200);
    } catch (err: any) {
      setModalFeedback({ success: false, message: err.message || 'Error submitting leave request.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-2xs">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">Leave & Time Off Requests</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Submit formal vacation, sick leaves, or emergency time-off with supervisor approvals
          </p>
        </div>
        <button
          onClick={handleOpenModal}
          className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-[#0B1F3A] hover:bg-[#142C4E] rounded-lg transition-colors shadow-2xs shrink-0"
        >
          <Plus className="w-4 h-4" />
          Apply for Leave
        </button>
      </div>

      {/* Balance Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Casual Leave</p>
          <p className="text-2xl font-bold font-mono tabular-nums text-slate-900 mt-1">
            8 <span className="text-xs font-normal text-slate-400">/ 12 left</span>
          </p>
          <span className="text-[11px] text-slate-500 mt-0.5 block">Annual quota</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Sick / Medical</p>
          <p className="text-2xl font-bold font-mono tabular-nums text-slate-900 mt-1">
            6 <span className="text-xs font-normal text-slate-400">/ 8 left</span>
          </p>
          <span className="text-[11px] text-slate-500 mt-0.5 block">Medical coverage</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Pending Requests</p>
          <p className="text-2xl font-bold font-mono tabular-nums text-amber-700 mt-1">
            {requests.filter((r) => r.status === 'pending').length}
          </p>
          <span className="text-[11px] text-slate-500 mt-0.5 block">Awaiting admin action</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Approved (YTD)</p>
          <p className="text-2xl font-bold font-mono tabular-nums text-emerald-700 mt-1">
            {requests.filter((r) => r.status === 'approved').reduce((acc, c) => acc + c.days_count, 0)} <span className="text-xs font-normal text-slate-400">days</span>
          </p>
          <span className="text-[11px] text-slate-500 mt-0.5 block">Utilized time off</span>
        </div>
      </div>

      {/* Requests History Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Leave Applications History</h2>
          <span className="text-xs text-slate-400 font-mono">{requests.length} records</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/70 border-b border-slate-200 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Duration</th>
                <th className="py-3 px-4 text-center">Days</th>
                <th className="py-3 px-4">Reason</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Supervisor Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">Loading leave requests...</td>
                </tr>
              ) : requests.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">No leave requests submitted yet.</td>
                </tr>
              ) : (
                requests.map((req) => (
                  <tr key={req.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-semibold text-slate-900 capitalize whitespace-nowrap">
                      {req.leave_type} Leave
                    </td>
                    <td className="py-3 px-4 text-slate-600 whitespace-nowrap font-mono tabular-nums">
                      {req.start_date} <span className="text-slate-400">to</span> {req.end_date}
                    </td>
                    <td className="py-3 px-4 text-center font-mono tabular-nums font-medium text-slate-900 whitespace-nowrap">
                      {req.days_count} d
                    </td>
                    <td className="py-3 px-4 text-slate-600 max-w-xs truncate">
                      {req.reason}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <StatusBadge status={req.status} type="request" />
                    </td>
                    <td className="py-3 px-4 text-slate-500 max-w-xs truncate">
                      {req.review_comment ? (
                        <span>
                          <strong className="text-slate-700">{req.reviewer_name || 'Admin'}:</strong> {req.review_comment}
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Leave Request Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Apply for Time Off"
        subtitle="Submit dates and details for supervisor evaluation"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {modalFeedback.message && (
            <div
              className={`p-3 text-xs rounded-lg flex items-start gap-2 ${
                modalFeedback.success
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-rose-50 text-rose-800 border border-rose-200'
              }`}
            >
              {modalFeedback.success ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              )}
              <span>{modalFeedback.message}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Leave Category</label>
            <select
              value={leaveType}
              onChange={(e) => setLeaveType(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B1F3A]/20 focus:border-[#0B1F3A] bg-white text-slate-800"
            >
              <option value="casual">Casual Leave</option>
              <option value="sick">Sick / Medical Leave</option>
              <option value="paid">Paid Vacation</option>
              <option value="unpaid">Unpaid Leave</option>
              <option value="emergency">Emergency Absence</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Start Date</label>
              <input
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B1F3A]/20 focus:border-[#0B1F3A]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">End Date</label>
              <input
                type="date"
                required
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B1F3A]/20 focus:border-[#0B1F3A]"
              />
            </div>
          </div>

          <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-600 flex items-center justify-between">
            <span>Total Duration:</span>
            <span className="font-bold font-mono text-slate-900">{calculateDays()} calendar day(s)</span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Reason for Leave</label>
            <textarea
              required
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="State clear purpose of leave and emergency contact or handoff notes..."
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
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-semibold text-white bg-[#0B1F3A] hover:bg-[#142C4E] rounded-lg transition-colors disabled:opacity-50"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Application'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
