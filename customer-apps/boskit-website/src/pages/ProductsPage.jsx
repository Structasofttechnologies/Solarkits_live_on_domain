import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  FiBox,
  FiSearch,
  FiFilter,
  FiLock,
  FiCheckCircle,
  FiExternalLink,
  FiShield,
  FiSliders,
  FiZap,
  FiArrowRight,
  FiDollarSign,
  FiShoppingBag,
} from 'react-icons/fi';
import api from '../services/api';
import PricingCalculatorModal from '../components/pricing/PricingCalculatorModal';

export default function ProductsPage() {
  const { user, role, distributor } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(searchParams.get('q') || '');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('cat') || 'all');
  const [showCalculator, setShowCalculator] = useState(false);

  const categories = [
    { id: 'all', name: 'All Equipment' },
    { id: 'inverters', name: 'Solar Inverters' },
    { id: 'panels', name: 'Photovoltaic Panels' },
    { id: 'structures', name: 'Mounting Structures' },
    { id: 'dcdb', name: 'DCDB & ACDB Boxes' },
    { id: 'cables', name: 'DC Cables & Connectors' },
  ];

  useEffect(() => {
    async function fetchProducts() {
      try {
        setLoading(true);
        const queryParams = new URLSearchParams();
        if (search) queryParams.set('search', search);
        if (selectedCategory !== 'all') queryParams.set('category', selectedCategory);

        const res = await api.get(`/public/products?${queryParams.toString()}`);
        if (res.data?.products) {
          setProducts(res.data.products);
        }
      } catch (err) {
        console.error('Error fetching catalogue:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchProducts();
  }, [search, selectedCategory]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10 bg-[#FFFFFF]">
      
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <span className="text-xs font-bold text-[#1F8F4E] uppercase tracking-widest bg-[#ECF8F1] px-3 py-1 rounded-full border border-[#DDE8E1]">
          Authorized Commercial Inventory
        </span>
        <h1 className="font-heading font-black text-4xl sm:text-5xl text-[#17211B] tracking-tight">
          Solar Equipment & BOS Catalogue
        </h1>
        <p className="text-sm sm:text-base text-[#5F6F65]">
          Factory-gate wholesale pricing for certified Tier-1 inverters, TOPCon modules, cyclone-rated structures, and balance-of-system electrical components.
        </p>
      </div>

      {/* Authenticated Distributor / Dealer Smart Banner */}
      {role === 'distributor' && (
        <div className="bg-[#ECF8F1] border border-[#1F8F4E]/30 rounded-2xl p-5 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4 animate-in fade-in">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-[#1F8F4E] text-white flex items-center justify-center font-bold shrink-0 shadow-xs">
              <FiSliders size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-[#1F8F4E] text-white">
                  DISTRIBUTOR WHOLESALE SESSION
                </span>
                <span className="text-xs font-bold text-[#17211B]">
                  {distributor?.business_name || user?.business_name || 'Demo Distributor'}
                </span>
              </div>
              <p className="text-xs text-[#5F6F65] mt-0.5">
                You have full access to wholesale factory buy rates and sub-dealer margin management in your distributor portal.
              </p>
            </div>
          </div>

          <Link
            to="/distributor/portal/procure"
            className="px-5 py-2.5 rounded-xl text-xs font-bold bg-[#1F8F4E] hover:bg-[#18733E] text-white shadow-xs flex items-center gap-2 whitespace-nowrap transition-all"
          >
            Open Procure & Dealer Pricing Console <FiArrowRight />
          </Link>
        </div>
      )}

      {/* Search & Filter Bar */}
      <div className="bg-[#FFFFFF] rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row items-center justify-between gap-4 border border-[#DDE8E1] shadow-xs">
        
        {/* Search input */}
        <div className="relative w-full md:w-80">
          <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#5F6F65] w-4 h-4" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by SKU, model, or brand..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#F7FAF8] border border-[#DDE8E1] text-sm text-[#17211B] placeholder-[#5F6F65] focus:outline-none focus:border-[#1F8F4E] focus:bg-[#FFFFFF] transition-colors"
          />
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                selectedCategory === cat.id
                  ? 'bg-[#1F8F4E] text-white shadow-xs font-bold'
                  : 'bg-[#F7FAF8] text-[#5F6F65] hover:text-[#17211B] hover:bg-[#ECF8F1] border border-[#DDE8E1]'
              }`}
            >
              {cat.name}
            </button>
          ))}

          <button
            onClick={() => setShowCalculator(true)}
            className="px-3.5 py-2 rounded-xl text-xs font-bold bg-[#ECF8F1] hover:bg-[#DDE8E1]/60 text-[#1F8F4E] border border-[#DDE8E1] whitespace-nowrap flex items-center gap-1.5 ml-2 shadow-xs"
          >
            <FiSliders className="w-3.5 h-3.5" /> Margin Estimator
          </button>
        </div>
      </div>

      <PricingCalculatorModal
        isOpen={showCalculator}
        onClose={() => setShowCalculator(false)}
      />

      {/* Products Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div key={n} className="bg-[#FFFFFF] border border-[#DDE8E1] h-96 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-20 bg-[#F7FAF8] border border-[#DDE8E1] rounded-3xl space-y-4 shadow-xs">
          <FiBox className="w-12 h-12 text-[#5F6F65] mx-auto" />
          <h3 className="font-heading font-bold text-lg text-[#17211B]">No Equipment Found</h3>
          <p className="text-xs text-[#5F6F65]">Try adjusting your search criteria or category filter.</p>
          <button
            onClick={() => { setSearch(''); setSelectedCategory('all'); }}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-[#1F8F4E] text-white hover:bg-[#18733E]"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((item) => {
            const rawMrp = item.mrp || 9999;
            const distBuyRate = Math.round(rawMrp * 0.85);
            const dealerRate = Math.round(rawMrp * 0.88);

            return (
              <div
                key={item._id || item.id}
                className="bg-[#FFFFFF] border border-[#DDE8E1] rounded-2xl overflow-hidden flex flex-col justify-between group hover:border-[#1F8F4E]/40 hover:shadow-md transition-all duration-200 shadow-xs"
              >
                <div>
                  <div className="h-52 w-full bg-[#F7FAF8] relative overflow-hidden border-b border-[#DDE8E1]">
                    <img
                      src={item.image_url || 'https://images.unsplash.com/photo-1509391365360-2e959784a276?auto=format&fit=crop&w=800&q=80'}
                      alt={item.name}
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = 'https://images.unsplash.com/photo-1509391365360-2e959784a276?auto=format&fit=crop&w=800&q=80';
                      }}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    {item.badge && (
                      <span className="absolute top-3 left-3 px-2.5 py-1 rounded-md text-[11px] font-bold bg-[#F5B700] text-[#17211B] shadow-xs">
                        {item.badge}
                      </span>
                    )}
                    <span className="absolute top-3 right-3 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-[#FFFFFF]/95 text-[#5F6F65] border border-[#DDE8E1] shadow-xs">
                      MOQ: {item.moq || 1} Units
                    </span>
                  </div>

                  <div className="p-6 space-y-3">
                    <div className="flex items-center justify-between text-xs text-[#5F6F65]">
                      <span className="font-semibold text-[#1F8F4E]">{item.brand || 'SolarKits Pro'}</span>
                      <span className="font-mono text-[11px]">SKU: {item.sku}</span>
                    </div>

                    <h3 className="font-heading font-bold text-lg text-[#17211B] group-hover:text-[#1F8F4E] transition-colors line-clamp-2">
                      {item.name}
                    </h3>

                    <p className="text-xs text-[#5F6F65] line-clamp-2 leading-relaxed">
                      {item.description}
                    </p>

                    {item.specs && (
                      <div className="pt-2 grid grid-cols-2 gap-2 text-[11px] text-[#5F6F65] border-t border-[#DDE8E1]">
                        {Object.entries(item.specs).slice(0, 2).map(([k, v]) => (
                          <div key={k} className="truncate">
                            <span className="text-[#5F6F65]">{k}: </span>
                            <span className="font-semibold text-[#17211B]">{v}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="p-6 pt-0 space-y-3">
                  {role === 'distributor' ? (
                    <div className="p-3.5 rounded-xl bg-[#ECF8F1] border border-[#DDE8E1] flex items-center justify-between">
                      <div>
                        <span className="text-[10px] text-[#5F6F65] line-through block">
                          MRP: ₹{rawMrp.toLocaleString('en-IN')}
                        </span>
                        <span className="text-base font-black text-[#1F8F4E] font-heading">
                          ₹{distBuyRate.toLocaleString('en-IN')}
                        </span>
                        <span className="text-[9px] text-[#5F6F65] font-semibold block">Factory Wholesale Buy Rate</span>
                      </div>
                      <Link
                        to="/distributor/portal/procure"
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-white bg-[#1F8F4E] hover:bg-[#18733E] px-3 py-1.5 rounded-lg transition-colors shadow-xs"
                      >
                        <FiSliders className="w-3.5 h-3.5" /> Manage Margin
                      </Link>
                    </div>
                  ) : role === 'dealer' ? (
                    <div className="p-3.5 rounded-xl bg-[#F7FAF8] border border-[#DDE8E1] flex items-center justify-between">
                      <div>
                        <span className="text-[10px] text-[#5F6F65] line-through block">
                          MRP: ₹{rawMrp.toLocaleString('en-IN')}
                        </span>
                        <span className="text-base font-black text-blue-700 font-heading">
                          ₹{dealerRate.toLocaleString('en-IN')}
                        </span>
                        <span className="text-[9px] text-[#5F6F65] font-semibold block">Dealer Wholesale Rate</span>
                      </div>
                      <Link
                        to="/dealer/portal/catalogue"
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 px-3 py-1.5 rounded-lg transition-colors shadow-xs"
                      >
                        <FiShoppingBag className="w-3.5 h-3.5" /> Order Stock
                      </Link>
                    </div>
                  ) : (
                    <div className="p-3.5 rounded-xl bg-[#F7FAF8] border border-[#DDE8E1] flex items-center justify-between">
                      <div>
                        <span className="text-[10px] text-[#5F6F65] uppercase tracking-wider block">Standard MRP</span>
                        <span className="text-sm font-bold text-[#17211B]">
                          ₹{rawMrp.toLocaleString('en-IN')}
                        </span>
                      </div>
                      <Link
                        to="/auth/login"
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-[#1F8F4E] bg-[#ECF8F1] hover:bg-[#DDE8E1]/70 px-3 py-1.5 rounded-lg border border-[#DDE8E1] transition-colors"
                      >
                        <FiLock className="w-3.5 h-3.5 text-[#F5B700]" /> Unlock Rate
                      </Link>
                    </div>
                  )}

                  <Link
                    to={`/products/${item._id || item.id}`}
                    className="w-full py-2.5 rounded-xl text-center text-xs font-bold bg-[#FFFFFF] hover:bg-[#ECF8F1] text-[#1F8F4E] border border-[#DDE8E1] flex items-center justify-center gap-1.5 transition-colors shadow-xs"
                  >
                    View Full Specifications <FiExternalLink className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Bottom info banner */}
      <div className="bg-[#ECF8F1] rounded-2xl p-6 border border-[#DDE8E1] shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <FiShield className="w-8 h-8 text-[#1F8F4E] shrink-0" />
          <div>
            <h4 className="font-heading font-bold text-sm text-[#17211B]">Need Container Load / Custom EPC Project Procurement?</h4>
            <p className="text-xs text-[#5F6F65]">Our commercial engineering desk provides custom project BOM sizing, flash reports, and special project rate slabs.</p>
          </div>
        </div>
        <Link
          to="/contact"
          className="px-5 py-2.5 rounded-xl text-xs font-bold bg-[#1F8F4E] text-white hover:bg-[#18733E] whitespace-nowrap shadow-xs transition-all"
        >
          Contact Commercial Desk
        </Link>
      </div>

    </div>
  );
}
