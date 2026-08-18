import { useState, useEffect, useCallback } from "react";
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
} from "react-icons/fi";
import { authHeaderObj } from "@/app/authHeader";
import { setAlert } from "../../../features/alert.slice";

const API_BASE = import.meta.env.VITE_API_URL;
const MODULE_UID = "RSL_PLAN";

const apiFetch = (method, endpoint, data) =>
  axios({ method, url: `${API_BASE}/resellers/plans${endpoint}`, headers: authHeaderObj(), data });

const TERRITORY_LEVELS = [
  { value: "district", label: "District Level", icon: FiMapPin, color: "text-primary", bg: "bg-info-soft" },
  { value: "state",    label: "State Level",    icon: FiMap,    color: "text-success", bg: "bg-success-soft" },
  { value: "country",  label: "Country Level",  icon: FiGlobe,  color: "text-warning", bg: "bg-warning-soft" },
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
  const [form, setForm] = useState({
    name:                      initial?.name                      || "",
    territory_level:           initial?.territory_level           || "district",
    one_time_fee:              initial?.one_time_fee              ?? 0,
    validity_value:            initial?.validity_value            ?? 1,
    validity_unit:             initial?.validity_unit             || "years",
    allowed_territories_count: initial?.allowed_territories_count ?? 1,
    description:               initial?.description               || "",
    sort_order:                initial?.sort_order                ?? 0,
  });
  const [saving, setSaving] = useState(false);

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
        name:                      form.name.trim(),
        territory_level:           form.territory_level,
        one_time_fee:              Number(form.one_time_fee),
        validity_value:            Number(form.validity_value),
        validity_unit:             form.validity_unit,
        allowed_territories_count: Number(form.allowed_territories_count),
        description:               form.description.trim() || null,
        sort_order:                Number(form.sort_order),
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-surface rounded-2xl shadow-2xl border border-border w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto scrollbar-hover"
      >
        <div className="flex items-center justify-between pb-4 border-b border-border mb-5">
          <h3 className="text-lg font-semibold text-text-primary">
            {mode === "edit" ? "Edit Franchisee Plan" : "Create Franchisee Plan"}
          </h3>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-surface-hover text-text-muted transition-colors">
            <FiX size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5">Plan Name <span className="text-danger">*</span></label>
            <input
              type="text"
              className="w-full px-3 py-2.5 rounded-xl border border-border bg-bg text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
              placeholder="e.g. Gold District Partner Plan"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">Territory Scope Level <span className="text-danger">*</span></label>
            <div className="grid grid-cols-3 gap-2">
              {TERRITORY_LEVELS.map((t) => {
                const Icon = t.icon;
                const sel = form.territory_level === t.value;
                return (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => setForm({ ...form, territory_level: t.value })}
                    className={`flex flex-col items-center gap-1 p-3 rounded-xl border-2 text-xs font-semibold transition-all ${
                      sel ? "border-primary bg-info-soft text-primary" : "border-border bg-bg text-text-secondary hover:border-primary/30"
                    }`}
                  >
                    <Icon size={18} className={sel ? "text-primary" : "text-text-muted"} />
                    {t.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1.5">One-Time Fee (₹)</label>
              <input
                type="number"
                className="w-full px-3 py-2.5 rounded-xl border border-border bg-bg text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                value={form.one_time_fee}
                onChange={(e) => setForm({ ...form, one_time_fee: e.target.value })}
                min={0}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1.5">Allowed Territories Count</label>
              <input
                type="number"
                className="w-full px-3 py-2.5 rounded-xl border border-border bg-bg text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                value={form.allowed_territories_count}
                onChange={(e) => setForm({ ...form, allowed_territories_count: e.target.value })}
                min={1}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1.5">Validity Duration</label>
              <input
                type="number"
                className="w-full px-3 py-2.5 rounded-xl border border-border bg-bg text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                value={form.validity_value}
                onChange={(e) => setForm({ ...form, validity_value: e.target.value })}
                min={1}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1.5">Validity Unit</label>
              <select
                className="w-full px-3 py-2.5 rounded-xl border border-border bg-bg text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                value={form.validity_unit}
                onChange={(e) => setForm({ ...form, validity_unit: e.target.value })}
              >
                <option value="months">Month(s)</option>
                <option value="years">Year(s)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5">Description</label>
            <textarea
              className="w-full px-3 py-2.5 rounded-xl border border-border bg-bg text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all resize-none"
              placeholder="Optional plan terms or feature summary..."
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={2}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5">Sort Order</label>
            <input
              type="number"
              className="w-full px-3 py-2.5 rounded-xl border border-border bg-bg text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
              value={form.sort_order}
              onChange={(e) => setForm({ ...form, sort_order: e.target.value })}
              min={0}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl border border-border text-text-secondary text-sm font-medium hover:bg-surface-hover transition-colors">
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || !form.name.trim()}
              className="flex-1 px-4 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary-hover transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {saving ? <FiLoader className="animate-spin" size={16} /> : null}
              {saving ? "Saving..." : mode === "edit" ? "Save Plan" : "Create Plan"}
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
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
      (p.description || "").toLowerCase().includes(search.toLowerCase())
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
            Configure territory subscription plans, fee structures, and validity periods
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
            placeholder="Search plans..."
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
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all capitalize ${
                filterLevel === lvl ? "bg-primary text-white shadow-sm" : "text-text-secondary hover:text-text-primary hover:bg-surface-hover"
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
                  <th className="text-left text-text-muted font-medium px-5 py-3.5">Scope Level</th>
                  <th className="text-right text-text-muted font-medium px-5 py-3.5">Fee</th>
                  <th className="text-center text-text-muted font-medium px-4 py-3.5">Validity</th>
                  <th className="text-center text-text-muted font-medium px-4 py-3.5">Territories</th>
                  <th className="text-center text-text-muted font-medium px-4 py-3.5">Status</th>
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
                      <td className="px-5 py-3.5">
                        <TerritoryLevelBadge level={plan.territory_level} />
                      </td>
                      <td className="px-5 py-3.5 text-right font-semibold text-text-primary">
                        {plan.one_time_fee === 0 ? "Free / Promo" : `₹${plan.one_time_fee.toLocaleString("en-IN")}`}
                      </td>
                      <td className="px-4 py-3.5 text-center text-text-secondary">
                        {plan.validity_value} {plan.validity_unit}
                      </td>
                      <td className="px-4 py-3.5 text-center font-semibold text-primary">
                        {plan.allowed_territories_count}
                      </td>
                      <td className="px-4 py-3.5 text-center">
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
