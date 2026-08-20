import { motion } from "framer-motion";
import { FiArrowRight, FiShoppingCart } from "react-icons/fi";

const RANGES = [
  {
    id: 1, category: "Home Solar Kits",
    name: "1kW – 3kW Rooftop Kits",
    desc: "Complete pre-configured on-grid kits for 2–3 BHK homes. PM Surya Ghar subsidy eligible.",
    emoji: "🏠",
    features: ["Panels + Inverter + Structure", "Subsidy Up to ₹78,000", "Zero Power Bills"],
    priceFrom: "₹45,000",
    color: "from-primary-500 to-primary-700",
    textColor: "text-primary-600",
    bgLight: "bg-primary-50",
  },
  {
    id: 2, category: "Residential Combo Kits",
    name: "3kW – 5kW Combo Kits",
    desc: "Heavy residential solar kits with high-efficiency tier-1 panels, smart inverter and BOS.",
    emoji: "⚡",
    features: ["Heavy Appliance Ready", "Smart App Monitoring", "25-Yr Panel Warranty"],
    priceFrom: "₹1,35,000",
    color: "from-[#29ABE2] to-primary-600",
    textColor: "text-sky-600",
    bgLight: "bg-sky-50",
  },
  {
    id: 3, category: "Hybrid Solar Kits",
    name: "5kW – 10kW Hybrid Kits",
    desc: "Grid synchronization + battery backup for 24x7 uninterrupted power and zero downtime.",
    emoji: "🔋",
    features: ["Lithium / Tubular Storage", "Auto Grid Switchover", "Uninterrupted Backup"],
    priceFrom: "₹2,45,000",
    color: "from-green-500 to-teal-600",
    textColor: "text-green-600",
    bgLight: "bg-green-50",
  },
  {
    id: 4, category: "Commercial Solar Kits",
    name: "10kW – 100kW Commercial",
    desc: "3-Phase high-yield solar kits designed for commercial rooftops, factories and institutions.",
    emoji: "🏢",
    features: ["3-Phase Industrial Power", "Fast ROI in 3-4 Yrs", "Accelerated Depreciation"],
    priceFrom: "₹4,50,000",
    color: "from-accent-400 to-accent-600",
    textColor: "text-amber-600",
    bgLight: "bg-amber-50",
  },
  {
    id: 5, category: "Solar BOS Kits",
    name: "Complete Balance of System",
    desc: "Pre-wired ACDB/DCDB boxes, MC4 cables, lightning arrestors and chemical earthing bundles.",
    emoji: "📦",
    features: ["Pre-wired & Tested", "IP65 Weatherproof", "Standard Compliant"],
    priceFrom: "₹12,500",
    color: "from-gray-600 to-gray-800",
    textColor: "text-gray-600",
    bgLight: "bg-gray-50",
  },
  {
    id: 6, category: "Custom EPC Kits",
    name: "Customized Solar Combo",
    desc: "Tailored solar kits configured precisely for your specific rooftop dimensions and electrical load.",
    emoji: "🛠️",
    features: ["Custom Bill of Materials", "Engineer Verified", "Direct Site Dispatch"],
    priceFrom: "Custom Quote",
    color: "from-purple-500 to-purple-700",
    textColor: "text-purple-600",
    bgLight: "bg-purple-50",
  },
];

export default function ProductRangeSection() {
  return (
    <section className="py-16 md:py-24 bg-white" id="range">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Heading */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <span className="inline-block bg-primary-50 text-primary-600 text-xs font-bold tracking-widest uppercase px-4 py-1.5 rounded-full mb-3">
            Solar Kits Range
          </span>
          <h2 className="font-heading text-3xl md:text-4xl font-bold text-navy section-heading">
            Complete Solar Kits for Every Need
          </h2>
          <p className="text-gray-500 mt-4 text-base max-w-xl mx-auto">
            From 1kW home rooftop packages to 100kW commercial systems — discover our full range of solar kits
          </p>
        </motion.div>

        {/* Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {RANGES.map((range, i) => (
            <motion.div
              key={range.id}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              whileHover={{ y: -6 }}
              className="bg-white rounded-2xl border border-gray-100 shadow-card overflow-hidden group cursor-pointer"
            >
              {/* Top gradient */}
              <div className={`bg-gradient-to-r ${range.color} p-5 flex items-center gap-4`}>
                <div className="text-4xl">{range.emoji}</div>
                <div>
                  <p className="text-white/70 text-xs font-semibold uppercase tracking-wide">
                    {range.category}
                  </p>
                  <h3 className="font-heading font-bold text-white text-lg leading-tight">
                    {range.name}
                  </h3>
                </div>
              </div>

              {/* Body */}
              <div className="p-5">
                <p className="text-gray-500 text-sm leading-relaxed mb-4">{range.desc}</p>

                {/* Features */}
                <ul className="space-y-1.5 mb-5">
                  {range.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-xs text-gray-600">
                      <span className="w-4 h-4 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-[10px] flex-shrink-0">✓</span>
                      {f}
                    </li>
                  ))}
                </ul>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-400">Starting from</p>
                    <p className={`font-extrabold text-base ${range.textColor}`}>{range.priceFrom}</p>
                  </div>
                  <button className={`flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r ${range.color} text-white text-xs font-bold rounded-xl group-hover:shadow-md transition-all`}>
                    <FiShoppingCart className="text-xs" />
                    Shop Now
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
