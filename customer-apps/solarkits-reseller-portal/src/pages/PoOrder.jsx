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
  FiTrendingUp
} from "react-icons/fi";
import api from "../services/api";

const STATUS_CONFIG = {
  DRAFT:               { label: "Draft", bg: "bg-slate-100 dark:bg-slate-800", text: "text-slate-600 dark:text-slate-300", icon: FiFileText },
  SUBMITTED:           { label: "Submitted", bg: "bg-blue-50 dark:bg-blue-900/30", text: "text-blue-600 dark:text-blue-400", icon: FiClock },
  PENDING_APPROVAL:    { label: "Pending Approval", bg: "bg-amber-50 dark:bg-amber-900/30", text: "text-amber-600 dark:text-amber-400", icon: FiClock },
  CHANGES_REQUESTED:   { label: "Changes Requested", bg: "bg-orange-50 dark:bg-orange-900/30", text: "text-orange-600 dark:text-orange-400", icon: FiAlertCircle },
  APPROVED:            { label: "Approved", bg: "bg-emerald-50 dark:bg-emerald-900/30", text: "text-emerald-600 dark:text-emerald-400", icon: FiCheckCircle },
  REJECTED:            { label: "Rejected", bg: "bg-red-50 dark:bg-red-900/30", text: "text-red-600 dark:text-red-400", icon: FiX },
  AWAITING_PAYMENT:    { label: "Awaiting Payment", bg: "bg-indigo-50 dark:bg-indigo-900/30", text: "text-indigo-600 dark:text-indigo-400", icon: FiDollarSign },
  PARTIALLY_PAID:      { label: "Partially Paid", bg: "bg-teal-50 dark:bg-teal-900/30", text: "text-teal-600 dark:text-teal-400", icon: FiDollarSign },
  PAID:                { label: "Paid", bg: "bg-emerald-50 dark:bg-emerald-900/30", text: "text-emerald-600 dark:text-emerald-400", icon: FiCheckCircle },
  PROCESSING:          { label: "Processing", bg: "bg-cyan-50 dark:bg-cyan-900/30", text: "text-cyan-600 dark:text-cyan-400", icon: FiRefreshCw },
  DISPATCHED:          { label: "Dispatched", bg: "bg-purple-50 dark:bg-purple-900/30", text: "text-purple-600 dark:text-purple-400", icon: FiBox },
  DELIVERED:           { label: "Delivered", bg: "bg-emerald-50 dark:bg-emerald-900/30", text: "text-emerald-600 dark:text-emerald-400", icon: FiCheckCircle },
  COMPLETED:           { label: "Completed", bg: "bg-emerald-50 dark:bg-emerald-900/30", text: "text-emerald-600 dark:text-emerald-400", icon: FiCheckCircle },
  CANCELLED:           { label: "Cancelled", bg: "bg-rose-50 dark:bg-rose-900/30", text: "text-rose-600 dark:text-rose-400", icon: FiX },
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

export default function PoOrder() {
  const [loading, setLoading] = useState(true);
  const [planData, setPlanData] = useState(null);
  const [epcBuyers, setEpcBuyers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [goalData, setGoalData] = useState(null);
  const [viewMode, setViewMode] = useState("table"); // "table" | "card"
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  // Create Order Modal State
  const [createModal, setCreateModal] = useState(false);
  const [selectedKitId, setSelectedKitId] = useState("");
  const [allocations, setAllocations] = useState({}); // { [epcBuyerId]: quantity }
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  // Detail Modal State
  const [selectedOrder, setSelectedOrder] = useState(null);

  // ── Fetch Plan PO Settings & Orders ──────────────────────────────────────────
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
        // Pre-select first kit if available
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
      console.error("Failed to load PO order context:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Active Kit Object
  const selectedKit = useMemo(() => {
    if (!planData?.combo_kits || !selectedKitId) return null;
    return planData.combo_kits.find(
      (k) => (k._id || k.id)?.toString() === selectedKitId?.toString()
    ) || null;
  }, [planData, selectedKitId]);

  // Active PO Setting matching selected kit
  const activePoSetting = useMemo(() => {
    if (!planData) return null;
    if (selectedKit?.po_setting_id && planData.po_settings_list) {
      const match = planData.po_settings_list.find(
        (s) => String(s._id || s.id) === String(selectedKit.po_setting_id)
      );
      if (match) return match;
    }
    if (selectedKitId && planData.po_settings_list) {
      const match = planData.po_settings_list.find((s) =>
        (s.allowed_combo_kit_ids || []).some(
          (k) => String(k._id || k.id || k) === String(selectedKitId)
        )
      );
      if (match) return match;
    }
    return planData.po_settings || null;
  }, [planData, selectedKit, selectedKitId]);

  // MOQ & PO Limits for Active Plan / Selected Kit
  const minPoQty = selectedKit?.min_po_quantity ?? (activePoSetting?.min_po_quantity ?? (planData?.po_settings?.min_po_quantity || 1));
  const maxPoQty = selectedKit?.max_po_quantity ?? (activePoSetting?.max_po_quantity ?? (planData?.po_settings?.max_po_quantity || 0)); // 0 = unlimited
  const validityDays = selectedKit?.po_validity_days ?? (activePoSetting?.po_validity_days ?? (planData?.po_settings?.po_validity_days || 30));

  // Total Allocated Quantity
  const totalAllocatedQty = useMemo(() => {
    return Object.values(allocations).reduce((sum, q) => sum + (parseInt(q, 10) || 0), 0);
  }, [allocations]);

  // Unit Price Calculation (Paise / INR)
  const unitPriceINR = useMemo(() => {
    if (!selectedKit) return 0;
    if (selectedKit.dealer_price) return selectedKit.dealer_price;
    if (selectedKit.base_price_cached) return selectedKit.base_price_cached;
    if (selectedKit.selling_price_cached) return selectedKit.selling_price_cached;
    if (selectedKit.price_with_tax) return selectedKit.price_with_tax;
    if (selectedKit.unit_price) return selectedKit.unit_price;
    if (selectedKit.price) return selectedKit.price;
    if (selectedKit.base_price) return selectedKit.base_price;
    return 45000; // Default fallback estimate
  }, [selectedKit]);

  const gstRatePercent = selectedKit?.gst_rate || 12;
  const subtotalINR = totalAllocatedQty * unitPriceINR;
  const taxINR = Math.round((subtotalINR * gstRatePercent) / 100);
  const grandTotalINR = subtotalINR + taxINR;

  const isMoqSatisfied = totalAllocatedQty >= minPoQty;
  const isMaxSatisfied = maxPoQty === 0 || totalAllocatedQty <= maxPoQty;

  // Handle EPC Quantity Change
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

  // ── Submit PO Order ────────────────────────────────────────────────────────
  const handleCreateOrder = async (e) => {
    e.preventDefault();
    setFormError("");

    if (!selectedKit) {
      setFormError("Please select a Combo Kit / Product.");
      return;
    }
    if (totalAllocatedQty === 0) {
      setFormError("Please allocate quantities to at least one EPC Buyer.");
      return;
    }
    if (!isMoqSatisfied) {
      setFormError(`Minimum PO Quantity requirement is ${minPoQty} kits. Current total is ${totalAllocatedQty}.`);
      return;
    }
    if (!isMaxSatisfied) {
      setFormError(`Maximum PO Quantity limit is ${maxPoQty} kits for this plan.`);
      return;
    }

    // Build EPC allocations array
    const epcAllocationsList = Object.entries(allocations).map(([buyerId, qty]) => {
      const buyer = epcBuyers.find((b) => (b._id || b.id)?.toString() === buyerId?.toString());
      return {
        epc_buyer_id: buyerId,
        company_name: buyer?.company_name || buyer?.name || "EPC Buyer",
        buyer_name: buyer?.name || buyer?.company_name || "EPC Buyer",
        gstin: buyer?.gstin || null,
        allocated_quantity: qty,
      };
    });

    const itemPayload = {
      kit_id: selectedKit._id || selectedKit.id,
      item_name: selectedKit.name || selectedKit.kit_name || "Solar Combo Kit",
      item_code: selectedKit.kit_code || selectedKit.code || null,
      quantity: totalAllocatedQty,
      unit_price_paise: Math.round(unitPriceINR * 100),
      gst_rate: gstRatePercent,
      epc_allocations: epcAllocationsList,
    };

    setSubmitting(true);
    try {
      const res = await api.post("/india/v1/reseller/po/create", {
        items: [itemPayload],
        auto_submit: true,
      });

      if (res.data?.status === "success") {
        setCreateModal(false);
        setAllocations({});
        fetchData();
      } else {
        setFormError(res.data?.message || "Failed to submit Purchase Order.");
      }
    } catch (err) {
      setFormError(err.response?.data?.message || "Failed to submit Purchase Order.");
    } finally {
      setSubmitting(false);
    }
  };

  // Filtered Orders
  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      if (statusFilter && o.status !== statusFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        const num = (o.po_number || "").toLowerCase();
        const kitName = (o.items?.[0]?.item_name || "").toLowerCase();
        return num.includes(q) || kitName.includes(q);
      }
      return true;
    });
  }, [orders, statusFilter, search]);

  return (
    <div className="space-y-6 pb-24">
      {/* ── Top Header Banner ─────────────────────────────────────────────────── */}
      <div
        className="relative rounded-3xl p-6 sm:p-8 text-white shadow-xl overflow-hidden"
        style={{ background: "var(--gradient-primary, linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%))" }}
      >
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black tracking-wider uppercase bg-white/20 backdrop-blur-md border border-white/20 text-white">
                <FiShield size={12} /> Franchisee PO Ordering
              </span>
              {planData?.plan?.name && (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-amber-400/30 text-amber-200 border border-amber-400/40">
                  ★ {planData.plan.name}
                </span>
              )}
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              Purchase Orders & EPC Allocations
            </h1>
            <p className="text-white/80 text-xs sm:text-sm max-w-xl">
              Place bulk solar kit purchase orders based on your active plan MOQ and allocate quantities across your onboarded EPC Buyers.
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
              disabled={!planData?.has_active_plan}
              className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-white text-blue-900 hover:bg-white/90 text-sm font-black shadow-lg transition-all transform active:scale-95 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FiPlus size={18} />
              <span>Create Purchase Order</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── Monthly Kit Target & Goal Compact Achievement Bar ───────────────────── */}
      {goalData && (
        <div className="p-4 sm:p-5 rounded-2xl bg-surface border border-border shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-blue-600/10 text-blue-600 flex items-center justify-center font-bold shrink-0">
              <FiTarget size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-black uppercase tracking-wider text-text-muted">
                  {goalData.period || "Monthly Target Goal"}
                </span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                  (goalData.achievement_pct || 0) >= 100
                    ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300"
                    : "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300"
                }`}>
                  {goalData.achievement_pct || 0}% Achieved
                </span>
              </div>
              <div className="text-xs sm:text-sm font-black text-text-primary mt-0.5">
                {goalData.eligible_kits || 0} / {goalData.monthly_goal || 100} Kits Fulfilled
                <span className="text-xs font-normal text-text-muted ml-2">
                  ({goalData.balance_kits != null ? goalData.balance_kits : (100 - (goalData.eligible_kits || 0))} kits remaining to meet monthly target)
                </span>
              </div>
            </div>
          </div>

          <div className="w-full md:w-60 space-y-1.5 shrink-0">
            <div className="flex justify-between text-[11px] font-bold text-text-muted">
              <span>Goal Progress</span>
              <span>{goalData.days_remaining != null ? `${goalData.days_remaining}d left` : "This Month"}</span>
            </div>
            <div className="h-2.5 w-full bg-bg rounded-full overflow-hidden p-0.5 border border-border">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  (goalData.achievement_pct || 0) >= 100 ? "bg-emerald-500" : "bg-blue-600"
                }`}
                style={{ width: `${Math.min(Math.max(goalData.achievement_pct || 0, 4), 100)}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* ── Active Plan & PO Rules Context Strip ───────────────────────────── */}
      {planData?.has_active_plan ? (
        <div
          className="rounded-2xl p-4 sm:p-5 border shadow-xs"
          style={{ background: "var(--color-surface)", borderColor: "var(--color-border)" }}
        >
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-1">
              <div className="text-[11px] font-bold uppercase tracking-wider text-text-muted flex items-center gap-1.5">
                <FiLayers size={13} className="text-primary" /> Active Plan
              </div>
              <div className="text-sm font-black text-text-primary">
                {planData?.plan?.name || "Standard Franchise"}
              </div>
              <div className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                {planData?.plan?.territory_level?.toUpperCase() || "DISTRICT"} LEVEL
              </div>
            </div>

            <div className="space-y-1">
              <div className="text-[11px] font-bold uppercase tracking-wider text-text-muted flex items-center gap-1.5">
                <FiBox size={13} className="text-primary" /> Min PO Order Limit
              </div>
              <div className="text-sm font-black text-text-primary">
                {minPoQty} Kits Minimum
              </div>
              <div className="text-[11px] text-text-muted">
                Per PO Order Threshold
              </div>
            </div>

            <div className="space-y-1">
              <div className="text-[11px] font-bold uppercase tracking-wider text-text-muted flex items-center gap-1.5">
                <FiClock size={13} className="text-primary" /> PO Validity Window
              </div>
              <div className="text-sm font-black text-text-primary">
                {validityDays} Days
              </div>
              <div className="text-[11px] text-text-muted">
                Until Expiry
              </div>
            </div>

            <div className="space-y-1">
              <div className="text-[11px] font-bold uppercase tracking-wider text-text-muted flex items-center gap-1.5">
                <FiUsers size={13} className="text-primary" /> Registered EPC Buyers
              </div>
              <div className="text-sm font-black text-text-primary">
                {epcBuyers.length} Onboarded
              </div>
              <Link to="/epc-buyers" className="text-[11px] font-bold text-primary hover:underline">
                + Manage EPC Network →
              </Link>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-6 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <FiAlertCircle size={24} className="text-amber-500 shrink-0" />
            <div>
              <div className="text-sm font-bold text-text-primary">No Active Franchise Plan Subscription</div>
              <div className="text-xs text-text-muted">You need an active franchise plan to place purchase orders with configured MOQ rules.</div>
            </div>
          </div>
          <Link
            to="/plans"
            className="px-4 py-2 rounded-xl bg-primary text-white text-xs font-bold hover:opacity-90 transition-all shrink-0"
          >
            Explore & Subscribe Plans
          </Link>
        </div>
      )}

      {/* ── Search & Filter Controls ────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" size={16} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by PO Number or Kit..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl text-xs font-semibold border transition-all"
            style={{
              background: "var(--color-surface)",
              borderColor: "var(--color-border)",
              color: "var(--color-text-primary)",
            }}
          />
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2.5 rounded-xl text-xs font-semibold border cursor-pointer"
            style={{
              background: "var(--color-surface)",
              borderColor: "var(--color-border)",
              color: "var(--color-text-primary)",
            }}
          >
            <option value="">All Statuses</option>
            <option value="SUBMITTED">Submitted</option>
            <option value="PENDING_APPROVAL">Pending Approval</option>
            <option value="APPROVED">Approved</option>
            <option value="AWAITING_PAYMENT">Awaiting Payment</option>
            <option value="PAID">Paid</option>
            <option value="PROCESSING">Processing</option>
            <option value="DISPATCHED">Dispatched</option>
            <option value="DELIVERED">Delivered</option>
          </select>

          <div
            className="flex items-center p-1 rounded-xl border"
            style={{ background: "var(--color-surface)", borderColor: "var(--color-border)" }}
          >
            <button
              onClick={() => setViewMode("table")}
              className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                viewMode === "table" ? "bg-primary text-white shadow-xs" : "text-text-muted hover:text-text-primary"
              }`}
              title="Table View"
            >
              <FiList size={15} />
            </button>
            <button
              onClick={() => setViewMode("card")}
              className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                viewMode === "card" ? "bg-primary text-white shadow-xs" : "text-text-muted hover:text-text-primary"
              }`}
              title="Card View"
            >
              <FiGrid size={15} />
            </button>
          </div>
        </div>
      </div>

      {/* ── Orders Table / Grid ────────────────────────────────────────────── */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3">
          <FiLoader size={28} className="animate-spin text-primary" />
          <p className="text-xs font-semibold text-text-muted">Loading purchase orders...</p>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div
          className="p-12 text-center rounded-3xl border border-dashed flex flex-col items-center justify-center gap-3"
          style={{ background: "var(--color-surface)", borderColor: "var(--color-border)" }}
        >
          <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
            <FiShoppingCart size={24} />
          </div>
          <h3 className="text-base font-bold text-text-primary">No Purchase Orders Placed Yet</h3>
          <p className="text-xs text-text-muted max-w-sm">
            Create your first purchase order according to your plan's MOQ and allocate units across your EPC Buyers.
          </p>
          <button
            onClick={() => setCreateModal(true)}
            disabled={!planData?.has_active_plan}
            className="mt-2 px-4 py-2.5 rounded-xl bg-primary text-white text-xs font-bold hover:opacity-90 transition-all cursor-pointer disabled:opacity-50"
          >
            + Create New Purchase Order
          </button>
        </div>
      ) : viewMode === "table" ? (
        <div
          className="rounded-2xl border shadow-xs overflow-hidden"
          style={{ background: "var(--color-surface)", borderColor: "var(--color-border)" }}
        >
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead
                className="border-b text-[11px] font-black uppercase tracking-wider text-text-muted"
                style={{ background: "var(--color-surface-hover, #f8fafc)", borderColor: "var(--color-border)" }}
              >
                <tr>
                  <th className="py-3.5 px-4">PO Number & Date</th>
                  <th className="py-3.5 px-4">Product / Combo Kit</th>
                  <th className="py-3.5 px-4">EPC Allocations</th>
                  <th className="py-3.5 px-4 text-center">Total Quantity</th>
                  <th className="py-3.5 px-4">Grand Total (₹)</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {filteredOrders.map((order) => {
                  const item = order.items?.[0] || {};
                  const allocationsList = item.epc_allocations || [];
                  const grandTotal = (order.grand_total_paise || 0) / 100;

                  return (
                    <tr key={order._id} className="hover:bg-surface-hover/50 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-mono font-bold text-text-primary text-xs flex items-center gap-1.5">
                          <FiFileText size={12} className="text-primary" />
                          {order.po_number}
                        </div>
                        <div className="text-[10px] text-text-muted mt-0.5">
                          {new Date(order.created_at || order.createdAt).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-bold text-text-primary truncate max-w-xs">
                          {item.item_name || "Solar Combo Kit"}
                        </div>
                        <div className="text-[10px] text-text-muted">
                          {order.plan_id?.name || planData?.plan?.name || "Franchise Plan"}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        {allocationsList.length > 0 ? (
                          <div className="flex flex-wrap gap-1 max-w-xs">
                            {allocationsList.map((a, i) => (
                              <span
                                key={i}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-primary/10 text-primary border border-primary/20"
                              >
                                {a.company_name || a.buyer_name}: {a.allocated_quantity}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-[10px] text-text-muted">Direct PO (No EPC split)</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-extrabold bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300">
                          {order.total_quantity || item.quantity || 0} Kits
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-extrabold text-text-primary text-xs">
                          ₹{grandTotal.toLocaleString("en-IN")}
                        </div>
                        <div className="text-[10px] text-text-muted">
                          Incl. GST
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <StatusBadge status={order.status} />
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => setSelectedOrder(order)}
                          className="px-3 py-1.5 rounded-lg text-xs font-bold bg-primary/10 text-primary hover:bg-primary hover:text-white transition-all cursor-pointer"
                        >
                          View Details
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
            const item = order.items?.[0] || {};
            const allocationsList = item.epc_allocations || [];
            const grandTotal = (order.grand_total_paise || 0) / 100;

            return (
              <div
                key={order._id}
                className="p-5 rounded-2xl border shadow-xs flex flex-col justify-between gap-4 hover:shadow-md transition-all"
                style={{ background: "var(--color-surface)", borderColor: "var(--color-border)" }}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-black text-xs text-primary">
                      {order.po_number}
                    </span>
                    <StatusBadge status={order.status} />
                  </div>

                  <div>
                    <h4 className="font-bold text-text-primary text-sm line-clamp-1">
                      {item.item_name || "Solar Combo Kit"}
                    </h4>
                    <p className="text-[11px] text-text-muted mt-0.5">
                      {new Date(order.created_at || order.createdAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                  </div>

                  {/* EPC Breakdown Box */}
                  <div
                    className="p-3 rounded-xl border text-xs space-y-1.5"
                    style={{ background: "var(--color-surface-hover, #f8fafc)", borderColor: "var(--color-border)" }}
                  >
                    <div className="text-[10px] font-bold uppercase tracking-wider text-text-muted flex items-center justify-between">
                      <span>EPC Buyer Allocations</span>
                      <span>{allocationsList.length} Buyers</span>
                    </div>
                    {allocationsList.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {allocationsList.map((a, i) => (
                          <span
                            key={i}
                            className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-primary/10 text-primary border border-primary/20"
                          >
                            {a.company_name || a.buyer_name}: <strong>{a.allocated_quantity}</strong>
                          </span>
                        ))}
                      </div>
                    ) : (
                      <div className="text-[10px] text-text-muted">Standard Direct Purchase</div>
                    )}
                  </div>
                </div>

                <div className="pt-3 border-t border-border flex items-center justify-between">
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-wider text-text-muted">Total Amount</div>
                    <div className="text-base font-black text-text-primary">
                      ₹{grandTotal.toLocaleString("en-IN")}
                    </div>
                  </div>

                  <button
                    onClick={() => setSelectedOrder(order)}
                    className="flex items-center gap-1 px-3.5 py-2 rounded-xl text-xs font-bold bg-primary text-white hover:opacity-90 transition-all cursor-pointer shadow-xs"
                  >
                    <FiEye size={13} /> View
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── CREATE PURCHASE ORDER MODAL ─────────────────────────────────────── */}
      <AnimatePresence>
        {createModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-xs"
              onClick={() => !submitting && setCreateModal(false)}
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-2xl max-h-[90vh] flex flex-col rounded-3xl border shadow-2xl overflow-hidden z-10"
              style={{ background: "var(--color-surface)", borderColor: "var(--color-border)" }}
            >
              {/* Modal Header */}
              <div className="p-6 border-b border-border flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-black text-text-primary flex items-center gap-2">
                    <FiShoppingCart className="text-primary" /> Create Purchase Order
                  </h2>
                  <p className="text-xs text-text-muted mt-0.5">
                    Plan: <strong className="text-text-primary">{planData?.plan?.name}</strong> • Min PO: <strong className="text-emerald-600 dark:text-emerald-400">{minPoQty} kits</strong>
                  </p>
                </div>
                <button
                  onClick={() => setCreateModal(false)}
                  disabled={submitting}
                  className="p-2 rounded-xl hover:bg-surface-hover text-text-muted hover:text-text-primary transition-colors cursor-pointer"
                >
                  <FiX size={18} />
                </button>
              </div>

              {/* Modal Form Content */}
              <form onSubmit={handleCreateOrder} className="flex-1 overflow-y-auto p-6 space-y-6">
                {formError && (
                  <div className="p-3.5 rounded-xl bg-danger-soft border border-danger/30 text-danger text-xs font-semibold flex items-center gap-2">
                    <FiAlertCircle size={16} className="shrink-0" />
                    <span>{formError}</span>
                  </div>
                )}

                {/* Section 1: Product / Kit Selector */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-text-muted">
                    1. Select Solar Combo Kit / Product <span className="text-danger">*</span>
                  </label>
                  {(!planData?.combo_kits || planData.combo_kits.length === 0) ? (
                    <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-300 text-xs font-semibold flex items-center gap-2">
                      <FiAlertCircle size={16} className="shrink-0" />
                      <span>No products are assigned for Purchase Orders under your plan. Please contact admin to assign products in Plan PO Settings.</span>
                    </div>
                  ) : (
                    <select
                      value={selectedKitId}
                      onChange={(e) => setSelectedKitId(e.target.value)}
                      className="w-full px-3.5 py-3 rounded-xl text-xs font-bold border transition-all cursor-pointer"
                      style={{
                        background: "var(--color-surface)",
                        borderColor: "var(--color-border)",
                        color: "var(--color-text-primary)",
                      }}
                    >
                      {planData.combo_kits.map((kit) => {
                        const kitId = kit._id || kit.id;
                        const price =
                          kit.dealer_price ||
                          kit.base_price_cached ||
                          kit.selling_price_cached ||
                          kit.price_with_tax ||
                          kit.unit_price ||
                          kit.price ||
                          kit.base_price ||
                          0;
                        const cap = kit.capacity_kw || kit.capacity;
                        return (
                          <option key={kitId} value={kitId}>
                            {kit.name || kit.kit_name || "Solar Kit"} {cap ? `(${cap} kW)` : ""} — ₹{price.toLocaleString("en-IN")}
                          </option>
                        );
                      })}
                    </select>
                  )}
                </div>

                {/* Section 2: EPC Buyer Allocation Matrix */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-text-muted">
                        2. Allocate Quantities to Onboarded EPC Buyers <span className="text-danger">*</span>
                      </label>
                      <p className="text-[11px] text-text-muted">
                        Enter quantities for each EPC. Total across all buyers must be at least {minPoQty} kits.
                      </p>
                    </div>
                    <Link
                      to="/epc-buyers"
                      target="_blank"
                      className="text-[11px] font-bold text-primary hover:underline shrink-0"
                    >
                      + Onboard New EPC
                    </Link>
                  </div>

                  {epcBuyers.length === 0 ? (
                    <div className="p-4 rounded-xl border border-dashed text-center text-xs text-text-muted space-y-2">
                      <p>You haven't onboarded any EPC Buyers yet.</p>
                      <Link
                        to="/epc-buyers"
                        className="inline-block px-3 py-1.5 rounded-lg bg-primary text-white font-bold text-xs"
                      >
                        Register EPC Buyer First
                      </Link>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                      {epcBuyers.map((buyer) => {
                        const buyerId = buyer._id || buyer.id;
                        const qty = allocations[buyerId] || 0;

                        return (
                          <div
                            key={buyerId}
                            className={`p-3 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                              qty > 0 ? "border-primary/50 bg-primary/5" : "border-border bg-surface"
                            }`}
                          >
                            <div className="min-w-0">
                              <div className="font-bold text-xs text-text-primary truncate">
                                {buyer.company_name || buyer.name}
                              </div>
                              <div className="text-[10px] text-text-muted">
                                GSTIN: {buyer.gstin || "Unregistered"} • {buyer.state?.name || "India"}
                              </div>
                            </div>

                            {/* Stepper Input */}
                            <div className="flex items-center gap-2 shrink-0">
                              <button
                                type="button"
                                onClick={() => handleStepQty(buyerId, -5)}
                                className="w-7 h-7 rounded-lg bg-surface-hover hover:bg-border text-text-primary font-black text-xs flex items-center justify-center cursor-pointer"
                              >
                                -5
                              </button>
                              <button
                                type="button"
                                onClick={() => handleStepQty(buyerId, -1)}
                                className="w-7 h-7 rounded-lg bg-surface-hover hover:bg-border text-text-primary font-black text-xs flex items-center justify-center cursor-pointer"
                              >
                                -1
                              </button>
                              <input
                                type="number"
                                min="0"
                                value={qty || ""}
                                placeholder="0"
                                onChange={(e) => handleQuantityChange(buyerId, e.target.value)}
                                className="w-14 text-center py-1 rounded-lg text-xs font-black border text-text-primary"
                                style={{ background: "var(--color-surface)", borderColor: "var(--color-border)" }}
                              />
                              <button
                                type="button"
                                onClick={() => handleStepQty(buyerId, 1)}
                                className="w-7 h-7 rounded-lg bg-surface-hover hover:bg-border text-text-primary font-black text-xs flex items-center justify-center cursor-pointer"
                              >
                                +1
                              </button>
                              <button
                                type="button"
                                onClick={() => handleStepQty(buyerId, 5)}
                                className="w-7 h-7 rounded-lg bg-surface-hover hover:bg-border text-text-primary font-black text-xs flex items-center justify-center cursor-pointer"
                              >
                                +5
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Progress / Threshold Indicator */}
                <div
                  className="p-4 rounded-2xl border space-y-3"
                  style={{ background: "var(--color-surface-hover, #f8fafc)", borderColor: "var(--color-border)" }}
                >
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-text-muted uppercase tracking-wider text-[10px]">
                      MOQ Compliance Progress
                    </span>
                    <span className={isMoqSatisfied ? "text-emerald-600 font-extrabold" : "text-amber-600 font-extrabold"}>
                      {totalAllocatedQty} / {minPoQty} Kits ({isMoqSatisfied ? "✓ Limit Satisfied" : `${minPoQty - totalAllocatedQty} more needed`})
                    </span>
                  </div>

                  <div className="w-full h-2 rounded-full bg-border overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        isMoqSatisfied ? "bg-emerald-500" : "bg-amber-500"
                      }`}
                      style={{ width: `${Math.min(100, (totalAllocatedQty / minPoQty) * 100)}%` }}
                    />
                  </div>

                  {/* Financials Breakdown */}
                  <div className="pt-2 border-t border-border/50 text-xs space-y-1.5">
                    <div className="flex justify-between text-text-secondary">
                      <span>Kit Unit Price (Dealer):</span>
                      <span className="font-semibold">₹{unitPriceINR.toLocaleString("en-IN")}</span>
                    </div>
                    <div className="flex justify-between text-text-secondary">
                      <span>Subtotal ({totalAllocatedQty} kits):</span>
                      <span className="font-semibold">₹{subtotalINR.toLocaleString("en-IN")}</span>
                    </div>
                    <div className="flex justify-between text-text-secondary">
                      <span>GST ({gstRatePercent}%):</span>
                      <span className="font-semibold">₹{taxINR.toLocaleString("en-IN")}</span>
                    </div>
                    <div className="flex justify-between text-text-primary font-black text-sm pt-1 border-t border-border">
                      <span>Grand Total:</span>
                      <span className="text-primary">₹{grandTotalINR.toLocaleString("en-IN")}</span>
                    </div>
                  </div>
                </div>

                {/* Modal Footer */}
                <div className="pt-3 border-t border-border flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setCreateModal(false)}
                    disabled={submitting}
                    className="px-5 py-2.5 rounded-xl border text-xs font-bold text-text-secondary hover:bg-surface-hover transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting || !isMoqSatisfied || totalAllocatedQty === 0}
                    className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary text-white text-xs font-black shadow-lg hover:opacity-90 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submitting ? (
                      <>
                        <FiLoader size={14} className="animate-spin" />
                        <span>Submitting Order...</span>
                      </>
                    ) : (
                      <>
                        <FiCheck size={14} />
                        <span>Submit Purchase Order</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── ORDER DETAIL MODAL ──────────────────────────────────────────────── */}
      <AnimatePresence>
        {selectedOrder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-xs"
              onClick={() => setSelectedOrder(null)}
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-2xl max-h-[90vh] flex flex-col rounded-3xl border shadow-2xl overflow-hidden z-10"
              style={{ background: "var(--color-surface)", borderColor: "var(--color-border)" }}
            >
              <div className="p-6 border-b border-border flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-black text-text-primary">
                      PO Breakdown: {selectedOrder.po_number}
                    </h2>
                    <StatusBadge status={selectedOrder.status} />
                  </div>
                  <p className="text-xs text-text-muted mt-0.5">
                    Placed on {new Date(selectedOrder.created_at || selectedOrder.createdAt).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="p-2 rounded-xl hover:bg-surface-hover text-text-muted hover:text-text-primary transition-colors cursor-pointer"
                >
                  <FiX size={18} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-5 text-xs">
                {/* Items & Allocation Table */}
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
                        {selectedOrder.items?.map((it, idx) => (
                          <tr key={idx}>
                            <td className="py-3 px-3">
                              <div className="font-bold text-text-primary">{it.item_name}</div>
                              <div className="text-[10px] text-text-muted">GST @ {it.gst_rate}%</div>
                            </td>
                            <td className="py-3 px-3 text-center font-bold">{it.quantity} Kits</td>
                            <td className="py-3 px-3 font-mono">₹{((it.unit_price_paise || 0) / 100).toLocaleString("en-IN")}</td>
                            <td className="py-3 px-3 text-right font-bold font-mono">
                              ₹{((it.total_price_paise || 0) / 100).toLocaleString("en-IN")}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* EPC Breakdown Table */}
                <div className="space-y-2">
                  <h4 className="font-bold text-text-primary uppercase tracking-wider text-[11px]">
                    EPC Buyer Allocations
                  </h4>
                  <div className="border border-border rounded-xl overflow-hidden">
                    <table className="w-full text-left">
                      <thead className="bg-surface-hover border-b border-border text-[10px] font-black uppercase text-text-muted">
                        <tr>
                          <th className="py-2.5 px-3">EPC Buyer</th>
                          <th className="py-2.5 px-3">GSTIN</th>
                          <th className="py-2.5 px-3 text-right">Allocated Kits</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {(selectedOrder.items?.[0]?.epc_allocations || []).map((alloc, aIdx) => (
                          <tr key={aIdx}>
                            <td className="py-2.5 px-3 font-bold text-text-primary">
                              {alloc.company_name || alloc.buyer_name}
                            </td>
                            <td className="py-2.5 px-3 text-text-muted">{alloc.gstin || "N/A"}</td>
                            <td className="py-2.5 px-3 text-right font-black text-primary">
                              {alloc.allocated_quantity} Kits
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Payment & Status Summary */}
                <div
                  className="p-4 rounded-xl border flex items-center justify-between"
                  style={{ background: "var(--color-surface-hover, #f8fafc)", borderColor: "var(--color-border)" }}
                >
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-wider text-text-muted">Grand Total Payable</div>
                    <div className="text-lg font-black text-text-primary">
                      ₹{((selectedOrder.grand_total_paise || 0) / 100).toLocaleString("en-IN")}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-text-muted">Current Workflow Status</div>
                    <StatusBadge status={selectedOrder.status} />
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}