import React, { useState, useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  FiSun,
  FiZap,
  FiBatteryCharging,
  FiHome,
  FiBriefcase,
  FiCheckCircle,
  FiShield,
  FiTruck,
  FiPhoneCall,
  FiSliders,
  FiArrowRight,
  FiHelpCircle,
  FiStar,
  FiFileText,
  FiLayers,
  FiClock,
  FiTag,
  FiCheck,
  FiAward
} from "react-icons/fi";
import { FaSolarPanel, FaBolt, FaLeaf, FaWarehouse, FaCogs } from "react-icons/fa";
import { getAvailableKitData } from "@/features/slice";

import AnnouncementBar from "@/components/storefront/AnnouncementBar";
import StoreHeader from "@/components/storefront/StoreHeader";
import CategoryNav from "@/components/storefront/CategoryNav";
import KitProductCard from "@/components/storefront/KitProductCard";
import KitProductModal from "@/components/storefront/KitProductModal";
import KitFinderWizard from "@/components/storefront/KitFinderWizard";
import KitComparisonDrawer from "@/components/storefront/KitComparisonDrawer";
import ExpertHelpModal from "@/components/storefront/ExpertHelpModal";
import StoreFooter from "@/components/storefront/StoreFooter";
import Drawer from "@/components/Drawer";
import Button from "@/components/Button";

import heroHouseImg from "@/assets/images/hero_solar_house.png";
import projectImg1 from "@/assets/images/solar_project_1.jpg";
import projectImg2 from "@/assets/images/solar_project_2.jpg";
import projectImg3 from "@/assets/images/solar_project_3.jpg";
import projectImg4 from "@/assets/images/solar_project_4.jpg";

export default function LandingPage() {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const availableKits = useSelector((state) => state.slice.availableKits || []);
  const selectedDistrict = useSelector((state) => state.slice.selectedDistrict);

  // Modal and drawer states
  const [selectedQuickViewKit, setSelectedQuickViewKit] = useState(null);
  const [quickViewVariantIndex, setQuickViewVariantIndex] = useState(0);
  const [comparedKits, setComparedKits] = useState([]);
  const [showCompareDrawer, setShowCompareDrawer] = useState(false);
  const [showExpertModal, setShowExpertModal] = useState(false);
  const [expertPreselectedKit, setExpertPreselectedKit] = useState(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeFaqIndex, setActiveFaqIndex] = useState(null);

  // Fetch kits on mount if empty
  useEffect(() => {
    document.title = "SOLARKITS — Complete Solar Power Kits Marketplace";
    if (availableKits.length === 0) {
      dispatch(getAvailableKitData());
    }
  }, [dispatch, availableKits.length]);

  // Comparison toggle
  const handleToggleCompare = (kit) => {
    setComparedKits((prev) => {
      const exists = prev.find((k) => k.id === kit.id);
      if (exists) {
        return prev.filter((k) => k.id !== kit.id);
      }
      if (prev.length >= 4) {
        alert("You can compare up to 4 complete solar kits simultaneously.");
        return prev;
      }
      return [...prev, kit];
    });
  };

  const handleRemoveCompareKit = (kitId) => {
    setComparedKits((prev) => prev.filter((k) => k.id !== kitId));
  };

  const handleOpenExpertHelp = (kit = null) => {
    setExpertPreselectedKit(kit);
    setShowExpertModal(true);
  };

  const handleQuickView = (kit, variantIdx = 0) => {
    setSelectedQuickViewKit(kit);
    setQuickViewVariantIndex(variantIdx);
  };

  // Supported Kit Types
  const KIT_TYPES = [
    {
      id: "on-grid",
      title: "On-Grid Solar Kits",
      subtitle: "Grid Connected with Net-Metering",
      useCase: "Ideal for homes & offices with reliable grid power to reduce power bills by up to 90%.",
      icon: FiSun,
      badge: "Highest ROI",
      path: "/shop?type=on-grid"
    },
    {
      id: "off-grid",
      title: "Off-Grid Solar Kits",
      subtitle: "Independent Battery Storage System",
      useCase: "Ideal for remote locations, farmhouses, or areas with frequent power outages.",
      icon: FiBatteryCharging,
      badge: "100% Autonomous",
      path: "/shop?type=off-grid"
    },
    {
      id: "hybrid",
      title: "Hybrid Solar Kits",
      subtitle: "Best of Both: Net-Metering + Power Backup",
      useCase: "Exports daytime surplus to the grid and provides seamless emergency battery backup.",
      icon: FiZap,
      badge: "Maximum Resilience",
      path: "/shop?type=hybrid"
    },
    {
      id: "residential",
      title: "Residential Solar Kits",
      subtitle: "Custom-Sized for Independent Homes & Villas",
      useCase: "Tailored 1 kW to 10 kW rooftop packages designed for standard domestic loads.",
      icon: FiHome,
      badge: "Domestic Ready",
      path: "/shop?application=residential"
    },
    {
      id: "commercial",
      title: "Commercial Solar Kits",
      subtitle: "High-Capacity 10 kW - 50 kW 3-Phase Kits",
      useCase: "Engineered for small industries, clinics, schools, and commercial establishments.",
      icon: FiBriefcase,
      badge: "Commercial Grade",
      path: "/shop?application=commercial"
    }
  ];

  // Capacity selector chips
  const CAPACITIES = [
    { cap: "1 kW", desc: "Small Home / 1 BHK", units: "~4-5 Units/Day", path: "/shop?capacity=1" },
    { cap: "2 kW", desc: "2 BHK / 1 AC", units: "~8-10 Units/Day", path: "/shop?capacity=2" },
    { cap: "3 kW", desc: "3 BHK / Most Popular", units: "~12-15 Units/Day", path: "/shop?capacity=3" },
    { cap: "5 kW", desc: "Large Home / 2-3 ACs", units: "~20-25 Units/Day", path: "/shop?capacity=5" },
    { cap: "10 kW", desc: "Commercial / Large Villa", units: "~40-50 Units/Day", path: "/shop?capacity=10" },
    { cap: "15 kW+", desc: "Industrial / Enterprise", units: "~60+ Units/Day", path: "/shop?capacity=15" },
  ];

  // Real Project Showcases
  const PROJECTS = [
    {
      img: projectImg1,
      title: "5 kW On-Grid Rooftop Installation",
      location: "Pune, Maharashtra",
      kit: "Tier-1 Mono PERC Kit with 5kW String Inverter",
      savings: "₹52,000 / Year Saved"
    },
    {
      img: projectImg2,
      title: "3 kW Residential Solar Package",
      location: "Bengaluru, Karnataka",
      kit: "3 kW TopCon System with Anodized Structure",
      savings: "₹34,000 / Year Saved"
    },
    {
      img: projectImg3,
      title: "10 kW Commercial Solar Solution",
      location: "Ahmedabad, Gujarat",
      kit: "10 kW 3-Phase Commercial Solar Kit",
      savings: "₹1,15,000 / Year Saved"
    },
    {
      img: projectImg4,
      title: "3 kW Hybrid Solar Kit with Lithium Backup",
      location: "Jaipur, Rajasthan",
      kit: "3 kW Hybrid Solar Kit with Battery Protection",
      savings: "Zero Power Cut Disruption"
    }
  ];

  const FAQS = [
    {
      q: "What exactly is included in a complete SOLARKITS solar kit?",
      a: "Every SOLARKITS package is a 100% turnkey solar power kit. It includes certified Tier-1 solar photovoltaic panels, a compatible solar power inverter with WiFi monitoring, wind-engineered module mounting rails, AC/DC safety distribution boxes with surge protectors (SPDs), UV-resistant solar DC cables, MC4 connectors, and copper earthing kits. You do not need to buy loose electrical accessories separately."
    },
    {
      q: "How do I choose between an On-Grid, Off-Grid, or Hybrid solar kit?",
      a: "If your area has a stable electrical grid and your main goal is slashing your electricity bill, an On-Grid kit is the most cost-effective and supports DISCOM net-metering. If you suffer frequent power outages, a Hybrid kit gives you both net-metering bill savings and automatic battery backup. If you have no grid connection at all, an Off-Grid kit provides full standalone power."
    },
    {
      q: "Are the components covered by manufacturer warranties?",
      a: "Yes! All solar panels carry a 25-year manufacturer performance warranty (guaranteeing >80% output at year 25). Solar inverters carry a 5 to 10-year warranty, and mounting structures come with a 10-year structural warranty. Every order receives a certified GST tax invoice."
    },
    {
      q: "How does delivery and shipping across India work?",
      a: "Orders are dispatched directly from our certified regional solar warehouse closest to your delivery district. Packaging includes heavy-duty wooden palletization for solar modules and shockproof cushioning for inverters, with door-to-door freight delivery and live tracking."
    }
  ];

  return (
    <div className="min-h-screen bg-bg text-text-primary flex flex-col transition-colors duration-200">
      
      {/* 1. Global Announcement / Service Bar */}
      <AnnouncementBar onOpenExpertHelp={() => handleOpenExpertHelp()} />

      {/* 2. Main E-Commerce Header */}
      <StoreHeader
        onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
        compareCount={comparedKits.length}
        onOpenCompare={() => setShowCompareDrawer(true)}
        onOpenExpertHelp={() => handleOpenExpertHelp()}
      />

      {/* 3. Category Navigation Bar */}
      <CategoryNav />

      {/* Mobile Drawer Menu */}
      <Drawer
        isOpen={isMobileMenuOpen}
        setIsOpen={setIsMobileMenuOpen}
        isMobile={true}
        menuItems={[
          { name: "Shop All Solar Kits", path: "/shop", icon: FiSun },
          { name: "On-Grid Kits", path: "/shop?type=on-grid", icon: FiSun },
          { name: "Off-Grid Kits", path: "/shop?type=off-grid", icon: FiBatteryCharging },
          { name: "Hybrid Kits", path: "/shop?type=hybrid", icon: FiZap },
          { name: "Residential Kits", path: "/shop?application=residential", icon: FiHome },
          { name: "Commercial Kits", path: "/shop?application=commercial", icon: FiBriefcase },
          { name: "Find Your Solar Kit", path: "/kit-finder", icon: FiSliders },
          { name: "Compare Solar Kits", path: "/compare", icon: FiLayers },
          { name: "Track Order Status", path: "/track-status", icon: FiTruck },
        ]}
      />

      {/* ─── 4. BRIGHT COMMERCE HERO SECTION ─────────────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-to-b from-white via-sky-50/50 to-slate-50 text-slate-900 py-12 md:py-16 lg:py-20 border-b border-slate-200/80">
        {/* Soft background ambient light gradients */}
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-10 w-80 h-80 bg-secondary/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            
            {/* Left Content */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              
              {/* Trust Tag */}
              <div className="inline-flex items-center gap-2 bg-white border border-primary/20 px-3.5 py-1.5 rounded-full text-xs font-semibold shadow-xs">
                <span className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
                <span className="text-slate-700">India's Dedicated Solar Kit Marketplace</span>
                <span className="text-secondary font-bold">• Turnkey Solutions</span>
              </div>

              {/* Main Headline */}
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-5.5xl font-black tracking-tight text-slate-900 leading-tight font-heading">
                Complete Solar Kits for <span className="gradient-text-secondary">Every Energy Need</span>
              </h1>

              {/* Supporting Message */}
              <p className="text-sm sm:text-base md:text-lg text-slate-600 max-w-2xl mx-auto lg:mx-0 leading-relaxed">
                Explore carefully configured on-grid, off-grid and hybrid solar kits for homes and businesses. Includes Tier-1 solar panels, inverters, mounting structure, and complete safety protection.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3.5 pt-2">
                <Button
                  variant="primary"
                  size="lg"
                  onClick={() => navigate("/shop")}
                  rightIcon={<FiArrowRight size={17} />}
                  className="w-full sm:w-auto font-bold py-3.5 px-7 rounded-2xl shadow-glow text-base cursor-pointer"
                >
                  Shop Solar Kits
                </Button>

                <Button
                  variant="secondary"
                  size="lg"
                  onClick={() => {
                    const el = document.getElementById("kit-finder-section");
                    if (el) el.scrollIntoView({ behavior: "smooth" });
                    else navigate("/kit-finder");
                  }}
                  leftIcon={<FiSliders size={17} />}
                  className="w-full sm:w-auto font-bold py-3.5 px-6 rounded-2xl text-base cursor-pointer shadow-sm"
                >
                  Find the Right Kit
                </Button>

                <button
                  type="button"
                  onClick={() => handleOpenExpertHelp()}
                  className="text-xs font-bold text-slate-700 hover:text-primary flex items-center gap-1.5 py-2 px-3 transition-colors cursor-pointer bg-white rounded-full border border-slate-200 shadow-xs"
                >
                  <FiPhoneCall className="text-secondary" />
                  <span>Talk to an Expert</span>
                </button>
              </div>

              {/* Hero highlights strip */}
              <div className="grid grid-cols-3 gap-3 pt-6 border-t border-slate-200 text-left">
                <div className="flex items-center gap-2">
                  <FiCheckCircle className="text-secondary shrink-0" size={18} />
                  <div>
                    <p className="text-xs font-bold text-slate-900">Tier-1 Panels</p>
                    <p className="text-[10px] text-slate-500">25-Yr Performance</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <FiCheckCircle className="text-primary shrink-0" size={18} />
                  <div>
                    <p className="text-xs font-bold text-slate-900">All Inclusions</p>
                    <p className="text-[10px] text-slate-500">Turnkey Protection</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <FiCheckCircle className="text-emerald-600 shrink-0" size={18} />
                  <div>
                    <p className="text-xs font-bold text-slate-900">GST Invoices</p>
                    <p className="text-[10px] text-slate-500">100% Transparent</p>
                  </div>
                </div>
              </div>

            </div>

            {/* Right Visual Box */}
            <div className="lg:col-span-5 relative flex justify-center">
              <div className="relative w-full max-w-md rounded-3xl overflow-hidden bg-white p-3 border border-slate-200/90 shadow-xl">
                <img
                  src={heroHouseImg}
                  alt="Complete Rooftop Solar Kit Installation"
                  className="w-full h-auto object-cover rounded-2xl transition-transform duration-700 hover:scale-103"
                />

                {/* Floating Badge on Visual */}
                <div className="absolute bottom-6 left-6 right-6 bg-white/95 backdrop-blur-md p-3.5 rounded-2xl border border-slate-200 shadow-xl flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary-soft flex items-center justify-center text-primary">
                      <FaSolarPanel size={20} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900">Complete Turnkey Kits</p>
                      <p className="text-[11px] text-slate-500">Ready to deliver & install</p>
                    </div>
                  </div>
                  <Link
                    to="/shop"
                    className="text-xs font-bold text-primary hover:text-primary-hover flex items-center gap-1"
                  >
                    <span>Browse</span>
                    <FiArrowRight size={12} />
                  </Link>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ─── 5. SHOP BY SOLAR KIT TYPE ───────────────────────────────────── */}
      <section className="py-12 md:py-16 max-w-7xl mx-auto px-4 sm:px-6 w-full">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <span className="text-xs font-extrabold uppercase tracking-wider text-primary">
              Engineered Solutions
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-text-primary mt-1 font-heading">
              Shop by Solar Kit Type
            </h2>
            <p className="text-xs sm:text-sm text-text-secondary mt-1">
              Select the configuration designed for your grid availability and power goals.
            </p>
          </div>
          <Link
            to="/shop"
            className="text-xs font-bold text-primary hover:text-primary-hover flex items-center gap-1 shrink-0"
          >
            <span>View All Complete Kits</span>
            <FiArrowRight size={14} />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {KIT_TYPES.map((type) => {
            const Icon = type.icon;
            return (
              <div
                key={type.id}
                onClick={() => navigate(type.path)}
                className="group relative bg-surface rounded-2xl p-6 border border-border hover:border-primary/50 shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col justify-between cursor-pointer"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-primary-soft text-primary group-hover:bg-primary group-hover:text-white transition-colors duration-300 flex items-center justify-center shadow-xs">
                      <Icon size={22} />
                    </div>
                    <span className="text-[10px] font-extrabold text-secondary bg-secondary-soft px-2.5 py-1 rounded-full border border-secondary/20">
                      {type.badge}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-text-primary group-hover:text-primary transition-colors">
                    {type.title}
                  </h3>
                  <p className="text-xs font-semibold text-primary mt-0.5">{type.subtitle}</p>
                  <p className="text-xs text-text-secondary mt-2 leading-relaxed">
                    {type.useCase}
                  </p>
                </div>

                <div className="pt-4 mt-6 border-t border-border flex items-center justify-between">
                  <span className="text-xs font-bold text-text-primary group-hover:text-primary transition-colors">
                    Shop {type.title.split(" ")[0]} Kits
                  </span>
                  <div className="w-7 h-7 rounded-full bg-primary-soft text-primary group-hover:bg-primary group-hover:text-white flex items-center justify-center transition-all duration-200">
                    <FiArrowRight size={13} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ─── 6. SHOP BY CAPACITY ─────────────────────────────────────────── */}
      <section className="py-12 bg-slate-50/80 border-y border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-8">
            <span className="text-xs font-extrabold uppercase tracking-wider text-primary">
              Rooftop Sizing
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-text-primary mt-1 font-heading">
              Shop by System Capacity (kW)
            </h2>
            <p className="text-xs sm:text-sm text-text-secondary mt-1">
              Browse complete kits calibrated for your daily unit consumption and load requirements.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
            {CAPACITIES.map((cap, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => navigate(cap.path)}
                className="p-4 rounded-2xl bg-surface hover:bg-primary hover:text-white border border-border hover:border-primary shadow-xs hover:shadow-lg transition-all duration-200 text-center group cursor-pointer"
              >
                <div className="w-10 h-10 rounded-xl bg-primary-soft group-hover:bg-white/20 text-primary group-hover:text-white flex items-center justify-center mx-auto mb-2 transition-colors font-black text-sm">
                  {cap.cap.split(" ")[0]}
                </div>
                <h4 className="font-extrabold text-sm text-text-primary group-hover:text-white transition-colors">
                  {cap.cap}
                </h4>
                <p className="text-[10px] font-bold text-secondary group-hover:text-amber-200 mt-0.5">
                  {cap.units}
                </p>
                <p className="text-[10px] text-text-muted group-hover:text-white/80 mt-1 line-clamp-1">
                  {cap.desc}
                </p>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ─── 7. FEATURED COMPLETE SOLAR KITS ─────────────────────────────── */}
      <section className="py-12 md:py-16 max-w-7xl mx-auto px-4 sm:px-6 w-full">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <span className="text-xs font-extrabold uppercase tracking-wider text-primary">
              Direct from Regional Warehouses
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-text-primary mt-1 font-heading">
              Featured Complete Solar Kits
            </h2>
            <p className="text-xs sm:text-sm text-text-secondary mt-1">
              Top-selling turnkey solar kits with Tier-1 panels and certified inverters.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to="/shop"
              className="px-4 py-2 bg-primary-soft hover:bg-primary text-primary hover:text-white text-xs font-bold rounded-xl transition-colors"
            >
              Browse Catalog ({availableKits.length} Kits) →
            </Link>
          </div>
        </div>

        {availableKits.length === 0 ? (
          <div className="p-12 text-center bg-surface rounded-2xl border border-border">
            <p className="text-sm font-semibold text-text-muted">Loading complete solar power kits...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {availableKits.slice(0, 4).map((kit) => (
              <KitProductCard
                key={kit.id}
                kit={kit}
                onQuickView={handleQuickView}
                isCompared={comparedKits.some((k) => k.id === kit.id)}
                onToggleCompare={handleToggleCompare}
              />
            ))}
          </div>
        )}
      </section>

      {/* ─── 8. BRIGHT FIND YOUR SOLAR KIT ASSISTANT ─────────────────────── */}
      <section id="kit-finder-section" className="py-12 md:py-16 bg-gradient-to-b from-slate-50 via-sky-50/30 to-white text-slate-900 relative overflow-hidden border-y border-slate-200">
        <div className="absolute -top-20 -left-20 w-80 h-80 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-secondary/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <span className="text-xs font-extrabold uppercase tracking-wider text-secondary">
              Guided Sizing Assistant
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mt-1 font-heading">
              Find Your Ideal Solar Kit in 60 Seconds
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 mt-1">
              Unsure which solar kit fits your home or business? Let our engineering calculator recommend the perfect system.
            </p>
          </div>

          <KitFinderWizard onSelectKit={(kit) => handleQuickView(kit, 0)} />
        </div>
      </section>

      {/* ─── 9. WHAT'S INSIDE A COMPLETE SOLAR KIT? ─────────────────────── */}
      <section className="py-12 md:py-16 max-w-7xl mx-auto px-4 sm:px-6 w-full">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <span className="text-xs font-extrabold uppercase tracking-wider text-primary">
            Turnkey Package
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-text-primary mt-1 font-heading">
            What's Inside Every Complete Solar Kit?
          </h2>
          <p className="text-xs sm:text-sm text-text-secondary mt-1">
            We deliver 100% complete systems. No missing cables, no uncertified parts, no extra electrical runs required.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          
          <div className="p-5 rounded-2xl bg-surface border border-border shadow-xs hover:border-primary/40 transition-all text-center">
            <div className="w-12 h-12 rounded-2xl bg-primary-soft text-primary flex items-center justify-center mx-auto mb-3">
              <FaSolarPanel size={22} />
            </div>
            <h4 className="text-sm font-bold text-text-primary">1. Tier-1 Solar Panels</h4>
            <p className="text-xs text-text-secondary mt-1 leading-relaxed">
              High-efficiency Mono PERC or TopCon modules with 25-year performance warranties.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-surface border border-border shadow-xs hover:border-primary/40 transition-all text-center">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center mx-auto mb-3">
              <FaBolt size={22} />
            </div>
            <h4 className="text-sm font-bold text-text-primary">2. Solar Power Inverter</h4>
            <p className="text-xs text-text-secondary mt-1 leading-relaxed">
              MPPT string or hybrid inverters with real-time smartphone app WiFi monitoring.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-surface border border-border shadow-xs hover:border-primary/40 transition-all text-center">
            <div className="w-12 h-12 rounded-2xl bg-primary-soft text-primary flex items-center justify-center mx-auto mb-3">
              <FaWarehouse size={22} />
            </div>
            <h4 className="text-sm font-bold text-text-primary">3. Mounting Structure</h4>
            <p className="text-xs text-text-secondary mt-1 leading-relaxed">
              Anodized aluminum or HDG steel rails and mid/end clamps built for 150 km/h winds.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-surface border border-border shadow-xs hover:border-primary/40 transition-all text-center">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center mx-auto mb-3">
              <FiShield size={22} />
            </div>
            <h4 className="text-sm font-bold text-text-primary">4. ACDB & DCDB Safety Boxes</h4>
            <p className="text-xs text-text-secondary mt-1 leading-relaxed">
              Equipped with Type-II DC and AC Surge Protection Devices (SPDs), fuses, and MCBs.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-surface border border-border shadow-xs hover:border-primary/40 transition-all text-center">
            <div className="w-12 h-12 rounded-2xl bg-primary-soft text-primary flex items-center justify-center mx-auto mb-3">
              <FiCheckCircle size={22} />
            </div>
            <h4 className="text-sm font-bold text-text-primary">5. Solar Cables & Earthing</h4>
            <p className="text-xs text-text-secondary mt-1 leading-relaxed">
              TUV-certified 4 sq.mm UV-resistant DC cables, MC4 connectors, and earthing rods.
            </p>
          </div>

        </div>
      </section>

      {/* ─── 10. PROMOTIONAL OFFER BANNER ───────────────────────────────── */}
      <section className="py-8 bg-gradient-to-r from-primary via-primary-end to-primary-navy text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-1 text-center md:text-left">
            <span className="inline-flex items-center gap-1.5 bg-secondary text-white text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
              <FiTag /> Special Commercial Offer
            </span>
            <h3 className="text-xl sm:text-2xl font-black text-white">
              Buy 5+ Complete Solar Kits & Save ₹500/kW Directly
            </h3>
            <p className="text-xs text-slate-200">
              Bulk discounts automatically apply at checkout for multi-kit rooftop orders.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <Button
              variant="secondary"
              size="lg"
              onClick={() => navigate("/shop")}
              className="font-bold py-3 px-6 rounded-2xl shadow-lg cursor-pointer"
            >
              Explore Solar Kits
            </Button>
          </div>
        </div>
      </section>

      {/* ─── 11. WHY CHOOSE SOLARKITS ────────────────────────────────────── */}
      <section className="py-12 md:py-16 max-w-7xl mx-auto px-4 sm:px-6 w-full">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <span className="text-xs font-extrabold uppercase tracking-wider text-primary">
            Marketplace Advantage
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-text-primary mt-1 font-heading">
            Why Buy from SOLARKITS?
          </h2>
          <p className="text-xs sm:text-sm text-text-secondary mt-1">
            Engineered reliability, genuine manufacturer warranties, and hassle-free door-to-door delivery.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          
          <div className="p-6 rounded-2xl bg-surface border border-border shadow-xs hover:border-primary/40 transition-all">
            <div className="w-12 h-12 rounded-2xl bg-primary-soft text-primary flex items-center justify-center mb-4">
              <FiShield size={22} />
            </div>
            <h4 className="text-base font-bold text-text-primary">100% Genuine Components</h4>
            <p className="text-xs text-text-secondary mt-2 leading-relaxed">
              Every panel, inverter, and protection box is sourced directly from certified manufacturers with official warranty cards.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-surface border border-border shadow-xs hover:border-primary/40 transition-all">
            <div className="w-12 h-12 rounded-2xl bg-secondary-soft text-secondary flex items-center justify-center mb-4">
              <FiFileText size={22} />
            </div>
            <h4 className="text-base font-bold text-text-primary">GST Invoice Included</h4>
            <p className="text-xs text-text-secondary mt-2 leading-relaxed">
              Transparent taxation with GST invoices provided for both residential consumers and commercial tax input credit.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-surface border border-border shadow-xs hover:border-primary/40 transition-all">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center mb-4">
              <FiTruck size={22} />
            </div>
            <h4 className="text-base font-bold text-text-primary">Safe Regional Logistics</h4>
            <p className="text-xs text-text-secondary mt-2 leading-relaxed">
              Wood-palletized freight delivery with real-time transit insurance and milestone-based SMS tracking.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-surface border border-border shadow-xs hover:border-primary/40 transition-all">
            <div className="w-12 h-12 rounded-2xl bg-primary-soft text-primary flex items-center justify-center mb-4">
              <FiPhoneCall size={22} />
            </div>
            <h4 className="text-base font-bold text-text-primary">Expert Solar Guidance</h4>
            <p className="text-xs text-text-secondary mt-2 leading-relaxed">
              Our certified solar engineers help you select the exact kW sizing and assist with net-metering DISCOM compliance.
            </p>
          </div>

        </div>
      </section>

      {/* ─── 12. HOW BUYING A SOLAR KIT WORKS ────────────────────────────── */}
      <section className="py-12 bg-slate-50/80 border-y border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <span className="text-xs font-extrabold uppercase tracking-wider text-primary">
              Simple 4-Step Journey
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-text-primary mt-1 font-heading">
              How Buying a Solar Kit Works
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 relative">
            {[
              { step: "01", title: "Select or Find Your Kit", desc: "Choose your desired kW size (1kW - 10kW+) or use our guided wizard." },
              { step: "02", title: "Select Quality Tier", desc: "Pick Basic, Standard, or Premium inverter & panel brands." },
              { step: "03", title: "Secure Checkout", desc: "Pay safely with Razorpay UPI/Cards with instant stock reservation." },
              { step: "04", title: "Doorstep Delivery & Setup", desc: "Receive safely palletized kit ready for rapid rooftop installation." },
            ].map((st, idx) => (
              <div key={idx} className="p-6 rounded-2xl bg-surface border border-border shadow-xs relative">
                <span className="text-3xl font-black text-primary/20 absolute top-4 right-4">
                  {st.step}
                </span>
                <h4 className="text-base font-bold text-text-primary mb-1 mt-2">
                  {st.title}
                </h4>
                <p className="text-xs text-text-secondary leading-relaxed">
                  {st.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── 13. REAL PROJECT SHOWCASE ───────────────────────────────────── */}
      <section className="py-12 md:py-16 max-w-7xl mx-auto px-4 sm:px-6 w-full">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <span className="text-xs font-extrabold uppercase tracking-wider text-primary">
              Proven Installations
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-text-primary mt-1 font-heading">
              Installed Customer Projects
            </h2>
            <p className="text-xs sm:text-sm text-text-secondary mt-1">
              Real residential and commercial solar systems powered by complete SOLARKITS packages.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {PROJECTS.map((proj, idx) => (
            <div key={idx} className="bg-surface rounded-2xl border border-border overflow-hidden shadow-xs hover:shadow-lg transition-all group">
              <div className="h-48 overflow-hidden bg-slate-100 dark:bg-slate-800">
                <img
                  src={proj.img}
                  alt={proj.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>
              <div className="p-4 space-y-2">
                <span className="text-[10px] font-bold text-primary bg-primary-soft px-2 py-0.5 rounded">
                  {proj.location}
                </span>
                <h4 className="text-sm font-bold text-text-primary line-clamp-1">{proj.title}</h4>
                <p className="text-xs text-text-secondary line-clamp-1">{proj.kit}</p>
                <p className="text-xs font-bold text-emerald-600 pt-1 border-t border-border flex items-center gap-1">
                  <FiAward size={13} /> {proj.savings}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── 14. EDUCATIONAL BUYING GUIDE & FAQS ─────────────────────────── */}
      <section className="py-12 bg-slate-50/80 border-y border-border">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-8">
            <span className="text-xs font-extrabold uppercase tracking-wider text-primary">
              Got Questions?
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-text-primary mt-1 font-heading">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="space-y-3">
            {FAQS.map((faq, idx) => (
              <div key={idx} className="bg-surface rounded-2xl border border-border overflow-hidden">
                <button
                  type="button"
                  onClick={() => setActiveFaqIndex(activeFaqIndex === idx ? null : idx)}
                  className="w-full flex items-center justify-between p-4 sm:p-5 text-left text-xs sm:text-sm font-bold text-text-primary hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <span>{faq.q}</span>
                  <span className="text-primary text-sm shrink-0 ml-2">
                    {activeFaqIndex === idx ? "−" : "+"}
                  </span>
                </button>
                {activeFaqIndex === idx && (
                  <div className="p-4 sm:p-5 pt-0 text-xs sm:text-sm text-text-secondary leading-relaxed border-t border-border/50 bg-slate-50/50 dark:bg-slate-800/30">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── 15. BRIGHT EXPERT HELP CTA BANNER ───────────────────────────── */}
      <section className="py-12 bg-gradient-to-r from-sky-50 via-white to-amber-50/60 text-slate-900 border-y border-primary/20 shadow-xs">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center space-y-4">
          <span className="text-xs font-extrabold uppercase tracking-wider text-secondary">
            Engineering Support
          </span>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-900 font-heading">
            Need Expert Assistance Selecting the Right Kit?
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 max-w-xl mx-auto leading-relaxed">
            Our certified solar engineers are ready to evaluate your rooftop dimensions, analyze your DISCOM tariff, and recommend the optimal complete kit.
          </p>
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button
              variant="secondary"
              size="lg"
              onClick={() => handleOpenExpertHelp()}
              leftIcon={<FiPhoneCall size={17} />}
              className="font-bold py-3.5 px-8 rounded-2xl text-base shadow-md cursor-pointer"
            >
              Request Free Consultation
            </Button>
          </div>
        </div>
      </section>

      {/* ─── 16. FULL E-COMMERCE FOOTER ─────────────────────────────────── */}
      <StoreFooter />

      {/* ─── MODALS & DRAWERS ───────────────────────────────────────────── */}
      
      {/* Product Quick View / Detail Modal */}
      {selectedQuickViewKit && (
        <KitProductModal
          kit={selectedQuickViewKit}
          initialVariantIndex={quickViewVariantIndex}
          isOpen={!!selectedQuickViewKit}
          onClose={() => setSelectedQuickViewKit(null)}
          onOpenExpertHelp={handleOpenExpertHelp}
        />
      )}

      {/* Side-by-Side Comparison Drawer */}
      <KitComparisonDrawer
        comparedKits={comparedKits}
        isOpen={showCompareDrawer}
        onClose={() => setShowCompareDrawer(false)}
        onRemoveKit={handleRemoveCompareKit}
        onClearAll={() => setComparedKits([])}
      />

      {/* Solar Expert Consultation Modal */}
      <ExpertHelpModal
        isOpen={showExpertModal}
        onClose={() => setShowExpertModal(false)}
        preselectedKit={expertPreselectedKit}
      />

    </div>
  );
}
