import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Smartphone,
  Boxes,
  ShoppingCart,
  Users,
  BarChart3,
  CreditCard,
  Bell,
  Calendar,
  Headphones,
  Tag,
  ShieldCheck,
  GitCompare,
  Star,
  Lock,
  Clock,
  Smile,
  X
} from 'lucide-react';
import SolarHeader from '../components/SolarHeader';
import FooterWidget from '../components/FooterWidget';
import Carousel from '../components/Carousel';

const ICON_MAP = {
  Smartphone,
  Boxes,
  ShoppingCart,
  Users,
  BarChart3,
  CreditCard,
  Bell,
  Calendar,
  Headphones,
  Tag,
  ShieldCheck,
  GitCompare,
  Star,
  Lock,
  Clock,
  Smile
};

const BASE_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

export default function SolarDealerApp() {
  const [comingSoon, setComingSoon] = useState(null);
  const [config, setConfig] = useState({
    heroTitle: "Solar Dealer App",
    heroDescription: "Empower your solar business with our comprehensive dealer management app. Manage inventory, track orders, handle customers, and grow your solar business from anywhere.",
    downloadLink: "#",
    imageUrl: "/logo.png",
    featuresTitle: "Powerful Features for Solar Dealers",
    featuresSubtitle: "Everything you need to manage and grow your solar business",
    featuresList: [
      { title: "Dashboard Management", description: "Complete overview of your business with real-time analytics, sales performance, and key metrics at a glance", icon: "Boxes", color: "text-green-600 bg-green-50" },
      { title: "Project Signup", description: "Complete project lifecycle management - Lead tracking, Site Survey, Quote Generation, and Project Signup workflow", icon: "ShoppingCart", color: "text-blue-600 bg-blue-50" },
      { title: "Project Management", description: "End-to-end Service Management - Installation tracking, Timeline management, Task assignment, and Progress monitoring", icon: "Users", color: "text-orange-600 bg-orange-50" },
      { title: "Business Analytics", description: "Real-time insights into sales, revenue, and business performance", icon: "BarChart3", color: "text-purple-600 bg-purple-50" },
      { title: "Payment Tracking", description: "Track payments, dues, and generate payment receipts", icon: "CreditCard", color: "text-teal-600 bg-teal-50" },
      { title: "Stock Alerts", description: "Get notified when stock reaches reorder level", icon: "Bell", color: "text-red-600 bg-red-50" },
      { title: "Installation Scheduling", description: "Schedule and track installations with calendar integration", icon: "Calendar", color: "text-amber-800 bg-amber-50" },
      { title: "Customer Support", description: "Built-in ticket system for customer queries", icon: "Headphones", color: "text-indigo-600 bg-indigo-50" },
      { title: "Promotions Management", description: "Create and manage discounts and special offers", icon: "Tag", color: "text-pink-600 bg-pink-50" }
    ],
    screenshotsTitle: "User Friendly Interface Design",
    screenshotsSubtitle: "Take a look at our beautiful and intuitive app interface",
    screenshotsList: [
      { title: "Dashboard", description: "Complete overview of your business with real-time analytics, sales performance, and key metrics at a glance" },
      { title: "Project Signup", description: "Complete project lifecycle management - Lead tracking, Site Survey, Quote Generation, and Project Signup workflow" },
      { title: "Project Management", description: "End-to-end Service Management - Installation tracking, Timeline management, Task assignment, and Progress monitoring" },
      { title: "Combo Kits", description: "Pre-configured solar combo kits management - Order processing, Kit assembly tracking, Inventory management for complete solar packages" }
    ],
    enableSection: true,
    enableFeaturesSection: true,
    enableScreenshotsSection: true
  });

  useEffect(() => {
    fetch(`${BASE_URL}/api/website/v1/dealer-app/get?t=${Date.now()}`, { cache: 'no-store' })
      .then((res) => res.json())
      .then((data) => {
        if (data?.success && data?.data) {
          setConfig((prev) => {
            const merged = { ...prev, ...data.data };
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
        console.error('Failed to fetch Dealer App configuration:', err);
      });
  }, []);

  const handleDownloadClick = (platform) => {
    if (config.downloadLink && config.downloadLink !== "#" && config.downloadLink !== "") {
      window.open(config.downloadLink, "_blank", "noopener,noreferrer");
    } else {
      setComingSoon(platform);
    }
  };

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

              {/* Download Buttons */}
              <div className="mt-8 flex flex-wrap gap-4">
                <button
                  onClick={() => handleDownloadClick('Google Play Store')}
                  className="flex items-center space-x-3 rounded-2xl border border-orange bg-transparent text-orange px-6 py-3 hover:bg-orange/5 transition-all font-bold text-lg focus:outline-none"
                >
                  <div className="bg-white p-1 rounded flex items-center justify-center border border-gray-100">
                    <img 
                      src="/playstore.jpg" 
                      alt="Google Play" 
                      className="h-6 w-6 object-contain" 
                    />
                  </div>
                  <span>Google Play</span>
                </button>
              </div>
            </div>

            <div className="flex-1 w-full max-w-xl">
              <div className="relative h-[400px] w-full rounded-2xl bg-orange-50 border border-orange-100 flex flex-col items-center justify-center p-8 shadow-xl">
                <img 
                  src={config.imageUrl || "/logo.png"} 
                  alt="Solar Dealer App Banner Logo" 
                  className="max-h-[220px] w-auto object-contain rounded-2xl" 
                />
              </div>
            </div>

          </div>
        </section>
      )}

      {/* App Features Section */}
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
                const IconComp = ICON_MAP[f.icon] || Boxes;
                return (
                  <motion.div
                    key={idx}
                    whileHover={{ y: -6, scale: 1.02 }}
                    className="rounded-2xl bg-white p-6 text-left shadow-md hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
                  >
                    <div>
                      <div className={`inline-flex rounded-xl p-3.5 ${f.color || 'text-green-600 bg-green-50'}`}>
                        <IconComp className="h-6 w-6" />
                      </div>
                      <h3 className="mt-4 text-lg font-bold text-gray-800">{f.title}</h3>
                      <p className="mt-2 text-sm text-gray-500 leading-relaxed">{f.description}</p>
                    </div>
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
            <h2 className="text-4xl font-bold tracking-tight text-gray-800">
              {config.screenshotsTitle}
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              {config.screenshotsSubtitle}
            </p>

            <div className="mt-12 w-full">
              <Carousel
                items={(config.screenshotsList || []).filter(s => s.enabled !== false)}
                renderItem={(s) => (
                  <div className="mx-auto max-w-4xl rounded-2xl bg-white shadow-xl border border-gray-100 overflow-hidden flex flex-col justify-between h-[480px]">
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
              onClick={() => setComingSoon(null)}
              className="absolute inset-0 bg-black/60"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-2xl border border-gray-150"
            >
              <button
                onClick={() => setComingSoon(null)}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
              <Smartphone className="h-16 w-16 text-orange mx-auto mb-4 float-animation" />
              <h3 className="text-2xl font-bold text-gray-900">Coming Soon!</h3>
              <p className="mt-4 text-sm text-gray-600">
                Our application is currently under review for the {comingSoon} and will be live shortly.
              </p>
              <button
                onClick={() => setComingSoon(null)}
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
