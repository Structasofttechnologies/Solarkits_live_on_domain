import { useState, useEffect, useCallback } from "react";
import {
  FiTag,
  FiSearch,
  FiRefreshCw,
  FiCheckCircle,
  FiAlertTriangle,
  FiDollarSign,
  FiLayers,
  FiBox,
  FiPackage,
  FiShield,
  FiZap,
  FiInfo,
} from "react-icons/fi";
import defaultKitImage from "../assets/images/product_solar_kit.jpg";
import api from "../services/api";

const BACKEND_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/api\/?$/, '');

function resolveKitImage(rawUrl) {
  if (!rawUrl || typeof rawUrl !== 'string' || !rawUrl.trim()) return defaultKitImage;
  const clean = rawUrl.trim();
  if (clean.startsWith('http://') || clean.startsWith('https://')) {
    return clean.replace('localhost:3001', 'localhost:5000');
  }
  if (clean.startsWith('/')) {
    return `${BACKEND_BASE}${clean}`;
  }
  return `${BACKEND_BASE}/${clean}`;
}

export default function StorefrontListings() {
  const [listings, setListings] = useState([]);
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters & Search State
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [itemTypeFilter, setItemTypeFilter] = useState("all"); // "all" | "kit" | "product"
  const [stockFilter, setStockFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch plan subscription & listings in parallel
      const [listingsRes, planRes] = await Promise.all([
        api.get("/india/v1/reseller/listings", {
          params: {
            search: search.trim() || undefined,
            category_id: categoryFilter || undefined,
            stock_status: stockFilter !== "all" ? stockFilter : undefined,
            sort: sortBy || undefined,
          },
        }),
        api.get("/india/v1/reseller/plans/my-subscription").catch(() => ({ data: null })),
      ]);

      if (listingsRes.data?.status === "success") {
        setListings(listingsRes.data.data || []);
      }
      if (planRes.data?.status === "success" && planRes.data.data) {
        setPlan(planRes.data.data.plan || planRes.data.data);
      }
    } catch (err) {
      console.error("Listings fetch error:", err);
      setError("Failed to load franchisee allocated product catalogue.");
    } finally {
      setLoading(false);
    }
  }, [search, categoryFilter, stockFilter, sortBy]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Derived commission and margin rates directly from franchise plan
  const commissionMethod = plan?.commission_method || "PERCENTAGE";
  const commissionRatePct = plan?.default_commission_rate ?? plan?.default_dealer_margin ?? 8;
  const fixedAmountPerKit = (plan?.fixed_amount_per_kit_paise && plan.fixed_amount_per_kit_paise > 0)
    ? (plan.fixed_amount_per_kit_paise / 100)
    : 0;
  const isFixedPerKit = commissionMethod === "FIXED_PER_KIT" && fixedAmountPerKit > 0;
  const commissionLabel = isFixedPerKit ? `₹${fixedAmountPerKit.toLocaleString('en-IN')} / kit` : `${commissionRatePct}%`;

  // Filter listings by kit/product type
  const filteredListings = listings.filter((item) => {
    const isKit = item.item_type === "kit" || Boolean(item.kit_id);
    if (itemTypeFilter === "kit") return isKit;
    if (itemTypeFilter === "product") return !isKit;
    return true;
  });

  const totalKits = listings.filter((l) => l.item_type === "kit" || Boolean(l.kit_id)).length;
  const totalProducts = listings.filter((l) => l.item_type !== "kit" && !l.kit_id).length;
  const inStockCount = listings.filter((l) => (l.stock_quantity || 0) > 0).length;

  return (
    <div className="space-y-6 pb-12 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-widest bg-blue-50 text-blue-700 px-3 py-1 rounded-full border border-blue-200">
              Franchisee Product Allocation
            </span>
            {plan && (
              <span className="text-xs font-extrabold bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full border border-emerald-200 flex items-center gap-1">
                <FiShield size={12} /> {plan.name} ({commissionLabel} Fixed Commission)
              </span>
            )}
          </div>
          <h1 className="font-heading font-black text-2xl sm:text-3xl mt-2 text-slate-900">
            My Product Listings &amp; Allocated Kits
          </h1>
          <p className="text-sm mt-1 text-slate-600">
            Products and combo kits allocated automatically according to your subscribed franchisee plan with fixed company commission rates.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Stat chips */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border border-blue-200 bg-blue-50 text-blue-700">
            <span className="text-base font-black">{listings.length}</span>
            <span className="font-medium opacity-80">Total Items</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border border-amber-200 bg-amber-50 text-amber-700">
            <span className="text-base font-black">{totalKits}</span>
            <span className="font-medium opacity-80">Combo Kits</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border border-emerald-200 bg-emerald-50 text-emerald-700">
            <span className="text-base font-black">{inStockCount}</span>
            <span className="font-medium opacity-80">In Stock</span>
          </div>

          <button
            onClick={fetchData}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition-all cursor-pointer shadow-xs"
          >
            <FiRefreshCw className={loading ? "animate-spin text-blue-600" : ""} size={14} />
            Refresh
          </button>
        </div>
      </div>

      {/* Plan Allocation & Margin Policy Card */}
      <div className="bg-gradient-to-r from-blue-900 to-indigo-900 rounded-3xl p-6 text-white shadow-md border border-blue-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-blue-500/20 text-blue-300">
                <FiZap size={16} />
              </span>
              <h3 className="text-xs font-black uppercase tracking-wider text-blue-200">
                Company Plan Margin Allocation Policy
              </h3>
            </div>
            <p className="text-xs text-blue-100 leading-relaxed">
              Product prices and commission rates are centrally configured by Company Management inside your <strong>{plan?.name || "Franchisee Partner Plan"}</strong>. 
              As a Franchisee Partner, you earn a <strong>guaranteed {commissionLabel} commission</strong> on every kit and component order fulfilled in your territory.
            </p>
          </div>

          <div className="shrink-0 bg-white/10 p-3.5 px-6 rounded-2xl border border-white/10 text-center">
            <div className="text-[10px] uppercase font-bold text-blue-200">Commission Rate</div>
            <div className="text-lg font-black text-emerald-400 mt-0.5">
              {commissionLabel}
            </div>
          </div>
        </div>
      </div>

      {/* Error notification */}
      {error && (
        <div className="p-4 rounded-2xl bg-red-50 text-red-700 border border-red-200 text-sm font-semibold flex items-center gap-2.5 shadow-xs">
          <FiAlertTriangle size={20} className="shrink-0 text-red-600" /> {error}
        </div>
      )}

      {/* Filter & Search Toolbar */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center justify-between">
          {/* Search */}
          <div className="relative flex-1">
            <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Search products by name, SKU, capacity kW, or brand..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-11 pr-4 py-3 rounded-2xl border border-slate-200 bg-slate-50 text-slate-900 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            />
          </div>

          {/* Item Type Tabs */}
          <div className="flex items-center gap-1.5 p-1.5 bg-slate-100 rounded-2xl border border-slate-200/80">
            {[
              { id: "all", label: `All Items (${listings.length})` },
              { id: "kit", label: `Combo Kits (${totalKits})` },
              { id: "product", label: `Components (${totalProducts})` },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setItemTypeFilter(tab.id)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  itemTypeFilter === tab.id
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
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider shrink-0">Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 text-xs font-bold focus:ring-2 focus:ring-blue-500"
            >
              <option value="newest">Newest First</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="title_asc">Name: A to Z</option>
            </select>
          </div>
        </div>
      </div>

      {/* Product List Grid */}
      {loading ? (
        <div className="bg-white p-16 rounded-3xl border border-slate-200 text-center space-y-3 shadow-xs">
          <FiRefreshCw className="animate-spin text-blue-600 mx-auto" size={32} />
          <p className="text-slate-600 font-bold text-sm">Loading allocated product catalogue...</p>
        </div>
      ) : filteredListings.length === 0 ? (
        <div className="bg-white p-16 rounded-3xl border border-slate-200 text-center space-y-4 shadow-xs">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-400">
            <FiBox size={32} />
          </div>
          <div>
            <h3 className="text-lg font-black text-slate-900">No Allocated Products Found</h3>
            <p className="text-slate-500 text-sm mt-1 max-w-md mx-auto">
              No products match your filter criteria or your subscribed plan does not have products allocated yet.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-5">
          {filteredListings.map((item) => {
            const isKit = item.item_type === "kit" || Boolean(item.kit_id);
            const p = item.product_id;
            const k = item.kit_id;

            // Product-specific commission rate from Franchise Settings, fallback to plan rate
            const itemCommissionPct = item.commission_percentage != null
              ? item.commission_percentage
              : (commissionRatePct != null ? commissionRatePct : 2);

            const isItemFixedPerKit = (item.commission_method === "FIXED_PER_KIT" && item.fixed_amount_per_kit_paise > 0)
              || isFixedPerKit;
            const itemFixedAmount = item.fixed_amount_per_kit_paise
              ? (item.fixed_amount_per_kit_paise / 100)
              : fixedAmountPerKit;

            const itemCommissionLabel = isItemFixedPerKit
              ? `₹${itemFixedAmount.toLocaleString('en-IN')} / kit`
              : `${itemCommissionPct}%`;

            // Cost price in INR
            const costInr = item.cost_price_paise
              ? item.cost_price_paise / 100
              : (p?.base_price || k?.base_price_cached || 1000);

            // Fixed Plan Dealer Margin in INR
            const marginInr = isItemFixedPerKit ? itemFixedAmount : ((costInr * itemCommissionPct) / 100);
            const subtotalWithMargin = costInr + marginInr;
            const taxRate = item.tax_rate_pct || 18;
            const taxAmount = (subtotalWithMargin * taxRate) / 100;
            const finalEpcPrice = subtotalWithMargin + taxAmount;

            const displayTitle = item.title || p?.name || k?.name || k?.kit_name || (isKit ? "Solar Combo Kit" : "Solar Component");
            const displaySku = p?.sku_code || k?.kit_code || (isKit ? "SKU-KIT" : "SKU-PROD");
            const rawImg = item.image_url || p?.image || p?.image_url || k?.kit_image || k?.image || k?.product_image || (typeof item.kit_id === 'object' ? item.kit_id?.kit_image : null);
            const displayImage = resolveKitImage(rawImg);
            const displayDesc = item.description || p?.description || k?.description || "Certified solar equipment configured under your authorized franchisee plan.";

            return (
              <div
                key={item._id}
                className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-md transition-all p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center"
              >
                {/* Image & Allocation Badges */}
                <div className="lg:col-span-3 flex flex-col items-center">
                  <div className="w-full h-44 bg-slate-50 rounded-2xl overflow-hidden border border-slate-100 flex items-center justify-center p-3 relative">
                    <img
                      src={displayImage}
                      alt={displayTitle}
                      className="max-h-full max-w-full object-contain transition-opacity duration-300"
                      loading="lazy"
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        if (e.currentTarget.src !== defaultKitImage) {
                          e.currentTarget.src = defaultKitImage;
                        }
                      }}
                    />
                    <span className="absolute top-2.5 left-2.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                      <FiCheckCircle size={10} /> Active in Plan
                    </span>
                  </div>

                  {/* Stock Badge */}
                  <div className="mt-3 flex items-center gap-2">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold ${
                      (item.stock_quantity || 0) > 0 ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-700"
                    }`}>
                      <FiBox size={12} /> {(item.stock_quantity || 0) > 0 ? `In Stock (${item.stock_quantity} units)` : "Available on Order"}
                    </span>
                  </div>
                </div>

                {/* Product/Kit Details */}
                <div className="lg:col-span-5 space-y-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      {isKit ? (
                        <span className="px-2.5 py-0.5 rounded-md bg-amber-100 text-amber-800 text-[10px] font-black uppercase tracking-wider">
                          Combo Kit
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-md bg-blue-100 text-blue-800 text-[10px] font-black uppercase tracking-wider">
                          Solar Component
                        </span>
                      )}
                      <span className="text-[10px] font-bold text-slate-400 font-mono">
                        SKU: {displaySku}
                      </span>
                    </div>
                    <h2 className="text-lg font-black text-slate-900 leading-snug">
                      {displayTitle}
                    </h2>
                  </div>

                  {/* Category & Industry Tags */}
                  <div className="flex flex-wrap gap-1.5">
                    {item.industry_type_id?.name && (
                      <span className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 text-xs font-bold border border-blue-200">
                        {item.industry_type_id.name}
                      </span>
                    )}
                    {item.category_id?.name && (
                      <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-xs font-bold border border-slate-200">
                        {item.category_id.name}
                      </span>
                    )}
                    {item.brand_id?.name && (
                      <span className="px-2.5 py-1 rounded-lg bg-purple-50 text-purple-700 text-xs font-bold border border-purple-200">
                        Brand: {item.brand_id.name}
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-slate-600 font-medium line-clamp-2">
                    {displayDesc}
                  </p>
                </div>

                {/* Pricing Breakdown (Read-Only Company Configured) */}
                <div className="lg:col-span-4 bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-200/80">
                    <span className="text-slate-500 font-bold uppercase tracking-wider flex items-center gap-1">
                      <FiTag className="text-slate-400" /> Franchisee Base Price:
                    </span>
                    <span className="font-extrabold text-slate-900 font-mono text-sm">
                      ₹{costInr.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>

                  {/* Fixed Margin/Commission from Plan */}
                  <div className="flex items-center justify-between text-xs py-1">
                    <span className="text-slate-600 font-bold flex items-center gap-1">
                      <FiShield className="text-emerald-600" /> Plan Commission ({itemCommissionLabel}):
                    </span>
                    <span className="font-extrabold text-emerald-600 font-mono text-sm">
                      +₹{marginInr.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>

                  {/* Final EPC Wholesale Selling Price */}
                  <div className="p-3.5 rounded-xl bg-blue-600/10 border border-blue-600/20 flex justify-between items-center">
                    <div>
                      <span className="text-[10px] font-black text-slate-600 uppercase tracking-wider block">Final EPC Selling Price</span>
                      <span className="text-[10px] text-slate-500 font-medium">Includes {taxRate}% GST</span>
                    </div>
                    <div className="text-right">
                      <span className="text-lg font-black text-blue-700 font-mono">
                        ₹{finalEpcPrice.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>

                  {/* Scope Confirmation Badge */}
                  <div className="pt-1 text-center">
                    <span className="text-[11px] font-bold text-slate-500 flex items-center justify-center gap-1">
                      <FiCheckCircle className="text-emerald-600" size={13} />
                      Allocated for EPC wholesale in your territory
                    </span>
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
