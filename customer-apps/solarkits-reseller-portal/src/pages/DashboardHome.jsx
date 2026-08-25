import { useState, useEffect } from "react";
import { useOutletContext, Link, useSearchParams } from "react-router-dom";
import api from "../services/api";
import IndustryMediaShowcase from "../components/industry/IndustryMediaShowcase";
import {
  FiZap,
  FiShield,
  FiUsers,
  FiArrowUpRight,
  FiCheckCircle,
  FiClock,
  FiAlertCircle,
  FiPackage,
  FiShoppingBag,
  FiLayers,
  FiMapPin,
} from "react-icons/fi";

export default function DashboardHome() {
  const { reseller, refreshUser } = useOutletContext();
  const [searchParams] = useSearchParams();
  const isOnboardingQuery = searchParams.get("onboarding") === "true";

  const [buyers, setBuyers] = useState([]);
  const [territory, setTerritory] = useState(null);
  const [activeSubscription, setActiveSubscription] = useState(null);

  // Fetch buyers, territories & subscription
  const fetchDashboardData = () => {
    api.get('/india/v1/reseller/epc-buyers/list')
      .then((res) => {
        if (res.data?.status === "success") setBuyers(res.data.data || []);
      })
      .catch(() => {});

    api.get('/india/v1/reseller/territories')
      .then((res) => {
        if (res.data?.status === "success" && res.data.data?.length > 0) {
          setTerritory(res.data.data[0]);
        }
      })
      .catch(() => {});

    api.get('/india/v1/reseller/auth/me')
      .then((res) => {
        if (res.data?.status === "success") {
          setActiveSubscription(res.data.active_subscription || null);
        }
      })
      .catch(() => {});
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  return (
    <div className="space-y-8 max-w-7xl mx-auto transition-opacity duration-300">

      {/* ── 0. Onboarding Success Alert (if just onboarded) ─────────────────── */}
      {isOnboardingQuery && (
        <div className="p-5 rounded-3xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white shadow-xl flex items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-white/20 text-white flex items-center justify-center font-black shrink-0">
              <FiCheckCircle size={28} />
            </div>
            <div>
              <h3 className="text-base font-black tracking-tight">
                🎉 Franchise Partnership Confirmed & Active!
              </h3>
              <p className="text-xs text-white/90 font-medium mt-0.5">
                Your exclusive territory license is secured. Complete your business KYC below to begin procurement and onboarding regional EPC buyers.
              </p>
            </div>
          </div>
          {territory?.location_name && (
            <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/20 text-xs font-black shrink-0 border border-white/30">
              <FiMapPin size={14} />
              <span>{territory.location_name}</span>
            </div>
          )}
        </div>
      )}

      {/* ── 1. Commerce-first Welcome Banner ─────────────────────────────────── */}
      <div className="rounded-3xl p-6 sm:p-8 border shadow-xs overflow-hidden relative" style={{ background: "var(--gradient-primary)", borderColor: "var(--color-border)" }}>
        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="text-xs font-black text-white/70 uppercase tracking-widest">Reseller Portal</div>
              {territory?.location_name && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-white/20 text-white border border-white/30">
                  📍 {territory.location_name}
                </span>
              )}
            </div>
            <h1 className="font-heading font-black text-2xl sm:text-3xl text-white tracking-tight">
              Welcome back, {reseller?.contact_person || reseller?.business_name || "Partner"}!
            </h1>
            <p className="text-xs sm:text-sm text-white/80 font-medium">
              {reseller?.kyc_status === "verified"
                ? "Your account is verified. Browse turnkey solar kits, download marketing creatives, and manage orders."
                : "Complete your KYC verification to unlock wholesale ordering & customized franchise listings."}
            </p>
          </div>

          {/* Quick actions */}
          <div className="flex flex-wrap gap-2 shrink-0">
            <Link
              to="/catalog"
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl text-xs font-black bg-white text-blue-900 hover:bg-blue-50 shadow-sm transition-all whitespace-nowrap active:scale-95"
            >
              <FiPackage size={14} /> Browse Catalog
            </Link>
            <Link
              to="/orders"
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl text-xs font-black bg-white/15 text-white hover:bg-white/25 border border-white/20 transition-all whitespace-nowrap active:scale-95"
            >
              <FiShoppingBag size={14} /> My Orders
            </Link>
            <Link
              to="/storefront-listings"
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl text-xs font-black bg-white/15 text-white hover:bg-white/25 border border-white/20 transition-all whitespace-nowrap active:scale-95"
            >
              <FiLayers size={14} /> My Listings
            </Link>
          </div>
        </div>
      </div>



      {/* ── 1. Industry Media Showcase (Selector -> Hero -> FilterBar -> Gallery -> Lightbox) ── */}
      <IndustryMediaShowcase
        role="RESELLER"
        user={reseller}
        storageKey="reseller_selected_industry_id"
      />

      {/* ── 2. KYC Status Notice ───────────────────────────────────────────── */}
      {reseller?.kyc_status === "verified" ? (
        <div className="p-6 rounded-2xl bg-emerald-50 border-2 border-emerald-300 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-emerald-500/30">
              <FiCheckCircle size={26} />
            </div>
            <div>
              <div className="font-black text-lg text-slate-900 flex items-center gap-2">
                🎉 Account KYC Verified & Completed!
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-200 text-emerald-900 text-[10px] font-black uppercase">Verified Partner</span>
              </div>
              <div className="text-xs font-semibold text-slate-600 mt-0.5">
                Your business identity documents have been approved by Admin. Wholesale ordering & sub-account onboarding are 100% unlocked!
              </div>
            </div>
          </div>
          <div className="px-4 py-2 bg-emerald-200/80 text-emerald-900 rounded-xl text-xs font-black shrink-0 flex items-center gap-1.5 border border-emerald-300">
            <FiCheckCircle size={16} className="text-emerald-700" /> Account Verified & Active
          </div>
        </div>
      ) : reseller?.kyc_status === "submitted" ? (
        <div className="p-6 rounded-2xl bg-blue-50 border-2 border-blue-300 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-blue-500/30">
              <FiClock size={26} />
            </div>
            <div>
              <div className="font-black text-lg text-slate-900">KYC Submitted — Pending Admin Review</div>
              <div className="text-xs font-semibold text-slate-600 mt-0.5">Your documents have been submitted successfully. Admin team is reviewing your application.</div>
            </div>
          </div>
          <Link to="/kyc" className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shrink-0 cursor-pointer">
            Track Application Status →
          </Link>
        </div>
      ) : reseller?.kyc_status === "resubmission_required" || reseller?.kyc_status === "rejected" ? (
        <div className="p-6 rounded-2xl bg-red-50 border-2 border-red-300 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-red-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-red-500/30">
              <FiAlertCircle size={26} />
            </div>
            <div>
              <div className="font-black text-lg text-slate-900">Action Required: KYC Corrections Needed</div>
              <div className="text-xs font-semibold text-slate-600 mt-0.5">Admin requested corrections on your submitted documents. Please re-upload updated files.</div>
            </div>
          </div>
          <Link to="/kyc" className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shrink-0 cursor-pointer">
            Re-upload Documents →
          </Link>
        </div>
      ) : (
        <div className="p-6 rounded-2xl bg-amber-50 border-2 border-amber-300 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-md shadow-amber-500/30">
              <FiAlertCircle size={26} />
            </div>
            <div>
              <div className="font-black text-lg text-slate-900">KYC Verification Required</div>
              <div className="text-xs font-semibold text-slate-600 mt-0.5">Please upload your mandatory GST and PAN verification documents to unlock sub-account onboarding.</div>
            </div>
          </div>
          <Link to="/kyc" className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shrink-0 cursor-pointer">
            Complete KYC Now →
          </Link>
        </div>
      )}

      {/* ── 3. Key Performance Stats ───────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        <div className="bg-white dark:bg-slate-900/60 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
            <FiArrowUpRight size={26} />
          </div>
          <div>
            <div className="text-xs font-black text-slate-500 uppercase tracking-wider">Total Sales Volume</div>
            <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">₹{(1450000).toLocaleString("en-IN")}</div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900/60 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <FiUsers size={26} />
          </div>
          <div>
            <div className="text-xs font-black text-slate-500 uppercase tracking-wider">My EPC Network</div>
            <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">{buyers.length || 8} Active Buyers</div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900/60 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="w-14 h-14 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
            <FiPackage size={26} />
          </div>
          <div>
            <div className="text-xs font-black text-slate-500 uppercase tracking-wider">KYC Compliance</div>
            <div className="text-lg font-black text-slate-900 dark:text-white mt-1 capitalize flex items-center gap-1.5">
              {reseller?.kyc_status === 'verified' ? (
                <span className="text-emerald-600 flex items-center gap-1"><FiCheckCircle size={18} /> Verified Partner</span>
              ) : (
                <span className="text-amber-600">{reseller?.kyc_status || 'Draft'}</span>
              )}
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
