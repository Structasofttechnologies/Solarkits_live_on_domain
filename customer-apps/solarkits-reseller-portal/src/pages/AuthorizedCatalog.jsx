import { useState, useEffect } from "react";
import api from "../services/api";
import {
  FiPackage, FiCheckCircle, FiXCircle, FiLoader,
  FiGrid, FiLayers, FiBox, FiRefreshCw, FiInfo,
} from "react-icons/fi";

const SCOPE_ICONS = {
  all:         FiGrid,
  category:    FiLayers,
  subcategory: FiLayers,
  product:     FiPackage,
  kit:         FiBox,
};

const SCOPE_COLORS = {
  all:         { bg: "#e0e7ff", text: "#4338ca" },
  category:    { bg: "#dbeafe", text: "#1d4ed8" },
  subcategory: { bg: "#ede9fe", text: "#7c3aed" },
  product:     { bg: "#dcfce7", text: "#15803d" },
  kit:         { bg: "#fef3c7", text: "#d97706" },
};

export default function AuthorizedCatalog() {
  // Fetch from the product-authorizations reseller endpoint
  // which returns { scope_type, is_authorized, source, product, kit, category, subcategory, status }
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all"); // "all" | "kit" | "product" | "category"

  const fetchRules = () => {
    setLoading(true);
    // This endpoint returns the actual authorization rules with is_authorized, scope_type, source populated
    api.get("/india/v1/reseller/authorized-products")
      .then((res) => { if (res.data?.status === "success") setRules(res.data.data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchRules(); }, []);

  // Derive the display name from the rule/item
  const getDisplayName = (r) => {
    if (r.scope_type === "kit")         return r.kit_name || r.name || r.kit?.kit_name || r.kit?.name || "Combo Kit";
    if (r.scope_type === "product")     return r.name || r.product?.name || "Product";
    if (r.scope_type === "subcategory") return r.subcategory?.name || "Subcategory";
    if (r.scope_type === "category")    return r.category?.name || "Category";
    if (r.scope_type === "all")         return "All Catalog Items";
    return r.name || "Unknown";
  };

  const getScopeLabel = (scopeType) => ({
    all: "All Catalog", category: "Category", subcategory: "Subcategory",
    product: "Product", kit: "Combo Kit",
  }[scopeType] || scopeType);

  const filteredRules = filter === "all"
    ? rules
    : rules.filter((r) => r.scope_type === filter);

  const counts = {
    all:     rules.length,
    kit:     rules.filter((r) => r.scope_type === "kit").length,
    product: rules.filter((r) => r.scope_type === "product").length,
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2.5">
            <FiPackage className="text-blue-600" size={28} />
            Authorized Catalog &amp; Product Matrix
          </h1>
          <p className="text-sm font-medium text-slate-600 mt-1">
            Explore product categories and solar kits authorized for your partner account
          </p>
        </div>
        <button
          onClick={fetchRules}
          className="p-2.5 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 transition-colors self-start"
          title="Refresh"
        >
          <FiRefreshCw size={16} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      {/* ── Filter Tabs ────────────────────────────────────────────────── */}
      <div className="flex gap-2 flex-wrap">
        {[
          { key: "all",     label: `All (${counts.all})` },
          { key: "kit",     label: `Combo Kits (${counts.kit})` },
          { key: "product", label: `Products (${counts.product})` },
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold uppercase tracking-wider border transition-all ${
              filter === key
                ? "bg-blue-600 text-white border-blue-600 shadow-md"
                : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ── Summary Info ──────────────────────────────────────────────── */}
      {!loading && rules.length === 0 && (
        <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 flex items-center gap-3 text-blue-800 text-sm font-semibold">
          <FiInfo className="shrink-0" size={20} />
          No explicit authorization rules configured yet. All standard catalog items are available under your active plan.
        </div>
      )}

      {/* ── Authorization Matrix Table ─────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20 text-slate-500 font-bold gap-2">
            <FiLoader className="animate-spin text-blue-600" size={24} />
            Loading product authorization matrix...
          </div>
        ) : filteredRules.length === 0 ? (
          <div className="py-20 text-center text-slate-600 text-sm font-semibold">
            No authorization rules found for this filter.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="text-left text-slate-700 font-extrabold px-6 py-4 uppercase text-xs tracking-wider">Scope Level</th>
                  <th className="text-left text-slate-700 font-extrabold px-6 py-4 uppercase text-xs tracking-wider">Target Entity</th>
                  <th className="text-center text-slate-700 font-extrabold px-6 py-4 uppercase text-xs tracking-wider">Authorization Mode</th>
                  <th className="text-center text-slate-700 font-extrabold px-6 py-4 uppercase text-xs tracking-wider">Rule Source</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRules.map((r, idx) => {
                  const ScopeIcon  = SCOPE_ICONS[r.scope_type] || FiPackage;
                  const scopeColor = SCOPE_COLORS[r.scope_type] || SCOPE_COLORS.product;
                  const displayName = getDisplayName(r);
                  const isAuthorized = r.is_authorized !== false; // true by default
                  return (
                    <tr key={r.id || r._id || idx} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-6 py-4">
                        <span
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-extrabold"
                          style={{ backgroundColor: scopeColor.bg, color: scopeColor.text }}
                        >
                          <ScopeIcon size={12} />
                          {getScopeLabel(r.scope_type)}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-black text-blue-600">{displayName}</td>
                      <td className="px-6 py-4 text-center">
                        {isAuthorized ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-extrabold">
                            <FiCheckCircle size={13} /> Authorized (Whitelist)
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-100 text-red-800 text-xs font-extrabold">
                            <FiXCircle size={13} /> Restricted (Blacklist)
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-extrabold ${
                          r.source === "admin_override"
                            ? "bg-amber-100 text-amber-800 border border-amber-200"
                            : r.source === "admin_assigned"
                            ? "bg-blue-100 text-blue-800 border border-blue-200"
                            : "bg-emerald-100 text-emerald-800 border border-emerald-200"
                        }`}>
                          {r.source === "admin_override"
                            ? "Admin Override"
                            : r.source === "admin_assigned"
                            ? "Admin Assigned"
                            : r.source === "plan_default" || !r.source
                            ? "Plan Default"
                            : r.source.replace(/_/g, " ")}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
