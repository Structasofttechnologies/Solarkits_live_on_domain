import { useEffect, useState } from "react";
import axios from "axios";
import { authHeaderObj } from "@/app/authHeader";
import {
  FiSettings,
  FiSave,
  FiRefreshCw,
  FiTruck,
  FiFileText,
  FiShield,
  FiCheckCircle,
  FiAlertCircle,
  FiDollarSign,
  FiClock,
  FiInfo,
} from "react-icons/fi";

const rawApiUrl = (import.meta.env.VITE_ADMIN_API_URL || import.meta.env.VITE_API_URL || "http://localhost:5000/admin-api").replace(/\/+$/, "");
const API_BASE = rawApiUrl.replace(/\/admin-api$|\/api$/, "");

function Toggle({ value, onChange }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!value)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
        value ? "bg-amber-500" : "bg-slate-300 dark:bg-slate-700"
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
          value ? "translate-x-6" : "translate-x-1"
        }`}
      />
    </button>
  );
}

export default function QuoteSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState({ text: "", type: "" });

  const [form, setForm] = useState({
    quote_validity_days: 15,
    quote_number_prefix: "SK-QT",
    gst_rate: 13.8,
    delivery_modes: [
      { mode: "epc_location", is_enabled: true, label: "EPC Registered Address" },
      { mode: "district", is_enabled: true, label: "District Transport Hub" },
      { mode: "pincode", is_enabled: true, label: "Project Site (Pincode)" },
      { mode: "franchisee_warehouse", is_enabled: true, label: "Franchisee Store / Warehouse" },
    ],
    payment_terms_options: [
      "100% advance against Proforma Invoice",
      "50% advance, 50% against dispatch inspection",
      "20% advance booking, balance against BL/dispatch",
    ],
    delivery_terms_text: "Ex-warehouse dispatch within 7-10 working days upon 100% payment receipt.",
    warranty_terms_text: "25-year performance warranty on solar PV modules. 5-year replacement warranty on solar grid-tied inverters.",
    default_terms_and_conditions: "All disputes subject to company registered jurisdiction. Prices inclusive of GST as applicable. Freight charged on actuals or per pincode rate card.",
    allow_duplicate_conversion: false,
    allow_revised_quote_conversion: true,
  });

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/admin-api/quote-settings`, {
        headers: authHeaderObj(),
      });
      if (res.data?.status === "success" && res.data.data) {
        setForm((prev) => ({
          ...prev,
          ...res.data.data,
        }));
      }
    } catch (err) {
      console.error("Failed to load quote settings:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMsg({ text: "", type: "" });
    try {
      const res = await axios.put(`${API_BASE}/admin-api/quote-settings`, form, {
        headers: authHeaderObj(),
      });
      if (res.data?.status === "success") {
        setMsg({ text: "Quotation platform settings saved successfully!", type: "success" });
        setTimeout(() => setMsg({ text: "", type: "" }), 3000);
      }
    } catch (err) {
      setMsg({ text: err.response?.data?.message || "Failed to save settings.", type: "error" });
    } finally {
      setSaving(false);
    }
  };

  const updateDeliveryMode = (index, val) => {
    const updated = [...form.delivery_modes];
    updated[index].is_enabled = val;
    setForm({ ...form, delivery_modes: updated });
  };

  if (loading) {
    return (
      <div className="p-8 text-center">
        <div className="inline-block w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-2 text-xs text-slate-400">Loading quotation configuration...</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6 font-sans">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
            <FiSettings size={22} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">
              EPC Quotation Management Settings
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Global administration rules for quote validity, dispatch options, terms, and conversion policy
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={fetchSettings}
          className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 hover:bg-slate-50 transition"
          title="Refresh"
        >
          <FiRefreshCw size={15} />
        </button>
      </div>

      {msg.text && (
        <div
          className={`p-4 rounded-xl text-xs font-semibold flex items-center gap-2 border ${
            msg.type === "success"
              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
              : "bg-red-50 text-red-700 border-red-200"
          }`}
        >
          {msg.type === "success" ? <FiCheckCircle size={16} /> : <FiAlertCircle size={16} />}
          <span>{msg.text}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* General Policy Card */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
          <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-2">
            <FiClock className="text-amber-500" />
            <span>Validity & Identification Defaults</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                Quote Validity (Days)
              </label>
              <input
                type="number"
                min="1"
                max="90"
                value={form.quote_validity_days}
                onChange={(e) => setForm({ ...form, quote_validity_days: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs font-bold"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">Days until quote auto-expires</span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                Quote Number Prefix
              </label>
              <input
                type="text"
                value={form.quote_number_prefix}
                onChange={(e) => setForm({ ...form, quote_number_prefix: e.target.value.toUpperCase() })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs font-bold font-mono"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">e.g. SK-QT-2026-000001</span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
            <FiInfo className="text-amber-500 shrink-0" size={14} />
            <span>GST rates are applied per ComboKit directly from the kit configuration and warehouse margin rules.</span>
          </div>
        </div>

        {/* Allowed Delivery Modes Card */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
          <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-2">
            <FiTruck className="text-blue-500" />
            <span>Permitted Delivery / Fulfillment Modes</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {form.delivery_modes.map((dm, idx) => (
              <div
                key={dm.mode}
                className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/40"
              >
                <div>
                  <div className="font-bold text-xs text-slate-900 dark:text-white">{dm.label}</div>
                  <div className="text-[10px] text-slate-400 font-mono capitalize">mode: {dm.mode}</div>
                </div>
                <Toggle
                  value={dm.is_enabled}
                  onChange={(val) => updateDeliveryMode(idx, val)}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Conversion Policy Rules */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
          <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-2">
            <FiCheckCircle className="text-emerald-500" />
            <span>Order Conversion Policy</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex items-center justify-between p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/40">
              <div>
                <div className="font-bold text-xs text-slate-900 dark:text-white">Allow Duplicate Conversion</div>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Allow an already converted quote to be converted into multiple orders
                </p>
              </div>
              <Toggle
                value={form.allow_duplicate_conversion}
                onChange={(val) => setForm({ ...form, allow_duplicate_conversion: val })}
              />
            </div>

            <div className="flex items-center justify-between p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/40">
              <div>
                <div className="font-bold text-xs text-slate-900 dark:text-white">Allow Revised Quote Conversion</div>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Allow converted quotes to have subsequent revisions converted
                </p>
              </div>
              <Toggle
                value={form.allow_revised_quote_conversion}
                onChange={(val) => setForm({ ...form, allow_revised_quote_conversion: val })}
              />
            </div>
          </div>
        </div>

        {/* Configurable Terms Card */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
          <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-2">
            <FiFileText className="text-indigo-500" />
            <span>Standard Commercial Terms & Conditions</span>
          </h3>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                Standard Delivery Terms
              </label>
              <textarea
                rows={2}
                value={form.delivery_terms_text}
                onChange={(e) => setForm({ ...form, delivery_terms_text: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs"
              ></textarea>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                Standard Warranty Terms
              </label>
              <textarea
                rows={2}
                value={form.warranty_terms_text}
                onChange={(e) => setForm({ ...form, warranty_terms_text: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs"
              ></textarea>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                General Quotation Terms & Conditions
              </label>
              <textarea
                rows={3}
                value={form.default_terms_and_conditions}
                onChange={(e) => setForm({ ...form, default_terms_and_conditions: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs"
              ></textarea>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-md transition disabled:opacity-50"
          >
            {saving ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <FiSave size={16} />
            )}
            <span>Save Configuration</span>
          </button>
        </div>
      </form>
    </div>
  );
}
