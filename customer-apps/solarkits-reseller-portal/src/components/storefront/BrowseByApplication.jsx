import { motion } from "framer-motion";
import { FiSun, FiBatteryCharging, FiZap, FiArrowRight } from "react-icons/fi";

const APPLICATIONS = [
  {
    title: "On-Grid Solar Kits",
    slug: "on-grid",
    categoryValue: "On-Grid Solar Kits",
    tagline: "Grid-Tied Net-Metering & Bill Slasher",
    description: "Export surplus solar generation back to DISCOM via bidirectional net-metering. Ideal for residential rooftop subsidies (PM Surya Ghar) and commercial energy cost reduction.",
    capacities: "1 kW - 20 kW+",
    badge: "PM Surya Ghar & Subsidy Eligible",
    icon: FiSun,
    gradient: "from-blue-600 to-sky-600",
    bgLight: "bg-blue-50/60 border-blue-200",
    popularModels: ["3.3 kW DCR Kit", "5 kW 3-Phase Kit", "10 kW TOPCon Kit"],
  },
  {
    title: "Off-Grid Solar Kits",
    slug: "off-grid",
    categoryValue: "Off-Grid Solar Kits",
    tagline: "100% Self-Sustaining Battery Storage",
    description: "Independent solar power with tubular or lithium battery storage and high-capacity MPPT solar PCUs. Perfect for rural locations, farms, and areas with frequent grid outages.",
    capacities: "1 kW - 10 kW",
    badge: "Zero-Grid Dependency",
    icon: FiBatteryCharging,
    gradient: "from-amber-500 to-orange-600",
    bgLight: "bg-amber-50/60 border-amber-200",
    popularModels: ["3 kW 48V PCU Kit", "5 kW Lithium Ready Kit"],
  },
  {
    title: "Hybrid Solar Kits",
    slug: "hybrid",
    categoryValue: "Hybrid Solar Kits",
    tagline: "Dual Benefit: Net-Metering + UPS Battery Backup",
    description: "Seamless sub-10ms switchover during blackouts plus full DISCOM grid-tie synchronization when online. Future-proof solution for premium homes, clinics, and offices.",
    capacities: "3 kW - 15 kW+",
    badge: "Continuous Power & Cloud Tech",
    icon: FiZap,
    gradient: "from-purple-600 to-indigo-600",
    bgLight: "bg-purple-50/60 border-purple-200",
    popularModels: ["6 kW Smart Hybrid Kit", "10 kW 3-Ph Hybrid Kit"],
  },
];

export default function BrowseByApplication({ onSelectApplication }) {
  return (
    <section id="browse-application" className="py-14 sm:py-20 bg-slate-50 text-slate-900 border-t border-slate-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200 pb-6 sm:pb-8">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-slate-200 shadow-xs">
              <span className="h-1.5 w-1.5 rounded-full bg-[#0575B8]" />
              <span className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-[#0575B8]">
                Application-First Filtering
              </span>
            </div>

            <h2 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight">
              Browse by <span className="text-[#F49222]">Application Type</span>
            </h2>

            <p className="text-xs sm:text-base text-slate-600 font-normal">
              Select your customer project requirements to explore pre-engineered On-Grid, Off-Grid, and Hybrid Solarkits.
            </p>
          </div>
        </div>

        {/* 3 Application Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 sm:gap-6 pt-8 sm:pt-10">
          {APPLICATIONS.map((app, idx) => (
            <motion.div
              key={app.slug}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: idx * 0.1 }}
              className={`rounded-3xl border ${app.bgLight} p-6 sm:p-7 flex flex-col justify-between shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group bg-white`}
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className={`h-12 w-12 rounded-2xl bg-gradient-to-r ${app.gradient} text-white flex items-center justify-center shadow-md`}>
                    <app.icon size={22} />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-white border border-slate-200 text-slate-700 shadow-xs">
                    {app.badge}
                  </span>
                </div>

                <div className="space-y-1.5">
                  <h3 className="text-lg sm:text-xl font-black text-slate-900 group-hover:text-[#0575B8] transition-colors">
                    {app.title}
                  </h3>
                  <p className="text-xs font-bold text-[#F49222]">
                    {app.tagline}
                  </p>
                  <p className="text-xs text-slate-600 leading-relaxed pt-1">
                    {app.description}
                  </p>
                </div>

                {/* Popular Kit Tags */}
                <div className="pt-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                    Popular Configurations:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {app.popularModels.map((m) => (
                      <span key={m} className="px-2 py-0.5 rounded-lg bg-slate-100 text-slate-700 text-[10px] font-bold">
                        {m}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-6 mt-4 border-t border-slate-100">
                <a
                  href="#catalog-browser"
                  onClick={() => onSelectApplication && onSelectApplication(app.categoryValue)}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-[#0575B8] to-[#1965B0] hover:from-[#045D93] hover:to-[#0575B8] text-white font-extrabold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-md shadow-blue-500/20 cursor-pointer"
                >
                  <span>Explore {app.title}</span>
                  <FiArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                </a>
              </div>
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  );
}
