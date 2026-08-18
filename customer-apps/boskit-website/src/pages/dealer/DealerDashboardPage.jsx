import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  FiPackage,
  FiShoppingCart,
  FiTruck,
  FiMapPin,
  FiArrowRight,
  FiZap,
  FiShield,
  FiTrendingUp,
  FiPhoneCall,
  FiCheckCircle,
} from 'react-icons/fi';
import { MdSolarPower } from 'react-icons/md';
import api from '../../services/api';

export default function DealerDashboardPage() {
  const { user, dealer } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get('/dealer/dashboard/stats')
      .then((res) => {
        if (res.data?.success) setData(res.data.data);
      })
      .catch((err) => console.error('Dealer stats fetch error:', err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="p-8 text-center text-slate-500">Loading Installer Console...</div>;
  }

  const hub = data?.distributor_hub || {};
  const metrics = data?.metrics || {};
  const recentOrders = data?.recent_orders || [];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      
      {/* ── Royal Blue Header Banner ────────────────────────────────────────── */}
      <div className="bg-[#185ADB] rounded-2xl p-6 sm:p-8 text-white shadow-md relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-white text-xs font-semibold backdrop-blur-md mb-2">
              <FiShield size={14} />
              <span>Certified Solar Installer & EPC Contractor</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight font-heading">
              {dealer?.business_name || user?.business_name || 'Dealer Solar Center'}
            </h1>
            <p className="mt-1 text-blue-100 text-xs sm:text-sm">
              Procure Tier-1 PV modules, inverters, and BOS components directly from your regional distributor depot with zero middleman markups.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/dealer/portal/catalogue"
              className="px-5 py-2.5 rounded-xl text-xs font-bold bg-white text-[#185ADB] hover:bg-blue-50 shadow-sm flex items-center gap-2 transition-all cursor-pointer active:scale-95"
            >
              <FiShoppingCart size={15} /> Procure Solar Equipment <FiArrowRight />
            </Link>
          </div>
        </div>
      </div>

      {/* ── KPI Cards Grid ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        
        {/* Assigned Hub */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Assigned Regional Hub</span>
            <div className="p-2.5 rounded-xl bg-blue-50 text-blue-700 border border-blue-200">
              <FiMapPin size={18} />
            </div>
          </div>
          <div className="mt-4">
            <div className="font-heading font-bold text-base text-slate-900 truncate">
              {hub.business_name || 'Gujarat Central Hub'}
            </div>
            <span className="text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded mt-1 inline-block">
              {hub.warehouse_city || 'Ahmedabad'} Depot
            </span>
          </div>
        </div>

        {/* Pricing Tier */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Active Pricing Tier</span>
            <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200">
              <FiTrendingUp size={18} />
            </div>
          </div>
          <div className="mt-4">
            <div className="font-heading font-bold text-lg text-emerald-700">Gold Wholesale Rate</div>
            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded mt-1 inline-block">
              -18% Discount applied
            </span>
          </div>
        </div>

        {/* Lifetime Procurement */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Lifetime Procurement</span>
            <div className="p-2.5 rounded-xl bg-blue-50 text-blue-700 border border-blue-200">
              <FiZap size={18} />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <span className="font-heading font-black text-2xl text-slate-900">
              ₹{(metrics.lifetime_procurement_inr || 450000).toLocaleString('en-IN')}
            </span>
          </div>
        </div>

        {/* Total Orders */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Fulfilled Dispatches</span>
            <div className="p-2.5 rounded-xl bg-blue-50 text-blue-700 border border-blue-200">
              <FiTruck size={18} />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <span className="font-heading font-black text-2xl text-slate-900">
              {metrics.total_orders_count || 3}
            </span>
            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
              100% On-Time
            </span>
          </div>
        </div>

      </div>

      {/* ── Main Grid: Orders & Hub Hotline ─────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Columns: Orders Table */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-heading font-black text-base text-slate-900 uppercase tracking-wide">
                Recent Wholesale Dispatches
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Consolidated batch shipments from regional warehouse.
              </p>
            </div>
            <Link
              to="/dealer/portal/orders"
              className="text-xs font-bold text-blue-700 hover:underline"
            >
              View All Orders →
            </Link>
          </div>

          {recentOrders.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500 border border-dashed border-slate-200 rounded-xl">
              No recent dispatches recorded.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase text-[10px]">
                    <th className="pb-3">Order Number</th>
                    <th className="pb-3">Date</th>
                    <th className="pb-3">Amount (₹)</th>
                    <th className="pb-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {recentOrders.map((order, i) => (
                    <tr key={i} className="hover:bg-slate-50">
                      <td className="py-3 font-mono font-bold text-slate-900">
                        {order.order_number || `ORD-2026-0${i + 1}`}
                      </td>
                      <td className="py-3 text-slate-500">
                        {new Date(order.created_at || Date.now()).toLocaleDateString('en-IN')}
                      </td>
                      <td className="py-3 font-heading font-bold text-slate-900">
                        ₹{(order.total_amount_inr || 150000).toLocaleString('en-IN')}
                      </td>
                      <td className="py-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {order.status || 'Dispatched'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Right Column: Distributor Support & Hotline */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-50 text-blue-700 border border-blue-200">
              <FiPhoneCall size={18} />
            </div>
            <div>
              <h3 className="font-heading font-bold text-sm text-slate-900">
                Assigned Territory Hub
              </h3>
              <span className="text-[10px] text-slate-500">Direct Logistics Coordinator</span>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-500">Hub Partner:</span>
              <strong className="text-slate-900">{hub.business_name || 'Gujarat Solar Logistics'}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Territory:</span>
              <strong className="text-slate-900">Ahmedabad Regional Zone</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Hotline:</span>
              <strong className="text-blue-700">{hub.support_phone || '+91 98765 00001'}</strong>
            </div>
          </div>

          <Link
            to="/dealer/portal/hub"
            className="w-full py-2.5 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center gap-2 transition-all"
          >
            <FiMapPin size={14} /> Open Hub Details
          </Link>
        </div>

      </div>

    </div>
  );
}
