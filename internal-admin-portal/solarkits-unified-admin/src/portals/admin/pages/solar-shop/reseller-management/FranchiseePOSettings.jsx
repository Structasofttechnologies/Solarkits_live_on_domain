import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import {
  FiSettings, FiPlus, FiEdit2, FiTrash2, FiToggleLeft, FiToggleRight,
  FiLoader, FiCheck, FiX, FiFileText, FiCreditCard, FiPackage,
  FiAlertCircle, FiSearch,
} from "react-icons/fi";
import { useDispatch } from "react-redux";
import { authHeaderObj } from "@/app/authHeader";
import { setAlert } from "../../../features/alert.slice";
import Button from "@/components/Button";

const API_BASE = import.meta.env.VITE_API_URL;
const apiFetch = (method, ep, data, params = {}) =>
  axios({
    method,
    url: `${API_BASE}/franchisee/po-settings${ep}`,
    headers: authHeaderObj(),
    data,
    params: { req_for: method === 'get' ? 'view' : method === 'post' ? 'add' : method === 'put' ? 'edit' : 'delete', unique_id: 'FPO_SETTINGS', ...params },
  });

const PAYMENT_TERMS = [
  { value: "FULL_ADVANCE",           label: "Full Advance" },
  { value: "PARTIAL_ADVANCE",        label: "Partial Advance" },
  { value: "PAY_BEFORE_DISPATCH",    label: "Pay Before Dispatch" },
  { value: "CREDIT_PERIOD",          label: "Credit Period" },
  { value: "MANUAL_OFFLINE_PAYMENT", label: "Manual / Offline Payment" },
];

const EMPTY_FORM = {
  plan_id: "", po_enabled: true, min_po_quantity: "1", max_po_quantity: "",
  allow_mixed_project_types: true, max_line_items: "50",
  po_validity_days: "30", requires_approval: true,
  payment_terms: "FULL_ADVANCE", advance_percentage: "",
  credit_period_eligible: false, credit_period_days: "0",
  contributes_to_monthly_target: true,
  effective_from: new Date().toISOString().slice(0, 10), effective_until: "",
};

export default function FranchiseePOSettings() {
  const dispatch = useDispatch();
  const [settings, setSettings] = useState([]);
  const [plans, setPlans]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving]     = useState(false);
  const [form, setForm]         = useState(EMPTY_FORM);
  const [search, setSearch]     = useState("");

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [sRes, pRes] = await Promise.all([
        apiFetch("get", "/list"),
        axios.get(`${API_BASE}/resellers/plans/list`, {
          headers: authHeaderObj(),
          params: { req_for: "view", unique_id: "RSL_PLAN" },
        }),
      ]);
      setSettings(sRes.data.data || []);
      setPlans(pRes.data.data || []);
    } catch {
      dispatch(setAlert({ type: "error", message: "Failed to load PO settings." }));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const openEdit = (s) => {
    setForm({
      plan_id:                       s.plan_id?._id || s.plan_id || "",
      po_enabled:                    Boolean(s.po_enabled),
      min_po_quantity:               s.min_po_quantity ?? "1",
      max_po_quantity:               s.max_po_quantity ?? "",
      allow_mixed_project_types:     s.allow_mixed_project_types !== false,
      max_line_items:                s.max_line_items ?? "50",
      po_validity_days:              s.po_validity_days ?? "30",
      requires_approval:             s.requires_approval !== false,
      payment_terms:                 s.payment_terms || "FULL_ADVANCE",
      advance_percentage:            s.advance_percentage ?? "",
      credit_period_eligible:        Boolean(s.credit_period_eligible),
      credit_period_days:            s.credit_period_days ?? "0",
      contributes_to_monthly_target: s.contributes_to_monthly_target !== false,
      effective_from:                s.effective_from?.slice(0, 10) || "",
      effective_until:               s.effective_until?.slice(0, 10) || "",
    });
    setEditingId(s._id || s.id);
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...form,
        min_po_quantity:   Number(form.min_po_quantity),
        max_po_quantity:   form.max_po_quantity   ? Number(form.max_po_quantity) : null,
        max_line_items:    Number(form.max_line_items),
        po_validity_days:  Number(form.po_validity_days),
        advance_percentage: form.advance_percentage ? Number(form.advance_percentage) : null,
        credit_period_days: Number(form.credit_period_days || 0),
        effective_until:   form.effective_until || null,
      };
      if (editingId) {
        await apiFetch("put", "/update", { id: editingId, ...payload });
        dispatch(setAlert({ type: "success", message: "PO settings updated." }));
      } else {
        await apiFetch("post", "/add", payload);
        dispatch(setAlert({ type: "success", message: "PO settings created." }));
      }
      setShowModal(false);
      fetchAll();
    } catch (e) {
      dispatch(setAlert({ type: "error", message: e.response?.data?.message || "Failed to save." }));
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (s) => {
    try {
      await apiFetch("put", "/toggle-status", { id: s._id || s.id, is_active: !s.is_active });
      fetchAll();
    } catch { dispatch(setAlert({ type: "error", message: "Failed to toggle." })); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this PO settings?")) return;
    try { await apiFetch("delete", "/delete", { id }); fetchAll(); }
    catch { dispatch(setAlert({ type: "error", message: "Failed to delete." })); }
  };

  const filtered = settings.filter((s) =>
    (s.plan_id?.name || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
            <FiSettings className="text-primary" /> PO Order Settings
          </h1>
          <p className="text-text-muted text-sm mt-0.5">Configure plan-wise PO ordering permissions, limits, and payment terms</p>
        </div>
        <Button id="add-po-settings-btn" onClick={() => { setForm(EMPTY_FORM); setEditingId(null); setShowModal(true); }} leftIcon={<FiPlus />} variant="primary">
          Add PO Settings
        </Button>
      </div>

      <div className="relative max-w-sm">
        <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={14} />
        <input className="w-full pl-9 pr-4 py-2 rounded-lg border border-border bg-surface text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
          placeholder="Search by plan…" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16"><FiLoader className="animate-spin text-primary" size={28} /></div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.length === 0 ? (
            <div className="col-span-full text-center py-12 text-text-muted">No PO settings configured.</div>
          ) : filtered.map((s, idx) => (
            <motion.div key={s._id || idx} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              className={`rounded-2xl border-2 p-5 space-y-4 transition-all ${s.is_active ? "border-primary/20 bg-surface" : "border-border bg-surface-hover/50"}`}>
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-bold text-text-primary">{s.plan_id?.name || "—"}</h3>
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold mt-1 ${s.po_enabled ? "bg-success-soft text-success" : "bg-error-soft text-error"}`}>
                    {s.po_enabled ? <FiCheck size={9} /> : <FiX size={9} />}
                    {s.po_enabled ? "PO Enabled" : "PO Disabled"}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => openEdit(s)} className="p-1.5 rounded-lg hover:bg-info-soft text-primary"><FiEdit2 size={13} /></button>
                  <button onClick={() => handleToggle(s)} className="p-1.5 rounded-lg hover:bg-surface-hover">
                    {s.is_active ? <FiToggleRight size={18} className="text-success" /> : <FiToggleLeft size={18} className="text-text-muted" />}
                  </button>
                  <button onClick={() => handleDelete(s._id || s.id)} className="p-1.5 rounded-lg hover:bg-error-soft text-error"><FiTrash2 size={13} /></button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <p className="text-text-muted text-[10px] uppercase tracking-wide">Min PO Qty</p>
                  <p className="font-semibold text-text-primary">{s.min_po_quantity || 1} kits</p>
                </div>
                <div>
                  <p className="text-text-muted text-[10px] uppercase tracking-wide">Max PO Qty</p>
                  <p className="font-semibold text-text-primary">{s.max_po_quantity ? `${s.max_po_quantity} kits` : "Unlimited"}</p>
                </div>
                <div>
                  <p className="text-text-muted text-[10px] uppercase tracking-wide">Payment Terms</p>
                  <p className="font-semibold text-text-primary">{PAYMENT_TERMS.find((t) => t.value === s.payment_terms)?.label || s.payment_terms}</p>
                </div>
                <div>
                  <p className="text-text-muted text-[10px] uppercase tracking-wide">PO Order Expiry Window</p>
                  <p className="font-semibold text-primary">{s.po_validity_days != null ? s.po_validity_days : 30} Days</p>
                </div>
                <div>
                  <p className="text-text-muted text-[10px] uppercase tracking-wide">Requires Approval</p>
                  <p className="font-semibold text-text-primary">{s.requires_approval ? "Yes" : "No"}</p>
                </div>
                <div>
                  <p className="text-text-muted text-[10px] uppercase tracking-wide">Mixed Project Types</p>
                  <p className="font-semibold text-text-primary">{s.allow_mixed_project_types ? "Allowed" : "Not Allowed"}</p>
                </div>
              </div>
              <div className="text-[11px] text-text-secondary border-t border-border pt-2.5 mt-1 flex items-center justify-between">
                <span className="text-text-muted font-medium">Active Date Range:</span>
                <span className="font-semibold text-text-primary">
                  {s.effective_from ? new Date(s.effective_from).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                  {s.effective_until ? ` → ${new Date(s.effective_until).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}` : " → Open-ended"}
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div className="bg-surface rounded-2xl shadow-2xl w-full max-w-xl border border-border overflow-y-auto max-h-[90vh]"
              initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}>
              <div className="flex items-center justify-between p-6 border-b border-border">
                <h2 className="text-lg font-bold text-text-primary">{editingId ? "Edit PO Settings" : "Add PO Settings"}</h2>
                <button onClick={() => setShowModal(false)} className="p-2 rounded-lg hover:bg-surface-hover text-text-muted"><FiX /></button>
              </div>
              <form onSubmit={handleSave} className="p-6 space-y-4">
                {/* Plan */}
                <div>
                  <label className="text-xs font-semibold text-text-secondary uppercase tracking-wide mb-1 block">Plan *</label>
                  <select required disabled={!!editingId} className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-sm text-text-primary focus:outline-none"
                    value={form.plan_id} onChange={(e) => setForm({ ...form, plan_id: e.target.value })}>
                    <option value="">Select Plan</option>
                    {plans.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>

                {/* PO Enabled toggle */}
                <div className="flex items-center gap-3 p-4 rounded-xl border border-border bg-surface-hover">
                  <FiFileText className="text-primary" />
                  <span className="flex-1 font-semibold text-text-primary text-sm">Enable PO Ordering</span>
                  <button type="button" onClick={() => setForm({ ...form, po_enabled: !form.po_enabled })}
                    className="focus:outline-none">
                    {form.po_enabled
                      ? <FiToggleRight size={28} className="text-success" />
                      : <FiToggleLeft size={28} className="text-text-muted" />}
                  </button>
                </div>

                {/* Quantity Limits */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-text-secondary uppercase tracking-wide mb-1 block">Min PO Quantity *</label>
                    <input required type="number" min="1" className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-sm focus:outline-none"
                      value={form.min_po_quantity} onChange={(e) => setForm({ ...form, min_po_quantity: e.target.value })} />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-text-secondary uppercase tracking-wide mb-1 block">Max PO Quantity</label>
                    <input type="number" min="1" className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-sm focus:outline-none"
                      value={form.max_po_quantity} onChange={(e) => setForm({ ...form, max_po_quantity: e.target.value })}
                      placeholder="Empty = unlimited" />
                  </div>
                </div>

                {/* Payment Terms */}
                <div>
                  <label className="text-xs font-semibold text-text-secondary uppercase tracking-wide mb-1 block">Payment Terms</label>
                  <select className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-sm focus:outline-none"
                    value={form.payment_terms} onChange={(e) => setForm({ ...form, payment_terms: e.target.value })}>
                    {PAYMENT_TERMS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
                {form.payment_terms === "PARTIAL_ADVANCE" && (
                  <div>
                    <label className="text-xs font-semibold text-text-secondary uppercase tracking-wide mb-1 block">Advance Percentage (%)</label>
                    <input required type="number" min="1" max="99" className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-sm focus:outline-none"
                      value={form.advance_percentage} onChange={(e) => setForm({ ...form, advance_percentage: e.target.value })} />
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-text-secondary uppercase tracking-wide mb-1 block">PO Order Expiry Window (Days) *</label>
                    <input required type="number" min="1" max="365" className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-sm focus:outline-none"
                      value={form.po_validity_days} onChange={(e) => setForm({ ...form, po_validity_days: e.target.value })}
                      placeholder="e.g. 30" />
                    <p className="text-[10px] text-text-muted mt-0.5">PO kitne dino me expire hoga (e.g. 15, 30, 45 din)</p>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-text-secondary uppercase tracking-wide mb-1 block">Max Line Items</label>
                    <input type="number" min="1" className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-sm focus:outline-none"
                      value={form.max_line_items} onChange={(e) => setForm({ ...form, max_line_items: e.target.value })} />
                  </div>
                </div>

                {/* Toggles */}
                <div className="grid grid-cols-2 gap-3">
                  {[
                    ["requires_approval", "Requires Approval"],
                    ["allow_mixed_project_types", "Allow Mixed Project Types"],
                    ["credit_period_eligible", "Credit Period Eligible"],
                    ["contributes_to_monthly_target", "Counts Toward Monthly Goal"],
                  ].map(([key, label]) => (
                    <label key={key} className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" className="w-4 h-4 rounded accent-primary"
                        checked={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.checked })} />
                      <span className="text-sm text-text-secondary">{label}</span>
                    </label>
                  ))}
                </div>

                {/* Dates */}
                <div className="rounded-xl border border-border bg-surface-hover/40 p-3 space-y-2">
                  <p className="text-xs font-semibold text-text-secondary uppercase tracking-wide">Rule Effective Date Range (Plan Validity)</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-semibold text-text-muted mb-1 block">Effective From *</label>
                      <input required type="date" className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-sm focus:outline-none"
                        value={form.effective_from} onChange={(e) => setForm({ ...form, effective_from: e.target.value })} />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-text-muted mb-1 block">Effective Until (Optional)</label>
                      <input type="date" className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-sm focus:outline-none"
                        value={form.effective_until} onChange={(e) => setForm({ ...form, effective_until: e.target.value })} />
                    </div>
                  </div>
                  <p className="text-[10px] text-text-muted">Ye settings kis date se kis date tak active rahengi.</p>
                </div>

                <div className="flex items-center justify-end gap-3 pt-2 border-t border-border">
                  <Button type="button" variant="ghost" onClick={() => setShowModal(false)}>Cancel</Button>
                  <Button type="submit" variant="primary" disabled={saving} leftIcon={saving ? <FiLoader className="animate-spin" /> : <FiCheck />}>
                    {saving ? "Saving…" : editingId ? "Update" : "Create"}
                  </Button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
