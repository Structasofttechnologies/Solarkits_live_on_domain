import React, { useState } from 'react';
import { Calculator, ArrowRight, Zap, TrendingUp, Clock, DollarSign } from 'lucide-react';

export default function RoiCalculator({ onSelectPlan }) {
  const [monthlyProjects, setMonthlyProjects] = useState(30);
  const [avgValue, setAvgValue] = useState(25000);
  const [countries, setCountries] = useState(3);

  // Calculations
  const hoursSavedPerWeek = Math.round(monthlyProjects * 1.4 + countries * 3.5);
  const annualOpsSavings = Math.round(monthlyProjects * 12 * 920);
  const projectedRevenueBoost = Math.round((monthlyProjects * avgValue * 12) * 0.18);
  const totalAnnualValue = annualOpsSavings + projectedRevenueBoost;

  return (
    <div className="bg-gradient-to-br from-solar-navy via-primary-800 to-primary-900 rounded-3xl p-6 sm:p-10 text-white shadow-2xl relative overflow-hidden border border-primary-700/50">
      {/* Glow Effects */}
      <div className="absolute -top-24 -right-24 w-96 h-96 bg-secondary/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-accent/20 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary/20 text-secondary text-xs font-semibold uppercase tracking-wider mb-3">
              <Calculator size={14} /> Interactive ROI Estimator
            </div>
            <h3 className="text-2xl sm:text-3xl font-bold tracking-tight">Calculate Your EPC ROI & Efficiency Gains</h3>
            <p className="text-blue-200 text-sm mt-1">See how much time and money Emergesun EPC Panel saves your organization annually.</p>
          </div>
          <div className="bg-white/10 backdrop-blur-md px-4 py-2 rounded-xl border border-white/10 text-right shrink-0">
            <span className="text-xs text-blue-200 block font-medium">Estimated Annual Value</span>
            <span className="text-2xl font-extrabold text-secondary">${totalAnnualValue.toLocaleString()}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Controls Column */}
          <div className="lg:col-span-7 space-y-6 bg-white/5 backdrop-blur-sm p-6 rounded-2xl border border-white/10">
            {/* Slider 1: Monthly Solar Projects */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-sm font-medium text-blue-100">Monthly Solar Projects / Installs</label>
                <span className="text-base font-bold text-secondary bg-secondary/10 px-3 py-0.5 rounded-lg border border-secondary/20">
                  {monthlyProjects} projects/mo
                </span>
              </div>
              <input
                type="range"
                min="5"
                max="250"
                step="5"
                value={monthlyProjects}
                onChange={(e) => setMonthlyProjects(Number(e.target.value))}
                className="w-full h-2 bg-primary-950 rounded-lg appearance-none cursor-pointer accent-secondary"
              />
              <div className="flex justify-between text-xs text-blue-300/70 mt-1">
                <span>5 projects</span>
                <span>125 projects</span>
                <span>250+ projects</span>
              </div>
            </div>

            {/* Slider 2: Average Project Value */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-sm font-medium text-blue-100">Average Project Value ($ USD)</label>
                <span className="text-base font-bold text-secondary bg-secondary/10 px-3 py-0.5 rounded-lg border border-secondary/20">
                  ${avgValue.toLocaleString()}
                </span>
              </div>
              <input
                type="range"
                min="5000"
                max="100000"
                step="2500"
                value={avgValue}
                onChange={(e) => setAvgValue(Number(e.target.value))}
                className="w-full h-2 bg-primary-950 rounded-lg appearance-none cursor-pointer accent-secondary"
              />
              <div className="flex justify-between text-xs text-blue-300/70 mt-1">
                <span>$5,000 (Resi)</span>
                <span>$50,000 (Commercial)</span>
                <span>$100,000+ (Utility)</span>
              </div>
            </div>

            {/* Slider 3: Operating Countries */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-sm font-medium text-blue-100">Operating Countries / Regions</label>
                <span className="text-base font-bold text-secondary bg-secondary/10 px-3 py-0.5 rounded-lg border border-secondary/20">
                  {countries} {countries === 1 ? 'Country' : 'Countries'}
                </span>
              </div>
              <input
                type="range"
                min="1"
                max="20"
                step="1"
                value={countries}
                onChange={(e) => setCountries(Number(e.target.value))}
                className="w-full h-2 bg-primary-950 rounded-lg appearance-none cursor-pointer accent-secondary"
              />
              <div className="flex justify-between text-xs text-blue-300/70 mt-1">
                <span>1 Region</span>
                <span>10 Regions</span>
                <span>20+ Global Tiers</span>
              </div>
            </div>
          </div>

          {/* Results Summary Cards */}
          <div className="lg:col-span-5 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white/10 backdrop-blur-md p-4 rounded-xl border border-white/10">
                <div className="flex items-center gap-2 text-accent text-xs font-semibold mb-1">
                  <Clock size={16} /> Hours Saved
                </div>
                <div className="text-2xl font-bold text-white">{hoursSavedPerWeek} hrs</div>
                <div className="text-xs text-blue-200 mt-1">per week across teams</div>
              </div>

              <div className="bg-white/10 backdrop-blur-md p-4 rounded-xl border border-white/10">
                <div className="flex items-center gap-2 text-secondary text-xs font-semibold mb-1">
                  <DollarSign size={16} /> OpEx Savings
                </div>
                <div className="text-2xl font-bold text-white">${(annualOpsSavings / 1000).toFixed(1)}k</div>
                <div className="text-xs text-blue-200 mt-1">annual cost reduction</div>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-md p-4 rounded-xl border border-white/10">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold">
                  <TrendingUp size={16} /> Revenue Pipeline Acceleration
                </div>
                <span className="text-xs text-emerald-400 font-bold bg-emerald-500/20 px-2 py-0.5 rounded-full">+18% Close Speed</span>
              </div>
              <div className="text-3xl font-extrabold text-emerald-300">${(projectedRevenueBoost / 1000).toFixed(1)}k</div>
              <div className="text-xs text-blue-200 mt-1">projected extra annual revenue via automated CRM & e-shop quotes.</div>
            </div>

            <button
              onClick={() => onSelectPlan && onSelectPlan('Professional')}
              className="w-full py-3.5 px-6 rounded-xl bg-secondary text-solar-navy font-bold hover:bg-secondary-400 transition-all flex items-center justify-center gap-2 shadow-lg shadow-secondary/20 text-sm cursor-pointer"
            >
              <Zap size={18} /> Start Saving Today — Checkout Plan <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
