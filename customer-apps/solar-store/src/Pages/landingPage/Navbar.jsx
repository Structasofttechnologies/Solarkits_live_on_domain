import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, useLocation } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import {
  FiMenu,
  FiX,
  FiChevronDown,
  FiChevronRight,
  FiUser,
  FiUserPlus,
  FiHome,
  FiShoppingBag,
  FiShoppingCart,
  FiSun,
  FiZap,
  FiPackage,
  FiLayers,
  FiGrid,
  FiBox,
  FiMapPin,
  FiPhone,
  FiExternalLink,
  FiBriefcase,
  FiArrowRight,
  FiCheckCircle,
  FiStar,
} from "react-icons/fi";
import { selectCartTotalItems, setShowAuthDialog } from "../../features/slice";
import logo from "../../assets/images/logo.png";

// Resolve Franchisee / Reseller Portal URL dynamically for local dev vs production
const getFranchisePortalUrl = () => {
  if (typeof window !== "undefined") {
    if (
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1"
    ) {
      return "http://localhost:5178";
    }
  }
  return "https://franchise.solarkits.in";
};

// Consolidated E-Shop Structure
const E_SHOP_GROUPS = [
  {
    groupTitle: "Preconfigured Solar Kits",
    items: [
      {
        title: "On-Grid Solar Kits",
        desc: "1kW – 10kW Grid-tied kits with subsidy & net-metering",
        badge: "PM Surya Ghar",
        badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200",
        icon: FiSun,
        href: "/shop",
        appRoute: "/shop",
      },
      {
        title: "Off-Grid Solar Kits",
        desc: "1kW – 5kW Battery-backed standalone systems",
        badge: "Zero Outages",
        badgeColor: "bg-amber-50 text-amber-700 border-amber-200",
        icon: FiZap,
        href: "/shop",
        appRoute: "/shop",
      },
      {
        title: "Hybrid Solar Kits",
        desc: "3kW – 10kW Smart dual grid & battery storage systems",
        badge: "Bestseller",
        badgeColor: "bg-blue-50 text-blue-700 border-blue-200",
        icon: FiPackage,
        href: "/shop",
        appRoute: "/shop",
      },
      {
        title: "Commercial Solar Kits",
        desc: "10kW – 100kW+ Three-phase heavy-duty rooftop combo kits",
        badge: "B2B Tiered",
        badgeColor: "bg-purple-50 text-purple-700 border-purple-200",
        icon: FiLayers,
        href: "/shop",
        appRoute: "/shop",
      },
    ],
  },
  {
    groupTitle: "Custom Builders & EPC Procurement",
    items: [
      {
        title: "Custom Combo Kit Builder",
        desc: "Configure customized panels, inverters & mounting structures",
        badge: "Interactive",
        badgeColor: "bg-sky-50 text-sky-700 border-sky-200",
        icon: FiGrid,
        href: "/custom-combo-kit",
        appRoute: "/custom-combo-kit",
      },
      {
        title: "Bulk Procurement (EPC)",
        desc: "Tiered volume discounts for registered EPC contractors",
        badge: "Wholesale",
        badgeColor: "bg-rose-50 text-rose-700 border-rose-200",
        icon: FiBox,
        href: "/bulk-buy",
        appRoute: "/bulk-buy",
      },
      {
        title: "Authorized Store Locator",
        desc: "Find nearest SolarKits regional warehouse & franchisee hubs",
        badge: "Pan-India",
        badgeColor: "bg-indigo-50 text-indigo-700 border-indigo-200",
        icon: FiMapPin,
        href: "/store-locator",
        appRoute: "/store-locator",
      },
    ],
  },
];

// Main Navigation Items
const NAV_LINKS = [
  { label: "Home", href: "#hero", icon: FiHome },
  // E-Shop is rendered with special consolidated Mega-Dropdown
  { label: "Why SolarKits", href: "#why-choose", icon: FiCheckCircle },
  { label: "Brand Partners", href: "#brands", icon: FiPackage },
  { label: "Customer Reviews", href: "#testimonials", icon: FiStar },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [eshopDropdownOpen, setEshopDropdownOpen] = useState(false);
  const [mobileEshopExpanded, setMobileEshopExpanded] = useState(true);
  const dropdownTimeoutRef = useRef(null);
  const dropdownContainerRef = useRef(null);

  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const { isAuthenticated } = useSelector((state) => state.auth_slice);
  const totalCartItems = useSelector(selectCartTotalItems);
  const isShopPage = location.pathname === "/shop" || location.pathname.startsWith("/shop");

  // Scroll detection
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Lock scroll when mobile menu is open
  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  // Handle outside click for dropdown
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        dropdownContainerRef.current &&
        !dropdownContainerRef.current.contains(e.target)
      ) {
        setEshopDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleMouseEnterDropdown = () => {
    if (dropdownTimeoutRef.current) {
      clearTimeout(dropdownTimeoutRef.current);
    }
    setEshopDropdownOpen(true);
  };

  const handleMouseLeaveDropdown = () => {
    dropdownTimeoutRef.current = setTimeout(() => {
      setEshopDropdownOpen(false);
    }, 180);
  };

  const handleNavClick = (href) => {
    setMenuOpen(false);
    setEshopDropdownOpen(false);

    if (href.startsWith("#")) {
      if (location.pathname !== "/") {
        navigate(`/${href}`);
        return;
      }
      if (href === "#hero") {
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }
      const el = document.querySelector(href);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
      }
      return;
    }

    if (href.startsWith("http://") || href.startsWith("https://")) {
      window.open(href, "_blank", "noopener,noreferrer");
      return;
    }

    navigate(href);
  };

  const handleFranchiseRedirect = () => {
    setMenuOpen(false);
    const franchiseUrl = getFranchisePortalUrl();
    window.open(franchiseUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <>
      {/* ── Announcement Marquee Bar ── */}
      <div className="bg-gradient-to-r from-primary-900 via-primary-700 to-primary-800 text-white text-xs font-medium overflow-hidden border-b border-primary-600/40 select-none">
        <div className="flex items-center justify-center">
          <div className="marquee-inner py-2 gap-8 flex items-center">
            {[
              "⚡ India's #1 Solar Kits & EPC Marketplace",
              "🎁 Free Pan-India Delivery on Orders Above ₹5,000",
              "📋 GST Input Tax Invoicing on Every Order",
              "☀️ PM Surya Ghar Muft Bijli Yojana Subsidy Ready Kits",
              "🛡️ 25-Year Performance Warranty on Solar Panels",
              "📞 Solar Helpline: 1800-XXX-XXXX (Mon–Sat, 9AM–6PM)",
              "🤝 Become a Franchise Partner — High ROI & Territory Exclusivity",
              "⚡ India's #1 Solar Kits & EPC Marketplace",
              "🎁 Free Pan-India Delivery on Orders Above ₹5,000",
              "📋 GST Input Tax Invoicing on Every Order",
              "☀️ PM Surya Ghar Muft Bijli Yojana Subsidy Ready Kits",
              "🛡️ 25-Year Performance Warranty on Solar Panels",
              "📞 Solar Helpline: 1800-XXX-XXXX (Mon–Sat, 9AM–6PM)",
              "🤝 Become a Franchise Partner — High ROI & Territory Exclusivity",
            ].map((text, i) => (
              <span
                key={i}
                className="whitespace-nowrap px-4 inline-flex items-center gap-2 text-white/90 font-medium hover:text-white transition-colors"
              >
                {text}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ── Main Sticky Navbar ── */}
      <motion.nav
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.45, ease: "easeOut" }}
        className={`sticky top-0 z-50 transition-all duration-300 ${scrolled
          ? "bg-white/96 backdrop-blur-xl shadow-md border-b border-gray-200/80"
          : "bg-white/95 backdrop-blur-md border-b border-gray-100"
          }`}
      >
        <div className="w-full max-w-[1440px] mx-auto px-3 sm:px-5 lg:px-6 xl:px-8">
          <div className="flex items-center justify-between h-16 lg:h-18 gap-2 lg:gap-4">

            {/* 1. Brand Logo */}
            <div
              className="shrink-0 cursor-pointer flex items-center mr-1 lg:mr-2"
              onClick={() => handleNavClick("#hero")}
            >
              <img
                src={logo}
                alt="SolarKits — A Solar Marketplace"
                className="h-8 sm:h-9 lg:h-10 w-auto object-contain transition-transform hover:scale-103 duration-200"
              />
            </div>

            {/* 2. Desktop Navigation Menu */}
            <nav className="hidden lg:flex items-center gap-1 xl:gap-2">
              {/* Home Tab */}
              <button
                onClick={() => handleNavClick("#hero")}
                className="whitespace-nowrap shrink-0 inline-flex items-center gap-1.5 px-2.5 xl:px-3.5 py-2 text-gray-700 text-xs xl:text-sm font-semibold rounded-xl hover:text-primary-600 hover:bg-primary-50/80 transition-all duration-150 cursor-pointer"
              >
                <FiHome className="text-sm xl:text-base text-gray-500 shrink-0" />
                <span className="whitespace-nowrap">Home</span>
              </button>

              {/* Consolidated E-Shop Mega Tab with Dropdown */}
              <div
                ref={dropdownContainerRef}
                className="relative shrink-0"
                onMouseEnter={handleMouseEnterDropdown}
                onMouseLeave={handleMouseLeaveDropdown}
              >
                <button
                  onClick={() => setEshopDropdownOpen((prev) => !prev)}
                  className={`whitespace-nowrap shrink-0 inline-flex items-center gap-1.5 px-2.5 xl:px-3.5 py-2 text-xs xl:text-sm font-bold rounded-xl transition-all duration-150 cursor-pointer ${eshopDropdownOpen
                    ? "text-primary-600 bg-primary-50 ring-1 ring-primary-200"
                    : "text-gray-800 hover:text-primary-600 hover:bg-primary-50/80"
                    }`}
                  aria-expanded={eshopDropdownOpen}
                >
                  <FiShoppingBag className="text-sm xl:text-base text-primary-500 shrink-0" />
                  <span className="whitespace-nowrap">E-Shop</span>
                  <span className="whitespace-nowrap bg-primary-500 text-white text-[9px] xl:text-[10px] font-extrabold px-1.5 py-0.5 rounded leading-none ml-0.5">
                    Kits
                  </span>
                  <FiChevronDown
                    className={`text-xs xl:text-sm shrink-0 transition-transform duration-200 ${eshopDropdownOpen ? "rotate-180 text-primary-600" : "text-gray-400"
                      }`}
                  />
                </button>

                {/* E-Shop Mega Dropdown Menu */}
                <AnimatePresence>
                  {eshopDropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.98 }}
                      transition={{ duration: 0.18, ease: "easeOut" }}
                      className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-[680px] xl:w-[720px] bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-50 p-5"
                    >
                      {/* Top Header inside dropdown */}
                      <div className="flex items-center justify-between pb-3 mb-4 border-b border-gray-100 gap-3">
                        <div>
                          <h4 className="text-sm font-extrabold text-navy flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-primary-500 animate-pulse"></span>
                            SolarKits E-Shop & Catalog Explorer
                          </h4>
                          <p className="text-xs text-gray-500">
                            Explore certified complete solar combos, bespoke builders & B2B procurement
                          </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            onClick={() => handleNavClick("/shop")}
                            className="whitespace-nowrap text-xs font-bold text-primary-600 hover:text-primary-800 hover:underline flex items-center gap-1 cursor-pointer"
                          >
                            View All Kits <FiArrowRight className="shrink-0" />
                          </button>
                        </div>
                      </div>

                      {/* 2-Column Grid */}
                      <div className="grid grid-cols-2 gap-4">
                        {E_SHOP_GROUPS.map((group, groupIdx) => (
                          <div key={groupIdx} className="space-y-2">
                            <div className="text-[11px] font-bold uppercase tracking-wider text-gray-400 px-2 flex items-center gap-1.5">
                              <span className="whitespace-nowrap">{group.groupTitle}</span>
                            </div>

                            <div className="space-y-1">
                              {group.items.map((subItem) => {
                                const Icon = subItem.icon;
                                return (
                                  <div
                                    key={subItem.title}
                                    onClick={() => handleNavClick(subItem.href || subItem.appRoute)}
                                    className="group flex items-start gap-3 p-2.5 rounded-xl hover:bg-primary-50/60 transition-all duration-150 cursor-pointer border border-transparent hover:border-primary-100"
                                  >
                                    <div className="w-9 h-9 rounded-lg bg-primary-50 text-primary-600 group-hover:bg-primary-500 group-hover:text-white flex items-center justify-center shrink-0 transition-colors shadow-xs">
                                      <Icon className="text-base shrink-0" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center justify-between gap-1">
                                        <span className="text-xs font-bold text-gray-800 group-hover:text-primary-600 transition-colors truncate">
                                          {subItem.title}
                                        </span>
                                        {subItem.badge && (
                                          <span
                                            className={`whitespace-nowrap text-[9px] font-bold px-1.5 py-0.5 rounded-full border shrink-0 ${subItem.badgeColor}`}
                                          >
                                            {subItem.badge}
                                          </span>
                                        )}
                                      </div>
                                      <p className="text-[11px] text-gray-500 line-clamp-1 mt-0.5">
                                        {subItem.desc}
                                      </p>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Bottom Banner */}
                      {/* <div className="mt-4 pt-3 border-t border-gray-100 bg-gradient-to-r from-primary-50/70 to-amber-50/70 -mx-5 -mb-5 px-5 py-3 flex items-center justify-between">
                        {!isAuthenticated ? (
                          <>
                            <div className="flex items-center gap-2 text-xs text-gray-700">
                              <span className="font-semibold text-navy whitespace-nowrap">Looking to order combo kits?</span>
                              <span className="text-gray-500 hidden sm:inline truncate">Sign in or register for direct cart checkout</span>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <button
                                onClick={() => {
                                  setEshopDropdownOpen(false);
                                  navigate("/auth/signup");
                                }}
                                className="whitespace-nowrap px-3 py-1.5 bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 text-xs font-bold rounded-lg transition-colors cursor-pointer inline-flex items-center gap-1"
                              >
                                <FiUserPlus className="text-xs" /> Sign Up
                              </button>
                              <button
                                onClick={() => {
                                  setEshopDropdownOpen(false);
                                  navigate("/auth/login");
                                }}
                                className="whitespace-nowrap px-3.5 py-1.5 bg-primary-600 hover:bg-primary-700 text-white text-xs font-bold rounded-lg shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                              >
                                <FiUser className="text-xs" /> Login
                              </button>
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="flex items-center gap-2 text-xs text-gray-700">
                              <span className="font-semibold text-navy whitespace-nowrap">Need a custom quotation?</span>
                              <span className="text-gray-500 hidden sm:inline truncate">Connect with our solar engineers</span>
                            </div>
                            <button
                              onClick={() => handleNavClick("/custom-combo-kit")}
                              className="whitespace-nowrap px-3.5 py-1.5 bg-primary-600 hover:bg-primary-700 text-white text-xs font-bold rounded-lg shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer shrink-0"
                            >
                              Launch Kit Builder <FiArrowRight className="text-xs shrink-0" />
                            </button>
                          </>
                        )}
                      </div> */}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Why SolarKits Link */}
              <button
                onClick={() => handleNavClick("#why-choose")}
                className="whitespace-nowrap shrink-0 inline-flex items-center px-2.5 xl:px-3.5 py-2 text-gray-700 text-xs xl:text-sm font-semibold rounded-xl hover:text-primary-600 hover:bg-primary-50/80 transition-all duration-150 cursor-pointer"
              >
                <span className="whitespace-nowrap">Why SolarKits</span>
              </button>

              {/* Brand Partners Link */}
              <button
                onClick={() => handleNavClick("#brands")}
                className="whitespace-nowrap shrink-0 inline-flex items-center px-2.5 xl:px-3.5 py-2 text-gray-700 text-xs xl:text-sm font-semibold rounded-xl hover:text-primary-600 hover:bg-primary-50/80 transition-all duration-150 cursor-pointer"
              >
                <span className="whitespace-nowrap">Brand Partners</span>
              </button>

              {/* Customer Reviews Link */}
              <button
                onClick={() => handleNavClick("#testimonials")}
                className="whitespace-nowrap shrink-0 inline-flex items-center px-2.5 xl:px-3.5 py-2 text-gray-700 text-xs xl:text-sm font-semibold rounded-xl hover:text-primary-600 hover:bg-primary-50/80 transition-all duration-150 cursor-pointer"
              >
                <span className="whitespace-nowrap">Customer Reviews</span>
              </button>
            </nav>

            {/* 3. Right Action Buttons */}
            <div className="flex items-center gap-1.5 sm:gap-2 xl:gap-2.5 shrink-0">

              {/* "Become Franchise Partner" Button (Desktop & Tablet) */}
              {/* <motion.button
                onClick={handleFranchiseRedirect}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="whitespace-nowrap shrink-0 hidden md:inline-flex items-center gap-1.5 px-3 xl:px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 hover:from-amber-100 hover:to-orange-100 border border-amber-300/90 text-amber-950 text-xs xl:text-sm font-bold shadow-xs hover:shadow transition-all cursor-pointer group"
                title="Join India's Fastest Growing Solar Franchisee & Reseller Network"
              >
                <FiBriefcase className="text-amber-600 text-sm xl:text-base shrink-0 group-hover:scale-110 transition-transform" />
                <span className="whitespace-nowrap">Become Franchise Partner</span>
                <FiExternalLink className="text-xs text-amber-600 opacity-70 group-hover:opacity-100 shrink-0" />
              </motion.button> */}

              {/* If Authenticated: Show Store Access & Cart */}
              {isAuthenticated && (
                <>
                  <motion.button
                    onClick={() => navigate("/cart")}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="relative p-2 rounded-xl bg-primary-50 hover:bg-primary-100 text-primary-700 transition-all border border-primary-200/80 cursor-pointer shrink-0"
                    title="View Shopping Cart"
                  >
                    <FiShoppingCart className="text-base" />
                    {totalCartItems > 0 && (
                      <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-accent text-white text-[10px] font-extrabold flex items-center justify-center shadow-xs">
                        {totalCartItems}
                      </span>
                    )}
                  </motion.button>

                  <motion.button
                    onClick={() => navigate("/preconfigured-combo-kit")}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="whitespace-nowrap shrink-0 inline-flex items-center gap-1.5 px-3.5 xl:px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white text-xs xl:text-sm font-bold rounded-xl transition-all shadow-sm cursor-pointer"
                  >
                    <FiShoppingBag className="text-sm shrink-0" />
                    <span className="whitespace-nowrap">Go to Store</span>
                  </motion.button>
                </>
              )}

              {/* Sign Up & Login buttons — Shown ONLY on /shop page, hidden on home page */}
              {isShopPage && !isAuthenticated && (
                <div className="flex items-center gap-2">
                  <motion.button
                    onClick={() => navigate("/auth/signup")}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="whitespace-nowrap shrink-0 inline-flex items-center gap-1.5 px-3.5 sm:px-4 py-1.5 sm:py-2 bg-white hover:bg-blue-50/80 text-[#132a68] border border-blue-300 text-xs sm:text-sm font-bold rounded-full transition-all shadow-2xs cursor-pointer"
                  >
                    <FiUserPlus className="text-sm shrink-0 text-[#132a68]" />
                    <span className="whitespace-nowrap">Sign Up</span>
                  </motion.button>

                  <motion.button
                    onClick={() => navigate("/auth/login")}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="whitespace-nowrap shrink-0 inline-flex items-center gap-1.5 px-3.5 sm:px-4 py-1.5 sm:py-2 bg-[#132a68] hover:bg-[#0c1d4a] text-white text-xs sm:text-sm font-bold rounded-full transition-all shadow-sm cursor-pointer"
                  >
                    <FiUser className="text-sm shrink-0" />
                    <span className="whitespace-nowrap">Login</span>
                  </motion.button>
                </div>
              )}

              {/* Mobile Hamburger Toggle Button */}
              <motion.button
                onClick={() => setMenuOpen(!menuOpen)}
                whileTap={{ scale: 0.92 }}
                className="lg:hidden p-2 text-gray-700 hover:bg-gray-100 rounded-xl transition-all border border-gray-200 shrink-0"
                aria-label="Toggle menu"
              >
                {menuOpen ? <FiX className="text-xl" /> : <FiMenu className="text-xl" />}
              </motion.button>
            </div>

          </div>
        </div>
      </motion.nav>

      {/* ── Mobile Menu Drawer ── */}
      <AnimatePresence>
        {menuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-navy/50 backdrop-blur-sm z-50 lg:hidden"
              onClick={() => setMenuOpen(false)}
            />

            {/* Slide Drawer */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="fixed top-0 right-0 bottom-0 w-84 max-w-[90vw] bg-white z-50 overflow-y-auto shadow-2xl flex flex-col lg:hidden"
            >
              {/* Drawer Header */}
              <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-white sticky top-0 z-10">
                <img src={logo} alt="SolarKits" className="h-8 w-auto" />
                <button
                  onClick={() => setMenuOpen(false)}
                  className="p-2 text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                >
                  <FiX className="text-xl" />
                </button>
              </div>

              {/* Drawer Content */}
              <div className="p-4 space-y-4 flex-1">

                {/* Home Link */}
                <button
                  onClick={() => handleNavClick("#hero")}
                  className="w-full flex items-center justify-between p-3 text-gray-800 font-bold text-sm hover:bg-primary-50 hover:text-primary-600 rounded-xl transition-all bg-gray-50/70 cursor-pointer"
                >
                  <span className="flex items-center gap-2.5 whitespace-nowrap">
                    <FiHome className="text-primary-500 text-base shrink-0" />
                    Home
                  </span>
                  <FiChevronRight className="text-gray-400 text-sm shrink-0" />
                </button>

                {/* E-Shop Accordion Section */}
                <div className="border border-gray-200/80 rounded-2xl overflow-hidden bg-gray-50/40">
                  <button
                    onClick={() => setMobileEshopExpanded(!mobileEshopExpanded)}
                    className="w-full flex items-center justify-between p-3.5 text-navy font-extrabold text-sm bg-primary-50/80 hover:bg-primary-100/70 transition-colors cursor-pointer"
                  >
                    <span className="flex items-center gap-2 whitespace-nowrap">
                      <FiShoppingBag className="text-primary-600 text-base shrink-0" />
                      E-Shop & Solar Kits
                      <span className="bg-primary-600 text-white text-[10px] font-bold px-1.5 py-0.2 rounded-md">
                        All Kits
                      </span>
                    </span>
                    <FiChevronDown
                      className={`text-gray-500 transition-transform duration-200 shrink-0 ${mobileEshopExpanded ? "rotate-180" : ""
                        }`}
                    />
                  </button>

                  {mobileEshopExpanded && (
                    <div className="p-2 space-y-1 bg-white border-t border-gray-100">
                      {E_SHOP_GROUPS.flatMap((g) => g.items).map((item) => {
                        const Icon = item.icon;
                        return (
                          <button
                            key={item.title}
                            onClick={() => handleNavClick(item.href || item.appRoute)}
                            className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-primary-50/60 text-left transition-colors group cursor-pointer"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <Icon className="text-primary-500 text-base shrink-0 group-hover:text-primary-700" />
                              <div className="truncate">
                                <p className="text-xs font-bold text-gray-800 group-hover:text-primary-600 truncate">
                                  {item.title}
                                </p>
                                <p className="text-[10px] text-gray-400 truncate">{item.desc}</p>
                              </div>
                            </div>
                            {item.badge && (
                              <span
                                className={`whitespace-nowrap text-[9px] font-bold px-1.5 py-0.5 rounded-full border shrink-0 ${item.badgeColor}`}
                              >
                                {item.badge}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Additional Sections */}
                <div className="space-y-1">
                  {NAV_LINKS.slice(1).map((item) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.label}
                        onClick={() => handleNavClick(item.href)}
                        className="w-full flex items-center justify-between p-3 text-gray-700 font-semibold text-sm hover:bg-primary-50 hover:text-primary-600 rounded-xl transition-all cursor-pointer"
                      >
                        <span className="flex items-center gap-2.5 whitespace-nowrap">
                          <Icon className="text-gray-400 text-base shrink-0" />
                          {item.label}
                        </span>
                        <FiChevronRight className="text-gray-400 text-sm shrink-0" />
                      </button>
                    );
                  })}
                </div>

                {/* Highlighted Franchise Partner Action Card */}
                <div className="p-3.5 rounded-2xl bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100/60 border border-amber-300 shadow-xs">
                  <div className="flex items-center gap-2 text-amber-900 font-bold text-xs mb-1">
                    <FiBriefcase className="text-amber-600 text-base shrink-0" />
                    <span className="whitespace-nowrap">Franchisee & Reseller Network</span>
                  </div>
                  <p className="text-[11px] text-amber-800/80 mb-3 leading-relaxed">
                    Earn high profit margins with exclusive territory rights and Tier-1 brand supply.
                  </p>
                  <button
                    onClick={handleFranchiseRedirect}
                    className="w-full py-2.5 px-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap"
                  >
                    <span>Become Franchise Partner</span>
                    <FiExternalLink className="text-xs shrink-0" />
                  </button>
                </div>

              </div>

              {/* Drawer Footer / Auth Buttons */}
              <div className="p-4 border-t border-gray-100 bg-gray-50/60 space-y-2">
                {isAuthenticated ? (
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      navigate("/preconfigured-combo-kit");
                    }}
                    className="w-full py-3 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl text-sm transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap"
                  >
                    <FiShoppingBag className="shrink-0" />
                    <span>Open Store Dashboard</span>
                  </button>
                ) : isShopPage ? (
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => {
                        setMenuOpen(false);
                        navigate("/auth/signup");
                      }}
                      className="w-full py-2.5 bg-white hover:bg-blue-50/80 text-[#132a68] border border-blue-300 font-bold rounded-full text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap"
                    >
                      <FiUserPlus className="shrink-0 text-[#132a68]" />
                      <span>Sign Up</span>
                    </button>
                    <button
                      onClick={() => {
                        setMenuOpen(false);
                        navigate("/auth/login");
                      }}
                      className="w-full py-2.5 bg-[#132a68] hover:bg-[#0c1d4a] text-white font-bold rounded-full text-xs transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap"
                    >
                      <FiUser className="shrink-0" />
                      <span>Login</span>
                    </button>
                  </div>
                ) : null}

                {/* Helpline Box */}
                <div className="pt-2 text-center">
                  <a
                    href="tel:1800XXXXXXX"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-600 hover:text-primary-600 whitespace-nowrap"
                  >
                    <FiPhone className="text-primary-500 shrink-0" />
                    Helpline: 1800-XXX-XXXX
                  </a>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
