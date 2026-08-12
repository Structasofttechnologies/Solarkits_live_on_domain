import { useEffect, useState } from "react";
import axios from "axios";
import { authHeaderObj } from "@/app/authHeader";
import {
  FiSettings,
  FiShield,
  FiAlertTriangle,
  FiSave,
  FiRefreshCw,
  FiPercent,
  FiClock,
  FiMapPin,
  FiCheckCircle,
  FiXCircle,
} from "react-icons/fi";

const API_BASE = import.meta.env.VITE_API_URL;

// ─── Reusable Toggle ────────────────────────────────────────────────────────
function Toggle({ value, onChange, disabled }) {
  return (
    <button
      type="button"
      onClick={() => !disabled && onChange(!value)}
      disabled={disabled}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none ${
        value ? "bg-primary" : "bg-bg-card-hover"
      } ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-200 ${
          value ? "translate-x-6" : "translate-x-1"
        }`}
      />
    </button>
  );
}

// ─── Section Header ──────────────────────────────────────────────────────────
function SectionHeader({ icon: Icon, title, subtitle }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
        <Icon size={18} className="text-primary" />
      </div>
      <div>
        <h3 className="text-sm font-bold text-text-primary">{title}</h3>
        {subtitle && <p className="text-xs text-text-muted">{subtitle}</p>}
      </div>
    </div>
  );
}

// ─── Field Row ────────────────────────────────────────────────────────────────
function FieldRow({ label, hint, children }) {
  return (
    <div className="flex items-start justify-between gap-4 py-3 border-b border-border last:border-0">
      <div className="flex-1 min-w-0">
        <div className="text-xs font-semibold text-text-primary">{label}</div>
        {hint && <div className="text-[11px] text-text-muted mt-0.5 leading-relaxed">{hint}</div>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

export default function ResellerSettings({ moduleUniqueId }) {
  const [settings, setSettings] = useState(null);
  const [original, setOriginal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [reason, setReason] = useState("");
  const [toast, setToast] = useState(null);

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_BASE}/reseller-mgmt/settings`, {
        headers: authHeaderObj(),
      });
      if (res.data?.status === "success") {
        setSettings({ ...res.data.data });
        setOriginal({ ...res.data.data });
      }
    } catch (err) {
      showToast("error", err?.response?.data?.message || "Failed to load settings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleChange = (key, value) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const POLICY_FIELDS = [
    "settlement_trigger",
    "territory_exclusivity_mode",
    "platform_commission_pct",
    "pgw_charge_pct",
    "activation_require_signed_agreement",
    "activation_require_active_plan",
  ];

  const changedFields = settings && original
    ? Object.keys(settings).filter((k) => k !== "_id" && k !== "__v" && k !== "updated_at" && k !== "_is_default" && settings[k] !== original[k])
    : [];

  const sensitiveChanged = changedFields.some((f) => POLICY_FIELDS.includes(f));
  const hasChanges = changedFields.length > 0;

  const handleSave = async () => {
    if (sensitiveChanged && !reason.trim()) {
      showToast("error", "A reason is required when changing policy-sensitive fields.");
      return;
    }
    try {
      setSaving(true);
      const payload = {};
      changedFields.forEach((k) => { payload[k] = settings[k]; });
      if (reason.trim()) payload.reason = reason.trim();

      const res = await axios.put(`${API_BASE}/reseller-mgmt/settings`, payload, {
        headers: authHeaderObj(),
      });
      if (res.data?.status === "success") {
        setOriginal({ ...settings });
        setReason("");
        showToast("success", "Settings saved successfully.");
      }
    } catch (err) {
      showToast("error", err?.response?.data?.message || "Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <FiRefreshCw className="animate-spin text-primary" size={28} />
        <span className="ml-3 text-sm text-text-muted font-medium">Loading platform settings...</span>
      </div>
    );
  }

  if (!settings) return null;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* ── Page Header ──────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-black text-text-primary flex items-center gap-2">
            <FiSettings className="text-primary" size={22} />
            Reseller Platform Settings
          </h1>
          <p className="text-xs text-text-muted mt-1">
            Platform-wide configuration for Solarshop reseller operations.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchSettings}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border text-xs font-semibold text-text-secondary hover:bg-bg-card-hover transition-colors cursor-pointer"
          >
            <FiRefreshCw size={13} /> Refresh
          </button>
          {hasChanges && (
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary-hover transition-colors disabled:opacity-60 cursor-pointer"
            >
              {saving ? <FiRefreshCw size={13} className="animate-spin" /> : <FiSave size={13} />}
              {saving ? "Saving..." : "Save Changes"}
            </button>
          )}
        </div>
      </div>

      {/* ── Toast ─────────────────────────────────────────────────────────── */}
      {toast && (
        <div
          className={`flex items-center gap-2.5 px-4 py-3 rounded-xl text-xs font-semibold border ${
            toast.type === "success"
              ? "bg-success-soft text-success border-success/30"
              : "bg-danger-soft text-danger border-danger/30"
          }`}
        >
          {toast.type === "success" ? <FiCheckCircle size={15} /> : <FiXCircle size={15} />}
          {toast.message}
        </div>
      )}

      {/* ─── 1. Checkout & Cart ────────────────────────────────────────────── */}
      <div className="bg-bg-card border border-border rounded-2xl p-5">
        <SectionHeader icon={FiClock} title="Checkout & Cart" subtitle="Timer and cart expiry configuration" />
        <FieldRow
          label="Enable Checkout Timer"
          hint="Auto-releases reserved stock when customer doesn't complete payment in time."
        >
          <Toggle value={!!settings.enable_checkout_timer} onChange={(v) => handleChange("enable_checkout_timer", v)} />
        </FieldRow>
        <FieldRow
          label="Checkout Timer Duration (minutes)"
          hint="How many minutes a cart reservation stays active."
        >
          <input
            type="number"
            min={5}
            max={120}
            value={settings.checkout_timer_duration ?? 20}
            onChange={(e) => handleChange("checkout_timer_duration", Number(e.target.value))}
            className="w-24 px-3 py-1.5 rounded-lg border border-border bg-bg text-xs text-text-primary text-center font-semibold focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </FieldRow>
        <FieldRow
          label="Combo Kit Bulk Panels Limit"
          hint="Maximum number of panels allowed in a single bulk combo kit."
        >
          <input
            type="number"
            min={1}
            max={500}
            value={settings.combokit_bulk_panels_limit ?? 30}
            onChange={(e) => handleChange("combokit_bulk_panels_limit", Number(e.target.value))}
            className="w-24 px-3 py-1.5 rounded-lg border border-border bg-bg text-xs text-text-primary text-center font-semibold focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </FieldRow>
      </div>

      {/* ─── 2. GST & Financials ────────────────────────────────────────────── */}
      <div className="bg-bg-card border border-border rounded-2xl p-5">
        <SectionHeader icon={FiPercent} title="GST & Financials" subtitle="Tax rates and payment gateway charges" />
        <FieldRow label="GST Rate (%)" hint="Applied to all Solarshop transactions.">
          <input
            type="number"
            min={0}
            max={100}
            step={0.1}
            value={settings.gst_rate ?? 13.8}
            onChange={(e) => handleChange("gst_rate", parseFloat(e.target.value))}
            className="w-28 px-3 py-1.5 rounded-lg border border-border bg-bg text-xs text-text-primary text-center font-semibold focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </FieldRow>
        <FieldRow label="Platform Commission (%)" hint="⚠️ Policy-sensitive: requires a reason to change.">
          <input
            type="number"
            min={0}
            max={100}
            step={0.01}
            value={settings.platform_commission_pct ?? 0}
            onChange={(e) => handleChange("platform_commission_pct", parseFloat(e.target.value))}
            className="w-28 px-3 py-1.5 rounded-lg border border-border bg-bg text-xs text-text-primary text-center font-semibold focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </FieldRow>
        <FieldRow label="Payment Gateway Charge (%)" hint="⚠️ Policy-sensitive: requires a reason to change.">
          <input
            type="number"
            min={0}
            max={20}
            step={0.01}
            value={settings.pgw_charge_pct ?? 2}
            onChange={(e) => handleChange("pgw_charge_pct", parseFloat(e.target.value))}
            className="w-28 px-3 py-1.5 rounded-lg border border-border bg-bg text-xs text-text-primary text-center font-semibold focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </FieldRow>
      </div>

      {/* ─── 3. Territory & Settlement Policy ──────────────────────────────── */}
      <div className="bg-bg-card border border-border rounded-2xl p-5">
        <SectionHeader icon={FiMapPin} title="Territory & Settlement Policy" subtitle="Exclusivity rules and payout triggers" />
        <FieldRow
          label="Territory Exclusivity Mode"
          hint="⚠️ Policy-sensitive. 'Strict' = one reseller per territory. 'Open' = shared territories."
        >
          <select
            value={settings.territory_exclusivity_mode ?? "strict"}
            onChange={(e) => handleChange("territory_exclusivity_mode", e.target.value)}
            className="px-3 py-1.5 rounded-lg border border-border bg-bg text-xs text-text-primary font-semibold focus:outline-none focus:ring-2 focus:ring-primary/30 cursor-pointer"
          >
            <option value="strict">Strict (Exclusive)</option>
            <option value="open">Open (Shared)</option>
          </select>
        </FieldRow>
        <FieldRow
          label="Settlement Trigger"
          hint="⚠️ Policy-sensitive. When reseller wallet gets credited after an order."
        >
          <select
            value={settings.settlement_trigger ?? "delivery_plus_window"}
            onChange={(e) => handleChange("settlement_trigger", e.target.value)}
            className="px-3 py-1.5 rounded-lg border border-border bg-bg text-xs text-text-primary font-semibold focus:outline-none focus:ring-2 focus:ring-primary/30 cursor-pointer"
          >
            <option value="delivery_plus_window">Delivery + Return Window</option>
            <option value="on_delivery">On Delivery</option>
            <option value="on_payment">On Payment</option>
          </select>
        </FieldRow>
        <FieldRow label="Settlement Return Window (days)" hint="How many days after delivery before wallet credits.">
          <input
            type="number"
            min={0}
            max={30}
            value={settings.settlement_return_window_days ?? 7}
            onChange={(e) => handleChange("settlement_return_window_days", Number(e.target.value))}
            className="w-24 px-3 py-1.5 rounded-lg border border-border bg-bg text-xs text-text-primary text-center font-semibold focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </FieldRow>
      </div>

      {/* ─── 4. EPC GST Re-verify Policy ────────────────────────────────────── */}
      <div className="bg-bg-card border border-border rounded-2xl p-5">
        <SectionHeader icon={FiShield} title="EPC GST Re-verification" subtitle="When to force EPC to re-verify GST" />
        <FieldRow label="GST Re-verify Policy" hint="When EPC businesses must re-verify their GST registration.">
          <select
            value={settings.epc_gst_reverify_policy ?? "onboarding_only"}
            onChange={(e) => handleChange("epc_gst_reverify_policy", e.target.value)}
            className="px-3 py-1.5 rounded-lg border border-border bg-bg text-xs text-text-primary font-semibold focus:outline-none focus:ring-2 focus:ring-primary/30 cursor-pointer"
          >
            <option value="onboarding_only">Onboarding Only</option>
            <option value="periodic">Periodic (every N days)</option>
            <option value="never">Never</option>
          </select>
        </FieldRow>
        {settings.epc_gst_reverify_policy === "periodic" && (
          <FieldRow label="Re-verify Every (days)" hint="How frequently EPC must re-verify GST.">
            <input
              type="number"
              min={30}
              max={365}
              value={settings.epc_gst_reverify_days ?? 90}
              onChange={(e) => handleChange("epc_gst_reverify_days", Number(e.target.value))}
              className="w-24 px-3 py-1.5 rounded-lg border border-border bg-bg text-xs text-text-primary text-center font-semibold focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </FieldRow>
        )}
      </div>

      {/* ─── 5. Reseller Activation Requirements ────────────────────────────── */}
      <div className="bg-bg-card border border-border rounded-2xl p-5">
        <SectionHeader
          icon={FiCheckCircle}
          title="Reseller Activation Requirements"
          subtitle="Which conditions must be met before a reseller can go active"
        />
        {[
          { key: "activation_require_gst_verified", label: "Require GST Verified", hint: "Reseller must have a verified GST number." },
          { key: "activation_require_kyc_approved", label: "Require KYC Approved", hint: "Reseller KYC documents must be approved by admin." },
          { key: "activation_require_signed_agreement", label: "Require Signed Agreement", hint: "⚠️ Policy-sensitive: reseller must sign the agreement." },
          { key: "activation_require_active_plan", label: "Require Active Plan", hint: "⚠️ Policy-sensitive: reseller must have a paid active subscription." },
          { key: "activation_require_territory_assigned", label: "Require Territory Assigned", hint: "At least one territory must be assigned." },
          { key: "activation_require_product_auth", label: "Require Product Authorization", hint: "At least one product category must be authorized." },
        ].map(({ key, label, hint }) => (
          <FieldRow key={key} label={label} hint={hint}>
            <Toggle value={!!settings[key]} onChange={(v) => handleChange(key, v)} />
          </FieldRow>
        ))}
      </div>

      {/* ─── Reason Box (for policy-sensitive changes) ─────────────────────── */}
      {sensitiveChanged && (
        <div className="bg-warning-soft border border-warning/30 rounded-2xl p-4 space-y-2">
          <div className="flex items-center gap-2 text-warning text-xs font-bold">
            <FiAlertTriangle size={15} /> Policy-Sensitive Change Detected
          </div>
          <p className="text-[11px] text-text-muted">
            You are changing one or more policy-sensitive fields. Please provide a reason (for audit log).
          </p>
          <textarea
            rows={2}
            placeholder="Reason for change (required)..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-border bg-bg text-xs text-text-primary focus:outline-none focus:ring-2 focus:ring-warning/30 resize-none"
          />
        </div>
      )}

      {/* ─── Changed Fields Preview ─────────────────────────────────────────── */}
      {hasChanges && (
        <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4">
          <div className="text-xs font-bold text-primary mb-2">
            {changedFields.length} unsaved change{changedFields.length !== 1 ? "s" : ""}
          </div>
          <div className="flex flex-wrap gap-2">
            {changedFields.map((f) => (
              <span key={f} className="px-2.5 py-1 rounded-lg bg-primary/10 text-primary text-[11px] font-semibold">
                {f}
              </span>
            ))}
          </div>
          <div className="flex gap-2 mt-3">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary-hover transition-colors disabled:opacity-60 cursor-pointer"
            >
              {saving ? <FiRefreshCw size={13} className="animate-spin" /> : <FiSave size={13} />}
              {saving ? "Saving..." : "Save Changes"}
            </button>
            <button
              onClick={() => { setSettings({ ...original }); setReason(""); }}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-border text-xs font-semibold text-text-secondary hover:bg-bg-card-hover transition-colors cursor-pointer"
            >
              Discard
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
