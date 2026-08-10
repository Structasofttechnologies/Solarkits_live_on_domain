// src/components/landing/FeaturesSection.jsx
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText,
  Users,
  Calendar,
  Wrench,
  AlertCircle,
  History,
  Bell,
  BarChart,
  LayoutDashboard,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react';

const featureModules = [
  {
    id: 'dashboard',
    title: 'Dashboard Overview',
    icon: LayoutDashboard,
    shortDesc: 'Complete 360° visibility over plant uptime, revenue, open tickets, and active AMCs.',
    badge: 'Core ERP Hub',
    bullets: [
      'Real-time portfolio overview across residential, commercial & industrial solar sites',
      'Daily operational metrics: scheduled cleanings, open break-down tickets, expiring AMCs',
      'Revenue analytics & renewal forecasts for monthly and annual AMC targets',
      'Quick action center to dispatch field technicians and approve service reports',
    ],
    stat: '100%',
    statLabel: 'Operational Visibility',
    previewCard: {
      title: 'Solar Portfolio Health',
      subtitle: '1,482 Active Sites Monitored',
      tags: ['Commercial', 'Residential', 'Utility'],
      metric: '99.8% System Uptime',
    },
  },
  {
    id: 'plans',
    title: 'AMC Plan Management',
    icon: FileText,
    shortDesc: 'Configure flexible AMC packages, warranty terms, washing frequencies, and SLA clauses.',
    badge: 'Contract Engine',
    bullets: [
      'Support for Tiered Plans: Basic, Premium Cleaning, Full O&M, and Power Performance Guarantee',
      'Custom frequency settings (Monthly washing, Quarterly preventive checks, Bi-annual thermography)',
      'Automated SLA monitoring with customizable response and resolution deadlines',
      'Digital contract generation with online customer signatures and PDF downloads',
    ],
    stat: '3.5x',
    statLabel: 'Faster Contract Setup',
    previewCard: {
      title: 'Standard Solar Care Plan',
      subtitle: '12 Panel Cleaning Visits + 4 Preventive Audits',
      tags: ['Annual Billing', 'SLA < 4 hrs'],
      metric: '₹24,000 / year',
    },
  },
  {
    id: 'customers',
    title: 'Customer Management',
    icon: Users,
    shortDesc: '360° CRM profile for every solar plant owner with site address, inverter details & history.',
    badge: 'Solar CRM',
    bullets: [
      'Centralized client database: Residential homeowners to multi-megawatt industrial clients',
      'Multiple solar site mapping under a single company account or client profile',
      'Complete equipment tracking: Inverter brand, serial numbers, module specs, warranty dates',
      'Dedicated customer portal access for transparent service history and ticket creation',
    ],
    stat: '10k+',
    statLabel: 'Customers Managed',
    previewCard: {
      title: 'Apex Industrial Solar Park',
      subtitle: 'Site Capacity: 2.5 MW Rooftop System',
      tags: ['Active AMC', 'Premium Tier'],
      metric: 'Owner: Apex Infra Corp',
    },
  },
  {
    id: 'scheduling',
    title: 'Service Scheduling',
    icon: Calendar,
    shortDesc: 'Smart calendar dispatch for routine panel washing, preventive checks & seasonal audits.',
    badge: 'Smart Calendar',
    bullets: [
      'Automated recurring service scheduler based on AMC contract clauses',
      'Drag-and-drop calendar view for daily, weekly, and monthly field technician routes',
      'Route optimization to minimize technician travel time between solar sites',
      'Weather-aware scheduling alerts for rain or high dust conditions',
    ],
    stat: '0',
    statLabel: 'Missed Service Visits',
    previewCard: {
      title: 'Bi-Weekly Washing Dispatch',
      subtitle: 'Route #4 - Gujarat Industrial Belt',
      tags: ['8 Sites Scheduled', 'GPS Active'],
      metric: 'Status: In Progress',
    },
  },
  {
    id: 'technicians',
    title: 'Technician Management',
    icon: Wrench,
    shortDesc: 'Assign field engineers, track GPS check-ins, skill certifications & job completion proof.',
    badge: 'Field Ops',
    bullets: [
      'Mobile app interface for field technicians with offline sync capability',
      'Mandatory photo uploads (Before & After panel cleaning, thermal inverter logs)',
      'Digital geotagged check-in & check-out verification at the solar plant site',
      'Technician performance scorecards based on SLA adherence and customer ratings',
    ],
    stat: '45 mins',
    statLabel: 'Avg Response Time',
    previewCard: {
      title: 'Technician: Rajesh Kumar',
      subtitle: 'Certified Solar Technician (Grade A)',
      tags: ['14 Jobs Completed Today', 'Rating 4.9★'],
      metric: 'GPS: On Site',
    },
  },
  {
    id: 'complaints',
    title: 'Complaint Tracking',
    icon: AlertCircle,
    shortDesc: 'End-to-end ticketing system for inverter faults, panel hotspot issues & grid tripping.',
    badge: 'SLA Desk',
    bullets: [
      'Instant ticket creation via Customer Portal, WhatsApp bot, or phone call',
      'Severity classification: Critical (Inverter down), Major (String loss), Minor (Monitoring offline)',
      'Automated SLA timers with manager escalation alerts if unassigned within 30 minutes',
      'Spare part requirement logging and warranty claim integration',
    ],
    stat: '< 4 hrs',
    statLabel: 'Target SLA Resolution',
    previewCard: {
      title: 'Ticket #TK-8492',
      subtitle: 'Inverter #2 Grid Tripping Fault',
      tags: ['High Priority', 'Technician Assigned'],
      metric: 'SLA Remaining: 1h 45m',
    },
  },
  {
    id: 'history',
    title: 'Maintenance History',
    icon: History,
    shortDesc: 'Complete digital audit trail of every visit, part replaced, and inspection log.',
    badge: 'Audit Trail',
    bullets: [
      'Immutable log of all historical maintenance visits, cleaning reports, and repairs',
      'Historical thermal imaging attachments to track cell hotspot degradation over time',
      'Inverter component replacement history for warranty claims with manufacturers',
      '1-click export of complete plant maintenance logbook for financial & bank audits',
    ],
    stat: '100%',
    statLabel: 'Digital Audit Compliance',
    previewCard: {
      title: 'Plant Logbook Archive',
      subtitle: 'Complete 3-Year Service History',
      tags: ['24 Cleaning Logs', '6 Preventive Audits'],
      metric: 'PDF Export Ready',
    },
  },
  {
    id: 'notifications',
    title: 'Notifications & Reminders',
    icon: Bell,
    shortDesc: 'Automated SMS, Email & WhatsApp alerts for upcoming visits, renewals, and invoice dues.',
    badge: 'Omnichannel Alerts',
    bullets: [
      'Automated customer alerts when technician is dispatched to their solar plant',
      'AMC contract expiration warnings sent to clients 30 days, 15 days, and 7 days prior',
      'Payment overdue reminders with instant Razorpay/UPI digital payment links',
      'Daily technician job summary alerts sent to Operations Managers at 8:00 AM',
    ],
    stat: '+35%',
    statLabel: 'Higher On-Time Renewals',
    previewCard: {
      title: 'WhatsApp Alert Dispatch',
      subtitle: 'Sent to 142 Clients Today',
      tags: ['Visit Reminders', 'Renewal Notices'],
      metric: 'Delivery Rate: 99.4%',
    },
  },
  {
    id: 'reports',
    title: 'Reports & Analytics',
    icon: BarChart,
    shortDesc: 'Deep insights into AMC profitability, technician efficiency & solar PR performance.',
    badge: 'BI Engine',
    bullets: [
      'AMC Profitability Reports: Compare revenue collected vs labor and cleaning costs',
      'Solar Performance Ratio (PR) trend charts pre and post panel washing cycles',
      'Technician productivity metrics: Jobs completed per day, average travel time, SLA pass rate',
      'Custom executive reports ready for board meetings and investor updates',
    ],
    stat: '₹120Cr+',
    statLabel: 'Revenue Insights Tracked',
    previewCard: {
      title: 'Q3 Solar AMC Yield Analysis',
      subtitle: 'Portfolio PR Improved from 74% to 81.5%',
      tags: ['Revenue +24%', 'Cost -12%'],
      metric: 'ROI Boost: High',
    },
  },
];

export default function FeaturesSection() {
  const [activeTab, setActiveTab] = useState(featureModules[0].id);

  const selectedFeature = featureModules.find((f) => f.id === activeTab) || featureModules[0];

  return (
    <section id="features" className="py-20 lg:py-28 bg-bg relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-14 space-y-4">
          <div className="inline-flex items-center gap-2 bg-navy-50 border border-navy-200 rounded-full px-3.5 py-1">
            <span className="text-xs font-bold text-navy tracking-wide uppercase">
              Comprehensive ERP Platform
            </span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-navy tracking-tight">
            9 Specialized Modules Designed for Solar Operational Excellence
          </h2>
          <p className="text-sm sm:text-base text-text-secondary leading-relaxed">
            Everything your solar business needs to scale maintenance services seamlessly, reduce technician overhead, and keep solar plant performance at peak generation.
          </p>
        </div>

        {/* Feature Navigation Tabs */}
        <div className="flex items-center justify-start lg:justify-center gap-2 overflow-x-auto pb-4 no-scrollbar mb-10">
          {featureModules.map((feature) => {
            const Icon = feature.icon;
            const isActive = activeTab === feature.id;
            return (
              <button
                key={feature.id}
                onClick={() => setActiveTab(feature.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs whitespace-nowrap transition-all duration-200 border ${
                  isActive
                    ? 'bg-navy text-solar shadow-md border-navy-900 scale-105'
                    : 'bg-white text-text-secondary hover:text-navy hover:bg-navy-50 border-border'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-solar' : 'text-text-muted'}`} />
                <span>{feature.title}</span>
              </button>
            );
          })}
        </div>

        {/* Active Feature Showcase Box */}
        <AnimatePresence mode="wait">
          <motion.div
            key={selectedFeature.id}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.3 }}
            className="bg-white rounded-3xl border border-border shadow-card-lg p-6 sm:p-10"
          >
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              {/* Feature Content */}
              <div className="lg:col-span-7 space-y-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-solar flex items-center justify-center text-navy-900 shadow-md">
                    <selectedFeature.icon className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-xxs font-bold text-solar-900 bg-solar-50 border border-solar-200 px-2.5 py-0.5 rounded-full uppercase">
                      {selectedFeature.badge}
                    </span>
                    <h3 className="text-2xl sm:text-3xl font-extrabold text-navy mt-1">
                      {selectedFeature.title}
                    </h3>
                  </div>
                </div>

                <p className="text-sm sm:text-base text-text-secondary leading-relaxed">
                  {selectedFeature.shortDesc}
                </p>

                {/* Bullet Points */}
                <div className="space-y-3">
                  {selectedFeature.bullets.map((bullet, idx) => (
                    <div key={idx} className="flex items-start gap-3">
                      <CheckCircle2 className="w-4 h-4 text-success shrink-0 mt-0.5" />
                      <span className="text-xs sm:text-sm font-medium text-navy/90 leading-snug">
                        {bullet}
                      </span>
                    </div>
                  ))}
                </div>

                {/* CTA Link */}
                <div className="pt-2">
                  <a
                    href="#plans"
                    className="inline-flex items-center gap-2 text-xs font-bold text-navy hover:text-navy-700 bg-navy-50 hover:bg-navy-100 px-4 py-2.5 rounded-lg border border-navy-200 transition-colors"
                  >
                    <span>Explore {selectedFeature.title} in ERP</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>

              {/* Feature Visual Card Mockup */}
              <div className="lg:col-span-5">
                <div className="bg-navy rounded-2xl p-6 text-white shadow-xl relative overflow-hidden border border-navy-700">
                  <div className="absolute top-0 right-0 w-40 h-40 bg-solar/10 rounded-full blur-2xl pointer-events-none" />

                  <div className="flex items-center justify-between pb-4 border-b border-navy-700 mb-6">
                    <div className="flex items-center gap-2">
                      <selectedFeature.icon className="w-5 h-5 text-solar" />
                      <span className="text-xs font-bold text-white uppercase tracking-wider">
                        {selectedFeature.badge}
                      </span>
                    </div>
                    <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
                  </div>

                  {/* Dynamic Mockup Card Content */}
                  <div className="bg-navy-dark rounded-xl p-4 border border-navy-700 space-y-3 mb-6">
                    <p className="text-sm font-bold text-white">{selectedFeature.previewCard.title}</p>
                    <p className="text-xs text-navy-300">{selectedFeature.previewCard.subtitle}</p>

                    <div className="flex flex-wrap gap-2 pt-1">
                      {selectedFeature.previewCard.tags.map((tag, tIdx) => (
                        <span key={tIdx} className="text-xxs font-semibold bg-navy-light/40 text-solar px-2 py-0.5 rounded border border-solar/20">
                          {tag}
                        </span>
                      ))}
                    </div>

                    <div className="pt-2 border-t border-navy-700/60 flex items-center justify-between text-xs">
                      <span className="text-navy-300 font-medium">Status / Output:</span>
                      <span className="font-bold text-solar">{selectedFeature.previewCard.metric}</span>
                    </div>
                  </div>

                  {/* Impact Stat */}
                  <div className="bg-solar/15 border border-solar/30 rounded-xl p-4 flex items-center justify-between">
                    <div>
                      <p className="text-2xl font-black text-solar">{selectedFeature.stat}</p>
                      <p className="text-xxs text-navy-300 uppercase tracking-wider">{selectedFeature.statLabel}</p>
                    </div>
                    <CheckCircle2 className="w-6 h-6 text-solar" />
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}
