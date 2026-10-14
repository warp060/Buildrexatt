import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../api';
import { WorkUpdate } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { Search, Filter, Calendar, Clock, ChevronDown, ChevronUp, MessageSquare } from 'lucide-react';

export const WorkHistoryView: React.FC = () => {
  const [updates, setUpdates] = useState<WorkUpdate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchHistory = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await api.getMyWorkUpdates({
        status: statusFilter !== 'all' ? statusFilter : undefined,
        limit: 50,
      });
      if (res.success) {
        setUpdates(res.records);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const filtered = updates.filter((u) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return (
      u.work_date.includes(q) ||
      (u.project_details && u.project_details.toLowerCase().includes(q)) ||
      (u.tasks_completed && u.tasks_completed.toLowerCase().includes(q)) ||
      (u.accomplishments && u.accomplishments.toLowerCase().includes(q)) ||
      (u.blockers && u.blockers.toLowerCase().includes(q)) ||
      (u.review_comment && u.review_comment.toLowerCase().includes(q))
    );
  });


  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-2xs">
        <h1 className="text-xl font-bold tracking-tight text-slate-900">Work Updates History</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Comprehensive archive of your daily accomplishments, sprint tasks, and supervisor reviews
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg w-full sm:w-auto overflow-x-auto">
          {['all', 'submitted', 'reviewed', 'needs_revision', 'draft'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap capitalize ${
                statusFilter === st
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {st === 'all' ? 'All' : st.replace('_', ' ')}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search projects or tasks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B1F3A]/20 focus:border-[#0B1F3A] bg-white text-slate-900"
          />
        </div>
      </div>

      {/* List of Work Updates */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="bg-white p-12 rounded-xl border border-slate-200 text-center text-xs text-slate-400">
            Loading work history...
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white p-12 rounded-xl border border-slate-200 text-center text-xs text-slate-400">
            No work updates found matching filters.
          </div>
        ) : (
          filtered.map((u) => {
            const isExpanded = expandedId === u.id;
            return (
              <div
                key={u.id}
                className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden transition-all"
              >
                <div
                  onClick={() => setExpandedId(isExpanded ? null : u.id)}
                  className="p-4 sm:p-5 flex items-center justify-between cursor-pointer hover:bg-slate-50/70 transition-colors"
                >
                  <div className="min-w-0 pr-4">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-semibold text-slate-900">{u.work_date}</span>
                      <span className="text-slate-300">·</span>
                      <span className="text-xs text-slate-600 font-medium truncate">{u.project_details}</span>
                      <span className="text-slate-300">·</span>
                      <span className="text-[11px] font-mono text-slate-500 tabular-nums">{u.hours_spent} hrs</span>
                    </div>
                    <p className="text-xs text-slate-500 line-clamp-1 whitespace-pre-line">
                      {u.tasks_completed}
                    </p>
                  </div>

                  <div className="flex items-center gap-4 shrink-0">
                    <StatusBadge status={u.status} type="work_update" />
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-slate-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-400" />
                    )}
                  </div>
                </div>

                {isExpanded && (
                  <div className="px-5 pb-5 pt-2 border-t border-slate-100 bg-slate-50/40 text-xs space-y-4">
                    <div>
                      <h4 className="font-semibold text-slate-800 text-[11px] uppercase tracking-wider mb-1">
                        Tasks Completed
                      </h4>
                      <p className="text-slate-700 whitespace-pre-line bg-white p-3 rounded-lg border border-slate-200 font-mono text-[11px] leading-relaxed">
                        {u.tasks_completed}
                      </p>
                    </div>

                    {u.accomplishments && (
                      <div>
                        <h4 className="font-semibold text-slate-800 text-[11px] uppercase tracking-wider mb-1">
                          Key Accomplishments
                        </h4>
                        <p className="text-slate-700 bg-white p-3 rounded-lg border border-slate-200">
                          {u.accomplishments}
                        </p>
                      </div>
                    )}

                    {u.blockers && (
                      <div>
                        <h4 className="font-semibold text-slate-800 text-[11px] uppercase tracking-wider mb-1">
                          Blockers / Impediments
                        </h4>
                        <p className="text-slate-700 bg-white p-3 rounded-lg border border-slate-200">
                          {u.blockers}
                        </p>
                      </div>
                    )}

                    {u.next_day_plan && (
                      <div>
                        <h4 className="font-semibold text-slate-800 text-[11px] uppercase tracking-wider mb-1">
                          Next Working Day Plan
                        </h4>
                        <p className="text-slate-700 bg-white p-3 rounded-lg border border-slate-200">
                          {u.next_day_plan}
                        </p>
                      </div>
                    )}

                    {u.review_comment && (
                      <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200 text-emerald-950">
                        <div className="flex items-center gap-1.5 font-semibold text-emerald-800 text-[11px] mb-0.5">
                          <MessageSquare className="w-3.5 h-3.5" />
                          Supervisor Feedback ({u.reviewer_name || 'Admin'}):
                        </div>
                        <p className="mt-0.5">{u.review_comment}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
