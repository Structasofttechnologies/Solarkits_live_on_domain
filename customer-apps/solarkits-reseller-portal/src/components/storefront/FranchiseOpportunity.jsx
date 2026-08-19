import { motion } from "framer-motion";
import {
  FiZap,
  FiTrendingUp,
  FiMapPin,
  FiShield,
  FiCheckCircle,
  FiArrowRight,
  FiBox,
} from "react-icons/fi";

const FRANCHISE_MODELS = [
  {
    title: "Commission Starter Partner",
    type: "Zero Stocking Risk",
    setupCost: "Zero Capital / Free Promo",
    marginRange: "8% - 10% on Every Deal",
    idealFor: "Electrical Retailers, Real Estate Agents, & Independent Solar Promoters",
    features: [
      "No inventory holding or warehouse storage required",
      "Direct factory fulfillment to end-customer",
      "1 District Territory lead assignment",
      "Digital Wallet automated commission payouts (T+0)",
      "Standard marketing banners & brochure kit",
    ],
    badge: "Zero Investment",
    badgeColor: "bg-sky-50 text-[#0575B8] border-sky-200",
    buttonText: "Join as Commission Partner",
    planCode: "COMMISSION_STARTER",
  },
  {
    title: "Authorized Dealer (Experience Center)",
    type: "Highest Realized Margin",
    setupCost: "₹5,000 / Year + Stock",
    marginRange: "15% - 20% Wholesale Profit",
    idealFor: "Established Solar Dealers, Hardware Stores, & Electrical Contractors",
    features: [
      "Wholesale factory-gate purchasing on all Solarkits",
      "Up to 2 Exclusive Revenue Districts protection",
      "Verified local EPC buyer leads allocated directly",
      "Pre-wired demo displays & store branding collateral",
      "Dedicated Technical SLD & DISCOM Support Engineer",
    ],
    badge: "Most Popular",
    badgeColor: "bg-amber-50 text-[#D97E15] border-amber-200",
    buttonText: "Apply for Authorized Dealership",
    popular: true,
    planCode: "DEALER_PRO",
  },
  {
    title: "Master Territory Distributor",
    type: "Zonal / Multi-District",
    setupCost: "Custom Capital / Evaluation",
    marginRange: "Wholesale + 3% Override",
    idealFor: "Regional Distributors, Mega Warehouses, & Large EPC Firms",
    features: [
      "Exclusive multi-district or division-level distribution",
      "Priority container dispatch from central factories",
      "Sub-dealer onboarding & overriding commission rights",
      "Custom co-branded collaterals & quarterly rebates",
      "Direct Escalation Manager & SCADA Integration",
    ],
    badge: "Enterprise Scale",
    badgeColor: "bg-purple-50 text-purple-700 border-purple-200",
    buttonText: "Request Zonal Territory Review",
    planCode: "MASTER_DISTRIBUTOR",
  },
];

export default function FranchiseOpportunity({ onOpenLeadModal }) {
  return (
    <section id="franchise-plans" className="py-16 sm:py-24 bg-slate-50 text-slate-900 border-t border-slate-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3 sm:space-y-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-slate-200 shadow-xs">
            <FiMapPin className="text-[#F49222]" size={14} />
            <span className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-[#D97E15]">
              Franchise Territory Opportunity
            </span>
          </div>

          <h2 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight">
            Start Your Own Solar Business with{" "}
            <span className="text-[#0575B8]">
              Solarkits Franchise
            </span>
          </h2>

          <p className="text-xs sm:text-base text-slate-600 font-normal max-w-2xl mx-auto leading-relaxed">
            Build a profitable local solar enterprise with ready-to-sell Solarkits, guaranteed territory rights, B2B procurement technology, and direct customer lead allocation.
          </p>
        </div>

        {/* 3 Franchise Models */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-10 sm:pt-14">
          {FRANCHISE_MODELS.map((model, idx) => (
            <motion.div
              key={model.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: idx * 0.1 }}
              className={`rounded-3xl p-6 sm:p-8 flex flex-col justify-between transition-all duration-300 relative ${
                model.popular
                  ? "bg-white border-2 border-[#0575B8] shadow-xl hover:-translate-y-1.5"
                  : "bg-white border border-slate-200/90 shadow-sm hover:shadow-lg"
              }`}
            >
              {model.popular && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-[#0575B8] text-white text-[10px] font-black uppercase tracking-wider shadow-md">
                  Recommended Business Model
                </div>
              )}

              <div className="space-y-4">
                <div className="flex items-center justify-between pt-1">
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${model.badgeColor}`}>
                    {model.badge}
                  </span>
                  <span className="text-xs font-bold text-slate-400">
                    {model.type}
                  </span>
                </div>

                <div>
                  <h3 className="text-xl font-black text-slate-900 leading-snug">
                    {model.title}
                  </h3>
                  <div className="mt-2 p-3 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-baseline justify-between">
                    <span className="text-[10px] font-bold text-slate-500 uppercase">Margin Range</span>
                    <span className="text-sm font-black text-[#0575B8]">{model.marginRange}</span>
                  </div>
                </div>

                <p className="text-xs text-slate-600 font-medium">
                  <strong>Best For:</strong> {model.idealFor}
                </p>

                {/* Features List */}
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Franchise Entitlements:
                  </span>
                  <ul className="space-y-2 text-xs text-slate-700">
                    {model.features.map((feat, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <FiCheckCircle size={14} className="text-emerald-600 shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-6 mt-4 border-t border-slate-100">
                <button
                  onClick={() => onOpenLeadModal({ preferredModel: model.title, requiredConfig: model.title }, "franchise_apply")}
                  className={`w-full py-3.5 rounded-xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    model.popular
                      ? "bg-gradient-to-r from-[#0575B8] to-[#1965B0] hover:from-[#045D93] hover:to-[#0575B8] text-white shadow-md shadow-blue-500/25"
                      : "bg-[#0575B8] hover:bg-[#045D93] text-white shadow-xs"
                  }`}
                >
                  <span>{model.buttonText}</span>
                  <FiArrowRight size={14} />
                </button>
              </div>
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  );
}
