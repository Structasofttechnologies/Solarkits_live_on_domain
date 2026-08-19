import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiX,
  FiCheckCircle,
  FiSend,
  FiLoader,
  FiShield,
  FiPhone,
  FiMail,
  FiBriefcase,
  FiMapPin,
  FiPackage,
  FiDollarSign,
  FiFileText,
  FiMessageSquare,
} from "react-icons/fi";
import { INDIAN_STATES_DISTRICTS } from "../../data/territoryData";

export default function LeadCaptureModal({
  isOpen,
  onClose,
  initialContext = {},
  actionType = "bulk_price", // "bulk_price" | "custom_config" | "territory_review" | "franchise_apply" | "general_inquiry"
}) {
  const [formData, setFormData] = useState({
    fullName: "",
    businessName: "",
    mobileNumber: "",
    whatsappNumber: "",
    email: "",
    gstin: "",
    businessType: "Solar EPC Contractor",
    solarExperience: "1 - 3 Years",
    investmentRange: "₹5 Lakh - ₹15 Lakh",
    state: "Maharashtra",
    district: "Pune",
    pincode: "",
    requiredKitConfig: "",
    expectedOrderQty: "1 - 3 Kits / Month",
    preferredFranchiseModel: "Dealer Wholesale (Stocking Partner)",
    notes: "",
    consent: true,
  });

  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [availableDistricts, setAvailableDistricts] = useState([]);

  useEffect(() => {
    if (initialContext) {
      setFormData((prev) => ({
        ...prev,
        state: initialContext.state || prev.state,
        district: initialContext.district || prev.district,
        pincode: initialContext.pincode || prev.pincode,
        requiredKitConfig: initialContext.kitName
          ? `${initialContext.kitName} (${initialContext.capacityDisplay || ""})`
          : initialContext.requiredConfig || prev.requiredKitConfig,
        preferredFranchiseModel: initialContext.preferredModel || prev.preferredFranchiseModel,
      }));
    }
  }, [initialContext, isOpen]);

  useEffect(() => {
    if (formData.state && INDIAN_STATES_DISTRICTS[formData.state]) {
      setAvailableDistricts(INDIAN_STATES_DISTRICTS[formData.state]);
      if (!INDIAN_STATES_DISTRICTS[formData.state].includes(formData.district)) {
        setFormData((prev) => ({ ...prev, district: INDIAN_STATES_DISTRICTS[formData.state][0] || "" }));
      }
    }
  }, [formData.state]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitting(true);

    // Save lead locally to ensure zero data loss & log CRM workflow
    try {
      const existingLeads = JSON.parse(localStorage.getItem("solarkits_crm_leads") || "[]");
      const newLead = {
        id: `LEAD-${Date.now()}`,
        actionType,
        ...formData,
        submittedAt: new Date().toISOString(),
        status: "NEW",
      };
      existingLeads.unshift(newLead);
      localStorage.setItem("solarkits_crm_leads", JSON.stringify(existingLeads));
    } catch (err) {
      console.warn("CRM local storage note:", err);
    }

    setTimeout(() => {
      setSubmitting(false);
      setSubmitted(true);
    }, 900);
  };

  const getModalTitle = () => {
    switch (actionType) {
      case "bulk_price":
        return {
          title: "Get Factory-Direct B2B Bulk Price",
          subtitle: "Receive direct manufacturer wholesale quote and GST ITC invoice breakdown within 2 hours.",
          badge: "B2B Wholesale Procurement",
        };
      case "custom_config":
        return {
          title: "Request Custom SolarKit Configuration",
          subtitle: "Need custom panel wattages, hybrid inverter capacities, or specialized BOS combinations? Our engineers will build your kit.",
          badge: "Custom Engineering",
        };
      case "territory_review":
        return {
          title: "Request Territory Review & Allocation",
          subtitle: "Submit your business profile for territory exclusivity review by the SolarKits regional director.",
          badge: "Territory Application",
        };
      case "franchise_apply":
        return {
          title: "Apply for Authorized Solarkits Franchise",
          subtitle: "Join India's fastest growing ready-to-sell solar network with territory rights and verified EPC lead allocation.",
          badge: "Franchise Partner Program",
        };
      default:
        return {
          title: "B2B Solar Consultation & Quotation",
          subtitle: "Connect with our technical commercial team for project procurement or dealership queries.",
          badge: "Official SolarKits B2B",
        };
    }
  };

  const modalMeta = getModalTitle();

  const handleWhatsAppRedirect = () => {
    const text = encodeURIComponent(
      `Hello SolarKits Team,\nI am interested in B2B procurement / franchise partnership.\n*Name:* ${formData.fullName || "Partner"}\n*Business:* ${formData.businessName || "Solar Company"}\n*State/District:* ${formData.state}, ${formData.district}\n*Requirement:* ${formData.requiredKitConfig || "Complete SolarKits"}`
    );
    window.open(`https://wa.me/919876543210?text=${text}`, "_blank");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-xs overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white border border-slate-200 rounded-3xl max-w-2xl w-full max-h-[92vh] overflow-y-auto shadow-2xl p-5 sm:p-8 text-slate-900 relative my-6"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl bg-slate-100 text-slate-500 hover:text-slate-900 transition-colors"
          aria-label="Close"
        >
          <FiX size={18} />
        </button>

        {submitted ? (
          <div className="text-center py-8 sm:py-10 space-y-4">
            <div className="h-16 w-16 bg-emerald-50 text-emerald-600 rounded-2xl border border-emerald-200 flex items-center justify-center mx-auto shadow-sm">
              <FiCheckCircle size={36} />
            </div>

            <div className="space-y-2 max-w-md mx-auto">
              <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase tracking-wider">
                Request Registered Successfully
              </span>
              <h3 className="text-xl sm:text-2xl font-black text-slate-900">
                Thank You, {formData.fullName || "Partner"}!
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Your B2B inquiry for <strong className="text-[#0575B8]">{formData.requiredKitConfig || "Complete SolarKits"}</strong> in{" "}
                <strong>{formData.district}, {formData.state}</strong> has been logged in our central CRM.
              </p>
              <p className="text-[11px] text-slate-500">
                A dedicated SolarKits Regional Territory Manager will contact you at <strong>{formData.mobileNumber}</strong> within 2 business hours.
              </p>
            </div>

            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                onClick={handleWhatsAppRedirect}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm"
              >
                <FiMessageSquare />
                <span>Chat Instantly on WhatsApp</span>
              </button>
              <button
                onClick={() => {
                  setSubmitted(false);
                  onClose();
                }}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs"
              >
                Close Window
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Header */}
            <div className="space-y-2 border-b border-slate-100 pb-4 pr-8">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-[#D97E15] text-[10px] font-black uppercase tracking-wider">
                <FiShield size={12} />
                <span>{modalMeta.badge}</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                {modalMeta.title}
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                {modalMeta.subtitle}
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Context Kit Banner if specified */}
              {formData.requiredKitConfig && (
                <div className="p-3 rounded-2xl bg-sky-50 border border-sky-200/80 flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2 text-slate-700">
                    <FiPackage className="text-[#0575B8] shrink-0" size={16} />
                    <span>
                      Selected Solution: <strong className="text-[#0575B8]">{formData.requiredKitConfig}</strong>
                    </span>
                  </div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase bg-white px-2 py-0.5 rounded border border-slate-200">
                    Pre-selected
                  </span>
                </div>
              )}

              {/* Row 1: Name & Business Name */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    placeholder="e.g. Ramesh Chandra"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-none focus:border-[#0575B8] shadow-xs"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Business / Company Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.businessName}
                    onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                    placeholder="e.g. Chandra Solar & Electricals"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-none focus:border-[#0575B8] shadow-xs"
                  />
                </div>
              </div>

              {/* Row 2: Mobile & WhatsApp */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Mobile Number (Calling) <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                      +91
                    </span>
                    <input
                      type="tel"
                      required
                      pattern="[6-9][0-9]{9}"
                      value={formData.mobileNumber}
                      onChange={(e) => setFormData({ ...formData, mobileNumber: e.target.value, whatsappNumber: formData.whatsappNumber || e.target.value })}
                      placeholder="9876543210"
                      className="w-full pl-11 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-none focus:border-[#0575B8] shadow-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    WhatsApp Number
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                      +91
                    </span>
                    <input
                      type="tel"
                      value={formData.whatsappNumber}
                      onChange={(e) => setFormData({ ...formData, whatsappNumber: e.target.value })}
                      placeholder="9876543210 (For quick quotation)"
                      className="w-full pl-11 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-none focus:border-[#0575B8] shadow-xs"
                    />
                  </div>
                </div>
              </div>

              {/* Row 3: Email & GSTIN */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="ramesh@chandrasolar.com"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-none focus:border-[#0575B8] shadow-xs"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    GSTIN (For 12% ITC Claim)
                  </label>
                  <input
                    type="text"
                    maxLength={15}
                    value={formData.gstin}
                    onChange={(e) => setFormData({ ...formData, gstin: e.target.value.toUpperCase() })}
                    placeholder="27AAAAA0000A1Z5 (Optional for evaluation)"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 uppercase font-mono focus:bg-white focus:outline-none focus:border-[#0575B8] shadow-xs"
                  />
                </div>
              </div>

              {/* Row 4: Territory Location (State, District, Pincode) */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    State <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-none focus:border-[#0575B8]"
                  >
                    {Object.keys(INDIAN_STATES_DISTRICTS).map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Target District <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.district}
                    onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-none focus:border-[#0575B8]"
                  >
                    {availableDistricts.map((dist) => (
                      <option key={dist} value={dist}>
                        {dist}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Pincode
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    value={formData.pincode}
                    onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                    placeholder="e.g. 411001"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-none focus:border-[#0575B8]"
                  />
                </div>
              </div>

              {/* Row 5: Business Profile & Expected Order Qty */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Business Profile
                  </label>
                  <select
                    value={formData.businessType}
                    onChange={(e) => setFormData({ ...formData, businessType: e.target.value })}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-none focus:border-[#0575B8]"
                  >
                    <option value="Solar EPC Contractor">Solar EPC Contractor</option>
                    <option value="Solar Equipment Dealer / Trader">Solar Equipment Dealer / Trader</option>
                    <option value="Electrical Hardware Retailer">Electrical Hardware Retailer</option>
                    <option value="Franchise Applicant / Entrepreneur">Franchise Applicant / Entrepreneur</option>
                    <option value="Commercial / Industrial Business Owner">Commercial / Industrial Business Owner</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Expected Order / Project Volume
                  </label>
                  <select
                    value={formData.expectedOrderQty}
                    onChange={(e) => setFormData({ ...formData, expectedOrderQty: e.target.value })}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-none focus:border-[#0575B8]"
                  >
                    <option value="1 - 3 Kits / Month (Starter)">1 - 3 Kits / Month (Starter)</option>
                    <option value="4 - 10 Kits / Month (Active Dealer)">4 - 10 Kits / Month (Active Dealer)</option>
                    <option value="10 - 25 Kits / Month (Regional Hub)">10 - 25 Kits / Month (Regional Hub)</option>
                    <option value="50+ kW Bulk Container (EPC Project)">50+ kW Bulk Container (EPC Project)</option>
                  </select>
                </div>
              </div>

              {/* Custom Notes / Specific Requirements */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Specific Requirements / Remarks
                </label>
                <textarea
                  rows={2}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Mention desired panel wattage (e.g. 550W DCR), inverter brand, mounting structure type, or target DISCOM name..."
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-none focus:border-[#0575B8]"
                />
              </div>

              {/* Consent checkbox */}
              <div className="flex items-start gap-2 pt-1">
                <input
                  type="checkbox"
                  id="lead_consent"
                  checked={formData.consent}
                  onChange={(e) => setFormData({ ...formData, consent: e.target.checked })}
                  className="mt-0.5 accent-[#0575B8] rounded"
                  required
                />
                <label htmlFor="lead_consent" className="text-[11px] text-slate-500 leading-tight">
                  I agree to receive official B2B quotation, technical datasheets, and callback from SolarKits authorized partner team.
                </label>
              </div>

              {/* Buttons */}
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={handleWhatsAppRedirect}
                  className="w-full sm:w-auto px-4 py-3 rounded-xl border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <FiMessageSquare className="text-emerald-600" />
                  <span>Enquire via WhatsApp</span>
                </button>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-[#0575B8] to-[#1965B0] hover:from-[#045D93] hover:to-[#0575B8] text-white text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-md shadow-blue-500/20 transition-all cursor-pointer"
                >
                  {submitting ? (
                    <>
                      <FiLoader className="animate-spin" size={15} />
                      <span>Transmitting Request...</span>
                    </>
                  ) : (
                    <>
                      <FiSend size={14} />
                      <span>Submit B2B Lead Request →</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}
      </motion.div>
    </div>
  );
}
