import { useState, useEffect, useCallback } from "react";
import { Link, useLocation, useNavigate, Outlet } from "react-router-dom";
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
} from "react-icons/fi";
import api from "../services/api";

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
  { name: "Wallet & Ledgers", icon: FiCreditCard, path: "/wallet" },
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

  const token = localStorage.getItem("reseller_token");

  const fetchMe = useCallback(() => {
    if (!token) return;
    api.get('/india/v1/reseller/auth/me')
      .then((res) => {
        if (res.data?.status === "success") {
          const userData = res.data.data || res.data.user;
          if (userData) {
            setReseller(userData);
            localStorage.setItem("reseller_user", JSON.stringify(userData));
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

  return (
    <div className="min-h-screen bg-slate-100 flex font-sans antialiased text-slate-900">
      {/* Sidebar - Deep Slate Night Theme */}
      <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col justify-between hidden md:flex shrink-0 shadow-xl">
        <div>
          {/* Brand Logo Header */}
          <div className="p-6 border-b border-slate-800 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/30">
              <FiZap size={22} />
            </div>
            <div>
              <div className="font-extrabold text-base text-white tracking-wide">SOLARKITS</div>
              <div className="text-[11px] font-semibold text-blue-400 tracking-wider uppercase">Reseller Partner</div>
            </div>
          </div>

          {/* Navigation Items */}
          <nav className="p-4 space-y-1.5">
            {NAV_ITEMS.filter(item => !(item.path === "/kyc" && reseller?.kyc_status === "verified")).map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all duration-200 ${
                    isActive
                      ? "bg-blue-600 text-white shadow-lg shadow-blue-500/30 translate-x-1"
                      : "text-slate-400 hover:bg-slate-800 hover:text-white"
                  }`}
                >
                  <Icon size={18} className={isActive ? "text-white" : "text-slate-400"} />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User Profile Card & Logout */}
        <div className="p-4 border-t border-slate-800 space-y-3">
          {reseller && (
            <div className="p-3.5 rounded-2xl bg-slate-800/80 border border-slate-700/80">
              <div className="font-bold text-xs text-white truncate">{reseller.business_name}</div>
              <div className="text-[11px] text-slate-400 truncate mt-0.5">{reseller.email}</div>
              <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-slate-700/60">
                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold capitalize ${
                  reseller.kyc_status === 'verified' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                }`}>
                  {reseller.kyc_status === 'verified' ? <FiCheckCircle size={10} /> : <FiAlertCircle size={10} />}
                  KYC {reseller.kyc_status}
                </span>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  {reseller.commercial_mode}
                </span>
              </div>
            </div>
          )}

          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-red-400 bg-red-950/20 border border-red-900/30 hover:bg-red-600 hover:text-white transition-all cursor-pointer shadow-sm"
          >
            <FiLogOut size={16} /> Logout Partner
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-slate-200 px-8 flex items-center justify-between shadow-xs">
          <div className="font-bold text-sm text-slate-700 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Solarkits Reseller Business Management Portal
          </div>
          {reseller && (
            <div className="flex items-center gap-4 relative">
              {/* KYC Status Badge */}
              <span className={`px-3 py-1 rounded-full text-xs font-extrabold capitalize flex items-center gap-1.5 border ${
                reseller.kyc_status === 'verified'
                  ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                  : reseller.kyc_status === 'submitted'
                  ? 'bg-blue-100 text-blue-800 border-blue-300'
                  : 'bg-amber-100 text-amber-800 border-amber-300'
              }`}>
                {reseller.kyc_status === 'verified' ? <FiCheckCircle size={14} /> : <FiAlertCircle size={14} />}
                KYC: {reseller.kyc_status}
              </span>

              {/* Notification Bell Button */}
              <button
                onClick={() => setShowNotif(!showNotif)}
                className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 relative transition-all cursor-pointer"
              >
                <FiBell size={18} />
                {reseller.kyc_status === 'verified' && (
                  <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-white"></span>
                )}
              </button>

              {/* Notifications Dropdown Modal */}
              {showNotif && (
                <div className="absolute right-0 top-12 w-80 bg-white rounded-2xl shadow-2xl border border-slate-200 p-4 z-50 space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <div className="font-bold text-xs text-slate-900 uppercase tracking-wider">Account Notifications</div>
                    <button onClick={() => setShowNotif(false)} className="text-slate-400 hover:text-slate-700 cursor-pointer">
                      <FiX size={16} />
                    </button>
                  </div>

                  {reseller.kyc_status === 'verified' ? (
                    <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 space-y-1">
                      <div className="font-black flex items-center gap-1">🎉 KYC Approved!</div>
                      <p className="font-medium text-[11px] text-emerald-800">
                        Your business identity documents have been approved by Admin. Account is 100% verified.
                      </p>
                    </div>
                  ) : reseller.kyc_status === 'submitted' ? (
                    <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-xs text-blue-900 space-y-1">
                      <div className="font-black">KYC Under Review</div>
                      <p className="font-medium text-[11px] text-blue-800">
                        Admin team is verifying your submitted documents.
                      </p>
                    </div>
                  ) : (
                    <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-1">
                      <div className="font-black">Action Required</div>
                      <p className="font-medium text-[11px] text-amber-800">
                        Please upload PAN and Shop photo to complete KYC verification.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </header>

        {/* Page Body */}
        <main className="flex-1 p-8 overflow-y-auto">
          <Outlet context={{ reseller }} />
        </main>
      </div>
    </div>
  );
}
