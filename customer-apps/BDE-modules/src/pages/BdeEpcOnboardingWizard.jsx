import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  ShieldCheck,
  Building2,
  CheckCircle2,
  AlertCircle,
  RotateCw,
  Search,
  Store,
  MapPin,
  Phone,
  Mail,
  ArrowRight,
  ArrowLeft,
  UserCheck,
  Sparkles,
  Link2,
  Lock,
  FileCheck,
  Check,
  AlertTriangle,
} from 'lucide-react';
import api from '../services/api';

const GSTIN_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;

export default function BdeEpcOnboardingWizard() {
  const location = useLocation();
  const navigate = useNavigate();
  const initialLead = location.state?.lead || null;

  const [step, setStep] = useState(1); // 1 = GST Verify, 2 = EPC Details, 3 = Franchisee Assignment, 4 = Success

  // Step 1: GST Verification State
  const [gstInput, setGstInput] = useState(initialLead?.gst_number || '');
  const [verifyingGst, setVerifyingGst] = useState(false);
  const [gstError, setGstError] = useState('');
  const [gstResult, setGstResult] = useState(null);

  // Step 2: EPC Account Details
  const [formData, setFormData] = useState({
    lead_id: initialLead?._id || '',
    company_name: initialLead?.company_name || '',
    contact_person: initialLead?.contact_person || '',
    mobile: initialLead?.mobile_number || '',
    email: initialLead?.email || '',
    password: '',
    address: initialLead?.address_line || '',
    state_name: initialLead?.state_name || 'Maharashtra',
    district_name: initialLead?.district_name || 'Pune',
    pincode: initialLead?.pincode || '',
  });
  const [onboardingLoading, setOnboardingLoading] = useState(false);
  const [createdEpcAccount, setCreatedEpcAccount] = useState(null);

  // Step 3: Franchisee Assignment State
  const [eligibleFranchisees, setEligibleFranchisees] = useState([]);
  const [loadingFranchisees, setLoadingFranchisees] = useState(false);
  const [franchiseeSearch, setFranchiseeSearch] = useState('');
  const [selectedFranchisee, setSelectedFranchisee] = useState(null);
  const [assignmentLoading, setAssignmentLoading] = useState(false);
  const [assignmentResult, setAssignmentResult] = useState(null);

  // ── Step 1: Verify GSTIN ──
  const handleVerifyGst = async (e) => {
    if (e) e.preventDefault();
    const cleanGst = gstInput.trim().toUpperCase();
    setGstError('');

    if (!cleanGst) {
      setGstError('Please enter a valid GST number');
      return;
    }
    if (!GSTIN_REGEX.test(cleanGst)) {
      setGstError('Invalid GSTIN format. Example: 27ABCDE1234F1Z5');
      return;
    }

    setVerifyingGst(true);
    try {
      const res = await api.post('/epc/verify-gst', {
        gstin: cleanGst,
        lead_id: initialLead?._id || undefined,
      });

      if (res.data?.status === 'success') {
        const d = res.data.data;
        setGstResult(d);
        setSelectedFranchisee(d.matched_franchisee || null);
        setFormData((prev) => ({
          ...prev,
          company_name: d.legal_name || d.trade_name || prev.company_name,
          state_name: d.state_name || prev.state_name,
          district_name: d.district_name || prev.district_name,
          address: d.address || prev.address,
          pincode: d.pincode || prev.pincode,
        }));
        setStep(2);
      } else {
        setGstError(res.data?.message || 'GST verification failed');
      }
    } catch (err) {
      setGstError(err.response?.data?.message || 'Could not verify GSTIN. Duplicate registration or invalid credentials.');
    } finally {
      setVerifyingGst(false);
    }
  };

  // ── Step 2: Proceed to Assignment Review ──
  const handleProceedToAssignment = (e) => {
    e.preventDefault();
    setStep(3);
  };

  // ── Step 3: Submit EPC Onboarding for Admin Approval ──
  const handleSubmitEpcForApproval = async () => {
    setOnboardingLoading(true);
    try {
      const res = await api.post('/epc/onboard-with-gst', {
        ...formData,
        gstin: gstResult?.gstin || gstInput.trim().toUpperCase(),
        reseller_id: selectedFranchisee?.id || undefined,
      });

      if (res.data?.status === 'success') {
        setCreatedEpcAccount(res.data.data);
        setStep(4);

        // Notify Admin Panel & other listening tabs
        try {
          if (typeof BroadcastChannel !== 'undefined') {
            const channel = new BroadcastChannel('epc_registration_channel');
            channel.postMessage({ type: 'NEW_REGISTRATION', request: res.data.data });
            channel.close();
          }
        } catch (bcErr) {}
      } else {
        alert(res.data?.message || 'Failed to submit EPC onboarding');
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to submit EPC onboarding');
    } finally {
      setOnboardingLoading(false);
    }
  };

  const handleResetWizard = () => {
    setStep(1);
    setGstInput('');
    setGstResult(null);
    setSelectedFranchisee(null);
    setCreatedEpcAccount(null);
    setFormData({
      lead_id: '',
      company_name: '',
      contact_person: '',
      mobile: '',
      email: '',
      password: '',
      address: '',
      state_name: 'Gujarat',
      district_name: 'Ahmedabad',
      pincode: '',
    });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 text-[11px] font-bold rounded-full uppercase flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" /> GST Verification Journey
            </span>
            {initialLead && (
              <span className="text-xs font-semibold text-slate-500 font-mono">
                Attributed Lead: {initialLead.lead_id}
              </span>
            )}
          </div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 mt-1">
            EPC Onboarding & Franchisee Assignment
          </h1>
          <p className="text-xs text-slate-500">
            Verify contractor GSTIN, fetch company details, auto-detect district, and assign to an operational franchisee.
          </p>
        </div>

        <button
          onClick={() => navigate('/epc-leads')}
          className="px-4 py-2 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl text-xs hover:bg-slate-50 transition self-start sm:self-auto flex items-center gap-1.5"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Leads
        </button>
      </div>

      {/* 4-Step Progress Indicator */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
        <div className="flex items-center justify-between">
          {/* Step 1 */}
          <div className="flex items-center gap-3">
            <div
              className={`w-9 h-9 rounded-2xl flex items-center justify-center font-black text-xs transition ${
                step >= 1 ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20' : 'bg-slate-100 text-slate-400'
              }`}
            >
              1
            </div>
            <div className="hidden sm:block">
              <span className="text-xs font-bold text-slate-800 block">GST Verification</span>
              <span className="text-[10px] text-slate-400">Validate & Duplicate check</span>
            </div>
          </div>

          <div className={`flex-1 h-0.5 mx-3 ${step >= 2 ? 'bg-blue-600' : 'bg-slate-200'}`} />

          {/* Step 2 */}
          <div className="flex items-center gap-3">
            <div
              className={`w-9 h-9 rounded-2xl flex items-center justify-center font-black text-xs transition ${
                step >= 2 ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20' : 'bg-slate-100 text-slate-400'
              }`}
            >
              2
            </div>
            <div className="hidden sm:block">
              <span className="text-xs font-bold text-slate-800 block">Company Confirmation</span>
              <span className="text-[10px] text-slate-400">Contact & account setup</span>
            </div>
          </div>

          <div className={`flex-1 h-0.5 mx-3 ${step >= 3 ? 'bg-blue-600' : 'bg-slate-200'}`} />

          {/* Step 3 */}
          <div className="flex items-center gap-3">
            <div
              className={`w-9 h-9 rounded-2xl flex items-center justify-center font-black text-xs transition ${
                step >= 3 ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20' : 'bg-slate-100 text-slate-400'
              }`}
            >
              3
            </div>
            <div className="hidden sm:block">
              <span className="text-xs font-bold text-slate-800 block">District Match</span>
              <span className="text-[10px] text-slate-400">Auto-assign & review</span>
            </div>
          </div>

          <div className={`flex-1 h-0.5 mx-3 ${step >= 4 ? 'bg-emerald-600' : 'bg-slate-200'}`} />

          {/* Step 4 */}
          <div className="flex items-center gap-3">
            <div
              className={`w-9 h-9 rounded-2xl flex items-center justify-center font-black text-xs transition ${
                step >= 4 ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20' : 'bg-slate-100 text-slate-400'
              }`}
            >
              <Check className="w-4 h-4" />
            </div>
            <div className="hidden sm:block">
              <span className="text-xs font-bold text-slate-800 block">Submitted</span>
              <span className="text-[10px] text-slate-400">Pending Admin Approval</span>
            </div>
          </div>
        </div>
      </div>

      {/* STEP 1: GST NUMBER ENTRY & VERIFICATION */}
      {step === 1 && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="space-y-1">
              <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-blue-600" /> Enter EPC Contractor GST Number
              </h2>
              <p className="text-xs text-slate-500">
                The system will perform live Quick eKYC GST validation, fetch verified company trade name and registered address, and ensure duplicate prevention.
              </p>
            </div>
            <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-black uppercase tracking-wider self-start sm:self-auto flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Quick eKYC Engine
            </span>
          </div>

          <form onSubmit={handleVerifyGst} className="space-y-4 max-w-xl">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                15-Character GSTIN Number *
              </label>
              <div className="relative">
                <input
                  type="text"
                  maxLength={15}
                  value={gstInput}
                  onChange={(e) => setGstInput(e.target.value.toUpperCase())}
                  placeholder="e.g. 24ABDCS5798J1ZR"
                  className="w-full bg-slate-50 border border-slate-300 rounded-2xl px-4 py-3.5 text-sm font-mono font-bold tracking-wider text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white uppercase"
                />
                <button
                  type="submit"
                  disabled={verifyingGst || !gstInput.trim()}
                  className="absolute right-2 top-2 bottom-2 px-5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold rounded-xl text-xs transition shadow-md shadow-blue-600/20 flex items-center gap-2"
                >
                  {verifyingGst ? (
                    <>
                      <RotateCw className="w-4 h-4 animate-spin" /> Verifying via Quick eKYC...
                    </>
                  ) : (
                    <>
                      Verify GST <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </div>

            {gstError && (
              <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-700 flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
                <div>
                  <strong className="block font-bold">Verification Notice:</strong>
                  <span>{gstError}</span>
                </div>
              </div>
            )}

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2 text-xs text-slate-600">
              <strong className="block font-bold text-slate-800">Quick eKYC Validation Rules:</strong>
              <ul className="list-disc pl-4 space-y-1">
                <li>Live verification directly with Government Taxpayer Registry via Quick eKYC API.</li>
                <li>Extracts state code, registered territory, and official legal name.</li>
                <li>Guarantees strict single EPC registration — prevents duplicate accounts.</li>
              </ul>
            </div>
          </form>
        </div>
      )}

      {/* STEP 2: CONFIRM FETCHED DETAILS & ACCOUNT SETUP */}
      {step === 2 && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[11px] font-bold text-emerald-600 uppercase flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Verified with Quick eKYC: {gstResult?.gstin}
              </span>
              <h2 className="text-lg font-black text-slate-900">Confirm Company & Contact Details</h2>
            </div>
            <button
              onClick={() => setStep(1)}
              className="text-xs font-bold text-slate-500 hover:text-slate-800"
            >
              Re-enter GST
            </button>
          </div>

          {/* Quick eKYC Verified Details Snapshot Pill Card */}
          <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-2xl grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div>
              <span className="text-[10px] uppercase font-bold text-emerald-800 block">Verified Trade Name</span>
              <span className="font-bold text-slate-900">{gstResult?.trade_name || gstResult?.company_name || formData.company_name}</span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-emerald-800 block">Legal Entity Name</span>
              <span className="font-bold text-slate-900">{gstResult?.legal_name || 'Registered Taxpayer'}</span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-emerald-800 block">State & District Jurisdiction</span>
              <span className="font-bold text-slate-900">{formData.state_name} ({formData.district_name})</span>
            </div>
          </div>

          <form onSubmit={handleProceedToAssignment} className="space-y-5 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Company Trade / Legal Name *</label>
                <input
                  type="text"
                  required
                  value={formData.company_name}
                  onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-800 font-bold focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Contact Person Name *</label>
                <input
                  type="text"
                  required
                  value={formData.contact_person}
                  onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-800 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Mobile / WhatsApp Number *</label>
                <input
                  type="tel"
                  required
                  value={formData.mobile}
                  onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-800 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Email Address *</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-800 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Registered State *</label>
                <input
                  type="text"
                  required
                  value={formData.state_name}
                  onChange={(e) => setFormData({ ...formData, state_name: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-800 font-bold focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Registered District *</label>
                <input
                  type="text"
                  required
                  value={formData.district_name}
                  onChange={(e) => setFormData({ ...formData, district_name: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-800 font-bold focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block font-bold text-slate-700 mb-1">Registered Office Address</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-800 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Set Portal Password (Optional)</label>
                <input
                  type="text"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Defaults to: SolarEPC@2026"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-800 focus:outline-none focus:border-blue-500 font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Pincode</label>
                <input
                  type="text"
                  value={formData.pincode}
                  onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-800 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl font-bold hover:bg-slate-50"
              >
                Back
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md shadow-blue-600/20 flex items-center gap-2"
              >
                Confirm & Review District Assignment <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        </div>
      )}

      {/* STEP 3: AUTOMATIC DISTRICT FRANCHISEE MATCH OR DIRECT STORE ROUTING */}
      {step === 3 && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="space-y-1">
              <span className="text-[11px] font-bold text-blue-600 uppercase flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-blue-600" /> Auto-Territory Assignment
              </span>
              <h2 className="text-lg font-black text-slate-900">
                District Franchisee Assignment & Request Submission
              </h2>
              <p className="text-xs text-slate-500">
                EPC registered district: <strong className="text-slate-800 font-semibold">{formData.district_name}, {formData.state_name}</strong>
              </p>
            </div>
            <button
              onClick={() => setStep(2)}
              className="text-xs font-bold text-slate-500 hover:text-slate-800 flex items-center gap-1 self-start sm:self-auto"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Edit Details
            </button>
          </div>

          {/* Franchisee Matched Scenario */}
          {selectedFranchisee ? (
            <div className="space-y-4">
              <div className="p-5 bg-gradient-to-r from-emerald-50/80 to-teal-50/80 rounded-2xl border border-emerald-200 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-600 text-white text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Auto-Matched District Partner
                      </span>
                      <span className="font-mono font-bold text-xs text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                        {selectedFranchisee.reseller_code || 'FRANCHISE'}
                      </span>
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-200/60 px-2 py-0.5 rounded-full">
                        District: {formData.district_name}
                      </span>
                    </div>
                    <h3 className="text-base font-black text-slate-900">
                      {selectedFranchisee.business_name}
                    </h3>
                  </div>

                  <div className="text-left sm:text-right">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Operating Jurisdiction</span>
                    <span className="text-xs font-bold text-emerald-800">{formData.district_name}, {formData.state_name}</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-emerald-200/60 text-xs">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-500 block">Contact Person</span>
                    <span className="font-semibold text-slate-800">{selectedFranchisee.contact_person || 'Authorized Representative'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-500 block">Contact Mobile</span>
                    <span className="font-semibold text-slate-800">{selectedFranchisee.mobile || '-'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-500 block">GST Number</span>
                    <span className="font-mono font-semibold text-slate-800">{selectedFranchisee.gst_number || 'Registered'}</span>
                  </div>
                </div>
              </div>

              {/* Notice Pill */}
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-2xl flex items-start gap-3 text-xs text-blue-800">
                <ShieldCheck className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-bold">Automatic Admin Approval Routing</p>
                  <p className="text-[11px] text-blue-700">
                    Once submitted, a formal approval request will be dispatched to the Admin Panel at{' '}
                    <span className="font-mono font-bold">/admin-panel/solar-shop/india/approve-new-epc</span> notifying that BDE{' '}
                    is onboarding this EPC and assigning them to <strong>{selectedFranchisee.business_name}</strong>.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            /* No Franchisee in District Scenario -> Direct Store Access */
            <div className="space-y-4">
              <div className="p-5 bg-gradient-to-r from-blue-50/80 to-indigo-50/80 rounded-2xl border border-blue-200 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-600/20 shrink-0">
                    <Store className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full bg-blue-600 text-white text-[10px] font-bold uppercase tracking-wider">
                        Direct Solar Store Routing
                      </span>
                      <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                        No Franchise in {formData.district_name}
                      </span>
                    </div>
                    <h3 className="text-base font-black text-slate-900 mt-1">
                      Direct Solar Store Contractor Access
                    </h3>
                  </div>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">
                  No operational franchisee partner is registered in district <strong className="text-slate-900">{formData.district_name}</strong>.
                  Upon Admin approval, this EPC will be provisioned with direct Solar Store credentials to place procurement orders directly.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-blue-200/60 text-xs">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-500 block">Territory</span>
                    <span className="font-semibold text-slate-800">{formData.district_name}, {formData.state_name}</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-500 block">Order Fulfillment</span>
                    <span className="font-semibold text-slate-800">Central SolarKits Warehouse / Direct Store</span>
                  </div>
                </div>
              </div>

              {/* Notice Pill */}
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-3 text-xs text-amber-800">
                <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-bold">Direct Store Login Activation Notice</p>
                  <p className="text-[11px] text-amber-700">
                    The request will be sent to the Admin Panel at{' '}
                    <span className="font-mono font-bold">/admin-panel/solar-shop/india/approve-new-epc</span> specifying that no franchise exists in this territory and direct store access should be granted upon approval.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Submission Summary Table */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2 text-xs">
            <div className="flex justify-between py-1 border-b border-slate-200/60">
              <span className="text-slate-500">Contractor Trade Name:</span>
              <span className="font-bold text-slate-900">{formData.company_name}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-200/60">
              <span className="text-slate-500">Contractor GSTIN:</span>
              <span className="font-mono font-bold text-slate-900">{gstResult?.gstin}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-200/60">
              <span className="text-slate-500">Contact Person / Phone:</span>
              <span className="font-semibold text-slate-800">{formData.contact_person} ({formData.mobile})</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-500">Assigned Routing:</span>
              <span className="font-bold text-slate-900">
                {selectedFranchisee ? (
                  <span className="text-emerald-700">Franchise: {selectedFranchisee.business_name}</span>
                ) : (
                  <span className="text-blue-700">Direct Solar Store Access</span>
                )}
              </span>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            <button
              onClick={() => setStep(2)}
              className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl font-bold hover:bg-slate-50 text-xs"
            >
              Back
            </button>
            <button
              onClick={handleSubmitEpcForApproval}
              disabled={onboardingLoading}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold rounded-xl text-xs shadow-md shadow-blue-600/20 flex items-center gap-2"
            >
              {onboardingLoading ? (
                <>
                  <RotateCw className="w-4 h-4 animate-spin" /> Submitting Request to Admin...
                </>
              ) : (
                <>
                  Submit EPC for Admin Approval <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: REQUEST SUBMITTED FOR ADMIN APPROVAL */}
      {step === 4 && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8 text-center space-y-6">
          <div className="w-16 h-16 rounded-3xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto shadow-md shadow-emerald-600/10">
            <CheckCircle2 className="w-9 h-9" />
          </div>

          <div className="space-y-2 max-w-lg mx-auto">
            <span className="px-3 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-black uppercase tracking-wider">
              Pending Admin Approval
            </span>
            <h2 className="text-2xl font-black text-slate-900">
              EPC Onboarding Request Submitted!
            </h2>
            <p className="text-xs text-slate-500">
              Contractor <strong className="text-slate-800">{formData.company_name}</strong> (GST:{' '}
              <strong className="font-mono text-slate-800">{gstResult?.gstin}</strong>) has been onboarded and the approval request is routed to the central Admin Panel.
            </p>
          </div>

          <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 max-w-lg mx-auto text-xs text-left space-y-3">
            <div className="flex justify-between items-center py-1 border-b border-slate-200">
              <span className="text-slate-400 font-bold uppercase text-[10px]">EPC Company:</span>
              <span className="font-bold text-slate-900">{formData.company_name}</span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-slate-200">
              <span className="text-slate-400 font-bold uppercase text-[10px]">Territory Jurisdiction:</span>
              <span className="font-semibold text-slate-900">{formData.district_name}, {formData.state_name}</span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-slate-200">
              <span className="text-slate-400 font-bold uppercase text-[10px]">Assignment Target:</span>
              {selectedFranchisee ? (
                <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  Franchise: {selectedFranchisee.business_name}
                </span>
              ) : (
                <span className="font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                  Direct Solar Store Access
                </span>
              )}
            </div>
            <div className="flex justify-between items-center py-1 border-b border-slate-200">
              <span className="text-slate-400 font-bold uppercase text-[10px]">Admin Approval Desk:</span>
              <span className="font-mono text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                /admin-panel/solar-shop/india/approve-new-epc
              </span>
            </div>
            <div className="flex justify-between items-center py-1">
              <span className="text-slate-400 font-bold uppercase text-[10px]">Current Status:</span>
              <span className="text-amber-600 font-bold flex items-center gap-1.5">
                <RotateCw className="w-3 h-3 animate-spin text-amber-500" /> Awaiting Admin Approval
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              onClick={() => navigate('/epc-leads')}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs transition"
            >
              View EPC Leads Pipeline
            </button>
            <button
              onClick={handleResetWizard}
              className="px-5 py-2.5 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl text-xs hover:bg-slate-50 transition"
            >
              Onboard Another EPC
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
