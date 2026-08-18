import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import {
  FiCheckCircle,
  FiMapPin,
  FiShield,
  FiDollarSign,
  FiTruck,
  FiArrowRight,
  FiAlertCircle,
} from 'react-icons/fi';
import api from '../services/api';

export default function CheckoutPage() {
  const { cart, refreshCart } = useCart();
  const { user, distributor, dealer } = useAuth();
  const navigate = useNavigate();

  const [shippingForm, setShippingForm] = useState({
    line: 'Plot 42, GIDC Industrial Logistics Estate',
    city: 'Ahmedabad',
    state: 'Gujarat',
    state_code: 'GJ',
    pincode: '380001',
    contact_name: user?.business_name || 'Warehouse Manager',
    contact_phone: user?.mobile || '9876500001',
  });

  const [gstin, setGstin] = useState(distributor?.gst_number || dealer?.gst_number || '24AAACC1206D1ZM');
  const [paymentMethod, setPaymentMethod] = useState('neft_rtgs');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const items = cart.items || [];
  const summary = cart.summary || {};

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError('');

      const buyerType = user?.role === 'dealer' ? 'dealer' : 'distributor';

      const payload = {
        buyer_id: user?.id,
        buyer_type: buyerType,
        items: items.map((i) => ({ product_id: i.product_id, quantity: i.quantity })),
        shipping_address: shippingForm,
        gst_number: gstin,
        payment_method: paymentMethod,
      };

      const res = await api.post('/order/create', payload);

      if (res.data?.success && res.data.order) {
        await refreshCart();
        navigate(`/order/success/${res.data.order.id}`);
      } else {
        setError(res.data?.message || 'Order creation failed.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to place order.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8 bg-[#FFFFFF]">
      
      <div>
        <span className="text-xs font-bold text-[#1F8F4E] uppercase tracking-widest bg-[#ECF8F1] px-3 py-1 rounded-full border border-[#DDE8E1]">
          Secure Commercial Gateway
        </span>
        <h1 className="font-heading font-black text-3xl sm:text-4xl text-[#17211B] mt-2">
          B2B Equipment Checkout
        </h1>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center gap-2">
          <FiAlertCircle className="text-red-500" /> {error}
        </div>
      )}

      <form onSubmit={handlePlaceOrder} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left 2 Columns: Delivery & GST Details */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Delivery Address */}
          <div className="p-6 rounded-3xl bg-[#FFFFFF] border border-[#DDE8E1] shadow-xs space-y-4">
            <h3 className="font-heading font-bold text-base text-[#17211B] flex items-center gap-2">
              <FiMapPin className="text-[#1F8F4E]" /> Delivery Warehouse & Consignee Address
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="sm:col-span-2">
                <label className="text-[#17211B] block mb-1 font-semibold">Street Address / Industrial Plot *</label>
                <input
                  type="text"
                  required
                  value={shippingForm.line}
                  onChange={(e) => setShippingForm({ ...shippingForm, line: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#F7FAF8] border border-[#DDE8E1] text-[#17211B] focus:outline-none focus:border-[#1F8F4E] focus:bg-[#FFFFFF]"
                />
              </div>
              <div>
                <label className="text-[#17211B] block mb-1 font-semibold">City / Hub *</label>
                <input
                  type="text"
                  required
                  value={shippingForm.city}
                  onChange={(e) => setShippingForm({ ...shippingForm, city: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#F7FAF8] border border-[#DDE8E1] text-[#17211B] focus:outline-none focus:border-[#1F8F4E] focus:bg-[#FFFFFF]"
                />
              </div>
              <div>
                <label className="text-[#17211B] block mb-1 font-semibold">Postal Code (PIN) *</label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  value={shippingForm.pincode}
                  onChange={(e) => setShippingForm({ ...shippingForm, pincode: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#F7FAF8] border border-[#DDE8E1] text-[#17211B] focus:outline-none focus:border-[#1F8F4E] focus:bg-[#FFFFFF]"
                />
              </div>
            </div>
          </div>

          {/* Statutory GST Details */}
          <div className="p-6 rounded-3xl bg-[#FFFFFF] border border-[#DDE8E1] shadow-xs space-y-4">
            <h3 className="font-heading font-bold text-base text-[#17211B] flex items-center gap-2">
              <FiShield className="text-[#1F8F4E]" /> Statutory GSTIN for Input Tax Credit (ITC)
            </h3>

            <div>
              <label className="text-[#17211B] block mb-1 font-semibold text-xs">Buyer GSTIN Number *</label>
              <input
                type="text"
                required
                maxLength={15}
                value={gstin}
                onChange={(e) => setGstin(e.target.value.toUpperCase())}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#F7FAF8] border border-[#DDE8E1] font-mono text-[#1F8F4E] uppercase text-xs focus:outline-none focus:border-[#1F8F4E] focus:bg-[#FFFFFF] font-bold"
              />
              <span className="text-[11px] text-[#5F6F65] mt-1 block">
                A digitally signed GST invoice with HSN classification will be auto-generated.
              </span>
            </div>
          </div>

          {/* Payment Method Selector */}
          <div className="p-6 rounded-3xl bg-[#FFFFFF] border border-[#DDE8E1] shadow-xs space-y-4">
            <h3 className="font-heading font-bold text-base text-[#17211B] flex items-center gap-2">
              <FiDollarSign className="text-[#1F8F4E]" /> Payment & Settlement Method
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              {[
                { id: 'neft_rtgs', title: 'Direct RTGS / NEFT', desc: 'Direct bank transfer to SolarKits escrow' },
                { id: 'upi_gateway', title: 'Instant UPI / Card', desc: 'Instant gateway clearance' },
                { id: 'credit_line', title: '30-Day B2B Credit', desc: 'Approved dealer credit line' },
              ].map((m) => (
                <div
                  key={m.id}
                  onClick={() => setPaymentMethod(m.id)}
                  className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                    paymentMethod === m.id
                      ? 'bg-[#ECF8F1] border-[#1F8F4E] text-[#17211B] shadow-xs'
                      : 'bg-[#F7FAF8] border-[#DDE8E1] text-[#5F6F65] hover:border-[#1F8F4E]/40'
                  }`}
                >
                  <div className="font-bold text-[#17211B] text-sm">{m.title}</div>
                  <div className="text-[11px] text-[#5F6F65] mt-1">{m.desc}</div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Right 1 Column: Quote Breakdown & Place Order */}
        <div className="space-y-6">
          <div className="p-6 rounded-3xl bg-[#FFFFFF] border border-[#DDE8E1] shadow-xs space-y-5">
            <h3 className="font-heading font-bold text-base text-[#17211B]">Order Summary</h3>

            <div className="space-y-2.5 text-xs border-t border-[#DDE8E1] pt-4">
              <div className="flex justify-between text-[#5F6F65]">
                <span>Total Items:</span>
                <span className="text-[#17211B] font-semibold">{items.reduce((acc, i) => acc + i.quantity, 0)} Units</span>
              </div>
              <div className="flex justify-between text-[#5F6F65]">
                <span>Net Taxable Value:</span>
                <span className="text-[#17211B] font-bold">₹{(summary.net_taxable_inr || 0).toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-[#5F6F65]">
                <span>Applicable GST (12%):</span>
                <span className="text-[#1F8F4E] font-semibold">₹{(summary.total_tax_inr || 0).toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-[#5F6F65]">
                <span>Commercial Freight:</span>
                <span className="text-[#1F8F4E] font-semibold">
                  {summary.shipping_inr === 0 ? 'FREE' : `₹${summary.shipping_inr?.toLocaleString('en-IN')}`}
                </span>
              </div>
            </div>

            <div className="pt-4 border-t border-[#DDE8E1] flex items-baseline justify-between">
              <div>
                <span className="text-xs text-[#5F6F65] block font-medium">Payable Total</span>
                <span className="text-[10px] text-[#1F8F4E] font-bold">incl. all taxes</span>
              </div>
              <div className="font-heading font-black text-2xl text-[#1F8F4E]">
                ₹{(summary.grand_total_inr || 0).toLocaleString('en-IN')}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || items.length === 0}
              className="w-full py-4 rounded-xl text-xs font-bold bg-[#1F8F4E] text-white hover:bg-[#18733E] shadow-xs flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              {loading ? 'Confirming Order...' : 'Confirm & Place B2B Order'} <FiArrowRight className="text-[#F5B700]" />
            </button>
          </div>
        </div>

      </form>

    </div>
  );
}
