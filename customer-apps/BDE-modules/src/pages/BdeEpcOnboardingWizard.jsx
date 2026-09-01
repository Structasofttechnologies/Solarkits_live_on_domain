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

  // ── Step 2: Confirm & Create EPC Account ──
  const handleCreateEpcAccount = async (e) => {
    e.preventDefault();
    setOnboardingLoading(true);
    try {
      const res = await api.post('/epc/onboard-with-gst', {
        ...formData,
        gstin: gstResult?.gstin || gstInput.trim().toUpperCase(),
      });

      if (res.data?.status === 'success') {
        setCreatedEpcAccount(res.data.data);
        setStep(3);
        fetchEligibleFranchisees(formData.district_name, formData.state_name);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to onboard EPC');
    } finally {
      setOnboardingLoading(false);
    }
  };

  // ── Step 3: Fetch Eligible Franchisees for District ──
  const fetchEligibleFranchisees = async (district, state) => {
    setLoadingFranchisees(true);
    try {
      const res = await api.get('/epc/eligible-franchisees', {
        params: {
          district_name: district,
          state_name: state,
          search: franchiseeSearch,
        },
      });
      if (res.data?.status === 'success') {
        setEligibleFranchisees(res.data.data || []);
        if (res.data.data?.length > 0) {
          setSelectedFranchisee(res.data.data[0]);
        }
      }
    } catch (err) {
      console.error('Failed to load eligible franchisees', err);
    } finally {
      setLoadingFranchisees(false);
    }
  };

  useEffect(() => {
    if (step === 3 && formData.district_name) {
      fetchEligibleFranchisees(formData.district_name, formData.state_name);
    }
  }, [step, franchiseeSearch]);

  // ── Step 4: Assign Franchise Partner ──
  const handleAssignFranchisee = async () => {
    if (!selectedFranchisee || !createdEpcAccount?.epc_account_id) {
      alert('Please select a franchise partner to assign.');
      return;
    }

    setAssignmentLoading(true);
    try {
      const res = await api.post('/epc/assign-franchisee', {
        epc_account_id: createdEpcAccount.epc_account_id,
        reseller_id: selectedFranchisee.id,
        lead_id: initialLead?._id || undefined,
      });

      if (res.data?.status === 'success') {
        setAssignmentResult(res.data.data);
        setStep(4);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to assign franchisee');
    } finally {
      setAssignmentLoading(false);
    }
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
              <span className="text-xs font-bold text-slate-800 block">Franchisee Assignment</span>
              <span className="text-[10px] text-slate-400">District match & alert</span>
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
              <span className="text-xs font-bold text-slate-800 block">Completed</span>
              <span className="text-[10px] text-slate-400">Ready for orders</span>
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

          <form onSubmit={handleCreateEpcAccount} className="space-y-5 text-xs">
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
                disabled={onboardingLoading}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md shadow-blue-600/20 flex items-center gap-2"
              >
                {onboardingLoading ? (
                  <>
                    <RotateCw className="w-4 h-4 animate-spin" /> Creating EPC Account...
                  </>
                ) : (
                  <>
                    Confirm & Proceed to Franchisee Assignment <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* STEP 3: MATCH & ASSIGN TO FRANCHISEE */}
      {step === 3 && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="space-y-1">
              <span className="text-[11px] font-bold text-teal-600 uppercase flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> EPC Created: {createdEpcAccount?.name}
              </span>
              <h2 className="text-lg font-black text-slate-900">
                Select Franchise Partner for District: {formData.district_name}
              </h2>
            </div>
          </div>

          {/* Search bar */}
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs">
            <Search className="w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={franchiseeSearch}
              onChange={(e) => setFranchiseeSearch(e.target.value)}
              placeholder="Search eligible franchise partners..."
              className="w-full bg-transparent text-slate-800 focus:outline-none placeholder-slate-400"
            />
          </div>

          {/* Franchisee Cards List */}
          <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
            {loadingFranchisees ? (
              <div className="p-8 text-center text-slate-400 text-xs">
                <RotateCw className="w-6 h-6 animate-spin text-blue-600 mx-auto mb-2" />
                Finding eligible district franchise partners...
              </div>
            ) : eligibleFranchisees.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-500">
                No eligible franchise partners found in this district. Contact admin to assign a district franchisee.
              </div>
            ) : (
              eligibleFranchisees.map((f) => {
                const isSelected = selectedFranchisee?.id === f.id;
                return (
                  <div
                    key={f.id}
                    onClick={() => setSelectedFranchisee(f)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                      isSelected
                        ? 'bg-blue-50/80 border-blue-600 ring-2 ring-blue-600/20 shadow-xs'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-xs text-blue-700 bg-blue-100/70 px-2 py-0.5 rounded">
                          {f.reseller_code}
                        </span>
                        {f.is_district_match && (
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                            District Match
                          </span>
                        )}
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            f.is_operational ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                          }`}
                        >
                          {f.is_operational ? 'Operational Live' : 'Under Setup'}
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-slate-900">{f.business_name}</h4>
                      <div className="text-xs text-slate-500 flex flex-wrap items-center gap-3">
                        <span>Contact: {f.contact_person}</span>
                        <span>Mobile: {f.mobile}</span>
                        <span>District: {f.district}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 self-end sm:self-center">
                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 block font-bold uppercase">EPC Network</span>
                        <span className="text-xs font-bold text-slate-700">{f.assigned_epc_count} Active EPCs</span>
                      </div>
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center border ${
                          isSelected ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-300'
                        }`}
                      >
                        {isSelected && <Check className="w-3.5 h-3.5" />}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            <button
              onClick={() => setStep(2)}
              className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl font-bold hover:bg-slate-50 text-xs"
            >
              Back
            </button>
            <button
              onClick={handleAssignFranchisee}
              disabled={!selectedFranchisee || assignmentLoading}
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold rounded-xl text-xs shadow-md shadow-emerald-600/20 flex items-center gap-2"
            >
              {assignmentLoading ? (
                <>
                  <RotateCw className="w-4 h-4 animate-spin" /> Assigning & Sending Alert...
                </>
              ) : (
                <>
                  Confirm Assignment to {selectedFranchisee?.business_name || 'Partner'} <Check className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: ONBOARDING & ASSIGNMENT COMPLETED */}
      {step === 4 && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8 text-center space-y-6">
          <div className="w-16 h-16 rounded-3xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto shadow-md shadow-emerald-600/10">
            <CheckCircle2 className="w-9 h-9" />
          </div>

          <div className="space-y-2 max-w-lg mx-auto">
            <h2 className="text-2xl font-black text-slate-900">EPC Onboarding Successfully Completed!</h2>
            <p className="text-xs text-slate-500">
              EPC <strong className="text-slate-800">{createdEpcAccount?.name}</strong> has been onboarded with verified GST{' '}
              <strong className="font-mono text-slate-800">{gstResult?.gstin}</strong> and assigned to Franchise Partner{' '}
              <strong className="text-emerald-700">{assignmentResult?.reseller_name}</strong>.
            </p>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 max-w-md mx-auto text-xs text-left space-y-2">
            <div className="flex justify-between">
              <span className="text-slate-400">EPC Account:</span>
              <span className="font-bold text-slate-900">{createdEpcAccount?.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Assigned Franchisee:</span>
              <span className="font-bold text-emerald-700">{assignmentResult?.reseller_name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">District:</span>
              <span className="font-semibold text-slate-900">{formData.district_name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Franchisee Alert:</span>
              <span className="text-emerald-600 font-bold flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> In-App Notification Sent
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
              onClick={() => navigate('/franchisees')}
              className="px-5 py-2.5 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl text-xs hover:bg-slate-50 transition"
            >
              View Franchisee Goals & Orders
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
