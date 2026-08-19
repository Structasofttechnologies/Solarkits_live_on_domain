import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  MdDashboard,
  MdShoppingCart,
  MdListAlt,
  MdSettings,
  MdMenu,
} from 'react-icons/md';
import {
  FaShoppingBag,
  FaBoxes,
} from 'react-icons/fa';
import {
  FiHome,
  FiPackage,
  FiShoppingCart,
  FiTruck,
  FiLogOut,
  FiShield,
  FiArrowUpRight,
  FiMapPin,
  FiZap,
  FiMoon,
  FiSun,
} from 'react-icons/fi';
import { useDealerCart } from '../../context/DealerCartContext';
import api from '../../services/api';
import logoImg from '../../assets/images/logo.png';

const NAV_ITEMS = [
  { name: 'Installer Dashboard', icon: <MdDashboard size={18} />, path: '/dealer/portal/dashboard' },
  { name: 'Wholesale Catalogue', icon: <FaShoppingBag size={16} />, path: '/dealer/portal/catalogue' },
  { name: 'Procurement Cart', icon: <FiShoppingCart size={17} />, path: '/dealer/portal/cart' },
  { name: 'My Orders & Dispatches', icon: <MdListAlt size={18} />, path: '/dealer/portal/orders' },
  { name: 'Distributor Hub', icon: <FiMapPin size={17} />, path: '/dealer/portal/hub' },
];

export default function DealerLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, dealer, logout } = useAuth();
  const { totalItemsCount, openDrawer } = useDealerCart();
  const [stats, setStats] = useState(null);
  const [isDark, setIsDark] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const userMenuRef = useRef(null);

  useEffect(() => {
    api
      .get('/dealer/dashboard/stats')
      .then((res) => {
        if (res.data?.success) setStats(res.data.data);
      })
      .catch((err) => console.warn('Dealer stats fetch warning:', err.message));
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

  const businessName = dealer?.business_name || user?.business_name || 'Dealer Solar Account';
  const userEmail = dealer?.email || user?.email || 'dealer@solarkits.in';
  const initials = businessName.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase() || 'DL';

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans text-slate-800 antialiased">
      
      {/* ── Top Global Navbar ──────────────────────────────────────────────── */}
      <header className="h-16 bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between z-30 sticky top-0 shadow-xs">
        
        {/* Left Side: Brand Logo */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 md:hidden"
          >
            <MdMenu size={22} />
          </button>

          <Link to="/dealer/portal/dashboard" className="flex items-center gap-2">
            <img
              src={logoImg}
              alt="SolarKits"
              className="h-8 sm:h-9 object-contain"
            />
            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
              DEALER
            </span>
          </Link>
        </div>

        {/* Right Side: Theme, Cart, User Account */}
        <div className="flex items-center space-x-4">
          
          {/* Dark / Light Mode Toggle */}
          <button
            onClick={() => setIsDark(!isDark)}
            className="p-2 text-slate-600 hover:text-blue-600 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
            title="Toggle theme"
          >
            {isDark ? <FiSun size={17} className="text-amber-500" /> : <FiMoon size={17} />}
          </button>

          {/* Shopping Cart Icon with Live Badge */}
          <Link
            to="/dealer/portal/cart"
            className="relative p-2 text-slate-700 hover:text-blue-600 hover:bg-slate-100 rounded-full transition-colors"
            title="Procurement Cart"
          >
            <FiShoppingCart size={19} />
            {totalItemsCount > 0 && (
              <span className="absolute top-0 right-0 bg-red-600 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center border-2 border-white shadow-xs">
                {totalItemsCount}
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
            </button>

            {/* Dropdown Menu */}
            {showUserMenu && (
              <div className="absolute right-0 top-full mt-2 w-56 bg-white border border-slate-200 rounded-2xl shadow-xl py-2 z-50 animate-in fade-in zoom-in-95 duration-100">
                <div className="px-4 py-2 border-b border-slate-100">
                  <div className="font-bold text-xs text-slate-900">{businessName}</div>
                  <div className="text-[10px] text-slate-500">{userEmail}</div>
                  <span className="inline-block mt-1 text-[9px] font-bold bg-blue-50 text-blue-700 px-2 py-0.5 rounded border border-blue-200">
                    Authorized Solar Dealer
                  </span>
                </div>
                <Link
                  to="/dealer/portal/hub"
                  className="block px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 font-medium"
                >
                  Distributor Hub
                </Link>
                <Link
                  to="/dealer/portal/orders"
                  className="block px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 font-medium"
                >
                  My Orders & Dispatches
                </Link>
                <Link
                  to="/"
                  className="block px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 font-medium"
                >
                  Public Marketplace
                </Link>
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2 text-xs text-red-600 hover:bg-red-50 font-bold border-t border-slate-100 flex items-center gap-1.5 cursor-pointer"
                >
                  <FiLogOut size={13} /> Logout
                </button>
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
              <div className="px-3 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Dealer Console
              </div>
              {NAV_ITEMS.map((item) => {
                const isActive = location.pathname === item.path;

                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center justify-between w-full px-3 py-2.5 rounded-lg text-xs font-semibold transition-all ${
                      isActive
                        ? 'bg-[#185ADB] text-white font-bold shadow-sm'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className={isActive ? 'text-white' : 'text-blue-700'}>
                        {item.icon}
                      </span>
                      <span>{item.name}</span>
                    </div>
                  </Link>
                );
              })}

              <div className="pt-4 px-3 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Quick Links
              </div>
              <Link
                to="/"
                className="flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              >
                <span>Public Site</span>
                <FiArrowUpRight size={14} />
              </Link>
            </nav>
          </div>

          {/* Sidebar Footer Logout */}
          <div className="p-3 border-t border-slate-200">
            <button
              onClick={handleLogout}
              className="flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-xs font-semibold text-slate-500 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
            >
              <FiLogOut size={16} />
              <span>Sign Out</span>
            </button>
          </div>
        </aside>

        {/* Dynamic Page Content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-[#F8FAFC]">
          <div className="max-w-7xl mx-auto space-y-6">
            <Outlet />
          </div>
        </main>

      </div>

    </div>
  );
}
