import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../api';
import { LeaveRequest, AttendanceCorrection } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { Modal } from '../components/Modal';
import {
  CalendarDays,
  Clock,
  CheckCircle,
  XCircle,
  CheckCircle2,
  AlertCircle,
  MessageSquare,
} from 'lucide-react';

export const AdminApprovalsView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'leave' | 'corrections'>('leave');

  // Leave data
  const [leaveList, setLeaveList] = useState<LeaveRequest[]>([]);
  const [leaveStatusFilter, setLeaveStatusFilter] = useState('pending');
  const [isLoadingLeaves, setIsLoadingLeaves] = useState(true);

  // Correction data
  const [correctionsList, setCorrectionsList] = useState<AttendanceCorrection[]>([]);
  const [corrStatusFilter, setCorrStatusFilter] = useState('pending');
  const [isLoadingCorrections, setIsLoadingCorrections] = useState(true);

  // Review Dialog State
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [reviewType, setReviewType] = useState<'leave' | 'correction'>('leave');
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [decision, setDecision] = useState<'approved' | 'rejected'>('approved');
  const [reviewComment, setReviewComment] = useState('');
  const [feedback, setFeedback] = useState<{ success?: boolean; message?: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchLeaves = useCallback(async () => {
    setIsLoadingLeaves(true);
    try {
      const res = await api.getAdminLeaveRequests({
        status: leaveStatusFilter !== 'all' ? leaveStatusFilter : undefined,
      });
      if (res.success) setLeaveList(res.records);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingLeaves(false);
    }
  }, [leaveStatusFilter]);

  const fetchCorrections = useCallback(async () => {
    setIsLoadingCorrections(true);
    try {
      const res = await api.getAdminCorrections({
        status: corrStatusFilter !== 'all' ? corrStatusFilter : undefined,
      });
      if (res.success) setCorrectionsList(res.records);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingCorrections(false);
    }
  }, [corrStatusFilter]);

  useEffect(() => {
    fetchLeaves();
  }, [fetchLeaves]);

  useEffect(() => {
    fetchCorrections();
  }, [fetchCorrections]);

  const handleOpenReview = (type: 'leave' | 'correction', item: any, dec: 'approved' | 'rejected') => {
    setReviewType(type);
    setSelectedItem(item);
    setDecision(dec);
    setReviewComment(item.review_comment || '');
    setFeedback({});
    setIsReviewModalOpen(true);
  };

  const handleExecuteReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) return;
    setIsSubmitting(true);
    setFeedback({});

    try {
      if (reviewType === 'leave') {
        const res = await api.reviewLeaveRequest(selectedItem.id, {
          status: decision,
          review_comment: reviewComment,
        });
        setFeedback({ success: true, message: res.message });
        await fetchLeaves();
      } else {
        const res = await api.reviewCorrectionRequest(selectedItem.id, {
          status: decision,
          review_comment: reviewComment,
        });
        setFeedback({ success: true, message: res.message });
        await fetchCorrections();
      }

      setTimeout(() => {
        setIsReviewModalOpen(false);
      }, 1200);
    } catch (err: any) {
      setFeedback({ success: false, message: err.message || 'Approval action failed.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-2xs">
        <h1 className="text-xl font-bold tracking-tight text-slate-900">Leave & Correction Approvals</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Process vacation requests and authorize biometric timestamp adjustments
        </p>
      </div>

      {/* Tabs and Status Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Main Section Switcher */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
          <button
            onClick={() => setActiveTab('leave')}
            className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold rounded-md transition-colors ${
              activeTab === 'leave'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <CalendarDays className="w-3.5 h-3.5" />
            Leave Requests ({leaveList.filter((l) => l.status === 'pending').length} pending)
          </button>
          <button
            onClick={() => setActiveTab('corrections')}
            className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold rounded-md transition-colors ${
              activeTab === 'corrections'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            Attendance Corrections ({correctionsList.filter((c) => c.status === 'pending').length} pending)
          </button>
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-500">Filter Status:</span>
          {activeTab === 'leave' ? (
            <select
              value={leaveStatusFilter}
              onChange={(e) => setLeaveStatusFilter(e.target.value)}
              className="px-2.5 py-1.5 border border-slate-200 rounded-lg bg-white text-slate-800"
            >
              <option value="pending">Pending Only</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="all">All Records</option>
            </select>
          ) : (
            <select
              value={corrStatusFilter}
              onChange={(e) => setCorrStatusFilter(e.target.value)}
              className="px-2.5 py-1.5 border border-slate-200 rounded-lg bg-white text-slate-800"
            >
              <option value="pending">Pending Only</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="all">All Records</option>
            </select>
          )}
        </div>
      </div>

      {/* Tab 1: Leave Requests Table */}
      {activeTab === 'leave' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Time-Off Applications
            </span>
            <span className="text-xs font-mono text-slate-400 tabular-nums">
              {leaveList.length} applications
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/70 border-b border-slate-200 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Applicant</th>
                  <th className="py-3 px-4">Leave Type</th>
                  <th className="py-3 px-4">Date Range</th>
                  <th className="py-3 px-4 text-center">Days</th>
                  <th className="py-3 px-4">Reason</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {isLoadingLeaves ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400">Loading leave requests...</td>
                  </tr>
                ) : leaveList.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400">No leave requests found.</td>
                  </tr>
                ) : (
                  leaveList.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4 font-semibold text-slate-900 whitespace-nowrap">
                        {item.user_name}
                        <span className="block text-[10px] font-mono text-slate-400 font-normal">
                          {item.employee_code} · {item.department_name}
                        </span>
                      </td>
                      <td className="py-3 px-4 capitalize font-medium text-slate-700 whitespace-nowrap">
                        {item.leave_type} Leave
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-600 whitespace-nowrap">
                        {item.start_date} <span className="text-slate-400">to</span> {item.end_date}
                      </td>
                      <td className="py-3 px-4 text-center font-mono tabular-nums font-bold text-slate-900 whitespace-nowrap">
                        {item.days_count} d
                      </td>
                      <td className="py-3 px-4 text-slate-600 max-w-xs truncate">
                        {item.reason}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <StatusBadge status={item.status} type="request" />
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        {item.status === 'pending' ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleOpenReview('leave', item, 'approved')}
                              className="px-2.5 py-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-md transition-colors"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleOpenReview('leave', item, 'rejected')}
                              className="px-2.5 py-1 text-[11px] font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-md transition-colors"
                            >
                              Reject
                            </button>
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-400">
                            {item.reviewer_name ? `By ${item.reviewer_name}` : 'Processed'}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Attendance Corrections Table */}
      {activeTab === 'corrections' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Timestamp Correction Requests
            </span>
            <span className="text-xs font-mono text-slate-400 tabular-nums">
              {correctionsList.length} requests
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/70 border-b border-slate-200 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Applicant</th>
                  <th className="py-3 px-4">Work Date</th>
                  <th className="py-3 px-4">Requested Shift</th>
                  <th className="py-3 px-4">Stated Reason</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {isLoadingCorrections ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">Loading corrections...</td>
                  </tr>
                ) : correctionsList.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">No correction requests found.</td>
                  </tr>
                ) : (
                  correctionsList.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4 font-semibold text-slate-900 whitespace-nowrap">
                        {item.user_name}
                        <span className="block text-[10px] font-mono text-slate-400 font-normal">
                          {item.employee_code} · {item.department_name}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono font-medium text-slate-800 whitespace-nowrap">
                        {item.work_date}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-600 whitespace-nowrap">
                        {new Date(item.requested_check_in).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        {' - '}
                        {new Date(item.requested_check_out).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="py-3 px-4 text-slate-600 max-w-xs truncate">
                        {item.reason}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <StatusBadge status={item.status} type="request" />
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        {item.status === 'pending' ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleOpenReview('correction', item, 'approved')}
                              className="px-2.5 py-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-md transition-colors"
                            >
                              Approve Fix
                            </button>
                            <button
                              onClick={() => handleOpenReview('correction', item, 'rejected')}
                              className="px-2.5 py-1 text-[11px] font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-md transition-colors"
                            >
                              Reject
                            </button>
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-400">
                            {item.reviewer_name ? `By ${item.reviewer_name}` : 'Processed'}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Review Modal */}
      <Modal
        isOpen={isReviewModalOpen}
        onClose={() => setIsReviewModalOpen(false)}
        title={
          reviewType === 'leave'
            ? `${decision === 'approved' ? 'Approve' : 'Reject'} Leave Request`
            : `${decision === 'approved' ? 'Approve' : 'Reject'} Attendance Correction`
        }
        subtitle={`Applicant: ${selectedItem?.user_name}`}
      >
        <form onSubmit={handleExecuteReview} className="space-y-4">
          {feedback.message && (
            <div
              className={`p-3 text-xs rounded-lg flex items-start gap-2 ${
                feedback.success
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-rose-50 text-rose-800 border border-rose-200'
              }`}
            >
              {feedback.success ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              )}
              <span>{feedback.message}</span>
            </div>
          )}

          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs space-y-1">
            <p className="font-semibold text-slate-800">Request Summary:</p>
            {reviewType === 'leave' ? (
              <p className="text-slate-600">
                {selectedItem?.days_count} day(s) {selectedItem?.leave_type} leave from {selectedItem?.start_date} to {selectedItem?.end_date}. Reason: "{selectedItem?.reason}"
              </p>
            ) : (
              <p className="text-slate-600">
                Adjustment on {selectedItem?.work_date} to hours {new Date(selectedItem?.requested_check_in || 0).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(selectedItem?.requested_check_out || 0).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}. Reason: "{selectedItem?.reason}"
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Decision Note / Reviewer Comments
            </label>
            <textarea
              rows={3}
              value={reviewComment}
              onChange={(e) => setReviewComment(e.target.value)}
              placeholder={
                decision === 'approved'
                  ? 'e.g. Approved. Ensure coverage handoff is documented.'
                  : 'e.g. Denied due to critical sprint deadline; please consult manager.'
              }
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B1F3A]/20 focus:border-[#0B1F3A]"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsReviewModalOpen(false)}
              className="px-3.5 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors text-white disabled:opacity-50 ${
                decision === 'approved'
                  ? 'bg-emerald-600 hover:bg-emerald-700'
                  : 'bg-rose-600 hover:bg-rose-700'
              }`}
            >
              {isSubmitting ? 'Processing...' : `Confirm ${decision === 'approved' ? 'Approval' : 'Rejection'}`}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
