import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText,
  Compass,
  Boxes,
  Gavel,
  Wrench,
  Plug,
  FolderGit2,
  CalendarDays,
  IndianRupee,
  Cpu,
  Map,
  ShieldAlert,
  ShieldCheck,
  Users2,
  Files,
  Sun,
  X,
  Smartphone,
  Star,
  Headphones,
  Target
} from 'lucide-react';
import SolarHeader from '../components/SolarHeader';
import FooterWidget from '../components/FooterWidget';
import Carousel from '../components/Carousel';

const ICON_MAP = {
  FileText,
  Compass,
  Boxes,
  Gavel,
  Wrench,
  Plug,
  FolderGit2,
  CalendarDays,
  IndianRupee,
  Cpu,
  Map,
  ShieldAlert,
  ShieldCheck,
  Users2,
  Files,
  Star,
  Headphones,
  Target
};

const BASE_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

export default function SolarMegawattProjectManagement() {
  const [comingSoon, setComingSoon] = useState(false);
  const [config, setConfig] = useState({
    heroTitle: "Solar Mega Watt Project Management",
    heroDescription: "Enterprise-grade project management solution specifically designed for large-scale solar power plants. Manage multi-megawatt projects from conception to commissioning with complete control and visibility.",
    primaryBtnText: "Schedule Consultation",
    primaryBtnLink: "/login",
    secondaryBtnText: "View Demo",
    imageUrl: "",
    rightBannerTitle: "Mega Watt Project Management",
    metricsList: [
      { value: "50+", label: "MW Projects", theme: "orange" },
      { value: "1000+", label: "MW Capacity", theme: "green" },
      { value: "25+", label: "Countries", theme: "blue" }
    ],
    phasesTitle: "Mega Watt Project Lifecycle",
    phasesSubtitle: "End-to-end management for large-scale solar projects",
    phasesList: [
      { num: "1", title: "Feasibility Study", description: "Site assessment, solar irradiance analysis, land acquisition, and regulatory compliance", icon: "FileText" },
      { num: "2", title: "Design & Engineering", description: "Detailed engineering, system design, equipment specification, and layout planning", icon: "Compass" },
      { num: "3", title: "Procurement", description: "Bulk equipment sourcing, vendor selection, supply chain management, and logistics", icon: "Boxes" },
      { num: "4", title: "Solar Bidding", description: "Competitive bidding management, tariff calculations, PPA analysis, and bid submission tracking", icon: "Gavel" },
      { num: "5", title: "Construction", description: "Site preparation, installation, civil works, and electrical integration", icon: "Wrench" },
      { num: "6", title: "Commissioning", description: "Testing, grid connection, performance validation, and handover", icon: "Plug" }
    ],
    featuresTitle: "Enterprise-Grade Features",
    featuresSubtitle: "Comprehensive tools for managing large-scale solar projects",
    featuresList: [
      { title: "Multi-Project Management", description: "Handle multiple mega watt projects simultaneously with centralized control", icon: "FolderGit2" },
      { title: "Gantt Charts", description: "Advanced project scheduling with critical path analysis and dependencies", icon: "CalendarDays" },
      { title: "Budget Tracking", description: "Real-time budget monitoring, cost control, and financial forecasting", icon: "IndianRupee" },
      { title: "Resource Management", description: "Optimize equipment, labor, and material allocation across projects", icon: "Cpu" },
      { title: "GIS Integration", description: "Geographic information system for site mapping and planning", icon: "Map" },
      { title: "Risk Management", description: "Identify, assess, and mitigate project risks proactively", icon: "ShieldAlert" },
      { title: "Quality Control", description: "Track quality metrics, inspections, and compliance standards", icon: "ShieldCheck" },
      { title: "Stakeholder Portal", description: "Dedicated access for investors, contractors, and regulatory bodies", icon: "Users2" },
      { title: "Document Management", description: "Secure repository for blueprints, contracts, and engineering documents", icon: "Files" }
    ],
    screenshotsTitle: "Interface Showcase",
    screenshotsSubtitle: "Take a look at our beautiful and intuitive project screens",
    screenshotsList: [
      { title: "Project Dashboard", description: "Complete overview of all mega watt projects with real-time progress tracking and key metrics" },
      { title: "Project Planning", description: "Advanced project planning tools with Gantt charts, resource allocation, and timeline management" },
      { title: "Site Management", description: "Multi-site project management with location tracking and site-specific dashboards" },
      { title: "Procurement & Logistics", description: "Bulk material procurement, vendor management, and logistics coordination for mega projects" },
      { title: "Construction Tracking", description: "Real-time construction progress tracking with milestone management and quality control" },
      { title: "Advanced Analytics", description: "Comprehensive project analytics, budget tracking, and performance reports" }
    ],
    enableSection: true,
    enablePhasesSection: true,
    enableFeaturesSection: true,
    enableScreenshotsSection: true
  });

  useEffect(() => {
    fetch(`${BASE_URL}/api/website/v1/megawatt/get?t=${Date.now()}`, { cache: 'no-store' })
      .then((res) => res.json())
      .then((data) => {
        if (data?.success && data?.data) {
          setConfig((prev) => {
            const merged = { ...prev, ...data.data };
            if (Array.isArray(data.data.metricsList) && data.data.metricsList.length > 0) {
              merged.metricsList = data.data.metricsList;
            }
            if (Array.isArray(data.data.phasesList) && data.data.phasesList.length > 0) {
              merged.phasesList = data.data.phasesList;
            }
            if (Array.isArray(data.data.featuresList) && data.data.featuresList.length > 0) {
              merged.featuresList = data.data.featuresList;
            }
            if (Array.isArray(data.data.screenshotsList) && data.data.screenshotsList.length > 0) {
              merged.screenshotsList = data.data.screenshotsList;
            }
            return merged;
          });
        }
      })
      .catch((err) => {
        console.error('Failed to fetch Megawatt configuration:', err);
      });
  }, []);

  return (
    <div className="min-h-screen bg-white">
      <SolarHeader />

      {/* Hero Section */}
      {config.enableSection && (
        <section className="relative w-full bg-gradient-to-br from-blue-50 via-white to-orange-50 px-8 py-16 md:px-16 lg:px-24">
          <div className="mx-auto flex max-w-7xl flex-col items-center gap-12 lg:flex-row">
            
            <div className="flex-1 text-left">
              <h1 className="text-4xl font-extrabold text-gray-800 md:text-5xl lg:text-6xl leading-tight">
                {config.heroTitle}
              </h1>
              <p className="mt-6 text-lg leading-relaxed text-gray-500">
                {config.heroDescription}
              </p>

              {/* Key Metrics */}
              <div className="mt-8 flex flex-wrap gap-4">
                {(config.metricsList || []).map((m, idx) => (
                  <div key={idx} className={`rounded-xl border bg-white p-4 shadow-sm text-center flex-1 min-w-[120px] ${
                    m.theme === "orange" ? "border-orange-100" : m.theme === "green" ? "border-green-100" : "border-blue-100"
                  }`}>
                    <span className={`block text-2xl font-extrabold ${
                      m.theme === "orange" ? "text-orange" : m.theme === "green" ? "text-green-600" : "text-blue-600"
                    }`}>{m.value}</span>
                    <span className="text-xs text-gray-400 font-semibold">{m.label}</span>
                  </div>
                ))}
              </div>

              {/* CTA Buttons */}
              <div className="mt-8 flex flex-wrap gap-4">
                <Link
                  to={config.primaryBtnLink || "/login"}
                  className="rounded-xl bg-orange hover:bg-orange/95 text-white px-8 py-4 shadow-lg shadow-orange/30 transition-all font-bold text-lg"
                >
                  {config.primaryBtnText}
                </Link>
                <button
                  onClick={() => setComingSoon(true)}
                  className="rounded-xl border-2 border-orange hover:bg-orange/5 text-orange px-8 py-4 transition-all font-bold text-lg focus:outline-none"
                >
                  {config.secondaryBtnText}
                </button>
              </div>
            </div>

            <div className="flex-1 w-full max-w-xl">
              <div className="relative h-[480px] w-full rounded-2xl bg-orange-50 border border-orange-100 flex flex-col items-center justify-center p-8 shadow-xl">
                {config.imageUrl ? (
                  <img src={config.imageUrl} alt="Mega Watt Project Banner Logo" className="max-h-[350px] w-auto object-contain rounded-2xl" />
                ) : (
                  <>
                    <Sun className="h-40 w-40 text-orange float-animation" />
                    <h2 className="mt-6 text-3xl font-black tracking-wide text-primary text-center">{config.rightBannerTitle}</h2>
                  </>
                )}
              </div>
            </div>

          </div>
        </section>
      )}

      {/* Lifecycle Section */}
      {config.enablePhasesSection && (
        <section className="w-full bg-gradient-to-br from-blue-50 via-white to-orange-50 px-8 py-20 md:px-16 lg:px-24">
          <div className="mx-auto max-w-7xl text-center">
            <h2 className="text-4xl font-bold tracking-tight text-gray-800">
              {config.phasesTitle}
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              {config.phasesSubtitle}
            </p>

            <div className="mt-12 flex flex-row gap-6 overflow-x-auto pb-4 scrollbar-thin snap-x">
              {(config.phasesList || []).filter(p => p.enabled !== false).map((p, idx) => {
                const IconComp = ICON_MAP[p.icon] || FileText;
                return (
                  <div key={idx} className="rounded-2xl bg-white border border-gray-150 p-8 text-left shadow-sm min-w-[280px] max-w-[320px] flex-shrink-0 snap-center relative">
                    <span className="absolute top-4 left-4 flex h-8 w-8 items-center justify-center rounded-full bg-orange/10 text-orange font-bold text-sm">
                      {p.num || idx + 1}
                    </span>
                    <div className="mt-6 flex flex-col space-y-4">
                      <IconComp className="h-10 w-10 text-primary" />
                      <h3 className="text-lg font-bold text-gray-800">{p.title}</h3>
                      <p className="text-sm text-gray-500 leading-relaxed">{p.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Enterprise-Grade Features Section */}
      {config.enableFeaturesSection && (
        <section className="w-full bg-gradient-to-br from-blue-50 via-white to-orange-50 px-8 py-20 md:px-16 lg:px-24">
          <div className="mx-auto max-w-7xl text-center">
            <h2 className="text-4xl font-bold tracking-tight text-gray-800">
              {config.featuresTitle}
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              {config.featuresSubtitle}
            </p>

            <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {(config.featuresList || []).filter(f => f.enabled !== false).map((f, idx) => {
                const IconComp = ICON_MAP[f.icon] || FolderGit2;
                return (
                  <motion.div
                    key={idx}
                    whileHover={{ y: -6, scale: 1.02 }}
                    className="rounded-2xl bg-white p-8 text-left shadow-md hover:shadow-xl transition-all duration-300"
                  >
                    <div className="rounded-full bg-orange/10 p-4 text-orange w-fit">
                      <IconComp className="h-6 w-6" />
                    </div>
                    <h3 className="mt-4 text-xl font-bold text-gray-800">{f.title}</h3>
                    <p className="mt-2 text-sm text-gray-500 leading-relaxed">{f.description}</p>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Screenshots Section */}
      {config.enableScreenshotsSection && (
        <section className="w-full bg-gradient-to-br from-blue-50 via-white to-orange-50 px-8 py-20 md:px-16 lg:px-24">
          <div className="mx-auto max-w-7xl text-center">
            <h2 className="text-4xl font-bold tracking-tight text-gray-800">{config.screenshotsTitle}</h2>
            <p className="mt-4 text-lg text-gray-600">{config.screenshotsSubtitle}</p>
            
            <div className="mt-12 w-full">
              <Carousel
                items={(config.screenshotsList || []).filter(s => s.enabled !== false)}
                renderItem={(s) => (
                  <div className="mx-auto max-w-4xl rounded-2xl bg-white shadow-xl border border-gray-150 overflow-hidden flex flex-col justify-between h-[450px]">
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

      {/* Coming Soon Pop-up */}
      <AnimatePresence>
        {comingSoon && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setComingSoon(false)}
              className="absolute inset-0 bg-black/60"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-2xl border border-gray-150"
            >
              <button
                onClick={() => setComingSoon(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
              <Sun className="h-16 w-16 text-orange mx-auto mb-4 float-animation" />
              <h3 className="text-2xl font-bold text-gray-900">Demo Coming Soon!</h3>
              <p className="mt-4 text-sm text-gray-600">
                Our demonstration sandbox is currently being updated and will be ready for testing soon.
              </p>
              <button
                onClick={() => setComingSoon(false)}
                className="mt-6 rounded-lg bg-orange px-6 py-2 text-sm font-bold text-white hover:bg-orange/90 transition-colors"
              >
                OK
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <FooterWidget />
    </div>
  );
}
