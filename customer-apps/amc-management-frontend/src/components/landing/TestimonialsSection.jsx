// src/components/landing/TestimonialsSection.jsx
import { motion } from 'framer-motion';
import { Star, Quote, Sun, CheckCircle2 } from 'lucide-react';

const testimonials = [
  {
    name: 'Vikramaditya Sharma',
    role: 'Head of Operations & Maintenance',
    company: 'Apex Solar Energy Solutions',
    capacity: '85 MW Portfolio',
    image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
    content: 'Switching to Emergesun AMC Cloud transformed our O&M division. We automated washing dispatches for over 400 commercial solar rooftops. Our client renewals surged by 38% in the first year alone.',
    rating: 5,
    metrics: '38% Renewal Increase',
  },
  {
    name: 'Rajesh Nair',
    role: 'Director of Solar EPC',
    company: 'SunPower Infra Systems',
    capacity: '120 MW Portfolio',
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80',
    content: 'The mobile GPS check-in feature for field technicians is game-changing. Having before-and-after washing photos attached directly to digital service certificates gives our customers absolute trust.',
    rating: 5,
    metrics: '100% Audit Compliance',
  },
  {
    name: 'Priya Mehta',
    role: 'AMC Operations Lead',
    company: 'GreenWatt Renewable Tech',
    capacity: '45 MW Portfolio',
    image: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=150&q=80',
    content: 'Before Emergesun, inverter breakdown ticketing was managed over WhatsApp. Now every breakdown automatically escalates with SLA timers. Our average repair resolution time dropped under 3 hours.',
    rating: 5,
    metrics: '<3 hrs Breakdown SLA',
  },
];

export default function TestimonialsSection() {
  return (
    <section id="testimonials" className="py-20 lg:py-28 bg-bg relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <div className="inline-flex items-center gap-2 bg-solar/15 border border-solar/40 rounded-full px-3.5 py-1">
            <span className="text-xs font-bold text-navy tracking-wide uppercase">
              Proven Industry Trust
            </span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-navy tracking-tight">
            Trusted by Leading Solar EPCs & Service Providers
          </h2>
          <p className="text-sm sm:text-base text-text-secondary leading-relaxed">
            See how solar plant operations managers across India streamline their AMC operations and increase portfolio generation.
          </p>
        </div>

        {/* Testimonials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((t, index) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: index * 0.15 }}
              className="bg-white rounded-3xl p-8 border border-border shadow-card hover:shadow-card-lg transition-all duration-300 flex flex-col justify-between relative group"
            >
              <Quote className="w-10 h-10 text-solar/30 absolute top-6 right-6 pointer-events-none group-hover:text-solar/50 transition-colors" />

              <div>
                {/* Rating Stars */}
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(t.rating)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-solar text-solar" />
                  ))}
                </div>

                {/* Content Quote */}
                <p className="text-xs sm:text-sm text-navy/90 font-medium leading-relaxed mb-6 italic">
                  "{t.content}"
                </p>
              </div>

              <div>
                {/* Highlight metric badge */}
                <div className="mb-4 inline-flex items-center gap-1.5 bg-navy-50 text-navy border border-navy-100 text-xxs font-bold px-3 py-1 rounded-full">
                  <CheckCircle2 className="w-3 h-3 text-success" />
                  <span>{t.metrics}</span>
                </div>

                {/* Author Info */}
                <div className="flex items-center gap-3 pt-4 border-t border-border/60">
                  <div className="w-10 h-10 rounded-full bg-navy flex items-center justify-center font-bold text-solar text-sm shrink-0 border border-solar/40">
                    {t.name.charAt(0)}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-navy">{t.name}</h4>
                    <p className="text-xxs text-text-secondary">{t.role}</p>
                    <p className="text-xxs font-semibold text-solar-900">{t.company} • {t.capacity}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
