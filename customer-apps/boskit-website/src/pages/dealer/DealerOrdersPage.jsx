import React, { useState, useEffect } from 'react';
import {
  FiShoppingCart,
  FiTruck,
  FiRefreshCw,
  FiCheckCircle,
  FiPackage,
  FiFileText,
  FiPrinter,
  FiX,
  FiMapPin,
  FiCalendar,
} from 'react-icons/fi';
import api from '../../services/api';

export default function DealerOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);

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
      
      {/* ── Header Banner ─────────────────────────────────────────────────── */}
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
              Track equipment batches, regional depot dispatch statuses, carrier tracking, and download tax proforma invoices.
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
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="font-heading font-bold text-base text-slate-900">
              Procurement Orders ({orders.length})
            </h2>
            <span className="text-[11px] text-slate-500">
              All wholesale solar equipment batches dispatched from regional hub
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-800">
            <thead className="bg-slate-50 text-slate-400 font-bold uppercase text-[10px] border-b border-slate-200">
              <tr>
                <th className="p-3.5 sm:p-4">Order Number</th>
                <th className="p-3.5 sm:p-4">Order Date</th>
                <th className="p-3.5 sm:p-4">Items Summary</th>
                <th className="p-3.5 sm:p-4">Grand Total (₹)</th>
                <th className="p-3.5 sm:p-4">Fulfillment Status</th>
                <th className="p-3.5 sm:p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500">
                    Loading procurement orders...
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-slate-500 space-y-2">
                    <FiPackage size={32} className="mx-auto text-slate-300" />
                    <p className="font-semibold text-slate-700">No wholesale orders recorded yet.</p>
                    <p className="text-[11px] text-slate-400">Add equipment from the wholesale catalogue to place your first order.</p>
                  </td>
                </tr>
              ) : (
                orders.map((o) => (
                  <tr key={o.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3.5 sm:p-4 font-mono font-bold text-slate-900 text-xs sm:text-sm">
                      {o.order_number}
                    </td>
                    <td className="p-3.5 sm:p-4 text-slate-500">
                      <div className="flex items-center gap-1.5">
                        <FiCalendar size={13} className="text-slate-400" />
                        <span>{new Date(o.created_at || Date.now()).toLocaleDateString('en-IN')}</span>
                      </div>
                    </td>
                    <td className="p-3.5 sm:p-4 text-slate-600">
                      <div className="font-semibold text-slate-900">
                        {o.items?.length ? `${o.items.length} Equipment SKUs` : `${o.items_count || 1} SKUs`}
                      </div>
                      <span className="text-[10px] text-slate-400 truncate max-w-xs block">
                        {o.items?.map((i) => `${i.quantity}x ${i.name}`).join(', ') || 'Wholesale Solar Modules & Inverters'}
                      </span>
                    </td>
                    <td className="p-3.5 sm:p-4 font-heading font-black text-sm text-[#185ADB]">
                      ₹{(o.grand_total_inr || 0).toLocaleString('en-IN')}
                    </td>
                    <td className="p-3.5 sm:p-4">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-emerald-50 text-emerald-700 border border-emerald-200 inline-block">
                        {o.status || 'Confirmed'}
                      </span>
                      {o.tracking_number && (
                        <span className="text-[10px] text-blue-700 font-mono block mt-1">
                          Track: {o.tracking_number}
                        </span>
                      )}
                    </td>
                    <td className="p-3.5 sm:p-4 text-right">
                      <button
                        onClick={() => setSelectedOrder(o)}
                        className="px-3 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold text-[11px] inline-flex items-center gap-1.5 cursor-pointer transition-colors shadow-2xs"
                      >
                        <FiFileText size={13} /> View Invoice
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Order Tax Invoice / Proforma Modal ──────────────────────────────── */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            
            <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white/95 backdrop-blur-xs z-10">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-blue-50 text-blue-700">
                  <FiFileText size={18} />
                </div>
                <div>
                  <h3 className="font-heading font-black text-base text-slate-900">
                    B2B Wholesale Tax Invoice
                  </h3>
                  <span className="text-[11px] font-mono text-slate-500">
                    Ref: {selectedOrder.order_number}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-3 py-1.5 rounded-xl border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-50 flex items-center gap-1.5 cursor-pointer"
                >
                  <FiPrinter size={14} /> Print
                </button>
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
                >
                  <FiX size={18} />
                </button>
              </div>
            </div>

            <div className="p-5 sm:p-6 space-y-6 text-xs text-slate-700">
              
              {/* Distributor Depot & Dealer Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 border border-slate-200 p-4 rounded-2xl">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Fulfillment Distributor Hub</span>
                  <strong className="text-slate-900 block text-xs">BOSKIT Central Regional Logistics Hub</strong>
                  <div className="text-slate-500 text-[11px] mt-0.5">
                    GSTIN: 24AAACC1206D1ZM<br />
                    101, Solar Logistics Depot, Industrial Area, Ahmedabad, GJ
                  </div>
                </div>

                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Billed To Dealer</span>
                  <strong className="text-slate-900 block text-xs">{selectedOrder.billing_name || 'Authorized Solar Dealer'}</strong>
                  <div className="text-slate-500 text-[11px] mt-0.5">
                    GSTIN: {selectedOrder.billing_gst_number || '24AABCS1429B1Z8'}<br />
                    {selectedOrder.delivery_address?.line || 'Commercial Dealer Shop, Ahmedabad'}
                  </div>
                </div>
              </div>

              {/* Items Table */}
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-600 font-bold text-[10px] uppercase border-b border-slate-200">
                    <tr>
                      <th className="p-2.5">Item & SKU</th>
                      <th className="p-2.5 text-center">Qty</th>
                      <th className="p-2.5 text-right">Wholesale Rate</th>
                      <th className="p-2.5 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(selectedOrder.items || []).map((item, idx) => (
                      <tr key={idx}>
                        <td className="p-2.5 font-medium text-slate-900">
                          {item.name}
                          <span className="block text-[10px] font-mono text-slate-400">{item.sku}</span>
                        </td>
                        <td className="p-2.5 text-center font-mono">{item.quantity}</td>
                        <td className="p-2.5 text-right font-mono">₹{(item.unit_price_inr || 0).toLocaleString('en-IN')}</td>
                        <td className="p-2.5 text-right font-mono font-bold">
                          ₹{((item.unit_price_inr || 0) * (item.quantity || 1)).toLocaleString('en-IN')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Totals Summary */}
              <div className="p-4 bg-slate-50 rounded-xl space-y-1.5 border border-slate-200 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Subtotal (Taxable Value):</span>
                  <strong className="font-mono">₹{(selectedOrder.subtotal_inr || Math.round((selectedOrder.grand_total_inr || 0) / 1.18)).toLocaleString('en-IN')}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">18% GST (CGST 9% + SGST 9%):</span>
                  <strong className="font-mono">₹{(selectedOrder.tax_total_inr || Math.round((selectedOrder.grand_total_inr || 0) * 0.18 / 1.18)).toLocaleString('en-IN')}</strong>
                </div>
                <div className="flex justify-between font-bold text-sm text-slate-900 border-t border-slate-200 pt-1.5">
                  <span>Grand Total (INR):</span>
                  <span className="text-[#185ADB] font-heading font-black text-base">
                    ₹{(selectedOrder.grand_total_inr || 0).toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              {/* Input Tax Credit Notice */}
              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-800 text-[11px] flex items-center gap-2">
                <FiCheckCircle size={14} className="text-emerald-600 shrink-0" />
                <span>
                  Authorized B2B Wholesale Invoice. 100% Input Tax Credit available in your GST filing.
                </span>
              </div>

            </div>

          </div>
        </div>
      )}

    </div>
  );
}
