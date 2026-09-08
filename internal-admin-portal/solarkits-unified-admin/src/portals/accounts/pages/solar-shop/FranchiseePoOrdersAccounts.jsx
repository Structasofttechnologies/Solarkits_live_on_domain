import { useState, useEffect, useCallback, useMemo } from "react";
import axios from "axios";
import {
  FaFileInvoiceDollar,
  FaSearch,
  FaCheckCircle,
  FaClock,
  FaTimesCircle,
  FaMoneyBillWave,
  FaUsers,
  FaEye,
  FaTimes,
  FaReceipt,
  FaBuilding
} from "react-icons/fa";
import { authHeaderObj } from "@/app/authHeader";
import Loader from "@/components/Loader";

const API_URL = import.meta.env.VITE_API_URL;

const STATUS_BADGES = {
  DRAFT:             { label: "Draft", bg: "bg-slate-100 dark:bg-slate-800", text: "text-slate-600 dark:text-slate-300" },
  SUBMITTED:         { label: "Submitted", bg: "bg-blue-50 dark:bg-blue-900/30", text: "text-blue-600 dark:text-blue-400" },
  PENDING_APPROVAL:  { label: "Pending Approval", bg: "bg-amber-50 dark:bg-amber-900/30", text: "text-amber-600 dark:text-amber-400" },
  CHANGES_REQUESTED: { label: "Changes Requested", bg: "bg-orange-50 dark:bg-orange-900/30", text: "text-orange-600 dark:text-orange-400" },
  APPROVED:          { label: "Approved (Awaiting Payment)", bg: "bg-indigo-50 dark:bg-indigo-900/30", text: "text-indigo-600 dark:text-indigo-400" },
  REJECTED:          { label: "Rejected", bg: "bg-red-50 dark:bg-red-900/30", text: "text-red-600 dark:text-red-400" },
  AWAITING_PAYMENT:  { label: "Awaiting Payment", bg: "bg-indigo-50 dark:bg-indigo-900/30", text: "text-indigo-600 dark:text-indigo-400" },
  PARTIALLY_PAID:    { label: "Partially Paid", bg: "bg-teal-50 dark:bg-teal-900/30", text: "text-teal-600 dark:text-teal-400" },
  PAID:              { label: "Payment Verified", bg: "bg-emerald-50 dark:bg-emerald-900/30", text: "text-emerald-600 dark:text-emerald-400" },
  PROCESSING:        { label: "Processing", bg: "bg-cyan-50 dark:bg-cyan-900/30", text: "text-cyan-600 dark:text-cyan-400" },
  DISPATCHED:        { label: "Dispatched", bg: "bg-purple-50 dark:bg-purple-900/30", text: "text-purple-600 dark:text-purple-400" },
  DELIVERED:         { label: "Delivered", bg: "bg-emerald-50 dark:bg-emerald-900/30", text: "text-emerald-600 dark:text-emerald-400" },
  COMPLETED:         { label: "Settled & Completed", bg: "bg-emerald-50 dark:bg-emerald-900/30", text: "text-emerald-600 dark:text-emerald-400" },
  CANCELLED:         { label: "Cancelled", bg: "bg-rose-50 dark:bg-rose-900/30", text: "text-rose-600 dark:text-rose-400" },
};

function StatusBadge({ status }) {
  const cfg = STATUS_BADGES[status] || STATUS_BADGES.SUBMITTED;
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-black border border-current/20 ${cfg.bg} ${cfg.text}`}>
      {cfg.label}
    </span>
  );
}

export default function FranchiseePoOrdersAccounts() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [selectedOrder, setSelectedOrder] = useState(null);

  // Payment Confirmation Modal State
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentRefInput, setPaymentRefInput] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [alertMsg, setAlertMsg] = useState(null);
  const [verifyingEpcReceipt, setVerifyingEpcReceipt] = useState(null); // { poId, epcBuyerId, action }

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get(
        `${API_URL}/franchisee/po/list?req_for=view`,
        { headers: authHeaderObj() }
      );
      if (res.data?.status === "success") {
        setOrders(res.data.data || []);
      }
    } catch (err) {
      console.error("Failed to load accounts PO orders:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleConfirmPayment = async (e) => {
    e.preventDefault();
    if (!selectedOrder) return;
    setActionLoading(true);
    try {
      const res = await axios.post(
        `${API_URL}/franchisee/po/confirm-payment?req_for=edit`,
        {
          order_id: selectedOrder._id,
          payment_reference: paymentRefInput || `UTR-ACC-${Date.now()}`,
          payment_mode: "BANK_TRANSFER",
        },
        { headers: authHeaderObj() }
      );
      if (res.data?.status === "success") {
        setAlertMsg({ type: "success", text: "Accounts payment verified and confirmed successfully!" });
        setShowPaymentModal(false);
        setPaymentRefInput("");
        setSelectedOrder(null);
        fetchOrders();
      }
    } catch (err) {
      setAlertMsg({ type: "error", text: err.response?.data?.message || "Payment verification failed." });
    } finally {
      setActionLoading(false);
    }
  };

  const handleVerifyEpcReceipt = async (poId, epcBuyerId, action, rejectionNote = "") => {
    setVerifyingEpcReceipt({ poId, epcBuyerId, action });
    try {
      const res = await axios.post(
        `${API_URL}/franchisee/po/verify-epc-receipt?req_for=edit`,
        {
          po_id: poId,
          epc_buyer_id: epcBuyerId,
          action,
          rejection_note: rejectionNote || undefined,
        },
        { headers: authHeaderObj() }
      );
      if (res.data?.status === "success") {
        setAlertMsg({
          type: "success",
          text: res.data.message || (action === "reject" ? "EPC Receipt rejected." : "EPC Payment verified successfully!"),
        });
        setSelectedOrder((prev) => {
          if (!prev) return prev;
          const updatedItems = (prev.items || []).map((item) => ({
            ...item,
            epc_allocations: (item.epc_allocations || []).map((a) => {
              const bId = a.epc_buyer_id?._id || a.epc_buyer_id;
              if (bId?.toString() === epcBuyerId?.toString()) {
                return {
                  ...a,
                  payment_status: action === "reject" ? "PENDING" : "VERIFIED",
                  payment_receipt_url: action === "reject" ? null : a.payment_receipt_url,
                  payment_notes: action === "reject" ? (rejectionNote || "Receipt rejected by Accounts.") : null,
                };
              }
              return a;
            }),
          }));
          return {
            ...prev,
            items: updatedItems,
            status: res.data.all_verified ? "PAID" : prev.status,
          };
        });
        fetchOrders();
      } else {
        setAlertMsg({ type: "error", text: res.data?.message || "Failed to process receipt." });
      }
    } catch (err) {
      setAlertMsg({ type: "error", text: err.response?.data?.message || "Action failed." });
    } finally {
      setVerifyingEpcReceipt(null);
    }
  };

  // Financial Metrics
  const totalVolumePaise = orders.reduce((sum, o) => sum + (o.grand_total_paise || 0), 0);
  const paidVolumePaise = orders
    .filter((o) => ["PAID", "STOCK_ALLOCATED", "PROCESSING", "DISPATCHED", "DELIVERED", "COMPLETED"].includes(o.status))
    .reduce((sum, o) => sum + (o.grand_total_paise || 0), 0);
  const awaitingClearanceCount = orders.filter((o) => ["APPROVED", "AWAITING_PAYMENT"].includes(o.status)).length;
  const pendingReceiptCount = orders.filter((o) =>
    (o.items || []).some((item) => (item.epc_allocations || []).some((a) => a.payment_status === "RECEIPT_SUBMITTED"))
  ).length;
  const totalKitsCount = orders.reduce((sum, o) => sum + (o.total_quantity || o.items?.[0]?.quantity || 0), 0);

  // Filtered Orders
  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      if (statusFilter === "RECEIPT_PENDING") {
        return (o.items || []).some((item) =>
          (item.epc_allocations || []).some((a) => a.payment_status === "RECEIPT_SUBMITTED")
        );
      }
      if (statusFilter && o.status !== statusFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        const num = (o.po_number || "").toLowerCase();
        const fName = (o.franchisee_id?.business_name || "").toLowerCase();
        const kitName = (o.items?.[0]?.item_name || "").toLowerCase();
        return num.includes(q) || fName.includes(q) || kitName.includes(q);
      }
      return true;
    });
  }, [orders, statusFilter, search]);

  return (
    <div className="space-y-6 pb-24">
      {/* Alert Banner */}
      {alertMsg && (
        <div
          className={`p-4 rounded-2xl border text-xs font-bold flex items-center justify-between ${
            alertMsg.type === "success" ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-600" : "bg-red-500/10 border-red-500/30 text-red-600"
          }`}
        >
          <span>{alertMsg.text}</span>
          <button onClick={() => setAlertMsg(null)} className="cursor-pointer">✕</button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-primary/10 text-primary">
              <FaReceipt size={18} />
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-text-primary">
              Franchisee PO Orders & Invoicing
            </h1>
          </div>
          <p className="text-xs text-text-muted mt-1">
            Accounts workspace for verifying franchisee advance payments, UTR receipts, and commercial settlements.
          </p>
        </div>

        <button
          onClick={fetchOrders}
          className="px-4 py-2.5 rounded-xl bg-surface-hover hover:bg-border text-text-primary text-xs font-bold border border-border transition-all cursor-pointer self-start sm:self-auto"
        >
          Refresh Orders
        </button>
      </div>

      {/* Financial Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-5 border-2 border-border shadow-xs flex items-center gap-4">
          <div className="p-3.5 bg-primary/10 rounded-2xl text-primary border border-primary/20">
            <FaMoneyBillWave size={22} />
          </div>
          <div>
            <div className="text-[10px] font-black text-text-muted uppercase tracking-wider">Total PO Volume</div>
            <div className="text-xl font-black text-text-primary mt-0.5">
              ₹{(totalVolumePaise / 100).toLocaleString("en-IN")}
            </div>
            <div className="text-[10px] text-text-muted">{orders.length} Purchase Orders</div>
          </div>
        </div>

        <div className="card p-5 border-2 border-border shadow-xs flex items-center gap-4">
          <div className="p-3.5 bg-emerald-500/10 rounded-2xl text-emerald-600 border border-emerald-500/20">
            <FaCheckCircle size={22} />
          </div>
          <div>
            <div className="text-[10px] font-black text-text-muted uppercase tracking-wider">Verified Payments</div>
            <div className="text-xl font-black text-text-primary mt-0.5">
              ₹{(paidVolumePaise / 100).toLocaleString("en-IN")}
            </div>
            <div className="text-[10px] text-emerald-600 font-bold">Cleared via Bank/UTR</div>
          </div>
        </div>

        <div className="card p-5 border-2 border-border shadow-xs flex items-center gap-4">
          <div className="p-3.5 bg-indigo-500/10 rounded-2xl text-indigo-600 border border-indigo-500/20">
            <FaClock size={22} />
          </div>
          <div>
            <div className="text-[10px] font-black text-text-muted uppercase tracking-wider">Awaiting Clearance</div>
            <div className="text-xl font-black text-text-primary mt-0.5">{awaitingClearanceCount} Orders</div>
            <div className="text-[10px] text-indigo-600 font-bold">Pending Payment Confirmation</div>
          </div>
        </div>

        <div className="card p-5 border-2 border-border shadow-xs flex items-center gap-4">
          <div className="p-3.5 bg-amber-500/10 rounded-2xl text-amber-600 border border-amber-500/20">
            <FaFileInvoiceDollar size={22} />
          </div>
          <div>
            <div className="text-[10px] font-black text-text-muted uppercase tracking-wider">Total Units Ordered</div>
            <div className="text-xl font-black text-text-primary mt-0.5">{totalKitsCount} Kits</div>
            <div className="text-[10px] text-text-muted">Across all EPC buyers</div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-4 border-2 border-border shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" size={14} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by PO Number, Franchisee, or Kit..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl text-xs font-semibold border border-border bg-surface text-text-primary"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3.5 py-2.5 rounded-xl text-xs font-bold border border-border bg-surface text-text-primary cursor-pointer"
        >
          <option value="">All Accounts Statuses</option>
          <option value="AWAITING_PAYMENT">Awaiting Payment</option>
          <option value="APPROVED">Approved (Pending Payment)</option>
          <option value="PAID">Payment Verified (Paid)</option>
          <option value="PROCESSING">Processing</option>
          <option value="DISPATCHED">Dispatched</option>
          <option value="DELIVERED">Delivered</option>
          <option value="COMPLETED">Settled & Completed</option>
        </select>
      </div>

      {/* Orders Table */}
      <div className="bg-surface rounded-2xl border-2 border-border/60 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3">
            <Loader text="Loading Franchisee PO Accounts Records..." />
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="p-12 text-center text-text-muted space-y-2">
            <FaReceipt size={32} className="mx-auto opacity-40 text-primary" />
            <p className="text-sm font-bold text-text-primary">No Franchisee Purchase Orders Found</p>
            <p className="text-xs">Franchisee PO orders with financial payment terms will appear here.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-hover border-b border-border text-[11px] font-black uppercase text-text-muted">
                <tr>
                  <th className="py-3.5 px-4">PO Number & Date</th>
                  <th className="py-3.5 px-4">Franchisee Partner</th>
                  <th className="py-3.5 px-4">Product & Kit</th>
                  <th className="py-3.5 px-4">EPC Allocations</th>
                  <th className="py-3.5 px-4 text-center">Units</th>
                  <th className="py-3.5 px-4">Grand Total (₹)</th>
                  <th className="py-3.5 px-4">Financial Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredOrders.map((order) => {
                  const item = order.items?.[0] || {};
                  const allocationsList = item.epc_allocations || [];
                  const grandTotal = (order.grand_total_paise || 0) / 100;

                  return (
                    <tr key={order._id} className="hover:bg-surface-hover/50 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-mono font-bold text-text-primary text-xs">
                          {order.po_number}
                        </div>
                        <div className="text-[10px] text-text-muted">
                          {new Date(order.created_at || order.createdAt).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-bold text-text-primary">
                          {order.franchisee_id?.business_name || "Franchisee Account"}
                        </div>
                        <div className="text-[10px] text-text-muted">
                          {order.franchisee_id?.mobile || order.franchisee_id?.email || "Partner"}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-bold text-text-primary truncate max-w-xs">
                          {item.item_name || "Solar Kit"}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        {allocationsList.length > 0 ? (
                          <div className="flex flex-col gap-1 max-w-xs">
                            <div className="flex flex-wrap gap-1">
                              {allocationsList.map((a, i) => (
                                <span
                                  key={i}
                                  className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-text-primary border border-border inline-flex items-center gap-1"
                                >
                                  {a.company_name || a.buyer_name}: <strong>{a.allocated_quantity}</strong>
                                  {a.payment_status === "RECEIPT_SUBMITTED" && (
                                    <span className="text-[9px] px-1 py-0.2 rounded bg-blue-100 text-blue-700 font-black">
                                      Slip ⏳
                                    </span>
                                  )}
                                  {a.payment_status === "VERIFIED" && (
                                    <span className="text-[9px] px-1 py-0.2 rounded bg-emerald-100 text-emerald-700 font-black">
                                      ✓
                                    </span>
                                  )}
                                </span>
                              ))}
                            </div>
                            {allocationsList.some((a) => a.payment_status === "RECEIPT_SUBMITTED") && (
                              <div>
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 border border-blue-300">
                                  ⚡ Receipt Verification Pending
                                </span>
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-[10px] text-text-muted">Direct Purchase</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-center font-extrabold text-xs text-primary">
                        {order.total_quantity || item.quantity || 0} Kits
                      </td>

                      <td className="py-3.5 px-4 font-black text-text-primary text-xs">
                        ₹{grandTotal.toLocaleString("en-IN")}
                      </td>

                      <td className="py-3.5 px-4">
                        <StatusBadge status={order.status} />
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => setSelectedOrder(order)}
                          className="px-3 py-1.5 rounded-lg text-xs font-bold bg-primary text-white hover:opacity-90 transition-all cursor-pointer shadow-xs"
                        >
                          Review & Settle
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── ACCOUNTS DETAIL & PAYMENT CONFIRMATION MODAL ────────────────────── */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="relative w-full max-w-2xl max-h-[90vh] flex flex-col rounded-3xl bg-surface border border-border shadow-2xl overflow-hidden z-10">
            <div className="p-6 border-b border-border flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-black text-text-primary">
                    Accounts PO Invoicing: {selectedOrder.po_number}
                  </h2>
                  <StatusBadge status={selectedOrder.status} />
                </div>
                <p className="text-xs text-text-muted mt-0.5">
                  Partner: <strong className="text-text-primary">{selectedOrder.franchisee_id?.business_name || "Franchisee"}</strong>
                </p>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="p-2 rounded-xl hover:bg-surface-hover text-text-muted hover:text-text-primary transition-colors cursor-pointer"
              >
                <FaTimes size={16} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-5 text-xs">
              {/* Product Info */}
              <div className="space-y-2">
                <h4 className="font-bold text-text-primary uppercase tracking-wider text-[11px]">
                  Commercial Breakdown
                </h4>
                <div className="p-4 rounded-xl bg-surface-hover border border-border space-y-2">
                  <div className="flex justify-between text-text-secondary">
                    <span>Kit Item:</span>
                    <span className="font-bold text-text-primary">{selectedOrder.items?.[0]?.item_name}</span>
                  </div>
                  <div className="flex justify-between text-text-secondary">
                    <span>Ordered Units:</span>
                    <span className="font-bold text-text-primary">{selectedOrder.total_quantity || selectedOrder.items?.[0]?.quantity} Kits</span>
                  </div>
                  <div className="flex justify-between text-text-secondary">
                    <span>Subtotal:</span>
                    <span className="font-bold">₹{((selectedOrder.subtotal_paise || 0) / 100).toLocaleString("en-IN")}</span>
                  </div>
                  <div className="flex justify-between text-text-secondary">
                    <span>GST Tax ({selectedOrder.items?.[0]?.gst_rate || 12}%):</span>
                    <span className="font-bold">₹{((selectedOrder.tax_total_paise || 0) / 100).toLocaleString("en-IN")}</span>
                  </div>
                  <div className="flex justify-between text-text-primary font-black text-sm pt-2 border-t border-border">
                    <span>Grand Total Payable:</span>
                    <span className="text-primary font-mono text-base">₹{((selectedOrder.grand_total_paise || 0) / 100).toLocaleString("en-IN")}</span>
                  </div>
                </div>
              </div>

              {/* EPC Allocations Table */}
              <div className="space-y-2">
                <h4 className="font-bold text-text-primary uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                  <FaUsers size={12} className="text-primary" /> EPC Buyer Distribution & Payment Receipts
                </h4>
                <div className="border border-border rounded-xl overflow-hidden">
                  <table className="w-full text-left">
                    <thead className="bg-surface-hover border-b border-border text-[10px] font-black uppercase text-text-muted">
                      <tr>
                        <th className="py-2.5 px-3">EPC Buyer Company</th>
                        <th className="py-2.5 px-3">GSTIN</th>
                        <th className="py-2.5 px-3 text-center">Allocated Kits</th>
                        <th className="py-2.5 px-3 text-center">Payment Status</th>
                        <th className="py-2.5 px-3 text-right">Accounts Verification</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {(selectedOrder.items?.[0]?.epc_allocations || []).map((alloc, aIdx) => {
                        const buyerId = alloc.epc_buyer_id?._id || alloc.epc_buyer_id;
                        const isVerifying = verifyingEpcReceipt?.epcBuyerId === buyerId?.toString();
                        const payStatus = alloc.payment_status || "PENDING";
                        const statusBadge = {
                          PENDING: { label: "Pending", cls: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300" },
                          RECEIPT_SUBMITTED: { label: "Receipt Submitted", cls: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300" },
                          VERIFIED: { label: "Verified ✓", cls: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300" },
                          PAID: { label: "Paid ✓", cls: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300" },
                        }[payStatus] || { label: payStatus, cls: "bg-gray-100 text-gray-800" };

                        return (
                          <tr key={aIdx} className="hover:bg-surface-hover/50 transition-colors">
                            <td className="py-2.5 px-3 font-bold text-text-primary text-xs">
                              {alloc.company_name || alloc.buyer_name}
                              {alloc.payment_notes && (
                                <div className="text-[10px] text-red-600 font-medium mt-0.5">{alloc.payment_notes}</div>
                              )}
                            </td>
                            <td className="py-2.5 px-3 text-text-muted text-[11px]">{alloc.gstin || "N/A"}</td>
                            <td className="py-2.5 px-3 text-center font-black text-primary text-xs">
                              {alloc.allocated_quantity} Kits
                            </td>
                            <td className="py-2.5 px-3 text-center">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${statusBadge.cls}`}>
                                {statusBadge.label}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-right">
                              <div className="flex items-center justify-end gap-1.5 flex-wrap">
                                {alloc.payment_receipt_url && (
                                  <a
                                    href={
                                      alloc.payment_receipt_url.startsWith("http")
                                        ? alloc.payment_receipt_url
                                        : `${(import.meta.env.VITE_API_URL || "http://localhost:5000/api").replace(/\/api\/?$/, "")}${alloc.payment_receipt_url.startsWith("/") ? "" : "/"}${alloc.payment_receipt_url}`
                                    }
                                    target="_blank"
                                    rel="noreferrer"
                                    className="px-2 py-1 rounded-lg text-[10px] font-bold bg-primary/10 text-primary border border-primary/20 hover:bg-primary hover:text-white transition-all inline-flex items-center gap-1"
                                  >
                                    View Receipt
                                  </a>
                                )}
                                {payStatus === "RECEIPT_SUBMITTED" && (
                                  <>
                                    <button
                                      disabled={isVerifying}
                                      onClick={() => handleVerifyEpcReceipt(selectedOrder._id, buyerId?.toString(), "verify")}
                                      className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-emerald-600 text-white hover:bg-emerald-700 transition-all cursor-pointer disabled:opacity-50"
                                    >
                                      {isVerifying && verifyingEpcReceipt?.action === "verify" ? "..." : "✓ Verify"}
                                    </button>
                                    <button
                                      disabled={isVerifying}
                                      onClick={() => {
                                        const note = window.prompt("Rejection reason (shown to EPC buyer):");
                                        if (note !== null) handleVerifyEpcReceipt(selectedOrder._id, buyerId?.toString(), "reject", note);
                                      }}
                                      className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-red-100 text-red-700 border border-red-200 hover:bg-red-600 hover:text-white transition-all cursor-pointer disabled:opacity-50"
                                    >
                                      {isVerifying && verifyingEpcReceipt?.action === "reject" ? "..." : "✕ Reject"}
                                    </button>
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Payment Action */}
              <div className="pt-4 border-t border-border space-y-3">
                <h4 className="font-bold text-text-primary uppercase tracking-wider text-[11px]">
                  Accounts Payment Clearance
                </h4>
                {["APPROVED", "AWAITING_PAYMENT", "PARTIALLY_PAID"].includes(selectedOrder.status) ? (
                  <button
                    onClick={() => setShowPaymentModal(true)}
                    disabled={actionLoading}
                    className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs cursor-pointer shadow-md flex items-center gap-2"
                  >
                    <FaMoneyBillWave size={14} /> Confirm & Verify Bank / UTR Payment
                  </button>
                ) : ["PAID", "STOCK_ALLOCATED", "PROCESSING", "DISPATCHED", "DELIVERED", "COMPLETED"].includes(selectedOrder.status) ? (
                  <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 font-bold text-xs flex items-center gap-2">
                    <FaCheckCircle size={14} /> Payment has been verified and cleared for this Purchase Order.
                  </div>
                ) : (
                  <div className="p-3 rounded-xl bg-surface-hover border border-border text-text-muted text-xs">
                    Order is currently in "{selectedOrder.status}" state. Payment confirmation becomes available upon admin approval.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── PAYMENT CONFIRMATION SUB-MODAL ──────────────────────────────────── */}
      {showPaymentModal && selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="relative w-full max-w-md rounded-2xl bg-surface border border-border shadow-2xl p-6 space-y-4">
            <h3 className="text-base font-black text-text-primary flex items-center gap-2">
              <FaMoneyBillWave className="text-emerald-600" /> Accounts Payment Verification
            </h3>
            <p className="text-xs text-text-muted">
              Enter the bank UTR or NEFT reference for PO <strong>{selectedOrder.po_number}</strong> (Grand Total: <strong>₹{((selectedOrder.grand_total_paise || 0) / 100).toLocaleString("en-IN")}</strong>).
            </p>

            <form onSubmit={handleConfirmPayment} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-text-muted uppercase mb-1">
                  Bank / UTR Reference Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={paymentRefInput}
                  onChange={(e) => setPaymentRefInput(e.target.value)}
                  placeholder="e.g. UTR-HDFC-2026-981122"
                  className="w-full px-3.5 py-2.5 rounded-xl text-xs font-bold border border-border bg-surface text-text-primary"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold border border-border text-text-muted hover:bg-surface-hover cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 rounded-xl text-xs font-black bg-emerald-600 text-white hover:bg-emerald-700 cursor-pointer"
                >
                  Verify & Mark Paid
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
