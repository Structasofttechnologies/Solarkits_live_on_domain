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
    return <div className="p-12 text-center text-[#5F6F65]">Loading order receipt...</div>;
  }

  if (!order) {
    return (
      <div className="p-12 text-center text-red-600 space-y-4 bg-[#FFFFFF]">
        <div>Order record not found.</div>
        <Link to="/products" className="underline text-xs text-[#1F8F4E]">Back to Catalogue</Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 space-y-8 bg-[#FFFFFF]">
      
      {/* Success Badge */}
      <div className="text-center space-y-3">
        <div className="w-16 h-16 rounded-3xl bg-[#ECF8F1] text-[#1F8F4E] border border-[#DDE8E1] flex items-center justify-center mx-auto text-3xl shadow-xs">
          <FiCheckCircle />
        </div>
        <span className="text-xs font-bold text-[#1F8F4E] uppercase tracking-widest bg-[#ECF8F1] px-3 py-1 rounded-full border border-[#DDE8E1]">
          B2B Order Confirmed & Stock Reserved
        </span>
        <h1 className="font-heading font-black text-3xl sm:text-4xl text-[#17211B] mt-2">
          Thank You For Your Order!
        </h1>
        <p className="text-xs sm:text-sm text-[#5F6F65] max-w-xl mx-auto">
          Your equipment requisition has been received. Warehouse dispatch instructions have been generated.
        </p>
      </div>

      {/* Order & Invoice Details Card */}
      <div className="p-6 sm:p-8 rounded-3xl bg-[#FFFFFF] border border-[#DDE8E1] shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#DDE8E1] pb-5">
          <div>
            <span className="text-[10px] text-[#5F6F65] uppercase font-mono">Order Number</span>
            <div className="font-heading font-black text-xl text-[#17211B]">{order.order_number}</div>
          </div>
          <div>
            <span className="text-[10px] text-[#5F6F65] uppercase font-mono">Tax Invoice Serial</span>
            <div className="font-mono font-bold text-[#1F8F4E]">{order.invoice_number}</div>
          </div>
          <div>
            <span className="text-[10px] text-[#5F6F65] uppercase font-mono">Grand Total</span>
            <div className="font-heading font-black text-xl text-[#1F8F4E]">
              ₹{(order.grand_total_inr || 0).toLocaleString('en-IN')}
            </div>
          </div>
        </div>

        {/* Ordered Items */}
        <div className="space-y-3">
          <h4 className="font-heading font-bold text-xs text-[#5F6F65] uppercase tracking-wider">
            Requisitioned Solar Equipment
          </h4>
          <div className="divide-y divide-[#DDE8E1]">
            {(order.items || []).map((item, idx) => (
              <div key={idx} className="py-3 flex items-center justify-between text-xs">
                <div>
                  <span className="font-bold text-[#17211B] block">{item.product_name}</span>
                  <span className="text-[#5F6F65] font-mono text-[10px]">Qty: {item.quantity} Units</span>
                </div>
                <div className="font-bold text-[#17211B]">
                  ₹{(item.line_total_inr || 0).toLocaleString('en-IN')}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Shipping Address */}
        <div className="p-4 rounded-2xl bg-[#F7FAF8] border border-[#DDE8E1] flex items-start gap-3 text-xs">
          <FiMapPin className="text-[#1F8F4E] mt-0.5 shrink-0" size={16} />
          <div>
            <strong className="text-[#17211B] block">Dispatch Destination</strong>
            <span className="text-[#5F6F65]">
              {order.delivery_address?.line}, {order.delivery_address?.city} - {order.delivery_address?.pincode}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-[#DDE8E1]">
          <button
            onClick={() => window.print()}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs font-bold bg-[#F7FAF8] hover:bg-[#ECF8F1] text-[#17211B] border border-[#DDE8E1] flex items-center justify-center gap-2 transition-colors"
          >
            <FiDownload /> Print Commercial Tax Invoice
          </button>

          <Link
            to="/products"
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl text-xs font-bold bg-[#1F8F4E] hover:bg-[#18733E] text-white shadow-xs flex items-center justify-center gap-2 transition-all"
          >
            Order Additional Stock <FiArrowRight className="text-[#F5B700]" />
          </Link>
        </div>

      </div>

    </div>
  );
}
