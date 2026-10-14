import React, { useState, useEffect, useCallback } from "react";
import {
  MdSearch,
  MdRefresh,
  MdFilterList,
  MdVisibility,
  MdReceipt,
  MdShoppingCart,
  MdOutlineVerifiedUser,
  MdOutlinePendingActions,
  MdClose,
  MdLocationOn,
} from "react-icons/md";
import {
  FaBolt,
  FaHandshake,
  FaRupeeSign,
  FaShieldAlt,
  FaTruckMoving,
  FaRegCopy,
  FaCheck,
} from "react-icons/fa";
import {
  FiCheckCircle,
  FiXCircle,
  FiClock,
  FiFileText,
  FiExternalLink,
  FiUploadCloud,
  FiFilter,
  FiChevronDown,
  FiX,
  FiAlertCircle,
} from "react-icons/fi";
import {
  getUnifiedEpcOrders,
  verifyEpcOrderPayment,
} from "../../api/solarshopAccounts";
import TransactionDetailsDrawer from "../../components/TransactionDetailsDrawer";
import Product8StageJourneyModal from "../../components/Product8StageJourneyModal";
import Button from "../../components/Button";

export default function EpcOrdersManagement() {
  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState({
    total_volume: 0,
    total_orders: 0,
    online_count: 0,
    online_volume: 0,
    offline_count: 0,
    offline_pending_count: 0,
    total_commissions: 0,
    direct_count: 0,
    onboarded_count: 0,
  });

  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 15;

  // ── Quick Segment Tabs ──────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState("all"); // 'all' | 'offline_pending' | 'online' | 'direct' | 'onboarded'

  // ── Filter Bar State ───────────────────────────────────────────────────
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [paymentModeFilter, setPaymentModeFilter] = useState("all"); // 'all' | 'online' | 'offline'
  const [verificationStatusFilter, setVerificationStatusFilter] = useState("all"); // 'all' | 'pending' | 'approved' | 'rejected'
  const [adminApprovalStatusFilter, setAdminApprovalStatusFilter] = useState("all"); // 'all' | 'pending' | 'approved' | 'rejected'
  const [channelFilter, setChannelFilter] = useState("all"); // 'all' | 'direct' | 'onboarded'
  const [orderStatusFilter, setOrderStatusFilter] = useState("all"); // 'all' | 'pending' | 'confirmed' | 'procurement' | ...
  const [paymentStatusFilter, setPaymentStatusFilter] = useState("all"); // 'all' | 'paid' | 'pending' | 'failed' | 'refunded'
  const [datePreset, setDatePreset] = useState("all"); // 'all' | 'today' | 'yesterday' | 'last_7_days' | 'last_30_days' | 'this_month'
  const [copiedUtr, setCopiedUtr] = useState("");

  // ── Drawers & Modals ───────────────────────────────────────────────────
  const [selectedTxn, setSelectedTxn] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [journeyOrder, setJourneyOrder] = useState(null);

  // ── Offline Receipt Preview & Verification Action Modal ───────────────
  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const [actionModal, setActionModal] = useState({
    isOpen: false,
    order: null,
    decision: "approved", // 'approved' | 'rejected'
    notes: "",
    reason: "",
  });
  const [submittingAction, setSubmittingAction] = useState(false);

  // ── Fetch Orders ───────────────────────────────────────────────────────
  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page,
        limit,
        tab: activeTab,
      };

      if (paymentModeFilter !== "all") params.payment_mode = paymentModeFilter;
      if (verificationStatusFilter !== "all") params.verification_status = verificationStatusFilter;
      if (adminApprovalStatusFilter !== "all") params.admin_approval_status = adminApprovalStatusFilter;
      if (channelFilter !== "all") params.channel = channelFilter;
      if (orderStatusFilter !== "all") params.order_status = orderStatusFilter;
      if (paymentStatusFilter !== "all") params.payment_status = paymentStatusFilter;
      if (datePreset !== "all") params.date_preset = datePreset;
      if (searchQuery.trim()) params.search = searchQuery.trim();

      const res = await getUnifiedEpcOrders(params);
      if (res.status === "success") {
        setOrders(res.data || []);
        setTotal(res.total || 0);
        setTotalPages(res.totalPages || 1);
        if (res.stats) setStats(res.stats);
      }
    } catch (err) {
      console.error("Error fetching unified epc orders:", err);
    } finally {
      setLoading(false);
    }
  }, [
    page,
    activeTab,
    paymentModeFilter,
    verificationStatusFilter,
    adminApprovalStatusFilter,
    channelFilter,
    orderStatusFilter,
    paymentStatusFilter,
    datePreset,
    searchQuery,
  ]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Real-time listener for incoming ICICI webhook credits
  useEffect(() => {
    const handlePaymentReceived = () => {
      fetchOrders();
    };
    window.addEventListener("ICICI_PAYMENT_RECEIVED", handlePaymentReceived);
    return () => window.removeEventListener("ICICI_PAYMENT_RECEIVED", handlePaymentReceived);
  }, [fetchOrders]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchOrders();
  };

  const handleResetFilters = () => {
    setSearchQuery("");
    setPaymentModeFilter("all");
    setVerificationStatusFilter("all");
    setAdminApprovalStatusFilter("all");
    setChannelFilter("all");
    setOrderStatusFilter("all");
    setPaymentStatusFilter("all");
    setDatePreset("all");
    setActiveTab("all");
    setPage(1);
  };

  const handleCopyUtr = (utr) => {
    if (!utr) return;
    navigator.clipboard.writeText(utr);
    setCopiedUtr(utr);
    setTimeout(() => setCopiedUtr(""), 2000);
  };

  const formatCurrency = (val) => {
    if (val == null || isNaN(val)) return "₹0.00";
    return `₹${Number(val).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "N/A";
    try {
      return new Date(dateStr).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateStr;
    }
  };

  // ── Verification Action Submit ─────────────────────────────────────────
  const handleOpenActionModal = (order, decision) => {
    setActionModal({
      isOpen: true,
      order,
      decision,
      notes: "",
      reason: "",
    });
  };

  const handleCloseActionModal = () => {
    setActionModal({
      isOpen: false,
      order: null,
      decision: "approved",
      notes: "",
      reason: "",
    });
  };

  const handleSubmitVerification = async () => {
    if (!actionModal.order) return;
    if (actionModal.decision === "rejected" && !actionModal.reason.trim()) {
      alert("Please enter a rejection reason.");
      return;
    }

    setSubmittingAction(true);
    try {
      const payload = {
        decision: actionModal.decision,
        notes: actionModal.notes,
        rejection_reason: actionModal.reason,
      };

      const res = await verifyEpcOrderPayment(actionModal.order._id || actionModal.order.id, payload);
      if (res.status === "success") {
        handleCloseActionModal();
        fetchOrders();
      } else {
        alert(res.message || "Action failed");
      }
    } catch (err) {
      console.error("Verification submit error:", err);
      alert(err.response?.data?.message || err.message || "Failed to update payment status");
    } finally {
      setSubmittingAction(false);
    }
  };

  const activeFiltersCount = [
    paymentModeFilter !== "all",
    verificationStatusFilter !== "all",
    adminApprovalStatusFilter !== "all",
    channelFilter !== "all",
    orderStatusFilter !== "all",
    paymentStatusFilter !== "all",
    datePreset !== "all",
    searchQuery.trim().length > 0,
  ].filter(Boolean).length;

  return (
    <div className="space-y-6 pb-12">
      {/* ── Top Header ──────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <FaBolt className="text-lg" />
            </span>
            <h1 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              EPC Order & Payment Management
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Unified control center for Direct & Onboarded EPC orders, ICICI Virtual Account (VAN) transactions, and offline payment verifications.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 border transition ${
              showFilters || activeFiltersCount > 0
                ? "bg-primary/10 border-primary text-primary"
                : "bg-surface border-border text-text-secondary hover:text-text-primary"
            }`}
          >
            <MdFilterList className="text-sm" />
            <span>Filters</span>
            {activeFiltersCount > 0 && (
              <span className="w-5 h-5 rounded-full bg-primary text-white text-[10px] flex items-center justify-center font-black">
                {activeFiltersCount}
              </span>
            )}
          </button>

          <Button
            onClick={fetchOrders}
            variant="outline"
            size="sm"
            className="flex items-center gap-1.5"
            disabled={loading}
          >
            <MdRefresh className={`text-base ${loading ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </Button>
        </div>
      </div>

      {/* ── KPI Metric Cards ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total EPC Volume */}
        <div className="bg-surface p-5 rounded-2xl border border-border shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs font-semibold text-text-secondary">
            <span>Total EPC Volume</span>
            <span className="p-2 rounded-xl bg-primary/10 text-primary">
              <FaRupeeSign />
            </span>
          </div>
          <div className="mt-2">
            <h3 className="text-2xl font-black text-text-primary dark:text-white">
              {formatCurrency(stats.total_volume)}
            </h3>
            <p className="text-[11px] text-text-muted mt-0.5">
              Across {stats.total_orders} total EPC orders
            </p>
          </div>
          <div className="mt-3 pt-2 border-t border-border/60 flex items-center justify-between text-[11px]">
            <span className="text-text-secondary">Direct: {stats.direct_count}</span>
            <span className="text-text-secondary">Onboarded: {stats.onboarded_count}</span>
          </div>
        </div>

        {/* Online Orders (ICICI VAN) */}
        <div
          onClick={() => {
            setActiveTab("online");
            setPage(1);
          }}
          className="bg-surface p-5 rounded-2xl border border-border shadow-sm flex flex-col justify-between cursor-pointer hover:border-[#264baa] transition group"
        >
          <div className="flex items-center justify-between text-xs font-semibold text-text-secondary">
            <span className="group-hover:text-[#264baa] transition">Online (ICICI VAN)</span>
            <span className="p-2 rounded-xl bg-[#264baa]/10 text-[#264baa]">
              <MdOutlineVerifiedUser />
            </span>
          </div>
          <div className="mt-2">
            <h3 className="text-2xl font-black text-[#264baa] dark:text-blue-300">
              {formatCurrency(stats.online_volume)}
            </h3>
            <p className="text-[11px] text-text-muted mt-0.5">
              {stats.online_count} Auto-Confirmed Transactions
            </p>
          </div>
          <div className="mt-3 pt-2 border-t border-border/60 flex items-center justify-between text-[11px] text-[#264baa] dark:text-blue-300 font-bold">
            <span>Zero Gateway Fee</span>
            <span>Real-time SSE Active</span>
          </div>
        </div>

        {/* Offline Pending Verification Queue */}
        <div
          onClick={() => {
            setActiveTab("offline_pending");
            setPage(1);
          }}
          className={`p-5 rounded-2xl border shadow-sm flex flex-col justify-between cursor-pointer transition ${
            activeTab === "offline_pending" || stats.offline_pending_count > 0
              ? "bg-amber-500/10 border-amber-500/30 hover:border-amber-500"
              : "bg-surface border-border hover:border-primary"
          }`}
        >
          <div className="flex items-center justify-between text-xs font-semibold text-text-secondary">
            <span className="flex items-center gap-1.5 font-bold text-amber-700 dark:text-amber-300">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
              </span>
              Pending Accounts Review
            </span>
            <span className="p-2 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400">
              <MdOutlinePendingActions />
            </span>
          </div>
          <div className="mt-2">
            <h3 className="text-2xl font-black text-amber-700 dark:text-amber-300">
              {stats.offline_pending_count} Orders
            </h3>
            <p className="text-[11px] text-text-muted mt-0.5">
              {stats.offline_count} Total Offline Bank Transfers
            </p>
          </div>
          <div className="mt-3 pt-2 border-t border-border/60 flex items-center justify-between text-[11px] text-amber-700 dark:text-amber-400 font-bold">
            <span>Requires UTR / Credit Check</span>
            <span>Review Queue →</span>
          </div>
        </div>

        {/* Franchisee Commission Generated */}
        <div
          onClick={() => {
            setActiveTab("onboarded");
            setPage(1);
          }}
          className="bg-surface p-5 rounded-2xl border border-border shadow-sm flex flex-col justify-between cursor-pointer hover:border-emerald-500 transition group"
        >
          <div className="flex items-center justify-between text-xs font-semibold text-text-secondary">
            <span className="group-hover:text-emerald-600 transition">Franchisee Commissions</span>
            <span className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600">
              <FaHandshake />
            </span>
          </div>
          <div className="mt-2">
            <h3 className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
              {formatCurrency(stats.total_commissions)}
            </h3>
            <p className="text-[11px] text-text-muted mt-0.5">
              Across {stats.onboarded_count} Attributed Partner Orders
            </p>
          </div>
          <div className="mt-3 pt-2 border-t border-border/60 flex items-center justify-between text-[11px] text-emerald-600 dark:text-emerald-400 font-bold">
            <span>Settled to Franchisee Wallet</span>
            <span>View Orders →</span>
          </div>
        </div>
      </div>

      {/* ── Quick Segment Tabs ───────────────────────────────────────────────── */}
      <div className="flex items-center justify-between flex-wrap gap-2 border-b border-border pb-3">
        <div className="flex items-center gap-1.5 flex-wrap">
          {[
            { key: "all", label: "All EPC Orders", count: stats.total_orders },
            {
              key: "offline_pending",
              label: "Pending Offline Verification",
              count: stats.offline_pending_count,
              highlight: stats.offline_pending_count > 0,
            },
            { key: "online", label: "Online (ICICI VAN)", count: stats.online_count },
            { key: "direct", label: "Direct EPC", count: stats.direct_count },
            { key: "onboarded", label: "Onboarded Franchisee", count: stats.onboarded_count },
          ].map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => {
                setActiveTab(tab.key);
                setPage(1);
              }}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                activeTab === tab.key
                  ? tab.highlight
                    ? "bg-amber-600 text-white shadow-md shadow-amber-600/30"
                    : "bg-primary text-white shadow-md shadow-primary/30"
                  : tab.highlight
                  ? "bg-amber-500/15 text-amber-700 dark:text-amber-300 hover:bg-amber-500/25"
                  : "bg-surface text-text-secondary hover:text-text-primary hover:bg-surface-hover border border-border"
              }`}
            >
              <span>{tab.label}</span>
              {tab.count != null && (
                <span
                  className={`px-1.5 py-0.5 rounded-full text-[10px] font-black ${
                    activeTab === tab.key
                      ? "bg-white/20 text-white"
                      : tab.highlight
                      ? "bg-amber-500 text-white animate-pulse"
                      : "bg-surface-hover text-text-muted"
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {activeFiltersCount > 0 && (
          <button
            type="button"
            onClick={handleResetFilters}
            className="text-xs text-rose-500 hover:text-rose-600 font-bold flex items-center gap-1 transition"
          >
            <FiX /> Reset All Filters ({activeFiltersCount})
          </button>
        )}
      </div>

      {/* ── Expandable Filter Bar ────────────────────────────────────────────── */}
      {showFilters && (
        <div className="bg-surface p-5 rounded-2xl border border-border shadow-sm space-y-4 animate-in fade-in duration-200">
          <div className="flex items-center justify-between border-b border-border pb-2.5">
            <span className="text-xs font-black uppercase tracking-wider text-text-secondary flex items-center gap-2">
              <FiFilter className="text-primary" /> Advanced Filters
            </span>
            <button
              type="button"
              onClick={() => setShowFilters(false)}
              className="text-text-muted hover:text-text-primary text-xs"
            >
              Close
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 text-xs">
            {/* Payment Mode */}
            <div>
              <label className="block font-bold text-text-secondary mb-1">Payment Mode</label>
              <select
                value={paymentModeFilter}
                onChange={(e) => {
                  setPaymentModeFilter(e.target.value);
                  setPage(1);
                }}
                className="w-full p-2.5 bg-surface-hover border border-border rounded-xl text-text-primary font-medium focus:ring-2 focus:ring-primary focus:outline-none"
              >
                <option value="all">All Modes</option>
                <option value="online">Online (ICICI VAN)</option>
                <option value="offline">Offline Bank Transfer</option>
              </select>
            </div>

            {/* Accounts Verification Status */}
            <div>
              <label className="block font-bold text-text-secondary mb-1">Accounts Verification</label>
              <select
                value={verificationStatusFilter}
                onChange={(e) => {
                  setVerificationStatusFilter(e.target.value);
                  setPage(1);
                }}
                className="w-full p-2.5 bg-surface-hover border border-border rounded-xl text-text-primary font-medium focus:ring-2 focus:ring-primary focus:outline-none"
              >
                <option value="all">All Statuses</option>
                <option value="pending">Pending Accounts Review</option>
                <option value="approved">Accounts Verified</option>
                <option value="rejected">Rejected by Accounts</option>
              </select>
            </div>

            {/* Admin Approval Status */}
            <div>
              <label className="block font-bold text-text-secondary mb-1">Admin Approval</label>
              <select
                value={adminApprovalStatusFilter}
                onChange={(e) => {
                  setAdminApprovalStatusFilter(e.target.value);
                  setPage(1);
                }}
                className="w-full p-2.5 bg-surface-hover border border-border rounded-xl text-text-primary font-medium focus:ring-2 focus:ring-primary focus:outline-none"
              >
                <option value="all">All Statuses</option>
                <option value="pending">Pending Admin Approval</option>
                <option value="approved">Admin Approved</option>
                <option value="rejected">Admin Rejected</option>
              </select>
            </div>

            {/* Channel / Attribution */}
            <div>
              <label className="block font-bold text-text-secondary mb-1">Order Channel</label>
              <select
                value={channelFilter}
                onChange={(e) => {
                  setChannelFilter(e.target.value);
                  setPage(1);
                }}
                className="w-full p-2.5 bg-surface-hover border border-border rounded-xl text-text-primary font-medium focus:ring-2 focus:ring-primary focus:outline-none"
              >
                <option value="all">All Channels</option>
                <option value="direct">Direct EPC (Company Direct)</option>
                <option value="onboarded">Onboarded Franchisee</option>
              </select>
            </div>

            {/* Order Lifecycle Status */}
            <div>
              <label className="block font-bold text-text-secondary mb-1">Lifecycle Stage</label>
              <select
                value={orderStatusFilter}
                onChange={(e) => {
                  setOrderStatusFilter(e.target.value);
                  setPage(1);
                }}
                className="w-full p-2.5 bg-surface-hover border border-border rounded-xl text-text-primary font-medium focus:ring-2 focus:ring-primary focus:outline-none"
              >
                <option value="all">All Stages</option>
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="procurement">Procurement</option>
                <option value="vehicle_assigned">Vehicle Assigned</option>
                <option value="dispatched">Dispatched</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            {/* Payment Settlement Status */}
            <div>
              <label className="block font-bold text-text-secondary mb-1">Payment Status</label>
              <select
                value={paymentStatusFilter}
                onChange={(e) => {
                  setPaymentStatusFilter(e.target.value);
                  setPage(1);
                }}
                className="w-full p-2.5 bg-surface-hover border border-border rounded-xl text-text-primary font-medium focus:ring-2 focus:ring-primary focus:outline-none"
              >
                <option value="all">All Payment Statuses</option>
                <option value="paid">Paid / Captured</option>
                <option value="pending">Pending</option>
                <option value="failed">Failed / Rejected</option>
                <option value="refunded">Refunded</option>
              </select>
            </div>

            {/* Date Preset */}
            <div>
              <label className="block font-bold text-text-secondary mb-1">Date Range</label>
              <select
                value={datePreset}
                onChange={(e) => {
                  setDatePreset(e.target.value);
                  setPage(1);
                }}
                className="w-full p-2.5 bg-surface-hover border border-border rounded-xl text-text-primary font-medium focus:ring-2 focus:ring-primary focus:outline-none"
              >
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="yesterday">Yesterday</option>
                <option value="last_7_days">Last 7 Days</option>
                <option value="last_30_days">Last 30 Days</option>
                <option value="this_month">This Month</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* ── Search Bar ───────────────────────────────────────────────────────── */}
      <form onSubmit={handleSearchSubmit} className="flex gap-2">
        <div className="relative flex-1">
          <MdSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted text-lg" />
          <input
            type="text"
            placeholder="Search by Order No, UTR Reference, EPC Contractor name, phone, or Franchisee..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-surface border border-border rounded-xl text-xs text-text-primary focus:outline-none focus:ring-2 focus:ring-primary shadow-sm"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery("");
                setPage(1);
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary"
            >
              <MdClose />
            </button>
          )}
        </div>
        <Button type="submit" variant="primary" size="sm" className="px-5 font-bold">
          Search
        </Button>
      </form>

      {/* ── Unified Orders Table ─────────────────────────────────────────────── */}
      <div className="bg-surface rounded-2xl border border-border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-surface-hover/70 border-b border-border text-text-secondary font-black uppercase text-[10px] tracking-wider">
                <th className="py-3 px-4">Order / Channel</th>
                <th className="py-3 px-4">EPC Buyer Details</th>
                <th className="py-3 px-4">Attributed Franchisee</th>
                <th className="py-3 px-4">Equipment Summary</th>
                <th className="py-3 px-4">Total Amount</th>
                <th className="py-3 px-4">Payment Method</th>
                <th className="py-3 px-4">Verification & Approval</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-text-muted">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                      <p className="text-xs font-semibold">Loading EPC orders & payment records...</p>
                    </div>
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-text-muted">
                    <div className="flex flex-col items-center justify-center gap-1.5">
                      <MdShoppingCart className="text-3xl text-text-muted/60" />
                      <p className="text-sm font-bold text-text-primary">No EPC Orders Found</p>
                      <p className="text-xs text-text-secondary">
                        Try adjusting your filters, search keyword, or active tab.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                orders.map((o) => {
                  const isOnline = o.is_online;
                  const isDirect = o.is_direct;
                  const offStatus = o.offline_payment?.verification_status || "pending";
                  const admStatus = o.offline_payment?.admin_approval_status || "pending";
                  const utr = o.offline_payment?.utr_number || o.payment_reference;
                  const receiptUrl = o.offline_payment?.receipt_url;

                  return (
                    <tr
                      key={o._id || o.id}
                      className="hover:bg-surface-hover/50 transition-colors"
                    >
                      {/* Order / Channel */}
                      <td className="py-3.5 px-4">
                        <div className="font-mono font-bold text-text-primary dark:text-white">
                          {o.order_number}
                        </div>
                        <div className="flex items-center gap-1.5 mt-1">
                          <span
                            className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md ${
                              isDirect
                                ? "bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20"
                                : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                            }`}
                          >
                            {isDirect ? "Direct EPC" : "Onboarded Partner"}
                          </span>
                        </div>
                        <div className="text-[10px] text-text-muted mt-0.5">
                          {formatDate(o.created_at)}
                        </div>
                      </td>

                      {/* EPC Buyer Details */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-text-primary dark:text-white">
                          {o.buyer_name}
                        </div>
                        <div className="text-[11px] text-text-muted">{o.buyer_phone}</div>
                        <div className="text-[10px] text-text-secondary flex items-center gap-0.5 mt-0.5">
                          <MdLocationOn className="text-primary shrink-0" />
                          <span>{o.buyer_district}, {o.buyer_state}</span>
                        </div>
                      </td>

                      {/* Attributed Franchisee */}
                      <td className="py-3.5 px-4">
                        {isDirect ? (
                          <span className="text-[11px] text-text-muted italic">
                            None (Direct Company)
                          </span>
                        ) : (
                          <div>
                            <div className="font-bold text-text-primary dark:text-white">
                              {o.franchisee_name}
                            </div>
                            <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold mt-0.5">
                              Margin: {formatCurrency(o.commission_amount)}
                            </div>
                          </div>
                        )}
                      </td>

                      {/* Equipment Summary */}
                      <td className="py-3.5 px-4">
                        <div className="max-w-[190px]">
                          {(o.items || []).slice(0, 2).map((it, idx) => (
                            <div key={idx} className="truncate text-text-primary">
                              • {it.item_name} <span className="text-text-muted">x{it.quantity}</span>
                            </div>
                          ))}
                          {(o.items || []).length > 2 && (
                            <span className="text-[10px] text-primary font-bold">
                              +{(o.items || []).length - 2} more items
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Total Amount */}
                      <td className="py-3.5 px-4">
                        <div className="font-black text-sm text-text-primary dark:text-white">
                          {formatCurrency(o.grand_total)}
                        </div>
                        {o.offline_payment?.amount_paid > 0 && !isOnline && (
                          <div className="text-[10px] text-text-muted">
                            Paid: {formatCurrency(o.offline_payment.amount_paid)}
                          </div>
                        )}
                      </td>

                      {/* Payment Method */}
                      <td className="py-3.5 px-4">
                        {isOnline ? (
                          <div className="space-y-1">
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-[#264baa]/15 text-[#264baa] dark:text-blue-300 border border-[#264baa]/30">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#264baa] animate-pulse"></span>
                              ICICI VAN (Online)
                            </span>
                            <div className="text-[10px] text-text-muted font-mono">
                              VAN: {o.payment_reference || "Virtual Account"}
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-1">
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                              Bank Transfer (Offline)
                            </span>
                            {utr && (
                              <div className="flex items-center gap-1 text-[11px] font-mono text-text-primary">
                                <span className="truncate max-w-[110px]" title={utr}>
                                  UTR: {utr}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleCopyUtr(utr)}
                                  className="text-text-muted hover:text-primary transition"
                                  title="Copy UTR"
                                >
                                  {copiedUtr === utr ? <FaCheck className="text-emerald-500" /> : <FaRegCopy />}
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Verification & Approval */}
                      <td className="py-3.5 px-4">
                        {isOnline ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-black bg-emerald-500/15 text-emerald-700 dark:text-emerald-300">
                            <FiCheckCircle size={12} /> Auto-Verified & Confirmed
                          </span>
                        ) : (
                          <div className="space-y-1">
                            {/* Accounts Verification Stage */}
                            <div className="flex items-center gap-1">
                              <span className="text-[10px] text-text-muted">Accounts:</span>
                              {offStatus === "approved" ? (
                                <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300">
                                  <FiCheckCircle size={10} /> Verified
                                </span>
                              ) : offStatus === "rejected" ? (
                                <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/15 text-rose-700 dark:text-rose-300">
                                  <FiXCircle size={10} /> Rejected
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/15 text-amber-700 dark:text-amber-300 animate-pulse">
                                  <FiClock size={10} /> Pending
                                </span>
                              )}
                            </div>

                            {/* Admin Approval Stage */}
                            <div className="flex items-center gap-1">
                              <span className="text-[10px] text-text-muted">Admin:</span>
                              {admStatus === "approved" ? (
                                <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300">
                                  <FiCheckCircle size={10} /> Approved
                                </span>
                              ) : admStatus === "rejected" ? (
                                <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/15 text-rose-700 dark:text-rose-300">
                                  <FiXCircle size={10} /> Rejected
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded text-[10px] font-medium bg-slate-500/10 text-text-muted">
                                  {offStatus === "approved" ? "Awaiting Admin" : "Waiting Accts"}
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center justify-center gap-1.5 flex-wrap">
                          {/* Review & Verify Offline Payment Button */}
                          {!isOnline && (
                            <button
                              type="button"
                              onClick={() => {
                                if (receiptUrl) setSelectedReceipt(receiptUrl);
                                handleOpenActionModal(o, "approved");
                              }}
                              className={`p-2 rounded-xl text-xs font-bold transition flex items-center gap-1 ${
                                offStatus === "pending"
                                  ? "bg-amber-500 hover:bg-amber-600 text-white shadow-sm shadow-amber-500/30"
                                  : "bg-surface-hover hover:bg-surface border border-border text-text-secondary"
                              }`}
                              title="Review Receipt & Verify Payment"
                            >
                              <FiUploadCloud size={13} />
                              <span>{offStatus === "pending" ? "Verify" : "Review"}</span>
                            </button>
                          )}

                          {/* View Receipt Link if present */}
                          {!isOnline && receiptUrl && (
                            <button
                              type="button"
                              onClick={() => setSelectedReceipt(receiptUrl)}
                              className="p-2 rounded-xl bg-surface-hover hover:bg-surface border border-border text-text-secondary hover:text-primary transition"
                              title="View Payment Receipt Proof"
                            >
                              <FiFileText size={14} />
                            </button>
                          )}

                          {/* View Full Details Drawer */}
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedTxn(o);
                              setIsDrawerOpen(true);
                            }}
                            className="p-2 rounded-xl bg-surface-hover hover:bg-surface border border-border text-text-secondary hover:text-primary transition"
                            title="View Transaction Details"
                          >
                            <MdVisibility size={14} />
                          </button>

                          {/* 8-Stage Fulfillment Journey Modal */}
                          <button
                            type="button"
                            onClick={() => setJourneyOrder(o)}
                            className="p-2 rounded-xl bg-surface-hover hover:bg-surface border border-border text-text-secondary hover:text-primary transition"
                            title="8-Stage Order Lifecycle Tracker"
                          >
                            <FaTruckMoving size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* ── Pagination ───────────────────────────────────────────────────────── */}
        <div className="p-4 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-text-muted">
          <span>
            Showing {orders.length} of {total} orders (Page {page} of {totalPages})
          </span>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1 || loading}
              className="px-3 py-1.5 rounded-lg border border-border bg-surface-hover disabled:opacity-40 transition font-bold"
            >
              Previous
            </button>
            <span className="font-mono px-2 text-text-primary font-bold">
              {page} / {totalPages}
            </span>
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages || loading}
              className="px-3 py-1.5 rounded-lg border border-border bg-surface-hover disabled:opacity-40 transition font-bold"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* ── Transaction Details Side Drawer ─────────────────────────────────── */}
      <TransactionDetailsDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        transaction={selectedTxn}
        onStatusUpdated={fetchOrders}
      />

      {/* ── 8-Stage Fulfillment Journey Modal ──────────────────────────────── */}
      {journeyOrder && (
        <Product8StageJourneyModal
          isOpen={!!journeyOrder}
          onClose={() => setJourneyOrder(null)}
          order={journeyOrder}
          orderType="direct_epc"
          onStageUpdated={fetchOrders}
        />
      )}

      {/* ── Receipt Full Preview Modal ─────────────────────────────────────── */}
      {selectedReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 animate-in fade-in duration-200">
          <div className="bg-surface rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden shadow-2xl border border-border">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <span className="text-sm font-black text-text-primary dark:text-white flex items-center gap-2">
                <FiFileText className="text-primary" /> Payment Transfer Receipt Proof
              </span>
              <div className="flex items-center gap-2">
                <a
                  href={selectedReceipt}
                  target="_blank"
                  rel="noreferrer"
                  className="p-1.5 rounded-lg text-text-secondary hover:text-primary transition"
                  title="Open original in new tab"
                >
                  <FiExternalLink />
                </a>
                <button
                  type="button"
                  onClick={() => setSelectedReceipt(null)}
                  className="p-1.5 rounded-lg text-text-secondary hover:text-rose-600 transition"
                >
                  <FiX className="text-lg" />
                </button>
              </div>
            </div>
            <div className="p-4 overflow-y-auto flex-1 flex items-center justify-center bg-surface-hover/30">
              {selectedReceipt.toLowerCase().endsWith(".pdf") ? (
                <iframe
                  src={selectedReceipt}
                  title="Receipt PDF"
                  className="w-full h-[65vh] rounded-lg border border-border"
                />
              ) : (
                <img
                  src={selectedReceipt}
                  alt="Receipt Preview"
                  className="max-h-[70vh] max-w-full object-contain rounded-xl shadow-md"
                />
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Verification Action Dialog (Verify / Reject) ────────────────────── */}
      {actionModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 animate-in fade-in duration-200">
          <div className="bg-surface rounded-2xl max-w-md w-full p-6 shadow-2xl border border-border space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {actionModal.decision === "approved" ? (
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/15 flex items-center justify-center text-emerald-600">
                    <FiCheckCircle className="text-xl" />
                  </div>
                ) : (
                  <div className="w-10 h-10 rounded-xl bg-rose-500/15 flex items-center justify-center text-rose-600">
                    <FiXCircle className="text-xl" />
                  </div>
                )}
                <div>
                  <h3 className="text-base font-bold text-text-primary dark:text-white">
                    {actionModal.decision === "approved"
                      ? "Verify Offline Payment"
                      : "Reject Offline Payment Proof"}
                  </h3>
                  <p className="text-[11px] text-text-muted">
                    Order #{actionModal.order?.order_number}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleCloseActionModal}
                className="text-text-muted hover:text-text-primary"
              >
                <FiX className="text-lg" />
              </button>
            </div>

            <div className="p-3.5 rounded-xl bg-surface-hover border border-border text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-text-muted">EPC Buyer:</span>
                <span className="font-bold text-text-primary">
                  {actionModal.order?.buyer_name || actionModal.order?.customer_name}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted">Amount Paid:</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                  {formatCurrency(actionModal.order?.offline_payment?.amount_paid || actionModal.order?.grand_total)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted">UTR Reference:</span>
                <span className="font-mono font-bold text-text-primary">
                  {actionModal.order?.offline_payment?.utr_number || actionModal.order?.payment_reference || "N/A"}
                </span>
              </div>
              {actionModal.order?.offline_payment?.sender_bank_name && (
                <div className="flex justify-between">
                  <span className="text-text-muted">Bank:</span>
                  <span className="font-medium text-text-primary">
                    {actionModal.order?.offline_payment?.sender_bank_name}
                  </span>
                </div>
              )}
            </div>

            {/* Toggle Decision (Approve vs Reject) */}
            <div className="flex rounded-xl bg-surface-hover p-1">
              <button
                type="button"
                onClick={() => setActionModal({ ...actionModal, decision: "approved" })}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition ${
                  actionModal.decision === "approved"
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "text-text-secondary hover:text-text-primary"
                }`}
              >
                ✓ Verify & Forward to Admin
              </button>
              <button
                type="button"
                onClick={() => setActionModal({ ...actionModal, decision: "rejected" })}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition ${
                  actionModal.decision === "rejected"
                    ? "bg-rose-600 text-white shadow-sm"
                    : "text-text-secondary hover:text-text-primary"
                }`}
              >
                ✕ Reject Payment
              </button>
            </div>

            {actionModal.decision === "approved" ? (
              <p className="text-xs text-text-secondary leading-relaxed">
                Confirming verification verifies that the bank statement has credited this amount. The order will be forwarded to the <strong>Admin Offline Approval Queue</strong> for final release into procurement & warehouse fulfillment.
              </p>
            ) : (
              <p className="text-xs text-rose-600 dark:text-rose-400 leading-relaxed">
                Please provide the exact reason for rejecting this payment proof (e.g. UTR not found in bank statement, amount mismatch).
              </p>
            )}

            <div>
              <label className="block text-xs font-bold text-text-primary mb-1">
                {actionModal.decision === "approved" ? "Verification Notes (Optional):" : "Rejection Reason *:"}
              </label>
              <textarea
                rows={3}
                placeholder={
                  actionModal.decision === "approved"
                    ? "e.g. Verified in ICICI / HDFC bank statement; funds credited."
                    : "e.g. UTR number invalid; transfer screenshot not visible."
                }
                value={actionModal.decision === "approved" ? actionModal.notes : actionModal.reason}
                onChange={(e) =>
                  actionModal.decision === "approved"
                    ? setActionModal({ ...actionModal, notes: e.target.value })
                    : setActionModal({ ...actionModal, reason: e.target.value })
                }
                className="w-full p-2.5 bg-surface-hover border border-border rounded-xl text-xs text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-border">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleCloseActionModal}
                disabled={submittingAction}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant={actionModal.decision === "approved" ? "primary" : "danger"}
                size="sm"
                onClick={handleSubmitVerification}
                loading={submittingAction}
                className="font-bold px-4"
              >
                {actionModal.decision === "approved"
                  ? "Confirm & Forward to Admin"
                  : "Submit Rejection"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
