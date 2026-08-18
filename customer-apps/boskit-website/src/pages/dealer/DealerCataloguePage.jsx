import React, { useState, useEffect } from 'react';
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
} from 'react-icons/fi';
import { MdSolarPower } from 'react-icons/md';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

export default function DealerCataloguePage() {
  const { user, dealer } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [addedItem, setAddedItem] = useState(null);
  const [showFilters, setShowFilters] = useState(false);

  const fetchCatalogue = () => {
    setLoading(true);
    api
      .get('/dealer/catalogue')
      .then((res) => {
        if (res.data?.success) setProducts(res.data.products || []);
      })
      .catch((err) => console.error('Error fetching dealer catalogue:', err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchCatalogue();
  }, []);

  const handleAddToCart = (item) => {
    setAddedItem(item.name);
    setTimeout(() => setAddedItem(null), 3000);
  };

  const filtered = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.sku.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      
      {/* Toast Notification */}
      {addedItem && (
        <div className="fixed bottom-6 right-6 z-50 px-5 py-3 rounded-2xl shadow-xl border bg-emerald-50 text-emerald-800 border-emerald-200 flex items-center gap-3 animate-bounce">
          <FiCheckCircle size={18} />
          <span className="text-xs font-bold">Added to wholesale order: {addedItem}</span>
          <button onClick={() => setAddedItem(null)} className="ml-2 opacity-60 hover:opacity-100 cursor-pointer">
            <FiX />
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
            <div className="bg-white/10 backdrop-blur-md border border-white/20 px-5 py-2.5 rounded-xl text-right">
              <div className="text-2xl sm:text-3xl font-black">{filtered.length}</div>
              <div className="text-[11px] text-blue-100 font-medium">Equipment SKUs Available</div>
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

      {/* ── Search & Filter Controls Bar ───────────────────────────────────── */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
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
              placeholder="Search solar modules, inverters, structures..."
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
      </div>

      {/* ── Product Cards Grid ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          [1, 2, 3].map((n) => (
            <div key={n} className="h-96 rounded-2xl bg-white border border-slate-200 animate-pulse" />
          ))
        ) : filtered.length === 0 ? (
          <div className="col-span-3 bg-white border border-slate-200 rounded-2xl p-12 text-center shadow-xs space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto shadow-inner">
              <MdSolarPower size={36} />
            </div>
            <div className="space-y-1">
              <h3 className="font-heading font-black text-xl text-slate-900">
                No Equipment Items Found
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
                No solar products currently match your search query. Try searching for other components.
              </p>
            </div>
            <button
              onClick={() => setSearch('')}
              className="px-6 py-2.5 rounded-xl text-xs font-bold bg-[#185ADB] hover:bg-blue-700 text-white shadow-xs inline-flex items-center gap-2 cursor-pointer transition-all active:scale-95"
            >
              <FiRefreshCw size={14} /> Clear Search Filter
            </button>
          </div>
        ) : (
          filtered.map((item) => (
            <div
              key={item.id}
              className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4 flex flex-col justify-between hover:border-blue-500/40 hover:shadow-md transition-all"
            >
              <div className="space-y-3.5">
                <div className="h-44 rounded-xl bg-slate-50 overflow-hidden relative border border-slate-200">
                  <img
                    src={item.image_url}
                    alt={item.name}
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src =
                        'https://images.unsplash.com/photo-1509391365360-2e959784a276?auto=format&fit=crop&w=800&q=80';
                    }}
                    className="w-full h-full object-cover opacity-90 hover:opacity-100 transition-opacity"
                  />
                  <span className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-md text-[10px] font-bold bg-white/90 text-blue-700 border border-blue-200 shadow-xs backdrop-blur-xs">
                    MOQ: {item.moq} Unit
                  </span>
                </div>

                <div>
                  <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block">
                    {item.sku}
                  </span>
                  <h3 className="font-heading font-bold text-sm sm:text-base text-slate-900 mt-1 leading-snug">
                    {item.name}
                  </h3>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-baseline justify-between">
                  <div>
                    <span className="text-[10px] text-slate-500 block font-medium">Retail MRP</span>
                    <span className="text-xs text-slate-500 line-through">
                      ₹{item.mrp_inr.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-blue-700 font-bold block">
                      Wholesale Rate (-{item.dealer_discount_percent}%)
                    </span>
                    <span className="font-heading font-black text-xl text-[#185ADB]">
                      ₹{item.dealer_wholesale_inr.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => handleAddToCart(item)}
                className="w-full py-3 rounded-xl text-xs font-bold bg-[#185ADB] text-white hover:bg-blue-700 shadow-xs flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-98"
              >
                <FiShoppingCart size={15} /> Add to Wholesale Order
              </button>
            </div>
          ))
        )}
      </div>

    </div>
  );
}
