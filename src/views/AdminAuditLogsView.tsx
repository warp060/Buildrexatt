import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../api';
import { AuditLogItem } from '../types';
import { Shield, Search, RefreshCw, FileText } from 'lucide-react';

export const AdminAuditLogsView: React.FC = () => {
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedLog, setSelectedLog] = useState<AuditLogItem | null>(null);

  const fetchLogs = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await api.getAuditLogs({ limit: 100 });
      if (res.success) {
        setLogs(res.logs);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const filteredLogs = logs.filter((l) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      l.actor_name.toLowerCase().includes(q) ||
      l.action.toLowerCase().includes(q) ||
      l.entity_type.toLowerCase().includes(q) ||
      l.entity_id.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">Security & Administrative Audit Trail</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Immutable system logs documenting logins, attendance adjustments, approvals, and profile changes
          </p>
        </div>

        <button
          onClick={fetchLogs}
          className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors self-start sm:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh Audit Trail
        </button>
      </div>

      {/* Search Input */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search action, actor, entity..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B1F3A]/20 focus:border-[#0B1F3A]"
          />
        </div>
        <span className="text-xs font-mono text-slate-400 hidden sm:inline-block">
          {filteredLogs.length} events logged
        </span>
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/70 border-b border-slate-200 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4">Timestamp (UTC)</th>
                <th className="py-3 px-4">Actor</th>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">Entity Type</th>
                <th className="py-3 px-4">Entity ID</th>
                <th className="py-3 px-4">IP Address</th>
                <th className="py-3 px-4 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs font-mono">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400 font-sans">
                    Loading security logs...
                  </td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400 font-sans">
                    No matching audit logs found.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-2.5 px-4 text-slate-500 whitespace-nowrap text-[11px]">
                      {new Date(log.created_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'medium' })}
                    </td>
                    <td className="py-2.5 px-4 font-sans font-semibold text-slate-900 whitespace-nowrap">
                      {log.actor_name}
                    </td>
                    <td className="py-2.5 px-4 whitespace-nowrap">
                      <span className="bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded text-[10px] font-medium font-mono">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-slate-600 whitespace-nowrap text-[11px]">
                      {log.entity_type}
                    </td>
                    <td className="py-2.5 px-4 text-slate-500 max-w-xs truncate text-[11px]">
                      {log.entity_id}
                    </td>
                    <td className="py-2.5 px-4 text-slate-400 whitespace-nowrap text-[11px]">
                      {log.ip_address}
                    </td>
                    <td className="py-2.5 px-4 text-right whitespace-nowrap font-sans">
                      <button
                        onClick={() => setSelectedLog(selectedLog?.id === log.id ? null : log)}
                        className="text-[11px] font-semibold text-[#0B1F3A] hover:underline"
                      >
                        {selectedLog?.id === log.id ? 'Hide' : 'Inspect'}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Details Box */}
      {selectedLog && (
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-2">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <span className="text-xs font-bold text-slate-900">
              Audit Payload: {selectedLog.action} ({selectedLog.id})
            </span>
            <button
              onClick={() => setSelectedLog(null)}
              className="text-xs text-slate-400 hover:text-slate-700"
            >
              Close
            </button>
          </div>
          <pre className="p-3 bg-slate-900 text-emerald-400 rounded-lg text-xs font-mono overflow-x-auto max-h-64">
            {JSON.stringify(selectedLog, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};
