import React, { useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api';
import { User, Lock, Phone, Mail, Building, Calendar, Shield, CheckCircle2, AlertCircle, Camera, Upload, Trash2, Loader2, Eye, EyeOff, KeyRound } from 'lucide-react';

import { useToast } from '../context/ToastContext';

export const ProfileView: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [profileMsg, setProfileMsg] = useState<{ success?: boolean; message?: string }>({});

  const compressAndCropImage = (file: File, maxDim = 320): Promise<string> => {
    return new Promise((resolve, reject) => {
      if (!file.type.startsWith('image/')) {
        return reject(new Error('Selected file must be an image (PNG, JPG, WEBP).'));
      }
      const reader = new FileReader();
      reader.onerror = () => reject(new Error('Failed to read image file'));
      reader.onload = (e) => {
        const img = new Image();
        img.onerror = () => reject(new Error('Invalid image file'));
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const size = Math.min(img.width, img.height);
          const offsetX = (img.width - size) / 2;
          const offsetY = (img.height - size) / 2;
          const targetDim = Math.min(size, maxDim);

          canvas.width = targetDim;
          canvas.height = targetDim;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            return reject(new Error('Canvas rendering context not available'));
          }
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, offsetX, offsetY, size, size, 0, 0, targetDim, targetDim);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.88);
          resolve(dataUrl);
        };
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    });
  };

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 12 * 1024 * 1024) {
      showToast('Image file too large. Please select an image under 12MB.', 'warning');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setIsUploadingAvatar(true);
    try {
      const dataUrl = await compressAndCropImage(file, 320);
      const res = await api.updateProfile({ avatar_url: dataUrl });
      await refreshUser();
      showToast(res.message || 'Profile picture updated successfully!', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to process and update profile picture.', 'error');
    } finally {
      setIsUploadingAvatar(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemoveAvatar = async () => {
    if (!user?.avatar_url) return;
    setIsUploadingAvatar(true);
    try {
      const res = await api.updateProfile({ avatar_url: null });
      await refreshUser();
      showToast('Profile picture removed successfully.', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to remove profile picture.', 'error');
    } finally {
      setIsUploadingAvatar(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Password Change
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [isChangingPass, setIsChangingPass] = useState(false);
  const [passMsg, setPassMsg] = useState<{ success?: boolean; message?: string }>({});

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setProfileMsg({ success: false, message: 'Name cannot be empty.' });
      showToast('Name cannot be empty', 'warning');
      return;
    }

    setIsUpdatingProfile(true);
    setProfileMsg({});
    try {
      const res = await api.updateProfile({ name: name.trim(), phone: phone.trim() });
      setProfileMsg({ success: true, message: res.message });
      showToast(res.message, 'success');
      await refreshUser();
    } catch (err: any) {
      setProfileMsg({ success: false, message: err.message || 'Failed to update profile.' });
      showToast(err.message || 'Failed to update profile', 'error');
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword) {
      setPassMsg({ success: false, message: 'Current password is required.' });
      showToast('Current password is required', 'warning');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPassMsg({ success: false, message: 'New password and confirmation do not match.' });
      showToast('Passwords do not match', 'warning');
      return;
    }
    if (newPassword.length < 6) {
      setPassMsg({ success: false, message: 'New password must be at least 6 characters.' });
      showToast('Password must be at least 6 characters', 'warning');
      return;
    }

    setIsChangingPass(true);
    setPassMsg({});
    try {
      const res = await api.changePassword({ current_password: currentPassword, new_password: newPassword });
      setPassMsg({ success: true, message: res.message });
      showToast(res.message, 'success');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      if ((res as any).token) {
        localStorage.setItem('buildrex_jwt', (res as any).token);
      }
      await refreshUser();
    } catch (err: any) {
      setPassMsg({ success: false, message: err.message || 'Failed to change password.' });
      showToast(err.message || 'Password update failed', 'error');
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
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
          <div className="flex items-center gap-4">
            <div className="relative group shrink-0">
              <div className="w-16 h-16 rounded-2xl bg-[#0B1F3A] text-white flex items-center justify-center font-bold text-xl shadow-sm overflow-hidden ring-2 ring-slate-100">
                {user?.avatar_url ? (
                  <img
                    src={user.avatar_url}
                    alt={user.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span>{user?.name?.slice(0, 2).toUpperCase() || 'BX'}</span>
                )}
              </div>

              {/* Hover camera action button */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploadingAvatar}
                className="absolute inset-0 rounded-2xl bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white text-[10px] font-semibold cursor-pointer backdrop-blur-[2px] disabled:opacity-50"
                title="Click to change profile picture"
              >
                {isUploadingAvatar ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <Camera className="w-5 h-5 mb-0.5" />
                    <span>Change</span>
                  </>
                )}
              </button>
            </div>

            <div>
              <h2 className="text-base font-bold text-slate-900">{user?.name}</h2>
              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mt-0.5">
                <span className="font-mono text-slate-700 font-semibold">{user?.employee_code}</span>
                <span>·</span>
                <span className="capitalize">{user?.role}</span>
                <span>·</span>
                <span>{user?.position}</span>
              </div>
            </div>
          </div>

          {/* Action buttons to upload / change / remove own image */}
          <div className="flex items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              className="hidden"
              onChange={handleImageSelect}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploadingAvatar}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200/80 rounded-lg transition-all cursor-pointer shadow-2xs active:scale-[0.98] disabled:opacity-50"
            >
              {isUploadingAvatar ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-500" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <Upload className="w-3.5 h-3.5 text-slate-500" />
                  <span>{user?.avatar_url ? 'Change Photo' : 'Upload Photo'}</span>
                </>
              )}
            </button>
            {user?.avatar_url && (
              <button
                type="button"
                onClick={handleRemoveAvatar}
                disabled={isUploadingAvatar}
                className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 border border-rose-200/60 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                title="Remove profile picture"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Remove</span>
              </button>
            )}
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
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div>
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Security Credentials
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Update your corporate account password to maintain system access integrity
            </p>
          </div>
          {user?.password_updated_at && (
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-[11px] font-semibold text-emerald-800">
              <KeyRound className="w-3.5 h-3.5 text-emerald-600" />
              <span>Custom Password Active</span>
            </div>
          )}
        </div>

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
            <div className="relative w-full sm:w-80">
              <input
                type={showCurrentPass ? 'text' : 'password'}
                required
                autoComplete="current-password"
                placeholder="Enter current password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                onInput={(e: any) => setCurrentPassword(e.target.value)}
                className="w-full pr-10 pl-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B1F3A]/20 focus:border-[#0B1F3A]"
              />
              <button
                type="button"
                onClick={() => setShowCurrentPass(!showCurrentPass)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer p-1"
                tabIndex={-1}
                title={showCurrentPass ? 'Hide password' : 'Show password'}
              >
                {showCurrentPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">New Password</label>
              <div className="relative">
                <input
                  type={showNewPass ? 'text' : 'password'}
                  required
                  minLength={6}
                  autoComplete="new-password"
                  placeholder="Minimum 6 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  onInput={(e: any) => setNewPassword(e.target.value)}
                  className="w-full pr-10 pl-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B1F3A]/20 focus:border-[#0B1F3A]"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPass(!showNewPass)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer p-1"
                  tabIndex={-1}
                  title={showNewPass ? 'Hide password' : 'Show password'}
                >
                  {showNewPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Confirm New Password</label>
              <div className="relative">
                <input
                  type={showConfirmPass ? 'text' : 'password'}
                  required
                  minLength={6}
                  autoComplete="new-password"
                  placeholder="Re-enter new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  onInput={(e: any) => setConfirmPassword(e.target.value)}
                  className="w-full pr-10 pl-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B1F3A]/20 focus:border-[#0B1F3A]"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPass(!showConfirmPass)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer p-1"
                  tabIndex={-1}
                  title={showConfirmPass ? 'Hide password' : 'Show password'}
                >
                  {showConfirmPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={isChangingPass}
              className="px-4 py-2 text-xs font-semibold text-white bg-[#0B1F3A] hover:bg-[#142C4E] rounded-lg transition-colors disabled:opacity-50 cursor-pointer shadow-2xs"
            >
              {isChangingPass ? 'Updating...' : 'Update Password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
