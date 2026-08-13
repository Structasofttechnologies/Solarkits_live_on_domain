import { useState, useEffect, useCallback } from "react";
import {
  FiTag,
  FiSearch,
  FiFilter,
  FiRefreshCw,
  FiCheckCircle,
  FiAlertTriangle,
  FiShoppingCart,
  FiDollarSign,
  FiGlobe,
  FiLayers,
  FiBox,
  FiPackage,
  FiCheck,
  FiEye,
  FiPauseCircle,
  FiPlay,
  FiInfo,
  FiSliders,
  FiShield,
} from "react-icons/fi";
import api from "../services/api";

export default function StorefrontListings() {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  // Filters & Search State
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [industryFilter, setIndustryFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [subcategoryFilter, setSubcategoryFilter] = useState("");
  const [brandFilter, setBrandFilter] = useState("");
  const [stockFilter, setStockFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");

  // Margin Editing local state per listing ID
  const [margins, setMargins] = useState({});

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {};
      if (search.trim()) params.search = search.trim();
      if (statusFilter !== "all") params.assignment_status = statusFilter;
      if (industryFilter) params.industry_type_id = industryFilter;
      if (categoryFilter) params.category_id = categoryFilter;
      if (subcategoryFilter) params.subcategory_id = subcategoryFilter;
      if (brandFilter) params.brand_id = brandFilter;
      if (stockFilter !== "all") params.stock_status = stockFilter;
      if (sortBy) params.sort = sortBy;

      const res = await api.get("/india/v1/reseller/listings", { params });

      if (res.data?.status === "success") {
        const data = res.data.data || [];
        setListings(data);

        // Pre-fill margin state from fetched data
        const initialMargins = {};
        data.forEach((item) => {
          initialMargins[item._id] = (item.reseller_margin_paise / 100).toString();
        });
        setMargins(initialMargins);
      }
    } catch (err) {
      console.error("Listings fetch error:", err);
      setError("Failed to load reseller storefront product catalogue.");
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, industryFilter, categoryFilter, subcategoryFilter, brandFilter, stockFilter, sortBy]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Handle Purchase / Accept Action
  const handlePurchase = async (listingId) => {
    setActionLoadingId(listingId);
    setMessage(null);
    setError(null);
    try {
      const res = await api.post(`/india/v1/reseller/listings/${listingId}/purchase`);
      if (res.data?.status === "success") {
        setMessage(res.data.message || "Product purchased/accepted successfully!");
        fetchData();
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to purchase product");
    } finally {
      setActionLoadingId(null);
    }
  };

  // Handle Margin Save Action
  const handleSaveMargin = async (listingId) => {
    setActionLoadingId(listingId);
    setMessage(null);
    setError(null);
    try {
      const marginVal = parseFloat(margins[listingId]);
      if (isNaN(marginVal) || marginVal < 0) {
        throw new Error("Please enter a valid non-negative profit margin amount");
      }

      const res = await api.post(`/india/v1/reseller/listings/${listingId}/margin`, {
        reseller_margin_inr: marginVal,
      });

      if (res.data?.status === "success") {
        setMessage("Profit margin saved and final EPC selling price calculated!");
        fetchData();
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Failed to update profit margin");
    } finally {
      setActionLoadingId(null);
    }
  };

  // Handle Publish Action
  const handlePublish = async (listingId) => {
    setActionLoadingId(listingId);
    setMessage(null);
    setError(null);
    try {
      const res = await api.post(`/india/v1/reseller/listings/${listingId}/publish`);
      if (res.data?.status === "success") {
        setMessage("Product published! It is now live in your storefront and visible to your onboarded EPC companies.");
        fetchData();
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to publish product");
    } finally {
      setActionLoadingId(null);
    }
  };

  // Handle Unpublish Action
  const handleUnpublish = async (listingId) => {
    setActionLoadingId(listingId);
    setMessage(null);
    setError(null);
    try {
      const res = await api.post(`/india/v1/reseller/listings/${listingId}/unpublish`);
      if (res.data?.status === "success") {
        setMessage("Product unpublished from storefront and EPC catalogue.");
        fetchData();
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to unpublish product");
    } finally {
      setActionLoadingId(null);
    }
  };

  // Statistics Calculation
  const totalAssigned = listings.filter((l) => l.assignment_status === "assigned").length;
  const totalPurchased = listings.filter((l) => ["purchased", "accepted"].includes(l.assignment_status)).length;
  const totalReady = listings.filter((l) => l.assignment_status === "ready_to_publish").length;
  const totalPublished = listings.filter((l) => l.assignment_status === "published").length;

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-blue-950 p-6 md:p-8 rounded-3xl text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300 text-xs font-bold uppercase tracking-wider mb-2">
              <FiShield /> Reseller Product Storefront Engine
            </div>
            <h1 className="text-3xl font-black text-white tracking-tight">
              Product Catalogue & EPC Storefront
            </h1>
            <p className="text-slate-300 text-sm mt-1.5 max-w-2xl font-medium">
              Manage product acceptance, configure authorized profit margins within Super Admin limits, and publish products to your channel storefront and onboarded EPC buyers.
            </p>
          </div>

          <button
            onClick={fetchData}
            className="self-start md:self-auto px-5 py-3 rounded-2xl bg-white/10 hover:bg-white/20 backdrop-blur-md text-white font-bold text-xs flex items-center gap-2 transition-all cursor-pointer border border-white/15 shadow-sm"
          >
            <FiRefreshCw className={loading ? "animate-spin" : ""} size={16} /> Refresh Storefront
          </button>
        </div>

        {/* Metrics Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8 pt-6 border-t border-white/10">
          <div className="bg-white/5 backdrop-blur-sm p-4 rounded-2xl border border-white/10">
            <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Assigned to You</span>
            <div className="text-2xl font-black text-amber-400 mt-1">{totalAssigned}</div>
          </div>
          <div className="bg-white/5 backdrop-blur-sm p-4 rounded-2xl border border-white/10">
            <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Purchased / Accepted</span>
            <div className="text-2xl font-black text-blue-400 mt-1">{totalPurchased}</div>
          </div>
          <div className="bg-white/5 backdrop-blur-sm p-4 rounded-2xl border border-white/10">
            <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Ready to Publish</span>
            <div className="text-2xl font-black text-indigo-400 mt-1">{totalReady}</div>
          </div>
          <div className="bg-white/5 backdrop-blur-sm p-4 rounded-2xl border border-white/10">
            <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Published & Live</span>
            <div className="text-2xl font-black text-emerald-400 mt-1">{totalPublished}</div>
          </div>
        </div>
      </div>

      {/* Notifications */}
      {message && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 text-emerald-700 border border-emerald-500/20 text-sm font-semibold flex items-center gap-2.5 shadow-xs">
          <FiCheckCircle size={20} className="shrink-0 text-emerald-600" /> {message}
        </div>
      )}

      {error && (
        <div className="p-4 rounded-2xl bg-red-500/10 text-red-700 border border-red-500/20 text-sm font-semibold flex items-center gap-2.5 shadow-xs">
          <FiAlertTriangle size={20} className="shrink-0 text-red-600" /> {error}
        </div>
      )}

      {/* Filter & Search Toolbar */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center justify-between">
          {/* Keyword Search Input */}
          <div className="relative flex-1">
            <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Search products by title, SKU, specs, or brand..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-11 pr-4 py-3 rounded-2xl border border-slate-200 bg-slate-50 text-slate-900 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            />
          </div>

          {/* Status Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 p-1.5 bg-slate-100 rounded-2xl border border-slate-200/80">
            {[
              { id: "all", label: "All Items" },
              { id: "assigned", label: "Assigned" },
              { id: "purchased", label: "Purchased" },
              { id: "ready_to_publish", label: "Ready" },
              { id: "published", label: "Published" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  statusFilter === tab.id
                    ? "bg-white text-blue-600 shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Sorting */}
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider shrink-0">Sort By:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 text-xs font-bold focus:ring-2 focus:ring-blue-500"
            >
              <option value="newest">Newest First</option>
              <option value="price_asc">Selling Price: Low to High</option>
              <option value="price_desc">Selling Price: High to Low</option>
              <option value="title_asc">Title: A to Z</option>
            </select>
          </div>
        </div>
      </div>

      {/* Product List Grid */}
      {loading ? (
        <div className="bg-white p-16 rounded-3xl border border-slate-200 text-center space-y-3 shadow-xs">
          <FiRefreshCw className="animate-spin text-blue-600 mx-auto" size={32} />
          <p className="text-slate-600 font-bold text-sm">Loading reseller product catalogue...</p>
        </div>
      ) : listings.length === 0 ? (
        <div className="bg-white p-16 rounded-3xl border border-slate-200 text-center space-y-4 shadow-xs">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-400">
            <FiBox size={32} />
          </div>
          <div>
            <h3 className="text-lg font-black text-slate-900">No Storefront Listings Found</h3>
            <p className="text-slate-500 text-sm mt-1 max-w-md mx-auto">
              No products match your filter criteria or have been assigned to your reseller account by the Super Admin yet.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {listings.map((item) => {
            const p = item.product_id;
            const costInr = (item.cost_price_paise / 100).toFixed(2);
            const minMarginInr = (item.min_margin_paise / 100).toFixed(2);
            const maxMarginInr = (item.max_margin_paise / 100).toFixed(2);
            const currentMarginInput = margins[item._id] !== undefined ? margins[item._id] : (item.reseller_margin_paise / 100).toString();
            const currentMarginNum = parseFloat(currentMarginInput) || 0;
            const taxRate = item.tax_rate_pct || 18;

            const subtotalWithMargin = item.cost_price_paise / 100 + currentMarginNum;
            const estimatedTax = (subtotalWithMargin * taxRate) / 100;
            const estimatedFinalPrice = subtotalWithMargin + estimatedTax;

            const statusColors = {
              assigned: "bg-amber-100 text-amber-900 border-amber-300",
              accepted: "bg-blue-100 text-blue-900 border-blue-300",
              purchased: "bg-blue-100 text-blue-900 border-blue-300",
              margin_pending: "bg-purple-100 text-purple-900 border-purple-300",
              ready_to_publish: "bg-indigo-100 text-indigo-900 border-indigo-300",
              published: "bg-emerald-100 text-emerald-900 border-emerald-300",
              suspended: "bg-slate-100 text-slate-700 border-slate-300",
              revoked: "bg-red-100 text-red-900 border-red-300",
            };

            const statusLabels = {
              assigned: "Assigned by Admin",
              accepted: "Purchased / Accepted",
              purchased: "Purchased / Accepted",
              margin_pending: "Margin Pending",
              ready_to_publish: "Ready to Publish",
              published: "Published & Visible to EPC",
              suspended: "Suspended / Unpublished",
              revoked: "Assignment Revoked",
            };

            return (
              <div
                key={item._id}
                className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-md transition-all p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center"
              >
                {/* Product Image & Badges Column */}
                <div className="lg:col-span-3 flex flex-col items-center">
                  <div className="w-full h-44 bg-slate-50 rounded-2xl overflow-hidden border border-slate-100 flex items-center justify-center p-3 relative">
                    <img
                      src={item.image_url || p?.image || "/placeholder-solar.jpg"}
                      alt={item.title || p?.name}
                      className="max-h-full max-w-full object-contain"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = "https://images.unsplash.com/photo-1509391365360-2e959784a276?w=500&auto=format&fit=crop&q=60";
                      }}
                    />
                    <span className={`absolute top-2.5 left-2.5 px-2.5 py-1 rounded-full text-[11px] font-black border ${statusColors[item.assignment_status] || "bg-slate-100 text-slate-800"}`}>
                      {statusLabels[item.assignment_status] || item.assignment_status}
                    </span>
                  </div>

                  {/* Stock Badge */}
                  <div className="mt-3 flex items-center gap-2">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold ${item.stock_quantity > 0 ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800"}`}>
                      <FiBox size={12} /> {item.stock_quantity > 0 ? `In Stock (${item.stock_quantity} units)` : "Out of Stock"}
                    </span>
                  </div>
                </div>

                {/* Product Details & Specs Column */}
                <div className="lg:col-span-5 space-y-3">
                  <div>
                    <h2 className="text-lg font-black text-slate-900 leading-snug">
                      {item.title || p?.name || "Solar Component"}
                    </h2>
                    <p className="text-xs font-mono text-slate-400 font-semibold mt-0.5">
                      SKU: {p?.sku_code || "SKU-PROD"}
                    </p>
                  </div>

                  {/* Category & Industry Tags */}
                  <div className="flex flex-wrap gap-1.5">
                    {item.industry_type_id?.name && (
                      <span className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 text-xs font-bold border border-blue-200">
                        Industry: {item.industry_type_id.name}
                      </span>
                    )}
                    {item.category_id?.name && (
                      <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-xs font-bold border border-slate-200">
                        {item.category_id.name}
                      </span>
                    )}
                    {item.subcategory_id?.name && (
                      <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-xs font-bold border border-slate-200">
                        {item.subcategory_id.name}
                      </span>
                    )}
                    {item.brand_id?.name && (
                      <span className="px-2.5 py-1 rounded-lg bg-purple-50 text-purple-700 text-xs font-bold border border-purple-200">
                        Brand: {item.brand_id.name}
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-slate-600 font-medium line-clamp-2">
                    {item.description || p?.description || "High efficiency solar equipment configured for wholesale reseller distribution."}
                  </p>
                </div>

                {/* Pricing & Actions Column */}
                <div className="lg:col-span-4 bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-4">
                  {/* Authorized Reseller Purchase Price */}
                  <div className="flex justify-between items-center text-xs pb-2 border-b border-slate-200/80">
                    <span className="text-slate-500 font-bold uppercase tracking-wider flex items-center gap-1">
                      <FiTag className="text-slate-400" /> Reseller Cost Price:
                    </span>
                    <span className="font-extrabold text-slate-900 font-mono text-sm">
                      ₹{costInr}
                    </span>
                  </div>

                  {/* Profit Margin Input Control */}
                  <div>
                    <div className="flex justify-between items-center text-xs mb-1.5">
                      <label className="font-bold text-slate-700 uppercase tracking-wider">
                        Your Profit Margin (INR)
                      </label>
                      <span className="text-[11px] text-slate-400 font-medium">
                        Allowed: ₹{minMarginInr} – ₹{maxMarginInr}
                      </span>
                    </div>

                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-extrabold text-xs">₹</span>
                      <input
                        type="number"
                        step="1"
                        min={item.min_margin_paise / 100}
                        max={item.max_margin_paise / 100}
                        value={currentMarginInput}
                        onChange={(e) => setMargins({ ...margins, [item._id]: e.target.value })}
                        disabled={item.assignment_status === "assigned" || actionLoadingId === item._id}
                        className="w-full pl-7 pr-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-900 text-xs font-extrabold focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                      />
                    </div>
                  </div>

                  {/* Calculated Final EPC Selling Price */}
                  <div className="p-3 rounded-xl bg-blue-600/5 border border-blue-600/15 flex justify-between items-center">
                    <div>
                      <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Final EPC Selling Price</span>
                      <span className="text-[10px] text-slate-400 font-medium">Includes Tax ({taxRate}%)</span>
                    </div>
                    <div className="text-right">
                      <span className="text-lg font-black text-blue-600 font-mono">
                        ₹{estimatedFinalPrice.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>

                  {/* Contextual Action Buttons based on Lifecycle Status */}
                  <div className="pt-1">
                    {item.assignment_status === "assigned" ? (
                      <button
                        onClick={() => handlePurchase(item._id)}
                        disabled={actionLoadingId === item._id}
                        className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-xs rounded-xl shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                      >
                        {actionLoadingId === item._id ? <FiRefreshCw className="animate-spin" /> : <FiShoppingCart />}
                        Accept & Purchase Product
                      </button>
                    ) : item.assignment_status === "published" ? (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleSaveMargin(item._id)}
                          disabled={actionLoadingId === item._id}
                          className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-xl transition-all flex items-center justify-center gap-1 cursor-pointer disabled:opacity-50"
                        >
                          {actionLoadingId === item._id ? <FiRefreshCw className="animate-spin" /> : <FiCheck />}
                          Update Margin
                        </button>
                        <button
                          onClick={() => handleUnpublish(item._id)}
                          disabled={actionLoadingId === item._id}
                          className="py-2 px-3 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-1 cursor-pointer disabled:opacity-50"
                          title="Unpublish from storefront"
                        >
                          <FiPauseCircle size={14} /> Unpublish
                        </button>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleSaveMargin(item._id)}
                          disabled={actionLoadingId === item._id}
                          className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-900 text-white font-extrabold text-xs rounded-xl transition-all flex items-center justify-center gap-1 cursor-pointer disabled:opacity-50"
                        >
                          {actionLoadingId === item._id ? <FiRefreshCw className="animate-spin" /> : <FiCheck />}
                          Save Margin
                        </button>
                        <button
                          onClick={() => handlePublish(item._id)}
                          disabled={actionLoadingId === item._id}
                          className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-sm transition-all flex items-center justify-center gap-1 cursor-pointer disabled:opacity-50"
                        >
                          {actionLoadingId === item._id ? <FiRefreshCw className="animate-spin" /> : <FiPlay />}
                          Publish to EPC
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
