import React, { useState, useEffect } from 'react';
import { Modal } from './Modal';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import {
  Users,
  Search,
  KeyRound,
  Copy,
  Check,
  RefreshCw,
  ArrowRight,
  ShieldCheck,
  ExternalLink,
} from 'lucide-react';

interface TeamCredentialsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TeamCredentialsModal: React.FC<TeamCredentialsModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { login } = useAuth();
  const { showToast } = useToast();

  const [credentials, setCredentials] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [switchingId, setSwitchingId] = useState<string | null>(null);

  const fetchCredentials = async () => {
    setIsLoading(true);
    try {
      const res = await api.getTeamCredentials();
      if (res.success && Array.isArray(res.credentials)) {
        setCredentials(res.credentials);
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to load team credentials', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchCredentials();
    }
  }, [isOpen]);

  const handleSyncSheet = async () => {
    setIsSyncing(true);
    try {
      const res = await api.syncGoogleSheet();
      if (res.success) {
        showToast(res.message || 'Google Sheet synchronized successfully', 'success');
        await fetchCredentials();
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to sync Google Sheet', 'error');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleCopyPassword = (id: string, pw: string) => {
    navigator.clipboard.writeText(pw);
    setCopiedId(id);
    showToast('Password copied to clipboard', 'info');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDirectAccess = async (member: any) => {
    setSwitchingId(member.id);
    try {
      await login(member.email, member.password);
      showToast(`Switched workspace session to ${member.name} (${member.role})`, 'success');
      onClose();
    } catch (err: any) {
      showToast(err.message || `Failed to sign in as ${member.name}`, 'error');
    } finally {
      setSwitchingId(null);
    }
  };

  const filteredCredentials = credentials.filter((c) => {
    const q = search.trim().toLowerCase();
    const matchesSearch =
      !q ||
      c.name.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q) ||
      (c.employee_code && c.employee_code.toLowerCase().includes(q)) ||
      (c.position && c.position.toLowerCase().includes(q)) ||
      (c.department && c.department.toLowerCase().includes(q)) ||
      (c.phone && c.phone.includes(q));

    const matchesRole = roleFilter === 'all' || c.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const adminCount = credentials.filter((c) => c.role === 'admin').length;
  const employeeCount = credentials.filter((c) => c.role === 'employee').length;
  const internCount = credentials.filter((c) => c.role === 'intern').length;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Team Member Passwords & Direct Access"
      subtitle="Master directory of individual team passwords and 1-click administrative session access"
      maxWidth="max-w-2xl"
    >
      <div className="space-y-4 max-h-[75vh] flex flex-col">
        {/* Header Information Strip */}
        <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200/90 text-xs text-slate-600 shrink-0">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-medium">
              BUILDREX Official Google Sheet: <span className="font-bold text-slate-900">{credentials.length} members loaded</span>
            </span>
          </div>
          <button
            type="button"
            onClick={handleSyncSheet}
            disabled={isSyncing}
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-emerald-800 bg-emerald-100/70 hover:bg-emerald-200/70 border border-emerald-300 rounded-lg transition-all shadow-2xs shrink-0 disabled:opacity-50 cursor-pointer"
            title="Fetch real-time records directly from official Google Sheet"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-emerald-700' : 'text-emerald-700'}`} />
            <span>{isSyncing ? 'Syncing...' : 'Sync Live Sheet'}</span>
          </button>
        </div>

        {/* Search & Filter Bar */}
        <div className="flex flex-col sm:flex-row gap-2 shrink-0">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search member, email, department, code, or phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white"
            />
          </div>

          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white text-slate-700 shrink-0 font-medium cursor-pointer"
          >
            <option value="all">All Roles ({credentials.length})</option>
            <option value="admin">Administrators ({adminCount})</option>
            <option value="employee">Employees ({employeeCount})</option>
            <option value="intern">Interns ({internCount})</option>
          </select>
        </div>

        {/* Members Cards List */}
        <div className="overflow-y-auto space-y-2.5 pr-1 flex-1">
          {isLoading ? (
            <div className="py-12 text-center text-slate-400 text-xs flex flex-col items-center gap-2">
              <RefreshCw className="w-5 h-5 animate-spin text-indigo-600" />
              <span>Loading team passwords and credentials...</span>
            </div>
          ) : filteredCredentials.length === 0 ? (
            <div className="py-10 text-center text-slate-400 text-xs border border-dashed border-slate-200 rounded-xl">
              No team members match your search criteria.
            </div>
          ) : (
            filteredCredentials.map((c) => (
              <div
                key={c.id}
                className="p-3.5 rounded-xl border border-slate-200/90 hover:border-indigo-300 bg-white hover:bg-slate-50/70 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs"
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 font-bold text-xs text-white shadow-2xs ${
                      c.role === 'admin'
                        ? 'bg-purple-600'
                        : c.role === 'intern'
                        ? 'bg-amber-600'
                        : 'bg-blue-600'
                    }`}
                  >
                    {c.name
                      .split(' ')
                      .map((n: string) => n[0])
                      .slice(0, 2)
                      .join('')
                      .toUpperCase()}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold text-slate-900">{c.name}</span>
                      <span
                        className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded uppercase ${
                          c.role === 'admin'
                            ? 'bg-purple-100 text-purple-800'
                            : c.role === 'intern'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {c.role}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {c.employee_code}
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-600 font-medium truncate mt-0.5">
                      {c.position || 'Staff'} &bull;{' '}
                      <span className="text-slate-500">{c.department || 'General'}</span>
                    </div>

                    <div className="text-[10px] text-slate-500 font-mono truncate">
                      {c.email} {c.phone && `\u2022 ${c.phone}`}
                    </div>
                  </div>
                </div>

                {/* Password display & Direct Access Buttons */}
                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                  <div className="flex items-center bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 gap-1.5">
                    <KeyRound className="w-3.5 h-3.5 text-slate-400" />
                    <span className="text-[11px] font-mono font-bold text-slate-800 select-all">
                      {c.password}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopyPassword(c.id, c.password)}
                      className="text-slate-400 hover:text-indigo-600 transition-colors p-0.5 rounded cursor-pointer"
                      title="Copy password"
                    >
                      {copiedId === c.id ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>

                  <button
                    type="button"
                    disabled={switchingId === c.id}
                    onClick={() => handleDirectAccess(c)}
                    className="px-3 py-1.5 text-xs font-bold text-white bg-brand-gradient hover:opacity-95 rounded-lg transition-all shadow-2xs cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                    title={`Instantly sign in as ${c.name}`}
                  >
                    <span>{switchingId === c.id ? 'Switching...' : 'Direct Access'}</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[11px] text-slate-500">
          <span>
            Showing <strong className="text-slate-700">{filteredCredentials.length}</strong> of{' '}
            <strong className="text-slate-700">{credentials.length}</strong> team members
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </Modal>
  );
};
