import React, { useState, useEffect } from 'react';
import { FiPackage, FiShoppingCart, FiSearch, FiCheck, FiShield, FiTag } from 'react-icons/fi';
import api from '../../services/api';

export default function DealerCataloguePage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [addedItem, setAddedItem] = useState(null);

  useEffect(() => {
    api
      .get('/dealer/catalogue')
      .then((res) => {
        if (res.data?.success) setProducts(res.data.products || []);
      })
      .catch((err) => console.error('Error fetching dealer catalogue:', err))
      .finally(() => setLoading(false));
  }, []);

  const handleAddToCart = (item) => {
    setAddedItem(item.name);
    setTimeout(() => setAddedItem(null), 2500);
  };

  const filtered = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.sku.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-heading font-black text-2xl sm:text-3xl text-[#17211B]">
            Dealer Wholesale Equipment Catalogue
          </h1>
          <p className="text-xs sm:text-sm text-[#5F6F65] mt-0.5">
            Direct distributor pricing applied. Minimum Order Quantity (MOQ) and input tax credits verified.
          </p>
        </div>

        {addedItem && (
          <div className="p-3 rounded-xl bg-[#ECF8F1] border border-[#DDE8E1] text-[#1F8F4E] text-xs font-bold flex items-center gap-1.5 animate-bounce">
            <FiCheck /> Added to wholesale cart: {addedItem}
          </div>
        )}
      </div>

      {/* Search Filter */}
      <div className="p-4 rounded-2xl bg-[#FFFFFF] border border-[#DDE8E1] shadow-xs flex items-center justify-between">
        <div className="relative w-full max-w-md">
          <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#5F6F65] w-4 h-4" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search solar modules, inverters, structures..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-[#F7FAF8] border border-[#DDE8E1] text-xs text-[#17211B] placeholder-[#5F6F65] focus:border-[#1F8F4E] focus:outline-none"
          />
        </div>
        <span className="text-xs text-[#5F6F65] font-semibold hidden sm:inline">
          {filtered.length} Equipment SKUs Available
        </span>
      </div>

      {/* Product Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-3 p-12 text-center text-[#5F6F65]">Loading wholesale catalogue...</div>
        ) : filtered.length === 0 ? (
          <div className="col-span-3 p-12 text-center text-[#5F6F65]">No equipment items found matching your search.</div>
        ) : (
          filtered.map((item) => (
            <div
              key={item.id}
              className="p-6 rounded-3xl bg-[#FFFFFF] border border-[#DDE8E1] shadow-xs space-y-4 flex flex-col justify-between hover:shadow-md transition-all"
            >
              <div className="space-y-3">
                <div className="h-44 rounded-2xl bg-[#F7FAF8] overflow-hidden relative border border-[#DDE8E1]">
                  <img
                    src={item.image_url}
                    alt={item.name}
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = 'https://images.unsplash.com/photo-1509391365360-2e959784a276?auto=format&fit=crop&w=800&q=80';
                    }}
                    className="w-full h-full object-cover opacity-90 hover:opacity-100 transition-opacity"
                  />
                  <span className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#ECF8F1] text-[#1F8F4E] border border-[#DDE8E1] shadow-xs">
                    MOQ: {item.moq} Unit
                  </span>
                </div>

                <div>
                  <span className="text-[10px] font-mono text-[#5F6F65] uppercase">{item.sku}</span>
                  <h3 className="font-heading font-bold text-base text-[#17211B] mt-0.5">{item.name}</h3>
                </div>

                <div className="p-3 rounded-2xl bg-[#F7FAF8] border border-[#DDE8E1] flex items-baseline justify-between">
                  <div>
                    <span className="text-[10px] text-[#5F6F65] block">Retail MRP</span>
                    <span className="text-xs text-[#5F6F65] line-through">₹{item.mrp_inr.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-[#1F8F4E] font-bold block">Wholesale Rate (-{item.dealer_discount_percent}%)</span>
                    <span className="font-heading font-black text-xl text-[#1F8F4E]">
                      ₹{item.dealer_wholesale_inr.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => handleAddToCart(item)}
                className="w-full py-3 rounded-xl text-xs font-bold bg-[#1F8F4E] text-white hover:bg-[#18733E] shadow-xs flex items-center justify-center gap-2 transition-colors"
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
