import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  FiCheckCircle,
  FiArrowRight,
  FiArrowLeft,
  FiSave,
  FiShield,
  FiUploadCloud,
  FiFileText,
  FiAlertCircle,
  FiMapPin,
  FiBriefcase,
  FiLock,
  FiDollarSign,
  FiLayers,
  FiTruck,
  FiUserCheck,
  FiCheck,
} from 'react-icons/fi';
import api from '../services/api';

const STEP_LABELS = [
  'Account & Email',
  'Business Entity',
  'GSTIN Entry',
  'GST Verification',
  'PAN Card Identity',
  'Operating State',
  'Revenue District',
  'Warehouse Location',
  'Storage & Logistics',
  'Authorized Signatory',
  'KYC Document Uploads',
  'Bank & Settlement',
  'Distributor Plan',
  'Dealer Projections',
  'Terms & Agreements',
  'Pre-Submit Review',
  'Submission Complete',
];

export default function DistributorOnboardingPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, isAuthenticated, loading: authLoading } = useAuth();

  const [currentStep, setCurrentStep] = useState(
    parseInt(searchParams.get('step') || '2', 10)
  );
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Dropdown options
  const [states, setStates] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [plans, setPlans] = useState([]);

  // Full Wizard State
  const [formData, setFormData] = useState({
    // Step 2: Entity
    entity_type: 'Private Limited',
    years_in_business: '3-5 Years',
    annual_turnover: '50 Lakhs - 1 Crore',
    has_existing_solar_business: true,
    // Step 3 & 4: GST
    gst_number: '',
    gst_legal_name: '',
    gst_trade_name: '',
    gst_address: '',
    gst_verified: false,
    gst_log_id: null,
    // Step 5: PAN
    pan_number: '',
    pan_holder_name: '',
    // Step 6 & 7: Geolocation
    state_id: '',
    state_name: '',
    district_id: '',
    district_name: '',
    // Step 8: Warehouse Address
    warehouse_address_line: '',
    warehouse_city: '',
    warehouse_pincode: '',
    warehouse_landmark: '',
    // Step 9: Storage Profile
    storage_area_sqft: '2500',
    has_crane_access: true,
    truck_accessibility: 'Heavy Multi-Axle Vehicle Accessible',
    // Step 10: Authorized Person
    auth_name: '',
    auth_designation: 'Managing Director / Partner',
    auth_mobile: '',
    auth_email: '',
    auth_aadhaar_masked: '',
    // Step 11: KYC Uploads
    kyc_docs: {
      gst_certificate: false,
      pan_card: false,
      shop_photo: false,
      cancelled_cheque: false,
    },
    // Step 12: Bank Details
    bank_account_number: '',
    bank_ifsc: '',
    bank_name: '',
    account_holder_name: '',
    // Step 13: Plan
    selected_plan_code: searchParams.get('plan') || 'BK-DIST-GROWTH',
    // Step 14: Dealer Network Projection
    projected_dealers: '15-30 Dealers',
    projected_monthly_kw: '50-100 kW',
    // Step 15: Terms
    agree_territorial_terms: false,
    agree_minimum_commitment: false,
    agree_statutory_gst: false,
  });

  // Load Initial State
  useEffect(() => {
    async function initWizard() {
      try {
        setLoading(true);
        const [stateRes, geoStatesRes, plansRes] = await Promise.all([
          api.get('/distributor/onboarding/state'),
          api.get('/distributor/onboarding/geo/states'),
          api.get('/public/plans'),
        ]);

        if (geoStatesRes.data?.states) setStates(geoStatesRes.data.states);
        if (plansRes.data?.plans) setPlans(plansRes.data.plans);

        if (stateRes.data?.success) {
          const dist = stateRes.data.distributor;
          const app = stateRes.data.application;
          const stepData = app?.step_data || {};

          setFormData((prev) => ({
            ...prev,
            business_name: dist?.business_name || '',
            email: dist?.email || '',
            mobile: dist?.mobile || '',
            gst_number: dist?.gst_number || stepData.step3?.gst_number || '',
            gst_legal_name: dist?.gst_legal_name || stepData.step4?.legal_name || '',
            gst_trade_name: dist?.gst_trade_name || stepData.step4?.trade_name || '',
            gst_verified: Boolean(dist?.gst_verified_at),
            pan_number: dist?.pan_number || stepData.step5?.pan_number || '',
            auth_name: dist?.authorized_person?.name || stepData.step10?.name || '',
            auth_mobile: dist?.authorized_person?.mobile || dist?.mobile || '',
            auth_email: dist?.authorized_person?.email || dist?.email || '',
            selected_plan_code: searchParams.get('plan') || stepData.step13?.selected_plan_code || 'BK-DIST-GROWTH',
            ...(stepData.step2 || {}),
            ...(stepData.step8 || {}),
            ...(stepData.step9 || {}),
            ...(stepData.step12 || {}),
          }));

          if (app?.step_completed && !searchParams.get('step')) {
            setCurrentStep(Math.min(16, app.step_completed + 1));
          }
        }
      } catch (err) {
        console.error('Wizard init error:', err);
      } finally {
        setLoading(false);
      }
    }

    if (isAuthenticated) {
      initWizard();
    } else if (!authLoading) {
      navigate('/auth/login?redirect=/distributor/onboarding');
    }
  }, [isAuthenticated, authLoading, navigate, searchParams]);

  // Fetch districts when state changes
  useEffect(() => {
    async function loadDistricts() {
      if (!formData.state_id) return;
      try {
        const res = await api.get(`/distributor/onboarding/geo/districts?state_id=${formData.state_id}`);
        if (res.data?.districts) {
          setDistricts(res.data.districts);
        }
      } catch (err) {
        console.error('Error fetching districts:', err);
      }
    }
    loadDistricts();
  }, [formData.state_id]);

  // Save current step to backend
  const saveCurrentStep = async (stepNum, payload) => {
    try {
      setSaving(true);
      setError('');
      await api.post('/distributor/onboarding/save-step', {
        step_number: stepNum,
        data: payload,
      });
      setSuccessMsg('Progress autosaved.');
      setTimeout(() => setSuccessMsg(''), 2500);
    } catch (err) {
      console.warn('Step autosave warning:', err);
    } finally {
      setSaving(false);
    }
  };

  // Step Navigators
  const goNext = async () => {
    await saveCurrentStep(currentStep, formData);
    if (currentStep < 17) {
      setCurrentStep(currentStep + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const goBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Trigger Live GST Verification
  const handleVerifyGst = async () => {
    if (!formData.gst_number || formData.gst_number.length < 15) {
      setError('Please enter a valid 15-character GSTIN.');
      return;
    }

    try {
      setSaving(true);
      setError('');
      const res = await api.post('/distributor/onboarding/gst-verify', {
        gstin: formData.gst_number.trim().toUpperCase(),
      });

      if (res.data?.success && res.data?.data) {
        const d = res.data.data;
        setFormData((prev) => ({
          ...prev,
          gst_legal_name: d.legal_name,
          gst_trade_name: d.trade_name || d.legal_name,
          gst_address: d.principal_address?.addr || '101, Solar Commercial Hub',
          gst_verified: true,
          gst_log_id: d.log_id,
          pan_number: d.gstin.substring(2, 12),
        }));
        setSuccessMsg('GSTIN Verified Successfully!');
        setTimeout(() => setSuccessMsg(''), 3000);
        setCurrentStep(4); // Advance to auto-filled confirmation
      } else {
        setError(res.data?.message || 'GSTIN verification failed.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'GSTIN lookup failed.');
    } finally {
      setSaving(false);
    }
  };

  // Handle KYC Mock Document Upload
  const handleKycUpload = async (docType) => {
    try {
      setSaving(true);
      setError('');
      const res = await api.post('/distributor/onboarding/kyc-upload', {
        doc_type: docType,
        original_name: `${docType}_verified.pdf`,
        storage_key: `kyc/${user?.id || 'demo'}/${docType}_${Date.now()}`,
      });

      if (res.data?.success) {
        setFormData((prev) => ({
          ...prev,
          kyc_docs: {
            ...prev.kyc_docs,
            [docType]: true,
          },
        }));
        setSuccessMsg(`${docType.replace(/_/g, ' ')} uploaded & encrypted!`);
        setTimeout(() => setSuccessMsg(''), 2500);
      }
    } catch (err) {
      setError('Document upload failed. Please retry.');
    } finally {
      setSaving(false);
    }
  };

  // Final Submit
  const handleFinalSubmit = async () => {
    if (!formData.agree_territorial_terms || !formData.agree_statutory_gst) {
      setError('Please accept all statutory and territorial terms to submit.');
      return;
    }

    try {
      setSaving(true);
      setError('');
      const res = await api.post('/distributor/onboarding/submit');
      if (res.data?.success) {
        setCurrentStep(17); // Success Screen
      } else {
        setError(res.data?.message || 'Submission failed.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Submission error. Please ensure GST is verified.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-20">
        <div className="bg-[#FFFFFF] border border-[#DDE8E1] h-96 rounded-3xl animate-pulse" />
      </div>
    );
  }

  const progressPercent = Math.min(100, Math.round(((currentStep - 1) / 16) * 100));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      
      {/* Top Header & Progress Bar */}
      <div className="bg-[#FFFFFF] p-6 rounded-3xl border border-[#DDE8E1] shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-[#1F8F4E] uppercase tracking-widest">
                Stage {currentStep} of 17
              </span>
              <span className="text-[#5F6F65]">•</span>
              <span className="text-xs text-[#5F6F65] font-medium">
                {STEP_LABELS[currentStep - 1]}
              </span>
            </div>
            <h1 className="font-heading font-black text-xl sm:text-2xl text-[#17211B] mt-0.5">
              Distributor Dealership Onboarding Wizard
            </h1>
          </div>

          <div className="flex items-center gap-3">
            {successMsg && (
              <span className="text-xs text-[#1F8F4E] font-semibold flex items-center gap-1">
                <FiCheck className="w-4 h-4" /> {successMsg}
              </span>
            )}
            <button
              onClick={() => saveCurrentStep(currentStep, formData)}
              disabled={saving}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#F7FAF8] text-[#17211B] hover:bg-[#ECF8F1] border border-[#DDE8E1] flex items-center gap-1.5"
            >
              <FiSave className="w-3.5 h-3.5 text-[#1F8F4E]" />
              {saving ? 'Saving...' : 'Save Draft'}
            </button>
          </div>
        </div>

        {/* Linear Progress Bar */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-[11px] text-[#5F6F65]">
            <span>Overall Application Progress</span>
            <span className="font-bold text-[#1F8F4E]">{progressPercent}% Completed</span>
          </div>
          <div className="w-full h-2 rounded-full bg-[#F7FAF8] overflow-hidden border border-[#DDE8E1]">
            <div
              className="h-full bg-[#1F8F4E] rounded-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Main Wizard Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Left Step Navigator Sidebar */}
        <div className="hidden lg:block space-y-1 bg-[#FFFFFF] p-4 rounded-3xl border border-[#DDE8E1] shadow-xs max-h-[720px] overflow-y-auto">
          <h3 className="text-xs font-bold text-[#5F6F65] uppercase tracking-wider px-3 py-2">
            Wizard Milestones
          </h3>
          {STEP_LABELS.map((label, idx) => {
            const stepNum = idx + 1;
            const isDone = stepNum < currentStep;
            const isCurrent = stepNum === currentStep;

            return (
              <button
                key={stepNum}
                onClick={() => {
                  if (stepNum <= currentStep) setCurrentStep(stepNum);
                }}
                className={`w-full text-left px-3 py-2 rounded-xl text-xs font-medium flex items-center justify-between transition-colors ${
                  isCurrent
                    ? 'bg-[#1F8F4E] text-white font-bold shadow-xs'
                    : isDone
                    ? 'text-[#1F8F4E] bg-[#ECF8F1] hover:bg-[#F7FAF8]'
                    : 'text-[#5F6F65] cursor-not-allowed'
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  <span className="w-4 font-mono text-[10px]">{stepNum}</span>
                  <span className="truncate">{label}</span>
                </div>
                {isDone && <FiCheckCircle className="w-3.5 h-3.5 shrink-0 text-[#1F8F4E]" />}
              </button>
            );
          })}
        </div>

        {/* Right Step Content Container */}
        <div className="lg:col-span-3 bg-[#FFFFFF] p-6 sm:p-10 rounded-3xl border border-[#DDE8E1] shadow-xs space-y-6">
          
          {error && (
            <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2.5">
              <FiAlertCircle className="w-5 h-5 text-red-500 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* ── STEP 1: Account Creation Confirmation ──────────────────────── */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div className="space-y-1">
                <h2 className="font-heading font-bold text-2xl text-[#17211B]">Step 1: Account Verified</h2>
                <p className="text-xs text-[#5F6F65]">Your core account is verified and linked to your portal profile.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-5 rounded-2xl bg-[#F7FAF8] border border-[#DDE8E1] text-xs">
                <div>
                  <span className="text-[#5F6F65] block">Registered Entity Name</span>
                  <span className="font-bold text-[#17211B] text-sm">{formData.business_name || user?.business_name}</span>
                </div>
                <div>
                  <span className="text-[#5F6F65] block">Registered Email</span>
                  <span className="font-bold text-[#17211B] text-sm">{formData.email || user?.email}</span>
                </div>
                <div>
                  <span className="text-[#5F6F65] block">Authorized Mobile</span>
                  <span className="font-bold text-[#17211B] text-sm">{formData.mobile || user?.mobile}</span>
                </div>
                <div>
                  <span className="text-[#5F6F65] block">Verification Status</span>
                  <span className="font-bold text-[#1F8F4E] flex items-center gap-1">
                    <FiCheckCircle /> Email & Mobile Verified
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* ── STEP 2: Business Overview ──────────────────────────────────── */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div className="space-y-1">
                <h2 className="font-heading font-bold text-2xl text-[#17211B]">Step 2: Business & Legal Entity</h2>
                <p className="text-xs text-[#5F6F65]">Select your registered enterprise structure and commercial operating scale.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-[#17211B] block mb-1.5">Legal Entity Structure *</label>
                  <select
                    value={formData.entity_type}
                    onChange={(e) => setFormData({ ...formData, entity_type: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-[#F7FAF8] border border-[#DDE8E1] text-xs text-[#17211B] focus:border-[#1F8F4E] focus:outline-none focus:bg-[#FFFFFF]"
                  >
                    <option value="Private Limited">Private Limited Company (Pvt Ltd)</option>
                    <option value="Partnership">Registered Partnership Firm</option>
                    <option value="LLP">Limited Liability Partnership (LLP)</option>
                    <option value="Proprietorship">Sole Proprietorship</option>
                    <option value="Public Limited">Public Limited Company</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-[#17211B] block mb-1.5">Years in Commercial Operation *</label>
                  <select
                    value={formData.years_in_business}
                    onChange={(e) => setFormData({ ...formData, years_in_business: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-[#F7FAF8] border border-[#DDE8E1] text-xs text-[#17211B] focus:border-[#1F8F4E] focus:outline-none focus:bg-[#FFFFFF]"
                  >
                    <option value="1-2 Years">1 - 2 Years</option>
                    <option value="3-5 Years">3 - 5 Years</option>
                    <option value="5-10 Years">5 - 10 Years</option>
                    <option value="10+ Years">More than 10 Years</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-[#17211B] block mb-1.5">Annual Business Turnover *</label>
                  <select
                    value={formData.annual_turnover}
                    onChange={(e) => setFormData({ ...formData, annual_turnover: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-[#F7FAF8] border border-[#DDE8E1] text-xs text-[#17211B] focus:border-[#1F8F4E] focus:outline-none focus:bg-[#FFFFFF]"
                  >
                    <option value="Under 25 Lakhs">Under ₹25 Lakhs</option>
                    <option value="25-50 Lakhs">₹25 Lakhs - ₹50 Lakhs</option>
                    <option value="50-100 Lakhs">₹50 Lakhs - ₹1 Crore</option>
                    <option value="1-5 Crore">₹1 Crore - ₹5 Crore</option>
                    <option value="5 Crore+">Above ₹5 Crore</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-[#17211B] block mb-1.5">Existing Solar Distribution Experience?</label>
                  <div className="flex gap-4 pt-2">
                    <label className="flex items-center gap-2 text-xs text-[#17211B] cursor-pointer">
                      <input
                        type="radio"
                        name="solar_exp"
                        checked={formData.has_existing_solar_business === true}
                        onChange={() => setFormData({ ...formData, has_existing_solar_business: true })}
                        className="text-[#1F8F4E] focus:ring-[#1F8F4E]"
                      />
                      Yes, Active Solar Wholesaler / Installer
                    </label>
                    <label className="flex items-center gap-2 text-xs text-[#17211B] cursor-pointer">
                      <input
                        type="radio"
                        name="solar_exp"
                        checked={formData.has_existing_solar_business === false}
                        onChange={() => setFormData({ ...formData, has_existing_solar_business: false })}
                        className="text-[#1F8F4E] focus:ring-[#1F8F4E]"
                      />
                      New to Solar (Electrical / Hardware)
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── STEP 3: GSTIN Entry ────────────────────────────────────────── */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div className="space-y-1">
                <h2 className="font-heading font-bold text-2xl text-[#17211B]">Step 3: GSTIN Entry</h2>
                <p className="text-xs text-[#5F6F65]">Enter your 15-character Goods and Services Tax Identification Number.</p>
              </div>

              <div className="space-y-4 max-w-md">
                <div>
                  <label className="text-xs font-semibold text-[#17211B] block mb-1.5">Goods and Services Tax Number (GSTIN) *</label>
                  <input
                    type="text"
                    maxLength={15}
                    value={formData.gst_number}
                    onChange={(e) => setFormData({ ...formData, gst_number: e.target.value.toUpperCase() })}
                    placeholder="e.g. 24AAACC1206D1ZM"
                    className="w-full px-4 py-3.5 rounded-xl bg-[#F7FAF8] border border-[#DDE8E1] text-base font-mono tracking-wider font-bold text-[#17211B] placeholder-[#5F6F65] focus:border-[#1F8F4E] focus:outline-none focus:bg-[#FFFFFF] uppercase"
                  />
                  <span className="text-[11px] text-[#5F6F65] mt-1 block">
                    Format: 2 Digit State Code + 10 Char PAN + 1 Entity No + 'Z' + 1 Check Digit
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleVerifyGst}
                  disabled={saving || !formData.gst_number}
                  className="w-full py-3.5 rounded-xl text-sm font-bold bg-[#1F8F4E] hover:bg-[#18733E] text-white shadow-xs flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <FiShield className="w-4 h-4" />
                  {saving ? 'Verifying with Tax Gateway...' : 'Verify GSTIN & Auto-Fetch Legal Details'}
                </button>
              </div>
            </div>
          )}

          {/* ── STEP 4: GST Auto-Fetch Confirmation ────────────────────────── */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-[#1F8F4E]">
                  <FiCheckCircle className="w-6 h-6" />
                  <h2 className="font-heading font-bold text-2xl text-[#17211B]">Step 4: GSTIN Verified</h2>
                </div>
                <p className="text-xs text-[#5F6F65]">The following statutory records were auto-fetched and validated from the GST portal.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-5 rounded-2xl bg-[#ECF8F1] border border-[#DDE8E1] text-xs">
                <div>
                  <span className="text-[#5F6F65] block">Verified Legal Name</span>
                  <span className="font-bold text-[#17211B] text-sm">{formData.gst_legal_name || 'SOLAR ENTERPRISES PVT LTD'}</span>
                </div>
                <div>
                  <span className="text-[#5F6F65] block">Trade Name</span>
                  <span className="font-bold text-[#17211B] text-sm">{formData.gst_trade_name || formData.gst_legal_name}</span>
                </div>
                <div>
                  <span className="text-[#5F6F65] block">GSTIN</span>
                  <span className="font-mono font-bold text-[#1F8F4E]">{formData.gst_number || '24AAACC1206D1ZM'}</span>
                </div>
                <div>
                  <span className="text-[#5F6F65] block">GST Status</span>
                  <span className="font-bold text-[#1F8F4E]">ACTIVE - Regular Taxpayer</span>
                </div>
                <div className="sm:col-span-2 pt-2 border-t border-[#DDE8E1]">
                  <span className="text-[#5F6F65] block">Principal Place of Business</span>
                  <span className="font-medium text-[#17211B]">{formData.gst_address || '101, Solar Hub Commercial Complex, Ahmedabad, Gujarat'}</span>
                </div>
              </div>
            </div>
          )}

          {/* ── STEP 5: PAN Identity ───────────────────────────────────────── */}
          {currentStep === 5 && (
            <div className="space-y-6">
              <div className="space-y-1">
                <h2 className="font-heading font-bold text-2xl text-[#17211B]">Step 5: Business PAN Identity</h2>
                <p className="text-xs text-[#5F6F65]">Confirm company Permanent Account Number for statutory TDS & billing.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-lg">
                <div>
                  <label className="text-xs font-semibold text-[#17211B] block mb-1.5">Business PAN Number *</label>
                  <input
                    type="text"
                    maxLength={10}
                    value={formData.pan_number || formData.gst_number.substring(2, 12)}
                    onChange={(e) => setFormData({ ...formData, pan_number: e.target.value.toUpperCase() })}
                    placeholder="AAACC1206D"
                    className="w-full px-4 py-3 rounded-xl bg-[#F7FAF8] border border-[#DDE8E1] text-sm font-mono uppercase font-bold text-[#17211B] focus:border-[#1F8F4E] focus:outline-none focus:bg-[#FFFFFF]"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-[#17211B] block mb-1.5">Name as per PAN *</label>
                  <input
                    type="text"
                    value={formData.pan_holder_name || formData.gst_legal_name}
                    onChange={(e) => setFormData({ ...formData, pan_holder_name: e.target.value })}
                    placeholder="Enter name on PAN Card"
                    className="w-full px-4 py-3 rounded-xl bg-[#F7FAF8] border border-[#DDE8E1] text-xs text-[#17211B] focus:border-[#1F8F4E] focus:outline-none focus:bg-[#FFFFFF]"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ── STEP 6: Operating State ────────────────────────────────────── */}
          {currentStep === 6 && (
            <div className="space-y-6">
              <div className="space-y-1">
                <h2 className="font-heading font-bold text-2xl text-[#17211B]">Step 6: Target Operating State</h2>
                <p className="text-xs text-[#5F6F65]">Select the primary state where your commercial warehouse is located.</p>
              </div>

              <div className="max-w-md">
                <label className="text-xs font-semibold text-[#17211B] block mb-1.5">State of Operation *</label>
                <select
                  value={formData.state_id}
                  onChange={(e) => {
                    const st = states.find((s) => (s._id || s.id) === e.target.value);
                    setFormData({ ...formData, state_id: e.target.value, state_name: st?.name || '', district_id: '' });
                  }}
                  className="w-full px-4 py-3.5 rounded-xl bg-[#F7FAF8] border border-[#DDE8E1] text-sm font-semibold text-[#17211B] focus:border-[#1F8F4E] focus:outline-none focus:bg-[#FFFFFF]"
                >
                  <option value="">Select State...</option>
                  {states.map((s) => (
                    <option key={s._id || s.id} value={s._id || s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* ── STEP 7: Revenue District ───────────────────────────────────── */}
          {currentStep === 7 && (
            <div className="space-y-6">
              <div className="space-y-1">
                <h2 className="font-heading font-bold text-2xl text-[#17211B]">Step 7: Exclusive Revenue District</h2>
                <p className="text-xs text-[#5F6F65]">Select your target territory district to lock exclusive dealership rights.</p>
              </div>

              <div className="max-w-md">
                <label className="text-xs font-semibold text-[#17211B] block mb-1.5">Revenue District *</label>
                <select
                  value={formData.district_id}
                  onChange={(e) => {
                    const dst = districts.find((d) => (d._id || d.id) === e.target.value);
                    setFormData({ ...formData, district_id: e.target.value, district_name: dst?.name || '' });
                  }}
                  className="w-full px-4 py-3.5 rounded-xl bg-[#F7FAF8] border border-[#DDE8E1] text-sm font-semibold text-[#17211B] focus:border-[#1F8F4E] focus:outline-none focus:bg-[#FFFFFF]"
                >
                  <option value="">Select District...</option>
                  {districts.map((d) => (
                    <option key={d._id || d.id} value={d._id || d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>

                <div className="p-3.5 mt-4 rounded-xl bg-[#ECF8F1] border border-[#DDE8E1] text-xs text-[#1F8F4E] flex items-center gap-2">
                  <FiShield className="w-5 h-5 shrink-0" />
                  <span>Territory is currently open for exclusive distributor assignment.</span>
                </div>
              </div>
            </div>
          )}

          {/* ── STEP 8: Warehouse Address ──────────────────────────────────── */}
          {currentStep === 8 && (
            <div className="space-y-6">
              <div className="space-y-1">
                <h2 className="font-heading font-bold text-2xl text-[#17211B]">Step 8: Warehouse / Shop Physical Location</h2>
                <p className="text-xs text-[#5F6F65]">Provide the commercial address for freight deliveries and local dealer pickup.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="text-xs font-semibold text-[#17211B] block mb-1.5">Warehouse Address Line *</label>
                  <input
                    type="text"
                    value={formData.warehouse_address_line}
                    onChange={(e) => setFormData({ ...formData, warehouse_address_line: e.target.value })}
                    placeholder="Plot No, Industrial Estate, Main Road"
                    className="w-full px-4 py-3 rounded-xl bg-[#F7FAF8] border border-[#DDE8E1] text-xs text-[#17211B] focus:border-[#1F8F4E] focus:outline-none focus:bg-[#FFFFFF]"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-[#17211B] block mb-1.5">City / Town *</label>
                  <input
                    type="text"
                    value={formData.warehouse_city}
                    onChange={(e) => setFormData({ ...formData, warehouse_city: e.target.value })}
                    placeholder="Enter city"
                    className="w-full px-4 py-3 rounded-xl bg-[#F7FAF8] border border-[#DDE8E1] text-xs text-[#17211B] focus:border-[#1F8F4E] focus:outline-none focus:bg-[#FFFFFF]"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-[#17211B] block mb-1.5">PIN Code *</label>
                  <input
                    type="text"
                    maxLength={6}
                    value={formData.warehouse_pincode}
                    onChange={(e) => setFormData({ ...formData, warehouse_pincode: e.target.value })}
                    placeholder="380001"
                    className="w-full px-4 py-3 rounded-xl bg-[#F7FAF8] border border-[#DDE8E1] text-xs font-mono text-[#17211B] focus:border-[#1F8F4E] focus:outline-none focus:bg-[#FFFFFF]"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ── STEP 9: Storage Capacity & Logistics Profile ───────────────── */}
          {currentStep === 9 && (
            <div className="space-y-6">
              <div className="space-y-1">
                <h2 className="font-heading font-bold text-2xl text-[#17211B]">Step 9: Storage & Logistics Capacity</h2>
                <p className="text-xs text-[#5F6F65]">Specify covered storage capacity and heavy transport vehicle access.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-[#17211B] block mb-1.5">Covered Storage Area (Sq. Ft.) *</label>
                  <select
                    value={formData.storage_area_sqft}
                    onChange={(e) => setFormData({ ...formData, storage_area_sqft: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-[#F7FAF8] border border-[#DDE8E1] text-xs text-[#17211B] focus:border-[#1F8F4E] focus:outline-none focus:bg-[#FFFFFF]"
                  >
                    <option value="1000-2500">1,000 – 2,500 Sq. Ft.</option>
                    <option value="2500-5000">2,500 – 5,000 Sq. Ft.</option>
                    <option value="5000-10000">5,000 – 10,000 Sq. Ft.</option>
                    <option value="10000+">10,000+ Sq. Ft. (Regional Master Hub)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-[#17211B] block mb-1.5">Freight Truck Access *</label>
                  <select
                    value={formData.truck_accessibility}
                    onChange={(e) => setFormData({ ...formData, truck_accessibility: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-[#F7FAF8] border border-[#DDE8E1] text-xs text-[#17211B] focus:border-[#1F8F4E] focus:outline-none focus:bg-[#FFFFFF]"
                  >
                    <option value="Heavy Multi-Axle Vehicle Accessible">Heavy Multi-Axle Container Accessible</option>
                    <option value="10-Tonner Truck Accessible">10-Tonner Truck Accessible</option>
                    <option value="Medium LCV Accessible">Medium Commercial Vehicle (LCV)</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* ── STEP 10: Authorized Signatory ──────────────────────────────── */}
          {currentStep === 10 && (
            <div className="space-y-6">
              <div className="space-y-1">
                <h2 className="font-heading font-bold text-2xl text-[#17211B]">Step 10: Authorized Signatory</h2>
                <p className="text-xs text-[#5F6F65]">Enter details of the primary director or partner authorized to sign legal agreements.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-[#17211B] block mb-1.5">Full Name *</label>
                  <input
                    type="text"
                    value={formData.auth_name}
                    onChange={(e) => setFormData({ ...formData, auth_name: e.target.value })}
                    placeholder="Enter signatory name"
                    className="w-full px-4 py-3 rounded-xl bg-[#F7FAF8] border border-[#DDE8E1] text-xs text-[#17211B] focus:border-[#1F8F4E] focus:outline-none focus:bg-[#FFFFFF]"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-[#17211B] block mb-1.5">Designation *</label>
                  <input
                    type="text"
                    value={formData.auth_designation}
                    onChange={(e) => setFormData({ ...formData, auth_designation: e.target.value })}
                    placeholder="e.g. Managing Director"
                    className="w-full px-4 py-3 rounded-xl bg-[#F7FAF8] border border-[#DDE8E1] text-xs text-[#17211B] focus:border-[#1F8F4E] focus:outline-none focus:bg-[#FFFFFF]"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-[#17211B] block mb-1.5">Direct Mobile *</label>
                  <input
                    type="tel"
                    value={formData.auth_mobile}
                    onChange={(e) => setFormData({ ...formData, auth_mobile: e.target.value })}
                    placeholder="9876543210"
                    className="w-full px-4 py-3 rounded-xl bg-[#F7FAF8] border border-[#DDE8E1] text-xs text-[#17211B] focus:border-[#1F8F4E] focus:outline-none focus:bg-[#FFFFFF]"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-[#17211B] block mb-1.5">Signatory Email *</label>
                  <input
                    type="email"
                    value={formData.auth_email}
                    onChange={(e) => setFormData({ ...formData, auth_email: e.target.value })}
                    placeholder="director@company.com"
                    className="w-full px-4 py-3 rounded-xl bg-[#F7FAF8] border border-[#DDE8E1] text-xs text-[#17211B] focus:border-[#1F8F4E] focus:outline-none focus:bg-[#FFFFFF]"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ── STEP 11: KYC Document Uploads ──────────────────────────────── */}
          {currentStep === 11 && (
            <div className="space-y-6">
              <div className="space-y-1">
                <h2 className="font-heading font-bold text-2xl text-[#17211B]">Step 11: KYC Document Uploads</h2>
                <p className="text-xs text-[#5F6F65]">Upload statutory business documents. Files are stored with private encryption.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { id: 'gst_certificate', name: 'GST Registration Certificate' },
                  { id: 'pan_card', name: 'Company / Proprietor PAN Card' },
                  { id: 'cancelled_cheque', name: 'Bank Proof / Cancelled Cheque' },
                  { id: 'shop_photo', name: 'Warehouse / Office Exterior Photo' },
                ].map((doc) => {
                  const uploaded = formData.kyc_docs[doc.id];
                  return (
                    <div
                      key={doc.id}
                      className={`p-5 rounded-2xl border transition-all flex flex-col justify-between ${
                        uploaded
                          ? 'bg-[#ECF8F1] border-[#DDE8E1]'
                          : 'bg-[#F7FAF8] border-[#DDE8E1] hover:border-[#1F8F4E]'
                      }`}
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <FiFileText className={`w-5 h-5 ${uploaded ? 'text-[#1F8F4E]' : 'text-[#5F6F65]'}`} />
                          {uploaded && (
                            <span className="text-[10px] font-bold text-[#1F8F4E] bg-[#ECF8F1] border border-[#DDE8E1] px-2 py-0.5 rounded">
                              Uploaded
                            </span>
                          )}
                        </div>
                        <h4 className="font-heading font-bold text-sm text-[#17211B]">{doc.name}</h4>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleKycUpload(doc.id)}
                        disabled={saving}
                        className={`mt-4 w-full py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors ${
                          uploaded
                            ? 'bg-[#FFFFFF] text-[#1F8F4E] border border-[#DDE8E1]'
                            : 'bg-[#1F8F4E] hover:bg-[#18733E] text-white'
                        }`}
                      >
                        <FiUploadCloud className="w-3.5 h-3.5" />
                        {uploaded ? 'Re-upload Document' : 'Upload PDF / Image'}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── STEP 12: Bank & Settlement ─────────────────────────────────── */}
          {currentStep === 12 && (
            <div className="space-y-6">
              <div className="space-y-1">
                <h2 className="font-heading font-bold text-2xl text-[#17211B]">Step 12: Bank & Settlement Details</h2>
                <p className="text-xs text-[#5F6F65]">Provide bank account details for distributor margin payouts and refund settlements.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-[#17211B] block mb-1.5">Account Number *</label>
                  <input
                    type="text"
                    value={formData.bank_account_number}
                    onChange={(e) => setFormData({ ...formData, bank_account_number: e.target.value })}
                    placeholder="Enter bank account number"
                    className="w-full px-4 py-3 rounded-xl bg-[#F7FAF8] border border-[#DDE8E1] text-xs font-mono text-[#17211B] focus:border-[#1F8F4E] focus:outline-none focus:bg-[#FFFFFF]"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-[#17211B] block mb-1.5">IFSC Code *</label>
                  <input
                    type="text"
                    maxLength={11}
                    value={formData.bank_ifsc}
                    onChange={(e) => setFormData({ ...formData, bank_ifsc: e.target.value.toUpperCase() })}
                    placeholder="HDFC0001234"
                    className="w-full px-4 py-3 rounded-xl bg-[#F7FAF8] border border-[#DDE8E1] text-xs font-mono uppercase text-[#17211B] focus:border-[#1F8F4E] focus:outline-none focus:bg-[#FFFFFF]"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-[#17211B] block mb-1.5">Bank Name *</label>
                  <input
                    type="text"
                    value={formData.bank_name}
                    onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
                    placeholder="e.g. HDFC Bank Ltd"
                    className="w-full px-4 py-3 rounded-xl bg-[#F7FAF8] border border-[#DDE8E1] text-xs text-[#17211B] focus:border-[#1F8F4E] focus:outline-none focus:bg-[#FFFFFF]"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-[#17211B] block mb-1.5">Beneficiary Account Name *</label>
                  <input
                    type="text"
                    value={formData.account_holder_name || formData.gst_legal_name}
                    onChange={(e) => setFormData({ ...formData, account_holder_name: e.target.value })}
                    placeholder="Company name on bank record"
                    className="w-full px-4 py-3 rounded-xl bg-[#F7FAF8] border border-[#DDE8E1] text-xs text-[#17211B] focus:border-[#1F8F4E] focus:outline-none focus:bg-[#FFFFFF]"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ── STEP 13: Distributor Plan ────────────────────────────────────── */}
          {currentStep === 13 && (
            <div className="space-y-6">
              <div className="space-y-1">
                <h2 className="font-heading font-bold text-2xl text-[#17211B]">Step 13: Distributor Tier Plan Selection</h2>
                <p className="text-xs text-[#5F6F65]">Confirm your territorial scale and dealer allowance tier.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {plans.map((p) => {
                  const isSelected = formData.selected_plan_code === p.plan_code;
                  return (
                    <div
                      key={p.id || p.plan_code}
                      onClick={() => setFormData({ ...formData, selected_plan_code: p.plan_code })}
                      className={`p-5 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between ${
                        isSelected
                          ? 'bg-[#ECF8F1] border-[#1F8F4E] shadow-md'
                          : 'bg-[#F7FAF8] border-[#DDE8E1] hover:border-[#1F8F4E]'
                      }`}
                    >
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="font-heading font-bold text-sm text-[#17211B]">{p.name}</h4>
                          {isSelected && <FiCheckCircle className="w-5 h-5 text-[#1F8F4E]" />}
                        </div>
                        <div className="font-heading font-black text-xl text-[#1F8F4E]">
                          ₹{(p.joining_fee_inr || 25000).toLocaleString('en-IN')}
                        </div>
                        <p className="text-[11px] text-[#5F6F65]">{p.description}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── STEP 14: Dealer Network Projection ─────────────────────────── */}
          {currentStep === 14 && (
            <div className="space-y-6">
              <div className="space-y-1">
                <h2 className="font-heading font-bold text-2xl text-[#17211B]">Step 14: Sub-Dealer Projections</h2>
                <p className="text-xs text-[#5F6F65]">Estimate your district network capacity to optimize factory inventory reservations.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-[#17211B] block mb-1.5">Projected Local Dealer Network *</label>
                  <select
                    value={formData.projected_dealers}
                    onChange={(e) => setFormData({ ...formData, projected_dealers: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-[#F7FAF8] border border-[#DDE8E1] text-xs text-[#17211B] focus:border-[#1F8F4E] focus:outline-none focus:bg-[#FFFFFF]"
                  >
                    <option value="5-15 Dealers">5 – 15 Local Dealers</option>
                    <option value="15-30 Dealers">15 – 30 Local Dealers</option>
                    <option value="30-50 Dealers">30 – 50 Local Dealers</option>
                    <option value="50+ Dealers">50+ Local Dealers (State Master)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-[#17211B] block mb-1.5">Estimated Monthly Sizing (kW) *</label>
                  <select
                    value={formData.projected_monthly_kw}
                    onChange={(e) => setFormData({ ...formData, projected_monthly_kw: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-[#F7FAF8] border border-[#DDE8E1] text-xs text-[#17211B] focus:border-[#1F8F4E] focus:outline-none focus:bg-[#FFFFFF]"
                  >
                    <option value="25-50 kW">25 – 50 kW per month</option>
                    <option value="50-100 kW">50 – 100 kW per month</option>
                    <option value="100-250 kW">100 – 250 kW per month</option>
                    <option value="250 kW+">250 kW+ per month</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* ── STEP 15: Terms & Agreements ────────────────────────────────── */}
          {currentStep === 15 && (
            <div className="space-y-6">
              <div className="space-y-1">
                <h2 className="font-heading font-bold text-2xl text-[#17211B]">Step 15: Statutory & Territorial Declarations</h2>
                <p className="text-xs text-[#5F6F65]">Please review and accept mandatory distributor compliance declarations.</p>
              </div>

              <div className="space-y-3">
                <label className="p-4 rounded-2xl bg-[#F7FAF8] border border-[#DDE8E1] flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.agree_territorial_terms}
                    onChange={(e) => setFormData({ ...formData, agree_territorial_terms: e.target.checked })}
                    className="mt-0.5 text-[#1F8F4E] focus:ring-[#1F8F4E]"
                  />
                  <div className="text-xs text-[#17211B] leading-relaxed">
                    <strong className="text-[#17211B] block mb-0.5">Territorial Non-Compete & Jurisdiction Clause</strong>
                    I acknowledge that distributor rights are strictly bounded to the approved revenue district. Cross-border territory encroachment is prohibited.
                  </div>
                </label>

                <label className="p-4 rounded-2xl bg-[#F7FAF8] border border-[#DDE8E1] flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.agree_statutory_gst}
                    onChange={(e) => setFormData({ ...formData, agree_statutory_gst: e.target.checked })}
                    className="mt-0.5 text-[#1F8F4E] focus:ring-[#1F8F4E]"
                  />
                  <div className="text-xs text-[#17211B] leading-relaxed">
                    <strong className="text-[#17211B] block mb-0.5">GST Compliance & Genuine Equipment Dispatch</strong>
                    All solar equipment procured will be billed under verified GST e-invoices with full statutory input tax credits and genuine warranty backup.
                  </div>
                </label>
              </div>
            </div>
          )}

          {/* ── STEP 16: Pre-Submission Review ─────────────────────────────── */}
          {currentStep === 16 && (
            <div className="space-y-6">
              <div className="space-y-1">
                <h2 className="font-heading font-bold text-2xl text-[#17211B]">Step 16: Comprehensive Pre-Submit Audit</h2>
                <p className="text-xs text-[#5F6F65]">Review your complete dossier before handing off to the onboarding director.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-4 rounded-2xl bg-[#F7FAF8] border border-[#DDE8E1] space-y-1">
                  <span className="text-[#5F6F65] block">Distributor Entity</span>
                  <span className="font-bold text-[#17211B]">{formData.gst_legal_name || formData.business_name}</span>
                  <span className="text-[#5F6F65] block">GSTIN: {formData.gst_number}</span>
                </div>
                <div className="p-4 rounded-2xl bg-[#F7FAF8] border border-[#DDE8E1] space-y-1">
                  <span className="text-[#5F6F65] block">Assigned Territory</span>
                  <span className="font-bold text-[#1F8F4E]">{formData.district_name || 'Ahmedabad'}, {formData.state_name || 'Gujarat'}</span>
                  <span className="text-[#5F6F65] block">Plan: {formData.selected_plan_code}</span>
                </div>
                <div className="p-4 rounded-2xl bg-[#F7FAF8] border border-[#DDE8E1] space-y-1">
                  <span className="text-[#5F6F65] block">Authorized Person</span>
                  <span className="font-bold text-[#17211B]">{formData.auth_name} ({formData.auth_designation})</span>
                  <span className="text-[#5F6F65] block">Mobile: {formData.auth_mobile}</span>
                </div>
                <div className="p-4 rounded-2xl bg-[#F7FAF8] border border-[#DDE8E1] space-y-1">
                  <span className="text-[#5F6F65] block">Bank Settlement</span>
                  <span className="font-bold text-[#17211B]">{formData.bank_name || 'HDFC Bank'}</span>
                  <span className="font-mono text-[#5F6F65] block">IFSC: {formData.bank_ifsc || 'HDFC0001234'}</span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleFinalSubmit}
                disabled={saving}
                className="w-full py-4 rounded-2xl text-sm font-bold bg-[#1F8F4E] text-white hover:bg-[#18733E] shadow-md flex items-center justify-center gap-2"
              >
                <FiShield className="w-5 h-5" />
                {saving ? 'Submitting Application...' : 'Submit Application for Review'}
              </button>
            </div>
          )}

          {/* ── STEP 17: Final Confirmation ────────────────────────────────── */}
          {currentStep === 17 && (
            <div className="text-center py-12 space-y-6">
              <div className="w-16 h-16 rounded-full bg-[#ECF8F1] border-2 border-[#1F8F4E] flex items-center justify-center text-[#1F8F4E] mx-auto">
                <FiCheckCircle className="w-8 h-8" />
              </div>

              <div className="space-y-2">
                <h2 className="font-heading font-black text-3xl text-[#17211B]">
                  Application Submitted Successfully!
                </h2>
                <p className="text-xs sm:text-sm text-[#5F6F65] max-w-md mx-auto">
                  Your distributor dossier is now under review by our regional onboarding committee. You will receive an SMS and email notification upon approval.
                </p>
              </div>

              <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link
                  to="/application/status"
                  className="px-6 py-3 rounded-xl text-xs font-bold bg-[#1F8F4E] text-white hover:bg-[#18733E] shadow-xs flex items-center gap-2"
                >
                  Track Review Status <FiArrowRight />
                </Link>
                <Link
                  to="/products"
                  className="px-6 py-3 rounded-xl text-xs font-semibold bg-[#F7FAF8] text-[#17211B] hover:bg-[#ECF8F1] border border-[#DDE8E1]"
                >
                  Explore Equipment Catalogue
                </Link>
              </div>
            </div>
          )}

          {/* Navigation Controls (Steps 1 - 15) */}
          {currentStep < 16 && (
            <div className="pt-6 border-t border-[#DDE8E1] flex items-center justify-between">
              <button
                type="button"
                onClick={goBack}
                disabled={currentStep === 1}
                className="px-5 py-2.5 rounded-xl text-xs font-semibold bg-[#F7FAF8] hover:bg-[#ECF8F1] text-[#5F6F65] hover:text-[#17211B] border border-[#DDE8E1] flex items-center gap-2 disabled:opacity-30"
              >
                <FiArrowLeft className="w-4 h-4" /> Previous Step
              </button>

              <button
                type="button"
                onClick={goNext}
                disabled={saving}
                className="px-6 py-2.5 rounded-xl text-xs font-bold bg-[#1F8F4E] hover:bg-[#18733E] text-white shadow-xs flex items-center gap-2 disabled:opacity-50"
              >
                Save & Continue <FiArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

        </div>

      </div>

    </div>
  );
}
