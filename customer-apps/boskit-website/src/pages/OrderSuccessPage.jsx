import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  FiCheckCircle,
  FiFileText,
  FiTruck,
  FiPackage,
  FiMapPin,
  FiArrowRight,
  FiDownload,
} from 'react-icons/fi';
import api from '../services/api';

export default function OrderSuccessPage() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get(`/order/${id}`)
      .then((res) => {
        if (res.data?.success) setOrder(res.data.order);
      })
      .catch((err) => console.error('Order fetch error:', err))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return <div className="p-12 text-center text-[#475569]">Loading order receipt...</div>;
  }

  if (!order) {
    return (
      <div className="p-12 text-center text-red-600 space-y-4 bg-[#FFFFFF]">
        <div>Order record not found.</div>
        <Link to="/products" className="underline text-xs text-[#0575B8]">Back to Catalogue</Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 space-y-8 bg-[#FFFFFF]">
      
      {/* Success Badge */}
      <div className="text-center space-y-3">
        <div className="w-16 h-16 rounded-3xl bg-[#EFF8FF] text-[#0575B8] border border-[#E2E8F0] flex items-center justify-center mx-auto text-3xl shadow-xs">
          <FiCheckCircle />
        </div>
        <span className="text-xs font-bold text-[#0575B8] uppercase tracking-widest bg-[#EFF8FF] px-3 py-1 rounded-full border border-[#E2E8F0]">
          B2B Order Confirmed & Stock Reserved
        </span>
        <h1 className="font-heading font-black text-3xl sm:text-4xl text-[#0F172A] mt-2">
          Thank You For Your Order!
        </h1>
        <p className="text-xs sm:text-sm text-[#475569] max-w-xl mx-auto">
          Your equipment requisition has been received. Warehouse dispatch instructions have been generated.
        </p>
      </div>

      {/* Order & Invoice Details Card */}
      <div className="p-6 sm:p-8 rounded-3xl bg-[#FFFFFF] border border-[#E2E8F0] shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E2E8F0] pb-5">
          <div>
            <span className="text-[10px] text-[#475569] uppercase font-mono">Order Number</span>
            <div className="font-heading font-black text-xl text-[#0F172A]">{order.order_number}</div>
          </div>
          <div>
            <span className="text-[10px] text-[#475569] uppercase font-mono">Tax Invoice Serial</span>
            <div className="font-mono font-bold text-[#0575B8]">{order.invoice_number}</div>
          </div>
          <div>
            <span className="text-[10px] text-[#475569] uppercase font-mono">Grand Total</span>
            <div className="font-heading font-black text-xl text-[#0575B8]">
              ₹{(order.grand_total_inr || 0).toLocaleString('en-IN')}
            </div>
          </div>
        </div>

        {/* Ordered Items */}
        <div className="space-y-3">
          <h4 className="font-heading font-bold text-xs text-[#475569] uppercase tracking-wider">
            Requisitioned Solar Equipment
          </h4>
          <div className="divide-y divide-[#E2E8F0]">
            {(order.items || []).map((item, idx) => (
              <div key={idx} className="py-3 flex items-center justify-between text-xs">
                <div>
                  <span className="font-bold text-[#0F172A] block">{item.product_name}</span>
                  <span className="text-[#475569] font-mono text-[10px]">Qty: {item.quantity} Units</span>
                </div>
                <div className="font-bold text-[#0F172A]">
                  ₹{(item.line_total_inr || 0).toLocaleString('en-IN')}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Shipping Address */}
        <div className="p-4 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] flex items-start gap-3 text-xs">
          <FiMapPin className="text-[#0575B8] mt-0.5 shrink-0" size={16} />
          <div>
            <strong className="text-[#0F172A] block">Dispatch Destination</strong>
            <span className="text-[#475569]">
              {order.delivery_address?.line}, {order.delivery_address?.city} - {order.delivery_address?.pincode}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-[#E2E8F0]">
          <button
            onClick={() => window.print()}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs font-bold bg-[#F8FAFC] hover:bg-[#EFF8FF] text-[#0F172A] border border-[#E2E8F0] flex items-center justify-center gap-2 transition-colors"
          >
            <FiDownload /> Print Commercial Tax Invoice
          </button>

          <Link
            to="/products"
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl text-xs font-bold bg-[#0575B8] hover:bg-[#045D93] text-white shadow-xs flex items-center justify-center gap-2 transition-all"
          >
            Order Additional Stock <FiArrowRight className="text-[#F49222]" />
          </Link>
        </div>

      </div>

    </div>
  );
}
