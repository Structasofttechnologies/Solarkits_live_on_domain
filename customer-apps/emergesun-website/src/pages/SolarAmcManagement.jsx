import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import {
  FileText,
  Calendar,
  AlertCircle,
  Users,
  Boxes,
  Receipt,
  History,
  Bell,
  BarChart3,
  TrendingUp,
  Clock,
  CheckCircle,
  Wrench,
  Smartphone,
  X
} from 'lucide-react';
import SolarHeader from '../components/SolarHeader';
import FooterWidget from '../components/FooterWidget';
import Carousel from '../components/Carousel';

const ICON_MAP = {
  FileText, Calendar, AlertCircle, Users, Boxes, Receipt,
  History, Bell, BarChart3, TrendingUp, Clock, CheckCircle,
  Wrench, Smartphone
};

const BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

const DEFAULTS = {
  heroTitle: 'Solar AMC\nManagement System',
  heroDescription: 'Comprehensive Annual Maintenance Contract management solution for solar installations. Streamline service operations, track maintenance schedules, manage complaints, and ensure customer satisfaction with our advanced AMC platform.',
  primaryBtnText: 'Get Started',
  primaryBtnLink: '/login',
  secondaryBtnText: 'Request Demo',
  rightBannerTitle: 'AMC Management',
  imageUrl: '',
  metricsList: [
    { value: '5000+', label: 'Active AMCs', theme: 'orange' },
    { value: '98%',   label: 'Satisfaction',  theme: 'green'  },
    { value: '24/7',  label: 'Support',        theme: 'blue'   }
  ],
  featuresTitle: 'Comprehensive AMC Features',
  featuresSubtitle: 'Everything you need to manage maintenance contracts efficiently',
  featuresList: [
    { icon: 'FileText',    title: 'Contract Management',    desc: 'Create, renew, and manage AMC contracts with automated reminders' },
    { icon: 'Calendar',    title: 'Preventive Maintenance', desc: 'Schedule and track routine maintenance visits and inspections' },
    { icon: 'AlertCircle', title: 'Complaint Management',   desc: 'Register and track customer complaints with SLA monitoring' },
    { icon: 'Users',       title: 'Technician Management',  desc: 'Assign tasks, track attendance, and manage service teams' },
    { icon: 'Boxes',       title: 'Spare Parts Management', desc: 'Track inventory of spare parts used in maintenance' },
    { icon: 'Receipt',     title: 'Invoicing & Billing',    desc: 'Generate invoices and track payments for AMC contracts' },
    { icon: 'History',     title: 'Service History',        desc: 'Complete history of all maintenance activities and visits' },
    { icon: 'Bell',        title: 'Automated Alerts',       desc: 'Get alerts for contract renewals and scheduled maintenance' },
    { icon: 'BarChart3',   title: 'Performance Reports',    desc: 'Detailed reports on service performance and SLA compliance' }
  ],
  processTitle: 'How AMC Management Works',
  processSubtitle: '',
  processList: [
    { step: '1', title: 'Create Contract', description: 'Set up AMC contracts with terms, pricing, and coverage details',  icon: 'FileText'   },
    { step: '2', title: 'Schedule Visits', description: 'Plan preventive maintenance visits and inspections',               icon: 'Calendar'   },
    { step: '3', title: 'Track Services',  description: 'Monitor service execution and record maintenance activities',      icon: 'TrendingUp' },
    { step: '4', title: 'Manage Renewals', description: 'Automate contract renewals and customer communications',           icon: 'Clock'      }
  ],
  benefitsTitle: 'Key Benefits',
  benefitsSubtitle: '',
  benefitsList: [
    { title: 'Maximize Efficiency',   description: 'Automate scheduling and billing to save administrative hours.' },
    { title: 'Improve Uptime',        description: 'Routine preventative testing minimizes unexpected panel/inverter breakdowns.' },
    { title: 'Customer Satisfaction', description: 'Rapid SLA resolution pipelines satisfy dealers and household clients.' },
    { title: 'Business Growth',       description: 'Scale maintenance contract volume without enlarging operational personnel.' }
  ],
  screenshotsTitle: 'Interface Showcase',
  screenshotsSubtitle: '',
  screenshotsList: [
    { title: 'AMC Dashboard',         description: 'Complete overview of all maintenance contracts with real-time status and key metrics' },
    { title: 'Contract Management',   description: 'Manage AMC contracts, renewals, pricing, and customer agreements seamlessly' },
    { title: 'Service Scheduling',    description: 'Schedule preventive maintenance visits and track service history' },
    { title: 'Complaint Management',  description: 'Track and manage customer complaints with SLA monitoring and resolution tracking' },
    { title: 'Team Management',       description: 'Assign tasks to technicians, track attendance, and manage service teams' },
    { title: 'Performance Analytics', description: 'Comprehensive analytics on service performance, revenue, and customer satisfaction' }
  ],
  enableSection: true,
  enableFeaturesSection: true,
  enableProcessSection: true,
  enableBenefitsSection: true,
  enableScreenshotsSection: true
};

function getThemeColor(theme) {
  if (theme === 'orange') return 'border-orange-100 text-orange';
  if (theme === 'green')  return 'border-green-100 text-green-600';
  return 'border-blue-100 text-blue-600';
}

export default function SolarAmcManagement() {
  const [comingSoon, setComingSoon] = useState(false);
  const [config, setConfig] = useState(DEFAULTS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get(`${BASE_URL}/api/website/v1/amc/get`)
      .then(({ data }) => {
        if (data?.data) {
          setConfig(prev => {
            const d = data.data;
            return {
              heroTitle:        d.heroTitle        || prev.heroTitle,
              heroDescription:  d.heroDescription  || prev.heroDescription,
              primaryBtnText:   d.primaryBtnText   || prev.primaryBtnText,
              primaryBtnLink:   d.primaryBtnLink   || prev.primaryBtnLink,
              secondaryBtnText: d.secondaryBtnText || prev.secondaryBtnText,
              rightBannerTitle: d.rightBannerTitle || prev.rightBannerTitle,
              imageUrl:         d.imageUrl         || '',
              metricsList:      (Array.isArray(d.metricsList)      && d.metricsList.length)      ? d.metricsList      : prev.metricsList,
              featuresTitle:    d.featuresTitle    || prev.featuresTitle,
              featuresSubtitle: d.featuresSubtitle || prev.featuresSubtitle,
              featuresList:     (Array.isArray(d.featuresList)     && d.featuresList.length)     ? d.featuresList.map(f => ({ ...f, desc: f.description || f.desc || '' })) : prev.featuresList,
              processTitle:     d.processTitle     || prev.processTitle,
              processSubtitle:  d.processSubtitle  || '',
              processList:      (Array.isArray(d.processList)      && d.processList.length)      ? d.processList      : prev.processList,
              benefitsTitle:    d.benefitsTitle    || prev.benefitsTitle,
              benefitsSubtitle: d.benefitsSubtitle || '',
              benefitsList:     (Array.isArray(d.benefitsList)     && d.benefitsList.length)     ? d.benefitsList.map(b => ({ title: b.title||'', description: b.description||'' })) : prev.benefitsList,
              screenshotsTitle: d.screenshotsTitle || prev.screenshotsTitle,
              screenshotsSubtitle: d.screenshotsSubtitle || '',
              screenshotsList:  (Array.isArray(d.screenshotsList)  && d.screenshotsList.length)  ? d.screenshotsList  : prev.screenshotsList,
              enableSection: d.enableSection !== undefined ? d.enableSection : prev.enableSection,
              enableFeaturesSection: d.enableFeaturesSection !== undefined ? d.enableFeaturesSection : prev.enableFeaturesSection,
              enableProcessSection: d.enableProcessSection !== undefined ? d.enableProcessSection : prev.enableProcessSection,
              enableBenefitsSection: d.enableBenefitsSection !== undefined ? d.enableBenefitsSection : prev.enableBenefitsSection,
              enableScreenshotsSection: d.enableScreenshotsSection !== undefined ? d.enableScreenshotsSection : prev.enableScreenshotsSection,
            };
          });
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <SolarHeader />
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-orange" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <SolarHeader />

      {/* ── Hero Section ── */}
      {config.enableSection && (
        <section className="relative w-full bg-gradient-to-br from-blue-50 via-white to-orange-50 px-8 py-16 md:px-16 lg:px-24">
          <div className="mx-auto flex max-w-7xl flex-col items-center gap-12 lg:flex-row">
            <div className="flex-1 text-left">
              <h1 className="text-4xl font-extrabold text-gray-800 md:text-5xl lg:text-6xl leading-tight">
                {config.heroTitle.split('\n').map((line, i) => (
                  <span key={i}>{line}{i === 0 && config.heroTitle.includes('\n') && <br />}</span>
                ))}
              </h1>
              <p className="mt-6 text-lg leading-relaxed text-gray-500">{config.heroDescription}</p>

              {/* Key Metrics */}
              <div className="mt-8 flex flex-wrap gap-4">
                {config.metricsList.map((m, i) => {
                  const cls = getThemeColor(m.theme);
                  return (
                    <div key={i} className={`rounded-xl border ${cls.split(' ')[0]} bg-white p-4 shadow-sm text-center flex-1 min-w-[120px]`}>
                      <span className={`block text-2xl font-extrabold ${cls.split(' ')[1]}`}>{m.value}</span>
                      <span className="text-xs text-gray-400 font-semibold">{m.label}</span>
                    </div>
                  );
                })}
              </div>

              {/* CTA Buttons */}
              <div className="mt-8 flex flex-wrap gap-4">
                <Link to={config.primaryBtnLink} className="rounded-xl bg-orange hover:bg-orange/95 text-white px-8 py-4 shadow-lg shadow-orange/30 transition-all font-bold text-lg">
                  {config.primaryBtnText}
                </Link>
                <button onClick={() => setComingSoon(true)} className="rounded-xl border-2 border-orange hover:bg-orange/5 text-orange px-8 py-4 transition-all font-bold text-lg focus:outline-none">
                  {config.secondaryBtnText}
                </button>
              </div>
            </div>

            <div className="flex-1 w-full max-w-xl">
              <div className="relative h-[450px] w-full rounded-2xl bg-blue-50 border border-blue-100 flex flex-col items-center justify-center p-8 shadow-xl">
                {config.imageUrl
                  ? <img src={config.imageUrl} alt="AMC Hero" className="h-full w-full object-contain rounded-xl" />
                  : <><Wrench className="h-40 w-40 text-orange float-animation" /><h2 className="mt-6 text-3xl font-black tracking-wide text-primary">{config.rightBannerTitle}</h2></>
                }
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ── Features Section ── */}
      {config.enableFeaturesSection && (
        <section className="w-full bg-gradient-to-br from-blue-50 via-white to-orange-50 px-8 py-20 md:px-16 lg:px-24">
          <div className="mx-auto max-w-7xl text-center">
            <h2 className="text-4xl font-bold tracking-tight text-gray-800">{config.featuresTitle}</h2>
            {config.featuresSubtitle && <p className="mt-4 text-lg text-gray-600">{config.featuresSubtitle}</p>}
            <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {config.featuresList.filter(f => f.enabled !== false).map((f, idx) => {
                const IconComp = ICON_MAP[f.icon] || FileText;
                return (
                  <motion.div key={idx} whileHover={{ y: -6, scale: 1.02 }} className="rounded-2xl bg-white p-8 text-left shadow-md hover:shadow-xl transition-all duration-300">
                    <div className="rounded-full bg-orange/10 p-4 text-orange w-fit"><IconComp className="h-6 w-6" /></div>
                    <h3 className="mt-4 text-xl font-bold text-gray-800">{f.title}</h3>
                    <p className="mt-2 text-sm text-gray-500 leading-relaxed">{f.desc || f.description}</p>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* ── Process Section ── */}
      {config.enableProcessSection && (
        <section className="w-full bg-gradient-to-br from-blue-50 via-white to-orange-50 px-8 py-20 md:px-16 lg:px-24">
          <div className="mx-auto max-w-7xl text-center">
            <h2 className="text-4xl font-bold tracking-tight text-gray-800">{config.processTitle}</h2>
            {config.processSubtitle && <p className="mt-4 text-lg text-gray-600">{config.processSubtitle}</p>}
            <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {config.processList.filter(p => p.enabled !== false).map((p) => {
                const IconComp = ICON_MAP[p.icon] || TrendingUp;
                return (
                  <div key={p.step} className="rounded-2xl bg-white border border-gray-150 p-8 text-center shadow-sm relative">
                    <span className="absolute top-4 left-4 flex h-8 w-8 items-center justify-center rounded-full bg-orange/10 text-orange font-bold text-sm">{p.step}</span>
                    <IconComp className="h-12 w-12 text-primary mx-auto mb-4" />
                    <h3 className="text-lg font-bold text-gray-800">{p.title}</h3>
                    <p className="mt-2 text-sm text-gray-500 leading-relaxed">{p.description}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* ── Benefits Section ── */}
      {config.enableBenefitsSection && (
        <section className="w-full bg-gradient-to-br from-blue-50 via-white to-orange-50 px-8 py-20 md:px-16 lg:px-24">
          <div className="mx-auto flex max-w-7xl flex-col items-center gap-12 lg:flex-row">
            <div className="flex-1 w-full h-[320px] rounded-2xl bg-orange-50 border border-orange-100 flex flex-col items-center justify-center p-8 shadow-xl">
              <Wrench className="h-28 w-28 text-primary" />
            </div>
            <div className="flex-1 text-left space-y-6">
              <h2 className="text-3xl font-bold text-gray-800">{config.benefitsTitle}</h2>
              {config.benefitsSubtitle && <p className="text-gray-500">{config.benefitsSubtitle}</p>}
              <div className="space-y-4">
                {config.benefitsList.filter(b => b.enabled !== false).map((b, idx) => (
                  <div key={idx} className="flex gap-4 items-start">
                    <div className="rounded-full bg-blue-50 p-3 text-blue-700 flex-shrink-0"><CheckCircle className="h-5 w-5" /></div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-800">{b.title}</h3>
                      <p className="mt-1 text-sm text-gray-500 leading-relaxed">{b.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ── Screenshots Carousel ── */}
      {config.enableScreenshotsSection && (
        <section className="w-full bg-gradient-to-br from-blue-50 via-white to-orange-50 px-8 py-20 md:px-16 lg:px-24">
          <div className="mx-auto max-w-7xl text-center">
            <h2 className="text-4xl font-bold tracking-tight text-gray-800">{config.screenshotsTitle}</h2>
            {config.screenshotsSubtitle && <p className="mt-4 text-lg text-gray-600">{config.screenshotsSubtitle}</p>}
            <div className="mt-12 w-full">
              <Carousel
                items={config.screenshotsList.filter(s => s.enabled !== false)}
                renderItem={(s) => (
                  <div className="mx-auto max-w-4xl rounded-2xl bg-white shadow-xl border border-gray-100 overflow-hidden flex flex-col justify-between h-[450px]">
                    <div className="flex-1 bg-gradient-to-br from-blue-50 via-white to-orange-50 flex items-center justify-center">
                      <Smartphone className="h-28 w-28 text-orange" />
                    </div>
                    <div className="bg-white p-6 border-t border-gray-100">
                      <h3 className="text-xl font-bold text-gray-800">{s.title}</h3>
                      <p className="mt-2 text-sm text-gray-500 max-w-2xl mx-auto">{s.description}</p>
                    </div>
                  </div>
                )}
              />
            </div>
          </div>
        </section>
      )}

      {/* ── Coming Soon Popup ── */}
      <AnimatePresence>
        {comingSoon && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setComingSoon(false)} className="absolute inset-0 bg-black/60" />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-2xl border border-gray-150">
              <button onClick={() => setComingSoon(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"><X className="h-6 w-6" /></button>
              <Wrench className="h-16 w-16 text-orange mx-auto mb-4 float-animation" />
              <h3 className="text-2xl font-bold text-gray-900">Demo Coming Soon!</h3>
              <p className="mt-4 text-sm text-gray-600">Our demonstration sandbox is currently being updated and will be ready for testing soon.</p>
              <button onClick={() => setComingSoon(false)} className="mt-6 rounded-lg bg-orange px-6 py-2 text-sm font-bold text-white hover:bg-orange/90 transition-colors">OK</button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <FooterWidget />
    </div>
  );
}
