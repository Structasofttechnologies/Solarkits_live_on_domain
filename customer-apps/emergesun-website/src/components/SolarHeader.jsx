import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, ChevronDown, Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import CountryDropdown from './CountryDropdown';

export default function SolarHeader() {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [erpDropdownOpen, setErpDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileDropdownOpen, setMobileDropdownOpen] = useState(false);
  const [mobileErpDropdownOpen, setMobileErpDropdownOpen] = useState(false);
  const navigate = useNavigate();
  const softwareDropdownRef = useRef(null);
  const erpDropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (softwareDropdownRef.current && !softwareDropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
      if (erpDropdownRef.current && !erpDropdownRef.current.contains(event.target)) {
        setErpDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const pathMap = {
    "/solar-installer-marketplace": "/solar-installer",
    "/solar-dealer-app": "/solar-dealer",
    "/mega-watt-project-management": "/megawatt-project",
    "/solar-amc-management": "/solar-amc",
    "/erp": "/erp",
    "/solar-business-erp": "/erp",
    "/solar-installer": "/solar-installer",
    "/solar-dealer": "/solar-dealer",
    "/megawatt-project": "/megawatt-project",
    "/solar-amc": "/solar-amc"
  };

  const [menuTitle, setMenuTitle] = useState("Our Solar Software");
  const [softwareOptions, setSoftwareOptions] = useState([
    { label: 'Solar Installer Marketplace', path: '/solar-installer' },
    { label: 'Solar Dealer App', path: '/solar-dealer' },
    { label: "Solar Business Erp", path: "/erp" },
    { label: 'Solar Mega Watt Project Management', path: '/megawatt-project' },
    { label: 'Solar AMC Management', path: '/solar-amc' },
  ]);

  const BASE_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

  useEffect(() => {
    fetch(`${BASE_URL}/api/website/v1/services/get?t=${Date.now()}`)
      .then(res => res.json())
      .then(data => {
        if (data?.success && data?.data) {
          const cfg = data.data;
          if (cfg.menuTitle) setMenuTitle(cfg.menuTitle);
          if (Array.isArray(cfg.services) && cfg.services.length > 0) {
            const activeOptions = cfg.services
              .filter(s => s.status === "Active")
              .sort((a, b) => (a.order || 0) - (b.order || 0))
              .map(s => ({
                label: s.name,
                path: pathMap[s.slug] || s.slug
              }));
            if (activeOptions.length > 0) {
              setSoftwareOptions(activeOptions);
            }
          }
        }
      })
      .catch(err => console.error("Error fetching header services config:", err));
  }, []);

  const erpModuleOptions = [
    { label: 'Finance & Accounting' },
    { label: 'Inventory Management' },
    { label: 'HR Management' },
    { label: 'Payroll' },
    { label: 'Procurement' },
    { label: 'Production Planning' },
    { label: 'Sales & CRM' },
    { label: 'Business Intelligence' },
    { label: 'Project Management' },
    { label: 'Supply Chain' },
    { label: 'Customer Support' },
    { label: 'Compliance & Security' },
  ];

  const handleErpModuleClick = () => {
    setErpDropdownOpen(false);
    setMobileMenuOpen(false);
    setMobileErpDropdownOpen(false);

    if (window.location.pathname === '/') {
      const el = document.getElementById('modules');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    } else {
      navigate('/');
      setTimeout(() => {
        const el = document.getElementById('modules');
        if (el) {
          el.scrollIntoView({ behavior: 'smooth' });
        }
      }, 300);
    }
  };

  const handleMobileNav = (path) => {
    navigate(path);
    setMobileMenuOpen(false);
    setMobileDropdownOpen(false);
    setMobileErpDropdownOpen(false);
  };

  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-white/20 bg-white/70 backdrop-blur-md px-4 py-4 shadow-sm md:px-6 lg:px-8 transition-all">
        <div className="mx-auto flex max-w-[1440px] items-center justify-between">

          {/* LOGO SECTION */}
          <Link to="/" className="flex items-center group">
            <img
              src="/logo.png"
              alt="EmergeSun"
              className="h-14 md:h-16 w-auto object-contain group-hover:opacity-90 transition-opacity"
            />
          </Link>

          {/* DESKTOP NAVIGATION */}
          <nav className="hidden xl:flex items-center space-x-6">
            <Link
              to="/"
              className="relative text-lg font-bold text-gray-700 hover:text-primary transition-colors py-1 group whitespace-nowrap"
            >
              Home
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary transition-all group-hover:w-full" />
            </Link>

            {/* Software Dropdown */}
            <div className="relative" ref={softwareDropdownRef}>
              <button
                onClick={() => {
                  setDropdownOpen(!dropdownOpen);
                  setErpDropdownOpen(false);
                }}
                className="flex items-center space-x-1.5 text-lg font-bold text-gray-700 hover:text-primary transition-colors focus:outline-none py-1 whitespace-nowrap group"
              >
                <span>{menuTitle}</span>
                <ChevronDown className={`h-5 w-5 text-primary group-hover:scale-110 transition-transform duration-300 ${dropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              <AnimatePresence>
                {dropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 15 }}
                    transition={{ duration: 0.2 }}
                    className="absolute left-0 mt-2 w-72 rounded-xl bg-white/95 backdrop-blur-md py-3 shadow-xl ring-1 ring-black/5 border border-gray-100"
                  >
                    {softwareOptions.map((option) => (
                      <button
                        key={option.path}
                        onClick={() => {
                          navigate(option.path);
                          setDropdownOpen(false);
                        }}
                        className="block w-full px-4 py-2.5 text-left text-sm font-bold text-gray-600 hover:bg-gradient-to-r hover:from-primary/10 hover:to-orange/10 hover:text-primary transition-all rounded-lg mx-2 w-[calc(100%-16px)]"
                      >
                        {option.label}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <Link
              to="/about"
              className="relative text-lg font-bold text-gray-700 hover:text-primary transition-colors py-1 group whitespace-nowrap"
            >
              About us
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary transition-all group-hover:w-full" />
            </Link>

            <Link
              to="/contact"
              className="relative text-lg font-bold text-gray-700 hover:text-primary transition-colors py-1 group whitespace-nowrap"
            >
              Contact us
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary transition-all group-hover:w-full" />
            </Link>

            {/* Solar Shop Link */}
            <Link
              to="/solar-shop"
              className="flex items-center space-x-2 text-lg font-bold text-gray-700 hover:text-primary transition-colors py-1 group whitespace-nowrap"
            >
              <ShoppingCart className="h-6 w-6 text-primary group-hover:scale-110 transition-transform" />
              <span>Solar Shop</span>
            </Link>
          </nav>

          {/* DESKTOP ACTIONS */}
          <div className="hidden xl:flex items-center space-x-6">
            <CountryDropdown />
            <Link
              to="/login"
              className="inline-block rounded-xl bg-gradient-to-r from-primary to-blue-700 text-white font-bold px-5 py-2.5 shadow-md shadow-primary/20 hover:shadow-lg hover:shadow-primary/30 hover:scale-[1.02] active:scale-[0.98] transition-all whitespace-nowrap"
            >
              Signup/Login
            </Link>
          </div>

          {/* MOBILE MENU BUTTON */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="block xl:hidden text-gray-700 hover:text-primary focus:outline-none"
          >
            {mobileMenuOpen ? <X className="h-7 w-7" /> : <Menu className="h-7 w-7" />}
          </button>
        </div>

        {/* MOBILE NAVIGATION DRAWER */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="xl:hidden mt-4 border-t border-gray-100 pt-4 pb-2 space-y-3 max-h-[calc(100vh-90px)] overflow-y-auto scrollbar-none"
            >
              <button
                onClick={() => handleMobileNav('/')}
                className="block w-full text-left text-base font-bold text-gray-700 hover:text-primary py-2 px-2 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Solar Business Erp
              </button>

              {/* Mobile Software Dropdown */}
              <div className="space-y-1">
                <button
                  onClick={() => setMobileDropdownOpen(!mobileDropdownOpen)}
                  className="flex w-full items-center justify-between text-base font-bold text-gray-700 hover:text-primary py-2 px-2 rounded-lg hover:bg-gray-50 transition-colors text-left"
                >
                  <span>{menuTitle}</span>
                  <ChevronDown className={`h-5 w-5 text-primary transition-transform duration-300 ${mobileDropdownOpen ? 'rotate-180' : ''}`} />
                </button>
                {mobileDropdownOpen && (
                  <div className="pl-6 border-l-2 border-gray-100 space-y-2 py-1">
                    {softwareOptions.map((option) => (
                      <button
                        key={option.path}
                        onClick={() => handleMobileNav(option.path)}
                        className="block w-full text-left text-sm font-semibold text-gray-500 hover:text-primary py-1"
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <button
                onClick={() => handleMobileNav('/about')}
                className="block w-full text-left text-base font-bold text-gray-700 hover:text-primary py-2 px-2 rounded-lg hover:bg-gray-50 transition-colors"
              >
                About us
              </button>

              <button
                onClick={() => handleMobileNav('/contact')}
                className="block w-full text-left text-base font-bold text-gray-700 hover:text-primary py-2 px-2 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Contact us
              </button>

              <button
                onClick={() => handleMobileNav('/solar-shop')}
                className="flex w-full items-center space-x-2 text-base font-bold text-gray-700 hover:text-primary py-2 px-2 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <ShoppingCart className="h-5 w-5 text-primary" />
                <span>Solar Shop</span>
              </button>

              <div className="py-2 border-t border-gray-100 mt-2">
                <CountryDropdown isMobile={true} />
              </div>

              <button
                onClick={() => handleMobileNav('/login')}
                className="block w-full text-center text-base font-bold text-white bg-gradient-to-r from-primary to-blue-700 py-3 rounded-xl shadow-md"
              >
                Signup/Login
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </header>
      {/* Spacer to prevent content overlapping behind fixed header */}
      <div className="h-[73px] md:h-[81px] lg:h-[84px] w-full" />
    </>
  );
}
