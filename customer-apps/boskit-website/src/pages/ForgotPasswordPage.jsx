import React, { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { FiMail, FiLock, FiArrowRight, FiCheckCircle, FiAlertCircle, FiKey } from 'react-icons/fi';
import api from '../services/api';

export default function ForgotPasswordPage() {
  const [searchParams] = useSearchParams();
  const role = searchParams.get('role') === 'dealer' ? 'dealer' : 'distributor';
  
  const [step, setStep] = useState(1); // 1 = identifier, 2 = otp, 3 = new password, 4 = success
  const [identifier, setIdentifier] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [devOtp, setDevOtp] = useState('');

  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (!identifier.trim()) return;

    try {
      setLoading(true);
      setError('');
      const endpoint = role === 'distributor'
        ? '/auth/distributor/forgot-password/send-otp'
        : '/auth/dealer/forgot-password/send-otp';

      const res = await api.post(endpoint, { identifier: identifier.trim() });
      if (res.data?.success) {
        if (res.data?.dev_otp) setDevOtp(res.data.dev_otp);
        setStep(2);
      } else {
        setError(res.data?.message || 'Failed to send recovery code.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Account not found with this identifier.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!otp.trim()) return;

    try {
      setLoading(true);
      setError('');
      const endpoint = role === 'distributor'
        ? '/auth/distributor/forgot-password/verify-otp'
        : '/auth/dealer/forgot-password/verify-otp';

      const res = await api.post(endpoint, { identifier: identifier.trim(), otp: otp.trim() });
      if (res.data?.success) {
        setResetToken(res.data.resetToken || '');
        setStep(3);
      } else {
        setError(res.data?.message || 'Invalid recovery code.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'OTP verification failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      const endpoint = role === 'distributor'
        ? '/auth/distributor/forgot-password/reset-password'
        : '/auth/dealer/forgot-password/reset-password';

      const res = await api.post(endpoint, { new_password: newPassword, resetToken });
      if (res.data?.success) {
        setStep(4);
      } else {
        setError(res.data?.message || 'Password update failed.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reset password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12 bg-[#FFFFFF]">
      <div className="w-full max-w-md space-y-6">
        
        <div className="text-center space-y-2">
          <h1 className="font-heading font-bold text-2xl text-[#0F172A] tracking-tight">
            Reset {role === 'distributor' ? 'Distributor' : 'Dealer'} Password
          </h1>
          <p className="text-xs text-[#475569]">
            Verify your account via 6-digit OTP to set a new password.
          </p>
        </div>

        <div className="bg-[#FFFFFF] p-8 rounded-3xl border border-[#E2E8F0] shadow-xs space-y-6">
          
          {error && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
              <FiAlertCircle className="w-4 h-4 text-red-500 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {step === 1 && (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-[#0F172A] block mb-1.5">Registered Email or Mobile *</label>
                <div className="relative">
                  <FiMail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#475569] w-4 h-4" />
                  <input
                    type="text"
                    required
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="e.g. partner@company.com or 9876543210"
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-xs text-[#0F172A] placeholder-[#475569] focus:outline-none focus:border-[#0575B8] focus:bg-[#FFFFFF]"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-xl text-xs font-bold bg-[#0575B8] hover:bg-[#045D93] text-white shadow-xs flex items-center justify-center gap-2 disabled:opacity-50 transition-all"
              >
                {loading ? 'Sending Code...' : 'Send Recovery OTP'} <FiArrowRight className="w-4 h-4 text-[#F49222]" />
              </button>
            </form>
          )}

          {step === 2 && (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div className="text-center space-y-1">
                <p className="text-xs text-[#475569]">Enter code sent to <strong className="text-[#0F172A]">{identifier}</strong></p>
                {devOtp && (
                  <p className="text-[11px] font-mono text-[#0575B8] bg-[#EFF8FF] p-1.5 rounded border border-[#E2E8F0]">
                    Test Mode OTP: <strong>{devOtp}</strong>
                  </p>
                )}
              </div>

              <input
                type="text"
                maxLength={6}
                required
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="123456"
                className="w-full text-center tracking-[8px] font-mono font-bold text-lg py-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-[#0F172A] focus:outline-none focus:border-[#0575B8] focus:bg-[#FFFFFF]"
              />

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-xl text-xs font-bold bg-[#0575B8] hover:bg-[#045D93] text-white shadow-xs flex items-center justify-center gap-2 disabled:opacity-50 transition-all"
              >
                {loading ? 'Verifying...' : 'Verify Code'} <FiArrowRight className="w-4 h-4 text-[#F49222]" />
              </button>
            </form>
          )}

          {step === 3 && (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-[#0F172A] block mb-1.5">New Password *</label>
                <div className="relative">
                  <FiLock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#475569] w-4 h-4" />
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-xs text-[#0F172A] placeholder-[#475569] focus:outline-none focus:border-[#0575B8] focus:bg-[#FFFFFF]"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-xl text-xs font-bold bg-[#0575B8] hover:bg-[#045D93] text-white shadow-xs flex items-center justify-center gap-2 disabled:opacity-50 transition-all"
              >
                {loading ? 'Updating Password...' : 'Save New Password & Sign In'} <FiArrowRight className="w-4 h-4 text-[#F49222]" />
              </button>
            </form>
          )}

          {step === 4 && (
            <div className="text-center py-6 space-y-4">
              <div className="w-12 h-12 rounded-full bg-[#EFF8FF] border border-[#E2E8F0] flex items-center justify-center text-[#0575B8] mx-auto">
                <FiCheckCircle className="w-6 h-6" />
              </div>
              <h3 className="font-heading font-bold text-lg text-[#0F172A]">Password Updated!</h3>
              <p className="text-xs text-[#475569]">All previous active sessions have been invalidated.</p>
              <Link
                to={`/auth/login?role=${role}`}
                className="block w-full py-3 rounded-xl text-xs font-bold bg-[#0575B8] text-white hover:bg-[#045D93] shadow-xs"
              >
                Proceed to Sign In
              </Link>
            </div>
          )}

          <div className="pt-2 text-center text-xs text-[#475569]">
            <Link to="/auth/login" className="text-[#475569] hover:text-[#0F172A] font-semibold">
              ← Return to Login
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}
