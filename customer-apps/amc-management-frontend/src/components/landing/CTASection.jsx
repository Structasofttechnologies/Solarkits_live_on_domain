// src/components/landing/CTASection.jsx
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sun, ArrowRight, ShieldCheck, CheckCircle2, PhoneCall } from 'lucide-react';

export default function CTASection() {
  const handleScrollToPlans = (e) => {
    e.preventDefault();
    const element = document.querySelector('#plans');
    if (element) {
      const offsetTop = element.getBoundingClientRect().top + window.pageYOffset - 80;
      window.scrollTo({ top: offsetTop, behavior: 'smooth' });
    }
  };

  return (
    <section className="py-20 lg:py-28 bg-gradient-to-b from-white to-bg relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="bg-navy rounded-3xl p-8 sm:p-12 lg:p-16 text-white shadow-2xl relative overflow-hidden border border-navy-700"
        >
          {/* Ambient Lighting Background */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-solar/15 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-navy-500/30 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-8 space-y-6">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 bg-solar/15 border border-solar/30 rounded-full px-3.5 py-1">
                <Sun className="w-4 h-4 text-solar animate-pulse-soft" />
                <span className="text-xs font-bold text-solar tracking-wide uppercase">
                  Start Elevating Your Solar AMC Revenue
                </span>
              </div>

              {/* Headline */}
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-tight">
                Transform Every Solar Installation into Long-Term Recurring Business
              </h2>

              <p className="text-sm sm:text-base text-navy-300 max-w-2xl leading-relaxed">
                Join 1,200+ solar EPC companies and O&M contractors across India leveraging Emergesun AMC Cloud for automated panel washing dispatches, fault ticketing, and 99.8% SLA compliance.
              </p>

              {/* Key Bullet Checklist */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs text-navy-200 font-medium">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-solar" />
                  <span>Free 14-Day Trial</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-solar" />
                  <span>Instant Setup (under 5 mins)</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-solar" />
                  <span>Dedicated Solar Specialist</span>
                </div>
              </div>

              {/* CTA Action Buttons */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-4">
                <a
                  href="#plans"
                  onClick={handleScrollToPlans}
                  className="inline-flex items-center justify-center gap-2 bg-solar hover:bg-solar-600 text-navy-900 font-extrabold px-8 py-4 rounded-xl shadow-lg hover:shadow-solar/30 transition-all transform hover:-translate-y-0.5 text-sm"
                >
                  <span>Get Started Now</span>
                  <ArrowRight className="w-4 h-4" />
                </a>

                <Link
                  to="/login"
                  className="inline-flex items-center justify-center gap-2 bg-navy-800 hover:bg-navy-700 text-white font-bold px-8 py-4 rounded-xl border border-navy-600 transition-all text-sm"
                >
                  <ShieldCheck className="w-4 h-4 text-solar" />
                  <span>Log in to ERP</span>
                </Link>
              </div>
            </div>

            {/* Quick Contact & Sales Callout Box */}
            <div className="lg:col-span-4 bg-navy-dark/80 rounded-2xl p-6 border border-navy-700 space-y-4 shadow-inner">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-solar/20 text-solar flex items-center justify-center">
                  <PhoneCall className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Speak with Solar Experts</h4>
                  <p className="text-xxs text-navy-300">Custom Enterprise Solutions</p>
                </div>
              </div>

              <div className="space-y-2 text-xs text-navy-200 pt-2 border-t border-navy-700">
                <p><strong className="text-white">Call Sales:</strong> +91 (800) 456-7890</p>
                <p><strong className="text-white">Email:</strong> amc-sales@emergesun.com</p>
                <p><strong className="text-white">Location:</strong> Ahmedabad • Mumbai • Delhi</p>
              </div>

              <div className="pt-2 text-xxs font-mono text-solar bg-solar/10 p-2.5 rounded-lg border border-solar/20 text-center">
                Solar Enterprise Onboarding Available
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
