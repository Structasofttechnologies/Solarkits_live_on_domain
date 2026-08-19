import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiMenu,
  FiX,
  FiUser,
  FiZap,
  FiShoppingBag,
  FiShield,
  FiTrendingUp,
  FiArrowRight,
  FiCheckCircle,
} from "react-icons/fi";
import logoImg from "../../assets/images/logo.png";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { name: "Franchise Plans", href: "#plans", icon: FiZap },
    { name: "Wholesale Store", href: "#products", icon: FiShoppingBag },
    { name: "Benefits", href: "#benefits", icon: FiShield },
    { name: "ROI Calculator", href: "#calculator", icon: FiTrendingUp },
    { name: "How to Join", href: "#how-to-join", icon: FiCheckCircle },
  ];

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled
          ? "bg-white/95 backdrop-blur-md shadow-sm border-b border-slate-200 py-2.5 sm:py-3"
          : "bg-white/90 backdrop-blur-sm border-b border-slate-100 py-3 sm:py-4"
        }`}
    >
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          {/* Logo & Portal Badge */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <Link to="/" className="flex items-center gap-2 sm:gap-3 group shrink-0">
              <img
                src={logoImg}
                alt="SolarKits Logo"
                className="h-8 sm:h-10 w-auto object-contain transition-transform group-hover:scale-105"
              />
              <div className="flex flex-col border-l border-slate-200 pl-2 sm:pl-3">
                <span className="text-[9px] sm:text-[11px] font-black tracking-wider uppercase text-[#0575B8] truncate">
                  Franchisee Portal
                </span>
                <span className="hidden xs:block text-[8px] sm:text-[9px] text-[#F49222] font-extrabold tracking-wider uppercase">
                  Partner Network
                </span>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1 xl:gap-2">
            {navLinks.map((item) => (
              <a
                key={item.name}
                href={item.href}
                className="px-3.5 py-2 rounded-xl text-xs xl:text-sm font-semibold text-slate-700 hover:text-[#0575B8] hover:bg-sky-50 transition-all flex items-center gap-1.5"
              >
                <item.icon className="text-[#F49222] text-xs" />
                {item.name}
              </a>
            ))}
          </nav>

          {/* Right Action Buttons */}
          <div className="hidden md:flex items-center gap-3">
            <Link
              to="/login"
              className="px-4 py-2.5 rounded-xl text-xs xl:text-sm font-bold text-slate-700 hover:text-[#0575B8] hover:bg-slate-100 border border-slate-200 transition-all flex items-center gap-2 shadow-xs"
            >
              <FiUser className="text-[#0575B8]" />
              Partner Login
            </Link>

            <Link
              to="/register"
              className="px-5 py-2.5 rounded-xl text-xs xl:text-sm font-extrabold text-white bg-gradient-to-r from-[#0575B8] to-[#1965B0] hover:from-[#045D93] hover:to-[#0575B8] transition-all transform hover:-translate-y-0.5 shadow-md shadow-blue-500/20 flex items-center gap-2"
            >
              <span>Join Franchise Network</span>
              <FiArrowRight />
            </Link>
          </div>

          {/* Mobile Right Buttons & Hamburger */}
          <div className="flex md:hidden items-center gap-1 sm:gap-1.5 shrink-0">
            <Link
              to="/login"
              className="px-2 py-1 sm:px-2.5 sm:py-1.5 rounded-lg text-[11px] sm:text-xs font-bold text-slate-700 bg-slate-50 border border-slate-200 hover:bg-slate-100"
            >
              Login
            </Link>

            <Link
              to="/register"
              className="px-2 py-1 sm:px-2.5 sm:py-1.5 rounded-lg text-[11px] sm:text-xs font-extrabold text-white bg-[#0575B8] shadow-xs"
            >
              Join
            </Link>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-1 sm:p-1.5 rounded-lg bg-slate-100 text-slate-700 hover:text-slate-900 border border-slate-200 cursor-pointer"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <FiX size={18} /> : <FiMenu size={18} />}
            </button>
          </div>
        </div>
      </div>


      {/* Mobile Drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden bg-white border-b border-slate-200 px-4 pt-3 pb-6 space-y-3 shadow-xl"
          >
            <div className="space-y-1">
              {navLinks.map((item) => (
                <a
                  key={item.name}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-semibold text-slate-700 hover:bg-sky-50 hover:text-[#0575B8]"
                >
                  <item.icon className="text-[#F49222]" />
                  {item.name}
                </a>
              ))}
            </div>

            <div className="pt-3 border-t border-slate-100 flex flex-col gap-2">
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full py-2.5 text-center text-sm font-bold text-slate-700 bg-slate-100 rounded-xl border border-slate-200 flex items-center justify-center gap-2"
              >
                <FiUser className="text-[#0575B8]" />
                Partner Login
              </Link>
              <Link
                to="/register"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full py-2.5 text-center text-sm font-extrabold text-white bg-gradient-to-r from-[#0575B8] to-[#1965B0] rounded-xl flex items-center justify-center gap-2 shadow-md shadow-blue-500/20"
              >
                <span>Join Franchise Network</span>
                <FiArrowRight />
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
