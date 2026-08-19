import { motion } from "framer-motion";
import { FiGrid, FiCheck, FiArrowRight, FiShield } from "react-icons/fi";

const WATTAGES = [
  { label: "450W Mono PERC", value: "450W", cellTech: "144 Half-Cut DCR", badge: "Compact Residential", popular: false },
  { label: "500W Mono PERC", value: "500W", cellTech: "High Yield Tier-1", badge: "Off-Grid & Agri", popular: false },
  { label: "540W Mono PERC", value: "540W", cellTech: "144 Half-Cell DCR", badge: "High Volume PM Surya", popular: true },
  { label: "550W Mono PERC", value: "550W", cellTech: "Bifacial / Half-Cut", badge: "India's Standard Pick", popular: true },
  { label: "580W N-Type TOPCon", value: "580W", cellTech: "22.5% Dual-Glass", badge: "Commercial Grade", popular: true },
  { label: "600W+ Ultra Power", value: "600W+", cellTech: "TOPCon 144/156 Cells", badge: "MW-Scale & Ground", popular: false },
  { label: "DCR Compliant Modules", value: "DCR", cellTech: "Domestic Content Mandate", badge: "Gov Subsidy Mandatory", popular: true },
  { label: "Non-DCR High Yield", value: "Non-DCR", cellTech: "Lowest ₹/Watt Price", badge: "Commercial & Private", popular: false },
];

export default function BrowseByWattage({ onSelectWattage }) {
  return (
    <section id="browse-wattage" className="py-14 sm:py-20 bg-slate-50 text-slate-900 border-t border-slate-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200 pb-6 sm:pb-8">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-slate-200 shadow-xs">
              <FiGrid className="text-[#0575B8]" size={14} />
              <span className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-[#0575B8]">
                Module Technology & Sizing
              </span>
            </div>

            <h2 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight">
              Browse by <span className="text-[#F49222]">Panel Wattage & DCR Status</span>
            </h2>

            <p className="text-xs sm:text-base text-slate-600 font-normal">
              Filter complete Solarkits engineered with specific module wattages, Mono PERC, and N-Type TOPCon bifacial technologies.
            </p>
          </div>
        </div>

        {/* 8 Wattage Cards Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3.5 sm:gap-4 pt-8">
          {WATTAGES.map((watt, idx) => (
            <motion.a
              key={watt.label}
              href="#catalog-browser"
              onClick={() => onSelectWattage && onSelectWattage(watt.value)}
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.3, delay: idx * 0.04 }}
              className={`p-4 sm:p-5 rounded-2xl border transition-all duration-200 flex flex-col justify-between space-y-3 cursor-pointer group ${
                watt.popular
                  ? "bg-white border-[#0575B8] shadow-sm hover:shadow-lg hover:-translate-y-1"
                  : "bg-white hover:bg-sky-50/50 border-slate-200 hover:border-slate-300 shadow-xs"
              }`}
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[9px] font-black uppercase tracking-wider">
                    {watt.badge}
                  </span>
                  {watt.popular && (
                    <span className="h-2 w-2 rounded-full bg-[#F49222] animate-pulse" />
                  )}
                </div>

                <h3 className="text-base sm:text-lg font-black text-slate-900 group-hover:text-[#0575B8] transition-colors mt-2">
                  {watt.label}
                </h3>

                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  {watt.cellTech}
                </p>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-[#0575B8]">
                <span>Filter Solarkits</span>
                <FiArrowRight size={13} className="group-hover:translate-x-1 transition-transform" />
              </div>
            </motion.a>
          ))}
        </div>

      </div>
    </section>
  );
}
