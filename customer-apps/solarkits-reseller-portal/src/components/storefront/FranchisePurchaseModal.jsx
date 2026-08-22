import { useState, useEffect, useRef, useId } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiX,
  FiCheckCircle,
  FiAlertCircle,
  FiShield,
  FiMapPin,
  FiLock,
  FiCreditCard,
  FiArrowRight,
  FiArrowLeft,
  FiLoader,
  FiZap,
  FiUser,
  FiMail,
  FiPhone,
  FiBriefcase,
  FiDollarSign,
  FiHome,
  FiCheck,
  FiInfo,
} from "react-icons/fi";
import api from "../../services/api";
import { INDIAN_STATES_DISTRICTS } from "../../data/territoryData";

const GSTIN_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
const RAZORPAY_KEY = import.meta.env.VITE_RAZORPAY_KEY_ID || "rzp_test_T8B85UkbvoXBOQ";

// ─── Razorpay Loader ─────────────────────────────────────────────────────────
function loadRazorpayScript() {
  return new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export default function FranchisePurchaseModal({
  isOpen,
  onClose,
  initialPlan = null,
}) {
  const navigate = useNavigate();

  // Multi-step state: 1 = Territory & Exclusivity, 2 = Business & GST, 3 = Plan & Bank, 4 = Payment, 5 = Success
  const [step, setStep] = useState(1);

  // Selected plan state
  const [plan, setPlan] = useState(initialPlan);

  // ── Step 1: Territory Selection & Exclusivity State ──────────────────────────
  const [territoryLevel, setTerritoryLevel] = useState("district"); // 'district' | 'state' | 'country'
  const [selectedState, setSelectedState] = useState("Maharashtra");
  const [selectedDistrict, setSelectedDistrict] = useState("Pune");
  const [selectedCountry, setSelectedCountry] = useState("India");

  const [checkingAvailability, setCheckingAvailability] = useState(false);
  const [availabilityResult, setAvailabilityResult] = useState(null);
  const [availabilityError, setAvailabilityError] = useState("");

  // ── Step 2: Business Profile & GST Verification State ────────────────────────
  const [gstInput, setGstInput] = useState("");
  const [gstVerifying, setGstVerifying] = useState(false);
  const [gstResult, setGstResult] = useState(null);
  const [gstError, setGstError] = useState("");

  const [form, setForm] = useState({
    business_name: "",
    contact_person: "",
    email: "",
    mobile: "",
    password: "",
    pan_number: "",
    address_line: "",
    pincode: "",
  });
  const [formErrors, setFormErrors] = useState({});

  // ── Step 3: Bank Details State ───────────────────────────────────────────────
  const [bankDetails, setBankDetails] = useState({
    bank_name: "",
    account_number: "",
    ifsc_code: "",
    account_holder_name: "",
    branch: "",
    upi_id: "",
  });

  // ── Step 4: Payment State ───────────────────────────────────────────────────
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState("");
  const [onboardedData, setOnboardedData] = useState(null);

  // Sync initial plan context
  useEffect(() => {
    if (initialPlan) {
      setPlan(initialPlan);
      const level = (initialPlan.territory_level || "district").toLowerCase();
      setTerritoryLevel(level);
    }
  }, [initialPlan, isOpen]);

  // Sync districts when state changes
  useEffect(() => {
    if (selectedState && INDIAN_STATES_DISTRICTS[selectedState]) {
      const districts = INDIAN_STATES_DISTRICTS[selectedState];
      if (!districts.includes(selectedDistrict)) {
        setSelectedDistrict(districts[0] || "");
      }
    }
  }, [selectedState]);

  // Live Territory Availability Check
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    const checkAvailability = async () => {
      setCheckingAvailability(true);
      setAvailabilityError("");

      try {
        const params = {
          territory_level: territoryLevel,
          country_name: selectedCountry,
          state_name: selectedState,
          district_name: territoryLevel === "district" ? selectedDistrict : undefined,
        };

        const res = await api.get("/india/v1/reseller/territory/availability", { params });
        if (isMounted) {
          if (res.data?.status === "success") {
            setAvailabilityResult(res.data.data);
          } else {
            setAvailabilityError(res.data?.message || "Failed to verify territory availability.");
          }
        }
      } catch (err) {
        if (isMounted) {
          setAvailabilityError(err.response?.data?.message || "Could not check territory exclusivity.");
        }
      } finally {
        if (isMounted) setCheckingAvailability(false);
      }
    };

    const debounceTimer = setTimeout(checkAvailability, 300);
    return () => {
      isMounted = false;
      clearTimeout(debounceTimer);
    };
  }, [territoryLevel, selectedState, selectedDistrict, selectedCountry, isOpen]);

  // ── GSTIN Verify ─────────────────────────────────────────────────────────────
  const handleVerifyGst = async () => {
    const gstin = gstInput.trim().toUpperCase();
    setGstError("");

    if (!gstin) {
      setGstError("Please enter your 15-character GSTIN.");
      return;
    }
    if (!GSTIN_REGEX.test(gstin)) {
      setGstError("Invalid GSTIN format (e.g. 27ABCDE1234F1Z5).");
      return;
    }

    setGstVerifying(true);
    try {
      const res = await api.post("/india/v1/reseller/gst/verify", { gstin });
      if (res.data?.status === "success") {
        const d = res.data.data;
        setGstResult(d);
        const bizName = d.legal_name || d.trade_name || form.business_name;
        setForm((prev) => ({
          ...prev,
          business_name: bizName,
          pan_number: gstin.substring(2, 12),
        }));
      } else {
        setGstError(res.data?.message || "GSTIN verification returned no match.");
      }
    } catch (err) {
      setGstError(err.response?.data?.message || "GST verification failed. Please recheck the number.");
    } finally {
      setGstVerifying(false);
    }
  };

  // ── Step Form Validations ──────────────────────────────────────────────────
  const validateStep2 = () => {
    const errs = {};
    if (!form.business_name.trim()) errs.business_name = "Business Name is required";
    if (!form.contact_person.trim()) errs.contact_person = "Contact Person name is required";
    if (!form.email.trim() || !form.email.includes("@")) errs.email = "Valid email address is required";
    if (!form.mobile.trim() || form.mobile.length < 10) errs.mobile = "10-digit mobile number is required";
    if (!form.password || form.password.length < 6) errs.password = "Password must be at least 6 characters";

    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // ── Execute Purchase & Onboarding Flow ───────────────────────────────────────
  const handleCompletePurchase = async (sandboxMode = false) => {
    setPaymentProcessing(true);
    setPaymentError("");

    const payload = {
      plan_id: plan?.id || plan?._id,
      territory_level: territoryLevel,
      country_name: selectedCountry,
      state_name: selectedState,
      district_name: territoryLevel === "district" ? selectedDistrict : undefined,
      business_name: form.business_name.trim(),
      contact_person: form.contact_person.trim(),
      email: form.email.trim().toLowerCase(),
      mobile: form.mobile.trim(),
      password: form.password,
      gst_number: gstInput.trim().toUpperCase() || undefined,
      pan_number: form.pan_number?.trim().toUpperCase() || undefined,
      address: {
        line: form.address_line,
        city: selectedDistrict,
        state: selectedState,
        pincode: form.pincode,
        country: selectedCountry,
      },
      bank_details: bankDetails.account_number ? bankDetails : undefined,
      is_sandbox_payment: sandboxMode,
    };

    try {
      if (sandboxMode) {
        // Instant Sandbox / Test Confirmation
        payload.razorpay_payment_id = `PAY_DEMO_${Date.now()}`;
        const res = await api.post("/india/v1/reseller/plans/purchase-and-onboard", payload);

        if (res.data?.status === "success") {
          const authData = res.data.data;
          if (authData?.token) {
            localStorage.setItem("reseller_token", authData.token);
            localStorage.setItem("reseller_user", JSON.stringify(authData.user));
          }
          setOnboardedData(authData);
          setStep(5);
        } else {
          setPaymentError(res.data?.message || "Purchase and onboarding failed.");
        }
      } else {
        // Live Razorpay Flow
        const loaded = await loadRazorpayScript();
        if (!loaded) {
          setPaymentError("Could not load Razorpay SDK. Please check your internet connection.");
          setPaymentProcessing(false);
          return;
        }

        // 1. Create Razorpay order
        const orderRes = await api.post("/india/v1/reseller/plans/create-order", {
          plan_id: plan?.id || plan?._id,
          bank_details: bankDetails,
        });

        if (orderRes.data?.status !== "success" || !orderRes.data?.data?.razorpay_order_id) {
          throw new Error(orderRes.data?.message || "Failed to initialize payment gateway order.");
        }

        const orderInfo = orderRes.data.data;

        // 2. Open Razorpay modal
        const options = {
          key: orderInfo.key_id || RAZORPAY_KEY,
          amount: orderInfo.amount_paise,
          currency: orderInfo.currency || "INR",
          name: "SolarKits India",
          description: `Franchise Plan: ${plan?.name || plan?.plan_name} (${territoryLevel.toUpperCase()} LEVEL)`,
          order_id: orderInfo.razorpay_order_id,
          prefill: {
            name: form.contact_person || form.business_name,
            email: form.email,
            contact: form.mobile,
          },
          theme: { color: "#0575B8" },
          handler: async function (response) {
            try {
              // 3. Confirm payment & complete automated onboarding
              payload.razorpay_order_id = response.razorpay_order_id;
              payload.razorpay_payment_id = response.razorpay_payment_id;
              payload.razorpay_signature = response.razorpay_signature;

              const onboardRes = await api.post("/india/v1/reseller/plans/purchase-and-onboard", payload);
              if (onboardRes.data?.status === "success") {
                const authData = onboardRes.data.data;
                if (authData?.token) {
                  localStorage.setItem("reseller_token", authData.token);
                  localStorage.setItem("reseller_user", JSON.stringify(authData.user));
                }
                setOnboardedData(authData);
                setStep(5);
              } else {
                setPaymentError(onboardRes.data?.message || "Payment verified but onboarding encountered an issue.");
              }
            } catch (err) {
              setPaymentError(err.response?.data?.message || err.message || "Onboarding confirmation failed.");
            } finally {
              setPaymentProcessing(false);
            }
          },
          modal: {
            ondismiss: function () {
              setPaymentProcessing(false);
            },
          },
        };

        const rzp = new window.Razorpay(options);
        rzp.open();
        return;
      }
    } catch (err) {
      setPaymentError(err.response?.data?.message || err.message || "Failed to process franchise purchase.");
    } finally {
      if (sandboxMode) setPaymentProcessing(false);
    }
  };

  // Redirect to dashboard on completion
  const handleProceedToDashboard = () => {
    onClose();
    navigate("/dashboard?onboarding=true");
  };

  if (!isOpen) return null;

  const planPriceInr = Number(plan?.one_time_fee || plan?.annual_fee || 0);
  const formattedPrice =
    planPriceInr === 0 ? "Custom / Enterprise" : `₹${planPriceInr.toLocaleString("en-IN")}`;

  const territoryTitle =
    territoryLevel === "district"
      ? `${selectedDistrict} District, ${selectedState}`
      : territoryLevel === "state"
      ? `${selectedState} State Exclusivity`
      : "Pan-India National Exclusivity";

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]"
      >
        {/* Modal Top Header Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-blue-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#0575B8]/10 text-[#0575B8] flex items-center justify-center font-bold">
              <FiZap size={18} />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 tracking-tight flex items-center gap-2">
                <span>Franchise Territory Onboarding</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-[#0575B8] text-white">
                  {territoryLevel} Level
                </span>
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Protected 1-Partner Exclusive Allocation System
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition"
          >
            <FiX size={16} />
          </button>
        </div>

        {/* Step Progress Tracker */}
        {step < 5 && (
          <div className="px-6 py-3 bg-slate-50/80 border-b border-slate-100 flex items-center justify-between text-xs font-bold text-slate-600">
            {[
              { num: 1, label: "Territory Exclusivity" },
              { num: 2, label: "Business & GST" },
              { num: 3, label: "Plan & Payouts" },
              { num: 4, label: "Confirm & Pay" },
            ].map((s, idx) => (
              <div key={s.num} className="flex items-center gap-1.5 sm:gap-2">
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-black transition-all ${
                    step === s.num
                      ? "bg-[#0575B8] text-white shadow-md shadow-blue-500/20"
                      : step > s.num
                      ? "bg-emerald-500 text-white"
                      : "bg-slate-200 text-slate-500"
                  }`}
                >
                  {step > s.num ? <FiCheck size={12} /> : s.num}
                </div>
                <span
                  className={`hidden sm:inline ${
                    step === s.num ? "text-[#0575B8] font-black" : "text-slate-500"
                  }`}
                >
                  {s.label}
                </span>
                {idx < 3 && <div className="hidden sm:block w-4 h-0.5 bg-slate-200" />}
              </div>
            ))}
          </div>
        )}

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* ═══════════════════════════════════════════════════════════════════ */}
          {/* STEP 1: TERRITORY SELECTION & EXCLUSIVITY VERIFICATION             */}
          {/* ═══════════════════════════════════════════════════════════════════ */}
          {step === 1 && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-5">
              <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-100 flex items-start gap-3">
                <FiShield className="text-[#0575B8] shrink-0 mt-0.5" size={20} />
                <div className="text-xs space-y-0.5">
                  <p className="font-bold text-slate-900">
                    Strict Territorial Exclusivity Guarantee
                  </p>
                  <p className="text-slate-600">
                    Only <strong className="text-[#0575B8]">one authorized franchisee</strong> can be assigned to each district, state, or country. Once allocated, no other partner can obtain exclusive rights in your designated territory.
                  </p>
                </div>
              </div>

              {/* Territory Level Picker */}
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-2">
                  Franchise Territory Level
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { key: "district", label: "District Level", desc: "Local Exclusivity" },
                    { key: "state", label: "State Level", desc: "Regional Network" },
                    { key: "country", label: "Master Franchise", desc: "Pan-India License" },
                  ].map((lvl) => (
                    <button
                      key={lvl.key}
                      type="button"
                      onClick={() => setTerritoryLevel(lvl.key)}
                      className={`p-3 rounded-2xl border text-left transition-all ${
                        territoryLevel === lvl.key
                          ? "border-[#0575B8] bg-blue-50/50 shadow-sm"
                          : "border-slate-200 bg-white hover:border-slate-300"
                      }`}
                    >
                      <p className="text-xs font-black text-slate-900">{lvl.label}</p>
                      <p className="text-[10px] text-slate-500 mt-0.5">{lvl.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Geographic Dropdowns */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* State Dropdown (if district or state) */}
                {(territoryLevel === "district" || territoryLevel === "state") && (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Select State <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <select
                        value={selectedState}
                        onChange={(e) => setSelectedState(e.target.value)}
                        className="w-full px-3.5 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        {Object.keys(INDIAN_STATES_DISTRICTS).map((st) => (
                          <option key={st} value={st}>
                            {st}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}

                {/* District Dropdown (if district level) */}
                {territoryLevel === "district" && (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Select District <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <select
                        value={selectedDistrict}
                        onChange={(e) => setSelectedDistrict(e.target.value)}
                        className="w-full px-3.5 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        {(INDIAN_STATES_DISTRICTS[selectedState] || []).map((dst) => (
                          <option key={dst} value={dst}>
                            {dst}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}

                {/* Country Display (if country level) */}
                {territoryLevel === "country" && (
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Country Exclusivity
                    </label>
                    <input
                      type="text"
                      disabled
                      value="India (National Master Franchise License)"
                      className="w-full px-3.5 py-3 rounded-xl border border-slate-200 bg-slate-100 text-sm font-bold text-slate-800"
                    />
                  </div>
                )}
              </div>

              {/* Live Exclusivity Availability Feedback Card */}
              <div className="rounded-2xl border p-4 transition-all duration-300">
                {checkingAvailability ? (
                  <div className="flex items-center gap-2.5 text-xs text-slate-500 font-semibold py-1">
                    <FiLoader className="animate-spin text-[#0575B8]" size={16} />
                    <span>Verifying real-time exclusivity for {territoryTitle}...</span>
                  </div>
                ) : availabilityResult?.is_available ? (
                  <div className="flex items-start gap-3 bg-emerald-50/80 -m-4 p-4 rounded-2xl border border-emerald-200">
                    <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                      <FiCheckCircle size={18} />
                    </div>
                    <div>
                      <p className="text-xs font-black text-emerald-900 flex items-center gap-1.5">
                        <span>Territory Available for Exclusive Assignment!</span>
                        <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                      </p>
                      <p className="text-xs text-emerald-700 mt-0.5">
                        <strong>{territoryTitle}</strong> is currently unallocated. You will be assigned as the exclusive authorized partner upon payment confirmation.
                      </p>
                    </div>
                  </div>
                ) : availabilityResult && !availabilityResult.is_available ? (
                  <div className="flex items-start gap-3 bg-red-50/80 -m-4 p-4 rounded-2xl border border-red-200">
                    <div className="w-8 h-8 rounded-full bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                      <FiAlertCircle size={18} />
                    </div>
                    <div>
                      <p className="text-xs font-black text-red-900">
                        Territory Already Reserved
                      </p>
                      <p className="text-xs text-red-700 mt-0.5">
                        {availabilityResult.message || "This territory is already assigned to another partner. Please select an adjacent district or state."}
                      </p>
                    </div>
                  </div>
                ) : availabilityError ? (
                  <div className="text-xs text-amber-700 font-medium">
                    {availabilityError}
                  </div>
                ) : null}
              </div>
            </motion.div>
          )}

          {/* ═══════════════════════════════════════════════════════════════════ */}
          {/* STEP 2: BUSINESS PROFILE & FAST GST VERIFICATION                   */}
          {/* ═══════════════════════════════════════════════════════════════════ */}
          {step === 2 && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
              {/* GSTIN Verification Lookup */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black uppercase tracking-wider text-slate-800">
                    1. Instant GSTIN Verification (Recommended)
                  </label>
                  <span className="text-[10px] font-bold text-blue-600">Auto-fills Business Info</span>
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    maxLength={15}
                    placeholder="e.g. 27ABCDE1234F1Z5"
                    value={gstInput}
                    onChange={(e) => setGstInput(e.target.value.toUpperCase())}
                    className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-mono font-bold text-slate-900 uppercase focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    onClick={handleVerifyGst}
                    disabled={gstVerifying || !gstInput.trim()}
                    className="px-4 py-2.5 rounded-xl bg-[#0575B8] hover:bg-[#045D93] text-white text-xs font-bold transition flex items-center gap-1.5 disabled:opacity-50"
                  >
                    {gstVerifying ? <FiLoader className="animate-spin" size={14} /> : <FiShield size={14} />}
                    <span>Verify GST</span>
                  </button>
                </div>

                {gstResult && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-start gap-2">
                    <FiCheckCircle className="shrink-0 text-emerald-600 mt-0.5" size={15} />
                    <div>
                      <p className="font-black">{gstResult.legal_name || gstResult.trade_name}</p>
                      <p className="text-[11px] text-emerald-700">
                        GSTIN verified • {gstResult.business_status || "Active Status"}
                      </p>
                    </div>
                  </div>
                )}
                {gstError && <p className="text-xs text-red-600 font-semibold">{gstError}</p>}
              </div>

              {/* Business & Buyer Details Form */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Registered Business / Entity Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.business_name}
                    onChange={(e) => setForm({ ...form, business_name: e.target.value })}
                    placeholder="e.g. Surya Solar Energy Solutions Pvt Ltd"
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-xs font-semibold ${
                      formErrors.business_name ? "border-red-400 bg-red-50" : "border-slate-200 bg-white"
                    } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  />
                  {formErrors.business_name && (
                    <p className="text-[11px] text-red-500 mt-1">{formErrors.business_name}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Contact Person Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.contact_person}
                    onChange={(e) => setForm({ ...form, contact_person: e.target.value })}
                    placeholder="Authorized Director / Signatory"
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-xs font-semibold ${
                      formErrors.contact_person ? "border-red-400 bg-red-50" : "border-slate-200 bg-white"
                    } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  />
                  {formErrors.contact_person && (
                    <p className="text-[11px] text-red-500 mt-1">{formErrors.contact_person}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Mobile Number (For Login & OTP) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    maxLength={10}
                    value={form.mobile}
                    onChange={(e) => setForm({ ...form, mobile: e.target.value })}
                    placeholder="10-digit mobile number"
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-xs font-semibold ${
                      formErrors.mobile ? "border-red-400 bg-red-50" : "border-slate-200 bg-white"
                    } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  />
                  {formErrors.mobile && (
                    <p className="text-[11px] text-red-500 mt-1">{formErrors.mobile}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="business@example.com"
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-xs font-semibold ${
                      formErrors.email ? "border-red-400 bg-red-50" : "border-slate-200 bg-white"
                    } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  />
                  {formErrors.email && (
                    <p className="text-[11px] text-red-500 mt-1">{formErrors.email}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Create Franchisee Password <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="password"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    placeholder="Minimum 6 characters"
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-xs font-semibold ${
                      formErrors.password ? "border-red-400 bg-red-50" : "border-slate-200 bg-white"
                    } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  />
                  {formErrors.password && (
                    <p className="text-[11px] text-red-500 mt-1">{formErrors.password}</p>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* ═══════════════════════════════════════════════════════════════════ */}
          {/* STEP 3: PLAN INVESTMENT & PAYOUT BANK DETAILS                      */}
          {/* ═══════════════════════════════════════════════════════════════════ */}
          {step === 3 && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
              {/* Plan Summary Card */}
              <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 to-blue-950 text-white space-y-3 shadow-lg">
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-[#F49222]">
                      Selected Franchise Plan
                    </span>
                    <h4 className="text-lg font-black">{plan?.name || plan?.plan_name || "Franchise Partnership"}</h4>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] uppercase font-bold text-slate-400">One-Time Fee</p>
                    <p className="text-2xl font-black text-emerald-400">{formattedPrice}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1 text-xs">
                  <div className="p-2.5 rounded-xl bg-white/5 border border-white/10">
                    <p className="text-[10px] text-slate-400 font-bold">Exclusive Territory</p>
                    <p className="font-black text-blue-300 truncate">{territoryTitle}</p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white/5 border border-white/10">
                    <p className="text-[10px] text-slate-400 font-bold">Earning Margin</p>
                    <p className="font-black text-amber-300">
                      {plan?.default_dealer_margin || 5}% Dealer / {plan?.default_commission_rate || 8}% Comm.
                    </p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 col-span-2 sm:col-span-1">
                    <p className="text-[10px] text-slate-400 font-bold">Validity</p>
                    <p className="font-black text-slate-200">1 Year (Renewable)</p>
                  </div>
                </div>
              </div>

              {/* Commission Payout Bank Account Details (Optional) */}
              <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-black uppercase tracking-wider text-slate-800">
                    Commission & Margin Payout Bank Details (Optional)
                  </p>
                  <span className="text-[10px] text-slate-500 font-medium">Can also be added later</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Bank Name</label>
                    <input
                      type="text"
                      placeholder="e.g. HDFC Bank / State Bank of India"
                      value={bankDetails.bank_name}
                      onChange={(e) => setBankDetails({ ...bankDetails, bank_name: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Account Holder Name</label>
                    <input
                      type="text"
                      placeholder="As per bank passbook"
                      value={bankDetails.account_holder_name}
                      onChange={(e) => setBankDetails({ ...bankDetails, account_holder_name: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Account Number</label>
                    <input
                      type="text"
                      placeholder="Account Number"
                      value={bankDetails.account_number}
                      onChange={(e) => setBankDetails({ ...bankDetails, account_number: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">IFSC Code</label>
                    <input
                      type="text"
                      placeholder="e.g. HDFC0001234"
                      value={bankDetails.ifsc_code}
                      onChange={(e) => setBankDetails({ ...bankDetails, ifsc_code: e.target.value.toUpperCase() })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-mono font-bold uppercase focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* ═══════════════════════════════════════════════════════════════════ */}
          {/* STEP 4: PAYMENT CONFIRMATION & ONBOARDING ACTIVATION              */}
          {/* ═══════════════════════════════════════════════════════════════════ */}
          {step === 4 && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
              <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50 space-y-3">
                <h4 className="text-sm font-black text-slate-900">Franchise Allocation Summary</h4>
                <div className="space-y-2 text-xs divide-y divide-slate-200">
                  <div className="flex justify-between py-1.5">
                    <span className="text-slate-600">Franchise Plan:</span>
                    <strong className="text-slate-900">{plan?.name || plan?.plan_name}</strong>
                  </div>
                  <div className="flex justify-between py-1.5">
                    <span className="text-slate-600">Territory Allocation:</span>
                    <strong className="text-[#0575B8]">{territoryTitle}</strong>
                  </div>
                  <div className="flex justify-between py-1.5">
                    <span className="text-slate-600">Authorized Partner:</span>
                    <strong className="text-slate-900">{form.business_name}</strong>
                  </div>
                  <div className="flex justify-between py-1.5">
                    <span className="text-slate-600">Login ID / Email:</span>
                    <strong className="text-slate-900">{form.email}</strong>
                  </div>
                  <div className="flex justify-between py-2 text-sm font-black text-slate-950">
                    <span>Total Investment Payable:</span>
                    <span className="text-[#0575B8]">{formattedPrice}</span>
                  </div>
                </div>
              </div>

              {paymentError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-semibold flex items-center gap-2">
                  <FiAlertCircle className="shrink-0 text-red-500" size={16} />
                  <span>{paymentError}</span>
                </div>
              )}

              {/* Payment Actions */}
              <div className="space-y-3 pt-2">
                <button
                  type="button"
                  disabled={paymentProcessing}
                  onClick={() => handleCompletePurchase(false)}
                  className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-[#0575B8] to-[#1965B0] hover:from-[#045D93] hover:to-[#0575B8] text-white text-sm font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-blue-500/25 transition cursor-pointer disabled:opacity-50"
                >
                  {paymentProcessing ? (
                    <>
                      <FiLoader className="animate-spin" size={18} />
                      <span>Confirming Franchise Allocation...</span>
                    </>
                  ) : (
                    <>
                      <FiCreditCard size={18} />
                      <span>Pay {formattedPrice} & Activate Franchise</span>
                    </>
                  )}
                </button>

                {/* Instant Dev/Test Sandbox button for effortless testing */}
                <button
                  type="button"
                  disabled={paymentProcessing}
                  onClick={() => handleCompletePurchase(true)}
                  className="w-full py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>⚡ Instant Sandbox Test Confirmation (Skip Gateway)</span>
                </button>
              </div>
            </motion.div>
          )}

          {/* ═══════════════════════════════════════════════════════════════════ */}
          {/* STEP 5: SUCCESS & ONBOARDING JOURNEY TRANSITION                   */}
          {/* ═══════════════════════════════════════════════════════════════════ */}
          {step === 5 && (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-6 space-y-5">
              <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20">
                <FiCheckCircle size={44} />
              </div>

              <div className="space-y-1.5">
                <h3 className="text-2xl font-black text-slate-900">
                  Welcome to SolarKits Franchise Network!
                </h3>
                <p className="text-sm text-slate-600 max-w-md mx-auto">
                  Your franchise license is active and <strong className="text-[#0575B8]">{territoryTitle}</strong> has been legally locked exclusively to your account.
                </p>
              </div>

              <div className="max-w-md mx-auto p-4 bg-blue-50 border border-blue-200 rounded-2xl text-left space-y-2 text-xs">
                <div className="flex items-center justify-between font-black text-slate-900 border-b border-blue-200/60 pb-2">
                  <span>Partner Account Allocated</span>
                  <span className="text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full text-[10px]">
                    Status: Active
                  </span>
                </div>
                <p className="text-slate-600">
                  <strong>Account:</strong> {onboardedData?.user?.business_name || form.business_name}
                </p>
                <p className="text-slate-600">
                  <strong>Login Email:</strong> {onboardedData?.user?.email || form.email}
                </p>
                <p className="text-slate-600">
                  <strong>Next Step:</strong> Complete business KYC documents in the Franchise Dashboard.
                </p>
              </div>

              <button
                type="button"
                onClick={handleProceedToDashboard}
                className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-[#0575B8] hover:bg-[#045D93] text-white text-sm font-black uppercase tracking-wider shadow-lg shadow-blue-500/30 transition cursor-pointer"
              >
                <span>Enter Franchise Dashboard</span>
                <FiArrowRight size={18} />
              </button>
            </motion.div>
          )}
        </div>

        {/* Modal Bottom Footer Navigation (Steps 1-4) */}
        {step < 5 && (
          <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
            {step > 1 ? (
              <button
                type="button"
                onClick={() => setStep((s) => s - 1)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-xs font-bold text-slate-700 flex items-center gap-1.5 transition"
              >
                <FiArrowLeft size={14} />
                <span>Back</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-800 transition"
              >
                Cancel
              </button>
            )}

            {step === 1 && (
              <button
                type="button"
                disabled={!availabilityResult?.is_available || checkingAvailability}
                onClick={() => setStep(2)}
                className="px-6 py-2.5 rounded-xl bg-[#0575B8] hover:bg-[#045D93] text-white text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition disabled:opacity-40"
              >
                <span>Continue</span>
                <FiArrowRight size={14} />
              </button>
            )}

            {step === 2 && (
              <button
                type="button"
                onClick={() => {
                  if (validateStep2()) setStep(3);
                }}
                className="px-6 py-2.5 rounded-xl bg-[#0575B8] hover:bg-[#045D93] text-white text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition"
              >
                <span>Continue</span>
                <FiArrowRight size={14} />
              </button>
            )}

            {step === 3 && (
              <button
                type="button"
                onClick={() => setStep(4)}
                className="px-6 py-2.5 rounded-xl bg-[#0575B8] hover:bg-[#045D93] text-white text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition"
              >
                <span>Proceed to Payment</span>
                <FiArrowRight size={14} />
              </button>
            )}
          </div>
        )}
      </motion.div>
    </div>
  );
}
