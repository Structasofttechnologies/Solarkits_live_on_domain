import { useState, useEffect } from "react";
import {
  MdSearch,
  MdRefresh,
  MdVisibility,
  MdFilterList,
  MdCheckCircle,
  MdPending,
  MdErrorOutline,
  MdOutlineAccessTime,
  MdEdit,
  MdPayment,
  MdDoneAll
} from "react-icons/md";
import { FaCoins, FaHandshake, FaRupeeSign } from "react-icons/fa";
import { getFranchiseCommissions, updateCommissionStatus } from "../../api/solarshopAccounts";
import TransactionDetailsDrawer from "../../components/TransactionDetailsDrawer";
import Button from "../../components/Button";

export default function FranchiseCommissionTracking() {
  const [commissions, setCommissions] = useState([]);
  const [stats, setStats] = useState({
    total_commission: 0,
    paid_commission: 0,
    pending_commission: 0,
    on_hold_commission: 0,
    count_paid: 0,
    count_pending: 0,
    count_on_hold: 0,
    count_failed: 0
  });

  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 10;

  // Filters
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Drawer & Settle Modal
  const [selectedTxn, setSelectedTxn] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [settleModalOpen, setSettleModalOpen] = useState(false);
  const [updatingComm, setUpdatingComm] = useState(null);
  const [newStatus, setNewStatus] = useState("Paid");
  const [newUtr, setNewUtr] = useState("");
  const [paidDate, setPaidDate] = useState(new Date().toISOString().split("T")[0]);
  const [settleNotes, setSettleNotes] = useState("");
  const [submittingSettle, setSubmittingSettle] = useState(false);

  useEffect(() => {
    fetchCommissions();
  }, [page, statusFilter]);

  const fetchCommissions = async () => {
    setLoading(true);
    try {
      const params = { page, limit };
      if (statusFilter !== "all") params.status = statusFilter;
      if (searchQuery) params.search = searchQuery;

      const res = await getFranchiseCommissions(params);
      if (res.status === "success") {
        setCommissions(res.data || []);
        setTotal(res.total || 0);
        if (res.stats) setStats(res.stats);
      }
    } catch (err) {
      console.error("Error fetching franchise commissions:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchCommissions();
  };

  const handleOpenSettleModal = (comm) => {
    setUpdatingComm(comm);
    setNewStatus(comm.commission_status || "Paid");
    setNewUtr(comm.payment_reference && comm.payment_reference !== "N/A" ? comm.payment_reference : "");
    setPaidDate(comm.paid_date ? new Date(comm.paid_date).toISOString().split("T")[0] : new Date().toISOString().split("T")[0]);
    setSettleNotes("");
    setSettleModalOpen(true);
  };

  const handleSaveCommissionStatus = async (e) => {
    e.preventDefault();
    if (!updatingComm) return;
    setSubmittingSettle(true);
    try {
      await updateCommissionStatus(updatingComm.id, {
        commission_status: newStatus,
        utr_reference: newUtr,
        paid_date: paidDate,
        notes: settleNotes
      });
      setSettleModalOpen(false);
      fetchCommissions();
    } catch (err) {
      console.error("Error updating commission status:", err);
    } finally {
      setSubmittingSettle(false);
    }
  };

  const formatCurrency = (val) => {
    if (val == null || isNaN(val)) return "₹0.00";
    return `₹${Number(val).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "N/A";
    try {
      return new Date(dateStr).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric"
      });
    } catch {
      return dateStr;
    }
  };

  /**
   * EXACT COLORS REQUIRED:
   * Green: Paid
   * Yellow: Pending
   * Orange: On Hold
   * Red: Failed
   */
  const renderCommissionStatusBadge = (status) => {
    const s = String(status || "").toLowerCase();
    if (s === "paid") {
      return (
        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30">
          <MdCheckCircle size={13} className="text-emerald-600 dark:text-emerald-400" />
          Paid
        </span>
      );
    }
    if (s === "pending") {
      return (
        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-yellow-500/15 text-yellow-800 dark:text-yellow-400 border border-yellow-500/30">
          <MdPending size={13} className="text-yellow-600 dark:text-yellow-400" />
          Pending
        </span>
      );
    }
    if (s === "on hold" || s === "on_hold") {
      return (
        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-orange-500/15 text-orange-700 dark:text-orange-400 border border-orange-500/30">
          <MdOutlineAccessTime size={13} className="text-orange-600 dark:text-orange-400" />
          On Hold
        </span>
      );
    }
    if (s === "failed") {
      return (
        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-red-500/15 text-red-700 dark:text-red-400 border border-red-500/30">
          <MdErrorOutline size={13} className="text-red-600 dark:text-red-400" />
          Failed
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-600">
        {status}
      </span>
    );
  };

  const totalPages = Math.ceil(total / limit) || 1;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Page Header */}
      <div className="bg-surface p-5 sm:p-6 rounded-2xl border border-border shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 uppercase tracking-wider mb-1">
            <FaCoins /> Commission Engine
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-text-primary">
            Franchise Commission Tracking
          </h1>
          <p className="text-xs sm:text-sm text-text-muted mt-1">
            Confirm whether franchise partners’ earned sales commission has been disbursed with bank UTR settlement numbers.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchCommissions}
            className="text-xs font-semibold gap-1.5"
            disabled={loading}
          >
            <MdRefresh size={16} className={loading ? "animate-spin" : ""} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Mini Stats Banner with Exact Status Colors */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        {/* Paid Card (Green) */}
        <div className="p-4 rounded-xl bg-surface border border-emerald-500/30 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 uppercase">
              Paid Commission
            </span>
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
          </div>
          <p className="text-lg sm:text-xl font-extrabold text-emerald-600 dark:text-emerald-400 font-mono mt-1">
            {formatCurrency(stats.paid_commission)}
          </p>
          <span className="text-xs text-text-muted mt-0.5 block">
            {stats.count_paid} Disbursed Orders
          </span>
        </div>

        {/* Pending Card (Yellow) */}
        <div className="p-4 rounded-xl bg-surface border border-yellow-500/30 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-yellow-800 dark:text-yellow-400 uppercase">
              Pending Commission
            </span>
            <span className="w-2 h-2 rounded-full bg-yellow-500" />
          </div>
          <p className="text-lg sm:text-xl font-extrabold text-yellow-600 dark:text-yellow-400 font-mono mt-1">
            {formatCurrency(stats.pending_commission)}
          </p>
          <span className="text-xs text-text-muted mt-0.5 block">
            {stats.count_pending} Awaiting Payout
          </span>
        </div>

        {/* On Hold Card (Orange) */}
        <div className="p-4 rounded-xl bg-surface border border-orange-500/30 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-orange-700 dark:text-orange-400 uppercase">
              On Hold
            </span>
            <span className="w-2 h-2 rounded-full bg-orange-500" />
          </div>
          <p className="text-lg sm:text-xl font-extrabold text-orange-600 dark:text-orange-400 font-mono mt-1">
            {formatCurrency(stats.on_hold_commission)}
          </p>
          <span className="text-xs text-text-muted mt-0.5 block">
            {stats.count_on_hold} Held Review
          </span>
        </div>

        {/* Failed Card (Red) */}
        <div className="p-4 rounded-xl bg-surface border border-red-500/30 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-red-700 dark:text-red-400 uppercase">
              Failed / Cancelled
            </span>
            <span className="w-2 h-2 rounded-full bg-red-500" />
          </div>
          <p className="text-lg sm:text-xl font-extrabold text-red-600 dark:text-red-400 font-mono mt-1">
            {stats.count_failed} Orders
          </p>
          <span className="text-xs text-text-muted mt-0.5 block">
            Order Refunded / Cancelled
          </span>
        </div>
      </div>

      {/* Filter & Table Container */}
      <div className="bg-surface rounded-2xl border border-border shadow-sm overflow-hidden">
        {/* Table Toolbar */}
        <div className="p-4 sm:p-5 border-b border-border flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-text-muted flex items-center gap-1">
              <MdFilterList size={15} /> Status:
            </span>
            {[
              { key: "all", label: "All Statuses", color: "bg-primary" },
              { key: "paid", label: "Paid (Green)", color: "bg-emerald-600" },
              { key: "pending", label: "Pending (Yellow)", color: "bg-yellow-600" },
              { key: "on hold", label: "On Hold (Orange)", color: "bg-orange-600" },
              { key: "failed", label: "Failed (Red)", color: "bg-red-600" },
            ].map((st) => (
              <button
                key={st.key}
                onClick={() => {
                  setStatusFilter(st.key);
                  setPage(1);
                }}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                  statusFilter === st.key
                    ? `${st.color} text-white shadow-sm`
                    : "bg-surface-hover/70 text-text-secondary hover:text-text-primary"
                }`}
              >
                {st.label}
              </button>
            ))}
          </div>

          <form onSubmit={handleSearchSubmit} className="relative min-w-[240px] sm:min-w-[300px]">
            <input
              type="text"
              placeholder="Search Partner, EPC, Order ID, UTR..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-surface-hover/50 border border-border rounded-xl text-xs sm:text-sm text-text-primary focus:outline-none focus:border-primary"
            />
            <MdSearch className="absolute left-3 top-2.5 text-text-muted text-lg pointer-events-none" />
          </form>
        </div>

        {/* Table */}
        <div className="overflow-x-auto scrollbar-hover">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-surface-hover/40 text-text-muted font-bold text-[11px] uppercase tracking-wider border-b border-border">
              <tr>
                <th className="px-4 sm:px-6 py-3.5">Commission ID</th>
                <th className="px-4 py-3.5">Franchise Partner Name</th>
                <th className="px-4 py-3.5">EPC Name</th>
                <th className="px-4 py-3.5">Related Order ID</th>
                <th className="px-4 py-3.5 text-right">Order Amount</th>
                <th className="px-4 py-3.5 text-center">Comm. Rate</th>
                <th className="px-4 py-3.5 text-right">Commission Amount</th>
                <th className="px-4 py-3.5 text-center">Commission Status</th>
                <th className="px-4 py-3.5">Paid Date</th>
                <th className="px-4 py-3.5">UTR / Reference No.</th>
                <th className="px-4 sm:px-6 py-3.5 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {loading ? (
                <tr>
                  <td colSpan={11} className="text-center py-12 text-text-muted">
                    <div className="w-7 h-7 border-2 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-2" />
                    Loading franchise commission records...
                  </td>
                </tr>
              ) : commissions.length === 0 ? (
                <tr>
                  <td colSpan={11} className="text-center py-12 text-text-muted">
                    No commission records found.
                  </td>
                </tr>
              ) : (
                commissions.map((c) => (
                  <tr key={c.id || c.commission_id} className="hover:bg-surface-hover/40 transition-colors">
                    {/* Commission ID */}
                    <td className="px-4 sm:px-6 py-3.5 font-mono font-bold text-text-primary whitespace-nowrap">
                      {c.commission_id}
                    </td>

                    {/* Franchise Partner Name */}
                    <td className="px-4 py-3.5">
                      <div className="font-semibold text-text-primary truncate max-w-[150px]">
                        {c.franchise_partner_name}
                      </div>
                      <div className="text-[11px] text-text-muted font-mono">{c.partner_mobile}</div>
                    </td>

                    {/* EPC Name */}
                    <td className="px-4 py-3.5 font-medium text-text-primary max-w-[150px] truncate" title={c.epc_name}>
                      {c.epc_name}
                    </td>

                    {/* Related Order ID */}
                    <td className="px-4 py-3.5 font-mono font-semibold text-primary whitespace-nowrap">
                      {c.related_order_id}
                    </td>

                    {/* Order Amount */}
                    <td className="px-4 py-3.5 text-right font-mono font-semibold text-text-secondary whitespace-nowrap">
                      {formatCurrency(c.order_amount)}
                    </td>

                    {/* Commission Rate */}
                    <td className="px-4 py-3.5 text-center whitespace-nowrap font-bold text-primary">
                      {c.commission_rate}%
                    </td>

                    {/* Commission Amount */}
                    <td className="px-4 py-3.5 text-right font-mono font-bold text-emerald-600 whitespace-nowrap">
                      {formatCurrency(c.commission_amount)}
                    </td>

                    {/* Commission Status with EXACT Badge Colors */}
                    <td className="px-4 py-3.5 text-center whitespace-nowrap">
                      <div className="inline-flex items-center gap-1">
                        {renderCommissionStatusBadge(c.commission_status)}
                        <button
                          onClick={() => handleOpenSettleModal(c)}
                          className="text-text-muted hover:text-primary p-1 rounded hover:bg-surface-hover transition-colors"
                          title="Update Status / Enter UTR"
                        >
                          <MdEdit size={13} />
                        </button>
                      </div>
                    </td>

                    {/* Paid Date */}
                    <td className="px-4 py-3.5 text-text-muted whitespace-nowrap text-xs">
                      {c.commission_status === "Paid" ? formatDate(c.paid_date) : "—"}
                    </td>

                    {/* Payment Reference / UTR */}
                    <td className="px-4 py-3.5 font-mono text-xs whitespace-nowrap">
                      {c.utr_number && c.utr_number !== "N/A" ? (
                        <span className="font-bold text-text-primary bg-surface-hover/60 px-2 py-0.5 rounded border border-border">
                          {c.utr_number}
                        </span>
                      ) : (
                        <span className="text-text-muted">—</span>
                      )}
                    </td>

                    {/* View Details Button */}
                    <td className="px-4 sm:px-6 py-3.5 text-center whitespace-nowrap">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedTxn({ ...c, type_key: "commission", transaction_type: "Franchise Commission" });
                          setIsDrawerOpen(true);
                        }}
                        className="text-xs font-semibold px-2.5 py-1 gap-1 border-emerald-500/30 text-emerald-600 hover:bg-emerald-600 hover:text-white"
                      >
                        <MdVisibility size={14} />
                        View Details
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="p-4 border-t border-border flex items-center justify-between text-xs text-text-muted">
          <span>Showing {commissions.length} of {total} records</span>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1 rounded-lg border border-border bg-surface-hover/40 disabled:opacity-40"
            >
              Previous
            </button>
            <span className="font-semibold text-text-primary px-2">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-3 py-1 rounded-lg border border-border bg-surface-hover/40 disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Settle Commission Status Modal */}
      {settleModalOpen && updatingComm && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface border border-border rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4 animate-in zoom-in-95">
            <div className="flex items-center gap-2 text-emerald-600 font-bold text-sm">
              <FaCoins /> Commission Disbursement Settlement
            </div>

            <p className="text-xs text-text-muted">
              Updating settlement status for <span className="font-semibold text-text-primary">{updatingComm.franchise_partner_name}</span> on order <span className="font-mono text-primary font-bold">{updatingComm.related_order_id}</span>
            </p>

            <div className="p-3 rounded-xl bg-surface-hover/50 border border-border text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-text-muted">Order Amount:</span>
                <span className="font-semibold text-text-primary">{formatCurrency(updatingComm.order_amount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted">Commission Payable ({updatingComm.commission_rate}%):</span>
                <span className="font-bold text-emerald-600 font-mono">{formatCurrency(updatingComm.commission_amount)}</span>
              </div>
            </div>

            <form onSubmit={handleSaveCommissionStatus} className="space-y-3.5">
              <div>
                <label className="text-xs font-bold text-text-secondary block mb-1">
                  Commission Status
                </label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full bg-surface-hover/50 border border-border rounded-xl px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-primary font-medium"
                >
                  <option value="Paid">Paid (Green - Disbursed)</option>
                  <option value="Pending">Pending (Yellow - Awaiting Payout)</option>
                  <option value="On Hold">On Hold (Orange - Under Audit)</option>
                  <option value="Failed">Failed (Red - Cancelled/Failed)</option>
                </select>
              </div>

              {newStatus === "Paid" && (
                <>
                  <div>
                    <label className="text-xs font-bold text-text-secondary block mb-1">
                      Bank Reference / UTR Number
                    </label>
                    <input
                      type="text"
                      value={newUtr}
                      onChange={(e) => setNewUtr(e.target.value)}
                      placeholder="e.g. UTR-AXIS-20260821-998811"
                      className="w-full bg-surface-hover/50 border border-border rounded-xl px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-primary font-mono"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-text-secondary block mb-1">
                      Disbursement Date
                    </label>
                    <input
                      type="date"
                      value={paidDate}
                      onChange={(e) => setPaidDate(e.target.value)}
                      className="w-full bg-surface-hover/50 border border-border rounded-xl px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-primary"
                    />
                  </div>
                </>
              )}

              <div>
                <label className="text-xs font-bold text-text-secondary block mb-1">
                  Settlement Remarks / Notes
                </label>
                <textarea
                  rows={2}
                  value={settleNotes}
                  onChange={(e) => setSettleNotes(e.target.value)}
                  placeholder="Optional notes for audit trail..."
                  className="w-full bg-surface-hover/50 border border-border rounded-xl px-3 py-2 text-xs text-text-primary focus:outline-none focus:border-primary"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-border">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setSettleModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={submittingSettle}
                >
                  {submittingSettle ? "Updating..." : "Confirm & Save"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Transaction Details Side Drawer */}
      <TransactionDetailsDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        transaction={selectedTxn}
        onStatusUpdated={fetchCommissions}
      />
    </div>
  );
}
