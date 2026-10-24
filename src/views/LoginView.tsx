import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api';
import loginBg from '../assets/login-bg.jpg';
import {
  ArrowRight,
  AlertCircle,
  Eye,
  EyeOff,
  ShieldCheck,
  Check,
  Building2,
  Users,
  CheckCircle2,
  Clock,
  Sparkles,
  Layers,
  Lock,
  Mail,
  Home,
  BarChart3,
  Calendar,
  Settings,
  LayoutDashboard,
  LogOut,
} from 'lucide-react';
import { Modal } from '../components/Modal';

export const LoginView: React.FC = () => {
  const { login } = useAuth();
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
    <div className="min-h-screen w-full bg-[#FAF9F5] text-slate-800 font-sans antialiased relative flex items-center justify-center p-4 sm:p-6 lg:p-10 selection:bg-emerald-600 selection:text-white">
      {/* Subtle fine architectural grid pattern on outer background */}
      <div
        className="fixed inset-0 pointer-events-none opacity-[0.3]"
        style={{
          backgroundImage: 'radial-gradient(rgba(15, 81, 50, 0.12) 1px, transparent 1px)',
          backgroundSize: '28px 28px',
        }}
      />

      {/* Main Dual-Panel Container */}
      <div className="relative z-10 w-full max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-stretch my-auto">
        {/* LEFT SECTION — Clean Warm Alabaster Panel with SaaS Dashboard Preview */}
        <div className="lg:col-span-7 bg-[#F3EFE9] border border-[#E6E1D8] rounded-2xl p-5 sm:p-8 shadow-xs flex flex-col justify-center">
          {/* Brand Eyebrow on Mobile/Tablet */}
          <div className="flex items-center gap-2.5 mb-5 self-start lg:hidden">
            <div className="w-8 h-8 rounded-lg bg-[#0F5132] flex items-center justify-center text-white font-bold text-sm shadow-md">
              <Building2 className="w-4 h-4 text-emerald-200" />
            </div>
            <div>
              <span className="font-extrabold text-slate-900 tracking-tight text-base block leading-none">
                BUILDREX
              </span>
              <span className="text-[10px] font-semibold text-emerald-800 uppercase tracking-widest block mt-0.5">
                Smart Attendance &amp; Work Management
              </span>
            </div>
          </div>

          {/* Elevated White SaaS Dashboard Card with mini-sidebar strip */}
          <div className="w-full bg-white rounded-xl p-5 sm:p-6 shadow-[0_10px_35px_rgba(0,0,0,0.04)] border border-slate-200/80 flex flex-col sm:flex-row gap-5">
            {/* Left Mini Sidebar Strip (Deel/Mercury SaaS style) */}
            <div className="hidden sm:flex flex-col items-center justify-between py-1 px-2 border-r border-slate-100 pr-4">
              <div className="flex flex-col items-center gap-4">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#0F5132] to-[#0A3822] flex items-center justify-center text-white shadow-2xs">
                  <Building2 className="w-4 h-4 text-emerald-300" />
                </div>
                <div className="flex flex-col gap-3 text-slate-400 mt-2">
                  <button type="button" className="p-1.5 rounded-md bg-emerald-50 text-[#0F5132] transition-colors" title="Overview">
                    <Home className="w-4 h-4" />
                  </button>
                  <button type="button" className="p-1.5 rounded-md hover:bg-slate-50 hover:text-slate-700 transition-colors" title="Attendance">
                    <Clock className="w-4 h-4" />
                  </button>
                  <button type="button" className="p-1.5 rounded-md hover:bg-slate-50 hover:text-slate-700 transition-colors" title="Analytics">
                    <BarChart3 className="w-4 h-4" />
                  </button>
                  <button type="button" className="p-1.5 rounded-md hover:bg-slate-50 hover:text-slate-700 transition-colors" title="Team">
                    <Users className="w-4 h-4" />
                  </button>
                  <button type="button" className="p-1.5 rounded-md hover:bg-slate-50 hover:text-slate-700 transition-colors" title="Schedule">
                    <Calendar className="w-4 h-4" />
                  </button>
                  <button type="button" className="p-1.5 rounded-md hover:bg-slate-50 hover:text-slate-700 transition-colors" title="Settings">
                    <Settings className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Bottom mini user avatar */}
              <div className="w-7 h-7 rounded-full bg-emerald-800 text-white font-bold text-[10px] flex items-center justify-center ring-2 ring-emerald-100">
                SC
              </div>
            </div>

            {/* Dashboard Content Body */}
            <div className="flex-1 flex flex-col justify-between">
              {/* Dashboard Top Header */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="sm:hidden w-8 h-8 rounded-lg bg-[#0F5132] flex items-center justify-center text-white shadow-xs">
                    <Building2 className="w-4 h-4 text-emerald-200" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 leading-none">
                      BUILDREX — Today&apos;s Summary
                    </h3>
                    <p className="text-[10px] text-slate-400 font-medium mt-1">
                      Live attendance &amp; task intelligence
                    </p>
                  </div>
                </div>

                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200/80 text-emerald-800 text-[10px] font-semibold">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600" />
                  </span>
                  <span>Dashboard</span>
                </div>
              </div>

              {/* Metric Row: Circular Attendance Ring + Today's Summary */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3.5 mt-4">
                {/* Circular Gauge Card */}
                <div className="sm:col-span-5 bg-[#FAF9F6] border border-slate-200/80 rounded-xl p-3.5 flex flex-col items-center justify-center relative">
                  <div className="w-full flex items-center justify-between mb-1">
                    <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">
                      Team Attendance
                    </span>
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-100/90 text-emerald-800">
                      Target 80%+
                    </span>
                  </div>

                  {/* SVG Radial Progress Ring */}
                  <div className="relative w-32 h-32 flex items-center justify-center my-1">
                    <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
                      <circle
                        cx="60"
                        cy="60"
                        r="48"
                        className="text-slate-200"
                        strokeWidth="10"
                        stroke="currentColor"
                        fill="transparent"
                      />
                      <circle
                        cx="60"
                        cy="60"
                        r="48"
                        className="text-[#0F5132] transition-all duration-1000 ease-out"
                        strokeWidth="10"
                        strokeDasharray={2 * Math.PI * 48}
                        strokeDashoffset={2 * Math.PI * 48 * (1 - 0.84)}
                        strokeLinecap="round"
                        stroke="currentColor"
                        fill="transparent"
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                      <span className="text-xl font-black text-slate-900 tracking-tight leading-none">
                        84%
                      </span>
                      <span className="text-[10px] font-semibold text-emerald-800 mt-0.5">
                        Check-in
                      </span>
                      <span className="text-[9px] text-slate-400 font-mono mt-0.5">
                        38/45 present
                      </span>
                    </div>
                  </div>
                </div>

                {/* Today's Work Summary Cards + Active Team */}
                <div className="sm:col-span-7 flex flex-col justify-between gap-2.5">
                  <div className="bg-slate-50/90 border border-slate-200/80 rounded-xl p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-slate-700">
                        Today&apos;s Work Summary
                      </span>
                      <span className="text-[9px] font-medium text-slate-400">
                        Updated 4m ago
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      <div className="bg-white p-2.5 rounded-lg border border-slate-200/80 shadow-2xs">
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">
                          ACTIVE PROJECTS
                        </span>
                        <div className="text-lg font-extrabold text-slate-900 mt-0.5">
                          18
                        </div>
                        <span className="text-[9px] font-medium text-emerald-700 flex items-center gap-1 mt-0.5">
                          <CheckCircle2 className="w-2.5 h-2.5" /> All on schedule
                        </span>
                      </div>

                      <div className="bg-white p-2.5 rounded-lg border border-slate-200/80 shadow-2xs">
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">
                          TASKS COMPLETED
                        </span>
                        <div className="text-lg font-extrabold text-[#0F5132] mt-0.5">
                          145
                        </div>
                        <span className="text-[9px] font-medium text-slate-500 mt-0.5 block">
                          across 6 teams
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Active Team Check-in Avatars */}
                  <div className="bg-white border border-slate-200/80 rounded-xl p-2.5 shadow-2xs flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold text-slate-800 block leading-tight">
                        Active Team Check-in
                      </span>
                      <span className="text-[9px] text-slate-400 block">
                        Real-time presence
                      </span>
                    </div>

                    <div className="flex items-center -space-x-1.5">
                      <div
                        className="relative w-7 h-7 rounded-full border-2 border-white bg-emerald-700 text-white font-bold text-[9px] flex items-center justify-center shadow-2xs"
                        title="Olivia (Design Lead) - Online"
                      >
                        OL
                        <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-emerald-400 border-2 border-white" />
                      </div>
                      <div
                        className="relative w-7 h-7 rounded-full border-2 border-white bg-slate-800 text-white font-bold text-[9px] flex items-center justify-center shadow-2xs"
                        title="Daniel (Site Ops) - Online"
                      >
                        DA
                        <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-emerald-400 border-2 border-white" />
                      </div>
                      <div
                        className="relative w-7 h-7 rounded-full border-2 border-white bg-teal-700 text-white font-bold text-[9px] flex items-center justify-center shadow-2xs"
                        title="Mark (Engineering) - Online"
                      >
                        MA
                        <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-emerald-400 border-2 border-white" />
                      </div>
                      <div
                        className="relative w-7 h-7 rounded-full border-2 border-white bg-[#0F5132] text-white font-bold text-[9px] flex items-center justify-center shadow-2xs"
                        title="Sarah (QA Lead) - Online"
                      >
                        SC
                        <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-emerald-400 border-2 border-white" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Weekly Attendance Curve Preview */}
              <div className="mt-3.5 pt-3 border-t border-slate-100">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-bold text-slate-700">
                    Weekly Attendance
                  </span>
                  <span className="inline-flex items-center gap-1 text-[9px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                    <Clock className="w-2.5 h-2.5 text-emerald-700" />
                    10:14 AM
                  </span>
                </div>

                {/* Attendance SVG Wave Line Chart */}
                <div className="w-full h-16 relative">
                  <svg className="w-full h-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 400 70">
                    <defs>
                      <linearGradient id="emeraldWaveGradPreview" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#0F5132" stopOpacity="0.2" />
                        <stop offset="100%" stopColor="#0F5132" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>

                    <path
                      d="M 0 55 Q 60 52, 100 35 T 200 48 T 280 20 T 350 42 T 400 38 L 400 70 L 0 70 Z"
                      fill="url(#emeraldWaveGradPreview)"
                    />
                    <path
                      d="M 0 55 Q 60 52, 100 35 T 200 48 T 280 20 T 350 42 T 400 38"
                      fill="none"
                      stroke="#0F5132"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                    />
                    <circle cx="280" cy="20" r="4" fill="#0F5132" stroke="#FFFFFF" strokeWidth="2" />
                  </svg>

                  <div className="flex items-center justify-between text-[9px] font-medium text-slate-400 mt-1 px-1">
                    <span>Mon</span>
                    <span>Tue</span>
                    <span>Wed</span>
                    <span className="text-emerald-900 font-bold">Thu</span>
                    <span>Fri</span>
                    <span>Sat</span>
                    <span>Sun</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT SECTION — Sign-In Form Container with Modern Office Background Image */}
        <div
          className="lg:col-span-5 rounded-2xl overflow-hidden relative shadow-xl border border-white/60 bg-cover bg-center flex items-center justify-center p-5 sm:p-8 min-h-[560px] lg:min-h-[600px]"
          style={{ backgroundImage: `url(${loginBg})` }}
        >
          {/* Subtle soft office photo depth diffusion */}
          <div className="absolute inset-0 bg-slate-900/10 backdrop-blur-[1px] pointer-events-none" />

          {/* Frosted Glass Sign-In Card Floating On Office Background */}
          <div className="relative z-10 w-full max-w-[410px] bg-white/35 backdrop-blur-2xl border border-white/60 rounded-xl p-6 sm:p-8 shadow-[0_25px_60px_rgba(0,0,0,0.22),inset_0_1px_2px_rgba(255,255,255,0.7)] ring-1 ring-black/5">
            {/* Header with BUILDREX logo */}
            <div>
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#0F5132] flex items-center justify-center text-white font-bold text-sm shadow-md ring-1 ring-emerald-900/20">
                  <Building2 className="w-4 h-4 text-emerald-200" />
                </div>
                <div>
                  <h2 className="text-base font-black tracking-tight text-slate-900 leading-none">
                    BUILDREX
                  </h2>
                  <span className="text-[9px] font-semibold text-emerald-800 tracking-wider uppercase block mt-0.5">
                    Smart Attendance &amp; Work Management
                  </span>
                </div>
              </div>

              <div className="mt-4">
                <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                  Welcome Back
                </h1>
                <p className="text-xs text-slate-600 mt-0.5 font-medium">
                  Sign in to access your workspace and daily reporting hub
                </p>
              </div>
            </div>

            {/* Error Message banner */}
            {errorMessage && (
              <div className="mt-3.5 flex items-center gap-2 p-2.5 bg-rose-50/90 backdrop-blur-md border border-rose-200 text-rose-800 text-xs rounded-lg shadow-2xs animate-shake">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Login Form */}
            <form className="mt-4 space-y-3.5" onSubmit={handleSubmit}>
              {/* Enterprise Email */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Enterprise Email
                </label>
                <div className="relative">
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="sarah.chen@buildrex.com"
                    className="w-full pl-9 pr-3.5 py-2.5 text-xs border border-white/70 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700/25 focus:border-[#0F5132] text-slate-900 placeholder:text-slate-500 bg-white/45 hover:bg-white/60 focus:bg-white/80 backdrop-blur-md transition-all shadow-xs"
                  />
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              {/* Password */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-800">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsForgotModalOpen(true)}
                    className="text-[11px] font-semibold text-emerald-900 hover:text-emerald-950 transition-colors cursor-pointer"
                  >
                    Forgot Password?
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full pl-9 pr-10 py-2.5 text-xs border border-white/70 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700/25 focus:border-[#0F5132] text-slate-900 placeholder:text-slate-500 bg-white/45 hover:bg-white/60 focus:bg-white/80 backdrop-blur-md transition-all shadow-xs"
                  />
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700 transition-colors cursor-pointer p-0.5"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Sign In CTA Button (Deep Forest Emerald with glass sheen) */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-2.5 flex justify-center items-center gap-2 py-2.5 px-4 text-xs font-bold rounded-lg text-white bg-[#0F5132]/95 hover:bg-[#0B3D25] active:scale-[0.98] transition-all disabled:opacity-50 shadow-lg shadow-emerald-950/25 cursor-pointer backdrop-blur-xs"
              >
                <span>{isLoading ? 'Authenticating...' : 'Sign In'}</span>
                <ArrowRight className="w-4 h-4 text-emerald-200" />
              </button>
            </form>

            {/* Enterprise Security Footnote */}
            <div className="mt-5 pt-4 border-t border-slate-900/10 flex items-center justify-between text-[11px] text-slate-600 font-medium">
              <span className="flex items-center gap-1.5 font-medium text-slate-700">
                <ShieldCheck className="w-3.5 h-3.5 text-[#0F5132]" />
                <span>Enterprise 256-bit Encrypted</span>
              </span>
              <span className="font-semibold text-slate-500">
                SOC-2 &bull; ISO 27001
              </span>
            </div>
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
              className={`p-3 text-xs rounded-lg flex items-center gap-2 ${
                forgotStatus.success
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-rose-50 text-rose-800 border border-rose-200'
              }`}
            >
              {forgotStatus.success ? (
                <Check className="w-4 h-4 shrink-0 text-emerald-600" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
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
              className="w-full px-3.5 py-2.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700/20 focus:border-[#0F5132]"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsForgotModalOpen(false)}
              className="px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isForgotLoading}
              className="px-4 py-2 text-xs font-bold text-white bg-[#0F5132] hover:bg-[#0B3D25] rounded-lg transition-all disabled:opacity-50 cursor-pointer shadow-sm"
            >
              {isForgotLoading ? 'Sending...' : 'Send Reset Link'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

