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
      setDashboardData(res.data.data);
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
          <p className="text-sm font-semibold text-slate-500">Loading BDE dashboard...</p>
        </div>
      </div>
    );
  }

  const bde = dashboardData?.bde || user || {};
  const kyc = dashboardData?.kyc || {};
  const territory = dashboardData?.territory || null;
  const plans = dashboardData?.plans || null;
  const goal = dashboardData?.goal || null;
  const notifications = dashboardData?.recent_notifications || [];
  const territoryHistory = dashboardData?.territory_history || [];

  // Goal calculations
  const monthlyGoal = goal?.monthly_franchisee_signup_goal || 0;
  const monthlyAchieved = goal?.monthly_signup_achieved || 0;
  const monthlyPct = monthlyGoal > 0 ? Math.min(100, Math.round((monthlyAchieved / monthlyGoal) * 100)) : 0;

  const quarterlyGoal = goal?.quarterly_franchisee_signup_goal || 0;
  const quarterlyAchieved = goal?.quarterly_signup_achieved || 0;
  const quarterlyPct = quarterlyGoal > 0 ? Math.min(100, Math.round((quarterlyAchieved / quarterlyGoal) * 100)) : 0;

  const storeGoal = goal?.operational_store_goal || 0;
  const storeAchieved = goal?.operational_store_achieved || 0;
  const storePct = storeGoal > 0 ? Math.min(100, Math.round((storeAchieved / storeGoal) * 100)) : 0;

  return (
    <div className="space-y-6">
      {/* Top Welcome Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-900 via-blue-800 to-indigo-900 text-white p-6 md:p-8 shadow-xl shadow-blue-950/10 border border-blue-700/50">
        {/* Background glow */}
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

            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
              Welcome back, {bde.full_name || 'BDE Executive'}!
            </h1>

            <p className="text-xs md:text-sm text-blue-200 max-w-xl">
              Track your assigned districts, franchisee recruitment targets, store activations, and performance metrics in real-time.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2 text-xs text-blue-100">
              <span className="font-mono bg-blue-950/60 px-3 py-1 rounded-lg border border-blue-700/40">
                BDE ID: <strong className="text-white">{bde.bde_id}</strong>
              </span>
              <span className="bg-blue-950/60 px-3 py-1 rounded-lg border border-blue-700/40">
                Territory: <strong className="text-white">{territory?.state_name || 'Assigned State'}</strong> ({territory?.district_names?.length || 0} Districts)
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 self-start md:self-center">
            <button
              onClick={() => navigate('/franchisees')}
              className="px-5 py-2.5 bg-amber-400 hover:bg-amber-300 text-blue-950 font-bold rounded-2xl text-xs transition shadow-lg shadow-amber-400/20 flex items-center gap-2"
            >
              <Store className="w-4 h-4" /> Franchisee Network
            </button>
            <button
              onClick={() => navigate('/leads')}
              className="px-5 py-2.5 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-semibold rounded-2xl text-xs transition flex items-center gap-2"
            >
              <Users className="w-4 h-4" /> View Leads
            </button>
          </div>
        </div>
      </div>

      {/* Target & KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Monthly Signups */}
        <div className="p-5 bg-white rounded-3xl border border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Monthly Signups</span>
            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-2xl">
              <Target className="w-5 h-5" />
            </div>
          </div>
          <div className="space-y-1">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-slate-900">{monthlyAchieved}</span>
              <span className="text-xs text-slate-400 font-semibold">/ {monthlyGoal} target</span>
            </div>
            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
              <div
                className="bg-blue-600 h-full rounded-full transition-all duration-500"
                style={{ width: `${monthlyPct}%` }}
              />
            </div>
            <p className="text-[11px] font-semibold text-blue-600">{monthlyPct}% completed this month</p>
          </div>
        </div>

        {/* Quarterly Signups */}
        <div className="p-5 bg-white rounded-3xl border border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Quarterly Signups</span>
            <div className="p-2.5 bg-purple-50 text-purple-600 rounded-2xl">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="space-y-1">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-slate-900">{quarterlyAchieved}</span>
              <span className="text-xs text-slate-400 font-semibold">/ {quarterlyGoal} target</span>
            </div>
            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
              <div
                className="bg-purple-600 h-full rounded-full transition-all duration-500"
                style={{ width: `${quarterlyPct}%` }}
              />
            </div>
            <p className="text-[11px] font-semibold text-purple-600">{quarterlyPct}% quarterly milestone</p>
          </div>
        </div>

        {/* Store Setup Targets */}
        <div className="p-5 bg-white rounded-3xl border border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Store Setups</span>
            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-2xl">
              <ShoppingBag className="w-5 h-5" />
            </div>
          </div>
          <div className="space-y-1">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-slate-900">{storeAchieved}</span>
              <span className="text-xs text-slate-400 font-semibold">/ {storeGoal} target</span>
            </div>
            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
              <div
                className="bg-emerald-600 h-full rounded-full transition-all duration-500"
                style={{ width: `${storePct}%` }}
              />
            </div>
            <p className="text-[11px] font-semibold text-emerald-600">{storePct}% operational stores</p>
          </div>
        </div>

        {/* Authorized Territory */}
        <div className="p-5 bg-white rounded-3xl border border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Authorized Area</span>
            <div className="p-2.5 bg-amber-50 text-amber-600 rounded-2xl">
              <MapPin className="w-5 h-5" />
            </div>
          </div>
          <div className="space-y-1">
            <span className="text-lg font-black text-slate-900 block truncate">
              {territory?.state_name || 'Territory Assigned'}
            </span>
            <p className="text-xs text-slate-500">
              <strong className="text-amber-600 font-bold">{territory?.district_names?.length || 0}</strong> Districts Assigned
            </p>
            <span className="inline-block px-2 py-0.5 bg-amber-100 text-amber-800 rounded text-[10px] font-bold uppercase">
              Priority: {territory?.priority || 'Medium'}
            </span>
          </div>
        </div>
      </div>

      {/* Step 2: Leads Pipeline & Conversion Summary Banner */}
      <div className="p-6 bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 rounded-3xl text-white shadow-xl space-y-4 border border-slate-700/80">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-700/80 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 bg-amber-400/20 text-amber-300 border border-amber-400/30 rounded-full text-[10px] font-bold uppercase">
                Field Funnel
              </span>
              <h2 className="text-base font-bold text-white">Lead Generation & Conversion Pipeline</h2>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Live status of prospective franchisees captured in your territory
            </p>
          </div>

          <button
            onClick={() => navigate('/leads')}
            className="px-4 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-2 transition self-start sm:self-auto"
          >
            <Users className="w-3.5 h-3.5" />
            Manage Pipeline Leads
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5 text-center text-xs">
          <div className="p-3 bg-slate-800/60 rounded-2xl border border-slate-700/60">
            <span className="text-[10px] text-slate-400 uppercase font-semibold block">Total Leads</span>
            <span className="text-xl font-black text-white mt-1 block">
              {dashboardData?.metrics?.total_leads || 0}
            </span>
          </div>

          <div className="p-3 bg-slate-800/60 rounded-2xl border border-slate-700/60">
            <span className="text-[10px] text-cyan-400 uppercase font-semibold block">Contacted</span>
            <span className="text-xl font-black text-cyan-300 mt-1 block">
              {dashboardData?.metrics?.conversion_funnel?.contacted || 0}
            </span>
          </div>

          <div className="p-3 bg-slate-800/60 rounded-2xl border border-slate-700/60">
            <span className="text-[10px] text-teal-400 uppercase font-semibold block">Interested</span>
            <span className="text-xl font-black text-teal-300 mt-1 block">
              {dashboardData?.metrics?.conversion_funnel?.interested || 0}
            </span>
          </div>

          <div className="p-3 bg-slate-800/60 rounded-2xl border border-slate-700/60">
            <span className="text-[10px] text-indigo-400 uppercase font-semibold block">Signup Started</span>
            <span className="text-xl font-black text-indigo-300 mt-1 block">
              {dashboardData?.metrics?.conversion_funnel?.signup_started || 0}
            </span>
          </div>

          <div className="p-3 bg-slate-800/60 rounded-2xl border border-slate-700/60">
            <span className="text-[10px] text-purple-400 uppercase font-semibold block">Approved</span>
            <span className="text-xl font-black text-purple-300 mt-1 block">
              {dashboardData?.metrics?.conversion_funnel?.approved || 0}
            </span>
          </div>

          <div className="p-3 bg-slate-800/60 rounded-2xl border border-slate-700/60">
            <span className="text-[10px] text-amber-400 uppercase font-semibold block">Agreement</span>
            <span className="text-xl font-black text-amber-300 mt-1 block">
              {dashboardData?.metrics?.conversion_funnel?.agreement_signed || 0}
            </span>
          </div>

          <div className="p-3 bg-emerald-500/20 rounded-2xl border border-emerald-500/40">
            <span className="text-[10px] text-emerald-300 uppercase font-bold block">Fee Paid (Won)</span>
            <span className="text-xl font-black text-emerald-300 mt-1 block">
              {dashboardData?.metrics?.conversion_funnel?.fee_paid || 0}
            </span>
          </div>
        </div>
      </div>

      {/* Main Grid: Territory & Plans Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Assigned Districts Card */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-purple-50 text-purple-600 rounded-xl">
                <MapPin className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">Assigned Territory Jurisdiction</h2>
                <p className="text-xs text-slate-500">
                  {territory?.state_name ? `State: ${territory.state_name}` : 'No state assigned'}
                </p>
              </div>
            </div>
            {territory?.assignment_start_date && (
              <span className="text-xs text-slate-400 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                Active Since: {new Date(territory.assignment_start_date).toLocaleDateString()}
              </span>
            )}
          </div>

          {territory?.district_names && territory.district_names.length > 0 ? (
            <div className="space-y-3">
              <p className="text-xs text-slate-500 font-medium">
                You have official authorization to onboard franchisee partners in the following {territory.district_names.length} district(s):
              </p>
              <div className="flex flex-wrap gap-2">
                {territory.district_names.map((dName, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 hover:bg-purple-100 border border-purple-200/80 rounded-xl text-xs font-semibold text-purple-800 transition"
                  >
                    <MapPin className="w-3.5 h-3.5 text-purple-500" />
                    <span>{dName}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="py-8 text-center text-xs text-slate-400 space-y-2">
              <MapPin className="w-8 h-8 text-slate-300 mx-auto" />
              <p>No districts assigned yet. Please contact your regional administrator.</p>
            </div>
          )}
        </div>

        {/* Assigned Franchisee Plans */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-4">
          <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Franchisee Plans</h2>
              <p className="text-xs text-slate-500">Authorized tiers you can pitch</p>
            </div>
          </div>

          {plans?.plan_names && plans.plan_names.length > 0 ? (
            <div className="space-y-2.5">
              {plans.plan_names.map((pName, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-slate-50 hover:bg-blue-50/50 border border-slate-200 rounded-2xl flex items-center justify-between text-xs transition"
                >
                  <div className="flex items-center gap-2">
                    <Award className="w-4 h-4 text-blue-600" />
                    <span className="font-bold text-slate-800">{pName}</span>
                  </div>
                  <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-bold text-[10px] uppercase">
                    Active
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-6 text-center text-xs text-slate-500 space-y-1">
              <p className="font-semibold text-slate-700">All Master Plans Accessible</p>
              <p className="text-[11px] text-slate-400">Standard platform franchisee packages available.</p>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Section: Notifications & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Notifications & System Updates */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
                <Bell className="w-5 h-5" />
              </div>
              <h2 className="text-base font-bold text-slate-900">Recent Notifications & Updates</h2>
            </div>
            <button
              onClick={() => navigate('/notifications')}
              className="text-xs font-semibold text-blue-600 hover:underline flex items-center gap-1"
            >
              View All <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          {notifications.length > 0 ? (
            <div className="space-y-3">
              {notifications.map((notif, idx) => (
                <div
                  key={idx}
                  className={`p-3.5 rounded-2xl border text-xs flex items-start gap-3 transition ${
                    notif.is_read ? 'bg-slate-50 border-slate-200' : 'bg-blue-50/50 border-blue-200'
                  }`}
                >
                  <div className="p-2 bg-blue-100 text-blue-700 rounded-xl mt-0.5">
                    <Bell className="w-3.5 h-3.5" />
                  </div>
                  <div className="flex-1 space-y-0.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900">{notif.title}</span>
                      <span className="text-[10px] text-slate-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {notif.createdAt ? new Date(notif.createdAt).toLocaleDateString() : ''}
                      </span>
                    </div>
                    <p className="text-slate-600 text-xs">{notif.message}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-6 text-center text-xs text-slate-400">
              No new notifications at this time.
            </div>
          )}
        </div>

        {/* Quick Module Shortcuts */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-4">
          <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3">
            Quick Actions
          </h2>

          <div className="space-y-2.5">
            <button
              onClick={() => navigate('/leads')}
              className="w-full p-3.5 bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-200 rounded-2xl text-left flex items-center justify-between transition group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 text-blue-700 rounded-xl group-hover:scale-110 transition">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-900 block">Lead Pipeline</span>
                  <span className="text-[11px] text-slate-500">View and follow up field leads</span>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 transition" />
            </button>

            <button
              onClick={() => navigate('/franchisees')}
              className="w-full p-3.5 bg-slate-50 hover:bg-purple-50 border border-slate-200 hover:border-purple-200 rounded-2xl text-left flex items-center justify-between transition group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 text-purple-700 rounded-xl group-hover:scale-110 transition">
                  <Store className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-900 block">Franchisee Accounts</span>
                  <span className="text-[11px] text-slate-500">Active franchisee partners</span>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-purple-600 transition" />
            </button>

            <button
              onClick={() => navigate('/store-setup')}
              className="w-full p-3.5 bg-slate-50 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-200 rounded-2xl text-left flex items-center justify-between transition group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-100 text-emerald-700 rounded-xl group-hover:scale-110 transition">
                  <ShoppingBag className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-900 block">Store Setup Tracker</span>
                  <span className="text-[11px] text-slate-500">Physical shop readiness</span>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 transition" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
