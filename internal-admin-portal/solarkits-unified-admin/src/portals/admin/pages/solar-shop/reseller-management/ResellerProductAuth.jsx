import { useState, useEffect, useCallback } from "react";
import { useDispatch } from "react-redux";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import {
  FiPackage,
  FiPlus,
  FiTrash2,
  FiSearch,
  FiLoader,
  FiCheckCircle,
  FiXCircle,
  FiShield,
  FiGrid,
  FiLayers,
  FiBox,
  FiZap,
  FiEdit3,
} from "react-icons/fi";
import { authHeaderObj } from "@/app/authHeader";
import { setAlert } from "../../../features/alert.slice";

const API_BASE = import.meta.env.VITE_API_URL;
const MODULE_UID = "RSL_PROD_AUTH";

const apiFetch = (method, endpoint, data) =>
  axios({ method, url: `${API_BASE}/reseller-mgmt/product-auth${endpoint}`, headers: authHeaderObj(), data });

const SCOPE_ICONS = {
  all:         FiGrid,
  category:    FiLayers,
  subcategory: FiLayers,
  product:     FiPackage,
  kit:         FiBox,
};

function AuthStatusBadge({ isAuthorized }) {
  return isAuthorized ? (
    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-success-soft text-success border border-success/20">
      <FiCheckCircle size={11} /> Authorized (Whitelist)
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-danger-soft text-danger border border-danger/20">
      <FiXCircle size={11} /> Restricted (Blacklist)
    </span>
  );
}

function AssignAuthModal({ resellers, defaultResellerId, onClose, onAssigned }) {
  const dispatch = useDispatch();
  const [form, setForm] = useState({
    reseller_id:      defaultResellerId || (resellers[0]?.id || ""),
    industry_type_id: "",
    scope_type:       "product",
    category_id:      "",
    subcategory_id:   "",
    system_type_id:   "",
    project_range_id: "",
    product_id:       "",
    kit_id:           "",
    is_authorized:    true,
    override_reason:  "",
  });

  const [industries, setIndustries] = useState([]);
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [systemTypes, setSystemTypes] = useState([]);
  const [projectRanges, setProjectRanges] = useState([]);
  const [products, setProducts] = useState([]);
  const [kits, setKits] = useState([]);
  const [saving, setSaving] = useState(false);

  // Load Industries and Project Ranges on mount
  useEffect(() => {
    axios.get(`${API_BASE}/industry-types/list?unique_id=${MODULE_UID}&req_for=view&active_only=true`, { headers: authHeaderObj() })
      .then((res) => {
        if (res.data?.status === "success") setIndustries(res.data.data);
      })
      .catch((e) => console.error(e));

    axios.get(`${API_BASE}/project-types/get-ranges?unique_id=${MODULE_UID}&req_for=view`, { headers: authHeaderObj() })
      .then((res) => {
        if (res.data?.status === "success") setProjectRanges(res.data.data);
      })
      .catch((e) => console.error(e));
  }, []);

  // Load categories when industry changes
  useEffect(() => {
    if (!form.industry_type_id) {
      setCategories([]);
      setForm((prev) => ({ ...prev, category_id: "", subcategory_id: "", system_type_id: "", product_id: "", kit_id: "" }));
      return;
    }
    axios.get(`${API_BASE}/project-types/get-categories?unique_id=${MODULE_UID}&req_for=view&industry_type_id=${form.industry_type_id}`, { headers: authHeaderObj() })
      .then((res) => {
        if (res.data?.status === "success") setCategories(res.data.data);
      })
      .catch((e) => console.error(e));
  }, [form.industry_type_id]);

  // Load subcategories when category changes
  useEffect(() => {
    if (!form.category_id) {
      setSubcategories([]);
      setForm((prev) => ({ ...prev, subcategory_id: "", system_type_id: "", product_id: "", kit_id: "" }));
      return;
    }
    axios.get(`${API_BASE}/project-types/get-subcategories?unique_id=${MODULE_UID}&req_for=view&category_id=${form.category_id}`, { headers: authHeaderObj() })
      .then((res) => {
        if (res.data?.status === "success") setSubcategories(res.data.data);
      })
      .catch((e) => console.error(e));
  }, [form.category_id]);

  // Load system types when subcategory changes
  useEffect(() => {
    if (!form.subcategory_id) {
      setSystemTypes([]);
      setForm((prev) => ({ ...prev, system_type_id: "", project_range_id: "", product_id: "", kit_id: "" }));
      return;
    }
    axios.get(`${API_BASE}/project-types/get-subcategory-types?unique_id=${MODULE_UID}&req_for=view&subcategory_id=${form.subcategory_id}`, { headers: authHeaderObj() })
      .then((res) => {
        if (res.data?.status === "success") setSystemTypes(res.data.data);
      })
      .catch((e) => console.error(e));
  }, [form.subcategory_id]);

  // Load project ranges when system type changes or on fallback
  useEffect(() => {
    const url = form.system_type_id
      ? `${API_BASE}/project-types/get-ranges?unique_id=${MODULE_UID}&req_for=view&subcategory_type_id=${form.system_type_id}`
      : `${API_BASE}/project-types/get-ranges?unique_id=${MODULE_UID}&req_for=view`;

    axios.get(url, { headers: authHeaderObj() })
      .then((res) => {
        if (res.data?.status === "success") setProjectRanges(res.data.data);
      })
      .catch((e) => console.error(e));
  }, [form.system_type_id]);

  // Load products when scope is product
  useEffect(() => {
    if (form.scope_type === "product") {
      axios.get(`${API_BASE}/products/get-products?req_for=view&unique_id=ADM_SKU`, { headers: authHeaderObj() })
        .then((res) => {
          if (res.data?.status === "success") setProducts(res.data.data);
        })
        .catch((e) => console.error(e));
    }
  }, [form.scope_type]);

  // Load kits when scope is kit
  useEffect(() => {
    if (form.scope_type === "kit") {
      axios.get(`${API_BASE}/combo-kits/india/get-kits?unique_id=ADM_COMBO_KITS&req_for=view&is_custom=false`, { headers: authHeaderObj() })
        .then((res) => {
          if (res.data?.status === "success") setKits(res.data.data);
        })
        .catch((e) => console.error(e));
    }
  }, [form.scope_type]);

  // Filter products based on cascading dropdown selections
  const filteredProducts = products.filter((p) => {
    if (form.industry_type_id && p.industry_type_id && (p.industry_type_id?._id || p.industry_type_id) !== form.industry_type_id) {
      return false;
    }
    if (form.category_id && p.category_id && (p.category_id?._id || p.category_id) !== form.category_id) {
      return false;
    }
    if (form.subcategory_id && p.subcategory_id && (p.subcategory_id?._id || p.subcategory_id) !== form.subcategory_id) {
      return false;
    }
    return true;
  });

  // Filter combo kits based on 5 cascading dropdown selections
  const filteredKits = kits.filter((k) => {
    if (form.industry_type_id && (k.industry_type_id?._id || k.industry_type_id) !== form.industry_type_id) {
      // Allow loose match if kit doesn't store direct industry_type_id
    }
    if (form.category_id && k.category_id && (k.category_id?._id || k.category_id) !== form.category_id) {
      return false;
    }
    if (form.subcategory_id && k.subcategory_id && (k.subcategory_id?._id || k.subcategory_id) !== form.subcategory_id) {
      return false;
    }
    if (form.system_type_id && k.project_type_id && (k.project_type_id?._id || k.project_type_id) !== form.system_type_id) {
      return false;
    }
    if (form.project_range_id && k.project_range_id && (k.project_range_id?._id || k.project_range_id) !== form.project_range_id) {
      return false;
    }
    return true;
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.reseller_id || !form.scope_type) return;
    setSaving(true);

    try {
      const payload = {
        scope_type:      form.scope_type,
        category_id:     form.category_id || undefined,
        subcategory_id:  form.subcategory_id || undefined,
        product_id:      form.scope_type === "product" ? form.product_id : undefined,
        kit_id:          form.scope_type === "kit" ? form.kit_id : undefined,
        is_authorized:   form.is_authorized,
        override_reason: form.override_reason.trim() || undefined,
        allowed_industry_type_ids: form.industry_type_id ? [form.industry_type_id] : [],
      };

      const res = await apiFetch("post", `/assign/${form.reseller_id}?req_for=add&unique_id=${MODULE_UID}`, payload);
      if (res.data?.status === "success") {
        dispatch(setAlert({ type: "success", message: "Product authorization rule saved!" }));
        onAssigned(form.reseller_id);
        onClose();
      } else {
        dispatch(setAlert({ type: "error", message: res.data?.message || "Operation failed" }));
      }
    } catch (err) {
      dispatch(setAlert({ type: "error", message: err.response?.data?.message || "Operation failed" }));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-surface rounded-2xl shadow-2xl border border-border w-full max-w-2xl overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h3 className="text-lg font-semibold text-text-primary">Add Product Authorization Rule</h3>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-surface-hover text-text-muted transition-colors">
            <FiXCircle size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {/* Select Reseller */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5">Select Reseller <span className="text-danger">*</span></label>
            <select
              className="w-full px-3 py-2.5 rounded-xl border border-border bg-bg text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              value={form.reseller_id}
              onChange={(e) => setForm({ ...form, reseller_id: e.target.value })}
              required
            >
              <option value="">Select Reseller...</option>
              {resellers.map((r) => (
                <option key={r.id} value={r.id}>{r.business_name} ({r.email})</option>
              ))}
            </select>
          </div>

          {/* Authorization Type: Whitelist vs Blacklist */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">Rule Mode <span className="text-danger">*</span></label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setForm({ ...form, is_authorized: true })}
                className={`p-3 rounded-xl border-2 text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                  form.is_authorized ? "border-success bg-success-soft text-success shadow-sm" : "border-border bg-bg text-text-muted"
                }`}
              >
                <FiCheckCircle size={16} /> Authorize (Whitelist)
              </button>
              <button
                type="button"
                onClick={() => setForm({ ...form, is_authorized: false })}
                className={`p-3 rounded-xl border-2 text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                  !form.is_authorized ? "border-danger bg-danger-soft text-danger shadow-sm" : "border-border bg-bg text-text-muted"
                }`}
              >
                <FiXCircle size={16} /> Restrict (Blacklist)
              </button>
            </div>
          </div>

          {/* Target Scope Level: ONLY 3 OPTIONS (All, Specific Product, Combo Kit) */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5">Target Scope Level <span className="text-danger">*</span></label>
            <select
              className="w-full px-3 py-2.5 rounded-xl border border-border bg-bg text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 capitalize font-semibold"
              value={form.scope_type}
              onChange={(e) => setForm({ ...form, scope_type: e.target.value })}
            >
              <option value="all">All Catalog Products & Kits</option>
              <option value="product">Specific Product (SKU) Scope</option>
              <option value="kit">Combo Kit Scope</option>
            </select>
          </div>

          {/* 5 Cascading Filter Bar (Industry Type, Category, Subcategory, System Type, Project Range) */}
          {["product", "kit"].includes(form.scope_type) && (
            <div className="p-4 rounded-xl bg-surface-hover/60 border border-border space-y-3">
              <span className="text-xs font-bold text-text-primary uppercase tracking-wider block">
                Catalog & Combo Kit Cascading Filters
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* 1. INDUSTRY TYPE */}
                <div>
                  <label className="block text-[11px] font-bold text-text-secondary uppercase mb-1">Industry Type</label>
                  <select
                    className="w-full px-3 py-2 rounded-xl border border-border bg-bg text-text-primary text-xs focus:outline-none"
                    value={form.industry_type_id}
                    onChange={(e) => setForm({ ...form, industry_type_id: e.target.value })}
                  >
                    <option value="">Select Industry Type...</option>
                    {industries.map((ind) => (
                      <option key={ind.id} value={ind.id}>{ind.name}</option>
                    ))}
                  </select>
                </div>

                {/* 2. CATEGORY */}
                <div>
                  <label className="block text-[11px] font-bold text-text-secondary uppercase mb-1">Category</label>
                  <select
                    className="w-full px-3 py-2 rounded-xl border border-border bg-bg text-text-primary text-xs focus:outline-none"
                    value={form.category_id}
                    onChange={(e) => setForm({ ...form, category_id: e.target.value })}
                    disabled={!form.industry_type_id}
                  >
                    <option value="">Select Category...</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                {/* 3. SUB-CATEGORY */}
                <div>
                  <label className="block text-[11px] font-bold text-text-secondary uppercase mb-1">Sub-Category</label>
                  <select
                    className="w-full px-3 py-2 rounded-xl border border-border bg-bg text-text-primary text-xs focus:outline-none"
                    value={form.subcategory_id}
                    onChange={(e) => setForm({ ...form, subcategory_id: e.target.value })}
                    disabled={!form.category_id}
                  >
                    <option value="">Select Subcategory...</option>
                    {subcategories.map((sc) => (
                      <option key={sc.id} value={sc.id}>{sc.name}</option>
                    ))}
                  </select>
                </div>

                {/* 4. SYSTEM TYPE (Project Type) */}
                <div>
                  <label className="block text-[11px] font-bold text-text-secondary uppercase mb-1">System Type</label>
                  <select
                    className="w-full px-3 py-2 rounded-xl border border-border bg-bg text-text-primary text-xs focus:outline-none"
                    value={form.system_type_id}
                    onChange={(e) => setForm({ ...form, system_type_id: e.target.value })}
                    disabled={!form.subcategory_id}
                  >
                    <option value="">Select System Type...</option>
                    {systemTypes.map((st) => (
                      <option key={st.subcategory_type_id || st.id || st._id} value={st.subcategory_type_id || st.id || st._id}>{st.name || st.type_name}</option>
                    ))}
                  </select>
                </div>

                {/* 5. PROJECT RANGE */}
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-bold text-text-secondary uppercase mb-1">Project Range</label>
                  <select
                    className="w-full px-3 py-2 rounded-xl border border-border bg-bg text-text-primary text-xs focus:outline-none"
                    value={form.project_range_id}
                    onChange={(e) => setForm({ ...form, project_range_id: e.target.value })}
                  >
                    <option value="">Select Project Range...</option>
                    {projectRanges.map((pr) => (
                      <option key={pr.id || pr._id} value={pr.id || pr._id}>
                        {pr.range_label || (pr.min_value !== undefined && pr.max_value !== undefined ? `${pr.min_value} - ${pr.max_value} ${pr.unit_symbol || 'kW'}` : (pr.name || 'Project Range'))}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Product Picker */}
          {form.scope_type === "product" && (
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1.5">Specific Product <span className="text-danger">*</span></label>
              <select
                className="w-full px-3 py-2.5 rounded-xl border border-border bg-bg text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 font-semibold"
                value={form.product_id}
                onChange={(e) => setForm({ ...form, product_id: e.target.value })}
                required
              >
                <option value="">Select Product...</option>
                {filteredProducts.map((p) => (
                  <option key={p.id || p._id} value={p.id || p._id}>{p.name}</option>
                ))}
              </select>
              <span className="text-[11px] text-text-muted mt-1 block">
                Showing {filteredProducts.length} products matching selected filters.
              </span>
            </div>
          )}

          {/* Kit Picker */}
          {form.scope_type === "kit" && (
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1.5">Combo Kit <span className="text-danger">*</span></label>
              <select
                className="w-full px-3 py-2.5 rounded-xl border border-border bg-bg text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 font-semibold"
                value={form.kit_id}
                onChange={(e) => setForm({ ...form, kit_id: e.target.value })}
                required
              >
                <option value="">Select Combo Kit...</option>
                {filteredKits.map((k) => (
                  <option key={k.id || k._id} value={k.id || k._id}>{k.kit_name || k.name}</option>
                ))}
              </select>
              <span className="text-[11px] text-text-muted mt-1 block">
                Showing {filteredKits.length} combo kits matching selected filters.
              </span>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5">Override Reason / Notes</label>
            <textarea
              placeholder="e.g. Approved premium catalog access for high-volume dealer"
              className="w-full px-3 py-2.5 rounded-xl border border-border bg-bg text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
              rows={2}
              value={form.override_reason}
              onChange={(e) => setForm({ ...form, override_reason: e.target.value })}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl border border-border text-text-secondary text-sm font-medium hover:bg-surface-hover transition-colors">
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || !form.reseller_id}
              className="flex-1 px-4 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary-hover transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {saving ? <FiLoader className="animate-spin" size={16} /> : null}
              Save Authorization
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

function EditStockModal({ rule, resellerId, onClose, onUpdated }) {
  const dispatch = useDispatch();
  const [stockQty, setStockQty] = useState(rule?.stock_quantity ?? 100);
  const [saving, setSaving] = useState(false);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await apiFetch("put", `/stock/${rule.id}?req_for=edit&unique_id=${MODULE_UID}`, {
        stock_quantity: Number(stockQty),
        reseller_id: resellerId || rule.reseller_id,
        product_id: rule.product?._id || rule.product,
      });

      if (res.data?.status === "success") {
        dispatch(setAlert({ type: "success", message: res.data.message || "Stock updated successfully!" }));
        onUpdated();
        onClose();
      } else {
        dispatch(setAlert({ type: "error", message: res.data?.message || "Failed to update stock" }));
      }
    } catch (err) {
      dispatch(setAlert({ type: "error", message: err.response?.data?.message || "Failed to update stock" }));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-surface rounded-2xl border border-border shadow-2xl w-full max-w-md p-6">
        <div className="flex items-center justify-between pb-4 border-b border-border mb-4">
          <h3 className="text-lg font-bold text-text-primary flex items-center gap-2">
            <FiBox className="text-primary" size={20} /> Edit / Refill Product Stock
          </h3>
          <button onClick={onClose} className="p-1 rounded-lg text-text-muted hover:text-text-primary">
            <FiXCircle size={20} />
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider block mb-1">Product</label>
            <div className="p-3 bg-bg border border-border rounded-xl font-semibold text-text-primary text-sm">
              {rule.product?.name || rule.product?.sku_code || "Product Scope"}
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider block mb-1">Stock Quantity (Units)</label>
            <input
              type="number"
              min="0"
              required
              className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-bg text-text-primary text-sm focus:ring-2 focus:ring-primary/30"
              value={stockQty}
              onChange={(e) => setStockQty(e.target.value)}
              placeholder="e.g. 100, 200..."
            />
            <p className="text-xs text-text-muted mt-1">Set available inventory count. Stock turns Out of Stock when quantity reaches 0.</p>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl text-sm font-semibold border border-border text-text-secondary hover:bg-surface-hover">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold bg-primary text-white hover:bg-primary-hover shadow-md">
              {saving ? <FiLoader className="animate-spin" size={16} /> : <FiCheckCircle size={16} />}
              Update Stock Quantity
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

export default function ResellerProductAuth({ moduleUniqueId }) {
  const dispatch = useDispatch();
  const [resellers, setResellers] = useState([]);
  const [selectedResellerId, setSelectedResellerId] = useState("");
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [modal, setModal] = useState(false);
  const [stockModalRule, setStockModalRule] = useState(null);

  // Load Resellers
  useEffect(() => {
    axios.get(`${API_BASE}/reseller-mgmt/list?req_for=view&unique_id=${MODULE_UID}&limit=100`, { headers: authHeaderObj() })
      .then((res) => {
        if (res.data?.status === "success") {
          setResellers(res.data.data);
          if (res.data.data.length > 0) setSelectedResellerId(res.data.data[0].id);
        }
      })
      .catch((e) => console.error(e));
  }, []);

  const fetchRules = useCallback(async () => {
    if (!selectedResellerId) return;
    setLoading(true);
    try {
      const res = await apiFetch("get", `/list/${selectedResellerId}?req_for=view&unique_id=${MODULE_UID}`);
      if (res.data?.status === "success") setRules(res.data.data);
    } catch {
      dispatch(setAlert({ type: "error", message: "Failed to load product authorizations" }));
    } finally {
      setLoading(false);
    }
  }, [selectedResellerId, dispatch]);

  useEffect(() => {
    fetchRules();
  }, [fetchRules]);

  const handleAssigned = (assignedResellerId) => {
    if (assignedResellerId && assignedResellerId !== selectedResellerId) {
      setSelectedResellerId(assignedResellerId);
    } else {
      fetchRules();
    }
  };

  const handleRevoke = async (ruleId) => {
    try {
      const res = await apiFetch("put", `/revoke/${ruleId}?req_for=edit&unique_id=${MODULE_UID}`);
      if (res.data?.status === "success") {
        dispatch(setAlert({ type: "success", message: "Authorization rule revoked" }));
        fetchRules();
      }
    } catch (err) {
      dispatch(setAlert({ type: "error", message: err.response?.data?.message || "Revoke failed" }));
    }
  };

  const handleSeedDummy = async () => {
    if (!selectedResellerId) return;
    setSeeding(true);
    try {
      const res = await apiFetch("post", `/seed-dummy/${selectedResellerId}?req_for=add&unique_id=${MODULE_UID}`);
      if (res.data?.status === "success") {
        dispatch(setAlert({ type: "success", message: res.data?.message || "Dummy product auth rules seeded successfully!" }));
        fetchRules();
      } else {
        dispatch(setAlert({ type: "error", message: res.data?.message || "Seeding failed" }));
      }
    } catch (err) {
      dispatch(setAlert({ type: "error", message: err.response?.data?.message || "Seeding failed" }));
    } finally {
      setSeeding(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
            <FiPackage className="text-primary" size={24} />
            Product Authorization Matrix
          </h1>
          <p className="text-sm text-text-muted mt-1">
            Manage product catalog whitelists, category access permissions, and SKU blacklists per franchisee
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleSeedDummy}
            disabled={seeding || !selectedResellerId}
            className="flex items-center gap-2 px-4 py-2.5 bg-secondary/10 hover:bg-secondary/20 text-secondary border border-secondary/20 rounded-xl text-sm font-semibold transition-all disabled:opacity-50"
            title="Seed 5-6 dummy product authorization rules for testing"
          >
            {seeding ? <FiLoader className="animate-spin" size={16} /> : <FiZap size={16} />}
            Seed Dummy Rules
          </button>
          <button
            onClick={() => setModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary-hover transition-all shadow-md shadow-primary/20 hover:shadow-lg hover:shadow-primary/30"
          >
            <FiPlus size={16} />
            Add Authorization Rule
          </button>
        </div>
      </div>

      {/* Franchisee Selector Bar */}
      <div className="bg-surface p-4 rounded-2xl border border-border shadow-sm flex flex-col sm:flex-row items-center gap-4">
        <label className="text-sm font-semibold text-text-secondary flex-shrink-0">Select Franchisee Account:</label>
        <select
          className="w-full sm:w-80 px-3.5 py-2.5 rounded-xl border border-border bg-bg text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          value={selectedResellerId}
          onChange={(e) => setSelectedResellerId(e.target.value)}
        >
          {resellers.map((r) => (
            <option key={r.id} value={r.id}>{r.business_name} ({r.email})</option>
          ))}
        </select>
      </div>

      {/* Rules Table */}
      <div className="bg-surface rounded-2xl border border-border shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20 text-text-muted gap-3">
            <FiLoader className="animate-spin" size={20} />
            <span className="text-sm">Loading product authorization rules...</span>
          </div>
        ) : rules.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="w-14 h-14 rounded-full bg-surface-hover flex items-center justify-center">
              <FiPackage size={24} className="text-text-muted" />
            </div>
            <p className="text-sm text-text-muted">No explicit product authorization rules configured for this franchisee</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-bg">
                  <th className="text-left text-text-muted font-medium px-5 py-3.5">Industry</th>
                  <th className="text-left text-text-muted font-medium px-5 py-3.5">Scope Level</th>
                  <th className="text-left text-text-muted font-medium px-5 py-3.5">Target Entity</th>
                  <th className="text-center text-text-muted font-medium px-4 py-3.5">Authorization State</th>
                  <th className="text-center text-text-muted font-medium px-4 py-3.5">Stock Quantity</th>
                  <th className="text-left text-text-muted font-medium px-5 py-3.5 hidden md:table-cell">Reason / Notes</th>
                  <th className="text-center text-text-muted font-medium px-4 py-3.5">Status</th>
                  <th className="text-right text-text-muted font-medium px-5 py-3.5">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                <AnimatePresence>
                  {rules.map((r) => {
                    const ScopeIcon = SCOPE_ICONS[r.scope_type] || FiPackage;
                    let targetName = "All Catalog Items";
                    if (r.scope_type === "product") {
                      targetName = r.product?.name || (r.product?.sku_code ? `SKU: ${r.product.sku_code}` : "Product Scope");
                    } else if (r.scope_type === "kit") {
                      targetName = r.kit?.kit_name || (r.kit?.kit_code ? `Kit: ${r.kit.kit_code}` : "Combo Kit Scope");
                    } else if (r.scope_type === "subcategory") {
                      targetName = r.subcategory?.name || "Subcategory Scope";
                    } else if (r.scope_type === "category") {
                      targetName = r.category?.name || "Category Scope";
                    }

                    const industryName = r.allowed_industry_type_ids?.[0]?.name || "—";
                    const stockQty = r.stock_quantity ?? 100;

                    return (
                      <motion.tr key={r.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="hover:bg-surface-hover transition-colors">
                        <td className="px-5 py-3.5">
                          <span className="font-semibold text-text-primary">
                            {industryName}
                          </span>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className="font-semibold text-text-primary capitalize flex items-center gap-1.5">
                            <ScopeIcon size={14} className="text-primary" />
                            {r.scope_type}
                          </span>
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="font-semibold text-text-primary">{targetName}</div>
                        </td>
                        <td className="px-4 py-3.5 text-center">
                          <AuthStatusBadge isAuthorized={r.is_authorized} />
                        </td>
                        <td className="px-4 py-3.5 text-center font-medium">
                          {r.scope_type === "product" ? (
                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                              stockQty > 10
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                : stockQty > 0
                                ? "bg-amber-50 text-amber-700 border border-amber-200"
                                : "bg-red-50 text-red-700 border border-red-200"
                            }`}>
                              {stockQty > 0 ? `In Stock (${stockQty} units)` : "Out of Stock (0)"}
                            </span>
                          ) : (
                            <span className="text-xs text-text-muted italic">—</span>
                          )}
                        </td>
                        <td className="px-5 py-3.5 hidden md:table-cell text-text-secondary text-xs max-w-xs truncate">
                          {r.override_reason || <span className="text-text-muted italic">—</span>}
                        </td>
                        <td className="px-4 py-3.5 text-center">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold capitalize ${
                            r.status === 'active' ? 'bg-success-soft text-success' : 'bg-surface-hover text-text-muted'
                          }`}>
                            {r.status}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-1">
                            {r.scope_type === "product" && r.status === "active" && (
                              <button
                                onClick={() => setStockModalRule(r)}
                                className="p-2 rounded-lg text-primary hover:text-primary-hover hover:bg-primary-soft transition-colors"
                                title="Edit / Refill Stock Quantity"
                              >
                                <FiEdit3 size={16} />
                              </button>
                            )}
                            {r.status === 'active' && (
                              <button
                                onClick={() => handleRevoke(r.id)}
                                className="p-2 rounded-lg text-text-muted hover:text-danger hover:bg-danger-soft transition-colors"
                                title="Revoke Rule"
                              >
                                <FiTrash2 size={16} />
                              </button>
                            )}
                          </div>
                        </td>
                      </motion.tr>
                    );
                  })}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        )}
      </div>

      <AnimatePresence>
        {modal && (
          <AssignAuthModal
            resellers={resellers}
            defaultResellerId={selectedResellerId}
            onClose={() => setModal(false)}
            onAssigned={handleAssigned}
          />
        )}
        {stockModalRule && (
          <EditStockModal
            rule={stockModalRule}
            resellerId={selectedResellerId}
            onClose={() => setStockModalRule(null)}
            onUpdated={fetchRules}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
