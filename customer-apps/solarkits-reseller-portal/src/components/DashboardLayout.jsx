import { useState, useEffect, useCallback, useRef } from "react";
import { Link, useLocation, useNavigate, Outlet } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiZap,
  FiHome,
  FiShield,
  FiMapPin,
  FiPackage,
  FiUsers,
  FiShoppingCart,
  FiCreditCard,
  FiLogOut,
  FiCheckCircle,
  FiAlertCircle,
  FiBell,
  FiX,
  FiBox,
  FiTag,
  FiMenu,
  FiMoon,
  FiSun,
  FiChevronDown,
} from "react-icons/fi";
import api from "../services/api";
import logoImg from "@/assets/images/logo.png";

const NAV_ITEMS = [
  { name: "Overview", icon: FiHome, path: "/dashboard" },
  { name: "KYC & Compliance", icon: FiShield, path: "/kyc" },
  { name: "Subscription Plans", icon: FiZap, path: "/plans" },
  { name: "My Territories", icon: FiMapPin, path: "/territories" },
  { name: "Authorized Catalog", icon: FiPackage, path: "/catalog" },
  { name: "B2B Stock & Procurement", icon: FiBox, path: "/procurement-inventory" },
  { name: "Storefront Pricing (MAP)", icon: FiTag, path: "/storefront-listings" },
  { name: "My EPC Buyers", icon: FiUsers, path: "/epc-buyers" },
  { name: "My Orders", icon: FiShoppingCart, path: "/orders" },
  { name: "My Earnings & Payouts", icon: FiCreditCard, path: "/wallet" },
];

export default function DashboardLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [reseller, setReseller] = useState(() => {
    try {
      const saved = localStorage.getItem("reseller_user");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [showNotif, setShowNotif] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 1024);
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth > 1024);
  const [isDark, setIsDark] = useState(() => localStorage.getItem("reseller_theme") === "dark");
  const notifRef = useRef(null);
  const userMenuRef = useRef(null);

  const token = localStorage.getItem("reseller_token");

  // Theme management
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    localStorage.setItem("reseller_theme", isDark ? "dark" : "light");
  }, [isDark]);

  // Responsive sidebar
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 1024;
      setIsMobile(mobile);
      if (mobile) setSidebarOpen(false);
      else setSidebarOpen(true);
    };
    window.addEventListener("resize", handleResize);
    handleResize();
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setShowNotif(false);
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) setShowUserMenu(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const fetchMe = useCallback(() => {
    if (!token) return;
    api.get('/india/v1/reseller/auth/me')
      .then((res) => {
        if (res.data?.status === "success") {
          const userData = res.data.data || res.data.user;
          if (userData) {
            setReseller((prev) => {
              if (prev && JSON.stringify(prev) === JSON.stringify(userData)) return prev;
              localStorage.setItem("reseller_user", JSON.stringify(userData));
              return userData;
            });
          }
        }
      })
      .catch(() => {
        localStorage.removeItem("reseller_token");
        navigate("/login");
      });
  }, [token, navigate]);

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }
    fetchMe();
    const timer = setInterval(fetchMe, 5000);
    return () => clearInterval(timer);
  }, [token, fetchMe, navigate]);

  const handleLogout = () => {
    localStorage.removeItem("reseller_token");
    localStorage.removeItem("reseller_user");
    navigate("/login");
  };

  const filteredNav = NAV_ITEMS.filter(
    (item) => !(item.path === "/kyc" && reseller?.kyc_status === "verified")
  );

  const avatarUrl = reseller?.business_name
    ? `https://ui-avatars.com/api/?name=${encodeURIComponent(reseller.business_name)}&background=1a3b8b&color=ffffff`
    : null;

  return (
    <div className="min-h-screen flex font-sans antialiased" style={{ background: "var(--color-bg)", color: "var(--color-text-primary)" }}>

      {/* Mobile Overlay */}
      <AnimatePresence>
        {isMobile && sidebarOpen && (
          <motion.div
            key="overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40"
            style={{ background: "rgba(0,0,0,0.5)" }}
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <AnimatePresence>
        {(sidebarOpen || !isMobile) && (
          <motion.aside
            key="sidebar"
            initial={{ x: isMobile ? "-100%" : 0 }}
            animate={{ x: 0 }}
            exit={{ x: isMobile ? "-100%" : 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className={`flex flex-col shrink-0 shadow-lg ${isMobile
                ? "fixed top-0 left-0 h-screen z-50 w-64"
                : "h-screen w-60"
              }`}
            style={{
              background: "var(--color-surface)",
              borderRight: "1px solid var(--color-border)",
            }}
          >
            {/* Logo */}
            <div
              className="flex items-center justify-center p-4 min-h-[100px]"
              style={{ borderBottom: "1px solid var(--color-border)" }}
            >
              <img src={logoImg} alt="SolarKits Logo" className="w-28 h-auto" />
            </div>

            {/* Reseller badge in sidebar */}
            {reseller && (
              <div className="px-3 py-2" style={{ borderBottom: "1px solid var(--color-border)" }}>
                <div
                  className="px-3 py-2 rounded-xl flex items-center gap-2"
                  style={{ background: "var(--color-bg)" }}
                >
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-white shrink-0"
                    style={{ background: "var(--gradient-primary)" }}
                  >
                    {reseller.business_name?.charAt(0)?.toUpperCase() || "R"}
                  </div>
                  <div className="min-w-0">
                    <div
                      className="text-xs font-bold truncate"
                      style={{ color: "var(--color-text-primary)" }}
                    >
                      {reseller.business_name}
                    </div>
                    <div
                      className="text-[10px] font-semibold flex items-center gap-1 mt-0.5"
                      style={{
                        color: reseller.kyc_status === "verified" ? "#16a34a" : "#f59e0b",
                      }}
                    >
                      {reseller.kyc_status === "verified" ? (
                        <FiCheckCircle size={9} />
                      ) : (
                        <FiAlertCircle size={9} />
                      )}
                      KYC {reseller.kyc_status}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation */}
            <div className="flex-1 overflow-y-auto scrollbar-hover py-2">
              <ul className="px-2 space-y-1">
                {filteredNav.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.path;
                  return (
                    <li key={item.path}>
                      <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                        <Link
                          to={item.path}
                          onClick={() => isMobile && setSidebarOpen(false)}
                          className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${isActive ? "btn-primary text-white" : ""
                            }`}
                          style={
                            !isActive
                              ? {
                                color: "var(--color-text-secondary)",
                                background: "transparent",
                              }
                              : {}
                          }
                          onMouseEnter={(e) => {
                            if (!isActive) {
                              e.currentTarget.style.background = "var(--color-surface-hover)";
                              e.currentTarget.style.color = "var(--color-text-primary)";
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (!isActive) {
                              e.currentTarget.style.background = "transparent";
                              e.currentTarget.style.color = "var(--color-text-secondary)";
                            }
                          }}
                        >
                          <Icon
                            size={17}
                            style={isActive ? { color: "white" } : { color: "var(--color-primary)" }}
                          />
                          <span>{item.name}</span>
                        </Link>
                      </motion.div>
                    </li>
                  );
                })}
              </ul>
            </div>

            {/* Logout */}
            <div className="p-3" style={{ borderTop: "1px solid var(--color-border)" }}>
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer"
                style={{
                  color: "var(--color-danger)",
                  background: "var(--color-danger-soft)",
                  border: "1px solid #fca5a520",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "var(--gradient-danger)";
                  e.currentTarget.style.color = "white";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "var(--color-danger-soft)";
                  e.currentTarget.style.color = "var(--color-danger)";
                }}
              >
                <FiLogOut size={15} />
                Logout Partner
              </button>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Header - matches EPC Solar dashboard style */}
        <header
          className="flex items-center justify-between px-6 py-3 relative z-30 transition-colors duration-200"
          style={{
            background: "var(--color-surface)",
            borderBottom: "1px solid var(--color-border)",
            boxShadow: "var(--shadow-xs)",
            minHeight: "64px",
          }}
        >
          {/* Left - Mobile toggle + Brand title */}
          <div className="flex items-center gap-3">
            {isMobile && (
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="flex items-center justify-center w-9 h-9 rounded-xl transition-colors"
                style={{ color: "var(--color-text-primary)" }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "var(--color-surface-hover)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                <FiMenu size={20} />
              </button>
            )}
            <div className="flex items-center gap-2">
              <span
                className="w-2 h-2 rounded-full animate-pulse"
                style={{ background: "#16a34a" }}
              />
              <span
                className="font-bold text-sm hidden sm:block"
                style={{ color: "var(--color-text-secondary)" }}
              >
                Reseller Business Portal
              </span>
            </div>
          </div>

          {/* Right - Actions */}
          <div className="flex items-center gap-3">
            {/* KYC Status Badge */}
            {reseller && (
              <span
                className="hidden sm:flex px-3 py-1 rounded-full text-xs font-extrabold capitalize items-center gap-1.5"
                style={
                  reseller.kyc_status === "verified"
                    ? { background: "#f0fdf4", color: "#16a34a", border: "1px solid #86efac" }
                    : reseller.kyc_status === "submitted"
                      ? { background: "#f0f9ff", color: "#0ea5e9", border: "1px solid #7dd3fc" }
                      : { background: "#fffbeb", color: "#d97706", border: "1px solid #fcd34d" }
                }
              >
                {reseller.kyc_status === "verified" ? (
                  <FiCheckCircle size={12} />
                ) : (
                  <FiAlertCircle size={12} />
                )}
                KYC: {reseller.kyc_status}
              </span>
            )}

            {/* Theme Toggle */}
            <button
              onClick={() => setIsDark((d) => !d)}
              className="flex items-center justify-center w-9 h-9 rounded-xl transition-colors"
              style={{ color: "var(--color-text-primary)" }}
              title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
              onMouseEnter={(e) => (e.currentTarget.style.background = "var(--color-surface-hover)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
            >
              {isDark ? (
                <FiSun style={{ color: "var(--color-warning)" }} size={18} />
              ) : (
                <FiMoon style={{ color: "var(--color-primary)" }} size={18} />
              )}
            </button>

            {/* Notification Bell */}
            {reseller && (
              <div className="relative" ref={notifRef}>
                <button
                  onClick={() => setShowNotif((v) => !v)}
                  className="flex items-center justify-center w-9 h-9 rounded-xl transition-colors relative"
                  style={{ color: "var(--color-text-primary)" }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "var(--color-surface-hover)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  <FiBell size={18} />
                  {reseller.kyc_status === "verified" && (
                    <span
                      className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full border-2"
                      style={{
                        background: "#16a34a",
                        borderColor: "var(--color-surface)",
                      }}
                    />
                  )}
                </button>

                {/* Notifications Dropdown */}
                <AnimatePresence>
                  {showNotif && (
                    <motion.div
                      initial={{ opacity: 0, y: -8, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -8, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 top-12 w-80 rounded-2xl shadow-2xl p-4 z-50 space-y-3"
                      style={{
                        background: "var(--color-surface)",
                        border: "1px solid var(--color-border)",
                      }}
                    >
                      <div
                        className="flex items-center justify-between pb-2"
                        style={{ borderBottom: "1px solid var(--color-border)" }}
                      >
                        <div
                          className="font-bold text-xs uppercase tracking-wider"
                          style={{ color: "var(--color-text-primary)" }}
                        >
                          Account Notifications
                        </div>
                        <button
                          onClick={() => setShowNotif(false)}
                          style={{ color: "var(--color-text-muted)" }}
                          className="hover:opacity-70 cursor-pointer"
                        >
                          <FiX size={16} />
                        </button>
                      </div>

                      {reseller.kyc_status === "verified" ? (
                        <div
                          className="p-3 rounded-xl text-xs space-y-1"
                          style={{
                            background: "#f0fdf4",
                            border: "1px solid #86efac",
                            color: "#14532d",
                          }}
                        >
                          <div className="font-black flex items-center gap-1">🎉 KYC Approved!</div>
                          <p className="font-medium text-[11px]">
                            Your business identity documents have been approved. Account is 100% verified.
                          </p>
                        </div>
                      ) : reseller.kyc_status === "submitted" ? (
                        <div
                          className="p-3 rounded-xl text-xs space-y-1"
                          style={{
                            background: "#f0f9ff",
                            border: "1px solid #7dd3fc",
                            color: "#0c4a6e",
                          }}
                        >
                          <div className="font-black">KYC Under Review</div>
                          <p className="font-medium text-[11px]">
                            Admin team is verifying your submitted documents.
                          </p>
                        </div>
                      ) : (
                        <div
                          className="p-3 rounded-xl text-xs space-y-1"
                          style={{
                            background: "#fffbeb",
                            border: "1px solid #fcd34d",
                            color: "#78350f",
                          }}
                        >
                          <div className="font-black">Action Required</div>
                          <p className="font-medium text-[11px]">
                            Please upload PAN and Shop photo to complete KYC verification.
                          </p>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {/* User Avatar & Menu */}
            {reseller && (
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setShowUserMenu((v) => !v)}
                  className="flex items-center gap-2.5 cursor-pointer group"
                >
                  <img
                    src={avatarUrl}
                    alt={reseller.business_name}
                    className="w-9 h-9 rounded-full"
                    style={{ border: "2px solid var(--color-border)" }}
                  />
                  <div className="hidden sm:block text-left">
                    <p
                      className="text-sm font-semibold leading-tight"
                      style={{ color: "var(--color-text-primary)" }}
                    >
                      {reseller.business_name}
                    </p>
                    <p
                      className="text-xs leading-tight truncate max-w-[140px]"
                      style={{ color: "var(--color-text-secondary)" }}
                    >
                      {reseller.email}
                    </p>
                  </div>
                  <FiChevronDown
                    size={14}
                    style={{ color: "var(--color-text-muted)" }}
                    className="hidden sm:block"
                  />
                </button>

                {/* User Dropdown */}
                <AnimatePresence>
                  {showUserMenu && (
                    <motion.ul
                      initial={{ opacity: 0, y: -8, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -8, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 top-[calc(100%+10px)] rounded-xl shadow-xl py-2 z-50 w-52"
                      style={{
                        background: "var(--color-surface)",
                        border: "1px solid var(--color-border)",
                      }}
                    >
                      <li>
                        <button
                          onClick={handleLogout}
                          className="flex items-center gap-3 w-full px-4 py-2.5 text-sm transition-colors cursor-pointer"
                          style={{ color: "var(--color-danger)" }}
                          onMouseEnter={(e) =>
                            (e.currentTarget.style.background = "var(--color-surface-hover)")
                          }
                          onMouseLeave={(e) =>
                            (e.currentTarget.style.background = "transparent")
                          }
                        >
                          <FiLogOut size={16} />
                          <span className="font-semibold">Logout</span>
                        </button>
                      </li>
                    </motion.ul>
                  )}
                </AnimatePresence>
              </div>
            )}
          </div>
        </header>

        {/* Page Body */}
        <main className="flex-1 p-6 overflow-y-auto scrollbar-hover" style={{ background: "var(--color-bg)" }}>
          <Outlet context={{ reseller }} />
        </main>
      </div>
    </div>
  );
}
