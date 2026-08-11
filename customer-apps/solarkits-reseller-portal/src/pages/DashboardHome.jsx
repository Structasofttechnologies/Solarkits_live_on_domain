import { useState, useEffect } from "react";
import { useOutletContext, Link } from "react-router-dom";
import api from "../services/api";
import {
  FiZap,
  FiShield,
  FiDollarSign,
  FiUsers,
  FiArrowUpRight,
  FiCheckCircle,
  FiClock,
  FiAlertCircle,
  FiPackage,
} from "react-icons/fi";

export default function DashboardHome() {
  const { reseller } = useOutletContext();
  const [wallet, setWallet] = useState(null);
  const [buyers, setBuyers] = useState([]);

  useEffect(() => {
    api.get('/india/v1/reseller/wallet/me')
      .then((res) => {
        if (res.data?.status === "success") setWallet(res.data.data);
      })
      .catch(() => {});

    api.get('/india/v1/reseller/epc-buyers/list')
      .then((res) => {
        if (res.data?.status === "success") setBuyers(res.data.data);
      })
      .catch(() => {});
  }, []);

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Welcome Banner */}
      <div className="p-8 rounded-3xl bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border border-slate-800">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-extrabold uppercase tracking-wider border border-blue-500/30">
            <FiZap size={14} /> Reseller Dashboard
          </div>
          <h1 className="text-3xl font-black tracking-tight">
            Welcome, {reseller?.business_name || "Partner"}!
          </h1>
          <p className="text-sm font-medium text-slate-300 max-w-xl">
            Manage your solar business pipeline, onboard EPC buyers, and track real-time wallet commission payouts.
          </p>
        </div>
      </div>

      {/* KYC Alert / Verification Status Banner */}
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
                Your business identity documents have been approved by Admin. Sub-account onboarding & wholesale ordering are 100% unlocked!
              </div>
            </div>
          </div>
          <Link to="/kyc" className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shrink-0 cursor-pointer flex items-center gap-1.5">
            <FiShield size={16} /> View Verified KYC
          </Link>
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

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
            <FiDollarSign size={26} />
          </div>
          <div>
            <div className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">Available Wallet</div>
            <div className="text-2xl font-black text-slate-900 mt-1">₹{(wallet?.available_balance || 0).toLocaleString("en-IN")}</div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="w-14 h-14 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
            <FiArrowUpRight size={26} />
          </div>
          <div>
            <div className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">Total Earned</div>
            <div className="text-2xl font-black text-slate-900 mt-1">₹{(wallet?.total_earned || 0).toLocaleString("en-IN")}</div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="w-14 h-14 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
            <FiUsers size={26} />
          </div>
          <div>
            <div className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">My EPC Buyers</div>
            <div className="text-2xl font-black text-slate-900 mt-1">{buyers.length}</div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="w-14 h-14 rounded-2xl bg-purple-100 text-purple-600 flex items-center justify-center shrink-0">
            <FiPackage size={26} />
          </div>
          <div>
            <div className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">KYC Status</div>
            <div className="text-lg font-black text-slate-900 mt-1 capitalize flex items-center gap-1.5">
              {reseller?.kyc_status === 'verified' ? (
                <span className="text-emerald-600 flex items-center gap-1"><FiCheckCircle size={18} /> Verified</span>
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
