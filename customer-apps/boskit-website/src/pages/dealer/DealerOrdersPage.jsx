import React, { useState, useEffect } from 'react';
import {
  FiShoppingCart,
  FiTruck,
  FiRefreshCw,
  FiCheckCircle,
  FiPackage,
} from 'react-icons/fi';
import api from '../../services/api';

export default function DealerOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = () => {
    setLoading(true);
    api
      .get('/dealer/orders')
      .then((res) => {
        if (res.data?.success) setOrders(res.data.orders || []);
      })
      .catch((err) => console.error('Error fetching orders:', err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      
      {/* ── Royal Blue Header Banner ────────────────────────────────────────── */}
      <div className="bg-[#185ADB] rounded-2xl p-6 sm:p-8 text-white shadow-md relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-white text-xs font-semibold backdrop-blur-md mb-2">
              <FiTruck size={14} />
              <span>Logistics & Fulfillment</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight font-heading">
              Dealer Equipment Orders & Dispatches
            </h1>
            <p className="mt-1 text-blue-100 text-xs sm:text-sm">
              Track order fulfillment, distributor depot dispatch status, and carrier tracking IDs.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchOrders}
              className="p-3 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all border border-white/20 cursor-pointer active:scale-95 shadow-xs flex items-center gap-2 text-xs font-bold"
              title="Refresh orders"
            >
              <FiRefreshCw className={loading ? 'animate-spin' : ''} size={16} />
              <span>Refresh</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── Orders Table ────────────────────────────────────────────────────── */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-800">
            <thead className="bg-slate-50 text-slate-400 font-bold uppercase text-[10px] border-b border-slate-200">
              <tr>
                <th className="p-3.5">Order Reference</th>
                <th className="p-3.5">Total Amount</th>
                <th className="p-3.5">Tracking / Dispatch Ref</th>
                <th className="p-3.5">Fulfillment Status</th>
                <th className="p-3.5">Order Placed</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-500">
                    Loading orders...
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-500">
                    No orders placed yet.
                  </td>
                </tr>
              ) : (
                orders.map((o) => (
                  <tr key={o.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-3.5 font-mono font-bold text-slate-900 text-sm">
                      {o.order_number}
                    </td>
                    <td className="p-3.5 font-heading font-bold text-[#185ADB]">
                      ₹{o.grand_total_inr.toLocaleString('en-IN')}
                    </td>
                    <td className="p-3.5 font-mono text-slate-500">
                      {o.tracking_number ? (
                        <span className="text-blue-700 font-semibold">{o.tracking_number}</span>
                      ) : (
                        'Depot Pickup Ready'
                      )}
                    </td>
                    <td className="p-3.5">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {o.status}
                      </span>
                    </td>
                    <td className="p-3.5 text-slate-500">
                      {new Date(o.created_at).toLocaleDateString('en-IN')}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
