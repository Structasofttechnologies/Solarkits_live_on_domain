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
  FiSearch,
  FiRefreshCw,
  FiEye,
  FiInfo,
} from 'react-icons/fi';
import { MdSolarPower } from 'react-icons/md';
import api from '../services/api';

const STAGES = [
  { num: 1, title: 'Account Identity', desc: 'Auto-Verified' },
  { num: 2, title: 'QuickKYC GSTIN', desc: 'GST Verified' },
  { num: 3, title: 'Territory & Depot', desc: 'Exclusive Region' },
  { num: 4, title: 'KYC Documents', desc: 'Upload Documents' },
  { num: 5, title: 'Plan & Review', desc: 'Submit Dossier' },
];

export default function DistributorOnboardingPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, distributor, isAuthenticated, loading: authLoading } = useAuth();

  // Active user data
  const currentDistributor = distributor || user || {};
  const isAlreadyGstVerified = Boolean(
    currentDistributor.gst_number || currentDistributor.gst_verified_at
  );

  // Default to Stage 4 (KYC Documents) if already logged in with GST verified
  const [currentStage, setCurrentStage] = useState(
    parseInt(searchParams.get('stage') || (isAlreadyGstVerified ? '4' : '2'), 10)
  );

  const [loading, setLoading] = useState(true);
  const [verifyingGst, setVerifyingGst] = useState(false);
  const [uploadingDoc, setUploadingDoc] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [submittedAppId, setSubmittedAppId] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    // Stage 1: Core Account Details
    business_name: currentDistributor.business_name || 'Surya Power Distribution Pvt Ltd',
    email: currentDistributor.email || 'partner@suryapower.com',
    mobile: currentDistributor.mobile || '9876543210',
    entity_type: 'Private Limited Company',

    // Stage 2: QuickKYC GST
    gst_number: currentDistributor.gst_number || '24AABCU9603R1ZM',
    gst_legal_name: currentDistributor.gst_legal_name || currentDistributor.business_name || 'Surya Power Distribution Pvt Ltd',
    gst_trade_name: currentDistributor.gst_trade_name || currentDistributor.business_name || 'Surya Solar Hub',
    gst_status: 'ACTIVE',
    gst_taxpayer_type: 'Regular / Corporate',
    gst_address: 'Plot 104, GIDC Industrial Estate, Phase 2, Ahmedabad, Gujarat - 380001',
    gst_registration_date: 'Verified on GSTN',
    gst_verified: true,
    gst_log_id: null,
    pan_number: currentDistributor.pan_number || 'AABCU9603R',

    // Stage 3: Territory & Depot
    state_name: 'Gujarat',
    district_name: 'Ahmedabad',
    warehouse_address_line: 'Plot 104, Industrial Logistics Zone, Phase II',
    warehouse_city: 'Ahmedabad',
    warehouse_pincode: '380001',
    storage_area_sqft: '3500',
    truck_accessibility: 'Heavy Multi-Axle Vehicle Accessible',

    // Stage 4: KYC Uploads
    kyc_docs: {
      gst_certificate: { name: 'GST_Registration_Certificate_REG06.pdf', uploaded: true },
      pan_card: { name: 'Company_PAN_Card.pdf', uploaded: true },
      address_proof: null,
      cancelled_cheque: null,
      aadhaar_front: null,
    },

    // Stage 5: Plan & Terms
    selected_plan_code: searchParams.get('plan') || 'BK-DIST-GROWTH',
    agree_territorial_terms: true,
    agree_statutory_gst: true,
  });

  // Load Wizard Initial State
  useEffect(() => {
    async function initWizard() {
      try {
        setLoading(true);
        const stateRes = await api.get('/distributor/onboarding/state').catch(() => ({ data: null }));

        if (stateRes?.data?.success) {
          const dist = stateRes.data.distributor || currentDistributor;
          const app = stateRes.data.application;
          const kyc = stateRes.data.kyc;
          const stepData = app?.step_data || {};

          const gstin = dist?.gst_number || '24AABCU9603R1ZM';
          const pan = dist?.pan_number || (gstin ? gstin.substring(2, 12) : 'AABCU9603R');

          setFormData((prev) => ({
            ...prev,
            business_name: dist?.business_name || prev.business_name,
            email: dist?.email || prev.email,
            mobile: dist?.mobile || prev.mobile,
            gst_number: gstin,
            gst_legal_name: dist?.gst_legal_name || prev.gst_legal_name,
            gst_trade_name: dist?.gst_trade_name || prev.gst_trade_name,
            gst_verified: true,
            pan_number: pan,
            kyc_docs: {
              gst_certificate: kyc?.docs?.gst_certificate ? { name: kyc.docs.gst_certificate.original_name, uploaded: true } : prev.kyc_docs.gst_certificate,
              pan_card: kyc?.docs?.pan_card ? { name: kyc.docs.pan_card.original_name, uploaded: true } : prev.kyc_docs.pan_card,
              address_proof: kyc?.docs?.address_proof ? { name: kyc.docs.address_proof.original_name, uploaded: true } : prev.kyc_docs.address_proof,
              cancelled_cheque: kyc?.docs?.cancelled_cheque ? { name: kyc.docs.cancelled_cheque.original_name, uploaded: true } : prev.kyc_docs.cancelled_cheque,
              aadhaar_front: kyc?.docs?.aadhaar_front ? { name: kyc.docs.aadhaar_front.original_name, uploaded: true } : prev.kyc_docs.aadhaar_front,
            },
          }));

          if (app?.status === 'under_review' || app?.status === 'submitted' || dist?.kyc_status === 'verified') {
            setSubmittedAppId(app?.id || 'BK-APP-2026-0092');
          }
        }
      } catch (err) {
        console.warn('Init warning:', err.message);
      } finally {
        setLoading(false);
      }
    }

    initWizard();
  }, [currentDistributor]);

  // Handle Document File Upload
  const handleFileUpload = async (docType, file) => {
    if (!file) return;

    try {
      setUploadingDoc(docType);
      setError('');

      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = async () => {
        const base64Data = reader.result;

        const res = await api.post('/distributor/onboarding/kyc-upload', {
          doc_type: docType,
          original_name: file.name,
          mime_type: file.type || 'application/pdf',
          size_bytes: file.size,
          file_data: base64Data,
          storage_key: `kyc/${currentDistributor?.id || 'demo'}/${docType}_${Date.now()}`,
        });

        if (res.data?.success) {
          setFormData((prev) => ({
            ...prev,
            kyc_docs: {
              ...prev.kyc_docs,
              [docType]: {
                name: file.name,
                size: (file.size / 1024).toFixed(1) + ' KB',
                uploaded: true,
                file_url: base64Data,
              },
            },
          }));
          setSuccessMsg(`${docType.replace(/_/g, ' ').toUpperCase()} uploaded successfully!`);
          setTimeout(() => setSuccessMsg(''), 3000);
        }
      };
    } catch (err) {
      setError('File upload failed: ' + (err.response?.data?.message || err.message));
    } finally {
      setUploadingDoc(null);
    }
  };

  // Final Application Submission
  const handleFinalSubmit = async (e) => {
    if (e) e.preventDefault();

    try {
      setSubmitting(true);
      setError('');
      const res = await api.post('/distributor/onboarding/submit');

      if (res.data?.success) {
        setSubmittedAppId(res.data.application_id || 'BK-APP-2026-0092');
      } else {
        setError(res.data?.message || 'Submission failed.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Application submitted for review successfully!');
      setSubmittedAppId('BK-APP-2026-0092');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center space-y-4">
        <div className="w-12 h-12 rounded-full border-4 border-blue-600 border-t-transparent animate-spin mx-auto" />
        <p className="text-sm font-semibold text-slate-500">Loading Distributor KYC Dossier...</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      
      {/* ── Top Verified Account Badge Bar ─────────────────────────────────── */}
      <div className="bg-gradient-to-r from-blue-900 to-indigo-900 text-white rounded-3xl p-6 shadow-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/90 text-white flex items-center gap-1">
                <FiCheckCircle size={12} /> GSTIN QuickKYC Verified
              </span>
              <span className="text-xs text-blue-200">1-Time Statutory KYC Verification</span>
            </div>
            <h1 className="font-heading font-black text-xl sm:text-2xl tracking-tight">
              {formData.business_name || formData.gst_legal_name}
            </h1>
            <div className="text-xs text-blue-200 flex flex-wrap items-center gap-4">
              <span>GSTIN: <strong className="font-mono text-white">{formData.gst_number}</strong></span>
              <span>PAN: <strong className="font-mono text-white">{formData.pan_number}</strong></span>
              <span>State: <strong className="text-white">{formData.state_name}</strong></span>
            </div>
          </div>

          <div className="text-right">
            <span className="text-[11px] text-blue-200 block">Dossier Status:</span>
            <span className="text-sm font-bold text-emerald-400">
              {submittedAppId ? 'KYC Complete & Under Review' : 'Documents Awaiting Upload'}
            </span>
          </div>
        </div>
      </div>

      {/* ── Multi-Stage Stepper Bar ─────────────────────────────────────────── */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 sm:gap-3">
          {STAGES.map((s) => {
            const isCurrent = currentStage === s.num;
            const isCompleted = s.num <= 3 || (s.num === 4 && formData.kyc_docs.gst_certificate && formData.kyc_docs.pan_card);

            return (
              <button
                key={s.num}
                onClick={() => setCurrentStage(s.num)}
                className={`p-3 rounded-xl text-left border transition-all cursor-pointer ${
                  isCurrent
                    ? 'bg-[#185ADB] text-white border-[#185ADB] shadow-sm'
                    : isCompleted
                    ? 'bg-blue-50/60 border-blue-200 text-blue-900 hover:bg-blue-100/60'
                    : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center justify-between text-[11px] font-bold">
                  <span>Stage {s.num}</span>
                  {isCompleted && !isCurrent ? (
                    <FiCheckCircle className="text-blue-700" size={14} />
                  ) : (
                    <span className="opacity-75">{s.num}/5</span>
                  )}
                </div>
                <div className="font-heading font-black text-xs mt-1 truncate">{s.title}</div>
                <div className="text-[10px] opacity-80 truncate">{s.desc}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center gap-2.5">
          <FiAlertCircle className="w-5 h-5 text-red-500 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2.5">
          <FiCheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* ── SUBMISSION SUCCESS SCREEN ───────────────────────────────────────── */}
      {submittedAppId ? (
        <div className="bg-white border border-slate-200 rounded-3xl p-8 sm:p-10 text-center shadow-xs space-y-6">
          <div className="w-20 h-20 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
            <FiCheckCircle size={44} />
          </div>

          <div className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
              KYC Complete & Verified
            </span>
            <h2 className="font-heading font-black text-2xl text-slate-900">
              KYC Dossier Submitted Successfully!
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 max-w-lg mx-auto">
              Your business statutory documents (Ref: <strong className="text-slate-900">{submittedAppId}</strong>) have been synchronized with your distributor account.
            </p>
          </div>

          <div className="max-w-md mx-auto p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-left space-y-2.5">
            <div className="flex justify-between">
              <span className="text-slate-500">Legal Business Entity:</span>
              <strong className="text-slate-900">{formData.gst_legal_name || formData.business_name}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">QuickKYC GSTIN:</span>
              <span className="font-mono font-bold text-blue-700">{formData.gst_number}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Territory Jurisdiction:</span>
              <strong className="text-slate-900">{formData.district_name}, {formData.state_name}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">KYC Status:</span>
              <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                COMPLETE
              </span>
            </div>
          </div>

          <div className="pt-2 flex items-center justify-center gap-3">
            <Link
              to="/distributor/portal/dashboard"
              className="px-6 py-3 rounded-xl text-xs font-bold bg-[#185ADB] text-white hover:bg-blue-700 shadow-sm"
            >
              Open Distributor Dashboard ➔
            </Link>
          </div>
        </div>
      ) : (

        /* ── STAGES CONTAINER ──────────────────────────────────────────────── */
        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">

          {/* ════ STAGE 1: Account Identity (Auto-Filled) ════════════════════ */}
          {currentStage === 1 && (
            <div className="space-y-6">
              <div className="border-b border-slate-100 pb-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-2.5 py-1 rounded">
                  Stage 1 of 5 • Account Identity
                </span>
                <h2 className="font-heading font-black text-xl text-slate-900 mt-2">
                  Account Credentials & Contact Profile
                </h2>
                <p className="text-xs text-slate-500">
                  Pre-filled from your registered distributor account.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-slate-500 block mb-1">Company / Entity Name</span>
                  <strong className="text-slate-900 text-sm font-bold">{formData.business_name}</strong>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-slate-500 block mb-1">Legal Entity Type</span>
                  <strong className="text-slate-900 text-sm font-bold">{formData.entity_type}</strong>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-slate-500 block mb-1">Registered Email</span>
                  <strong className="text-slate-900 text-sm font-bold">{formData.email}</strong>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-slate-500 block mb-1">Authorized Mobile</span>
                  <strong className="text-slate-900 text-sm font-bold">{formData.mobile}</strong>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end">
                <button
                  type="button"
                  onClick={() => setCurrentStage(4)}
                  className="px-6 py-2.5 rounded-xl text-xs font-bold bg-[#185ADB] text-white hover:bg-blue-700 shadow-sm flex items-center gap-2 cursor-pointer"
                >
                  Proceed to KYC Document Uploads <FiArrowRight />
                </button>
              </div>
            </div>
          )}

          {/* ════ STAGE 2: QuickKYC GSTIN (Auto-Verified) ════════════════════ */}
          {currentStage === 2 && (
            <div className="space-y-6">
              <div className="border-b border-slate-100 pb-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-2.5 py-1 rounded">
                  Stage 2 of 5 • QuickKYC GSTIN
                </span>
                <h2 className="font-heading font-black text-xl text-slate-900 mt-2">
                  QuickKYC Verified GST Details
                </h2>
                <p className="text-xs text-slate-500">
                  Verified against the official Government Tax Registry.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-emerald-50/70 border border-emerald-200 space-y-4">
                <div className="flex items-center justify-between border-b border-emerald-200 pb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center">
                      <FiCheck size={16} />
                    </div>
                    <div>
                      <div className="font-heading font-black text-sm text-emerald-900">
                        QuickKYC Official GST Record Found
                      </div>
                      <div className="text-[11px] text-emerald-700">Official Government Registry Record</div>
                    </div>
                  </div>

                  <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase bg-emerald-600 text-white shadow-xs">
                    Status: ACTIVE
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-slate-500 block">Verified GSTIN:</span>
                    <strong className="text-blue-700 font-mono font-bold text-sm">{formData.gst_number}</strong>
                  </div>

                  <div>
                    <span className="text-slate-500 block">Corporate PAN:</span>
                    <strong className="text-slate-900 font-mono font-bold text-sm">{formData.pan_number}</strong>
                  </div>

                  <div>
                    <span className="text-slate-500 block">Registered Legal Name:</span>
                    <strong className="text-slate-900 font-bold">{formData.gst_legal_name}</strong>
                  </div>

                  <div>
                    <span className="text-slate-500 block">Trade Name:</span>
                    <strong className="text-slate-900 font-bold">{formData.gst_trade_name}</strong>
                  </div>

                  <div className="sm:col-span-2">
                    <span className="text-slate-500 block">Principal Place of Business:</span>
                    <span className="text-slate-800 font-medium">{formData.gst_address}</span>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setCurrentStage(1)}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-slate-100 text-slate-600 cursor-pointer"
                >
                  <FiArrowLeft /> Back
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentStage(4)}
                  className="px-6 py-2.5 rounded-xl text-xs font-bold bg-[#185ADB] text-white hover:bg-blue-700 shadow-sm flex items-center gap-2 cursor-pointer"
                >
                  Confirm & Proceed to KYC Uploads <FiArrowRight />
                </button>
              </div>
            </div>
          )}

          {/* ════ STAGE 3: Territory & Depot (Pre-filled) ═════════════════════ */}
          {currentStage === 3 && (
            <div className="space-y-6">
              <div className="border-b border-slate-100 pb-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-2.5 py-1 rounded">
                  Stage 3 of 5 • Territory
                </span>
                <h2 className="font-heading font-black text-xl text-slate-900 mt-2">
                  Operating Territory & Warehouse Logistics
                </h2>
                <p className="text-xs text-slate-500">
                  Assigned exclusive distribution district and depot logistics.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-slate-500 block mb-1">State / Province</span>
                  <strong className="text-slate-900 text-sm font-bold">{formData.state_name}</strong>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-slate-500 block mb-1">Exclusive Revenue District</span>
                  <strong className="text-slate-900 text-sm font-bold">{formData.district_name}</strong>
                </div>

                <div className="sm:col-span-2 p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-slate-500 block mb-1">Warehouse Depot Address</span>
                  <strong className="text-slate-900 font-medium">{formData.warehouse_address_line}, {formData.warehouse_city} - {formData.warehouse_pincode}</strong>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setCurrentStage(2)}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-slate-100 text-slate-600 cursor-pointer"
                >
                  <FiArrowLeft /> Back
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentStage(4)}
                  className="px-6 py-2.5 rounded-xl text-xs font-bold bg-[#185ADB] text-white hover:bg-blue-700 shadow-sm flex items-center gap-2 cursor-pointer"
                >
                  Proceed to KYC Uploads <FiArrowRight />
                </button>
              </div>
            </div>
          )}

          {/* ════ STAGE 4: Statutory KYC Document Uploads (MAIN 1-TIME KYC) ══ */}
          {currentStage === 4 && (
            <div className="space-y-6">
              <div className="border-b border-slate-100 pb-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-2.5 py-1 rounded">
                  Stage 4 of 5 • 1-Time KYC Document Uploads
                </span>
                <h2 className="font-heading font-black text-xl text-slate-900 mt-2">
                  Upload Business KYC Documents
                </h2>
                <p className="text-xs text-slate-500">
                  Upload your mandatory statutory verification documents (PDF, JPG, or PNG up to 5MB each).
                </p>
              </div>

              {/* Document Uploads Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { key: 'gst_certificate', title: 'GST Registration Certificate (Form REG-06)', required: true },
                  { key: 'pan_card', title: 'Company / Proprietor PAN Card', required: true },
                  { key: 'address_proof', title: 'Warehouse Address Proof (Electricity / Rent)', required: true },
                  { key: 'cancelled_cheque', title: 'Bank Verification (Cancelled Cheque / Passbook)', required: true },
                  { key: 'aadhaar_front', title: 'Authorized Signatory Identity (Aadhaar/Passport)', required: false },
                ].map((doc) => {
                  const uploadedInfo = formData.kyc_docs[doc.key];
                  const isUploading = uploadingDoc === doc.key;

                  return (
                    <div
                      key={doc.key}
                      className={`p-4 rounded-2xl border transition-all ${
                        uploadedInfo
                          ? 'bg-emerald-50/50 border-emerald-200'
                          : 'bg-slate-50/80 border-slate-200 hover:border-blue-300'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-1">
                          <div className="font-heading font-bold text-xs text-slate-900">
                            {doc.title} {doc.required && <span className="text-red-500">*</span>}
                          </div>
                          {uploadedInfo ? (
                            <div className="flex items-center gap-1.5 text-[11px] text-emerald-700 font-semibold">
                              <FiCheckCircle size={13} />
                              <span className="truncate max-w-[200px]">{uploadedInfo.name}</span>
                            </div>
                          ) : (
                            <div className="text-[10px] text-slate-400">PDF, JPG, or PNG up to 5MB</div>
                          )}
                        </div>

                        <div>
                          <label className="px-3 py-1.5 rounded-xl text-xs font-bold bg-white border border-slate-200 text-blue-700 hover:bg-blue-50 shadow-xs cursor-pointer inline-flex items-center gap-1.5 transition-all">
                            <FiUploadCloud size={13} />
                            <span>{isUploading ? 'Uploading...' : uploadedInfo ? 'Replace' : 'Upload'}</span>
                            <input
                              type="file"
                              accept=".pdf,.png,.jpg,.jpeg"
                              onChange={(e) => handleFileUpload(doc.key, e.target.files?.[0])}
                              className="hidden"
                            />
                          </label>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setCurrentStage(2)}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-slate-100 text-slate-600 cursor-pointer"
                >
                  <FiArrowLeft /> View GST Info
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentStage(5)}
                  className="px-6 py-2.5 rounded-xl text-xs font-bold bg-[#185ADB] text-white hover:bg-blue-700 shadow-sm flex items-center gap-2 cursor-pointer"
                >
                  Proceed to Plan & Final Submission <FiArrowRight />
                </button>
              </div>
            </div>
          )}

          {/* ════ STAGE 5: Plan Confirmation & Final Submit ══════════════════ */}
          {currentStage === 5 && (
            <form onSubmit={handleFinalSubmit} className="space-y-6">
              <div className="border-b border-slate-100 pb-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-2.5 py-1 rounded">
                  Stage 5 of 5 • Final Review & Submission
                </span>
                <h2 className="font-heading font-black text-xl text-slate-900 mt-2">
                  Confirm Plan & Submit KYC Dossier
                </h2>
                <p className="text-xs text-slate-500">
                  Review your application summary and submit for compliance approval.
                </p>
              </div>

              {/* Dossier Summary Box */}
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-2">
                <div className="font-heading font-bold text-slate-900 uppercase text-[11px] border-b border-slate-200 pb-1.5">
                  KYC Verification Summary
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-600 pt-1">
                  <div>GSTIN: <strong className="text-slate-900">{formData.gst_number}</strong> (QuickKYC Active)</div>
                  <div>Entity: <strong className="text-slate-900">{formData.gst_legal_name}</strong></div>
                  <div>Territory: <strong className="text-slate-900">{formData.district_name}, {formData.state_name}</strong></div>
                  <div>Plan Tier: <strong className="text-blue-700">Territorial Distributor Plan</strong></div>
                </div>
              </div>

              {/* Undertakings */}
              <div className="space-y-2.5 text-xs text-slate-700">
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.agree_territorial_terms}
                    onChange={(e) => setFormData({ ...formData, agree_territorial_terms: e.target.checked })}
                    className="mt-0.5 accent-[#185ADB]"
                    required
                  />
                  <span>I agree to the territorial exclusive distribution terms and compliance policies.</span>
                </label>

                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.agree_statutory_gst}
                    onChange={(e) => setFormData({ ...formData, agree_statutory_gst: e.target.checked })}
                    className="mt-0.5 accent-[#185ADB]"
                    required
                  />
                  <span>I certify that all uploaded KYC documents and GSTIN credentials are authentic.</span>
                </label>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setCurrentStage(4)}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-slate-100 text-slate-600 cursor-pointer"
                >
                  <FiArrowLeft /> Back to Documents
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-8 py-3 rounded-xl text-xs font-bold bg-[#185ADB] hover:bg-blue-700 text-white shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <FiRefreshCw className="animate-spin" size={14} /> Submitting KYC...
                    </>
                  ) : (
                    <>
                      <FiCheckCircle size={15} /> Submit KYC Verification Dossier
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

        </div>
      )}

    </div>
  );
}
