import { useState, useEffect, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import axios from "axios";
import {
  FiPlus, FiEdit2, FiTrash2, FiToggleLeft, FiToggleRight,
  FiUser, FiPackage, FiInfo,
} from "react-icons/fi";
import { FaRupeeSign } from "react-icons/fa";
import { setAlert } from "@/features/alert.slice";
import { authHeaderObj } from "@/app/authHeader";
import Button from "@/components/Button";
import CustomInput from "@/components/CustomInput";
import Dropdown from "@/components/Dropdown";
import Dialog from "@/components/Dialog";
import Loader from "@/components/Loader";
import CustomTable from "@/components/CustomTable";

const API_URL = import.meta.env.VITE_API_URL;
const EMPTY_FORM = {
  plan_id: "", combo_kit_id: "",
  commission_method: "FIXED_PER_KIT",
  fixed_amount_per_kit_paise: "",
  commission_percentage: "",
  min_eligible_quantity: "0",
  max_commission_paise: "",
  calculation_stage: "RETURN_PERIOD_COMPLETED",
  settlement_rule: "MONTHLY_BATCH",
  effective_from: new Date().toISOString().split("T")[0],
  effective_until: "",
};

const CALC_STAGES = [
  { value: "ORDER_CONFIRMED",          text: "Order Confirmed" },
  { value: "PAYMENT_CAPTURED",         text: "Payment Captured" },
  { value: "DISPATCHED",               text: "Dispatched" },
  { value: "DELIVERED",                text: "Delivered" },
  { value: "RETURN_PERIOD_COMPLETED",  text: "Return Period Completed (Recommended)" },
];
const SETTLEMENT_RULES = [
  { value: "MONTHLY_BATCH", text: "Monthly Batch" },
  { value: "IMMEDIATE",     text: "Immediate" },
  { value: "MANUAL",        text: "Manual" },
];

export default function FranchiseeCommissionSettings({ moduleUniqueId = "FPO_COMM" }) {
  const dispatch = useDispatch();
  const token = useSelector((s) => s.auth.token);

  const [rules, setRules] = useState([]);
  const [plans, setPlans] = useState([]);
  const [kits, setKits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [filterPlan, setFilterPlan] = useState("");
  const [filterMethod, setFilterMethod] = useState("");

  const fetchAll = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      // 1. Fetch active countries to get India country_id
      const countriesRes = await axios.get(
        `${API_URL}/geolocation/active-countries?unique_id=ADM_CO_MARGIN&req_for=view`,
        { headers: authHeaderObj() }
      ).catch(() => ({ data: { countries: [] } }));

      const activeCountries = countriesRes.data?.countries || [];
      const indiaCountry = activeCountries.find(
        (c) => c.iso2?.toLowerCase() === "in" || c.name?.toLowerCase() === "india"
      ) || activeCountries[0] || null;

      const countryIdParam = indiaCountry ? `&country_id=${indiaCountry.id || indiaCountry._id}` : "";

      const [rulesRes, plansRes, kitsRes] = await Promise.all([
        axios.get(`${API_URL}/franchisee/commission-rules/list?unique_id=FPO_COMM&req_for=view`, {
          headers: authHeaderObj(),
        }).catch((e) => {
          console.error("Failed to load commission rules:", e);
          return { data: { data: [] } };
        }),
        axios.get(`${API_URL}/resellers/plans/list?unique_id=RSL_PLAN&req_for=view`, {
          headers: authHeaderObj(),
        }).catch((e) => {
          console.error("Failed to load plans:", e);
          return { data: { data: [] } };
        }),
        axios.get(
          `${API_URL}/combo-kits/india/get-kits?unique_id=ADM_CO_MARGIN&req_for=view&is_custom=false${countryIdParam}`,
          { headers: authHeaderObj() }
        ).catch(() =>
          axios.get(
            `${API_URL}/combo-kits/get-kits?unique_id=ADM_CO_MARGIN&req_for=view&is_custom=false${countryIdParam}`,
            { headers: authHeaderObj() }
          ).catch(() => ({ data: { data: [] } }))
        ),
      ]);

      const rawKits = kitsRes.data?.data || [];
      // Deduplicate kits by name / ID
      const seenNames = new Set();
      const cleanKits = rawKits.filter((k) => {
        const nameKey = (k.name || k.kit_name || "").trim().toLowerCase();
        if (!nameKey || seenNames.has(nameKey)) return false;
        seenNames.add(nameKey);
        return true;
      });

      setRules(rulesRes.data?.data || []);
      setPlans(plansRes.data?.data || []);
      setKits(cleanKits);
    } catch (err) {
      console.error("Failed to load commission rules data:", err);
      dispatch(setAlert({ type: "error", message: "Failed to load commission rules" }));
    } finally {
      setLoading(false);
    }
  }, [token, dispatch]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const setF = (key, val) => setForm((p) => ({ ...p, [key]: val }));

  const openAdd = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setShowModal(true);
  };

  const openEdit = (rule) => {
    setEditingId(rule._id || rule.id);
    setForm({
      plan_id:                       rule.plan_id?._id || rule.plan_id || "",
      combo_kit_id:                  rule.combo_kit_id || "",
      commission_method:             rule.commission_method || "FIXED_PER_KIT",
      fixed_amount_per_kit_paise:    rule.fixed_amount_per_kit_paise != null ? String(rule.fixed_amount_per_kit_paise / 100) : "",
      commission_percentage:         rule.commission_percentage != null ? String(rule.commission_percentage) : "",
      min_eligible_quantity:         String(rule.min_eligible_quantity || 0),
      max_commission_paise:          rule.max_commission_paise != null ? String(rule.max_commission_paise / 100) : "",
      calculation_stage:             rule.calculation_stage || "RETURN_PERIOD_COMPLETED",
      settlement_rule:               rule.settlement_rule || "MONTHLY_BATCH",
      effective_from:                rule.effective_from ? rule.effective_from.split("T")[0] : "",
      effective_until:               rule.effective_until ? rule.effective_until.split("T")[0] : "",
    });
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.plan_id) {
      dispatch(setAlert({ type: "warning", message: "Franchisee plan is required" }));
      return;
    }
    if (form.commission_method === "FIXED_PER_KIT" && !form.fixed_amount_per_kit_paise) {
      dispatch(setAlert({ type: "warning", message: "Fixed ₹ amount per kit is required" }));
      return;
    }
    setSaving(true);
    try {
      const payload = {
        plan_id:                      form.plan_id,
        combo_kit_id:                 form.combo_kit_id || null,
        commission_method:            form.commission_method,
        fixed_amount_per_kit_paise:   form.commission_method === "FIXED_PER_KIT"
          ? Math.round(Number(form.fixed_amount_per_kit_paise) * 100)
          : null,
        commission_percentage:        form.commission_method === "PERCENTAGE"
          ? Number(form.commission_percentage)
          : null,
        min_eligible_quantity:        Number(form.min_eligible_quantity || 0),
        max_commission_paise:         form.max_commission_paise
          ? Math.round(Number(form.max_commission_paise) * 100)
          : null,
        calculation_stage:            form.calculation_stage,
        settlement_rule:              form.settlement_rule,
        effective_from:               form.effective_from,
        effective_until:              form.effective_until || null,
      };

      if (editingId) {
        await axios.put(
          `${API_URL}/franchisee/commission-rules/update?unique_id=FPO_COMM&req_for=edit`,
          { id: editingId, ...payload },
          { headers: authHeaderObj() }
        );
        dispatch(setAlert({ type: "success", message: "Commission rule updated" }));
      } else {
        await axios.post(
          `${API_URL}/franchisee/commission-rules/add?unique_id=FPO_COMM&req_for=add`,
          payload,
          { headers: authHeaderObj() }
        );
        dispatch(setAlert({ type: "success", message: "Commission rule created" }));
      }
      setShowModal(false);
      fetchAll();
    } catch (err) {
      console.error("Save commission rule error:", err);
      dispatch(setAlert({ type: "error", message: err.response?.data?.message || "Failed to save commission rule" }));
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (rule) => {
    try {
      await axios.put(
        `${API_URL}/franchisee/commission-rules/toggle-status?unique_id=FPO_COMM&req_for=edit`,
        { id: rule._id || rule.id, is_active: !rule.is_active },
        { headers: authHeaderObj() }
      );
      dispatch(setAlert({ type: "success", message: `Rule ${rule.is_active ? "deactivated" : "activated"}` }));
      fetchAll();
    } catch (e) {
      console.error("Toggle rule error:", e);
      dispatch(setAlert({ type: "error", message: "Failed to toggle rule status" }));
    }
  };

  const handleDelete = async (rule) => {
    if (!window.confirm("Delete this commission rule?")) return;
    try {
      await axios.delete(
        `${API_URL}/franchisee/commission-rules/delete?unique_id=FPO_COMM&req_for=delete`,
        { headers: authHeaderObj(), data: { id: rule._id || rule.id } }
      );
      dispatch(setAlert({ type: "success", message: "Commission rule deleted" }));
      fetchAll();
    } catch (e) {
      console.error("Delete rule error:", e);
      dispatch(setAlert({ type: "error", message: "Failed to delete rule" }));
    }
  };

  const filtered = rules.filter((r) => {
    const planId = r.plan_id?._id || r.plan_id;
    if (filterPlan && planId !== filterPlan) return false;
    if (filterMethod && r.commission_method !== filterMethod) return false;
    return true;
  });

  const tableHeaders = [
    { key: "plan", label: "Plan" },
    { key: "kit", label: "Kit" },
    { key: "method_amount", label: "Method / Amount" },
    { key: "period", label: "Effective Period" },
    { key: "calc", label: "Calculation Stage" },
    { key: "status", label: "Status" },
    { key: "actions", label: "Actions", align: "right" },
  ];

  return (
    <div className="space-y-6 pb-24 animate-in fade-in duration-500">
      {/* Header */}
      <div className="relative rounded-2xl bg-linear-120 from-warning to-warning-hover shadow-xl overflow-hidden">
        <div className="absolute inset-0 bg-grid-white/10 mask-[linear-gradient(0deg,transparent,black)]" />
        <div className="relative px-6 py-7 lg:px-8 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-white/30">
              <FaRupeeSign className="text-white text-2xl" />
            </div>
            <div>
              <h1 className="text-xl lg:text-2xl font-bold text-white">Franchisee Commission Settings</h1>
              <p className="text-white/80 text-xs mt-0.5 font-medium">
                Plan → Kit → ₹ fixed commission per kit. Stored at order creation time.
              </p>
            </div>
          </div>
          <Button
            onClick={openAdd}
            variant="secondary"
            leftIcon={<FiPlus />}
            className="bg-white text-warning border-white hover:bg-white/90 font-black text-xs uppercase tracking-wider rounded-xl shadow-md cursor-pointer"
          >
            Add Rule
          </Button>
        </div>
      </div>

      {/* How Commission Works Info Panel */}
      <div className="card border-2 border-info/20 bg-info/5 p-5 flex items-start gap-4">
        <div className="p-2.5 rounded-xl bg-info/10 text-info border border-info/10 shrink-0 mt-0.5">
          <FiInfo size={16} />
        </div>
        <div>
          <h3 className="font-black text-text-primary text-sm mb-1">How Commission is Calculated</h3>
          <p className="text-xs text-text-secondary font-medium leading-relaxed">
            <strong>Eligible Kits × ₹ Commission per Kit = Franchisee Commission.</strong>
            {" "}Example: 100 kits × ₹750 = ₹75,000. The commission rate is locked at order creation time, so future rule changes don't affect historical orders.
            Commission is only calculated for eligible orders (Franchisee's own sales + EPCs assigned to/onboarded by them).
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="card border-2 border-border p-4 flex flex-col md:flex-row gap-3 items-end">
        <div className="flex-1 w-full">
          <Dropdown
            label="Filter by Plan"
            value={filterPlan}
            onChange={setFilterPlan}
            placeholder="All Plans"
            options={[
              { value: "", text: "All Plans" },
              ...plans.map((p) => ({ value: p._id || p.id, text: p.name }))
            ]}
          />
        </div>
        <div className="w-full md:w-52">
          <Dropdown
            label="Method"
            value={filterMethod}
            onChange={setFilterMethod}
            options={[
              { value: "", text: "All Methods" },
              { value: "FIXED_PER_KIT", text: "Fixed ₹ per Kit" },
              { value: "PERCENTAGE", text: "Percentage" },
            ]}
          />
        </div>
        {(filterPlan || filterMethod) && (
          <Button variant="secondary" onClick={() => { setFilterPlan(""); setFilterMethod(""); }} className="mt-5 md:mt-0 rounded-xl text-xs cursor-pointer">
            Clear
          </Button>
        )}
      </div>

      {/* Table */}
      <div className="bg-surface rounded-2xl border-2 border-border/60 shadow-sm overflow-hidden">
        <div className="px-6 py-4 bg-surface-hover/30 border-b border-border flex items-center justify-between">
          <h2 className="text-xs font-black text-text-primary uppercase tracking-[0.2em] flex items-center gap-2">
            <FaRupeeSign className="text-warning text-sm" /> Commission Rules
          </h2>
          <span className="text-[10px] font-black text-text-muted bg-surface-hover px-3 py-1.5 rounded-lg border border-border/40">
            {filtered.length} Rules
          </span>
        </div>
        <div className="p-4">
          {loading ? (
            <Loader text="Loading commission rules..." />
          ) : (
            <CustomTable
              headers={tableHeaders}
              data={filtered}
              emptyMessage="No commission rules configured. Click 'Add Rule' to create one."
              containerClassName="border-none shadow-none rounded-none bg-transparent"
              renderRow={(rule) => {
                const planName = rule.plan_id?.name || plans.find((p) => (p._id || p.id) === rule.plan_id)?.name || "—";
                const kitName = rule.combo_kit_id
                  ? kits.find((k) => (k.id || k._id) === rule.combo_kit_id)?.name || kits.find((k) => (k.id || k._id) === rule.combo_kit_id)?.kit_name || "Specific Kit"
                  : "All Kits";
                const amountDisplay = rule.commission_method === "FIXED_PER_KIT"
                  ? `₹${((rule.fixed_amount_per_kit_paise || 0) / 100).toLocaleString()} / kit`
                  : `${rule.commission_percentage}%`;
                return (
                  <>
                    <td className="px-4 py-3">
                      <span className="font-black text-text-primary text-sm flex items-center gap-1.5">
                        <FiUser size={12} className="text-primary/60" /> {planName}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-medium text-text-secondary text-xs flex items-center gap-1.5">
                        <FiPackage size={11} className="text-text-muted" /> {kitName}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-[10px] font-black uppercase tracking-wider text-text-muted">
                          {rule.commission_method === "FIXED_PER_KIT" ? "Fixed ₹/Kit" : "Percentage"}
                        </span>
                        <span className="font-black text-warning text-sm">{amountDisplay}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-0.5 text-xs text-text-secondary font-medium whitespace-nowrap">
                        <span>{rule.effective_from ? new Date(rule.effective_from).toLocaleDateString("en-IN") : "—"}</span>
                        <span className="text-text-muted">
                          {rule.effective_until ? `Until ${new Date(rule.effective_until).toLocaleDateString("en-IN")}` : "Open-ended"}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-[10px] font-bold text-text-secondary bg-surface-hover px-2 py-1 rounded-lg border border-border/40">
                        {CALC_STAGES.find((s) => s.value === rule.calculation_stage)?.text || rule.calculation_stage}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`text-[10px] font-black px-2.5 py-1 rounded-full border ${
                          rule.is_active
                            ? "bg-success/10 text-success border-success/20"
                            : "bg-danger/10 text-danger border-danger/20"
                        }`}
                      >
                        {rule.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-1.5">
                        <button onClick={() => openEdit(rule)} className="p-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 border border-primary/10 cursor-pointer transition-colors" title="Edit">
                          <FiEdit2 size={13} />
                        </button>
                        <button onClick={() => handleToggle(rule)} className={`p-1.5 rounded-lg border cursor-pointer transition-colors ${rule.is_active ? "bg-warning/10 text-warning hover:bg-warning/20 border-warning/10" : "bg-success/10 text-success hover:bg-success/20 border-success/10"}`} title={rule.is_active ? "Deactivate" : "Activate"}>
                          {rule.is_active ? <FiToggleRight size={13} /> : <FiToggleLeft size={13} />}
                        </button>
                        <button onClick={() => handleDelete(rule)} className="p-1.5 rounded-lg bg-danger/10 text-danger hover:bg-danger/20 border border-danger/10 cursor-pointer transition-colors" title="Delete">
                          <FiTrash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </>
                );
              }}
            />
          )}
        </div>
      </div>

      {/* Add/Edit Dialog */}
      <Dialog
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingId ? "Edit Commission Rule" : "Add Commission Rule"}
        size="lg"
      >
        <form onSubmit={handleSave} className="space-y-4 pt-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <Dropdown
                label="Franchisee Plan *"
                value={form.plan_id}
                onChange={(v) => setF("plan_id", v)}
                placeholder="Select Plan"
                options={plans.map((p) => ({ value: p._id || p.id, text: p.name }))}
              />
            </div>
            <div className="md:col-span-2">
              <Dropdown
                label="Kit (leave blank for all kits under this plan)"
                value={form.combo_kit_id}
                onChange={(v) => setF("combo_kit_id", v)}
                placeholder="All Kits"
                options={[
                  { value: "", text: "All Kits" },
                  ...kits.map((k) => ({ value: k.id || k._id, text: k.name || k.kit_name || "Kit" }))
                ]}
              />
            </div>
            <div className="md:col-span-2">
              <Dropdown
                label="Commission Method *"
                value={form.commission_method}
                onChange={(v) => setF("commission_method", v)}
                options={[
                  { value: "FIXED_PER_KIT", text: "Fixed ₹ per Kit (Recommended)" },
                  { value: "PERCENTAGE", text: "Percentage of Order Value" },
                ]}
              />
            </div>
            {form.commission_method === "FIXED_PER_KIT" ? (
              <div className="md:col-span-2">
                <CustomInput
                  label="Fixed Amount per Kit (₹) *"
                  type="number" min="0" step="0.01"
                  value={form.fixed_amount_per_kit_paise}
                  onChange={(e) => setF("fixed_amount_per_kit_paise", e.target.value)}
                  placeholder="e.g. 750"
                  prefix={<FaRupeeSign className="text-text-muted text-[10px]" />}
                  helperText="Amount in INR per kit. Stored as paise internally."
                />
              </div>
            ) : (
              <div className="md:col-span-2">
                <CustomInput
                  label="Commission Percentage (%) *"
                  type="number" min="0" max="100" step="0.01"
                  value={form.commission_percentage}
                  onChange={(e) => setF("commission_percentage", e.target.value)}
                  placeholder="e.g. 2.5"
                />
              </div>
            )}
            <CustomInput
              label="Effective From *"
              type="date"
              value={form.effective_from}
              onChange={(e) => setF("effective_from", e.target.value)}
            />
            <CustomInput
              label="Effective Until (optional)"
              type="date"
              value={form.effective_until}
              onChange={(e) => setF("effective_until", e.target.value)}
              helperText="Leave blank for open-ended rule"
            />
            <CustomInput
              label="Min Eligible Quantity"
              type="number" min="0"
              value={form.min_eligible_quantity}
              onChange={(e) => setF("min_eligible_quantity", e.target.value)}
              helperText="Minimum kits in order to earn commission"
            />
            <CustomInput
              label="Max Commission Cap (₹, optional)"
              type="number" min="0"
              value={form.max_commission_paise}
              onChange={(e) => setF("max_commission_paise", e.target.value)}
              helperText="Max INR commission per order. Leave blank for no cap."
              prefix={<FaRupeeSign className="text-text-muted text-[10px]" />}
            />
            <Dropdown
              label="Calculation Stage"
              value={form.calculation_stage}
              onChange={(v) => setF("calculation_stage", v)}
              options={CALC_STAGES}
            />
            <Dropdown
              label="Settlement Rule"
              value={form.settlement_rule}
              onChange={(v) => setF("settlement_rule", v)}
              options={SETTLEMENT_RULES}
            />
          </div>
          <div className="flex gap-3 pt-4 border-t border-border">
            <Button type="button" variant="secondary" onClick={() => setShowModal(false)} className="flex-1 rounded-xl cursor-pointer">Cancel</Button>
            <Button type="submit" variant="primary" loading={saving} className="flex-1 rounded-xl font-black uppercase tracking-wider text-xs shadow-md cursor-pointer">
              {editingId ? "Update Rule" : "Create Rule"}
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
