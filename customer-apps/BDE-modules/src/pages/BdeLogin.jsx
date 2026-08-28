import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBdeAuth } from '../context/BdeAuthContext';
import {
  SunMedium,
  Lock,
  Mail,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  ShieldCheck,
  HelpCircle,
  X,
  Sparkles,
  UserCheck,
} from 'lucide-react';

export default function BdeLogin() {
  const { login } = useBdeAuth();
  const navigate = useNavigate();

  // Pre-filled with verified Demo BDE credentials as requested
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [forgotModalOpen, setForgotModalOpen] = useState(false);

  const DEMO_ACCOUNTS = [
    {
      label: 'Bloch Navaz',
      identifier: 'rahul.bde@solarkits.com',
      password: 'Bde@Test123445678',
    }
  ];

  const handleFillDemo = (acc) => {
    setIdentifier(acc.identifier);
    setPassword(acc.password);
    setError(null);
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await login(identifier.trim(), password, rememberMe);
      navigate('/');
    } catch (err) {
      console.error('Login error', err);
      setError(
        err.response?.data?.message ||
        err.message ||
        'Login failed. Please check your credentials or contact administrator.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/40 to-slate-100 flex flex-col justify-center items-center p-4 relative overflow-hidden text-slate-900 font-sans">
      {/* Background Decorative Accents */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-amber-400/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Login Card */}
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl p-7 sm:p-8 shadow-xl space-y-6 relative z-10">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#0575B8] to-blue-500 text-white mx-auto flex items-center justify-center shadow-lg shadow-blue-500/20">
            <SunMedium className="w-8 h-8 text-amber-300" />
          </div>
          <div className="pt-1">
            <h1 className="text-2xl font-black tracking-tight text-slate-900">SOLARKITS</h1>
            <p className="text-[11px] font-black text-[#F49222] tracking-widest uppercase mt-0.5">
              Business Development Portal
            </p>
          </div>
          <p className="text-xs text-slate-500">
            Sign in with your Email, Mobile number, or BDE Employee ID
          </p>
        </div>

        {/* Demo Credentials Quick-Select Pill Bar */}
        <div className="p-3 bg-blue-50/80 border border-blue-100 rounded-2xl space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-blue-900 uppercase tracking-wider flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-[#F49222]" />
              Auto-filled Demo Credentials
            </span>
            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
              Ready to Login
            </span>
          </div>

          <div className="flex flex-wrap gap-1.5 pt-0.5">
            {DEMO_ACCOUNTS.map((acc, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleFillDemo(acc)}
                className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition-all ${identifier === acc.identifier
                  ? 'bg-[#0575B8] text-white shadow-xs'
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
                  }`}
              >
                {acc.label}
              </button>
            ))}
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <span className="leading-relaxed font-semibold">{error}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="space-y-1.5">
            <label className="font-bold text-slate-700 uppercase tracking-wider block text-[11px]">
              Email / Mobile / BDE ID *
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input
                type="text"
                required
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="e.g. vikram.bde@solarkits.com or 9876543210"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs font-semibold placeholder-slate-400 focus:outline-none focus:border-[#0575B8] focus:bg-white transition"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="font-bold text-slate-700 uppercase tracking-wider block text-[11px]">
              Password *
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your account password"
                className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs font-semibold placeholder-slate-400 focus:outline-none focus:border-[#0575B8] focus:bg-white transition"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Remember Me & Forgot Password */}
          <div className="flex items-center justify-between text-xs pt-1">
            <label className="flex items-center gap-2 cursor-pointer text-slate-600 select-none">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="rounded border-slate-300 text-[#0575B8] focus:ring-0 w-4 h-4"
              />
              <span className="font-medium text-slate-700">Remember Me</span>
            </label>
            <button
              type="button"
              onClick={() => setForgotModalOpen(true)}
              className="text-[#0575B8] hover:underline font-bold"
            >
              Forgot Password?
            </button>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-[#0575B8] to-blue-600 hover:from-blue-700 hover:to-blue-800 text-white font-bold rounded-xl text-xs transition shadow-md shadow-blue-500/20 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
          >
            {loading ? 'Authenticating...' : 'Sign In to BDE Dashboard →'}
          </button>
        </form>

        {/* Security Note */}
        <div className="pt-2 border-t border-slate-100 flex items-center justify-center gap-1.5 text-[11px] text-slate-500 font-medium">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>Restricted to Verified & Active Solarkits BDEs only</span>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {forgotModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-md p-6 shadow-2xl space-y-4 text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2 text-amber-600 font-bold text-sm">
                <HelpCircle className="w-4 h-4" />
                <span>Forgot BDE Password?</span>
              </div>
              <button
                onClick={() => setForgotModalOpen(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-slate-600 leading-relaxed">
              For security compliance, password resets for field Business Development Executives are managed by your regional Solarkits Administrator.
            </p>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setForgotModalOpen(false)}
                className="px-4 py-2 bg-slate-900 text-white font-bold rounded-xl text-xs"
              >
                Understood
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
