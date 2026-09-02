import { useState, useEffect, useCallback, useMemo } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiShoppingCart,
  FiPlus,
  FiCheckCircle,
  FiClock,
  FiAlertCircle,
  FiLoader,
  FiSearch,
  FiFileText,
  FiLayers,
  FiUsers,
  FiBox,
  FiDollarSign,
  FiX,
  FiCheck,
  FiChevronRight,
  FiShield,
  FiArrowRight,
  FiInfo,
  FiCalendar,
  FiGrid,
  FiList,
  FiEye,
  FiRefreshCw,
  FiTarget,
  FiTrendingUp,
  FiUploadCloud,
  FiCopy,
  FiMapPin,
  FiExternalLink
} from "react-icons/fi";
import { FaSolarPanel, FaWarehouse, FaBuilding, FaBolt } from "react-icons/fa";
import api from "../services/api";

const STATUS_CONFIG = {
  DRAFT: { label: "Draft", bg: "bg-slate-100 dark:bg-slate-800", text: "text-slate-600 dark:text-slate-300", icon: FiFileText },
  SUBMITTED: { label: "Submitted", bg: "bg-blue-50 dark:bg-blue-900/30", text: "text-blue-600 dark:text-blue-400", icon: FiClock },
  PENDING_APPROVAL: { label: "Pending Approval", bg: "bg-amber-50 dark:bg-amber-900/30", text: "text-amber-600 dark:text-amber-400", icon: FiClock },
  CHANGES_REQUESTED: { label: "Changes Requested", bg: "bg-orange-50 dark:bg-orange-900/30", text: "text-orange-600 dark:text-orange-400", icon: FiAlertCircle },
  APPROVED: { label: "Approved", bg: "bg-emerald-50 dark:bg-emerald-900/30", text: "text-emerald-600 dark:text-emerald-400", icon: FiCheckCircle },
  REJECTED: { label: "Rejected", bg: "bg-red-50 dark:bg-red-900/30", text: "text-red-600 dark:text-red-400", icon: FiX },
  AWAITING_PAYMENT: { label: "Awaiting Payment", bg: "bg-indigo-50 dark:bg-indigo-900/30", text: "text-indigo-600 dark:text-indigo-400", icon: FiDollarSign },
  PAID: { label: "Paid & Verified", bg: "bg-emerald-50 dark:bg-emerald-900/30", text: "text-emerald-600 dark:text-emerald-400", icon: FiCheckCircle },
  PROCESSING: { label: "Processing & Packing", bg: "bg-cyan-50 dark:bg-cyan-900/30", text: "text-cyan-600 dark:text-cyan-400", icon: FiRefreshCw },
  DISPATCHED: { label: "Dispatched", bg: "bg-purple-50 dark:bg-purple-900/30", text: "text-purple-600 dark:text-purple-400", icon: FiBox },
  DELIVERED: { label: "Delivered", bg: "bg-emerald-50 dark:bg-emerald-900/30", text: "text-emerald-600 dark:text-emerald-400", icon: FiCheckCircle },
  COMPLETED: { label: "Completed", bg: "bg-emerald-50 dark:bg-emerald-900/30", text: "text-emerald-600 dark:text-emerald-400", icon: FiCheckCircle },
  CANCELLED: { label: "Cancelled", bg: "bg-rose-50 dark:bg-rose-900/30", text: "text-rose-600 dark:text-rose-400", icon: FiX },
};

function StatusBadge({ status }) {
  const normalized = String(status || "SUBMITTED").toUpperCase();
  const cfg = STATUS_CONFIG[normalized] || STATUS_CONFIG.SUBMITTED;
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border border-current/20 ${cfg.bg} ${cfg.text}`}>
      <Icon size={11} /> {cfg.label}
    </span>
  );
}

export default function LooseOrder() {
  const [loading, setLoading] = useState(true);
  const [planData, setPlanData] = useState(null);
  const [epcBuyers, setEpcBuyers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [goalData, setGoalData] = useState(null);
  const [viewMode, setViewMode] = useState("table"); // "table" | "card"
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  // Create Loose Order Modal State
  const [createModal, setCreateModal] = useState(false);
  const [selectedKitId, setSelectedKitId] = useState("");
  const [looseQuantity, setLooseQuantity] = useState(10);
  const [destinationMode, setDestinationMode] = useState("hub_stock"); // "hub_stock" | "epc_allocation"
  const [allocations, setAllocations] = useState({}); // { [epcBuyerId]: quantity }
  const [destinationAddress, setDestinationAddress] = useState("");
  const [destinationPincode, setDestinationPincode] = useState("");

  // Payment Form State
  const [utrNumber, setUtrNumber] = useState("");
  const [amountPaid, setAmountPaid] = useState("");
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().slice(0, 10));
  const [senderBankName, setSenderBankName] = useState("");
  const [receiptFile, setReceiptFile] = useState(null);
  const [receiptPreview, setReceiptPreview] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  // Order Details Modal
  const [selectedOrder, setSelectedOrder] = useState(null);

  // Escrow Bank Details
  const bankDetails = {
    account_name: "SolarKits Technologies Pvt Ltd",
    bank_name: "HDFC Bank",
    account_number: "50200088991122",
    ifsc_code: "HDFC0001234",
    branch_name: "Corporate Financial Center, Mumbai",
    upi_id: "solarkits.pay@hdfcbank",
  };
  const [copiedField, setCopiedField] = useState("");

  const handleCopyText = (text, fieldName) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(""), 2000);
  };

  // Fetch Authorized Solar Kits, EPC Buyers, Orders & Goal Data
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [settingsRes, buyersRes, ordersRes, goalRes] = await Promise.all([
        api.get("/india/v1/reseller/po/plan-settings").catch(() => ({ data: { status: "error" } })),
        api.get("/india/v1/reseller/epc-buyers/list").catch(() => ({ data: { data: [] } })),
        api.get("/india/v1/reseller/po/my-orders").catch(() => ({ data: { data: [] } })),
        api.get("/india/v1/reseller/goals/my-goal").catch(() => ({ data: { data: null } })),
      ]);

      if (settingsRes.data?.status === "success") {
        setPlanData(settingsRes.data.data);
        if (settingsRes.data.data?.combo_kits?.length > 0) {
          const firstKit = settingsRes.data.data.combo_kits[0];
          setSelectedKitId(firstKit._id || firstKit.id);
        }
      }
      if (buyersRes.data?.status === "success") {
        setEpcBuyers(buyersRes.data.data || []);
      }
      if (ordersRes.data?.status === "success") {
        setOrders(ordersRes.data.data || []);
      }
      if (goalRes.data?.status === "success" && goalRes.data.data) {
        setGoalData(goalRes.data.data);
      }
    } catch (err) {
      console.error("Failed to load loose order context:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Selected Authorized Solar Kit Object
  const selectedKit = useMemo(() => {
    if (!planData?.combo_kits || !selectedKitId) return null;
    return (
      planData.combo_kits.find(
        (k) => (k._id || k.id)?.toString() === selectedKitId?.toString()
      ) || null
    );
  }, [planData, selectedKitId]);

  // Total Quantity determination based on destination mode
  const totalLooseQuantity = useMemo(() => {
    if (destinationMode === "epc_allocation") {
      return Object.values(allocations).reduce((sum, q) => sum + (parseInt(q, 10) || 0), 0);
    }
    return Math.max(1, parseInt(looseQuantity, 10) || 1);
  }, [destinationMode, looseQuantity, allocations]);

  // Unit Price Calculation
  const unitPriceINR = useMemo(() => {
    if (!selectedKit) return 0;
    if (selectedKit.dealer_price) return selectedKit.dealer_price;
    if (selectedKit.base_price_cached) return selectedKit.base_price_cached;
    if (selectedKit.selling_price_cached) return selectedKit.selling_price_cached;
    if (selectedKit.price_with_tax) return selectedKit.price_with_tax;
    if (selectedKit.unit_price) return selectedKit.unit_price;
    if (selectedKit.price) return selectedKit.price;
    if (selectedKit.base_price) return selectedKit.base_price;
    return 45000;
  }, [selectedKit]);

  const gstRatePercent = selectedKit?.gst_rate || 13.8;
  const subtotalINR = totalLooseQuantity * unitPriceINR;
  const taxINR = Math.round((subtotalINR * gstRatePercent) / 100);
  const grandTotalINR = subtotalINR + taxINR;

  // Auto-fill amount paid
  useEffect(() => {
    if (grandTotalINR > 0) {
      setAmountPaid(grandTotalINR);
    }
  }, [grandTotalINR]);

  // EPC Allocation Handlers
  const handleQuantityChange = (buyerId, val) => {
    const qty = Math.max(0, parseInt(val, 10) || 0);
    setAllocations((prev) => {
      const next = { ...prev };
      if (qty === 0) {
        delete next[buyerId];
      } else {
        next[buyerId] = qty;
      }
      return next;
    });
    setFormError("");
  };

  const handleStepQty = (buyerId, delta) => {
    const current = allocations[buyerId] || 0;
    handleQuantityChange(buyerId, current + delta);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setReceiptFile(file);
      if (file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onload = (ev) => setReceiptPreview(ev.target.result);
        reader.readAsDataURL(file);
      } else {
        setReceiptPreview(null);
      }
    }
  };

  // Submit Loose Solar Kit Order
  const handleCreateLooseOrder = async (e) => {
    e.preventDefault();
    setFormError("");

    if (!selectedKit) {
      setFormError("Please select an authorized Solar Kit.");
      return;
    }
    if (totalLooseQuantity <= 0) {
      setFormError("Please enter a valid loose quantity.");
      return;
    }
    if (destinationMode === "epc_allocation" && totalLooseQuantity === 0) {
      setFormError("Please allocate quantities to at least one onboarded EPC Buyer.");
      return;
    }
    if (!utrNumber.trim()) {
      setFormError("Please enter the UTR / Transaction Reference Number.");
      return;
    }
    if (!amountPaid || Number(amountPaid) <= 0) {
      setFormError("Please enter a valid payment amount.");
      return;
    }

    const epcAllocationsList =
      destinationMode === "epc_allocation"
        ? Object.entries(allocations).map(([buyerId, qty]) => {
          const buyer = epcBuyers.find((b) => (b._id || b.id)?.toString() === buyerId?.toString());
          return {
            epc_buyer_id: buyerId,
            company_name: buyer?.company_name || buyer?.name || "EPC Buyer",
            buyer_name: buyer?.name || buyer?.company_name || "EPC Buyer",
            gstin: buyer?.gstin || null,
            allocated_quantity: qty,
          };
        })
        : [];

    const itemPayload = {
      kit_id: selectedKit._id || selectedKit.id,
      item_name: selectedKit.name || selectedKit.kit_name || "Solar Kit Package",
      item_code: selectedKit.kit_code || selectedKit.code || null,
      quantity: totalLooseQuantity,
      unit_price_paise: Math.round(unitPriceINR * 100),
      gst_rate: gstRatePercent,
      epc_allocations: epcAllocationsList,
    };

    setSubmitting(true);
    try {
      const payload = {
        order_type: "loose_kit_order",
        destination_type: destinationMode,
        destination_address: destinationAddress || "Franchise Regional Hub Warehouse",
        destination_pincode: destinationPincode || "380001",
        items: [itemPayload],
        offline_payment: {
          payment_method: "offline_bank_transfer",
          utr_number: utrNumber.trim().toUpperCase(),
          amount_paid: Number(amountPaid),
          payment_date: paymentDate,
          sender_bank_name: senderBankName,
        },
        auto_submit: true,
      };

      const res = await api.post("/india/v1/reseller/po/create", payload);
      if (res.data?.status === "success") {
        setCreateModal(false);
        setAllocations({});
        setLooseQuantity(10);
        setUtrNumber("");
        setReceiptFile(null);
        fetchData();
      } else {
        setFormError(res.data?.message || "Failed to submit Loose Solar Kit Order.");
      }
    } catch (err) {
      console.error("Error submitting loose order:", err);
      setFormError(err.response?.data?.message || "Failed to submit Loose Solar Kit Order.");
    } finally {
      setSubmitting(false);
    }
  };

  // Filtered Orders List
  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      if (statusFilter && (o.status || o.order_status) !== statusFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        const num = (o.po_number || o.order_number || "").toLowerCase();
        const kitName = (o.items?.[0]?.item_name || "").toLowerCase();
        return num.includes(q) || kitName.includes(q);
      }
      return true;
    });
  }, [orders, statusFilter, search]);

  return (
    <div className="space-y-6 pb-24 max-w-7xl mx-auto">
      {/* ── Top Header Banner (Styled like PoOrder) ─────────────────────────── */}
      <div
        className="relative rounded-3xl p-6 sm:p-8 text-white shadow-xl overflow-hidden"
        style={{ background: "var(--gradient-primary, linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%))" }}
      >
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black tracking-wider uppercase bg-white/20 backdrop-blur-md border border-white/20 text-white">
                <FiShield size={12} /> Franchisee Loose Solar Kit Ordering
              </span>
              {planData?.plan?.name && (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-amber-400/30 text-amber-200 border border-amber-400/40">
                  ★ {planData.plan.name}
                </span>
              )}
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              Loose Solar Kit PO Orders
            </h1>
            <p className="text-white/80 text-xs sm:text-sm max-w-xl">
              Procure your authorized Solar Kits in flexible loose quantities (e.g. 10, 20, 30 kits) for local hub buffer stock or direct EPC buyer allocation.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={fetchData}
              className="p-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white border border-white/20 transition-all cursor-pointer"
              title="Refresh Data"
            >
              <FiRefreshCw size={17} className={loading ? "animate-spin" : ""} />
            </button>
            <button
              onClick={() => {
                setFormError("");
                setCreateModal(true);
              }}
              disabled={!planData?.has_active_plan && !planData?.combo_kits?.length}
              className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-white text-blue-900 hover:bg-white/90 text-sm font-black shadow-lg transition-all transform active:scale-95 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FiPlus size={18} />
              <span>Create Loose Solar Kit Order</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── Monthly Kit Target & Goal Achievement Bar ────────────────────────── */}
      {goalData && (
        <div className="p-4 sm:p-5 rounded-2xl bg-surface border border-border shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-blue-600/10 text-blue-600 flex items-center justify-center font-bold shrink-0">
              <FiTarget size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-black uppercase tracking-wider text-text-muted">
                  {goalData.period || "Monthly Franchise Target Goal"}
                </span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${(goalData.achievement_pct || 0) >= 100
                    ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300"
                    : "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300"
                  }`}>
                  {goalData.achievement_pct || 0}% Achieved
                </span>
              </div>
              <div className="text-xs sm:text-sm font-black text-text-primary mt-0.5">
                {goalData.eligible_kits || 0} / {goalData.monthly_goal || 100} Kits Procured
              </div>
            </div>
          </div>

          <div className="w-full md:w-64 space-y-1.5">
            <div className="flex justify-between text-[11px] font-extrabold">
              <span className="text-text-muted">Procurement Progress</span>
              <span className="text-primary">{goalData.achievement_pct || 0}%</span>
            </div>
            <div className="w-full bg-slate-200 dark:bg-slate-700 h-2.5 rounded-full overflow-hidden">
              <div
                className="bg-blue-600 h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, goalData.achievement_pct || 0)}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* ── Search & Filter Controls ────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {[
            { id: "", label: "All Loose Orders" },
            { id: "SUBMITTED", label: "Submitted" },
            { id: "APPROVED", label: "Approved" },
            { id: "PROCESSING", label: "Processing" },
            { id: "DISPATCHED", label: "Dispatched" },
            { id: "DELIVERED", label: "Delivered" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-4 py-2 rounded-xl text-xs font-black whitespace-nowrap transition-all cursor-pointer ${statusFilter === tab.id
                  ? "bg-blue-600 text-white shadow-md"
                  : "bg-surface hover:bg-surface-hover text-text-secondary border border-border"
                }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <div className="relative flex-1 sm:w-64">
            <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" size={14} />
            <input
              type="text"
              placeholder="Search PO number or kit..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3.5 py-2 text-xs bg-surface border border-border rounded-xl focus:outline-none focus:border-primary"
            />
          </div>

          <div className="flex items-center bg-surface border border-border rounded-xl p-1 shrink-0">
            <button
              onClick={() => setViewMode("table")}
              className={`p-1.5 rounded-lg text-xs transition-colors cursor-pointer ${viewMode === "table" ? "bg-primary text-white shadow-xs" : "text-text-muted hover:text-text-primary"
                }`}
              title="Table View"
            >
              <FiList size={15} />
            </button>
            <button
              onClick={() => setViewMode("card")}
              className={`p-1.5 rounded-lg text-xs transition-colors cursor-pointer ${viewMode === "card" ? "bg-primary text-white shadow-xs" : "text-text-muted hover:text-text-primary"
                }`}
              title="Card Grid View"
            >
              <FiGrid size={15} />
            </button>
          </div>
        </div>
      </div>

      {/* ── Orders Feed / Table ─────────────────────────────────────────────── */}
      {loading ? (
        <div className="py-24 text-center space-y-3">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-bold text-text-secondary">Loading authorized solar kits &amp; loose orders...</p>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="py-20 text-center bg-surface rounded-3xl border border-border p-8 space-y-4 shadow-xs">
          <div className="w-16 h-16 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-600 flex items-center justify-center mx-auto">
            <FaSolarPanel size={28} />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-black text-text-primary">No Loose Solar Kit Orders Placed Yet</h3>
            <p className="text-xs text-text-secondary max-w-md mx-auto">
              Place loose quantity purchase orders (e.g. 10, 20, 30 kits) for your authorized solar kits to keep local inventory ready.
            </p>
          </div>
          <button
            onClick={() => setCreateModal(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md transition-all cursor-pointer"
          >
            <FiPlus size={15} /> Place Loose Solar Kit Order
          </button>
        </div>
      ) : viewMode === "table" ? (
        <div className="bg-surface rounded-2xl border border-border shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-hover/60 border-b border-border text-text-secondary uppercase font-black tracking-wider">
                <tr>
                  <th className="px-6 py-4">PO Number &amp; Date</th>
                  <th className="px-6 py-4">Authorized Solar Kit</th>
                  <th className="px-6 py-4 text-center">Loose Qty</th>
                  <th className="px-6 py-4">Destination</th>
                  <th className="px-6 py-4 text-right">Total Payable</th>
                  <th className="px-6 py-4 text-center">Status</th>
                  <th className="px-6 py-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredOrders.map((order) => {
                  const firstItem = order.items?.[0] || {};
                  const totalQty = (order.items || []).reduce((sum, i) => sum + (i.quantity || 1), 0);
                  const orderTotal =
                    order.grand_total_inr ||
                    (order.grand_total_paise ? order.grand_total_paise / 100 : order.total_amount) ||
                    0;

                  return (
                    <tr key={order._id || order.id} className="hover:bg-surface-hover/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-mono font-black text-text-primary text-xs">
                          {order.po_number || order.order_number || `#LPO-${String(order._id).slice(-6).toUpperCase()}`}
                        </div>
                        <div className="text-[11px] text-text-muted mt-0.5">
                          {new Date(order.created_at).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <div className="font-extrabold text-text-primary text-xs">
                          {firstItem.item_name || "Authorized Solar Combo Kit"}
                        </div>
                        <div className="text-[10px] text-text-muted font-mono mt-0.5">
                          SKU: {firstItem.item_code || "KIT-STD"}
                        </div>
                      </td>

                      <td className="px-6 py-4 text-center">
                        <span className="font-black text-sm text-primary font-mono bg-primary/10 px-2.5 py-1 rounded-lg">
                          {totalQty} Kits
                        </span>
                      </td>

                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-text-secondary bg-surface-hover px-2 py-1 rounded-md">
                          <FaWarehouse size={11} className="text-primary" />
                          {order.destination_type === "epc_allocation" || firstItem.epc_allocations?.length
                            ? `Allocated to ${firstItem.epc_allocations?.length || 1} EPC(s)`
                            : "Franchise Hub Stock"}
                        </span>
                      </td>

                      <td className="px-6 py-4 text-right">
                        <div className="font-black text-text-primary text-sm">
                          ₹{orderTotal.toLocaleString("en-IN")}
                        </div>
                        <div className="text-[10px] text-text-muted font-mono">
                          UTR: {order.offline_payment?.utr_number || order.payment_reference || "N/A"}
                        </div>
                      </td>

                      <td className="px-6 py-4 text-center">
                        <StatusBadge status={order.status || order.order_status} />
                      </td>

                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => setSelectedOrder(order)}
                          className="px-3 py-1.5 bg-surface-hover hover:bg-primary hover:text-white text-primary rounded-xl font-extrabold text-xs transition-all cursor-pointer inline-flex items-center gap-1"
                        >
                          <FiEye /> View Details
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Card Grid View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredOrders.map((order) => {
            const firstItem = order.items?.[0] || {};
            const totalQty = (order.items || []).reduce((sum, i) => sum + (i.quantity || 1), 0);
            const orderTotal =
              order.grand_total_inr ||
              (order.grand_total_paise ? order.grand_total_paise / 100 : order.total_amount) ||
              0;

            return (
              <div
                key={order._id || order.id}
                className="p-5 rounded-2xl bg-surface border border-border shadow-xs hover:border-primary/40 transition-all flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2 border-b border-border pb-3">
                    <div>
                      <span className="font-mono font-black text-xs text-text-primary block">
                        {order.po_number || order.order_number || `#LPO-${String(order._id).slice(-6).toUpperCase()}`}
                      </span>
                      <span className="text-[11px] text-text-muted">
                        {new Date(order.created_at).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                    </div>
                    <StatusBadge status={order.status || order.order_status} />
                  </div>

                  <div>
                    <h4 className="font-extrabold text-sm text-text-primary">
                      {firstItem.item_name || "Authorized Solar Kit Package"}
                    </h4>
                    <p className="text-xs text-text-muted mt-0.5">
                      Procured Quantity: <strong className="text-primary font-mono">{totalQty} Kits</strong>
                    </p>
                  </div>
                </div>

                <div className="pt-3 border-t border-border flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-text-muted block">Order Total</span>
                    <span className="font-black text-base text-text-primary">
                      ₹{orderTotal.toLocaleString("en-IN")}
                    </span>
                  </div>

                  <button
                    onClick={() => setSelectedOrder(order)}
                    className="px-3.5 py-1.5 bg-primary text-white hover:bg-primary-hover rounded-xl text-xs font-bold shadow-xs cursor-pointer inline-flex items-center gap-1"
                  >
                    <FiEye /> View Order
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── CREATE LOOSE SOLAR KIT ORDER MODAL ──────────────────────────────── */}
      {createModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-surface rounded-3xl border border-border shadow-2xl max-w-4xl w-full p-6 space-y-6 max-h-[92vh] overflow-y-auto animate-in fade-in zoom-in-95">
            {/* Modal Header */}
            <div className="flex justify-between items-center border-b border-border pb-4">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 bg-blue-500/15 text-blue-600 rounded">
                  Authorized Loose Procurement
                </span>
                <h3 className="text-xl font-black text-text-primary mt-1 flex items-center gap-2">
                  <FaSolarPanel className="text-primary" /> Create Loose Solar Kit Purchase Order
                </h3>
              </div>
              <button
                onClick={() => setCreateModal(false)}
                className="p-2 text-text-muted hover:text-text-primary rounded-xl hover:bg-surface-hover cursor-pointer transition-colors"
              >
                <FiX size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateLooseOrder} className="space-y-5">
              {/* Step 1: Select Authorized Solar Kit */}
              <div className="space-y-2">
                <label className="block text-xs font-black uppercase tracking-wider text-text-primary">
                  Step 1: Select Authorized Solar Kit
                </label>
                <p className="text-xs text-text-muted">
                  Only the Solar Kits assigned to your Franchise Partner Plan &amp; Territory are available.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {(planData?.combo_kits || []).map((kit) => {
                    const kitId = kit._id || kit.id;
                    const isSelected = selectedKitId?.toString() === kitId?.toString();
                    const kitPrice = kit.dealer_price || kit.selling_price_cached || kit.base_price_cached || 45000;

                    return (
                      <div
                        key={kitId}
                        onClick={() => setSelectedKitId(kitId)}
                        className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${isSelected
                            ? "bg-primary/10 border-primary shadow-sm"
                            : "bg-surface hover:bg-surface-hover border-border"
                          }`}
                      >
                        <div className="space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold text-primary uppercase font-mono">
                              {kit.capacityKW ? `${kit.capacityKW} kW Kit` : "Solar Combo"}
                            </span>
                            {isSelected && <FiCheck className="text-primary font-black" />}
                          </div>
                          <h5 className="font-extrabold text-text-primary text-xs leading-tight">
                            {kit.name || kit.kit_name || "Solar Kit Package"}
                          </h5>
                          <p className="text-[11px] text-text-muted">
                            {kit.brandName || "Tier-1 Components"} • {kit.phase || "Single"} Phase
                          </p>
                        </div>

                        <div className="pt-2 mt-2 border-t border-border flex justify-between items-baseline">
                          <span className="text-[10px] text-text-muted">Dealer Price</span>
                          <span className="font-black text-text-primary text-sm">
                            ₹{kitPrice.toLocaleString("en-IN")}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Step 2: Loose Quantity Selection & Presets */}
              <div className="space-y-3 p-4 bg-surface-hover/50 rounded-2xl border border-border">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <label className="text-xs font-black uppercase tracking-wider text-text-primary block">
                      Step 2: Select Loose Quantity (Units / Kits)
                    </label>
                    <p className="text-xs text-text-muted mt-0.5">
                      Choose flexible quantities (e.g. 10, 20, 25 kits) for your order.
                    </p>
                  </div>

                  {destinationMode === "hub_stock" && (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setLooseQuantity(Math.max(1, looseQuantity - 1))}
                        className="w-8 h-8 rounded-xl bg-surface border border-border font-bold text-sm flex items-center justify-center cursor-pointer hover:bg-surface-hover"
                      >
                        -
                      </button>
                      <input
                        type="number"
                        min={1}
                        value={looseQuantity}
                        onChange={(e) => setLooseQuantity(Math.max(1, parseInt(e.target.value, 10) || 1))}
                        className="w-16 py-1.5 text-center font-mono font-black text-sm bg-surface border border-border rounded-xl text-primary"
                      />
                      <button
                        type="button"
                        onClick={() => setLooseQuantity(looseQuantity + 1)}
                        className="w-8 h-8 rounded-xl bg-surface border border-border font-bold text-sm flex items-center justify-center cursor-pointer hover:bg-surface-hover"
                      >
                        +
                      </button>
                    </div>
                  )}
                </div>

                {destinationMode === "hub_stock" && (
                  <div className="grid grid-cols-4 sm:grid-cols-7 gap-1.5 pt-1">
                    {[5, 10, 15, 20, 25, 30, 50].map((presetQty) => (
                      <button
                        key={presetQty}
                        type="button"
                        onClick={() => setLooseQuantity(presetQty)}
                        className={`py-2 px-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${looseQuantity === presetQty
                            ? "bg-primary text-white shadow-sm"
                            : "bg-surface hover:bg-surface-hover text-text-primary border border-border"
                          }`}
                      >
                        {presetQty} Kits
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Step 3: Destination & Purpose (Hub Stock vs Multi-EPC Allocation) */}
              <div className="space-y-3">
                <label className="block text-xs font-black uppercase tracking-wider text-text-primary">
                  Step 3: Fulfillment Destination &amp; Purpose
                </label>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setDestinationMode("hub_stock")}
                    className={`p-3.5 rounded-2xl border text-xs font-bold transition-all text-left flex items-center gap-3 cursor-pointer ${destinationMode === "hub_stock"
                        ? "bg-primary/10 border-primary text-primary"
                        : "bg-surface hover:bg-surface-hover border-border text-text-secondary"
                      }`}
                  >
                    <FaWarehouse size={20} className="shrink-0" />
                    <div>
                      <p className="font-extrabold text-sm text-text-primary">Franchise Hub Stock</p>
                      <p className="text-[11px] text-text-muted">Replenish local buffer stock</p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDestinationMode("epc_allocation")}
                    className={`p-3.5 rounded-2xl border text-xs font-bold transition-all text-left flex items-center gap-3 cursor-pointer ${destinationMode === "epc_allocation"
                        ? "bg-primary/10 border-primary text-primary"
                        : "bg-surface hover:bg-surface-hover border-border text-text-secondary"
                      }`}
                  >
                    <FiUsers size={20} className="shrink-0" />
                    <div>
                      <p className="font-extrabold text-sm text-text-primary">Allocate to EPC Buyers</p>
                      <p className="text-[11px] text-text-muted">Distribute across contractors</p>
                    </div>
                  </button>
                </div>

                {/* Multi-EPC Allocation Table if selected */}
                {destinationMode === "epc_allocation" && (
                  <div className="border border-border rounded-2xl overflow-hidden bg-surface">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-surface-hover text-text-secondary font-bold">
                        <tr>
                          <th className="p-3">Onboarded EPC Contractor</th>
                          <th className="p-3">Contact &amp; GSTIN</th>
                          <th className="p-3 text-center">Allocated Loose Qty</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {epcBuyers.map((buyer) => {
                          const bId = buyer._id || buyer.id;
                          const currentQty = allocations[bId] || 0;

                          return (
                            <tr key={bId}>
                              <td className="p-3 font-bold text-text-primary">
                                {buyer.company_name || buyer.name}
                              </td>
                              <td className="p-3 text-text-muted">
                                {buyer.whatsapp || buyer.mobile} • GST: {buyer.gstin || "N/A"}
                              </td>
                              <td className="p-3 text-center">
                                <div className="inline-flex items-center gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => handleStepQty(bId, -1)}
                                    className="w-6 h-6 rounded bg-surface-hover font-bold text-xs"
                                  >
                                    -
                                  </button>
                                  <input
                                    type="number"
                                    min={0}
                                    value={currentQty || ""}
                                    onChange={(e) => handleQuantityChange(bId, e.target.value)}
                                    placeholder="0"
                                    className="w-12 text-center font-mono font-bold py-1 bg-surface border border-border rounded text-xs"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => handleStepQty(bId, 1)}
                                    className="w-6 h-6 rounded bg-surface-hover font-bold text-xs"
                                  >
                                    +
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Step 4: Pricing Summary & Escrow Bank Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-border">
                {/* Financial Summary */}
                <div className="p-4 bg-surface-hover/60 rounded-2xl border border-border space-y-2 text-xs">
                  <span className="font-black text-text-primary uppercase tracking-wider block text-[11px]">
                    Order Financial Calculation
                  </span>
                  <div className="flex justify-between text-text-secondary">
                    <span>Kit Unit Price (Excl. Tax):</span>
                    <span className="font-bold text-text-primary">₹{unitPriceINR.toLocaleString("en-IN")}</span>
                  </div>
                  <div className="flex justify-between text-text-secondary">
                    <span>Total Quantity:</span>
                    <span className="font-black text-primary font-mono">{totalLooseQuantity} Kits</span>
                  </div>
                  <div className="flex justify-between text-text-secondary">
                    <span>Subtotal:</span>
                    <span className="font-bold text-text-primary">₹{subtotalINR.toLocaleString("en-IN")}</span>
                  </div>
                  <div className="flex justify-between text-text-secondary">
                    <span>GST ({gstRatePercent}%):</span>
                    <span className="font-bold text-text-primary">₹{taxINR.toLocaleString("en-IN")}</span>
                  </div>
                  <div className="flex justify-between items-baseline pt-2 border-t border-border text-sm">
                    <span className="font-black text-text-primary">Total Payable:</span>
                    <span className="text-xl font-black text-primary">₹{grandTotalINR.toLocaleString("en-IN")}</span>
                  </div>
                </div>

                {/* Bank Account Details */}
                <div className="p-4 bg-blue-500/10 rounded-2xl border border-blue-500/20 text-xs space-y-2 text-text-primary">
                  <div className="flex justify-between items-center">
                    <span className="font-black text-blue-700 dark:text-blue-300 uppercase tracking-wider text-[11px]">
                      SolarKits Escrow Account
                    </span>
                    <span className="text-[10px] bg-blue-500/20 text-blue-700 dark:text-blue-300 font-bold px-2 py-0.5 rounded">
                      RTGS / NEFT / IMPS
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div>
                      <span className="text-text-muted block">Bank</span>
                      <strong>{bankDetails.bank_name}</strong>
                    </div>
                    <div>
                      <span className="text-text-muted block">Account No.</span>
                      <strong className="font-mono text-primary">{bankDetails.account_number}</strong>
                    </div>
                    <div>
                      <span className="text-text-muted block">IFSC Code</span>
                      <strong className="font-mono">{bankDetails.ifsc_code}</strong>
                    </div>
                    <div>
                      <span className="text-text-muted block">UPI ID</span>
                      <strong className="font-mono text-primary">{bankDetails.upi_id}</strong>
                    </div>
                  </div>
                </div>
              </div>

              {/* Step 5: Offline Payment UTR & Receipt */}
              <div className="space-y-3 pt-2 border-t border-border">
                <label className="block text-xs font-black uppercase tracking-wider text-text-primary">
                  Step 5: Enter Bank Transfer (UTR) &amp; Upload Receipt
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-text-primary mb-1">
                      UTR / Transaction Ref No. <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. HDFC0001928374"
                      value={utrNumber}
                      onChange={(e) => setUtrNumber(e.target.value.toUpperCase())}
                      className="w-full p-2.5 text-xs bg-surface border border-border rounded-xl font-mono uppercase font-bold focus:outline-none focus:border-primary"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-text-primary mb-1">
                      Amount Paid (₹) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      required
                      placeholder="Grand Total"
                      value={amountPaid}
                      onChange={(e) => setAmountPaid(e.target.value)}
                      className="w-full p-2.5 text-xs bg-surface border border-border rounded-xl font-mono font-bold focus:outline-none focus:border-primary"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-text-primary mb-1">
                      Payment Date <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      required
                      value={paymentDate}
                      onChange={(e) => setPaymentDate(e.target.value)}
                      className="w-full p-2.5 text-xs bg-surface border border-border rounded-xl focus:outline-none focus:border-primary"
                    />
                  </div>
                </div>

                {/* Receipt Upload Box */}
                <div className="border-2 border-dashed border-border hover:border-primary rounded-2xl p-4 text-center cursor-pointer relative bg-surface-hover/30">
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={handleFileChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  {receiptPreview ? (
                    <img src={receiptPreview} alt="Receipt preview" className="max-h-24 mx-auto rounded object-contain border" />
                  ) : receiptFile ? (
                    <p className="text-xs font-bold text-primary">{receiptFile.name} (Attached)</p>
                  ) : (
                    <div className="space-y-1">
                      <FiUploadCloud size={24} className="mx-auto text-primary" />
                      <p className="text-xs font-bold text-text-primary">
                        Upload Bank Transfer Receipt Screenshot (JPG, PNG, PDF)
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {formError && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-xs font-bold text-red-600">
                  {formError}
                </div>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setCreateModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-border text-text-secondary hover:bg-surface-hover text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || totalLooseQuantity <= 0}
                  className="px-6 py-2.5 bg-primary hover:bg-primary-hover text-white rounded-xl text-xs font-black shadow-md transition-all cursor-pointer disabled:opacity-50"
                >
                  {submitting ? "Submitting Loose PO..." : "Submit Loose Solar Kit PO Order"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── VIEW ORDER DETAILS MODAL ────────────────────────────────────────── */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-surface rounded-3xl border border-border shadow-2xl max-w-2xl w-full p-6 space-y-5 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95">
            <div className="flex justify-between items-center border-b border-border pb-3">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 bg-blue-500/15 text-blue-600 rounded">
                  Loose Solar Kit Order
                </span>
                <h3 className="text-lg font-black text-text-primary mt-1 font-mono">
                  {selectedOrder.po_number || selectedOrder.order_number || `#LPO-${String(selectedOrder._id).slice(-6).toUpperCase()}`}
                </h3>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="p-1.5 text-text-muted hover:text-text-primary rounded-lg hover:bg-surface-hover cursor-pointer"
              >
                <FiX size={20} />
              </button>
            </div>

            {/* Solar Kit Summary */}
            <div className="space-y-2">
              <span className="text-xs font-black uppercase tracking-wider text-text-primary block">
                Procured Solar Kit Package
              </span>
              <div className="p-4 bg-surface-hover rounded-2xl border border-border space-y-2 text-xs">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-extrabold text-sm text-text-primary">
                      {selectedOrder.items?.[0]?.item_name || "Authorized Solar Combo Kit"}
                    </h4>
                    <p className="text-text-muted text-[11px] mt-0.5">
                      Total Quantity: <strong className="text-primary font-mono">{(selectedOrder.items || []).reduce((sum, i) => sum + (i.quantity || 1), 0)} Kits</strong>
                    </p>
                  </div>
                  <StatusBadge status={selectedOrder.status || selectedOrder.order_status} />
                </div>
              </div>
            </div>

            {/* Financial Summary */}
            <div className="p-3.5 bg-surface-hover rounded-xl border border-border flex justify-between items-center text-xs">
              <span className="font-bold text-text-secondary">Total PO Amount:</span>
              <span className="text-base font-black text-primary">
                ₹{((selectedOrder.grand_total_inr || selectedOrder.grand_total_paise / 100 || selectedOrder.total_amount) || 0).toLocaleString("en-IN")}
              </span>
            </div>

            {/* Offline Payment Status */}
            <div className="p-3.5 bg-blue-500/10 rounded-xl border border-blue-500/20 space-y-1 text-xs text-text-primary">
              <span className="font-bold text-blue-700 dark:text-blue-300 uppercase tracking-wider text-[11px] block">
                Offline Bank Transfer Verification
              </span>
              <p className="font-mono">
                UTR Number: <strong>{selectedOrder.offline_payment?.utr_number || selectedOrder.payment_reference || "N/A"}</strong>
              </p>
              <p>
                Payment Status: <strong className="capitalize">{selectedOrder.payment_status || "In Verification"}</strong>
              </p>
            </div>

            {/* Dispatch Tracking Section if Dispatched */}
            {selectedOrder.dispatch_tracking?.tracking_number && (
              <div className="p-3.5 bg-purple-500/10 rounded-xl border border-purple-500/20 space-y-1 text-xs text-purple-900 dark:text-purple-200">
                <span className="font-bold uppercase tracking-wider text-[11px] block text-purple-700">
                  Logistics &amp; Dispatch Tracking
                </span>
                <p>Courier: <strong>{selectedOrder.dispatch_tracking.courier_name || "Express Freight"}</strong></p>
                <p className="font-mono">LR/Waybill: <strong>{selectedOrder.dispatch_tracking.tracking_number}</strong></p>
                {selectedOrder.dispatch_tracking.tracking_url && (
                  <a
                    href={selectedOrder.dispatch_tracking.tracking_url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-primary font-bold hover:underline inline-flex items-center gap-1 mt-1"
                  >
                    <FiExternalLink /> Live Courier Tracking URL
                  </a>
                )}
              </div>
            )}

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}