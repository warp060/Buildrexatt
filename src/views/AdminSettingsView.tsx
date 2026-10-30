import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { CompanySettings, Department, Holiday, DatabaseStatus } from '../types';
import { Modal } from '../components/Modal';
import {
  Sliders,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Plus,
  Clock,
  Database,
  Cloud,
  RefreshCw,
  Server,
  Activity,
  ShieldCheck,
  ExternalLink,
  HardDrive,
  Cpu,
  Terminal,
  Users,
} from 'lucide-react';

import { useToast } from '../context/ToastContext';
import { BuildrexLogo } from '../components/BuildrexLogo';

interface AdminSettingsViewProps {
  onNavigateTab?: (tab: string) => void;
}

export const AdminSettingsView: React.FC<AdminSettingsViewProps> = ({ onNavigateTab }) => {
  const { showToast } = useToast();
  const [settings, setSettings] = useState<CompanySettings | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Database Management State
  const [dbStatus, setDbStatus] = useState<DatabaseStatus | null>(null);
  const [isTestingDb, setIsTestingDb] = useState(false);
  const [isSyncingDb, setIsSyncingDb] = useState(false);
  const [isMigratingDb, setIsMigratingDb] = useState(false);
  const [dbFeedback, setDbFeedback] = useState<{ success?: boolean; message?: string }>({});

  // Settings form
  const [companyName, setCompanyName] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('18:00');
  const [gracePeriod, setGracePeriod] = useState(15);
  const [halfDayMinutes, setHalfDayMinutes] = useState(240);
  const [timezone, setTimezone] = useState('America/Los_Angeles');
  const [allowBreaks, setAllowBreaks] = useState(true);
  const [settingsFeedback, setSettingsFeedback] = useState<{ success?: boolean; message?: string }>({});
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  // New Department Modal
  const [isDeptModalOpen, setIsDeptModalOpen] = useState(false);
  const [deptName, setDeptName] = useState('');
  const [deptCode, setDeptCode] = useState('');
  const [deptDesc, setDeptDesc] = useState('');
  const [deptFeedback, setDeptFeedback] = useState<{ success?: boolean; message?: string }>({});
  const [isSavingDept, setIsSavingDept] = useState(false);

  const fetchSettingsAndDepts = async () => {
    setIsLoading(true);
    try {
      const meRes = await api.getMe();
      const deptsRes = await api.getDepartments();

      if (meRes.success && meRes.company_settings) {
        setSettings(meRes.company_settings);
        setCompanyName(meRes.company_settings.company_name);
        setStartTime(meRes.company_settings.work_start_time);
        setEndTime(meRes.company_settings.work_end_time);
        setGracePeriod(meRes.company_settings.grace_period_minutes);
        setHalfDayMinutes(meRes.company_settings.half_day_minutes);
        setTimezone(meRes.company_settings.timezone);
        setAllowBreaks(meRes.company_settings.allow_breaks);
      }
      if (deptsRes.success) {
        setDepartments(deptsRes.departments);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchDbStatus = async () => {
    try {
      const res = await api.getDatabaseStatus();
      if (res.success) {
        setDbStatus(res.database);
      }
    } catch (e) {
      console.error('Failed to get database status:', e);
    }
  };

  useEffect(() => {
    fetchSettingsAndDepts();
    fetchDbStatus();
  }, []);

  const handleTestDb = async () => {
    setIsTestingDb(true);
    setDbFeedback({});
    try {
      const res = await api.testDatabaseConnection();
      setDbFeedback({ success: res.success, message: res.message });
      showToast(res.message, res.success ? 'success' : 'error');
      await fetchDbStatus();
    } catch (err: any) {
      setDbFeedback({ success: false, message: err.message || 'TiDB connection test failed.' });
      showToast(err.message || 'TiDB connection failed', 'error');
    } finally {
      setIsTestingDb(false);
    }
  };

  const handleMigrateDb = async () => {
    setIsMigratingDb(true);
    setDbFeedback({});
    try {
      const res = await api.runDatabaseMigration();
      setDbFeedback({ success: res.success, message: res.message });
      showToast(res.message, res.success ? 'success' : 'error');
      await fetchDbStatus();
    } catch (err: any) {
      setDbFeedback({ success: false, message: err.message || 'Database migration failed.' });
      showToast(err.message || 'Migration failed', 'error');
    } finally {
      setIsMigratingDb(false);
    }
  };

  const handleSyncDb = async () => {
    setIsSyncingDb(true);
    setDbFeedback({});
    try {
      const res = await api.syncDatabase();
      setDbFeedback({ success: res.success, message: res.message });
      showToast(res.message, res.success ? 'success' : 'error');
      await fetchDbStatus();
    } catch (err: any) {
      setDbFeedback({ success: false, message: err.message || 'Database synchronization failed.' });
      showToast(err.message || 'Sync failed', 'error');
    } finally {
      setIsSyncingDb(false);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();

    if (startTime >= endTime) {
      setSettingsFeedback({ success: false, message: 'Work start time must be strictly earlier than work end time.' });
      showToast('Work start time must be earlier than end time', 'warning');
      return;
    }

    if (Number(gracePeriod) < 0 || Number(gracePeriod) > 180) {
      setSettingsFeedback({ success: false, message: 'Grace period must be between 0 and 180 minutes.' });
      showToast('Grace period must be between 0 and 180 minutes', 'warning');
      return;
    }

    setIsSavingSettings(true);
    setSettingsFeedback({});
    try {
      const res = await api.updateCompanySettings({
        company_name: companyName.trim(),
        work_start_time: startTime,
        work_end_time: endTime,
        grace_period_minutes: Number(gracePeriod),
        half_day_minutes: Number(halfDayMinutes),
        timezone,
        allow_breaks: allowBreaks,
      });

      setSettingsFeedback({ success: true, message: res.message });
      showToast(res.message, 'success');
      setSettings(res.settings);
    } catch (err: any) {
      setSettingsFeedback({ success: false, message: err.message || 'Failed to update company settings.' });
      showToast(err.message || 'Failed to update settings', 'error');
    } finally {
      setIsSavingSettings(false);
    }
  };

  const handleCreateDept = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deptName.trim() || !deptCode.trim()) {
      setDeptFeedback({ success: false, message: 'Department name and code are required.' });
      showToast('Department name and code are required', 'warning');
      return;
    }
    setIsSavingDept(true);
    setDeptFeedback({});

    try {
      const res = await api.createDepartment({
        name: deptName.trim(),
        code: deptCode.trim().toUpperCase(),
        description: deptDesc.trim(),
      });

      setDeptFeedback({ success: true, message: `Department ${res.department.name} created.` });
      showToast(`Department ${res.department.name} created successfully`, 'success');
      setDeptName('');
      setDeptCode('');
      setDeptDesc('');
      await fetchSettingsAndDepts();
      setTimeout(() => {
        setIsDeptModalOpen(false);
      }, 1200);
    } catch (err: any) {
      setDeptFeedback({ success: false, message: err.message || 'Failed to create department.' });
      showToast(err.message || 'Failed to create department', 'error');
    } finally {
      setIsSavingDept(false);
    }
  };


  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <BuildrexLogo size="md" variant="badge" glow={true} />
          <div>
            <div className="flex items-center gap-1">
              <h1 className="text-xl font-black tracking-tight text-slate-900 leading-none">BUILDRE</h1>
              <span className="text-xl font-black tracking-tight bg-gradient-to-tr from-purple-600 via-indigo-500 to-cyan-500 bg-clip-text text-transparent leading-none">X</span>
              <span className="ml-2 text-[10px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">Official Brand Active</span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Establish biometric working hours, shift rules, grace periods, and organizational departments
            </p>
          </div>
        </div>
      </div>

      {/* Attendance & Shift Rules Form */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Working Hours & Attendance Policy</h2>
            <p className="text-xs text-slate-500">Official rules used to determine late arrivals and half-day status</p>
          </div>
          <span className="text-[11px] font-mono text-slate-400">
            Updated: {settings?.updated_at ? new Date(settings.updated_at).toLocaleDateString() : 'Active'}
          </span>
        </div>

        {settingsFeedback.message && (
          <div
            className={`mb-4 p-3 text-xs rounded-lg flex items-center gap-2 ${
              settingsFeedback.success
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                : 'bg-rose-50 text-rose-800 border border-rose-200'
            }`}
          >
            {settingsFeedback.success ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            )}
            <span>{settingsFeedback.message}</span>
          </div>
        )}

        <form onSubmit={handleSaveSettings} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Company Legal Entity</label>
            <input
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B1F3A]/20 focus:border-[#0B1F3A]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Shift Start Time</label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full px-3 py-2 text-xs font-mono border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B1F3A]/20 focus:border-[#0B1F3A]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Shift End Time</label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full px-3 py-2 text-xs font-mono border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B1F3A]/20 focus:border-[#0B1F3A]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Late Grace Window (Mins)</label>
              <input
                type="number"
                min="0"
                max="60"
                value={gracePeriod}
                onChange={(e) => setGracePeriod(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs font-mono border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B1F3A]/20 focus:border-[#0B1F3A]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Half-Day Shift Threshold (Minutes)
              </label>
              <input
                type="number"
                min="60"
                max="360"
                value={halfDayMinutes}
                onChange={(e) => setHalfDayMinutes(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs font-mono border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B1F3A]/20 focus:border-[#0B1F3A]"
              />
              <span className="text-[11px] text-slate-400 mt-1 block">
                Current: {halfDayMinutes / 60} hours (Shifts shorter than this are classified as Half Day)
              </span>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Company Operating Timezone</label>
              <select
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B1F3A]/20 focus:border-[#0B1F3A] bg-white text-slate-800"
              >
                <option value="America/Los_Angeles">Pacific Time (America/Los_Angeles UTC-7)</option>
                <option value="America/New_York">Eastern Time (America/New_York UTC-4)</option>
                <option value="Asia/Kolkata">India Standard Time (Asia/Kolkata UTC+5:30)</option>
                <option value="Europe/London">Greenwich Mean Time (Europe/London UTC+0)</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end pt-3 border-t border-slate-100">
            <button
              type="submit"
              disabled={isSavingSettings}
              className="px-4 py-2 text-xs font-semibold text-white bg-[#0B1F3A] hover:bg-[#142C4E] rounded-lg transition-colors disabled:opacity-50"
            >
              {isSavingSettings ? 'Saving...' : 'Update Policy Settings'}
            </button>
          </div>
        </form>
      </div>

      {/* Organization Departments Section */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Organizational Departments</h2>
            <p className="text-xs text-slate-500">Business verticals and functional unit groupings</p>
          </div>
          <button
            onClick={() => {
              setDeptName('');
              setDeptCode('');
              setDeptDesc('');
              setDeptFeedback({});
              setIsDeptModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#0B1F3A] bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Department
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {departments.map((d) => (
            <div key={d.id} className="p-3.5 rounded-lg border border-slate-200 bg-slate-50/50">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-xs text-slate-900">{d.name}</span>
                <span className="font-mono text-[10px] bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded font-semibold">
                  {d.code}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">{d.description}</p>
              <div className="mt-2 text-[10px] text-slate-400 font-mono">
                Active Members: <strong className="text-slate-700">{d.user_count || 0}</strong>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* TiDB Cloud Database Engine (Distributed SQL)                   */}
      {/* ───────────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 mb-5 gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500/10 to-blue-500/10 border border-indigo-200/40 flex items-center justify-center text-indigo-600">
              <Cloud className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-slate-900">TiDB Cloud Database Engine</h2>
                <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                  Distributed MySQL
                </span>
              </div>
              <p className="text-xs text-slate-500">
                High-concurrency, HTAP distributed relational database for enterprise attendance & work management
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {dbStatus?.connected ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                TiDB Cloud Online ({dbStatus.latencyMs ? `${dbStatus.latencyMs}ms` : 'Ready'})
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                Local Datastore Active (JSON Fallback)
              </span>
            )}
            <button
              onClick={fetchDbStatus}
              title="Refresh database diagnostics"
              className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Action Feedback Banner */}
        {dbFeedback.message && (
          <div
            className={`mb-5 p-3.5 text-xs rounded-lg flex items-center gap-2.5 ${
              dbFeedback.success
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                : 'bg-rose-50 text-rose-800 border border-rose-200'
            }`}
          >
            {dbFeedback.success ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            )}
            <span className="font-medium">{dbFeedback.message}</span>
          </div>
        )}

        {/* Diagnostic KPI Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
          <div className="p-3.5 rounded-lg border border-slate-200/70 bg-slate-50/50">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Database Engine</span>
            <div className="text-xs font-bold text-slate-900 mt-1 flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5 text-[#0B1F3A]" />
              {dbStatus?.connected ? 'TiDB Cloud Serverless' : 'Local File Store'}
            </div>
            <span className="text-[10px] text-slate-500 mt-0.5 block font-mono">
              {dbStatus?.version ? `v${dbStatus.version.slice(0, 16)}` : 'JSON v1.0'}
            </span>
          </div>

          <div className="p-3.5 rounded-lg border border-slate-200/70 bg-slate-50/50">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Cluster Host</span>
            <div className="text-xs font-bold text-slate-900 mt-1 truncate font-mono" title={dbStatus?.host}>
              {dbStatus?.host || 'gateway01...'}
            </div>
            <span className="text-[10px] text-slate-500 mt-0.5 block font-mono">Port: {dbStatus?.port || 4000}</span>
          </div>

          <div className="p-3.5 rounded-lg border border-slate-200/70 bg-slate-50/50">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Encryption / SSL</span>
            <div className="text-xs font-bold text-emerald-700 mt-1 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              TLS Encrypted
            </div>
            <span className="text-[10px] text-slate-500 mt-0.5 block font-mono">Database: {dbStatus?.database || 'buildrex'}</span>
          </div>

          <div className="p-3.5 rounded-lg border border-slate-200/70 bg-slate-50/50">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Cluster Latency</span>
            <div className="text-xs font-bold text-slate-900 mt-1 flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-indigo-600" />
              {dbStatus?.latencyMs ? `${dbStatus.latencyMs} ms` : 'Local (<1ms)'}
            </div>
            <span className="text-[10px] text-slate-500 mt-0.5 block font-mono">
              Status: {dbStatus?.connected ? 'Optimal' : 'Offline Mode'}
            </span>
          </div>
        </div>

        {/* Live Table Records Breakdown */}
        {dbStatus?.tableCounts && (
          <div className="mb-5 p-3.5 rounded-lg bg-slate-50 border border-slate-200/70">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2.5">
              <span className="text-[11px] font-bold text-slate-700">Relational Table Row Counts (TiDB Cloud)</span>
              {onNavigateTab && (
                <button
                  type="button"
                  onClick={() => onNavigateTab('admin-users')}
                  className="text-[11px] font-semibold text-emerald-800 hover:text-emerald-950 flex items-center gap-1 cursor-pointer bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 transition-colors self-start sm:self-auto"
                >
                  <Users className="w-3 h-3 text-emerald-700" />
                  <span>Go to Team Directory &rarr;</span>
                </button>
              )}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 text-center">
              <div
                className={`bg-white p-2 rounded border border-slate-200 ${onNavigateTab ? 'cursor-pointer hover:border-emerald-400 hover:shadow-2xs transition-all' : ''}`}
                onClick={() => onNavigateTab && onNavigateTab('admin-users')}
                title={onNavigateTab ? 'Click to open Team Directory' : undefined}
              >
                <span className="text-[10px] text-slate-400 block font-medium">Users</span>
                <span className="text-xs font-bold text-emerald-800">{dbStatus.tableCounts.users ?? 0}</span>
              </div>
              <div className="bg-white p-2 rounded border border-slate-200">
                <span className="text-[10px] text-slate-400 block font-medium">Attendance</span>
                <span className="text-xs font-bold text-slate-800">{dbStatus.tableCounts.attendance ?? 0}</span>
              </div>
              <div className="bg-white p-2 rounded border border-slate-200">
                <span className="text-[10px] text-slate-400 block font-medium">Work Updates</span>
                <span className="text-xs font-bold text-slate-800">{dbStatus.tableCounts.work_updates ?? 0}</span>
              </div>
              <div className="bg-white p-2 rounded border border-slate-200">
                <span className="text-[10px] text-slate-400 block font-medium">Departments</span>
                <span className="text-xs font-bold text-slate-800">{dbStatus.tableCounts.departments ?? 0}</span>
              </div>
              <div className="bg-white p-2 rounded border border-slate-200">
                <span className="text-[10px] text-slate-400 block font-medium">Leave Requests</span>
                <span className="text-xs font-bold text-slate-800">{dbStatus.tableCounts.leave_requests ?? 0}</span>
              </div>
              <div className="bg-white p-2 rounded border border-slate-200">
                <span className="text-[10px] text-slate-400 block font-medium">Audit Logs</span>
                <span className="text-xs font-bold text-slate-800">{dbStatus.tableCounts.audit_logs ?? 0}</span>
              </div>
            </div>
          </div>
        )}

        {/* Action Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-100">
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleTestDb}
              disabled={isTestingDb}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors disabled:opacity-50"
            >
              <Activity className="w-3.5 h-3.5 text-slate-600" />
              {isTestingDb ? 'Testing Connection...' : 'Test Connection'}
            </button>

            <button
              onClick={handleMigrateDb}
              disabled={isMigratingDb}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg transition-colors disabled:opacity-50"
            >
              <Terminal className="w-3.5 h-3.5 text-indigo-600" />
              {isMigratingDb ? 'Running Migrations...' : 'Run Table Migrations'}
            </button>

            <button
              onClick={handleSyncDb}
              disabled={isSyncingDb}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-[#0B1F3A] hover:bg-[#142C4E] rounded-lg transition-colors disabled:opacity-50"
            >
              <Cloud className="w-3.5 h-3.5" />
              {isSyncingDb ? 'Syncing Tables...' : 'Sync Data to TiDB Cloud'}
            </button>
          </div>

          <a
            href="https://tidbcloud.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 inline-flex items-center gap-1"
          >
            TiDB Cloud Console
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>

        {/* TiDB Cloud Setup Instructions */}
        <div className="mt-4 p-3 bg-slate-50/80 rounded-lg border border-slate-200/60 text-xs text-slate-600 space-y-1.5">
          <p className="font-semibold text-slate-800">Connecting your own TiDB Cloud Serverless Cluster:</p>
          <ol className="list-decimal list-inside space-y-1 text-[11px] text-slate-600">
            <li>Create a free cluster at <strong className="text-slate-800">tidbcloud.com</strong> (Free tier forever with 25 GiB storage).</li>
            <li>In the cluster overview, click <strong className="text-slate-800">Connect</strong> &rarr; copy your Host, User, and Password.</li>
            <li>Add them to your <code className="font-mono bg-white px-1.5 py-0.5 rounded border border-slate-200 text-slate-800">.env</code> file (<code className="font-mono text-slate-700">TIDB_HOST</code>, <code className="font-mono text-slate-700">TIDB_USER</code>, <code className="font-mono text-slate-700">TIDB_PASSWORD</code>).</li>
            <li>Run <code className="font-mono bg-white px-1.5 py-0.5 rounded border border-slate-200 text-slate-800">npm run db:setup</code> or click <strong className="text-slate-800">Sync Data to TiDB Cloud</strong> above!</li>
          </ol>
        </div>
      </div>

      {/* Add Department Modal */}
      <Modal
        isOpen={isDeptModalOpen}
        onClose={() => setIsDeptModalOpen(false)}
        title="Add Company Department"
        subtitle="Create a new functional department or innovation vertical"
      >
        <form onSubmit={handleCreateDept} className="space-y-4">
          {deptFeedback.message && (
            <div
              className={`p-3 text-xs rounded-lg flex items-center gap-2 ${
                deptFeedback.success
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-rose-50 text-rose-800 border border-rose-200'
              }`}
            >
              {deptFeedback.success ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              )}
              <span>{deptFeedback.message}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Department Name</label>
            <input
              type="text"
              required
              value={deptName}
              onChange={(e) => setDeptName(e.target.value)}
              placeholder="e.g. Robotics & Autonomous Hardware"
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B1F3A]/20 focus:border-[#0B1F3A]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Department Code</label>
            <input
              type="text"
              required
              value={deptCode}
              onChange={(e) => setDeptCode(e.target.value)}
              placeholder="e.g. ROBOTICS"
              className="w-full px-3 py-2 text-xs font-mono uppercase border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B1F3A]/20 focus:border-[#0B1F3A]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Description</label>
            <textarea
              rows={2}
              value={deptDesc}
              onChange={(e) => setDeptDesc(e.target.value)}
              placeholder="Scope and purpose of this department vertical..."
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B1F3A]/20 focus:border-[#0B1F3A]"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsDeptModalOpen(false)}
              className="px-3.5 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSavingDept}
              className="px-4 py-2 text-xs font-semibold text-white bg-[#0B1F3A] hover:bg-[#142C4E] rounded-lg transition-colors disabled:opacity-50"
            >
              {isSavingDept ? 'Saving...' : 'Create Department'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
