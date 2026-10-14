import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api';
import { Shield, ArrowRight, CheckCircle2, Lock, Mail, AlertCircle, Building2 } from 'lucide-react';
import { Modal } from '../components/Modal';

export const LoginView: React.FC = () => {
  const { login, quickDemoLogin } = useAuth();
  const [email, setEmail] = useState('admin@buildrex.com');
  const [password, setPassword] = useState('Buildrex@2026');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Forgot password modal state
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotStatus, setForgotStatus] = useState<{ success?: boolean; message?: string }>({});
  const [isForgotLoading, setIsForgotLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage('');
    try {
      await login(email, password);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to authenticate. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail) return;
    setIsForgotLoading(true);
    setForgotStatus({});
    try {
      const res = await api.forgotPassword(forgotEmail);
      setForgotStatus({ success: true, message: res.message });
    } catch (err: any) {
      setForgotStatus({ success: false, message: err.message });
    } finally {
      setIsForgotLoading(false);
    }
  };

  return (
    <div className="min-w-full min-h-screen bg-[#F8FAFC] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Brand Lockup */}
        <div className="flex justify-center items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#0B1F3A] flex items-center justify-center text-white font-black text-lg tracking-wider shadow-md">
            BX
          </div>
          <span className="text-2xl font-bold tracking-tight text-slate-900">
            BUILDREX
          </span>
        </div>
        <h2 className="mt-4 text-center text-xl font-semibold tracking-tight text-slate-800">
          Smart Attendance & Work Management
        </h2>
        <p className="mt-1 text-center text-xs text-slate-500">
          Enterprise portal for interns, employees, and operations management
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-sm border border-slate-200 rounded-2xl sm:px-10">
          {errorMessage && (
            <div className="mb-5 flex items-center gap-2 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Work Email Address
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@buildrex.com"
                  className="w-full px-3.5 py-2.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B1F3A]/20 focus:border-[#0B1F3A] text-slate-900 placeholder:text-slate-400"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-700">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => setIsForgotModalOpen(true)}
                  className="text-[11px] text-slate-500 hover:text-[#0B1F3A] font-medium"
                >
                  Forgot password?
                </button>
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full px-3.5 py-2.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B1F3A]/20 focus:border-[#0B1F3A] text-slate-900 placeholder:text-slate-400"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center items-center gap-2 py-2.5 px-4 text-xs font-semibold rounded-lg text-white bg-[#0B1F3A] hover:bg-[#142C4E] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#0B1F3A] transition-colors disabled:opacity-50 shadow-xs"
            >
              {isLoading ? 'Verifying Credentials...' : 'Sign In to Workspace'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Demo Accounts Selection */}
          <div className="mt-6 pt-6 border-t border-slate-100">
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider text-center mb-3">
              One-Click Demo Access
            </p>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => {
                  setEmail('admin@buildrex.com');
                  setPassword('Buildrex@2026');
                  quickDemoLogin('admin');
                }}
                className="flex flex-col items-center justify-center p-2 rounded-lg border border-slate-200 hover:border-[#0B1F3A] hover:bg-slate-50 transition-colors text-center"
              >
                <span className="text-xs font-semibold text-slate-900">Admin</span>
                <span className="text-[10px] text-slate-400">Alex Vance</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setEmail('sarah.chen@buildrex.com');
                  setPassword('Buildrex@2026');
                  quickDemoLogin('employee');
                }}
                className="flex flex-col items-center justify-center p-2 rounded-lg border border-slate-200 hover:border-[#0B1F3A] hover:bg-slate-50 transition-colors text-center"
              >
                <span className="text-xs font-semibold text-slate-900">Employee</span>
                <span className="text-[10px] text-slate-400">Sarah Chen</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setEmail('intern.dev@buildrex.com');
                  setPassword('Buildrex@2026');
                  quickDemoLogin('intern');
                }}
                className="flex flex-col items-center justify-center p-2 rounded-lg border border-slate-200 hover:border-[#0B1F3A] hover:bg-slate-50 transition-colors text-center"
              >
                <span className="text-xs font-semibold text-slate-900">Intern</span>
                <span className="text-[10px] text-slate-400">Devin Patel</span>
              </button>
            </div>
            <p className="mt-3 text-center text-[10px] text-slate-400">
              Demo accounts password: <span className="font-mono text-slate-600">Buildrex@2026</span>
            </p>
          </div>
        </div>

        <div className="mt-6 text-center text-xs text-slate-400">
          BUILDREX Multi-Vertical Innovation Operations · v1.0.0
        </div>
      </div>

      {/* Forgot Password Modal */}
      <Modal
        isOpen={isForgotModalOpen}
        onClose={() => setIsForgotModalOpen(false)}
        title="Reset Account Password"
        subtitle="Enter your corporate BUILDREX email address to receive reset instructions"
      >
        <form onSubmit={handleForgotPassword} className="space-y-4">
          {forgotStatus.message && (
            <div
              className={`p-3 text-xs rounded-lg flex items-start gap-2 ${
                forgotStatus.success
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-rose-50 text-rose-800 border border-rose-200'
              }`}
            >
              {forgotStatus.success ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              )}
              <span>{forgotStatus.message}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Registered Work Email
            </label>
            <input
              type="email"
              required
              value={forgotEmail}
              onChange={(e) => setForgotEmail(e.target.value)}
              placeholder="e.g. employee@buildrex.com"
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B1F3A]/20 focus:border-[#0B1F3A]"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsForgotModalOpen(false)}
              className="px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isForgotLoading}
              className="px-4 py-2 text-xs font-semibold text-white bg-[#0B1F3A] hover:bg-[#142C4E] rounded-lg transition-colors disabled:opacity-50"
            >
              {isForgotLoading ? 'Sending...' : 'Send Reset Link'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
