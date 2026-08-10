import { Link } from 'react-router-dom';
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  ShieldCheck,
  GitCompare,
  Star,
  Lock,
  Headphones,
  Target,
  FileEdit,
  BadgeCent,
  ArrowRightLeft,
  Sun,
  IndianRupee,
  Zap,
  Timer,
  Shield,
  Heart,
  Clock,
  Smile
} from 'lucide-react';
import SolarHeader from '../components/SolarHeader';
import FooterWidget from '../components/FooterWidget';

const ICON_MAP = {
  ShieldCheck,
  GitCompare,
  Star,
  Lock,
  Headphones,
  Target,
  Shield,
  Heart,
  Zap,
  Clock,
  Smile
};

const BASE_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

export default function SolarInstallerMarketplace() {
  const [config, setConfig] = useState({
    heroTitle: "Solar Installer Marketplace",
    heroDescription: "Connect with verified solar installers, compare quotes, and find the best deals for your solar projects. Our marketplace brings together top-rated installers and customers in one platform.",
    buttonText: "Sign Up / Login",
    buttonLink: "/login",
    imageUrl: "/logo.png",
    featuresTitle: "Key Features",
    featuresList: [
      { title: "Verified Installers", description: "All installers are background-verified with proper certifications and licenses.", icon: "ShieldCheck" },
      { title: "Compare Quotes", description: "Get multiple quotes and compare pricing, services, and warranties.", icon: "GitCompare" },
      { title: "Reviews & Ratings", description: "Read genuine reviews from previous customers to make informed decisions.", icon: "Star" },
      { title: "Secure Payments", description: "Safe and secure payment processing with escrow protection.", icon: "Lock" },
      { title: "24/7 Support", description: "Dedicated customer support to help you throughout your solar journey.", icon: "Headphones" },
      { title: "Project Tracking", description: "Track your installation progress in real-time from start to finish.", icon: "Target" }
    ],
    stepsTitle: "How It Works",
    stepsList: [
      { num: "1", title: "Post Your Project", description: "Describe your solar requirements and preferences", icon: "FileEdit" },
      { num: "2", title: "Receive Quotes", description: "Get competitive quotes from verified installers", icon: "BadgeCent" },
      { num: "3", title: "Compare & Select", description: "Review quotes and choose the best installer", icon: "ArrowRightLeft" },
      { num: "4", title: "Get Installed", description: "Schedule installation and enjoy solar energy", icon: "Sun" }
    ],
    whyChooseTitle: "Why Choose Our Marketplace?",
    whyChooseImage: "/logo.png",
    whyChooseList: [
      { title: "Best Prices", description: "Competitive pricing through installer competition", icon: "IndianRupee" },
      { title: "Quality Guarantee", description: "All installations meet industry standards", icon: "Zap" },
      { title: "Fast Installation", description: "Quick turnaround times with professional service", icon: "Timer" },
      { title: "Extended Warranty", description: "Comprehensive warranty coverage on all installations", icon: "ShieldCheck" }
    ],
    ctaTitle: "Ready to Start Your Solar Journey?",
    ctaDescription: "Join thousands of satisfied customers who have found their perfect solar installer through our platform",
    ctaButtonText: "Get Started Now",
    ctaButtonLink: "/login",
    enableSection: true,
    enableFeaturesSection: true,
    enableStepsSection: true,
    enableWhyChooseSection: true,
    enableCtaSection: true
  });

  useEffect(() => {
    fetch(`${BASE_URL}/api/website/v1/marketplace/get?t=${Date.now()}`, { cache: 'no-store' })
      .then((res) => res.json())
      .then((data) => {
        if (data?.success && data?.data) {
          setConfig((prev) => {
            const merged = { ...prev, ...data.data };
            if (Array.isArray(data.data.featuresList) && data.data.featuresList.length > 0) {
              merged.featuresList = data.data.featuresList;
            }
            if (Array.isArray(data.data.stepsList) && data.data.stepsList.length > 0) {
              merged.stepsList = data.data.stepsList;
            }
            if (Array.isArray(data.data.whyChooseList) && data.data.whyChooseList.length > 0) {
              merged.whyChooseList = data.data.whyChooseList;
            }
            return merged;
          });
        }
      })
      .catch((err) => {
        console.error('Failed to fetch Marketplace configuration:', err);
      });
  }, []);
  
  // steps static array removed, now dynamically fetched from config

  // benefits static array removed, now dynamically fetched from config

  return (
    <div className="min-h-screen bg-white">
      <SolarHeader />

      {/* Hero Section */}
      {config.enableSection && (
        <section className="relative w-full bg-gradient-to-br from-blue-50 via-white to-orange-50 px-8 py-16 md:px-16 lg:px-24">
          <div className="mx-auto flex max-w-7xl flex-col items-center gap-12 lg:flex-row">
            
            <div className="flex-1 text-left">
              <h1 className="text-4xl font-extrabold text-gray-800 md:text-5xl lg:text-6xl">
                {config.heroTitle}
              </h1>
              <p className="mt-6 text-lg leading-relaxed text-gray-500">
                {config.heroDescription}
              </p>

              <div className="mt-8">
                <Link
                  to={config.buttonLink || "/login"}
                  className="rounded-xl bg-orange hover:bg-orange/95 text-white px-8 py-4 shadow-lg shadow-orange/30 transition-all font-bold text-lg inline-block"
                >
                  {config.buttonText}
                </Link>
              </div>
            </div>

            <div className="flex-1 w-full max-w-xl">
              <div className="relative h-[400px] w-full rounded-2xl bg-orange-50 border border-orange-100 flex flex-col items-center justify-center p-8 shadow-xl">
                <img 
                  src={config.imageUrl || "/logo.png"} 
                  alt="Marketplace Banner Logo" 
                  className="max-h-[220px] w-auto object-contain rounded-2xl" 
                />
              </div>
            </div>

          </div>
        </section>
      )}

      {/* Features Section */}
      {config.enableFeaturesSection && (
        <section className="w-full bg-gradient-to-br from-blue-50 via-white to-orange-50 px-8 py-20 md:px-16 lg:px-24">
          <div className="mx-auto max-w-7xl text-center">
            <h2 className="text-4xl font-bold tracking-tight text-gray-800">{config.featuresTitle || "Key Features"}</h2>
            
            <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {(config.featuresList || []).filter(f => f.enabled !== false).map((f, idx) => {
                const IconComp = ICON_MAP[f.icon] || ShieldCheck;
                return (
                  <motion.div
                    key={idx}
                    whileHover={{ y: -8, scale: 1.02 }}
                    className="rounded-2xl bg-white p-8 text-left shadow-md hover:shadow-xl transition-all duration-300"
                  >
                    <div className="rounded-full bg-blue-50 p-4 text-blue-700 w-fit">
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

      {/* How It Works Section */}
      {config.enableStepsSection && (
        <section className="w-full bg-gradient-to-br from-blue-50 via-white to-orange-50 px-8 py-20 md:px-16 lg:px-24">
          <div className="mx-auto max-w-7xl text-center">
            <h2 className="text-4xl font-bold tracking-tight text-gray-800">{config.stepsTitle || "How It Works"}</h2>
            
            <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {(config.stepsList || []).filter(s => s.enabled !== false).map((s, idx) => {
                const IconComp = ICON_MAP[s.icon] || FileEdit;
                return (
                  <div key={idx} className="rounded-2xl bg-white p-8 text-center shadow-md relative hover:shadow-lg transition-shadow">
                    <span className="absolute top-4 left-4 flex h-8 w-8 items-center justify-center rounded-full bg-orange/10 text-orange font-bold text-sm">
                      {s.num}
                    </span>
                    <IconComp className="h-12 w-12 text-primary mx-auto mb-4" />
                    <h3 className="text-lg font-bold text-gray-800">{s.title}</h3>
                    <p className="mt-2 text-sm text-gray-500 leading-relaxed">{s.description}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Benefits Section */}
      {config.enableWhyChooseSection && (
        <section className="w-full bg-gradient-to-br from-blue-50 via-white to-orange-50 px-8 py-20 md:px-16 lg:px-24">
          <div className="mx-auto flex max-w-7xl flex-col items-center gap-12 lg:flex-row">
            
            <div className="flex-1 w-full h-[300px] rounded-2xl bg-orange-50 border border-orange-100 flex flex-col items-center justify-center p-8 shadow-xl">
              <img 
                src={config.whyChooseImage || "/logo.png"} 
                alt="Why Choose Our Marketplace Logo" 
                className="max-h-[160px] w-auto object-contain rounded-2xl" 
              />
            </div>

            <div className="flex-1 text-left space-y-6">
              <h2 className="text-3xl font-bold text-gray-800">{config.whyChooseTitle}</h2>
              
              <div className="space-y-4">
                {(config.whyChooseList || []).filter(b => b.enabled !== false).map((b, idx) => {
                  const IconComp = ICON_MAP[b.icon] || ShieldCheck;
                  return (
                    <div key={idx} className="flex gap-4 items-start">
                      <div className="rounded-full bg-blue-50 p-3 text-blue-700 flex-shrink-0">
                        <IconComp className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-gray-800">{b.title}</h3>
                        <p className="mt-1 text-sm text-gray-500 leading-relaxed">{b.description}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>
        </section>
      )}

      {/* CTA Section */}
      {config.enableCtaSection && (
        <section className="w-full bg-gradient-to-br from-orange-100 to-orange-50 px-8 py-20 md:px-16 lg:px-24 text-center">
          <div className="mx-auto max-w-3xl space-y-6">
            <h2 className="text-4xl font-bold tracking-tight text-gray-800">{config.ctaTitle}</h2>
            <p className="text-lg text-gray-600">
              {config.ctaDescription}
            </p>
            <div className="pt-4">
              <Link
                to={config.ctaButtonLink || "/login"}
                className="rounded-xl bg-orange hover:bg-orange/90 text-white px-8 py-4 shadow-lg shadow-orange/30 transition-all font-bold text-xl inline-block"
              >
                {config.ctaButtonText}
              </Link>
            </div>
          </div>
        </section>
      )}

      <FooterWidget />
    </div>
  );
}
