import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  FiZap,
  FiLock,
  FiMail,
  FiEye,
  FiEyeOff,
  FiArrowRight,
  FiUsers,
  FiBriefcase,
  FiAlertCircle,
  FiCheckCircle,
} from 'react-icons/fi';

export default function LoginPage() {
  const [searchParams] = useSearchParams();
  const initialRole = searchParams.get('role') === 'dealer' ? 'dealer' : 'distributor';
  const [activeTab, setActiveTab] = useState(initialRole); // 'distributor' | 'dealer'
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { loginDistributor, loginDealer } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    const cleanId = identifier.trim();
    if (!cleanId || !password) {
      setError('Please provide your registered Email/Mobile and password.');
      return;
    }

    try {
      setLoading(true);
      setError('');

      if (activeTab === 'distributor') {
        try {
          await loginDistributor(cleanId, password);
          navigate('/distributor/portal/dashboard');
        } catch (distErr) {
          // If identifier has dealer or if distributor login fails, attempt dealer login seamlessly
          if (cleanId.toLowerCase().includes('dealer')) {
            try {
              await loginDealer(cleanId, password);
              setActiveTab('dealer');
              navigate('/dealer/portal/dashboard');
              return;
            } catch (dlrErr) {
              throw distErr;
            }
          }
          throw distErr;
        }
      } else {
        try {
          await loginDealer(cleanId, password);
          navigate('/dealer/portal/dashboard');
        } catch (dlrErr) {
          // If identifier has distributor or if dealer login fails, attempt distributor login seamlessly
          if (cleanId.toLowerCase().includes('distributor')) {
            try {
              await loginDistributor(cleanId, password);
              setActiveTab('distributor');
              navigate('/distributor/portal/dashboard');
              return;
            } catch (distErr) {
              throw dlrErr;
            }
          }
          throw dlrErr;
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (role) => {
    if (role === 'distributor') {
      setActiveTab('distributor');
      setIdentifier('distributor@solarkits.in');
      setPassword('demo1234');
      setError('');
    } else {
      setActiveTab('dealer');
      setIdentifier('dealer@solarkits.in');
      setPassword('demo1234');
      setError('');
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12 bg-[#FFFFFF]">
      <div className="w-full max-w-md space-y-8">
        
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <Link to="/" className="inline-flex items-center justify-center gap-2 group">
            <div className="w-10 h-10 rounded-xl bg-[#ECF8F1] border border-[#DDE8E1] flex items-center justify-center text-[#1F8F4E] shadow-xs">
              <FiZap className="w-5 h-5" />
            </div>
            <span className="font-heading font-black text-2xl text-[#17211B] tracking-tight">
              Solar<span className="text-[#1F8F4E]">Kits</span> <span className="text-xs font-bold px-2 py-0.5 rounded bg-[#ECF8F1] text-[#1F8F4E] border border-[#DDE8E1]">BOS</span>
            </span>
          </Link>
          <h1 className="font-heading font-bold text-2xl text-[#17211B] tracking-tight">Partner Portal Login</h1>
          <p className="text-xs text-[#5F6F65]">Access your wholesale dashboard, catalogue rates, and orders.</p>
        </div>

        {/* Tab Switcher */}
        <div className="bg-[#F7FAF8] p-1.5 rounded-2xl flex border border-[#DDE8E1] shadow-xs">
          <button
            type="button"
            onClick={() => { setActiveTab('distributor'); setError(''); }}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
              activeTab === 'distributor'
                ? 'bg-[#1F8F4E] text-white shadow-xs'
                : 'text-[#5F6F65] hover:text-[#17211B]'
            }`}
          >
            <FiUsers className="w-4 h-4" />
            Distributor Login
          </button>
          <button
            type="button"
            onClick={() => { setActiveTab('dealer'); setError(''); }}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
              activeTab === 'dealer'
                ? 'bg-[#17211B] text-white shadow-xs'
                : 'text-[#5F6F65] hover:text-[#17211B]'
            }`}
          >
            <FiBriefcase className="w-4 h-4" />
            Dealer Login
          </button>
        </div>

        {/* Login Card */}
        <div className="bg-[#FFFFFF] p-8 rounded-3xl border border-[#DDE8E1] shadow-xs space-y-6">
          
          {error && (
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
              <FiAlertCircle className="w-4 h-4 text-red-500 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-[#17211B] block mb-1.5">
                {activeTab === 'distributor' ? 'Distributor Email or Mobile' : 'Dealer Email or Mobile'} *
              </label>
              <div className="relative">
                <FiMail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#5F6F65] w-4 h-4" />
                <input
                  type="text"
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="e.g. partner@company.com or 9876543210"
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-[#F7FAF8] border border-[#DDE8E1] text-xs text-[#17211B] placeholder-[#5F6F65] focus:outline-none focus:border-[#1F8F4E] focus:bg-[#FFFFFF]"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-[#17211B]">Password *</label>
                <Link
                  to={`/auth/forgot-password?role=${activeTab}`}
                  className="text-[11px] font-semibold text-[#1F8F4E] hover:underline"
                >
                  Forgot Password?
                </Link>
              </div>
              <div className="relative">
                <FiLock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#5F6F65] w-4 h-4" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full pl-10 pr-10 py-3 rounded-xl bg-[#F7FAF8] border border-[#DDE8E1] text-xs text-[#17211B] placeholder-[#5F6F65] focus:outline-none focus:border-[#1F8F4E] focus:bg-[#FFFFFF]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#5F6F65] hover:text-[#17211B]"
                >
                  {showPassword ? <FiEyeOff className="w-4 h-4" /> : <FiEye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3.5 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2 transition-all shadow-xs ${
                activeTab === 'distributor'
                  ? 'bg-[#1F8F4E] hover:bg-[#18733E]'
                  : 'bg-[#17211B] hover:bg-[#1F8F4E]'
              } disabled:opacity-50`}
            >
              {loading ? 'Authenticating...' : `Sign In to ${activeTab === 'distributor' ? 'Distributor' : 'Dealer'} Portal`}
              <FiArrowRight className="w-4 h-4 text-[#F5B700]" />
            </button>
          </form>

          {/* Quick Demo Fill */}
          <div className="pt-2 border-t border-[#DDE8E1] space-y-2">
            <span className="text-[10px] uppercase font-bold text-[#5F6F65] tracking-wider block text-center">
              Testing & Demo Accounts (1-Click Fill)
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => fillDemo('distributor')}
                className="flex-1 py-2 px-2.5 rounded-lg text-[11px] font-bold bg-[#ECF8F1] text-[#1F8F4E] border border-[#DDE8E1] hover:bg-[#DDE8E1]/60 transition-colors"
              >
                Fill Demo Distributor
              </button>
              <button
                type="button"
                onClick={() => fillDemo('dealer')}
                className="flex-1 py-2 px-2.5 rounded-lg text-[11px] font-bold bg-[#F7FAF8] text-[#17211B] border border-[#DDE8E1] hover:bg-[#ECF8F1] transition-colors"
              >
                Fill Demo Dealer
              </button>
            </div>
          </div>
        </div>

        {/* Footer link */}
        <div className="text-center text-xs text-[#5F6F65] space-y-2">
          <p>
            Don't have an authorized distributor account?{' '}
            <Link to="/auth/register" className="text-[#1F8F4E] font-bold hover:underline">
              Apply for Dealership
            </Link>
          </p>
          <p>
            Want to check previous application status?{' '}
            <Link to="/application/status" className="text-[#17211B] font-semibold hover:underline">
              Track Application
            </Link>
          </p>
        </div>

      </div>
    </div>
  );
}
