// src/components/landing/WhyChooseSection.jsx
import { motion } from 'framer-motion';
import {
  CalendarClock,
  ShieldAlert,
  Smartphone,
  TrendingUp,
  FileCheck,
  Zap,
} from 'lucide-react';

const reasons = [
  {
    icon: CalendarClock,
    title: 'Automated Service Scheduling',
    description: 'Eliminate manual excel spreadsheets. Auto-generate cleaning cycles, preventive maintenance visits, and inverter health audits for all solar plants.',
    highlight: 'Zero Missed Maintenance',
    color: 'from-solar-500/20 to-solar-100/50',
    iconBg: 'bg-solar text-navy-900',
  },
  {
    icon: ShieldAlert,
    title: 'Proactive Fault & Breakdown Tracking',
    description: 'Log and track customer complaints, inverter tripping alarms, and wiring issues. Set automatic SLA escalations to resolve outages under 4 hours.',
    highlight: 'Instant Ticket SLA Escalation',
    color: 'from-navy-500/10 to-navy-100/40',
    iconBg: 'bg-navy text-white',
  },
  {
    icon: Smartphone,
    title: 'Technician Mobile GPS Check-In',
    description: 'Empower field engineers with digital checklists, photo proof before/after panel washing, customer signatures, and real-time geotagged location tracking.',
    highlight: 'Digital Job Proof',
    color: 'from-info-500/10 to-info-100/40',
    iconBg: 'bg-info text-white',
  },
  {
    icon: TrendingUp,
    title: 'Automated AMC Contract Renewals',
    description: 'Never lose recurring revenue. Automatic SMS, Email, and WhatsApp reminders trigger 30 days before plan expiration with instant payment link generation.',
    highlight: '+35% Renewal Revenue',
    color: 'from-success-500/10 to-success-100/40',
    iconBg: 'bg-success text-white',
  },
  {
    icon: FileCheck,
    title: 'Branded Customer Reports',
    description: 'Generate 1-click PDF service completion reports and solar generation performance summaries with your EPC company branding for clients.',
    highlight: '1-Click PDF Export',
    color: 'from-warning-500/10 to-warning-100/40',
    iconBg: 'bg-warning text-white',
  },
  {
    icon: Zap,
    title: 'Solar Generation Performance Audit',
    description: 'Track Performance Ratio (PR) improvements, specific yield (kWh/kWp), and degradation rates across rooftop and utility-scale installations.',
    highlight: 'Max Yield Guarantee',
    color: 'from-solar-600/15 to-navy-100/30',
    iconBg: 'bg-navy-900 text-solar',
  },
];

export default function WhyChooseSection() {
  return (
    <section id="why-us" className="py-20 lg:py-28 bg-white relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <div className="inline-flex items-center gap-2 bg-solar/15 border border-solar/40 rounded-full px-3.5 py-1">
            <span className="text-xs font-bold text-navy tracking-wide uppercase">
              Why Solar Companies Choose Us
            </span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-navy tracking-tight">
            Built Exclusively for Solar EPCs & O&M Service Providers
          </h2>
          <p className="text-sm sm:text-base text-text-secondary leading-relaxed">
            Generic CRM or ticketing systems fail to handle solar-specific needs like cleaning cycles, string inverter checks, and PR tracking. Emergesun AMC Cloud is custom-crafted for solar lifecycle perfection.
          </p>
        </div>

        {/* Benefits Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {reasons.map((item, index) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="group relative bg-white rounded-2xl p-6 border border-border/80 shadow-card hover:shadow-card-lg hover:border-solar/60 transition-all duration-300 flex flex-col justify-between"
              >
                <div>
                  {/* Top Icon & Tag */}
                  <div className="flex items-center justify-between mb-5">
                    <div className={`w-12 h-12 rounded-xl ${item.iconBg} flex items-center justify-center shadow-md transform group-hover:scale-110 transition-transform duration-300`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className="text-xxs font-bold text-navy-800 bg-navy-50 border border-navy-200/60 px-2.5 py-1 rounded-full">
                      {item.highlight}
                    </span>
                  </div>

                  {/* Title & Description */}
                  <h3 className="text-lg font-bold text-navy group-hover:text-navy-700 transition-colors mb-2">
                    {item.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-text-secondary leading-relaxed mb-4">
                    {item.description}
                  </p>
                </div>

                {/* Bottom accent line */}
                <div className="w-full h-1 bg-gradient-to-r from-solar/20 via-navy/30 to-transparent rounded-full group-hover:from-solar group-hover:to-navy transition-all duration-500" />
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
