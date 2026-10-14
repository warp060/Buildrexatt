import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../api';
import { WorkUpdate, Department, ExecutiveDigestResult, SupervisorFeedbackResult, AiStatus } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { Modal } from '../components/Modal';
import {
  Search,
  Filter,
  MessageSquare,
  CheckCircle2,
  AlertCircle,
  Eye,
  Sparkles,
  ShieldAlert,
  Flame,
  Check,
  Copy,
  TrendingUp,
  Clock,
  Layers,
  ArrowRight,
  Printer,
  ChevronRight,
  Bot,
} from 'lucide-react';

import { useToast } from '../context/ToastContext';

export const AdminWorkUpdatesView: React.FC = () => {
  const { showToast } = useToast();
  const [updates, setUpdates] = useState<WorkUpdate[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [deptFilter, setDeptFilter] = useState('all');
  const [roleFilter, setRoleFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('');

  // Review Modal State
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [selectedUpdate, setSelectedUpdate] = useState<WorkUpdate | null>(null);
  const [reviewStatus, setReviewStatus] = useState<'reviewed' | 'needs_revision'>('reviewed');
  const [reviewComment, setReviewComment] = useState('');
  const [reviewFeedback, setReviewFeedback] = useState<{ success?: boolean; message?: string }>({});
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  // AI Supervisor Feedback State
  const [isGeneratingFeedback, setIsGeneratingFeedback] = useState(false);
  const [coachingTip, setCoachingTip] = useState<string | null>(null);

  // AI Executive Digest Modal State
  const [isDigestModalOpen, setIsDigestModalOpen] = useState(false);
  const [isGeneratingDigest, setIsGeneratingDigest] = useState(false);
  const [executiveDigest, setExecutiveDigest] = useState<ExecutiveDigestResult | null>(null);
  const [digestDate, setDigestDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [isCopiedDigest, setIsCopiedDigest] = useState(false);
  const [aiStatus, setAiStatus] = useState<AiStatus | null>(null);

  const fetchUpdates = useCallback(async () => {
    setIsLoading(true);
    try {
      const [wuRes, deptRes, statusRes] = await Promise.all([
        api.getAdminWorkUpdates({
          search: search || undefined,
          status: statusFilter !== 'all' ? statusFilter : undefined,
          department_id: deptFilter !== 'all' ? deptFilter : undefined,
          role: roleFilter !== 'all' ? roleFilter : undefined,
          date: dateFilter || undefined,
          limit: 50,
        }),
        api.getDepartments(),
        api.getAiStatus().catch(() => null),
      ]);

      if (wuRes.success) {
        setUpdates(wuRes.records);
        setTotalCount(wuRes.total);
      }
      if (deptRes.success) {
        setDepartments(deptRes.departments);
      }
      if (statusRes && statusRes.success) {
        setAiStatus(statusRes.status);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [search, statusFilter, deptFilter, roleFilter, dateFilter]);

  useEffect(() => {
    fetchUpdates();
  }, [fetchUpdates]);

  const handleOpenReview = (wu: WorkUpdate) => {
    setSelectedUpdate(wu);
    setReviewStatus(wu.status === 'needs_revision' ? 'needs_revision' : 'reviewed');
    setReviewComment(wu.review_comment || '');
    setCoachingTip(null);
    setReviewFeedback({});
    setIsReviewModalOpen(true);
  };

  const handleGenerateFeedback = async () => {
    if (!selectedUpdate) return;
    setIsGeneratingFeedback(true);
    try {
      const res = await api.getSupervisorFeedback({ report_id: selectedUpdate.id });
      if (res.success && res.feedback) {
        setReviewComment(res.feedback.suggested_comment);
        setCoachingTip(res.feedback.coaching_tip);
        if (res.feedback.recommended_status) {
          setReviewStatus(res.feedback.recommended_status);
        }
        showToast('AI Coaching suggestions generated', 'success');
      }
    } catch (err: any) {
      console.error(err);
      showToast(err.message || 'Failed to generate feedback', 'error');
    } finally {
      setIsGeneratingFeedback(false);
    }
  };

  const handleGenerateDigest = async (dateToUse?: string) => {
    const target = dateToUse || digestDate || new Date().toISOString().split('T')[0];
    setIsGeneratingDigest(true);
    try {
      const res = await api.getExecutiveDigest(target);
      if (res.success && res.digest) {
        setExecutiveDigest(res.digest);
        setIsDigestModalOpen(true);
        showToast('Executive daily digest generated', 'success');
      }
    } catch (err: any) {
      console.error(err);
      showToast(err.message || 'Failed to generate digest', 'error');
    } finally {
      setIsGeneratingDigest(false);
    }
  };

  const handleSaveReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUpdate) return;

    if (reviewStatus === 'needs_revision' && !reviewComment.trim()) {
      setReviewFeedback({
        success: false,
        message: 'Please provide constructive feedback explaining what needs revision.',
      });
      showToast('Feedback note is required when requesting revisions', 'warning');
      return;
    }

    setIsSubmittingReview(true);
    setReviewFeedback({});

    try {
      const res = await api.reviewWorkUpdate(selectedUpdate.id, {
        status: reviewStatus,
        review_comment: reviewComment.trim(),
      });

      setReviewFeedback({ success: true, message: res.message });
      showToast(res.message, 'success');
      await fetchUpdates();
      setTimeout(() => {
        setIsReviewModalOpen(false);
      }, 1200);
    } catch (err: any) {
      setReviewFeedback({ success: false, message: err.message || 'Failed to submit review.' });
      showToast(err.message || 'Failed to submit review', 'error');
    } finally {
      setIsSubmittingReview(false);
    }
  };


  const copyDigestToClipboard = () => {
    if (!executiveDigest) return;
    const text = `BUILDREX Executive Daily Digest (${executiveDigest.date})\n` +
      `Total Hours: ${executiveDigest.total_hours.toFixed(1)}h across ${executiveDigest.total_reports} reports\n\n` +
      `Summary: ${executiveDigest.executive_summary}\n\n` +
      `Top Highlights:\n${executiveDigest.key_highlights.map(h => `- ${h}`).join('\n')}\n\n` +
      `Blocker Radar (${executiveDigest.blocker_radar.length} detected):\n` +
      `${executiveDigest.blocker_radar.map(b => `[${b.severity.toUpperCase()}] ${b.reporter} (${b.department}): ${b.blocker} -> Action: ${b.action_plan}`).join('\n')}\n\n` +
      `Leadership Actions:\n${executiveDigest.suggested_leadership_actions.map(a => `- ${a}`).join('\n')}`;
    
    navigator.clipboard.writeText(text);
    setIsCopiedDigest(true);
    setTimeout(() => setIsCopiedDigest(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-slate-900">Work Update Reviews</h1>
            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-mono">
              {totalCount} Total
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Review daily submissions from interns and employees, check sprint velocity, and provide feedback
          </p>
        </div>

        {/* Gemini Executive Digest Trigger */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleGenerateDigest()}
            disabled={isGeneratingDigest}
            className="px-4 py-2 text-xs font-semibold text-white bg-gradient-to-r from-violet-600 via-indigo-600 to-[#0B1F3A] hover:opacity-95 rounded-lg shadow-2xs flex items-center gap-2 transition-all disabled:opacity-50"
          >
            <Sparkles className={`w-3.5 h-3.5 ${isGeneratingDigest ? 'animate-spin' : ''}`} />
            <span>{isGeneratingDigest ? 'Synthesizing Digest...' : 'AI Executive Digest & Blocker Radar'}</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search user, project, task..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B1F3A]/20 focus:border-[#0B1F3A]"
            />
          </div>

          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B1F3A]/20 focus:border-[#0B1F3A] bg-white text-slate-700"
            >
              <option value="all">All Statuses</option>
              <option value="submitted">Pending Review (Submitted)</option>
              <option value="reviewed">Reviewed</option>
              <option value="needs_revision">Needs Revision</option>
              <option value="draft">Drafts</option>
            </select>
          </div>

          <div>
            <select
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
              className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B1F3A]/20 focus:border-[#0B1F3A] bg-white text-slate-700"
            >
              <option value="all">All Departments</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B1F3A]/20 focus:border-[#0B1F3A] bg-white text-slate-700"
            >
              <option value="all">All Roles</option>
              <option value="intern">Interns Only</option>
              <option value="employee">Employees Only</option>
            </select>
          </div>

          <div>
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => {
                setDateFilter(e.target.value);
                if (e.target.value) setDigestDate(e.target.value);
              }}
              className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B1F3A]/20 focus:border-[#0B1F3A] bg-white text-slate-700"
            />
          </div>
        </div>

        {dateFilter && (
          <div className="flex items-center gap-2 pt-1 text-xs text-slate-500">
            <span>Date: {dateFilter}</span>
            <button
              onClick={() => setDateFilter('')}
              className="text-xs text-rose-600 hover:underline font-medium"
            >
              Clear date
            </button>
          </div>
        )}
      </div>

      {/* Work Updates Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
            Daily Work Submissions
          </span>
          <span className="text-xs font-mono text-slate-400 tabular-nums">
            Showing {updates.length} of {totalCount} reports
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/70 border-b border-slate-200 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4">Name / ID</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Project & Tasks Summary</th>
                <th className="py-3 px-4 text-center">Hours</th>
                <th className="py-3 px-4">Submission Time</th>
                <th className="py-3 px-4">Review Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    Loading daily work reports...
                  </td>
                </tr>
              ) : updates.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    No work updates found matching filters.
                  </td>
                </tr>
              ) : (
                updates.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-semibold text-slate-900 whitespace-nowrap">
                      {u.user_name}
                      <span className="block text-[10px] font-mono text-slate-400 font-normal">
                        {u.employee_code} · {u.department_name}
                      </span>
                    </td>
                    <td className="py-3 px-4 capitalize text-slate-600 whitespace-nowrap">
                      {u.role}
                    </td>
                    <td className="py-3 px-4 font-mono tabular-nums text-slate-700 whitespace-nowrap">
                      {u.work_date}
                    </td>
                    <td className="py-3 px-4 max-w-sm">
                      <p className="font-medium text-slate-900 truncate">{u.project_details}</p>
                      <p className="text-[11px] text-slate-500 truncate whitespace-pre-line mt-0.5">
                        {u.tasks_completed}
                      </p>
                      {u.blockers && !['none', 'nil', 'no'].includes(u.blockers.toLowerCase().trim()) && (
                        <span className="inline-flex items-center gap-1 mt-1 text-[10px] font-medium text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                          <Flame className="w-2.5 h-2.5 text-amber-600" />
                          Blocker logged
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center font-mono tabular-nums font-semibold text-slate-900 whitespace-nowrap">
                      {u.hours_spent}h
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-500 whitespace-nowrap">
                      {u.submitted_at
                        ? new Date(u.submitted_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                        : 'Draft'}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <StatusBadge status={u.status} type="work_update" />
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <button
                        onClick={() => handleOpenReview(u)}
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-white bg-[#0B1F3A] hover:bg-[#142C4E] px-2.5 py-1.5 rounded-md transition-colors shadow-2xs"
                      >
                        <Eye className="w-3 h-3" />
                        Review
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Review Modal with AI Assistant */}
      <Modal
        isOpen={isReviewModalOpen}
        onClose={() => setIsReviewModalOpen(false)}
        title="Review Daily Work Report"
        subtitle={`Evaluation for ${selectedUpdate?.user_name} (${selectedUpdate?.work_date})`}
        maxWidth="max-w-2xl"
      >
        <div className="space-y-4">
          {reviewFeedback.message && (
            <div
              className={`p-3 text-xs rounded-lg flex items-start gap-2 ${
                reviewFeedback.success
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-rose-50 text-rose-800 border border-rose-200'
              }`}
            >
              {reviewFeedback.success ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              )}
              <span>{reviewFeedback.message}</span>
            </div>
          )}

          {/* Report Details Viewer */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-3">
            <div>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block mb-0.5">
                Project / Focus Area
              </span>
              <p className="font-semibold text-slate-900">{selectedUpdate?.project_details}</p>
            </div>

            <div>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block mb-0.5">
                Tasks Completed
              </span>
              <p className="text-slate-800 whitespace-pre-line font-mono text-[11px] bg-white p-3 rounded-lg border border-slate-200 leading-relaxed">
                {selectedUpdate?.tasks_completed}
              </p>
            </div>

            {selectedUpdate?.accomplishments && (
              <div>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block mb-0.5">
                  Accomplishments
                </span>
                <p className="text-slate-800 bg-white p-2.5 rounded-lg border border-slate-200">
                  {selectedUpdate.accomplishments}
                </p>
              </div>
            )}

            {selectedUpdate?.blockers && (
              <div>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block mb-0.5">
                  Challenges & Blockers
                </span>
                <p className={`p-2.5 rounded-lg border ${
                  !['none', 'nil', 'no'].includes(selectedUpdate.blockers.toLowerCase().trim())
                    ? 'bg-amber-50/70 border-amber-200 text-amber-900 font-medium'
                    : 'bg-white border-slate-200 text-slate-800'
                }`}>
                  {selectedUpdate.blockers}
                </p>
              </div>
            )}

            {selectedUpdate?.next_day_plan && (
              <div>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block mb-0.5">
                  Next Day Plan
                </span>
                <p className="text-slate-800 bg-white p-2.5 rounded-lg border border-slate-200 font-mono text-[11px]">
                  {selectedUpdate.next_day_plan}
                </p>
              </div>
            )}

            <div className="flex items-center justify-between pt-2 border-t border-slate-200 text-slate-500">
              <span>Time reported: <strong className="text-slate-800 font-mono">{selectedUpdate?.hours_spent} hours</strong></span>
              <span>Submitted: <strong className="text-slate-800 font-mono">{selectedUpdate?.submitted_at ? new Date(selectedUpdate.submitted_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : 'Draft'}</strong></span>
            </div>
          </div>

          {/* AI Supervisor Feedback Assistant Generator */}
          <div className="p-3 bg-violet-50/70 rounded-xl border border-violet-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-violet-600" />
              <div>
                <p className="text-xs font-bold text-violet-900">AI Feedback Assistant</p>
                <p className="text-[11px] text-violet-700">
                  Generate tailored, constructive supervisory feedback for {selectedUpdate?.user_name}
                </p>
              </div>
            </div>

            <button
              type="button"
              disabled={isGeneratingFeedback}
              onClick={handleGenerateFeedback}
              className="px-3 py-1.5 text-xs font-semibold text-white bg-violet-600 hover:bg-violet-700 rounded-lg shadow-2xs flex items-center gap-1.5 transition-colors disabled:opacity-50"
            >
              <Sparkles className={`w-3 h-3 ${isGeneratingFeedback ? 'animate-spin' : ''}`} />
              <span>{isGeneratingFeedback ? 'Drafting...' : 'Draft with AI'}</span>
            </button>
          </div>

          {coachingTip && (
            <div className="p-3 bg-indigo-50/80 rounded-lg border border-indigo-200 text-xs text-indigo-900 flex items-start gap-2">
              <Bot className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold block">Mentoring / Growth Recommendation:</span>
                <span className="text-[11px] text-indigo-800">{coachingTip}</span>
              </div>
            </div>
          )}

          {/* Admin Review Action Form */}
          <form onSubmit={handleSaveReview} className="space-y-4 pt-2">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Review Decision
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setReviewStatus('reviewed')}
                  className={`py-2 px-3 text-xs font-semibold rounded-lg border transition-colors flex items-center justify-center gap-2 ${
                    reviewStatus === 'reviewed'
                      ? 'bg-emerald-50 border-emerald-500 text-emerald-800'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Mark as Reviewed (Approved)
                </button>
                <button
                  type="button"
                  onClick={() => setReviewStatus('needs_revision')}
                  className={`py-2 px-3 text-xs font-semibold rounded-lg border transition-colors flex items-center justify-center gap-2 ${
                    reviewStatus === 'needs_revision'
                      ? 'bg-amber-50 border-amber-500 text-amber-800'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <AlertCircle className="w-4 h-4 text-amber-600" />
                  Request Revisions
                </button>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-700">
                  Supervisor Feedback & Comments
                </label>
                <button
                  type="button"
                  onClick={handleGenerateFeedback}
                  className="text-[11px] text-violet-700 hover:underline flex items-center gap-1 font-medium"
                >
                  <Sparkles className="w-3 h-3 text-violet-600" />
                  Regenerate with AI
                </button>
              </div>
              <textarea
                rows={3}
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                placeholder="Add constructive notes or clarify requested revisions..."
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
                disabled={isSubmittingReview}
                className="px-4 py-2 text-xs font-semibold text-white bg-[#0B1F3A] hover:bg-[#142C4E] rounded-lg transition-colors disabled:opacity-50"
              >
                {isSubmittingReview ? 'Submitting...' : 'Save Review Decision'}
              </button>
            </div>
          </form>
        </div>
      </Modal>

      {/* AI Daily Executive Digest & Blocker Radar Modal */}
      <Modal
        isOpen={isDigestModalOpen}
        onClose={() => setIsDigestModalOpen(false)}
        title="Executive Daily Digest & Blocker Radar"
        subtitle={`Enterprise synthesis for ${executiveDigest?.date || 'Today'}`}
        maxWidth="max-w-4xl"
      >
        {executiveDigest && (
          <div className="space-y-6">
            {/* Top Toolbar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                  <span>Reporting Date:</span>
                  <input
                    type="date"
                    value={digestDate}
                    onChange={(e) => {
                      setDigestDate(e.target.value);
                      handleGenerateDigest(e.target.value);
                    }}
                    className="px-2 py-1 text-xs border border-slate-200 rounded bg-white font-mono"
                  />
                </div>
                <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-violet-100 text-violet-800">
                  {executiveDigest.model}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={copyDigestToClipboard}
                  className="px-3 py-1.5 text-xs text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 rounded-lg transition-colors flex items-center gap-1.5 shadow-2xs"
                >
                  {isCopiedDigest ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{isCopiedDigest ? 'Copied Brief' : 'Copy Briefing'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-3 py-1.5 text-xs text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 rounded-lg transition-colors flex items-center gap-1.5 shadow-2xs"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print</span>
                </button>
              </div>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  Submissions Synthesized
                </span>
                <p className="text-xl font-bold text-slate-900 font-mono">
                  {executiveDigest.total_reports} <span className="text-xs font-normal text-slate-500">team members</span>
                </p>
              </div>

              <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  Dedicated Sprint Hours
                </span>
                <p className="text-xl font-bold text-slate-900 font-mono">
                  {executiveDigest.total_hours.toFixed(1)} <span className="text-xs font-normal text-slate-500">logged</span>
                </p>
              </div>

              <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  Active Blocker Alerts
                </span>
                <p className={`text-xl font-bold font-mono ${executiveDigest.blocker_radar.length > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                  {executiveDigest.blocker_radar.length} <span className="text-xs font-normal text-slate-500">items</span>
                </p>
              </div>
            </div>

            {/* Executive Summary Card */}
            <div className="p-4 bg-gradient-to-br from-violet-950 to-[#0B1F3A] rounded-xl text-white shadow-md space-y-2">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-violet-300" />
                <h3 className="text-xs font-bold tracking-wider uppercase text-violet-200">
                  Executive Briefing
                </h3>
              </div>
              <p className="text-sm font-medium leading-relaxed text-slate-100">
                {executiveDigest.executive_summary}
              </p>
            </div>

            {/* Blocker Radar Section */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-amber-600" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                  Blocker Radar & Risk Detection
                </h3>
              </div>

              {executiveDigest.blocker_radar.length === 0 ? (
                <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-900 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>No operational blockers logged for this reporting period. Execution velocity is on track!</span>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {executiveDigest.blocker_radar.map((b) => (
                    <div
                      key={b.id}
                      className={`p-3.5 rounded-xl border text-xs transition-colors ${
                        b.severity === 'critical'
                          ? 'bg-rose-50/70 border-rose-200'
                          : b.severity === 'moderate'
                          ? 'bg-amber-50/70 border-amber-200'
                          : 'bg-blue-50/70 border-blue-200'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono uppercase ${
                              b.severity === 'critical'
                                ? 'bg-rose-600 text-white'
                                : b.severity === 'moderate'
                                ? 'bg-amber-600 text-white'
                                : 'bg-blue-600 text-white'
                            }`}
                          >
                            {b.severity} Risk
                          </span>
                          <span className="font-bold text-slate-900">{b.reporter}</span>
                          <span className="text-[11px] text-slate-500 font-mono">
                            ({b.department} · {b.role})
                          </span>
                        </div>
                      </div>

                      <p className="text-slate-800 font-medium mb-1.5">{b.blocker}</p>

                      <div className="pt-2 border-t border-slate-200/60 flex items-start gap-1.5 text-slate-700">
                        <ArrowRight className="w-3.5 h-3.5 text-indigo-600 shrink-0 mt-0.5" />
                        <div>
                          <strong className="text-indigo-900 font-semibold">Recommended Intervention: </strong>
                          <span>{b.action_plan}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Department Momentum & Key Wins */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Department Velocity */}
              <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-slate-500" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                    Department Momentum
                  </h3>
                </div>

                <div className="space-y-2">
                  {executiveDigest.department_momentum.map((d, i) => (
                    <div key={i} className="p-2.5 bg-slate-50 rounded-lg border border-slate-100 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-semibold text-slate-900 block">{d.department}</span>
                        <span className="text-[10px] text-slate-500 font-mono">
                          {d.active_members} members · {d.total_hours.toFixed(1)}h
                        </span>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          d.status === 'on_track'
                            ? 'bg-emerald-100 text-emerald-800'
                            : d.status === 'blocked'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {d.status === 'on_track' ? 'On Track' : d.status === 'blocked' ? 'Blocked' : 'Needs Attention'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Key Wins */}
              <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-emerald-600" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                    Standout Achievements
                  </h3>
                </div>

                <ul className="space-y-2 text-xs">
                  {executiveDigest.key_highlights.map((h, i) => (
                    <li key={i} className="flex items-start gap-2 text-slate-700">
                      <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                      <span>{h}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Suggested Leadership Actions */}
            <div className="p-4 bg-slate-900 text-white rounded-xl space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Action Items for Tomorrow Morning
              </h3>
              <ul className="space-y-1.5 text-xs text-slate-200">
                {executiveDigest.suggested_leadership_actions.map((act, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="font-mono text-violet-400 font-bold">{i + 1}.</span>
                    <span>{act}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
