import { motion } from "framer-motion";
import { FiZap, FiCheck, FiArrowRight } from "react-icons/fi";

const CAPACITIES = [
  { label: "1 kW", value: "1 kW", desc: "1-2 Rooms / Compact Micro-Rooftop", subsidy: "Up to ₹30,000 Subsidy", popular: false },
  { label: "1.1 kW", value: "1.1 kW", desc: "Starter DCR On-Grid System", subsidy: "PM Surya Ghar Phase-I", popular: false },
  { label: "2 kW", value: "2 kW", desc: "Small Household / Basic Offsets", subsidy: "Up to ₹60,000 Subsidy", popular: false },
  { label: "2.2 kW", value: "2.2 kW", desc: "2-BHK Residential Kit (4 Panels)", subsidy: "PM Surya Ghar Top Pick", popular: true },
  { label: "3 kW", value: "3 kW", desc: "Standard 3-BHK Rooftop Solution", subsidy: "Max ₹78,000 Subsidy", popular: false },
  { label: "3.3 kW", value: "3.3 kW", desc: "India's #1 Selling Residential Kit (6× 550W)", subsidy: "Max ₹78,000 Subsidy", popular: true },
  { label: "4 kW", value: "4 kW", desc: "Medium Villa & Duplex Homes", subsidy: "State Net-Metering", popular: false },
  { label: "5 kW", value: "5 kW", desc: "Large Bungalow & Clinic Package", subsidy: "Commercial / Net-Metering", popular: true },
  { label: "6 kW", value: "6 kW", desc: "Heavy Load Hybrid Lithium Ready", subsidy: "Zero-Blackout Option", popular: false },
  { label: "10 kW+ / Commercial", value: "10 kW+ / Commercial", desc: "Warehouses, Factories & MSMEs (3-Ph 415V)", subsidy: "40% Accelerated Depr.", popular: true },
];

export default function BrowseByCapacity({ onSelectCapacity }) {
  return (
    <section id="browse-capacity" className="py-14 sm:py-20 bg-white text-slate-900 border-t border-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200 pb-6 sm:pb-8">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 shadow-xs">
              <FiZap className="text-[#F49222]" size={14} />
              <span className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-[#D97E15]">
                System Capacity Sizing
              </span>
            </div>

            <h2 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight">
              Browse by <span className="text-[#0575B8]">System Capacity</span>
            </h2>

            <p className="text-xs sm:text-base text-slate-600 font-normal">
              Find the exact kilowatt output matched to your customer's sanctioned electrical load and rooftop area.
            </p>
          </div>
        </div>

        {/* 10 Capacity Cards Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4 pt-8">
          {CAPACITIES.map((cap, idx) => (
            <motion.a
              key={cap.label}
              href="#catalog-browser"
              onClick={() => onSelectCapacity && onSelectCapacity(cap.value)}
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.3, delay: idx * 0.04 }}
              className={`p-4 rounded-2xl border transition-all duration-200 flex flex-col justify-between space-y-3 cursor-pointer group ${
                cap.popular
                  ? "bg-gradient-to-b from-sky-50 to-white border-[#0575B8] shadow-sm hover:shadow-lg hover:-translate-y-1"
                  : "bg-slate-50/70 hover:bg-white border-slate-200 hover:border-slate-300 hover:shadow-md"
              }`}
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-lg sm:text-xl font-black text-slate-900 group-hover:text-[#0575B8] transition-colors">
                    {cap.label}
                  </span>
                  {cap.popular && (
                    <span className="px-2 py-0.5 rounded-full bg-[#F49222] text-white text-[9px] font-black uppercase tracking-wider">
                      Hot
                    </span>
                  )}
                </div>

                <p className="text-[11px] text-slate-600 font-medium mt-1 leading-snug">
                  {cap.desc}
                </p>
              </div>

              <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between">
                <span className="text-[9px] font-extrabold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 truncate">
                  {cap.subsidy}
                </span>
                <FiArrowRight size={12} className="text-slate-400 group-hover:text-[#0575B8] group-hover:translate-x-0.5 transition-all shrink-0 ml-1" />
              </div>
            </motion.a>
          ))}
        </div>

      </div>
    </section>
  );
}
