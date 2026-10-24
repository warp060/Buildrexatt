import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { WorkUpdate, PolishedReportResult, AiStatus } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { Modal } from '../components/Modal';
import { useToast } from '../context/ToastContext';
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
  KeyRound,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  ListPlus,
  AlertTriangle,
  Compass,
} from 'lucide-react';

const QUICK_PROJECTS = [
  '💻 Development',
  '🐛 Bug Fixes',
  '🎨 UI / Frontend',
  '📋 Team Standup',
  '🧪 Testing / QA',
  '📚 Documentation',
];

const PRESET_HOURS = [4, 6, 8, 9];

export const WorkUpdatesView: React.FC = () => {
  const { showToast } = useToast();
  const [workDate, setWorkDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [projectDetails, setProjectDetails] = useState('');
  const [tasksCompleted, setTasksCompleted] = useState('');
  const [accomplishments, setAccomplishments] = useState('');
  const [blockers, setBlockers] = useState('');
  const [nextDayPlan, setNextDayPlan] = useState('');
  const [hoursSpent, setHoursSpent] = useState<number>(8.0);
  const [showAdvanced, setShowAdvanced] = useState(false);

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
        if (recordRes.record.blockers || recordRes.record.next_day_plan) {
          setShowAdvanced(true);
        }
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

  const handleAddBullet = () => {
    setTasksCompleted((prev) => {
      const trimmed = prev.trimEnd();
      if (!trimmed) return '- ';
      return `${trimmed}\n- `;
    });
  };

  const handlePolishReport = async () => {
    if (!projectDetails.trim() && !tasksCompleted.trim()) {
      setFeedback({
        success: false,
        message: 'Please write a brief summary of tasks first before polishing with AI.',
      });
      showToast('Add tasks or project notes first to polish with AI', 'warning');
      return;
    }

    setIsPolishing(true);
    setFeedback({});

    try {
      const res = await api.polishWorkReport({
        project_details: projectDetails || 'General Tasks & Operations',
        tasks_completed: tasksCompleted,
        accomplishments,
        blockers,
        next_day_plan: nextDayPlan,
      });

      if (res.success && res.data) {
        setPolishedResult(res.data);
        setIsPolishModalOpen(true);
        showToast('AI polished your daily deliverables', 'success');
      }
    } catch (err: any) {
      setFeedback({ success: false, message: err.message || 'Failed to polish work report with AI.' });
      showToast(err.message || 'AI Polish failed', 'error');
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
    if (polishedResult.blockers || polishedResult.next_day_plan) {
      setShowAdvanced(true);
    }
    setIsPolishModalOpen(false);
    showToast('Applied AI polished enhancements to form', 'success');
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
        showToast('Gemini API key configured successfully', 'success');
        setCustomApiKey('');
        setTimeout(() => setShowKeyDrawer(false), 2000);
      }
    } catch (err: any) {
      setKeySaveMessage(`❌ ${err.message || 'Failed to save API key'}`);
      showToast(err.message || 'Failed to save key', 'error');
    } finally {
      setIsSavingKey(false);
    }
  };

  const handleSave = async (status: 'draft' | 'submitted') => {
    const effectiveProject = projectDetails.trim() || 'General Operations & Tasks';
    const effectiveTasks = tasksCompleted.trim();

    if (status === 'submitted') {
      if (!effectiveTasks) {
        setFeedback({
          success: false,
          message: 'Please write a brief summary of what you worked on today before submitting.',
        });
        showToast('Please enter what you worked on today', 'warning');
        return;
      }
    }

    const numericHours = Number(hoursSpent);
    if (isNaN(numericHours) || numericHours < 0.5 || numericHours > 24) {
      setFeedback({
        success: false,
        message: 'Hours spent must be between 0.5 and 24 hours.',
      });
      showToast('Hours spent must be between 0.5 and 24 hours', 'warning');
      return;
    }

    setIsLoading(true);
    setFeedback({});

    try {
      const res = await api.saveWorkUpdate({
        work_date: workDate,
        project_details: effectiveProject,
        tasks_completed: effectiveTasks,
        accomplishments: accomplishments.trim() || effectiveTasks,
        blockers: blockers.trim(),
        next_day_plan: nextDayPlan.trim(),
        hours_spent: numericHours,
        status,
      });

      setExistingRecord(res.work_update);
      setFeedback({ success: true, message: res.message });
      showToast(res.message, 'success');
    } catch (err: any) {
      setFeedback({ success: false, message: err.message || 'Error saving work update.' });
      showToast(err.message || 'Error saving report', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4 max-w-3xl mx-auto">
      {/* Header Banner - Compact & Clean */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg sm:text-xl font-extrabold tracking-tight text-slate-900">
              Daily Work Update
            </h1>
            {existingRecord && (
              <StatusBadge status={existingRecord.status} type="work_update" />
            )}
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Quick 60-second summary of your daily achievements and sprint tasks
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {/* Compact AI Polish Button */}
          <button
            type="button"
            disabled={isPolishing || (!projectDetails.trim() && !tasksCompleted.trim())}
            onClick={handlePolishReport}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-violet-700 bg-violet-50 hover:bg-violet-100 border border-violet-200/80 rounded-xl transition-all disabled:opacity-40 cursor-pointer shadow-2xs"
            title="Polish with Gemini AI"
          >
            <Sparkles className={`w-3.5 h-3.5 text-violet-600 ${isPolishing ? 'animate-spin' : ''}`} />
            <span>{isPolishing ? 'Polishing...' : 'Polish with AI'}</span>
          </button>

          <button
            type="button"
            onClick={() => setShowKeyDrawer(!showKeyDrawer)}
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl border border-slate-200 transition-colors cursor-pointer"
            title="Configure Gemini API Key"
          >
            <KeyRound className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Review Feedback Alert (if supervisor commented) */}
      {existingRecord?.review_comment && (
        <div
          className={`p-3.5 rounded-xl border text-xs ${
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
              <p className="mt-0.5 leading-relaxed">{existingRecord.review_comment}</p>
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

      {/* Gemini API Key Drawer (collapsible) */}
      {showKeyDrawer && (
        <div className="p-4 bg-white rounded-2xl border border-indigo-100 shadow-2xs space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-indigo-600" />
              <h3 className="text-xs font-bold text-slate-900">Google Gemini API Key</h3>
            </div>
            <span className="text-[10px] text-slate-400 font-mono">
              {aiStatus?.hasApiKey ? 'Live Google GenAI' : 'Heuristic Engine Active'}
            </span>
          </div>

          <form onSubmit={handleSaveApiKey} className="flex gap-2">
            <input
              type="password"
              placeholder="Paste AIzaSy... key"
              value={customApiKey}
              onChange={(e) => setCustomApiKey(e.target.value)}
              className="flex-1 px-3 py-1.5 text-xs font-mono border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
            <button
              type="submit"
              disabled={isSavingKey || !customApiKey.trim()}
              className="px-3.5 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl disabled:opacity-50 transition-colors cursor-pointer"
            >
              {isSavingKey ? 'Saving...' : 'Save'}
            </button>
          </form>

          {keySaveMessage && (
            <p className="text-[11px] text-indigo-700 font-medium">{keySaveMessage}</p>
          )}
        </div>
      )}

      {/* Short & Sweet Work Update Form */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5 sm:p-6 space-y-4">
        {/* Top Control Bar: Date & Quick Hours Selector */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 border-b border-slate-100">
          {/* Reporting Date */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              Date:
            </span>
            <input
              type="date"
              value={workDate}
              onChange={(e) => setWorkDate(e.target.value)}
              className="px-2.5 py-1 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B1F3A]/20 focus:border-[#0B1F3A] bg-slate-50/50 hover:bg-white text-slate-800 font-medium cursor-pointer"
            />
          </div>

          {/* Quick Hours Pills */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5 mr-1">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              Hours:
            </span>
            {PRESET_HOURS.map((h) => (
              <button
                key={h}
                type="button"
                onClick={() => setHoursSpent(h)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  hoursSpent === h
                    ? 'bg-brand-gradient text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                }`}
              >
                {h}h{h === 8 ? ' ★' : ''}
              </button>
            ))}
            <input
              type="number"
              step="0.5"
              min="0.5"
              max="24"
              value={hoursSpent}
              onChange={(e) => setHoursSpent(Number(e.target.value))}
              className="w-14 px-2 py-1 text-xs font-mono border border-slate-200 rounded-lg text-center focus:outline-none focus:ring-1 focus:ring-slate-400"
              title="Custom hours"
            />
          </div>
        </div>

        {/* Project / Focus Area (1-line) with quick tag chips */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Project / Focus Area
          </label>
          <input
            type="text"
            placeholder="e.g. Frontend Development, Bug Fixes, Attendance System..."
            value={projectDetails}
            onChange={(e) => setProjectDetails(e.target.value)}
            className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0B1F3A]/20 focus:border-[#0B1F3A] text-slate-900 placeholder:text-slate-400 bg-slate-50/40 hover:bg-white transition-colors"
          />

          {/* Quick Chips */}
          <div className="flex items-center gap-1.5 mt-2 overflow-x-auto pb-1 no-scrollbar">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider shrink-0 mr-0.5">Quick:</span>
            {QUICK_PROJECTS.map((chip) => (
              <button
                key={chip}
                type="button"
                onClick={() => {
                  setProjectDetails((prev) => {
                    const cleanChip = chip.replace(/^[^\w\s]+\s*/, '');
                    if (!prev.trim()) return cleanChip;
                    if (prev.includes(cleanChip)) return prev;
                    return `${prev}, ${cleanChip}`;
                  });
                }}
                className="px-2.5 py-0.5 text-[11px] font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors shrink-0 cursor-pointer"
              >
                {chip}
              </button>
            ))}
          </div>
        </div>

        {/* Core Update: What did you accomplish today? */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-xs font-bold text-slate-700">
              What did you work on today? <span className="text-rose-500">*</span>
            </label>
            <button
              type="button"
              onClick={handleAddBullet}
              className="text-[11px] font-bold text-brand-primary hover:text-brand-accent flex items-center gap-1 cursor-pointer transition-colors"
            >
              <ListPlus className="w-3.5 h-3.5" />
              <span>• Add Bullet</span>
            </button>
          </div>
          <textarea
            required
            rows={4}
            placeholder="- Built authentication & user session updates&#10;- Fixed layout alignment on mobile devices&#10;- Tested clock-in and daily work reports"
            value={tasksCompleted}
            onChange={(e) => setTasksCompleted(e.target.value)}
            className="w-full px-3.5 py-2.5 text-xs font-mono leading-relaxed border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0B1F3A]/20 focus:border-[#0B1F3A] text-slate-900 bg-slate-50/40 hover:bg-white transition-colors placeholder:text-slate-400"
          />
        </div>

        {/* Optional Collapsible: Blockers & Tomorrow's Plan */}
        <div className="pt-1">
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center justify-between w-full p-2.5 rounded-xl bg-slate-50/80 hover:bg-slate-100 text-xs font-semibold text-slate-600 transition-colors cursor-pointer border border-slate-200/60"
          >
            <span className="flex items-center gap-2">
              <Compass className="w-3.5 h-3.5 text-slate-500" />
              <span>Add Blockers or Tomorrow's Plan (Optional)</span>
              {(blockers.trim() || nextDayPlan.trim()) && (
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
              )}
            </span>
            {showAdvanced ? (
              <ChevronUp className="w-4 h-4 text-slate-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-slate-400" />
            )}
          </button>

          {showAdvanced && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3 p-3.5 bg-slate-50/50 rounded-xl border border-slate-200/60">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                  Blockers (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Waiting on API credentials, None..."
                  value={blockers}
                  onChange={(e) => setBlockers(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-400 text-slate-900 bg-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                  <Compass className="w-3.5 h-3.5 text-blue-500" />
                  Plan for Tomorrow (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Complete responsive audit, deploy v1.1..."
                  value={nextDayPlan}
                  onChange={(e) => setNextDayPlan(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-400 text-slate-900 bg-white"
                />
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons Footer */}
        <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
          <span className="text-[11px] text-slate-400">
            {existingRecord?.status === 'reviewed'
              ? '✅ This report is locked because supervisor review has concluded.'
              : 'Save as draft anytime or submit for supervisor evaluation.'}
          </span>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {existingRecord?.status !== 'reviewed' && (
              <button
                type="button"
                disabled={isLoading}
                onClick={() => handleSave('draft')}
                className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors disabled:opacity-50 cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save Draft</span>
              </button>
            )}

            {existingRecord?.status !== 'reviewed' && (
              <button
                type="button"
                disabled={isLoading}
                onClick={() => handleSave('submitted')}
                className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-brand-gradient hover:opacity-95 active:scale-[0.98] rounded-xl transition-all shadow-sm disabled:opacity-50 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isLoading ? 'Submitting...' : 'Submit Report'}</span>
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

              {(polishedResult.accomplishments || polishedResult.blockers) && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {polishedResult.accomplishments && (
                    <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                        Key Accomplishments
                      </span>
                      <p className="text-slate-800 leading-relaxed">{polishedResult.accomplishments}</p>
                    </div>
                  )}

                  {polishedResult.blockers && (
                    <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                        Challenges / Blockers
                      </span>
                      <p className="text-slate-800 leading-relaxed">{polishedResult.blockers}</p>
                    </div>
                  )}
                </div>
              )}

              {polishedResult.next_day_plan && (
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Next Day Plan
                  </span>
                  <p className="font-mono text-slate-800 whitespace-pre-line leading-relaxed bg-white p-2.5 rounded border border-slate-200">
                    {polishedResult.next_day_plan}
                  </p>
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setIsPolishModalOpen(false)}
                className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
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
                  className="px-3 py-1.5 text-xs text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{isCopied ? 'Copied' : 'Copy All'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleApplyPolished}
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 rounded-lg shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
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
