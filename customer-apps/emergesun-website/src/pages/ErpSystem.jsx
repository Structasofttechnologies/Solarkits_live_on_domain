import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Sun,
  Briefcase,
  Wallet,
  Boxes,
  Users,
  CreditCard,
  ShoppingCart,
  Factory,
  BarChart3,
  ClipboardList,
  Truck,
  HelpCircle,
  ShieldCheck,
  CloudCheck,
  RefreshCw,
  Star,
  GraduationCap,
  TrendingUp,
  Eye,
  ArrowLeftRight,
  CheckCircle
} from 'lucide-react';
import SolarHeader from '../components/SolarHeader';
import FooterWidget from '../components/FooterWidget';
import Carousel from '../components/Carousel';
import PricingPlansSection from '../components/PricingPlansSection';

const BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

export default function ErpSystem() {
  const [headerData, setHeaderData] = useState({
    badge: 'Welcome to Solar Business ERP System',
    title: 'Enterprise Resource Planning',
    subtitle: 'ERP System',
    description:
      'Transform your business operations with our comprehensive ERP solution. Streamline processes, integrate departments, and gain real-time visibility across your entire organization. From finance to HR, inventory to production - manage it all in one unified platform.',
    status: true,
  });

  const [ctaConfig, setCtaConfig] = useState({
    title: "Ready to Transform Your Business?",
    subtitle: "Join hundreds of businesses that have streamlined their operations with our ERP system",
    primaryButtonText: "Get Started Free",
    primaryButtonLink: "/login",
    secondaryButtonText: "Schedule Demo",
    secondaryButtonLink: "/demo",
    loginText: "Already have an account? Sign In",
    loginLink: "/login",
    status: true,
  });

  useEffect(() => {
    fetch(`${BASE_URL}/api/website/v1/get?t=${Date.now()}`, { cache: 'no-store' })
      .then((res) => res.json())
      .then((data) => {
        if (data?.success && data?.data) {
          setHeaderData(data.data);
        }
      })
      .catch((err) => {
        console.error('Failed to fetch header data:', err);
      });

    fetch(`${BASE_URL}/api/website/v1/call-to-action/get?t=${Date.now()}`, { cache: 'no-store' })
      .then((res) => res.json())
      .then((data) => {
        if (data?.success && data?.data && data.data.length > 0) {
          setCtaConfig(data.data[0]);
        }
      })
      .catch((err) => {
        console.error('Failed to fetch CTA config:', err);
      });
  }, []);
  const screenshots = [
    { title: 'ERP Dashboard', description: 'Complete business overview with real-time analytics, financial metrics, and operational KPIs', icon: BarChart3, bg: 'bg-gradient-to-br from-indigo-100/50 via-indigo-50/20 to-purple-100/40', iconColor: 'text-indigo-400' },
    { title: 'Inventory Management', description: 'Advanced inventory tracking, stock optimization, and warehouse management system', icon: Boxes, bg: 'bg-gradient-to-br from-blue-100/50 via-blue-50/20 to-cyan-100/40', iconColor: 'text-blue-400' },
    { title: 'Financial Management', description: 'Comprehensive financial controls, accounting, budgeting, and tax management', icon: Wallet, bg: 'bg-gradient-to-br from-teal-100/50 via-teal-50/20 to-green-100/40', iconColor: 'text-teal-400' },
    { title: 'HR & Payroll', description: 'Employee management, attendance tracking, payroll processing, and performance reviews', icon: Users, bg: 'bg-gradient-to-br from-pink-100/50 via-pink-50/20 to-rose-100/40', iconColor: 'text-pink-400' },
    { title: 'Procurement', description: 'Vendor management, purchase orders, supply chain optimization, and contract management', icon: ShoppingCart, bg: 'bg-gradient-to-br from-orange-100/50 via-orange-50/20 to-amber-100/40', iconColor: 'text-orange/80' },
    { title: 'Production Planning', description: 'Manufacturing workflow, bill of materials, quality control, and production scheduling', icon: Factory, bg: 'bg-gradient-to-br from-purple-100/50 via-purple-50/20 to-violet-100/40', iconColor: 'text-purple-400' }
  ];

  const userTestimonials = [
    { name: 'Rajesh Kumar', company: 'SunPower Solutions', position: 'CEO', testimonial: "This ERP system has transformed our solar business completely. We've seen a 40% increase in operational efficiency and better project management." },
    { name: 'Priya Sharma', company: 'Green Energy Systems', position: 'Operations Director', testimonial: "The solar-specific features like panel performance tracking and installation scheduling have made our workflow seamless. Highly recommended!" },
    { name: 'Amit Patel', company: 'SolarTech India', position: 'Founder', testimonial: "From lead management to project completion, everything is integrated. The dealer app is a game-changer for our business." },
    { name: 'Neha Gupta', company: 'EcoSun Enterprises', position: 'Project Manager', testimonial: "The ROI calculator and solar design tools help us provide accurate quotes to customers. Customer satisfaction has improved significantly." },
    { name: 'Vikram Singh', company: 'SolarMax Industries', position: 'Director', testimonial: "The AMC management and installer marketplace have revolutionized how we handle maintenance contracts. Excellent platform!" }
  ];

  const userStats = [
    { label: 'Active Users', value: '5000+', icon: Users, color: 'text-blue-500 bg-blue-50' },
    { label: 'Companies', value: '1000+', icon: Briefcase, color: 'text-green-500 bg-green-50' },
    { label: 'Projects Managed', value: '15000+', icon: Sun, color: 'text-orange-500 bg-orange-50' },
    { label: 'MW Installed', value: '500+', icon: BarChart3, color: 'text-purple-500 bg-purple-50' }
  ];

  const modules = [
    { icon: Wallet, title: "Finance & Accounting", desc: "General ledger, accounts payable/receivable, budgeting, and financial reporting", color: "text-purple-600 bg-purple-50 border-purple-100" },
    { icon: Boxes, title: "Inventory Management", desc: "Stock control, warehouse management, batch tracking, and reorder management", color: "text-blue-600 bg-blue-50 border-blue-100" },
    { icon: Users, title: "HR Management", desc: "Employee records, attendance, leave management, and performance tracking", color: "text-green-600 bg-green-50 border-green-100" },
    { icon: CreditCard, title: "Payroll", desc: "Salary processing, tax calculations, deductions, and payslip generation", color: "text-orange-600 bg-orange-50 border-orange-100" },
    { icon: ShoppingCart, title: "Procurement", desc: "Purchase orders, vendor management, RFQs, and contract management", color: "text-teal-600 bg-teal-50 border-teal-100" },
    { icon: Factory, title: "Production", desc: "Manufacturing planning, BOM, work orders, and quality control", color: "text-amber-700 bg-amber-50 border-amber-100" },
    { icon: Users, title: "Sales & CRM", desc: "Lead management, quotations, sales orders, and customer relationship", color: "text-red-600 bg-red-50 border-red-100" },
    { icon: BarChart3, title: "Business Intelligence", desc: "Advanced analytics, dashboards, reports, and predictive insights", color: "text-indigo-600 bg-indigo-50 border-indigo-100" },
    { icon: ClipboardList, title: "Project Management", desc: "Project planning, resource allocation, task tracking, and time sheets", color: "text-cyan-600 bg-cyan-50 border-cyan-100" },
    { icon: Truck, title: "Supply Chain", desc: "Logistics, shipment tracking, fleet management, and route optimization", color: "text-deep-orange bg-orange-50 border-orange-100" },
    { icon: HelpCircle, title: "Customer Support", desc: "Ticket system, service requests, warranty management, and feedback", color: "text-pink-600 bg-pink-50 border-pink-100" },
    { icon: ShieldCheck, title: "Compliance", desc: "Regulatory compliance, audit trails, document management, and security", color: "text-violet-600 bg-violet-50 border-violet-100" }
  ];

  return (
    <div className="min-h-screen bg-white">
      <SolarHeader />

      {/* Hero Section */}
      {headerData.status !== false && (
        <section className="relative w-full bg-gradient-to-br from-blue-50 via-white to-orange-50 px-8 py-16 md:px-16 lg:px-24">
          <div className="mx-auto flex max-w-7xl flex-col items-center gap-12 lg:flex-row">

            <div className="flex-1 text-left">
              {/* Welcome badge */}
              {headerData.badge && (
                <div className="inline-flex items-center space-x-2 rounded-full bg-gradient-to-r from-orange to-deep-orange px-4 py-2 text-white shadow-lg shadow-orange/30">
                  <Sun className="h-4 w-4 animate-spin-slow" />
                  <span className="text-sm font-semibold">{headerData.badge}</span>
                </div>
              )}

              <h1 className="mt-8 text-4xl font-bold tracking-tight text-gray-800 md:text-5xl lg:text-6xl">
                {headerData.title || 'Enterprise Resource Planning'}
              </h1>
              {headerData.subtitle && (
                <p className="mt-2 text-2xl font-bold text-primary">
                  {headerData.subtitle}
                </p>
              )}
              {headerData.description && (
                <p className="mt-6 text-lg leading-relaxed text-gray-600">
                  {headerData.description}
                </p>
              )}

              {/* CTA Buttons */}
              <div className="mt-8 flex flex-wrap gap-4">
                <Link
                  to="/login"
                  className="rounded-lg bg-orange px-8 py-4 text-lg font-bold text-white shadow-md hover:bg-orange/95 hover:shadow-lg transition-all"
                >
                  Request Demo
                </Link>
                <Link
                  to="/login"
                  className="rounded-lg border-2 border-orange px-8 py-4 text-lg font-bold text-orange hover:bg-orange/5 transition-all"
                >
                  Contact Sales
                </Link>
              </div>
            </div>

            <div className="flex-1 w-full max-w-xl">
              <div className="rounded-2xl bg-white p-6 md:p-8 shadow-xl border border-gray-100 flex flex-col items-center justify-center min-h-[400px] overflow-hidden">
                {headerData.imageUrl ? (
                  <img
                    src={headerData.imageUrl}
                    alt="Hero Banner"
                    className="max-h-[350px] w-full object-contain rounded-xl shadow-sm transition-all duration-300"
                  />
                ) : (
                  <>
                    <Briefcase className="h-32 w-32 text-purple-300 float-animation" />
                    <h2 className="mt-6 text-3xl font-black tracking-wide text-primary">
                      {headerData.subtitle || 'ERP System'}
                    </h2>
                  </>
                )}
              </div>
            </div>

          </div>
        </section>
      )}

      {/* Key Modules Section */}
      <section id="modules" className="w-full bg-gradient-to-br from-blue-50 via-white to-orange-50 px-8 py-20 md:px-16 lg:px-24">
        <div className="mx-auto max-w-7xl text-center">
          <h2 className="text-4xl font-bold tracking-tight text-gray-800">
            Comprehensive ERP Modules
          </h2>
          <p className="mt-4 text-lg text-gray-600">
            Everything you need to run your business efficiently
          </p>

          <div className="mt-12 grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {modules.map((m, idx) => {
              const IconComp = m.icon;
              return (
                <motion.div
                  key={idx}
                  whileHover={{ y: -8, scale: 1.02 }}
                  className="rounded-2xl bg-white p-6 text-left shadow-md hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
                >
                  <div>
                    <div className={`inline-flex rounded-lg p-3 ${m.color.split(' ')[0]} ${m.color.split(' ')[1]}`}>
                      <IconComp className="h-6 w-6" />
                    </div>
                    <h3 className="mt-4 text-lg font-bold text-gray-800">{m.title}</h3>
                    <p className="mt-2 text-sm text-gray-500 leading-relaxed">{m.desc}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Our Users Section */}
      <section className="w-full bg-gradient-to-br from-orange-50 via-white to-blue-50 px-8 py-20 md:px-16 lg:px-24">
        <div className="mx-auto max-w-7xl text-center">
          <h2 className="text-4xl font-bold tracking-tight text-gray-800">Our Happy Users</h2>
          <p className="mt-4 text-lg text-gray-600">Trusted by solar businesses across India</p>

          {/* User Stats Row */}
          <div className="mt-12 grid gap-6 grid-cols-2 lg:grid-cols-4">
            {userStats.map((stat, idx) => {
              const IconComp = stat.icon;
              return (
                <motion.div
                  key={idx}
                  whileHover={{ y: -8, scale: 1.03 }}
                  className="rounded-2xl bg-white p-6 shadow-sm border border-gray-100 flex flex-col items-center hover:shadow-lg transition-all duration-300"
                >
                  <div className={`rounded-full p-4 ${stat.color}`}>
                    <IconComp className="h-8 w-8" />
                  </div>
                  <span className="mt-4 text-3xl font-extrabold text-gray-800">{stat.value}</span>
                  <span className="mt-2 text-sm font-semibold text-gray-500">{stat.label}</span>
                </motion.div>
              );
            })}
          </div>

          {/* Testimonials Carousel */}
          <div className="mt-16 w-full">
            <Carousel
              items={userTestimonials}
              renderItem={(t) => (
                <div className="mx-auto max-w-3xl rounded-2xl bg-white p-8 md:p-12 shadow-md border border-gray-50 text-center flex flex-col items-center">
                  <div className="flex space-x-1 justify-center mb-6">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-6 w-6 fill-yellow text-yellow" />
                    ))}
                  </div>
                  <p className="text-xl md:text-2xl italic font-medium text-gray-700 leading-relaxed">
                    "{t.testimonial}"
                  </p>
                  <div className="mt-6 flex flex-col items-center">
                    <span className="text-lg font-bold text-gray-900">{t.name}</span>
                    <span className="text-sm font-semibold text-gray-400">{t.position}, {t.company}</span>
                  </div>
                </div>
              )}
            />
          </div>

          {/* User Companies */}
          <div className="mt-20">
            <p className="text-xl font-bold text-gray-500 uppercase tracking-wider">Trusted by leading solar companies</p>
            <div className="mt-8 flex flex-wrap justify-center items-center gap-12 opacity-60">
              {['Tata Power Solar', 'Adani Green', 'Waaree', 'Vikram Solar', 'Solex Energy', 'Renew Power'].map((c) => (
                <span key={c} className="text-2xl font-black text-gray-400 tracking-wide hover:opacity-100 transition-opacity cursor-default">
                  {c}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Key Features Section */}
      <section className="w-full bg-gradient-to-br from-blue-50 via-white to-orange-50 px-8 py-20 md:px-16 lg:px-24">
        <div className="mx-auto max-w-7xl text-center">
          <h2 className="text-4xl font-bold tracking-tight text-gray-800">Key Features</h2>
          <p className="mt-4 text-lg text-gray-600">Powerful capabilities to transform your business</p>

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { icon: CloudCheck, title: 'Cloud-Based', desc: 'Access your business data anytime, anywhere from any device', color: 'bg-blue-50 text-blue-600' },
              { icon: ShieldCheck, title: 'Enterprise Security', desc: 'Bank-level security with role-based access control', color: 'bg-green-50 text-green-600' },
              { icon: BarChart3, title: 'Real-Time Analytics', desc: 'Live dashboards and customizable reports', color: 'bg-purple-50 text-purple-600' },
              { icon: RefreshCw, title: 'Seamless Integration', desc: 'Integrates with third-party applications and services', color: 'bg-orange-50 text-orange' },
              { icon: BarChart3, title: 'Scalable', desc: 'Grows with your business from startup to enterprise', color: 'bg-teal-50 text-teal-600' },
              { icon: HelpCircle, title: '24/7 Support', desc: 'Dedicated support team available round the clock', color: 'bg-indigo-50 text-indigo-600' },
              { icon: Sun, title: 'Mobile App', desc: 'Full-featured mobile application for on-the-go access', color: 'bg-amber-50 text-amber-600' },
              { icon: RefreshCw, title: 'Regular Updates', desc: 'Continuous improvements and new features', color: 'bg-rose-50 text-rose-600' },
              { icon: GraduationCap, title: 'Training Included', desc: 'Comprehensive training and onboarding support', color: 'bg-emerald-50 text-emerald-600' }
            ].map((f, idx) => {
              const IconComp = f.icon;
              return (
                <motion.div
                  key={idx}
                  whileHover={{ y: -6, scale: 1.02 }}
                  className="bg-white rounded-2xl p-6 text-left shadow-md hover:shadow-xl border-0 flex gap-4 transition-all duration-300"
                >
                  <div className={`rounded-xl p-3 h-fit ${f.color}`}>
                    <IconComp className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-800">{f.title}</h3>
                    <p className="mt-2 text-sm text-gray-500 leading-relaxed">{f.desc}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Screenshots Section */}
      <section className="w-full bg-gradient-to-br from-blue-50 via-white to-orange-50 px-8 py-20 md:px-16 lg:px-24">
        <div className="mx-auto max-w-7xl text-center">
          <h2 className="text-4xl font-bold tracking-tight text-gray-800">ERP System Screenshots</h2>
          <p className="mt-4 text-lg text-gray-600">See our powerful ERP interface in action</p>

          <div className="mt-12 w-full">
            <Carousel
              items={screenshots}
              renderItem={(s) => {
                const IconComp = s.icon;
                return (
                  <div className="mx-auto max-w-4xl rounded-2xl bg-white shadow-xl border border-gray-100 overflow-hidden flex flex-col justify-between h-[450px]">
                    <div className={`flex-1 ${s.bg} flex items-center justify-center`}>
                      <IconComp className={`h-28 w-28 ${s.iconColor} float-animation`} />
                    </div>
                    <div className="bg-white p-6 border-t border-gray-100">
                      <h3 className="text-xl font-bold text-gray-800">{s.title}</h3>
                      <p className="mt-2 text-sm text-gray-500 max-w-2xl mx-auto">{s.description}</p>
                    </div>
                  </div>
                );
              }}
            />
          </div>
        </div>
      </section>

      {/* Benefits of Our ERP System Section */}
      <section className="w-full bg-gradient-to-br from-blue-50/50 via-white to-orange-50/50 px-8 py-20 md:px-16 lg:px-24 border-t border-gray-100">
        <div className="mx-auto max-w-7xl flex flex-col items-center gap-12 lg:flex-row">

          {/* Left Column: Benefits list */}
          <div className="flex-1 text-left space-y-8">
            <h2 className="text-4xl font-extrabold text-gray-800 tracking-tight">
              Benefits of Our ERP System
            </h2>

            <div className="space-y-6">
              {[
                { icon: TrendingUp, title: 'Increased Efficiency', desc: 'Automate manual processes and reduce operational costs by up to 30%', color: 'bg-purple-50 text-purple-700' },
                { icon: Eye, title: 'Better Visibility', desc: 'Real-time insights into all business operations and performance metrics', color: 'bg-indigo-50 text-indigo-700' },
                { icon: ArrowLeftRight, title: 'Streamlined Operations', desc: 'Seamless data flow between departments eliminating silos', color: 'bg-blue-50 text-blue-700' },
                { icon: ClipboardList, title: 'Improved Compliance', desc: 'Automated compliance tracking and audit trails', color: 'bg-green-50 text-green-700' },
                { icon: Wallet, title: 'Cost Reduction', desc: 'Reduce IT costs, eliminate redundant systems, and optimize resources', color: 'bg-orange-50 text-orange-700' }
              ].map((item, idx) => {
                const IconComp = item.icon;
                return (
                  <div key={idx} className="flex gap-4 items-start">
                    <div className={`rounded-full p-3 flex-shrink-0 ${item.color}`}>
                      <IconComp className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-800">{item.title}</h3>
                      <p className="mt-1 text-sm text-gray-500 leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Graphic Card */}
          <div className="flex-1 w-full max-w-xl">
            <div className="h-[420px] w-full rounded-[32px] bg-gradient-to-br from-blue-50/60 via-white to-orange-50/60 flex flex-col items-center justify-center p-8 shadow-xl relative overflow-hidden">
              <TrendingUp className="h-28 w-28 text-purple-300 animate-pulse" />
              <h3 className="mt-6 text-2xl font-black text-purple-400 tracking-wide uppercase">Business Growth</h3>
            </div>
          </div>

        </div>
      </section>

      {/* Flexible Pricing Plans Section */}
      {/* <PricingPlansSection /> */}

      {/* Ready to Transform Your Business? CTA Section */}
      {ctaConfig.status && (
        <section className="w-full bg-gradient-to-br from-amber-100/50 via-amber-50/30 to-orange-100/40 px-6 py-20 md:px-12 lg:px-20 text-center border-t border-orange-100/50">
          <div className="mx-auto max-w-4xl space-y-8">
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-800 tracking-tight">
              {ctaConfig.title}
            </h2>
            <p className="text-base md:text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
              {ctaConfig.subtitle}
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <Link
                to={ctaConfig.primaryButtonLink}
                className="px-10 py-4 bg-orange text-white font-bold rounded-2xl shadow-lg shadow-orange/20 hover:shadow-xl hover:shadow-orange/30 hover:scale-[1.02] active:scale-[0.98] transition-all"
              >
                {ctaConfig.primaryButtonText}
              </Link>
              <Link
                to={ctaConfig.secondaryButtonLink}
                className="px-10 py-4 border-2 border-orange text-orange font-bold rounded-2xl hover:bg-orange/5 active:scale-[0.98] transition-all bg-transparent flex items-center justify-center"
              >
                {ctaConfig.secondaryButtonText}
              </Link>
            </div>

            <div className="pt-2">
              <Link
                to={ctaConfig.loginLink}
                className="text-sm font-semibold text-gray-500 hover:text-primary underline transition-colors"
              >
                {ctaConfig.loginText}
              </Link>
            </div>
          </div>
        </section>
      )}

      <FooterWidget />
    </div>
  );
}
