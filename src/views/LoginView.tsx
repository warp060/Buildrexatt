import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api';
import { ArrowRight, AlertCircle, Eye, EyeOff, CheckCircle2, ShieldCheck, Check } from 'lucide-react';
import { Modal } from '../components/Modal';

export const LoginView: React.FC = () => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [selectedDemo, setSelectedDemo] = useState<string | null>(null);

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

  const handleAutofill = (demoEmail: string, demoPass: string, demoKey: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setSelectedDemo(demoKey);
    setErrorMessage('');
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
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-[#080E1E] text-slate-100 font-sans antialiased selection:bg-slate-200 selection:text-slate-900">
      {/* LEFT HERO SECTION — Premium Dark Navy with Dot Matrix Texture */}
      <div
        className="relative lg:w-[58%] xl:w-[60%] flex flex-col justify-between p-8 sm:p-12 lg:p-16 overflow-hidden"
        style={{
          backgroundColor: '#080E1E',
          backgroundImage: 'radial-gradient(rgba(255, 255, 255, 0.12) 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      >
        {/* Subtle radial glow in background for high-end depth */}
        <div className="absolute top-1/4 -left-20 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Brand Top Header */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-slate-950 font-black text-base shadow-md">
            B
          </div>
          <span className="text-white font-bold tracking-wider text-base">
            BUILDREX
          </span>
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold tracking-widest text-slate-300 border border-slate-700/70 bg-slate-800/50 uppercase">
            ENTERPRISE
          </span>
        </div>

        {/* Center Main Content */}
        <div className="relative z-10 my-auto py-12 lg:py-16 max-w-2xl">
          {/* Live Workforce Status Pill */}
          <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-slate-900/90 border border-slate-700/60 shadow-inner mb-8">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span className="text-[11px] font-semibold tracking-wider text-slate-200 uppercase">
              LIVE WORKFORCE • 6 ACTIVE
            </span>
          </div>

          {/* Hero Headline */}
          <h1 className="text-4xl sm:text-5xl xl:text-6xl font-extrabold text-white tracking-tight leading-[1.08]">
            Attendance that
            <br />
            actually gets used.
          </h1>

          {/* Subtitle */}
          <p className="mt-6 text-sm sm:text-base text-slate-300/85 leading-relaxed max-w-xl font-normal">
            Premium white, navy &amp; black system inspired by Linear &amp; Stripe. Check-in in 1 tap, submit work updates, and give admins real-time visibility.
          </p>

          {/* Metrics / Key Stats Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 mt-12 sm:mt-14">
            {/* Metric 1 */}
            <div className="bg-[#0D182E]/80 backdrop-blur-md border border-slate-800/90 rounded-2xl p-4 transition-all hover:border-slate-700/90 shadow-sm">
              <span className="text-[10px] font-semibold text-slate-400 tracking-wider uppercase block">
                CHECK-IN TIME
              </span>
              <div className="text-2xl font-bold text-white mt-1.5 tracking-tight">
                &lt; 2 sec
              </div>
              <span className="text-[11px] text-slate-400/80 mt-0.5 block">
                Server timestamp
              </span>
            </div>

            {/* Metric 2 */}
            <div className="bg-[#0D182E]/80 backdrop-blur-md border border-slate-800/90 rounded-2xl p-4 transition-all hover:border-slate-700/90 shadow-sm">
              <span className="text-[10px] font-semibold text-slate-400 tracking-wider uppercase block">
                DUPLICATE GUARD
              </span>
              <div className="text-2xl font-bold text-white mt-1.5 tracking-tight">
                100%
              </div>
              <span className="text-[11px] text-slate-400/80 mt-0.5 block">
                DB constraints
              </span>
            </div>

            {/* Metric 3 */}
            <div className="bg-[#0D182E]/80 backdrop-blur-md border border-slate-800/90 rounded-2xl p-4 transition-all hover:border-slate-700/90 shadow-sm">
              <span className="text-[10px] font-semibold text-slate-400 tracking-wider uppercase block">
                UPTIME
              </span>
              <div className="text-2xl font-bold text-white mt-1.5 tracking-tight">
                99.9%
              </div>
              <span className="text-[11px] text-slate-400/80 mt-0.5 block">
                Audit logged
              </span>
            </div>
          </div>
        </div>

        {/* Footer info in Hero */}
        <div className="relative z-10 text-xs text-slate-500/90 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-slate-400" />
          <span>SOC-2 &amp; GDPR Compliant • Cloud Distributed TiDB &amp; SQLite Dual Mode</span>
        </div>
      </div>

      {/* RIGHT LOGIN FORM SECTION — Crisp Floating Card */}
      <div className="lg:w-[42%] xl:w-[40%] bg-[#F9FAFB] flex items-center justify-center p-6 sm:p-10 lg:p-12 relative min-h-screen">
        <div className="w-full max-w-[430px] bg-white rounded-3xl p-8 sm:p-10 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.07)] border border-slate-200/80">
          {/* Card Header */}
          <div>
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
              Sign in to BUILDREX
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              Workforce management for high-performing teams
            </p>
          </div>

          {/* Error Message banner */}
          {errorMessage && (
            <div className="mt-5 flex items-center gap-2.5 p-3.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl animate-shake">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Form */}
          <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
            {/* Work Email */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Work email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setSelectedDemo(null);
                }}
                placeholder="you@buildrex.com"
                className="w-full px-4 py-3 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 text-slate-900 placeholder:text-slate-400 transition-all shadow-xs"
              />
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-700">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => setIsForgotModalOpen(true)}
                  className="text-xs text-slate-500 hover:text-slate-900 font-medium transition-colors"
                >
                  Forgot?
                </button>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setSelectedDemo(null);
                  }}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 pr-11 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 text-slate-900 placeholder:text-slate-400 transition-all shadow-xs"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors p-1"
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 flex justify-center items-center gap-2 py-3.5 px-4 text-sm font-semibold rounded-xl text-white bg-[#0B1528] hover:bg-[#122242] active:scale-[0.99] focus:outline-none focus:ring-2 focus:ring-slate-900/20 transition-all disabled:opacity-50 shadow-md cursor-pointer"
            >
              <ArrowRight className="w-4 h-4" />
              <span>{isLoading ? 'Signing in...' : 'Continue to dashboard'}</span>
            </button>
          </form>

          {/* DEMO ACCOUNTS — CLICK TO AUTOFILL Section */}
          <div className="mt-8 pt-6 border-t border-slate-100">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-3">
              DEMO ACCOUNTS — CLICK TO AUTOFILL
            </span>

            <div className="space-y-2.5">
              {/* Demo 1: Admin — Sarah Chen */}
              <button
                type="button"
                onClick={() => handleAutofill('admin@buildrex.com', 'admin123', 'admin')}
                className={`w-full p-3.5 rounded-xl border text-left flex items-center justify-between transition-all group cursor-pointer ${
                  selectedDemo === 'admin'
                    ? 'border-slate-900 bg-slate-50/90 ring-1 ring-slate-900/10 shadow-xs'
                    : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/60'
                }`}
              >
                <div>
                  <div className="text-xs font-semibold text-slate-900 flex items-center gap-1.5">
                    <span>Admin — Sarah Chen</span>
                    {selectedDemo === 'admin' && (
                      <Check className="w-3.5 h-3.5 text-emerald-600 inline" />
                    )}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5 font-mono">
                    admin@buildrex.com / admin123
                  </div>
                </div>
                <span className="bg-[#0B1528] text-white text-[10px] font-bold px-2.5 py-1 rounded-md tracking-wider uppercase shadow-xs">
                  ADMIN
                </span>
              </button>

              {/* Demo 2: Employee — Alex Morgan */}
              <button
                type="button"
                onClick={() => handleAutofill('alex@buildrex.com', 'employee123', 'employee')}
                className={`w-full p-3.5 rounded-xl border text-left flex items-center justify-between transition-all group cursor-pointer ${
                  selectedDemo === 'employee'
                    ? 'border-slate-900 bg-slate-50/90 ring-1 ring-slate-900/10 shadow-xs'
                    : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/60'
                }`}
              >
                <div>
                  <div className="text-xs font-semibold text-slate-900 flex items-center gap-1.5">
                    <span>Employee — Alex Morgan</span>
                    {selectedDemo === 'employee' && (
                      <Check className="w-3.5 h-3.5 text-emerald-600 inline" />
                    )}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5 font-mono">
                    alex@buildrex.com / employee123
                  </div>
                </div>
                <span className="border border-slate-300 bg-white text-slate-700 text-[10px] font-bold px-2.5 py-1 rounded-md tracking-wider uppercase">
                  EMPLOYEE
                </span>
              </button>
            </div>
          </div>
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
              className="w-full px-3.5 py-2.5 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsForgotModalOpen(false)}
              className="px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isForgotLoading}
              className="px-4 py-2 text-xs font-semibold text-white bg-[#0B1528] hover:bg-[#122242] rounded-xl transition-colors disabled:opacity-50 cursor-pointer"
            >
              {isForgotLoading ? 'Sending...' : 'Send Reset Link'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
