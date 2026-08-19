import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  FiShoppingCart,
  FiTrash2,
  FiArrowLeft,
  FiArrowRight,
  FiCheckCircle,
  FiTruck,
  FiShield,
  FiInfo,
  FiPlus,
  FiMinus,
  FiMapPin,
  FiZap,
} from 'react-icons/fi';
import { MdSolarPower } from 'react-icons/md';
import { useAuth } from '../../context/AuthContext';
import { useDealerCart } from '../../context/DealerCartContext';

export default function DealerCartPage() {
  const navigate = useNavigate();
  const { user, dealer } = useAuth();
  const {
    cartItems,
    totalItemsCount,
    subtotalInr,
    totalMrpInr,
    totalSavingsInr,
    gstAmountInr,
    freightInr,
    grandTotalInr,
    deliveryMode,
    setDeliveryMode,
    updateQuantity,
    removeFromCart,
    clearCart,
  } = useDealerCart();

  const businessName = dealer?.business_name || user?.business_name || 'Dealer Solar Account';

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      
      {/* ── Header Banner ─────────────────────────────────────────────────── */}
      <div className="bg-[#185ADB] rounded-2xl p-6 sm:p-8 text-white shadow-md relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-white text-xs font-semibold backdrop-blur-md mb-2">
              <FiShoppingCart size={14} />
              <span>Wholesale Procurement Cart</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight font-heading">
              Dealer Equipment Order Cart
            </h1>
            <p className="mt-1 text-blue-100 text-xs sm:text-sm">
              Review selected solar modules, inverters, and BOS packages before proceeding to wholesale checkout.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/dealer/portal/catalogue"
              className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all border border-white/20 cursor-pointer flex items-center gap-2"
            >
              <FiArrowLeft size={15} /> Add More Equipment
            </Link>
          </div>
        </div>
      </div>

      {cartItems.length === 0 ? (
        /* ── Empty Cart State ──────────────────────────────────────────────── */
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center shadow-xs space-y-4 max-w-2xl mx-auto">
          <div className="w-20 h-20 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto shadow-inner">
            <FiShoppingCart size={40} />
          </div>
          <div className="space-y-1">
            <h2 className="font-heading font-black text-xl text-slate-900">
              Your Wholesale Cart is Empty
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
              You have not added any solar equipment to your wholesale order batch yet.
            </p>
          </div>
          <div className="pt-2">
            <Link
              to="/dealer/portal/catalogue"
              className="px-6 py-3 rounded-xl text-xs font-bold bg-[#185ADB] hover:bg-blue-700 text-white shadow-xs inline-flex items-center gap-2 cursor-pointer transition-all active:scale-95"
            >
              <MdSolarPower size={16} /> Browse Equipment Catalogue
            </Link>
          </div>
        </div>
      ) : (
        /* ── Two Column Cart Layout ────────────────────────────────────────── */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          
          {/* Left 2 Columns: Items List */}
          <div className="lg:col-span-2 space-y-4">
            
            <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
              <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h2 className="font-heading font-bold text-base text-slate-900">
                    Order Items ({cartItems.length} SKUs · {totalItemsCount} Units)
                  </h2>
                  <span className="text-[11px] text-slate-500">
                    Direct regional distributor pricing & input tax credits applied
                  </span>
                </div>
                <button
                  onClick={clearCart}
                  className="text-xs font-semibold text-red-600 hover:text-red-700 hover:underline cursor-pointer flex items-center gap-1"
                >
                  <FiTrash2 size={13} /> Clear Cart
                </button>
              </div>

              <div className="divide-y divide-slate-100">
                {cartItems.map((item) => {
                  const lineTotal = (item.dealer_wholesale_inr || 0) * (item.quantity || 1);
                  const isMoqMet = (item.quantity || 1) >= (item.moq || 1);

                  return (
                    <div key={item.id} className="p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-slate-50/60 transition-colors">
                      
                      {/* Product Thumbnail & Details */}
                      <div className="flex items-center gap-3.5 flex-1 min-w-0">
                        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center">
                          <img
                            src={item.image_url}
                            alt={item.name}
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src =
                                'https://images.unsplash.com/photo-1509391365360-2e959784a276?auto=format&fit=crop&w=400&q=80';
                            }}
                            className="w-full h-full object-cover"
                          />
                        </div>

                        <div className="min-w-0 space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">
                              {item.sku}
                            </span>
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                              MOQ: {item.moq || 1}
                            </span>
                            {item.brand && (
                              <span className="text-[10px] font-semibold text-slate-600">
                                · {item.brand}
                              </span>
                            )}
                          </div>
                          <h3 className="font-heading font-bold text-xs sm:text-sm text-slate-900 leading-snug line-clamp-2">
                            {item.name}
                          </h3>
                          <div className="flex items-center gap-2 pt-0.5">
                            <span className="font-heading font-black text-sm text-[#185ADB]">
                              ₹{(item.dealer_wholesale_inr || 0).toLocaleString('en-IN')}
                            </span>
                            <span className="text-[11px] text-slate-400 line-through">
                              ₹{(item.mrp_inr || 0).toLocaleString('en-IN')}
                            </span>
                            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded">
                              Save ₹{((item.mrp_inr || 0) - (item.dealer_wholesale_inr || 0)).toLocaleString('en-IN')}/unit
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Quantity Stepper & Line Total */}
                      <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                        
                        {/* Stepper */}
                        <div className="flex items-center border border-slate-200 rounded-xl overflow-hidden bg-slate-50 shadow-2xs">
                          <button
                            onClick={() => updateQuantity(item.id, Math.max(item.moq || 1, (item.quantity || 1) - (item.moq > 1 ? 5 : 1)))}
                            disabled={(item.quantity || 1) <= (item.moq || 1)}
                            className="p-2 text-slate-600 hover:bg-slate-200 disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer transition-colors"
                            title="Decrease quantity"
                          >
                            <FiMinus size={13} />
                          </button>
                          <input
                            type="number"
                            value={item.quantity}
                            onChange={(e) => updateQuantity(item.id, parseInt(e.target.value, 10) || 1)}
                            min={item.moq || 1}
                            className="w-12 text-center bg-transparent text-xs font-bold text-slate-900 focus:outline-none"
                          />
                          <button
                            onClick={() => updateQuantity(item.id, (item.quantity || 1) + (item.moq > 1 ? 5 : 1))}
                            className="p-2 text-slate-600 hover:bg-slate-200 cursor-pointer transition-colors"
                            title="Increase quantity"
                          >
                            <FiPlus size={13} />
                          </button>
                        </div>

                        {/* Line Total & Remove */}
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <span className="text-[10px] text-slate-400 block sm:hidden">Line Total</span>
                            <span className="font-heading font-black text-sm sm:text-base text-slate-900">
                              ₹{lineTotal.toLocaleString('en-IN')}
                            </span>
                          </div>
                          <button
                            onClick={() => removeFromCart(item.id)}
                            className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
                            title="Remove item"
                          >
                            <FiTrash2 size={15} />
                          </button>
                        </div>

                      </div>

                    </div>
                  );
                })}
              </div>

              {/* Delivery / Pickup Choice */}
              <div className="p-4 sm:p-5 bg-slate-50/80 border-t border-slate-200 space-y-3">
                <div className="font-heading font-bold text-xs text-slate-900 uppercase tracking-wide flex items-center gap-2">
                  <FiTruck size={14} className="text-blue-600" />
                  <span>Choose Fulfillment Method</span>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label
                    onClick={() => setDeliveryMode('depot_pickup')}
                    className={`p-3.5 rounded-xl border flex items-start gap-3 cursor-pointer transition-all ${
                      deliveryMode === 'depot_pickup'
                        ? 'bg-white border-blue-600 ring-2 ring-blue-500/20 shadow-xs'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="delivery_mode"
                      checked={deliveryMode === 'depot_pickup'}
                      onChange={() => setDeliveryMode('depot_pickup')}
                      className="mt-0.5 text-blue-600 focus:ring-blue-500"
                    />
                    <div>
                      <div className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                        <span>Regional Depot Pickup</span>
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded">FREE</span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Direct collection from assigned distributor warehouse in Ahmedabad.
                      </p>
                    </div>
                  </label>

                  <label
                    onClick={() => setDeliveryMode('site_delivery')}
                    className={`p-3.5 rounded-xl border flex items-start gap-3 cursor-pointer transition-all ${
                      deliveryMode === 'site_delivery'
                        ? 'bg-white border-blue-600 ring-2 ring-blue-500/20 shadow-xs'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="delivery_mode"
                      checked={deliveryMode === 'site_delivery'}
                      onChange={() => setDeliveryMode('site_delivery')}
                      className="mt-0.5 text-blue-600 focus:ring-blue-500"
                    />
                    <div>
                      <div className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                        <span>Direct Warehouse Dispatch</span>
                        <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-1.5 py-0.2 rounded">
                          {subtotalInr > 200000 ? 'FREE' : '₹2,500'}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Freight delivery to your registered solar shop address.
                      </p>
                    </div>
                  </label>
                </div>
              </div>

            </div>

          </div>

          {/* Right Column: Order Summary & Checkout CTA */}
          <div className="space-y-4 sticky top-20">
            
            {/* Summary Card */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
              <h2 className="font-heading font-black text-base text-slate-900 uppercase tracking-wide">
                Wholesale Batch Summary
              </h2>

              <div className="space-y-2.5 text-xs text-slate-600 border-b border-slate-100 pb-4">
                <div className="flex justify-between">
                  <span>Batch Subtotal ({totalItemsCount} units)</span>
                  <strong className="text-slate-900 font-mono">₹{subtotalInr.toLocaleString('en-IN')}</strong>
                </div>

                <div className="flex justify-between items-center text-emerald-700">
                  <span className="flex items-center gap-1">
                    <FiZap size={13} /> Wholesale Margin Discount
                  </span>
                  <strong className="font-mono">-₹{totalSavingsInr.toLocaleString('en-IN')}</strong>
                </div>

                <div className="flex justify-between">
                  <span className="flex items-center gap-1">
                    <span>Applicable GST (18% ITC)</span>
                    <FiInfo size={12} className="text-slate-400" title="100% Input Tax Credit claimable via GSTIN" />
                  </span>
                  <strong className="text-slate-900 font-mono">₹{gstAmountInr.toLocaleString('en-IN')}</strong>
                </div>

                <div className="flex justify-between">
                  <span>Logistics & Freight</span>
                  <strong className={freightInr === 0 ? 'text-emerald-700 font-bold' : 'text-slate-900 font-mono'}>
                    {freightInr === 0 ? 'FREE' : `₹${freightInr.toLocaleString('en-IN')}`}
                  </strong>
                </div>
              </div>

              {/* Grand Total */}
              <div className="flex items-baseline justify-between pt-1">
                <div>
                  <span className="text-xs font-bold text-slate-500 uppercase block">Grand Total (Incl. Tax)</span>
                  <span className="text-[10px] text-emerald-700 font-medium">Input Tax Credit (ITC) Eligible</span>
                </div>
                <div className="text-right">
                  <span className="font-heading font-black text-2xl text-[#185ADB]">
                    ₹{grandTotalInr.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              {/* Savings Highlight */}
              {totalSavingsInr > 0 && (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
                  <FiCheckCircle size={16} className="text-emerald-600 shrink-0" />
                  <span>
                    You save <strong>₹{totalSavingsInr.toLocaleString('en-IN')}</strong> compared to retail market price!
                  </span>
                </div>
              )}

              {/* Checkout Button */}
              <button
                onClick={() => navigate('/dealer/portal/checkout')}
                className="w-full py-3.5 rounded-xl text-xs sm:text-sm font-bold bg-[#185ADB] hover:bg-blue-700 text-white shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-98"
              >
                <span>Proceed to Wholesale Checkout</span>
                <FiArrowRight size={16} />
              </button>

              {/* Trust Badges */}
              <div className="pt-2 border-t border-slate-100 space-y-1.5 text-[11px] text-slate-500">
                <div className="flex items-center gap-2">
                  <FiShield className="text-blue-600" />
                  <span>Tier-1 Factory Warranty Guaranteed</span>
                </div>
                <div className="flex items-center gap-2">
                  <FiMapPin className="text-blue-600" />
                  <span>Dispatched from Gujarat Central Logistics Depot</span>
                </div>
              </div>

            </div>

          </div>

        </div>
      )}

    </div>
  );
}
