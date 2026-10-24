import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../api';
import { AttendanceRecord, WorkUpdate, Department } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { Download, Printer, Filter, Calendar, BarChart3, FileSpreadsheet } from 'lucide-react';
import { formatClockTime } from '../utils/time';

import { useToast } from '../context/ToastContext';

export const AdminReportsView: React.FC = () => {
  const { showToast } = useToast();
  const [reportType, setReportType] = useState<'attendance' | 'work_updates'>('attendance');
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 14);
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [roleFilter, setRoleFilter] = useState('all');
  const [deptFilter, setDeptFilter] = useState('all');
  const [departments, setDepartments] = useState<Department[]>([]);

  // Attendance Report State
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [attendanceSummary, setAttendanceSummary] = useState({
    total_sessions: 0,
    total_hours: 0,
    average_session_hours: 0,
    late_arrivals: 0,
    half_days: 0,
  });

  // Work Updates Report State
  const [workRecords, setWorkRecords] = useState<WorkUpdate[]>([]);
  const [workSummary, setWorkSummary] = useState({
    total_updates: 0,
    reviewed: 0,
    needs_revision: 0,
    pending_review: 0,
  });

  const [isLoading, setIsLoading] = useState(false);

  const fetchReports = useCallback(async () => {
    setIsLoading(true);
    try {
      const [deptsRes, attRes, wuRes] = await Promise.all([
        api.getDepartments(),
        api.getAttendanceReport({
          start_date: startDate || undefined,
          end_date: endDate || undefined,
          role: roleFilter !== 'all' ? roleFilter : undefined,
          department_id: deptFilter !== 'all' ? deptFilter : undefined,
        }),
        api.getWorkUpdatesReport({
          start_date: startDate || undefined,
          end_date: endDate || undefined,
          role: roleFilter !== 'all' ? roleFilter : undefined,
          department_id: deptFilter !== 'all' ? deptFilter : undefined,
        }),
      ]);

      if (deptsRes.success) setDepartments(deptsRes.departments);
      if (attRes.success) {
        setAttendanceRecords(attRes.records);
        setAttendanceSummary(attRes.summary);
      }
      if (wuRes.success) {
        setWorkRecords(wuRes.records);
        setWorkSummary(wuRes.summary);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [startDate, endDate, roleFilter, deptFilter]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  // Export to CSV with UTF-8 BOM for perfect Excel / Numbers compatibility
  const handleExportCSV = () => {
    let headers: string[] = [];
    let rows: string[][] = [];

    if (reportType === 'attendance') {
      headers = ['Employee Name', 'Code', 'Role', 'Department', 'Date', 'Check In', 'Check Out', 'Total Hours', 'Status', 'Notes'];
      rows = attendanceRecords.map((r) => [
        `"${(r.user_name || '').replace(/"/g, '""')}"`,
        `"${(r.employee_code || '').replace(/"/g, '""')}"`,
        `"${(r.role || '').replace(/"/g, '""')}"`,
        `"${(r.department_name || '').replace(/"/g, '""')}"`,
        `"${r.work_date}"`,
        `"${r.check_in}"`,
        `"${r.check_out || 'Active'}"`,
        `"${(r.total_minutes / 60).toFixed(2)}"`,
        `"${r.status}"`,
        `"${(r.notes || '').replace(/"/g, '""')}"`,
      ]);
    } else {
      headers = ['Member Name', 'Code', 'Role', 'Department', 'Date', 'Project Focus', 'Tasks Completed', 'Hours', 'Status', 'Reviewer Notes'];
      rows = workRecords.map((r) => [
        `"${(r.user_name || '').replace(/"/g, '""')}"`,
        `"${(r.employee_code || '').replace(/"/g, '""')}"`,
        `"${(r.role || '').replace(/"/g, '""')}"`,
        `"${(r.department_name || '').replace(/"/g, '""')}"`,
        `"${r.work_date}"`,
        `"${(r.project_details || '').replace(/"/g, '""')}"`,
        `"${(r.tasks_completed || '').replace(/"/g, '""')}"`,
        `"${r.hours_spent}"`,
        `"${r.status}"`,
        `"${(r.review_comment || '').replace(/"/g, '""')}"`,
      ]);
    }

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `BUILDREX_${reportType}_report_${startDate}_to_${endDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast(`Report downloaded: ${rows.length} records exported`, 'success');
  };

  const handlePrint = () => {
    window.print();
  };


  return (
    <div className="space-y-6">
      {/* Header with Export & Print CTAs */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">Reports & Analytics Engine</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Audit work performance, team attendance ratios, sprint outputs, and export verified CSV ledgers
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
          >
            <Printer className="w-3.5 h-3.5" />
            Print Report
          </button>
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-[#0B1F3A] hover:bg-[#142C4E] rounded-lg transition-colors shadow-2xs"
          >
            <Download className="w-3.5 h-3.5" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Filter and Date Criteria Strip */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-4">
          {/* Segmented Report Selector */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
            <button
              onClick={() => setReportType('attendance')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                reportType === 'attendance'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Attendance & Punctuality Ledger
            </button>
            <button
              onClick={() => setReportType('work_updates')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                reportType === 'work_updates'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Daily Work Updates & Output
            </button>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-2.5 py-1.5 border border-slate-200 rounded-lg bg-white"
            />
            <span className="text-slate-400">to</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-2.5 py-1.5 border border-slate-200 rounded-lg bg-white"
            />
            <select
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
              className="px-2.5 py-1.5 border border-slate-200 rounded-lg bg-white text-slate-700"
            >
              <option value="all">All Departments</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-2.5 py-1.5 border border-slate-200 rounded-lg bg-white text-slate-700"
            >
              <option value="all">All Roles</option>
              <option value="intern">Interns</option>
              <option value="employee">Employees</option>
            </select>
          </div>
        </div>
      </div>

      {/* Aggregate KPI Strip */}
      {reportType === 'attendance' ? (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Total Work Sessions</p>
            <p className="text-2xl font-bold font-mono tabular-nums text-slate-900 mt-1">
              {attendanceSummary.total_sessions}
            </p>
            <span className="text-[10px] text-slate-500 mt-0.5 block">Recorded in range</span>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Total Cumulative Hours</p>
            <p className="text-2xl font-bold font-mono tabular-nums text-slate-900 mt-1">
              {attendanceSummary.total_hours} <span className="text-xs font-normal text-slate-400">hrs</span>
            </p>
            <span className="text-[10px] text-slate-500 mt-0.5 block">Total logged production</span>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Average Shift Length</p>
            <p className="text-2xl font-bold font-mono tabular-nums text-slate-900 mt-1">
              {attendanceSummary.average_session_hours} <span className="text-xs font-normal text-slate-400">hrs</span>
            </p>
            <span className="text-[10px] text-slate-500 mt-0.5 block">Per attendance day</span>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Late Arrivals</p>
            <p className="text-2xl font-bold font-mono tabular-nums text-amber-700 mt-1">
              {attendanceSummary.late_arrivals}
            </p>
            <span className="text-[10px] text-slate-500 mt-0.5 block">Arrived past 9:15 AM</span>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Half Day Shifts</p>
            <p className="text-2xl font-bold font-mono tabular-nums text-blue-700 mt-1">
              {attendanceSummary.half_days}
            </p>
            <span className="text-[10px] text-slate-500 mt-0.5 block">Under 4 hours</span>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Total Reports</p>
            <p className="text-2xl font-bold font-mono tabular-nums text-slate-900 mt-1">
              {workSummary.total_updates}
            </p>
            <span className="text-[10px] text-slate-500 mt-0.5 block">Submitted work logs</span>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Reviewed / Approved</p>
            <p className="text-2xl font-bold font-mono tabular-nums text-emerald-700 mt-1">
              {workSummary.reviewed}
            </p>
            <span className="text-[10px] text-emerald-600 mt-0.5 block">Evaluated by supervisor</span>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Revisions Requested</p>
            <p className="text-2xl font-bold font-mono tabular-nums text-amber-700 mt-1">
              {workSummary.needs_revision}
            </p>
            <span className="text-[10px] text-amber-600 mt-0.5 block">Returned for clarity</span>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Pending Evaluation</p>
            <p className="text-2xl font-bold font-mono tabular-nums text-blue-700 mt-1">
              {workSummary.pending_review}
            </p>
            <span className="text-[10px] text-blue-600 mt-0.5 block">In review queue</span>
          </div>
        </div>
      )}

      {/* Report Records Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          {reportType === 'attendance' ? (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/70 border-b border-slate-200 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Name / ID</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Department</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Check In</th>
                  <th className="py-3 px-4">Check Out</th>
                  <th className="py-3 px-4 text-right">Total Hours</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {isLoading ? (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-slate-400">Loading ledger...</td>
                  </tr>
                ) : attendanceRecords.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-slate-400">No records in selected window.</td>
                  </tr>
                ) : (
                  attendanceRecords.map((r) => (
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
                      <td className="py-3 px-4 font-mono text-slate-600 whitespace-nowrap">
                        {formatClockTime(r.check_in)}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-600 whitespace-nowrap">
                        {r.check_out ? formatClockTime(r.check_out) : (
                          <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full text-xs font-bold inline-flex items-center gap-1 border border-emerald-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            Currently Working
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums font-semibold text-slate-900 whitespace-nowrap">
                        {!r.check_out ? (
                          <span className="text-emerald-700 font-bold">
                            {(r.total_minutes / 60).toFixed(1)} hrs (Live)
                          </span>
                        ) : (
                          `${(r.total_minutes / 60).toFixed(1)} hrs`
                        )}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <StatusBadge status={r.status} />
                      </td>
                      <td className="py-3 px-4 text-slate-500 max-w-xs truncate">
                        {r.notes || '—'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/70 border-b border-slate-200 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Member Name</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Department</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Project & Tasks</th>
                  <th className="py-3 px-4 text-center">Hours</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Supervisor Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {isLoading ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-400">Loading work ledger...</td>
                  </tr>
                ) : workRecords.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-400">No work updates in range.</td>
                  </tr>
                ) : (
                  workRecords.map((w) => (
                    <tr key={w.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4 font-semibold text-slate-900 whitespace-nowrap">
                        {w.user_name}
                        <span className="block text-[10px] font-mono text-slate-400 font-normal">
                          {w.employee_code}
                        </span>
                      </td>
                      <td className="py-3 px-4 capitalize text-slate-600 whitespace-nowrap">
                        {w.role}
                      </td>
                      <td className="py-3 px-4 text-slate-600 whitespace-nowrap">
                        {w.department_name}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-700 whitespace-nowrap">
                        {w.work_date}
                      </td>
                      <td className="py-3 px-4 max-w-sm">
                        <p className="font-medium text-slate-900 truncate">{w.project_details}</p>
                        <p className="text-[11px] text-slate-500 truncate mt-0.5">{w.tasks_completed}</p>
                      </td>
                      <td className="py-3 px-4 text-center font-mono font-semibold text-slate-900 whitespace-nowrap">
                        {w.hours_spent}h
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <StatusBadge status={w.status} type="work_update" />
                      </td>
                      <td className="py-3 px-4 text-slate-500 max-w-xs truncate">
                        {w.review_comment || '—'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};
