import { motion } from "framer-motion";
import { FiArrowRight, FiCheckCircle } from "react-icons/fi";

export default function SubsidyBanner() {
  return (
    <section id="subsidy" className="relative py-16 md:py-20 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#F5A623] via-[#F59E0B] to-[#F5A623]" />

      {/* Decorative circles */}
      <div className="absolute -top-24 -right-24 w-80 h-80 rounded-full bg-white/10" />
      <div className="absolute -bottom-16 -left-16 w-64 h-64 rounded-full bg-white/10" />
      <div className="absolute top-1/2 left-1/3 w-48 h-48 rounded-full bg-white/5 -translate-y-1/2" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
          {/* Left content */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="text-center lg:text-left"
          >
            <div className="inline-flex items-center gap-2 bg-white/25 text-white text-xs font-bold tracking-wider uppercase px-4 py-1.5 rounded-full mb-4">
              🏛️ Government Scheme — PM Surya Ghar Yojana
            </div>
            <h2 className="font-heading text-3xl md:text-5xl font-extrabold text-white leading-tight mb-3">
              Get Subsidy Up to{" "}
              <span className="text-navy underline decoration-wavy decoration-white/60">₹78,000</span>
            </h2>
            <p className="text-white/90 text-base md:text-lg max-w-xl mb-6">
              Under PM Surya Ghar Muft Bijli Yojana, eligible households get
              <strong className="text-white"> 300 units free electricity</strong> every month plus a direct
              bank subsidy of up to ₹78,000!
            </p>

            {/* Checkpoints */}
            <div className="flex flex-wrap gap-x-6 gap-y-2 mb-8 justify-center lg:justify-start">
              {[
                "1kW System: Up to ₹30,000",
                "2kW System: Up to ₹60,000",
                "3kW+ System: Up to ₹78,000",
              ].map((pt) => (
                <div key={pt} className="flex items-center gap-2 text-white text-sm font-semibold">
                  <FiCheckCircle className="text-navy flex-shrink-0" />
                  {pt}
                </div>
              ))}
            </div>

            <div className="flex flex-wrap gap-4 justify-center lg:justify-start">
              <motion.a
                href="#calculator"
                whileHover={{ scale: 1.05, boxShadow: "0 8px 30px rgba(13,59,110,0.3)" }}
                whileTap={{ scale: 0.97 }}
                className="flex items-center gap-2 px-8 py-3.5 bg-navy text-white text-base font-bold rounded-xl shadow-lg transition-all group"
              >
                Check My Eligibility
                <FiArrowRight className="group-hover:translate-x-1 transition-transform" />
              </motion.a>
              <a
                href="#contact"
                className="flex items-center gap-2 px-8 py-3.5 bg-white/25 hover:bg-white/35 text-white text-base font-semibold rounded-xl backdrop-blur-sm border border-white/30 transition-all"
              >
                Talk to Expert
              </a>
            </div>
          </motion.div>

          {/* Right stats box */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="flex-shrink-0 bg-white rounded-3xl shadow-2xl p-8 min-w-[300px] max-w-sm w-full"
          >
            <h3 className="font-heading font-bold text-navy text-lg mb-6 text-center">
              🌞 Subsidy Calculator
            </h3>
            {[
              { size: "1 kW System", subsidy: "₹30,000", savings: "₹1,200/mo" },
              { size: "2 kW System", subsidy: "₹60,000", savings: "₹2,500/mo" },
              { size: "3 kW System", subsidy: "₹78,000", savings: "₹3,800/mo" },
            ].map((row) => (
              <div key={row.size} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                <div>
                  <p className="font-bold text-navy text-sm">{row.size}</p>
                  <p className="text-xs text-gray-400">Avg savings: {row.savings}</p>
                </div>
                <span className="font-extrabold text-accent text-base">{row.subsidy}</span>
              </div>
            ))}
            <motion.button
              whileHover={{ scale: 1.03 }}
              className="w-full mt-6 py-3 orange-gradient text-white font-bold rounded-xl text-sm shadow-md"
            >
              Apply for Subsidy Now →
            </motion.button>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
