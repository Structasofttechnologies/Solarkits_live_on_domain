import { useState, useEffect, useCallback } from "react";
import { useDispatch } from "react-redux";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import {
  FiShoppingCart,
  FiSearch,
  FiCheckCircle,
  FiClock,
  FiXCircle,
  FiLoader,
  FiZap,
  FiShoppingBag,
  FiDollarSign,
} from "react-icons/fi";
import { authHeaderObj } from "@/app/authHeader";
import { setAlert } from "../../../features/alert.slice";

const API_BASE = import.meta.env.VITE_API_URL;
const MODULE_UID = "RSL_MGMT";

const STATUS_BADGES = {
  completed: { label: "Completed", bg: "bg-success-soft", text: "text-success", icon: FiCheckCircle },
  confirmed: { label: "Confirmed", bg: "bg-info-soft", text: "text-info", icon: FiCheckCircle },
  pending:   { label: "Pending", bg: "bg-warning-soft", text: "text-warning", icon: FiClock },
  cancelled: { label: "Cancelled", bg: "bg-danger-soft", text: "text-danger", icon: FiXCircle },
  refunded:  { label: "Refunded", bg: "bg-purple-50", text: "text-purple-700", icon: FiXCircle },
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

export default function ResellerOrders({ moduleUniqueId }) {
  const dispatch = useDispatch();
  const [activeTab, setActiveTab] = useState("b2b_procurement"); // "b2b_procurement" | "epc_sales"
  const [orders, setOrders] = useState([]);
  const [procurementOrders, setProcurementOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [modeFilter, setModeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const [refundModal, setRefundModal] = useState(null); // { order }
  const [refundAmount, setRefundAmount] = useState("");
  const [refundReason, setRefundReason] = useState("");
  const [refundLoading, setRefundLoading] = useState(false);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      if (activeTab === "epc_sales") {
        let url = `${API_BASE}/reseller-mgmt/orders/list?req_for=view&unique_id=${MODULE_UID}`;
        if (modeFilter) url += `&commercial_mode=${modeFilter}`;
        if (statusFilter) url += `&status=${statusFilter}`;
        const res = await axios.get(url, { headers: authHeaderObj() });
        if (res.data?.status === "success") setOrders(res.data.data);
      } else {
        let url = `${API_BASE}/reseller-mgmt/procurement/list?req_for=view&unique_id=${MODULE_UID}`;
        if (statusFilter) url += `&order_status=${statusFilter}`;
        const res = await axios.get(url, { headers: authHeaderObj() });
        if (res.data?.status === "success") setProcurementOrders(res.data.data || []);
      }
    } catch {
      dispatch(setAlert({ type: "error", message: "Failed to load reseller orders" }));
    } finally {
      setLoading(false);
    }
  }, [dispatch, activeTab, modeFilter, statusFilter]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleUpdateProcurementStatus = async (orderId, targetStatus, paymentStatus = null) => {
    try {
      const payload = { order_status: targetStatus };
      if (paymentStatus) payload.payment_status = paymentStatus;
      const res = await axios.put(`${API_BASE}/reseller-mgmt/procurement/status/${orderId}?req_for=edit&unique_id=${MODULE_UID}`, payload, { headers: authHeaderObj() });
      if (res.data?.status === "success") {
        dispatch(setAlert({ type: "success", message: `Procurement Order updated to "${targetStatus}"!` }));
        fetchOrders();
      }
    } catch (err) {
      dispatch(setAlert({ type: "error", message: err?.response?.data?.message || "Status update failed" }));
    }
  };

  const handleProcessRefund = async (e) => {
    e.preventDefault();
    if (!refundModal?.order) return;
    setRefundLoading(true);
    try {
      const res = await axios.post(
        `${API_BASE}/reseller-mgmt/refunds/process`,
        {
          order_type: "epc",
          order_id: refundModal.order.id,
          amount_inr: refundAmount ? parseFloat(refundAmount) : null,
          reason: refundReason.trim(),
        },
        { headers: authHeaderObj() }
      );
      if (res.data?.status === "success") {
        dispatch(setAlert({ type: "success", message: `Refund processed! Credit Note #${res.data.data.credit_note?.credit_note_number}` }));
        setRefundModal(null);
        setRefundAmount("");
        setRefundReason("");
        fetchOrders();
      }
    } catch (err) {
      dispatch(setAlert({ type: "error", message: err?.response?.data?.message || "Refund processing failed" }));
    } finally {
      setRefundLoading(false);
    }
  };

  const filtered = orders.filter(
    (o) =>
      (o.reseller?.business_name || "").toLowerCase().includes(search.toLowerCase()) ||
      (o.dealer_invoice_number || "").toLowerCase().includes(search.toLowerCase()) ||
      (o.id || "").toLowerCase().includes(search.toLowerCase())
  );

  const filteredProcurement = procurementOrders.filter(
    (o) =>
      (o.procurement_order_number || "").toLowerCase().includes(search.toLowerCase()) ||
      (o.reseller_id?.business_name || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
            <FiShoppingCart className="text-primary" size={24} />
            Reseller Orders Workspace
          </h1>
          <p className="text-sm text-text-muted mt-1">
            Manage reseller B2B procurement stock orders & EPC customer sales attribution
          </p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-border pb-3">
        <button
          onClick={() => setActiveTab("b2b_procurement")}
          className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
            activeTab === "b2b_procurement"
              ? "bg-primary text-white shadow-md shadow-primary/20"
              : "text-text-secondary hover:bg-surface-hover"
          }`}
        >
          B2B Stock Procurement Orders ({procurementOrders.length})
        </button>
        <button
          onClick={() => setActiveTab("epc_sales")}
          className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
            activeTab === "epc_sales"
              ? "bg-primary text-white shadow-md shadow-primary/20"
              : "text-text-secondary hover:bg-surface-hover"
          }`}
        >
          EPC Customer Orders ({orders.length})
        </button>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col md:flex-row gap-3 bg-surface p-4 rounded-2xl border border-border shadow-sm">
        <div className="relative flex-1">
          <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" size={16} />
          <input
            type="text"
            placeholder={activeTab === "b2b_procurement" ? "Search by order number or reseller name..." : "Search by order ID, reseller name, or invoice number..."}
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
          <option value="">All Order Statuses</option>
          {activeTab === "b2b_procurement" ? (
            <>
              <option value="submitted">Submitted</option>
              <option value="allocated">Allocated / Paid</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
            </>
          ) : (
            <>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
              <option value="refunded">Refunded</option>
            </>
          )}
        </select>
      </div>

      {/* B2B Procurement Orders Table */}
      {activeTab === "b2b_procurement" ? (
        <div className="bg-surface rounded-2xl border border-border shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-20 text-text-muted gap-3">
              <FiLoader className="animate-spin" size={20} />
              <span className="text-sm">Loading B2B procurement orders...</span>
            </div>
          ) : filteredProcurement.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <div className="w-14 h-14 rounded-full bg-surface-hover flex items-center justify-center">
                <FiShoppingBag size={24} className="text-text-muted" />
              </div>
              <p className="text-sm text-text-muted">No B2B procurement orders found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-bg">
                    <th className="text-left text-text-muted font-medium px-5 py-3.5">PO Number & Date</th>
                    <th className="text-left text-text-muted font-medium px-5 py-3.5">Reseller Account</th>
                    <th className="text-left text-text-muted font-medium px-5 py-3.5">Line Items</th>
                    <th className="text-right text-text-muted font-medium px-5 py-3.5">Grand Total (₹)</th>
                    <th className="text-center text-text-muted font-medium px-4 py-3.5">Order Status</th>
                    <th className="text-center text-text-muted font-medium px-4 py-3.5">Payment</th>
                    <th className="text-center text-text-muted font-medium px-4 py-3.5">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  <AnimatePresence>
                    {filteredProcurement.map((po) => (
                      <motion.tr key={po._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="hover:bg-surface-hover transition-colors">
                        <td className="px-5 py-3.5">
                          <div className="font-semibold text-primary font-mono text-xs">{po.procurement_order_number}</div>
                          <div className="text-xs text-text-muted mt-0.5">{new Date(po.created_at).toLocaleDateString()}</div>
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="font-semibold text-text-primary">{po.reseller_id?.business_name || "Reseller Partner"}</div>
                          <div className="text-xs text-text-muted">{po.reseller_id?.email || "—"}</div>
                        </td>
                        <td className="px-5 py-3.5 font-medium text-text-primary">
                          {po.items?.length || 0} Items
                        </td>
                        <td className="px-5 py-3.5 text-right font-extrabold text-text-primary">
                          ₹{((po.grand_total_paise || 0) / 100).toLocaleString("en-IN")}
                        </td>
                        <td className="px-4 py-3.5 text-center">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase ${
                            po.order_status === 'delivered' ? 'bg-success-soft text-success' :
                            po.order_status === 'allocated' ? 'bg-info-soft text-info' : 'bg-warning-soft text-warning'
                          }`}>
                            {po.order_status}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-center">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold uppercase ${
                            po.payment_status === 'paid' ? 'bg-success-soft text-success' : 'bg-surface-hover text-text-muted'
                          }`}>
                            {po.payment_status || 'pending'}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-center">
                          {po.order_status !== 'allocated' && po.order_status !== 'delivered' ? (
                            <button
                              onClick={() => handleUpdateProcurementStatus(po._id, 'allocated', 'paid')}
                              className="px-3 py-1.5 rounded-xl bg-success text-white text-xs font-bold hover:bg-success/90 transition-all shadow-xs cursor-pointer"
                            >
                              Approve & Credit Stock
                            </button>
                          ) : po.order_status === 'allocated' ? (
                            <button
                              onClick={() => handleUpdateProcurementStatus(po._id, 'delivered')}
                              className="px-3 py-1.5 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary-hover transition-all cursor-pointer"
                            >
                              Mark Delivered
                            </button>
                          ) : (
                            <span className="text-xs text-success font-semibold flex items-center justify-center gap-1">
                              <FiCheckCircle size={13} /> Fulfilled
                            </span>
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
      ) : (
        /* EPC Sales Table */
        <div className="bg-surface rounded-2xl border border-border shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-20 text-text-muted gap-3">
              <FiLoader className="animate-spin" size={20} />
              <span className="text-sm">Loading reseller orders...</span>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <div className="w-14 h-14 rounded-full bg-surface-hover flex items-center justify-center">
                <FiShoppingCart size={24} className="text-text-muted" />
              </div>
              <p className="text-sm text-text-muted">No reseller-attributed orders found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-bg">
                    <th className="text-left text-text-muted font-medium px-5 py-3.5">Order ID & Date</th>
                    <th className="text-left text-text-muted font-medium px-5 py-3.5">Attributed Reseller</th>
                    <th className="text-left text-text-muted font-medium px-5 py-3.5">Commercial Mode</th>
                    <th className="text-right text-text-muted font-medium px-5 py-3.5">Order Amount</th>
                    <th className="text-right text-text-muted font-medium px-5 py-3.5">Commission / Dealer Margin</th>
                    <th className="text-center text-text-muted font-medium px-4 py-3.5">Status</th>
                    <th className="text-center text-text-muted font-medium px-4 py-3.5">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  <AnimatePresence>
                    {filtered.map((o) => (
                      <motion.tr key={o.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="hover:bg-surface-hover transition-colors">
                        <td className="px-5 py-3.5">
                          <div className="font-semibold text-text-primary font-mono text-xs">{o.id}</div>
                          <div className="text-xs text-text-muted mt-0.5">{new Date(o.created_at).toLocaleDateString()}</div>
                        </td>
                        <td className="px-5 py-3.5">
                          {o.reseller ? (
                            <div>
                              <div className="font-semibold text-text-primary">{o.reseller.business_name}</div>
                              <div className="text-xs text-text-muted">{o.reseller.email}</div>
                            </div>
                          ) : (
                            <span className="italic text-text-muted">—</span>
                          )}
                        </td>
                        <td className="px-5 py-3.5">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                            o.commercial_mode === 'commission' ? 'bg-info-soft text-primary' : 'bg-warning-soft text-warning'
                          }`}>
                            {o.commercial_mode === 'commission' ? <FiZap size={10} /> : <FiShoppingBag size={10} />}
                            <span className="capitalize">{o.commercial_mode}</span>
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-right font-semibold text-text-primary">
                          ₹{(o.selling_price_snapshot || 0).toLocaleString("en-IN")}
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          {o.commercial_mode === 'commission' ? (
                            <div>
                              <span className="font-semibold text-success">+₹{(o.reseller_commission_amount || 0).toLocaleString("en-IN")}</span>
                              <div className="text-[10px] text-text-muted">Rate: {o.reseller_commission_rate}%</div>
                            </div>
                          ) : (
                            <div>
                              <span className="font-semibold text-warning">Discount: -₹{(o.dealer_discount_amount || 0).toLocaleString("en-IN")}</span>
                              {o.dealer_invoice_number && <div className="text-[10px] text-text-muted">Inv: {o.dealer_invoice_number}</div>}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3.5 text-center">
                          <StatusBadge status={o.status} />
                        </td>
                        <td className="px-4 py-3.5 text-center">
                          <button
                            onClick={() => setRefundModal({ order: o })}
                            className="px-2.5 py-1 rounded-lg bg-danger-soft text-danger hover:bg-danger/20 text-xs font-semibold transition-colors cursor-pointer"
                          >
                            Issue Refund
                          </button>
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── Refund Modal ────────────────────────────────────────────────── */}
      {refundModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface border border-border rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-text-primary flex items-center gap-2">
              <FiDollarSign className="text-danger" size={20} />
              Issue Full or Partial Refund
            </h3>
            <p className="text-xs text-text-muted">
              Order #{refundModal.order.id} (Max refundable: ₹{(refundModal.order.selling_price_snapshot || 0).toLocaleString("en-IN")})
            </p>
            <form onSubmit={handleProcessRefund} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-text-primary block mb-1">Refund Amount (₹)</label>
                <input
                  type="number"
                  placeholder="Leave empty for full refund"
                  value={refundAmount}
                  onChange={(e) => setRefundAmount(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-border bg-bg text-sm text-text-primary"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-text-primary block mb-1">Reason for Refund</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Enter reason for customer refund & credit note generation..."
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-border bg-bg text-sm text-text-primary"
                />
              </div>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setRefundModal(null)}
                  className="px-4 py-2 rounded-xl border border-border text-xs font-semibold text-text-secondary hover:bg-bg-card-hover"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={refundLoading}
                  className="px-4 py-2 rounded-xl bg-danger text-white text-xs font-bold hover:bg-danger-hover disabled:opacity-60"
                >
                  {refundLoading ? "Processing..." : "Confirm & Issue Refund"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
