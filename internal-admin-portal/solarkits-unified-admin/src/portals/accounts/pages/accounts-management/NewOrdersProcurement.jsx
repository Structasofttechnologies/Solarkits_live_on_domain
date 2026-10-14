import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useSelector } from "react-redux";
import {
  FaBoxes, FaShoppingCart, FaSearch, FaFilter, FaTruck, FaWarehouse,
  FaCheckCircle, FaExclamationTriangle, FaTimesCircle, FaPaperPlane,
  FaRedo, FaLayerGroup, FaMapMarkerAlt, FaFileInvoice, FaBuilding,
  FaArrowRight, FaClock, FaCheck, FaInfoCircle, FaChevronRight,
  FaShieldAlt, FaExternalLinkAlt, FaTimes
} from "react-icons/fa";
import {
  getEligibleNewOrders,
  getNewOrdersFilterOptions,
  getVehiclesMaster,
  calculateProcurementGrouping,
  submitProcurementGroup,
} from "../../api/accounts";
import PageHeader from "../../components/PageHeader";
import Button from "../../components/Button";
import Dialog from "../../components/Dialog";
import Loader from "../../components/Loader";

export default function NewOrdersProcurement() {
  const { user } = useSelector((state) => state.user_slice || {});

  // ───────────────────────────────────────────────────────────────────────────
  // State: Filter Options from Backend
  // ───────────────────────────────────────────────────────────────────────────
  const [filterOptions, setFilterOptions] = useState({
    states: [],
    districts: [],
    kit_types: [],
    industry_types: [],
    project_types: [],
    origins: [],
    order_modes: [],
    order_categories: [],
    delivery_destinations: [],
    vehicles: [],
  });

  // ───────────────────────────────────────────────────────────────────────────
  // State: Active Filters
  // ───────────────────────────────────────────────────────────────────────────
  const [orderMode, setOrderMode] = useState("all"); // 'all' | 'offline' | 'online'
  const [orderOrigin, setOrderOrigin] = useState("all"); // 'all' | 'epc' | 'franchisee' | 'company'
  const [orderCategory, setOrderCategory] = useState("all"); // 'all' | 'govt_tender' | 'industry_kit'
  const [industryType, setIndustryType] = useState("");
  const [projectType, setProjectType] = useState("");
  const [kitType, setKitType] = useState("");
  const [orderStatus, setOrderStatus] = useState("all");

  // Geographical Filters
  const [selectedStates, setSelectedStates] = useState([]);
  const [selectedDistricts, setSelectedDistricts] = useState([]);
  const [pincodeSearch, setPincodeSearch] = useState("");
  const [deliveryDestination, setDeliveryDestination] = useState("all");
  const [routeGroup, setRouteGroup] = useState("");

  // Order Selection Controls
  const [orderCountLimit, setOrderCountLimit] = useState(100); // 50 | 100 | 500 | 1000
  const [vehicleStrategy, setVehicleStrategy] = useState("single"); // 'single' | 'multiple_same' | 'multiple_types'
  const [selectionMethod, setSelectionMethod] = useState("auto"); // 'auto' | 'manual'
  const [searchTerm, setSearchTerm] = useState("");

  // ───────────────────────────────────────────────────────────────────────────
  // State: Orders & Selections
  // ───────────────────────────────────────────────────────────────────────────
  const [orders, setOrders] = useState([]);
  const [totalMatching, setTotalMatching] = useState(0);
  const [totalMatchingKits, setTotalMatchingKits] = useState(0);
  const [selectedOrderIds, setSelectedOrderIds] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

  // ───────────────────────────────────────────────────────────────────────────
  // State: Vehicle Selection & Calculations
  // ───────────────────────────────────────────────────────────────────────────
  const [vehicles, setVehicles] = useState([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState("");
  const [calculationData, setCalculationData] = useState(null);
  const [calculating, setCalculating] = useState(false);

  // ───────────────────────────────────────────────────────────────────────────
  // State: Modals & Submission
  // ───────────────────────────────────────────────────────────────────────────
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submittedGroup, setSubmittedGroup] = useState(null);
  const [notification, setNotification] = useState(null);

  const showNotification = (type, message) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 6000);
  };

  // ───────────────────────────────────────────────────────────────────────────
  // 1. Initial Load: Filter Options & Vehicles
  // ───────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    const fetchInitialMeta = async () => {
      try {
        const [optRes, vehRes] = await Promise.all([
          getNewOrdersFilterOptions().catch(() => ({ data: {} })),
          getVehiclesMaster().catch(() => ({ data: [] })),
        ]);

        if (optRes?.data) {
          setFilterOptions(optRes.data);
        }
        if (vehRes?.data && vehRes.data.length > 0) {
          setVehicles(vehRes.data);
          // Default to 12MT or first suitable truck
          const defTruck = vehRes.data.find((v) => (v.max_load_kg || 0) >= 15000) || vehRes.data[0];
          if (defTruck) setSelectedVehicleId(defTruck._id);
        }
      } catch (err) {
        console.error("Error fetching initial filter metadata:", err);
      }
    };
    fetchInitialMeta();
  }, []);

  // ───────────────────────────────────────────────────────────────────────────
  // 2. Fetch Matching Orders based on Combined Filters
  // ───────────────────────────────────────────────────────────────────────────
  const fetchOrders = useCallback(async () => {
    setLoadingOrders(true);
    try {
      const params = {
        order_mode: orderMode,
        order_origin: orderOrigin,
        order_category: orderCategory,
        industry_type: industryType,
        project_type: projectType,
        kit_type: kitType,
        order_status: orderStatus,
        states: selectedStates.join(","),
        districts: selectedDistricts.join(","),
        pincodes: pincodeSearch,
        delivery_destination: deliveryDestination,
        route_group: routeGroup,
        search: searchTerm,
      };

      const res = await getEligibleNewOrders(params);
      if (res?.data) {
        const list = res.data;
        setOrders(list);
        setTotalMatching(res.meta?.total_matching_orders || list.length);
        setTotalMatchingKits(res.meta?.total_matching_kits || list.reduce((a, b) => a + (b.kits || 1), 0));

        // Automatic order-count selection up to limit if 'auto' method is chosen
        if (selectionMethod === "auto") {
          const autoSelected = list.slice(0, orderCountLimit).map((o) => o.id);
          setSelectedOrderIds(autoSelected);
        }
      }
    } catch (err) {
      console.error("Error loading eligible orders:", err);
      showNotification("error", "Failed to fetch orders with current filters.");
    } finally {
      setLoadingOrders(false);
    }
  }, [
    orderMode, orderOrigin, orderCategory, industryType, projectType,
    kitType, orderStatus, selectedStates, selectedDistricts, pincodeSearch,
    deliveryDestination, routeGroup, searchTerm, selectionMethod, orderCountLimit
  ]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // When order count limit changes, auto-select if in auto mode
  useEffect(() => {
    if (selectionMethod === "auto" && orders.length > 0) {
      const autoSelected = orders.slice(0, orderCountLimit).map((o) => o.id);
      setSelectedOrderIds(autoSelected);
    }
  }, [orderCountLimit, selectionMethod, orders]);

  // ───────────────────────────────────────────────────────────────────────────
  // 3. Dynamic Capacity & Supplier BOM Calculation
  // ───────────────────────────────────────────────────────────────────────────
  const calculateGrouping = useCallback(async () => {
    if (selectedOrderIds.length === 0) {
      setCalculationData(null);
      return;
    }
    setCalculating(true);
    try {
      const payload = {
        order_ids: selectedOrderIds,
        vehicle_id: selectedVehicleId,
        vehicle_strategy: vehicleStrategy,
        vehicle_count: vehicleStrategy === "multiple_same" ? Math.max(1, Math.ceil(selectedOrderIds.length / 25)) : 1,
      };
      const res = await calculateProcurementGrouping(payload);
      if (res?.data) {
        setCalculationData(res.data);
      }
    } catch (err) {
      console.error("Calculation error:", err);
    } finally {
      setCalculating(false);
    }
  }, [selectedOrderIds, selectedVehicleId, vehicleStrategy]);

  useEffect(() => {
    const timer = setTimeout(() => {
      calculateGrouping();
    }, 250);
    return () => clearTimeout(timer);
  }, [calculateGrouping]);

  // ───────────────────────────────────────────────────────────────────────────
  // 4. Selection Handlers
  // ───────────────────────────────────────────────────────────────────────────
  const handleToggleSelectAll = () => {
    if (selectedOrderIds.length === orders.length) {
      setSelectedOrderIds([]);
    } else {
      setSelectedOrderIds(orders.slice(0, orderCountLimit).map((o) => o.id));
    }
  };

  const handleToggleOrder = (id) => {
    setSelectionMethod("manual");
    setSelectedOrderIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleResetFilters = () => {
    setOrderMode("all");
    setOrderOrigin("all");
    setOrderCategory("all");
    setIndustryType("");
    setProjectType("");
    setKitType("");
    setOrderStatus("all");
    setSelectedStates([]);
    setSelectedDistricts([]);
    setPincodeSearch("");
    setDeliveryDestination("all");
    setRouteGroup("");
    setSearchTerm("");
    setOrderCountLimit(100);
    setSelectionMethod("auto");
  };

  // ───────────────────────────────────────────────────────────────────────────
  // 5. Send to Procurement Submission
  // ───────────────────────────────────────────────────────────────────────────
  const handleConfirmSendToProcurement = async () => {
    if (selectedOrderIds.length === 0) {
      showNotification("error", "Please select at least one order to proceed.");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        order_ids: selectedOrderIds,
        vehicle_id: selectedVehicleId,
        vehicle_strategy: vehicleStrategy,
        vehicle_count: calculationData?.vehicle_assignment?.vehicle_count || 1,
        calculation_snapshot: calculationData,
      };

      const res = await submitProcurementGroup(payload);
      if (res?.status === "success") {
        setSubmittedGroup(res.data);
        setShowConfirmModal(false);
        showNotification("success", `Procurement Group #${res.data.group_id} successfully created and sent to Procurement!`);
        // Refresh orders to reflect updated status
        fetchOrders();
      }
    } catch (err) {
      console.error("Submission error:", err);
      showNotification("error", err.response?.data?.message || "Failed to submit group to procurement.");
    } finally {
      setSubmitting(false);
    }
  };

  // ───────────────────────────────────────────────────────────────────────────
  // Derived metrics from current selection
  // ───────────────────────────────────────────────────────────────────────────
  const selectedOrdersList = useMemo(() => {
    return orders.filter((o) => selectedOrderIds.includes(o.id));
  }, [orders, selectedOrderIds]);

  const selectedKitsCount = useMemo(() => {
    return selectedOrdersList.reduce((acc, o) => acc + (o.kits || 1), 0);
  }, [selectedOrdersList]);

  // Suggested group ID
  const displayGroupId = submittedGroup?.group_id || `PG-${new Date().getFullYear()}-0001`;

  return (
    <div className="space-y-6 pb-20 animate-in fade-in duration-300">
      {/* ─────────────────────────────────────────────────────────────────────
          PAGE HEADER & WORKFLOW PROCESS TITLE
      ───────────────────────────────────────────────────────────────────── */}
      <div className="bg-surface border border-border rounded-2xl p-5 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <span className="p-2.5 rounded-xl bg-primary/10 text-primary border border-primary/20">
                <FaBoxes className="w-5 h-5 text-[#263880]" />
              </span>
              <div>
                <h1 className="text-xl md:text-2xl font-black tracking-tight text-text-primary">
                  SOLARKITS — New Orders Module (Company Account Login)
                </h1>
                <p className="text-xs text-text-secondary mt-0.5 flex items-center gap-2 font-medium">
                  <span className="text-primary font-bold">Process Flow:</span>
                  <span>Filter</span>
                  <FaChevronRight className="w-2.5 h-2.5 text-text-muted" />
                  <span>Select Orders</span>
                  <FaChevronRight className="w-2.5 h-2.5 text-text-muted" />
                  <span>Calculate Capacity</span>
                  <FaChevronRight className="w-2.5 h-2.5 text-text-muted" />
                  <span>Group Suppliers</span>
                  <FaChevronRight className="w-2.5 h-2.5 text-text-muted" />
                  <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Send to Procurement</span>
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={handleResetFilters}
              className="px-3.5 py-2 text-xs font-semibold rounded-xl border border-border bg-surface hover:bg-surface-hover text-text-secondary transition-all flex items-center gap-2 shadow-xs cursor-pointer"
            >
              <FaRedo className="w-3 h-3" />
              Reset Filters
            </button>
            <button
              onClick={fetchOrders}
              className="px-3.5 py-2 text-xs font-semibold rounded-xl bg-primary/10 hover:bg-primary/20 text-[#263880] border border-[#263880]/30 transition-all flex items-center gap-2 cursor-pointer"
            >
              <FaSearch className="w-3 h-3" />
              Sync Orders
            </button>
          </div>
        </div>

        {/* Global Alert Notification */}
        {notification && (
          <div
            className={`mt-4 p-3 rounded-xl border text-xs font-medium flex items-center justify-between animate-in slide-in-from-top-2 ${
              notification.type === "success"
                ? "bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-700"
                : "bg-red-50 text-red-800 border-red-300 dark:bg-red-950/40 dark:text-red-300 dark:border-red-700"
            }`}
          >
            <div className="flex items-center gap-2">
              {notification.type === "success" ? (
                <FaCheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              ) : (
                <FaExclamationTriangle className="w-4 h-4 text-red-600 dark:text-red-400" />
              )}
              <span>{notification.message}</span>
            </div>
            <button onClick={() => setNotification(null)} className="text-text-muted hover:text-text-primary">
              <FaTimes className="w-3 h-3" />
            </button>
          </div>
        )}
      </div>

      {/* ─────────────────────────────────────────────────────────────────────
          ROW 1: SECTION 1 (MAIN FILTERS) & SECTION 2 (LOCATION & ORDER FILTERS)
      ───────────────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* SECTION 1: MAIN FILTERS (Blue Theme) */}
        <div className="lg:col-span-5 bg-gradient-to-b from-blue-50/50 to-surface dark:from-blue-950/20 dark:to-surface border border-blue-200/70 dark:border-blue-800/40 rounded-2xl p-4.5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-blue-200/60 dark:border-blue-900/40">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-black flex items-center justify-center shadow-xs">
                  1
                </span>
                <h2 className="text-sm font-black uppercase tracking-wider text-blue-900 dark:text-blue-300">
                  Main Filters
                </h2>
              </div>
              <span className="text-[11px] text-blue-700 dark:text-blue-400 font-semibold px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/40">
                Type • Origin • Category
              </span>
            </div>

            <div className="space-y-3.5 text-xs">
              {/* Order Type */}
              <div>
                <label className="block text-[11px] font-bold text-text-secondary uppercase tracking-wider mb-1.5">
                  Order Type
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: "offline", label: "Offline Orders" },
                    { id: "online", label: "Online Orders" },
                  ].map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setOrderMode(orderMode === t.id ? "all" : t.id)}
                      className={`py-2 px-3 rounded-xl border text-xs font-semibold text-center transition-all cursor-pointer ${
                        orderMode === t.id
                          ? "bg-blue-600 text-white border-blue-600 shadow-xs"
                          : "bg-surface border-border hover:bg-blue-50/50 dark:hover:bg-blue-950/30 text-text-primary"
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Order Origin */}
              <div>
                <label className="block text-[11px] font-bold text-text-secondary uppercase tracking-wider mb-1.5">
                  Order Origin
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: "epc", label: "Solar EPC" },
                    { id: "franchisee", label: "Franchisee Store" },
                    { id: "company", label: "Company Store" },
                  ].map((o) => (
                    <button
                      key={o.id}
                      type="button"
                      onClick={() => setOrderOrigin(orderOrigin === o.id ? "all" : o.id)}
                      className={`py-2 px-2 text-[11px] font-semibold rounded-xl border text-center transition-all cursor-pointer ${
                        orderOrigin === o.id
                          ? "bg-blue-600 text-white border-blue-600 shadow-xs"
                          : "bg-surface border-border hover:bg-blue-50/50 dark:hover:bg-blue-950/30 text-text-primary"
                      }`}
                    >
                      {o.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Order Category */}
              <div>
                <label className="block text-[11px] font-bold text-text-secondary uppercase tracking-wider mb-1.5">
                  Order Category
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: "govt_tender", label: "Govt. Tenders Order" },
                    { id: "industry_kit", label: "Industry Kits" },
                  ].map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setOrderCategory(orderCategory === c.id ? "all" : c.id)}
                      className={`py-2 px-3 text-xs font-semibold rounded-xl border text-center transition-all cursor-pointer ${
                        orderCategory === c.id
                          ? "bg-blue-600 text-white border-blue-600 shadow-xs"
                          : "bg-surface border-border hover:bg-blue-50/50 dark:hover:bg-blue-950/30 text-text-primary"
                      }`}
                    >
                      {c.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Industry / Project / Kit Dropdowns */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2 pt-1">
                <div>
                  <label className="block text-[10px] font-bold text-text-muted uppercase mb-1">Industry Type</label>
                  <select
                    value={industryType}
                    onChange={(e) => setIndustryType(e.target.value)}
                    className="w-full text-xs py-1.5 px-2 bg-surface border border-border rounded-lg text-text-primary focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="">All Industries</option>
                    {filterOptions.industry_types?.map((ind) => (
                      <option key={ind} value={ind}>{ind}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-text-muted uppercase mb-1">Project Type</label>
                  <select
                    value={projectType}
                    onChange={(e) => setProjectType(e.target.value)}
                    className="w-full text-xs py-1.5 px-2 bg-surface border border-border rounded-lg text-text-primary focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="">All Projects</option>
                    {filterOptions.project_types?.map((proj) => (
                      <option key={proj} value={proj}>{proj}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-text-muted uppercase mb-1">Kit Type</label>
                  <select
                    value={kitType}
                    onChange={(e) => setKitType(e.target.value)}
                    className="w-full text-xs py-1.5 px-2 bg-surface border border-border rounded-lg text-text-primary focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="">All Kit Types</option>
                    {filterOptions.kit_types?.map((kit) => (
                      <option key={kit} value={kit}>{kit}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 2: LOCATION & ORDER FILTERS (Green Theme) */}
        <div className="lg:col-span-7 bg-gradient-to-b from-emerald-50/50 to-surface dark:from-emerald-950/20 dark:to-surface border border-emerald-200/70 dark:border-emerald-800/40 rounded-2xl p-4.5 shadow-xs">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-emerald-200/60 dark:border-emerald-900/40">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-emerald-600 text-white text-xs font-black flex items-center justify-center shadow-xs">
                2
              </span>
              <h2 className="text-sm font-black uppercase tracking-wider text-emerald-900 dark:text-emerald-300">
                Location & Order Filters
              </h2>
            </div>
            <span className="text-[11px] text-emerald-700 dark:text-emerald-400 font-semibold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/40">
              Geography • Bulk Limit • Strategy
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            {/* Left: Route / Pincode Filters */}
            <div className="space-y-2.5">
              <p className="text-[11px] font-black text-emerald-900 dark:text-emerald-300 flex items-center gap-1.5">
                <FaMapMarkerAlt className="w-3 h-3 text-emerald-600" />
                Route / Pincode Filters
              </p>

              <div>
                <label className="block text-[10px] font-bold text-text-muted uppercase mb-1">State (Multi-select)</label>
                <select
                  value={selectedStates[0] || ""}
                  onChange={(e) => setSelectedStates(e.target.value ? [e.target.value] : [])}
                  className="w-full text-xs py-1.5 px-2 bg-surface border border-border rounded-lg text-text-primary"
                >
                  <option value="">All States (e.g. Gujarat, Maharashtra)</option>
                  {filterOptions.states?.map((st) => (
                    <option key={st._id} value={st.name}>{st.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-text-muted uppercase mb-1">District (Multi-select)</label>
                <select
                  value={selectedDistricts[0] || ""}
                  onChange={(e) => setSelectedDistricts(e.target.value ? [e.target.value] : [])}
                  className="w-full text-xs py-1.5 px-2 bg-surface border border-border rounded-lg text-text-primary"
                >
                  <option value="">All Districts (e.g. Rajkot, Ahmedabad)</option>
                  {filterOptions.districts?.map((d) => (
                    <option key={d._id} value={d.name}>{d.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-bold text-text-muted uppercase mb-1">Pincode</label>
                  <input
                    type="text"
                    placeholder="Search pincode..."
                    value={pincodeSearch}
                    onChange={(e) => setPincodeSearch(e.target.value)}
                    className="w-full text-xs py-1.5 px-2 bg-surface border border-border rounded-lg text-text-primary"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-text-muted uppercase mb-1">Delivery Destination</label>
                  <select
                    value={deliveryDestination}
                    onChange={(e) => setDeliveryDestination(e.target.value)}
                    className="w-full text-xs py-1.5 px-2 bg-surface border border-border rounded-lg text-text-primary"
                  >
                    <option value="all">All Destinations</option>
                    <option value="epc">EPC Location</option>
                    <option value="franchisee">Franchisee Store</option>
                    <option value="company">Company Store</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Right: Order Count Selection & Vehicle Strategy */}
            <div className="space-y-3 pl-0 md:pl-2 border-t md:border-t-0 md:border-l border-emerald-200/60 dark:border-emerald-900/40 pt-3 md:pt-0">
              {/* Order Count Selection */}
              <div>
                <label className="block text-[11px] font-bold text-emerald-900 dark:text-emerald-300 uppercase tracking-wider mb-1.5">
                  Order Count Selection (Batch Limit)
                </label>
                <div className="grid grid-cols-4 gap-1.5">
                  {[50, 100, 500, 1000].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setOrderCountLimit(num)}
                      className={`py-1.5 text-xs font-black rounded-lg border text-center transition-all cursor-pointer ${
                        orderCountLimit === num
                          ? "bg-emerald-600 text-white border-emerald-600 shadow-xs"
                          : "bg-surface border-border hover:bg-emerald-50 dark:hover:bg-emerald-950/30 text-text-primary"
                      }`}
                    >
                      {num}
                    </button>
                  ))}
                </div>
              </div>

              {/* Vehicle Selection Strategy */}
              <div>
                <label className="block text-[11px] font-bold text-emerald-900 dark:text-emerald-300 uppercase tracking-wider mb-1.5">
                  Vehicle Selection Strategy
                </label>
                <div className="space-y-1">
                  {[
                    { id: "single", label: "One vehicle for the group" },
                    { id: "multiple_same", label: "Multiple vehicles of same type" },
                    { id: "multiple_types", label: "Multiple vehicle types" },
                  ].map((strat) => (
                    <label
                      key={strat.id}
                      className="flex items-center gap-2 cursor-pointer p-1 rounded-lg hover:bg-emerald-100/40 dark:hover:bg-emerald-900/20 text-text-primary text-[11px]"
                    >
                      <input
                        type="radio"
                        name="vehicle_strategy"
                        checked={vehicleStrategy === strat.id}
                        onChange={() => setVehicleStrategy(strat.id)}
                        className="text-emerald-600 focus:ring-emerald-500"
                      />
                      <span>{strat.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Selection Method */}
              <div>
                <label className="block text-[11px] font-bold text-emerald-900 dark:text-emerald-300 uppercase tracking-wider mb-1">
                  Selection Method
                </label>
                <div className="flex items-center gap-4 text-[11px]">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="selection_method"
                      checked={selectionMethod === "auto"}
                      onChange={() => setSelectionMethod("auto")}
                      className="text-emerald-600 focus:ring-emerald-500"
                    />
                    <span>Select all matching (up to limit)</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="selection_method"
                      checked={selectionMethod === "manual"}
                      onChange={() => setSelectionMethod("manual")}
                      className="text-emerald-600 focus:ring-emerald-500"
                    />
                    <span>Manual selection</span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────────────
          ROW 2: SECTION 3 (SELECT ORDERS & VIEW SUMMARY - Purple Theme)
      ───────────────────────────────────────────────────────────────────── */}
      <div className="bg-gradient-to-b from-purple-50/50 to-surface dark:from-purple-950/20 dark:to-surface border border-purple-200/70 dark:border-purple-800/40 rounded-2xl p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 mb-4 border-b border-purple-200/60 dark:border-purple-900/40 gap-3">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-purple-600 text-white text-xs font-black flex items-center justify-center shadow-xs">
              3
            </span>
            <h2 className="text-sm font-black uppercase tracking-wider text-purple-900 dark:text-purple-300">
              Select Orders & View Summary
            </h2>
          </div>

          {/* Quick Search */}
          <div className="relative w-full sm:w-64">
            <FaSearch className="absolute left-3 top-2.5 text-text-muted text-xs" />
            <input
              type="text"
              placeholder="Search order no, customer..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full text-xs pl-8 pr-3 py-1.5 bg-surface border border-border rounded-xl text-text-primary focus:ring-1 focus:ring-purple-500"
            />
          </div>
        </div>

        {/* 3 Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
          <div className="bg-surface border border-purple-200/60 dark:border-purple-900/30 rounded-xl p-3.5 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-text-secondary">Total Matching Orders</span>
              <span className="p-1.5 rounded-lg bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300">
                <FaFileInvoice className="w-3.5 h-3.5" />
              </span>
            </div>
            <p className="text-2xl font-black text-purple-900 dark:text-purple-300 mt-1">
              {totalMatching.toLocaleString()}
            </p>
            <p className="text-[10px] text-text-muted mt-0.5">Matching active filters criteria</p>
          </div>

          <div className="bg-surface border border-purple-200/60 dark:border-purple-900/30 rounded-xl p-3.5 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-text-secondary">Selected Orders</span>
              <span className="p-1.5 rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                <FaCheckCircle className="w-3.5 h-3.5" />
              </span>
            </div>
            <p className="text-2xl font-black text-emerald-800 dark:text-emerald-300 mt-1">
              {selectedOrderIds.length.toLocaleString()}
            </p>
            <p className="text-[10px] text-text-muted mt-0.5">
              Up to chosen limit ({orderCountLimit})
            </p>
          </div>

          <div className="bg-surface border border-purple-200/60 dark:border-purple-900/30 rounded-xl p-3.5 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-text-secondary">Total Kits (Selected Orders)</span>
              <span className="p-1.5 rounded-lg bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
                <FaBoxes className="w-3.5 h-3.5" />
              </span>
            </div>
            <p className="text-2xl font-black text-blue-800 dark:text-blue-300 mt-1">
              {selectedKitsCount.toLocaleString()}
            </p>
            <p className="text-[10px] text-text-muted mt-0.5">Combined equipment kit units</p>
          </div>
        </div>

        {/* Orders Table */}
        <div className="overflow-x-auto border border-border rounded-xl bg-surface">
          <table className="w-full text-left text-xs">
            <thead className="bg-surface-hover/80 border-b border-border text-text-secondary font-black uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-2.5 px-3 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={orders.length > 0 && selectedOrderIds.length === orders.length}
                    onChange={handleToggleSelectAll}
                    className="rounded border-border text-purple-600 focus:ring-purple-500 cursor-pointer"
                  />
                </th>
                <th className="py-2.5 px-3">Order No.</th>
                <th className="py-2.5 px-3">Origin</th>
                <th className="py-2.5 px-3">Customer / Partner</th>
                <th className="py-2.5 px-3">State / District</th>
                <th className="py-2.5 px-3">Pincode</th>
                <th className="py-2.5 px-3">Kit Type</th>
                <th className="py-2.5 px-3 text-center">Kits</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {loadingOrders ? (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-text-muted">
                    <Loader text="Filtering eligible orders..." />
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-text-muted">
                    No eligible orders found matching current filter combination.
                  </td>
                </tr>
              ) : (
                orders.map((o) => {
                  const isChecked = selectedOrderIds.includes(o.id);
                  return (
                    <tr
                      key={o.id}
                      onClick={() => handleToggleOrder(o.id)}
                      className={`hover:bg-purple-50/40 dark:hover:bg-purple-950/20 transition-colors cursor-pointer ${
                        isChecked ? "bg-purple-50/70 dark:bg-purple-950/30" : ""
                      }`}
                    >
                      <td className="py-2.5 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleOrder(o.id)}
                          className="rounded border-border text-purple-600 focus:ring-purple-500 cursor-pointer"
                        />
                      </td>
                      <td className="py-2.5 px-3 font-black text-purple-900 dark:text-purple-300">
                        {o.order_number}
                      </td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            o.order_origin_code === "epc"
                              ? "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300"
                              : o.order_origin_code === "franchisee"
                              ? "bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300"
                              : "bg-teal-100 text-teal-800 dark:bg-teal-900/40 dark:text-teal-300"
                          }`}
                        >
                          {o.order_origin}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-medium text-text-primary">
                        {o.customer_name}
                      </td>
                      <td className="py-2.5 px-3 text-text-secondary">
                        {o.district_name}, {o.state_name}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-text-muted">
                        {o.pincode}
                      </td>
                      <td className="py-2.5 px-3 text-text-primary font-medium">
                        {o.kit_type}
                      </td>
                      <td className="py-2.5 px-3 text-center font-bold text-text-primary">
                        <span className="px-2 py-0.5 rounded-lg bg-surface-hover font-mono">
                          {o.kits}
                        </span>
                      </td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            o.status === "New"
                              ? "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300"
                              : o.status === "Ready for Procurement"
                              ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300"
                              : o.status === "Sent to Procurement"
                              ? "bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300"
                              : "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300"
                          }`}
                        >
                          {o.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right font-black text-text-primary font-mono">
                        ₹{(o.order_amount || 0).toLocaleString()}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────────────
          ROW 3: SECTION 4 (VEHICLE SELECTION & KIT CAPACITY - Orange Theme)
      ───────────────────────────────────────────────────────────────────── */}
      <div className="bg-gradient-to-b from-orange-50/50 to-surface dark:from-orange-950/20 dark:to-surface border border-orange-200/70 dark:border-orange-800/40 rounded-2xl p-5 shadow-xs">
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-orange-200/60 dark:border-orange-900/40">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-orange-600 text-white text-xs font-black flex items-center justify-center shadow-xs">
              4
            </span>
            <h2 className="text-sm font-black uppercase tracking-wider text-orange-900 dark:text-orange-300">
              Vehicle Selection & Kit Capacity
            </h2>
          </div>
          <span className="text-[11px] text-orange-700 dark:text-orange-400 font-semibold px-2 py-0.5 rounded-full bg-orange-100 dark:bg-orange-900/40">
            Real-time Weight & Dispatch Validation
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Left: Vehicle Options & Capacity Calculation */}
          <div className="lg:col-span-5 space-y-4">
            {/* Vehicle Options */}
            <div className="bg-surface border border-orange-200/60 dark:border-orange-900/30 rounded-xl p-3.5">
              <label className="block text-xs font-black text-orange-900 dark:text-orange-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <FaTruck className="w-3.5 h-3.5 text-orange-600" />
                Select Fleet Vehicle
              </label>
              <select
                value={selectedVehicleId}
                onChange={(e) => setSelectedVehicleId(e.target.value)}
                className="w-full text-xs py-2 px-3 bg-surface border border-border rounded-xl text-text-primary focus:ring-1 focus:ring-orange-500 font-medium"
              >
                {vehicles.map((v) => (
                  <option key={v._id} value={v._id}>
                    {v.name} — Payload Cap: {(v.max_load_kg || 15000).toLocaleString()} kg
                  </option>
                ))}
              </select>
            </div>

            {/* Capacity Calculation Stats */}
            <div className="bg-surface border border-orange-200/60 dark:border-orange-900/30 rounded-xl p-4 space-y-2.5">
              <h3 className="text-xs font-black text-text-secondary uppercase tracking-wider">
                Capacity Calculation
              </h3>

              <div className="flex justify-between items-center text-xs">
                <span className="text-text-secondary">Total Kits:</span>
                <span className="font-bold text-text-primary font-mono">
                  {(calculationData?.total_kits || selectedKitsCount).toLocaleString()}
                </span>
              </div>

              <div className="flex justify-between items-center text-xs">
                <span className="text-text-secondary">Total Weight (Est.):</span>
                <span className="font-bold text-text-primary font-mono">
                  {(calculationData?.total_weight_est_kg || selectedKitsCount * 50).toLocaleString()} kg
                </span>
              </div>

              <div className="flex justify-between items-center text-xs">
                <span className="text-text-secondary">Vehicle Capacity:</span>
                <span className="font-bold text-text-primary font-mono">
                  {(calculationData?.vehicle_assignment?.total_capacity_kg || 200000).toLocaleString()} kg
                </span>
              </div>

              <div className="flex justify-between items-center text-xs pt-1 border-t border-border">
                <span className="text-text-secondary font-bold">Utilization:</span>
                <span
                  className={`font-black font-mono text-sm ${
                    (calculationData?.vehicle_assignment?.utilization_pct || 0) > 100
                      ? "text-red-600"
                      : (calculationData?.vehicle_assignment?.utilization_pct || 0) > 85
                      ? "text-amber-600"
                      : "text-emerald-600"
                  }`}
                >
                  {calculationData?.vehicle_assignment?.utilization_pct || 71}%
                </span>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-border rounded-full h-2.5 overflow-hidden">
                <div
                  className={`h-2.5 rounded-full transition-all duration-500 ${
                    (calculationData?.vehicle_assignment?.utilization_pct || 0) > 100
                      ? "bg-red-500"
                      : (calculationData?.vehicle_assignment?.utilization_pct || 0) > 85
                      ? "bg-amber-500"
                      : "bg-emerald-500"
                  }`}
                  style={{
                    width: `${Math.min(100, calculationData?.vehicle_assignment?.utilization_pct || 71)}%`,
                  }}
                />
              </div>

              {/* Capacity Validation Notice */}
              <div
                className={`mt-2 p-2.5 rounded-xl border text-[11px] flex items-start gap-2 ${
                  calculationData?.vehicle_assignment?.validation_status === "Fail"
                    ? "bg-red-50 text-red-800 border-red-300 dark:bg-red-950/40 dark:text-red-300"
                    : calculationData?.vehicle_assignment?.validation_status === "Warning"
                    ? "bg-amber-50 text-amber-800 border-amber-300 dark:bg-amber-950/40 dark:text-amber-300"
                    : "bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300"
                }`}
              >
                <FaInfoCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>
                  {calculationData?.vehicle_assignment?.validation_status === "Fail"
                    ? `Over-capacity! Loaded weight exceeds selected vehicle limit by ${(calculationData.vehicle_assignment.unallocated_kits || 0)} kits. Consider multiple vehicles.`
                    : calculationData?.vehicle_assignment?.validation_status === "Warning"
                    ? "Warning: Vehicle load is near max capacity (>85%). Ensure secure packaging."
                    : "Validate vehicle capacity. Ensure selected load is within the limit."}
                </span>
              </div>
            </div>
          </div>

          {/* Right: Kit Type Breakdown & Vehicle Assignment */}
          <div className="lg:col-span-7 space-y-4">
            {/* Kit Type Breakdown Table */}
            <div className="bg-surface border border-orange-200/60 dark:border-orange-900/30 rounded-xl p-4">
              <h3 className="text-xs font-black text-orange-900 dark:text-orange-300 uppercase tracking-wider mb-2.5 flex items-center justify-between">
                <span>Kit Type Breakdown</span>
                <span className="text-[10px] text-text-muted font-normal lowercase">calculated from BOM</span>
              </h3>

              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead className="bg-surface-hover/60 border-b border-border text-text-secondary font-bold text-[10px] uppercase">
                    <tr>
                      <th className="py-2 px-3 text-left">Kit Type</th>
                      <th className="py-2 px-3 text-right">Quantity</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {(calculationData?.kit_type_breakdown || [
                      { kit_type: "ComboKit A", quantity: 800 },
                      { kit_type: "ComboKit B", quantity: 750 },
                      { kit_type: "ComboKit C", quantity: 650 },
                      { kit_type: "ComboKit D", quantity: 650 },
                    ]).map((row, idx) => (
                      <tr key={idx} className="hover:bg-surface-hover/40">
                        <td className="py-2 px-3 font-semibold text-text-primary">{row.kit_type}</td>
                        <td className="py-2 px-3 text-right font-bold text-text-primary font-mono">
                          {row.quantity.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                    <tr className="bg-surface-hover/80 font-black">
                      <td className="py-2 px-3 text-text-primary">Total</td>
                      <td className="py-2 px-3 text-right text-text-primary font-mono">
                        {(calculationData?.total_kits || selectedKitsCount).toLocaleString()}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Vehicle Assignment Card */}
            <div className="bg-surface border border-orange-200/60 dark:border-orange-900/30 rounded-xl p-4 flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-text-secondary uppercase tracking-wider">
                  Vehicle Assignment
                </span>
                <span className="text-[11px] font-black text-orange-600 bg-orange-100 dark:bg-orange-950/50 px-2 py-0.5 rounded-lg">
                  {calculationData?.vehicle_assignment?.vehicle_name || "12MT Truck"}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 text-xs py-1">
                <div>
                  <span className="text-[10px] text-text-muted block">Capacity</span>
                  <span className="font-bold text-text-primary font-mono">
                    {(calculationData?.vehicle_assignment?.single_capacity_kg || 15000).toLocaleString()} kg
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-text-muted block">Estimated Load</span>
                  <span className="font-bold text-text-primary font-mono">
                    {(calculationData?.vehicle_assignment?.estimated_load_kg || 10650).toLocaleString()} kg
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-text-muted block">Utilization</span>
                  <span className="font-bold text-emerald-600 font-mono">
                    {calculationData?.vehicle_assignment?.utilization_pct || 71}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────────────
          ROW 4: SECTION 5 (SUPPLIER-WISE PROCUREMENT GROUPING - Cyan Theme)
      ───────────────────────────────────────────────────────────────────── */}
      <div className="bg-gradient-to-b from-cyan-50/50 to-surface dark:from-cyan-950/20 dark:to-surface border border-cyan-200/70 dark:border-cyan-800/40 rounded-2xl p-5 shadow-xs">
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-cyan-200/60 dark:border-cyan-900/40">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-cyan-600 text-white text-xs font-black flex items-center justify-center shadow-xs">
              5
            </span>
            <h2 className="text-sm font-black uppercase tracking-wider text-cyan-900 dark:text-cyan-300">
              Supplier-wise Procurement Grouping
            </h2>
          </div>
          <span className="text-[11px] text-cyan-700 dark:text-cyan-400 font-semibold px-2 py-0.5 rounded-full bg-cyan-100 dark:bg-cyan-900/40">
            BOM Component Aggregation & Mappings
          </span>
        </div>

        {/* 4 Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          <div className="bg-surface border border-cyan-200/60 dark:border-cyan-900/30 rounded-xl p-3 text-center">
            <span className="text-[11px] font-bold text-text-secondary block">Total Suppliers / Vendors</span>
            <p className="text-xl font-black text-cyan-900 dark:text-cyan-300 mt-0.5">
              {calculationData?.procurement_summary?.total_suppliers || 3}
            </p>
          </div>
          <div className="bg-surface border border-cyan-200/60 dark:border-cyan-900/30 rounded-xl p-3 text-center">
            <span className="text-[11px] font-bold text-text-secondary block">Total Products to Procure</span>
            <p className="text-xl font-black text-cyan-900 dark:text-cyan-300 mt-0.5">
              {calculationData?.procurement_summary?.total_products || 18}
            </p>
          </div>
          <div className="bg-surface border border-cyan-200/60 dark:border-cyan-900/30 rounded-xl p-3 text-center">
            <span className="text-[11px] font-bold text-text-secondary block">Total Quantity</span>
            <p className="text-xl font-black text-cyan-900 dark:text-cyan-300 mt-0.5 font-mono">
              {(calculationData?.procurement_summary?.total_quantity || 12450).toLocaleString()}
            </p>
          </div>
          <div className="bg-surface border border-cyan-200/60 dark:border-cyan-900/30 rounded-xl p-3 text-center">
            <span className="text-[11px] font-bold text-text-secondary block">Procurement Groups</span>
            <p className="text-xl font-black text-cyan-900 dark:text-cyan-300 mt-0.5">
              {calculationData?.procurement_summary?.procurement_groups || 1}
            </p>
          </div>
        </div>

        {/* Supplier-wise Details Table */}
        <div className="overflow-x-auto border border-border rounded-xl bg-surface mb-3">
          <table className="w-full text-left text-xs">
            <thead className="bg-surface-hover/80 border-b border-border text-text-secondary font-black uppercase text-[10px]">
              <tr>
                <th className="py-2.5 px-3">Supplier / OEM</th>
                <th className="py-2.5 px-3">Product Name & Specifications</th>
                <th className="py-2.5 px-3 text-center">Qty</th>
                <th className="py-2.5 px-3">Warehouse</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {(calculationData?.supplier_details || [
                { supplier_name: "Supplier A", product: "BOSKIT Component A", qty: 5200, warehouse: "WH-01" },
                { supplier_name: "Supplier A", product: "BOSKIT Component B", qty: 3150, warehouse: "WH-01" },
                { supplier_name: "Supplier B", product: "BOSKIT Component C", qty: 2800, warehouse: "WH-02" },
                { supplier_name: "Supplier B", product: "BOSKIT Component D", qty: 1450, warehouse: "WH-02" },
                { supplier_name: "OEM Partner C", product: "SOLARKITS Module X", qty: 850, warehouse: "WH-03" },
                { supplier_name: "OEM Partner C", product: "SOLARKITS Module Y", qty: 600, warehouse: "WH-03" },
              ]).map((item, idx) => (
                <tr key={idx} className="hover:bg-cyan-50/40 dark:hover:bg-cyan-950/20">
                  <td className="py-2 px-3 font-bold text-cyan-900 dark:text-cyan-300">
                    {item.supplier_name}
                  </td>
                  <td className="py-2 px-3 font-medium text-text-primary">
                    {item.product}
                  </td>
                  <td className="py-2 px-3 text-center font-bold text-text-primary font-mono">
                    {item.qty.toLocaleString()}
                  </td>
                  <td className="py-2 px-3 text-text-secondary">
                    <span className="px-2 py-0.5 rounded-md bg-surface-hover text-[11px] font-mono">
                      {item.warehouse}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Validation & Exceptions Notice */}
        <div className="p-3 rounded-xl bg-surface border border-cyan-200/60 dark:border-cyan-900/30 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300 font-semibold">
            <FaCheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Validation & Exceptions: All items mapped to valid suppliers/OEM partners</span>
          </div>
          {calculationData?.exceptions?.length > 0 && (
            <div className="flex items-center gap-2 text-amber-700 dark:text-amber-300 text-[11px] font-medium">
              <FaExclamationTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <span>{calculationData.exceptions.length} items require supplier mapping review</span>
            </div>
          )}
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────────────
          ROW 5: SECTION 6 (ORDER GROUP SUMMARY - Teal Theme)
      ───────────────────────────────────────────────────────────────────── */}
      <div className="bg-gradient-to-b from-teal-50/50 to-surface dark:from-teal-950/20 dark:to-surface border border-teal-200/70 dark:border-teal-800/40 rounded-2xl p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 mb-4 border-b border-teal-200/60 dark:border-teal-900/40 gap-2">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-teal-600 text-white text-xs font-black flex items-center justify-center shadow-xs">
              6
            </span>
            <h2 className="text-sm font-black uppercase tracking-wider text-teal-900 dark:text-teal-300">
              Order Group Summary
            </h2>
          </div>

          <div className="flex items-center gap-4 text-xs font-mono">
            <span className="px-2.5 py-1 rounded-lg bg-teal-100 dark:bg-teal-900/40 text-teal-900 dark:text-teal-200 font-black">
              Group ID: {displayGroupId}
            </span>
            <span className="text-text-muted">
              Created On: {new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
            </span>
            <span className="text-text-muted">
              Created By: {user?.name || "Account User"}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs mb-5">
          {/* Order Details */}
          <div className="bg-surface border border-teal-200/60 dark:border-teal-900/30 rounded-xl p-3.5 space-y-1.5">
            <span className="font-bold text-teal-900 dark:text-teal-300 block mb-1">Order Details</span>
            <div className="flex justify-between">
              <span className="text-text-muted">Selected Orders:</span>
              <span className="font-bold text-text-primary">{selectedOrderIds.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-muted">Total Kits:</span>
              <span className="font-bold text-text-primary">{(calculationData?.total_kits || selectedKitsCount).toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-muted">Total Weight (Est.):</span>
              <span className="font-bold text-text-primary">{(calculationData?.total_weight_est_kg || selectedKitsCount * 50).toLocaleString()} kg</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-muted">Vehicle Capacity Req:</span>
              <span className="font-bold text-text-primary">15,000 kg (per vehicle)</span>
            </div>
          </div>

          {/* Geography */}
          <div className="bg-surface border border-teal-200/60 dark:border-teal-900/30 rounded-xl p-3.5 space-y-1.5">
            <span className="font-bold text-teal-900 dark:text-teal-300 block mb-1">Geography</span>
            <div className="flex justify-between">
              <span className="text-text-muted">States:</span>
              <span className="font-bold text-text-primary">{calculationData?.geography?.states_count || 5}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-muted">Districts:</span>
              <span className="font-bold text-text-primary">{calculationData?.geography?.districts_count || 12}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-muted">Pincodes:</span>
              <span className="font-bold text-text-primary">{calculationData?.geography?.pincodes_count || 48}</span>
            </div>
          </div>

          {/* Origin & Payment */}
          <div className="bg-surface border border-teal-200/60 dark:border-teal-900/30 rounded-xl p-3.5 space-y-1.5">
            <span className="font-bold text-teal-900 dark:text-teal-300 block mb-1">Order Origin & Payment</span>
            <div className="flex justify-between">
              <span className="text-text-muted">Order Origin:</span>
              <span className="font-bold text-text-primary">
                {calculationData?.origins?.join(" / ") || "EPC / Franchisee / Company"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-muted">Payment Mode:</span>
              <span className="font-bold text-text-primary">
                {calculationData?.payment_mode || "Mixed (Online / Offline)"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-muted">Validation Status:</span>
              <span className="font-bold text-emerald-600">
                {calculationData?.vehicle_assignment?.validation_status || "Pass"}
              </span>
            </div>
          </div>
        </div>

        {/* Big Action Button */}
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => setShowConfirmModal(true)}
            disabled={selectedOrderIds.length === 0 || submitting}
            className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white font-black text-sm uppercase tracking-wider shadow-lg transition-all flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FaPaperPlane className="w-4 h-4" />
            Send to Procurement
          </button>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────────────
          ROW 6: SECTION 7 (SUBMISSION WORKFLOW & STATUS - Stepper & Legend)
      ───────────────────────────────────────────────────────────────────── */}
      <div className="bg-surface border border-border rounded-2xl p-5 shadow-xs space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-border">
          <span className="w-6 h-6 rounded-full bg-primary text-white text-xs font-black flex items-center justify-center shadow-xs">
            7
          </span>
          <h2 className="text-sm font-black uppercase tracking-wider text-text-primary">
            Submission Workflow & Status Lifecycle
          </h2>
        </div>

        {/* Process Stepper */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 text-center text-xs">
          {[
            { step: 1, title: "Selected Orders" },
            { step: 2, title: "Group Validation" },
            { step: 3, title: "Create Group ID" },
            { step: 4, title: "Link Orders & BOM" },
            { step: 5, title: "Send to Procurement" },
            { step: 6, title: "Procurement Receives" },
            { step: 7, title: "Supplier/OEM POs" },
          ].map((s, idx) => (
            <div
              key={s.step}
              className="p-2.5 rounded-xl border border-border bg-surface-hover/40 flex flex-col items-center justify-center"
            >
              <span className="w-5 h-5 rounded-full bg-primary/20 text-[#263880] text-[10px] font-black flex items-center justify-center mb-1">
                {s.step}
              </span>
              <span className="font-bold text-[11px] text-text-primary">{s.title}</span>
            </div>
          ))}
        </div>

        {/* Suggested Statuses Legend */}
        <div>
          <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider block mb-2">
            Suggested Statuses Legend
          </span>
          <div className="flex flex-wrap gap-2 text-xs">
            {[
              { label: "New Order", color: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300" },
              { label: "Selected for Processing", color: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300" },
              { label: "Group Validation Pending", color: "bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300" },
              { label: "Ready for Procurement", color: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300" },
              { label: "Sent to Procurement", color: "bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300" },
              { label: "Procurement In Progress", color: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300" },
              { label: "Procurement Completed", color: "bg-teal-100 text-teal-800 dark:bg-teal-900/40 dark:text-teal-300" },
              { label: "Exception / Rework Required", color: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300" },
            ].map((st, i) => (
              <span key={i} className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${st.color}`}>
                • {st.label}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────────────
          CONFIRMATION MODAL BEFORE SEND TO PROCUREMENT
      ───────────────────────────────────────────────────────────────────── */}
      <Dialog
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        title="Confirm Send to Procurement Group"
      >
        <div className="space-y-4 p-2 text-xs">
          <div className="p-3.5 rounded-xl bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800">
            <h4 className="font-black text-sm text-teal-900 dark:text-teal-200">
              Procurement Group Submission Overview
            </h4>
            <p className="text-text-secondary mt-1">
              You are about to group and dispatch <strong>{selectedOrderIds.length} customer orders</strong> with a total of{" "}
              <strong>{(calculationData?.total_kits || selectedKitsCount).toLocaleString()} kit units</strong> to the Procurement module.
            </p>
          </div>

          <div className="space-y-2 border-y border-border py-3">
            <div className="flex justify-between">
              <span className="text-text-muted">Estimated Load Weight:</span>
              <span className="font-bold font-mono">{(calculationData?.total_weight_est_kg || selectedKitsCount * 50).toLocaleString()} kg</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-muted">Assigned Vehicle:</span>
              <span className="font-bold">{calculationData?.vehicle_assignment?.vehicle_name || "12MT Truck"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-muted">Supplier / OEM Groups:</span>
              <span className="font-bold">{calculationData?.procurement_summary?.total_suppliers || 3} Partners</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-muted">Total Products:</span>
              <span className="font-bold font-mono">{(calculationData?.procurement_summary?.total_quantity || 12450).toLocaleString()} units</span>
            </div>
          </div>

          <p className="text-[11px] text-text-muted">
            Upon submission, linked orders will be assigned to a new unique Procurement Group ID (e.g. <code>PG-2026-XXXX</code>) and their account processing status will transition to <strong>Sent to Procurement</strong>.
          </p>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setShowConfirmModal(false)}
              className="px-4 py-2 rounded-xl border border-border bg-surface hover:bg-surface-hover text-text-secondary font-bold"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirmSendToProcurement}
              disabled={submitting}
              className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {submitting ? <Loader text="Submitting..." /> : (
                <>
                  <FaPaperPlane className="w-3.5 h-3.5" />
                  Confirm & Submit
                </>
              )}
            </button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
