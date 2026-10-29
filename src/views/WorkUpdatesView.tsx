import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { WorkUpdate } from '../types';
import { StatusBadge } from '../components/StatusBadge';
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

  const fetchTodayRecord = async () => {
    try {
      const recordRes = await api.getTodayWorkUpdate();

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
      {/* Header Banner - Clean & Simple */}
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
            Record your genuine daily accomplishments, sprint tasks, and blockers
          </p>
        </div>

        {existingRecord && (
          <div className="text-xs text-slate-400 font-medium">
            Reporting Date: <span className="text-slate-700 font-semibold">{existingRecord.work_date}</span>
          </div>
        )}
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

      {/* Work Update Form */}
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
    </div>
  );
};
