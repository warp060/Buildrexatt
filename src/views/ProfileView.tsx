import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api';
import { User, Lock, Phone, Mail, Building, Calendar, Shield, CheckCircle2, AlertCircle } from 'lucide-react';

export const ProfileView: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [profileMsg, setProfileMsg] = useState<{ success?: boolean; message?: string }>({});

  // Password Change
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPass, setIsChangingPass] = useState(false);
  const [passMsg, setPassMsg] = useState<{ success?: boolean; message?: string }>({});

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdatingProfile(true);
    setProfileMsg({});
    try {
      const res = await api.updateProfile({ name, phone });
      setProfileMsg({ success: true, message: res.message });
      await refreshUser();
    } catch (err: any) {
      setProfileMsg({ success: false, message: err.message || 'Failed to update profile.' });
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setPassMsg({ success: false, message: 'New password and confirmation do not match.' });
      return;
    }
    if (newPassword.length < 6) {
      setPassMsg({ success: false, message: 'New password must be at least 6 characters.' });
      return;
    }

    setIsChangingPass(true);
    setPassMsg({});
    try {
      const res = await api.changePassword({ current_password: currentPassword, new_password: newPassword });
      setPassMsg({ success: true, message: res.message });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setPassMsg({ success: false, message: err.message || 'Failed to change password.' });
    } finally {
      setIsChangingPass(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-2xs">
        <h1 className="text-xl font-bold tracking-tight text-slate-900">User Account & Security</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          View official organization assignments, edit contact details, and update your security credentials
        </p>
      </div>

      {/* Profile Overview Card */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 pb-6 border-b border-slate-100">
          <div className="w-14 h-14 rounded-2xl bg-[#0B1F3A] text-white flex items-center justify-center font-bold text-lg shadow-sm">
            {user?.name?.slice(0, 2).toUpperCase() || 'BX'}
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">{user?.name}</h2>
            <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
              <span className="font-mono text-slate-700 font-semibold">{user?.employee_code}</span>
              <span>·</span>
              <span className="capitalize">{user?.role}</span>
              <span>·</span>
              <span>{user?.position}</span>
            </div>
          </div>
        </div>

        {/* Static Company Metadata Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 py-5 border-b border-slate-100 text-xs">
          <div>
            <span className="text-slate-400 block mb-0.5">Work Email</span>
            <span className="font-medium text-slate-900">{user?.email}</span>
          </div>
          <div>
            <span className="text-slate-400 block mb-0.5">Department</span>
            <span className="font-medium text-slate-900">{user?.department_name || 'Unassigned'}</span>
          </div>
          <div>
            <span className="text-slate-400 block mb-0.5">Reporting Manager</span>
            <span className="font-medium text-slate-900">{user?.manager_name || 'Executive Leadership'}</span>
          </div>
          <div>
            <span className="text-slate-400 block mb-0.5">Joining Date</span>
            <span className="font-medium font-mono text-slate-900">{user?.joining_date}</span>
          </div>
          <div>
            <span className="text-slate-400 block mb-0.5">Account Status</span>
            <span className="font-semibold text-emerald-700 capitalize">{user?.status}</span>
          </div>
          <div>
            <span className="text-slate-400 block mb-0.5">Office Hub</span>
            <span className="font-medium text-slate-900">BUILDREX HQ (Pacific Time)</span>
          </div>
        </div>

        {/* Update Contact Details Form */}
        <form onSubmit={handleUpdateProfile} className="pt-5 space-y-4">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
            Edit Contact Details
          </h3>

          {profileMsg.message && (
            <div
              className={`p-3 text-xs rounded-lg flex items-center gap-2 ${
                profileMsg.success
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-rose-50 text-rose-800 border border-rose-200'
              }`}
            >
              {profileMsg.success ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              )}
              <span>{profileMsg.message}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Full Legal Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B1F3A]/20 focus:border-[#0B1F3A]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Contact Phone</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1 (555) 000-0000"
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B1F3A]/20 focus:border-[#0B1F3A]"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={isUpdatingProfile}
              className="px-4 py-2 text-xs font-semibold text-white bg-[#0B1F3A] hover:bg-[#142C4E] rounded-lg transition-colors disabled:opacity-50"
            >
              {isUpdatingProfile ? 'Saving...' : 'Save Profile Changes'}
            </button>
          </div>
        </form>
      </div>

      {/* Security & Password Change */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-6">
        <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-1">
          Security Credentials
        </h3>
        <p className="text-xs text-slate-500 mb-4">
          Update your corporate account password to maintain system access integrity
        </p>

        {passMsg.message && (
          <div
            className={`mb-4 p-3 text-xs rounded-lg flex items-center gap-2 ${
              passMsg.success
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                : 'bg-rose-50 text-rose-800 border border-rose-200'
            }`}
          >
            {passMsg.success ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            )}
            <span>{passMsg.message}</span>
          </div>
        )}

        <form onSubmit={handleChangePassword} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Current Password</label>
            <input
              type="password"
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full sm:w-80 px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B1F3A]/20 focus:border-[#0B1F3A]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">New Password</label>
              <input
                type="password"
                required
                minLength={6}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B1F3A]/20 focus:border-[#0B1F3A]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Confirm New Password</label>
              <input
                type="password"
                required
                minLength={6}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B1F3A]/20 focus:border-[#0B1F3A]"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={isChangingPass}
              className="px-4 py-2 text-xs font-semibold text-white bg-[#0B1F3A] hover:bg-[#142C4E] rounded-lg transition-colors disabled:opacity-50"
            >
              {isChangingPass ? 'Updating...' : 'Update Password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
