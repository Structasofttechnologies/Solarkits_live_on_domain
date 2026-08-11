import { useState, useEffect } from "react";
import api from "../services/api";
import { FiShoppingCart, FiCheckCircle, FiClock, FiXCircle, FiLoader, FiZap, FiShoppingBag } from "react-icons/fi";

export default function MyOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Reseller can query attributed orders via admin or portal endpoint
    api.get('/reseller-mgmt/orders/list?req_for=view&unique_id=RSL_MGMT')
      .then((res) => { if (res.data?.status === "success") setOrders(res.data.data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2.5">
          <FiShoppingCart className="text-blue-600" size={28} />
          My Attributed Business Orders
        </h1>
        <p className="text-sm font-medium text-slate-600 mt-1">
          Track orders placed under Commission Mode and Wholesale Dealer Mode
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20 text-slate-500 font-bold gap-2">
            <FiLoader className="animate-spin text-blue-600" size={24} /> Loading orders...
          </div>
        ) : orders.length === 0 ? (
          <div className="py-20 text-center text-slate-600 text-sm font-semibold">
            No attributed orders found for your partner account.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="text-left text-slate-700 font-extrabold px-6 py-4 uppercase text-xs tracking-wider">Order ID & Date</th>
                  <th className="text-left text-slate-700 font-extrabold px-6 py-4 uppercase text-xs tracking-wider">Commercial Mode</th>
                  <th className="text-right text-slate-700 font-extrabold px-6 py-4 uppercase text-xs tracking-wider">Selling Price</th>
                  <th className="text-right text-slate-700 font-extrabold px-6 py-4 uppercase text-xs tracking-wider">Commission / Discount</th>
                  <th className="text-center text-slate-700 font-extrabold px-6 py-4 uppercase text-xs tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {orders.map((o) => (
                  <tr key={o.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-extrabold text-slate-900 font-mono text-xs">{o.id}</div>
                      <div className="text-xs font-semibold text-slate-500 mt-0.5">{new Date(o.created_at).toLocaleDateString()}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold ${
                        o.commercial_mode === 'commission' ? 'bg-blue-100 text-blue-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {o.commercial_mode === 'commission' ? <FiZap size={12} /> : <FiShoppingBag size={12} />}
                        <span className="capitalize">{o.commercial_mode}</span>
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right font-black text-slate-900 text-base">
                      ₹{(o.selling_price_snapshot || 0).toLocaleString("en-IN")}
                    </td>
                    <td className="px-6 py-4 text-right font-extrabold text-sm">
                      {o.commercial_mode === 'commission' ? (
                        <span className="text-emerald-600">+₹{(o.reseller_commission_amount || 0).toLocaleString("en-IN")}</span>
                      ) : (
                        <span className="text-amber-600">-₹{(o.dealer_discount_amount || 0).toLocaleString("en-IN")}</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold capitalize ${
                        o.status === 'completed' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {o.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
