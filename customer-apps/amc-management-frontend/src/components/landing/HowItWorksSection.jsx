// src/components/landing/HowItWorksSection.jsx
import { motion } from 'framer-motion';
import { UserPlus, Layers, CalendarCheck, BarChart3, ArrowRight } from 'lucide-react';

const steps = [
  {
    step: '01',
    icon: UserPlus,
    title: 'Step 1: Register',
    subtitle: 'Create Your Account',
    description: 'Sign up your solar company or plant profile in under 2 minutes. Onboard team members and import your solar site database.',
    badge: 'Quick Setup',
    color: 'bg-navy text-solar',
  },
  {
    step: '02',
    icon: Layers,
    title: 'Step 2: Choose an AMC Plan',
    subtitle: 'Select or Customize',
    description: 'Pick a standard solar AMC template or configure custom washing frequencies, inverter warranties, and SLA terms.',
    badge: 'Tailored Terms',
    color: 'bg-solar text-navy-900',
  },
  {
    step: '03',
    icon: CalendarCheck,
    title: 'Step 3: Schedule Maintenance',
    subtitle: 'Automated Dispatch',
    description: 'Auto-generate routine panel washing cycles and assign certified field technicians via the GPS mobile app.',
    badge: 'GPS Field Sync',
    color: 'bg-info text-white',
  },
  {
    step: '04',
    icon: BarChart3,
    title: 'Step 4: Track Services & Reports',
    subtitle: 'Live Solar Insights',
    description: 'Monitor real-time job completion proofs, customer ticket resolutions, PR yield analytics, and PDF report downloads.',
    badge: 'Full Control',
    color: 'bg-success text-white',
  },
];

export default function HowItWorksSection() {
  return (
    <section id="how-it-works" className="py-20 lg:py-28 bg-white relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <div className="inline-flex items-center gap-2 bg-navy-50 border border-navy-200 rounded-full px-3.5 py-1">
            <span className="text-xs font-bold text-navy tracking-wide uppercase">
              Simple 4-Step Process
            </span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-navy tracking-tight">
            How Emergesun Solar AMC ERP Works
          </h2>
          <p className="text-sm sm:text-base text-text-secondary leading-relaxed">
            Get your solar operations up and running effortlessly with our streamlined digital workflow.
          </p>
        </div>

        {/* 4 Steps Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 relative">
          {steps.map((s, index) => {
            const Icon = s.icon;
            return (
              <motion.div
                key={s.step}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: index * 0.15 }}
                className="bg-bg rounded-2xl p-6 border border-border/80 relative flex flex-col justify-between hover:shadow-card-lg transition-all duration-300 group"
              >
                <div>
                  {/* Step Number & Icon */}
                  <div className="flex items-center justify-between mb-6">
                    <span className="text-3xl font-black text-navy/20 group-hover:text-solar font-mono transition-colors">
                      {s.step}
                    </span>
                    <div className={`w-12 h-12 rounded-xl ${s.color} flex items-center justify-center shadow-md transform group-hover:scale-110 transition-transform duration-300`}>
                      <Icon className="w-6 h-6" />
                    </div>
                  </div>

                  <span className="text-xxs font-bold text-navy-800 bg-white border border-navy-100 px-2.5 py-0.5 rounded-full">
                    {s.badge}
                  </span>

                  <h3 className="text-lg font-bold text-navy mt-3 mb-1">
                    {s.title}
                  </h3>
                  <p className="text-xxs font-bold text-solar-900 uppercase tracking-wider mb-3">
                    {s.subtitle}
                  </p>

                  <p className="text-xs text-text-secondary leading-relaxed mb-4">
                    {s.description}
                  </p>
                </div>

                <div className="pt-3 border-t border-border/60 flex items-center text-xxs font-bold text-navy group-hover:text-solar-900 gap-1">
                  <span>Explore Workflow</span>
                  <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
