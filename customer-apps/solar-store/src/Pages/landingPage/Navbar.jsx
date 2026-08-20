import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  FiMenu, FiX, FiSearch, FiShoppingCart, FiPhone,
  FiChevronDown, FiChevronRight, FiUser
} from "react-icons/fi";
import logo from "../../assets/images/logo.png";

const NAV_ITEMS = [
  {
    label: "Solar Panels",
    href: "#products",
    dropdown: ["Monocrystalline Panels", "Polycrystalline Panels", "Bifacial Panels", "Half-Cut Panels"],
  },
  {
    label: "Inverters",
    href: "#products",
    dropdown: ["On-Grid Inverters", "Off-Grid Inverters", "Hybrid Inverters", "Micro Inverters"],
  },
  {
    label: "Accessories",
    href: "#products",
    dropdown: ["Mounting Structures", "Solar Cables", "DC Combiner Box", "Solar Charge Controllers"],
  },
  {
    label: "Solar Kits",
    href: "#products",
    dropdown: ["1kW Home Kit", "3kW Home Kit", "5kW Home Kit", "10kW Commercial Kit"],
  },
  { label: "🔥 Offers", href: "#offers", dropdown: null },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [cartCount] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [menuOpen]);

  const handleNavClick = (href) => {
    setMenuOpen(false);
    setActiveDropdown(null);
    if (href.startsWith("#")) {
      const el = document.querySelector(href);
      if (el) el.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <>
      {/* ── Announcement Bar ── */}
      <div className="bg-primary-700 text-white text-xs font-medium overflow-hidden">
        <div className="flex items-center justify-center gap-0">
          <div className="marquee-inner py-2 gap-10 flex">
            {[
              "⚡ India's Trusted Solar Marketplace",
              "🎁 Free Delivery on Orders Above ₹5,000",
              "📋 GST Invoice on Every Order",
              "📞 Solar Helpline: 1800-XXX-XXXX",
              "🏷️ Upto 40% Off on Solar Kits",
              "✅ BIS & MNRE Certified Products",
              "🌱 25-Year Performance Warranty",
              "⚡ India's Trusted Solar Marketplace",
              "🎁 Free Delivery on Orders Above ₹5,000",
              "📋 GST Invoice on Every Order",
              "📞 Solar Helpline: 1800-XXX-XXXX",
              "🏷️ Upto 40% Off on Solar Kits",
              "✅ BIS & MNRE Certified Products",
              "🌱 25-Year Performance Warranty",
            ].map((text, i) => (
              <span key={i} className="whitespace-nowrap px-6">{text}</span>
            ))}
          </div>
        </div>
      </div>

      {/* ── Main Navbar ── */}
      <motion.nav
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className={`sticky top-0 z-50 transition-all duration-300 ${scrolled
          ? "bg-white/97 backdrop-blur-xl shadow-lg border-b border-gray-100"
          : "bg-white/90 backdrop-blur-lg border-b border-gray-100/60"
          }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16 lg:h-18">

            {/* Logo */}
            <motion.div
              className="flex-shrink-0 cursor-pointer"
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <img
                src={logo}
                alt="SolarKits — A Solar Marketplace"
                className="h-9 lg:h-11 w-auto object-contain"
              />
            </motion.div>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center gap-1">
              {NAV_ITEMS.map((item) => (
                <div
                  key={item.label}
                  className="relative group"
                  onMouseEnter={() => setActiveDropdown(item.label)}
                  onMouseLeave={() => setActiveDropdown(null)}
                >
                  <button
                    onClick={() => handleNavClick(item.href)}
                    className="flex items-center gap-1 px-3 py-2 text-gray-700 text-sm font-semibold rounded-lg hover:text-primary-500 hover:bg-blue-50 transition-all duration-200"
                  >
                    {item.label}
                    {item.dropdown && (
                      <FiChevronDown
                        className={`text-xs transition-transform duration-200 ${activeDropdown === item.label ? "rotate-180" : ""}`}
                      />
                    )}
                  </button>

                  {/* Dropdown */}
                  {item.dropdown && (
                    <AnimatePresence>
                      {activeDropdown === item.label && (
                        <motion.div
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 8 }}
                          transition={{ duration: 0.18 }}
                          className="absolute top-full left-0 mt-1 w-52 bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-50"
                        >
                          {item.dropdown.map((sub) => (
                            <button
                              key={sub}
                              className="w-full text-left px-4 py-2.5 text-sm text-gray-600 hover:text-primary-500 hover:bg-blue-50 transition-colors"
                            >
                              {sub}
                            </button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  )}
                </div>
              ))}
            </div>

            {/* Right Actions */}
            <div className="flex items-center gap-2">

              {/* Login */}
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="hidden md:flex items-center gap-2 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white text-sm font-semibold rounded-lg transition-all shadow-sm"
              >
                <FiUser className="text-sm" />
                Login
              </motion.button>

              {/* Mobile hamburger */}
              <motion.button
                onClick={() => setMenuOpen(!menuOpen)}
                whileTap={{ scale: 0.92 }}
                className="lg:hidden p-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-all"
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
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-navy/40 backdrop-blur-sm z-40 lg:hidden"
              onClick={() => setMenuOpen(false)}
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="fixed top-0 right-0 bottom-0 w-80 bg-white z-50 overflow-y-auto shadow-2xl lg:hidden"
            >
              {/* Mobile menu header */}
              <div className="flex items-center justify-between p-4 border-b border-gray-100">
                <img src={logo} alt="SolarKits" className="h-8 w-auto" />
                <button
                  onClick={() => setMenuOpen(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <FiX className="text-xl text-gray-600" />
                </button>
              </div>

              {/* Mobile nav items */}
              <div className="p-4 space-y-1">
                {NAV_ITEMS.map((item, i) => (
                  <motion.div
                    key={item.label}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <button
                      onClick={() => handleNavClick(item.href)}
                      className="w-full flex items-center justify-between p-3.5 text-gray-700 font-semibold text-sm hover:bg-blue-50 hover:text-primary-500 rounded-xl transition-all"
                    >
                      <span>{item.label}</span>
                      <FiChevronRight className="text-gray-400" />
                    </button>
                  </motion.div>
                ))}
              </div>

              <div className="border-t border-gray-100 p-4 space-y-3 mt-2">
                <button className="w-full py-3 bg-primary-50 text-primary-600 font-semibold rounded-xl text-sm hover:bg-primary-100 transition-all">
                  Sign In
                </button>
                <button className="w-full py-3 bg-primary-500 text-white font-semibold rounded-xl text-sm hover:bg-primary-600 transition-all shadow-sm">
                  Create Account
                </button>
              </div>

              {/* Mobile contact */}
              <div className="p-4 bg-solarbg rounded-2xl mx-4 mb-4">
                <p className="text-xs text-gray-500 mb-1">Need Help?</p>
                <a href="tel:1800XXXXXXX" className="text-primary-600 font-bold text-base flex items-center gap-2">
                  <FiPhone /> 1800-XXX-XXXX
                </a>
                <p className="text-xs text-gray-400 mt-1">Mon–Sat, 9AM – 6PM</p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
