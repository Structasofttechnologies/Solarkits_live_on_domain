import { useState, useEffect, useCallback, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import axios from "axios";
import ReactCountryFlag from "react-country-flag";
import {
  FaBoxes,
  FaGlobe,
  FaMapMarkerAlt,
  FaWarehouse,
  FaClipboardList,
  FaEdit,
  FaSlidersH,
  FaBoxOpen,
  FaUsers,
  FaSearch,
  FaEye,
  FaCheckCircle,
  FaClock,
  FaTimesCircle,
  FaTruck,
  FaMoneyBillWave,
  FaTimes,
  FaSyncAlt,
  FaBuilding,
  FaStore,
  FaReceipt,
  FaCheck
} from "react-icons/fa";
import { setAlert } from "@/features/alert.slice";
import Button from "@/components/Button";
import CustomTable from "@/components/CustomTable";
import Dropdown from "@/components/Dropdown";
import Loader from "@/components/Loader";
import { authHeaderObj } from "@/app/authHeader";

const API_URL = import.meta.env.VITE_API_URL;

function fmtINR(val) {
  return `₹${Number(val || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// delivery_address can be a plain string OR a structured object from the API
function fmtAddress(addr) {
  if (!addr) return null;
  if (typeof addr === "string") return addr;
  if (typeof addr === "object") {
    const parts = [
      addr.line,
      addr.district_name,
      addr.state_name,
      addr.pincode,
    ].filter(Boolean);
    return parts.length ? parts.join(", ") : "Franchise Regional Hub";
  }
  return String(addr);
}

const STATUS_BADGES = {
  PENDING:             { label: "Pending", bg: "#fffbeb", text: "#b45309", border: "#fde68a" },
  SUBMITTED:           { label: "Submitted", bg: "#eff6ff", text: "#1d4ed8", border: "#93c5fd" },
  CONFIRMED:           { label: "Confirmed", bg: "#f0fdf4", text: "#15803d", border: "#86efac" },
  PROCESSING:          { label: "Processing", bg: "#ecfeff", text: "#0e7490", border: "#a5f3fc" },
  DISPATCHED:          { label: "Dispatched", bg: "#f3e8ff", text: "#7e22ce", border: "#d8b4fe" },
  DELIVERED:           { label: "Delivered", bg: "#f0fdf4", text: "#15803d", border: "#86efac" },
  COMPLETED:           { label: "Completed", bg: "#f0fdf4", text: "#15803d", border: "#86efac" },
  CANCELLED:           { label: "Cancelled", bg: "#fff1f2", text: "#be123c", border: "#fecdd3" },
};

const PAYMENT_BADGES = {
  PAID:                 { label: "Paid", bg: "#ecfdf5", text: "#047857", border: "#a7f3d0" },
  VERIFIED:             { label: "Verified", bg: "#ecfdf5", text: "#047857", border: "#a7f3d0" },
  VERIFICATION_PENDING: { label: "Verify Pending", bg: "#eff6ff", text: "#1d4ed8", border: "#93c5fd" },
  PENDING:              { label: "Pending", bg: "#fffbeb", text: "#b45309", border: "#fde68a" },
  FAILED:               { label: "Failed", bg: "#fef2f2", text: "#b91c1c", border: "#fca5a5" },
};

function StatusBadge({ status }) {
  const norm = String(status || "SUBMITTED").toUpperCase();
  const cfg = STATUS_BADGES[norm] || { label: norm, bg: "#eff6ff", text: "#1d4ed8", border: "#93c5fd" };
  return (
    <span
      className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-black whitespace-nowrap shadow-xs"
      style={{ backgroundColor: cfg.bg, color: cfg.text, border: `1px solid ${cfg.border}` }}
    >
      {cfg.label}
    </span>
  );
}

function PaymentBadge({ status }) {
  const norm = String(status || "PENDING").toUpperCase();
  const cfg = PAYMENT_BADGES[norm] || { label: norm, bg: "#fffbeb", text: "#b45309", border: "#fde68a" };
  return (
    <span
      className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold whitespace-nowrap shadow-xs"
      style={{ backgroundColor: cfg.bg, color: cfg.text, border: `1px solid ${cfg.border}` }}
    >
      {cfg.label}
    </span>
  );
}

export default function LooseOrders({ moduleUniqueId = "ADM_LOOSE_ORDERS" }) {
  const { countryName } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const token = useSelector((state) => state.auth.token);

  // Top Primary Tab: "franchisee_loose" | "warehouse_loose"
  const [activeTab, setActiveTab] = useState("franchisee_loose");

  // ── Franchisee Loose Orders State ──────────────────────────────────────────
  const [looseOrders, setLooseOrders] = useState([]);
  const [looseStats, setLooseStats] = useState(null);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [orderSearch, setOrderSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [routingFilter, setRoutingFilter] = useState("ALL");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Payment Confirmation Modal State
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentRefInput, setPaymentRefInput] = useState("");

  // ── Warehouse Loose Configurations State ───────────────────────────────────
  const [activeCountries, setActiveCountries] = useState([]);
  const [states, setStates] = useState([]);
  const [clusters, setClusters] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [settings, setSettings] = useState([]);
  const [warehouseLoading, setWarehouseLoading] = useState(true);
  const [stateFilter, setStateFilter] = useState("");
  const [clusterFilter, setClusterFilter] = useState("");

  // ── Fetch Franchisee Loose Orders ─────────────────────────────────────────
  const fetchLooseOrders = useCallback(async () => {
    setOrdersLoading(true);
    try {
      const [ordersRes, statsRes] = await Promise.all([
        axios.get(
          `${API_URL}/reseller-mgmt/orders/loose-orders?unique_id=${moduleUniqueId}&req_for=view`,
          { headers: authHeaderObj() }
        ).catch(() => ({ data: { data: [] } })),
        axios.get(
          `${API_URL}/reseller-mgmt/orders/stats?unique_id=${moduleUniqueId}&req_for=view`,
          { headers: authHeaderObj() }
        ).catch(() => ({ data: { data: null } }))
      ]);

      if (ordersRes.data?.status === "success") {
        setLooseOrders(ordersRes.data.data || []);
      }
      if (statsRes.data?.status === "success" && statsRes.data.data) {
        setLooseStats(statsRes.data.data);
      }
    } catch (err) {
      console.error("Error fetching loose orders:", err);
      dispatch(setAlert({ type: "error", message: "Failed to load Franchisee Loose Orders" }));
    } finally {
      setOrdersLoading(false);
    }
  }, [moduleUniqueId, dispatch]);

  // ── Fetch Warehouse Loose Configurations ──────────────────────────────────
  const fetchCountriesAndSettings = useCallback(async () => {
    setWarehouseLoading(true);
    try {
      const isIndiaUrl = (countryName || "india").toLowerCase() === "india" || (countryName || "").toLowerCase() === "in";
      const looseEndpoint = isIndiaUrl ? "india/loose-order-settings" : "loose-order-settings";

      const [countriesRes, warehousesRes, looseRes] = await Promise.all([
        axios.get(
          `${API_URL}/geolocation/active-countries?unique_id=${moduleUniqueId}&req_for=view`,
          { headers: authHeaderObj() }
        ),
        axios.get(
          `${API_URL}/warehouses?unique_id=${moduleUniqueId}&req_for=view`,
          { headers: authHeaderObj() }
        ),
        axios.get(`${API_URL}/solarshop/${looseEndpoint}?unique_id=${moduleUniqueId}&req_for=view`, { headers: authHeaderObj() }).catch(() => ({ data: { data: [] } }))
      ]);

      const activeCountriesList = countriesRes.data?.countries || [];
      setActiveCountries(activeCountriesList);

      if (activeCountriesList.length > 0) {
        const activeCountriesNames = activeCountriesList.map(c => c.name.toLowerCase());

        if (!countryName) {
          const storedCountry = localStorage.getItem('selected_country_solar-shop');
          const defaultCountry = (storedCountry && activeCountriesNames.includes(storedCountry.toLowerCase()))
            ? storedCountry.toLowerCase()
            : activeCountriesList[0].name.toLowerCase();

          navigate(`/admin-panel/solar-shop/${defaultCountry}/loose-orders`, { replace: true });
          return;
        } else {
          const matchedCountry = activeCountriesList.find(c => c.name.toLowerCase() === countryName.toLowerCase());
          if (!matchedCountry) {
            const defaultCountry = activeCountriesList[0].name.toLowerCase();
            navigate(`/admin-panel/solar-shop/${defaultCountry}/loose-orders`, { replace: true });
            return;
          }
        }
      }

      const currentCountryObj = activeCountriesList.find(
        c => c.name.toLowerCase() === countryName?.toLowerCase()
      );

      const allWarehouses = warehousesRes.data?.warehouses || [];
      const countryWarehouses = currentCountryObj
        ? allWarehouses.filter(w => (w.country_id || w.level_0)?.toString() === currentCountryObj.id?.toString())
        : allWarehouses;
      setWarehouses(countryWarehouses);

      const allSettings = looseRes.data?.data || [];
      setSettings(allSettings);

      if (currentCountryObj) {
        axios.post(
          `${API_URL}/geolocation/active-states?unique_id=${moduleUniqueId}&req_for=view`,
          { country_id: currentCountryObj.id },
          { headers: authHeaderObj() }
        ).then(statesRes => {
          setStates(statesRes.data?.states || []);
        }).catch(err => console.error("Error fetching states:", err));
      }
    } catch (error) {
      console.error("Error fetching loose order settings data:", error);
      dispatch(setAlert({ type: "error", message: "Failed to load warehouse loose order settings" }));
    } finally {
      setWarehouseLoading(false);
    }
  }, [countryName, moduleUniqueId, navigate, dispatch]);

  useEffect(() => {
    if (token) {
      fetchLooseOrders();
      fetchCountriesAndSettings();
    }
  }, [token, fetchLooseOrders, fetchCountriesAndSettings]);

  // Current Country
  const currentCountry = activeCountries.find(
    c => c.name.toLowerCase() === countryName?.toLowerCase()
  );

  // Fetch clusters for selected state filter
  useEffect(() => {
    const fetchClustersForFilter = async () => {
      if (!stateFilter) {
        setClusters([]);
        setClusterFilter("");
        return;
      }
      try {
        const res = await axios.get(
          `${API_URL}/geolocation/clusters/${stateFilter}?unique_id=${moduleUniqueId}&req_for=view`,
          { headers: authHeaderObj() }
        );
        setClusters(res.data?.clusters || []);
        setClusterFilter("");
      } catch (err) {
        console.error("Error fetching clusters:", err);
      }
    };
    if (token && stateFilter) {
      fetchClustersForFilter();
    }
  }, [stateFilter, token, moduleUniqueId]);

  // ── Filtered Loose Orders ─────────────────────────────────────────────────
  const filteredLooseOrders = useMemo(() => {
    return looseOrders.filter((o) => {
      if (statusFilter !== "ALL" && o.status !== statusFilter) return false;
      if (routingFilter !== "ALL") {
        if (routingFilter === "primary_reseller" && !o.is_franchise_attributed) return false;
        if (routingFilter === "direct_fallback" && o.is_franchise_attributed) return false;
      }
      if (orderSearch && orderSearch.trim()) {
        const q = orderSearch.trim().toLowerCase();
        const num = (o.order_number || "").toLowerCase();
        const partner = (o.reseller?.business_name || o.reseller?.name || "").toLowerCase();
        const buyer = (o.buyer?.name || "").toLowerCase();
        const kitName = (o.items?.[0]?.item_name || "").toLowerCase();
        return num.includes(q) || partner.includes(q) || buyer.includes(q) || kitName.includes(q);
      }
      return true;
    });
  }, [looseOrders, statusFilter, routingFilter, orderSearch]);

  // ── Metrics for Loose Orders ──────────────────────────────────────────────
  const totalLooseCount = looseStats?.loose_count ?? looseOrders.length;
  const franchiseAttributedCount = looseStats?.loose_attributed_count ?? looseOrders.filter(o => o.is_franchise_attributed).length;
  const directFallbackCount = looseOrders.filter(o => !o.is_franchise_attributed).length;
  const awaitingPaymentCount = looseOrders.filter(o => o.payment_status === "PENDING" || o.payment_status === "VERIFICATION_PENDING").length;

  const totalVolumeINR = looseStats?.loose_volume_inr ?? looseOrders.reduce((sum, o) => sum + (o.grand_total_inr || 0), 0);
  const totalKitsCount = looseStats?.loose_kits ?? looseOrders.reduce((sum, o) => sum + (o.total_kit_quantity || 0), 0);

  // ── Table Warehouse PO Settings ───────────────────────────────────────────
  const displayWarehouses = warehouses.filter(w => {
    if (stateFilter && (w.state_id || w.level_1)?.toString() !== stateFilter?.toString()) return false;
    if (clusterFilter && (w.cluster_id || w.cluster?.id || w.cluster)?.toString() !== clusterFilter?.toString()) return false;
    return true;
  });

  const warehouseTableData = displayWarehouses.map(w => {
    const targetId = (w.id || w._id)?.toString();
    const warehouseSettings = settings.filter(s => (s.warehouse_id || s.warehouse?.id || s.warehouse?._id)?.toString() === targetId);
    return {
      warehouse: w,
      settings: warehouseSettings,
      is_enabled: warehouseSettings.some(s => s.is_active !== false)
    };
  });

  const handleConfigureLooseOrders = (w) => {
    const targetId = w.id || w._id;
    navigate(`/admin-panel/solar-shop/${countryName?.toLowerCase()}/loose-orders/${targetId}`);
  };

  const configuredWarehouseIds = [...new Set(settings.map(s => s.warehouse_id?.toString()).filter(Boolean))];
  const configuredCount = warehouses.filter(w => configuredWarehouseIds.includes(w.id)).length;
  const pendingCount = Math.max(0, warehouses.length - configuredCount);

  // ── Workflow Action Handlers ───────────────────────────────────────────────
  const handleConfirmPayment = async (e) => {
    e.preventDefault();
    if (!selectedOrder) return;
    setActionLoading(true);
    try {
      const res = await axios.post(
        `${API_URL}/franchisee/po/confirm-payment?unique_id=${moduleUniqueId}&req_for=edit`,
        {
          po_id: selectedOrder._id,
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
        fetchLooseOrders();
      }
    } catch (err) {
      dispatch(setAlert({ type: "error", message: err.response?.data?.message || "Payment confirmation failed." }));
    } finally {
      setActionLoading(false);
    }
  };

  const handleDispatchOrder = async (orderId) => {
    const tracking = prompt("Enter dispatch courier / tracking number:", "TRK-" + Math.floor(100000 + Math.random() * 900000));
    if (!tracking) return;
    setActionLoading(true);
    try {
      const res = await axios.put(
        `${API_URL}/franchisee/po/dispatch?unique_id=${moduleUniqueId}&req_for=edit`,
        { po_id: orderId, tracking_number: tracking },
        { headers: authHeaderObj() }
      );
      if (res.data?.status === "success") {
        dispatch(setAlert({ type: "success", message: "Loose Order marked as Dispatched!" }));
        setSelectedOrder(null);
        fetchLooseOrders();
      }
    } catch (err) {
      dispatch(setAlert({ type: "error", message: err.response?.data?.message || "Failed to dispatch loose order." }));
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeliverOrder = async (orderId) => {
    if (!confirm("Are you sure you want to mark this Loose Order as Delivered?")) return;
    setActionLoading(true);
    try {
      const res = await axios.put(
        `${API_URL}/franchisee/po/deliver?unique_id=${moduleUniqueId}&req_for=edit`,
        { po_id: orderId },
        { headers: authHeaderObj() }
      );
      if (res.data?.status === "success") {
        dispatch(setAlert({ type: "success", message: "Loose Order marked as Delivered!" }));
        setSelectedOrder(null);
        fetchLooseOrders();
      }
    } catch (err) {
      dispatch(setAlert({ type: "error", message: err.response?.data?.message || "Failed to mark delivered." }));
    } finally {
      setActionLoading(false);
    }
  };

  // Table Headers for Loose Orders
  const looseOrderHeaders = [
    { key: "order_number", label: "Order Number / Type" },
    { key: "franchisee", label: "Franchisee Partner" },
    { key: "buyer", label: "Buyer / Destination" },
    { key: "items", label: "Kit / Loose Qty" },
    { key: "amount", label: "Total Amount (INR)" },
    { key: "payment", label: "Payment Status" },
    { key: "status", label: "Order Status" },
    { key: "actions", label: "Actions", align: "right" },
  ];

  // Table Headers for Warehouses
  const warehouseHeaders = [
    { key: "warehouse_code", label: "Warehouse" },
    { key: "address", label: "Address" },
    { key: "location", label: "State & Cluster" },
    { key: "status", label: "Loose Orders Status" },
    { key: "actions", label: "Actions", align: "right" }
  ];

  return (
    <div className="space-y-6 pb-24">
      {/* ── Top Header Banner with Primary Tabs ──────────────────────────────── */}
      <div className="relative rounded-2xl bg-gradient-to-r from-primary to-primary-end p-6 lg:p-8 text-white shadow-xl overflow-hidden">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-white/30">
              <FaBoxes className="text-white text-3xl" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl lg:text-3xl font-black tracking-tight">
                  Loose Orders Workspace
                </h1>
                {currentCountry && (
                  <span className="bg-white/20 rounded-full px-3 py-0.5 text-xs font-bold uppercase border border-white/30">
                    {currentCountry.name}
                  </span>
                )}
              </div>
              <p className="text-white/90 text-xs sm:text-sm mt-1">
                Manage Franchisee Loose Kit Orders, on-demand retail requests, and warehouse-level inventory settings.
              </p>
            </div>
          </div>

          {/* Top Primary Tabs */}
          <div className="flex items-center p-1.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20">
            <button
              onClick={() => setActiveTab("franchisee_loose")}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                activeTab === "franchisee_loose"
                  ? "bg-white text-primary shadow-lg"
                  : "text-white/80 hover:text-white"
              }`}
            >
              <FaBoxes size={14} />
              <span>Franchisee Loose Orders ({looseOrders.length})</span>
            </button>
            <button
              onClick={() => setActiveTab("warehouse_loose")}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                activeTab === "warehouse_loose"
                  ? "bg-white text-primary shadow-lg"
                  : "text-white/80 hover:text-white"
              }`}
            >
              <FaWarehouse size={14} />
              <span>Warehouse Loose Configurations</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── TAB 1: FRANCHISEE LOOSE ORDERS VIEW ───────────────────────────────── */}
      {activeTab === "franchisee_loose" && (
        <div className="space-y-6">
          {/* Quick Metrics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="card p-5 border-l-4 border-l-primary shadow-sm bg-surface">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-text-muted uppercase tracking-wider">Total Loose Orders</span>
                <span className="p-2 bg-primary/10 rounded-lg text-primary"><FaBoxes size={16} /></span>
              </div>
              <div className="mt-3">
                <span className="text-2xl font-black text-text-primary">{totalLooseCount}</span>
                <span className="text-xs text-text-muted ml-2 font-medium">({totalKitsCount} kits total)</span>
              </div>
              <div className="mt-1 text-xs font-bold text-primary">{fmtINR(totalVolumeINR)}</div>
            </div>

            <div className="card p-5 border-l-4 border-l-purple-500 shadow-sm bg-surface">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-text-muted uppercase tracking-wider">Franchise Attributed</span>
                <span className="p-2 bg-purple-500/10 rounded-lg text-purple-600"><FaBuilding size={16} /></span>
              </div>
              <div className="mt-3">
                <span className="text-2xl font-black text-purple-600">{franchiseAttributedCount}</span>
                <span className="text-xs text-text-muted ml-2">Orders</span>
              </div>
              <div className="mt-1 text-xs text-text-secondary">Created by or mapped to franchisees</div>
            </div>

            <div className="card p-5 border-l-4 border-l-cyan-500 shadow-sm bg-surface">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-text-muted uppercase tracking-wider">Direct / Fallback Store</span>
                <span className="p-2 bg-cyan-500/10 rounded-lg text-cyan-600"><FaStore size={16} /></span>
              </div>
              <div className="mt-3">
                <span className="text-2xl font-black text-cyan-600">{directFallbackCount}</span>
                <span className="text-xs text-text-muted ml-2">Orders</span>
              </div>
              <div className="mt-1 text-xs text-text-secondary">Direct EPC loose checkout orders</div>
            </div>

            <div className="card p-5 border-l-4 border-l-amber-500 shadow-sm bg-surface">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-text-muted uppercase tracking-wider">Awaiting Payment / Review</span>
                <span className="p-2 bg-amber-500/10 rounded-lg text-amber-600"><FaClock size={16} /></span>
              </div>
              <div className="mt-3">
                <span className="text-2xl font-black text-amber-600">{awaitingPaymentCount}</span>
                <span className="text-xs text-text-muted ml-2">Pending</span>
              </div>
              <div className="mt-1 text-xs text-text-secondary">Pending verification or confirmation</div>
            </div>
          </div>

          {/* Search and Filters Toolbar */}
          <div className="card p-4 border border-border shadow-xs bg-surface flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="relative w-full md:w-80">
              <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" size={13} />
              <input
                type="text"
                value={orderSearch}
                onChange={(e) => setOrderSearch(e.target.value)}
                placeholder="Search Order #, Partner, Buyer, or Kit..."
                className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-border bg-surface-hover/30 focus:outline-hidden focus:border-primary transition-colors text-text-primary"
              />
            </div>

            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              {/* Routing Filter */}
              <div className="w-full sm:w-44">
                <Dropdown
                  placeholder="Source Filter"
                  options={[
                    { value: "ALL", text: "All Sources" },
                    { value: "primary_reseller", text: "Franchise Attributed" },
                    { value: "direct_fallback", text: "Direct Fallback" },
                  ]}
                  value={routingFilter}
                  onChange={(val) => setRoutingFilter(val)}
                />
              </div>

              {/* Status Filter */}
              <div className="w-full sm:w-44">
                <Dropdown
                  placeholder="Status Filter"
                  options={[
                    { value: "ALL", text: "All Statuses" },
                    { value: "SUBMITTED", text: "Submitted" },
                    { value: "CONFIRMED", text: "Confirmed" },
                    { value: "PROCESSING", text: "Processing" },
                    { value: "DISPATCHED", text: "Dispatched" },
                    { value: "DELIVERED", text: "Delivered" },
                    { value: "COMPLETED", text: "Completed" },
                    { value: "CANCELLED", text: "Cancelled" },
                  ]}
                  value={statusFilter}
                  onChange={(val) => setStatusFilter(val)}
                />
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={fetchLooseOrders}
                className="text-xs font-bold gap-2"
              >
                <FaSyncAlt size={12} className={ordersLoading ? "animate-spin" : ""} />
                <span>Refresh</span>
              </Button>
            </div>
          </div>

          {/* Orders Table */}
          {ordersLoading ? (
            <Loader text="Loading Franchisee Loose Orders..." />
          ) : (
            <div className="card shadow-sm border border-border overflow-hidden bg-surface">
              <CustomTable
                headers={looseOrderHeaders}
                data={filteredLooseOrders}
                renderRow={(row) => (
                  <tr key={row._id} className="hover:bg-surface-hover/50 transition-colors border-b border-border/50">
                    {/* Order Number & Type */}
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs ${
                          row.is_franchise_attributed
                            ? "bg-purple-100 text-purple-700 border border-purple-200"
                            : "bg-cyan-100 text-cyan-700 border border-cyan-200"
                        }`}>
                          {row.is_franchise_attributed ? <FaBuilding size={14} /> : <FaStore size={14} />}
                        </div>
                        <div>
                          <div className="font-bold text-text-primary text-xs flex items-center gap-2">
                            <span>{row.order_number}</span>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                              row.is_franchise_attributed
                                ? "bg-purple-50 text-purple-700 border border-purple-200"
                                : "bg-cyan-50 text-cyan-700 border border-cyan-200"
                            }`}>
                              {row.is_franchise_attributed ? "Franchise Order" : "Direct Store"}
                            </span>
                          </div>
                          <div className="text-[11px] text-text-muted mt-0.5">
                            {row.created_at ? new Date(row.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "N/A"}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Franchisee Partner */}
                    <td className="p-4">
                      {row.reseller ? (
                        <div>
                          <div className="font-bold text-text-primary text-xs">{row.reseller.business_name}</div>
                          <div className="text-[11px] text-text-muted mt-0.5">{row.reseller.mobile || row.reseller.email}</div>
                        </div>
                      ) : (
                        <span className="text-xs text-text-muted italic">Central Direct Dispatch</span>
                      )}
                    </td>

                    {/* Buyer / Destination */}
                    <td className="p-4">
                      <div>
                        <div className="font-bold text-text-primary text-xs">{row.buyer?.name || "Hub Stock"}</div>
                        <div className="text-[11px] text-text-muted mt-0.5">
                          {row.destination_type === "hub_stock" ? "Regional Franchise Warehouse Hub" : (row.buyer?.gstin ? `GST: ${row.buyer.gstin}` : "EPC Buyer Partner")}
                        </div>
                      </div>
                    </td>

                    {/* Items & Qty */}
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-black bg-primary/10 text-primary border border-primary/20">
                          {row.total_kit_quantity} Kits
                        </span>
                        <span className="text-xs text-text-secondary truncate max-w-xs" title={row.items?.[0]?.item_name}>
                          {row.items?.[0]?.item_name || "Solar Kit"}
                          {row.items?.length > 1 && ` +${row.items.length - 1} more`}
                        </span>
                      </div>
                    </td>

                    {/* Amount */}
                    <td className="p-4">
                      <div className="font-black text-text-primary text-xs">{fmtINR(row.grand_total_inr)}</div>
                      <div className="text-[11px] text-text-muted">Incl. Tax</div>
                    </td>

                    {/* Payment Status */}
                    <td className="p-4">
                      <PaymentBadge status={row.payment_status} />
                      {row.payment_utr && (
                        <div className="text-[10px] text-text-muted font-mono mt-0.5 truncate max-w-[120px]" title={row.payment_utr}>
                          UTR: {row.payment_utr}
                        </div>
                      )}
                    </td>

                    {/* Order Status */}
                    <td className="p-4">
                      <StatusBadge status={row.status} />
                    </td>

                    {/* Actions */}
                    <td className="p-4 text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedOrder(row)}
                        className="text-xs font-bold gap-1.5 shadow-xs"
                      >
                        <FaEye size={12} />
                        View Details
                      </Button>
                    </td>
                  </tr>
                )}
              />

              {filteredLooseOrders.length === 0 && (
                <div className="p-12 text-center text-text-muted space-y-2">
                  <FaBoxOpen size={36} className="mx-auto text-text-muted/40" />
                  <p className="text-sm font-semibold">No loose orders found matching your criteria</p>
                  <p className="text-xs">When franchisees or EPC buyers create loose kit orders, they will appear right here.</p>
                </div>
              )}
            </div>
          )}

          {/* ── Order Detail Modal ───────────────────────────────────────────── */}
          {selectedOrder && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
              <div className="bg-surface rounded-2xl border border-border shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto flex flex-col animate-in fade-in zoom-in-95 duration-200">
                {/* Modal Header */}
                <div className="p-6 border-b border-border flex items-center justify-between bg-surface-hover/40 sticky top-0 z-20 backdrop-blur-md">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                      <FaBoxes size={22} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-lg font-black text-text-primary">{selectedOrder.order_number}</h2>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                          selectedOrder.is_franchise_attributed ? "bg-purple-100 text-purple-700" : "bg-cyan-100 text-cyan-700"
                        }`}>
                          {selectedOrder.is_franchise_attributed ? "Franchise Order" : "Direct Store Fallback"}
                        </span>
                      </div>
                      <p className="text-xs text-text-muted mt-0.5">
                        Created on {selectedOrder.created_at ? new Date(selectedOrder.created_at).toLocaleString("en-IN") : "N/A"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <StatusBadge status={selectedOrder.status} />
                    <PaymentBadge status={selectedOrder.payment_status} />
                    <button
                      onClick={() => setSelectedOrder(null)}
                      className="p-2 text-text-muted hover:text-text-primary rounded-xl hover:bg-surface-hover transition-colors"
                    >
                      <FaTimes size={16} />
                    </button>
                  </div>
                </div>

                {/* Modal Body */}
                <div className="p-6 space-y-6">
                  {/* Two Column Summary Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Franchisee Partner Info */}
                    <div className="card p-4 border border-border bg-surface-hover/20 space-y-2">
                      <div className="flex items-center gap-2 text-xs font-bold text-text-muted uppercase tracking-wider">
                        <FaBuilding className="text-purple-600" />
                        <span>Franchisee Partner</span>
                      </div>
                      {selectedOrder.reseller ? (
                        <div>
                          <div className="font-black text-sm text-text-primary">{selectedOrder.reseller.business_name}</div>
                          <div className="text-xs text-text-secondary mt-1">Mobile: {selectedOrder.reseller.mobile || "N/A"}</div>
                          <div className="text-xs text-text-secondary">Email: {selectedOrder.reseller.email || "N/A"}</div>
                        </div>
                      ) : (
                        <div className="text-xs text-text-muted italic">Central Direct Order (No franchisee linked)</div>
                      )}
                    </div>

                    {/* Buyer / Destination Info */}
                    <div className="card p-4 border border-border bg-surface-hover/20 space-y-2">
                      <div className="flex items-center gap-2 text-xs font-bold text-text-muted uppercase tracking-wider">
                        <FaMapMarkerAlt className="text-primary" />
                        <span>Delivery Destination & Buyer</span>
                      </div>
                      <div>
                        <div className="font-black text-sm text-text-primary">{selectedOrder.buyer?.name || "Franchise Hub Stock"}</div>
                        <div className="text-xs text-text-secondary mt-1">
                          Destination: <span className="font-semibold">{selectedOrder.destination_type === "hub_stock" ? "Regional Franchise Hub Stock" : "EPC Buyer Delivery"}</span>
                        </div>
                        <div className="text-xs text-text-secondary">
                          Address: <span className="font-medium">
                            {fmtAddress(selectedOrder.delivery_address) || "Franchise Regional Hub"}
                          </span>
                          {selectedOrder.destination_pincode && typeof selectedOrder.destination_pincode !== "object" && ` (PIN: ${selectedOrder.destination_pincode})`}
                          {selectedOrder.delivery_address?.contact_name && (
                            <span className="block text-text-muted">Contact: {selectedOrder.delivery_address.contact_name}{selectedOrder.delivery_address.contact_phone ? ` · ${selectedOrder.delivery_address.contact_phone}` : ""}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Payment Details Card */}
                  <div className="card p-4 border border-border bg-emerald-500/5 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs font-bold text-emerald-800 uppercase tracking-wider">
                        <FaMoneyBillWave className="text-emerald-600" />
                        <span>Payment & Settlement</span>
                      </div>
                      <PaymentBadge status={selectedOrder.payment_status} />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs">
                      <div>
                        <span className="text-text-muted block">Payment UTR / Ref:</span>
                        <span className="font-mono font-bold text-text-primary">{selectedOrder.payment_utr || "N/A"}</span>
                      </div>
                      <div>
                        <span className="text-text-muted block">Total Order Value:</span>
                        <span className="font-bold text-text-primary">{fmtINR(selectedOrder.grand_total_inr)}</span>
                      </div>
                      <div>
                        <span className="text-text-muted block">Payment Mode:</span>
                        <span className="font-bold text-text-primary">{selectedOrder.offline_payment?.payment_method || "Bank Transfer (NEFT/RTGS)"}</span>
                      </div>
                    </div>
                  </div>

                  {/* Line Items Table */}
                  <div className="space-y-3">
                    <h3 className="text-xs font-black text-text-muted uppercase tracking-wider">Order Line Items</h3>
                    <div className="border border-border rounded-xl overflow-hidden">
                      <table className="w-full text-xs">
                        <thead className="bg-surface-hover/60 text-text-muted font-bold border-b border-border">
                          <tr>
                            <th className="p-3 text-left">Item Name</th>
                            <th className="p-3 text-center">Qty</th>
                            <th className="p-3 text-right">Unit Price</th>
                            <th className="p-3 text-right">GST Rate</th>
                            <th className="p-3 text-right">Total Price</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border/50">
                          {(selectedOrder.items || []).map((item, idx) => (
                            <tr key={idx} className="hover:bg-surface-hover/30">
                              <td className="p-3 font-semibold text-text-primary">
                                {item.item_name}
                                {item.epc_allocations?.length > 0 && (
                                  <div className="mt-1 text-[11px] text-text-muted">
                                    Allocations: {item.epc_allocations.map(a => `${a.company_name || a.buyer_name} (${a.allocated_quantity})`).join(", ")}
                                  </div>
                                )}
                              </td>
                              <td className="p-3 text-center font-bold text-primary">{item.quantity}</td>
                              <td className="p-3 text-right text-text-secondary">{fmtINR(item.unit_price_inr)}</td>
                              <td className="p-3 text-right text-text-secondary">{item.gst_rate || 12}%</td>
                              <td className="p-3 text-right font-bold text-text-primary">{fmtINR(item.total_price_inr)}</td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot className="bg-surface-hover/40 font-bold border-t border-border">
                          <tr>
                            <td colSpan={4} className="p-3 text-right text-text-muted">Subtotal (INR):</td>
                            <td className="p-3 text-right text-text-primary">{fmtINR(selectedOrder.subtotal_inr)}</td>
                          </tr>
                          <tr>
                            <td colSpan={4} className="p-3 text-right text-text-muted">Total Tax:</td>
                            <td className="p-3 text-right text-text-primary">{fmtINR(selectedOrder.tax_total_inr)}</td>
                          </tr>
                          <tr className="text-sm font-black text-primary bg-primary/5">
                            <td colSpan={4} className="p-3 text-right">Grand Total:</td>
                            <td className="p-3 text-right">{fmtINR(selectedOrder.grand_total_inr)}</td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>
                </div>

                {/* Modal Footer Actions */}
                <div className="p-6 border-t border-border bg-surface-hover/30 flex flex-wrap items-center justify-between gap-3 sticky bottom-0 z-20 backdrop-blur-md">
                  <div className="text-xs text-text-muted">
                    Order Status: <span className="font-bold text-text-primary">{selectedOrder.status}</span>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    {/* Confirm Payment Action */}
                    {selectedOrder.payment_status !== "PAID" && (
                      <Button
                        variant="primary"
                        size="sm"
                        disabled={actionLoading}
                        onClick={() => {
                          setPaymentRefInput(selectedOrder.payment_utr || "");
                          setShowPaymentModal(true);
                        }}
                        className="text-xs font-bold gap-1.5"
                      >
                        <FaMoneyBillWave size={12} />
                        Confirm Payment
                      </Button>
                    )}

                    {/* Dispatch Action */}
                    {selectedOrder.status !== "DISPATCHED" && selectedOrder.status !== "DELIVERED" && selectedOrder.status !== "COMPLETED" && (
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={actionLoading}
                        onClick={() => handleDispatchOrder(selectedOrder._id)}
                        className="text-xs font-bold gap-1.5 text-purple-600 border-purple-200 hover:bg-purple-50"
                      >
                        <FaTruck size={12} />
                        Mark Dispatched
                      </Button>
                    )}

                    {/* Deliver Action */}
                    {selectedOrder.status === "DISPATCHED" && (
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={actionLoading}
                        onClick={() => handleDeliverOrder(selectedOrder._id)}
                        className="text-xs font-bold gap-1.5 text-emerald-600 border-emerald-200 hover:bg-emerald-50"
                      >
                        <FaCheckCircle size={12} />
                        Mark Delivered
                      </Button>
                    )}

                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setSelectedOrder(null)}
                      className="text-xs font-bold"
                    >
                      Close
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── Payment Confirmation Sub-Modal ──────────────────────────────── */}
          {showPaymentModal && (
            <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
              <div className="bg-surface rounded-2xl border border-border shadow-2xl p-6 w-full max-w-md space-y-4">
                <div className="flex items-center justify-between border-b border-border pb-3">
                  <h3 className="font-bold text-text-primary text-base flex items-center gap-2">
                    <FaMoneyBillWave className="text-emerald-600" /> Confirm Offline Payment
                  </h3>
                  <button onClick={() => setShowPaymentModal(false)} className="text-text-muted hover:text-text-primary">
                    <FaTimes size={16} />
                  </button>
                </div>

                <form onSubmit={handleConfirmPayment} className="space-y-4 text-xs">
                  <div>
                    <label className="font-bold text-text-muted uppercase tracking-wider block mb-1">
                      Bank Transfer Reference / UTR Number
                    </label>
                    <input
                      type="text"
                      required
                      value={paymentRefInput}
                      onChange={(e) => setPaymentRefInput(e.target.value)}
                      placeholder="e.g. UTR123456789"
                      className="w-full px-3 py-2 rounded-xl border border-border bg-surface-hover/30 text-text-primary font-mono"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      type="button"
                      onClick={() => setShowPaymentModal(false)}
                      disabled={actionLoading}
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      type="submit"
                      disabled={actionLoading}
                      className="gap-1.5"
                    >
                      <FaCheck size={12} />
                      {actionLoading ? "Confirming..." : "Verify & Confirm"}
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── TAB 2: WAREHOUSE LOOSE CONFIGURATIONS VIEW ────────────────────────── */}
      {activeTab === "warehouse_loose" && (
        <div className="space-y-6">
          {warehouseLoading ? (
            <Loader text="Loading Loose Orders settings..." />
          ) : (
            <>
              {/* Active Country Context Detail Card */}
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                <div className="card p-6 border-l-4 border-l-primary shadow-sm space-y-4 bg-surface">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-xs font-black text-text-muted uppercase tracking-[0.2em]">Active Market</h3>
                      <h2 className="text-lg font-black text-text-primary mt-1">
                        {currentCountry ? currentCountry.name : "No Selection"}
                      </h2>
                    </div>
                    {currentCountry && (
                      <ReactCountryFlag
                        countryCode={currentCountry.iso2}
                        svg
                        style={{ width: "2em", height: "1.5em" }}
                        className="rounded shadow-sm"
                      />
                    )}
                  </div>
                  <div className="space-y-1 text-xs text-text-secondary">
                    <div className="flex justify-between">
                      <span>Region Dial Code:</span>
                      <span className="font-bold">{currentCountry?.phone_code || "N/A"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Currency:</span>
                      <span className="font-bold">{currentCountry?.currency || "INR"}</span>
                    </div>
                  </div>
                </div>

                {/* Quick Metrics */}
                <div className="card p-6 border-l-4 border-l-emerald-500 shadow-sm flex flex-col justify-between bg-surface">
                  <div>
                    <h3 className="text-xs font-black text-text-muted uppercase tracking-[0.2em]">Total Warehouses</h3>
                    <h2 className="text-2xl font-black text-emerald-600 mt-2">{warehouses.length}</h2>
                  </div>
                  <p className="text-xs text-text-secondary mt-4">Registered facilities in this territory</p>
                </div>

                <div className="card p-6 border-l-4 border-l-blue-500 shadow-sm flex flex-col justify-between bg-surface">
                  <div>
                    <h3 className="text-xs font-black text-text-muted uppercase tracking-[0.2em]">Configured Hubs</h3>
                    <h2 className="text-2xl font-black text-blue-600 mt-2">{configuredCount}</h2>
                  </div>
                  <p className="text-xs text-text-secondary mt-4">Active loose order configurations</p>
                </div>

                <div className="card p-6 border-l-4 border-l-amber-500 shadow-sm flex flex-col justify-between bg-surface">
                  <div>
                    <h3 className="text-xs font-black text-text-muted uppercase tracking-[0.2em]">Pending Setup</h3>
                    <h2 className="text-2xl font-black text-amber-600 mt-2">{pendingCount}</h2>
                  </div>
                  <p className="text-xs text-text-secondary mt-4">Warehouses needing initial setup</p>
                </div>
              </div>

              {/* Filtering and Location Selection */}
              <div className="card p-5 border border-border shadow-xs bg-surface">
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <FaSlidersH className="text-primary" />
                    <h3 className="font-bold text-text-primary text-sm">Territory Filters</h3>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
                    <div className="w-full md:w-64">
                      <Dropdown
                        placeholder="Filter by State"
                        options={[
                          { value: "", text: "All States" },
                          ...states.map(s => ({ value: s.id, text: s.name }))
                        ]}
                        value={stateFilter}
                        onChange={(val) => {
                          setStateFilter(val);
                          setClusterFilter("");
                        }}
                      />
                    </div>

                    <div className="w-full md:w-64">
                      <Dropdown
                        placeholder="Filter by Cluster"
                        disabled={!stateFilter}
                        options={[
                          { value: "", text: "All Clusters" },
                          ...clusters.map(c => ({ value: c.id, text: c.name }))
                        ]}
                        value={clusterFilter}
                        onChange={(val) => setClusterFilter(val)}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Warehouses Table */}
              <div className="card shadow-sm border border-border overflow-hidden bg-surface">
                <CustomTable
                  headers={warehouseHeaders}
                  data={warehouseTableData}
                  renderRow={(row) => (
                    <tr key={row.warehouse.id} className="hover:bg-surface-hover/50 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                            <FaWarehouse size={18} />
                          </div>
                          <div>
                            <div className="font-bold text-text-primary text-sm flex items-center gap-2">
                              {row.warehouse.warehouse_code || row.warehouse.name || "Main Warehouse"}
                              <span className="text-[10px] px-2 py-0.5 rounded-full uppercase bg-surface-hover font-bold border border-border">
                                {row.warehouse.warehouse_type || "Hub"}
                              </span>
                            </div>
                            <div className="text-xs text-text-muted mt-0.5">
                              ID: {row.warehouse.id?.slice(-8)}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="p-4 text-xs text-text-secondary max-w-xs truncate">
                        {row.warehouse.address || "N/A"}
                        {row.warehouse.pincode && <span className="block text-text-muted">PIN: {row.warehouse.pincode}</span>}
                      </td>

                      <td className="p-4">
                        <div className="text-xs font-semibold text-text-primary flex items-center gap-1.5">
                          <FaMapMarkerAlt className="text-primary text-[10px]" />
                          {row.warehouse.state_name || row.warehouse.state || "N/A"}
                        </div>
                        <div className="text-[11px] text-text-muted mt-0.5">
                          Cluster: {row.warehouse.cluster_name || row.warehouse.cluster || "General"}
                        </div>
                      </td>

                      <td className="p-4">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                          row.is_enabled
                            ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20"
                            : "bg-amber-500/10 text-amber-600 border border-amber-500/20"
                        }`}>
                          <span className={`w-2 h-2 rounded-full ${row.is_enabled ? "bg-emerald-500" : "bg-amber-500"}`} />
                          {row.is_enabled ? "Configured & Active" : "Pending Setup"}
                        </span>
                      </td>

                      <td className="p-4 text-right">
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => handleConfigureLooseOrders(row.warehouse)}
                          className="text-xs font-bold gap-1.5 shadow-sm"
                        >
                          <FaEdit size={13} />
                          Configure Loose Orders
                        </Button>
                      </td>
                    </tr>
                  )}
                />
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
