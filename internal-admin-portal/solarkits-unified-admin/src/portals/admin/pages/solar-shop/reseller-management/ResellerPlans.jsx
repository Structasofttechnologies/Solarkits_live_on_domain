import { useState, useEffect, useCallback, useMemo } from "react";
import { useDispatch } from "react-redux";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import {
  FiFileText,
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiToggleLeft,
  FiToggleRight,
  FiSearch,
  FiAlertCircle,
  FiLoader,
  FiCheck,
  FiX,
  FiGlobe,
  FiMap,
  FiMapPin,
  FiHome,
  FiZap,
  FiPackage,
  FiTruck,
  FiLayers,
  FiBox,
} from "react-icons/fi";
import { authHeaderObj } from "@/app/authHeader";
import { setAlert } from "../../../features/alert.slice";
import Dropdown from "@/components/Dropdown";
import Button from "@/components/Button";

const API_BASE = import.meta.env.VITE_API_URL;
const MODULE_UID = "RSL_PLAN";

const apiFetch = (method, endpoint, data) =>
  axios({ method, url: `${API_BASE}/resellers/plans${endpoint}`, headers: authHeaderObj(), data });

const TERRITORY_LEVELS = [
  { value: "district", label: "District Level", icon: FiMapPin, color: "text-primary", bg: "bg-info-soft" },
  { value: "state", label: "State Level", icon: FiMap, color: "text-success", bg: "bg-success-soft" },
  { value: "country", label: "Country Level", icon: FiGlobe, color: "text-warning", bg: "bg-warning-soft" },
];

const ORDER_TYPES = [
  { value: "both", label: "Both (PO & Loose)", description: "Allows both bulk Purchase Orders & on-demand loose kits", icon: FiPackage },
  { value: "po_order", label: "PO Order Only", description: "Strict Purchase Order fulfillment with scheduled lead-time", icon: FiFileText },
  { value: "loose_order", label: "Loose Order Only", description: "Direct individual kit / loose components on-demand dispatch", icon: FiTruck },
];

function TerritoryLevelBadge({ level }) {
  const cfg = TERRITORY_LEVELS.find((t) => t.value === level) || TERRITORY_LEVELS[0];
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${cfg.bg} ${cfg.color} border border-current/20`}>
      <Icon size={11} /> {cfg.label}
    </span>
  );
}

function WarehouseBadge({ required, count, sqft }) {
  if (!required) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-surface-hover text-text-muted border border-border">
        <FiHome size={10} /> No WH Req.
      </span>
    );
  }
  return (
    <div className="flex flex-col items-start gap-0.5">
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-info-soft text-primary border border-primary/20">
        <FiHome size={11} /> {count || 1} Warehouse{count > 1 ? "s" : ""}
      </span>
      {sqft > 0 && (
        <span className="text-[10px] text-text-muted font-medium pl-1">
          {Number(sqft).toLocaleString("en-IN")} sq. ft.
        </span>
      )}
    </div>
  );
}

function MoqBadge({ capacityKw, kitsCount, projectType, comboKitsDisplay }) {
  return (
    <div className="flex flex-col items-start gap-0.5 max-w-[220px]">
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-warning-soft text-warning border border-warning/20">
        <FiZap size={11} /> Up to {Number(capacityKw || 10000).toLocaleString("en-IN")} kW
      </span>
      <span className="text-[10px] text-text-muted font-medium pl-1">
        MOQ: {kitsCount || 1} Kit(s)
      </span>
      {projectType && (
        <span className="text-[10px] text-text-secondary font-semibold pl-1 line-clamp-1" title={projectType}>
          🏗️ {projectType}
        </span>
      )}
      {comboKitsDisplay && comboKitsDisplay !== "All Admin Combo Kits" && (
        <span className="text-[9px] text-[#0575B8] font-semibold pl-1 line-clamp-1" title={comboKitsDisplay}>
          📦 {comboKitsDisplay}
        </span>
      )}
    </div>
  );
}

function OrderTypeBadge({ orderType }) {
  const type = orderType || "both";
  if (type === "po_order") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
        <FiFileText size={10} /> PO Only
      </span>
    );
  }
  if (type === "loose_order") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
        <FiTruck size={10} /> Loose Only
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
      <FiPackage size={10} /> Both (PO + Loose)
    </span>
  );
}

function StatusBadge({ isActive }) {
  return isActive ? (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-success-soft text-success border border-success/20">
      <FiCheck size={10} /> Active
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-danger-soft text-danger border border-danger/20">
      <FiX size={10} /> Inactive
    </span>
  );
}

function FormModal({ mode, initial, onClose, onSaved }) {
  const dispatch = useDispatch();
  const [configOptions, setConfigOptions] = useState({
    industry_types: [],
    project_types: [],
    categories: [],
    subcategories: [],
    system_types: [],
    project_ranges: [],
    combo_kits: [],
  });
  const [loadingOptions, setLoadingOptions] = useState(true);

  // Quick Filters State
  const [filters, setFilters] = useState({
    industryType: "all",
    category: "all",
    subCategory: "all",
    systemType: "all",
    projectRange: "all",
  });

  // Normalize initial project type and combo kit IDs
  const initialProjectTypeIds = (initial?.allowed_project_types || initial?.allowed_project_type_ids || [])
    .map((pt) => (pt?._id ? pt._id : pt?.id ? pt.id : String(pt)));

  const initialComboKitIds = (initial?.allowed_combo_kits || initial?.allowed_combo_kit_ids || [])
    .map((ck) => (ck?._id ? ck._id : ck?.id ? ck.id : String(ck)));

  const [form, setForm] = useState({
    name: initial?.name || "",
    territory_level: initial?.territory_level || "district",
    one_time_fee: initial?.one_time_fee ?? 0,
    validity_value: initial?.validity_value ?? 1,
    validity_unit: initial?.validity_unit || "years",
    allowed_territories_count: initial?.allowed_territories_count ?? 1,

    // Project Configuration & Combo Kits
    allowed_project_type_ids: initialProjectTypeIds,
    allowed_combo_kit_ids: initialComboKitIds,

    // 1. Warehouse Requirements
    warehouse_required: initial?.warehouse_required ?? false,
    warehouse_count: initial?.warehouse_count ?? 0,
    warehouse_space_sqft: initial?.warehouse_space_sqft ?? 0,

    // 2. MOQ & Capacity Specifications
    moq_capacity_kw: initial?.moq_capacity_kw ?? 10000,
    moq_kits_count: initial?.moq_kits_count ?? 1,
    moq_project_type: initial?.moq_project_type || "All Kit Types",
    moq_description: initial?.moq_description || "",

    // 3. Order Type Support
    order_type_allowed: initial?.order_type_allowed || "both",

    // 4. Fixed Dealer Margin & Commission
    default_dealer_margin: initial?.default_dealer_margin ?? 5,
    default_commission_rate: initial?.default_commission_rate ?? 8,

    description: initial?.description || "",
    sort_order: initial?.sort_order ?? 0,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setLoadingOptions(true);
    axios
      .get(`${API_BASE}/resellers/plans/config-options?unique_id=${MODULE_UID}&req_for=view`, { headers: authHeaderObj() })
      .then((res) => {
        if (res.data?.status === "success") {
          setConfigOptions(res.data.data);
        }
      })
      .catch((err) => console.error("Could not fetch plan config options:", err))
      .finally(() => setLoadingOptions(false));
  }, []);

  const clearMainFilters = () => {
    setFilters({
      industryType: "all",
      category: "all",
      subCategory: "all",
      systemType: "all",
      projectRange: "all",
    });
  };

  const industryTypeOptions = useMemo(() => {
    const list = (configOptions.industry_types || []).map((ind) => ({
      value: String(ind.id),
      text: ind.name,
    }));
    return [{ value: "all", text: "All Industry Types" }, ...list];
  }, [configOptions.industry_types]);

  const categoryOptions = useMemo(() => {
    let cats = configOptions.categories || [];
    if (filters.industryType && filters.industryType !== "all") {
      cats = cats.filter((c) => String(c.industry_type_id) === String(filters.industryType));
    }
    const list = cats.map((c) => ({
      value: String(c.id),
      text: c.name,
    }));
    return [{ value: "all", text: "All Categories" }, ...list];
  }, [configOptions.categories, filters.industryType]);

  const subCategoryOptions = useMemo(() => {
    let subs = configOptions.subcategories || [];
    if (filters.category && filters.category !== "all") {
      subs = subs.filter((s) => String(s.category_id) === String(filters.category));
    } else if (filters.industryType && filters.industryType !== "all") {
      const validCatIds = new Set(
        (configOptions.categories || [])
          .filter((c) => String(c.industry_type_id) === String(filters.industryType))
          .map((c) => String(c.id))
      );
      subs = subs.filter((s) => validCatIds.has(String(s.category_id)));
    }
    const list = subs.map((s) => ({
      value: String(s.id),
      text: s.name,
    }));
    return [{ value: "all", text: "All Sub-Categories" }, ...list];
  }, [configOptions.subcategories, configOptions.categories, filters.category, filters.industryType]);

  const systemTypeOptions = useMemo(() => {
    let types = configOptions.system_types || [];
    if (filters.subCategory && filters.subCategory !== "all") {
      types = types.filter((t) => String(t.subcategory_id) === String(filters.subCategory));
    }
    const list = types.map((t) => ({
      value: String(t.id),
      text: t.name,
    }));
    return [{ value: "all", text: "All System Types" }, ...list];
  }, [configOptions.system_types, filters.subCategory]);

  const projectRangeOptions = useMemo(() => {
    let ranges = configOptions.project_ranges || [];
    if (filters.systemType && filters.systemType !== "all") {
      ranges = ranges.filter((r) => String(r.subcategory_type_id) === String(filters.systemType));
    }
    const list = ranges.map((r) => ({
      value: String(r.id),
      text: r.label || `${r.min_value} - ${r.max_value} ${r.unit_symbol || "kW"}`,
    }));
    return [{ value: "all", text: "All Project Ranges" }, ...list];
  }, [configOptions.project_ranges, filters.systemType]);

  const isFilterActive =
    filters.industryType !== "all" ||
    filters.category !== "all" ||
    filters.subCategory !== "all" ||
    filters.systemType !== "all" ||
    filters.projectRange !== "all";

  const filteredComboKits = useMemo(() => {
    const allKits = configOptions.combo_kits || [];
    return allKits.filter((kit) => {
      if (filters.industryType !== "all" && kit.industry_type_id && String(kit.industry_type_id) !== String(filters.industryType)) {
        return false;
      }
      if (filters.category !== "all" && kit.category_id && String(kit.category_id) !== String(filters.category)) {
        return false;
      }
      if (filters.subCategory !== "all" && kit.subcategory_id && String(kit.subcategory_id) !== String(filters.subCategory)) {
        return false;
      }
      if (filters.systemType !== "all" && kit.system_type_id && String(kit.system_type_id) !== String(filters.systemType)) {
        return false;
      }
      if (filters.projectRange !== "all" && kit.project_range_id && String(kit.project_range_id) !== String(filters.projectRange)) {
        return false;
      }
      return true;
    });
  }, [configOptions.combo_kits, filters]);

  const toggleProjectType = (typeId) => {
    setForm((prev) => {
      const exists = prev.allowed_project_type_ids.includes(typeId);
      const nextIds = exists
        ? prev.allowed_project_type_ids.filter((id) => id !== typeId)
        : [...prev.allowed_project_type_ids, typeId];

      const selectedNames = (configOptions.project_types || [])
        .filter((t) => nextIds.includes(t.id))
        .map((t) => t.name);

      return {
        ...prev,
        allowed_project_type_ids: nextIds,
        moq_project_type: selectedNames.length > 0 ? selectedNames.join(", ") : "All Kit Types",
      };
    });
  };

  const toggleAllProjectTypes = () => {
    const allTypes = configOptions.project_types || [];
    if (form.allowed_project_type_ids.length === allTypes.length) {
      setForm((prev) => ({ ...prev, allowed_project_type_ids: [], moq_project_type: "All Kit Types" }));
    } else {
      const allIds = allTypes.map((t) => t.id);
      setForm((prev) => ({
        ...prev,
        allowed_project_type_ids: allIds,
        moq_project_type: allTypes.map((t) => t.name).join(", "),
      }));
    }
  };

  const toggleComboKit = (kitId) => {
    setForm((prev) => {
      const exists = prev.allowed_combo_kit_ids.includes(kitId);
      const nextIds = exists
        ? prev.allowed_combo_kit_ids.filter((id) => id !== kitId)
        : [...prev.allowed_combo_kit_ids, kitId];
      return {
        ...prev,
        allowed_combo_kit_ids: nextIds,
      };
    });
  };

  const toggleAllComboKits = () => {
    const targetKits = isFilterActive ? filteredComboKits : (configOptions.combo_kits || []);
    const targetIds = targetKits.map((k) => k.id);
    const allTargetSelected = targetIds.length > 0 && targetIds.every((id) => form.allowed_combo_kit_ids.includes(id));

    setForm((prev) => {
      if (allTargetSelected) {
        return {
          ...prev,
          allowed_combo_kit_ids: prev.allowed_combo_kit_ids.filter((id) => !targetIds.includes(id)),
        };
      } else {
        return {
          ...prev,
          allowed_combo_kit_ids: Array.from(new Set([...prev.allowed_combo_kit_ids, ...targetIds])),
        };
      }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      const isEdit = mode === "edit";
      const endpoint = isEdit
        ? `/update?req_for=edit&unique_id=${MODULE_UID}`
        : `/add?req_for=add&unique_id=${MODULE_UID}`;
      const payload = {
        ...(isEdit && { id: initial.id }),
        name: form.name.trim(),
        territory_level: form.territory_level,
        one_time_fee: Number(form.one_time_fee),
        validity_value: Number(form.validity_value),
        validity_unit: form.validity_unit,
        allowed_territories_count: Number(form.allowed_territories_count),

        // Project Types & Combo Kits from Admin
        allowed_project_type_ids: form.allowed_project_type_ids,
        allowed_combo_kit_ids: form.allowed_combo_kit_ids,

        // 1. Warehouse Specs
        warehouse_required: Boolean(form.warehouse_required),
        warehouse_count: Number(form.warehouse_count || 0),
        warehouse_space_sqft: Number(form.warehouse_space_sqft || 0),

        // 2. MOQ & Capacity Specs
        moq_capacity_kw: Number(form.moq_capacity_kw || 10000),
        moq_kits_count: Number(form.moq_kits_count || 1),
        moq_project_type: form.moq_project_type.trim(),
        moq_description: form.moq_description.trim() || null,

        // 3. Order Type Support
        order_type_allowed: form.order_type_allowed,

        // 4. Fixed Dealer Margin & Commission
        default_dealer_margin: Number(form.default_dealer_margin || 0),
        default_commission_rate: Number(form.default_commission_rate || 0),

        description: form.description.trim() || null,
        sort_order: Number(form.sort_order),
      };
      const res = await apiFetch(isEdit ? "put" : "post", endpoint, payload);
      if (res.data?.status === "success") {
        dispatch(setAlert({ type: "success", message: `Franchisee plan ${isEdit ? "updated" : "created"}` }));
        onSaved(res.data.data);
        onClose();
      } else {
        dispatch(setAlert({ type: "error", message: res.data?.message || "Operation failed" }));
      }
    } catch (err) {
      dispatch(setAlert({ type: "error", message: err.response?.data?.message || "Save failed" }));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-surface rounded-2xl shadow-2xl border border-border w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-bg/50">
          <div>
            <h3 className="text-lg font-bold text-text-primary">
              {mode === "edit" ? "Edit Franchisee Plan" : "Create Franchisee Plan"}
            </h3>
            <p className="text-xs text-text-muted mt-0.5">
              Select Admin-configured Project Types, Combo Kits, Warehouse rules, MOQ capacity, and Order fulfillment
            </p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-surface-hover text-text-muted transition-colors">
            <FiX size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto max-h-[75vh] scrollbar-hover">
          {/* Section 1: Basic Plan Info */}
          <div className="space-y-4">
            <h4 className="text-xs font-black uppercase tracking-wider text-primary flex items-center gap-1.5 pb-1 border-b border-border">
              <FiFileText size={14} /> Plan Identity & Territory Tier
            </h4>

            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1">Plan Name <span className="text-danger">*</span></label>
              <input
                type="text"
                className="w-full px-3 py-2 rounded-xl border border-border bg-bg text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                placeholder="e.g. Gold District Partner Plan"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1.5">Territory Scope Level <span className="text-danger">*</span></label>
              <div className="grid grid-cols-3 gap-2">
                {TERRITORY_LEVELS.map((t) => {
                  const Icon = t.icon;
                  const sel = form.territory_level === t.value;
                  return (
                    <button
                      key={t.value}
                      type="button"
                      onClick={() => setForm({ ...form, territory_level: t.value })}
                      className={`flex flex-col items-center gap-1 p-2.5 rounded-xl border-2 text-xs font-semibold transition-all ${sel ? "border-primary bg-info-soft text-primary" : "border-border bg-bg text-text-secondary hover:border-primary/30"
                        }`}
                    >
                      <Icon size={16} className={sel ? "text-primary" : "text-text-muted"} />
                      {t.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1">One-Time License Fee (₹)</label>
                <input
                  type="number"
                  className="w-full px-3 py-2 rounded-xl border border-border bg-bg text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                  value={form.one_time_fee}
                  onChange={(e) => setForm({ ...form, one_time_fee: e.target.value })}
                  min={0}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1">Allowed Territories Count</label>
                <input
                  type="number"
                  className="w-full px-3 py-2 rounded-xl border border-border bg-bg text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                  value={form.allowed_territories_count}
                  onChange={(e) => setForm({ ...form, allowed_territories_count: e.target.value })}
                  min={1}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1">Validity Duration</label>
                <input
                  type="number"
                  className="w-full px-3 py-2 rounded-xl border border-border bg-bg text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                  value={form.validity_value}
                  onChange={(e) => setForm({ ...form, validity_value: e.target.value })}
                  min={1}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1">Validity Unit</label>
                <select
                  className="w-full px-3 py-2 rounded-xl border border-border bg-bg text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                  value={form.validity_unit}
                  onChange={(e) => setForm({ ...form, validity_unit: e.target.value })}
                >
                  <option value="months">Month(s)</option>
                  <option value="years">Year(s)</option>
                </select>
              </div>
            </div>

            <div className="p-3.5 bg-sky-50/50 rounded-xl border border-sky-200">
              <label className="block text-xs font-bold text-slate-800 mb-1">
                Franchisee Commission Rate (%) <span className="text-danger">*</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.1"
                  min={0}
                  max={100}
                  className="w-full px-3 py-2 pr-8 rounded-xl border border-border bg-white text-text-primary text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="e.g. 8"
                  value={form.default_commission_rate}
                  onChange={(e) => setForm({ ...form, default_commission_rate: e.target.value })}
                  required
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">%</span>
              </div>
              <p className="text-[10px] text-text-muted mt-0.5">Fixed commission percentage credited to Franchisee on orders</p>
            </div>
          </div>

          {/* Section 2: Quick filter */}
          <div className="space-y-3 pt-3 border-t border-border">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FiPackage className="text-primary dark:text-info" size={16} />
                <h4 className="text-xs font-black uppercase tracking-wider text-text-primary dark:text-info">
                  Assign Industry & Category wise Combo Kits
                </h4>
                {isFilterActive && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary/10 text-primary border border-primary/20">
                    Filtered ({filteredComboKits.length} kits)
                  </span>
                )}
              </div>
              {isFilterActive && (
                <Button onClick={clearMainFilters} variant="link" size="sm" className="text-xs font-semibold">
                  Clear Filters
                </Button>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              <Dropdown
                label="Industry Type"
                options={industryTypeOptions}
                value={filters.industryType}
                onChange={(val) => setFilters((prev) => ({
                  ...prev,
                  industryType: val,
                  category: "all",
                  subCategory: "all",
                  systemType: "all",
                  projectRange: "all"
                }))}
                className="w-full"
              />
              <Dropdown
                label="Category"
                options={categoryOptions}
                value={filters.category}
                disabled={filters.industryType === "all" && categoryOptions.length <= 1}
                onChange={(val) => setFilters((prev) => ({
                  ...prev,
                  category: val,
                  subCategory: "all",
                  systemType: "all",
                  projectRange: "all"
                }))}
                className="w-full"
              />
              <Dropdown
                label="Sub Category"
                options={subCategoryOptions}
                value={filters.subCategory}
                disabled={filters.category === "all"}
                onChange={(val) => setFilters((prev) => ({
                  ...prev,
                  subCategory: val,
                  systemType: "all",
                  projectRange: "all"
                }))}
                className="w-full"
              />
              <Dropdown
                label="System Type"
                options={systemTypeOptions}
                value={filters.systemType}
                disabled={filters.subCategory === "all"}
                onChange={(val) => setFilters((prev) => ({
                  ...prev,
                  systemType: val,
                  projectRange: "all"
                }))}
                className="w-full"
              />
              <Dropdown
                label="Project Range"
                options={projectRangeOptions}
                value={filters.projectRange}
                disabled={filters.systemType === "all"}
                onChange={(val) => setFilters((prev) => ({
                  ...prev,
                  projectRange: val
                }))}
                className="w-full"
              />
            </div>
          </div>

          {/* Section 3: Admin Created Combo Kits */}
          <div className="space-y-3 pt-3 border-t border-border">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h4 className="text-xs font-black uppercase tracking-wider text-[#0575B8] flex items-center gap-1.5">
                  <FiBox size={14} /> Admin Created Combo Kits
                </h4>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary/10 text-primary border border-primary/20">
                  {form.allowed_combo_kit_ids.length} Selected
                </span>
                {isFilterActive && (
                  <span className="text-[10px] text-text-muted">
                    (Showing {filteredComboKits.length} of {configOptions.combo_kits?.length || 0})
                  </span>
                )}
              </div>
              {filteredComboKits.length > 0 && (
                <button
                  type="button"
                  onClick={toggleAllComboKits}
                  className="text-[11px] text-[#0575B8] font-bold hover:underline cursor-pointer"
                >
                  {filteredComboKits.every((k) => form.allowed_combo_kit_ids.includes(k.id))
                    ? isFilterActive ? "Deselect Filtered" : "Deselect All"
                    : isFilterActive ? "Select Filtered" : "Select All Kits"}
                </button>
              )}
            </div>
            <p className="text-[11px] text-text-muted">
              Select specific Admin Combo Kits covered under this franchisee plan's MOQ and authorization:
            </p>

            {loadingOptions ? (
              <div className="flex items-center gap-2 py-6 justify-center text-xs text-text-muted">
                <FiLoader className="animate-spin" size={16} /> Loading combo kits...
              </div>
            ) : filteredComboKits.length === 0 ? (
              <div className="py-6 text-center text-xs text-text-muted bg-surface-hover/40 rounded-xl border border-dashed border-border p-4">
                <p className="font-medium">
                  {configOptions.combo_kits?.length === 0
                    ? "No combo kits created yet in Admin Panel."
                    : "No combo kits match the selected quick filters."}
                </p>
                {isFilterActive && (
                  <button
                    type="button"
                    onClick={clearMainFilters}
                    className="mt-2 text-primary font-bold hover:underline cursor-pointer"
                  >
                    Reset Quick Filters
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-52 overflow-y-auto pr-1">
                {filteredComboKits.map((kit) => {
                  const isSelected = form.allowed_combo_kit_ids.includes(kit.id);
                  return (
                    <button
                      key={kit.id}
                      type="button"
                      onClick={() => toggleComboKit(kit.id)}
                      className={`p-2.5 rounded-xl text-left border text-xs transition-all flex items-center justify-between gap-2 cursor-pointer ${isSelected
                        ? "bg-sky-50 border-[#0575B8] text-[#0575B8] ring-1 ring-[#0575B8]"
                        : "bg-bg border-border text-text-secondary hover:border-[#0575B8]/40 hover:bg-surface-hover"
                        }`}
                    >
                      <div className="truncate">
                        <div className="font-bold truncate">{kit.name}</div>
                        <div className="text-[10px] text-text-muted flex items-center gap-1.5 mt-0.5">
                          <span>{kit.capacity_kw ? `${kit.capacity_kw} kW` : 'Standard Kit'}</span>
                          {kit.category_name && <span>• {kit.category_name}</span>}
                          {kit.subcategory_name && <span>• {kit.subcategory_name}</span>}
                          {kit.project_range_label && <span>• {kit.project_range_label}</span>}
                        </div>
                      </div>
                      {isSelected && <FiCheck className="shrink-0 text-[#0575B8]" size={14} />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Section 4: 1. Warehouse Requirements */}
          <div className="space-y-3 pt-3 border-t border-border">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-black uppercase tracking-wider text-[#0575B8] flex items-center gap-1.5">
                <FiHome size={14} /> 1. Warehouse Infrastructure Requirements
              </h4>
              <label className="inline-flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.warehouse_required}
                  onChange={(e) => setForm({
                    ...form,
                    warehouse_required: e.target.checked,
                    warehouse_count: e.target.checked ? (form.warehouse_count || 1) : 0,
                    warehouse_space_sqft: e.target.checked ? (form.warehouse_space_sqft || 1000) : 0,
                  })}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-bg peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary border border-border relative"></div>
                <span className="text-xs font-semibold text-text-primary">
                  {form.warehouse_required ? "Warehouse Required" : "No Warehouse Needed"}
                </span>
              </label>
            </div>

            {form.warehouse_required && (
              <div className="grid grid-cols-2 gap-3 p-3.5 bg-bg/70 rounded-xl border border-border">
                <div>
                  <label className="block text-xs font-semibold text-text-secondary mb-1">
                    Number of Warehouses Required
                  </label>
                  <input
                    type="number"
                    className="w-full px-3 py-2 rounded-xl border border-border bg-surface text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                    placeholder="e.g. 1 or 2"
                    value={form.warehouse_count}
                    onChange={(e) => setForm({ ...form, warehouse_count: e.target.value })}
                    min={1}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-text-secondary mb-1">
                    Minimum Space Required (Sq. Ft.)
                  </label>
                  <input
                    type="number"
                    className="w-full px-3 py-2 rounded-xl border border-border bg-surface text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                    placeholder="e.g. 2000 sq ft"
                    value={form.warehouse_space_sqft}
                    onChange={(e) => setForm({ ...form, warehouse_space_sqft: e.target.value })}
                    min={0}
                    step={100}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Section 5: 2. MOQ & Capacity Specifications */}
          <div className="space-y-3 pt-3 border-t border-border">
            <h4 className="text-xs font-black uppercase tracking-wider text-warning flex items-center gap-1.5">
              <FiZap size={14} /> 2. PO Order & Capacity Rules
            </h4>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1">
                  MOQ Capacity Limit (kW)
                </label>
                <input
                  type="number"
                  className="w-full px-3 py-2 rounded-xl border border-border bg-bg text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                  placeholder="e.g. 10000 kW (Up to 10,000 kW)"
                  value={form.moq_capacity_kw}
                  onChange={(e) => setForm({ ...form, moq_capacity_kw: e.target.value })}
                  min={0}
                  step={100}
                />
                <span className="text-[10px] text-text-muted mt-0.5 block">e.g. Up to 10,000 kW</span>
              </div>
              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1">
                  Minimum Order Kits Count (MOQ)
                </label>
                <input
                  type="number"
                  className="w-full px-3 py-2 rounded-xl border border-border bg-bg text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                  placeholder="e.g. 1 or 5 kits"
                  value={form.moq_kits_count}
                  onChange={(e) => setForm({ ...form, moq_kits_count: e.target.value })}
                  min={1}
                />
                <span className="text-[10px] text-text-muted mt-0.5 block">Min combo kits per order</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1">
                Project & Kit Scope Description
              </label>
              <input
                type="text"
                className="w-full px-3 py-2 rounded-xl border border-border bg-bg text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                placeholder="e.g. Residential, Commercial & Industrial Kits up to 10,000 kW"
                value={form.moq_project_type}
                onChange={(e) => setForm({ ...form, moq_project_type: e.target.value })}
              />
            </div>
          </div>

          {/* Section 6: 3. Order Type Support */}
          <div className="space-y-3 pt-3 border-t border-border">
            <h4 className="text-xs font-black uppercase tracking-wider text-purple-600 flex items-center gap-1.5">
              <FiPackage size={14} /> 3. Allowed Order Fulfillment Type
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {ORDER_TYPES.map((ot) => {
                const Icon = ot.icon;
                const sel = form.order_type_allowed === ot.value;
                return (
                  <button
                    key={ot.value}
                    type="button"
                    onClick={() => setForm({ ...form, order_type_allowed: ot.value })}
                    className={`flex flex-col items-start p-3 rounded-xl border-2 text-left transition-all ${sel
                      ? "border-purple-600 bg-purple-50/50 text-purple-900 shadow-sm"
                      : "border-border bg-bg text-text-secondary hover:border-purple-300"
                      }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Icon size={16} className={sel ? "text-purple-600" : "text-text-muted"} />
                      <span className="text-xs font-bold text-text-primary">{ot.label}</span>
                    </div>
                    <p className="text-[10px] text-text-muted leading-tight">{ot.description}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 7: Description & Sort Order */}
          <div className="space-y-3 pt-3 border-t border-border">
            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1">Plan Overview & Description</label>
              <textarea
                className="w-full px-3 py-2 rounded-xl border border-border bg-bg text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all resize-none"
                placeholder="Terms, equipment privileges, or territory guidelines..."
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={2}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1">Sort Order (Priority Display)</label>
              <input
                type="number"
                className="w-full px-3 py-2 rounded-xl border border-border bg-bg text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                value={form.sort_order}
                onChange={(e) => setForm({ ...form, sort_order: e.target.value })}
                min={0}
              />
            </div>
          </div>

          <div className="flex gap-3 pt-4 border-t border-border">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl border border-border text-text-secondary text-sm font-medium hover:bg-surface-hover transition-colors">
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || !form.name.trim()}
              className="flex-1 px-4 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary-hover transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-md shadow-primary/20"
            >
              {saving ? <FiLoader className="animate-spin" size={16} /> : null}
              {saving ? "Saving..." : mode === "edit" ? "Save Franchisee Plan" : "Create Franchisee Plan"}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

function DeleteConfirmModal({ plan, onClose, onConfirmed }) {
  const [deleting, setDeleting] = useState(false);
  const dispatch = useDispatch();

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const res = await apiFetch("delete", `/delete?req_for=delete&unique_id=${MODULE_UID}`, { id: plan.id });
      if (res.data?.status === "success") {
        dispatch(setAlert({ type: "success", message: `"${plan.name}" deleted` }));
        onConfirmed(plan.id);
        onClose();
      } else {
        dispatch(setAlert({ type: "error", message: res.data?.message || "Delete failed" }));
      }
    } catch (err) {
      dispatch(setAlert({ type: "error", message: err.response?.data?.message || "Delete failed" }));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-surface rounded-2xl shadow-2xl border border-border w-full max-w-sm p-6">
        <div className="flex flex-col items-center text-center gap-4">
          <div className="w-14 h-14 rounded-full bg-danger-soft flex items-center justify-center">
            <FiAlertCircle size={28} className="text-danger" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-text-primary mb-1">Delete Franchisee Plan?</h3>
            <p className="text-sm text-text-secondary">
              Permanently deleting <strong className="text-text-primary">"{plan.name}"</strong>. Active subscriptions must be reassigned first.
            </p>
          </div>
          <div className="flex gap-3 w-full">
            <button onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl border border-border text-text-secondary text-sm font-medium hover:bg-surface-hover transition-colors">
              Cancel
            </button>
            <button onClick={handleDelete} disabled={deleting} className="flex-1 px-4 py-2.5 rounded-xl bg-danger text-white text-sm font-semibold hover:bg-danger-hover transition-all disabled:opacity-50 flex items-center justify-center gap-2">
              {deleting ? <FiLoader className="animate-spin" size={16} /> : null}
              {deleting ? "Deleting..." : "Delete"}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default function ResellerPlans({ moduleUniqueId }) {
  const dispatch = useDispatch();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterLevel, setFilterLevel] = useState("all");
  const [modal, setModal] = useState(null);

  const fetchPlans = useCallback(async () => {
    setLoading(true);
    try {
      const params = filterLevel !== "all" ? `&territory_level=${filterLevel}` : "";
      const res = await axios.get(
        `${API_BASE}/resellers/plans/list?req_for=view&unique_id=${MODULE_UID}${params}`,
        { headers: authHeaderObj() }
      );
      if (res.data?.status === "success") setPlans(res.data.data);
    } catch {
      dispatch(setAlert({ type: "error", message: "Failed to load franchisee plans" }));
    } finally {
      setLoading(false);
    }
  }, [dispatch, filterLevel]);

  useEffect(() => { fetchPlans(); }, [fetchPlans]);

  const handleToggle = async (plan) => {
    try {
      const res = await apiFetch("put", `/toggle-status?req_for=edit&unique_id=${MODULE_UID}`, { id: plan.id, is_active: !plan.is_active });
      if (res.data?.status === "success") {
        setPlans((prev) => prev.map((p) => (p.id === plan.id ? { ...p, is_active: !p.is_active } : p)));
        dispatch(setAlert({ type: "success", message: `"${plan.name}" ${!plan.is_active ? "activated" : "deactivated"}` }));
      }
    } catch (err) {
      dispatch(setAlert({ type: "error", message: err.response?.data?.message || "Toggle failed" }));
    }
  };

  const filtered = plans.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.description || "").toLowerCase().includes(search.toLowerCase()) ||
      (p.moq_project_type || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
            <FiFileText className="text-primary" size={24} />
            Franchisee Plans
          </h1>
          <p className="text-sm text-text-muted mt-1">
            Configure territory subscription plans, warehouse rules, MOQ capacity, and order fulfillment types
          </p>
        </div>
        <button
          onClick={() => setModal({ mode: "add" })}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary-hover transition-all shadow-md shadow-primary/20 hover:shadow-lg hover:shadow-primary/30 hover:-translate-y-0.5"
        >
          <FiPlus size={16} />
          Create Plan
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={16} />
          <input
            type="text"
            placeholder="Search plans, MOQ, or scope..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-border bg-surface text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
          />
        </div>
        <div className="flex gap-1 bg-surface border border-border rounded-xl p-1">
          {["all", "district", "state", "country"].map((lvl) => (
            <button
              key={lvl}
              onClick={() => setFilterLevel(lvl)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all capitalize ${filterLevel === lvl ? "bg-primary text-white shadow-sm" : "text-text-secondary hover:text-text-primary hover:bg-surface-hover"
                }`}
            >
              {lvl}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-surface rounded-2xl border border-border shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20 text-text-muted gap-3">
            <FiLoader className="animate-spin" size={20} />
            <span className="text-sm">Loading plans...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="w-14 h-14 rounded-full bg-surface-hover flex items-center justify-center">
              <FiFileText size={24} className="text-text-muted" />
            </div>
            <p className="text-sm text-text-muted">
              {search || filterLevel !== "all" ? "No plans match your filters" : "No plans created yet. Add one to get started."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-bg">
                  <th className="text-left text-text-muted font-medium px-5 py-3.5">Plan Name</th>
                  <th className="text-left text-text-muted font-medium px-4 py-3.5">Scope Level</th>
                  <th className="text-right text-text-muted font-medium px-4 py-3.5">Fee</th>
                  <th className="text-left text-text-muted font-medium px-4 py-3.5">Warehouse Req.</th>
                  <th className="text-left text-text-muted font-medium px-4 py-3.5">MOQ / Capacity</th>
                  <th className="text-left text-text-muted font-medium px-4 py-3.5">Order Type</th>
                  <th className="text-center text-text-muted font-medium px-3 py-3.5">Status</th>
                  <th className="text-right text-text-muted font-medium px-5 py-3.5">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                <AnimatePresence>
                  {filtered.map((plan) => (
                    <motion.tr
                      key={plan.id}
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="hover:bg-surface-hover transition-colors"
                    >
                      <td className="px-5 py-3.5">
                        <div className="font-semibold text-text-primary">{plan.name}</div>
                        <div className="text-xs text-text-muted mt-0.5 font-mono">{plan.slug}</div>
                      </td>
                      <td className="px-4 py-3.5">
                        <TerritoryLevelBadge level={plan.territory_level} />
                      </td>
                      <td className="px-4 py-3.5 text-right font-semibold text-text-primary">
                        <div>
                          {plan.one_time_fee === 0 ? "Free / Promo" : `₹${plan.one_time_fee.toLocaleString("en-IN")}`}
                        </div>
                        <div className="text-[11px] text-text-muted font-normal">
                          {plan.validity_value} {plan.validity_unit}
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <WarehouseBadge
                          required={plan.warehouse_required}
                          count={plan.warehouse_count}
                          sqft={plan.warehouse_space_sqft}
                        />
                      </td>
                      <td className="px-4 py-3.5">
                        <MoqBadge
                          capacityKw={plan.moq_capacity_kw}
                          kitsCount={plan.moq_kits_count}
                          projectType={plan.moq_project_type}
                          comboKitsDisplay={plan.combo_kits_display}
                        />
                      </td>
                      <td className="px-4 py-3.5">
                        <OrderTypeBadge orderType={plan.order_type_allowed} />
                      </td>
                      <td className="px-3 py-3.5 text-center">
                        <StatusBadge isActive={plan.is_active} />
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleToggle(plan)}
                            title={plan.is_active ? "Deactivate" : "Activate"}
                            className={`p-2 rounded-lg transition-colors ${plan.is_active ? "text-success hover:bg-success-soft" : "text-text-muted hover:bg-surface-hover"}`}
                          >
                            {plan.is_active ? <FiToggleRight size={18} /> : <FiToggleLeft size={18} />}
                          </button>
                          <button
                            onClick={() => setModal({ mode: "edit", data: plan })}
                            title="Edit"
                            className="p-2 rounded-lg text-text-muted hover:text-primary hover:bg-info-soft transition-colors"
                          >
                            <FiEdit2 size={16} />
                          </button>
                          <button
                            onClick={() => setModal({ mode: "delete", data: plan })}
                            title="Delete"
                            className="p-2 rounded-lg text-text-muted hover:text-danger hover:bg-danger-soft transition-colors"
                          >
                            <FiTrash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        )}
      </div>

      <AnimatePresence>
        {modal?.mode === "add" && (
          <FormModal key="add" mode="add" initial={null} onClose={() => setModal(null)} onSaved={fetchPlans} />
        )}
        {modal?.mode === "edit" && (
          <FormModal key="edit" mode="edit" initial={modal.data} onClose={() => setModal(null)} onSaved={fetchPlans} />
        )}
        {modal?.mode === "delete" && (
          <DeleteConfirmModal key="del" plan={modal.data} onClose={() => setModal(null)} onConfirmed={(id) => setPlans((p) => p.filter((x) => x.id !== id))} />
        )}
      </AnimatePresence>
    </div>
  );
}
