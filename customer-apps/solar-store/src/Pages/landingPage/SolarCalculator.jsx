import { useState } from "react";
import { motion } from "framer-motion";
import { FiZap, FiArrowRight } from "react-icons/fi";

const MONTHLY_BILL_RANGES = [
  { label: "< ₹500", system: "1 kW", panels: 2, cost: "₹45,000 – ₹60,000", subsidy: "₹30,000" },
  { label: "₹500 – ₹1,000", system: "2 kW", panels: 4, cost: "₹90,000 – ₹1,20,000", subsidy: "₹60,000" },
  { label: "₹1,000 – ₹2,000", system: "3 kW", panels: 6, cost: "₹1,35,000 – ₹1,80,000", subsidy: "₹78,000" },
  { label: "₹2,000 – ₹3,000", system: "5 kW", panels: 10, cost: "₹2,20,000 – ₹2,80,000", subsidy: "₹78,000" },
  { label: "> ₹3,000", system: "10 kW", panels: 20, cost: "₹4,00,000 – ₹5,00,000", subsidy: "₹78,000" },
];

const TIPS = [
  { emoji: "📐", title: "Space Required", desc: "Each kW of solar needs approx 10 sq. ft. of shadow-free rooftop area." },
  { emoji: "☀️", title: "Sunlight Hours", desc: "India averages 5–7 peak sun hours/day — ideal for rooftop solar." },
  { emoji: "🔄", title: "Net Metering", desc: "Export surplus power to the grid and earn electricity credits." },
  { emoji: "💰", title: "ROI in 4–6 Years", desc: "Average payback period with subsidy is just 4 to 6 years." },
];

export default function SolarCalculator() {
  const [selected, setSelected] = useState(null);

  return (
    <section id="calculator" className="py-16 md:py-24 bg-solarbg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Heading */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <span className="inline-block bg-primary-50 text-primary-600 text-xs font-bold tracking-widest uppercase px-4 py-1.5 rounded-full mb-3">
            Solar Kit Sizing Guide
          </span>
          <h2 className="font-heading text-3xl md:text-4xl font-bold text-navy section-heading">
            Find Your Perfect Solar Kit
          </h2>
          <p className="text-gray-500 mt-4 max-w-xl mx-auto text-base">
            Select your monthly electricity bill to calculate the right solar combo kit size for your home
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-10 items-start">
          {/* Left — Bill selector table */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="bg-white rounded-2xl shadow-card overflow-hidden border border-gray-100"
          >
            <div className="bg-primary-500 px-6 py-4">
              <h3 className="font-heading font-bold text-white text-lg flex items-center gap-2">
                <FiZap /> Select Your Monthly Bill
              </h3>
            </div>
            <div className="p-2">
              {MONTHLY_BILL_RANGES.map((row, i) => (
                <motion.button
                  key={row.label}
                  onClick={() => setSelected(i)}
                  whileHover={{ x: 4 }}
                  className={`w-full flex items-center justify-between p-4 rounded-xl mb-1 transition-all text-left ${
                    selected === i
                      ? "bg-primary-50 border border-primary-200"
                      : "hover:bg-gray-50 border border-transparent"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 transition-all ${
                      selected === i ? "border-primary-500 bg-primary-500" : "border-gray-300"
                    }`}>
                      {selected === i && (
                        <div className="w-full h-full rounded-full bg-white scale-[0.4] transform" />
                      )}
                    </div>
                    <span className="font-semibold text-navy text-sm">{row.label}</span>
                  </div>
                  <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                    selected === i ? "bg-primary-500 text-white" : "bg-gray-100 text-gray-500"
                  }`}>
                    {row.system} System
                  </span>
                </motion.button>
              ))}
            </div>
          </motion.div>

          {/* Right — Result + Tips */}
          <div className="space-y-6">
            {/* Result card */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="bg-white rounded-2xl shadow-card border border-gray-100 overflow-hidden"
            >
              <div className="bg-gradient-to-r from-accent-400 to-accent-600 px-6 py-4">
                <h3 className="font-heading font-bold text-white text-lg">Your Recommendation</h3>
              </div>
              <div className="p-6">
                {selected !== null ? (
                  <motion.div
                    key={selected}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-4"
                  >
                    <div className="text-center py-4">
                      <div className="text-6xl mb-2">☀️</div>
                      <div className="font-heading text-4xl font-extrabold text-navy">
                        {MONTHLY_BILL_RANGES[selected].system}
                      </div>
                      <p className="text-gray-500 text-sm">Solar System Recommended</p>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { label: "Solar Panels", val: `${MONTHLY_BILL_RANGES[selected].panels} Panels` },
                        { label: "Est. Cost", val: MONTHLY_BILL_RANGES[selected].cost },
                        { label: "Subsidy", val: MONTHLY_BILL_RANGES[selected].subsidy },
                      ].map((d) => (
                        <div key={d.label} className="text-center bg-solarbg rounded-xl p-3">
                          <p className="font-bold text-navy text-sm">{d.val}</p>
                          <p className="text-xs text-gray-400 mt-0.5">{d.label}</p>
                        </div>
                      ))}
                    </div>
                    <motion.a
                      href="#products"
                      whileHover={{ scale: 1.03 }}
                      className="w-full flex items-center justify-center gap-2 py-3 bg-primary-500 hover:bg-primary-600 text-white font-bold rounded-xl transition-all shadow-sm text-sm"
                    >
                      Shop {MONTHLY_BILL_RANGES[selected].system} Systems <FiArrowRight />
                    </motion.a>
                  </motion.div>
                ) : (
                  <div className="text-center py-10 text-gray-400">
                    <div className="text-4xl mb-3">👆</div>
                    <p className="text-sm">Select your monthly bill to see your recommendation</p>
                  </div>
                )}
              </div>
            </motion.div>

            {/* Tips */}
            <div className="grid grid-cols-2 gap-3">
              {TIPS.map((tip) => (
                <motion.div
                  key={tip.title}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className="bg-white border border-gray-100 rounded-xl p-4 hover:shadow-card transition-all"
                >
                  <div className="text-xl mb-1.5">{tip.emoji}</div>
                  <p className="font-bold text-navy text-xs mb-1">{tip.title}</p>
                  <p className="text-gray-500 text-xs leading-relaxed">{tip.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
