import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { ThemeSelector } from '../components/ThemeSelector';
import { api } from '../api';
import { ArrowRight, AlertCircle, Eye, EyeOff, ShieldCheck, Check, Sparkles, UserCheck, Shield, Briefcase, GraduationCap, Users, Copy, Search, RefreshCw, KeyRound } from 'lucide-react';
import { Modal } from '../components/Modal';

export const LoginView: React.FC = () => {
  const { login } = useAuth();
  const { activeThemeOption } = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [selectedDemo, setSelectedDemo] = useState<string | null>(null);

  // Team Directory & Credentials modal state
  const [isCredentialsModalOpen, setIsCredentialsModalOpen] = useState(false);
  const [credentialsList, setCredentialsList] = useState<any[]>([]);
  const [isLoadingCreds, setIsLoadingCreds] = useState(false);
  const [searchCreds, setSearchCreds] = useState('');
  const [filterCredsRole, setFilterCredsRole] = useState('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);

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

  const handleInstantLogin = async (demoEmail: string, demoPass: string, demoKey: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setSelectedDemo(demoKey);
    setErrorMessage('');
    setIsLoading(true);
    try {
      await login(demoEmail, demoPass);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to authenticate demo account.');
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

  const handleOpenCredentialsModal = async () => {
    setIsCredentialsModalOpen(true);
    if (credentialsList.length === 0) {
      setIsLoadingCreds(true);
      try {
        const res = await api.getTeamCredentials();
        if (res.success) {
          setCredentialsList(res.credentials);
        }
      } catch (e) {
        console.warn('Failed to load team credentials:', e);
      } finally {
        setIsLoadingCreds(false);
      }
    }
  };

  const handleCopyPassword = (id: string, pw: string) => {
    navigator.clipboard.writeText(pw);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredCredentials = credentialsList.filter((c) => {
    const matchesSearch =
      !searchCreds ||
      c.name.toLowerCase().includes(searchCreds.toLowerCase()) ||
      c.email.toLowerCase().includes(searchCreds.toLowerCase()) ||
      c.position.toLowerCase().includes(searchCreds.toLowerCase()) ||
      c.department.toLowerCase().includes(searchCreds.toLowerCase());
    const matchesRole = filterCredsRole === 'all' || c.role === filterCredsRole;
    return matchesSearch && matchesRole;
  });

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

          <div className="flex items-center gap-2">
            <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider hidden sm:inline">Theme:</span>
            <ThemeSelector variant="compact" />
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
                onChange={(e) => {
                  setEmail(e.target.value);
                  setSelectedDemo(null);
                }}
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
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setSelectedDemo(null);
                  }}
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

          {/* ONE-CLICK DEMO ACCESS CARDS */}
          <div className="mt-6 pt-5 border-t border-slate-100">
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
                ONE-CLICK INSTANT DEMO LOGIN
              </span>
              <span className="text-[9px] text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full font-bold">
                1 Tap Access
              </span>
            </div>

            <div className="space-y-2">
              {/* Quick Login 1: CFO — Admin */}
              <button
                type="button"
                disabled={isLoading}
                onClick={() => handleInstantLogin('layeequeahmed602@gmail.com', 'Layeeque@Brx26', 'layeeque')}
                className={`w-full p-2.5 rounded-xl border text-left flex items-center justify-between transition-all group cursor-pointer ${
                  selectedDemo === 'layeeque'
                    ? 'border-indigo-600 bg-indigo-50/70 ring-1 ring-indigo-500 shadow-xs'
                    : 'border-slate-200/90 hover:border-slate-400 hover:bg-slate-50/80'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-7 h-7 rounded-lg bg-purple-600 text-white flex items-center justify-center shrink-0 shadow-2xs font-bold text-xs">
                    LA
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <span className="truncate">Layeeque Ahmed.S</span>
                      <span className="text-[9px] bg-purple-100 text-purple-800 font-extrabold px-1.5 py-0.2 rounded uppercase">
                        CFO / Admin
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono truncate">
                      layeequeahmed602@gmail.com
                    </div>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-indigo-600 group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5 shrink-0 ml-1">
                  Login &rarr;
                </span>
              </button>

              {/* Quick Login 2: CTO — Admin */}
              <button
                type="button"
                disabled={isLoading}
                onClick={() => handleInstantLogin('syedmdaakif007@gmail.com', 'Aakif@Brx26', 'aakif')}
                className={`w-full p-2.5 rounded-xl border text-left flex items-center justify-between transition-all group cursor-pointer ${
                  selectedDemo === 'aakif'
                    ? 'border-blue-600 bg-blue-50/70 ring-1 ring-blue-500 shadow-xs'
                    : 'border-slate-200/90 hover:border-slate-400 hover:bg-slate-50/80'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-2xs font-bold text-xs">
                    SA
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <span className="truncate">S Mohammed Aakif</span>
                      <span className="text-[9px] bg-blue-100 text-blue-800 font-extrabold px-1.5 py-0.2 rounded uppercase">
                        CTO / Admin
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono truncate">
                      syedmdaakif007@gmail.com
                    </div>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-blue-600 group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5 shrink-0 ml-1">
                  Login &rarr;
                </span>
              </button>

              {/* Quick Login 3: Full Stack Intern */}
              <button
                type="button"
                disabled={isLoading}
                onClick={() => handleInstantLogin('abbas6618532@gmail.com', 'Abbas@Brx26', 'abbas')}
                className={`w-full p-2.5 rounded-xl border text-left flex items-center justify-between transition-all group cursor-pointer ${
                  selectedDemo === 'abbas'
                    ? 'border-amber-600 bg-amber-50/70 ring-1 ring-amber-500 shadow-xs'
                    : 'border-slate-200/90 hover:border-slate-400 hover:bg-slate-50/80'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-7 h-7 rounded-lg bg-amber-600 text-white flex items-center justify-center shrink-0 shadow-2xs font-bold text-xs">
                    MA
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <span className="truncate">Mohammed Abbas R Y</span>
                      <span className="text-[9px] bg-amber-100 text-amber-800 font-extrabold px-1.5 py-0.2 rounded uppercase">
                        Full Stack Intern
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono truncate">
                      abbas6618532@gmail.com
                    </div>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-amber-600 group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5 shrink-0 ml-1">
                  Login &rarr;
                </span>
              </button>

              {/* View All 22 Team Members Credentials Button */}
              <button
                type="button"
                onClick={handleOpenCredentialsModal}
                className="w-full mt-3 py-2.5 px-3 rounded-xl border border-indigo-200 bg-indigo-50/70 hover:bg-indigo-100/80 text-indigo-900 text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-2xs group"
              >
                <Users className="w-4 h-4 text-indigo-600 group-hover:scale-110 transition-transform" />
                <span>View All 22 Team Member Passwords & Direct Access</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* TEAM CREDENTIALS DIRECTORY MODAL */}
      <Modal
        isOpen={isCredentialsModalOpen}
        onClose={() => setIsCredentialsModalOpen(false)}
        title="Official Team Directory & Generated Passwords"
        subtitle="Direct credentials extracted from BUILDREX Google Sheet. Each member has a unique, secure password."
      >
        <div className="space-y-4 max-h-[75vh] flex flex-col">
          {/* Search & Filter Bar */}
          <div className="flex flex-col sm:flex-row gap-2 shrink-0">
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by name, email, department, role..."
                value={searchCreds}
                onChange={(e) => setSearchCreds(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white"
              />
            </div>
            <select
              value={filterCredsRole}
              onChange={(e) => setFilterCredsRole(e.target.value)}
              className="px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white text-slate-700 shrink-0"
            >
              <option value="all">All Roles (23)</option>
              <option value="admin">Administrators / Leaders</option>
              <option value="employee">Employees</option>
              <option value="intern">Interns</option>
            </select>
          </div>

          {/* Member List */}
          <div className="overflow-y-auto space-y-2.5 pr-1 flex-1">
            {isLoadingCreds ? (
              <div className="py-12 text-center text-slate-400 text-xs flex flex-col items-center gap-2">
                <RefreshCw className="w-5 h-5 animate-spin text-indigo-600" />
                <span>Loading team credentials from database...</span>
              </div>
            ) : filteredCredentials.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs">
                No team members match your search criteria.
              </div>
            ) : (
              filteredCredentials.map((c) => (
                <div
                  key={c.id}
                  className="p-3 rounded-xl border border-slate-200/90 hover:border-indigo-300 bg-white hover:bg-slate-50/70 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs"
                >
                  <div className="flex items-start gap-2.5 min-w-0">
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 font-bold text-xs text-white ${
                        c.role === 'admin'
                          ? 'bg-purple-600'
                          : c.role === 'intern'
                          ? 'bg-amber-600'
                          : 'bg-blue-600'
                      }`}
                    >
                      {c.name
                        .split(' ')
                        .map((n: string) => n[0])
                        .slice(0, 2)
                        .join('')
                        .toUpperCase()}
                    </div>
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
                        <span className="text-[10px] text-slate-400 font-mono">
                          {c.employee_code}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-600 font-medium truncate mt-0.5">
                        {c.position} &bull; <span className="text-slate-400">{c.department}</span>
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono truncate">
                        {c.email} {c.phone && `\u2022 ${c.phone}`}
                      </div>
                    </div>
                  </div>

                  {/* Password & Login actions */}
                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                    <div className="flex items-center bg-slate-100 border border-slate-200 rounded-lg px-2 py-1 gap-1.5">
                      <KeyRound className="w-3 h-3 text-slate-500" />
                      <span className="text-[11px] font-mono font-bold text-slate-800 select-all">
                        {c.password}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopyPassword(c.id, c.password)}
                        className="text-slate-400 hover:text-indigo-600 transition-colors p-0.5 rounded cursor-pointer"
                        title="Copy password"
                      >
                        {copiedId === c.id ? (
                          <Check className="w-3 h-3 text-emerald-600" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </button>
                    </div>

                    <button
                      type="button"
                      disabled={isLoading}
                      onClick={() => {
                        setIsCredentialsModalOpen(false);
                        handleInstantLogin(c.email, c.password, c.id);
                      }}
                      className="px-2.5 py-1 text-[11px] font-bold text-white bg-brand-gradient hover:opacity-95 rounded-lg transition-all shadow-2xs cursor-pointer flex items-center gap-1"
                    >
                      <span>Sign In</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[11px] text-slate-500">
            <span>Official BUILDREX Google Sheet Sync Active</span>
            <button
              type="button"
              onClick={() => setIsCredentialsModalOpen(false)}
              className="px-3 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </Modal>

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
