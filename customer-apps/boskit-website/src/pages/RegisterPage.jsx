import React, { useState, useRef } from 'react';
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
  FiSearch,
  FiRefreshCw,
  FiCheck,
  FiMapPin,
  FiUser,
} from 'react-icons/fi';
import api from '../services/api';
import logoImg from '../assets/images/logo.png';

// GST State Code Map
const GST_STATE_MAP = {
  '01': 'Jammu & Kashmir',
  '02': 'Himachal Pradesh',
  '03': 'Punjab',
  '04': 'Chandigarh',
  '05': 'Uttarakhand',
  '06': 'Haryana',
  '07': 'Delhi',
  '08': 'Rajasthan',
  '09': 'Uttar Pradesh',
  '10': 'Bihar',
  '11': 'Sikkim',
  '12': 'Arunachal Pradesh',
  '13': 'Nagaland',
  '14': 'Manipur',
  '15': 'Mizoram',
  '16': 'Tripura',
  '17': 'Meghalaya',
  '18': 'Assam',
  '19': 'West Bengal',
  '20': 'Jharkhand',
  '21': 'Odisha',
  '22': 'Chhattisgarh',
  '23': 'Madhya Pradesh',
  '24': 'Gujarat',
  '25': 'Daman & Diu',
  '26': 'Dadra & Nagar Haveli',
  '27': 'Maharashtra',
  '28': 'Andhra Pradesh',
  '29': 'Karnataka',
  '30': 'Goa',
  '31': 'Lakshadweep',
  '32': 'Kerala',
  '33': 'Tamil Nadu',
  '34': 'Puducherry',
  '35': 'Andaman & Nicobar Islands',
  '36': 'Telangana',
  '37': 'Andhra Pradesh (New)',
  '38': 'Ladakh',
  '97': 'Other Territory',
  '99': 'Centre Jurisdiction',
};

const GSTIN_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;

export default function RegisterPage() {
  const [searchParams] = useSearchParams();
  const preselectedPlan = searchParams.get('plan') || '';
  const navigate = useNavigate();
  const gstInputRef = useRef(null);

  // Stepper: 1 = GST Verify, 2 = Business Details & Password
  const [step, setStep] = useState(1);

  // Step 1: GST state
  const [gstInput, setGstInput] = useState('');
  const [gstVerifying, setGstVerifying] = useState(false);
  const [gstError, setGstError] = useState('');
  const [gstResult, setGstResult] = useState(null);

  // Step 2: Form state
  const [formData, setFormData] = useState({
    business_name: '',
    contact_person: '',
    email: '',
    mobile: '',
    password: '',
    confirm_password: '',
    agreeTerms: true,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Derived state name from 2-digit GST prefix
  const gstStateName =
    gstInput.length >= 2
      ? GST_STATE_MAP[gstInput.substring(0, 2).toUpperCase()] || 'Gujarat'
      : null;

  // ── Step 1: Real-Time QuickKYC GSTIN Verification ───────────────────────────
  const handleVerifyGst = async (e) => {
    if (e) e.preventDefault();
    const gstin = gstInput.trim().toUpperCase();
    setGstError('');

    if (!gstin) {
      setGstError('Please enter your 15-digit GSTIN number.');
      return;
    }

    if (!GSTIN_REGEX.test(gstin)) {
      setGstError('Invalid GSTIN format. Example: 24AABCU9603R1ZM');
      return;
    }

    try {
      setGstVerifying(true);
      const res = await api.post('/auth/distributor/gst/verify', { gstin });

      if (res.data?.success && res.data.data) {
        const d = res.data.data;
        setGstResult(d);
        const bizName = d.trade_name || d.legal_name || '';
        setFormData((f) => ({
          ...f,
          business_name: bizName,
        }));
      } else {
        setGstError(res.data?.message || 'GSTIN verification failed. Please check the number.');
      }
    } catch (err) {
      setGstError(
        err.response?.data?.message || 'Could not verify GSTIN right now. Please try again.'
      );
    } finally {
      setGstVerifying(false);
    }
  };

  const handleProceedToForm = () => {
    if (!gstResult) return;
    setStep(2);
  };

  const handleResetGst = () => {
    setGstResult(null);
    setGstError('');
    setGstInput('');
    setStep(1);
    setTimeout(() => gstInputRef.current?.focus(), 100);
  };

  // ── Step 2: Submit Registration & Create Account ────────────────────────────
  const handleFinalSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirm_password) {
      setError('Passwords do not match.');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    try {
      setLoading(true);
      const payload = {
        business_name: formData.business_name || gstResult?.legal_name,
        contact_person: formData.contact_person,
        email: formData.email,
        mobile: formData.mobile,
        password: formData.password,
        gst_number: gstResult?.gstin || gstInput.toUpperCase(),
        gst_legal_name: gstResult?.legal_name,
        gst_trade_name: gstResult?.trade_name,
        gst_address: gstResult?.principal_address?.addr || `${gstStateName}, India`,
        pan_number: gstResult?.pan_number,
      };

      const res = await api.post('/auth/distributor/register/init', payload);

      if (res.data?.success) {
        setSuccess(true);
        // Automatic navigation to distributor portal
        setTimeout(() => {
          navigate('/distributor/portal/dashboard');
        }, 1500);
      } else {
        setError(res.data?.message || 'Registration failed.');
      }
    } catch (err) {
      setError(
        err.response?.data?.message || 'Registration failed. An account may already exist with this email or mobile.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12 bg-gradient-to-b from-[#F0F5FF]/60 via-[#FFFFFF] to-[#FFFFFF]">
      <div className="w-full max-w-xl space-y-6">
        
        {/* ── Brand Header (Matching Screenshot) ────────────────────────────── */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 border border-blue-200 shadow-sm mx-auto">
            <FiZap className="w-6 h-6" />
          </div>
          <h1 className="font-heading font-black text-2xl sm:text-3xl text-slate-900 tracking-tight">
            Become a Solar Distributor Partner
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Register your business account for exclusive wholesale pricing & territory rights
          </p>

          {/* Stepper Pills */}
          <div className="flex items-center justify-center gap-3 pt-2">
            <div
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${
                step === 1
                  ? 'bg-[#185ADB] text-white shadow-sm'
                  : 'bg-blue-50 text-blue-700 border border-blue-200'
              }`}
            >
              <span className="w-4 h-4 rounded-full bg-white/20 flex items-center justify-center text-[10px]">
                1
              </span>
              <span>1. GST VERIFY</span>
            </div>

            <div className="w-8 h-0.5 bg-slate-200" />

            <div
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${
                step === 2
                  ? 'bg-[#185ADB] text-white shadow-sm'
                  : 'bg-slate-100 text-slate-500 border border-slate-200'
              }`}
            >
              <span className="w-4 h-4 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center text-[10px]">
                2
              </span>
              <span>2. BUSINESS DETAILS</span>
            </div>
          </div>
        </div>

        {/* ── Main Registration Card ────────────────────────────────────────── */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xl space-y-6">
          
          {/* Error Message */}
          {error && (
            <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center gap-2.5">
              <FiAlertCircle className="w-5 h-5 text-red-500 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2.5 animate-bounce">
              <FiCheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>Account created successfully! Redirecting to Distributor Dashboard...</span>
            </div>
          )}

          {/* ════ STEP 1: GSTIN VERIFY (Matching Screenshot) ══════════════════ */}
          {step === 1 && (
            <div className="space-y-5">
              <div className="flex items-start gap-2.5">
                <FiShield className="text-blue-600 shrink-0 mt-0.5" size={20} />
                <div>
                  <h3 className="font-heading font-black text-lg text-slate-900">
                    Verify Your GSTIN
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                    Enter your 15-digit GST number. Your legal business details and territory location will be verified automatically.
                  </p>
                </div>
              </div>

              {gstError && (
                <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                  <FiAlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                  <span>{gstError}</span>
                </div>
              )}

              {/* GSTIN Input with Button */}
              <div>
                <label className="text-xs font-bold text-slate-800 block mb-1.5 uppercase tracking-wider">
                  GSTIN NUMBER *
                </label>
                <div className="flex flex-col sm:flex-row gap-3">
                  <input
                    ref={gstInputRef}
                    type="text"
                    maxLength={15}
                    value={gstInput}
                    onChange={(e) => {
                      setGstInput(e.target.value.toUpperCase().replace(/[^0-9A-Z]/g, ''));
                      setGstResult(null);
                      setGstError('');
                    }}
                    placeholder="27ABCDE1234F1Z5"
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 font-mono font-bold text-sm tracking-wider text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-600 focus:bg-white transition-all"
                  />

                  <button
                    type="button"
                    disabled={gstVerifying || gstInput.length < 15}
                    onClick={handleVerifyGst}
                    className="px-6 py-3 rounded-xl text-xs font-bold bg-[#185ADB] hover:bg-blue-700 text-white shadow-sm flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50 shrink-0"
                  >
                    {gstVerifying ? (
                      <>
                        <FiRefreshCw className="animate-spin" size={14} /> Verifying...
                      </>
                    ) : (
                      <>
                        <FiShield size={14} /> Verify GST
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Verified GST Card */}
              {gstResult && (
                <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 space-y-3 animate-in fade-in duration-200 text-xs">
                  <div className="flex items-center justify-between border-b border-emerald-200 pb-2.5">
                    <div className="flex items-center gap-2">
                      <FiCheckCircle className="text-emerald-600" size={16} />
                      <span className="font-bold text-emerald-900">
                        QuickKYC Government Record Found
                      </span>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-600 text-white">
                      ACTIVE
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <span className="text-slate-500 block">Legal Entity:</span>
                      <strong className="text-slate-900 font-bold">{gstResult.legal_name}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Trade Name:</span>
                      <strong className="text-slate-900 font-bold">{gstResult.trade_name}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Operating State:</span>
                      <strong className="text-blue-700 font-bold">
                        {gstStateName} ({gstResult.state_code})
                      </strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block">PAN Number:</span>
                      <strong className="text-slate-900 font-mono font-bold">
                        {gstResult.pan_number}
                      </strong>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleResetGst}
                    className="text-[11px] text-slate-500 hover:text-slate-800 underline block pt-1"
                  >
                    Change GSTIN
                  </button>
                </div>
              )}

              {/* Proceed Button */}
              <button
                type="button"
                disabled={!gstResult}
                onClick={handleProceedToForm}
                className="w-full py-3.5 rounded-xl text-xs sm:text-sm font-bold bg-[#185ADB] hover:bg-blue-700 text-white shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50 disabled:bg-slate-300 disabled:cursor-not-allowed"
              >
                <span>Proceed to Registration</span>
                <FiArrowRight size={16} />
              </button>

              <div className="text-center text-[11px] text-slate-400">
                State & location rules will automatically map to your verified GST state code
              </div>
            </div>
          )}

          {/* ════ STEP 2: BUSINESS DETAILS & PASSWORD SETTING ═════════════════ */}
          {step === 2 && (
            <form onSubmit={handleFinalSubmit} className="space-y-4 text-xs">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h3 className="font-heading font-black text-base text-slate-900">
                    Business Account Details
                  </h3>
                  <span className="text-[11px] text-slate-500">
                    Verified GSTIN: <strong className="text-blue-700">{gstResult?.gstin}</strong> ({gstStateName})
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="text-xs text-blue-700 font-bold hover:underline cursor-pointer"
                >
                  Edit GST
                </button>
              </div>

              {/* Pre-filled Company Name */}
              <div>
                <label className="font-bold text-slate-800 block mb-1">
                  Company / Legal Business Name *
                </label>
                <div className="relative">
                  <FiBriefcase className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={formData.business_name}
                    onChange={(e) => setFormData({ ...formData, business_name: e.target.value })}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 font-bold text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white"
                  />
                </div>
              </div>

              {/* Contact Person & Mobile */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-800 block mb-1">
                    Contact Person Name *
                  </label>
                  <div className="relative">
                    <FiUser className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      required
                      value={formData.contact_person}
                      onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
                      placeholder="e.g. Rajesh Sharma"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 font-semibold text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-bold text-slate-800 block mb-1">
                    Mobile Number *
                  </label>
                  <div className="relative">
                    <FiPhone className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="tel"
                      required
                      value={formData.mobile}
                      onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                      placeholder="9876543210"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 font-semibold text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* Official Email */}
              <div>
                <label className="font-bold text-slate-800 block mb-1">
                  Official Email Address *
                </label>
                <div className="relative">
                  <FiMail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="partner@company.com"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 font-semibold text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white"
                  />
                </div>
              </div>

              {/* Password Setting */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-800 block mb-1">
                    Create Secure Password *
                  </label>
                  <div className="relative">
                    <FiLock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="password"
                      required
                      minLength={6}
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      placeholder="At least 6 chars"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 font-semibold text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-bold text-slate-800 block mb-1">
                    Confirm Password *
                  </label>
                  <div className="relative">
                    <FiLock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="password"
                      required
                      minLength={6}
                      value={formData.confirm_password}
                      onChange={(e) => setFormData({ ...formData, confirm_password: e.target.value })}
                      placeholder="Re-enter password"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 font-semibold text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-slate-100 text-slate-600 cursor-pointer"
                >
                  Back
                </button>

                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-3 rounded-xl text-xs font-bold bg-[#185ADB] hover:bg-blue-700 text-white shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <FiRefreshCw className="animate-spin" size={14} /> Creating Account...
                    </>
                  ) : (
                    <>
                      <FiCheckCircle size={15} /> Complete Registration & Proceed
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

        </div>

        {/* ── Footer Link ───────────────────────────────────────────────────── */}
        <div className="text-center text-xs text-slate-500">
          Already have a distributor account?{' '}
          <Link to="/auth/login" className="font-bold text-blue-700 hover:underline">
            Sign In
          </Link>
        </div>

      </div>
    </div>
  );
}
