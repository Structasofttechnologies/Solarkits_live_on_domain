import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  FiShoppingCart,
  FiTrash2,
  FiArrowLeft,
  FiCheckCircle,
  FiTruck,
  FiShield,
  FiInfo,
  FiRefreshCw,
  FiPlus,
  FiMinus,
} from 'react-icons/fi';
import { MdSolarPower } from 'react-icons/md';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import api from '../../services/api';

export default function DistributorCartPage() {
  const navigate = useNavigate();
  const { user, distributor } = useAuth();
  const { cart, removeFromCart, refreshCart } = useCart();

  // Local distributor items state (persisted in localStorage for dashboard procurement)
  const [distributorItems, setDistributorItems] = useState(() => {
    try {
      const saved = localStorage.getItem('boskit_distributor_cart');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Cart parse warning:', e);
    }
    // Default initial mock items if empty
    return [
      {
        id: '6a828f0049bc69149b156001',
        name: 'Mono PERC 550W Bifacial Solar Panel (TOPCon Glass-to-Glass)',
        sku: 'BK-MOD-550W-TOPCON',
        brand: 'SolarKits Apex',
        image_url: 'https://images.unsplash.com/photo-1509391365360-2e959784a276?auto=format&fit=crop&w=800&q=80',
        distributor_buy_price_inr: 13650,
        mrp_inr: 19500,
        moq: 30,
        quantity: 30,
      },
      {
        id: '6a828f0049bc69149b156002',
        name: 'SolarKits 5kW 3-Phase On-Grid Inverter (Dual MPPT, IP65)',
        sku: 'BK-INV-5KW-3P',
        brand: 'SolarKits PowerCore',
        image_url: 'https://images.unsplash.com/photo-1548611716-ad022c4f6990?auto=format&fit=crop&w=800&q=80',
        distributor_buy_price_inr: 34500,
        mrp_inr: 48000,
        moq: 1,
        quantity: 2,
      },
    ];
  });

  const [shippingAddress, setShippingAddress] = useState({
    depot_name: 'Regional Distributor Warehouse Hub',
    line: 'Plot 104, Industrial Logistics Zone, Phase II',
    city: 'Ahmedabad',
    state: 'Gujarat',
    pincode: '380001',
    contact_person: distributor?.business_name || 'Authorized Distributor Depot Manager',
    contact_phone: distributor?.mobile || '9876500001',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(null);

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem('boskit_distributor_cart', JSON.stringify(distributorItems));
  }, [distributorItems]);

  const handleUpdateQuantity = (id, newQty) => {
    setDistributorItems((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          return { ...item, quantity: Math.max(1, newQty) };
        }
        return item;
      })
    );
  };

  const handleRemoveItem = (id) => {
    setDistributorItems((prev) => prev.filter((item) => item.id !== id));
  };

  // Totals calculations
  const subtotal = distributorItems.reduce(
    (acc, item) => acc + item.distributor_buy_price_inr * item.quantity,
    0
  );
  const gstAmount = Math.round(subtotal * 0.18);
  const estimatedFreight = subtotal > 100000 ? 0 : 2500;
  const grandTotal = subtotal + gstAmount + estimatedFreight;
  const totalUnits = distributorItems.reduce((acc, item) => acc + item.quantity, 0);

  const handleCheckout = async (e) => {
    e.preventDefault();
    if (!distributorItems.length) return;

    try {
      setIsSubmitting(true);
      const res = await api.post('/distributor/procure/order', {
        items: distributorItems.map((i) => ({
          product_id: i.id,
          name: i.name,
          sku: i.sku,
          quantity: i.quantity,
          distributor_buy_price_inr: i.distributor_buy_price_inr,
        })),
        shipping_address: shippingAddress,
        notes: 'Priority factory dispatch for regional territory distributor warehouse.',
      });

      if (res.data?.success) {
        setOrderSuccess(res.data.order);
        setDistributorItems([]);
        localStorage.removeItem('boskit_distributor_cart');
      }
    } catch (err) {
      console.error('Order error:', err);
      alert('Order placement failed: ' + (err.response?.data?.message || err.message));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      
      {/* ── Royal Blue Header Banner ────────────────────────────────────────── */}
      <div className="bg-[#185ADB] rounded-2xl p-6 sm:p-8 text-white shadow-md relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-white text-xs font-semibold backdrop-blur-md mb-2">
              <FiShoppingCart size={15} />
              <span>Procurement Cart</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight font-heading">
              Distributor Procurement Cart
            </h1>
            <p className="mt-1 text-blue-100 text-xs sm:text-sm">
              Direct factory-gate stock replenishment for{' '}
              <span className="font-bold text-white">
                {distributor?.business_name || user?.business_name || 'Customer Account'}
              </span>
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/distributor/portal/procure"
              className="px-4 py-2.5 rounded-xl text-xs font-bold bg-white/15 hover:bg-white/25 text-white border border-white/20 shadow-xs flex items-center gap-2 transition-all"
            >
              <FiArrowLeft size={14} /> Continue Procuring
            </Link>
          </div>
        </div>
      </div>

      {orderSuccess ? (
        <div className="bg-white border border-slate-200 rounded-3xl p-10 text-center shadow-xs space-y-4 max-w-xl mx-auto my-8">
          <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
            <FiCheckCircle size={36} />
          </div>
          <div className="space-y-1">
            <h2 className="font-heading font-black text-2xl text-slate-900">
              Procurement Order Confirmed!
            </h2>
            <p className="text-sm text-slate-600">
              Order <strong className="text-blue-700">{orderSuccess.order_number}</strong> has been
              successfully scheduled for factory allocation and logistics dispatch.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-left space-y-2">
            <div className="flex justify-between">
              <span className="text-slate-500">Order Total:</span>
              <strong className="text-slate-900 text-sm">
                ₹{orderSuccess.grand_total_inr.toLocaleString('en-IN')}
              </strong>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Status:</span>
              <span className="font-bold text-emerald-700 uppercase bg-emerald-50 px-2 py-0.5 rounded">
                {orderSuccess.status}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Dispatch Hub:</span>
              <span className="text-slate-700 font-medium">BOSKIT Central Gujarat Warehouse</span>
            </div>
          </div>

          <div className="pt-2 flex items-center justify-center gap-3">
            <Link
              to="/distributor/portal/procure"
              className="px-6 py-2.5 rounded-xl text-xs font-bold bg-[#185ADB] text-white shadow-sm hover:bg-blue-700"
            >
              Order More Equipment
            </Link>
          </div>
        </div>
      ) : distributorItems.length === 0 ? (
        
        /* Empty Cart State */
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center shadow-xs space-y-4 my-8">
          <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto shadow-inner">
            <FiShoppingCart size={36} />
          </div>
          <div className="space-y-1">
            <h3 className="font-heading font-black text-xl text-slate-900">
              Your Procurement Cart is Empty
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
              Browse the wholesale catalogue to select solar inverters, PV modules, battery packs, and BOS kit components.
            </p>
          </div>
          <Link
            to="/distributor/portal/procure"
            className="px-6 py-2.5 rounded-xl text-xs font-bold bg-[#185ADB] hover:bg-blue-700 text-white shadow-xs inline-flex items-center gap-2 transition-all active:scale-95"
          >
            <MdSolarPower size={16} /> Open Wholesale Catalogue
          </Link>
        </div>

      ) : (

        /* Cart Items & Summary Grid */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          
          {/* Left 2 Columns: Items List */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <span className="font-heading font-black text-sm text-slate-900 uppercase tracking-wide">
                  Equipment In Cart ({distributorItems.length} Products • {totalUnits} Units)
                </span>
                <button
                  onClick={() => setDistributorItems([])}
                  className="text-xs font-semibold text-red-600 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <FiTrash2 size={13} /> Clear All
                </button>
              </div>

              <div className="divide-y divide-slate-100">
                {distributorItems.map((item) => {
                  const lineTotal = item.distributor_buy_price_inr * item.quantity;
                  return (
                    <div key={item.id} className="py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-3.5">
                        <img
                          src={item.image_url}
                          alt={item.name}
                          className="w-16 h-16 rounded-xl object-cover border border-slate-200 bg-slate-50 shrink-0"
                        />
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                            {item.brand}
                          </span>
                          <h4 className="font-heading font-bold text-sm text-slate-900 mt-1 leading-snug">
                            {item.name}
                          </h4>
                          <div className="text-xs text-slate-500 font-mono mt-0.5">SKU: {item.sku}</div>
                          <div className="text-xs text-blue-700 font-bold mt-1">
                            ₹{item.distributor_buy_price_inr.toLocaleString('en-IN')} / unit
                            <span className="text-[10px] text-slate-400 line-through ml-2 font-normal">
                              MRP: ₹{item.mrp_inr.toLocaleString('en-IN')}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Quantity Stepper & Subtotal */}
                      <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto gap-5">
                        <div className="flex items-center border border-slate-200 rounded-xl overflow-hidden bg-slate-50">
                          <button
                            onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                            className="p-2 hover:bg-slate-200 text-slate-600 transition-colors cursor-pointer"
                          >
                            <FiMinus size={12} />
                          </button>
                          <span className="px-3 py-1 text-xs font-bold text-slate-800 min-w-[36px] text-center">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                            className="p-2 hover:bg-slate-200 text-slate-600 transition-colors cursor-pointer"
                          >
                            <FiPlus size={12} />
                          </button>
                        </div>

                        <div className="text-right min-w-[100px]">
                          <div className="font-heading font-black text-sm text-slate-900">
                            ₹{lineTotal.toLocaleString('en-IN')}
                          </div>
                          <span className="text-[10px] text-slate-400 font-medium">Excl. GST</span>
                        </div>

                        <button
                          onClick={() => handleRemoveItem(item.id)}
                          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                          title="Remove item"
                        >
                          <FiTrash2 size={15} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Warehouse Dispatch Location Card */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-800 uppercase tracking-wide">
                <FiTruck className="text-blue-600" />
                <span>Destination Warehouse Depot</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="text-slate-500 block mb-1 font-medium">Depot Name / Address</label>
                  <input
                    type="text"
                    value={shippingAddress.line}
                    onChange={(e) => setShippingAddress({ ...shippingAddress, line: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 font-semibold text-slate-800"
                  />
                </div>
                <div>
                  <label className="text-slate-500 block mb-1 font-medium">City & State</label>
                  <input
                    type="text"
                    value={`${shippingAddress.city}, ${shippingAddress.state} - ${shippingAddress.pincode}`}
                    readOnly
                    className="w-full px-3 py-2 rounded-xl bg-slate-100 border border-slate-200 font-semibold text-slate-600 cursor-not-allowed"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Order Summary & Checkout */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-5 sticky top-24">
            <h3 className="font-heading font-black text-base text-slate-900 uppercase tracking-wide border-b border-slate-100 pb-3">
              Procurement Summary
            </h3>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal (Factory Cost):</span>
                <span className="font-bold text-slate-900">₹{subtotal.toLocaleString('en-IN')}</span>
              </div>

              <div className="flex justify-between text-slate-600">
                <span>GST (18% Input Credit Eligible):</span>
                <span className="font-bold text-slate-900">₹{gstAmount.toLocaleString('en-IN')}</span>
              </div>

              <div className="flex justify-between text-slate-600">
                <span>Direct Container Freight:</span>
                <span className="font-bold text-emerald-600">
                  {estimatedFreight === 0 ? 'FREE (Wholesale Tier)' : `₹${estimatedFreight.toLocaleString('en-IN')}`}
                </span>
              </div>

              <div className="border-t border-slate-200 pt-3 flex justify-between items-baseline">
                <div>
                  <span className="font-heading font-black text-sm text-slate-900 block">
                    Estimated Total
                  </span>
                  <span className="text-[10px] text-slate-400">Includes all GST & Logistics</span>
                </div>
                <span className="font-heading font-black text-xl text-[#185ADB]">
                  ₹{grandTotal.toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            <button
              onClick={handleCheckout}
              disabled={isSubmitting || distributorItems.length === 0}
              className="w-full py-3.5 rounded-xl text-xs font-bold bg-[#185ADB] hover:bg-blue-700 text-white shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50 active:scale-98"
            >
              {isSubmitting ? (
                <>
                  <FiRefreshCw className="animate-spin" size={14} /> Processing Order...
                </>
              ) : (
                <>
                  <FiCheckCircle size={15} /> Confirm Wholesale Order
                </>
              )}
            </button>

            <div className="p-3.5 rounded-xl bg-blue-50/60 border border-blue-100 flex items-start gap-2.5 text-[11px] text-blue-900">
              <FiShield className="shrink-0 mt-0.5 text-blue-700" size={14} />
              <span>
                Tier-1 manufacturer warranty dispatch and GST invoice generated automatically upon confirmation.
              </span>
            </div>
          </div>

        </div>
      )}

    </div>
  );
}
