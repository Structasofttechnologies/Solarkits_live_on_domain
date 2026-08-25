import { useState, useEffect, useCallback, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import axios from "axios";
import ReactCountryFlag from "react-country-flag";
import {
  FaFileInvoiceDollar,
  FaGlobe,
  FaMapMarkerAlt,
  FaWarehouse,
  FaClipboardList,
  FaEdit,
  FaUsers,
  FaCheckCircle,
  FaClock,
  FaTimesCircle,
  FaSearch,
  FaEye,
  FaTruck,
  FaMoneyBillWave,
  FaTimes
} from "react-icons/fa";
import { setAlert } from "@/features/alert.slice";
import Button from "@/components/Button";
import CustomTable from "@/components/CustomTable";
import Dropdown from "@/components/Dropdown";
import Loader from "@/components/Loader";
import { authHeaderObj } from "@/app/authHeader";

const API_URL = import.meta.env.VITE_API_URL;

const STATUS_BADGES = {
  DRAFT:             { label: "Draft", bg: "bg-slate-100 dark:bg-slate-800", text: "text-slate-600 dark:text-slate-300" },
  SUBMITTED:         { label: "Submitted", bg: "bg-blue-50 dark:bg-blue-900/30", text: "text-blue-600 dark:text-blue-400" },
  PENDING_APPROVAL:  { label: "Pending Approval", bg: "bg-amber-50 dark:bg-amber-900/30", text: "text-amber-600 dark:text-amber-400" },
  CHANGES_REQUESTED: { label: "Changes Requested", bg: "bg-orange-50 dark:bg-orange-900/30", text: "text-orange-600 dark:text-orange-400" },
  APPROVED:          { label: "Approved", bg: "bg-emerald-50 dark:bg-emerald-900/30", text: "text-emerald-600 dark:text-emerald-400" },
  REJECTED:          { label: "Rejected", bg: "bg-red-50 dark:bg-red-900/30", text: "text-red-600 dark:text-red-400" },
  AWAITING_PAYMENT:  { label: "Awaiting Payment", bg: "bg-indigo-50 dark:bg-indigo-900/30", text: "text-indigo-600 dark:text-indigo-400" },
  PARTIALLY_PAID:    { label: "Partially Paid", bg: "bg-teal-50 dark:bg-teal-900/30", text: "text-teal-600 dark:text-teal-400" },
  PAID:              { label: "Paid", bg: "bg-emerald-50 dark:bg-emerald-900/30", text: "text-emerald-600 dark:text-emerald-400" },
  PROCESSING:        { label: "Processing", bg: "bg-cyan-50 dark:bg-cyan-900/30", text: "text-cyan-600 dark:text-cyan-400" },
  DISPATCHED:        { label: "Dispatched", bg: "bg-purple-50 dark:bg-purple-900/30", text: "text-purple-600 dark:text-purple-400" },
  DELIVERED:         { label: "Delivered", bg: "bg-emerald-50 dark:bg-emerald-900/30", text: "text-emerald-600 dark:text-emerald-400" },
  COMPLETED:         { label: "Completed", bg: "bg-emerald-50 dark:bg-emerald-900/30", text: "text-emerald-600 dark:text-emerald-400" },
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

export default function PoOrders({ moduleUniqueId }) {
  const { countryName } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const token = useSelector((state) => state.auth.token);

  // Tab State
  const [activeTab, setActiveTab] = useState("franchisee_po"); // "franchisee_po" | "warehouse_po"

  // Franchisee PO Orders State
  const [fpoOrders, setFpoOrders] = useState([]);
  const [fpoLoading, setFpoLoading] = useState(false);
  const [fpoSearch, setFpoSearch] = useState("");
  const [fpoStatusFilter, setFpoStatusFilter] = useState("");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Payment Confirmation Modal State
  const [paymentRefInput, setPaymentRefInput] = useState("");
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  // Warehouse PO Settings State
  const [activeCountries, setActiveCountries] = useState([]);
  const [states, setStates] = useState([]);
  const [clusters, setClusters] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [settings, setSettings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stateFilter, setStateFilter] = useState("");
  const [clusterFilter, setClusterFilter] = useState("");

  // ── Fetch Franchisee PO Orders ─────────────────────────────────────────────
  const fetchFpoOrders = useCallback(async () => {
    setFpoLoading(true);
    try {
      const res = await axios.get(
        `${API_URL}/franchisee/po/list?unique_id=${moduleUniqueId || "ADM_PO_ORDERS"}&req_for=view`,
        { headers: authHeaderObj() }
      );
      if (res.data?.status === "success") {
        setFpoOrders(res.data.data || []);
      }
    } catch (err) {
      console.error("Error fetching Franchisee PO orders:", err);
    } finally {
      setFpoLoading(false);
    }
  }, [moduleUniqueId]);

  // ── Fetch Warehouse Configurations ────────────────────────────────────────
  const fetchCountriesAndSettings = async () => {
    setLoading(true);
    try {
      const [countriesRes, warehousesRes, globalRes, indiaRes] = await Promise.all([
        axios.get(
          `${API_URL}/geolocation/active-countries?unique_id=${moduleUniqueId || "ADM_PO_ORDERS"}&req_for=view`,
          { headers: authHeaderObj() }
        ),
        axios.get(
          `${API_URL}/warehouses?unique_id=${moduleUniqueId || "ADM_PO_ORDERS"}&req_for=view`,
          { headers: authHeaderObj() }
        ),
        axios.get(`${API_URL}/solarshop/po-settings?unique_id=${moduleUniqueId || "ADM_PO_ORDERS"}&req_for=view`, { headers: authHeaderObj() }).catch(() => ({ data: { data: [] } })),
        axios.get(`${API_URL}/solarshop/india/po-settings?unique_id=${moduleUniqueId || "ADM_PO_ORDERS"}&req_for=view`, { headers: authHeaderObj() }).catch(() => ({ data: { data: [] } }))
      ]);

      const activeCountriesList = countriesRes.data?.countries || [];
      setActiveCountries(activeCountriesList);

      if (activeCountriesList.length > 0) {
        const activeCountriesNames = activeCountriesList.map((c) => c.name.toLowerCase());
        if (!countryName) {
          const storedCountry = localStorage.getItem("selected_country_solar-shop");
          const defaultCountry = (storedCountry && activeCountriesNames.includes(storedCountry.toLowerCase()))
            ? storedCountry.toLowerCase()
            : activeCountriesList[0].name.toLowerCase();

          navigate(`/admin-panel/solar-shop/${defaultCountry}/po-orders`, { replace: true });
          return;
        }
      }

      const currentCountryObj = activeCountriesList.find(
        (c) => c.name.toLowerCase() === countryName?.toLowerCase()
      );

      const allWarehouses = warehousesRes.data?.warehouses || [];
      const countryWarehouses = currentCountryObj
        ? allWarehouses.filter((w) => (w.country_id || w.level_0)?.toString() === currentCountryObj.id?.toString())
        : allWarehouses;
      setWarehouses(countryWarehouses);

      const allSettings = [...(globalRes.data?.data || []), ...(indiaRes.data?.data || [])];
      setSettings(allSettings);

      if (currentCountryObj) {
        axios.post(
          `${API_URL}/geolocation/active-states?unique_id=${moduleUniqueId || "ADM_PO_ORDERS"}&req_for=view`,
          { country_id: currentCountryObj.id },
          { headers: authHeaderObj() }
        ).then((statesRes) => {
          setStates(statesRes.data?.states || []);
        }).catch((err) => console.error("Error fetching states:", err));
      }
    } catch (error) {
      console.error("Error fetching PO settings data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchFpoOrders();
      fetchCountriesAndSettings();
    }
  }, [token, countryName, fetchFpoOrders]);

  // Current Country
  const currentCountry = activeCountries.find(
    (c) => c.name.toLowerCase() === countryName?.toLowerCase()
  );

  // ── Workflow Action Handlers ───────────────────────────────────────────────
  const handleApprovePo = async (orderId) => {
    setActionLoading(true);
    try {
      const res = await axios.put(
        `${API_URL}/franchisee/po/approve?unique_id=${moduleUniqueId || "ADM_PO_ORDERS"}&req_for=edit`,
        { order_id: orderId, auto_advance: true },
        { headers: authHeaderObj() }
      );
      if (res.data?.status === "success") {
        dispatch(setAlert({ type: "success", message: "Purchase Order approved successfully!" }));
        setSelectedOrder(null);
        fetchFpoOrders();
      }
    } catch (err) {
      dispatch(setAlert({ type: "error", message: err.response?.data?.message || "Failed to approve PO." }));
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectPo = async (orderId) => {
    const reason = prompt("Enter reason for rejection:");
    if (!reason) return;
    setActionLoading(true);
    try {
      const res = await axios.put(
        `${API_URL}/franchisee/po/reject?unique_id=${moduleUniqueId || "ADM_PO_ORDERS"}&req_for=edit`,
        { order_id: orderId, reason },
        { headers: authHeaderObj() }
      );
      if (res.data?.status === "success") {
        dispatch(setAlert({ type: "success", message: "Purchase Order rejected." }));
        setSelectedOrder(null);
        fetchFpoOrders();
      }
    } catch (err) {
      dispatch(setAlert({ type: "error", message: err.response?.data?.message || "Failed to reject PO." }));
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirmPayment = async (e) => {
    e.preventDefault();
    if (!selectedOrder) return;
    setActionLoading(true);
    try {
      const res = await axios.post(
        `${API_URL}/franchisee/po/confirm-payment?unique_id=${moduleUniqueId || "ADM_PO_ORDERS"}&req_for=edit`,
        {
          order_id: selectedOrder._id,
          payment_reference: paymentRefInput || `PAY-${Date.now()}`,
          payment_mode: "BANK_TRANSFER",
        },
        { headers: authHeaderObj() }
      );
      if (res.data?.status === "success") {
        dispatch(setAlert({ type: "success", message: "Payment confirmed successfully!" }));
        setShowPaymentModal(false);
        setPaymentRefInput("");
        setSelectedOrder(null);
        fetchFpoOrders();
      }
    } catch (err) {
      dispatch(setAlert({ type: "error", message: err.response?.data?.message || "Payment confirmation failed." }));
    } finally {
      setActionLoading(false);
    }
  };

  const handleDispatchPo = async (orderId) => {
    const tracking = prompt("Enter dispatch courier / tracking number:", "TRK-" + Math.floor(100000 + Math.random() * 900000));
    if (!tracking) return;
    setActionLoading(true);
    try {
      const res = await axios.put(
        `${API_URL}/franchisee/po/dispatch?unique_id=${moduleUniqueId || "ADM_PO_ORDERS"}&req_for=edit`,
        { order_id: orderId, tracking_number: tracking },
        { headers: authHeaderObj() }
      );
      if (res.data?.status === "success") {
        dispatch(setAlert({ type: "success", message: "PO Order marked as Dispatched!" }));
        setSelectedOrder(null);
        fetchFpoOrders();
      }
    } catch (err) {
      dispatch(setAlert({ type: "error", message: err.response?.data?.message || "Failed to dispatch PO." }));
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeliverPo = async (orderId) => {
    if (!confirm("Are you sure you want to mark this order as Delivered?")) return;
    setActionLoading(true);
    try {
      const res = await axios.put(
        `${API_URL}/franchisee/po/deliver?unique_id=${moduleUniqueId || "ADM_PO_ORDERS"}&req_for=edit`,
        { order_id: orderId },
        { headers: authHeaderObj() }
      );
      if (res.data?.status === "success") {
        dispatch(setAlert({ type: "success", message: "PO Order marked as Delivered!" }));
        setSelectedOrder(null);
        fetchFpoOrders();
      }
    } catch (err) {
      dispatch(setAlert({ type: "error", message: err.response?.data?.message || "Failed to mark delivered." }));
    } finally {
      setActionLoading(false);
    }
  };

  // Filtered Franchisee PO Orders
  const filteredFpoOrders = useMemo(() => {
    return fpoOrders.filter((o) => {
      if (fpoStatusFilter && o.status !== fpoStatusFilter) return false;
      if (fpoSearch) {
        const q = fpoSearch.toLowerCase();
        const num = (o.po_number || "").toLowerCase();
        const fName = (o.franchisee_id?.business_name || "").toLowerCase();
        const kitName = (o.items?.[0]?.item_name || "").toLowerCase();
        return num.includes(q) || fName.includes(q) || kitName.includes(q);
      }
      return true;
    });
  }, [fpoOrders, fpoStatusFilter, fpoSearch]);

  // Metrics for FPO
  const totalFpoCount = fpoOrders.length;
  const pendingApprovalCount = fpoOrders.filter((o) => ["SUBMITTED", "PENDING_APPROVAL"].includes(o.status)).length;
  const awaitingPaymentCount = fpoOrders.filter((o) => o.status === "AWAITING_PAYMENT").length;
  const completedFpoCount = fpoOrders.filter((o) => ["DELIVERED", "COMPLETED"].includes(o.status)).length;

  // Table Warehouse PO Settings
  const displayWarehouses = warehouses.filter((w) => {
    if (stateFilter && (w.state_id || w.level_1)?.toString() !== stateFilter?.toString()) return false;
    if (clusterFilter && (w.cluster_id || w.cluster?.id || w.cluster)?.toString() !== clusterFilter?.toString()) return false;
    return true;
  });

  const tableData = displayWarehouses.map((w) => {
    const targetId = (w.id || w._id)?.toString();
    const warehousePlans = settings.filter(
      (s) => (s.warehouse_id || s.warehouse?.id || s.warehouse?._id)?.toString() === targetId
    );
    return { warehouse: w, plans: warehousePlans };
  });

  const handleConfigurePO = (w) => {
    const targetId = w.id || w._id;
    navigate(`/admin-panel/solar-shop/${countryName?.toLowerCase()}/po-orders/${targetId}`);
  };

  return (
    <div className="space-y-6 pb-24">
      {/* ── Top Header Banner ─────────────────────────────────────────────────── */}
      <div className="relative rounded-2xl bg-gradient-to-r from-primary to-primary-end p-6 lg:p-8 text-white shadow-xl overflow-hidden">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-white/30">
              <FaFileInvoiceDollar className="text-white text-3xl" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl lg:text-3xl font-black tracking-tight">
                  Purchase Orders Workspace
                </h1>
                {currentCountry && (
                  <span className="bg-white/20 rounded-full px-3 py-0.5 text-xs font-bold uppercase border border-white/30">
                    {currentCountry.name}
                  </span>
                )}
              </div>
              <p className="text-white/90 text-xs sm:text-sm mt-1">
                Manage Franchisee Purchase Orders with EPC Buyer allocations and Warehouse PO rules.
              </p>
            </div>
          </div>

          {/* Top Primary Tabs */}
          <div className="flex items-center p-1.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20">
            <button
              onClick={() => setActiveTab("franchisee_po")}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                activeTab === "franchisee_po"
                  ? "bg-white text-primary shadow-lg"
                  : "text-white/80 hover:text-white"
              }`}
            >
              <FaUsers size={14} />
              <span>Franchisee PO Orders ({fpoOrders.length})</span>
            </button>
            <button
              onClick={() => setActiveTab("warehouse_po")}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                activeTab === "warehouse_po"
                  ? "bg-white text-primary shadow-lg"
                  : "text-white/80 hover:text-white"
              }`}
            >
              <FaWarehouse size={14} />
              <span>Warehouse PO Configurations</span>
            </button>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════════ */}
      {/* TAB 1: FRANCHISEE PURCHASE ORDERS (FPO)                                   */}
      {/* ══════════════════════════════════════════════════════════════════════════ */}
      {activeTab === "franchisee_po" && (
        <div className="space-y-6">
          {/* Top FPO Metrics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="card p-5 border-2 border-border shadow-xs flex items-center gap-4">
              <div className="p-3.5 bg-primary/10 rounded-2xl text-primary border border-primary/20">
                <FaFileInvoiceDollar size={22} />
              </div>
              <div>
                <div className="text-[10px] font-black text-text-muted uppercase tracking-wider">Total Franchisee POs</div>
                <div className="text-2xl font-black text-text-primary mt-0.5">{totalFpoCount} Orders</div>
                <div className="text-[10px] text-text-muted">All active plans</div>
              </div>
            </div>

            <div className="card p-5 border-2 border-border shadow-xs flex items-center gap-4">
              <div className="p-3.5 bg-amber-500/10 rounded-2xl text-amber-600 border border-amber-500/20">
                <FaClock size={22} />
              </div>
              <div>
                <div className="text-[10px] font-black text-text-muted uppercase tracking-wider">Pending Approval</div>
                <div className="text-2xl font-black text-text-primary mt-0.5">{pendingApprovalCount} Orders</div>
                <div className="text-[10px] text-amber-600 font-bold">Needs admin review</div>
              </div>
            </div>

            <div className="card p-5 border-2 border-border shadow-xs flex items-center gap-4">
              <div className="p-3.5 bg-indigo-500/10 rounded-2xl text-indigo-600 border border-indigo-500/20">
                <FaMoneyBillWave size={22} />
              </div>
              <div>
                <div className="text-[10px] font-black text-text-muted uppercase tracking-wider">Awaiting Payment</div>
                <div className="text-2xl font-black text-text-primary mt-0.5">{awaitingPaymentCount} Orders</div>
                <div className="text-[10px] text-indigo-600 font-bold">Accounts settlement</div>
              </div>
            </div>

            <div className="card p-5 border-2 border-border shadow-xs flex items-center gap-4">
              <div className="p-3.5 bg-success/10 rounded-2xl text-success border border-success/20">
                <FaCheckCircle size={22} />
              </div>
              <div>
                <div className="text-[10px] font-black text-text-muted uppercase tracking-wider">Completed / Delivered</div>
                <div className="text-2xl font-black text-text-primary mt-0.5">{completedFpoCount} Orders</div>
                <div className="text-[10px] text-success font-bold">Fully fulfilled</div>
              </div>
            </div>
          </div>

          {/* Search & Status Filters */}
          <div className="card p-4 border-2 border-border shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" size={14} />
              <input
                type="text"
                value={fpoSearch}
                onChange={(e) => setFpoSearch(e.target.value)}
                placeholder="Search by PO number, Franchisee, or Kit..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl text-xs font-semibold border border-border bg-surface text-text-primary"
              />
            </div>

            <div className="flex items-center gap-3">
              <select
                value={fpoStatusFilter}
                onChange={(e) => setFpoStatusFilter(e.target.value)}
                className="px-3.5 py-2.5 rounded-xl text-xs font-bold border border-border bg-surface text-text-primary cursor-pointer"
              >
                <option value="">All Workflow Statuses</option>
                <option value="SUBMITTED">Submitted</option>
                <option value="PENDING_APPROVAL">Pending Approval</option>
                <option value="APPROVED">Approved</option>
                <option value="AWAITING_PAYMENT">Awaiting Payment</option>
                <option value="PAID">Paid</option>
                <option value="PROCESSING">Processing</option>
                <option value="DISPATCHED">Dispatched</option>
                <option value="DELIVERED">Delivered</option>
              </select>

              <button
                onClick={fetchFpoOrders}
                className="px-4 py-2.5 rounded-xl bg-surface-hover hover:bg-border text-text-primary text-xs font-bold border border-border transition-all cursor-pointer"
              >
                Refresh
              </button>
            </div>
          </div>

          {/* FPO Orders Table */}
          <div className="bg-surface rounded-2xl border-2 border-border/60 shadow-sm overflow-hidden">
            {fpoLoading ? (
              <div className="py-20 flex flex-col items-center justify-center gap-3">
                <Loader text="Loading Franchisee PO Orders..." />
              </div>
            ) : filteredFpoOrders.length === 0 ? (
              <div className="p-12 text-center text-text-muted space-y-2">
                <FaFileInvoiceDollar size={32} className="mx-auto opacity-40 text-primary" />
                <p className="text-sm font-bold text-text-primary">No Franchisee Purchase Orders Found</p>
                <p className="text-xs">When franchisees place PO orders from their portal, they will appear here.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-surface-hover border-b border-border text-[11px] font-black uppercase text-text-muted">
                    <tr>
                      <th className="py-3.5 px-4">PO Number & Date</th>
                      <th className="py-3.5 px-4">Franchisee Partner</th>
                      <th className="py-3.5 px-4">Plan Badge</th>
                      <th className="py-3.5 px-4">Product & Kit</th>
                      <th className="py-3.5 px-4">EPC Allocations</th>
                      <th className="py-3.5 px-4 text-center">Total Quantity</th>
                      <th className="py-3.5 px-4">Grand Total (₹)</th>
                      <th className="py-3.5 px-4">Status</th>
                      <th className="py-3.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filteredFpoOrders.map((order) => {
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
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-primary/10 text-primary border border-primary/20">
                              {order.plan_id?.name || "Franchise Plan"}
                            </span>
                          </td>

                          <td className="py-3.5 px-4">
                            <div className="font-bold text-text-primary truncate max-w-xs">
                              {item.item_name || "Solar Kit"}
                            </div>
                          </td>

                          <td className="py-3.5 px-4">
                            {allocationsList.length > 0 ? (
                              <div className="flex flex-wrap gap-1 max-w-xs">
                                {allocationsList.map((a, i) => (
                                  <span
                                    key={i}
                                    className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-text-primary border border-border"
                                  >
                                    {a.company_name || a.buyer_name}: <strong>{a.allocated_quantity}</strong>
                                  </span>
                                ))}
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
                              Review & Actions
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
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════════ */}
      {/* TAB 2: WAREHOUSE PO CONFIGURATIONS                                        */}
      {/* ══════════════════════════════════════════════════════════════════════════ */}
      {activeTab === "warehouse_po" && (
        <div className="space-y-6">
          {/* Filtering Section */}
          <div className="bg-surface rounded-2xl border-2 border-border p-6 shadow-sm flex flex-col md:flex-row items-center gap-4">
            <div className="flex-1 w-full">
              <Dropdown
                label="Filter by State"
                value={stateFilter}
                onChange={setStateFilter}
                placeholder="All States"
                options={states.map((s) => ({ value: s.id, text: s.name }))}
              />
            </div>
            <div className="flex-1 w-full">
              <Dropdown
                label="Filter by Cluster"
                value={clusterFilter}
                onChange={setClusterFilter}
                placeholder={stateFilter ? "All Clusters" : "Select a state first..."}
                disabled={!stateFilter}
                options={clusters.map((c) => ({ value: c.id, text: c.name }))}
              />
            </div>
            {(stateFilter || clusterFilter) && (
              <Button
                variant="secondary"
                onClick={() => {
                  setStateFilter("");
                  setClusterFilter("");
                }}
                className="mt-6 md:mt-0 rounded-xl"
              >
                Clear Filters
              </Button>
            )}
          </div>

          {/* Warehouse Table */}
          <div className="bg-surface rounded-2xl border-2 border-border/60 shadow-sm overflow-hidden flex flex-col min-h-[400px]">
            <div className="px-6 py-4 bg-surface-hover/30 border-b border-border flex items-center justify-between">
              <h2 className="text-xs font-black text-text-primary flex items-center gap-3 uppercase tracking-[0.2em]">
                <div className="p-2.5 bg-primary/10 rounded-xl text-primary border border-primary/10">
                  <FaWarehouse size={14} />
                </div>
                {currentCountry ? currentCountry.name : ""} Warehouses List
              </h2>
              <span className="text-[10px] font-black text-text-muted uppercase tracking-widest bg-surface-hover px-3 py-1.5 rounded-lg border border-border/40">
                {displayWarehouses.length} Warehouses Listed
              </span>
            </div>

            <div className="flex-1 p-6">
              <CustomTable
                headers={[
                  { key: "warehouse_code", label: "Warehouse" },
                  { key: "address", label: "Address" },
                  { key: "location", label: "State & Cluster" },
                  { key: "plans_count", label: "Active Plans" },
                  { key: "actions", label: "Actions", align: "right" },
                ]}
                data={tableData}
                loading={loading}
                emptyMessage="No warehouses identified matching filters."
                containerClassName="border-none shadow-none rounded-none bg-transparent"
                renderRow={({ warehouse, plans }) => {
                  return (
                    <>
                      <td className="px-6 py-4 font-black text-text-primary tracking-tight text-sm">
                        <div className="flex items-center gap-2">
                          <FaWarehouse className="text-primary opacity-60 shrink-0" size={14} />
                          <span>{warehouse.warehouse_code || "N/A"}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-xs font-semibold text-text-secondary truncate max-w-xs">
                        {warehouse.address || "N/A"}
                      </td>
                      <td className="px-6 py-4 text-xs font-bold text-text-secondary">
                        <span className="flex items-center gap-1">
                          <FaMapMarkerAlt className="text-primary/50 text-[10px]" /> {warehouse.state || "N/A"}
                        </span>
                        <span className="text-text-muted text-[10px]">Cluster: {warehouse.cluster || "N/A"}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black ${
                            plans.length > 0
                              ? "bg-success/10 text-success border border-success/20"
                              : "bg-danger/10 text-danger border border-danger/20"
                          }`}
                        >
                          {plans.length} Configured
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Button
                          onClick={() => handleConfigurePO(warehouse)}
                          size="sm"
                          leftIcon={<FaEdit />}
                          className="rounded-lg text-[10px] font-bold uppercase tracking-wider py-1.5"
                        >
                          Configure PO Settings
                        </Button>
                      </td>
                    </>
                  );
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* ── ADMIN / ACCOUNTS ORDER REVIEW & ACTION MODAL ────────────────────── */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="relative w-full max-w-2xl max-h-[90vh] flex flex-col rounded-3xl bg-surface border border-border shadow-2xl overflow-hidden z-10">
            <div className="p-6 border-b border-border flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-black text-text-primary">
                    Franchisee PO Order: {selectedOrder.po_number}
                  </h2>
                  <StatusBadge status={selectedOrder.status} />
                </div>
                <p className="text-xs text-text-muted mt-0.5">
                  Partner: <strong className="text-text-primary">{selectedOrder.franchisee_id?.business_name || "Franchisee"}</strong> • Plan: <strong className="text-primary">{selectedOrder.plan_id?.name || "Standard Plan"}</strong>
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
                  Ordered Solar Kit
                </h4>
                <div className="p-3.5 rounded-xl bg-surface-hover border border-border flex items-center justify-between">
                  <div>
                    <div className="font-bold text-sm text-text-primary">
                      {selectedOrder.items?.[0]?.item_name || "Solar Kit"}
                    </div>
                    <div className="text-[10px] text-text-muted">
                      Total Units: <strong className="text-text-primary">{selectedOrder.total_quantity || selectedOrder.items?.[0]?.quantity || 0} Kits</strong>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] text-text-muted">Grand Total Payable</div>
                    <div className="text-base font-black text-primary">
                      ₹{((selectedOrder.grand_total_paise || 0) / 100).toLocaleString("en-IN")}
                    </div>
                  </div>
                </div>
              </div>

              {/* EPC Allocations Table */}
              <div className="space-y-2">
                <h4 className="font-bold text-text-primary uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                  <FaUsers size={12} className="text-primary" /> EPC Buyer Quantity Breakdown
                </h4>
                <div className="border border-border rounded-xl overflow-hidden">
                  <table className="w-full text-left">
                    <thead className="bg-surface-hover border-b border-border text-[10px] font-black uppercase text-text-muted">
                      <tr>
                        <th className="py-2.5 px-3">EPC Buyer Company</th>
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

              {/* Workflow Action Buttons */}
              <div className="pt-4 border-t border-border space-y-3">
                <h4 className="font-bold text-text-primary uppercase tracking-wider text-[11px]">
                  Workflow Actions
                </h4>
                <div className="flex flex-wrap items-center gap-2.5">
                  {/* Approve / Reject */}
                  {["SUBMITTED", "PENDING_APPROVAL"].includes(selectedOrder.status) && (
                    <>
                      <button
                        onClick={() => handleApprovePo(selectedOrder._id)}
                        disabled={actionLoading}
                        className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs cursor-pointer shadow-xs"
                      >
                        ✓ Approve Purchase Order
                      </button>
                      <button
                        onClick={() => handleRejectPo(selectedOrder._id)}
                        disabled={actionLoading}
                        className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs cursor-pointer shadow-xs"
                      >
                        ✕ Reject PO
                      </button>
                    </>
                  )}

                  {/* Payment Confirmation */}
                  {["APPROVED", "AWAITING_PAYMENT"].includes(selectedOrder.status) && (
                    <button
                      onClick={() => setShowPaymentModal(true)}
                      disabled={actionLoading}
                      className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs cursor-pointer shadow-xs flex items-center gap-1.5"
                    >
                      <FaMoneyBillWave size={12} /> Confirm Accounts Payment
                    </button>
                  )}

                  {/* Dispatch */}
                  {["PAID", "STOCK_ALLOCATED", "PROCESSING"].includes(selectedOrder.status) && (
                    <button
                      onClick={() => handleDispatchPo(selectedOrder._id)}
                      disabled={actionLoading}
                      className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs cursor-pointer shadow-xs flex items-center gap-1.5"
                    >
                      <FaTruck size={12} /> Mark as Dispatched
                    </button>
                  )}

                  {/* Deliver */}
                  {selectedOrder.status === "DISPATCHED" && (
                    <button
                      onClick={() => handleDeliverPo(selectedOrder._id)}
                      disabled={actionLoading}
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs cursor-pointer shadow-xs flex items-center gap-1.5"
                    >
                      <FaCheckCircle size={12} /> Mark Delivered
                    </button>
                  )}
                </div>
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
              <FaMoneyBillWave className="text-emerald-600" /> Confirm Accounts Payment
            </h3>
            <p className="text-xs text-text-muted">
              Verify receipt of payment for PO <strong>{selectedOrder.po_number}</strong> (Amount: <strong>₹{((selectedOrder.grand_total_paise || 0) / 100).toLocaleString("en-IN")}</strong>).
            </p>

            <form onSubmit={handleConfirmPayment} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-text-muted uppercase mb-1">
                  Bank / UTR Reference Number
                </label>
                <input
                  type="text"
                  required
                  value={paymentRefInput}
                  onChange={(e) => setPaymentRefInput(e.target.value)}
                  placeholder="e.g. UTR-2026-998811"
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
                  className="px-4 py-2 rounded-xl text-xs font-black bg-primary text-white hover:opacity-90 cursor-pointer"
                >
                  Confirm Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
