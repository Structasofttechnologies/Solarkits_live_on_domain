import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  MdDashboard,
  MdShoppingCart,
  MdListAlt,
  MdSettings,
  MdMenu,
  MdSolarPower,
} from 'react-icons/md';
import {
  FaBoxes,
  FaSolarPanel,
  FaShoppingBag,
  FaLock,
} from 'react-icons/fa';
import {
  FiMapPin,
  FiMoon,
  FiSun,
  FiShoppingCart,
  FiLogOut,
  FiShield,
  FiChevronDown,
  FiChevronRight,
  FiSearch,
  FiUser,
  FiLayers,
  FiUsers,
  FiFileText,
  FiBox,
  FiSliders,
} from 'react-icons/fi';
import api from '../../services/api';
import logoImg from '../../assets/images/logo.png';

export default function DistributorLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, distributor, logout } = useAuth();
  const [stats, setStats] = useState(null);
  const [entitlements, setEntitlements] = useState(null);

  const activeDistributor = distributor || user || {};
  const isKycVerified =
    activeDistributor.kyc_status === 'verified' ||
    activeDistributor.kyc_status === 'approved' ||
    activeDistributor.lifecycle_status === 'active';

  // Top header state
  const [isDark, setIsDark] = useState(false);
  const [cartCount, setCartCount] = useState(2);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 1024);
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth > 1024);
  const userMenuRef = useRef(null);

  // Catalog Dropdown State (Open by default if currently on a catalog page)
  const isCatalogActive =
    location.pathname.includes('/portal/procure') ||
    location.pathname.includes('/portal/combo-kits') ||
    location.pathname.includes('/portal/custom-kits') ||
    location.pathname.includes('/portal/bos-kits') ||
    location.pathname.includes('/portal/catalogue');

  const [catalogDropdownOpen, setCatalogDropdownOpen] = useState(true);

  useEffect(() => {
    if (isCatalogActive) {
      setCatalogDropdownOpen(true);
    }
  }, [location.pathname, isCatalogActive]);

  useEffect(() => {
    // Load dashboard stats & plan entitlements
    api
      .get('/distributor/dashboard/stats')
      .then((res) => {
        if (res.data?.success) setStats(res.data.data);
      })
      .catch((err) => console.warn('Distributor stats fetch warning:', err.message));

    api
      .get('/distributor/entitlements')
      .then((res) => {
        if (res.data?.success) setEntitlements(res.data.entitlements);
      })
      .catch((err) => console.warn('Entitlements fetch warning:', err.message));
  }, [location.pathname]);

  // Handle outside click for user menu
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/auth/login');
  };

  // Sub-items under "My Catalog"
  const catalogSubItems = [
    {
      name: 'Combo BOS Kit',
      path: '/distributor/portal/combo-kits',
      icon: <FaSolarPanel size={14} />,
    },
    {
      name: 'Customization BOS Kit',
      path: '/distributor/portal/custom-kits',
      icon: <MdSettings size={15} />,
    },
  ];

  const businessName = distributor?.business_name || user?.business_name || 'Customer Account';
  const userEmail = distributor?.email || user?.email || 'customer@solarkits.com';
  const initials = businessName.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase() || 'CA';

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans text-slate-800 antialiased">
      
      {/* ── Top Global Navbar ──────────────────────────────────────────────── */}
      <header className="h-16 bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between z-30 sticky top-0 shadow-xs">
        
        {/* Left Side: Brand Logo */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 md:hidden cursor-pointer"
          >
            <MdMenu size={22} />
          </button>

          <Link to="/distributor/portal/dashboard" className="flex items-center">
            <img
              src={logoImg}
              alt="SolarKits"
              className="h-8 sm:h-9 object-contain"
            />
          </Link>
        </div>

        {/* Right Side: Theme, In-Dashboard Cart, User Account */}
        <div className="flex items-center space-x-4">
          
          {/* Dark / Light Mode Toggle */}
          <button
            onClick={() => setIsDark(!isDark)}
            className="p-2 text-slate-600 hover:text-blue-600 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
            title="Toggle theme"
          >
            {isDark ? <FiSun size={17} className="text-amber-500" /> : <FiMoon size={17} />}
          </button>

          {/* In-Dashboard Shopping Cart Icon with Badge */}
          <Link
            to="/distributor/portal/cart"
            className="relative p-2 text-slate-700 hover:text-blue-600 hover:bg-slate-100 rounded-full transition-colors"
            title="Procurement Cart"
          >
            <FiShoppingCart size={19} />
            {cartCount > 0 && (
              <span className="absolute top-0 right-0 bg-red-600 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center border-2 border-white shadow-xs">
                {cartCount}
              </span>
            )}
          </Link>

          {/* User Profile Pill */}
          <div className="relative" ref={userMenuRef}>
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2.5 p-1 rounded-full hover:bg-slate-100 transition-colors cursor-pointer text-left"
            >
              <div className="w-8 h-8 rounded-full bg-[#1E3A8A] text-white flex items-center justify-center font-black text-xs shadow-xs">
                {initials}
              </div>
              <div className="hidden lg:block leading-tight">
                <div className="text-xs font-bold text-slate-900 truncate max-w-[130px]">
                  {businessName}
                </div>
                <div className="text-[10px] text-slate-500 truncate max-w-[130px]">
                  {userEmail}
                </div>
              </div>
              <FiChevronDown size={14} className="text-slate-400 hidden lg:block" />
            </button>

            {/* Dropdown Menu */}
            {showUserMenu && (
              <div className="absolute right-0 top-full mt-2 w-64 bg-white border border-slate-200 rounded-2xl shadow-xl py-2 z-50 animate-in fade-in zoom-in-95 duration-100">
                <div className="px-4 py-3 border-b border-slate-100">
                  <div className="font-bold text-xs text-slate-900">{businessName}</div>
                  <div className="text-[11px] text-slate-500 truncate">{userEmail}</div>
                  <div className="mt-2 flex items-center gap-1.5">
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                      <FiShield size={10} /> KYC Verified
                    </span>
                  </div>
                </div>

                {/* Shifted Account Settings Links */}
                <div className="py-1">
                  <Link
                    to="/distributor/portal/plan"
                    onClick={() => setShowUserMenu(false)}
                    className="flex items-center gap-3 px-4 py-2.5 text-xs text-slate-700 hover:bg-slate-50 font-semibold transition-colors"
                  >
                    <FiShield size={15} className="text-blue-600" />
                    <span>Subscription Plans</span>
                  </Link>
                  <Link
                    to="/distributor/portal/territory"
                    onClick={() => setShowUserMenu(false)}
                    className="flex items-center gap-3 px-4 py-2.5 text-xs text-slate-700 hover:bg-slate-50 font-semibold transition-colors"
                  >
                    <FiMapPin size={15} className="text-blue-600" />
                    <span>My Territories</span>
                  </Link>
                  <Link
                    to="/distributor/portal/onboarding?stage=4"
                    onClick={() => setShowUserMenu(false)}
                    className="flex items-center gap-3 px-4 py-2.5 text-xs text-slate-700 hover:bg-slate-50 font-semibold transition-colors"
                  >
                    <FiFileText size={15} className="text-blue-600" />
                    <span>KYC & Compliance Dossier</span>
                  </Link>
                  <Link
                    to="/"
                    onClick={() => setShowUserMenu(false)}
                    className="flex items-center gap-3 px-4 py-2.5 text-xs text-slate-700 hover:bg-slate-50 font-semibold transition-colors"
                  >
                    <MdSolarPower size={16} className="text-amber-600" />
                    <span>Public Marketplace</span>
                  </Link>
                </div>

                <div className="pt-1 border-t border-slate-100">
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2.5 text-xs text-red-600 hover:bg-red-50 font-bold flex items-center gap-2 transition-colors cursor-pointer"
                  >
                    <FiLogOut size={14} /> Logout
                  </button>
                </div>
              </div>
            )}
          </div>

        </div>
      </header>

      {/* ── Main Layout (Sidebar + Content) ─────────────────────────────────── */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Left Sidebar */}
        <aside
          className={`w-60 bg-white border-r border-slate-200 flex flex-col justify-between shrink-0 shadow-xs transition-all duration-200 z-20 ${
            sidebarOpen ? 'block' : 'hidden md:flex'
          }`}
        >
          <div className="py-4 overflow-y-auto">
            <nav className="px-2 space-y-1">
              
              {/* 1. Dashboard Link */}
              <Link
                to="/distributor/portal/dashboard"
                className={`flex items-center justify-between w-full px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  location.pathname === '/distributor/portal/dashboard'
                    ? 'bg-[#185ADB] text-white font-bold shadow-sm'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className={location.pathname === '/distributor/portal/dashboard' ? 'text-white' : 'text-blue-700'}>
                    <MdDashboard size={18} />
                  </span>
                  <span>Dashboard</span>
                </div>
              </Link>

              {/* Section Header: Buy Stock */}
              <div className="pt-2 px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Factory Stock Procurement
              </div>

              {/* 2. My Catalog (Collapsible Dropdown containing Combo BOS Kit & Customer BOS Kit) */}
              <div className="space-y-1">
                <button
                  type="button"
                  onClick={() => setCatalogDropdownOpen(!catalogDropdownOpen)}
                  className={`flex items-center justify-between w-full px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    isCatalogActive && !catalogDropdownOpen
                      ? 'bg-blue-50 text-blue-700 border border-blue-200 font-bold'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-blue-700">
                      <FaShoppingBag size={16} />
                    </span>
                    <span>Procure Equipment</span>
                  </div>
                  <span className="text-slate-400">
                    {catalogDropdownOpen ? <FiChevronDown size={14} /> : <FiChevronRight size={14} />}
                  </span>
                </button>

                {/* Submenu Dropdown List */}
                {catalogDropdownOpen && (
                  <div className="pl-4 pr-1 py-1 space-y-1 border-l-2 border-blue-100 ml-4 animate-in fade-in duration-150">
                    {catalogSubItems.map((sub) => {
                      const isSubActive = location.pathname === sub.path;

                      return (
                        <Link
                          key={sub.path}
                          to={sub.path}
                          className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                            isSubActive
                              ? 'bg-[#185ADB] text-white font-bold shadow-xs'
                              : 'text-slate-600 hover:bg-blue-50 hover:text-blue-700'
                          }`}
                        >
                          <span className={isSubActive ? 'text-white' : 'text-blue-600'}>
                            {sub.icon}
                          </span>
                          <span>{sub.name}</span>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Section Header: Resell to Dealers */}
              <div className="pt-3 px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Dealer Reselling & Margins
              </div>

              {/* 3. Dealer Margin & Pricing Control Manager */}
              <Link
                to="/distributor/portal/dealer-margins"
                className={`flex items-center justify-between w-full px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  location.pathname === '/distributor/portal/dealer-margins' || location.pathname === '/distributor/portal/catalogue'
                    ? 'bg-[#185ADB] text-white font-bold shadow-sm'
                    : 'text-emerald-800 bg-emerald-50/70 hover:bg-emerald-100/80 border border-emerald-200/50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className={location.pathname === '/distributor/portal/dealer-margins' ? 'text-white' : 'text-emerald-600'}>
                    <FiSliders size={17} />
                  </span>
                  <span>Set Dealer Margins</span>
                </div>
                <span
                  className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded ${
                    location.pathname === '/distributor/portal/dealer-margins'
                      ? 'bg-white text-blue-800'
                      : 'bg-emerald-200 text-emerald-900'
                  }`}
                >
                  Set Profit
                </span>
              </Link>

              {/* 4. Sub-Dealer Network */}
              <Link
                to="/distributor/portal/dealers"
                className={`flex items-center justify-between w-full px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  location.pathname === '/distributor/portal/dealers'
                    ? 'bg-[#185ADB] text-white font-bold shadow-sm'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className={location.pathname === '/distributor/portal/dealers' ? 'text-white' : 'text-blue-700'}>
                    <FaBoxes size={17} />
                  </span>
                  <span>Sub-Dealer Network</span>
                </div>
              </Link>

              {/* 5. Dealer Applications */}
              <Link
                to="/distributor/portal/dealer-applications"
                className={`flex items-center justify-between w-full px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  location.pathname === '/distributor/portal/dealer-applications'
                    ? 'bg-[#185ADB] text-white font-bold shadow-sm'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className={location.pathname === '/distributor/portal/dealer-applications' ? 'text-white' : 'text-blue-700'}>
                    <MdListAlt size={19} />
                  </span>
                  <span>Dealer Applications</span>
                </div>
              </Link>

              {/* Section Header: Orders & Compliance */}
              <div className="pt-3 px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Orders & Compliance
              </div>

              {/* 6. Wholesale Cart */}
              <Link
                to="/distributor/portal/cart"
                className={`flex items-center justify-between w-full px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  location.pathname === '/distributor/portal/cart'
                    ? 'bg-[#185ADB] text-white font-bold shadow-sm'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className={location.pathname === '/distributor/portal/cart' ? 'text-white' : 'text-blue-700'}>
                    <MdShoppingCart size={18} />
                  </span>
                  <span>Wholesale Cart</span>
                </div>
                {cartCount > 0 && (
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                      location.pathname === '/distributor/portal/cart'
                        ? 'bg-white text-blue-800'
                        : 'bg-red-100 text-red-700'
                    }`}
                  >
                    {cartCount}
                  </span>
                )}
              </Link>

              {/* 6. KYC Verification Dossier */}
              <Link
                to="/distributor/portal/kyc"
                className={`flex items-center justify-between w-full px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  location.pathname.includes('/portal/kyc') || location.pathname.includes('/portal/onboarding')
                    ? 'bg-[#185ADB] text-white font-bold shadow-sm'
                    : isKycVerified
                    ? 'text-emerald-700 bg-emerald-50/60 hover:bg-emerald-100/80'
                    : 'text-amber-800 bg-amber-50 hover:bg-amber-100'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className={location.pathname.includes('/portal/kyc') ? 'text-white' : isKycVerified ? 'text-emerald-600' : 'text-amber-600'}>
                    <FiShield size={17} />
                  </span>
                  <span>KYC Verification</span>
                </div>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    isKycVerified
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-amber-200 text-amber-900 animate-pulse'
                  }`}
                >
                  {isKycVerified ? 'Complete' : 'Pending'}
                </span>
              </Link>

              {/* 7. Settings */}
              <Link
                to="/distributor/portal/settings"
                className={`flex items-center justify-between w-full px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  location.pathname === '/distributor/portal/settings'
                    ? 'bg-[#185ADB] text-white font-bold shadow-sm'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className={location.pathname === '/distributor/portal/settings' ? 'text-white' : 'text-blue-700'}>
                    <MdSettings size={18} />
                  </span>
                  <span>Settings</span>
                </div>
              </Link>

            </nav>
          </div>

          {/* Sidebar Footer Logout */}
          <div className="p-3 border-t border-slate-200">
            <button
              onClick={handleLogout}
              className="flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-xs font-semibold text-slate-500 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
            >
              <FiLogOut size={15} />
              <span>Sign Out</span>
            </button>
          </div>
        </aside>

        {/* Right Content Viewport */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-[#F8FAFC]">
          {!isKycVerified && !location.pathname.includes('/portal/kyc') && !location.pathname.includes('/portal/onboarding') && (
            <div className="mb-6 p-4 rounded-2xl bg-amber-50 border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-amber-900 shadow-xs">
              <div className="flex items-center gap-2.5">
                <FiShield className="text-amber-600 shrink-0" size={18} />
                <div>
                  <strong className="block font-bold text-amber-950">1-Time KYC Document Verification Required</strong>
                  <span>Please upload your business registration documents to activate your full dealer network and wholesale cart.</span>
                </div>
              </div>
              <Link
                to="/distributor/portal/kyc"
                className="px-4 py-2 rounded-xl text-xs font-bold bg-[#185ADB] text-white hover:bg-blue-700 shadow-sm shrink-0 text-center"
              >
                Complete KYC Now ➔
              </Link>
            </div>
          )}
          <Outlet />
        </main>

      </div>

    </div>
  );
}
