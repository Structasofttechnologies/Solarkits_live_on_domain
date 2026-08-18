import React, { useState, useEffect } from 'react';
import { FiShoppingCart, FiTruck, FiRefreshCw, FiCheckCircle } from 'react-icons/fi';
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
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-heading font-black text-2xl sm:text-3xl text-[#17211B]">
            Dealer Equipment Orders & Dispatches
          </h1>
          <p className="text-xs sm:text-sm text-[#5F6F65] mt-0.5">
            Track order fulfillment, distributor depot dispatch status, and carrier tracking IDs.
          </p>
        </div>

        <button
          onClick={fetchOrders}
          className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#FFFFFF] hover:bg-[#F7FAF8] text-[#17211B] border border-[#DDE8E1] flex items-center gap-2 self-start shadow-xs"
        >
          <FiRefreshCw className={loading ? 'animate-spin' : ''} /> Refresh
        </button>
      </div>

      <div className="p-6 rounded-3xl bg-[#FFFFFF] border border-[#DDE8E1] shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-[#17211B]">
            <thead className="bg-[#F7FAF8] text-[#5F6F65] font-bold uppercase text-[10px] border-b border-[#DDE8E1]">
              <tr>
                <th className="p-3.5">Order Reference</th>
                <th className="p-3.5">Total Amount</th>
                <th className="p-3.5">Tracking / Dispatch Ref</th>
                <th className="p-3.5">Fulfillment Status</th>
                <th className="p-3.5">Order Placed</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#DDE8E1]">
              {loading ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-[#5F6F65]">
                    Loading orders...
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-[#5F6F65]">
                    No orders placed yet.
                  </td>
                </tr>
              ) : (
                orders.map((o) => (
                  <tr key={o.id} className="hover:bg-[#F7FAF8] transition-colors">
                    <td className="p-3.5 font-mono font-bold text-[#17211B] text-sm">{o.order_number}</td>
                    <td className="p-3.5 font-bold text-[#1F8F4E]">₹{o.grand_total_inr.toLocaleString('en-IN')}</td>
                    <td className="p-3.5 font-mono text-[#5F6F65]">
                      {o.tracking_number ? (
                        <span className="text-[#1F8F4E] font-semibold">{o.tracking_number}</span>
                      ) : (
                        'Depot Pickup Ready'
                      )}
                    </td>
                    <td className="p-3.5">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-[#ECF8F1] text-[#1F8F4E] border border-[#DDE8E1]">
                        {o.status}
                      </span>
                    </td>
                    <td className="p-3.5 text-[#5F6F65]">{new Date(o.created_at).toLocaleDateString('en-IN')}</td>
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
