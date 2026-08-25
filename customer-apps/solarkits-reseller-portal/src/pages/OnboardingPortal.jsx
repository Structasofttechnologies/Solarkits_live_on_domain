import { useState, useEffect, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiShield,
  FiCheckCircle,
  FiFileText,
  FiCreditCard,
  FiUploadCloud,
  FiShoppingBag,
  FiArrowRight,
  FiCheck,
  FiX,
  FiLoader,
  FiLogOut,
  FiLock,
  FiClock,
  FiPhoneCall,
  FiAlertCircle,
  FiEye,
  FiExternalLink,
  FiZap,
} from "react-icons/fi";
import api from "../services/api";
import logoImg from "@/assets/images/logo.png";

export default function OnboardingPortal() {
  const navigate = useNavigate();
  const token = localStorage.getItem("reseller_token");

  const [reseller, setReseller] = useState(() => {
    try {
      const saved = localStorage.getItem("reseller_user");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [loading, setLoading] = useState(true);

  // Modals & Active Action States
  const [agreementModalOpen, setAgreementModalOpen] = useState(false);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);

  // Agreement State
  const [agreementData, setAgreementData] = useState(null);
  const [signerName, setSignerName] = useState("");
  const [signerDesignation, setSignerDesignation] = useState("Authorized Signatory / Proprietor");
  const [consentAgreed, setConsentAgreed] = useState(false);
  const [agreementFile, setAgreementFile] = useState(null);
  const [signingLoading, setSigningLoading] = useState(false);
  const [agreementError, setAgreementError] = useState("");

  // Payment Info & Receipt Upload State
  const [feeInfo, setFeeInfo] = useState(null);
  const [utrNumber, setUtrNumber] = useState("");
  const [amountPaid, setAmountPaid] = useState(50000);
  const [senderBank, setSenderBank] = useState("");
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split("T")[0]);
  const [receiptFile, setReceiptFile] = useState(null);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [uploadError, setUploadError] = useState("");

  const fetchMe = useCallback(async () => {
    if (!token) {
      navigate("/login");
      return;
    }
    try {
      const res = await api.get("/india/v1/reseller/auth/me");
      if (res.data?.status === "success") {
        const userData = res.data.data || res.data.user;
        if (userData) {
          setReseller(userData);
          localStorage.setItem("reseller_user", JSON.stringify(userData));
          if (!signerName) {
            setSignerName(userData.contact_person || userData.business_name || "");
          }
          if (userData.fee_payment_utr && !utrNumber) {
            setUtrNumber(userData.fee_payment_utr);
          }
          if (userData.fee_payment_amount) {
            setAmountPaid(userData.fee_payment_amount);
          }
        }
      }
    } catch (err) {
      if (err.response?.status === 401) {
        localStorage.removeItem("reseller_token");
        localStorage.removeItem("reseller_user");
        navigate("/login");
      }
    } finally {
      setLoading(false);
    }
  }, [token, navigate, signerName, utrNumber]);

  useEffect(() => {
    fetchMe();
    const interval = setInterval(fetchMe, 6000);
    return () => clearInterval(interval);
  }, [fetchMe]);

  const loadAgreement = async () => {
    try {
      const res = await api.get("/india/v1/reseller/agreement/current");
      if (res.data?.status === "success") {
        setAgreementData(res.data.data?.agreement);
      }
    } catch (err) {
      console.warn("Failed to load agreement details:", err);
    }
  };

  const loadFeeInfo = async () => {
    try {
      const res = await api.get("/india/v1/reseller/fee-payment/info");
      if (res.data?.status === "success") {
        setFeeInfo(res.data.data);
        if (res.data.data?.plan?.fee_amount) {
          setAmountPaid(res.data.data.plan.fee_amount);
        }
      }
    } catch (err) {
      console.warn("Failed to load fee info:", err);
    }
  };

  useEffect(() => {
    if (agreementModalOpen) loadAgreement();
  }, [agreementModalOpen]);

  useEffect(() => {
    if (paymentModalOpen) loadFeeInfo();
  }, [paymentModalOpen]);

  const handleLogout = () => {
    localStorage.removeItem("reseller_token");
    localStorage.removeItem("reseller_user");
    navigate("/login");
  };

  // Sign Agreement Action
  const handleSignAgreement = async (e) => {
    e.preventDefault();
    setAgreementError("");
    if (!signerName.trim()) {
      setAgreementError("Please enter your full legal signatory name.");
      return;
    }
    if (!consentAgreed) {
      setAgreementError("Please agree to the franchise terms and conditions.");
      return;
    }

    setSigningLoading(true);
    try {
      let res;
      if (agreementFile) {
        const formData = new FormData();
        formData.append("agreement_id", agreementData?._id || "");
        formData.append("signer_name", signerName.trim());
        formData.append("signer_designation", signerDesignation.trim());
        formData.append("consent_agreed", "true");
        formData.append("document", agreementFile);
        formData.append("file", agreementFile);

        res = await api.post("/india/v1/reseller/agreement/sign", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      } else {
        res = await api.post("/india/v1/reseller/agreement/sign", {
          agreement_id: agreementData?._id,
          signer_name: signerName.trim(),
          signer_designation: signerDesignation.trim(),
          consent_agreed: true,
        });
      }

      if (res.data?.status === "success") {
        setAgreementModalOpen(false);
        fetchMe();
      } else {
        setAgreementError(res.data?.message || "Failed to sign agreement.");
      }
    } catch (err) {
      setAgreementError(err.response?.data?.message || "Failed to sign agreement. Please try again.");
    } finally {
      setSigningLoading(false);
    }
  };

  // Upload Payment Receipt Action
  const handleUploadReceipt = async (e) => {
    e.preventDefault();
    setUploadError("");
    if (!utrNumber.trim()) {
      setUploadError("Please provide the Bank UTR / IMPS / NEFT Reference number.");
      return;
    }

    const formData = new FormData();
    formData.append("utr_number", utrNumber.trim().toUpperCase());
    formData.append("amount_paid", amountPaid);
    formData.append("payment_date", paymentDate);
    formData.append("sender_bank_name", senderBank.trim());
    if (receiptFile) {
      formData.append("document", receiptFile);
      formData.append("file", receiptFile);
    }

    setUploadLoading(true);
    try {
      const res = await api.post("/india/v1/reseller/fee-payment/upload-receipt", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (res.data?.status === "success") {
        setPaymentModalOpen(false);
        fetchMe();
      } else {
        setUploadError(res.data?.message || "Failed to upload payment receipt.");
      }
    } catch (err) {
      setUploadError(err.response?.data?.message || "Receipt upload failed. Please try again.");
    } finally {
      setUploadLoading(false);
    }
  };

  // State Evaluation
  const isGstVerified = Boolean(reseller?.gst_number || reseller?.gst_verified_at);
  const isApproved = reseller?.activation_status !== "rejected" && reseller?.activation_status !== "draft";
  const isAgreementSigned = reseller?.agreement_status === "signed";
  const isReceiptUploaded = reseller?.fee_payment_status === "receipt_uploaded" || reseller?.fee_payment_status === "verified";
  const isReceiptVerified = reseller?.fee_payment_status === "verified";
  const isAccountActive = reseller?.activation_status === "active";

  const completedStepsCount = [
    isGstVerified,
    isApproved,
    isAgreementSigned,
    isReceiptUploaded,
    isReceiptVerified,
    isAccountActive,
  ].filter(Boolean).length;

  const progressPercent = Math.round((completedStepsCount / 6) * 100);

  const primaryName = reseller?.contact_person || reseller?.business_name || "Franchise Partner";
  const companyName = reseller?.business_name || "Partner Enterprise";

  const getInitials = (name) => {
    if (!name) return "FP";
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const userInitials = getInitials(primaryName);

  if (loading && !reseller) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-800">
        <div className="flex flex-col items-center gap-3">
          <FiLoader size={40} className="animate-spin text-[#0575B8]" />
          <p className="text-xs font-black uppercase tracking-widest text-slate-500">Loading Workspace...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-blue-50/20 to-slate-100 text-slate-900 flex flex-col font-sans antialiased">
      {/* ── Bright Top Navigation Bar ──────────────────────────────────────── */}
      <header className="bg-white/95 backdrop-blur-md border-b border-slate-200 sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <img src={logoImg} alt="SolarKits" className="h-10 w-auto" />
            <div className="hidden sm:block border-l border-slate-200 pl-4">
              <span className="text-[10px] font-black uppercase tracking-wider text-[#F49222] block">
                Partner Activation Workspace
              </span>
              <span className="text-xs font-bold text-slate-600">
                Pre-Onboarding & Verification Pipeline
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3.5">
            <div className="flex items-center gap-2.5 text-right hidden sm:block">
              <p className="text-sm font-extrabold text-slate-900 leading-tight">{primaryName}</p>
              <p className="text-xs text-slate-500 font-medium truncate max-w-[200px]">{companyName}</p>
            </div>

            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#0575B8] to-blue-600 text-white font-black text-xs flex items-center justify-center shadow-sm">
              {userInitials}
            </div>

            <button
              onClick={handleLogout}
              className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-600 border border-slate-200 transition-colors cursor-pointer ml-1 flex items-center gap-1.5 text-xs font-bold"
              title="Sign Out"
            >
              <FiLogOut size={15} />
              <span className="hidden md:inline">Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* ── Main Onboarding Container ───────────────────────────────────────── */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Vibrant Bright Welcome Hero Banner */}
        <div className="p-6 sm:p-8 lg:p-10 rounded-3xl bg-gradient-to-r from-[#0575B8] via-[#0066A2] to-[#045D93] text-white shadow-xl relative overflow-hidden">
          {/* Decorative ambient background accents */}
          <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-white/10 blur-2xl" />
          <div className="pointer-events-none absolute -left-16 -bottom-16 h-56 w-56 rounded-full bg-[#F49222]/30 blur-2xl" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2.5">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-3.5 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-[#F49222] text-slate-950 shadow-xs">
                  Step-by-Step Partner Activation
                </span>
                <span className="text-xs text-blue-100 font-semibold bg-white/15 px-3 py-1 rounded-full backdrop-blur-xs border border-white/20">
                  {isAccountActive
                    ? "✓ All Steps Completed — Account 100% Active"
                    : !isAgreementSigned
                    ? "Step 3 Pending: Legal Agreement Execution Required"
                    : !isReceiptUploaded
                    ? "Step 4 Pending: Offline Payment Receipt Required"
                    : "Step 5 Pending: Receipt Verification by Admin"}
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-white flex items-center gap-3">
                <span>Welcome, {primaryName}</span>
                {isAccountActive && (
                  <span className="text-xs font-black px-3 py-1 rounded-full bg-emerald-400 text-slate-950 shadow-sm">
                    Active Partner
                  </span>
                )}
              </h1>

              <p className="text-sm sm:text-base text-blue-50 max-w-2xl leading-relaxed font-medium">
                {isAccountActive
                  ? "Congratulations! Your franchise account is activated. You now have complete access to wholesale catalog ordering, EPC allocations, and commercial storefront tools."
                  : "Complete your onboarding sequence step-by-step below. Full operational dashboard access will be unlocked immediately once admin verifies your payment receipt."}
              </p>
            </div>

            {/* Progress Gauge */}
            <div className="shrink-0 flex items-center gap-4 bg-white/15 backdrop-blur-md px-6 py-5 rounded-2xl border border-white/25 shadow-sm">
              <div className="text-right">
                <div className="text-xs text-blue-100 font-medium">Onboarding Progress</div>
                <div className="text-2xl font-black text-white">{progressPercent}%</div>
              </div>
              <div className="w-18 h-18 relative flex items-center justify-center">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                  <path
                    className="text-white/20"
                    strokeWidth="3.5"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <path
                    className="text-[#F49222] transition-all duration-700 ease-out"
                    strokeDasharray={`${progressPercent}, 100`}
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
                <span className="absolute text-sm font-black text-white">{completedStepsCount}/6</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── 6-Step Visual Pipeline Cards (Clean & Bright) ─────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4">
          {/* Step 1 */}
          <div
            className={`p-4 sm:p-5 rounded-2xl sm:rounded-3xl border-2 flex flex-col justify-between transition-all duration-200 ${
              isGstVerified
                ? "border-emerald-300/80 bg-emerald-50/60 text-emerald-950 shadow-xs hover:shadow-sm"
                : "border-slate-200 bg-white shadow-xs"
            }`}
          >
            <div>
              <div className="flex items-center justify-between gap-1.5 mb-3">
                <span className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-black bg-emerald-600 text-white shadow-xs shrink-0">
                  1
                </span>
                <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-emerald-100/90 text-emerald-800 border border-emerald-300/80 whitespace-nowrap leading-none shrink-0 inline-flex items-center gap-1">
                  <FiCheck size={11} className="stroke-[3]" /> VERIFIED
                </span>
              </div>
              <div className="flex items-center gap-1.5 font-black text-sm text-slate-900 mb-1">
                <FiShield size={18} className="text-emerald-600 shrink-0" />
                <span>Lead & GST</span>
              </div>
              <p className="text-xs text-slate-600 font-medium leading-relaxed">QuickeKYC Authenticated</p>
            </div>
            <div className="mt-4 pt-2.5 border-t border-emerald-200/80 text-[11px] font-bold text-emerald-800 truncate">
              GSTIN: {reseller?.gst_number || "24AAACS1234F1Z8"}
            </div>
          </div>

          {/* Step 2 */}
          <div
            className={`p-4 sm:p-5 rounded-2xl sm:rounded-3xl border-2 flex flex-col justify-between transition-all duration-200 ${
              isApproved
                ? "border-emerald-300/80 bg-emerald-50/60 text-emerald-950 shadow-xs hover:shadow-sm"
                : "border-slate-200 bg-white shadow-xs"
            }`}
          >
            <div>
              <div className="flex items-center justify-between gap-1.5 mb-3">
                <span className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-black bg-emerald-600 text-white shadow-xs shrink-0">
                  2
                </span>
                <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-emerald-100/90 text-emerald-800 border border-emerald-300/80 whitespace-nowrap leading-none shrink-0 inline-flex items-center gap-1">
                  <FiCheck size={11} className="stroke-[3]" /> APPROVED
                </span>
              </div>
              <div className="flex items-center gap-1.5 font-black text-sm text-slate-900 mb-1">
                <FiCheckCircle size={18} className="text-emerald-600 shrink-0" />
                <span>Admin Review</span>
              </div>
              <p className="text-xs text-slate-600 font-medium leading-relaxed">Eligibility Confirmed</p>
            </div>
            <div className="mt-4 pt-2.5 border-t border-emerald-200/80 text-[11px] font-bold text-emerald-800 truncate">
              Model: {reseller?.commercial_mode || "Commission"}
            </div>
          </div>

          {/* Step 3 */}
          <div
            className={`p-4 sm:p-5 rounded-2xl sm:rounded-3xl border-2 flex flex-col justify-between transition-all duration-200 ${
              isAgreementSigned
                ? "border-emerald-300/80 bg-emerald-50/60 text-emerald-950 shadow-xs hover:shadow-sm"
                : "border-[#0575B8] bg-gradient-to-b from-blue-50/90 via-blue-50/40 to-white text-blue-950 ring-4 ring-blue-500/15 shadow-md shadow-blue-500/10"
            }`}
          >
            <div>
              <div className="flex items-center justify-between gap-1.5 mb-3">
                <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black shrink-0 shadow-xs ${
                  isAgreementSigned ? "bg-emerald-600 text-white" : "bg-[#0575B8] text-white"
                }`}>
                  3
                </span>
                <span className={`text-[10px] sm:text-[11px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full whitespace-nowrap leading-none shrink-0 inline-flex items-center gap-1.5 shadow-2xs ${
                  isAgreementSigned 
                    ? "bg-emerald-100/90 text-emerald-800 border border-emerald-300/80" 
                    : "bg-[#0575B8] text-white"
                }`}>
                  {isAgreementSigned ? (
                    <>
                      <FiCheck size={11} className="stroke-[3]" /> SIGNED
                    </>
                  ) : (
                    <>
                      <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse shrink-0" />
                      ACTION REQUIRED
                    </>
                  )}
                </span>
              </div>
              <div className="flex items-center gap-1.5 font-black text-sm text-slate-900 mb-1">
                <FiFileText size={18} className={isAgreementSigned ? "text-emerald-600 shrink-0" : "text-[#0575B8] shrink-0"} />
                <span>Agreement Signing</span>
              </div>
              <p className="text-xs text-slate-600 font-medium leading-relaxed">
                {isAgreementSigned ? `Signed: ${reseller?.agreement_signer_name || primaryName}` : "Unique Legal Agreement"}
              </p>
            </div>
            <div className="mt-4">
              <button
                onClick={() => setAgreementModalOpen(true)}
                className={`w-full py-2 px-3 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer ${
                  isAgreementSigned
                    ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                    : "bg-[#0575B8] hover:bg-[#045D93] text-white shadow-md shadow-blue-500/25 active:scale-[0.98]"
                }`}
              >
                <span>{isAgreementSigned ? "View Agreement" : "Sign Agreement →"}</span>
              </button>
            </div>
          </div>

          {/* Step 4 */}
          <div
            className={`p-4 sm:p-5 rounded-2xl sm:rounded-3xl border-2 flex flex-col justify-between transition-all duration-200 ${
              isReceiptUploaded
                ? "border-emerald-300/80 bg-emerald-50/60 text-emerald-950 shadow-xs hover:shadow-sm"
                : isAgreementSigned
                ? "border-amber-400/90 bg-amber-50/80 text-amber-950 ring-4 ring-amber-400/20 shadow-md"
                : "border-slate-200 bg-white/70 text-slate-400 opacity-60"
            }`}
          >
            <div>
              <div className="flex items-center justify-between gap-1.5 mb-3">
                <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black shrink-0 shadow-xs ${
                  isReceiptUploaded ? "bg-emerald-600 text-white" : isAgreementSigned ? "bg-amber-500 text-white" : "bg-slate-100 text-slate-500 border border-slate-200"
                }`}>
                  4
                </span>
                <span className={`text-[10px] sm:text-[11px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full whitespace-nowrap leading-none shrink-0 inline-flex items-center gap-1 ${
                  isReceiptUploaded 
                    ? "bg-emerald-100/90 text-emerald-800 border border-emerald-300/80" 
                    : isAgreementSigned 
                    ? "bg-amber-100 text-amber-900 border border-amber-300" 
                    : "bg-slate-100 text-slate-500 border border-slate-200/80"
                }`}>
                  {isReceiptUploaded ? (
                    <>
                      <FiCheck size={11} className="stroke-[3]" /> TRANSFERRED
                    </>
                  ) : isAgreementSigned ? (
                    "PAYMENT PENDING"
                  ) : (
                    <>
                      <FiLock size={10} /> LOCKED
                    </>
                  )}
                </span>
              </div>
              <div className="flex items-center gap-1.5 font-black text-sm text-slate-900 mb-1">
                <FiCreditCard size={18} className={isReceiptUploaded ? "text-emerald-600 shrink-0" : "text-amber-700 shrink-0"} />
                <span>Offline Fee Payment</span>
              </div>
              <p className="text-xs text-slate-600 font-medium leading-relaxed">
                {isReceiptUploaded ? `UTR: ${reseller?.fee_payment_utr || "Recorded"}` : "Verbal AM Discussion"}
              </p>
            </div>
            <div className="mt-4">
              {isAgreementSigned ? (
                <button
                  onClick={() => setPaymentModalOpen(true)}
                  className={`w-full py-2 px-3 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer ${
                    isReceiptUploaded
                      ? "bg-slate-800 hover:bg-slate-900 text-white"
                      : "bg-amber-600 hover:bg-amber-700 text-white shadow-md shadow-amber-600/20 active:scale-[0.98]"
                  }`}
                >
                  <span>{isReceiptUploaded ? "View Payment Info" : "Upload Receipt & Pay →"}</span>
                </button>
              ) : (
                <div className="text-center py-1.5 px-2 rounded-xl bg-slate-100/80 text-xs font-bold text-slate-400 flex items-center justify-center gap-1">
                  <FiLock size={12} /> Complete Step 3 First
                </div>
              )}
            </div>
          </div>

          {/* Step 5 */}
          <div
            className={`p-4 sm:p-5 rounded-2xl sm:rounded-3xl border-2 flex flex-col justify-between transition-all duration-200 ${
              isReceiptVerified
                ? "border-emerald-300/80 bg-emerald-50/60 text-emerald-950 shadow-xs hover:shadow-sm"
                : isReceiptUploaded
                ? "border-sky-400 bg-sky-50 text-sky-950 ring-4 ring-sky-400/20 shadow-md"
                : "border-slate-200 bg-white/70 text-slate-400 opacity-60"
            }`}
          >
            <div>
              <div className="flex items-center justify-between gap-1.5 mb-3">
                <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black shrink-0 shadow-xs ${
                  isReceiptVerified ? "bg-emerald-600 text-white" : isReceiptUploaded ? "bg-sky-600 text-white" : "bg-slate-100 text-slate-500 border border-slate-200"
                }`}>
                  5
                </span>
                <span className={`text-[10px] sm:text-[11px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full whitespace-nowrap leading-none shrink-0 inline-flex items-center gap-1 ${
                  isReceiptVerified 
                    ? "bg-emerald-100/90 text-emerald-800 border border-emerald-300/80" 
                    : isReceiptUploaded 
                    ? "bg-sky-100 text-sky-900 border border-sky-300" 
                    : "bg-slate-100 text-slate-500 border border-slate-200/80"
                }`}>
                  {isReceiptVerified ? (
                    <>
                      <FiCheck size={11} className="stroke-[3]" /> VERIFIED
                    </>
                  ) : isReceiptUploaded ? (
                    "UNDER REVIEW"
                  ) : (
                    <>
                      <FiLock size={10} /> LOCKED
                    </>
                  )}
                </span>
              </div>
              <div className="flex items-center gap-1.5 font-black text-sm text-slate-900 mb-1">
                <FiUploadCloud size={18} className={isReceiptVerified ? "text-emerald-600 shrink-0" : "text-sky-600 shrink-0"} />
                <span>Receipt Verification</span>
              </div>
              <p className="text-xs text-slate-600 font-medium leading-relaxed">
                {isReceiptVerified ? "Confirmed by Admin" : isReceiptUploaded ? "Under Admin Review" : "Upload Slip First"}
              </p>
            </div>
            <div className="mt-4">
              {isReceiptUploaded ? (
                <button
                  onClick={() => setPaymentModalOpen(true)}
                  className="w-full py-2 px-3 rounded-xl bg-sky-700 hover:bg-sky-800 text-white text-xs font-black flex items-center justify-center gap-1 shadow-sm transition-all cursor-pointer active:scale-[0.98]"
                >
                  <span>Upload Update / Slip</span>
                </button>
              ) : (
                <div className="text-center py-1.5 px-2 rounded-xl bg-slate-100/80 text-xs font-bold text-slate-400 flex items-center justify-center gap-1">
                  <FiLock size={12} /> Locked
                </div>
              )}
            </div>
          </div>

          {/* Step 6 */}
          <div
            className={`p-4 sm:p-5 rounded-2xl sm:rounded-3xl border-2 flex flex-col justify-between transition-all duration-200 ${
              isAccountActive
                ? "border-emerald-400 bg-emerald-100/90 text-emerald-950 shadow-md ring-4 ring-emerald-500/20"
                : "border-slate-200 bg-white/70 text-slate-400 opacity-60"
            }`}
          >
            <div>
              <div className="flex items-center justify-between gap-1.5 mb-3">
                <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black shrink-0 shadow-xs ${
                  isAccountActive ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-500 border border-slate-200"
                }`}>
                  6
                </span>
                <span className={`text-[10px] sm:text-[11px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full whitespace-nowrap leading-none shrink-0 inline-flex items-center gap-1 ${
                  isAccountActive ? "bg-emerald-600 text-white shadow-xs" : "bg-slate-100 text-slate-500 border border-slate-200/80"
                }`}>
                  {isAccountActive ? (
                    <>
                      <FiCheckCircle size={11} /> 100% ACTIVE
                    </>
                  ) : (
                    <>
                      <FiLock size={10} /> LOCKED
                    </>
                  )}
                </span>
              </div>
              <div className="flex items-center gap-1.5 font-black text-sm text-slate-900 mb-1">
                <FiShoppingBag size={18} className={isAccountActive ? "text-emerald-700 shrink-0" : "text-slate-400 shrink-0"} />
                <span>Operations Start</span>
              </div>
              <p className="text-xs text-slate-600 font-medium leading-relaxed">
                {isAccountActive ? "Wholesale Ordering Unlocked" : "Full Access Pending"}
              </p>
            </div>
            <div className="mt-4">
              {isAccountActive ? (
                <Link
                  to="/dashboard"
                  className="w-full py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black flex items-center justify-center gap-1 shadow-md transition-all cursor-pointer animate-bounce"
                >
                  <span>Go to Dashboard →</span>
                </Link>
              ) : (
                <div className="text-center py-1.5 px-2 rounded-xl bg-slate-100/80 text-xs font-bold text-slate-400 flex items-center justify-center gap-1">
                  <FiLock size={12} /> Locked
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Active Action Guidance Box (Bright Card) ─────────────────────── */}
        <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200 shadow-lg space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
            <div>
              <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                <span>Current Onboarding Stage:</span>
                <span className="text-[#0575B8]">
                  {isAccountActive
                    ? "Phase 4: Operations Live"
                    : !isAgreementSigned
                    ? "Phase 2: Agreement Review & Execution"
                    : !isReceiptUploaded
                    ? "Phase 2: Offline Payment & Receipt Submission"
                    : "Phase 3: Administrative Receipt Verification"}
                </span>
              </h2>
              <p className="text-sm text-slate-500 mt-1 font-medium">
                Each step must be completed in order. Once Admin verifies your uploaded receipt, you will gain full access to the operational franchise dashboard.
              </p>
            </div>

            {isAccountActive && (
              <Link
                to="/dashboard"
                className="px-8 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-black inline-flex items-center gap-2 shadow-lg shadow-emerald-600/25 transition cursor-pointer"
              >
                <span>Enter Franchise Dashboard</span>
                <FiArrowRight size={18} />
              </Link>
            )}
          </div>

          {/* Interactive Guided Action Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 text-sm">
            {/* Action 1: Sign Agreement */}
            <div className={`p-6 rounded-3xl border-2 transition-all flex flex-col justify-between ${
              isAgreementSigned
                ? "border-emerald-200 bg-emerald-50/50 shadow-xs"
                : "border-[#0575B8] bg-blue-50/60 shadow-md ring-2 ring-blue-500/20"
            }`}>
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="font-black text-base text-slate-900 flex items-center gap-2">
                    <FiFileText size={18} className="text-[#0575B8]" /> Step 3: Agreement
                  </span>
                  <span className={`text-xs font-black px-3 py-1 rounded-full ${
                    isAgreementSigned ? "bg-emerald-100 text-emerald-800" : "bg-blue-100 text-blue-900 border border-blue-200"
                  }`}>
                    {isAgreementSigned ? "✓ Completed" : "Action Needed"}
                  </span>
                </div>
                <p className="text-slate-600 mb-5 leading-relaxed font-medium">
                  Review your tailored franchise distribution agreement and execute it digitally or upload a signed scan.
                </p>
              </div>
              <button
                onClick={() => setAgreementModalOpen(true)}
                className="w-full py-3 px-4 rounded-2xl bg-[#0575B8] hover:bg-[#045D93] text-white font-bold transition shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 cursor-pointer"
              >
                <FiFileText size={16} />
                <span>{isAgreementSigned ? "View Agreement Copy" : "Review & Sign Agreement"}</span>
              </button>
            </div>

            {/* Action 2: Fee Payment & Receipt */}
            <div className={`p-6 rounded-3xl border-2 transition-all flex flex-col justify-between ${
              isReceiptUploaded
                ? "border-emerald-200 bg-emerald-50/50 shadow-xs"
                : isAgreementSigned
                ? "border-amber-400 bg-amber-50/60 shadow-md ring-2 ring-amber-400/20"
                : "border-slate-200 bg-slate-50 opacity-60"
            }`}>
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="font-black text-base text-slate-900 flex items-center gap-2">
                    <FiCreditCard size={18} className="text-amber-700" /> Step 4: Fee Payment
                  </span>
                  <span className={`text-xs font-black px-3 py-1 rounded-full ${
                    isReceiptUploaded ? "bg-emerald-100 text-emerald-800" : isAgreementSigned ? "bg-amber-100 text-amber-900 border border-amber-300" : "bg-slate-200 text-slate-600"
                  }`}>
                    {isReceiptUploaded ? "✓ Submitted" : isAgreementSigned ? "Pending Upload" : "Locked"}
                  </span>
                </div>
                <p className="text-slate-600 mb-5 leading-relaxed font-medium">
                  Payment details are discussed verbally with your Account Manager. Upload your bank UTR and transfer receipt slip.
                </p>
              </div>
              <button
                disabled={!isAgreementSigned}
                onClick={() => setPaymentModalOpen(true)}
                className="w-full py-3 px-4 rounded-2xl bg-amber-600 hover:bg-amber-700 text-white font-bold transition shadow-md shadow-amber-600/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <FiUploadCloud size={16} />
                <span>{isReceiptUploaded ? "View / Update Receipt" : "Upload Payment Receipt"}</span>
              </button>
            </div>

            {/* Action 3: Admin Review & Activation */}
            <div className={`p-6 rounded-3xl border-2 transition-all flex flex-col justify-between ${
              isAccountActive
                ? "border-emerald-300 bg-emerald-50/60 shadow-xs"
                : isReceiptUploaded
                ? "border-sky-400 bg-sky-50/60 shadow-md ring-2 ring-sky-400/20"
                : "border-slate-200 bg-slate-50 opacity-60"
            }`}>
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="font-black text-base text-slate-900 flex items-center gap-2">
                    <FiCheckCircle size={18} className="text-emerald-700" /> Step 5 & 6: Activation
                  </span>
                  <span className={`text-xs font-black px-3 py-1 rounded-full ${
                    isAccountActive ? "bg-emerald-100 text-emerald-800" : isReceiptUploaded ? "bg-sky-100 text-sky-900 border border-sky-300" : "bg-slate-200 text-slate-600"
                  }`}>
                    {isAccountActive ? "✓ Active" : isReceiptUploaded ? "In Review" : "Pending Steps"}
                  </span>
                </div>
                <p className="text-slate-600 mb-5 leading-relaxed font-medium">
                  {isAccountActive
                    ? "Admin verification confirmed. Your franchise partner privileges are 100% active."
                    : isReceiptUploaded
                    ? "Receipt submitted! The SolarKits admin team is verifying your payment slip to grant go-live access."
                    : "Awaiting agreement execution and payment receipt upload before admin verification."}
                </p>
              </div>
              {isAccountActive ? (
                <Link
                  to="/dashboard"
                  className="w-full py-3 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black transition shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 cursor-pointer text-center"
                >
                  <FiShoppingBag size={16} />
                  <span>Enter Dashboard</span>
                </Link>
              ) : (
                <div className="w-full py-3 px-4 rounded-2xl bg-slate-100 text-slate-500 font-bold text-center border border-slate-200">
                  {isReceiptUploaded ? "⏳ Verification in Progress" : "🔒 Awaiting Steps"}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* ── MODAL 1: Digital Franchise Agreement Signing & Upload ─────────── */}
      <AnimatePresence>
        {agreementModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white border border-slate-200 rounded-3xl max-w-3xl w-full max-h-[92vh] overflow-y-auto shadow-2xl p-6 sm:p-8 text-slate-900 relative my-6"
            >
              <button
                onClick={() => setAgreementModalOpen(false)}
                className="absolute top-6 right-6 p-2 rounded-xl bg-slate-100 text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
              >
                <FiX size={20} />
              </button>

              <div className="space-y-5">
                <div className="border-b border-slate-100 pb-3">
                  <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-blue-100 text-[#0575B8] border border-blue-200">
                    Step 3 • Franchise Agreement Execution
                  </span>
                  <h3 className="text-2xl font-black text-slate-900 mt-2">
                    SolarKits Authorized Franchise Partner Agreement
                  </h3>
                  <p className="text-sm text-slate-500 mt-1">
                    Agreement No: <strong className="font-mono">{agreementData?.agreement_number || `SK-FRN-AGR-${new Date().getFullYear()}`}</strong>
                  </p>
                </div>

                {/* Agreement Terms Scrollbox */}
                <div className="h-64 overflow-y-auto p-5 rounded-2xl bg-slate-50 border border-slate-200 text-sm text-slate-700 space-y-3 font-sans leading-relaxed">
                  <div className="font-bold text-slate-900 text-base border-b pb-1.5">
                    TERMS OF FRANCHISE APPOINTMENT & DISTRIBUTION RIGHTS
                  </div>
                  <p>
                    <strong>1. APPOINTMENT:</strong> SolarKits Clean Energy Solutions Private Limited authorizes <strong>{companyName}</strong> as an authorized regional partner for combo kit distribution and EPC contractor allocation.
                  </p>
                  <p>
                    <strong>2. TERRITORY:</strong> Operations are granted within assigned territory: <strong>{reseller?.address?.city || reseller?.address?.state || "Assigned District"}</strong>.
                  </p>
                  <p>
                    <strong>3. COMMERCIAL MARGINS:</strong> Partner receives direct factory margins on pre-engineered turnkey Combo Kits, solar panels, and mounting accessories.
                  </p>
                  <p>
                    <strong>4. MANUAL PAYMENT VERIFICATION:</strong> Account activation is completed upon admin verification of the offline fee payment receipt.
                  </p>
                </div>

                {isAgreementSigned ? (
                  <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-sm space-y-1">
                    <div className="flex items-center gap-2 font-bold text-base">
                      <FiCheckCircle className="text-emerald-600" size={20} />
                      <span>Agreement Already Signed</span>
                    </div>
                    <p>Signatory: <strong>{reseller?.agreement_signer_name || primaryName}</strong></p>
                    <p>Signed on: <strong>{new Date(reseller?.agreement_signed_at || Date.now()).toLocaleString()}</strong></p>
                  </div>
                ) : (
                  <form onSubmit={handleSignAgreement} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-bold text-slate-700 block mb-1.5">
                          Full Legal Signatory Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={signerName}
                          onChange={(e) => setSignerName(e.target.value)}
                          placeholder="e.g. Ramesh Chandra"
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 focus:bg-white focus:outline-none focus:border-[#0575B8] shadow-xs"
                        />
                      </div>

                      <div>
                        <label className="text-sm font-bold text-slate-700 block mb-1.5">
                          Signatory Designation <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={signerDesignation}
                          onChange={(e) => setSignerDesignation(e.target.value)}
                          placeholder="e.g. Proprietor / Managing Director"
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 focus:bg-white focus:outline-none focus:border-[#0575B8] shadow-xs"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-bold text-slate-700 block mb-1.5">
                        Upload Signed Agreement Copy (Optional PDF / Image)
                      </label>
                      <input
                        type="file"
                        accept="image/*,application/pdf"
                        onChange={(e) => setAgreementFile(e.target.files?.[0] || null)}
                        className="w-full px-4 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-700 focus:outline-none"
                      />
                    </div>

                    <label className="flex items-start gap-2.5 text-sm text-slate-600 cursor-pointer select-none pt-1">
                      <input
                        type="checkbox"
                        checked={consentAgreed}
                        onChange={(e) => setConsentAgreed(e.target.checked)}
                        className="mt-1 rounded text-[#0575B8] focus:ring-0"
                      />
                      <span>
                        I confirm that I am the authorized representative of <strong>{companyName}</strong> and execute this Franchise Agreement.
                      </span>
                    </label>

                    {agreementError && (
                      <p className="text-sm font-bold text-red-600">{agreementError}</p>
                    )}

                    <div className="flex items-center justify-end gap-3 pt-3">
                      <button
                        type="button"
                        onClick={() => setAgreementModalOpen(false)}
                        className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={signingLoading}
                        className="px-7 py-3 rounded-xl bg-[#0575B8] hover:bg-[#045D93] text-white text-sm font-black flex items-center gap-2 shadow-lg shadow-blue-600/20 cursor-pointer"
                      >
                        {signingLoading ? <FiLoader className="animate-spin" /> : <FiCheck size={18} />}
                        <span>Digitally Sign & Proceed to Fee Payment</span>
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── MODAL 2: Offline Payment & Receipt Upload (Bright Amber Notice) ── */}
      <AnimatePresence>
        {paymentModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white border border-slate-200 rounded-3xl max-w-3xl w-full max-h-[92vh] overflow-y-auto shadow-2xl p-6 sm:p-8 text-slate-900 relative my-6"
            >
              <button
                onClick={() => setPaymentModalOpen(false)}
                className="absolute top-6 right-6 p-2 rounded-xl bg-slate-100 text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
              >
                <FiX size={20} />
              </button>

              <div className="space-y-5">
                <div className="border-b border-slate-100 pb-3">
                  <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-amber-100 text-amber-900 border border-amber-300">
                    Step 4 & 5 • Offline Manual Fee Payment
                  </span>
                  <h3 className="text-2xl font-black text-slate-900 mt-2">
                    Franchise Fee Payment & Receipt Submission
                  </h3>
                  <p className="text-sm text-slate-500 mt-1">
                    Submit your transaction reference number (UTR) and payment slip below.
                  </p>
                </div>

                {/* Bright Amber Notice Card — No System Bank Details Attached */}
                <div className="p-6 rounded-2xl bg-amber-50 border-2 border-amber-300 text-amber-950 space-y-3 shadow-xs">
                  <div className="flex items-center justify-between border-b border-amber-200 pb-2.5">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full bg-amber-500 animate-pulse" />
                      <span className="text-xs font-black uppercase text-amber-900 tracking-wider">
                        Verbal Account Manager Payment Consultation
                      </span>
                    </div>
                    <span className="text-xs font-mono font-bold text-amber-900 bg-amber-200/80 px-2.5 py-0.5 rounded border border-amber-400">
                      Company Policy
                    </span>
                  </div>

                  <div className="space-y-2 text-sm text-amber-900 leading-relaxed">
                    <p className="font-bold">
                      Important Security Policy: Company bank account details are not attached or shared through the system.
                    </p>
                    <p className="text-amber-800 font-medium">
                      All payment details and bank transfer options are communicated directly through verbal discussion with your assigned Account Manager.
                    </p>
                  </div>

                  <div className="flex items-center justify-between border-t border-amber-200 pt-3 text-sm font-semibold">
                    <span className="text-amber-800">Enrollment Fee Reference:</span>
                    <span className="font-black text-amber-950 text-base">₹{Number(amountPaid).toLocaleString("en-IN")} (+ GST as applicable)</span>
                  </div>
                </div>

                {/* Receipt Upload & UTR Submission Form */}
                <form onSubmit={handleUploadReceipt} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-bold text-slate-700 block mb-1.5">
                        Bank UTR / Transaction Reference No. <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={utrNumber}
                        onChange={(e) => setUtrNumber(e.target.value.toUpperCase())}
                        placeholder="e.g. HDFC260812345678"
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-sm font-mono font-bold text-slate-900 uppercase focus:bg-white focus:outline-none focus:border-[#0575B8] shadow-xs"
                      />
                    </div>

                    <div>
                      <label className="text-sm font-bold text-slate-700 block mb-1.5">
                        Amount Paid (₹) <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        required
                        value={amountPaid}
                        onChange={(e) => setAmountPaid(e.target.value)}
                        placeholder="50000"
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-sm font-bold text-slate-900 focus:bg-white focus:outline-none focus:border-[#0575B8] shadow-xs"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-bold text-slate-700 block mb-1.5">
                        Payment Date <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="date"
                        required
                        value={paymentDate}
                        onChange={(e) => setPaymentDate(e.target.value)}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 focus:bg-white focus:outline-none focus:border-[#0575B8] shadow-xs"
                      />
                    </div>

                    <div>
                      <label className="text-sm font-bold text-slate-700 block mb-1.5">
                        Remitter Bank Name
                      </label>
                      <input
                        type="text"
                        value={senderBank}
                        onChange={(e) => setSenderBank(e.target.value)}
                        placeholder="e.g. State Bank of India"
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 focus:bg-white focus:outline-none focus:border-[#0575B8] shadow-xs"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-bold text-slate-700 block mb-1.5">
                      Upload Payment Slip / Screenshot / PDF
                    </label>
                    <div className="relative border-2 border-dashed border-slate-300 rounded-2xl p-5 text-center bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer">
                      <input
                        type="file"
                        accept="image/*,application/pdf"
                        onChange={(e) => setReceiptFile(e.target.files?.[0] || null)}
                        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                      />
                      <div className="flex flex-col items-center gap-1.5 text-slate-600">
                        <FiUploadCloud size={24} className="text-[#0575B8]" />
                        <span className="text-sm font-bold text-slate-800">
                          {receiptFile ? receiptFile.name : "Click to select or drop transfer receipt slip"}
                        </span>
                        <span className="text-xs text-slate-400 font-medium">Supports JPG, PNG, WEBP, PDF (Max 10MB)</span>
                      </div>
                    </div>
                  </div>

                  {uploadError && (
                    <p className="text-sm font-bold text-red-600">{uploadError}</p>
                  )}

                  <div className="flex items-center justify-end gap-3 pt-3">
                    <button
                      type="button"
                      onClick={() => setPaymentModalOpen(false)}
                      className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold cursor-pointer"
                    >
                      Close
                    </button>
                    <button
                      type="submit"
                      disabled={uploadLoading}
                      className="px-8 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-black flex items-center gap-2 shadow-lg shadow-emerald-600/20 cursor-pointer"
                    >
                      {uploadLoading ? <FiLoader className="animate-spin" /> : <FiCheckCircle size={18} />}
                      <span>Submit Payment Receipt for Admin Verification</span>
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
