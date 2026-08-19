import { motion } from "framer-motion";
import {
  FiPercent,
  FiFileText,
  FiTruck,
  FiTool,
  FiShield,
  FiUserCheck,
  FiTrendingUp,
  FiCheckCircle,
} from "react-icons/fi";

const SUPPORT_PILLARS = [
  {
    icon: FiPercent,
    title: "15% - 18% Dealer Wholesale Margins",
    description: "Purchase directly at factory wholesale prices without multiple middleman markups. Full 12% GST tax invoices allow 100% Input Tax Credit (ITC) pass-through.",
  },
  {
    icon: FiFileText,
    title: "Auto-Generated SLD & DISCOM Dossiers",
    description: "Download certified Single Line Diagrams (SLD), cable sizing schedules, and manufacturer data sheets for immediate submission on state DISCOM portals.",
  },
  {
    icon: FiTruck,
    title: "24-48 Hr Fast Regional Hub Dispatch",
    description: "Save on warehouse holding costs. All Solarkits are dispatched directly from our 28+ regional fulfillment centers with transit insurance.",
  },
  {
    icon: FiTool,
    title: "Pre-Wired IP65 Plug & Play Switchgear",
    description: "All ACDB and DCDB boxes come pre-wired with Type-II surge protection (SPD), DC fuses, and MCBs, cutting rooftop installation time by up to 60%.",
  },
  {
    icon: FiShield,
    title: "Centralized Warranty & RMA Assistance",
    description: "Direct manufacturer-backed replacements for inverters, modules, and BOS switchgear handled directly via the partner portal without vendor disputes.",
  },
  {
    icon: FiUserCheck,
    title: "Local EPC Customer Lead Allocation",
    description: "Inquiries from rooftop homeowners and commercial business owners in your assigned territory are routed directly to your franchisee dashboard.",
  },
];

export default function DealerEpcSupport({ onOpenLeadModal }) {
  return (
    <section id="dealer-support" className="py-16 sm:py-24 bg-white text-slate-900 border-t border-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-end border-b border-slate-200 pb-8">
          <div className="lg:col-span-8 space-y-3">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-50 border border-sky-100 shadow-xs">
              <span className="h-1.5 w-1.5 rounded-full bg-[#0575B8]" />
              <span className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-[#0575B8]">
                B2B Partner Ecosystem
              </span>
            </div>

            <h2 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight">
              Comprehensive Support for{" "}
              <span className="text-[#F49222]">
                Dealers, EPCs & Contractors
              </span>
            </h2>

            <p className="text-xs sm:text-base text-slate-600 font-normal leading-relaxed">
              We empower local solar businesses with ready-to-sell inventory, engineering blueprints, software tools, and territorial exclusivity to scale faster with minimal working capital.
            </p>
          </div>

          <div className="lg:col-span-4 flex justify-start lg:justify-end">
            <button
              onClick={() => onOpenLeadModal({ requiredConfig: "Dealer Wholesale Partnership" }, "franchise_apply")}
              className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-[#0575B8] to-[#1965B0] hover:from-[#045D93] hover:to-[#0575B8] text-white font-extrabold text-xs uppercase tracking-wider shadow-md shadow-blue-500/20 transition-all cursor-pointer"
            >
              Register as Authorized Dealer →
            </button>
          </div>
        </div>

        {/* 6 Support Pillars */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6 pt-10 sm:pt-12">
          {SUPPORT_PILLARS.map((p, idx) => (
            <motion.div
              key={p.title}
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.35, delay: idx * 0.07 }}
              className="p-6 rounded-3xl bg-slate-50/70 border border-slate-200/80 hover:bg-white hover:border-slate-300 hover:shadow-lg transition-all duration-200 space-y-3"
            >
              <div className="h-11 w-11 rounded-2xl bg-white border border-slate-200 text-[#0575B8] flex items-center justify-center shadow-xs">
                <p.icon size={20} />
              </div>

              <h3 className="text-base font-black text-slate-900 leading-snug">
                {p.title}
              </h3>

              <p className="text-xs text-slate-600 leading-relaxed font-normal">
                {p.description}
              </p>
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  );
}
