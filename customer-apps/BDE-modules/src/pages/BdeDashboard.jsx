import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBdeAuth } from '../context/BdeAuthContext';
import api from '../services/api';
import {
  User,
  ShieldCheck,
  MapPin,
  Target,
  ShoppingBag,
  Store,
  Users,
  Bell,
  ArrowRight,
  TrendingUp,
  Award,
  Sparkles,
  Calendar,
  Layers,
  Clock,
  Plus,
  Zap,
  Package,
  CheckCircle2,
  AlertCircle,
  RotateCw,
  Building2,
  FileCheck,
} from 'lucide-react';

export default function BdeDashboard() {
  const { user } = useBdeAuth();
  const navigate = useNavigate();

  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get('/dashboard');
      if (res.data?.status === 'success') {
        setDashboardData(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load BDE dashboard data', err);
      setError(err.message || 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-semibold text-slate-500">Loading BDE State & District Dashboard...</p>
        </div>
      </div>
    );
  }

  const bde = dashboardData?.bde || user || {};
  const territory = dashboardData?.territory || null;
  const stateSummary = dashboardData?.state_summary || {};
  const districtBreakdown = dashboardData?.district_breakdown || [];
  const goals = dashboardData?.goals || {};
  const notifications = dashboardData?.notifications || [];

  return (
    <div className="space-y-6">
      {/* Top Welcome Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-950 via-blue-900 to-indigo-950 text-white p-6 md:p-8 shadow-xl shadow-blue-950/15 border border-blue-800/50">
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-400/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-[11px] font-bold text-amber-300 tracking-wide border border-white/10 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" /> BDE Field Executive
              </span>
              <span className="px-2.5 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 rounded-full text-[11px] font-bold uppercase flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" /> KYC Verified
              </span>
            </div>

            <h1 className="text-2xl md:text-3xl font-black tracking-tight">
              Welcome back, {bde.full_name || 'BDE Executive'}!
            </h1>

            <p className="text-xs md:text-sm text-blue-200 max-w-xl">
              Territory management, EPC leads generation, GST onboarding, franchisee kit targets, and sales analytics for your assigned region.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2 text-xs text-blue-100">
              <span className="font-mono bg-blue-950/80 px-3 py-1 rounded-lg border border-blue-700/40">
                BDE ID: <strong className="text-white">{bde.bde_id}</strong>
              </span>
              <span className="bg-blue-950/80 px-3 py-1 rounded-lg border border-blue-700/40 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-amber-400" />
                State: <strong className="text-white">{territory?.state_name || 'Assigned State'}</strong>
                <span className="text-blue-300">({territory?.district_count || 0} Districts Assigned)</span>
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 self-start md:self-center">
            <button
              onClick={() => navigate('/epc-onboarding')}
              className="px-5 py-2.5 bg-gradient-to-r from-[#F49222] to-amber-400 hover:from-amber-500 hover:to-amber-400 text-slate-950 font-black rounded-2xl text-xs transition shadow-lg shadow-amber-400/20 flex items-center gap-2"
            >
              <ShieldCheck className="w-4 h-4 stroke-[2.5]" /> GST Onboard EPC
            </button>
            <button
              onClick={() => navigate('/epc-leads')}
              className="px-5 py-2.5 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-semibold rounded-2xl text-xs transition flex items-center gap-2"
            >
              <Users className="w-4 h-4" /> EPC Leads
            </button>
            <button
              onClick={() => navigate('/franchisees')}
              className="px-5 py-2.5 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-semibold rounded-2xl text-xs transition flex items-center gap-2"
            >
              <Store className="w-4 h-4" /> Franchisee Goals
            </button>
          </div>
        </div>
      </div>

      {/* 5. STATE DASHBOARD — Geography-Focused State Summary */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-blue-600" /> State Territory Summary ({territory?.state_name})
          </h2>
          <button
            onClick={fetchDashboardData}
            className="text-xs text-blue-600 hover:underline flex items-center gap-1 font-semibold"
          >
            <RotateCw className="w-3.5 h-3.5" /> Refresh Data
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
          {/* Assigned Districts */}
          <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Assigned Districts</span>
            <div className="text-2xl font-black text-slate-900">{stateSummary.total_assigned_districts || 0}</div>
            <span className="text-[10px] text-slate-500 font-medium">In your territory</span>
          </div>

          {/* Franchisee Network */}
          <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Franchisees</span>
            <div className="text-2xl font-black text-slate-900">{stateSummary.total_franchisees || 0}</div>
            <div className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
              <span>{stateSummary.operational_franchisees || 0} Live</span> •{' '}
              <span className="text-amber-600">{stateSummary.franchisees_under_setup || 0} Setup</span>
            </div>
          </div>

          {/* EPC Leads */}
          <div className="p-4 bg-white rounded-2xl border border-blue-100 shadow-xs space-y-1">
            <span className="text-[11px] font-bold text-blue-600 uppercase tracking-wider">EPC Leads</span>
            <div className="text-2xl font-black text-blue-700">{stateSummary.epc_leads || 0}</div>
            <span className="text-[10px] text-blue-600 font-medium">Pipeline contacts</span>
          </div>

          {/* EPCs Onboarded & Assigned */}
          <div className="p-4 bg-white rounded-2xl border border-teal-100 shadow-xs space-y-1">
            <span className="text-[11px] font-bold text-teal-600 uppercase tracking-wider">EPCs Onboarded</span>
            <div className="text-2xl font-black text-teal-700">{stateSummary.epcs_onboarded || 0}</div>
            <span className="text-[10px] text-teal-600 font-medium">
              {stateSummary.epcs_assigned || 0} Assigned to Franchisees
            </span>
          </div>

          {/* Total Kits Ordered */}
          <div className="p-4 bg-white rounded-2xl border border-emerald-100 shadow-xs space-y-1 sm:col-span-2 lg:col-span-1">
            <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider">Kits Ordered</span>
            <div className="text-2xl font-black text-emerald-700">{stateSummary.total_kits_ordered || 0}</div>
            <span className="text-[10px] text-emerald-600 font-medium">Across {stateSummary.total_orders || 0} PO orders</span>
          </div>
        </div>
      </div>

      {/* 5. DISTRICT DASHBOARD TABLE — District-by-District Breakdown */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden space-y-4 p-6">
        <div>
          <h2 className="text-base font-black text-slate-900">District-by-District Territory Breakdown</h2>
          <p className="text-xs text-slate-500">
            Performance comparison of Franchisees, EPC Leads, Onboarded contractors, and actual Kits ordered by district.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-bold tracking-wider">
              <tr>
                <th className="px-4 py-3.5">District</th>
                <th className="px-4 py-3.5 text-center">Franchisees (Live / Setup)</th>
                <th className="px-4 py-3.5 text-center">EPC Leads</th>
                <th className="px-4 py-3.5 text-center">EPCs Onboarded</th>
                <th className="px-4 py-3.5 text-center">Kits Ordered</th>
                <th className="px-4 py-3.5 text-right">Goal Achievement</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {districtBreakdown.length > 0 ? (
                districtBreakdown.map((d, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/80 transition">
                    <td className="px-4 py-3.5 font-bold text-slate-900 flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-blue-500" />
                      <span>{d.district}</span>
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <span className="font-bold text-slate-800">{d.franchisees_count}</span>
                      <span className="text-[11px] text-slate-400 ml-1">
                        ({d.operational_count} Live)
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-center font-bold text-blue-700">{d.epc_leads_count}</td>
                    <td className="px-4 py-3.5 text-center font-bold text-teal-700">{d.epcs_onboarded_count}</td>
                    <td className="px-4 py-3.5 text-center font-bold text-emerald-700">{d.kits_ordered_count}</td>
                    <td className="px-4 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <div className="w-24 bg-slate-100 h-2 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              d.goal_achievement_pct >= 100
                                ? 'bg-emerald-500'
                                : d.goal_achievement_pct >= 60
                                ? 'bg-blue-500'
                                : 'bg-amber-500'
                            }`}
                            style={{ width: `${Math.min(100, d.goal_achievement_pct)}%` }}
                          />
                        </div>
                        <span
                          className={`font-black text-xs ${
                            d.goal_achievement_pct >= 100
                              ? 'text-emerald-700'
                              : d.goal_achievement_pct >= 60
                              ? 'text-blue-700'
                              : 'text-amber-700'
                          }`}
                        >
                          {d.goal_achievement_pct}%
                        </span>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-400 italic">
                    No district breakdown records found for this territory.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Target Progress & Quick Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Franchisee Signups Target */}
        <div className="p-5 bg-white rounded-3xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Franchisee Signups</span>
            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-2xl">
              <Target className="w-5 h-5" />
            </div>
          </div>
          <div className="space-y-1">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-slate-900">{goals.monthly_signup_achieved || 0}</span>
              <span className="text-xs text-slate-400 font-semibold">/ {goals.monthly_franchisee_signup_goal || 5} target</span>
            </div>
            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
              <div
                className="bg-blue-600 h-full rounded-full transition-all"
                style={{ width: `${goals.monthly_signup_progress_pct || 0}%` }}
              />
            </div>
            <p className="text-[11px] font-semibold text-blue-600">{goals.monthly_signup_progress_pct || 0}% completed</p>
          </div>
        </div>

        {/* EPC Onboarding Target */}
        <div className="p-5 bg-white rounded-3xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">EPC Onboardings</span>
            <div className="p-2.5 bg-teal-50 text-teal-600 rounded-2xl">
              <ShieldCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="space-y-1">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-teal-700">{goals.monthly_epc_onboarded_achieved || 0}</span>
              <span className="text-xs text-slate-400 font-semibold">/ {goals.monthly_epc_onboard_goal || 10} target</span>
            </div>
            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
              <div
                className="bg-teal-600 h-full rounded-full transition-all"
                style={{
                  width: `${
                    goals.monthly_epc_onboard_goal > 0
                      ? Math.min(100, Math.round(((goals.monthly_epc_onboarded_achieved || 0) / goals.monthly_epc_onboard_goal) * 100))
                      : 0
                  }%`,
                }}
              />
            </div>
            <p className="text-[11px] font-semibold text-teal-600">
              {goals.monthly_epc_onboard_goal > 0
                ? Math.round(((goals.monthly_epc_onboarded_achieved || 0) / goals.monthly_epc_onboard_goal) * 100)
                : 0}
              % verified & onboarded
            </p>
          </div>
        </div>

        {/* Network Kits Ordered Target */}
        <div className="p-5 bg-white rounded-3xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Network Kit Orders</span>
            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-2xl">
              <Package className="w-5 h-5" />
            </div>
          </div>
          <div className="space-y-1">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-emerald-700">{goals.monthly_network_kits_achieved || 0}</span>
              <span className="text-xs text-slate-400 font-semibold">/ {goals.monthly_network_kit_goal || 250} kits</span>
            </div>
            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
              <div
                className="bg-emerald-600 h-full rounded-full transition-all"
                style={{ width: `${Math.min(100, goals.network_kit_achievement_pct || 0)}%` }}
              />
            </div>
            <p className="text-[11px] font-semibold text-emerald-600">{goals.network_kit_achievement_pct || 0}% kit goal achievement</p>
          </div>
        </div>
      </div>
    </div>
  );
}
