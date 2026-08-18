import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
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
} from 'react-icons/fi';
import api from '../../services/api';

const NAV_ITEMS = [
  { name: 'Installer Dashboard', icon: FiHome, path: '/dealer/portal/dashboard' },
  { name: 'Wholesale Catalogue', icon: FiPackage, path: '/dealer/portal/catalogue' },
  { name: 'My Orders & Dispatches', icon: FiShoppingCart, path: '/dealer/portal/orders' },
  { name: 'Distributor Hub', icon: FiMapPin, path: '/dealer/portal/hub' },
];

export default function DealerLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, dealer, logout } = useAuth();
  const [stats, setStats] = useState(null);

  useEffect(() => {
    api
      .get('/dealer/dashboard/stats')
      .then((res) => {
        if (res.data?.success) setStats(res.data.data);
      })
      .catch((err) => console.warn('Dealer stats fetch warning:', err.message));
  }, [location.pathname]);

  const handleLogout = async () => {
    await logout();
    navigate('/auth/login');
  };

  return (
    <div className="min-h-screen bg-[#F7FAF8] flex text-[#17211B] font-sans">
      
      {/* Sidebar */}
      <aside className="w-64 bg-[#FFFFFF] border-r border-[#DDE8E1] flex flex-col justify-between hidden md:flex shrink-0 shadow-xs">
        <div>
          {/* Brand Header */}
          <div className="p-5 border-b border-[#DDE8E1] flex items-center gap-3">
            <Link to="/" className="inline-flex items-center gap-2 group">
              <div className="w-8 h-8 rounded-lg bg-[#ECF8F1] border border-[#DDE8E1] flex items-center justify-center text-[#1F8F4E] shadow-xs">
                <FiZap className="w-4 h-4" />
              </div>
              <span className="font-heading font-black text-lg text-[#17211B] tracking-tight">
                Solar<span className="text-[#1F8F4E]">Kits</span>
              </span>
            </Link>
            <div>
              <span className="text-[10px] bg-[#F7FAF8] text-[#17211B] border border-[#DDE8E1] font-bold px-1.5 py-0.5 rounded block text-center">
                DEALER
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="p-3 space-y-1">
            <div className="px-3 py-2 text-[10px] font-bold text-[#5F6F65] uppercase tracking-widest">
              Dealer Console
            </div>
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-[#1F8F4E] text-white font-bold shadow-xs'
                      : 'text-[#5F6F65] hover:bg-[#ECF8F1] hover:text-[#17211B]'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon size={16} />
                    <span>{item.name}</span>
                  </div>
                </Link>
              );
            })}

            <div className="pt-4 px-3 py-2 text-[10px] font-bold text-[#5F6F65] uppercase tracking-widest">
              Quick Links
            </div>
            <Link
              to="/"
              className="flex items-center justify-between px-3.5 py-2 rounded-xl text-xs font-medium text-[#5F6F65] hover:bg-[#ECF8F1] hover:text-[#17211B]"
            >
              <span>Public Site</span>
              <FiArrowUpRight size={14} />
            </Link>
          </nav>
        </div>

        {/* User Footer & Logout */}
        <div className="p-4 border-t border-[#DDE8E1] bg-[#F7FAF8]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 truncate">
              <div className="w-8 h-8 rounded-full bg-[#ECF8F1] border border-[#DDE8E1] flex items-center justify-center font-bold text-xs text-[#1F8F4E] shrink-0">
                {(dealer?.business_name || user?.business_name || 'DL').substring(0, 2).toUpperCase()}
              </div>
              <div className="truncate">
                <div className="text-xs font-bold text-[#17211B] truncate">
                  {dealer?.business_name || user?.business_name || 'Dealer'}
                </div>
                <div className="text-[10px] text-[#1F8F4E] font-medium">Authorized Installer</div>
              </div>
            </div>
            <button
              onClick={handleLogout}
              title="Logout"
              className="p-2 text-[#5F6F65] hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <FiLogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <header className="h-16 bg-[#FFFFFF] border-b border-[#DDE8E1] px-6 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-[#1F8F4E] bg-[#ECF8F1] px-2.5 py-1 rounded-lg border border-[#DDE8E1] flex items-center gap-1.5">
              <FiShield className="text-[#1F8F4E]" />
              Verified Local Installer
            </span>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-xs text-[#5F6F65]">
              <span className="text-[#5F6F65]">Assigned Hub:</span>
              <span className="font-bold text-[#17211B]">Ahmedabad Central Hub</span>
            </div>
          </div>
        </header>

        {/* Dynamic Page Content */}
        <main className="flex-1 overflow-y-auto p-6 sm:p-8 bg-[#F7FAF8]">
          <Outlet />
        </main>
      </div>

    </div>
  );
}
