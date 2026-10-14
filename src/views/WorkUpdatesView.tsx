import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { WorkUpdate, PolishedReportResult, AiStatus } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { Modal } from '../components/Modal';
import {
  FileCheck2,
  Save,
  Send,
  AlertCircle,
  CheckCircle2,
  Calendar,
  Clock,
  MessageSquare,
  Sparkles,
  ArrowRight,
  Bot,
  KeyRound,
  Copy,
  Check,
} from 'lucide-react';

export const WorkUpdatesView: React.FC = () => {
  const [workDate, setWorkDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [projectDetails, setProjectDetails] = useState('');
  const [tasksCompleted, setTasksCompleted] = useState('');
  const [accomplishments, setAccomplishments] = useState('');
  const [blockers, setBlockers] = useState('');
  const [nextDayPlan, setNextDayPlan] = useState('');
  const [hoursSpent, setHoursSpent] = useState<number>(8.0);

  const [existingRecord, setExistingRecord] = useState<WorkUpdate | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ success?: boolean; message?: string }>({});

  // Gemini AI States
  const [isPolishing, setIsPolishing] = useState(false);
  const [isPolishModalOpen, setIsPolishModalOpen] = useState(false);
  const [polishedResult, setPolishedResult] = useState<PolishedReportResult | null>(null);
  const [aiStatus, setAiStatus] = useState<AiStatus | null>(null);
  const [isCopied, setIsCopied] = useState(false);

  // Gemini API Key config
  const [showKeyDrawer, setShowKeyDrawer] = useState(false);
  const [customApiKey, setCustomApiKey] = useState('');
  const [isSavingKey, setIsSavingKey] = useState(false);
  const [keySaveMessage, setKeySaveMessage] = useState('');

  const fetchTodayRecord = async () => {
    try {
      const [recordRes, statusRes] = await Promise.all([
        api.getTodayWorkUpdate(),
        api.getAiStatus().catch(() => null),
      ]);

      if (recordRes.success && recordRes.record) {
        setExistingRecord(recordRes.record);
        setWorkDate(recordRes.record.work_date);
        setProjectDetails(recordRes.record.project_details);
        setTasksCompleted(recordRes.record.tasks_completed);
        setAccomplishments(recordRes.record.accomplishments || '');
        setBlockers(recordRes.record.blockers || '');
        setNextDayPlan(recordRes.record.next_day_plan || '');
        setHoursSpent(recordRes.record.hours_spent || 8.0);
      }

      if (statusRes && statusRes.success) {
        setAiStatus(statusRes.status);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchTodayRecord();
  }, []);

  const handlePolishReport = async () => {
    if (!projectDetails.trim() && !tasksCompleted.trim()) {
      setFeedback({
        success: false,
        message: 'Please write some project notes or tasks completed first before polishing with AI.',
      });
      return;
    }

    setIsPolishing(true);
    setFeedback({});

    try {
      const res = await api.polishWorkReport({
        project_details: projectDetails,
        tasks_completed: tasksCompleted,
        accomplishments,
        blockers,
        next_day_plan: nextDayPlan,
      });

      if (res.success && res.data) {
        setPolishedResult(res.data);
        setIsPolishModalOpen(true);
      }
    } catch (err: any) {
      setFeedback({ success: false, message: err.message || 'Failed to polish work report with AI.' });
    } finally {
      setIsPolishing(false);
    }
  };

  const handleApplyPolished = () => {
    if (!polishedResult) return;
    setProjectDetails(polishedResult.project_details);
    setTasksCompleted(polishedResult.tasks_completed);
    setAccomplishments(polishedResult.accomplishments);
    setBlockers(polishedResult.blockers);
    setNextDayPlan(polishedResult.next_day_plan);
    setIsPolishModalOpen(false);
    setFeedback({
      success: true,
      message: '✨ AI enhancements successfully applied to your daily report form!',
    });
  };

  const handleSaveApiKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customApiKey.trim()) return;
    setIsSavingKey(true);
    setKeySaveMessage('');
    try {
      const res = await api.setGeminiApiKey(customApiKey.trim());
      if (res.success) {
        setAiStatus(res.status);
        setKeySaveMessage('✅ API Key configured! Live Gemini 2.5 Flash is now active.');
        setCustomApiKey('');
        setTimeout(() => setShowKeyDrawer(false), 2000);
      }
    } catch (err: any) {
      setKeySaveMessage(`❌ ${err.message || 'Failed to save API key'}`);
    } finally {
      setIsSavingKey(false);
    }
  };

  const handleSave = async (status: 'draft' | 'submitted') => {
    if (status === 'submitted') {
      if (!projectDetails.trim() || !tasksCompleted.trim()) {
        setFeedback({
          success: false,
          message: 'Please complete both the Project Focus and Tasks Completed fields before submitting.',
        });
        return;
      }
    }

    setIsLoading(true);
    setFeedback({});

    try {
      const res = await api.saveWorkUpdate({
        work_date: workDate,
        project_details: projectDetails,
        tasks_completed: tasksCompleted,
        accomplishments,
        blockers,
        next_day_plan: nextDayPlan,
        hours_spent: Number(hoursSpent),
        status,
      });

      setExistingRecord(res.work_update);
      setFeedback({ success: true, message: res.message });
    } catch (err: any) {
      setFeedback({ success: false, message: err.message || 'Error saving work update.' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header Banner */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-slate-900">Daily Work Update</h1>
            {existingRecord && (
              <StatusBadge status={existingRecord.status} type="work_update" />
            )}
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Record tasks, accomplishments, blockers, and alignment plans for team transparency
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* AI Intelligence Badge */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-violet-50 border border-violet-200 text-violet-700 text-[11px] font-medium">
            <Sparkles className="w-3 h-3 text-violet-600 animate-pulse" />
            <span>{aiStatus?.hasApiKey ? 'Gemini 2.5 Flash' : 'Gemini AI Assistant'}</span>
          </div>

          {existingRecord?.submitted_at && (
            <div className="text-xs text-slate-500 font-mono">
              Submitted: {new Date(existingRecord.submitted_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
            </div>
          )}
        </div>
      </div>

      {/* Review Feedback Alert (if admin commented) */}
      {existingRecord?.review_comment && (
        <div
          className={`p-4 rounded-xl border text-xs ${
            existingRecord.status === 'reviewed'
              ? 'bg-emerald-50/80 border-emerald-200 text-emerald-900'
              : 'bg-amber-50/80 border-amber-200 text-amber-900'
          }`}
        >
          <div className="flex items-start gap-2.5">
            <MessageSquare className="w-4 h-4 shrink-0 mt-0.5 text-current" />
            <div>
              <p className="font-semibold text-slate-900">
                Review Feedback from {existingRecord.reviewer_name || 'Supervisor'}:
              </p>
              <p className="mt-1 leading-relaxed">{existingRecord.review_comment}</p>
            </div>
          </div>
        </div>
      )}

      {/* Submission Feedback alert */}
      {feedback.message && (
        <div
          className={`p-3 text-xs rounded-xl border flex items-center gap-2 ${
            feedback.success
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-rose-50 text-rose-800 border-rose-200'
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

      {/* AI Assistance Action Card */}
      {existingRecord?.status !== 'reviewed' && (
        <div className="p-4 rounded-xl bg-gradient-to-r from-violet-900/5 via-indigo-900/5 to-blue-900/5 border border-indigo-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-violet-600 to-indigo-700 flex items-center justify-center text-white shadow-xs shrink-0">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-xs font-bold text-slate-900">Gemini AI Report Polisher</h2>
              <p className="text-[11px] text-slate-500">
                Draft rough bullet points below, then let Gemini polish phrasing into executive-ready achievements.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowKeyDrawer(!showKeyDrawer)}
              className="px-2.5 py-1.5 text-[11px] font-medium text-slate-600 hover:text-slate-900 hover:bg-white rounded-lg border border-slate-200 transition-colors flex items-center gap-1.5"
              title="Configure Gemini API Key"
            >
              <KeyRound className="w-3 h-3 text-slate-400" />
              <span>{aiStatus?.hasApiKey ? 'API Key Active' : 'Connect Key'}</span>
            </button>

            <button
              type="button"
              disabled={isPolishing}
              onClick={handlePolishReport}
              className="px-3.5 py-1.5 text-xs font-semibold text-white bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 rounded-lg transition-all shadow-xs flex items-center gap-1.5 disabled:opacity-50"
            >
              <Sparkles className={`w-3.5 h-3.5 ${isPolishing ? 'animate-spin' : ''}`} />
              <span>{isPolishing ? 'Polishing Draft...' : 'Polish with AI'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Gemini API Key Drawer */}
      {showKeyDrawer && (
        <div className="p-4 bg-white rounded-xl border border-indigo-100 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-indigo-600" />
              <h3 className="text-xs font-bold text-slate-900">Google Gemini API Key Setup</h3>
            </div>
            <span className="text-[10px] text-slate-400 font-mono">
              Status: {aiStatus?.hasApiKey ? 'Live Google GenAI' : 'Heuristic Engine Mode'}
            </span>
          </div>
          <p className="text-[11px] text-slate-500 leading-relaxed">
            BUILDREX supports instant live AI responses via Google's <code>@google/genai</code> SDK. If you provide a Google Gemini API key below, all polishing and executive digests will run on Gemini 2.5 Flash live. (If omitted, the built-in heuristic AI engine delivers structured simulated output).
          </p>

          <form onSubmit={handleSaveApiKey} className="flex gap-2">
            <input
              type="password"
              placeholder="AIzaSy..."
              value={customApiKey}
              onChange={(e) => setCustomApiKey(e.target.value)}
              className="flex-1 px-3 py-1.5 text-xs font-mono border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
            <button
              type="submit"
              disabled={isSavingKey || !customApiKey.trim()}
              className="px-3.5 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg disabled:opacity-50 transition-colors"
            >
              {isSavingKey ? 'Saving...' : 'Save Key'}
            </button>
          </form>

          {keySaveMessage && (
            <p className="text-[11px] text-indigo-700 font-medium">{keySaveMessage}</p>
          )}
        </div>
      )}

      {/* Work Form */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-6 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-6 border-b border-slate-100">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              Reporting Date
            </label>
            <input
              type="date"
              value={workDate}
              onChange={(e) => setWorkDate(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B1F3A]/20 focus:border-[#0B1F3A] bg-white text-slate-800"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              Hours Dedicated
            </label>
            <input
              type="number"
              step="0.5"
              min="0.5"
              max="16"
              value={hoursSpent}
              onChange={(e) => setHoursSpent(Number(e.target.value))}
              className="w-full px-3 py-2 text-xs font-mono border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B1F3A]/20 focus:border-[#0B1F3A] bg-white text-slate-800"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            Primary Project / Vertical / Module <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            required
            placeholder="e.g., BUILDREX Innovation Portal — Attendance API & Database Migration"
            value={projectDetails}
            onChange={(e) => setProjectDetails(e.target.value)}
            className="w-full px-3.5 py-2.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B1F3A]/20 focus:border-[#0B1F3A] text-slate-900"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-xs font-semibold text-slate-700">
              Tasks Completed Today <span className="text-rose-500">*</span>
            </label>
            <button
              type="button"
              onClick={handlePolishReport}
              disabled={isPolishing}
              className="text-[11px] text-violet-700 hover:text-violet-800 font-medium flex items-center gap-1 hover:underline"
            >
              <Sparkles className="w-3 h-3 text-violet-600" />
              <span>Format & Polish with AI</span>
            </button>
          </div>
          <textarea
            required
            rows={4}
            placeholder="- Built REST API endpoints for clock-in and work updates&#10;- Configured relational MySQL schema and migration script&#10;- Ran automated integration tests on staging environment"
            value={tasksCompleted}
            onChange={(e) => setTasksCompleted(e.target.value)}
            className="w-full px-3.5 py-2.5 text-xs font-mono leading-relaxed border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B1F3A]/20 focus:border-[#0B1F3A] text-slate-900"
          />
          <p className="text-[11px] text-slate-400 mt-1">Tip: Use bullet points for easy scanning during supervisor standups.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Key Accomplishments / Deliverables
            </label>
            <textarea
              rows={3}
              placeholder="e.g. Achieved 100% test coverage; fixed latency bug; deployed v1.0 release branch."
              value={accomplishments}
              onChange={(e) => setAccomplishments(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B1F3A]/20 focus:border-[#0B1F3A] text-slate-900"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Challenges or Blockers
            </label>
            <textarea
              rows={3}
              placeholder="e.g. Waiting on API credentials for 3rd-party webhook; None encountered."
              value={blockers}
              onChange={(e) => setBlockers(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B1F3A]/20 focus:border-[#0B1F3A] text-slate-900"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            Next Working Day Plan
          </label>
          <textarea
            rows={2}
            placeholder="e.g. Complete reporting charts, add CSV export testing, verify mobile responsive layout."
            value={nextDayPlan}
            onChange={(e) => setNextDayPlan(e.target.value)}
            className="w-full px-3.5 py-2.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B1F3A]/20 focus:border-[#0B1F3A] text-slate-900"
          />
        </div>

        {/* Action Buttons */}
        <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
          <span className="text-[11px] text-slate-400">
            {existingRecord?.status === 'reviewed'
              ? 'This report is locked because supervisor review has concluded.'
              : 'You can save a draft anytime or submit for supervisor evaluation.'}
          </span>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {existingRecord?.status !== 'reviewed' && (
              <button
                type="button"
                disabled={isLoading}
                onClick={() => handleSave('draft')}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors disabled:opacity-50"
              >
                <Save className="w-3.5 h-3.5" />
                Save Draft
              </button>
            )}

            {existingRecord?.status !== 'reviewed' && (
              <button
                type="button"
                disabled={isLoading}
                onClick={() => handleSave('submitted')}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2 text-xs font-semibold text-white bg-[#0B1F3A] hover:bg-[#142C4E] rounded-lg transition-colors shadow-2xs disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                {isLoading ? 'Saving...' : 'Submit Report'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* AI Polish Modal Preview */}
      <Modal
        isOpen={isPolishModalOpen}
        onClose={() => setIsPolishModalOpen(false)}
        title="Gemini AI Report Enhancements"
        subtitle="Review professionalized deliverables, structured action verbs, and impact phrasing"
        maxWidth="max-w-2xl"
      >
        {polishedResult && (
          <div className="space-y-4">
            {/* Meta indicator */}
            <div className="p-3 bg-violet-50/80 rounded-xl border border-violet-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-violet-600" />
                <span className="text-xs font-bold text-violet-900">
                  {polishedResult.summary || 'Deliverables structured and enhanced'}
                </span>
              </div>
              <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-violet-200/70 text-violet-800">
                {polishedResult.model}
              </span>
            </div>

            {/* Note */}
            <p className="text-[11px] text-slate-500 italic">
              ✨ {polishedResult.polish_notes}
            </p>

            {/* Enhanced Sections */}
            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Project Focus
                </span>
                <p className="font-semibold text-slate-900">{polishedResult.project_details}</p>
              </div>

              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Tasks Completed (Action Verb Standard)
                </span>
                <p className="font-mono text-slate-800 whitespace-pre-line leading-relaxed bg-white p-2.5 rounded border border-slate-200">
                  {polishedResult.tasks_completed}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Key Accomplishments
                  </span>
                  <p className="text-slate-800 leading-relaxed">{polishedResult.accomplishments}</p>
                </div>

                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Challenges / Blockers
                  </span>
                  <p className="text-slate-800 leading-relaxed">{polishedResult.blockers}</p>
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Next Day Plan
                </span>
                <p className="font-mono text-slate-800 whitespace-pre-line leading-relaxed bg-white p-2.5 rounded border border-slate-200">
                  {polishedResult.next_day_plan}
                </p>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setIsPolishModalOpen(false)}
                className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Keep Current Notes
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const text = `Project: ${polishedResult.project_details}\n\nTasks:\n${polishedResult.tasks_completed}\n\nAccomplishments:\n${polishedResult.accomplishments}\n\nBlockers:\n${polishedResult.blockers}\n\nPlan:\n${polishedResult.next_day_plan}`;
                    navigator.clipboard.writeText(text);
                    setIsCopied(true);
                    setTimeout(() => setIsCopied(false), 2000);
                  }}
                  className="px-3 py-1.5 text-xs text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center gap-1.5"
                >
                  {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{isCopied ? 'Copied' : 'Copy All'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleApplyPolished}
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 rounded-lg shadow-xs flex items-center gap-1.5 transition-all"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Apply to Form</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
