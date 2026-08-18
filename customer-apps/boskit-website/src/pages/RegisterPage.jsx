import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  FiBriefcase,
  FiMail,
  FiPhone,
  FiLock,
  FiArrowRight,
  FiCheckCircle,
  FiAlertCircle,
  FiShield,
  FiZap,
} from 'react-icons/fi';
import api from '../services/api';

export default function RegisterPage() {
  const [searchParams] = useSearchParams();
  const preselectedPlan = searchParams.get('plan') || '';
  
  const [formData, setFormData] = useState({
    business_name: '',
    email: '',
    mobile: '',
    password: '',
    agreeTerms: true,
  });
  
  // Step in component: 1 = Register Info, 2 = Verify OTP
  const [step, setStep] = useState(1);
  const [otp, setOtp] = useState('');
  const [distributorData, setDistributorData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [devOtp, setDevOtp] = useState('');
  const navigate = useNavigate();

  const handleInitSubmit = async (e) => {
    e.preventDefault();
    if (!formData.business_name || !formData.email || !formData.mobile || !formData.password) {
      setError('Please fill in all required registration fields.');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const res = await api.post('/auth/distributor/register/init', {
        business_name: formData.business_name,
        email: formData.email,
        mobile: formData.mobile,
        password: formData.password,
      });

      if (res.data?.success) {
        setDistributorData(res.data.distributor);
        // Request OTP
        const otpRes = await api.post('/auth/distributor/otp/send', {
          target: formData.email,
          channel: 'email',
          purpose: 'distributor_signup',
        });
        if (otpRes.data?.dev_otp) setDevOtp(otpRes.data.dev_otp);
        setStep(2);
      } else {
        setError(res.data?.message || 'Registration initiation failed.');
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Registration failed. Check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpVerify = async (e) => {
    e.preventDefault();
    if (!otp.trim()) {
      setError('Please enter the 6-digit verification code.');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const res = await api.post('/auth/distributor/otp/verify', {
        target: formData.email,
        otp: otp.trim(),
        purpose: 'distributor_signup',
      });

      if (res.data?.success) {
        // Successful signup & OTP verification -> Redirect to Phase 5 wizard or confirmation
        navigate(`/distributor/onboarding?step=2${preselectedPlan ? `&plan=${preselectedPlan}` : ''}`);
      } else {
        setError(res.data?.message || 'Invalid OTP code.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'OTP verification failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12 bg-[#FFFFFF]">
      <div className="w-full max-w-lg space-y-8">
        
        {/* Header */}
        <div className="text-center space-y-2">
          <Link to="/" className="inline-flex items-center justify-center gap-2 group">
            <div className="w-10 h-10 rounded-xl bg-[#ECF8F1] border border-[#DDE8E1] flex items-center justify-center text-[#1F8F4E] shadow-xs">
              <FiZap className="w-5 h-5" />
            </div>
            <span className="font-heading font-black text-2xl text-[#17211B] tracking-tight">
              Solar<span className="text-[#1F8F4E]">Kits</span> <span className="text-xs font-bold px-2 py-0.5 rounded bg-[#ECF8F1] text-[#1F8F4E] border border-[#DDE8E1]">BOS</span>
            </span>
          </Link>
          <h1 className="font-heading font-bold text-2xl sm:text-3xl text-[#17211B] tracking-tight">
            Apply for Distributor Dealership
          </h1>
          <p className="text-xs text-[#5F6F65]">
            Stage 1 of 5: Create your account & verify business contact details.
          </p>
        </div>

        <div className="bg-[#FFFFFF] p-8 rounded-3xl border border-[#DDE8E1] shadow-xs space-y-6">
          
          {error && (
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
              <FiAlertCircle className="w-4 h-4 text-red-500 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {step === 1 ? (
            <form onSubmit={handleInitSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-[#17211B] block mb-1.5">Company / Business Name *</label>
                <div className="relative">
                  <FiBriefcase className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#5F6F65] w-4 h-4" />
                  <input
                    type="text"
                    required
                    value={formData.business_name}
                    onChange={(e) => setFormData({ ...formData, business_name: e.target.value })}
                    placeholder="e.g. Surya Power Distribution Pvt Ltd"
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-[#F7FAF8] border border-[#DDE8E1] text-xs text-[#17211B] placeholder-[#5F6F65] focus:outline-none focus:border-[#1F8F4E] focus:bg-[#FFFFFF]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-[#17211B] block mb-1.5">Official Email *</label>
                  <div className="relative">
                    <FiMail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#5F6F65] w-4 h-4" />
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="name@company.com"
                      className="w-full pl-10 pr-4 py-3 rounded-xl bg-[#F7FAF8] border border-[#DDE8E1] text-xs text-[#17211B] placeholder-[#5F6F65] focus:outline-none focus:border-[#1F8F4E] focus:bg-[#FFFFFF]"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-[#17211B] block mb-1.5">Mobile Number *</label>
                  <div className="relative">
                    <FiPhone className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#5F6F65] w-4 h-4" />
                    <input
                      type="tel"
                      required
                      value={formData.mobile}
                      onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                      placeholder="9876543210"
                      className="w-full pl-10 pr-4 py-3 rounded-xl bg-[#F7FAF8] border border-[#DDE8E1] text-xs text-[#17211B] placeholder-[#5F6F65] focus:outline-none focus:border-[#1F8F4E] focus:bg-[#FFFFFF]"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-[#17211B] block mb-1.5">Create Secure Password *</label>
                <div className="relative">
                  <FiLock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#5F6F65] w-4 h-4" />
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="At least 6 characters"
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-[#F7FAF8] border border-[#DDE8E1] text-xs text-[#17211B] placeholder-[#5F6F65] focus:outline-none focus:border-[#1F8F4E] focus:bg-[#FFFFFF]"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 rounded-xl text-sm font-bold bg-[#1F8F4E] hover:bg-[#18733E] text-white shadow-xs flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                >
                  {loading ? 'Initializing Registration...' : 'Continue to Verification'} <FiArrowRight className="w-4 h-4 text-[#F5B700]" />
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleOtpVerify} className="space-y-5">
              <div className="text-center space-y-1">
                <div className="w-12 h-12 rounded-full bg-[#ECF8F1] border border-[#DDE8E1] flex items-center justify-center text-[#1F8F4E] mx-auto">
                  <FiMail className="w-6 h-6" />
                </div>
                <h3 className="font-heading font-bold text-lg text-[#17211B]">Verify Your Email</h3>
                <p className="text-xs text-[#5F6F65]">
                  We've sent a 6-digit verification code to <strong className="text-[#17211B]">{formData.email}</strong>.
                </p>
                {devOtp && (
                  <p className="text-[11px] font-mono text-[#1F8F4E] bg-[#ECF8F1] p-1.5 rounded border border-[#DDE8E1] mt-2">
                    Test Mode OTP: <strong>{devOtp}</strong>
                  </p>
                )}
              </div>

              <div>
                <label className="text-xs font-semibold text-[#17211B] block mb-1.5">Enter 6-Digit Code *</label>
                <input
                  type="text"
                  maxLength={6}
                  required
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="123456"
                  className="w-full text-center tracking-[8px] font-mono font-bold text-lg py-3 rounded-xl bg-[#F7FAF8] border border-[#DDE8E1] text-[#17211B] placeholder-[#5F6F65] focus:outline-none focus:border-[#1F8F4E] focus:bg-[#FFFFFF]"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-xl text-sm font-bold bg-[#1F8F4E] hover:bg-[#18733E] text-white shadow-xs flex items-center justify-center gap-2 transition-all disabled:opacity-50"
              >
                {loading ? 'Verifying...' : 'Verify & Proceed to GST Auto-Fetch'} <FiArrowRight className="w-4 h-4 text-[#F5B700]" />
              </button>

              <button
                type="button"
                onClick={() => setStep(1)}
                className="w-full text-center text-xs text-[#5F6F65] hover:text-[#17211B]"
              >
                ← Back to Edit Details
              </button>
            </form>
          )}

          <div className="pt-2 text-center text-xs text-[#5F6F65]">
            Already have an account?{' '}
            <Link to="/auth/login" className="text-[#1F8F4E] font-bold hover:underline">
              Sign In
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}
