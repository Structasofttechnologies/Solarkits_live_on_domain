import { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import axiosInstance from '@/utils/axiosInstance';
import {
  FiCheckCircle,
  FiUploadCloud,
  FiClock,
  FiXCircle,
  FiCopy,
  FiCheck,
  FiDollarSign,
  FiShield,
  FiZap,
  FiLayers,
  FiPackage,
  FiUser,
  FiPhone,
  FiMail,
  FiExternalLink,
  FiBox,
  FiCalendar,
  FiUsers,
  FiPlus,
  FiAlertCircle,
  FiLoader,
  FiX,
  FiRefreshCw,
  FiEye,
  FiFileText,
  FiTrendingUp,
} from 'react-icons/fi';
import toast from 'react-hot-toast';

const STATUS_CONFIG = {
  DRAFT: { label: "Draft", bg: "bg-slate-100 dark:bg-slate-800", text: "text-slate-600 dark:text-slate-300", icon: FiFileText },
  SUBMITTED: { label: "Submitted", bg: "bg-blue-50 dark:bg-blue-900/30", text: "text-blue-600 dark:text-blue-400", icon: FiClock },
  PENDING_APPROVAL: { label: "Pending Approval", bg: "bg-amber-50 dark:bg-amber-900/30", text: "text-amber-600 dark:text-amber-400", icon: FiClock },
  CHANGES_REQUESTED: { label: "Changes Requested", bg: "bg-orange-50 dark:bg-orange-900/30", text: "text-orange-600 dark:text-orange-400", icon: FiAlertCircle },
  APPROVED: { label: "Approved", bg: "bg-emerald-50 dark:bg-emerald-900/30", text: "text-emerald-600 dark:text-emerald-400", icon: FiCheckCircle },
  REJECTED: { label: "Rejected", bg: "bg-red-50 dark:bg-red-900/30", text: "text-red-600 dark:text-red-400", icon: FiX },
  AWAITING_PAYMENT: { label: "Awaiting Payment", bg: "bg-indigo-50 dark:bg-indigo-900/30", text: "text-indigo-600 dark:text-indigo-400", icon: FiDollarSign },
  PARTIALLY_PAID: { label: "Partially Paid", bg: "bg-teal-50 dark:bg-teal-900/30", text: "text-teal-600 dark:text-teal-400", icon: FiDollarSign },
  PAID: { label: "Paid", bg: "bg-emerald-50 dark:bg-emerald-900/30", text: "text-emerald-600 dark:text-emerald-400", icon: FiCheckCircle },
  CONFIRMED: { label: "Confirmed", bg: "bg-emerald-50 dark:bg-emerald-900/30", text: "text-emerald-600 dark:text-emerald-400", icon: FiCheckCircle },
  PROCESSING: { label: "Processing", bg: "bg-cyan-50 dark:bg-cyan-900/30", text: "text-cyan-600 dark:text-cyan-400", icon: FiRefreshCw },
  DISPATCHED: { label: "Dispatched", bg: "bg-purple-50 dark:bg-purple-900/30", text: "text-purple-600 dark:text-purple-400", icon: FiBox },
  DELIVERED: { label: "Delivered", bg: "bg-emerald-50 dark:bg-emerald-900/30", text: "text-emerald-600 dark:text-emerald-400", icon: FiCheckCircle },
  COMPLETED: { label: "Completed", bg: "bg-emerald-50 dark:bg-emerald-900/30", text: "text-emerald-600 dark:text-emerald-400", icon: FiCheckCircle },
  EXPIRED: { label: "Expired", bg: "bg-rose-50 dark:bg-rose-950/30", text: "text-rose-600 dark:text-rose-400", icon: FiClock },
  REFUND_REQUESTED: { label: "Refund Requested", bg: "bg-amber-50 dark:bg-amber-950/30", text: "text-amber-600 dark:text-amber-400", icon: FiClock },
  REFUND_APPROVED: { label: "Refund Approved", bg: "bg-blue-50 dark:bg-blue-950/30", text: "text-blue-600 dark:text-blue-400", icon: FiCheckCircle },
  REFUND_SETTLED: { label: "Refund Settled", bg: "bg-emerald-50 dark:bg-emerald-950/30", text: "text-emerald-600 dark:text-emerald-400", icon: FiDollarSign },
  REFUND_REJECTED: { label: "Refund Rejected", bg: "bg-rose-50 dark:bg-rose-950/30", text: "text-rose-600 dark:text-rose-400", icon: FiX },
  CANCELLED: { label: "Cancelled", bg: "bg-rose-50 dark:bg-rose-900/30", text: "text-rose-600 dark:text-rose-400", icon: FiX },
};

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.SUBMITTED;
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border border-current/20 ${cfg.bg} ${cfg.text}`}>
      <Icon size={11} /> {cfg.label}
    </span>
  );
}

// ── PO Order Card Component for Direct EPC (11 Mandatory Fields) ─────────────
function EpcPoCardItem({ order, onSelectOrder, onOpenReorder, onOpenRefund }) {
  const item = order.items?.[0] || {};
  const booked = order.total_booked_quantity || order.total_quantity || item.quantity || 0;
  const fulfilled = order.fulfilled_quantity || 0;
  const remaining = order.remaining_quantity != null ? order.remaining_quantity : Math.max(0, booked - fulfilled);
  const progressPct = booked > 0 ? Math.min(100, Math.round((fulfilled / booked) * 100)) : 0;

  const tokenPaidINR = Math.round((order.token_amount_paise || order.token_paid_paise || 0) / 100);
  const tokenAdjustedINR = Math.round((order.token_adjusted_total_paise || 0) / 100);
  const tokenBalanceINR = order.token_balance_paise != null
    ? Math.round(order.token_balance_paise / 100)
    : Math.max(0, tokenPaidINR - tokenAdjustedINR);

  const settlementMode = order.token_settlement_mode || order.penalty_rule_snapshot?.token_settlement_rule || "PRO_RATA";
  const expiryDate = order.lock_expires_at || order.expires_at;
  const isExpired = order.status === "EXPIRED" || (expiryDate && new Date(expiryDate).getTime() < Date.now());
  const daysLeft = expiryDate
    ? Math.ceil((new Date(expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : 30;
  const validityDays = order.po_settings_snapshot?.po_validity_days || order.po_settings_snapshot?.po_lock_days || 30;

  const penaltyPaise = order.applicable_penalty_paise || 0;
  const penaltyINR = Math.round(penaltyPaise / 100);

  // Refund Snapshot
  const refundReq = order.refund_request_snapshot;
  const hasRefundReq = Boolean(refundReq && refundReq.status);

  // Creator Attribution
  const isBdeCreated = order.created_by_role === "BDE";
  const creatorDisplay = isBdeCreated
    ? `BDE: ${order.creator_name || "Assigned BDE"}${order.creator_code ? ` (${order.creator_code})` : ""}`
    : "Solar EPC Direct";

  // Customer / Hub details
  const customerName = order.customer_details?.company_name || order.customer_details?.name || "Solar EPC Store";
  const customerLocation = [order.customer_details?.district, order.customer_details?.state].filter(Boolean).join(", ") || order.customer_details?.phone || "India";

  // Reorder & Refund eligibility
  const canReorder = remaining > 0 && !isExpired && !["CANCELLED", "REJECTED", "EXPIRED"].includes(order.status);
  const canRequestRefund = !hasRefundReq && tokenBalanceINR > 0 && (isExpired || remaining === 0);

  return (
    <div
      className="rounded-3xl border-2 p-5 sm:p-6 shadow-sm flex flex-col justify-between gap-5 relative overflow-hidden transition-all hover:shadow-lg hover:border-primary/40 bg-surface border-border"
    >
      <div className="space-y-4">
        {/* Row 1: PO Number, Creator Badge & Status */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono font-black text-sm text-text-primary px-2.5 py-1 rounded-xl bg-surface-hover border border-border">
              {order.po_number}
            </span>
            <span
              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-black border ${
                isBdeCreated
                  ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30"
                  : "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30"
              }`}
            >
              {isBdeCreated ? <FiUsers size={11} /> : <FiShield size={11} />}
              {creatorDisplay}
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-black bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
              <FiBox size={11} /> Direct EPC Quota
            </span>
          </div>

          <div className="flex items-center gap-2">
            <StatusBadge status={order.status} />
          </div>
        </div>

        {/* Row 2: Customer / EPC Details & Created Date */}
        <div className="p-3 rounded-2xl bg-surface-hover/50 border border-border/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
          <div>
            <div className="text-[10px] font-black uppercase tracking-wider text-text-muted">
              Partner / Customer Details
            </div>
            <div className="font-bold text-text-primary text-xs mt-0.5">{customerName}</div>
            <div className="text-[11px] text-text-muted">{customerLocation}</div>
          </div>
          <div className="sm:text-right">
            <div className="text-[10px] font-black uppercase tracking-wider text-text-muted">
              Created Date
            </div>
            <div className="font-semibold text-text-secondary text-xs mt-0.5">
              {new Date(order.created_at || order.createdAt).toLocaleDateString("en-IN", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </div>
          </div>
        </div>

        {/* Row 3: Product Name & Committed Quantity */}
        <div>
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black text-text-primary line-clamp-1">
              {item.item_name || "Solar Combo Kit Package"}
            </h3>
            <span className="text-xs font-black text-primary shrink-0 ml-2">
              {booked} Kits Committed
            </span>
          </div>
          {item.item_code && (
            <p className="text-[10px] font-mono text-text-muted mt-0.5">Code: {item.item_code}</p>
          )}
        </div>

        {/* Row 4: Purchased Qty vs Pending Qty Strip with Visual Progress Bar */}
        <div className="p-3.5 rounded-2xl border border-border bg-surface-hover space-y-2.5">
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="space-y-0.5">
              <div className="text-[10px] font-black uppercase tracking-wider text-text-muted">
                📦 Committed
              </div>
              <div className="text-sm font-black text-text-primary">{booked} Kits</div>
            </div>

            <div className="space-y-0.5 border-x border-border/60">
              <div className="text-[10px] font-black uppercase tracking-wider text-blue-600 dark:text-blue-400">
                🚚 Purchased
              </div>
              <div className="text-sm font-black text-blue-600 dark:text-blue-400">
                {fulfilled} ({progressPct}%)
              </div>
            </div>

            <div className="space-y-0.5">
              <div className="text-[10px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                🟢 Pending
              </div>
              <div className="text-sm font-black text-emerald-600 dark:text-emerald-400">
                {remaining} Kits
              </div>
            </div>
          </div>

          <div className="w-full h-2 rounded-full bg-border overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500 bg-gradient-to-r from-blue-500 to-emerald-500"
              style={{ width: `${Math.min(100, Math.max(progressPct, 4))}%` }}
            />
          </div>
        </div>

        {/* Row 5: Token Paid & Amount Adjusted Strip */}
        <div className="p-3 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/40 space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800 dark:text-emerald-400 flex items-center gap-1">
              <FiDollarSign size={12} /> Token Escrow & Settlement
            </span>
            <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-emerald-600 text-white">
              {settlementMode === "PRO_RATA" ? "Pro-Rata Settlement" : settlementMode === "FINAL_ORDER" ? "Final Order Settlement" : "Upfront Settlement"}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2 pt-1 border-t border-emerald-200/60 dark:border-emerald-800/40 text-center">
            <div>
              <div className="text-[10px] text-text-muted">Token Paid</div>
              <div className="text-xs font-black text-text-primary">₹{tokenPaidINR.toLocaleString("en-IN")}</div>
            </div>
            <div className="border-x border-emerald-200/60 dark:border-emerald-800/40">
              <div className="text-[10px] text-text-muted">Adjusted</div>
              <div className="text-xs font-black text-blue-600">₹{tokenAdjustedINR.toLocaleString("en-IN")}</div>
            </div>
            <div>
              <div className="text-[10px] text-text-muted">In Escrow</div>
              <div className="text-xs font-black text-emerald-600">₹{tokenBalanceINR.toLocaleString("en-IN")}</div>
            </div>
          </div>
        </div>

        {/* Row 6: PO Validity, Expiry & Days Left */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="p-2.5 rounded-xl border border-border bg-surface-hover/30">
            <div className="text-[10px] font-black uppercase tracking-wider text-text-muted flex items-center gap-1">
              <FiCalendar size={11} /> Validity & Expiry
            </div>
            <div className="font-black text-text-primary text-xs mt-0.5">
              {validityDays} Days Validity
            </div>
            <div className="text-[10px] text-text-muted truncate">
              {expiryDate ? `Till ${new Date(expiryDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}` : "Ongoing"}
            </div>
          </div>

          <div className="p-2.5 rounded-xl border border-border bg-surface-hover/30">
            <div className="text-[10px] font-black uppercase tracking-wider text-text-muted flex items-center gap-1">
              <FiClock size={11} /> Remaining Days
            </div>
            <div className="mt-1">
              {isExpired ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300">
                  🔴 Lock Expired ({Math.abs(daysLeft)}d ago)
                </span>
              ) : daysLeft <= 5 ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300">
                  🟠 Expiring Soon ({daysLeft}d left)
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                  🟢 Active ({daysLeft}d left)
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Row 7: Applicable Penalty & Refund Eligibility & Status */}
        <div className="p-3 rounded-2xl border border-border/80 bg-surface-hover/40 space-y-1.5 text-xs">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-text-muted font-bold flex items-center gap-1">
              <FiAlertCircle size={12} className="text-amber-500" /> Applicable Penalty:
            </span>
            <span className="font-mono font-black text-text-primary">
              {penaltyINR > 0 ? (
                <span className="text-rose-600">₹{penaltyINR.toLocaleString("en-IN")} (Applied)</span>
              ) : isExpired && remaining > 0 ? (
                <span className="text-amber-600">₹{Math.min(tokenBalanceINR, remaining * 500).toLocaleString("en-IN")} (Pending Settle)</span>
              ) : (
                <span className="text-text-muted">₹500 / kit on unpurchased</span>
              )}
            </span>
          </div>

          <div className="flex items-center justify-between text-[11px] pt-1 border-t border-border/40">
            <span className="text-text-muted font-bold flex items-center gap-1">
              <FiCheckCircle size={12} className="text-primary" /> Refund Status:
            </span>
            <span>
              {hasRefundReq ? (
                <StatusBadge status={`REFUND_${refundReq.status}`} />
              ) : isExpired || (remaining === 0 && tokenBalanceINR > 0) ? (
                <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                  🎁 Eligible for Refund
                </span>
              ) : (
                <span className="text-[10px] font-bold text-text-muted">
                  🔒 Locked in Escrow
                </span>
              )}
            </span>
          </div>
        </div>
      </div>

      {/* Card Action Footer */}
      <div className="pt-3 border-t border-border flex flex-wrap items-center justify-between gap-2">
        <button
          onClick={() => onSelectOrder(order)}
          className="px-3.5 py-2 rounded-xl text-xs font-bold text-text-secondary hover:text-text-primary hover:bg-surface-hover border border-border transition-all cursor-pointer"
        >
          View Full PO
        </button>

        <div className="flex items-center gap-2">
          {canRequestRefund && (
            <button
              onClick={() => onOpenRefund(order)}
              className="flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-black bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/30 hover:bg-amber-500/20 transition-all cursor-pointer"
            >
              <FiDollarSign size={13} />
              <span>Request Refund</span>
            </button>
          )}

          {canReorder && (
            <button
              onClick={() => onOpenReorder(order)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black bg-primary text-white hover:opacity-90 transition-all shadow-md cursor-pointer transform active:scale-95"
            >
              <FiPlus size={14} />
              <span>⚡ Reorder Kits ({remaining} left)</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function EpcPoAllocations() {
  const { user } = useSelector((state) => state.auth_slice);

  // Tab State: "my_pos" vs "franchisee_allocations"
  const [activeTab, setActiveTab] = useState("my_pos");

  // Direct PO Orders State
  const [directOrders, setDirectOrders] = useState([]);
  const [directLoading, setDirectLoading] = useState(false);
  const [selectedDirectOrder, setSelectedDirectOrder] = useState(null);

  // Reorder Modal State
  const [reorderModal, setReorderModal] = useState(false);
  const [reorderOrder, setReorderOrder] = useState(null);
  const [reorderQty, setReorderQty] = useState(1);
  const [reorderUtr, setReorderUtr] = useState("");
  const [reorderBank, setReorderBank] = useState("");
  const [reorderDate, setReorderDate] = useState(new Date().toISOString().slice(0, 10));
  const [reorderSubmitting, setReorderSubmitting] = useState(false);
  const [reorderError, setReorderError] = useState("");
  const [reorderSuccess, setReorderSuccess] = useState(null);

  // Refund Modal State
  const [refundModal, setRefundModal] = useState(false);
  const [refundOrder, setRefundOrder] = useState(null);
  const [refundLoading, setRefundLoading] = useState(false);
  const [refundPreview, setRefundPreview] = useState(null);
  const [refundForm, setRefundForm] = useState({
    account_holder_name: "",
    bank_name: "",
    account_number: "",
    confirm_account_number: "",
    ifsc_code: "",
    notes: ""
  });
  const [refundSubmitting, setRefundSubmitting] = useState(false);
  const [refundError, setRefundError] = useState("");
  const [refundSuccess, setRefundSuccess] = useState(null);

  // Franchisee Allocations State (Legacy)
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [iciciVanDetails, setIciciVanDetails] = useState(null);
  const [copiedField, setCopiedField] = useState("");
  const [activeUploadOrderId, setActiveUploadOrderId] = useState(null);
  const [receiptFile, setReceiptFile] = useState(null);
  const [manualUtr, setManualUtr] = useState("");
  const [uploading, setUploading] = useState(false);

  // Escrow Bank Info
  const escrowBank = {
    account_name: "SolarKits Technologies Pvt Ltd (Escrow Account)",
    bank_name: "ICICI Bank Corporate Banking",
    account_number: "000205018899",
    ifsc_code: "ICIC0000002",
    branch: "Bandra Kurla Complex, Mumbai",
    upi_id: "solarkits.token@icici",
  };

  const handleCopyText = (text, field) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    toast.success(`Copied: ${text}`);
    setTimeout(() => setCopiedField(""), 2500);
  };

  // Fetch Direct PO Orders
  const fetchDirectOrders = useCallback(async () => {
    setDirectLoading(true);
    try {
      const res = await axiosInstance.get("/india/v1/shop/po/my-orders");
      if (res.data?.success && Array.isArray(res.data.data)) {
        setDirectOrders(res.data.data);
      }
    } catch (err) {
      console.error("Failed to load direct PO orders:", err);
    } finally {
      setDirectLoading(false);
    }
  }, []);

  // Fetch Franchisee Allocations
  const fetchAllocations = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get("/india/v1/shop/po-allocations");
      if (res.data?.success) {
        setOrders(res.data.data);
      }
    } catch (err) {
      toast.error("Failed to load PO allocations");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDirectOrders();
    fetchAllocations();
  }, [fetchDirectOrders, fetchAllocations]);

  // ICICI Virtual Account Stream
  useEffect(() => {
    const rawApiUrl = import.meta.env.VITE_API_URL || "http://localhost:5000";
    const baseUrl = rawApiUrl.replace(/\/api\/?$/, "").replace(/\/+$/, "");
    const userPhone = user?.whatsapp || user?.registered_whatsapp || user?.mobile || "9876543210";

    fetch(`${baseUrl}/api/v1/payments/icici/van-details?phone=${userPhone}`)
      .then((res) => res.json())
      .then((d) => {
        if (d?.success) setIciciVanDetails(d.data);
      })
      .catch((err) => console.warn("Could not load ICICI VAN details:", err));

    const epcId = user?._id || user?.id || user?.account_id;
    const streamUrl = `${baseUrl}/api/v1/payments/icici/stream?role=epc&epc_id=${epcId || ""}`;
    const es = new EventSource(streamUrl);

    es.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "ICICI_PAYMENT_CREDITED") {
          toast.success(
            `Payment of ${data.amountFormatted || "₹" + data.amount} confirmed via ICICI UTR: ${data.utr}!`,
            { duration: 7000 }
          );
          fetchAllocations();
          fetchDirectOrders();
        }
      } catch (err) {
        console.error(err);
      }
    };

    return () => es.close();
  }, [user, fetchAllocations, fetchDirectOrders]);

  // Manual Receipt Upload Handler (Franchisee Allocations)
  const handleUpload = async (poId) => {
    if (!receiptFile) {
      toast.error("Please select a receipt file to upload");
      return;
    }
    const formData = new FormData();
    formData.append("files", receiptFile);
    if (manualUtr) formData.append("utr_number", manualUtr);

    setUploading(true);
    try {
      const res = await axiosInstance.post(`/india/v1/shop/po-allocations/${poId}/upload-receipt`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      if (res.data?.success) {
        toast.success("Receipt submitted successfully for verification");
        setReceiptFile(null);
        setManualUtr("");
        setActiveUploadOrderId(null);
        fetchAllocations();
      } else {
        toast.error(res.data?.message || "Failed to upload receipt");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to upload receipt");
    } finally {
      setUploading(false);
    }
  };

  // Reorder from Direct PO Handlers
  const handleOpenReorderModal = (order) => {
    setReorderOrder(order);
    const booked = order.total_booked_quantity || order.total_quantity || order.items?.[0]?.quantity || 1;
    const fulfilled = order.fulfilled_quantity || 0;
    const remaining = order.remaining_quantity != null ? order.remaining_quantity : Math.max(1, booked - fulfilled);
    setReorderQty(Math.min(1, remaining));
    setReorderUtr("");
    setReorderBank("");
    setReorderDate(new Date().toISOString().slice(0, 10));
    setReorderError("");
    setReorderSuccess(null);
    setReorderModal(true);
  };

  const handleSubmitReorder = async (e) => {
    e.preventDefault();
    setReorderError("");
    if (!reorderUtr.trim()) {
      setReorderError("Please enter the UTR / Payment Transaction reference number.");
      return;
    }

    const item = reorderOrder?.items?.[0] || {};
    const unitPriceINR = (item.unit_price_paise || 0) / 100;
    const gstRate = item.gst_rate || 13.85;
    const subtotal = reorderQty * unitPriceINR;
    const grossTotal = Math.round(subtotal + subtotal * (gstRate / 100));

    const totalCommitted = Number(reorderOrder?.total_booked_quantity || item.quantity || 100);
    const totalToken = Math.round((reorderOrder?.token_amount_paise || reorderOrder?.token_paid_paise || 0) / 100);
    const adjustedSoFar = Math.round((reorderOrder?.token_adjusted_total_paise || 0) / 100);
    const availableToken = Math.max(0, totalToken - adjustedSoFar);
    const settlementMode = reorderOrder?.token_settlement_mode || reorderOrder?.penalty_rule_snapshot?.token_settlement_rule || "PRO_RATA";
    const currentRemaining = reorderOrder?.remaining_quantity != null ? reorderOrder.remaining_quantity : totalCommitted;

    let tokenAdjusted = 0;
    if (reorderQty === currentRemaining) {
      tokenAdjusted = Math.min(availableToken, grossTotal);
    } else if (settlementMode === "PRO_RATA") {
      const perKit = totalCommitted > 0 ? Math.floor(totalToken / totalCommitted) : 0;
      tokenAdjusted = Math.min(availableToken, reorderQty * perKit, grossTotal);
    } else if (settlementMode === "UPFRONT") {
      tokenAdjusted = Math.min(availableToken, grossTotal);
    }

    const netPayable = Math.max(0, grossTotal - tokenAdjusted);

    setReorderSubmitting(true);
    try {
      const payload = {
        quantity: reorderQty,
        kit_id: item.kit_id || item.product_id,
        offline_payment: {
          payment_method: "offline_bank_transfer",
          utr_number: reorderUtr.trim().toUpperCase(),
          amount_paid: netPayable,
          payment_date: reorderDate,
          sender_bank_name: reorderBank || "Bank Transfer",
        },
      };

      const res = await axiosInstance.post(`/india/v1/shop/po/${reorderOrder._id}/reorder`, payload);
      if (res.data?.success) {
        setReorderSuccess({
          orderNumber: res.data.data?.order?.po_number,
          adjusted: res.data.data?.token_adjustment?.token_adjusted_inr,
          payable: res.data.data?.token_adjustment?.net_payable_inr,
        });
        fetchDirectOrders();
      } else {
        setReorderError(res.data?.message || "Failed to create repeat order.");
      }
    } catch (err) {
      setReorderError(err.response?.data?.message || "Failed to create repeat order.");
    } finally {
      setReorderSubmitting(false);
    }
  };

  // Refund Request Handlers
  const handleOpenRefundModal = async (order) => {
    setRefundOrder(order);
    setRefundError("");
    setRefundSuccess(null);
    setRefundForm({
      account_holder_name: order.customer_details?.name || order.customer_details?.company_name || "",
      bank_name: "",
      account_number: "",
      confirm_account_number: "",
      ifsc_code: "",
      notes: "PO quota completion / validity settlement",
    });
    setRefundModal(true);
    setRefundLoading(true);

    try {
      const res = await axiosInstance.get(`/india/v1/shop/po/${order._id}/penalty-preview`);
      if (res.data?.success) {
        setRefundPreview(res.data.data);
      } else {
        setRefundError(res.data?.message || "Unable to load penalty preview.");
      }
    } catch (err) {
      setRefundError(err.response?.data?.message || "Unable to load penalty preview.");
    } finally {
      setRefundLoading(false);
    }
  };

  const handleSubmitRefund = async (e) => {
    e.preventDefault();
    setRefundError("");

    if (!refundForm.account_number.trim()) {
      setRefundError("Please enter your bank account number.");
      return;
    }
    if (refundForm.account_number.trim() !== refundForm.confirm_account_number.trim()) {
      setRefundError("Account number and confirmation do not match.");
      return;
    }
    if (!refundForm.ifsc_code.trim()) {
      setRefundError("Please enter your bank IFSC code.");
      return;
    }

    setRefundSubmitting(true);
    try {
      const payload = {
        bank_details: {
          account_holder_name: refundForm.account_holder_name.trim(),
          bank_name: refundForm.bank_name.trim(),
          account_number: refundForm.account_number.trim(),
          ifsc_code: refundForm.ifsc_code.trim().toUpperCase(),
        },
        reason: refundForm.notes.trim(),
      };

      const res = await axiosInstance.post(`/india/v1/shop/po/${refundOrder._id}/request-refund`, payload);
      if (res.data?.success) {
        setRefundSuccess("Refund request submitted successfully! Accounts team will review and process payout.");
        fetchDirectOrders();
      } else {
        setRefundError(res.data?.message || "Failed to submit refund request.");
      }
    } catch (err) {
      setRefundError(err.response?.data?.message || "Failed to submit refund request.");
    } finally {
      setRefundSubmitting(false);
    }
  };

  // Franchisee Allocation Status Badge Helper
  const AllocationStatusBadge = ({ status, utr }) => {
    if (status === "VERIFIED" || status === "PAID") {
      return (
        <div className="flex items-center gap-1.5">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-500/30 shadow-xs">
            <FiCheckCircle className="mr-1 text-emerald-600" />
            PAID & VERIFIED
          </span>
          {utr && (
            <span className="text-[11px] font-mono font-semibold text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
              UTR: {utr}
            </span>
          )}
        </div>
      );
    }
    if (status === "RECEIPT_SUBMITTED") {
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-300 border border-blue-500/30 shadow-xs">
          <FiUploadCloud className="mr-1 text-blue-600" />
          RECEIPT SUBMITTED (VERIFICATION PENDING)
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-500/30 shadow-xs">
        <FiClock className="mr-1 text-amber-600" />
        PAYMENT PENDING
      </span>
    );
  };

  return (
    <div className="space-y-6 pb-24">
      {/* Top Header Banner */}
      <div
        className="relative rounded-3xl p-6 sm:p-8 text-white shadow-xl overflow-hidden"
        style={{ background: "linear-gradient(135deg, #0f172a 0%, #1e3a8a 50%, #2563eb 100%)" }}
      >
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-400/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black tracking-wider uppercase bg-white/20 backdrop-blur-md border border-white/20 text-white">
                <FiShield size={12} /> Solar EPC Purchase Orders & Quotas
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              Purchase Orders & Token Escrow Lifecycle
            </h1>
            <p className="text-white/80 text-xs sm:text-sm max-w-xl">
              Lock bulk kit quotas with guaranteed pricing, draw repeat orders against your PO balance, and manage token settlement, penalty calculation, and escrow refunds.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                fetchDirectOrders();
                fetchAllocations();
              }}
              className="p-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white border border-white/20 transition-all cursor-pointer"
              title="Refresh All PO Data"
            >
              <FiRefreshCw size={17} className={directLoading || loading ? "animate-spin" : ""} />
            </button>
          </div>
        </div>
      </div>

      {/* Tabs Switcher */}
      <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-surface border border-border shadow-2xs overflow-x-auto">
        <button
          onClick={() => setActiveTab("my_pos")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap ${
            activeTab === "my_pos"
              ? "bg-primary text-white shadow-sm"
              : "text-text-muted hover:text-text-primary hover:bg-surface-hover"
          }`}
        >
          <FiBox size={14} />
          <span>My Purchase Orders & Quotas</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] bg-white/20">{directOrders.length}</span>
        </button>

        <button
          onClick={() => setActiveTab("franchisee_allocations")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap ${
            activeTab === "franchisee_allocations"
              ? "bg-primary text-white shadow-sm"
              : "text-text-muted hover:text-text-primary hover:bg-surface-hover"
          }`}
        >
          <FiUsers size={14} />
          <span>Franchise Partner Pooled Allocations</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] bg-white/20">{orders.length}</span>
        </button>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* TAB 1: DIRECT PURCHASE ORDERS & ESCROW QUOTAS                          */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === "my_pos" && (
        <div className="space-y-4">
          {directLoading && directOrders.length === 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {[1, 2, 3].map((i) => (
                <div key={i} className="p-6 rounded-3xl border border-border bg-surface animate-pulse space-y-4">
                  <div className="h-5 bg-slate-200 dark:bg-slate-700 rounded w-1/3" />
                  <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-2/3" />
                  <div className="h-20 bg-slate-200 dark:bg-slate-700 rounded-2xl" />
                </div>
              ))}
            </div>
          ) : directOrders.length === 0 ? (
            <div className="p-12 text-center rounded-3xl border border-dashed border-border bg-surface flex flex-col items-center justify-center gap-3">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                <FiPackage size={26} />
              </div>
              <h3 className="text-base font-bold text-text-primary">No Direct Purchase Orders Found</h3>
              <p className="text-xs text-text-muted max-w-sm">
                You do not have any active purchase orders booked directly. Book kits or coordinate with your Franchisee/BDE partner to initialize your quota.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {directOrders.map((order) => (
                <EpcPoCardItem
                  key={order._id}
                  order={order}
                  onSelectOrder={setSelectedDirectOrder}
                  onOpenReorder={handleOpenReorderModal}
                  onOpenRefund={handleOpenRefundModal}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* TAB 2: FRANCHISEE POOLED ALLOCATIONS (LEGACY VIEW)                    */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === "franchisee_allocations" && (
        <div className="space-y-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center p-16 bg-surface rounded-2xl border border-border">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#264baa]"></div>
              <p className="text-xs font-bold text-text-secondary mt-3">Loading allocated purchase orders...</p>
            </div>
          ) : orders.length === 0 ? (
            <div className="bg-surface border border-border rounded-2xl p-16 text-center shadow-xs">
              <div className="w-16 h-16 rounded-full bg-[#264baa]/10 flex items-center justify-center mx-auto mb-3">
                <FiPackage className="h-8 w-8 text-[#264baa]" />
              </div>
              <h3 className="text-base font-bold text-text-primary dark:text-white">No PO Allocations Found</h3>
              <p className="text-xs text-text-secondary mt-1 max-w-md mx-auto">
                You do not currently have any pending purchase order allocations from your Franchise Partner.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {orders.map((order) => {
                let epcAlloc = null;
                let allocatedItem = null;
                order.items?.forEach((item) => {
                  const match = item.epc_allocations?.find(
                    (a) => a.epc_buyer_id?.toString() === user?._id?.toString() ||
                           a.epc_buyer_id?.toString() === user?.id?.toString()
                  );
                  if (match) {
                    epcAlloc = match;
                    allocatedItem = item;
                  }
                });

                const allocatedQty = epcAlloc?.allocated_quantity || 0;
                const unitPrice = (allocatedItem?.unit_price_paise || 0) / 100;
                const gstRate = allocatedItem?.gst_rate || 0;
                const totalAmount = allocatedQty * unitPrice * (1 + gstRate / 100);
                const isPaid = epcAlloc?.payment_status === "VERIFIED" || epcAlloc?.payment_status === "PAID";

                return (
                  <div
                    key={order._id}
                    className="bg-surface border border-border rounded-2xl shadow-xs overflow-hidden transition-all hover:border-[#264baa]/40"
                  >
                    <div className="bg-surface-hover/60 border-b border-border p-4 sm:p-5 flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-[#264baa]/10 text-[#264baa] flex items-center justify-center font-bold">
                          <FiLayers size={18} />
                        </div>
                        <div>
                          <div className="text-xs text-text-secondary font-mono">PO: {order.po_number}</div>
                          <div className="text-sm font-black text-text-primary dark:text-white">
                            {allocatedItem?.item_name || "Solar Combo Kit Allocation"}
                          </div>
                        </div>
                      </div>
                      <AllocationStatusBadge status={epcAlloc?.payment_status} utr={epcAlloc?.payment_utr} />
                    </div>

                    <div className="p-5 sm:p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="space-y-3">
                        <h4 className="text-xs font-black uppercase text-text-secondary tracking-wider">
                          Allocation Details
                        </h4>
                        <div className="space-y-2 text-xs">
                          <div className="flex justify-between">
                            <span className="text-text-secondary">Allocated Quantity:</span>
                            <span className="font-bold text-text-primary dark:text-white">{allocatedQty} Kits</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-text-secondary">Unit Price (excl. GST):</span>
                            <span className="font-bold text-text-primary dark:text-white">₹{unitPrice.toLocaleString("en-IN")}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-text-secondary">GST Rate:</span>
                            <span className="font-bold text-text-primary dark:text-white">{gstRate}%</span>
                          </div>
                          <div className="flex justify-between pt-2 border-t border-border font-black text-sm">
                            <span className="text-text-primary dark:text-white">Total Landed Amount:</span>
                            <span className="text-[#264baa] dark:text-blue-400">₹{totalAmount.toLocaleString("en-IN")}</span>
                          </div>
                        </div>
                      </div>

                      {/* ICICI VAN Details */}
                      <div className="md:col-span-2 space-y-3">
                        {!isPaid && (
                          <div className="bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200/60 dark:border-blue-800/40 p-4 rounded-xl space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-blue-900 dark:text-blue-300">
                                ICICI Virtual Escrow Account (Instant Settlement)
                              </span>
                              <span className="text-[10px] bg-blue-600 text-white px-2 py-0.5 rounded-full font-bold">
                                Auto-Verify in 10s
                              </span>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono">
                              <div className="flex justify-between bg-surface p-2 rounded border border-border">
                                <span className="text-text-muted">A/C: {iciciVanDetails?.account_number || escrowBank.account_number}</span>
                                <button
                                  type="button"
                                  onClick={() => handleCopyText(iciciVanDetails?.account_number || escrowBank.account_number, `acc_${order._id}`)}
                                  className="text-primary hover:underline text-[10px]"
                                >
                                  {copiedField === `acc_${order._id}` ? "Copied!" : "Copy"}
                                </button>
                              </div>
                              <div className="flex justify-between bg-surface p-2 rounded border border-border">
                                <span className="text-text-muted">IFSC: {iciciVanDetails?.ifsc_code || escrowBank.ifsc_code}</span>
                                <button
                                  type="button"
                                  onClick={() => handleCopyText(iciciVanDetails?.ifsc_code || escrowBank.ifsc_code, `ifsc_${order._id}`)}
                                  className="text-primary hover:underline text-[10px]"
                                >
                                  {copiedField === `ifsc_${order._id}` ? "Copied!" : "Copy"}
                                </button>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Upload Slip Option */}
                        {!isPaid && (
                          activeUploadOrderId === order._id ? (
                            <div className="space-y-2 bg-surface p-3 rounded-xl border border-border">
                              <div className="flex justify-between items-center text-xs">
                                <span className="font-bold text-text-primary">Upload Bank Transfer Receipt (UTR)</span>
                                <button
                                  type="button"
                                  onClick={() => setActiveUploadOrderId(null)}
                                  className="text-text-secondary hover:text-text-primary text-[11px]"
                                >
                                  Cancel
                                </button>
                              </div>
                              <input
                                type="text"
                                placeholder="Enter Bank UTR / Reference No."
                                value={manualUtr}
                                onChange={(e) => setManualUtr(e.target.value)}
                                className="w-full px-3 py-1.5 text-xs rounded-lg border border-border bg-surface-hover font-mono"
                              />
                              <input
                                type="file"
                                accept="image/*,.pdf"
                                onChange={(e) => setReceiptFile(e.target.files[0])}
                                className="block w-full text-xs text-text-secondary file:mr-3 file:py-1 file:px-3 file:rounded-md file:border-0 file:bg-primary/10 file:text-primary file:font-bold"
                              />
                              <button
                                type="button"
                                onClick={() => handleUpload(order._id)}
                                disabled={uploading}
                                className="w-full bg-primary hover:opacity-90 text-white py-2 px-3 rounded-lg text-xs font-bold transition-all disabled:opacity-50"
                              >
                                {uploading ? "Submitting Receipt..." : "Submit Receipt for Accounts Verification"}
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setActiveUploadOrderId(order._id)}
                              className="w-full py-2.5 px-3 rounded-xl bg-surface hover:bg-surface-hover border border-border text-xs font-bold text-text-secondary hover:text-text-primary transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                            >
                              <FiUploadCloud className="text-primary" />
                              <span>Paid via Traditional Bank Transfer? Upload Receipt Slip / UTR</span>
                            </button>
                          )
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── DETAIL MODAL FOR DIRECT PO ───────────────────────────────────────── */}
      <AnimatePresence>
        {selectedDirectOrder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-xs"
              onClick={() => setSelectedDirectOrder(null)}
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-2xl max-h-[90vh] flex flex-col rounded-3xl border border-border shadow-2xl overflow-hidden z-10 bg-surface"
            >
              <div className="p-6 border-b border-border flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-black text-text-primary">
                      PO Breakdown: {selectedDirectOrder.po_number}
                    </h2>
                    <StatusBadge status={selectedDirectOrder.status} />
                  </div>
                  <p className="text-xs text-text-muted mt-0.5">
                    Locked on {new Date(selectedDirectOrder.created_at || selectedDirectOrder.createdAt).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedDirectOrder(null)}
                  className="p-2 rounded-xl hover:bg-surface-hover text-text-muted hover:text-text-primary transition-colors cursor-pointer"
                >
                  <FiX size={18} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-5 text-xs">
                {/* Quota & Token Progress Box */}
                <div className="p-4 rounded-2xl border border-border bg-surface-hover space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-text-primary uppercase tracking-wider text-[11px]">
                      Quota Fulfillment & Quota Lock
                    </span>
                    <span className="text-[11px] font-black text-emerald-600 dark:text-emerald-400">
                      {selectedDirectOrder.remaining_quantity != null ? selectedDirectOrder.remaining_quantity : (selectedDirectOrder.total_booked_quantity || 0)} Kits Remaining
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center pt-1">
                    <div className="p-2.5 rounded-xl bg-surface border border-border">
                      <div className="text-[10px] text-text-muted">Booked Quota</div>
                      <div className="text-sm font-black text-text-primary">
                        {selectedDirectOrder.total_booked_quantity || selectedDirectOrder.total_quantity || 0} Kits
                      </div>
                    </div>
                    <div className="p-2.5 rounded-xl bg-surface border border-border">
                      <div className="text-[10px] text-text-muted">Fulfilled</div>
                      <div className="text-sm font-black text-blue-600">
                        {selectedDirectOrder.fulfilled_quantity || 0} Kits
                      </div>
                    </div>
                    <div className="p-2.5 rounded-xl bg-surface border border-border">
                      <div className="text-[10px] text-text-muted">Token Paid</div>
                      <div className="text-sm font-black text-emerald-600">
                        ₹{Math.round((selectedDirectOrder.token_amount_paise || selectedDirectOrder.token_paid_paise || 0) / 100).toLocaleString("en-IN")}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Items & Product Description */}
                <div className="space-y-2">
                  <h4 className="font-bold text-text-primary uppercase tracking-wider text-[11px]">
                    Itemized Product & Quantities
                  </h4>
                  <div className="border border-border rounded-xl overflow-hidden">
                    <table className="w-full text-left">
                      <thead className="bg-surface-hover border-b border-border text-[10px] font-black uppercase text-text-muted">
                        <tr>
                          <th className="py-2.5 px-3">Item Description</th>
                          <th className="py-2.5 px-3 text-center">Quantity</th>
                          <th className="py-2.5 px-3">Unit Price</th>
                          <th className="py-2.5 px-3 text-right">Total (₹)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {selectedDirectOrder.items?.map((it, idx) => (
                          <tr key={idx}>
                            <td className="py-3 px-3">
                              <div className="font-bold text-text-primary">{it.item_name}</div>
                              <div className="text-[10px] text-text-muted">GST @ {it.gst_rate}%</div>
                            </td>
                            <td className="py-3 px-3 text-center font-bold">{it.quantity} Kits</td>
                            <td className="py-3 px-3 font-mono">
                              ₹{((it.unit_price_paise || 0) / 100).toLocaleString("en-IN")}
                            </td>
                            <td className="py-3 px-3 text-right font-bold font-mono">
                              ₹{((it.total_price_paise || 0) / 100).toLocaleString("en-IN")}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Total Value */}
                <div className="p-4 rounded-xl border border-border bg-surface-hover flex items-center justify-between">
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-wider text-text-muted">
                      Total Purchase Order Value
                    </div>
                    <div className="text-lg font-black text-text-primary">
                      ₹{((selectedDirectOrder.grand_total_paise || 0) / 100).toLocaleString("en-IN")}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-text-muted">
                      Settlement Mode
                    </div>
                    <span className="font-bold text-primary">
                      {selectedDirectOrder.token_settlement_mode || "PRO_RATA"}
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── REORDER FROM PO MODAL ────────────────────────────────────────────── */}
      <AnimatePresence>
        {reorderModal && reorderOrder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-xs"
              onClick={() => !reorderSubmitting && setReorderModal(false)}
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-xl max-h-[90vh] flex flex-col rounded-3xl border border-border shadow-2xl overflow-hidden z-10 bg-surface"
            >
              <div className="p-5 border-b border-border flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 rounded-lg bg-primary/10 text-primary">
                      <FiRefreshCw size={15} />
                    </span>
                    <h2 className="text-base font-black text-text-primary">
                      Reorder Kits against PO: {reorderOrder.po_number}
                    </h2>
                  </div>
                  <p className="text-xs text-text-muted mt-0.5">
                    Draw repeat kit orders against locked prices & settle your token escrow deposit.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => !reorderSubmitting && setReorderModal(false)}
                  className="p-2 rounded-xl hover:bg-surface-hover text-text-muted hover:text-text-primary transition-colors cursor-pointer"
                >
                  <FiX size={18} />
                </button>
              </div>

              {reorderSuccess ? (
                <div className="p-6 space-y-4 text-center">
                  <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400 mx-auto flex items-center justify-center">
                    <FiCheckCircle size={32} />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-lg font-black text-text-primary">
                      Repeat Order Successfully Placed!
                    </h3>
                    <p className="text-xs text-text-muted">
                      Linked Repeat Order Generated:{" "}
                      <span className="font-mono font-bold text-primary">{reorderSuccess.orderNumber}</span>
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-surface-hover border border-border text-xs space-y-2 text-left">
                    <div className="flex justify-between">
                      <span className="text-text-muted">Parent PO Reference:</span>
                      <span className="font-mono font-bold text-text-primary">{reorderOrder.po_number}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-text-muted">Token Escrow Adjusted:</span>
                      <span className="font-bold text-emerald-600">₹{(reorderSuccess.adjusted || 0).toLocaleString("en-IN")}</span>
                    </div>
                    <div className="flex justify-between border-t border-border pt-1">
                      <span className="text-text-muted font-bold">Net Amount Paid:</span>
                      <span className="font-black text-text-primary">₹{(reorderSuccess.payable || 0).toLocaleString("en-IN")}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setReorderModal(false);
                      setReorderSuccess(null);
                    }}
                    className="w-full py-2.5 rounded-xl bg-primary text-white text-xs font-black shadow-md hover:opacity-90 transition-all cursor-pointer"
                  >
                    Done & Return to PO List
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmitReorder} className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
                  {reorderError && (
                    <div className="p-3 rounded-xl bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200 text-xs flex items-center gap-2">
                      <FiAlertCircle size={15} className="shrink-0" />
                      <span>{reorderError}</span>
                    </div>
                  )}

                  {(() => {
                    const it = reorderOrder.items?.[0] || {};
                    const unitPrice = (it.unit_price_paise || 0) / 100;
                    const gstRate = it.gst_rate || 13.85;
                    const committed = Number(reorderOrder.total_booked_quantity || it.quantity || 100);
                    const fulfilled = Number(reorderOrder.fulfilled_quantity || 0);
                    const remaining = reorderOrder.remaining_quantity != null ? reorderOrder.remaining_quantity : Math.max(1, committed - fulfilled);

                    const tokenPaid = Math.round((reorderOrder.token_amount_paise || reorderOrder.token_paid_paise || 0) / 100);
                    const tokenAdjusted = Math.round((reorderOrder.token_adjusted_total_paise || 0) / 100);
                    const tokenBalance = Math.max(0, tokenPaid - tokenAdjusted);
                    const settlementMode = reorderOrder.token_settlement_mode || reorderOrder.penalty_rule_snapshot?.token_settlement_rule || "PRO_RATA";

                    const subtotal = reorderQty * unitPrice;
                    const tax = Math.round(subtotal * (gstRate / 100));
                    const grossTotal = subtotal + tax;

                    let tokenToDeduct = 0;
                    const isClosing = reorderQty === remaining;
                    if (isClosing) {
                      tokenToDeduct = Math.min(tokenBalance, grossTotal);
                    } else if (settlementMode === "PRO_RATA") {
                      const perKit = committed > 0 ? Math.floor(tokenPaid / committed) : 0;
                      tokenToDeduct = Math.min(tokenBalance, reorderQty * perKit, grossTotal);
                    } else if (settlementMode === "UPFRONT") {
                      tokenToDeduct = Math.min(tokenBalance, grossTotal);
                    }
                    const netPayable = Math.max(0, grossTotal - tokenToDeduct);

                    return (
                      <>
                        <div className="p-3.5 rounded-2xl bg-surface-hover border border-border space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-text-primary text-xs line-clamp-1">
                              {it.item_name || "Solar Combo Kit"}
                            </span>
                            <span className="text-xs font-black text-primary">
                              ₹{unitPrice.toLocaleString("en-IN")}/kit + GST
                            </span>
                          </div>
                          <div className="grid grid-cols-3 gap-2 pt-1 border-t border-border/60 text-center">
                            <div>
                              <div className="text-[10px] text-text-muted">Total Committed</div>
                              <div className="font-black text-text-primary">{committed} Kits</div>
                            </div>
                            <div className="border-x border-border/60">
                              <div className="text-[10px] text-text-muted">Remaining Quota</div>
                              <div className="font-black text-emerald-600">{remaining} Kits</div>
                            </div>
                            <div>
                              <div className="text-[10px] text-text-muted">Escrow Balance</div>
                              <div className="font-black text-emerald-600">₹{tokenBalance.toLocaleString("en-IN")}</div>
                            </div>
                          </div>
                        </div>

                        {/* Reorder Quantity Input */}
                        <div className="space-y-1.5">
                          <div className="flex justify-between items-center">
                            <label className="text-[11px] font-bold text-text-primary">
                              Select Reorder Quantity (Max: {remaining} kits)
                            </label>
                            <span className="text-[10px] text-text-muted">
                              Mode: {settlementMode}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => setReorderQty((q) => Math.max(1, q - 1))}
                              disabled={reorderQty <= 1}
                              className="w-10 h-10 rounded-xl border border-border flex items-center justify-center font-bold text-base hover:bg-surface-hover transition-colors disabled:opacity-40"
                            >
                              -
                            </button>
                            <input
                              type="number"
                              min="1"
                              max={remaining}
                              value={reorderQty}
                              onChange={(e) => {
                                const val = parseInt(e.target.value, 10) || 1;
                                setReorderQty(Math.min(remaining, Math.max(1, val)));
                              }}
                              className="flex-1 px-4 py-2.5 rounded-xl border text-center font-black text-sm border-border bg-surface text-text-primary outline-none focus:border-primary"
                            />
                            <button
                              type="button"
                              onClick={() => setReorderQty((q) => Math.min(remaining, q + 1))}
                              disabled={reorderQty >= remaining}
                              className="w-10 h-10 rounded-xl border border-border flex items-center justify-center font-bold text-base hover:bg-surface-hover transition-colors disabled:opacity-40"
                            >
                              +
                            </button>
                          </div>

                          {/* Quick selection chips */}
                          <div className="flex items-center gap-1.5 pt-1">
                            {[1, 5, 10, remaining].filter((val, idx, arr) => val <= remaining && arr.indexOf(val) === idx).map((val) => (
                              <button
                                key={val}
                                type="button"
                                onClick={() => setReorderQty(val)}
                                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all ${
                                  reorderQty === val
                                    ? "bg-primary text-white"
                                    : "bg-surface-hover text-text-secondary hover:text-text-primary border border-border"
                                }`}
                              >
                                {val === remaining ? `All Remaining (${val})` : `${val} Kits`}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Real-time Financial Breakdown */}
                        <div className="p-3.5 rounded-2xl bg-surface-hover/80 border border-border space-y-2">
                          <div className="text-[10px] font-black uppercase tracking-wider text-text-muted">
                            Financial Settlement Breakdown
                          </div>
                          <div className="space-y-1">
                            <div className="flex justify-between text-text-muted">
                              <span>Kit Subtotal ({reorderQty} kits × ₹{unitPrice.toLocaleString("en-IN")}):</span>
                              <span>₹{subtotal.toLocaleString("en-IN")}</span>
                            </div>
                            <div className="flex justify-between text-text-muted">
                              <span>GST @ {gstRate}%:</span>
                              <span>₹{tax.toLocaleString("en-IN")}</span>
                            </div>
                            <div className="flex justify-between font-bold text-text-primary pt-1 border-t border-border/40">
                              <span>Order Gross Total:</span>
                              <span>₹{grossTotal.toLocaleString("en-IN")}</span>
                            </div>
                            <div className="flex justify-between font-bold text-emerald-600 dark:text-emerald-400">
                              <span className="flex items-center gap-1">
                                <FiDollarSign size={12} /> Less: Escrow Token Adjustment ({isClosing ? "Final Order" : settlementMode}):
                              </span>
                              <span>- ₹{tokenToDeduct.toLocaleString("en-IN")}</span>
                            </div>
                            <div className="flex justify-between font-black text-sm text-text-primary pt-1.5 border-t-2 border-border">
                              <span>Net Amount Payable Now:</span>
                              <span className="text-primary font-mono text-base">₹{netPayable.toLocaleString("en-IN")}</span>
                            </div>
                          </div>
                        </div>

                        {/* Escrow Bank Info */}
                        <div className="p-3 rounded-xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200/60 dark:border-blue-800/40 space-y-1.5 text-[11px]">
                          <div className="font-bold text-blue-900 dark:text-blue-300 flex items-center justify-between">
                            <span>Transfer to Company Escrow Account:</span>
                            <span className="text-[10px] text-text-muted">ICICI Corporate</span>
                          </div>
                          <div className="flex items-center justify-between font-mono">
                            <span>A/C: {escrowBank.account_number}</span>
                            <button
                              type="button"
                              onClick={() => handleCopyText(escrowBank.account_number, "reorder_acc")}
                              className="text-primary cursor-pointer hover:underline text-[10px]"
                            >
                              {copiedField === "reorder_acc" ? "Copied!" : "Copy"}
                            </button>
                          </div>
                          <div className="flex items-center justify-between font-mono">
                            <span>IFSC: {escrowBank.ifsc_code}</span>
                            <button
                              type="button"
                              onClick={() => handleCopyText(escrowBank.ifsc_code, "reorder_ifsc")}
                              className="text-primary cursor-pointer hover:underline text-[10px]"
                            >
                              {copiedField === "reorder_ifsc" ? "Copied!" : "Copy"}
                            </button>
                          </div>
                        </div>

                        {/* Payment UTR & Details */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[11px] font-bold text-text-primary mb-1">
                              Payment UTR / Reference <span className="text-rose-500">*</span>
                            </label>
                            <input
                              type="text"
                              required
                              value={reorderUtr}
                              onChange={(e) => setReorderUtr(e.target.value)}
                              placeholder="e.g. ICICR24098123456"
                              className="w-full px-3 py-2 rounded-xl border border-border bg-surface text-text-primary font-mono text-xs outline-none focus:border-primary"
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] font-bold text-text-primary mb-1">
                              Sender Bank Name
                            </label>
                            <input
                              type="text"
                              value={reorderBank}
                              onChange={(e) => setReorderBank(e.target.value)}
                              placeholder="e.g. HDFC / SBI"
                              className="w-full px-3 py-2 rounded-xl border border-border bg-surface text-text-primary text-xs outline-none focus:border-primary"
                            />
                          </div>
                        </div>

                        <div className="pt-2 border-t border-border flex items-center justify-end gap-3">
                          <button
                            type="button"
                            onClick={() => setReorderModal(false)}
                            disabled={reorderSubmitting}
                            className="px-4 py-2.5 rounded-xl border border-border text-xs font-bold text-text-secondary hover:bg-surface-hover transition-all cursor-pointer"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            disabled={reorderSubmitting || !reorderUtr.trim()}
                            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-white text-xs font-black shadow-lg hover:opacity-90 transition-all cursor-pointer disabled:opacity-50"
                          >
                            {reorderSubmitting ? (
                              <>
                                <FiLoader size={14} className="animate-spin" />
                                <span>Placing Reorder...</span>
                              </>
                            ) : (
                              <>
                                <FiCheck size={14} />
                                <span>Place Reorder & Settle ₹{netPayable.toLocaleString("en-IN")}</span>
                              </>
                            )}
                          </button>
                        </div>
                      </>
                    );
                  })()}
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── REQUEST TOKEN REFUND MODAL ───────────────────────────────────────── */}
      <AnimatePresence>
        {refundModal && refundOrder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-xs"
              onClick={() => !refundSubmitting && setRefundModal(false)}
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-xl max-h-[90vh] flex flex-col rounded-3xl border border-border shadow-2xl overflow-hidden z-10 bg-surface"
            >
              <div className="p-5 border-b border-border flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 rounded-lg bg-amber-500/10 text-amber-600">
                      <FiDollarSign size={15} />
                    </span>
                    <h2 className="text-base font-black text-text-primary">
                      Request Token Refund: {refundOrder.po_number}
                    </h2>
                  </div>
                  <p className="text-xs text-text-muted mt-0.5">
                    Token settlement and penalty reconciliation for expired or fulfilled Purchase Orders.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => !refundSubmitting && setRefundModal(false)}
                  className="p-2 rounded-xl hover:bg-surface-hover text-text-muted hover:text-text-primary transition-colors cursor-pointer"
                >
                  <FiX size={18} />
                </button>
              </div>

              {refundSuccess ? (
                <div className="p-6 space-y-4 text-center">
                  <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400 mx-auto flex items-center justify-center">
                    <FiCheckCircle size={32} />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-lg font-black text-text-primary">
                      Refund Request Submitted!
                    </h3>
                    <p className="text-xs text-text-muted">
                      Your refund request has been placed in the Admin / Accounts queue for approval and payment disbursement.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setRefundModal(false);
                      setRefundSuccess(null);
                    }}
                    className="w-full py-2.5 rounded-xl bg-primary text-white text-xs font-black shadow-md hover:opacity-90 transition-all cursor-pointer"
                  >
                    Done & Return to PO List
                  </button>
                </div>
              ) : refundLoading ? (
                <div className="p-12 text-center space-y-3">
                  <FiLoader size={28} className="animate-spin text-primary mx-auto" />
                  <p className="text-xs text-text-muted">
                    Calculating penalty rules & unpurchased kit balances...
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmitRefund} className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
                  {refundError && (
                    <div className="p-3 rounded-xl bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200 text-xs flex items-center gap-2">
                      <FiAlertCircle size={15} className="shrink-0" />
                      <span>{refundError}</span>
                    </div>
                  )}

                  {/* Penalty & Settlement Metric Strip */}
                  {refundPreview && (
                    <div className="p-4 rounded-2xl bg-surface-hover border border-border space-y-3">
                      <div className="text-[10px] font-black uppercase tracking-wider text-text-muted">
                        Settlement & Penalty Reconciliation
                      </div>

                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div className="p-2 rounded-xl bg-surface border border-border">
                          <div className="text-[10px] text-text-muted">Committed</div>
                          <div className="font-black text-text-primary">{refundPreview.total_committed_qty} Kits</div>
                        </div>
                        <div className="p-2 rounded-xl bg-surface border border-border">
                          <div className="text-[10px] text-blue-600">Purchased</div>
                          <div className="font-black text-blue-600">{refundPreview.total_purchased_qty} Kits</div>
                        </div>
                        <div className="p-2 rounded-xl bg-surface border border-border">
                          <div className="text-[10px] text-rose-600">Unpurchased</div>
                          <div className="font-black text-rose-600">{refundPreview.unpurchased_qty} Kits</div>
                        </div>
                      </div>

                      <div className="space-y-1.5 pt-1 text-xs">
                        <div className="flex justify-between text-text-muted">
                          <span>Token Paid Initially:</span>
                          <span>₹{(refundPreview.token_paid_paise / 100).toLocaleString("en-IN")}</span>
                        </div>
                        <div className="flex justify-between text-text-muted">
                          <span>Token Already Adjusted on Orders:</span>
                          <span>- ₹{(refundPreview.token_adjusted_total_paise / 100).toLocaleString("en-IN")}</span>
                        </div>
                        <div className="flex justify-between text-text-muted">
                          <span>Escrow Token Balance Available:</span>
                          <span>₹{(refundPreview.token_balance_paise / 100).toLocaleString("en-IN")}</span>
                        </div>
                        <div className="flex justify-between font-bold text-rose-600 pt-1 border-t border-border/40">
                          <span>Applicable Penalty ({refundPreview.penalty_calculation?.rule_type || "Rule"}):</span>
                          <span>- ₹{(refundPreview.applicable_penalty_paise / 100).toLocaleString("en-IN")}</span>
                        </div>
                        {refundPreview.penalty_calculation?.explanation && (
                          <div className="text-[11px] text-text-muted italic bg-surface p-2 rounded-lg border border-border/60">
                            ℹ {refundPreview.penalty_calculation.explanation}
                          </div>
                        )}
                        <div className="flex justify-between font-black text-sm text-emerald-600 dark:text-emerald-400 pt-2 border-t-2 border-border">
                          <span>Net Refundable Token Amount:</span>
                          <span className="font-mono text-base">₹{(refundPreview.refundable_token_paise / 100).toLocaleString("en-IN")}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Bank Account Details Form */}
                  <div className="space-y-3">
                    <div className="text-[11px] font-black uppercase tracking-wider text-text-primary">
                      Payout Bank Account Details
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-text-muted mb-1">
                          Account Holder Name <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={refundForm.account_holder_name}
                          onChange={(e) => setRefundForm({ ...refundForm, account_holder_name: e.target.value })}
                          placeholder="e.g. Apex Solar Solutions"
                          className="w-full px-3 py-2 rounded-xl border border-border bg-surface text-text-primary text-xs outline-none focus:border-primary"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-text-muted mb-1">
                          Bank Name <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={refundForm.bank_name}
                          onChange={(e) => setRefundForm({ ...refundForm, bank_name: e.target.value })}
                          placeholder="e.g. HDFC Bank"
                          className="w-full px-3 py-2 rounded-xl border border-border bg-surface text-text-primary text-xs outline-none focus:border-primary"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-text-muted mb-1">
                          Account Number <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="password"
                          required
                          value={refundForm.account_number}
                          onChange={(e) => setRefundForm({ ...refundForm, account_number: e.target.value })}
                          placeholder="••••••••••••"
                          className="w-full px-3 py-2 rounded-xl border border-border bg-surface text-text-primary font-mono text-xs outline-none focus:border-primary"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-text-muted mb-1">
                          Confirm Account Number <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={refundForm.confirm_account_number}
                          onChange={(e) => setRefundForm({ ...refundForm, confirm_account_number: e.target.value })}
                          placeholder="Confirm Account No."
                          className="w-full px-3 py-2 rounded-xl border border-border bg-surface text-text-primary font-mono text-xs outline-none focus:border-primary"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-text-muted mb-1">
                        Bank IFSC Code <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={refundForm.ifsc_code}
                        onChange={(e) => setRefundForm({ ...refundForm, ifsc_code: e.target.value })}
                        placeholder="e.g. HDFC0001234"
                        className="w-full px-3 py-2 rounded-xl border border-border bg-surface text-text-primary font-mono text-xs uppercase outline-none focus:border-primary"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-text-muted mb-1">
                        Notes / Remarks
                      </label>
                      <input
                        type="text"
                        value={refundForm.notes}
                        onChange={(e) => setRefundForm({ ...refundForm, notes: e.target.value })}
                        placeholder="Optional remarks for accounts team"
                        className="w-full px-3 py-2 rounded-xl border border-border bg-surface text-text-primary text-xs outline-none focus:border-primary"
                      />
                    </div>
                  </div>

                  <div className="pt-2 border-t border-border flex items-center justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => setRefundModal(false)}
                      disabled={refundSubmitting}
                      className="px-4 py-2.5 rounded-xl border border-border text-xs font-bold text-text-secondary hover:bg-surface-hover transition-all cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={refundSubmitting}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-white text-xs font-black shadow-lg hover:opacity-90 transition-all cursor-pointer disabled:opacity-50"
                    >
                      {refundSubmitting ? (
                        <>
                          <FiLoader size={14} className="animate-spin" />
                          <span>Submitting Request...</span>
                        </>
                      ) : (
                        <>
                          <FiCheck size={14} />
                          <span>Submit Token Refund Request</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
