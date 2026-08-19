import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiCheckCircle,
  FiAward,
  FiUserCheck,
  FiDollarSign,
  FiBriefcase,
  FiMapPin,
  FiArrowRight,
  FiArrowLeft,
  FiShield,
  FiTrendingUp,
} from "react-icons/fi";
import { INDIAN_STATES_DISTRICTS } from "../../data/territoryData";

export default function EligibilityChecker({ onOpenLeadModal }) {
  const [step, setStep] = useState(1);
  const [quizData, setQuizData] = useState({
    hasGst: "yes",
    gstin: "",
    businessType: "Solar EPC / Installer",
    solarExperience: "1 - 3 Years",
    investmentCapacity: "₹5 Lakh - ₹15 Lakh",
    state: "Maharashtra",
    district: "Pune",
    hasShopOrOffice: "yes_owned", // 'yes_owned' | 'yes_rented' | 'planning_rent' | 'mobile_only'
    salesCapability: "team_ready", // 'team_ready' | '1_salesperson' | 'solo_contractor'
    preferredModel: "Dealer Wholesale (Stocking Partner)",
  });

  const [result, setResult] = useState(null);

  const calculateEligibility = () => {
    let score = 50;

    // GST Score
    if (quizData.hasGst === "yes") score += 15;
    else score += 5;

    // Experience Score
    if (quizData.solarExperience === "3+ Years") score += 15;
    else if (quizData.solarExperience === "1 - 3 Years") score += 12;
    else score += 8;

    // Investment
    if (quizData.investmentCapacity === "₹15 Lakh+") score += 10;
    else if (quizData.investmentCapacity === "₹5 Lakh - ₹15 Lakh") score += 10;
    else score += 7;

    // Shop Space
    if (quizData.hasShopOrOffice === "yes_owned" || quizData.hasShopOrOffice === "yes_rented") score += 10;
    else score += 5;

    // Sales Team
    if (quizData.salesCapability === "team_ready") score += 10;
    else score += 6;

    const finalScore = Math.min(98, score);

    let storeType = "Authorized SolarKits Dealer & Experience Center";
    let territoryStatus = "High Priority Approval";

    if (finalScore >= 85) {
      storeType = "Authorized Solarkits Experience Center & Regional Dealer";
    } else if (finalScore >= 70) {
      storeType = "Solarkits Retail Partner & Authorized Stockist";
    } else {
      storeType = "Commission Starter Partner (Zero Stocking Model)";
    }

    setResult({
      score: finalScore,
      storeType,
      territoryStatus,
      state: quizData.state,
      district: quizData.district,
      preferredModel: quizData.preferredModel,
    });
  };

  return (
    <section id="eligibility-checker" className="py-16 sm:py-24 bg-white text-slate-900 border-t border-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3 sm:space-y-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 shadow-xs">
            <FiAward className="text-emerald-600" size={14} />
            <span className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-emerald-800">
              Multi-Step Evaluation
            </span>
          </div>

          <h2 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight">
            Franchise Partner <span className="text-[#0575B8]">Eligibility Checker</span>
          </h2>

          <p className="text-xs sm:text-base text-slate-600 font-normal max-w-2xl mx-auto leading-relaxed">
            Answer 6 quick questions to assess your qualification score, recommended store model, and territory readiness.
          </p>
        </div>

        {/* Multi-Step Card */}
        <div className="max-w-3xl mx-auto mt-10 sm:mt-14">
          <div className="rounded-3xl bg-slate-50 border border-slate-200 shadow-xl p-6 sm:p-10">
            
            {/* Progress Bar */}
            {!result && (
              <div className="mb-8 space-y-2">
                <div className="flex justify-between text-xs font-bold text-slate-600">
                  <span>Step {step} of 3</span>
                  <span className="text-[#0575B8]">
                    {step === 1 ? "Business & GST" : step === 2 ? "Experience & Capital" : "Location & Infrastructure"}
                  </span>
                </div>
                <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-[#0575B8] h-full transition-all duration-300 rounded-full"
                    style={{ width: `${(step / 3) * 100}%` }}
                  />
                </div>
              </div>
            )}

            {/* Step 1: GST & Business Type */}
            {step === 1 && !result && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-6"
              >
                <div className="space-y-3">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block">
                    1. Do you have an active GST registration?
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setQuizData({ ...quizData, hasGst: "yes" })}
                      className={`p-4 rounded-2xl border text-center font-bold text-xs transition-all cursor-pointer ${
                        quizData.hasGst === "yes"
                          ? "bg-white border-[#0575B8] text-[#0575B8] shadow-sm"
                          : "bg-white/60 border-slate-200 text-slate-600"
                      }`}
                    >
                      ✓ Yes, Registered GSTIN
                    </button>
                    <button
                      type="button"
                      onClick={() => setQuizData({ ...quizData, hasGst: "no" })}
                      className={`p-4 rounded-2xl border text-center font-bold text-xs transition-all cursor-pointer ${
                        quizData.hasGst === "no"
                          ? "bg-white border-[#0575B8] text-[#0575B8] shadow-sm"
                          : "bg-white/60 border-slate-200 text-slate-600"
                      }`}
                    >
                      No / In Process (Individual)
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    *GSTIN unlocks 12% input tax credit, but non-GST individual partners can also start under Commission Starter.
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block">
                    2. Primary Nature of Your Business
                  </label>
                  <select
                    value={quizData.businessType}
                    onChange={(e) => setQuizData({ ...quizData, businessType: e.target.value })}
                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-[#0575B8]"
                  >
                    <option value="Solar EPC / Installer">Solar EPC / Rooftop Installer</option>
                    <option value="Electrical Goods Dealer">Electrical Hardware & Goods Retailer</option>
                    <option value="Battery & Inverter Shop">Battery, Inverter & UPS Retailer</option>
                    <option value="Real Estate / General Contractor">Civil / Building Contractor</option>
                    <option value="New Entrepreneur">New Entrepreneur / Startup Business</option>
                  </select>
                </div>

                <div className="pt-4 flex justify-end">
                  <button
                    onClick={() => setStep(2)}
                    className="px-6 py-3 rounded-xl bg-[#0575B8] hover:bg-[#045D93] text-white font-bold text-xs flex items-center gap-2 cursor-pointer shadow-sm"
                  >
                    <span>Next: Experience & Capital →</span>
                  </button>
                </div>
              </motion.div>
            )}

            {/* Step 2: Experience & Capital */}
            {step === 2 && !result && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-6"
              >
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block">
                    3. Solar / Electrical Industry Experience
                  </label>
                  <select
                    value={quizData.solarExperience}
                    onChange={(e) => setQuizData({ ...quizData, solarExperience: e.target.value })}
                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-[#0575B8]"
                  >
                    <option value="0 - 1 Year (Beginner)">0 - 1 Year (Beginner / New to Solar)</option>
                    <option value="1 - 3 Years">1 - 3 Years (Completed 5+ Installations)</option>
                    <option value="3+ Years">3+ Years (Established Contractor)</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block">
                    4. Estimated Working Capital & Stocking Capacity
                  </label>
                  <select
                    value={quizData.investmentCapacity}
                    onChange={(e) => setQuizData({ ...quizData, investmentCapacity: e.target.value })}
                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-[#0575B8]"
                  >
                    <option value="< ₹2 Lakh (Zero-Stock Commission)">Under ₹2 Lakh (Zero-Stock Commission Starter)</option>
                    <option value="₹2 Lakh - ₹5 Lakh">₹2 Lakh - ₹5 Lakh (Direct Dealer Stock)</option>
                    <option value="₹5 Lakh - ₹15 Lakh">₹5 Lakh - ₹15 Lakh (Experience Center Stock)</option>
                    <option value="₹15 Lakh+">₹15 Lakh+ (Multi-District Master Distributor)</option>
                  </select>
                </div>

                <div className="pt-4 flex justify-between">
                  <button
                    onClick={() => setStep(1)}
                    className="px-4 py-2.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <FiArrowLeft /> Back
                  </button>
                  <button
                    onClick={() => setStep(3)}
                    className="px-6 py-3 rounded-xl bg-[#0575B8] hover:bg-[#045D93] text-white font-bold text-xs flex items-center gap-2 cursor-pointer shadow-sm"
                  >
                    <span>Next: Location & Space →</span>
                  </button>
                </div>
              </motion.div>
            )}

            {/* Step 3: Location & Infrastructure */}
            {step === 3 && !result && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-6"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-1">
                      State
                    </label>
                    <select
                      value={quizData.state}
                      onChange={(e) => setQuizData({ ...quizData, state: e.target.value })}
                      className="w-full px-3.5 py-3 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900"
                    >
                      {Object.keys(INDIAN_STATES_DISTRICTS).map((st) => (
                        <option key={st} value={st}>
                          {st}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-1">
                      Target District
                    </label>
                    <select
                      value={quizData.district}
                      onChange={(e) => setQuizData({ ...quizData, district: e.target.value })}
                      className="w-full px-3.5 py-3 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900"
                    >
                      {(INDIAN_STATES_DISTRICTS[quizData.state] || []).map((dist) => (
                        <option key={dist} value={dist}>
                          {dist}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block">
                    5. Shop or Commercial Office Availability
                  </label>
                  <select
                    value={quizData.hasShopOrOffice}
                    onChange={(e) => setQuizData({ ...quizData, hasShopOrOffice: e.target.value })}
                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900"
                  >
                    <option value="yes_owned">Yes, Owned Commercial Space / Showroom</option>
                    <option value="yes_rented">Yes, Rented Office / Warehouse Space</option>
                    <option value="planning_rent">Planning to Rent Space Upon Approval</option>
                    <option value="mobile_only">Field / On-Site Installation Contractor Only</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block">
                    6. Existing Installation / Sales Team
                  </label>
                  <select
                    value={quizData.salesCapability}
                    onChange={(e) => setQuizData({ ...quizData, salesCapability: e.target.value })}
                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900"
                  >
                    <option value="team_ready">Dedicated Installation & Sales Team (2+ staff)</option>
                    <option value="1_salesperson">Single Electrician / Technician</option>
                    <option value="solo_contractor">Solo Operator / Hiring Post-Launch</option>
                  </select>
                </div>

                <div className="pt-4 flex justify-between">
                  <button
                    onClick={() => setStep(2)}
                    className="px-4 py-2.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <FiArrowLeft /> Back
                  </button>
                  <button
                    onClick={calculateEligibility}
                    className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-[#0575B8] to-[#1965B0] hover:from-[#045D93] hover:to-[#0575B8] text-white font-black text-xs uppercase tracking-wider flex items-center gap-2 cursor-pointer shadow-md shadow-blue-500/20"
                  >
                    <span>Calculate Eligibility Score →</span>
                  </button>
                </div>
              </motion.div>
            )}

            {/* Results Display */}
            {result && (
              <motion.div
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-6"
              >
                {/* Score Header */}
                <div className="p-6 rounded-2xl bg-gradient-to-r from-emerald-50 via-white to-sky-50 border border-emerald-200 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
                  <div className="space-y-1">
                    <span className="px-3 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase tracking-wider">
                      Evaluation Result
                    </span>
                    <h3 className="text-xl sm:text-2xl font-black text-slate-900">
                      Highly Qualified Partner!
                    </h3>
                    <p className="text-xs text-slate-600">
                      Your profile matches the requirements for exclusive territory assignment in <strong>{result.district}, {result.state}</strong>.
                    </p>
                  </div>

                  <div className="h-20 w-20 rounded-2xl bg-emerald-600 text-white flex flex-col items-center justify-center shrink-0 shadow-lg shadow-emerald-600/20">
                    <span className="text-2xl font-black">{result.score}%</span>
                    <span className="text-[9px] font-bold uppercase tracking-wider">Fit Score</span>
                  </div>
                </div>

                {/* Specific Recommendations */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
                  <div className="p-4 rounded-2xl bg-white border border-slate-200 space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Recommended Store Type</span>
                    <p className="text-sm font-black text-[#0575B8]">{result.storeType}</p>
                  </div>
                  <div className="p-4 rounded-2xl bg-white border border-slate-200 space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Territory Assignment Status</span>
                    <p className="text-sm font-black text-emerald-700">{result.territoryStatus}</p>
                  </div>
                </div>

                {/* Final Actions */}
                <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
                  <button
                    onClick={() => onOpenLeadModal({
                      state: result.state,
                      district: result.district,
                      preferredModel: result.storeType,
                      requiredConfig: `Franchise Score: ${result.score}% (${result.storeType})`,
                    }, "franchise_apply")}
                    className="w-full sm:w-auto flex-1 py-3.5 rounded-xl bg-gradient-to-r from-[#0575B8] to-[#1965B0] hover:from-[#045D93] hover:to-[#0575B8] text-white font-black text-xs uppercase tracking-wider text-center shadow-md shadow-blue-500/20 cursor-pointer"
                  >
                    Proceed with Pre-Qualified Application →
                  </button>

                  <button
                    onClick={() => {
                      setResult(null);
                      setStep(1);
                    }}
                    className="w-full sm:w-auto px-4 py-3 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs cursor-pointer"
                  >
                    Retake Quiz
                  </button>
                </div>
              </motion.div>
            )}

          </div>
        </div>

      </div>
    </section>
  );
}
