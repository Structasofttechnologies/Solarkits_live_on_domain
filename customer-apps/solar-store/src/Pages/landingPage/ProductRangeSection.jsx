import { motion } from "framer-motion";
import { FiArrowRight, FiShoppingCart } from "react-icons/fi";

const RANGES = [
  {
    id: 1, category: "Solar Panels",
    name: "1kW – 100kW Panels",
    desc: "Monocrystalline, Polycrystalline, Bifacial & Half-Cut Cell technology from top brands",
    emoji: "🔆",
    features: ["25 Yr Performance Warranty", "BIS Certified", "Anti-PID Technology"],
    priceFrom: "₹8,000/panel",
    color: "from-primary-500 to-primary-700",
    textColor: "text-primary-600",
    bgLight: "bg-primary-50",
  },
  {
    id: 2, category: "Inverters",
    name: "1kW – 100kW Inverters",
    desc: "On-Grid, Off-Grid, Hybrid & Micro inverters with multi-year warranty and remote monitoring",
    emoji: "⚡",
    features: ["Wi-Fi Monitoring", "MPPT Technology", "IP65 Rated"],
    priceFrom: "₹12,000",
    color: "from-[#29ABE2] to-primary-600",
    textColor: "text-sky-600",
    bgLight: "bg-sky-50",
  },
  {
    id: 3, category: "Solar Batteries",
    name: "100Ah – 1000Ah Storage",
    desc: "Tubular, Lithium-Ion & VRLA batteries for uninterrupted solar power storage",
    emoji: "🔋",
    features: ["Deep Cycle Design", "5 Yr Warranty", "Maintenance-Free Option"],
    priceFrom: "₹9,500",
    color: "from-green-500 to-teal-600",
    textColor: "text-green-600",
    bgLight: "bg-green-50",
  },
  {
    id: 4, category: "Solar Kits",
    name: "Complete 1kW – 10kW Kits",
    desc: "Everything bundled — panels, inverter, battery, mounting & cables. Ready in 48 hours",
    emoji: "📦",
    features: ["Plug & Play", "Subsidy Ready", "48-hr Installation"],
    priceFrom: "₹45,000",
    color: "from-accent-400 to-accent-600",
    textColor: "text-amber-600",
    bgLight: "bg-amber-50",
  },
  {
    id: 5, category: "Mounting Structures",
    name: "Rooftop & Ground Mount",
    desc: "Hot-dip galvanised steel and anodised aluminium structures for every roof type",
    emoji: "🏗️",
    features: ["Wind & Snow Resistant", "Corrosion Proof", "Easy Install"],
    priceFrom: "₹2,500/set",
    color: "from-gray-600 to-gray-800",
    textColor: "text-gray-600",
    bgLight: "bg-gray-50",
  },
  {
    id: 6, category: "Accessories",
    name: "DC/AC Cables & BOS",
    desc: "MC4 connectors, junction boxes, combiner boxes, DC breakers, cable trays and more",
    emoji: "🔧",
    features: ["UV Resistant Cables", "IP67 Connectors", "IEC Certified"],
    priceFrom: "₹250",
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
            Full Product Range
          </span>
          <h2 className="font-heading text-3xl md:text-4xl font-bold text-navy section-heading">
            Everything Solar, Under One Roof
          </h2>
          <p className="text-gray-500 mt-4 text-base max-w-xl mx-auto">
            From individual components to complete solar systems — SolarKits has it all
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
