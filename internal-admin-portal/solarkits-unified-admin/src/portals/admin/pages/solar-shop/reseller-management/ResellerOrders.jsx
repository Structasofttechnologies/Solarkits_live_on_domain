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
  FiFileText,
} from "react-icons/fi";
import { authHeaderObj } from "@/app/authHeader";
import { setAlert } from "../../../features/alert.slice";

const API_BASE = import.meta.env.VITE_API_URL;
const MODULE_UID = "RSL_MGMT";

const apiFetch = (method, endpoint, data) =>
  axios({ method, url: `${API_BASE}/reseller-mgmt/orders${endpoint}`, headers: authHeaderObj(), data });

const STATUS_BADGES = {
  completed: { label: "Completed", bg: "bg-success-soft", text: "text-success", icon: FiCheckCircle },
  confirmed: { label: "Confirmed", bg: "bg-info-soft", text: "text-info", icon: FiCheckCircle },
  pending:   { label: "Pending", bg: "bg-warning-soft", text: "text-warning", icon: FiClock },
  cancelled: { label: "Cancelled", bg: "bg-danger-soft", text: "text-danger", icon: FiXCircle },
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
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [modeFilter, setModeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      let url = `${API_BASE}/reseller-mgmt/orders/list?req_for=view&unique_id=${MODULE_UID}`;
      if (modeFilter) url += `&commercial_mode=${modeFilter}`;
      if (statusFilter) url += `&status=${statusFilter}`;
      const res = await axios.get(url, { headers: authHeaderObj() });
      if (res.data?.status === "success") setOrders(res.data.data);
    } catch {
      dispatch(setAlert({ type: "error", message: "Failed to load reseller orders" }));
    } finally {
      setLoading(false);
    }
  }, [dispatch, modeFilter, statusFilter]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const filtered = orders.filter(
    (o) =>
      (o.reseller?.business_name || "").toLowerCase().includes(search.toLowerCase()) ||
      (o.dealer_invoice_number || "").toLowerCase().includes(search.toLowerCase()) ||
      (o.id || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
            <FiShoppingCart className="text-primary" size={24} />
            Reseller Orders
          </h1>
          <p className="text-sm text-text-muted mt-1">
            Track dual-mode reseller orders, commission accruals, and wholesale dealer invoices
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col md:flex-row gap-3 bg-surface p-4 rounded-2xl border border-border shadow-sm">
        <div className="relative flex-1">
          <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" size={16} />
          <input
            type="text"
            placeholder="Search by order ID, reseller name, or invoice number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-border bg-bg text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>

        <select
          value={modeFilter}
          onChange={(e) => setModeFilter(e.target.value)}
          className="px-3 py-2.5 rounded-xl border border-border bg-bg text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
        >
          <option value="">All Operating Modes</option>
          <option value="commission">Commission Mode</option>
          <option value="dealer">Dealer Mode</option>
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2.5 rounded-xl border border-border bg-bg text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
        >
          <option value="">All Order Statuses</option>
          <option value="pending">Pending</option>
          <option value="confirmed">Confirmed</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {/* Table */}
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
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
