import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { api } from '../api';
import { ArrowRight, AlertCircle, Eye, EyeOff, ShieldCheck, Check, Sparkles, UserCheck, Shield, Briefcase, GraduationCap } from 'lucide-react';
import { Modal } from '../components/Modal';

export const LoginView: React.FC = () => {
  const { login } = useAuth();
  const { activeThemeOption } = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Forgot password modal state
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotStatus, setForgotStatus] = useState<{ success?: boolean; message?: string }>({});
  const [isForgotLoading, setIsForgotLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMessage('Please enter both your work email and password.');
      return;
    }
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
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-[#080E1E] text-slate-100 font-sans antialiased selection:bg-brand-accent selection:text-white">
      {/* LEFT HERO SECTION — Luxury Executive Dark Mesh */}
      <div
        className="relative lg:w-[56%] xl:w-[58%] flex flex-col justify-between p-6 sm:p-10 lg:p-14 overflow-hidden"
        style={{
          backgroundColor: '#080E1E',
          backgroundImage: 'radial-gradient(rgba(255, 255, 255, 0.1) 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      >
        {/* Dynamic theme glow in background */}
        <div
          className="absolute top-1/4 -left-20 w-96 h-96 rounded-full blur-3xl pointer-events-none opacity-25 transition-all duration-700"
          style={{ backgroundColor: activeThemeOption.accentColor }}
        />
        <div
          className="absolute bottom-10 right-10 w-96 h-96 rounded-full blur-3xl pointer-events-none opacity-20 transition-all duration-700"
          style={{ backgroundColor: activeThemeOption.primaryColor }}
        />

        {/* Brand Top Header */}
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-brand-gradient flex items-center justify-center text-white font-black text-base shadow-lg ring-1 ring-white/20">
              BX
            </div>
            <div>
              <span className="text-white font-extrabold tracking-wider text-base block leading-none">
                BUILDREX
              </span>
              <span className="text-[10px] font-semibold text-slate-400 tracking-widest uppercase block mt-0.5">
                SMART WORKSPACE OS
              </span>
            </div>
          </div>
        </div>

        {/* Center Main Content */}
        <div className="relative z-10 my-auto py-8 sm:py-12 max-w-2xl">
          {/* Live Workforce Status Pill */}
          <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-slate-900/90 border border-slate-700/60 shadow-inner mb-6 sm:mb-8">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span className="text-[11px] font-bold tracking-wider text-slate-200 uppercase">
              BIOMETRIC CORE ONLINE • 6 MEMBERS ACTIVE
            </span>
          </div>

          {/* Hero Headline */}
          <h1 className="text-3xl sm:text-5xl xl:text-6xl font-extrabold text-white tracking-tight leading-[1.1]">
            Next-Gen Workforce
            <br />
            <span
              className="text-transparent bg-clip-text transition-all duration-500"
              style={{ backgroundImage: `linear-gradient(135deg, #FFFFFF 20%, ${activeThemeOption.accentColor} 100%)` }}
            >
              &amp; Attendance Suite.
            </span>
          </h1>

          {/* Subtitle */}
          <p className="mt-4 sm:mt-6 text-xs sm:text-base text-slate-300/85 leading-relaxed max-w-xl font-normal">
            Precision 1-tap biometric check-ins, structured daily work summaries, automated leave reviews, and executive analytics designed for high-performing engineering &amp; operations teams.
          </p>

          {/* Metrics Row */}
          <div className="grid grid-cols-3 gap-2.5 sm:gap-4 mt-8 sm:mt-12">
            <div className="bg-[#0D182E]/80 backdrop-blur-md border border-slate-800/90 rounded-2xl p-3 sm:p-4 hover:border-slate-700 transition-all shadow-sm">
              <span className="text-[9px] sm:text-[10px] font-bold text-slate-400 tracking-wider uppercase block">
                CHECK-IN
              </span>
              <div className="text-lg sm:text-2xl font-black text-white mt-1 tracking-tight font-mono">
                &lt; 1.5s
              </div>
              <span className="text-[10px] text-emerald-400/90 mt-0.5 block font-medium">
                Biometric synced
              </span>
            </div>

            <div className="bg-[#0D182E]/80 backdrop-blur-md border border-slate-800/90 rounded-2xl p-3 sm:p-4 hover:border-slate-700 transition-all shadow-sm">
              <span className="text-[9px] sm:text-[10px] font-bold text-slate-400 tracking-wider uppercase block">
                INTEGRITY
              </span>
              <div className="text-lg sm:text-2xl font-black text-white mt-1 tracking-tight font-mono">
                100%
              </div>
              <span className="text-[10px] text-brand-accent mt-0.5 block font-medium">
                ACID protected
              </span>
            </div>

            <div className="bg-[#0D182E]/80 backdrop-blur-md border border-slate-800/90 rounded-2xl p-3 sm:p-4 hover:border-slate-700 transition-all shadow-sm">
              <span className="text-[9px] sm:text-[10px] font-bold text-slate-400 tracking-wider uppercase block">
                AVAILABILITY
              </span>
              <div className="text-lg sm:text-2xl font-black text-white mt-1 tracking-tight font-mono">
                99.9%
              </div>
              <span className="text-[10px] text-cyan-400 mt-0.5 block font-medium">
                TiDB Cloud &amp; JSON
              </span>
            </div>
          </div>
        </div>

        {/* Footer info in Hero */}
        <div className="relative z-10 text-[11px] text-slate-500/90 flex items-center gap-2 pt-4">
          <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
          <span>SOC-2 &amp; GDPR Compliant • Cloud Distributed TiDB &amp; Local Fallback</span>
        </div>
      </div>

      {/* RIGHT LOGIN FORM SECTION — Crisp Elevated Card */}
      <div className="lg:w-[44%] xl:w-[42%] bg-[#F8FAFC] flex items-center justify-center p-4 sm:p-8 lg:p-12 relative min-h-[550px]">
        <div className="w-full max-w-[440px] bg-white rounded-3xl p-6 sm:p-9 shadow-xl border border-slate-200/90 my-4">
          {/* Card Header */}
          <div>
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                Sign In
              </h2>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                v2.4
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Access your workspace attendance and daily reporting hub
            </p>
          </div>

          {/* Error Message banner */}
          {errorMessage && (
            <div className="mt-4 flex items-center gap-2.5 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Form */}
          <form className="mt-5 space-y-3.5" onSubmit={handleSubmit}>
            {/* Work Email */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Work Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. admin@buildrex.com"
                className="w-full px-3.5 py-2.5 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 text-slate-900 placeholder:text-slate-400 bg-slate-50/50 hover:bg-white transition-colors"
              />
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-slate-700">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => setIsForgotModalOpen(true)}
                  className="text-[11px] font-semibold text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
                >
                  Forgot?
                </button>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full px-3.5 py-2.5 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 pr-10 text-slate-900 placeholder:text-slate-400 bg-slate-50/50 hover:bg-white transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 flex justify-center items-center gap-2 py-3 px-4 text-xs font-bold rounded-xl text-white bg-brand-gradient hover:opacity-95 active:scale-[0.98] transition-all disabled:opacity-50 shadow-md cursor-pointer"
            >
              <span>{isLoading ? 'Authenticating...' : 'Sign In to Workspace'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Security & Encryption Notice */}
          <div className="mt-6 pt-5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span className="flex items-center gap-1.5 font-medium text-slate-500">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Enterprise 256-bit Encrypted</span>
            </span>
            <span className="font-mono text-[10px] text-slate-400">
              BUILDREX OS
            </span>
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      <Modal
        isOpen={isForgotModalOpen}
        onClose={() => setIsForgotModalOpen(false)}
        title="Reset Account Password"
        subtitle="Enter your corporate BUILDREX email address to receive recovery instructions."
      >
        <form onSubmit={handleForgotPassword} className="space-y-4">
          {forgotStatus.message && (
            <div
              className={`p-3 text-xs rounded-xl flex items-center gap-2 ${
                forgotStatus.success
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-rose-50 text-rose-800 border border-rose-200'
              }`}
            >
              {forgotStatus.success ? (
                <Check className="w-4 h-4 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0" />
              )}
              <span>{forgotStatus.message}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Registered Corporate Email
            </label>
            <input
              type="email"
              required
              value={forgotEmail}
              onChange={(e) => setForgotEmail(e.target.value)}
              placeholder="e.g. employee@buildrex.com"
              className="w-full px-3.5 py-2.5 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsForgotModalOpen(false)}
              className="px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isForgotLoading}
              className="px-4 py-2 text-xs font-bold text-white bg-brand-gradient hover:opacity-95 rounded-xl transition-all disabled:opacity-50 cursor-pointer shadow-sm"
            >
              {isForgotLoading ? 'Sending...' : 'Send Reset Link'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
