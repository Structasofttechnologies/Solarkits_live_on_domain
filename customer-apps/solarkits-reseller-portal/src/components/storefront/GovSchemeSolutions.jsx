import { motion } from "framer-motion";
import {
  FiAward,
  FiCheckCircle,
  FiFileText,
  FiShield,
  FiArrowRight,
  FiDownload,
} from "react-icons/fi";

const SCHEMES = [
  {
    title: "PM Surya Ghar: Muft Bijli Yojana",
    category: "Residential Rooftop Subsidy",
    subsidyAmount: "Direct DBT Subsidy up to ₹78,000",
    description: "Central Financial Assistance (CFA) scheme providing ₹30,000 for 1kW, ₹60,000 for 2kW, and max ₹78,000 for 3kW+ rooftop solar installations. All Solarkits are DCR certified with ALMM approved modules.",
    keyPoints: [
      "Mandatory DCR (Domestic Content Requirement) Solar Panels",
      "National Portal for Rooftop Solar (NPRS) Compatible",
      "Fast 30-Day DISCOM Subsidy DBT to Customer Bank Account",
      "Factory flash test reports and warranty cards included",
    ],
    recommendedKits: "1.1 kW, 2.2 kW, and 3.3 kW DCR Solar Kits",
    badge: "National Scheme",
    badgeColor: "bg-emerald-50 text-emerald-800 border-emerald-200",
  },
  {
    title: "PM-KUSUM Scheme (Component-A & C)",
    category: "Agricultural & Feeder Solarization",
    subsidyAmount: "Up to 60% Central + State Subsidy",
    description: "De-dieselization and grid-connected solar water pumps for farmers and FPOs. Pre-configured Off-Grid and Hybrid Solarkits engineered with heavy-duty MPPT charge controllers and VFD pumps.",
    keyPoints: [
      "Tier-1 High-Efficiency 500W & 550W Modules",
      "Solar VFD Pump Controllers & IP65 Switchgear",
      "MNRE and State Nodal Agency (SNA) Approved Specs",
      "Rugged HDGI Seasonal Tilt Structures for Farms",
    ],
    recommendedKits: "3 kW, 5 kW, and 7.5 kW Off-Grid & Agri Kits",
    badge: "Agri Feeder Solar",
    badgeColor: "bg-amber-50 text-[#D97E15] border-amber-200",
  },
  {
    title: "Commercial & MSME Tax Depreciation (AD 40%)",
    category: "Industrial & Institutional Rooftop",
    subsidyAmount: "40% Accelerated Depreciation Benefit",
    description: "Substantial corporate income tax reduction in Year 1 for commercial buildings, factories, schools, and hospitals installing rooftop solar power systems. Full 12% GST Input Tax Credit claimable.",
    keyPoints: [
      "40% Section 32 Income Tax Depreciation Write-off",
      "100% Net-Metering Electricity Bill Zero Offset",
      "High Efficiency 580W & 600W+ N-Type TOPCon Dual Glass",
      "3-Phase 415V Industrial Grid Synchronized Inverters",
    ],
    recommendedKits: "10 kW, 20 kW, and MW Scale Turnkey Commercial Kits",
    badge: "Corporate Tax Savings",
    badgeColor: "bg-sky-50 text-[#0575B8] border-sky-200",
  },
];

export default function GovSchemeSolutions({ onOpenLeadModal }) {
  return (
    <section id="gov-schemes" className="py-16 sm:py-24 bg-gradient-to-b from-slate-50 to-white text-slate-900 border-t border-slate-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3 sm:space-y-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 shadow-xs">
            <FiAward className="text-emerald-600" size={14} />
            <span className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-emerald-800">
              Subsidy & Tender Solutions
            </span>
          </div>

          <h2 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight">
            Government-Scheme & Tender-Oriented{" "}
            <span className="text-[#0575B8]">
              Solarkits
            </span>
          </h2>

          <p className="text-xs sm:text-base text-slate-600 font-normal max-w-2xl mx-auto leading-relaxed">
            Eliminate rejection risks. Every Solarkit designed for government schemes is built with verified ALMM-listed, DCR-compliant modules and certified IP65 electrical safety hardware.
          </p>
        </div>

        {/* 3 Scheme Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-10 sm:pt-14">
          {SCHEMES.map((sch, idx) => (
            <motion.div
              key={sch.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: idx * 0.1 }}
              className="rounded-3xl bg-white border border-slate-200/90 p-6 sm:p-7 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${sch.badgeColor}`}>
                    {sch.badge}
                  </span>
                  <span className="text-[11px] font-bold text-slate-500">
                    {sch.category}
                  </span>
                </div>

                <div className="space-y-1.5">
                  <h3 className="text-lg font-black text-slate-900 leading-snug">
                    {sch.title}
                  </h3>
                  <p className="text-xs font-black text-emerald-700 bg-emerald-50 p-2 rounded-xl border border-emerald-200">
                    {sch.subsidyAmount}
                  </p>
                  <p className="text-xs text-slate-600 leading-relaxed pt-1">
                    {sch.description}
                  </p>
                </div>

                {/* Key Points */}
                <div className="space-y-2 pt-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Key Compliance Features:
                  </span>
                  <ul className="space-y-1.5 text-xs text-slate-700">
                    {sch.keyPoints.map((pt, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <FiCheckCircle size={13} className="text-emerald-600 shrink-0 mt-0.5" />
                        <span>{pt}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Recommended Solarkits & Action */}
              <div className="pt-6 mt-4 border-t border-slate-100 space-y-3">
                <div className="text-[11px]">
                  <span className="font-bold text-slate-500 block">Recommended Kits:</span>
                  <span className="font-extrabold text-[#0575B8]">{sch.recommendedKits}</span>
                </div>

                <button
                  onClick={() => onOpenLeadModal({ requiredConfig: `${sch.title} Solution` }, "bulk_price")}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#0575B8] to-[#1965B0] hover:from-[#045D93] hover:to-[#0575B8] text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-md shadow-blue-500/20 transition-all cursor-pointer"
                >
                  <span>Request Tender / Subsidy Quote</span>
                  <FiArrowRight size={13} />
                </button>
              </div>
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  );
}
