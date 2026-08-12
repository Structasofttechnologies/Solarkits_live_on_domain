import { useState, useEffect } from "react";
import {
  FiTag,
  FiEdit,
  FiCheckCircle,
  FiAlertTriangle,
  FiRefreshCw,
  FiDollarSign,
  FiShield,
  FiLock,
} from "react-icons/fi";
import api from "../services/api";

export default function StorefrontListings() {
  const [listings, setListings] = useState([]);
  const [catalogItems, setCatalogItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  // Form State
  const [selectedItem, setSelectedItem] = useState("");
  const [sellingPrice, setSellingPrice] = useState("");

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [listRes, catRes] = await Promise.all([
        api.get("/india/v1/reseller/listings"),
        api.get("/india/v1/reseller/authorized-products").catch(() => ({ data: { data: [] } })),
      ]);

      if (listRes.data?.status === "success") {
        setListings(listRes.data.data || []);
      }
      if (catRes.data?.status === "success") {
        setCatalogItems(catRes.data.data?.products || catRes.data.data || []);
      }
    } catch (err) {
      console.error("Listings fetch error:", err);
      setError("Failed to load storefront catalog listings.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleUpsertListing = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    setMessage(null);
    setError(null);

    try {
      if (!selectedItem) throw new Error("Please select an authorized catalog item");
      const priceInr = parseFloat(sellingPrice);
      if (isNaN(priceInr) || priceInr <= 0) throw new Error("Selling price must be a valid positive amount");

      const itemObj = catalogItems.find((c) => (c._id || c.id) === selectedItem);

      const res = await api.post("/india/v1/reseller/listings", {
        item_type: itemObj?.scope_type || (itemObj?.is_kit ? "kit" : "product"),
        product_id: !itemObj?.is_kit ? (itemObj?._id || selectedItem) : null,
        kit_id: itemObj?.is_kit ? (itemObj?._id || selectedItem) : null,
        selling_price_paise: Math.round(priceInr * 100),
      });

      if (res.data?.status === "success") {
        setMessage("Storefront listing updated successfully!");
        setSelectedItem("");
        setSellingPrice("");
        fetchData();
      }
    } catch (err) {
      if (err.response?.data?.code === "MAP_VIOLATION") {
        setError(err.response.data.message);
      } else {
        setError(err.response?.data?.message || err.message || "Failed to update listing");
      }
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2.5">
            <FiTag className="text-blue-600" /> Storefront Listings & MAP Enforcement
          </h1>
          <p className="text-slate-600 text-sm mt-1">
            Configure selling prices for your channel storefront. Enforces Minimum Advertised Price (MAP) compliance.
          </p>
        </div>

        <button
          onClick={fetchData}
          className="p-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
        >
          <FiRefreshCw className={loading ? "animate-spin" : ""} size={14} /> Refresh Listings
        </button>
      </div>

      {/* Messages */}
      {message && (
        <div className="p-4 rounded-2xl bg-emerald-100 text-emerald-800 border border-emerald-300 text-sm font-semibold flex items-center gap-2">
          <FiCheckCircle size={18} /> {message}
        </div>
      )}

      {error && (
        <div className="p-4 rounded-2xl bg-amber-100 text-amber-900 border border-amber-300 text-sm font-semibold flex items-center gap-2">
          <FiAlertTriangle size={18} className="shrink-0" /> {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Form to Set Selling Price */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
          <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
            <FiEdit className="text-blue-600" /> Configure Item Price
          </h2>

          <form onSubmit={handleUpsertListing} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Authorized Catalog Product / Kit
              </label>
              <select
                required
                value={selectedItem}
                onChange={(e) => {
                  setSelectedItem(e.target.value);
                  const selected = catalogItems.find((c) => (c._id || c.id) === e.target.value);
                  if (selected) setSellingPrice(selected.price || selected.base_price || "");
                }}
                className="w-full p-3 rounded-xl border border-slate-300 bg-slate-50 text-slate-900 text-sm font-semibold focus:ring-2 focus:ring-blue-500"
              >
                <option value="">-- Choose Item from Catalog --</option>
                {catalogItems.map((cat) => (
                  <option key={cat._id || cat.id} value={cat._id || cat.id}>
                    {cat.name || cat.kit_name} ({cat.sku_code || cat.kit_code || "SKU"})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Your Channel Selling Price (INR)
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-extrabold">₹</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  placeholder="e.g. 45000"
                  value={sellingPrice}
                  onChange={(e) => setSellingPrice(e.target.value)}
                  className="w-full pl-8 pr-4 py-3 rounded-xl border border-slate-300 bg-slate-50 text-slate-900 text-sm font-extrabold focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <p className="text-[11px] text-slate-400 font-medium mt-1">
                Must be greater than or equal to company Minimum Advertised Price (MAP).
              </p>
            </div>

            <button
              type="submit"
              disabled={actionLoading}
              className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-sm rounded-xl transition-all shadow-md shadow-blue-500/30 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {actionLoading ? "Enforcing MAP & Saving..." : "Save Storefront Price"}
            </button>
          </form>
        </div>

        {/* Right Column: Existing Storefront Listings Table */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="p-4 border-b border-slate-100 font-extrabold text-slate-900 text-sm flex items-center justify-between">
            <span>Published Storefront Listings ({listings.length})</span>
            <span className="text-xs text-slate-400 font-medium">MAP Rules Enforced Server-Side</span>
          </div>

          {loading ? (
            <div className="p-12 text-center text-slate-500 font-bold">Loading storefront listings...</div>
          ) : listings.length === 0 ? (
            <div className="p-12 text-center text-slate-500 font-bold">No storefront listings configured yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-extrabold tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="p-4">Item Details</th>
                    <th className="p-4">B2B Cost</th>
                    <th className="p-4">MAP Bound</th>
                    <th className="p-4">Configured Selling Price</th>
                    <th className="p-4">MAP Compliance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-semibold text-slate-800">
                  {listings.map((l) => (
                    <tr key={l._id} className="hover:bg-slate-50">
                      <td className="p-4">
                        <div className="font-extrabold text-slate-900">
                          {l.product_id?.name || l.kit_id?.kit_name || "Catalog Component"}
                        </div>
                        <div className="text-xs font-mono text-slate-400">
                          {l.product_id?.sku_code || l.kit_id?.kit_code || l.item_type}
                        </div>
                      </td>
                      <td className="p-4 font-mono text-slate-600">
                        ₹{(l.cost_price_paise / 100).toFixed(2)}
                      </td>
                      <td className="p-4 font-mono text-slate-600">
                        ₹{(l.map_price_paise / 100).toFixed(2)}
                      </td>
                      <td className="p-4 font-extrabold text-blue-600 text-base font-mono">
                        ₹{(l.selling_price_paise / 100).toLocaleString('en-IN')}
                      </td>
                      <td className="p-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-extrabold ${
                          l.is_map_compliant
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-red-100 text-red-800"
                        }`}>
                          {l.is_map_compliant ? <FiShield size={14} /> : <FiLock size={14} />}
                          {l.is_map_compliant ? "MAP Compliant" : "Violation"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
