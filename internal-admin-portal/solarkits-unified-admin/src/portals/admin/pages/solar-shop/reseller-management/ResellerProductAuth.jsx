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

function AssignAuthModal({ resellers, onClose, onAssigned }) {
  const dispatch = useDispatch();
  const [form, setForm] = useState({
    reseller_id:      "",
    industry_type_id: "",
    scope_type:       "category",
    category_id:      "",
    subcategory_id:   "",
    product_id:       "",
    kit_id:           "",
    is_authorized:    true,
    override_reason:  "",
  });

  const [industries, setIndustries] = useState([]);
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [kits, setKits] = useState([]);
  const [saving, setSaving] = useState(false);

  // Load Industries on mount
  useEffect(() => {
    axios.get(`${API_BASE}/industry-types/list?unique_id=${MODULE_UID}&req_for=view&active_only=true`, { headers: authHeaderObj() })
      .then((res) => {
        if (res.data?.status === "success") setIndustries(res.data.data);
      })
      .catch((e) => console.error(e));
  }, []);

  // Load categories when industry changes
  useEffect(() => {
    if (!form.industry_type_id) {
      setCategories([]);
      setForm((prev) => ({ ...prev, category_id: "", subcategory_id: "", product_id: "", kit_id: "" }));
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
      setForm((prev) => ({ ...prev, subcategory_id: "", product_id: "", kit_id: "" }));
      return;
    }
    axios.get(`${API_BASE}/project-types/get-subcategories?unique_id=${MODULE_UID}&req_for=view&category_id=${form.category_id}`, { headers: authHeaderObj() })
      .then((res) => {
        if (res.data?.status === "success") setSubcategories(res.data.data);
      })
      .catch((e) => console.error(e));
  }, [form.category_id]);

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.reseller_id || !form.scope_type) return;
    setSaving(true);

    try {
      const payload = {
        scope_type:      form.scope_type,
        category_id:     form.scope_type === "category" ? form.category_id : undefined,
        subcategory_id:  form.scope_type === "subcategory" ? form.subcategory_id : undefined,
        product_id:      form.scope_type === "product" ? form.product_id : undefined,
        kit_id:          form.scope_type === "kit" ? form.kit_id : undefined,
        is_authorized:   form.is_authorized,
        override_reason: form.override_reason.trim() || undefined,
        allowed_industry_type_ids: form.industry_type_id ? [form.industry_type_id] : [],
      };

      const res = await apiFetch("post", `/assign/${form.reseller_id}?req_for=add&unique_id=${MODULE_UID}`, payload);
      if (res.data?.status === "success") {
        dispatch(setAlert({ type: "success", message: "Product authorization rule saved!" }));
        onAssigned();
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
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-surface rounded-2xl shadow-2xl border border-border w-full max-w-lg overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h3 className="text-lg font-semibold text-text-primary">Add Product Authorization Rule</h3>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-surface-hover text-text-muted transition-colors">
            <FiXCircle size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
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

          {/* Select Industry Type */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5">Select Industry Type <span className="text-danger">*</span></label>
            <select
              className="w-full px-3 py-2.5 rounded-xl border border-border bg-bg text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              value={form.industry_type_id}
              onChange={(e) => setForm({ ...form, industry_type_id: e.target.value })}
              required
            >
              <option value="">Select Industry...</option>
              {industries.map((ind) => (
                <option key={ind.id} value={ind.id}>{ind.name}</option>
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

          {/* Scope Type */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5">Target Scope Level <span className="text-danger">*</span></label>
            <select
              className="w-full px-3 py-2.5 rounded-xl border border-border bg-bg text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 capitalize"
              value={form.scope_type}
              onChange={(e) => setForm({ ...form, scope_type: e.target.value })}
            >
              <option value="all">All Catalog Products & Kits</option>
              <option value="category">Category Scope</option>
              <option value="subcategory">Subcategory Scope</option>
              <option value="product">Specific Product (SKU) Scope</option>
              <option value="kit">Combo Kit Scope</option>
            </select>
          </div>

          {/* Category Picker */}
          {["category", "subcategory", "product", "kit"].includes(form.scope_type) && (
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1.5">Project Category <span className="text-danger">*</span></label>
              <select
                className="w-full px-3 py-2.5 rounded-xl border border-border bg-bg text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                value={form.category_id}
                onChange={(e) => setForm({ ...form, category_id: e.target.value })}
                required
                disabled={!form.industry_type_id}
              >
                <option value="">Select Category...</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          )}

          {/* Subcategory Picker */}
          {["subcategory", "product", "kit"].includes(form.scope_type) && (
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1.5">Project Subcategory <span className="text-danger">*</span></label>
              <select
                className="w-full px-3 py-2.5 rounded-xl border border-border bg-bg text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                value={form.subcategory_id}
                onChange={(e) => setForm({ ...form, subcategory_id: e.target.value })}
                required
                disabled={!form.category_id}
              >
                <option value="">Select Subcategory...</option>
                {subcategories.map((sc) => (
                  <option key={sc.id} value={sc.id}>{sc.name}</option>
                ))}
              </select>
            </div>
          )}

          {/* Product Picker */}
          {form.scope_type === "product" && (
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1.5">Specific Product <span className="text-danger">*</span></label>
              <select
                className="w-full px-3 py-2.5 rounded-xl border border-border bg-bg text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                value={form.product_id}
                onChange={(e) => setForm({ ...form, product_id: e.target.value })}
                required
                disabled={!form.subcategory_id}
              >
                <option value="">Select Product...</option>
                {products.map((p) => (
                  <option key={p.id || p._id} value={p.id || p._id}>{p.name}</option>
                ))}
              </select>
            </div>
          )}

          {/* Kit Picker */}
          {form.scope_type === "kit" && (
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1.5">Combo Kit <span className="text-danger">*</span></label>
              <select
                className="w-full px-3 py-2.5 rounded-xl border border-border bg-bg text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                value={form.kit_id}
                onChange={(e) => setForm({ ...form, kit_id: e.target.value })}
                required
                disabled={!form.subcategory_id}
              >
                <option value="">Select Combo Kit...</option>
                {kits.map((k) => (
                  <option key={k.id || k._id} value={k.id || k._id}>{k.kit_name}</option>
                ))}
              </select>
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

export default function ResellerProductAuth({ moduleUniqueId }) {
  const dispatch = useDispatch();
  const [resellers, setResellers] = useState([]);
  const [selectedResellerId, setSelectedResellerId] = useState("");
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [modal, setModal] = useState(false);

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
            Manage product catalog whitelists, category access permissions, and SKU blacklists per reseller
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

      {/* Reseller Selector Bar */}
      <div className="bg-surface p-4 rounded-2xl border border-border shadow-sm flex flex-col sm:flex-row items-center gap-4">
        <label className="text-sm font-semibold text-text-secondary flex-shrink-0">Select Reseller Account:</label>
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
            <p className="text-sm text-text-muted">No explicit product authorization rules configured for this reseller</p>
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
                  <th className="text-left text-text-muted font-medium px-5 py-3.5 hidden md:table-cell">Reason / Notes</th>
                  <th className="text-center text-text-muted font-medium px-4 py-3.5">Status</th>
                  <th className="text-right text-text-muted font-medium px-5 py-3.5">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                <AnimatePresence>
                  {rules.map((r) => {
                    const ScopeIcon = SCOPE_ICONS[r.scope_type] || FiPackage;
                    const targetName = r.category?.name || r.subcategory?.name || r.product?.name || r.kit?.kit_name || "All Catalog Items";
                    const industryName = r.allowed_industry_type_ids?.[0]?.name || "—";
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
                          {r.status === 'active' && (
                            <button
                              onClick={() => handleRevoke(r.id)}
                              className="p-2 rounded-lg text-text-muted hover:text-danger hover:bg-danger-soft transition-colors"
                              title="Revoke Rule"
                            >
                              <FiTrash2 size={16} />
                            </button>
                          )}
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
            onClose={() => setModal(false)}
            onAssigned={fetchRules}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
