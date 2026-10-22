import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../api';
import { User, Department, UserRole, UserStatus } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { Modal } from '../components/Modal';
import { Search, UserPlus, Edit2, Key, CheckCircle2, AlertCircle, Shield, GraduationCap, Briefcase, RefreshCw, Copy, Check, ExternalLink, KeyRound, CloudLightning } from 'lucide-react';

import { useToast } from '../context/ToastContext';

export const AdminUsersView: React.FC = () => {
  const { showToast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Google Sheet Sync & Credentials state
  const [isSyncingSheet, setIsSyncingSheet] = useState(false);
  const [isCredsModalOpen, setIsCredsModalOpen] = useState(false);
  const [teamCreds, setTeamCreds] = useState<any[]>([]);
  const [isLoadingCreds, setIsLoadingCreds] = useState(false);
  const [copiedCredId, setCopiedCredId] = useState<string | null>(null);
  const [searchCreds, setSearchCreds] = useState('');

  // Filters
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [deptFilter, setDeptFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Create / Edit User Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  // Form fields
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formCode, setFormCode] = useState('');
  const [formRole, setFormRole] = useState<UserRole>('employee');
  const [formDeptId, setFormDeptId] = useState('');
  const [formPosition, setFormPosition] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formJoiningDate, setFormJoiningDate] = useState('');
  const [formStatus, setFormStatus] = useState<UserStatus>('active');
  const [formFeedback, setFormFeedback] = useState<{ success?: boolean; message?: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset Password Modal
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [resetUser, setResetUser] = useState<User | null>(null);
  const [tempPassword, setTempPassword] = useState('Buildrex@2026');
  const [resetFeedback, setResetFeedback] = useState<{ success?: boolean; message?: string }>({});
  const [isResetting, setIsResetting] = useState(false);

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      const [usersRes, deptsRes] = await Promise.all([
        api.getAdminUsers({
          search: search || undefined,
          role: roleFilter !== 'all' ? roleFilter : undefined,
          department_id: deptFilter !== 'all' ? deptFilter : undefined,
          status: statusFilter !== 'all' ? statusFilter : undefined,
        }),
        api.getDepartments(),
      ]);

      if (usersRes.success) setUsers(usersRes.users);
      if (deptsRes.success) setDepartments(deptsRes.departments);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [search, roleFilter, deptFilter, statusFilter]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleOpenCreate = () => {
    setIsEditMode(false);
    setSelectedUserId(null);
    setFormName('');
    setFormEmail('');
    setFormCode('');
    setFormRole('intern');
    setFormDeptId(departments[0]?.id || '');
    setFormPosition('Innovation Intern');
    setFormPhone('');
    setFormJoiningDate(new Date().toISOString().split('T')[0]);
    setFormStatus('active');
    setFormFeedback({});
    setIsModalOpen(true);
  };

  const handleOpenEdit = (u: User) => {
    setIsEditMode(true);
    setSelectedUserId(u.id);
    setFormName(u.name);
    setFormEmail(u.email);
    setFormCode(u.employee_code);
    setFormRole(u.role);
    setFormDeptId(u.department_id || '');
    setFormPosition(u.position);
    setFormPhone(u.phone || '');
    setFormJoiningDate(u.joining_date);
    setFormStatus(u.status);
    setFormFeedback({});
    setIsModalOpen(true);
  };

  const handleOpenResetPass = (u: User) => {
    setResetUser(u);
    setTempPassword('Buildrex@2026');
    setResetFeedback({});
    setIsResetModalOpen(true);
  };

  const handleSubmitUser = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formName.trim() || !formPosition.trim()) {
      setFormFeedback({ success: false, message: 'Name and Position are required.' });
      showToast('Name and Position are required', 'warning');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!isEditMode && (!formEmail || !emailRegex.test(formEmail))) {
      setFormFeedback({ success: false, message: 'Please enter a valid work email address.' });
      showToast('Please enter a valid work email address', 'warning');
      return;
    }

    setIsSubmitting(true);
    setFormFeedback({});

    try {
      if (isEditMode && selectedUserId) {
        const res = await api.updateUser(selectedUserId, {
          name: formName.trim(),
          role: formRole,
          department_id: formDeptId || null,
          position: formPosition.trim(),
          phone: formPhone.trim(),
          status: formStatus,
          joining_date: formJoiningDate,
        });
        setFormFeedback({ success: true, message: res.message });
        showToast(res.message, 'success');
      } else {
        const res = await api.createUser({
          name: formName.trim(),
          email: formEmail.trim().toLowerCase(),
          employee_code: formCode.trim() || undefined,
          role: formRole,
          department_id: formDeptId || null,
          position: formPosition.trim(),
          phone: formPhone.trim(),
          joining_date: formJoiningDate,
        });
        setFormFeedback({ success: true, message: res.message });
        showToast(res.message, 'success');
      }

      await fetchUsers();
      setTimeout(() => {
        setIsModalOpen(false);
      }, 1200);
    } catch (err: any) {
      setFormFeedback({ success: false, message: err.message || 'Operation failed.' });
      showToast(err.message || 'Operation failed', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleExecuteResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetUser) return;

    if (!tempPassword || tempPassword.length < 6) {
      setResetFeedback({ success: false, message: 'Temporary password must be at least 6 characters.' });
      showToast('Password must be at least 6 characters', 'warning');
      return;
    }

    setIsResetting(true);
    setResetFeedback({});

    try {
      const res = await api.adminResetUserPassword(resetUser.id, tempPassword);
      setResetFeedback({ success: true, message: res.message });
      showToast(res.message, 'success');
      setTimeout(() => {
        setIsResetModalOpen(false);
      }, 1500);
    } catch (err: any) {
      setResetFeedback({ success: false, message: err.message || 'Failed to reset password.' });
      showToast(err.message || 'Failed to reset password', 'error');
    } finally {
      setIsResetting(false);
    }
  };

  const handleSyncGoogleSheet = async () => {
    setIsSyncingSheet(true);
    try {
      const res = await api.syncGoogleSheet();
      if (res.success) {
        showToast(res.message, 'success');
        await fetchUsers();
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to sync Google Sheet', 'error');
    } finally {
      setIsSyncingSheet(false);
    }
  };

  const handleOpenCreds = async () => {
    setIsCredsModalOpen(true);
    setIsLoadingCreds(true);
    try {
      const res = await api.getTeamCredentials();
      if (res.success) {
        setTeamCreds(res.credentials);
      }
    } catch (err: any) {
      showToast('Failed to load team credentials', 'error');
    } finally {
      setIsLoadingCreds(false);
    }
  };

  const handleCopyCredPassword = (id: string, pw: string) => {
    navigator.clipboard.writeText(pw);
    setCopiedCredId(id);
    showToast('Password copied to clipboard', 'info');
    setTimeout(() => setCopiedCredId(null), 2000);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-slate-900">BUILDREX Team Directory</h1>
            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Live Sheet Connected
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            22 organization members synchronized from official BUILDREX Google Sheet with individual security credentials
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap shrink-0">
          <button
            type="button"
            onClick={handleSyncGoogleSheet}
            disabled={isSyncingSheet}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-all shadow-2xs shrink-0 disabled:opacity-50 cursor-pointer"
            title="Fetch real-time records directly from official Google Sheet"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncingSheet ? 'animate-spin text-emerald-600' : 'text-emerald-700'}`} />
            <span>{isSyncingSheet ? 'Syncing...' : 'Sync Live Sheet'}</span>
          </button>

          <button
            type="button"
            onClick={handleOpenCreds}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-indigo-800 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg transition-all shadow-2xs shrink-0 cursor-pointer"
          >
            <KeyRound className="w-3.5 h-3.5 text-indigo-600" />
            <span>Team Passwords</span>
          </button>

          <button
            type="button"
            onClick={handleOpenCreate}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-white bg-[#0B1F3A] hover:bg-[#142C4E] rounded-lg transition-colors shadow-2xs shrink-0 cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>Add Member</span>
          </button>
        </div>
      </div>

      {/* Filters and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search name, code, email, title..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B1F3A]/20 focus:border-[#0B1F3A]"
          />
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
            <option value="intern">Interns</option>
            <option value="employee">Employees</option>
            <option value="admin">Administrators</option>
          </select>
        </div>

        <div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B1F3A]/20 focus:border-[#0B1F3A] bg-white text-slate-700"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active Accounts</option>
            <option value="inactive">Deactivated Accounts</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
            Organization Directory
          </span>
          <span className="text-xs font-mono text-slate-400 tabular-nums">
            {users.length} members found
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/70 border-b border-slate-200 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4">Member Name</th>
                <th className="py-3 px-4">Employee ID</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Department & Position</th>
                <th className="py-3 px-4">Joining Date</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">Loading directory...</td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">No members found matching filters.</td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-semibold text-slate-900 whitespace-nowrap">
                      {u.name}
                      <span className="block text-[11px] text-slate-400 font-normal">{u.email}</span>
                    </td>
                    <td className="py-3 px-4 font-mono font-semibold text-slate-700 whitespace-nowrap">
                      {u.employee_code}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="capitalize font-medium text-slate-700">{u.role}</span>
                    </td>
                    <td className="py-3 px-4 text-slate-600 whitespace-nowrap">
                      <p className="font-medium text-slate-900">{u.department_name}</p>
                      <p className="text-[11px] text-slate-400">{u.position}</p>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-600 whitespace-nowrap">
                      {u.joining_date}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <StatusBadge status={u.status} type="user" />
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleOpenResetPass(u)}
                          title="Reset Password"
                          className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-md transition-colors"
                        >
                          <Key className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleOpenEdit(u)}
                          className="px-2.5 py-1 text-[11px] font-semibold text-[#0B1F3A] hover:bg-slate-100 rounded-md transition-colors"
                        >
                          Edit
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create / Edit User Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={isEditMode ? `Edit Member: ${formName}` : 'Add New Team Member'}
        subtitle="Configure profile assignments, department vertical, and system role"
      >
        <form onSubmit={handleSubmitUser} className="space-y-4">
          {formFeedback.message && (
            <div
              className={`p-3 text-xs rounded-lg flex items-start gap-2 ${
                formFeedback.success
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-rose-50 text-rose-800 border border-rose-200'
              }`}
            >
              {formFeedback.success ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              )}
              <span>{formFeedback.message}</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Legal Full Name</label>
              <input
                type="text"
                required
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="e.g. Jordan Smith"
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B1F3A]/20 focus:border-[#0B1F3A]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Corporate Email</label>
              <input
                type="email"
                required
                disabled={isEditMode}
                value={formEmail}
                onChange={(e) => setFormEmail(e.target.value)}
                placeholder="e.g. jordan.smith@buildrex.com"
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B1F3A]/20 focus:border-[#0B1F3A] disabled:bg-slate-50"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Employee Code</label>
              <input
                type="text"
                value={formCode}
                disabled={isEditMode}
                onChange={(e) => setFormCode(e.target.value)}
                placeholder="Leave blank for auto ID"
                className="w-full px-3 py-2 text-xs font-mono border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B1F3A]/20 focus:border-[#0B1F3A] disabled:bg-slate-50"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">System Role</label>
              <select
                value={formRole}
                onChange={(e) => setFormRole(e.target.value as UserRole)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B1F3A]/20 focus:border-[#0B1F3A] bg-white text-slate-800"
              >
                <option value="intern">Intern</option>
                <option value="employee">Employee</option>
                <option value="admin">Administrator</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Department</label>
              <select
                value={formDeptId}
                onChange={(e) => setFormDeptId(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B1F3A]/20 focus:border-[#0B1F3A] bg-white text-slate-800"
              >
                <option value="">Unassigned</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Position / Job Title</label>
              <input
                type="text"
                value={formPosition}
                onChange={(e) => setFormPosition(e.target.value)}
                placeholder="e.g. Frontend Intern"
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B1F3A]/20 focus:border-[#0B1F3A]"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Joining Date</label>
              <input
                type="date"
                value={formJoiningDate}
                onChange={(e) => setFormJoiningDate(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B1F3A]/20 focus:border-[#0B1F3A]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Account Status</label>
              <select
                value={formStatus}
                onChange={(e) => setFormStatus(e.target.value as UserStatus)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B1F3A]/20 focus:border-[#0B1F3A] bg-white text-slate-800"
              >
                <option value="active">Active (Access Granted)</option>
                <option value="inactive">Inactive (Deactivated)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number</label>
            <input
              type="text"
              value={formPhone}
              onChange={(e) => setFormPhone(e.target.value)}
              placeholder="+1 (415) 000-0000"
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B1F3A]/20 focus:border-[#0B1F3A]"
            />
          </div>

          {!isEditMode && (
            <p className="text-[11px] text-slate-500 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
              Note: The default password for newly provisioned accounts is <span className="font-mono font-semibold">Buildrex@2026</span>. The user will be required to change it on login.
            </p>
          )}

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-3.5 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-semibold text-white bg-[#0B1F3A] hover:bg-[#142C4E] rounded-lg transition-colors disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : isEditMode ? 'Save Changes' : 'Create Member'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Reset Password Modal */}
      <Modal
        isOpen={isResetModalOpen}
        onClose={() => setIsResetModalOpen(false)}
        title="Administrative Password Reset"
        subtitle={`Reset credentials for ${resetUser?.name} (${resetUser?.email})`}
      >
        <form onSubmit={handleExecuteResetPassword} className="space-y-4">
          {resetFeedback.message && (
            <div
              className={`p-3 text-xs rounded-lg flex items-start gap-2 ${
                resetFeedback.success
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-rose-50 text-rose-800 border border-rose-200'
              }`}
            >
              {resetFeedback.success ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              )}
              <span>{resetFeedback.message}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              New Temporary Password
            </label>
            <input
              type="text"
              required
              minLength={6}
              value={tempPassword}
              onChange={(e) => setTempPassword(e.target.value)}
              className="w-full px-3 py-2 text-xs font-mono border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B1F3A]/20 focus:border-[#0B1F3A]"
            />
            <span className="text-[11px] text-slate-400 mt-1 block">
              Default safe temporary password: <code className="font-mono text-slate-700">Buildrex@2026</code>
            </span>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsResetModalOpen(false)}
              className="px-3.5 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isResetting}
              className="px-4 py-2 text-xs font-semibold text-white bg-[#0B1F3A] hover:bg-[#142C4E] rounded-lg transition-colors disabled:opacity-50"
            >
              {isResetting ? 'Resetting...' : 'Confirm Password Reset'}
            </button>
          </div>
        </form>
      </Modal>

      {/* TEAM CREDENTIALS DIRECTORY MODAL */}
      <Modal
        isOpen={isCredsModalOpen}
        onClose={() => setIsCredsModalOpen(false)}
        title="Official Team Passwords & Access Credentials"
        subtitle="Individual credentials for all 22 members synchronized from the BUILDREX Google Sheet"
      >
        <div className="space-y-4 max-h-[75vh] flex flex-col">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search member, email, or department..."
                value={searchCreds}
                onChange={(e) => setSearchCreds(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B1F3A]/20 focus:border-[#0B1F3A] bg-white"
              />
            </div>
            <button
              type="button"
              onClick={handleSyncGoogleSheet}
              disabled={isSyncingSheet}
              className="px-3 py-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncingSheet ? 'animate-spin' : ''}`} />
              <span>Sync</span>
            </button>
          </div>

          <div className="overflow-y-auto space-y-2 pr-1 flex-1">
            {isLoadingCreds ? (
              <div className="py-12 text-center text-slate-400 text-xs flex flex-col items-center gap-2">
                <RefreshCw className="w-5 h-5 animate-spin text-indigo-600" />
                <span>Loading team passwords...</span>
              </div>
            ) : teamCreds.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs">No team credentials found.</div>
            ) : (
              teamCreds
                .filter(
                  (c) =>
                    !searchCreds ||
                    c.name.toLowerCase().includes(searchCreds.toLowerCase()) ||
                    c.email.toLowerCase().includes(searchCreds.toLowerCase()) ||
                    c.department.toLowerCase().includes(searchCreds.toLowerCase()) ||
                    c.position.toLowerCase().includes(searchCreds.toLowerCase())
                )
                .map((c) => (
                  <div
                    key={c.id}
                    className="p-3 rounded-lg border border-slate-200 hover:border-slate-300 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold text-slate-900">{c.name}</span>
                        <span
                          className={`text-[9px] font-extrabold px-1.5 py-0.2 rounded uppercase ${
                            c.role === 'admin'
                              ? 'bg-purple-100 text-purple-800'
                              : c.role === 'intern'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {c.role}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">{c.employee_code}</span>
                      </div>
                      <div className="text-[11px] text-slate-600 truncate mt-0.5">
                        {c.position} &bull; <span className="text-slate-400">{c.department}</span>
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono truncate">
                        {c.email} {c.phone && `\u2022 ${c.phone}`}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                      <div className="flex items-center bg-slate-50 border border-slate-200 rounded px-2 py-1 gap-1.5">
                        <KeyRound className="w-3 h-3 text-slate-400" />
                        <span className="text-[11px] font-mono font-bold text-slate-800 select-all">
                          {c.password}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopyCredPassword(c.id, c.password)}
                          className="text-slate-400 hover:text-indigo-600 transition-colors p-0.5 cursor-pointer"
                          title="Copy password"
                        >
                          {copiedCredId === c.id ? (
                            <Check className="w-3 h-3 text-emerald-600" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                ))
            )}
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs text-slate-500">
            <span>{teamCreds.length} members loaded</span>
            <button
              type="button"
              onClick={() => setIsCredsModalOpen(false)}
              className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
