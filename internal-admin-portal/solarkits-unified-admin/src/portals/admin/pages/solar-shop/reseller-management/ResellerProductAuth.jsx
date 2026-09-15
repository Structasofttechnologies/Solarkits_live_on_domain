import { useState, useEffect, useCallback, useMemo } from "react";
import { useDispatch } from "react-redux";
// eslint-disable-next-line no-unused-vars
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
  FiList,
  FiFilter,
  FiRefreshCw,
  FiMapPin,
  FiUser,
  FiTag,
  FiInfo,
  FiCheck,
  FiSliders,
} from "react-icons/fi";
import { authHeaderObj } from "@/app/authHeader";
import { setAlert } from "../../../features/alert.slice";

const API_BASE = import.meta.env.VITE_API_URL;
const MODULE_UID = "RSL_PROD_AUTH";

const apiFetch = (method, endpoint, data) =>
  axios({ method, url: `${API_BASE}/reseller-mgmt/product-auth${endpoint}`, headers: authHeaderObj(), data });

const SCOPE_CONFIG = {
  all: {
    label: "All Solar Kits",
    icon: FiGrid,
    badgeBg: "bg-slate-100 text-slate-700 border-slate-200",
  },
  category: {
    label: "Category Scope",
    icon: FiLayers,
    badgeBg: "bg-cyan-50 text-cyan-700 border-cyan-200",
  },
  subcategory: {
    label: "Subcategory Scope",
    icon: FiLayers,
    badgeBg: "bg-indigo-50 text-indigo-700 border-indigo-200",
  },
  product: {
    label: "Product SKU",
    icon: FiPackage,
    badgeBg: "bg-purple-50 text-purple-700 border-purple-200",
  },
  kit: {
    label: "Combo Kit Scope",
    icon: FiBox,
    badgeBg: "bg-blue-50 text-blue-700 border-blue-200",
  },
};

function AuthStatusBadge({ isAuthorized, size = "normal" }) {
  const isSm = size === "small";
  return isAuthorized ? (
    <span
      className={`inline-flex items-center gap-1.5 font-semibold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-xs ${
        isSm ? "px-2 py-0.5 text-[11px]" : "px-3 py-1 text-xs"
      }`}
    >
      <FiCheckCircle className="text-emerald-600 flex-shrink-0" size={isSm ? 12 : 14} />
      <span>Authorized (Whitelist)</span>
    </span>
  ) : (
    <span
      className={`inline-flex items-center gap-1.5 font-semibold rounded-full bg-rose-50 text-rose-700 border border-rose-200 shadow-xs ${
        isSm ? "px-2 py-0.5 text-[11px]" : "px-3 py-1 text-xs"
      }`}
    >
      <FiXCircle className="text-rose-600 flex-shrink-0" size={isSm ? 12 : 14} />
      <span>Restricted (Blacklist)</span>
    </span>
  );
}


function AssignAuthModal({ resellers, defaultResellerId, onClose, onAssigned }) {
  const dispatch = useDispatch();
  const [form, setForm] = useState({
    reseller_id:
      defaultResellerId && defaultResellerId !== "all"
        ? defaultResellerId
        : resellers[0]?.id || "",
    industry_type_id: "",
    scope_type: "kit",
    category_id: "",
    subcategory_id: "",
    system_type_id: "",
    project_range_id: "",
    kit_id: "",
    is_authorized: true,
    override_reason: "",
  });

  const [industries, setIndustries] = useState([]);
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [systemTypes, setSystemTypes] = useState([]);
  const [projectRanges, setProjectRanges] = useState([]);
  const [kits, setKits] = useState([]);
  const [saving, setSaving] = useState(false);

  // Load Industries and Project Ranges on mount
  useEffect(() => {
    axios
      .get(`${API_BASE}/industry-types/list?unique_id=${MODULE_UID}&req_for=view&active_only=true`, {
        headers: authHeaderObj(),
      })
      .then((res) => {
        if (res.data?.status === "success") setIndustries(res.data.data || []);
      })
      .catch((e) => console.error(e));

    axios
      .get(`${API_BASE}/project-types/get-ranges?unique_id=${MODULE_UID}&req_for=view`, {
        headers: authHeaderObj(),
      })
      .then((res) => {
        if (res.data?.status === "success") setProjectRanges(res.data.data || []);
      })
      .catch((e) => console.error(e));

    axios
      .get(`${API_BASE}/combo-kits/india/get-kits?unique_id=ADM_COMBO_KITS&req_for=view&is_custom=false`, {
        headers: authHeaderObj(),
      })
      .then((res) => {
        if (res.data?.status === "success") setKits(res.data.data || []);
      })
      .catch((e) => console.error(e));
  }, []);

  // Load categories when industry changes
  useEffect(() => {
    if (!form.industry_type_id) {
      setCategories([]);
      setForm((prev) => ({ ...prev, category_id: "", subcategory_id: "", system_type_id: "", kit_id: "" }));
      return;
    }
    axios
      .get(
        `${API_BASE}/project-types/get-categories?unique_id=${MODULE_UID}&req_for=view&industry_type_id=${form.industry_type_id}`,
        { headers: authHeaderObj() }
      )
      .then((res) => {
        if (res.data?.status === "success") setCategories(res.data.data || []);
      })
      .catch((e) => console.error(e));
  }, [form.industry_type_id]);

  // Load subcategories when category changes
  useEffect(() => {
    if (!form.category_id) {
      setSubcategories([]);
      setForm((prev) => ({ ...prev, subcategory_id: "", system_type_id: "", kit_id: "" }));
      return;
    }
    axios
      .get(
        `${API_BASE}/project-types/get-subcategories?unique_id=${MODULE_UID}&req_for=view&category_id=${form.category_id}`,
        { headers: authHeaderObj() }
      )
      .then((res) => {
        if (res.data?.status === "success") setSubcategories(res.data.data || []);
      })
      .catch((e) => console.error(e));
  }, [form.category_id]);

  // Load system types when subcategory changes
  useEffect(() => {
    if (!form.subcategory_id) {
      setSystemTypes([]);
      setForm((prev) => ({ ...prev, system_type_id: "", project_range_id: "", kit_id: "" }));
      return;
    }
    axios
      .get(
        `${API_BASE}/project-types/get-subcategory-types?unique_id=${MODULE_UID}&req_for=view&subcategory_id=${form.subcategory_id}`,
        { headers: authHeaderObj() }
      )
      .then((res) => {
        if (res.data?.status === "success") setSystemTypes(res.data.data || []);
      })
      .catch((e) => console.error(e));
  }, [form.subcategory_id]);

  // Filter combo kits based on cascading dropdown selections
  const filteredKits = useMemo(() => {
    return kits.filter((k) => {
      const kitCatId = k.category_id?._id || k.category_id || k.solar_kit_id?.category_id?._id || k.solar_kit_id?.category_id;
      const kitSubcatId =
        k.subcategory_id?._id || k.subcategory_id || k.solar_kit_id?.subcategory_id?._id || k.solar_kit_id?.subcategory_id;
      const kitTypeId =
        k.project_type_id?._id ||
        k.project_type_id ||
        k.type_id?._id ||
        k.type_id ||
        k.solar_kit_id?.type_id?._id ||
        k.solar_kit_id?.type_id;
      const kitRangeId = k.project_range_id?._id || k.project_range_id;
      const kitIndId =
        k.industry_type_id?._id || k.industry_type_id || k.solar_kit_id?.industry_type_id?._id || k.solar_kit_id?.industry_type_id;

      if (form.industry_type_id && kitIndId && String(kitIndId) !== String(form.industry_type_id)) return false;
      if (form.category_id && kitCatId && String(kitCatId) !== String(form.category_id)) return false;
      if (form.subcategory_id && kitSubcatId && String(kitSubcatId) !== String(form.subcategory_id)) return false;
      if (form.system_type_id && kitTypeId && String(kitTypeId) !== String(form.system_type_id)) return false;
      if (form.project_range_id && kitRangeId && String(kitRangeId) !== String(form.project_range_id)) return false;
      return true;
    });
  }, [kits, form.industry_type_id, form.category_id, form.subcategory_id, form.system_type_id, form.project_range_id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.reseller_id || !form.scope_type) {
      dispatch(setAlert({ type: "error", message: "Please select a franchisee and scope type" }));
      return;
    }
    if (form.scope_type === "kit" && !form.kit_id) {
      dispatch(setAlert({ type: "error", message: "Please select a Combo Kit" }));
      return;
    }

    setSaving(true);
    try {
      const payload = {
        scope_type: form.scope_type,
        category_id: form.category_id || undefined,
        subcategory_id: form.subcategory_id || undefined,
        kit_id: form.scope_type === "kit" ? form.kit_id : undefined,
        is_authorized: form.is_authorized,
        override_reason: form.override_reason.trim() || undefined,
        allowed_industry_type_ids: form.industry_type_id ? [form.industry_type_id] : [],
      };

      const res = await apiFetch("post", `/assign/${form.reseller_id}?req_for=add&unique_id=${MODULE_UID}`, payload);
      if (res.data?.status === "success") {
        dispatch(setAlert({ type: "success", message: "Kit authorization rule saved successfully!" }));
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl my-8 overflow-hidden text-slate-800"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4.5 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-100/70 text-blue-700 flex items-center justify-center font-bold">
              <FiShield size={18} />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Add Franchise Kit Authorization Rule</h3>
              <p className="text-xs text-slate-500">Configure equipment whitelisting or catalog restriction</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-200/70 text-slate-400 hover:text-slate-700 transition-colors"
          >
            <FiXCircle size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4.5 max-h-[75vh] overflow-y-auto">
          {/* Select Reseller */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Select Franchisee Partner <span className="text-rose-500">*</span>
            </label>
            <select
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium"
              value={form.reseller_id}
              onChange={(e) => setForm({ ...form, reseller_id: e.target.value })}
              required
            >
              <option value="">Select Franchisee Account...</option>
              {resellers.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.business_name} {r.city ? `(${r.city})` : ""} - {r.email}
                </option>
              ))}
            </select>
          </div>

          {/* Authorization Type: Whitelist vs Blacklist */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Authorization Rule Mode <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setForm({ ...form, is_authorized: true })}
                className={`p-3.5 rounded-xl border-2 text-xs font-bold flex items-center justify-center gap-2.5 transition-all ${
                  form.is_authorized
                    ? "border-emerald-500 bg-emerald-50/70 text-emerald-800 shadow-xs"
                    : "border-slate-200 bg-slate-50/50 text-slate-600 hover:bg-slate-100/50"
                }`}
              >
                <FiCheckCircle size={17} className={form.is_authorized ? "text-emerald-600" : "text-slate-400"} />
                <div className="text-left">
                  <div className="font-bold">Authorize (Whitelist)</div>
                  <div className="text-[11px] font-normal opacity-80">Grant exclusive kit selling rights</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setForm({ ...form, is_authorized: false })}
                className={`p-3.5 rounded-xl border-2 text-xs font-bold flex items-center justify-center gap-2.5 transition-all ${
                  !form.is_authorized
                    ? "border-rose-500 bg-rose-50/70 text-rose-800 shadow-xs"
                    : "border-slate-200 bg-slate-50/50 text-slate-600 hover:bg-slate-100/50"
                }`}
              >
                <FiXCircle size={17} className={!form.is_authorized ? "text-rose-600" : "text-slate-400"} />
                <div className="text-left">
                  <div className="font-bold">Restrict (Blacklist)</div>
                  <div className="text-[11px] font-normal opacity-80">Block equipment from catalog</div>
                </div>
              </button>
            </div>
          </div>

          {/* Scope Level */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Target Scope Level <span className="text-rose-500">*</span>
            </label>
            <select
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-semibold"
              value={form.scope_type}
              onChange={(e) => setForm({ ...form, scope_type: e.target.value })}
            >
              <option value="kit">Specific Solar Combo Kit</option>
              <option value="all">All Solar Combo Kits (Full Franchise Catalog)</option>
            </select>
          </div>

          {/* Cascading Filter Bar */}
          {form.scope_type === "kit" && (
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <FiSliders size={14} className="text-blue-600" />
                  Combo Kit Cascading Filters
                </span>
                <span className="text-[11px] text-slate-500 font-medium">Filter kits down to specific model</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* 1. Industry Type */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Industry Type</label>
                  <select
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-800 text-xs focus:ring-1 focus:ring-blue-500 font-medium"
                    value={form.industry_type_id}
                    onChange={(e) => setForm({ ...form, industry_type_id: e.target.value })}
                  >
                    <option value="">All Industries...</option>
                    {industries.map((ind) => (
                      <option key={ind.id} value={ind.id}>
                        {ind.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 2. Category */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Category</label>
                  <select
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-800 text-xs focus:ring-1 focus:ring-blue-500 font-medium disabled:opacity-50"
                    value={form.category_id}
                    onChange={(e) => setForm({ ...form, category_id: e.target.value })}
                    disabled={!form.industry_type_id}
                  >
                    <option value="">All Categories...</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 3. Sub-Category */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Sub-Category</label>
                  <select
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-800 text-xs focus:ring-1 focus:ring-blue-500 font-medium disabled:opacity-50"
                    value={form.subcategory_id}
                    onChange={(e) => setForm({ ...form, subcategory_id: e.target.value })}
                    disabled={!form.category_id}
                  >
                    <option value="">All Subcategories...</option>
                    {subcategories.map((sc) => (
                      <option key={sc.id} value={sc.id}>
                        {sc.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 4. System Type */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">System Type</label>
                  <select
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-800 text-xs focus:ring-1 focus:ring-blue-500 font-medium disabled:opacity-50"
                    value={form.system_type_id}
                    onChange={(e) => setForm({ ...form, system_type_id: e.target.value })}
                    disabled={!form.subcategory_id}
                  >
                    <option value="">All System Types...</option>
                    {systemTypes.map((st) => (
                      <option key={st.subcategory_type_id || st.id || st._id} value={st.subcategory_type_id || st.id || st._id}>
                        {st.name || st.type_name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 5. Project Range */}
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Project Range (Capacity)</label>
                  <select
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-800 text-xs focus:ring-1 focus:ring-blue-500 font-medium"
                    value={form.project_range_id}
                    onChange={(e) => setForm({ ...form, project_range_id: e.target.value })}
                  >
                    <option value="">All Project Ranges...</option>
                    {projectRanges.map((pr) => (
                      <option key={pr.id || pr._id} value={pr.id || pr._id}>
                        {pr.range_label ||
                          (pr.min_value !== undefined && pr.max_value !== undefined
                            ? `${pr.min_value} - ${pr.max_value} ${pr.unit_symbol || "kW"}`
                            : pr.name || "Project Range")}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Kit Picker */}
          {form.scope_type === "kit" && (
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Target Solar Combo Kit <span className="text-rose-500">*</span>
              </label>
              <select
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-semibold"
                value={form.kit_id}
                onChange={(e) => setForm({ ...form, kit_id: e.target.value })}
                required
              >
                <option value="">Select Combo Kit...</option>
                {filteredKits.map((k) => (
                  <option key={k.id || k._id} value={k.id || k._id}>
                    {k.kit_name || k.name} {k.kit_code ? `(${k.kit_code})` : ""}
                  </option>
                ))}
              </select>
              <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1.5 px-1">
                <span>
                  Showing <strong>{filteredKits.length}</strong> matching combo kits
                </span>
                {filteredKits.length === 0 && <span className="text-rose-600 font-medium">Try broadening your filter criteria</span>}
              </div>
            </div>
          )}

          {/* Reason / Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Override Reason / Operational Notes
            </label>
            <textarea
              placeholder="e.g. Exclusive regional distribution authorization granted for high-volume district franchise."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none"
              rows={2}
              value={form.override_reason}
              onChange={(e) => setForm({ ...form, override_reason: e.target.value })}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 text-sm font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || !form.reseller_id}
              className="flex-1 px-4 py-2.5 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-sm font-semibold shadow-md shadow-blue-700/20 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {saving ? <FiLoader className="animate-spin" size={16} /> : <FiCheck size={16} />}
              Save Authorization Rule
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}


export default function ResellerProductAuth() {
  const dispatch = useDispatch();

  const [resellers, setResellers] = useState([]);
  const [selectedResellerId, setSelectedResellerId] = useState("all");
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(false);

  const [modal, setModal] = useState(false);

  // View switch: "cards" (Big Card Format) vs "table" (Table View)
  const [viewMode, setViewMode] = useState("cards");

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [scopeFilter, setScopeFilter] = useState("all");
  const [authFilter, setAuthFilter] = useState("all");

  // Load Resellers on mount
  useEffect(() => {
    axios
      .get(`${API_BASE}/reseller-mgmt/list?req_for=view&unique_id=${MODULE_UID}&limit=100`, { headers: authHeaderObj() })
      .then((res) => {
        if (res.data?.status === "success") {
          setResellers(res.data.data || []);
        }
      })
      .catch((e) => console.error(e));
  }, []);

  // Fetch Rules (all or single reseller)
  const fetchRules = useCallback(async () => {
    setLoading(true);
    try {
      const endpoint =
        selectedResellerId === "all" || !selectedResellerId
          ? `/list-all?req_for=view&unique_id=${MODULE_UID}`
          : `/list/${selectedResellerId}?req_for=view&unique_id=${MODULE_UID}`;

      const res = await apiFetch("get", endpoint);
      if (res.data?.status === "success") {
        setRules(res.data.data || []);
      }
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
    if (selectedResellerId !== "all" && assignedResellerId && assignedResellerId !== selectedResellerId) {
      setSelectedResellerId(assignedResellerId);
    } else {
      fetchRules();
    }
  };

  const handleRevoke = async (ruleId) => {
    if (!window.confirm("Are you sure you want to revoke this authorization rule?")) return;
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

  // Filtered Rules
  const filteredRules = useMemo(() => {
    return rules.filter((r) => {
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const kitName = (r.kit?.kit_name || r.kit?.name || "").toLowerCase();
        const kitCode = (r.kit?.kit_code || "").toLowerCase();
        const prodName = (r.product?.name || "").toLowerCase();
        const prodSku = (r.product?.sku_code || "").toLowerCase();
        const franchiseName = (r.reseller?.business_name || "").toLowerCase();
        const franchiseEmail = (r.reseller?.email || "").toLowerCase();
        const franchiseCity = (r.reseller?.city || "").toLowerCase();
        const reason = (r.override_reason || "").toLowerCase();

        const matches =
          kitName.includes(q) ||
          kitCode.includes(q) ||
          prodName.includes(q) ||
          prodSku.includes(q) ||
          franchiseName.includes(q) ||
          franchiseEmail.includes(q) ||
          franchiseCity.includes(q) ||
          reason.includes(q);

        if (!matches) return false;
      }

      // Scope Filter
      if (scopeFilter !== "all" && r.scope_type !== scopeFilter) return false;

      // Auth Filter
      if (authFilter === "authorized" && !r.is_authorized) return false;
      if (authFilter === "restricted" && r.is_authorized) return false;

      return true;
    });
  }, [rules, searchQuery, scopeFilter, authFilter]);

  // Executive KPI Stats computed from rules
  const stats = useMemo(() => {
    const total = rules.length;
    const authorized = rules.filter((r) => r.is_authorized).length;
    const restricted = rules.filter((r) => !r.is_authorized).length;
    const uniqueFranchisees = new Set(rules.map((r) => r.reseller_id || r.reseller?.id)).size;

    return { total, authorized, restricted, uniqueFranchisees };
  }, [rules]);

  const activeFiltersCount =
    (selectedResellerId !== "all" ? 1 : 0) +
    (searchQuery ? 1 : 0) +
    (scopeFilter !== "all" ? 1 : 0) +
    (authFilter !== "all" ? 1 : 0);

  const resetFilters = () => {
    setSelectedResellerId("all");
    setSearchQuery("");
    setScopeFilter("all");
    setAuthFilter("all");
  };

  return (
    <div className="p-6 space-y-6 bg-slate-50/60 min-h-screen text-slate-800">
      {/* ── 1. Top Header & Action Bar ── */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/90 shadow-xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-blue-700 text-white flex items-center justify-center shadow-md shadow-blue-700/20">
              <FiShield size={22} />
            </div>
            <div>
              <h1 className="text-xl lg:text-2xl font-extrabold text-slate-900 tracking-tight">
                Franchise Product & Kit Authorization Matrix
              </h1>
              <p className="text-xs lg:text-sm text-slate-500 font-medium">
                Manage solar combo kit authorizations, whitelist exclusive kits, and inspect franchise inventory
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={fetchRules}
            disabled={loading}
            className="flex items-center gap-2 px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all border border-slate-200"
            title="Refresh rules list"
          >
            <FiRefreshCw className={loading ? "animate-spin" : ""} size={14} />
            <span>Refresh</span>
          </button>


          <button
            onClick={() => setModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-700 hover:bg-blue-800 text-white rounded-xl text-xs lg:text-sm font-bold shadow-md shadow-blue-700/20 hover:shadow-lg transition-all"
          >
            <FiPlus size={16} />
            <span>Add Authorization Rule</span>
          </button>
        </div>
      </div>

      {/* ── 2. Executive KPI Metric Cards (Clean Light Theme) ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Rules */}
        <div className="bg-white p-4.5 rounded-2xl border border-slate-200/90 shadow-xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center flex-shrink-0">
            <FiShield size={20} />
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Rules</div>
            <div className="text-2xl font-black text-slate-900 mt-0.5">{stats.total}</div>
          </div>
        </div>

        {/* Whitelisted Kits */}
        <div className="bg-white p-4.5 rounded-2xl border border-slate-200/90 shadow-xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center flex-shrink-0">
            <FiCheckCircle size={20} />
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Whitelisted</div>
            <div className="text-2xl font-black text-emerald-700 mt-0.5">
              {stats.authorized}{" "}
              <span className="text-xs font-bold text-slate-400">
                ({stats.total > 0 ? Math.round((stats.authorized / stats.total) * 100) : 0}%)
              </span>
            </div>
          </div>
        </div>

        {/* Restricted Kits */}
        <div className="bg-white p-4.5 rounded-2xl border border-slate-200/90 shadow-xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-rose-50 text-rose-700 flex items-center justify-center flex-shrink-0">
            <FiXCircle size={20} />
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Restricted</div>
            <div className="text-2xl font-black text-rose-700 mt-0.5">{stats.restricted}</div>
          </div>
        </div>

        {/* Franchise Partners */}
        <div className="bg-white p-4.5 rounded-2xl border border-slate-200/90 shadow-xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center flex-shrink-0">
            <FiUser size={20} />
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Franchises</div>
            <div className="text-2xl font-black text-indigo-700 mt-0.5">{stats.uniqueFranchisees}</div>
          </div>
        </div>
      </div>

      {/* ── 3. Filters & View Switcher Bar ── */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs space-y-3.5">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Franchisee Selector */}
          <div className="flex items-center gap-2 flex-1 max-w-md">
            <label className="text-xs font-bold text-slate-600 uppercase tracking-wider flex-shrink-0">Franchise:</label>
            <select
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-slate-50 text-slate-900 text-xs font-bold focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
              value={selectedResellerId}
              onChange={(e) => setSelectedResellerId(e.target.value)}
            >
              <option value="all">🌟 All Franchisees (Cross-Network Matrix)</option>
              {resellers.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.business_name} {r.city ? `• ${r.city}` : ""} ({r.email})
                </option>
              ))}
            </select>
          </div>

          {/* Search Box */}
          <div className="relative flex-1 max-w-sm">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
            <input
              type="text"
              placeholder="Search kit, SKU, franchise, or note..."
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 bg-slate-50/70 text-slate-900 text-xs font-medium focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <FiXCircle size={14} />
              </button>
            )}
          </div>

          {/* View Toggle Button: Big Cards vs Table */}
          <div className="inline-flex p-1 rounded-xl bg-slate-100 border border-slate-200 self-start md:self-auto">
            <button
              onClick={() => setViewMode("cards")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                viewMode === "cards"
                  ? "bg-white text-blue-700 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <FiGrid size={14} />
              <span>Big Card Format</span>
            </button>
            <button
              onClick={() => setViewMode("table")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                viewMode === "table"
                  ? "bg-white text-blue-700 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <FiList size={14} />
              <span>Table View</span>
            </button>
          </div>
        </div>

        {/* Filter Pills Bar */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 text-xs font-semibold">
          <span className="text-slate-400 flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider">
            <FiFilter size={12} /> Filters:
          </span>

          {/* Scope Filter */}
          <select
            className="px-2.5 py-1 rounded-lg border border-slate-200 bg-white text-slate-700 text-xs font-medium focus:ring-1 focus:ring-blue-500"
            value={scopeFilter}
            onChange={(e) => setScopeFilter(e.target.value)}
          >
            <option value="all">All Scopes</option>
            <option value="kit">Combo Kits Only</option>
            <option value="product">Products (SKU)</option>
            <option value="category">Category Scope</option>
          </select>

          {/* Auth State Filter */}
          <select
            className="px-2.5 py-1 rounded-lg border border-slate-200 bg-white text-slate-700 text-xs font-medium focus:ring-1 focus:ring-blue-500"
            value={authFilter}
            onChange={(e) => setAuthFilter(e.target.value)}
          >
            <option value="all">All Rule Modes</option>
            <option value="authorized">Whitelist (Authorized)</option>
            <option value="restricted">Blacklist (Restricted)</option>
          </select>

          {activeFiltersCount > 0 && (
            <button
              onClick={resetFilters}
              className="text-[11px] font-bold text-rose-600 hover:text-rose-700 underline ml-auto transition-colors"
            >
              Reset Filters ({activeFiltersCount})
            </button>
          )}
        </div>
      </div>

      {/* ── 4. Main Content Area ── */}
      {loading ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-20 flex flex-col items-center justify-center gap-3 text-slate-400">
          <FiLoader className="animate-spin text-blue-600" size={28} />
          <span className="text-sm font-semibold text-slate-600">Loading franchise kit authorization rules...</span>
        </div>
      ) : filteredRules.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-16 flex flex-col items-center justify-center text-center gap-3">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400">
            <FiBox size={30} />
          </div>
          <h3 className="text-base font-bold text-slate-800">No authorization rules found</h3>
          <p className="text-xs text-slate-500 max-w-md">
            {activeFiltersCount > 0
              ? "No authorization rules matched your current search or filter criteria. Try resetting filters."
              : "No authorization rules have been configured for the selected franchise yet."}
          </p>
          <div className="flex items-center gap-3 mt-2">
            {activeFiltersCount > 0 ? (
              <button
                onClick={resetFilters}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700"
              >
                Clear Filters
              </button>
            ) : (
              <button
                onClick={() => setModal(true)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-blue-700 hover:bg-blue-800 text-white shadow-sm"
              >
                <FiPlus className="inline mr-1" /> Add Rule Now
              </button>
            )}
          </div>
        </div>
      ) : viewMode === "cards" ? (
        /* ════════════════════════════════════════════════════════════
           BIG CARD FORMAT VIEW
           ════════════════════════════════════════════════════════════ */
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          <AnimatePresence>
            {filteredRules.map((r) => {
              const scopeConfig = SCOPE_CONFIG[r.scope_type] || SCOPE_CONFIG.kit;
              const ScopeIcon = scopeConfig.icon;

              let targetName = "All Solar Kits & Combo Kits";
              let targetCode = "";
              if (r.scope_type === "kit") {
                targetName = r.kit?.kit_name || r.kit?.name || "Combo Kit Scope";
                targetCode = r.kit?.kit_code || "";
              } else if (r.scope_type === "product") {
                targetName = r.product?.name || "Product Scope";
                targetCode = r.product?.sku_code ? `SKU: ${r.product.sku_code}` : "";
              } else if (r.scope_type === "subcategory") {
                targetName = r.subcategory?.name || "Subcategory Scope";
              } else if (r.scope_type === "category") {
                targetName = r.category?.name || "Category Scope";
              }

              const franchiseName = r.reseller?.business_name || "Franchise Partner";
              const franchiseCity = r.reseller?.city || r.reseller?.address?.city;
              const franchiseEmail = r.reseller?.email;
              const industryName = r.allowed_industry_type_ids?.[0]?.name;

              return (
                <motion.div
                  key={r.id}
                  layout
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-white rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-md hover:border-slate-300 transition-all flex flex-col justify-between overflow-hidden"
                >
                  {/* Card Header: Franchisee Info & Scope Pill */}
                  <div className="p-5 pb-4 border-b border-slate-100 bg-slate-50/50">
                    <div className="flex items-start justify-between gap-3">
                      {/* Franchise Profile */}
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-700 to-indigo-800 text-white flex items-center justify-center font-black text-sm flex-shrink-0 shadow-xs">
                          {franchiseName.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-sm font-extrabold text-slate-900 truncate" title={franchiseName}>
                            {franchiseName}
                          </h4>
                          <div className="flex items-center gap-1.5 text-xs text-slate-500">
                            {franchiseCity && (
                              <span className="inline-flex items-center gap-0.5 text-slate-600 font-medium">
                                <FiMapPin size={11} className="text-slate-400" />
                                {franchiseCity}
                              </span>
                            )}
                            {franchiseCity && franchiseEmail && <span>•</span>}
                            {franchiseEmail && <span className="truncate">{franchiseEmail}</span>}
                          </div>
                        </div>
                      </div>

                      {/* Scope Badge */}
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold border flex-shrink-0 ${scopeConfig.badgeBg}`}
                      >
                        <ScopeIcon size={12} />
                        {scopeConfig.label}
                      </span>
                    </div>
                  </div>

                  {/* Card Body: Equipment Name, Auth Status & Stock */}
                  <div className="p-5 space-y-4 flex-1">
                    {/* Hero Equipment Title */}
                    <div>
                      <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                        Equipment / Item
                      </div>
                      <h3 className="text-base font-extrabold text-slate-900 leading-snug line-clamp-2" title={targetName}>
                        {targetName}
                      </h3>
                      <div className="flex flex-wrap items-center gap-2 mt-1.5">
                        {targetCode && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[11px] font-mono font-semibold">
                            <FiTag size={10} /> {targetCode}
                          </span>
                        )}
                        {industryName && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 text-[11px] font-semibold">
                            {industryName}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Authorization Status Badge */}
                    <div>
                      <AuthStatusBadge isAuthorized={r.is_authorized} />
                    </div>

                    {/* Override Reason / Notes */}
                    {r.override_reason ? (
                      <div className="p-3 rounded-xl bg-slate-100/70 border border-slate-200/60 text-xs text-slate-600 space-y-1">
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                          <FiInfo size={11} /> Admin Note
                        </div>
                        <p className="line-clamp-2 italic">"{r.override_reason}"</p>
                      </div>
                    ) : null}
                  </div>

                  {/* Card Footer: Metadata & Actions */}
                  <div className="px-5 py-3.5 border-t border-slate-100 bg-slate-50/40 flex items-center justify-between">
                    <div className="text-[11px] text-slate-400">
                      {r.created_at ? new Date(r.created_at).toLocaleDateString() : "Active Rule"}
                    </div>

                    <div className="flex items-center gap-1">
                      {r.status === "active" && (
                        <button
                          onClick={() => handleRevoke(r.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          title="Revoke Rule"
                        >
                          <FiTrash2 size={16} />
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      ) : (
        /* ════════════════════════════════════════════════════════════
           TABLE VIEW FORMAT
           ════════════════════════════════════════════════════════════ */
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-700">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 text-xs font-bold text-slate-500 uppercase tracking-wider">
                  <th className="px-5 py-3.5">Franchisee Account</th>
                  <th className="px-5 py-3.5">Scope</th>
                  <th className="px-5 py-3.5">Target Equipment / Kit</th>
                  <th className="px-5 py-3.5 text-center">Auth Rule</th>
                  <th className="px-5 py-3.5 hidden lg:table-cell">Reason / Notes</th>
                  <th className="px-5 py-3.5 text-center">Status</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRules.map((r) => {
                  const scopeConfig = SCOPE_CONFIG[r.scope_type] || SCOPE_CONFIG.kit;
                  const ScopeIcon = scopeConfig.icon;

                  let targetName = "All Solar Kits & Combo Kits";
                  let targetCode = "";
                  if (r.scope_type === "kit") {
                    targetName = r.kit?.kit_name || r.kit?.name || "Combo Kit Scope";
                    targetCode = r.kit?.kit_code || "";
                  } else if (r.scope_type === "product") {
                    targetName = r.product?.name || "Product Scope";
                    targetCode = r.product?.sku_code ? `SKU: ${r.product.sku_code}` : "";
                  } else if (r.scope_type === "subcategory") {
                    targetName = r.subcategory?.name || "Subcategory Scope";
                  } else if (r.scope_type === "category") {
                    targetName = r.category?.name || "Category Scope";
                  }

                  const franchiseName = r.reseller?.business_name || "Franchise Partner";
                  const franchiseCity = r.reseller?.city || r.reseller?.address?.city;
                  const franchiseEmail = r.reseller?.email;
                  const industryName = r.allowed_industry_type_ids?.[0]?.name;

                  return (
                    <tr key={r.id} className="hover:bg-slate-50/60 transition-colors">
                      {/* Franchise */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-blue-700 text-white flex items-center justify-center font-bold text-xs flex-shrink-0">
                            {franchiseName.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-extrabold text-slate-900 leading-tight">{franchiseName}</div>
                            <div className="text-xs text-slate-400 mt-0.5">
                              {franchiseCity ? `${franchiseCity} • ` : ""}
                              {franchiseEmail || "—"}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Scope */}
                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border ${scopeConfig.badgeBg}`}
                        >
                          <ScopeIcon size={12} />
                          {scopeConfig.label}
                        </span>
                      </td>

                      {/* Target Equipment */}
                      <td className="px-5 py-4">
                        <div className="font-bold text-slate-900 leading-tight">{targetName}</div>
                        <div className="flex items-center gap-2 mt-1">
                          {targetCode && (
                            <span className="text-[11px] font-mono font-semibold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">
                              {targetCode}
                            </span>
                          )}
                          {industryName && (
                            <span className="text-[11px] font-semibold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded">
                              {industryName}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Auth Rule */}
                      <td className="px-5 py-4 text-center">
                        <AuthStatusBadge isAuthorized={r.is_authorized} size="small" />
                      </td>

                      {/* Reason / Notes */}
                      <td className="px-5 py-4 hidden lg:table-cell max-w-xs">
                        {r.override_reason ? (
                          <span className="text-xs text-slate-600 truncate block" title={r.override_reason}>
                            {r.override_reason}
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400 italic">—</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="px-5 py-4 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize ${
                            r.status === "active" ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"
                          }`}
                        >
                          {r.status}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {r.status === "active" && (
                            <button
                              onClick={() => handleRevoke(r.id)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                              title="Revoke Rule"
                            >
                              <FiTrash2 size={15} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Table Footer */}
          <div className="px-5 py-3 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between text-xs text-slate-500 font-semibold">
            <span>
              Showing <strong>{filteredRules.length}</strong> of <strong>{rules.length}</strong> authorization rules
            </span>
            {selectedResellerId !== "all" && (
              <button onClick={() => setSelectedResellerId("all")} className="text-blue-600 hover:underline">
                View All Franchisees
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── 5. Modals ── */}
      <AnimatePresence>
        {modal && (
          <AssignAuthModal
            resellers={resellers}
            defaultResellerId={selectedResellerId}
            onClose={() => setModal(false)}
            onAssigned={handleAssigned}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
