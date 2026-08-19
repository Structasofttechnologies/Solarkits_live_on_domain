import { motion } from "framer-motion";
import {
  FiSearch,
  FiFileText,
  FiTruck,
  FiCheckCircle,
  FiZap,
} from "react-icons/fi";

const STEPS = [
  {
    step: "01",
    title: "Select or Configure Solarkit",
    description: "Browse pre-engineered On-Grid, Off-Grid, or Hybrid Solarkits by panel wattage (450W-600W+), application, and capacity (1kW-10kW+).",
    icon: FiSearch,
    badge: "Kit-First",
  },
  {
    step: "02",
    title: "Instant Wholesale Quote & GST Verification",
    description: "Enter your GSTIN to lock in verified franchisee factory-gate pricing with full 12% Input Tax Credit and commercial transparent margins.",
    icon: FiFileText,
    badge: "GST ITC Eligible",
  },
  {
    step: "03",
    title: "Fast Regional Hub Dispatch",
    description: "Orders are verified and dispatched within 24-48 hours from the nearest regional fulfillment center with full transit insurance.",
    icon: FiTruck,
    badge: "48-Hr Fulfillment",
  },
  {
    step: "04",
    title: "Rooftop Installation & Commissioning",
    description: "Install using pre-wired IP65 plug-and-play ACDB/DCDB boxes with complete SLD diagrams for seamless DISCOM net-metering approval.",
    icon: FiCheckCircle,
    badge: "Turnkey Ready",
  },
];

export default function HowProcurementWorks() {
  return (
    <section id="how-it-works" className="py-16 sm:py-24 bg-white text-slate-900 border-t border-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3 sm:space-y-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-50 border border-sky-100 shadow-xs">
            <FiZap className="text-[#0575B8]" size={14} />
            <span className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-[#0575B8]">
              Seamless 4-Step Process
            </span>
          </div>

          <h2 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight">
            How Solarkits <span className="text-[#F49222]">Procurement Works</span>
          </h2>

          <p className="text-xs sm:text-base text-slate-600 font-normal max-w-2xl mx-auto leading-relaxed">
            From digital selection and GST verification to warehouse dispatch and rooftop commissioning—engineered for maximum speed and zero friction.
          </p>
        </div>

        {/* 4 Steps Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 pt-12 sm:pt-16 relative">
          {STEPS.map((s, idx) => (
            <motion.div
              key={s.step}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.35, delay: idx * 0.1 }}
              className="p-6 rounded-3xl bg-slate-50 border border-slate-200 hover:border-slate-300 hover:shadow-lg transition-all duration-200 space-y-4 flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-black text-[#0575B8]">
                    {s.step}
                  </span>
                  <div className="h-10 w-10 rounded-2xl bg-white border border-slate-200 text-[#F49222] flex items-center justify-center shadow-xs">
                    <s.icon size={18} />
                  </div>
                </div>

                <div className="space-y-1">
                  <h3 className="text-base font-black text-slate-900">
                    {s.title}
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed font-normal">
                    {s.description}
                  </p>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200/80">
                <span className="px-2.5 py-0.5 rounded-full bg-white border border-slate-200 text-slate-700 text-[10px] font-black uppercase tracking-wider shadow-xs">
                  {s.badge}
                </span>
              </div>
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  );
}
