import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  FiHome,
  FiUsers,
  FiFileText,
  FiMapPin,
  FiLayers,
  FiPackage,
  FiLogOut,
  FiShield,
  FiArrowUpRight,
  FiDollarSign,
  FiZap,
} from 'react-icons/fi';
import api from '../../services/api';

export default function DistributorLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, distributor, logout } = useAuth();
  const [stats, setStats] = useState(null);
  const [entitlements, setEntitlements] = useState(null);

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

  const handleLogout = async () => {
    await logout();
    navigate('/auth/login');
  };

  const modules = entitlements?.dashboard_modules || stats?.plan?.dashboard_modules || {};
  const canOnboardDealers = entitlements?.can_onboard_dealers ?? (stats?.plan?.can_onboard_dealers !== false);

  const navItems = [
    { name: 'Portal Dashboard', icon: FiHome, path: '/distributor/portal/dashboard', show: modules.overview !== false },
    { name: 'Sub-Dealer Network', icon: FiUsers, path: '/distributor/portal/dealers', show: modules.dealers !== false && canOnboardDealers },
    { name: 'Dealer Applications', icon: FiFileText, path: '/distributor/portal/dealer-applications', show: modules.dealer_onboarding !== false && canOnboardDealers },
    { name: 'Territory Exclusivity', icon: FiMapPin, path: '/distributor/portal/territory', show: modules.territories !== false },
    { name: 'Distributor Plan', icon: FiLayers, path: '/distributor/portal/plan', show: modules.subscriptions !== false },
    { name: 'Procure Equipment', icon: FiPackage, path: '/products', show: modules.catalogue !== false },
  ].filter(item => item.show);

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
              <span className="text-[10px] bg-[#ECF8F1] text-[#1F8F4E] border border-[#DDE8E1] font-bold px-1.5 py-0.5 rounded block text-center">
                DISTRIBUTOR
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="p-3 space-y-1">
            <div className="px-3 py-2 text-[10px] font-bold text-[#5F6F65] uppercase tracking-widest">
              Distributor Console
            </div>
            {navItems.map((item) => {
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
                  {item.path === '/distributor/portal/dealers' && stats?.metrics?.active_dealers_count !== undefined && (
                    <span className="text-[10px] bg-[#FFFFFF] text-[#1F8F4E] px-1.5 py-0.5 rounded font-bold border border-[#DDE8E1]">
                      {stats.metrics.active_dealers_count}
                    </span>
                  )}
                </Link>
              );
            })}

            <div className="pt-4 px-3 py-2 text-[10px] font-bold text-[#5F6F65] uppercase tracking-widest">
              Quick Shortcuts
            </div>
            <Link
              to="/"
              className="flex items-center justify-between px-3.5 py-2 rounded-xl text-xs font-medium text-[#5F6F65] hover:bg-[#ECF8F1] hover:text-[#17211B]"
            >
              <span>Public Website</span>
              <FiArrowUpRight size={14} />
            </Link>
          </nav>
        </div>

        {/* User Footer & Logout */}
        <div className="p-4 border-t border-[#DDE8E1] bg-[#F7FAF8]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 truncate">
              <div className="w-8 h-8 rounded-full bg-[#ECF8F1] border border-[#DDE8E1] flex items-center justify-center font-bold text-xs text-[#1F8F4E] shrink-0">
                {(distributor?.business_name || user?.business_name || 'DI').substring(0, 2).toUpperCase()}
              </div>
              <div className="truncate">
                <div className="text-xs font-bold text-[#17211B] truncate">
                  {distributor?.business_name || user?.business_name || 'Distributor'}
                </div>
                <div className="text-[10px] text-[#1F8F4E] font-medium">Authorized Distributor</div>
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
              {entitlements?.plan_name || stats?.plan?.name || 'Authorized Distributor Hub'}
            </span>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-xs text-[#5F6F65]">
              <span className="text-[#5F6F65]">Territory:</span>
              <span className="font-bold text-[#17211B]">
                {entitlements?.assigned_district || stats?.territory?.district || 'Ahmedabad'}, {entitlements?.assigned_state || stats?.territory?.state || 'Gujarat'}
              </span>
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
