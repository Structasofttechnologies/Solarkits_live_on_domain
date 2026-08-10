// src/components/landing/HeroSection.jsx
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Sun,
  ShieldCheck,
  Zap,
  ArrowRight,
  TrendingUp,
  Activity,
  CheckCircle2,
  Calendar,
  Wrench,
  BarChart3,
  Users,
} from 'lucide-react';

export default function HeroSection() {
  const handleScrollToPlans = (e) => {
    e.preventDefault();
    const element = document.querySelector('#plans');
    if (element) {
      const offsetTop = element.getBoundingClientRect().top + window.pageYOffset - 80;
      window.scrollTo({ top: offsetTop, behavior: 'smooth' });
    }
  };

  return (
    <section className="relative pt-32 pb-20 lg:pt-36 lg:pb-32 overflow-hidden bg-gradient-to-b from-navy-50/50 via-white to-bg">
      {/* Background ambient lighting */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-gradient-to-tr from-solar-100/40 via-navy-100/30 to-transparent blur-3xl rounded-full pointer-events-none -z-10" />
      <div className="absolute top-40 right-10 w-72 h-72 bg-solar-300/20 blur-3xl rounded-full pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Column: Headlines & CTAs */}
          <motion.div
            className="lg:col-span-6 space-y-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            {/* Pill Tag */}
            <div className="inline-flex items-center gap-2 bg-navy-50 border border-navy-200/80 rounded-full px-3.5 py-1.5 shadow-sm">
              <span className="flex h-2 w-2 rounded-full bg-solar animate-pulse" />
              <span className="text-xs font-semibold text-navy">
                Next-Gen Solar AMC Management Platform
              </span>
            </div>

            {/* Headline */}
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-navy tracking-tight leading-[1.15]">
              Maximize Solar Plant Yield & Automate End-to-End{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-solar-700 via-solar-900 to-navy-600">
                AMC Operations
              </span>
            </h1>

            {/* Subheading */}
            <p className="text-sm sm:text-base text-text-secondary font-normal leading-relaxed max-w-xl">
              India’s complete solar lifecycle platform built for EPCs and O&M teams. Manage contracts, automated panel cleaning, technician dispatching, breakdown complaints, and real-time generation reporting in one unified dashboard.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
              <a
                href="#plans"
                onClick={handleScrollToPlans}
                className="inline-flex items-center justify-center gap-2 bg-solar hover:bg-solar-600 text-navy-900 font-bold px-6 py-3.5 rounded-xl shadow-lg hover:shadow-solar/30 transition-all transform hover:-translate-y-0.5 text-sm"
              >
                <span>Get Started Free</span>
                <ArrowRight className="w-4 h-4" />
              </a>

              <Link
                to="/login"
                className="inline-flex items-center justify-center gap-2 bg-white hover:bg-navy-50 text-navy font-semibold px-6 py-3.5 rounded-xl border border-navy-200 shadow-sm transition-all text-sm"
              >
                <ShieldCheck className="w-4 h-4 text-navy-600" />
                <span>Log in to ERP Portal</span>
              </Link>
            </div>

            {/* Key feature checkmarks */}
            <div className="pt-4 grid grid-cols-2 sm:grid-cols-3 gap-3 border-t border-border/80 text-xs text-text-secondary font-medium">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-success" />
                <span>Automated Schedules</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-success" />
                <span>GPS Field App</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-success" />
                <span>Instant Invoicing</span>
              </div>
            </div>

            {/* Trust Metrics */}
            <div className="pt-4 flex items-center gap-8">
              <div>
                <p className="text-2xl font-black text-navy">50,000+</p>
                <p className="text-xxs font-medium text-text-secondary uppercase tracking-wider">Solar Plants Managed</p>
              </div>
              <div className="h-8 w-px bg-border" />
              <div>
                <p className="text-2xl font-black text-navy">99.8%</p>
                <p className="text-xxs font-medium text-text-secondary uppercase tracking-wider">Service SLA Compliance</p>
              </div>
              <div className="h-8 w-px bg-border hidden sm:block" />
              <div className="hidden sm:block">
                <p className="text-2xl font-black text-solar-900">₹120Cr+</p>
                <p className="text-xxs font-medium text-text-secondary uppercase tracking-wider">AMC Revenue Tracked</p>
              </div>
            </div>
          </motion.div>

          {/* Right Column: Simulated Modern ERP Dashboard Preview */}
          <motion.div
            className="lg:col-span-6 relative"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.2 }}
          >
            {/* Ambient Backlight Glow */}
            <div className="absolute inset-0 bg-gradient-to-r from-solar/20 to-navy-500/20 rounded-3xl blur-2xl transform rotate-1 scale-105 -z-10" />

            {/* Main Mockup Card */}
            <div className="bg-white rounded-2xl border border-navy-100 shadow-card-lg overflow-hidden">
              {/* Mock App Header */}
              <div className="bg-navy px-4 py-3 flex items-center justify-between border-b border-navy-700">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-danger/80" />
                  <div className="w-3 h-3 rounded-full bg-warning/80" />
                  <div className="w-3 h-3 rounded-full bg-success/80" />
                  <span className="ml-2 text-xs font-semibold text-white/90">
                    Emergesun AMC Dashboard
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xxs bg-solar/20 text-solar px-2 py-0.5 rounded font-mono">
                    LIVE OPERATIONAL FEED
                  </span>
                </div>
              </div>

              {/* Mock Dashboard Body */}
              <div className="p-5 space-y-4 bg-bg/50">
                {/* Top Stat Pills */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-white p-3 rounded-xl border border-border/70 shadow-sm">
                    <div className="flex items-center justify-between text-text-secondary text-xxs font-semibold">
                      <span>Total Sites</span>
                      <Sun className="w-3.5 h-3.5 text-solar" />
                    </div>
                    <p className="text-lg font-bold text-navy mt-1">1,482</p>
                    <span className="text-xxs text-success font-medium flex items-center gap-0.5">
                      <TrendingUp className="w-2.5 h-2.5" /> +14% this month
                    </span>
                  </div>

                  <div className="bg-white p-3 rounded-xl border border-border/70 shadow-sm">
                    <div className="flex items-center justify-between text-text-secondary text-xxs font-semibold">
                      <span>Active AMCs</span>
                      <Activity className="w-3.5 h-3.5 text-info" />
                    </div>
                    <p className="text-lg font-bold text-navy mt-1">1,240</p>
                    <span className="text-xxs text-info font-medium">96.4% Active</span>
                  </div>

                  <div className="bg-white p-3 rounded-xl border border-border/70 shadow-sm">
                    <div className="flex items-center justify-between text-text-secondary text-xxs font-semibold">
                      <span>Service SLA</span>
                      <Zap className="w-3.5 h-3.5 text-success" />
                    </div>
                    <p className="text-lg font-bold text-navy mt-1">99.8%</p>
                    <span className="text-xxs text-success font-medium">Avg &lt;2.4 hrs</span>
                  </div>
                </div>

                {/* Simulated Schedule & Alert Table */}
                <div className="bg-white rounded-xl border border-border/70 p-3.5 shadow-sm space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-border/50">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-navy" />
                      <span className="text-xs font-bold text-navy">Today's Solar AMC Visits</span>
                    </div>
                    <span className="text-xxs bg-navy-50 text-navy font-semibold px-2 py-0.5 rounded">
                      12 Visits Scheduled
                    </span>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-2 rounded-lg bg-bg/80 hover:bg-navy-50/50 transition-colors text-xs">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-solar/15 text-solar-900 font-bold flex items-center justify-center text-xxs">
                          MW
                        </div>
                        <div>
                          <p className="font-bold text-navy text-xs">Apex Infra 2.5 MW Solar Plant</p>
                          <p className="text-xxs text-text-secondary">Routine Inverter & Panel Cleaning</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-xxs font-bold text-success bg-success-50 px-2 py-0.5 rounded-full border border-success-200">
                          In Progress
                        </span>
                        <p className="text-xxs text-text-muted mt-0.5">Tech: Rajesh K.</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-2 rounded-lg bg-bg/80 hover:bg-navy-50/50 transition-colors text-xs">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-navy-50 text-navy font-bold flex items-center justify-center text-xxs">
                          KW
                        </div>
                        <div>
                          <p className="font-bold text-navy text-xs">GreenField Commercial Rooftop</p>
                          <p className="text-xxs text-text-secondary">Quarterly Preventive Maintenance</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-xxs font-bold text-info bg-info-50 px-2 py-0.5 rounded-full border border-info-200">
                          Scheduled 2:30 PM
                        </span>
                        <p className="text-xxs text-text-muted mt-0.5">Tech: Suresh P.</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bottom Quick Feature Strip */}
                <div className="flex items-center justify-between pt-1 px-1">
                  <div className="flex items-center gap-2 text-xxs text-text-secondary">
                    <Wrench className="w-3.5 h-3.5 text-navy" />
                    <span>Real-time Field GPS Dispatch</span>
                  </div>
                  <div className="flex items-center gap-2 text-xxs text-text-secondary">
                    <BarChart3 className="w-3.5 h-3.5 text-solar-900" />
                    <span>Automated Yield Audit Reports</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Floating Badge 1: Instant Technician Alert */}
            <motion.div
              className="absolute -bottom-5 -left-5 bg-white p-3 rounded-xl border border-navy-100 shadow-xl flex items-center gap-3 hidden sm:flex"
              animate={{ y: [0, -6, 0] }}
              transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}
            >
              <div className="w-9 h-9 rounded-lg bg-solar flex items-center justify-center text-navy-900">
                <Sun className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-navy">PR Boost +22%</p>
                <p className="text-xxs text-text-secondary">Post Panel Washing Visit</p>
              </div>
            </motion.div>

            {/* Floating Badge 2: Renewal Alert */}
            <motion.div
              className="absolute -top-5 -right-5 bg-navy text-white p-3 rounded-xl border border-navy-700 shadow-xl flex items-center gap-3 hidden sm:flex"
              animate={{ y: [0, 6, 0] }}
              transition={{ repeat: Infinity, duration: 4.5, ease: 'easeInOut' }}
            >
              <div className="w-9 h-9 rounded-lg bg-navy-700 text-solar flex items-center justify-center">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-white">98.5% Client Renewal</p>
                <p className="text-xxs text-navy-300">Automated Reminders Active</p>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
