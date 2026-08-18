import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import {
  FiSearch, FiFilter, FiX, FiSliders, FiBox, FiShield, FiArrowRight, FiChevronDown,
} from 'react-icons/fi';
import api from '../services/api';
import ProductCard from '../components/shop/ProductCard';
import PricingCalculatorModal from '../components/pricing/PricingCalculatorModal';

const CATEGORIES = [
  { id: 'all', name: 'All Products' },
  { id: 'boskit', name: 'BOS Kits & Combos' },
  { id: 'inverters', name: 'Solar Inverters' },
  { id: 'panels', name: 'Solar Panels' },
  { id: 'structures', name: 'Mounting Structures' },
  { id: 'dcdb', name: 'DCDB & ACDB' },
  { id: 'cables', name: 'DC Cables' },
];

const SORT_OPTIONS = [
  { value: 'relevance', label: 'Relevance' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'newest', label: 'Newest First' },
];

export default function ProductsPage() {
  const { role } = useAuth();
  const { addToCart } = useCart();
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(searchParams.get('q') || '');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('cat') || 'all');
  const [sortBy, setSortBy] = useState('relevance');
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [showCalculator, setShowCalculator] = useState(false);

  useEffect(() => {
    async function fetchProducts() {
      try {
        setLoading(true);
        const queryParams = new URLSearchParams();
        if (search) queryParams.set('search', search);
        if (selectedCategory !== 'all') queryParams.set('category', selectedCategory);
        const res = await api.get(`/public/products?${queryParams.toString()}`);
        if (res.data?.products) {
          let sorted = [...res.data.products];
          if (sortBy === 'price_asc') sorted.sort((a, b) => (a.mrp || 0) - (b.mrp || 0));
          if (sortBy === 'price_desc') sorted.sort((a, b) => (b.mrp || 0) - (a.mrp || 0));
          setProducts(sorted);
        }
      } catch (err) {
        console.error('Error fetching catalogue:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchProducts();
  }, [search, selectedCategory, sortBy]);

  const clearFilters = () => {
    setSearch('');
    setSelectedCategory('all');
    setSortBy('relevance');
    setSearchParams({});
  };

  const hasActiveFilters = search || selectedCategory !== 'all';

  return (
    <div className="min-h-screen bg-[#F7FAF8]">
      {/* Page Header */}
      <div className="bg-[#FFFFFF] border-b border-[#DDE8E1]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Breadcrumb */}
          <nav className="text-xs text-[#5F6F65] mb-3 flex items-center gap-1.5">
            <Link to="/" className="hover:text-[#1F8F4E]">Home</Link>
            <span>›</span>
            <span className="text-[#17211B] font-medium">
              {CATEGORIES.find((c) => c.id === selectedCategory)?.name || 'All Products'}
            </span>
          </nav>

          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <h1 className="font-heading font-black text-3xl sm:text-4xl text-[#17211B] tracking-tight">
                {selectedCategory === 'all' ? 'Solar Equipment Catalogue' : CATEGORIES.find((c) => c.id === selectedCategory)?.name}
              </h1>
              <p className="text-sm text-[#5F6F65] mt-1">
                {loading ? 'Loading...' : `${products.length} product${products.length !== 1 ? 's' : ''} found`}
                {' '}— GST invoice on every order
              </p>
            </div>

            {/* Distributor quick link */}
            {role === 'distributor' && (
              <Link
                to="/distributor/portal/procure"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-[#1F8F4E] text-white hover:bg-[#18733E] shadow-xs whitespace-nowrap"
              >
                <FiSliders className="w-3.5 h-3.5" /> Open Distributor Console
              </Link>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-8">
          {/* Sidebar Filters — Desktop */}
          <aside className="hidden lg:block w-60 shrink-0">
            <div className="bg-[#FFFFFF] border border-[#DDE8E1] rounded-2xl p-5 shadow-xs sticky top-24 space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="font-heading font-bold text-sm text-[#17211B]">Filters</h3>
                {hasActiveFilters && (
                  <button onClick={clearFilters} className="text-xs font-bold text-[#1F8F4E] hover:text-[#18733E]">
                    Clear All
                  </button>
                )}
              </div>

              {/* Category */}
              <div>
                <p className="text-xs font-bold text-[#5F6F65] uppercase tracking-widest mb-3">Category</p>
                <div className="space-y-1">
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedCategory(cat.id)}
                      className={`w-full text-left px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
                        selectedCategory === cat.id
                          ? 'bg-[#ECF8F1] text-[#1F8F4E] font-bold border border-[#DDE8E1]'
                          : 'text-[#5F6F65] hover:bg-[#F7FAF8] hover:text-[#17211B]'
                      }`}
                    >
                      {cat.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Bulk quote CTA */}
              <div className="bg-[#ECF8F1] border border-[#DDE8E1] rounded-xl p-4 space-y-2">
                <FiShield className="w-5 h-5 text-[#1F8F4E]" />
                <p className="text-xs font-bold text-[#17211B]">Need a Bulk Quote?</p>
                <p className="text-[11px] text-[#5F6F65]">Our team provides custom pricing for large orders.</p>
                <Link
                  to="/contact"
                  className="text-xs font-bold text-[#1F8F4E] hover:text-[#18733E] flex items-center gap-1"
                >
                  Contact Us <FiArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <div className="flex-1 min-w-0 space-y-5">
            {/* Search + Sort + Mobile Filter */}
            <div className="flex flex-col sm:flex-row gap-3">
              {/* Search */}
              <div className="relative flex-1">
                <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#5F6F65] w-4 h-4" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search products, brands, SKUs..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#FFFFFF] border border-[#DDE8E1] text-sm text-[#17211B] placeholder-[#5F6F65] focus:outline-none focus:border-[#1F8F4E] transition-colors shadow-xs"
                />
                {search && (
                  <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#5F6F65]">
                    <FiX className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Sort */}
              <div className="relative">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="appearance-none pl-3 pr-8 py-2.5 rounded-xl bg-[#FFFFFF] border border-[#DDE8E1] text-sm text-[#17211B] focus:outline-none focus:border-[#1F8F4E] shadow-xs cursor-pointer font-medium"
                >
                  {SORT_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
                <FiChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#5F6F65] pointer-events-none" />
              </div>

              {/* Mobile Filters */}
              <button
                onClick={() => setShowMobileFilters(true)}
                className="lg:hidden flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#FFFFFF] border border-[#DDE8E1] text-sm font-medium text-[#17211B] shadow-xs"
              >
                <FiFilter className="w-4 h-4 text-[#1F8F4E]" /> Filters
                {hasActiveFilters && <span className="w-2 h-2 rounded-full bg-[#1F8F4E]" />}
              </button>
            </div>

            {/* Category Pills (mobile quick-filter) */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none lg:hidden">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                    selectedCategory === cat.id
                      ? 'bg-[#1F8F4E] text-white'
                      : 'bg-[#FFFFFF] text-[#5F6F65] border border-[#DDE8E1]'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>

            {/* Active filter chips */}
            {hasActiveFilters && (
              <div className="flex flex-wrap gap-2">
                {search && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#ECF8F1] text-[#1F8F4E] border border-[#DDE8E1]">
                    Search: "{search}"
                    <button onClick={() => setSearch('')}><FiX className="w-3 h-3" /></button>
                  </span>
                )}
                {selectedCategory !== 'all' && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#ECF8F1] text-[#1F8F4E] border border-[#DDE8E1]">
                    {CATEGORIES.find((c) => c.id === selectedCategory)?.name}
                    <button onClick={() => setSelectedCategory('all')}><FiX className="w-3 h-3" /></button>
                  </span>
                )}
                <button onClick={clearFilters} className="text-xs font-bold text-[#5F6F65] hover:text-red-500 underline">
                  Clear All
                </button>
              </div>
            )}

            {/* Product Grid */}
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                {[1, 2, 3, 4, 5, 6].map((n) => (
                  <div key={n} className="bg-[#FFFFFF] border border-[#DDE8E1] h-80 rounded-2xl animate-pulse" />
                ))}
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-20 bg-[#FFFFFF] border border-[#DDE8E1] rounded-2xl shadow-xs space-y-4">
                <FiBox className="w-12 h-12 text-[#DDE8E1] mx-auto" />
                <h3 className="font-heading font-bold text-lg text-[#17211B]">No Products Found</h3>
                <p className="text-sm text-[#5F6F65]">Try adjusting your search or selecting a different category.</p>
                <button
                  onClick={clearFilters}
                  className="px-5 py-2.5 rounded-xl text-sm font-bold bg-[#1F8F4E] text-white hover:bg-[#18733E]"
                >
                  Clear Filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                {products.map((item) => (
                  <ProductCard
                    key={item._id || item.id}
                    product={{ ...item, id: item._id || item.id }}
                    onAddToCart={addToCart}
                    showPrice={!!(item.mrp || item.price_inr)}
                  />
                ))}
              </div>
            )}

            {/* Bottom info bar */}
            <div className="bg-[#ECF8F1] rounded-2xl p-5 border border-[#DDE8E1] flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xs">
              <div className="flex items-center gap-3">
                <FiShield className="w-7 h-7 text-[#1F8F4E] shrink-0" />
                <div>
                  <p className="text-sm font-bold text-[#17211B]">Need a Custom Order or Project Quote?</p>
                  <p className="text-xs text-[#5F6F65]">Container loads, project BOMs, custom configurations — contact our commercial team.</p>
                </div>
              </div>
              <Link
                to="/contact"
                className="px-5 py-2.5 rounded-xl text-xs font-bold bg-[#1F8F4E] text-white hover:bg-[#18733E] whitespace-nowrap shadow-xs"
              >
                Get in Touch
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Filter Drawer */}
      {showMobileFilters && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowMobileFilters(false)} />
          <div className="absolute right-0 top-0 bottom-0 w-72 bg-[#FFFFFF] shadow-xl p-6 overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-heading font-bold text-lg text-[#17211B]">Filters</h3>
              <button onClick={() => setShowMobileFilters(false)}>
                <FiX className="w-5 h-5 text-[#5F6F65]" />
              </button>
            </div>
            <div className="space-y-4">
              <p className="text-xs font-bold text-[#5F6F65] uppercase tracking-widest">Category</p>
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => { setSelectedCategory(cat.id); setShowMobileFilters(false); }}
                  className={`w-full text-left px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                    selectedCategory === cat.id
                      ? 'bg-[#ECF8F1] text-[#1F8F4E] font-bold'
                      : 'text-[#5F6F65] hover:bg-[#F7FAF8]'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
            {hasActiveFilters && (
              <button
                onClick={() => { clearFilters(); setShowMobileFilters(false); }}
                className="mt-6 w-full py-2.5 rounded-xl text-sm font-bold text-red-600 bg-red-50 border border-red-200"
              >
                Clear All Filters
              </button>
            )}
          </div>
        </div>
      )}

      <PricingCalculatorModal isOpen={showCalculator} onClose={() => setShowCalculator(false)} />
    </div>
  );
}
