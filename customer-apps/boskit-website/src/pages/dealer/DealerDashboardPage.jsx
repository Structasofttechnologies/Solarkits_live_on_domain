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
} from 'react-icons/fi';
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
    return <div className="p-8 text-center text-[#5F6F65]">Loading Installer Console...</div>;
  }

  const hub = data?.distributor_hub || {};
  const metrics = data?.metrics || {};
  const recentOrders = data?.recent_orders || [];

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      
      {/* Top Banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-[#ECF8F1] border border-[#DDE8E1] flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-[#1F8F4E] uppercase tracking-widest">
            <FiShield /> Certified Solar Installer & EPC Contractor
          </div>
          <h1 className="font-heading font-black text-2xl sm:text-3xl text-[#17211B] mt-1">
            {dealer?.business_name || user?.business_name || 'Dealer Solar Center'}
          </h1>
          <p className="text-xs sm:text-sm text-[#5F6F65] mt-1 max-w-2xl">
            Procure Tier-1 PV modules, inverters, and BOS components directly from your regional distributor depot with zero middleman markups.
          </p>
        </div>

        <Link
          to="/dealer/portal/catalogue"
          className="px-5 py-2.5 rounded-xl text-xs font-bold bg-[#1F8F4E] hover:bg-[#18733E] text-white shadow-xs flex items-center gap-2 transition-all"
        >
          <FiShoppingCart size={16} /> Procure Solar Equipment <FiArrowRight />
        </Link>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        
        {/* Assigned Hub */}
        <div className="p-6 rounded-3xl bg-[#FFFFFF] border border-[#DDE8E1] shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#5F6F65]">Assigned Regional Hub</span>
            <div className="p-2.5 rounded-2xl bg-[#ECF8F1] text-[#1F8F4E] border border-[#DDE8E1]">
              <FiMapPin size={18} />
            </div>
          </div>
          <div className="mt-4">
            <div className="font-heading font-bold text-base text-[#17211B] truncate">{hub.business_name || 'Gujarat Hub'}</div>
            <span className="text-[10px] font-bold text-[#1F8F4E] bg-[#ECF8F1] border border-[#DDE8E1] px-2 py-0.5 rounded mt-1 inline-block">
              {hub.warehouse_city || 'Ahmedabad'} Depot
            </span>
          </div>
        </div>

        {/* Pricing Tier */}
        <div className="p-6 rounded-3xl bg-[#FFFFFF] border border-[#DDE8E1] shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#5F6F65]">Active Pricing Tier</span>
            <div className="p-2.5 rounded-2xl bg-[#ECF8F1] text-[#1F8F4E] border border-[#DDE8E1]">
              <FiTrendingUp size={18} />
            </div>
          </div>
          <div className="mt-4">
            <div className="font-heading font-bold text-lg text-[#1F8F4E]">Gold Wholesale Rate</div>
            <span className="text-[10px] font-bold text-[#1F8F4E] bg-[#ECF8F1] border border-[#DDE8E1] px-2 py-0.5 rounded mt-1 inline-block">
              -18% Discount applied
            </span>
          </div>
        </div>

        {/* Lifetime Procurement */}
        <div className="p-6 rounded-3xl bg-[#FFFFFF] border border-[#DDE8E1] shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#5F6F65]">Lifetime Procurement</span>
            <div className="p-2.5 rounded-2xl bg-[#ECF8F1] text-[#1F8F4E] border border-[#DDE8E1]">
              <FiZap size={18} />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <span className="font-heading font-black text-3xl text-[#17211B]">
              ₹{(metrics.lifetime_procurement_inr || 450000).toLocaleString('en-IN')}
            </span>
          </div>
        </div>

        {/* Total Orders */}
        <div className="p-6 rounded-3xl bg-[#FFFFFF] border border-[#DDE8E1] shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#5F6F65]">Fulfilled Dispatches</span>
            <div className="p-2.5 rounded-2xl bg-[#ECF8F1] text-[#1F8F4E] border border-[#DDE8E1]">
              <FiTruck size={18} />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <span className="font-heading font-black text-3xl text-[#17211B]">
              {metrics.total_orders_count || 3}
            </span>
            <span className="text-[10px] font-bold text-[#1F8F4E] bg-[#ECF8F1] border border-[#DDE8E1] px-2 py-0.5 rounded">
              100% On-Time
            </span>
          </div>
        </div>

      </div>

      {/* Main Grid: Orders & Hub Hotline */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left 2 Columns: Orders Table */}
        <div className="lg:col-span-2 p-6 sm:p-8 rounded-3xl bg-[#FFFFFF] border border-[#DDE8E1] shadow-xs space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-heading font-bold text-lg text-[#17211B]">Recent Equipment Dispatches</h3>
              <p className="text-xs text-[#5F6F65]">Track shipments dispatched from your regional hub depot.</p>
            </div>
            <Link to="/dealer/portal/orders" className="text-xs font-bold text-[#1F8F4E] hover:text-[#18733E] flex items-center gap-1">
              View All Orders <FiArrowRight />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-[#17211B]">
              <thead className="bg-[#F7FAF8] text-[#5F6F65] font-bold uppercase text-[10px] border-b border-[#DDE8E1]">
                <tr>
                  <th className="p-3.5">Order Ref</th>
                  <th className="p-3.5">Total Amount</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5">Order Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#DDE8E1]">
                {recentOrders.map((o) => (
                  <tr key={o.id} className="hover:bg-[#F7FAF8] transition-colors">
                    <td className="p-3.5 font-bold font-mono text-[#17211B]">{o.order_number}</td>
                    <td className="p-3.5 font-bold text-[#1F8F4E]">₹{o.grand_total_inr.toLocaleString('en-IN')}</td>
                    <td className="p-3.5">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-[#ECF8F1] text-[#1F8F4E] border border-[#DDE8E1]">
                        {o.status}
                      </span>
                    </td>
                    <td className="p-3.5 text-[#5F6F65]">{new Date(o.created_at).toLocaleDateString('en-IN')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right 1 Column: Distributor Hub Box */}
        <div className="p-6 rounded-3xl bg-[#FFFFFF] border border-[#DDE8E1] shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-heading font-bold text-sm text-[#17211B] flex items-center gap-2">
              <FiMapPin className="text-[#1F8F4E]" /> Your Regional Hub Depot
            </h4>
            <span className="text-[10px] font-bold bg-[#ECF8F1] text-[#1F8F4E] border border-[#DDE8E1] px-2 py-0.5 rounded">
              Active Link
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-[#F7FAF8] border border-[#DDE8E1] space-y-2.5 text-xs">
            <div className="font-bold text-[#17211B] text-sm">{hub.business_name}</div>
            <div className="text-[#5F6F65] text-[11px]">{hub.warehouse_address}</div>
            <div className="pt-2 border-t border-[#DDE8E1] flex justify-between text-[#17211B]">
              <span>Depot City:</span>
              <strong className="text-[#17211B]">{hub.warehouse_city}</strong>
            </div>
            <div className="flex justify-between text-[#17211B]">
              <span>Support Hotline:</span>
              <strong className="text-[#1F8F4E]">{hub.mobile}</strong>
            </div>
          </div>

          <Link
            to="/dealer/portal/hub"
            className="block w-full py-2.5 rounded-xl text-xs font-bold text-center bg-[#F7FAF8] hover:bg-[#ECF8F1] text-[#17211B] border border-[#DDE8E1] transition-colors"
          >
            View Warehouse Depot Details
          </Link>
        </div>

      </div>

    </div>
  );
}
