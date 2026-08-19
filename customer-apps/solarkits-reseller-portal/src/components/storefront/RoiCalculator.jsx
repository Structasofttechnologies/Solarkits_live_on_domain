import { useState } from "react";
import { Link } from "react-router-dom";
import {
  FiTrendingUp,
  FiCheckCircle,
  FiPercent,
  FiAlertCircle,
  FiInfo,
} from "react-icons/fi";

export default function RoiCalculator({ onOpenLeadModal }) {
  const [projectCapacity, setProjectCapacity] = useState(3.3); // in kW (India's standard residential kit)
  const [monthlyProjects, setMonthlyProjects] = useState(5); // number of completed kits / installations
  const [tierMode, setTierMode] = useState("dealer"); // "commission" | "dealer"

  // Cost estimation per kW based on real market wholesale price averages: ~₹42,000 / kW
  const costPerKw = 42000;
  const projectRevenuePerUnit = Math.round(projectCapacity * costPerKw);
  const totalMonthlyRevenue = projectRevenuePerUnit * monthlyProjects;

  // Realistic margin percentages based on actual Solarkit wholesale rules
  const marginRate = tierMode === "dealer" ? 0.16 : 0.09; // 16% for stocking dealer, 9% for zero-stock commission
  const monthlyProfit = Math.round(totalMonthlyRevenue * marginRate);
  const annualProfit = monthlyProfit * 12;
  const annualRevenue = totalMonthlyRevenue * 12;

  return (
    <section id="revenue-potential" className="py-16 sm:py-24 bg-white text-slate-900 relative overflow-hidden border-t border-slate-100">
      {/* Background Soft Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[400px] bg-sky-500/10 blur-[150px] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3 sm:space-y-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 shadow-xs">
            <FiPercent className="text-[#F49222]" size={14} />
            <span className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-[#D97E15]">
              Illustrative Revenue Simulator
            </span>
          </div>

          <h2 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight">
            Explore Your Illustrative{" "}
            <span className="text-[#F49222]">
              Franchise Revenue Potential
            </span>
          </h2>

          <p className="text-xs sm:text-base text-slate-600 font-normal max-w-2xl mx-auto leading-relaxed">
            Simulate illustrative turnover and realized gross margins based on system capacities, installation volumes, and franchise commercial models.
          </p>
        </div>

        {/* Calculator Body Card */}
        <div className="max-w-5xl mx-auto mt-10 sm:mt-14 rounded-3xl bg-slate-50 border border-slate-200 shadow-xl p-6 sm:p-10 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
            
            {/* Left Column: Sliders & Controls */}
            <div className="lg:col-span-7 space-y-6">
              {/* Tier Mode Selector */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-600 block">
                  Select Franchise Commercial Model
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setTierMode("commission")}
                    className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                      tierMode === "commission"
                        ? "bg-white border-[#0575B8] text-slate-900 shadow-md shadow-blue-500/10"
                        : "bg-white/60 border-slate-200 text-slate-500 hover:text-slate-900"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black">Commission Partner</span>
                      <span className="text-[10px] font-bold text-[#0575B8] bg-sky-50 px-2 py-0.5 rounded border border-sky-200">
                        8% - 10% Margin
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Zero stock risk. Direct fulfillment by SolarKits.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTierMode("dealer")}
                    className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                      tierMode === "dealer"
                        ? "bg-white border-[#F49222] text-slate-900 shadow-md shadow-amber-500/10"
                        : "bg-white/60 border-slate-200 text-slate-500 hover:text-slate-900"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black">Dealer Wholesale</span>
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        15% - 18% Margin
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Procure at wholesale rate and sell at MRP.
                    </p>
                  </button>
                </div>
              </div>

              {/* Slider 1: Average Plant Capacity (kW) */}
              <div className="space-y-2.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-slate-700">Average System Capacity per Project</span>
                  <span className="text-sm font-black text-[#0575B8] bg-white px-3 py-1 rounded-lg border border-slate-200 shadow-xs">
                    {projectCapacity} kW Capacity
                  </span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="20"
                  step="0.5"
                  value={projectCapacity}
                  onChange={(e) => setProjectCapacity(Number(e.target.value))}
                  className="w-full accent-[#0575B8] bg-slate-200 h-2 rounded-lg cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                  <span>1.1 kW (Compact)</span>
                  <span>3.3 kW (Standard)</span>
                  <span>5 kW (Villa)</span>
                  <span>20 kW (Commercial)</span>
                </div>
              </div>

              {/* Slider 2: Monthly Projects */}
              <div className="space-y-2.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-slate-700">Monthly Completed Projects / Orders</span>
                  <span className="text-sm font-black text-[#F49222] bg-white px-3 py-1 rounded-lg border border-slate-200 shadow-xs">
                    {monthlyProjects} Kits / Month
                  </span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="25"
                  step="1"
                  value={monthlyProjects}
                  onChange={(e) => setMonthlyProjects(Number(e.target.value))}
                  className="w-full accent-[#F49222] bg-slate-200 h-2 rounded-lg cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                  <span>1 Kit / mo</span>
                  <span>10 Kits / mo</span>
                  <span>25 Kits / mo</span>
                </div>
              </div>

              {/* Quick Perks Bar */}
              <div className="grid grid-cols-2 gap-3 pt-2 text-[11px] text-slate-600">
                <div className="flex items-center gap-1.5">
                  <FiCheckCircle className="text-emerald-600 shrink-0" />
                  <span>Full 12% GST Input Tax Credit</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <FiCheckCircle className="text-emerald-600 shrink-0" />
                  <span>Automated Wallet Settlements</span>
                </div>
              </div>
            </div>

            {/* Right Column: Calculated Profit Projections */}
            <div className="lg:col-span-5">
              <div className="rounded-3xl bg-white p-6 sm:p-7 border border-slate-200 shadow-lg space-y-5">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Illustrative Partner Projections
                  </span>
                  <span className="text-[10px] font-black text-[#F49222] bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
                    SIMULATOR
                  </span>
                </div>

                {/* Monthly Profit Card */}
                <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200 space-y-1">
                  <span className="text-xs font-bold text-slate-700">Estimated Monthly Gross Margin</span>
                  <div className="text-2xl sm:text-3xl font-black text-[#D97E15]">
                    ₹{monthlyProfit.toLocaleString("en-IN")}
                    <span className="text-xs text-slate-500 font-semibold"> / month</span>
                  </div>
                  <p className="text-[10px] text-emerald-700 font-semibold">
                    Based on {Math.round(marginRate * 100)}% realized gross dealer margin
                  </p>
                </div>

                {/* Turnover Breakdown */}
                <div className="space-y-2.5 text-xs">
                  <div className="flex justify-between items-center text-slate-600 py-1 border-b border-slate-100">
                    <span>Monthly Kit Turnkey Volume:</span>
                    <span className="font-mono font-bold text-slate-900">
                      ₹{totalMonthlyRevenue.toLocaleString("en-IN")}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-slate-600 py-1 border-b border-slate-100">
                    <span>Annual Projected Turnover:</span>
                    <span className="font-mono font-bold text-slate-900">
                      ₹{annualRevenue.toLocaleString("en-IN")}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-slate-600 py-1 border-b border-slate-100">
                    <span>Annual Estimated Margin:</span>
                    <span className="font-mono font-bold text-emerald-600">
                      ₹{annualProfit.toLocaleString("en-IN")}
                    </span>
                  </div>
                </div>

                {/* CTA */}
                <button
                  onClick={() => onOpenLeadModal({ requiredConfig: "Territory Dealership Application" }, "franchise_apply")}
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#0575B8] to-[#1965B0] hover:from-[#045D93] hover:to-[#0575B8] text-white font-black text-xs uppercase tracking-wider text-center transition-all shadow-md shadow-blue-500/20 cursor-pointer"
                >
                  Apply to Secure Territory & Pricing →
                </button>
              </div>
            </div>

          </div>

          {/* Mandatory Statutory Disclaimer Banner verbatim */}
          <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/90 flex items-start gap-2.5 text-xs text-slate-700 leading-relaxed">
            <FiAlertCircle className="text-[#D97E15] shrink-0 mt-0.5" size={16} />
            <span>
              <strong>Regulatory Notice:</strong> Revenue figures are illustrative and depend on territory, sales volume, product mix, margins, operating costs, and business performance. Solarkits does not guarantee revenue or profit.
            </span>
          </div>
        </div>

      </div>
    </section>
  );
}
