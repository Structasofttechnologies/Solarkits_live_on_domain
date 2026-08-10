// src/components/landing/SolarBenefitsSection.jsx
import { motion } from 'framer-motion';
import {
  Sun,
  ShieldCheck,
  Zap,
  Clock,
  PiggyBank,
  Gauge,
  TrendingUp,
} from 'lucide-react';

const solarBenefits = [
  {
    icon: Sun,
    title: 'Increase Solar Panel Efficiency',
    metric: '+18% - 25% PR Boost',
    description: 'Regular scheduled panel washing removes dust, soiling, and bird droppings to restore peak irradiance absorption.',
    color: 'text-solar bg-solar/15 border-solar/30',
  },
  {
    icon: ShieldCheck,
    title: 'Preventive Maintenance Audits',
    metric: '99.5% Fault Prevention',
    description: 'Identify thermal hotspots, micro-cracks, cable degradation, and loose connections before they cause catastrophic inverter failure.',
    color: 'text-navy-600 bg-navy-50 border-navy-200',
  },
  {
    icon: Zap,
    title: 'Faster Issue Resolution',
    metric: '< 4 Hours SLA',
    description: 'Instant ticket logging and automated GPS technician dispatching ensure breakdown outages are resolved with minimal generation loss.',
    color: 'text-info bg-info-50 border-info-200',
  },
  {
    icon: Clock,
    title: 'Extended Equipment Life',
    metric: '25+ Years Lifecycle',
    description: 'Proactive inverter servicing, string voltage monitoring, and junction box checkups preserve solar plant asset value over decades.',
    color: 'text-success bg-success-50 border-success-200',
  },
  {
    icon: PiggyBank,
    title: 'Direct O&M Cost Savings',
    metric: '30% Cost Reduction',
    description: 'Optimize technician travel routes, prevent major component burnouts, and standardize spare parts inventory management.',
    color: 'text-warning bg-warning-50 border-warning-200',
  },
  {
    icon: Gauge,
    title: 'Better System Performance & Yield',
    metric: 'Maximum Annual kWh',
    description: 'Real-time generation analytics track actual yield against expected PVsyst metrics to ensure peak financial ROI for plant owners.',
    color: 'text-solar-900 bg-solar-100 border-solar-300',
  },
];

export default function SolarBenefitsSection() {
  return (
    <section id="solar-benefits" className="py-20 lg:py-28 bg-white relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <div className="inline-flex items-center gap-2 bg-solar/20 border border-solar/40 rounded-full px-3.5 py-1">
            <span className="text-xs font-bold text-navy-900 tracking-wide uppercase">
              Solar Yield Impact
            </span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-navy tracking-tight">
            Key Financial & Technical Benefits of Structured Solar AMC
          </h2>
          <p className="text-sm sm:text-base text-text-secondary leading-relaxed">
            Unmanaged solar installations lose up to 25% of their power generation capacity due to dust accumulation and undetected string inverter faults. Here is how structured AMC protects your investment.
          </p>
        </div>

        {/* Benefits Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {solarBenefits.map((b, index) => {
            const Icon = b.icon;
            return (
              <motion.div
                key={b.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                className="bg-bg rounded-2xl p-6 border border-border hover:border-solar/80 shadow-sm hover:shadow-card-lg transition-all duration-300 flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between mb-5">
                    <div className={`w-12 h-12 rounded-xl border flex items-center justify-center shadow-sm ${b.color}`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className="text-xs font-bold text-navy bg-white border border-navy-100 px-3 py-1 rounded-full shadow-xs">
                      {b.metric}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-navy group-hover:text-navy-700 transition-colors mb-2">
                    {b.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-text-secondary leading-relaxed mb-4">
                    {b.description}
                  </p>
                </div>

                <div className="pt-3 border-t border-border/60 flex items-center gap-2 text-xxs font-semibold text-text-muted">
                  <TrendingUp className="w-3.5 h-3.5 text-solar-900" />
                  <span>Verified Solar Yield Benchmark</span>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* ROI Banner Box */}
        <div className="mt-14 bg-gradient-to-r from-navy via-navy-800 to-navy-900 rounded-3xl p-8 text-white shadow-xl flex flex-col lg:flex-row items-center justify-between gap-6 border border-navy-700">
          <div className="space-y-2 text-center lg:text-left">
            <h3 className="text-xl sm:text-2xl font-bold text-white">
              Ready to boost your Solar Portfolio Generation by 20%+?
            </h3>
            <p className="text-xs sm:text-sm text-navy-300 max-w-2xl">
              Start managing your solar plant AMCs with automated schedules, field technician checklists, and client portals today.
            </p>
          </div>
          <a
            href="#plans"
            className="inline-flex items-center gap-2 bg-solar hover:bg-solar-600 text-navy-900 font-bold px-6 py-3 rounded-xl shadow-lg transition-all shrink-0 text-xs sm:text-sm"
          >
            <span>View AMC Pricing Plans</span>
          </a>
        </div>
      </div>
    </section>
  );
}
