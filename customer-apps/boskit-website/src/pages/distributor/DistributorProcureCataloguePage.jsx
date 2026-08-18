import React, { useState, useEffect } from 'react';
import {
  FiPackage,
  FiSearch,
  FiDollarSign,
  FiPercent,
  FiCheckCircle,
  FiShoppingBag,
  FiSliders,
  FiLayers,
  FiRefreshCw,
  FiTruck,
  FiShield,
  FiArrowRight,
  FiCheck,
  FiX,
  FiInfo,
  FiFilter,
  FiTrendingUp,
  FiZap,
} from 'react-icons/fi';
import { MdSolarPower } from 'react-icons/md';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

export default function DistributorProcureCataloguePage() {
  const { user, distributor } = useAuth();
  const [catalogue, setCatalogue] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [planInfo, setPlanInfo] = useState(null);

  // Local state for interactive margin adjustments per product
  const [editedMargins, setEditedMargins] = useState({});
  const [savingProductId, setSavingProductId] = useState(null);

  // Procurement Modal
  const [procureProduct, setProcureProduct] = useState(null);
  const [procureQty, setProcureQty] = useState(1);
  const [procuring, setProcuring] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(null);

  // Toast
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const categories = [
    { id: 'all', name: 'All Equipment' },
    { id: 'inverters', name: 'Solar Inverters' },
    { id: 'panels', name: 'Photovoltaic Panels' },
    { id: 'batteries', name: 'Battery Storage' },
    { id: 'structures', name: 'Mounting Structures' },
    { id: 'dcdb', name: 'DCDB & ACDB' },
    { id: 'cables', name: 'DC Cables & Connectors' },
    { id: 'boskit', name: 'BOS Turnkey Combos' },
  ];

  const fetchCatalogue = async () => {
    try {
      setLoading(true);
      const params = {};
      if (selectedCategory !== 'all') params.category = selectedCategory;
      if (search) params.search = search;

      const res = await api.get('/distributor/catalogue', { params });
      if (res.data?.success) {
        setCatalogue(res.data.products || []);
        setPlanInfo({
          name: res.data.plan_name,
          discount: res.data.plan_discount_percent,
          marginSlab: res.data.default_margin_slab,
        });

        // Initialize local editable state
        const initial = {};
        (res.data.products || []).forEach((p) => {
          initial[p.id] = {
            margin_percent: p.dealer_margin_percent,
            dealer_sell_price_inr: p.dealer_sell_price_inr,
            is_whitelisted: p.is_whitelisted_for_dealers,
          };
        });
        setEditedMargins(initial);
      }
    } catch (err) {
      console.error('Failed to load catalogue:', err);
      showToast('Failed to load distributor wholesale catalogue.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCatalogue();
  }, [selectedCategory, search]);

  // Handle margin slider / input change
  const handleMarginChange = (productId, buyPrice, newMarginPercent) => {
    const margin = Math.max(0, Math.min(100, parseFloat(newMarginPercent) || 0));
    const marginAmount = Math.round(buyPrice * (margin / 100));
    const newSellPrice = buyPrice + marginAmount;

    setEditedMargins((prev) => ({
      ...prev,
      [productId]: {
        ...prev[productId],
        margin_percent: margin,
        dealer_sell_price_inr: newSellPrice,
      },
    }));
  };

  // Handle direct dealer price change
  const handlePriceChange = (productId, buyPrice, newDealerPrice) => {
    const sellPrice = Math.max(buyPrice, parseFloat(newDealerPrice) || buyPrice);
    const marginAmount = sellPrice - buyPrice;
    const marginPercent = Math.round((marginAmount / buyPrice) * 100 * 10) / 10;

    setEditedMargins((prev) => ({
      ...prev,
      [productId]: {
        ...prev[productId],
        margin_percent: marginPercent,
        dealer_sell_price_inr: sellPrice,
      },
    }));
  };

  // Save Dealer Margin to Server
  const handleSaveMargin = async (productId) => {
    const itemData = editedMargins[productId];
    if (!itemData) return;

    try {
      setSavingProductId(productId);
      const res = await api.post('/distributor/pricing/margin', {
        product_id: productId,
        margin_percent: itemData.margin_percent,
        dealer_sell_price_inr: itemData.dealer_sell_price_inr,
        is_whitelisted: itemData.is_whitelisted,
      });

      if (res.data?.success) {
        showToast('Dealer selling rate and margin saved successfully!');
      }
    } catch (err) {
      console.error('Error saving margin:', err);
      showToast('Failed to save dealer margin.', 'error');
    } finally {
      setSavingProductId(null);
    }
  };

  // Open Procurement Modal
  const handleOpenProcureModal = (product) => {
    setProcureProduct(product);
    setProcureQty(product.moq || 1);
    setOrderSuccess(null);
  };

  // Submit Procurement Order
  const handleSubmitProcurement = async (e) => {
    e.preventDefault();
    if (!procureProduct) return;

    try {
      setProcuring(true);
      const res = await api.post('/distributor/procure/order', {
        items: [
          {
            product_id: procureProduct.id,
            name: procureProduct.name,
            sku: procureProduct.sku,
            quantity: procureQty,
            distributor_buy_price_inr: procureProduct.distributor_buy_price_inr,
          },
        ],
        shipping_address: {
          line: 'Distributor Regional Depot',
          city: 'Ahmedabad',
          state: 'Gujarat',
          pincode: '380001',
        },
      });

      if (res.data?.success) {
        setOrderSuccess(res.data.order);
        showToast('Wholesale procurement order confirmed!');
      }
    } catch (err) {
      console.error('Procurement error:', err);
      showToast('Procurement order failed.', 'error');
    } finally {
      setProcuring(false);
    }
  };

  const handleAddToCart = (product, qty) => {
    try {
      const saved = localStorage.getItem('boskit_distributor_cart');
      const cartItems = saved ? JSON.parse(saved) : [];
      const existingIndex = cartItems.findIndex((i) => i.id === product.id);

      if (existingIndex > -1) {
        cartItems[existingIndex].quantity += qty;
      } else {
        cartItems.push({
          id: product.id,
          name: product.name,
          sku: product.sku,
          brand: product.brand,
          image_url: product.image_url,
          distributor_buy_price_inr: product.distributor_buy_price_inr,
          mrp_inr: product.mrp_inr,
          moq: product.moq || 1,
          quantity: qty,
        });
      }

      localStorage.setItem('boskit_distributor_cart', JSON.stringify(cartItems));
      showToast(`Added ${qty} units of ${product.name} to wholesale cart!`);
      setProcureProduct(null);
    } catch (err) {
      console.error('Cart add error:', err);
    }
  };

  const accountName = distributor?.business_name || user?.business_name || 'Customer Account';

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      
      {/* Toast */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-5 py-3 rounded-2xl shadow-xl border flex items-center gap-3 transition-all animate-bounce ${
            toast.type === 'error'
              ? 'bg-red-50 text-red-700 border-red-200'
              : 'bg-emerald-50 text-emerald-800 border-emerald-200'
          }`}
        >
          {toast.type === 'error' ? <FiInfo /> : <FiCheckCircle />}
          <span className="text-xs font-bold">{toast.message}</span>
          <button onClick={() => setToast(null)} className="ml-2 opacity-60 hover:opacity-100 cursor-pointer">
            <FiX />
          </button>
        </div>
      )}

      {/* ── Exact Royal Blue Header Banner (Matching Screenshot) ───────────── */}
      <div className="bg-[#185ADB] rounded-2xl p-6 sm:p-8 text-white shadow-md relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-white text-xs font-semibold backdrop-blur-md mb-2">
              <MdSolarPower size={15} />
              <span>Reseller Catalogue</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight font-heading">
              Product Catalogue
            </h1>
            <p className="mt-1 text-blue-100 text-xs sm:text-sm">
              Published by <span className="font-bold text-white">Partner Reseller</span> · Account:{' '}
              <span className="font-medium text-white">{accountName}</span>
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-white/10 backdrop-blur-md border border-white/20 px-5 py-2.5 rounded-xl text-right">
              <div className="text-2xl sm:text-3xl font-black">{catalogue.length}</div>
              <div className="text-[11px] text-blue-100 font-medium">Products Available</div>
            </div>
            <button
              onClick={fetchCatalogue}
              className="p-3 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all border border-white/20 cursor-pointer active:scale-95 shadow-xs"
              title="Refresh catalogue"
            >
              <FiRefreshCw className={loading ? 'animate-spin' : ''} size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* ── Search & Filter Controls Bar (Matching Screenshot) ─────────────── */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          
          {/* Search Input */}
          <div className="relative flex-1">
            <FiSearch
              size={16}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search products, brands, or SKUs…"
              className="w-full pl-10 pr-9 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <FiX size={15} />
              </button>
            )}
          </div>

          {/* Filter & Sort Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
              showFilters
                ? 'bg-blue-50 border-blue-300 text-blue-700'
                : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
            }`}
          >
            <FiFilter size={15} />
            <span>Filter & Sort</span>
          </button>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none border-t border-slate-100 pt-3">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                selectedCategory === cat.id
                  ? 'bg-[#185ADB] text-white font-bold shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* ── Main Body (Catalogue Cards vs Empty State) ──────────────────────── */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="h-80 rounded-2xl bg-white border border-slate-200 animate-pulse" />
          ))}
        </div>
      ) : catalogue.length === 0 ? (
        
        /* Empty State Matching Screenshot */
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center shadow-xs space-y-4 my-8">
          <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto shadow-inner">
            <MdSolarPower size={36} />
          </div>
          <div className="space-y-1">
            <h3 className="font-heading font-black text-xl text-slate-900">
              No Products Published Yet
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
              Your reseller partner has not published any products to your catalogue yet.
            </p>
          </div>
          <button
            onClick={fetchCatalogue}
            className="px-6 py-2.5 rounded-xl text-xs font-bold bg-[#17211B] hover:bg-slate-800 text-white shadow-xs inline-flex items-center gap-2 cursor-pointer transition-all active:scale-95"
          >
            <FiRefreshCw size={14} /> Refresh Catalogue
          </button>
        </div>

      ) : (

        /* Products Grid */
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
          {catalogue.map((product) => {
            const currentData = editedMargins[product.id] || {
              margin_percent: product.dealer_margin_percent,
              dealer_sell_price_inr: product.dealer_sell_price_inr,
              is_whitelisted: product.is_whitelisted_for_dealers,
            };

            const profitAmount =
              (currentData.dealer_sell_price_inr || product.dealer_sell_price_inr) -
              product.distributor_buy_price_inr;

            return (
              <div
                key={product.id}
                className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between space-y-5 hover:border-blue-500/40 hover:shadow-md transition-all"
              >
                <div className="space-y-4">
                  {/* Top Brand & Category Header */}
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={product.image_url}
                        alt={product.name}
                        className="w-16 h-16 rounded-2xl object-cover border border-slate-200 bg-slate-50"
                      />
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                          {product.brand}
                        </span>
                        <h3 className="font-heading font-bold text-sm sm:text-base text-slate-900 mt-1 leading-snug">
                          {product.name}
                        </h3>
                        <div className="text-[11px] font-mono text-slate-500 mt-0.5">
                          SKU: {product.sku}
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        In Stock • MOQ: {product.moq}
                      </span>
                    </div>
                  </div>

                  {/* Pricing Comparison Matrix */}
                  <div className="grid grid-cols-3 gap-2 p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                    <div>
                      <div className="text-[10px] text-slate-500 font-semibold uppercase">Retail MRP</div>
                      <div className="font-heading font-black text-sm text-slate-800 mt-0.5 line-through opacity-70">
                        ₹{product.mrp_inr.toLocaleString('en-IN')}
                      </div>
                    </div>

                    <div className="border-x border-slate-200 px-2">
                      <div className="text-[10px] text-[#185ADB] font-bold uppercase">Distributor Cost</div>
                      <div className="font-heading font-black text-base text-[#185ADB] mt-0.5">
                        ₹{product.distributor_buy_price_inr.toLocaleString('en-IN')}
                      </div>
                      <div className="text-[9px] text-slate-500">(-{product.distributor_discount_percent}% Tier Rate)</div>
                    </div>

                    <div className="pl-1">
                      <div className="text-[10px] text-indigo-700 font-bold uppercase">Dealer Rate</div>
                      <div className="font-heading font-black text-base text-indigo-700 mt-0.5">
                        ₹{Math.round(currentData.dealer_sell_price_inr).toLocaleString('en-IN')}
                      </div>
                      <div className="text-[9px] font-bold text-emerald-600">
                        +₹{profitAmount.toLocaleString('en-IN')} profit
                      </div>
                    </div>
                  </div>

                  {/* Interactive Dealer Margin Controller */}
                  <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <div className="font-bold text-slate-800 flex items-center gap-1.5">
                        <FiSliders className="text-[#185ADB]" />
                        <span>Set Dealer Margin Markup:</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-heading font-black text-[#185ADB] text-sm">
                          +{currentData.margin_percent}%
                        </span>
                        <span className="text-[11px] text-slate-500">
                          (₹{profitAmount.toLocaleString('en-IN')} / unit)
                        </span>
                      </div>
                    </div>

                    {/* Margin Slider */}
                    <input
                      type="range"
                      min={0}
                      max={35}
                      step={0.5}
                      value={currentData.margin_percent}
                      onChange={(e) =>
                        handleMarginChange(
                          product.id,
                          product.distributor_buy_price_inr,
                          e.target.value
                        )
                      }
                      className="w-full accent-[#185ADB] cursor-pointer"
                    />

                    {/* Custom Number Input & Save Button */}
                    <div className="flex items-center gap-3 pt-1">
                      <div className="flex items-center gap-1.5 flex-1">
                        <span className="text-xs text-slate-600 font-semibold">Dealer Price (₹):</span>
                        <input
                          type="number"
                          value={Math.round(currentData.dealer_sell_price_inr)}
                          onChange={(e) =>
                            handlePriceChange(
                              product.id,
                              product.distributor_buy_price_inr,
                              e.target.value
                            )
                          }
                          className="w-28 px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800 focus:outline-none focus:border-blue-500"
                        />
                      </div>

                      <button
                        type="button"
                        disabled={savingProductId === product.id}
                        onClick={() => handleSaveMargin(product.id)}
                        className="px-4 py-1.5 rounded-xl text-xs font-bold bg-[#185ADB] hover:bg-blue-700 text-white shadow-xs flex items-center gap-1 cursor-pointer transition-all disabled:opacity-50"
                      >
                        <FiCheck size={12} />{' '}
                        {savingProductId === product.id ? 'Saving...' : 'Save Rate'}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Procurement Action Footer */}
                <div className="pt-3 border-t border-slate-200 flex items-center justify-between gap-3">
                  <div className="text-[11px] text-slate-500">
                    Warranty: <strong className="text-slate-800">{product.warranty_years}</strong>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleOpenProcureModal(product)}
                    className="px-5 py-2.5 rounded-xl text-xs font-bold bg-[#185ADB] hover:bg-blue-700 text-white shadow-sm flex items-center gap-2 cursor-pointer transition-all"
                  >
                    <FiShoppingBag size={14} /> Procure Wholesale Stock
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Procurement Order Modal */}
      {procureProduct && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                  Wholesale Procurement Order
                </span>
                <h3 className="font-heading font-black text-lg text-slate-900 mt-1">
                  {procureProduct.name}
                </h3>
              </div>
              <button
                onClick={() => setProcureProduct(null)}
                className="p-2 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <FiX size={18} />
              </button>
            </div>

            {orderSuccess ? (
              <div className="py-6 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                  <FiCheckCircle size={28} />
                </div>
                <div className="font-heading font-black text-lg text-slate-900">
                  Wholesale Order Placed!
                </div>
                <p className="text-xs text-slate-500">
                  Order <strong>{orderSuccess.order_number}</strong> of ₹
                  {orderSuccess.grand_total_inr.toLocaleString('en-IN')} has been scheduled for central
                  factory dispatch.
                </p>
                <button
                  onClick={() => setProcureProduct(null)}
                  className="mt-4 px-6 py-2 rounded-xl text-xs font-bold bg-[#185ADB] text-white cursor-pointer"
                >
                  Close & Continue
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmitProcurement} className="space-y-4 text-xs">
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Distributor Buy Rate:</span>
                    <strong className="text-[#185ADB] text-sm">
                      ₹{procureProduct.distributor_buy_price_inr.toLocaleString('en-IN')} / unit
                    </strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Minimum Order Quantity (MOQ):</span>
                    <strong className="text-slate-800">{procureProduct.moq} Units</strong>
                  </div>
                </div>

                <div>
                  <label className="font-bold text-slate-800 block mb-1">
                    Order Quantity (Units) *
                  </label>
                  <input
                    type="number"
                    min={procureProduct.moq || 1}
                    required
                    value={procureQty}
                    onChange={(e) => setProcureQty(parseInt(e.target.value, 10) || 1)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900"
                  />
                </div>

                {/* Calculation Summary */}
                <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-200 space-y-1.5">
                  <div className="flex justify-between text-slate-600">
                    <span>Subtotal:</span>
                    <span>
                      ₹
                      {(
                        procureProduct.distributor_buy_price_inr * procureQty
                      ).toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>GST (18% Input Credit Eligible):</span>
                    <span>
                      ₹
                      {Math.round(
                        procureProduct.distributor_buy_price_inr * procureQty * 0.18
                      ).toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="flex justify-between font-bold text-slate-900 border-t border-blue-200 pt-1.5 text-sm">
                    <span>Estimated Total:</span>
                    <span className="text-[#185ADB] font-heading font-black">
                      ₹
                      {Math.round(
                        procureProduct.distributor_buy_price_inr * procureQty * 1.18
                      ).toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>

                <div className="pt-2 flex flex-wrap items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setProcureProduct(null)}
                    className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-100 border border-slate-200 text-slate-600 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAddToCart(procureProduct, procureQty)}
                    className="px-4 py-2.5 rounded-xl text-xs font-bold bg-white border border-[#185ADB] text-[#185ADB] hover:bg-blue-50 shadow-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <FiShoppingCart size={13} /> Add to Cart
                  </button>
                  <button
                    type="submit"
                    disabled={procuring}
                    className="px-5 py-2.5 rounded-xl text-xs font-bold bg-[#185ADB] hover:bg-blue-700 text-white shadow-sm disabled:opacity-50 cursor-pointer"
                  >
                    {procuring ? 'Placing Order...' : 'Confirm Wholesale Order'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
