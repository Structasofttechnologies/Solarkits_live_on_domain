import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  FiPackage,
  FiShoppingCart,
  FiSearch,
  FiCheck,
  FiShield,
  FiTag,
  FiFilter,
  FiRefreshCw,
  FiX,
  FiCheckCircle,
  FiPlus,
  FiMinus,
  FiArrowRight,
  FiEye,
  FiZap,
  FiInfo,
  FiSliders,
  FiTrash2,
} from 'react-icons/fi';
import { MdSolarPower, MdVerified } from 'react-icons/md';
import { useAuth } from '../../context/AuthContext';
import { useDealerCart } from '../../context/DealerCartContext';
import api from '../../services/api';

export default function DealerCataloguePage() {
  const navigate = useNavigate();
  const { user, dealer } = useAuth();
  const {
    cartItems,
    addToCart,
    totalItemsCount,
    subtotalInr,
    gstAmountInr,
    grandTotalInr,
    isDrawerOpen,
    setIsDrawerOpen,
    removeFromCart,
  } = useDealerCart();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedBrand, setSelectedBrand] = useState('all');
  const [inStockOnly, setInStockOnly] = useState(false);
  const [sortBy, setSortBy] = useState('featured');
  const [showFilters, setShowFilters] = useState(false);

  // Per-card selected quantities
  const [cardQuantities, setCardQuantities] = useState({});

  // Toast & Quick View Modal
  const [addedItemToast, setAddedItemToast] = useState(null);
  const [quickViewProduct, setQuickViewProduct] = useState(null);
  const [modalQty, setModalQty] = useState(1);

  const categories = [
    { id: 'all', name: 'All Equipment' },
    { id: 'panels', name: 'Solar Panels' },
    { id: 'inverters', name: 'Solar Inverters' },
    { id: 'batteries', name: 'Battery Storage' },
    { id: 'boskit', name: 'BOS Turnkey Combos' },
    { id: 'structures', name: 'Mounting Structures' },
    { id: 'dcdb', name: 'DCDB & ACDB' },
    { id: 'cables', name: 'DC Cables' },
  ];

  const brands = [
    { id: 'all', name: 'All Brands' },
    { id: 'tata power solar', name: 'Tata Power Solar' },
    { id: 'waaree energies', name: 'Waaree Energies' },
    { id: 'adani solar', name: 'Adani Solar' },
    { id: 'havells', name: 'Havells' },
    { id: 'growatt', name: 'Growatt' },
    { id: 'solarkits probos', name: 'SolarKits ProBOS' },
  ];

  const fetchCatalogue = () => {
    setLoading(true);
    const params = {};
    if (selectedCategory !== 'all') params.category = selectedCategory;
    if (selectedBrand !== 'all') params.brand = selectedBrand;
    if (search) params.search = search;

    api
      .get('/dealer/catalogue', { params })
      .then((res) => {
        if (res.data?.success) {
          const prods = res.data.products || [];
          setProducts(prods);

          // Initialize card quantities to each product's MOQ
          const initialQtys = {};
          prods.forEach((p) => {
            initialQtys[p.id] = p.moq || 1;
          });
          setCardQuantities(initialQtys);
        }
      })
      .catch((err) => console.error('Error fetching dealer catalogue:', err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchCatalogue();
  }, [selectedCategory, selectedBrand]);

  const handleCardQtyChange = (productId, delta, moq = 1) => {
    setCardQuantities((prev) => {
      const current = prev[productId] || moq;
      const step = moq > 1 ? 5 : 1;
      const next = Math.max(moq, current + delta * step);
      return { ...prev, [productId]: next };
    });
  };

  const handleAddToCart = (item) => {
    const qty = cardQuantities[item.id] || item.moq || 1;
    addToCart(item, qty);
    setAddedItemToast({ name: item.name, quantity: qty });
    setTimeout(() => setAddedItemToast(null), 3500);
  };

  const handleOpenQuickView = (product) => {
    setQuickViewProduct(product);
    setModalQty(cardQuantities[product.id] || product.moq || 1);
  };

  // Filter & Sorting
  let filtered = products.filter((p) => {
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchName = p.name.toLowerCase().includes(q);
      const matchSku = p.sku.toLowerCase().includes(q);
      const matchBrand = (p.brand || '').toLowerCase().includes(q);
      if (!matchName && !matchSku && !matchBrand) return false;
    }
    if (selectedCategory !== 'all' && p.category !== selectedCategory) return false;
    if (selectedBrand !== 'all' && (p.brand || '').toLowerCase() !== selectedBrand.toLowerCase()) return false;
    if (inStockOnly && !p.in_stock) return false;
    return true;
  });

  // Sort
  if (sortBy === 'price_asc') {
    filtered.sort((a, b) => (a.dealer_wholesale_inr || 0) - (b.dealer_wholesale_inr || 0));
  } else if (sortBy === 'price_desc') {
    filtered.sort((a, b) => (b.dealer_wholesale_inr || 0) - (a.dealer_wholesale_inr || 0));
  } else if (sortBy === 'savings') {
    filtered.sort((a, b) => (b.dealer_discount_percent || 0) - (a.dealer_discount_percent || 0));
  } else if (sortBy === 'name') {
    filtered.sort((a, b) => a.name.localeCompare(b.name));
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 relative">
      
      {/* ── Added Toast Notification ───────────────────────────────────────── */}
      {addedItemToast && (
        <div className="fixed bottom-6 right-6 z-50 px-5 py-3.5 rounded-2xl shadow-2xl border bg-slate-900 text-white border-slate-700 flex items-center gap-3 animate-in fade-in slide-in-from-bottom-5">
          <div className="w-8 h-8 rounded-xl bg-emerald-500 text-white flex items-center justify-center font-bold shrink-0">
            <FiCheck size={16} />
          </div>
          <div>
            <div className="text-xs font-bold leading-tight">Added to Wholesale Batch</div>
            <div className="text-[11px] text-slate-300 truncate max-w-xs">
              {addedItemToast.quantity} × {addedItemToast.name}
            </div>
          </div>
          <button
            onClick={() => setIsDrawerOpen(true)}
            className="ml-2 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-[11px] font-bold text-white transition-colors cursor-pointer"
          >
            View Cart
          </button>
        </div>
      )}

      {/* ── Royal Blue Header Banner ────────────────────────────────────────── */}
      <div className="bg-[#185ADB] rounded-2xl p-6 sm:p-8 text-white shadow-md relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-white text-xs font-semibold backdrop-blur-md mb-2">
              <MdSolarPower size={15} />
              <span>Dealer Wholesale Hub</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight font-heading">
              Dealer Wholesale Equipment Catalogue
            </h1>
            <p className="mt-1 text-blue-100 text-xs sm:text-sm">
              Direct distributor pricing applied · Minimum Order Quantity (MOQ) and input tax credits verified
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsDrawerOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-white text-[#185ADB] hover:bg-blue-50 font-bold text-xs shadow-sm flex items-center gap-2 transition-all cursor-pointer"
            >
              <FiShoppingCart size={15} />
              <span>Wholesale Cart</span>
              {totalItemsCount > 0 && (
                <span className="bg-red-600 text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  {totalItemsCount}
                </span>
              )}
            </button>
            <button
              onClick={fetchCatalogue}
              className="p-3 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all border border-white/20 cursor-pointer active:scale-95 shadow-xs"
              title="Refresh catalogue"
            >
              <FiRefreshCw className={loading ? 'animate-spin' : ''} size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* ── Category Navigation Tabs ────────────────────────────────────────── */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {categories.map((cat) => {
          const isActive = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-4 py-2 rounded-xl text-xs font-bold shrink-0 transition-all cursor-pointer ${
                isActive
                  ? 'bg-[#185ADB] text-white shadow-sm'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              {cat.name}
            </button>
          );
        })}
      </div>

      {/* ── Search, Brand, & Sort Bar ───────────────────────────────────────── */}
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
              placeholder="Search solar modules, inverters, TOPCon, hybrid..."
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

          {/* Brand Filter */}
          <div className="w-full sm:w-48">
            <select
              value={selectedBrand}
              onChange={(e) => setSelectedBrand(e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-700 font-semibold focus:outline-none focus:border-blue-500"
            >
              {brands.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>

          {/* Sort Selector */}
          <div className="w-full sm:w-48">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-700 font-semibold focus:outline-none focus:border-blue-500"
            >
              <option value="featured">Sort: Featured First</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="savings">Highest Savings %</option>
              <option value="name">Product Name (A-Z)</option>
            </select>
          </div>

          {/* Filter Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
              showFilters
                ? 'bg-blue-50 border-blue-300 text-blue-700'
                : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
            }`}
          >
            <FiSliders size={14} />
            <span>Filters</span>
          </button>

        </div>

        {/* Expandable Filter Bar */}
        {showFilters && (
          <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center gap-4 text-xs">
            <label className="flex items-center gap-2 cursor-pointer text-slate-700">
              <input
                type="checkbox"
                checked={inStockOnly}
                onChange={(e) => setInStockOnly(e.target.checked)}
                className="rounded text-blue-600 focus:ring-blue-500"
              />
              <span className="font-semibold">Show In-Stock Depot Inventory Only</span>
            </label>
            <span className="text-slate-300">|</span>
            <span className="text-slate-500">
              Showing <strong>{filtered.length}</strong> matching equipment SKUs
            </span>
          </div>
        )}
      </div>

      {/* ── Product Cards Grid ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          [1, 2, 3, 4, 5, 6].map((n) => (
            <div key={n} className="h-96 rounded-2xl bg-white border border-slate-200 animate-pulse" />
          ))
        ) : filtered.length === 0 ? (
          <div className="col-span-full bg-white border border-slate-200 rounded-2xl p-12 text-center shadow-xs space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto shadow-inner">
              <MdSolarPower size={36} />
            </div>
            <div className="space-y-1">
              <h3 className="font-heading font-black text-xl text-slate-900">
                No Equipment Items Found
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
                No solar products currently match your search and category filter.
              </p>
            </div>
            <button
              onClick={() => {
                setSearch('');
                setSelectedCategory('all');
                setSelectedBrand('all');
              }}
              className="px-6 py-2.5 rounded-xl text-xs font-bold bg-[#185ADB] hover:bg-blue-700 text-white shadow-xs inline-flex items-center gap-2 cursor-pointer transition-all active:scale-95"
            >
              <FiRefreshCw size={14} /> Reset All Filters
            </button>
          </div>
        ) : (
          filtered.map((item) => {
            const currentQty = cardQuantities[item.id] || item.moq || 1;
            const specs = item.specifications || {};

            return (
              <div
                key={item.id}
                className="p-5 sm:p-6 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between hover:border-blue-500/50 hover:shadow-lg transition-all group"
              >
                <div className="space-y-3.5">
                  
                  {/* Thumbnail with Overlays */}
                  <div className="h-48 rounded-xl bg-slate-50 overflow-hidden relative border border-slate-200">
                    <img
                      src={item.image_url}
                      alt={item.name}
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src =
                          'https://images.unsplash.com/photo-1509391365360-2e959784a276?auto=format&fit=crop&w=800&q=80';
                      }}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />

                    {/* Top Badges */}
                    <div className="absolute top-2.5 left-2.5 flex flex-col gap-1">
                      {item.has_purchased && (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-600 text-white shadow-xs flex items-center gap-1">
                          <MdVerified size={12} /> Depot Stock
                        </span>
                      )}
                      {item.dealer_discount_percent > 0 && (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-500 text-white shadow-xs">
                          Save {item.dealer_discount_percent}%
                        </span>
                      )}
                    </div>

                    <span className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-md text-[10px] font-bold bg-white/95 text-blue-700 border border-blue-200 shadow-xs backdrop-blur-xs">
                      MOQ: {item.moq} {item.moq > 1 ? 'Units' : 'Unit'}
                    </span>

                    {/* Quick View Button on Hover */}
                    <button
                      onClick={() => handleOpenQuickView(item)}
                      className="absolute bottom-2.5 right-2.5 px-3 py-1.5 rounded-lg bg-slate-900/80 hover:bg-slate-900 text-white text-[11px] font-bold shadow-md opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1.5 cursor-pointer backdrop-blur-xs"
                    >
                      <FiEye size={13} /> Quick Specs
                    </button>
                  </div>

                  {/* Brand & SKU Header */}
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                        {item.brand || 'Tier-1 Solar'}
                      </span>
                      <span className="text-[10px] font-mono text-slate-400">
                        {item.sku}
                      </span>
                    </div>

                    <h3 className="font-heading font-bold text-sm sm:text-base text-slate-900 mt-1.5 leading-snug line-clamp-2">
                      {item.name}
                    </h3>
                  </div>

                  {/* Key Tech Specs Chips */}
                  <div className="flex flex-wrap gap-1.5 pt-1 text-[10px]">
                    {specs.technology && (
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-medium">
                        {specs.technology}
                      </span>
                    )}
                    {specs.efficiency && (
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-medium">
                        {specs.efficiency}
                      </span>
                    )}
                    {specs.warranty && (
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-medium">
                        {specs.warranty}
                      </span>
                    )}
                  </div>

                  {/* Pricing Box */}
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-baseline justify-between">
                    <div>
                      <span className="text-[10px] text-slate-500 block font-medium">Retail MRP</span>
                      <span className="text-xs text-slate-400 line-through">
                        ₹{(item.mrp_inr || 10000).toLocaleString('en-IN')}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-emerald-700 font-bold block">
                        Wholesale Rate (-{item.dealer_discount_percent}%)
                      </span>
                      <span className="font-heading font-black text-xl text-[#185ADB]">
                        ₹{(item.dealer_wholesale_inr || 9000).toLocaleString('en-IN')}
                      </span>
                      <span className="text-[9px] text-slate-400 block">+ 18% GST (ITC Eligible)</span>
                    </div>
                  </div>

                </div>

                {/* Card Footer: Quantity Stepper & Add to Cart Button */}
                <div className="pt-4 space-y-2 border-t border-slate-100 mt-4">
                  
                  <div className="flex items-center gap-2">
                    
                    {/* Stepper */}
                    <div className="flex items-center border border-slate-200 rounded-xl overflow-hidden bg-slate-50 shrink-0">
                      <button
                        onClick={() => handleCardQtyChange(item.id, -1, item.moq)}
                        disabled={currentQty <= item.moq}
                        className="p-2.5 text-slate-600 hover:bg-slate-200 disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer transition-colors"
                        title="Decrease quantity"
                      >
                        <FiMinus size={13} />
                      </button>
                      <span className="w-10 text-center text-xs font-bold text-slate-900 font-mono">
                        {currentQty}
                      </span>
                      <button
                        onClick={() => handleCardQtyChange(item.id, 1, item.moq)}
                        className="p-2.5 text-slate-600 hover:bg-slate-200 cursor-pointer transition-colors"
                        title="Increase quantity"
                      >
                        <FiPlus size={13} />
                      </button>
                    </div>

                    {/* Add to Wholesale Cart */}
                    <button
                      onClick={() => handleAddToCart(item)}
                      className="flex-1 py-2.5 px-3 rounded-xl text-xs font-bold bg-[#185ADB] text-white hover:bg-blue-700 shadow-xs flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-98"
                    >
                      <FiShoppingCart size={15} />
                      <span>Add to Order</span>
                    </button>

                  </div>

                </div>

              </div>
            );
          })
        )}
      </div>

      {/* ── Quick View Technical Specs Modal ───────────────────────────────── */}
      {quickViewProduct && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            
            <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white/95 backdrop-blur-xs z-10">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                  {quickViewProduct.brand} · {quickViewProduct.category?.toUpperCase()}
                </span>
                <h2 className="font-heading font-black text-base sm:text-lg text-slate-900 mt-1">
                  {quickViewProduct.name}
                </h2>
              </div>
              <button
                onClick={() => setQuickViewProduct(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <FiX size={18} />
              </button>
            </div>

            <div className="p-5 sm:p-6 space-y-5 text-xs text-slate-700">
              
              {/* Product Thumbnail & Core Pricing */}
              <div className="flex flex-col sm:flex-row gap-5 items-center">
                <div className="w-full sm:w-48 h-40 rounded-2xl bg-slate-100 border border-slate-200 overflow-hidden shrink-0">
                  <img
                    src={quickViewProduct.image_url}
                    alt={quickViewProduct.name}
                    className="w-full h-full object-cover"
                  />
                </div>

                <div className="space-y-3 flex-1">
                  <div className="font-mono text-slate-400 text-[11px]">
                    SKU: <strong>{quickViewProduct.sku}</strong>
                  </div>

                  <div className="p-3.5 rounded-xl bg-blue-50/70 border border-blue-200 flex items-baseline justify-between">
                    <div>
                      <span className="text-[10px] text-slate-500 block">Retail MRP</span>
                      <span className="text-xs text-slate-400 line-through">
                        ₹{(quickViewProduct.mrp_inr || 10000).toLocaleString('en-IN')}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-blue-700 font-bold block">
                        Wholesale Rate (-{quickViewProduct.dealer_discount_percent}%)
                      </span>
                      <span className="font-heading font-black text-xl text-[#185ADB]">
                        ₹{(quickViewProduct.dealer_wholesale_inr || 9000).toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>

                  <div className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1.5">
                    <FiCheckCircle size={14} />
                    <span>
                      {quickViewProduct.stock_status || 'In Stock at Gujarat Regional Logistics Depot'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Technical Parameters Table */}
              <div className="space-y-2">
                <h3 className="font-heading font-bold text-xs uppercase tracking-wide text-slate-900">
                  Technical Specifications & Compliance
                </h3>

                <div className="rounded-xl border border-slate-200 overflow-hidden divide-y divide-slate-100 bg-slate-50/50">
                  {Object.entries(quickViewProduct.specifications || {}).map(([key, val]) => (
                    <div key={key} className="p-2.5 flex justify-between">
                      <span className="text-slate-500 font-medium capitalize">{key.replace('_', ' ')}:</span>
                      <strong className="text-slate-900 text-right max-w-xs">{val}</strong>
                    </div>
                  ))}
                  <div className="p-2.5 flex justify-between">
                    <span className="text-slate-500 font-medium">Warranty:</span>
                    <strong className="text-slate-900">{quickViewProduct.warranty_years || '10 Years Factory'}</strong>
                  </div>
                  <div className="p-2.5 flex justify-between">
                    <span className="text-slate-500 font-medium">Applicable GST:</span>
                    <strong className="text-slate-900">18% (Input Tax Credit Claimable)</strong>
                  </div>
                </div>
              </div>

              {/* Modal Quantity & Add to Cart */}
              <div className="pt-3 flex items-center gap-3">
                <div className="flex items-center border border-slate-200 rounded-xl overflow-hidden bg-slate-50">
                  <button
                    onClick={() => setModalQty(Math.max(quickViewProduct.moq || 1, modalQty - (quickViewProduct.moq > 1 ? 5 : 1)))}
                    disabled={modalQty <= (quickViewProduct.moq || 1)}
                    className="p-3 text-slate-600 hover:bg-slate-200 disabled:opacity-30 cursor-pointer"
                  >
                    <FiMinus size={14} />
                  </button>
                  <span className="w-12 text-center text-xs font-bold text-slate-900 font-mono">
                    {modalQty}
                  </span>
                  <button
                    onClick={() => setModalQty(modalQty + (quickViewProduct.moq > 1 ? 5 : 1))}
                    className="p-3 text-slate-600 hover:bg-slate-200 cursor-pointer"
                  >
                    <FiPlus size={14} />
                  </button>
                </div>

                <button
                  onClick={() => {
                    addToCart(quickViewProduct, modalQty);
                    setQuickViewProduct(null);
                  }}
                  className="flex-1 py-3 rounded-xl bg-[#185ADB] hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-md"
                >
                  <FiShoppingCart size={15} /> Add {modalQty} Units to Order
                </button>
              </div>

            </div>

          </div>
        </div>
      )}

      {/* ── Slide-Over Cart Drawer ─────────────────────────────────────────── */}
      {isDrawerOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div
            onClick={() => setIsDrawerOpen(false)}
            className="absolute inset-0 bg-slate-900/50 backdrop-blur-2xs transition-opacity"
          />

          <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
            <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col justify-between border-l border-slate-200">
              
              {/* Drawer Header */}
              <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FiShoppingCart className="text-blue-600" size={18} />
                  <h2 className="font-heading font-black text-base text-slate-900">
                    Wholesale Order Cart ({totalItemsCount} units)
                  </h2>
                </div>
                <button
                  onClick={() => setIsDrawerOpen(false)}
                  className="p-2 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 cursor-pointer"
                >
                  <FiX size={18} />
                </button>
              </div>

              {/* Drawer Items */}
              <div className="p-5 flex-1 overflow-y-auto space-y-3 divide-y divide-slate-100">
                {cartItems.length === 0 ? (
                  <div className="text-center py-12 text-slate-400 space-y-3">
                    <FiShoppingCart size={36} className="mx-auto text-slate-300" />
                    <p className="text-xs">Your wholesale cart is empty.</p>
                  </div>
                ) : (
                  cartItems.map((item) => (
                    <div key={item.id} className="pt-3 first:pt-0 flex items-center justify-between gap-3 text-xs">
                      <div className="w-12 h-12 rounded-lg bg-slate-100 border border-slate-200 overflow-hidden shrink-0">
                        <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="font-bold text-slate-900 truncate">{item.name}</h4>
                        <span className="text-[10px] text-slate-500 block font-mono">
                          {item.quantity} × ₹{(item.dealer_wholesale_inr || 0).toLocaleString('en-IN')}
                        </span>
                      </div>
                      <div className="text-right">
                        <strong className="font-mono font-bold text-slate-900 block">
                          ₹{((item.dealer_wholesale_inr || 0) * (item.quantity || 1)).toLocaleString('en-IN')}
                        </strong>
                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="text-[10px] text-red-600 hover:underline cursor-pointer"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Drawer Footer */}
              {cartItems.length > 0 && (
                <div className="p-5 border-t border-slate-200 bg-slate-50 space-y-3 text-xs">
                  <div className="space-y-1 text-slate-600">
                    <div className="flex justify-between">
                      <span>Subtotal (Excl. Tax)</span>
                      <strong className="text-slate-900 font-mono">₹{subtotalInr.toLocaleString('en-IN')}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>18% GST (ITC Claimable)</span>
                      <strong className="text-slate-900 font-mono">₹{gstAmountInr.toLocaleString('en-IN')}</strong>
                    </div>
                    <div className="flex justify-between font-bold text-sm text-slate-900 border-t border-slate-200 pt-1">
                      <span>Grand Total</span>
                      <span className="text-[#185ADB] font-heading font-black text-lg">
                        ₹{grandTotalInr.toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <Link
                      to="/dealer/portal/cart"
                      onClick={() => setIsDrawerOpen(false)}
                      className="py-2.5 px-3 rounded-xl border border-slate-300 text-slate-700 font-bold text-center text-xs hover:bg-slate-100"
                    >
                      View Cart Page
                    </Link>
                    <button
                      onClick={() => {
                        setIsDrawerOpen(false);
                        navigate('/dealer/portal/checkout');
                      }}
                      className="py-2.5 px-3 rounded-xl bg-[#185ADB] hover:bg-blue-700 text-white font-bold text-center text-xs shadow-md"
                    >
                      Checkout →
                    </button>
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      )}

    </div>
  );
}
