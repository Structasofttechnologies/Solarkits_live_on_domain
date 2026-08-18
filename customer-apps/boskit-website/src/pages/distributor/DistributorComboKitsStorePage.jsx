import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  FiPackage,
  FiSearch,
  FiShoppingCart,
  FiCheckCircle,
  FiRefreshCw,
  FiShield,
  FiZap,
  FiSliders,
  FiStar,
  FiInfo,
  FiCheck,
  FiPlus,
  FiMinus,
  FiEye,
  FiX,
  FiArrowRight,
  FiTag,
  FiChevronDown,
} from 'react-icons/fi';
import { FaSolarPanel, FaBolt, FaTools, FaCheck } from 'react-icons/fa';
import { MdSolarPower, MdVerified } from 'react-icons/md';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import api from '../../services/api';
import axios from 'axios';

// Category filter tabs
const CATEGORIES = [
  { id: 'all', name: 'All Combo Kits' },
  { id: 'single_phase', name: 'Single Phase Residential' },
  { id: 'three_phase', name: 'Three Phase Commercial' },
  { id: 'industrial', name: 'Industrial C&I' },
  { id: 'pump', name: 'Agriculture Solar Pumps' },
  { id: 'battery', name: 'Off-Grid & Battery Disconnect' },
];

const CAPACITY_RANGES = [
  { id: 'all', name: 'All Project Ranges' },
  { id: '1kw-3kw', name: '1 kW – 3 kW' },
  { id: '3kw-5kw', name: '3 kW – 5 kW' },
  { id: '10kw-25kw', name: '5 kW – 25 kW' },
  { id: '25kw-100kw', name: '25 kW – 100 kW' },
];

const SORT_OPTIONS = [
  { value: 'popular', label: 'Most Popular' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'rating', label: 'Highest Rated' },
];

export default function DistributorComboKitsStorePage() {
  const { user, distributor } = useAuth();
  const { addToCart } = useCart();

  const [kits, setKits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedRange, setSelectedRange] = useState('all');
  const [sortBy, setSortBy] = useState('popular');
  const [quantities, setQuantities] = useState({});
  const [addingId, setAddingId] = useState(null);
  const [activeModalKit, setActiveModalKit] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Fetch real-life BOS kits from MongoDB Backend API
  const fetchBOSKits = async () => {
    try {
      setLoading(true);
      let items = [];
      try {
        const apiBase = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/+$/, '');
        const res = await axios.get(`${apiBase}/india/v1/shop/bos-kits`);
        if (res.data?.data && Array.isArray(res.data.data) && res.data.data.length > 0) {
          items = res.data.data;
        }
      } catch (err) {
        console.warn('Direct shop/bos-kits fetch fallback:', err.message);
      }

      if (!items || items.length === 0) {
        // Fallback to public products endpoint filtered by category boskit
        try {
          const resPub = await api.get('/public/products?category=boskit');
          if (resPub.data?.products) {
            items = resPub.data.products;
          }
        } catch (e) {
          console.warn('Fallback public products failed:', e.message);
        }
      }

      setKits(items);

      // Initialize default quantities to 1
      const initialQty = {};
      items.forEach((k) => {
        initialQty[k._id || k.id] = 1;
      });
      setQuantities(initialQty);
    } catch (err) {
      console.error('Failed to load BOS kits:', err);
      showToast('Failed to load Combo BOS Kits.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBOSKits();
  }, []);

  const handleQuantityChange = (kitId, delta) => {
    setQuantities((prev) => {
      const current = prev[kitId] || 1;
      const next = Math.max(1, current + delta);
      return { ...prev, [kitId]: next };
    });
  };

  // Add to Cart Action
  const handleAddToCart = async (kit) => {
    const kitId = kit._id || kit.id;
    const qty = quantities[kitId] || 1;
    setAddingId(kitId);

    try {
      const productPayload = {
        id: kitId,
        _id: kitId,
        name: kit.name,
        mrp: kit.marketPrice || Math.round((kit.ourPrice || 10000) * 1.35),
        price_inr: kit.ourPrice || kit.price || 8500,
        distributor_buy_price_inr: kit.ourPrice || kit.price || 8500,
        mrp_inr: kit.marketPrice || Math.round((kit.ourPrice || 10000) * 1.35),
        category: 'boskit',
        brand: 'SolarKits ProBOS',
        image_url: kit.imageUrl || kit.image,
      };

      try {
        const saved = localStorage.getItem('boskit_distributor_cart');
        const existing = saved ? JSON.parse(saved) : [];
        const foundIdx = existing.findIndex((i) => (i.id || i._id) === kitId);
        if (foundIdx >= 0) {
          existing[foundIdx].quantity = (existing[foundIdx].quantity || 1) + qty;
        } else {
          existing.push({
            id: kitId,
            name: kit.name,
            sku: kit.sku || `BK-${kitId.toString().slice(-6).toUpperCase()}`,
            brand: 'SolarKits ProBOS',
            image_url: kit.imageUrl || kit.image,
            distributor_buy_price_inr: kit.ourPrice || 8500,
            mrp_inr: kit.marketPrice || Math.round((kit.ourPrice || 8500) * 1.35),
            moq: 1,
            quantity: qty,
          });
        }
        localStorage.setItem('boskit_distributor_cart', JSON.stringify(existing));
      } catch (e) {
        console.warn('localStorage cart sync warning:', e);
      }

      const success = await addToCart(productPayload, qty);
      showToast(`🎉 Added ${qty}x "${kit.name}" to Cart!`, 'success');
    } catch (err) {
      console.error('Error adding kit to cart:', err);
      showToast('Failed to add kit to cart.', 'error');
    } finally {
      setAddingId(null);
    }
  };

  // Filter & Sort BOS Kits
  const filteredKits = useMemo(() => {
    let list = [...kits];

    // Search filter
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (k) =>
          k.name?.toLowerCase().includes(q) ||
          k.category?.toLowerCase().includes(q) ||
          k.subCategory?.toLowerCase().includes(q) ||
          (k.components && k.components.some((c) => c.toLowerCase().includes(q)))
      );
    }

    // Category filter
    if (selectedCategory !== 'all') {
      if (selectedCategory === 'single_phase') {
        list = list.filter((k) => (k.subCategory || '').toLowerCase().includes('single') || (k.name || '').toLowerCase().includes('single phase') || (k.name || '').toLowerCase().includes('1 kw') || (k.name || '').toLowerCase().includes('3 kw'));
      } else if (selectedCategory === 'three_phase') {
        list = list.filter((k) => (k.subCategory || '').toLowerCase().includes('three') || (k.name || '').toLowerCase().includes('three phase') || (k.name || '').toLowerCase().includes('5 kw') || (k.name || '').toLowerCase().includes('commercial'));
      } else if (selectedCategory === 'industrial') {
        list = list.filter((k) => (k.name || '').toLowerCase().includes('industrial') || (k.name || '').toLowerCase().includes('mega') || (k.name || '').toLowerCase().includes('100 kw') || (k.projectRange || '').includes('100kw'));
      } else if (selectedCategory === 'pump') {
        list = list.filter((k) => (k.name || '').toLowerCase().includes('pump') || (k.category || '').toLowerCase().includes('pump') || (k.systemType || '').toLowerCase().includes('pump'));
      } else if (selectedCategory === 'battery') {
        list = list.filter((k) => (k.name || '').toLowerCase().includes('battery') || (k.name || '').toLowerCase().includes('off-grid') || (k.category || '').toLowerCase().includes('protection'));
      }
    }

    // Capacity range filter
    if (selectedRange !== 'all') {
      list = list.filter((k) => {
        const pr = (k.projectRange || '').toLowerCase();
        const nm = (k.name || '').toLowerCase();
        if (selectedRange === '1kw-3kw') return pr.includes('1kw-3kw') || nm.includes('1 kw - 3 kw');
        if (selectedRange === '3kw-5kw') return pr.includes('3kw-5kw') || nm.includes('3 kw - 5 kw');
        if (selectedRange === '10kw-25kw') return pr.includes('10kw-25kw') || pr.includes('5kw-10kw') || nm.includes('10 kw') || nm.includes('5 kw');
        if (selectedRange === '25kw-100kw') return pr.includes('25kw-100kw') || nm.includes('25 kw') || nm.includes('100 kw');
        return true;
      });
    }

    // Sorting
    if (sortBy === 'price_asc') {
      list.sort((a, b) => (a.ourPrice || a.price || 0) - (b.ourPrice || b.price || 0));
    } else if (sortBy === 'price_desc') {
      list.sort((a, b) => (b.ourPrice || b.price || 0) - (a.ourPrice || a.price || 0));
    } else if (sortBy === 'rating') {
      list.sort((a, b) => (b.rating || 4.9) - (a.rating || 4.9));
    }

    return list;
  }, [kits, search, selectedCategory, selectedRange, sortBy]);

  return (
    <div className="space-y-8 pb-16">

      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed top-20 right-6 z-50 px-5 py-3 rounded-2xl text-xs font-bold shadow-xl border flex items-center gap-2.5 transition-all animate-bounce ${
            toast.type === 'error'
              ? 'bg-red-50 text-red-800 border-red-200'
              : 'bg-emerald-50 text-emerald-800 border-emerald-200'
          }`}
        >
          <FiCheckCircle size={16} />
          {toast.message}
        </div>
      )}

      {/* Hero Banner — E-Commerce Store Style */}
      <div className="bg-gradient-to-r from-blue-700 via-blue-800 to-slate-900 rounded-3xl p-6 sm:p-8 text-white relative overflow-hidden shadow-lg">
        <div className="absolute -right-10 -bottom-10 opacity-10 pointer-events-none">
          <MdSolarPower size={280} />
        </div>

        <div className="relative z-10 max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-black bg-white/15 backdrop-blur-md text-amber-300 border border-white/10">
            <FiZap className="text-amber-400" />
            B2B FACTORY WHOLESALE STORE
          </div>

          <h1 className="text-2xl sm:text-4xl font-heading font-black text-white tracking-tight">
            Turnkey Pre-Packaged Combo BOS Kits
          </h1>

          <p className="text-sm text-slate-200 leading-relaxed max-w-2xl">
            Certified all-in-one Balance of System protection packages pre-assembled with DCDB, ACDB, TUV UV DC Cables, Earthing Electrodes, and MMS Fasteners. Ready for instant wholesale dispatch.
          </p>

          <div className="flex flex-wrap gap-4 pt-3 text-xs font-bold text-slate-200">
            <span className="flex items-center gap-1.5"><MdVerified className="text-emerald-400 text-sm" /> 100% Factory Pre-Wired & Tested</span>
            <span className="flex items-center gap-1.5"><FiShield className="text-amber-300 text-sm" /> 5 Years Replacement Warranty</span>
            <span className="flex items-center gap-1.5"><FiTag className="text-sky-300 text-sm" /> 18% GST Input Tax Credit (ITC) Eligible</span>
          </div>
        </div>
      </div>

      {/* Reseller Margin Manager Quick Banner */}
      <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-black shadow-md shrink-0">
            <FiSliders size={20} />
          </div>
          <div>
            <h3 className="font-heading font-black text-sm text-emerald-950">
              Dealer Reselling & Profit Margin Control Hub
            </h3>
            <p className="text-xs text-emerald-800">
              Set custom selling prices and profit margins for every kit so your onboarded territory dealers buy from you at your desired markup.
            </p>
          </div>
        </div>

        <Link
          to="/distributor/portal/dealer-margins"
          className="px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-black shadow-sm flex items-center gap-2 whitespace-nowrap shrink-0 transition-all cursor-pointer active:scale-95"
        >
          <span>Set All Dealer Margins</span> <FiArrowRight size={14} />
        </Link>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
          
          {/* Keyword Search */}
          <div className="relative flex-1">
            <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
            <input
              type="text"
              placeholder="Search by kit name, capacity, DCDB, ACDB, cables..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 rounded-2xl border border-slate-200 bg-slate-50 text-slate-900 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <FiX size={16} />
              </button>
            )}
          </div>

          {/* Project Range Dropdown */}
          <div className="flex items-center gap-2 shrink-0">
            <select
              value={selectedRange}
              onChange={(e) => setSelectedRange(e.target.value)}
              className="px-4 py-2.5 rounded-2xl border border-slate-200 bg-slate-50 text-slate-800 text-xs font-extrabold focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              {CAPACITY_RANGES.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          </div>

          {/* Sort By Dropdown */}
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider shrink-0">Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-2.5 rounded-2xl border border-slate-200 bg-slate-50 text-slate-800 text-xs font-extrabold focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none pt-2 border-t border-slate-100">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                selectedCategory === cat.id
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200/80'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* E-Commerce Product Card Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div key={n} className="bg-white rounded-3xl border border-slate-200 h-96 animate-pulse p-6" />
          ))}
        </div>
      ) : filteredKits.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-16 text-center space-y-4 shadow-xs">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-400">
            <FiPackage size={32} />
          </div>
          <h3 className="text-lg font-black text-slate-900">No Combo BOS Kits Found</h3>
          <p className="text-slate-500 text-sm max-w-md mx-auto">
            No pre-packaged kits match your search or filter criteria. Try clearing your filters or exploring our Customization Engine.
          </p>
          <button
            onClick={() => {
              setSearch('');
              setSelectedCategory('all');
              setSelectedRange('all');
            }}
            className="px-5 py-2.5 rounded-xl text-xs font-bold bg-blue-600 text-white hover:bg-blue-700 cursor-pointer shadow-xs"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredKits.map((kit) => {
            const kitId = kit._id || kit.id;
            const buyPrice = kit.ourPrice || kit.price || 8500;
            const mrp = kit.marketPrice || Math.round(buyPrice * 1.35);
            const savings = mrp - buyPrice;
            const savingsPercent = Math.round((savings / mrp) * 100);
            const currentQty = quantities[kitId] || 1;
            const isAdding = addingId === kitId;
            const componentCount = kit.components?.length || 7;

            return (
              <div
                key={kitId}
                className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-xl hover:border-blue-500/50 transition-all duration-300 flex flex-col justify-between group"
              >
                {/* Top: Product Image & Badges */}
                <div>
                  <div className="relative aspect-[4/3] bg-slate-50 overflow-hidden border-b border-slate-100">
                    <img
                      src={kit.imageUrl || kit.image || 'https://images.unsplash.com/photo-1592833159057-651427788523?w=800&auto=format&fit=crop&q=80'}
                      alt={kit.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = 'https://images.unsplash.com/photo-1509391365360-2e959784a276?w=800&auto=format&fit=crop&q=80';
                      }}
                    />

                    {/* Floating Badges */}
                    <div className="absolute top-3.5 left-3.5 flex flex-col gap-1.5 z-10">
                      {kit.badge ? (
                        <span className="px-3 py-1 rounded-xl text-[11px] font-black bg-amber-400 text-slate-950 shadow-md">
                          {kit.badge}
                        </span>
                      ) : (
                        <span className="px-3 py-1 rounded-xl text-[11px] font-black bg-blue-600 text-white shadow-md">
                          Tier-1 Certified
                        </span>
                      )}
                    </div>

                    <div className="absolute top-3.5 right-3.5 px-2.5 py-1 rounded-xl text-[11px] font-extrabold bg-white/95 text-slate-700 shadow-md border border-slate-200 backdrop-blur-sm flex items-center gap-1">
                      <FiStar className="text-amber-500 fill-amber-400" size={13} />
                      {kit.rating || 4.9} ({kit.reviewsCount || 42})
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-5 space-y-3">
                    
                    {/* Category & Warranty Tags */}
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-lg border border-blue-200">
                        {kit.category || 'Complete BOS Combos'}
                      </span>
                      <span className="font-semibold text-slate-500 flex items-center gap-1">
                        <FiShield className="text-emerald-600" /> {kit.warranty || '5 Yrs Replacement'}
                      </span>
                    </div>

                    {/* Title */}
                    <h2 className="font-heading font-black text-base text-slate-900 leading-snug group-hover:text-blue-600 transition-colors line-clamp-2">
                      {kit.name}
                    </h2>

                    {/* Key Components Preview */}
                    <div className="space-y-1.5 pt-1">
                      <div className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                        <span>Included Hardware ({componentCount} Items)</span>
                        <button
                          type="button"
                          onClick={() => setActiveModalKit(kit)}
                          className="text-blue-600 hover:underline cursor-pointer lowercase text-[11px]"
                        >
                          view all →
                        </button>
                      </div>

                      <div className="space-y-1">
                        {(kit.components || []).slice(0, 3).map((comp, cIdx) => (
                          <div key={cIdx} className="flex items-start gap-2 text-xs text-slate-600">
                            <FiCheck className="text-emerald-600 shrink-0 mt-0.5" size={13} />
                            <span className="truncate leading-tight font-medium">{comp}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                  </div>
                </div>

                {/* Footer: Pricing & Add to Cart Controls */}
                <div className="p-5 pt-0 space-y-4">
                  
                  {/* Price Box */}
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-slate-400 line-through font-mono">
                          MRP: ₹{mrp.toLocaleString('en-IN')}
                        </span>
                        <span className="text-[10px] font-black text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md">
                          {savingsPercent}% OFF
                        </span>
                      </div>
                      <div className="text-xl font-heading font-black text-blue-600 font-mono mt-0.5">
                        ₹{buyPrice.toLocaleString('en-IN')}
                      </div>
                      <span className="text-[9px] text-slate-400 font-bold block uppercase tracking-wider">
                        Factory Buy Rate (Excl. Tax)
                      </span>
                    </div>

                    {/* Quantity Counter */}
                    <div className="flex items-center bg-white border border-slate-300 rounded-xl p-1 shadow-xs">
                      <button
                        type="button"
                        onClick={() => handleQuantityChange(kitId, -1)}
                        className="w-7 h-7 rounded-lg text-slate-600 hover:bg-slate-100 flex items-center justify-center font-black cursor-pointer text-xs"
                      >
                        <FiMinus size={11} />
                      </button>
                      <span className="w-8 text-center text-xs font-mono font-black text-slate-900">
                        {currentQty}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleQuantityChange(kitId, 1)}
                        className="w-7 h-7 rounded-lg text-slate-600 hover:bg-slate-100 flex items-center justify-center font-black cursor-pointer text-xs"
                      >
                        <FiPlus size={11} />
                      </button>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="grid grid-cols-12 gap-2">
                    <button
                      type="button"
                      onClick={() => setActiveModalKit(kit)}
                      className="col-span-4 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-extrabold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                      title="View complete specifications and BOM list"
                    >
                      <FiEye size={14} /> Specs
                    </button>

                    <button
                      type="button"
                      disabled={isAdding}
                      onClick={() => handleAddToCart(kit)}
                      className="col-span-8 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black shadow-md shadow-blue-500/25 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                    >
                      {isAdding ? (
                        <FiRefreshCw className="animate-spin" size={14} />
                      ) : (
                        <FiShoppingCart size={15} />
                      )}
                      Add to Cart
                    </button>
                  </div>

                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* Detailed Kit Components & Specs Modal */}
      {activeModalKit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            onClick={() => setActiveModalKit(null)}
          />

          <div className="relative bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-6 z-10 animate-in fade-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-4 border-b border-slate-100">
              <div>
                <span className="text-[10px] font-black text-blue-700 bg-blue-50 px-3 py-1 rounded-lg border border-blue-200 uppercase tracking-wider">
                  {activeModalKit.category || 'Turnkey BOS Solution'}
                </span>
                <h2 className="text-xl font-heading font-black text-slate-900 mt-2">
                  {activeModalKit.name}
                </h2>
                <p className="text-xs text-slate-500 font-semibold mt-0.5">
                  Pre-assembled & factory tested combo kit with full warranty coverage
                </p>
              </div>

              <button
                type="button"
                onClick={() => setActiveModalKit(null)}
                className="p-2 rounded-xl bg-slate-100 text-slate-500 hover:bg-slate-200 transition cursor-pointer"
              >
                <FiX size={18} />
              </button>
            </div>

            {/* Modal Image & Pricing Card */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-5 items-center p-4 rounded-2xl bg-slate-50 border border-slate-200">
              <div className="sm:col-span-4 aspect-video rounded-xl overflow-hidden bg-white border border-slate-200">
                <img
                  src={activeModalKit.imageUrl || activeModalKit.image || 'https://images.unsplash.com/photo-1592833159057-651427788523?w=800&auto=format&fit=crop&q=80'}
                  alt={activeModalKit.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="sm:col-span-8 space-y-1.5">
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-black text-blue-600 font-mono">
                    ₹{(activeModalKit.ourPrice || activeModalKit.price || 8500).toLocaleString('en-IN')}
                  </span>
                  <span className="text-xs text-slate-400 line-through font-mono">
                    MRP: ₹{(activeModalKit.marketPrice || Math.round((activeModalKit.ourPrice || 8500) * 1.35)).toLocaleString('en-IN')}
                  </span>
                </div>
                <p className="text-xs text-slate-600 font-medium">
                  Includes full set of pre-packaged components, factory warranty certificates, and technical test link reports.
                </p>
              </div>
            </div>

            {/* Complete Included Components List */}
            <div className="space-y-3">
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center justify-between">
                <span>Complete Bill of Materials ({activeModalKit.components?.length || 7} Items)</span>
                <span className="text-emerald-700 font-bold text-[11px]">Factory Pre-Packaged</span>
              </h3>

              <div className="grid grid-cols-1 gap-2">
                {(activeModalKit.components || []).map((comp, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center gap-3 text-xs font-semibold text-slate-800"
                  >
                    <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                      <FiCheck size={12} />
                    </div>
                    <span>{comp}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Technical Specifications */}
            {activeModalKit.specifications && Object.keys(activeModalKit.specifications).length > 0 && (
              <div className="space-y-3">
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                  Technical Specifications & Compliance
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {Object.entries(activeModalKit.specifications).map(([key, val]) => (
                    <div
                      key={key}
                      className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex justify-between items-center text-xs"
                    >
                      <span className="text-slate-500 font-medium">{key}:</span>
                      <span className="font-bold text-slate-900 text-right ml-2">{val}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Modal Bottom CTA */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-4">
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Unit Wholesale Price</span>
                <span className="text-xl font-heading font-black text-slate-900 font-mono">
                  ₹{(activeModalKit.ourPrice || activeModalKit.price || 8500).toLocaleString('en-IN')}
                </span>
              </div>

              <button
                type="button"
                onClick={() => {
                  handleAddToCart(activeModalKit);
                  setActiveModalKit(null);
                }}
                className="px-6 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs shadow-lg shadow-blue-500/30 flex items-center gap-2 cursor-pointer"
              >
                <FiShoppingCart size={15} /> Add to Procurement Cart
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
