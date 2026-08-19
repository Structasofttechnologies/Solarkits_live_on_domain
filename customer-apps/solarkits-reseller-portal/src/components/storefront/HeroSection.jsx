import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  FiZap,
  FiShoppingBag,
  FiArrowRight,
  FiCheckCircle,
  FiTruck,
  FiAward,
  FiPercent,
  FiMapPin,
} from "react-icons/fi";

export default function HeroSection() {
  return (
    <section className="relative pt-24 sm:pt-32 pb-14 sm:pb-20 overflow-hidden bg-gradient-to-b from-white via-sky-50/40 to-slate-50 text-slate-900 flex items-center">
      {/* Background Soft Glow & Grid Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#0575b808_1px,transparent_1px),linear-gradient(to_bottom,#0575b808_1px,transparent_1px)] bg-[size:2rem_2rem] sm:bg-[size:3.5rem_3.5rem] pointer-events-none" />
      <div className="absolute top-1/4 left-5 sm:left-10 w-72 sm:w-[500px] h-72 sm:h-[350px] bg-amber-400/15 blur-[90px] sm:blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-10 right-5 sm:right-10 w-72 sm:w-[450px] h-72 sm:h-[350px] bg-blue-500/10 blur-[100px] sm:blur-[130px] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-8 items-center">
          
          {/* Left Column: Value Proposition & Hero CTAs */}
          <div className="lg:col-span-7 space-y-4 sm:space-y-6 text-center sm:text-left">
            {/* Pill Badge */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-1.5 sm:gap-2 px-3 py-1 sm:px-3.5 sm:py-1.5 rounded-full bg-amber-50 border border-amber-200/80 shadow-xs"
            >
              <span className="flex h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full bg-[#F49222] animate-pulse" />
              <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-[#D97E15]">
                Official SolarKits Franchise Program 2026
              </span>
            </motion.div>

            {/* Main Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-2xl sm:text-4xl md:text-5xl xl:text-6xl font-black tracking-tight text-slate-900 leading-[1.18] sm:leading-[1.14]"
            >
              Scale Your Solar Business as an{" "}
              <span className="text-[#F49222]">
                Authorized Franchisee Partner
              </span>
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-xs sm:text-base text-slate-600 font-normal leading-relaxed max-w-2xl mx-auto sm:mx-0"
            >
              Unlock factory-direct wholesale pricing on Tier-1 Solar Kits, Inverters, and BOS Packages. Guaranteed territory rights, instant GST verification, digital wallet settlements, and direct local EPC buyer lead allocation.
            </motion.p>

            {/* Badges Bar */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.25 }}
              className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 pt-1"
            >
              <div className="flex items-center gap-1.5 sm:gap-2 p-2 sm:p-2.5 rounded-xl bg-white border border-slate-200 text-[11px] sm:text-xs font-bold text-slate-800 shadow-xs">
                <FiPercent className="text-[#F49222] text-sm sm:text-base shrink-0" />
                <span>Up to 15% Margin</span>
              </div>
              <div className="flex items-center gap-1.5 sm:gap-2 p-2 sm:p-2.5 rounded-xl bg-white border border-slate-200 text-[11px] sm:text-xs font-bold text-slate-800 shadow-xs">
                <FiMapPin className="text-[#0575B8] text-sm sm:text-base shrink-0" />
                <span>Territory Rights</span>
              </div>
              <div className="flex items-center gap-1.5 sm:gap-2 p-2 sm:p-2.5 rounded-xl bg-white border border-slate-200 text-[11px] sm:text-xs font-bold text-slate-800 shadow-xs">
                <FiTruck className="text-emerald-600 text-sm sm:text-base shrink-0" />
                <span>48-Hr Dispatch</span>
              </div>
              <div className="flex items-center gap-1.5 sm:gap-2 p-2 sm:p-2.5 rounded-xl bg-white border border-slate-200 text-[11px] sm:text-xs font-bold text-slate-800 shadow-xs">
                <FiAward className="text-purple-600 text-sm sm:text-base shrink-0" />
                <span>MNRE Approved</span>
              </div>
            </motion.div>

            {/* Call to Actions */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 pt-2"
            >
              <a
                href="#plans"
                className="w-full sm:w-auto px-6 py-3.5 sm:px-7 sm:py-4 rounded-2xl text-xs sm:text-base font-extrabold text-white bg-gradient-to-r from-[#0575B8] to-[#1965B0] hover:from-[#045D93] hover:to-[#0575B8] transition-all transform hover:-translate-y-0.5 shadow-md shadow-blue-500/25 flex items-center justify-center gap-2 text-center cursor-pointer"
              >
                <FiZap size={16} className="shrink-0" />
                <span>Explore Franchise Plans</span>
                <FiArrowRight size={16} className="shrink-0" />
              </a>

              <a
                href="#products"
                className="w-full sm:w-auto px-5 py-3.5 sm:px-6 sm:py-4 rounded-2xl text-xs sm:text-base font-bold text-slate-700 hover:text-[#0575B8] bg-white hover:bg-slate-50 border border-slate-200 transition-all flex items-center justify-center gap-2 shadow-xs text-center cursor-pointer"
              >
                <FiShoppingBag className="text-[#0575B8] shrink-0" size={16} />
                <span>Browse Wholesale Catalog</span>
              </a>
            </motion.div>

            {/* Fast onboarding guarantee */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="flex items-center justify-center sm:justify-start gap-1.5 sm:gap-2 text-[10px] sm:text-xs font-semibold text-slate-500 pt-1"
            >
              <FiCheckCircle className="text-emerald-600 shrink-0" />
              <span>Zero setup friction • 2-Minute GSTIN verification • Pan-India</span>
            </motion.div>
          </div>

          {/* Right Column: Hero Visual Card with Solar Installation Image & Metrics */}
          <div className="lg:col-span-5 w-full">
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="relative rounded-3xl p-1.5 sm:p-2 bg-gradient-to-b from-blue-100 via-white to-amber-100 shadow-lg border border-slate-200"
            >
              <div className="rounded-[20px] sm:rounded-[22px] bg-white p-4 sm:p-6 space-y-4 sm:space-y-6 border border-slate-100">
                
                {/* Header of hero badge */}
                <div className="flex items-center justify-between border-b border-slate-100 pb-3 sm:pb-4">
                  <div className="flex items-center gap-2.5 sm:gap-3">
                    <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-[#F49222] font-black shadow-xs shrink-0">
                      <FiZap size={18} />
                    </div>
                    <div>
                      <h3 className="text-sm sm:text-base font-black text-slate-900">SolarKits Franchise Core</h3>
                      <p className="text-[10px] sm:text-xs text-slate-500 font-medium">Verified Partner Operating Model</p>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] sm:text-[11px] font-extrabold flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping" />
                    LIVE
                  </span>
                </div>

                {/* 2x2 Metric Highlights */}
                <div className="grid grid-cols-2 gap-2.5 sm:gap-3.5">
                  <div className="p-2.5 sm:p-3.5 rounded-2xl bg-slate-50 border border-slate-200/70">
                    <p className="text-[10px] sm:text-xs text-slate-500 font-medium">Dispatched Volume</p>
                    <p className="text-xl sm:text-2xl font-black text-[#F49222] mt-0.5 sm:mt-1">₹50+ Cr</p>
                    <p className="text-[9px] sm:text-[10px] text-emerald-600 font-semibold mt-0.5">Tier-1 Equipment</p>
                  </div>

                  <div className="p-2.5 sm:p-3.5 rounded-2xl bg-slate-50 border border-slate-200/70">
                    <p className="text-[10px] sm:text-xs text-slate-500 font-medium">Franchisees & Dealers</p>
                    <p className="text-xl sm:text-2xl font-black text-[#0575B8] mt-0.5 sm:mt-1">1,200+</p>
                    <p className="text-[9px] sm:text-[10px] text-slate-500 font-semibold mt-0.5">Across 28 States</p>
                  </div>

                  <div className="p-2.5 sm:p-3.5 rounded-2xl bg-slate-50 border border-slate-200/70">
                    <p className="text-[10px] sm:text-xs text-slate-500 font-medium">Average Partner ROI</p>
                    <p className="text-xl sm:text-2xl font-black text-emerald-600 mt-0.5 sm:mt-1">3.2x</p>
                    <p className="text-[9px] sm:text-[10px] text-slate-500 font-semibold mt-0.5">Capital Turnover</p>
                  </div>

                  <div className="p-2.5 sm:p-3.5 rounded-2xl bg-slate-50 border border-slate-200/70">
                    <p className="text-[10px] sm:text-xs text-slate-500 font-medium">Instant Settlements</p>
                    <p className="text-xl sm:text-2xl font-black text-purple-600 mt-0.5 sm:mt-1">T+0</p>
                    <p className="text-[9px] sm:text-[10px] text-slate-500 font-semibold mt-0.5">Wallet Auto-credit</p>
                  </div>
                </div>

                {/* Partner Commercial Modes Overview */}
                <div className="p-3.5 sm:p-4 rounded-2xl bg-sky-50/60 border border-sky-100 space-y-2 sm:space-y-2.5">
                  <div className="flex items-center justify-between text-[11px] sm:text-xs font-bold">
                    <span className="text-slate-700">Commission (Zero Stock)</span>
                    <span className="text-[#F49222]">8% - 12% Deal</span>
                  </div>
                  <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-[#F49222] h-full w-[70%] rounded-full" />
                  </div>
                  <div className="flex items-center justify-between text-[11px] sm:text-xs font-bold pt-1">
                    <span className="text-slate-700">Dealer Wholesale (Stock)</span>
                    <span className="text-emerald-600">15% - 22% Margin</span>
                  </div>
                  <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-emerald-600 h-full w-[90%] rounded-full" />
                  </div>
                </div>

                {/* Direct Register Action Card */}
                <Link
                  to="/register"
                  className="block w-full py-3 text-center text-xs font-black uppercase tracking-wider text-white bg-gradient-to-r from-[#0575B8] to-[#1965B0] hover:from-[#045D93] hover:to-[#0575B8] rounded-xl transition-all shadow-md shadow-blue-500/20"
                >
                  Start Franchise Application →
                </Link>
              </div>
            </motion.div>
          </div>

        </div>
      </div>
    </section>
  );
}
