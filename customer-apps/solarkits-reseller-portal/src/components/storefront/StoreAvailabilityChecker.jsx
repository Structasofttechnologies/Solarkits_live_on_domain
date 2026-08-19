import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiMapPin,
  FiSearch,
  FiCheckCircle,
  FiAlertTriangle,
  FiXCircle,
  FiArrowRight,
  FiClock,
  FiShield,
  FiUserCheck,
} from "react-icons/fi";
import {
  INDIAN_STATES_DISTRICTS,
  checkTerritoryAvailability,
} from "../../data/territoryData";

export default function StoreAvailabilityChecker({ onOpenLeadModal }) {
  const [selectedState, setSelectedState] = useState("Maharashtra");
  const [selectedDistrict, setSelectedDistrict] = useState("Pune");
  const [pincode, setPincode] = useState("");
  const [result, setResult] = useState(null);
  const [checking, setChecking] = useState(false);

  // Sync districts when state changes
  useEffect(() => {
    if (selectedState && INDIAN_STATES_DISTRICTS[selectedState]) {
      setSelectedDistrict(INDIAN_STATES_DISTRICTS[selectedState][0] || "");
    }
  }, [selectedState]);

  const handleCheck = (e) => {
    e.preventDefault();
    setChecking(true);
    setResult(null);

    setTimeout(() => {
      const res = checkTerritoryAvailability(selectedState, selectedDistrict, pincode);
      setResult(res);
      setChecking(false);
    }, 500);
  };

  return (
    <section id="store-availability" className="py-16 sm:py-24 bg-slate-50 text-slate-900 border-t border-slate-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3 sm:space-y-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-slate-200 shadow-xs">
            <FiMapPin className="text-[#0575B8]" size={14} />
            <span className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-[#0575B8]">
              Live Territory Availability Checker
            </span>
          </div>

          <h2 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight">
            Check Franchise Availability in Your{" "}
            <span className="text-[#F49222]">
              District or Pincode
            </span>
          </h2>

          <p className="text-xs sm:text-base text-slate-600 font-normal max-w-2xl mx-auto leading-relaxed">
            We grant protected territorial dealership rights per revenue district. Check your area status to secure exclusive regional wholesale distribution.
          </p>
        </div>

        {/* Checker Card Container */}
        <div className="max-w-4xl mx-auto mt-10 sm:mt-14">
          <div className="rounded-3xl bg-white border border-slate-200 shadow-xl p-6 sm:p-10 space-y-6">
            
            {/* Input Form */}
            <form onSubmit={handleCheck} className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 items-end">
              
              {/* State Dropdown */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">
                  Select State
                </label>
                <select
                  value={selectedState}
                  onChange={(e) => setSelectedState(e.target.value)}
                  className="w-full px-3.5 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-none focus:border-[#0575B8] shadow-xs"
                >
                  {Object.keys(INDIAN_STATES_DISTRICTS).map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </select>
              </div>

              {/* District Dropdown */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">
                  Select District
                </label>
                <select
                  value={selectedDistrict}
                  onChange={(e) => setSelectedDistrict(e.target.value)}
                  className="w-full px-3.5 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-none focus:border-[#0575B8] shadow-xs"
                >
                  {(INDIAN_STATES_DISTRICTS[selectedState] || []).map((dist) => (
                    <option key={dist} value={dist}>
                      {dist}
                    </option>
                  ))}
                </select>
              </div>

              {/* Pincode (Optional / Exact) */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">
                  Pincode (Optional)
                </label>
                <input
                  type="text"
                  maxLength={6}
                  value={pincode}
                  onChange={(e) => setPincode(e.target.value)}
                  placeholder="e.g. 411001"
                  className="w-full px-3.5 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-none focus:border-[#0575B8] shadow-xs"
                />
              </div>

              {/* Action Button */}
              <div>
                <button
                  type="submit"
                  disabled={checking}
                  className="w-full py-3.5 px-5 rounded-xl bg-gradient-to-r from-[#0575B8] to-[#1965B0] hover:from-[#045D93] hover:to-[#0575B8] text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-md shadow-blue-500/20 transition-all cursor-pointer"
                >
                  <FiSearch size={14} />
                  <span>{checking ? "Checking..." : "Check Availability"}</span>
                </button>
              </div>
            </form>

            {/* Results Display Box */}
            <AnimatePresence>
              {result && (
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 15 }}
                  className="pt-4 border-t border-slate-100"
                >
                  {/* Status 1: AVAILABLE */}
                  {result.status === "AVAILABLE" && (
                    <div className="p-5 sm:p-6 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-start gap-3">
                          <div className="h-10 w-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                            <FiCheckCircle size={20} />
                          </div>
                          <div>
                            <span className="px-2.5 py-0.5 rounded-full bg-emerald-200/80 text-emerald-900 text-[10px] font-black uppercase tracking-wider">
                              TERRITORY STATUS: AVAILABLE
                            </span>
                            <h3 className="text-base sm:text-lg font-black text-slate-900 mt-1">
                              Franchise Opportunity is Available in {result.district}, {result.state}
                            </h3>
                            <p className="text-xs text-slate-600 mt-0.5">
                              {result.notes} Primary Hub: <strong>{result.hub}</strong>.
                            </p>
                          </div>
                        </div>

                        <button
                          onClick={() => onOpenLeadModal({
                            state: result.state,
                            district: result.district,
                            pincode: result.pincode,
                            requiredConfig: `Franchise Application for ${result.district}`,
                          }, "franchise_apply")}
                          className="shrink-0 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/20 cursor-pointer"
                        >
                          <span>Apply for Franchise →</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Status 2: LIMITED / UNDER REVIEW */}
                  {result.status === "LIMITED" && (
                    <div className="p-5 sm:p-6 rounded-2xl bg-amber-50 border border-amber-200 space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-start gap-3">
                          <div className="h-10 w-10 rounded-xl bg-[#F49222] text-white flex items-center justify-center shrink-0 shadow-xs">
                            <FiAlertTriangle size={20} />
                          </div>
                          <div>
                            <span className="px-2.5 py-0.5 rounded-full bg-amber-200 text-amber-900 text-[10px] font-black uppercase tracking-wider">
                              TERRITORY STATUS: LIMITED / UNDER REVIEW
                            </span>
                            <h3 className="text-base sm:text-lg font-black text-slate-900 mt-1">
                              This territory has limited availability or is currently being evaluated
                            </h3>
                            <p className="text-xs text-slate-600 mt-0.5">
                              1 slot remaining in {result.district}. Submissions undergo fast-track director evaluation within 48 hours.
                            </p>
                          </div>
                        </div>

                        <button
                          onClick={() => onOpenLeadModal({
                            state: result.state,
                            district: result.district,
                            pincode: result.pincode,
                            requiredConfig: `Territory Review for ${result.district}`,
                          }, "territory_review")}
                          className="shrink-0 px-5 py-2.5 rounded-xl bg-[#F49222] hover:bg-[#D97E15] text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-md shadow-amber-500/20 cursor-pointer"
                        >
                          <span>Request Territory Review →</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Status 3: ALLOCATED */}
                  {result.status === "ALLOCATED" && (
                    <div className="p-5 sm:p-6 rounded-2xl bg-slate-100 border border-slate-200 space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-start gap-3">
                          <div className="h-10 w-10 rounded-xl bg-slate-700 text-white flex items-center justify-center shrink-0 shadow-xs">
                            <FiClock size={20} />
                          </div>
                          <div>
                            <span className="px-2.5 py-0.5 rounded-full bg-slate-200 text-slate-800 text-[10px] font-black uppercase tracking-wider">
                              TERRITORY STATUS: CURRENTLY ASSIGNED
                            </span>
                            <h3 className="text-base sm:text-lg font-black text-slate-900 mt-1">
                              This territory is currently assigned to authorized partners
                            </h3>
                            <p className="text-xs text-slate-600 mt-0.5">
                              {result.district} is at active capacity. Join our Priority Waitlist or request adjacent territory expansion.
                            </p>
                          </div>
                        </div>

                        <button
                          onClick={() => onOpenLeadModal({
                            state: result.state,
                            district: result.district,
                            pincode: result.pincode,
                            requiredConfig: `Waitlist Request for ${result.district}`,
                          }, "territory_review")}
                          className="shrink-0 px-5 py-2.5 rounded-xl bg-[#0575B8] hover:bg-[#045D93] text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-md shadow-blue-500/20 cursor-pointer"
                        >
                          <span>Join Priority Waitlist →</span>
                        </button>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

          </div>
        </div>

      </div>
    </section>
  );
}
