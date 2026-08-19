import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  FiCheckCircle,
  FiTruck,
  FiShield,
  FiMapPin,
  FiCreditCard,
  FiFileText,
  FiArrowLeft,
  FiArrowRight,
  FiInfo,
  FiPrinter,
  FiPackage,
} from 'react-icons/fi';
import { MdSolarPower, MdAccountBalance, MdCheckCircle } from 'react-icons/md';
import { useAuth } from '../../context/AuthContext';
import { useDealerCart } from '../../context/DealerCartContext';
import api from '../../services/api';

export default function DealerCheckoutPage() {
  const navigate = useNavigate();
  const { user, dealer } = useAuth();
  const {
    cartItems,
    totalItemsCount,
    subtotalInr,
    gstAmountInr,
    freightInr,
    grandTotalInr,
    deliveryMode,
    setDeliveryMode,
    clearCart,
  } = useDealerCart();

  const [paymentMethod, setPaymentMethod] = useState('neft_rtgs');
  const [shippingAddress, setShippingAddress] = useState({
    line: dealer?.shop_address?.line || 'Plot 42, Solar Energy Zone, GIDC Phase 3',
    city: dealer?.shop_address?.city || 'Ahmedabad',
    state: 'Gujarat',
    pincode: dealer?.shop_address?.pincode || '380001',
    contact_name: dealer?.authorized_person?.name || dealer?.business_name || 'Dealer Solar Enterprise',
    contact_phone: dealer?.mobile || '9876500002',
  });

  const [billingDetails, setBillingDetails] = useState({
    business_name: dealer?.business_name || user?.business_name || 'Dealer Solar Enterprise Pvt Ltd',
    gst_number: dealer?.gst_number || '24AABCS1429B1Z8',
    pan_number: dealer?.pan_number || 'AABCS1429B',
    email: dealer?.email || user?.email || 'dealer@solarkits.in',
    phone: dealer?.mobile || '9876500002',
  });

  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(null);

  // If cart is empty and not success, redirect back to catalogue
  if (cartItems.length === 0 && !orderSuccess) {
    return (
      <div className="p-12 text-center max-w-lg mx-auto space-y-4">
        <div className="w-16 h-16 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
          <FiTruck size={32} />
        </div>
        <h2 className="font-heading font-black text-xl text-slate-900">No items to checkout</h2>
        <p className="text-xs text-slate-500">Your wholesale cart is empty.</p>
        <Link
          to="/dealer/portal/catalogue"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#185ADB] text-white text-xs font-bold shadow-xs hover:bg-blue-700"
        >
          <FiArrowLeft /> Return to Catalogue
        </Link>
      </div>
    );
  }

  // Handle Order Placement
  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    if (!cartItems.length) return;

    try {
      setIsSubmitting(true);
      const payload = {
        items: cartItems.map((item) => ({
          id: item.id,
          product_id: item.id,
          name: item.name,
          sku: item.sku,
          quantity: item.quantity,
          dealer_wholesale_inr: item.dealer_wholesale_inr,
          mrp_inr: item.mrp_inr,
          moq: item.moq,
        })),
        delivery_mode: deliveryMode,
        shipping_address: shippingAddress,
        billing_details: billingDetails,
        payment_method: paymentMethod,
        notes,
      };

      const res = await api.post('/dealer/orders/checkout', payload);

      if (res.data?.success) {
        setOrderSuccess(res.data.order);
        clearCart();
      }
    } catch (err) {
      console.error('Order placement failed:', err);
      alert('Order placement failed: ' + (err.response?.data?.message || err.message));
    } finally {
      setIsSubmitting(false);
    }
  };

  /* ── Order Success View ─────────────────────────────────────────────────── */
  if (orderSuccess) {
    return (
      <div className="max-w-3xl mx-auto space-y-6 pb-16 animate-in fade-in zoom-in-95 duration-200">
        
        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-10 shadow-lg text-center space-y-6">
          <div className="w-20 h-20 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto shadow-inner border border-emerald-200">
            <FiCheckCircle size={44} />
          </div>

          <div className="space-y-1.5">
            <span className="inline-block px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
              Order Confirmed & Logged
            </span>
            <h1 className="font-heading font-black text-2xl sm:text-3xl text-slate-900">
              Wholesale Order Placed Successfully!
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 max-w-lg mx-auto">
              Your equipment procurement batch has been submitted to your assigned regional distributor depot.
            </p>
          </div>

          {/* Reference Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-50 border border-slate-200 p-4 rounded-2xl text-left text-xs">
            <div>
              <span className="text-slate-400 font-medium block text-[10px] uppercase">Order Number</span>
              <strong className="font-mono text-sm text-slate-900 font-black">{orderSuccess.order_number}</strong>
            </div>
            <div>
              <span className="text-slate-400 font-medium block text-[10px] uppercase">Proforma Invoice</span>
              <strong className="font-mono text-sm text-blue-700 font-bold">{orderSuccess.invoice_number}</strong>
            </div>
            <div>
              <span className="text-slate-400 font-medium block text-[10px] uppercase">Grand Total (Incl. GST)</span>
              <strong className="font-heading text-sm text-emerald-700 font-black">
                ₹{(orderSuccess.grand_total_inr || grandTotalInr).toLocaleString('en-IN')}
              </strong>
            </div>
          </div>

          {/* Dispatch Details */}
          <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200 text-left text-xs space-y-2">
            <div className="flex items-center gap-2 font-bold text-blue-900">
              <FiTruck className="text-blue-700" size={16} />
              <span>Fulfillment & Depot Dispatch</span>
            </div>
            <div className="text-blue-800 text-[11px] space-y-1">
              <p>
                <strong>Fulfillment Hub:</strong> {orderSuccess.distributor_hub || 'BOSKIT Gujarat Central Logistics Hub'}
              </p>
              <p>
                <strong>Delivery Mode:</strong>{' '}
                {orderSuccess.delivery_mode === 'depot_pickup'
                  ? 'Regional Depot Self-Pickup (Ready in 24 Hours)'
                  : 'Direct Warehouse Dispatch (Scheduled Batch Shipment)'}
              </p>
              <p>
                <strong>Payment Method:</strong> {paymentMethod.toUpperCase()} (Proforma invoice generated)
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              onClick={() => window.print()}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-50 flex items-center justify-center gap-2 cursor-pointer"
            >
              <FiPrinter size={15} /> Print Proforma
            </button>
            <Link
              to="/dealer/portal/orders"
              className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-[#185ADB] hover:bg-blue-700 text-white text-xs font-bold shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95"
            >
              <FiPackage size={15} /> View in My Orders & Dispatches →
            </Link>
          </div>

        </div>

      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      
      {/* ── Header Banner ─────────────────────────────────────────────────── */}
      <div className="bg-[#185ADB] rounded-2xl p-6 sm:p-8 text-white shadow-md relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-white text-xs font-semibold backdrop-blur-md mb-2">
              <FiShield size={14} />
              <span>B2B Commercial Procurement</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight font-heading">
              Dealer Wholesale Checkout
            </h1>
            <p className="mt-1 text-blue-100 text-xs sm:text-sm">
              Confirm fulfillment depot, billing GST details, and preferred wholesale payment terms.
            </p>
          </div>

          <Link
            to="/dealer/portal/cart"
            className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all border border-white/20 flex items-center gap-2"
          >
            <FiArrowLeft size={14} /> Edit Cart Items
          </Link>
        </div>
      </div>

      <form onSubmit={handlePlaceOrder} className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* Left 2 Columns: Checkout Form */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Step 1: Delivery Mode & Logistics */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-700 font-bold text-xs flex items-center justify-center border border-blue-200">
                1
              </div>
              <h2 className="font-heading font-bold text-sm sm:text-base text-slate-900">
                Fulfillment & Logistics Mode
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <label
                onClick={() => setDeliveryMode('depot_pickup')}
                className={`p-4 rounded-xl border flex items-start gap-3 cursor-pointer transition-all ${
                  deliveryMode === 'depot_pickup'
                    ? 'bg-blue-50/50 border-blue-600 ring-2 ring-blue-500/20'
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                <input
                  type="radio"
                  name="delivery_mode"
                  checked={deliveryMode === 'depot_pickup'}
                  onChange={() => setDeliveryMode('depot_pickup')}
                  className="mt-0.5 text-blue-600"
                />
                <div>
                  <div className="font-bold text-xs text-slate-900 flex items-center gap-2">
                    <span>Regional Depot Pickup</span>
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded">FREE</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Direct collection from Regional Logistics Hub (Ahmedabad Zone Depot).
                  </p>
                </div>
              </label>

              <label
                onClick={() => setDeliveryMode('site_delivery')}
                className={`p-4 rounded-xl border flex items-start gap-3 cursor-pointer transition-all ${
                  deliveryMode === 'site_delivery'
                    ? 'bg-blue-50/50 border-blue-600 ring-2 ring-blue-500/20'
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                <input
                  type="radio"
                  name="delivery_mode"
                  checked={deliveryMode === 'site_delivery'}
                  onChange={() => setDeliveryMode('site_delivery')}
                  className="mt-0.5 text-blue-600"
                />
                <div>
                  <div className="font-bold text-xs text-slate-900 flex items-center gap-2">
                    <span>Direct Site / Shop Dispatch</span>
                    <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-1.5 py-0.2 rounded">
                      {subtotalInr > 200000 ? 'FREE' : '₹2,500'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Freight delivery to your shop or project site address.
                  </p>
                </div>
              </label>
            </div>

            {deliveryMode === 'site_delivery' && (
              <div className="space-y-3 pt-3 border-t border-slate-100 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Delivery Address</label>
                    <input
                      type="text"
                      value={shippingAddress.line}
                      onChange={(e) => setShippingAddress({ ...shippingAddress, line: e.target.value })}
                      required
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900"
                      placeholder="Street / Shop Address"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">City & State</label>
                    <input
                      type="text"
                      value={`${shippingAddress.city}, ${shippingAddress.state}`}
                      onChange={(e) => setShippingAddress({ ...shippingAddress, city: e.target.value })}
                      required
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Pincode</label>
                    <input
                      type="text"
                      value={shippingAddress.pincode}
                      onChange={(e) => setShippingAddress({ ...shippingAddress, pincode: e.target.value })}
                      required
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Site Contact Phone</label>
                    <input
                      type="tel"
                      value={shippingAddress.contact_phone}
                      onChange={(e) => setShippingAddress({ ...shippingAddress, contact_phone: e.target.value })}
                      required
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Step 2: Billing & GST Compliance */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-700 font-bold text-xs flex items-center justify-center border border-blue-200">
                2
              </div>
              <h2 className="font-heading font-bold text-sm sm:text-base text-slate-900">
                Billing & GST Compliance (Input Tax Credit)
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Business / Trade Name</label>
                <input
                  type="text"
                  value={billingDetails.business_name}
                  onChange={(e) => setBillingDetails({ ...billingDetails, business_name: e.target.value })}
                  required
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-medium"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">GSTIN Number</label>
                <input
                  type="text"
                  value={billingDetails.gst_number}
                  onChange={(e) => setBillingDetails({ ...billingDetails, gst_number: e.target.value.toUpperCase() })}
                  required
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">PAN Card Number</label>
                <input
                  type="text"
                  value={billingDetails.pan_number}
                  onChange={(e) => setBillingDetails({ ...billingDetails, pan_number: e.target.value.toUpperCase() })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Accounts Email for E-Invoice</label>
                <input
                  type="email"
                  value={billingDetails.email}
                  onChange={(e) => setBillingDetails({ ...billingDetails, email: e.target.value })}
                  required
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900"
                />
              </div>
            </div>

            <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-200 text-emerald-800 text-[11px] flex items-center gap-2">
              <FiCheckCircle size={15} className="shrink-0 text-emerald-600" />
              <span>
                100% Input Tax Credit (ITC) compliant B2B tax invoice will be generated in your GSTR-2B automatically.
              </span>
            </div>
          </div>

          {/* Step 3: Wholesale Payment Terms */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-700 font-bold text-xs flex items-center justify-center border border-blue-200">
                3
              </div>
              <h2 className="font-heading font-bold text-sm sm:text-base text-slate-900">
                Wholesale Payment Method
              </h2>
            </div>

            <div className="space-y-3">
              
              {/* Option A: Advance NEFT / RTGS */}
              <label
                onClick={() => setPaymentMethod('neft_rtgs')}
                className={`p-4 rounded-xl border block cursor-pointer transition-all ${
                  paymentMethod === 'neft_rtgs'
                    ? 'bg-blue-50/50 border-blue-600 ring-2 ring-blue-500/20'
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-start gap-3">
                  <input
                    type="radio"
                    name="payment_method"
                    checked={paymentMethod === 'neft_rtgs'}
                    onChange={() => setPaymentMethod('neft_rtgs')}
                    className="mt-0.5 text-blue-600"
                  />
                  <div className="space-y-1 w-full">
                    <div className="flex items-center justify-between">
                      <strong className="text-xs text-slate-900 flex items-center gap-1.5">
                        <MdAccountBalance size={16} className="text-blue-700" />
                        Advance NEFT / RTGS Bank Transfer
                      </strong>
                      <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                        Recommended
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Transfer directly to Distributor Regional Hub Escrow Account before dispatch.
                    </p>

                    {paymentMethod === 'neft_rtgs' && (
                      <div className="mt-3 p-3 bg-white border border-blue-200 rounded-xl text-xs space-y-1 font-mono text-slate-700">
                        <div className="text-[10px] text-slate-500 uppercase font-sans">Hub Beneficiary Details:</div>
                        <div><strong>A/C Name:</strong> BOSKIT GUJARAT REGIONAL LOGISTICS</div>
                        <div><strong>A/C Number:</strong> 502000889100234</div>
                        <div><strong>IFSC Code:</strong> HDFC0001042 (Navrangpura, Ahmedabad)</div>
                      </div>
                    )}
                  </div>
                </div>
              </label>

              {/* Option B: Credit Line */}
              <label
                onClick={() => setPaymentMethod('credit_limit')}
                className={`p-4 rounded-xl border block cursor-pointer transition-all ${
                  paymentMethod === 'credit_limit'
                    ? 'bg-blue-50/50 border-blue-600 ring-2 ring-blue-500/20'
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-start gap-3">
                  <input
                    type="radio"
                    name="payment_method"
                    checked={paymentMethod === 'credit_limit'}
                    onChange={() => setPaymentMethod('credit_limit')}
                    className="mt-0.5 text-blue-600"
                  />
                  <div className="space-y-1">
                    <strong className="text-xs text-slate-900 flex items-center gap-1.5">
                      <FiCreditCard size={15} className="text-emerald-700" />
                      Dealer Credit Line (Net-15 / Net-30 Terms)
                    </strong>
                    <p className="text-[11px] text-slate-500">
                      Pay via pre-approved dealer working capital credit limit (Available Credit: ₹50,000).
                    </p>
                  </div>
                </div>
              </label>

              {/* Option C: Instant Online */}
              <label
                onClick={() => setPaymentMethod('instant_online')}
                className={`p-4 rounded-xl border block cursor-pointer transition-all ${
                  paymentMethod === 'instant_online'
                    ? 'bg-blue-50/50 border-blue-600 ring-2 ring-blue-500/20'
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-start gap-3">
                  <input
                    type="radio"
                    name="payment_method"
                    checked={paymentMethod === 'instant_online'}
                    onChange={() => setPaymentMethod('instant_online')}
                    className="mt-0.5 text-blue-600"
                  />
                  <div className="space-y-1">
                    <strong className="text-xs text-slate-900 flex items-center gap-1.5">
                      <MdCheckCircle size={16} className="text-blue-700" />
                      Instant Online Commercial UPI / Corporate NetBanking
                    </strong>
                    <p className="text-[11px] text-slate-500">
                      Instant settlement with immediate dispatch priority confirmation.
                    </p>
                  </div>
                </div>
              </label>

            </div>
          </div>

          {/* Special Instructions */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-2">
            <label className="block text-xs font-bold text-slate-700">Order Notes / Project Reference (Optional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g., Client project rooftop site 15kW, dispatch in 2 batches, or gate delivery instructions..."
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white"
              rows={2}
            />
          </div>

        </div>

        {/* Right Column: Order Summary & Placement */}
        <div className="space-y-4 sticky top-20">
          
          <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
            <h2 className="font-heading font-black text-base text-slate-900 uppercase tracking-wide">
              Equipment Order Review
            </h2>

            {/* Quick Item List */}
            <div className="space-y-2 max-h-56 overflow-y-auto pr-1 divide-y divide-slate-100 text-xs">
              {cartItems.map((item) => (
                <div key={item.id} className="pt-2 first:pt-0 flex justify-between gap-2">
                  <div className="min-w-0">
                    <div className="font-bold text-slate-900 truncate">{item.name}</div>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {item.quantity} units × ₹{(item.dealer_wholesale_inr || 0).toLocaleString('en-IN')}
                    </span>
                  </div>
                  <strong className="text-slate-900 font-mono shrink-0">
                    ₹{((item.dealer_wholesale_inr || 0) * (item.quantity || 1)).toLocaleString('en-IN')}
                  </strong>
                </div>
              ))}
            </div>

            <div className="space-y-2 text-xs text-slate-600 border-t border-slate-100 pt-3">
              <div className="flex justify-between">
                <span>Subtotal ({totalItemsCount} items)</span>
                <strong className="text-slate-900 font-mono">₹{subtotalInr.toLocaleString('en-IN')}</strong>
              </div>
              <div className="flex justify-between">
                <span>18% GST (ITC Applicable)</span>
                <strong className="text-slate-900 font-mono">₹{gstAmountInr.toLocaleString('en-IN')}</strong>
              </div>
              <div className="flex justify-between">
                <span>Freight & Handling</span>
                <strong className={freightInr === 0 ? 'text-emerald-700 font-bold' : 'text-slate-900 font-mono'}>
                  {freightInr === 0 ? 'FREE' : `₹${freightInr.toLocaleString('en-IN')}`}
                </strong>
              </div>
            </div>

            <div className="border-t border-slate-200 pt-3 flex items-baseline justify-between">
              <div>
                <span className="text-xs font-bold text-slate-500 uppercase block">Grand Total</span>
                <span className="text-[10px] text-emerald-700 font-medium">B2B Wholesale Rate</span>
              </div>
              <span className="font-heading font-black text-2xl text-[#185ADB]">
                ₹{grandTotalInr.toLocaleString('en-IN')}
              </span>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 rounded-xl text-xs sm:text-sm font-bold bg-[#185ADB] hover:bg-blue-700 disabled:opacity-50 text-white shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-98"
            >
              {isSubmitting ? (
                <span>Logging Order & Generating Invoice...</span>
              ) : (
                <>
                  <span>Confirm & Place Wholesale Order</span>
                  <FiArrowRight size={16} />
                </>
              )}
            </button>

            <div className="text-[11px] text-slate-400 text-center">
              By confirming, you agree to BOSKIT Wholesale Terms & Logistics Dispatch Policy.
            </div>

          </div>

        </div>

      </form>

    </div>
  );
}
