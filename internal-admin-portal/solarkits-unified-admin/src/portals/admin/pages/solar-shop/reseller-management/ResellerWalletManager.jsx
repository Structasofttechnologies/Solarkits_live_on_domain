import { useState, useEffect, useCallback } from "react";
import { useDispatch } from "react-redux";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import {
  FiCreditCard, FiDollarSign, FiClock, FiCheckCircle, FiXCircle,
  FiSearch, FiLoader, FiArrowUpRight, FiArrowDownLeft, FiFileText,
  FiShield, FiRefreshCw, FiAlertCircle, FiDownload, FiEye,
  FiTrendingUp, FiMinusCircle,
} from "react-icons/fi";
import { authHeaderObj } from "@/app/authHeader";
import { setAlert } from "../../../features/alert.slice";

const API_BASE   = import.meta.env.VITE_API_URL;
const MODULE_UID = "RSL_WALLET";

const apiFetch = (method, endpoint, data) =>
  axios({ method, url: `${API_BASE}/reseller-mgmt/wallet${endpoint}`, headers: authHeaderObj(), data });

// ─── Helpers ─────────────────────────────────────────────────────────────────
function fmt(val) {
  return `₹${Number(val || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
function fmtDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}
function shortId(id) {
  return String(id || "").slice(-8).toUpperCase();
}

// ─── Status Badges ────────────────────────────────────────────────────────────
const STATUS_BADGES = {
  paid:       { label: "Paid",           bg: "bg-success-soft",  text: "text-success",  icon: FiCheckCircle },
  processing: { label: "Processing",     bg: "bg-info-soft",     text: "text-info",     icon: FiLoader      },
  pending:    { label: "Pending Review", bg: "bg-warning-soft",  text: "text-warning",  icon: FiClock       },
  rejected:   { label: "Rejected",       bg: "bg-danger-soft",   text: "text-danger",   icon: FiXCircle     },
  failed:     { label: "Failed",         bg: "bg-danger-soft",   text: "text-danger",   icon: FiAlertCircle },
};

function StatusBadge({ status }) {
  const cfg = STATUS_BADGES[status] || STATUS_BADGES.pending;
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${cfg.bg} ${cfg.text} border border-current/20`}>
      <Icon size={11} /> {cfg.label}
    </span>
  );
}

// ─── Process Payout Modal ─────────────────────────────────────────────────────
function ProcessPayoutModal({ payout, onClose, onProcessed }) {
  const dispatch   = useDispatch();
  const [decision, setDecision] = useState("paid");
  const [txnRef,   setTxnRef]   = useState("");
  const [reason,   setReason]   = useState("");
  const [submitting, setSubmitting] = useState(false);

  const amountInr = payout.amount_paise
    ? Math.round(payout.amount_paise) / 100
    : (payout.amount || 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return; // prevent double-click
    setSubmitting(true);
    try {
      const res = await apiFetch("put", `/payouts/process/${payout.id || payout._id}?req_for=edit&unique_id=${MODULE_UID}`, {
        decision,
        transaction_reference: txnRef.trim() || undefined,
        rejection_reason:      reason.trim() || undefined,
      });

      if (res.data?.status === "success") {
        dispatch(setAlert({ type: "success", message: res.data.message || `Payout ${decision}` }));
        onProcessed();
        onClose();
      } else {
        dispatch(setAlert({ type: "error", message: res.data?.message || "Operation failed" }));
        setSubmitting(false);
      }
    } catch (err) {
      dispatch(setAlert({ type: "error", message: err.response?.data?.message || "Operation failed" }));
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-surface rounded-2xl shadow-2xl border border-border w-full max-w-lg overflow-hidden"
      >
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h3 className="text-lg font-semibold text-text-primary">Process Reseller Payout</h3>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-surface-hover text-text-muted transition-colors">
            <FiXCircle size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* ── Payout summary ──────────────────────────────────────────── */}
          <div className="p-4 rounded-xl bg-bg border border-border space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs text-text-muted font-medium uppercase tracking-wider">Reseller</span>
              <span className="font-semibold text-text-primary">{payout.reseller_id?.business_name || payout.reseller?.business_name || "—"}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-text-muted font-medium uppercase tracking-wider">Email / Mobile</span>
              <span className="text-xs text-text-secondary">{payout.reseller_id?.email || payout.reseller?.email} · {payout.reseller_id?.mobile || payout.reseller?.mobile}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-text-muted font-medium uppercase tracking-wider">PAN</span>
              <span className="font-mono text-xs text-text-secondary">{payout.reseller_id?.pan_number || "—"}</span>
            </div>
            <div className="flex items-center justify-between border-t border-border pt-2 mt-1">
              <span className="text-xs text-text-muted font-medium uppercase tracking-wider">Requested Amount</span>
              <span className="text-2xl font-black text-primary">{fmt(amountInr)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-text-muted font-medium uppercase tracking-wider">Request ID</span>
              <span className="font-mono text-xs text-text-muted">{shortId(payout.id || payout._id)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-text-muted font-medium uppercase tracking-wider">Requested On</span>
              <span className="text-xs text-text-secondary">{fmtDate(payout.created_at)}</span>
            </div>
          </div>

          {/* ── Bank details ─────────────────────────────────────────────── */}
          {payout.bank_details_snapshot && (
            <div className="p-3.5 rounded-xl bg-bg border border-border font-mono text-xs text-text-secondary space-y-0.5">
              <div className="font-semibold text-text-primary">Bank: {payout.bank_details_snapshot.bank_name}</div>
              <div>A/C: {payout.bank_details_snapshot.account_number} &nbsp;·&nbsp; IFSC: {payout.bank_details_snapshot.ifsc_code}</div>
              <div>Holder: {payout.bank_details_snapshot.account_holder_name}</div>
            </div>
          )}

          {/* ── Wallet balance snapshot at request ───────────────────────── */}
          {payout.wallet_balance_at_request && (
            <div className="p-3 rounded-xl bg-warning-soft border border-warning/20 text-xs font-semibold text-warning space-y-0.5">
              <div className="font-bold mb-1">Balance at time of request:</div>
              <div>Available: {fmt((payout.wallet_balance_at_request.available_balance_paise || 0) / 100)}</div>
              <div>Pending Holds: {fmt((payout.wallet_balance_at_request.pending_balance_paise || 0) / 100)}</div>
            </div>
          )}

          {/* ── Decision ────────────────────────────────────────────────── */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              Payout Decision <span className="text-danger">*</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setDecision("paid")}
                className={`p-3 rounded-xl border-2 text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                  decision === "paid" ? "border-success bg-success-soft text-success shadow-sm" : "border-border bg-bg text-text-muted"
                }`}
              >
                <FiCheckCircle size={16} /> Fulfill &amp; Mark Paid
              </button>
              <button
                type="button"
                onClick={() => setDecision("rejected")}
                className={`p-3 rounded-xl border-2 text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                  decision === "rejected" ? "border-danger bg-danger-soft text-danger shadow-sm" : "border-border bg-bg text-text-muted"
                }`}
              >
                <FiXCircle size={16} /> Reject &amp; Return Funds
              </button>
            </div>
          </div>

          {/* ── Conditional field ────────────────────────────────────────── */}
          {decision === "paid" ? (
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1.5">
                UTR / Bank Transaction Reference
                <span className="text-xs text-text-muted ml-1">(Strongly recommended)</span>
              </label>
              <input
                type="text"
                placeholder="e.g. UTR984719284712 or NEFT ref"
                className="w-full px-3 py-2.5 rounded-xl border border-border bg-bg text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 font-mono"
                value={txnRef}
                onChange={(e) => setTxnRef(e.target.value)}
              />
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1.5">
                Rejection Reason <span className="text-danger">*</span>
              </label>
              <textarea
                required={decision === "rejected"}
                placeholder="e.g. Bank details mismatch — IFSC does not match account number"
                className="w-full px-3 py-2.5 rounded-xl border border-border bg-bg text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                rows={3}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-xl border border-border text-text-secondary text-sm font-medium hover:bg-surface-hover transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || (decision === "rejected" && !reason.trim())}
              className="flex-1 px-4 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary-hover transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {submitting ? <FiLoader className="animate-spin" size={16} /> : null}
              {submitting ? "Processing…" : "Confirm Decision"}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

// ─── Mark Failed Modal ────────────────────────────────────────────────────────
function MarkFailedModal({ payout, onClose, onProcessed }) {
  const dispatch   = useDispatch();
  const [reason,   setReason]   = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    try {
      const res = await apiFetch("put", `/payouts/mark-failed/${payout.id || payout._id}?req_for=edit&unique_id=${MODULE_UID}`, {
        reason: reason.trim() || "Payout failed at bank/provider",
      });
      if (res.data?.status === "success") {
        dispatch(setAlert({ type: "success", message: "Payout marked as failed. Funds returned to reseller." }));
        onProcessed();
        onClose();
      } else {
        dispatch(setAlert({ type: "error", message: res.data?.message || "Operation failed" }));
        setSubmitting(false);
      }
    } catch (err) {
      dispatch(setAlert({ type: "error", message: err.response?.data?.message || "Operation failed" }));
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-surface rounded-2xl shadow-2xl border border-border w-full max-w-md p-6 space-y-4">
        <h3 className="text-lg font-semibold text-danger flex items-center gap-2">
          <FiAlertCircle /> Mark Payout as Failed
        </h3>
        <p className="text-sm text-text-secondary">
          Funds of <strong>{fmt(payout.amount_paise ? payout.amount_paise / 100 : payout.amount)}</strong> will be safely returned to the reseller's available balance.
        </p>
        <form onSubmit={handleSubmit} className="space-y-3">
          <textarea
            placeholder="Failure reason (e.g. Bank account closed, incorrect IFSC)"
            className="w-full px-3 py-2.5 rounded-xl border border-border bg-bg text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-danger/30 resize-none"
            rows={3}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-border text-text-secondary text-sm font-medium hover:bg-surface-hover">Cancel</button>
            <button type="submit" disabled={submitting} className="flex-1 py-2.5 rounded-xl bg-danger text-white text-sm font-semibold disabled:opacity-50 flex items-center justify-center gap-2">
              {submitting && <FiLoader className="animate-spin" size={15} />}
              Confirm Failure
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

// ─── Main Admin Component ─────────────────────────────────────────────────────
export default function ResellerWalletManager({ moduleUniqueId }) {
  const dispatch = useDispatch();
  const [activeTab,       setActiveTab]       = useState("payouts");
  const [wallets,         setWallets]         = useState([]);
  const [payouts,         setPayouts]         = useState([]);
  const [webhooks,        setWebhooks]        = useState([]);
  const [loading,         setLoading]         = useState(true);
  const [statusFilter,    setStatusFilter]    = useState("");
  const [search,          setSearch]          = useState("");
  const [selectedPayout,  setSelectedPayout]  = useState(null);
  const [failedPayout,    setFailedPayout]    = useState(null);
  const [exporting,       setExporting]       = useState(false);

  const fetchWallets = useCallback(async () => {
    try {
      const res = await axios.get(`${API_BASE}/reseller-mgmt/wallet/list?req_for=view&unique_id=${MODULE_UID}`, { headers: authHeaderObj() });
      if (res.data?.status === "success") setWallets(res.data.data);
    } catch { /* silently ignore */ }
  }, []);

  const fetchPayouts = useCallback(async () => {
    setLoading(true);
    try {
      let url = `${API_BASE}/reseller-mgmt/wallet/payouts?req_for=view&unique_id=${MODULE_UID}`;
      if (statusFilter) url += `&status=${statusFilter}`;
      const res = await axios.get(url, { headers: authHeaderObj() });
      if (res.data?.status === "success") setPayouts(res.data.data);
    } catch {
      dispatch(setAlert({ type: "error", message: "Failed to load payout requests" }));
    } finally {
      setLoading(false);
    }
  }, [dispatch, statusFilter]);

  const fetchWebhooks = useCallback(async () => {
    try {
      const res = await axios.get(`${API_BASE}/reseller-mgmt/webhook-logs`, { headers: authHeaderObj() });
      if (res.data?.status === "success") setWebhooks(res.data.data);
    } catch { /* silently ignore */ }
  }, []);

  const refreshAll = useCallback(() => {
    fetchWallets();
    fetchPayouts();
  }, [fetchWallets, fetchPayouts]);

  useEffect(() => { refreshAll(); }, [refreshAll]);

  // ── CSV Export ────────────────────────────────────────────────────────────
  const handleExport = async () => {
    setExporting(true);
    try {
      let url = `${API_BASE}/reseller-mgmt/wallet/export-payouts?req_for=view&unique_id=${MODULE_UID}`;
      if (statusFilter) url += `&status=${statusFilter}`;
      const res = await axios.get(url, { headers: authHeaderObj(), responseType: "blob" });
      const href = URL.createObjectURL(res.data);
      const a = document.createElement("a");
      a.href = href;
      a.download = `payout_requests_${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(href);
    } catch {
      dispatch(setAlert({ type: "error", message: "Export failed" }));
    } finally {
      setExporting(false);
    }
  };

  // ── Aggregated KPIs across all wallets ───────────────────────────────────
  const kpis = wallets.reduce(
    (acc, w) => ({
      grossEarned:   acc.grossEarned   + (w.breakdown?.gross_earned_inr || 0),
      tdsDeducted:   acc.tdsDeducted   + (w.breakdown?.tds_deducted_inr || 0),
      netEarned:     acc.netEarned     + (w.breakdown?.net_earned_inr   || 0),
      available:     acc.available     + (w.available_balance || 0),
      pending:       acc.pending       + (w.pending_balance   || 0),
      withdrawn:     acc.withdrawn     + (w.total_withdrawn   || 0),
    }),
    { grossEarned: 0, tdsDeducted: 0, netEarned: 0, available: 0, pending: 0, withdrawn: 0 }
  );

  // ── Payout counts by status ───────────────────────────────────────────────
  const pendingCount = payouts.filter((p) => p.status === "pending").length;

  const filteredPayouts = payouts.filter((p) => {
    const name = (p.reseller_id?.business_name || p.reseller?.business_name || "").toLowerCase();
    const email = (p.reseller_id?.email || p.reseller?.email || "").toLowerCase();
    const txn  = (p.utr_reference || p.transaction_reference || "").toLowerCase();
    const id   = String(p.id || p._id || "").toLowerCase();
    const q    = search.toLowerCase();
    return name.includes(q) || email.includes(q) || txn.includes(q) || id.includes(q);
  });

  return (
    <div className="space-y-6">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
            <FiCreditCard className="text-primary" size={24} />
            Commission Engine &amp; Wallet Ledger
          </h1>
          <p className="text-sm text-text-muted mt-1">
            Double-entry ledgers · Reseller wallet balances · Payout request processing
          </p>
        </div>
        <div className="flex items-center gap-2">
          {pendingCount > 0 && (
            <span className="px-3 py-1 rounded-full bg-warning-soft text-warning text-xs font-bold animate-pulse">
              {pendingCount} Pending
            </span>
          )}
          <button onClick={refreshAll} className="p-2.5 rounded-xl border border-border text-text-muted hover:bg-surface-hover transition-colors" title="Refresh">
            <FiRefreshCw size={16} />
          </button>
          <button
            onClick={handleExport}
            disabled={exporting}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-border text-sm font-semibold text-text-secondary hover:bg-surface-hover transition-colors disabled:opacity-50"
          >
            {exporting ? <FiLoader className="animate-spin" size={14} /> : <FiDownload size={14} />}
            Export CSV
          </button>
        </div>
      </div>

      {/* ── KPI Cards ──────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {[
          { icon: FiTrendingUp,    bg: "bg-success-soft",  text: "text-success",  label: "Gross Earned",      value: fmt(kpis.grossEarned) },
          { icon: FiMinusCircle,   bg: "bg-danger-soft",   text: "text-danger",   label: "TDS Deducted",      value: fmt(kpis.tdsDeducted) },
          { icon: FiArrowUpRight,  bg: "bg-info-soft",     text: "text-info",     label: "Net Commissions",   value: fmt(kpis.netEarned) },
          { icon: FiDollarSign,    bg: "bg-success-soft",  text: "text-success",  label: "Total Available",   value: fmt(kpis.available) },
          { icon: FiClock,         bg: "bg-warning-soft",  text: "text-warning",  label: "Pending Holds",     value: fmt(kpis.pending) },
          { icon: FiArrowDownLeft, bg: "bg-primary-soft",  text: "text-primary",  label: "Total Withdrawn",   value: fmt(kpis.withdrawn) },
        ].map(({ icon: Icon, bg, text, label, value }) => (
          <div key={label} className="bg-surface p-4 rounded-2xl border border-border shadow-sm flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl ${bg} ${text} flex items-center justify-center shrink-0`}>
              <Icon size={20} />
            </div>
            <div className="min-w-0">
              <div className="text-[10px] font-semibold text-text-muted uppercase tracking-wider truncate">{label}</div>
              <div className="text-base font-bold text-text-primary mt-0.5 truncate">{value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Tabs ──────────────────────────────────────────────────────────── */}
      <div className="flex border-b border-border overflow-x-auto">
        {[
          { key: "payouts", icon: FiCreditCard, label: `Payout Requests (${payouts.length})` },
          { key: "wallets", icon: FiFileText,   label: `Reseller Wallets (${wallets.length})` },
          { key: "webhooks", icon: FiShield,   label: "Webhook Logs" },
        ].map(({ key, icon: Icon, label }) => (
          <button
            key={key}
            onClick={() => { setActiveTab(key); if (key === "webhooks") fetchWebhooks(); }}
            className={`px-5 py-3 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 shrink-0 ${
              activeTab === key ? "border-primary text-primary" : "border-transparent text-text-muted hover:text-text-primary"
            }`}
          >
            <Icon size={16} /> {label}
          </button>
        ))}
      </div>

      {/* ── Payouts Tab ─────────────────────────────────────────────────────── */}
      {activeTab === "payouts" && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-3 bg-surface p-4 rounded-2xl border border-border shadow-sm">
            <div className="relative flex-1">
              <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" size={16} />
              <input
                type="text"
                placeholder="Search by reseller, email, ref ID, or UTR..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-border bg-bg text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2.5 rounded-xl border border-border bg-bg text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              <option value="">All Statuses</option>
              <option value="pending">Pending Review</option>
              <option value="processing">Processing</option>
              <option value="paid">Paid</option>
              <option value="rejected">Rejected</option>
              <option value="failed">Failed</option>
            </select>
          </div>

          <div className="bg-surface rounded-2xl border border-border shadow-sm overflow-hidden">
            {loading ? (
              <div className="flex items-center justify-center py-20 text-text-muted gap-3">
                <FiLoader className="animate-spin" size={20} />
                <span className="text-sm">Loading payout requests...</span>
              </div>
            ) : filteredPayouts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3">
                <p className="text-sm text-text-muted">No payout requests found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-bg">
                      <th className="text-left text-text-muted font-medium px-5 py-3.5 text-xs uppercase tracking-wider">Request</th>
                      <th className="text-left text-text-muted font-medium px-5 py-3.5 text-xs uppercase tracking-wider">Reseller</th>
                      <th className="text-right text-text-muted font-medium px-5 py-3.5 text-xs uppercase tracking-wider">Amount</th>
                      <th className="text-left text-text-muted font-medium px-5 py-3.5 text-xs uppercase tracking-wider hidden md:table-cell">Bank Details</th>
                      <th className="text-center text-text-muted font-medium px-4 py-3.5 text-xs uppercase tracking-wider">Status</th>
                      <th className="text-right text-text-muted font-medium px-5 py-3.5 text-xs uppercase tracking-wider hidden lg:table-cell">UTR / Ref</th>
                      <th className="text-right text-text-muted font-medium px-5 py-3.5 text-xs uppercase tracking-wider hidden lg:table-cell">Date</th>
                      <th className="text-right text-text-muted font-medium px-5 py-3.5 text-xs uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    <AnimatePresence>
                      {filteredPayouts.map((p) => (
                        <motion.tr
                          key={p.id || p._id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="hover:bg-surface-hover transition-colors"
                        >
                          <td className="px-5 py-3.5 font-mono text-[11px] text-text-muted">
                            {shortId(p.id || p._id)}
                          </td>
                          <td className="px-5 py-3.5">
                            <div className="font-semibold text-text-primary text-sm">{p.reseller_id?.business_name || p.reseller?.business_name}</div>
                            <div className="text-xs text-text-muted">{p.reseller_id?.email || p.reseller?.email}</div>
                            {(p.reseller_id?.pan_number || p.reseller?.pan_number) && (
                              <div className="text-[11px] font-mono text-text-muted mt-0.5">PAN: {p.reseller_id?.pan_number || p.reseller?.pan_number}</div>
                            )}
                          </td>
                          <td className="px-5 py-3.5 text-right font-bold text-primary">
                            {fmt(p.amount_paise ? p.amount_paise / 100 : p.amount)}
                          </td>
                          <td className="px-5 py-3.5 hidden md:table-cell font-mono text-xs text-text-secondary">
                            {p.bank_details_snapshot ? (
                              <div>
                                <div className="font-semibold">{p.bank_details_snapshot.bank_name}</div>
                                <div className="text-text-muted">A/C: {p.bank_details_snapshot.account_number}</div>
                                <div className="text-text-muted">IFSC: {p.bank_details_snapshot.ifsc_code}</div>
                              </div>
                            ) : (
                              <span className="italic text-text-muted">—</span>
                            )}
                          </td>
                          <td className="px-4 py-3.5 text-center">
                            <StatusBadge status={p.status} />
                          </td>
                          <td className="px-5 py-3.5 text-right font-mono text-xs text-text-secondary hidden lg:table-cell">
                            {p.utr_reference || p.transaction_reference || "—"}
                          </td>
                          <td className="px-5 py-3.5 text-right text-xs text-text-muted hidden lg:table-cell whitespace-nowrap">
                            {fmtDate(p.created_at)}
                          </td>
                          <td className="px-5 py-3.5 text-right">
                            <div className="flex items-center justify-end gap-2">
                              {p.status === "pending" && (
                                <button
                                  onClick={() => setSelectedPayout(p)}
                                  className="px-3 py-1.5 rounded-xl bg-primary text-white text-xs font-semibold hover:bg-primary-hover transition-all shadow-sm"
                                >
                                  Process
                                </button>
                              )}
                              {p.status === "processing" && (
                                <button
                                  onClick={() => setFailedPayout(p)}
                                  className="px-3 py-1.5 rounded-xl bg-danger text-white text-xs font-semibold hover:opacity-90 transition-all shadow-sm"
                                >
                                  Mark Failed
                                </button>
                              )}
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
        </div>
      )}

      {/* ── Wallets Overview Tab ──────────────────────────────────────────── */}
      {activeTab === "wallets" && (
        <div className="bg-surface rounded-2xl border border-border shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-bg">
                  {["Reseller", "Gross Earned", "TDS", "Net Earned", "Available", "Pending Holds", "Withdrawn", "Status"].map((h) => (
                    <th key={h} className={`px-5 py-3.5 text-xs font-medium text-text-muted uppercase tracking-wider ${h === "Reseller" ? "text-left" : "text-right"} ${["Gross Earned","TDS"].includes(h) ? "hidden xl:table-cell" : ""}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {wallets.map((w) => (
                  <tr key={w.id || w._id} className="hover:bg-surface-hover transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="font-semibold text-text-primary">{w.reseller_id?.business_name || "Reseller"}</div>
                      <div className="text-xs text-text-muted">{w.reseller_id?.email}</div>
                      {w.reseller_id?.pan_number && <div className="text-[11px] font-mono text-text-muted">{w.reseller_id.pan_number}</div>}
                    </td>
                    <td className="px-5 py-3.5 text-right font-semibold text-text-primary hidden xl:table-cell">{fmt(w.breakdown?.gross_earned_inr || 0)}</td>
                    <td className="px-5 py-3.5 text-right font-semibold text-danger hidden xl:table-cell">{fmt(w.breakdown?.tds_deducted_inr || 0)}</td>
                    <td className="px-5 py-3.5 text-right font-semibold text-text-primary">{fmt(w.breakdown?.net_earned_inr || w.total_earned || 0)}</td>
                    <td className="px-5 py-3.5 text-right font-bold text-success">{fmt(w.available_balance || 0)}</td>
                    <td className="px-5 py-3.5 text-right font-semibold text-warning">{fmt(w.pending_balance || 0)}</td>
                    <td className="px-5 py-3.5 text-right text-text-muted">{fmt(w.total_withdrawn || 0)}</td>
                    <td className="px-4 py-3.5 text-right">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize ${w.status === "frozen" ? "bg-danger-soft text-danger" : "bg-success-soft text-success"}`}>
                        {w.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Webhooks Tab ─────────────────────────────────────────────────── */}
      {activeTab === "webhooks" && (
        <div className="bg-surface rounded-2xl border border-border shadow-sm overflow-hidden space-y-4 p-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-text-primary flex items-center gap-2">
              <FiShield className="text-primary" size={18} />
              Razorpay Webhook Event Audit Logs
            </h3>
            <button onClick={fetchWebhooks} className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-border text-xs font-semibold text-text-secondary hover:bg-bg-card-hover">
              <FiRefreshCw size={12} /> Refresh
            </button>
          </div>

          {webhooks.length === 0 ? (
            <div className="py-12 text-center text-text-muted text-xs">
              No webhook events recorded yet. Webhooks will automatically log here as Razorpay payment events occur.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border bg-bg text-text-muted">
                    <th className="text-left px-4 py-3 font-semibold">Event ID &amp; Timestamp</th>
                    <th className="text-left px-4 py-3 font-semibold">Event Type</th>
                    <th className="text-left px-4 py-3 font-semibold">Order / Payment Reference</th>
                    <th className="text-center px-4 py-3 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {webhooks.map((wh) => (
                    <tr key={wh._id || wh.event_id} className="hover:bg-surface-hover transition-colors font-mono">
                      <td className="px-4 py-3">
                        <div className="font-bold text-text-primary">{wh.event_id}</div>
                        <div className="text-[10px] text-text-muted">{fmtDate(wh.created_at)}</div>
                      </td>
                      <td className="px-4 py-3 font-bold text-primary">{wh.event_type}</td>
                      <td className="px-4 py-3 text-text-secondary">{wh.order_id || wh.payment_id || "N/A"}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${wh.status === "processed" ? "bg-success-soft text-success" : "bg-warning-soft text-warning"}`}>
                          {wh.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── Modals ─────────────────────────────────────────────────────────── */}
      {selectedPayout && (
        <ProcessPayoutModal
          payout={selectedPayout}
          onClose={() => setSelectedPayout(null)}
          onProcessed={refreshAll}
        />
      )}
      {failedPayout && (
        <MarkFailedModal
          payout={failedPayout}
          onClose={() => setFailedPayout(null)}
          onProcessed={refreshAll}
        />
      )}
    </div>
  );
}
