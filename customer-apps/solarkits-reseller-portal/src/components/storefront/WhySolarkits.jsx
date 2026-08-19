import { motion } from "framer-motion";
import {
  FiPackage,
  FiLayers,
  FiTrendingUp,
  FiAward,
  FiUsers,
  FiMapPin,
  FiShield,
  FiCheckCircle,
} from "react-icons/fi";

const VALUE_PROPOSITIONS = [
  {
    icon: FiPackage,
    title: "Ready-to-Sell Complete Solar Solutions",
    description: "Eliminate component-hunting and compatibility risks. Every Solarkit includes matched Tier-1 panels, certified inverter, and pre-wired IP65 BOS hardware.",
    badge: "Turnkey Packages",
    color: "from-blue-500/10 to-sky-500/10 text-[#0575B8]",
  },
  {
    icon: FiLayers,
    title: "Multiple Brands & Configurations",
    description: "Choose from top Indian and global brands like Waaree, Tata Power, Adani, Vikram, Growatt, Deye, Havells, and Solis across single and 3-phase setups.",
    badge: "Multi-Brand Hub",
    color: "from-amber-500/10 to-orange-500/10 text-[#F49222]",
  },
  {
    icon: FiTrendingUp,
    title: "B2B Pricing & Bulk Procurement",
    description: "Direct factory-gate pricing with up to 18% dealer margins, full 12% GST Input Tax Credit (ITC), and priority container dispatches for MW projects.",
    badge: "Direct Margins",
    color: "from-emerald-500/10 to-teal-500/10 text-emerald-600",
  },
  {
    icon: FiAward,
    title: "Government-Scheme & Tender-Oriented Kits",
    description: "Pre-verified DCR compliant kits with ALMM/BIS certificates for PM Surya Ghar Muft Bijli Yojana, PM KUSUM, and state subsidy tenders.",
    badge: "Subsidy Ready",
    color: "from-purple-500/10 to-indigo-500/10 text-purple-600",
  },
  {
    icon: FiUsers,
    title: "Dealer and EPC Technical Support",
    description: "Access single-line electrical diagrams (SLD), DISCOM net-metering dossiers, on-call engineering sizing, and fast RMA regional replacements.",
    badge: "Engineering Support",
    color: "from-sky-500/10 to-blue-500/10 text-[#0575B8]",
  },
  {
    icon: FiMapPin,
    title: "Franchise Territory Opportunities",
    description: "Secure protected revenue districts with exclusive dealership rights, digital inventory wallet, and direct local buyer lead routing.",
    badge: "Protected Area",
    color: "from-rose-500/10 to-pink-500/10 text-rose-600",
  },
  {
    icon: FiShield,
    title: "One-Stop Solar Business Platform",
    description: "From product browsing, procurement, territory checks, and finance calculators to CRM lead fulfillment—everything in a unified platform.",
    badge: "Complete Ecosystem",
    color: "from-slate-500/10 to-slate-600/10 text-slate-800",
  },
];

export default function WhySolarkits() {
  return (
    <section id="why-solarkits" className="py-16 sm:py-24 bg-white text-slate-900 relative overflow-hidden border-t border-slate-100">
      {/* Soft Glow Background */}
      <div className="absolute top-1/2 left-0 w-96 h-96 bg-sky-500/5 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-amber-500/5 blur-[120px] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3 sm:space-y-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-50 border border-sky-100 shadow-xs">
            <span className="h-1.5 w-1.5 rounded-full bg-[#0575B8]" />
            <span className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-[#0575B8]">
              Why Choose Solarkits
            </span>
          </div>

          <h2 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight">
            Built for Solar Dealers, EPCs, and{" "}
            <span className="text-[#F49222]">
              Franchise Partners
            </span>
          </h2>

          <p className="text-xs sm:text-base text-slate-600 font-normal max-w-2xl mx-auto leading-relaxed">
            Positioned as India's primary B2B ready-to-sell solar platform, transforming how commercial installers and retail partners procure complete rooftop systems.
          </p>
        </div>

        {/* 7 Benefit Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 pt-10 sm:pt-14">
          {VALUE_PROPOSITIONS.map((item, idx) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: idx * 0.08 }}
              className={`rounded-3xl p-6 sm:p-7 border border-slate-200/90 bg-slate-50/50 hover:bg-white hover:border-slate-300 hover:shadow-xl transition-all duration-300 flex flex-col justify-between group ${
                idx === 6 ? "md:col-span-2 lg:col-span-3 bg-gradient-to-r from-sky-50/70 via-white to-amber-50/70 border-sky-200/80" : ""
              }`}
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className={`h-12 w-12 rounded-2xl bg-gradient-to-br ${item.color} flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform`}>
                    <item.icon size={22} />
                  </div>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-full bg-white border border-slate-200 text-slate-700 shadow-xs">
                    {item.badge}
                  </span>
                </div>

                <div className="space-y-2">
                  <h3 className="text-base sm:text-lg font-black text-slate-900 group-hover:text-[#0575B8] transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </div>

              <div className="pt-4 mt-2 border-t border-slate-100 flex items-center gap-1.5 text-[11px] font-bold text-[#0575B8]">
                <FiCheckCircle size={13} className="text-emerald-600" />
                <span>Verified B2B Standard</span>
              </div>
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  );
}
