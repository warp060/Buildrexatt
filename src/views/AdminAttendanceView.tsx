import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../api';
import { AttendanceRecord, Department } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { Modal } from '../components/Modal';
import { Search, Filter, Edit, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';

export const AdminAttendanceView: React.FC = () => {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [roleFilter, setRoleFilter] = useState('all');
  const [deptFilter, setDeptFilter] = useState('all');
  const [filterDate, setFilterDate] = useState('');

  // Edit / Manual Adjustment Modal
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<AttendanceRecord | null>(null);
  const [editCheckIn, setEditCheckIn] = useState('');
  const [editCheckOut, setEditCheckOut] = useState('');
  const [editStatus, setEditStatus] = useState<AttendanceRecord['status']>('present');
  const [editNotes, setEditNotes] = useState('');
  const [editFeedback, setEditFeedback] = useState<{ success?: boolean; message?: string }>({});
  const [isUpdating, setIsUpdating] = useState(false);

  const fetchRecords = useCallback(async () => {
    setIsLoading(true);
    try {
      const [attRes, deptsRes] = await Promise.all([
        api.getAdminAttendance({
          search: search || undefined,
          status: statusFilter !== 'all' ? statusFilter : undefined,
          role: roleFilter !== 'all' ? roleFilter : undefined,
          department_id: deptFilter !== 'all' ? deptFilter : undefined,
          date: filterDate || undefined,
          limit: 50,
        }),
        api.getDepartments(),
      ]);

      if (attRes.success) {
        setRecords(attRes.records);
        setTotalCount(attRes.total);
      }
      if (deptsRes.success) {
        setDepartments(deptsRes.departments);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [search, statusFilter, roleFilter, deptFilter, filterDate]);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  const handleOpenEdit = (rec: AttendanceRecord) => {
    setSelectedRecord(rec);
    setEditCheckIn(rec.check_in.slice(11, 16));
    setEditCheckOut(rec.check_out ? rec.check_out.slice(11, 16) : '18:00');
    setEditStatus(rec.status);
    setEditNotes(rec.notes || '');
    setEditFeedback({});
    setIsEditModalOpen(true);
  };

  const handleSaveAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRecord) return;
    setIsUpdating(true);
    setEditFeedback({});

    try {
      const date = selectedRecord.work_date;
      const newIn = `${date}T${editCheckIn}:00Z`;
      const newOut = editCheckOut ? `${date}T${editCheckOut}:00Z` : null;

      const res = await api.updateAdminAttendance(selectedRecord.id, {
        check_in: newIn,
        check_out: newOut,
        status: editStatus,
        notes: editNotes,
      });

      setEditFeedback({ success: true, message: res.message });
      await fetchRecords();
      setTimeout(() => {
        setIsEditModalOpen(false);
      }, 1200);
    } catch (err: any) {
      setEditFeedback({ success: false, message: err.message || 'Failed to update record.' });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">Attendance Management</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Monitor, inspect, and adjust biometric attendance logs across all company employees and interns
          </p>
        </div>

        <button
          onClick={fetchRecords}
          className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors self-start sm:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh Data
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search Input */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search name, code, dept..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B1F3A]/20 focus:border-[#0B1F3A]"
            />
          </div>

          {/* Department Filter */}
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

          {/* Role Filter */}
          <div>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B1F3A]/20 focus:border-[#0B1F3A] bg-white text-slate-700"
            >
              <option value="all">All Roles</option>
              <option value="employee">Employees Only</option>
              <option value="intern">Interns Only</option>
              <option value="admin">Administrators</option>
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B1F3A]/20 focus:border-[#0B1F3A] bg-white text-slate-700"
            >
              <option value="all">All Statuses</option>
              <option value="present">Present</option>
              <option value="late">Late Arrival</option>
              <option value="half_day">Half Day</option>
              <option value="incomplete">Incomplete</option>
            </select>
          </div>

          {/* Date Picker */}
          <div>
            <input
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B1F3A]/20 focus:border-[#0B1F3A] bg-white text-slate-700"
            />
          </div>
        </div>

        {filterDate && (
          <div className="flex items-center gap-2 pt-1 text-xs text-slate-500">
            <span>Filtered by Date: {filterDate}</span>
            <button
              onClick={() => setFilterDate('')}
              className="text-xs text-rose-600 hover:underline font-medium"
            >
              Clear date
            </button>
          </div>
        )}
      </div>

      {/* Attendance Records Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
            Attendance Log Entries
          </span>
          <span className="text-xs font-mono text-slate-400 tabular-nums">
            Showing {records.length} of {totalCount} records
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/70 border-b border-slate-200 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4">Name / ID</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Department</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Check In</th>
                <th className="py-3 px-4">Check Out</th>
                <th className="py-3 px-4 text-right">Hours</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {isLoading ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400">
                    Loading attendance database...
                  </td>
                </tr>
              ) : records.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400">
                    No attendance records found matching filters.
                  </td>
                </tr>
              ) : (
                records.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-semibold text-slate-900 whitespace-nowrap">
                      {r.user_name}
                      <span className="block text-[10px] font-mono text-slate-400 font-normal">
                        {r.employee_code}
                      </span>
                    </td>
                    <td className="py-3 px-4 capitalize text-slate-600 whitespace-nowrap">
                      {r.role}
                    </td>
                    <td className="py-3 px-4 text-slate-600 whitespace-nowrap">
                      {r.department_name}
                    </td>
                    <td className="py-3 px-4 font-mono tabular-nums text-slate-700 whitespace-nowrap">
                      {r.work_date}
                    </td>
                    <td className="py-3 px-4 font-mono tabular-nums text-slate-600 whitespace-nowrap">
                      {new Date(r.check_in).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="py-3 px-4 font-mono tabular-nums text-slate-600 whitespace-nowrap">
                      {r.check_out ? (
                        new Date(r.check_out).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                      ) : (
                        <span className="text-blue-600 font-sans font-medium">Active</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums font-semibold text-slate-900 whitespace-nowrap">
                      {(r.total_minutes / 60).toFixed(1)} hrs
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <StatusBadge status={r.status} />
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <button
                        onClick={() => handleOpenEdit(r)}
                        className="inline-flex items-center gap-1 text-[11px] font-medium text-[#0B1F3A] hover:underline"
                      >
                        <Edit className="w-3 h-3" /> Edit
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Manual Attendance Adjustment Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Admin Attendance Adjustment"
        subtitle={`Adjust timestamp or status for ${selectedRecord?.user_name} (${selectedRecord?.work_date})`}
      >
        <form onSubmit={handleSaveAdjustment} className="space-y-4">
          {editFeedback.message && (
            <div
              className={`p-3 text-xs rounded-lg flex items-start gap-2 ${
                editFeedback.success
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-rose-50 text-rose-800 border border-rose-200'
              }`}
            >
              {editFeedback.success ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              )}
              <span>{editFeedback.message}</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Check In Time</label>
              <input
                type="time"
                required
                value={editCheckIn}
                onChange={(e) => setEditCheckIn(e.target.value)}
                className="w-full px-3 py-2 text-xs font-mono border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B1F3A]/20 focus:border-[#0B1F3A]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Check Out Time</label>
              <input
                type="time"
                value={editCheckOut}
                onChange={(e) => setEditCheckOut(e.target.value)}
                className="w-full px-3 py-2 text-xs font-mono border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B1F3A]/20 focus:border-[#0B1F3A]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Official Attendance Status</label>
            <select
              value={editStatus}
              onChange={(e) => setEditStatus(e.target.value as any)}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B1F3A]/20 focus:border-[#0B1F3A] bg-white text-slate-800"
            >
              <option value="present">Present (Full Day)</option>
              <option value="late">Late Arrival</option>
              <option value="half_day">Half Day Shift</option>
              <option value="incomplete">Incomplete Session</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Administrator Audit Note</label>
            <textarea
              rows={2}
              value={editNotes}
              onChange={(e) => setEditNotes(e.target.value)}
              placeholder="Reason for manual adjustment (e.g. system clock synchronization, executive override)..."
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B1F3A]/20 focus:border-[#0B1F3A]"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsEditModalOpen(false)}
              className="px-3.5 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isUpdating}
              className="px-4 py-2 text-xs font-semibold text-white bg-[#0B1F3A] hover:bg-[#142C4E] rounded-lg transition-colors disabled:opacity-50"
            >
              {isUpdating ? 'Saving...' : 'Save Adjustment'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
