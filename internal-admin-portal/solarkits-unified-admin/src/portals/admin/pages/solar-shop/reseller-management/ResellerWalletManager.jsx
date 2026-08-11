import { useState, useEffect, useCallback } from "react";
import { useDispatch } from "react-redux";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import {
  FiCreditCard,
  FiDollarSign,
  FiClock,
  FiCheckCircle,
  FiXCircle,
  FiSearch,
  FiLoader,
  FiArrowUpRight,
  FiArrowDownLeft,
  FiFileText,
  FiShield,
  FiRefreshCw,
} from "react-icons/fi";
import { authHeaderObj } from "@/app/authHeader";
import { setAlert } from "../../../features/alert.slice";

const API_BASE = import.meta.env.VITE_API_URL;
const MODULE_UID = "RSL_WALLET";

const apiFetch = (method, endpoint, data) =>
  axios({ method, url: `${API_BASE}/reseller-mgmt/wallet${endpoint}`, headers: authHeaderObj(), data });

const STATUS_BADGES = {
  paid:     { label: "Paid / Fulfilled", bg: "bg-success-soft", text: "text-success", icon: FiCheckCircle },
  approved: { label: "Approved", bg: "bg-info-soft", text: "text-info", icon: FiCheckCircle },
  pending:  { label: "Pending Review", bg: "bg-warning-soft", text: "text-warning", icon: FiClock },
  rejected: { label: "Rejected", bg: "bg-danger-soft", text: "text-danger", icon: FiXCircle },
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

function ProcessPayoutModal({ payout, onClose, onProcessed }) {
  const dispatch = useDispatch();
  const [decision, setDecision] = useState("paid");
  const [txnRef, setTxnRef] = useState("");
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await apiFetch("put", `/payouts/process/${payout.id}?req_for=edit&unique_id=${MODULE_UID}`, {
        decision,
        transaction_reference: txnRef.trim() || undefined,
        rejection_reason: reason.trim() || undefined,
      });

      if (res.data?.status === "success") {
        dispatch(setAlert({ type: "success", message: `Payout request processed as ${decision}` }));
        onProcessed();
        onClose();
      } else {
        dispatch(setAlert({ type: "error", message: res.data?.message || "Operation failed" }));
      }
    } catch (err) {
      dispatch(setAlert({ type: "error", message: err.response?.data?.message || "Operation failed" }));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-surface rounded-2xl shadow-2xl border border-border w-full max-w-lg overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h3 className="text-lg font-semibold text-text-primary">Process Reseller Payout</h3>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-surface-hover text-text-muted transition-colors">
            <FiXCircle size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="p-4 rounded-xl bg-bg border border-border space-y-1 text-sm">
            <div className="text-xs text-text-muted font-medium uppercase tracking-wider">Requested Amount</div>
            <div className="text-2xl font-bold text-primary">₹{payout.amount?.toLocaleString("en-IN")}</div>
            <div className="text-xs text-text-secondary pt-1">
              <span className="font-semibold">{payout.reseller?.business_name}</span> ({payout.reseller?.email})
            </div>
            {payout.bank_details && (
              <div className="text-xs text-text-muted mt-2 pt-2 border-t border-border space-y-0.5 font-mono">
                <div>Bank: {payout.bank_details.bank_name}</div>
                <div>A/C: {payout.bank_details.account_number} | IFSC: {payout.bank_details.ifsc_code}</div>
                <div>Holder: {payout.bank_details.account_holder_name}</div>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">Payout Decision <span className="text-danger">*</span></label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setDecision("paid")}
                className={`p-3 rounded-xl border-2 text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                  decision === "paid" ? "border-success bg-success-soft text-success shadow-sm" : "border-border bg-bg text-text-muted"
                }`}
              >
                <FiCheckCircle size={16} /> Fulfill & Mark Paid
              </button>
              <button
                type="button"
                onClick={() => setDecision("rejected")}
                className={`p-3 rounded-xl border-2 text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                  decision === "rejected" ? "border-danger bg-danger-soft text-danger shadow-sm" : "border-border bg-bg text-text-muted"
                }`}
              >
                <FiXCircle size={16} /> Reject & Return Funds
              </button>
            </div>
          </div>

          {decision === "paid" ? (
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1.5">Bank Transaction Reference / UTR Number</label>
              <input
                type="text"
                placeholder="e.g. UTR984719284712"
                className="w-full px-3 py-2.5 rounded-xl border border-border bg-bg text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                value={txnRef}
                onChange={(e) => setTxnRef(e.target.value)}
              />
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1.5">Rejection Reason</label>
              <textarea
                placeholder="e.g. Bank details mismatch"
                className="w-full px-3 py-2.5 rounded-xl border border-border bg-bg text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                rows={2}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl border border-border text-text-secondary text-sm font-medium hover:bg-surface-hover transition-colors">
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 px-4 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary-hover transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {submitting ? <FiLoader className="animate-spin" size={16} /> : null}
              Confirm Decision
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

export default function ResellerWalletManager({ moduleUniqueId }) {
  const dispatch = useDispatch();
  const [activeTab, setActiveTab] = useState("payouts"); // "payouts" | "wallets"
  const [wallets, setWallets] = useState([]);
  const [payouts, setPayouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [search, setSearch] = useState("");
  const [selectedPayout, setSelectedPayout] = useState(null);

  const fetchWallets = useCallback(async () => {
    try {
      const res = await axios.get(`${API_BASE}/reseller-mgmt/wallet/list?req_for=view&unique_id=${MODULE_UID}`, { headers: authHeaderObj() });
      if (res.data?.status === "success") setWallets(res.data.data);
    } catch {
      console.error("Failed to load wallets");
    }
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

  useEffect(() => {
    fetchWallets();
    fetchPayouts();
  }, [fetchWallets, fetchPayouts]);

  // Aggregate totals
  const totalAvailable = wallets.reduce((acc, w) => acc + (w.available_balance || 0), 0);
  const totalPending = wallets.reduce((acc, w) => acc + (w.pending_balance || 0), 0);
  const totalEarned = wallets.reduce((acc, w) => acc + (w.total_earned || 0), 0);
  const totalWithdrawn = wallets.reduce((acc, w) => acc + (w.total_withdrawn || 0), 0);

  const filteredPayouts = payouts.filter(
    (p) =>
      (p.reseller?.business_name || "").toLowerCase().includes(search.toLowerCase()) ||
      (p.transaction_reference || "").toLowerCase().includes(search.toLowerCase()) ||
      (p.id || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
            <FiCreditCard className="text-primary" size={24} />
            Commission Engine & Wallet Ledger
          </h1>
          <p className="text-sm text-text-muted mt-1">
            Audit double-entry financial ledgers, reseller wallet balances, and fulfill withdrawal payout requests
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-surface p-5 rounded-2xl border border-border shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-success-soft text-success flex items-center justify-center">
            <FiDollarSign size={22} />
          </div>
          <div>
            <div className="text-xs font-semibold text-text-muted uppercase tracking-wider">Total Available</div>
            <div className="text-xl font-bold text-text-primary mt-0.5">₹{totalAvailable.toLocaleString("en-IN")}</div>
          </div>
        </div>

        <div className="bg-surface p-5 rounded-2xl border border-border shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-warning-soft text-warning flex items-center justify-center">
            <FiClock size={22} />
          </div>
          <div>
            <div className="text-xs font-semibold text-text-muted uppercase tracking-wider">Pending Holds</div>
            <div className="text-xl font-bold text-text-primary mt-0.5">₹{totalPending.toLocaleString("en-IN")}</div>
          </div>
        </div>

        <div className="bg-surface p-5 rounded-2xl border border-border shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-info-soft text-info flex items-center justify-center">
            <FiArrowUpRight size={22} />
          </div>
          <div>
            <div className="text-xs font-semibold text-text-muted uppercase tracking-wider">Total Commissions</div>
            <div className="text-xl font-bold text-text-primary mt-0.5">₹{totalEarned.toLocaleString("en-IN")}</div>
          </div>
        </div>

        <div className="bg-surface p-5 rounded-2xl border border-border shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-primary-soft text-primary flex items-center justify-center">
            <FiArrowDownLeft size={22} />
          </div>
          <div>
            <div className="text-xs font-semibold text-text-muted uppercase tracking-wider">Total Withdrawn</div>
            <div className="text-xl font-bold text-text-primary mt-0.5">₹{totalWithdrawn.toLocaleString("en-IN")}</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border">
        <button
          onClick={() => setActiveTab("payouts")}
          className={`px-5 py-3 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === "payouts" ? "border-primary text-primary" : "border-transparent text-text-muted hover:text-text-primary"
          }`}
        >
          <FiCreditCard size={16} />
          Payout Requests Queue ({payouts.length})
        </button>
        <button
          onClick={() => setActiveTab("wallets")}
          className={`px-5 py-3 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === "wallets" ? "border-primary text-primary" : "border-transparent text-text-muted hover:text-text-primary"
          }`}
        >
          <FiFileText size={16} />
          Reseller Wallets Overview ({wallets.length})
        </button>
      </div>

      {/* Payouts Tab */}
      {activeTab === "payouts" && (
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row gap-3 bg-surface p-4 rounded-2xl border border-border shadow-sm">
            <div className="relative flex-1">
              <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" size={16} />
              <input
                type="text"
                placeholder="Search payout request ID, reseller, or transaction ref..."
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
              <option value="">All Payout Statuses</option>
              <option value="pending">Pending Review</option>
              <option value="paid">Paid / Fulfilled</option>
              <option value="rejected">Rejected</option>
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
                      <th className="text-left text-text-muted font-medium px-5 py-3.5">Reseller</th>
                      <th className="text-right text-text-muted font-medium px-5 py-3.5">Requested Amount</th>
                      <th className="text-left text-text-muted font-medium px-5 py-3.5 hidden md:table-cell">Bank Details</th>
                      <th className="text-center text-text-muted font-medium px-4 py-3.5">Status</th>
                      <th className="text-right text-text-muted font-medium px-5 py-3.5">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    <AnimatePresence>
                      {filteredPayouts.map((p) => (
                        <motion.tr key={p.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="hover:bg-surface-hover transition-colors">
                          <td className="px-5 py-3.5">
                            <div className="font-semibold text-text-primary">{p.reseller?.business_name}</div>
                            <div className="text-xs text-text-muted">{p.reseller?.email}</div>
                          </td>
                          <td className="px-5 py-3.5 text-right font-bold text-primary">
                            ₹{(p.amount || 0).toLocaleString("en-IN")}
                          </td>
                          <td className="px-5 py-3.5 hidden md:table-cell font-mono text-xs text-text-secondary">
                            {p.bank_details ? (
                              <div>
                                <div>{p.bank_details.bank_name} (A/C: {p.bank_details.account_number})</div>
                                <div className="text-text-muted">IFSC: {p.bank_details.ifsc_code}</div>
                              </div>
                            ) : (
                              <span className="italic text-text-muted">—</span>
                            )}
                          </td>
                          <td className="px-4 py-3.5 text-center">
                            <StatusBadge status={p.status} />
                          </td>
                          <td className="px-5 py-3.5 text-right">
                            {p.status === "pending" && (
                              <button
                                onClick={() => setSelectedPayout(p)}
                                className="px-3 py-1.5 rounded-xl bg-primary text-white text-xs font-semibold hover:bg-primary-hover transition-all shadow-sm"
                              >
                                Process Payout
                              </button>
                            )}
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

      {/* Wallets Overview Tab */}
      {activeTab === "wallets" && (
        <div className="bg-surface rounded-2xl border border-border shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-bg">
                  <th className="text-left text-text-muted font-medium px-5 py-3.5">Reseller</th>
                  <th className="text-right text-text-muted font-medium px-5 py-3.5">Available Balance</th>
                  <th className="text-right text-text-muted font-medium px-5 py-3.5">Pending Holds</th>
                  <th className="text-right text-text-muted font-medium px-5 py-3.5">Total Earned</th>
                  <th className="text-right text-text-muted font-medium px-5 py-3.5">Total Withdrawn</th>
                  <th className="text-center text-text-muted font-medium px-4 py-3.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {wallets.map((w) => (
                  <tr key={w.id} className="hover:bg-surface-hover transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="font-semibold text-text-primary">{w.reseller?.business_name || "Reseller"}</div>
                      <div className="text-xs text-text-muted">{w.reseller?.email}</div>
                    </td>
                    <td className="px-5 py-3.5 text-right font-bold text-success">
                      ₹{(w.available_balance || 0).toLocaleString("en-IN")}
                    </td>
                    <td className="px-5 py-3.5 text-right font-semibold text-warning">
                      ₹{(w.pending_balance || 0).toLocaleString("en-IN")}
                    </td>
                    <td className="px-5 py-3.5 text-right font-semibold text-text-primary">
                      ₹{(w.total_earned || 0).toLocaleString("en-IN")}
                    </td>
                    <td className="px-5 py-3.5 text-right text-text-muted">
                      ₹{(w.total_withdrawn || 0).toLocaleString("en-IN")}
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-success-soft text-success capitalize">
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

      {selectedPayout && (
        <ProcessPayoutModal
          payout={selectedPayout}
          onClose={() => setSelectedPayout(null)}
          onProcessed={() => {
            fetchWallets();
            fetchPayouts();
          }}
        />
      )}
    </div>
  );
}
