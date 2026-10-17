import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import {
  FaBoxes, FaShoppingCart, FaSearch, FaFilter, FaTruck, FaWarehouse,
  FaCheckCircle, FaExclamationTriangle, FaTimesCircle, FaPaperPlane,
  FaRedo, FaLayerGroup, FaMapMarkerAlt, FaFileInvoice, FaBuilding,
  FaArrowRight, FaClock, FaCheck, FaInfoCircle, FaChevronRight,
  FaShieldAlt, FaExternalLinkAlt, FaTimes, FaExchangeAlt, FaCreditCard,
  FaPlus, FaLock, FaUnlock, FaEye, FaSyncAlt
} from "react-icons/fa";

import {
  getBatchReadyOrders,
  calculateProcurementBom,
  reserveInventoryStock,
  releaseInventoryStock,
  createPurchaseIndent,
  getPurchaseIndents,
  requestSupplierPayment,
  adminApproveSupplierPayment,
  recordBankPayment,
  saveSupplyFulfilment,
  supplierUpdateDispatch,
  warehouseConfirmInward,
  handoverToDeliveryManager
} from "../../api/accounts";

import PageHeader from "../../components/PageHeader";
import Button from "../../components/Button";
import Dialog from "../../components/Dialog";
import Loader from "../../components/Loader";
import CustomInput from "../../components/CustomInput";

// Sub-modals
import PurchaseIndentModal from "../../components/procurement/PurchaseIndentModal";
import SupplierPaymentModal from "../../components/procurement/SupplierPaymentModal";
import SupplyFulfilmentModal from "../../components/procurement/SupplyFulfilmentModal";
import InwardVerificationModal from "../../components/procurement/InwardVerificationModal";

export default function Procurement() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.user_slice || {});

  // Main State
  const [batches, setBatches] = useState([]);
  const [loadingBatches, setLoadingBatches] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  const selectedBatchRef = useRef(selectedBatch);
  useEffect(() => {
    selectedBatchRef.current = selectedBatch;
  }, [selectedBatch]);

  // Selection Handler that persists to localStorage and URL
  const handleSelectBatch = useCallback((batch) => {
    if (!batch) return;
    setSelectedBatch(batch);
    setSelectedOrder(null);
    if (batch.group_id) {
      try {
        localStorage.setItem("active_procurement_group_id", batch.group_id);
      } catch (e) {
        console.error("Failed to save to localStorage:", e);
      }
      setSearchParams(prev => {
        const next = new URLSearchParams(prev);
        if (next.get("group_id") !== batch.group_id) {
          next.set("group_id", batch.group_id);
        }
        return next;
      }, { replace: true });
    }
  }, [setSearchParams]);

  // BOM & Calculation State
  const [bomData, setBomData] = useState(null);
  const [loadingBom, setLoadingBom] = useState(false);

  // Purchase Indents State
  const [purchaseIndents, setPurchaseIndents] = useState([]);
  const [loadingPIs, setLoadingPIs] = useState(false);

  // Reservation In-Progress
  const [reservingSku, setReservingSku] = useState(null);
  const [reserveInputQty, setReserveInputQty] = useState({});

  // Modals Control
  const [piModalOpen, setPiModalOpen] = useState(false);
  const [activeBomItemForPI, setActiveBomItemForPI] = useState(null);

  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [activePIForPayment, setActivePIForPayment] = useState(null);

  const [fulfilmentModalOpen, setFulfilmentModalOpen] = useState(false);
  const [activePIForFulfilment, setActivePIForFulfilment] = useState(null);

  const [inwardModalOpen, setInwardModalOpen] = useState(false);
  const [activePIForInward, setActivePIForInward] = useState(null);

  // Notification Toast
  const [notification, setNotification] = useState(null);
  const showNotification = (type, message) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 6000);
  };

  // ───────────────────────────────────────────────────────────────────────────
  // 1. Fetch Batch Ready Orders
  // ───────────────────────────────────────────────────────────────────────────
  const fetchBatches = useCallback(async () => {
    setLoadingBatches(true);
    try {
      const res = await getBatchReadyOrders({
        status: filterStatus === "all" ? undefined : filterStatus
      });
      if (res?.data) {
        setBatches(res.data);

        // Pre-selection priority:
        // 1. URL group_id
        // 2. localStorage saved group_id
        // 3. Previously active batch
        // 4. First batch in returned list
        const urlId = new URLSearchParams(window.location.search).get("group_id") || "";
        let savedId = "";
        try {
          savedId = localStorage.getItem("active_procurement_group_id") || "";
        } catch (e) {}

        const targetId = urlId || savedId;
        let matched = null;

        if (targetId) {
          matched = res.data.find(b => b.group_id?.toLowerCase() === targetId.toLowerCase());
        }

        if (!matched && selectedBatchRef.current) {
          matched = res.data.find(b => b.group_id === selectedBatchRef.current.group_id);
        }

        if (!matched && res.data.length > 0) {
          matched = res.data[0];
        }

        if (matched) {
          setSelectedBatch(matched);
          setSelectedOrder(null);
          try {
            localStorage.setItem("active_procurement_group_id", matched.group_id);
          } catch (e) {}
          setSearchParams(prev => {
            const next = new URLSearchParams(prev);
            if (next.get("group_id") !== matched.group_id) {
              next.set("group_id", matched.group_id);
            }
            return next;
          }, { replace: true });
        }
      }
    } catch (err) {
      console.error("Failed to load batch ready orders:", err);
      showNotification("error", "Failed to load batches from New Orders.");
    } finally {
      setLoadingBatches(false);
    }
  }, [filterStatus, setSearchParams]);

  useEffect(() => {
    fetchBatches();
  }, [fetchBatches]);

  // ───────────────────────────────────────────────────────────────────────────
  // 2. Fetch BOM & Live Stock Calculations for Selected Batch or Order
  // ───────────────────────────────────────────────────────────────────────────
  const fetchBom = useCallback(async () => {
    if (!selectedBatch && !selectedOrder) return;
    setLoadingBom(true);
    try {
      const payload = {
        group_id: selectedBatch?.group_id,
        order_id: selectedOrder?.id,
        warehouse_id: selectedBatch?.supplier_groups?.[0]?.warehouse_id
      };
      const res = await calculateProcurementBom(payload);
      if (res?.data) {
        setBomData(res.data);
      }
    } catch (err) {
      console.error("BOM calculation error:", err);
      showNotification("error", "Failed to calculate BOM and inventory levels.");
    } finally {
      setLoadingBom(false);
    }
  }, [selectedBatch, selectedOrder]);

  // ───────────────────────────────────────────────────────────────────────────
  // 3. Fetch Purchase Indents for Current Selection
  // ───────────────────────────────────────────────────────────────────────────
  const fetchPIs = useCallback(async () => {
    if (!selectedBatch && !selectedOrder) return;
    setLoadingPIs(true);
    try {
      const params = {};
      if (selectedBatch) params.group_id = selectedBatch.group_id;
      if (selectedOrder) params.order_number = selectedOrder.order_number;

      const res = await getPurchaseIndents(params);
      if (res?.data) {
        setPurchaseIndents(res.data);
      }
    } catch (err) {
      console.error("Error fetching purchase indents:", err);
    } finally {
      setLoadingPIs(false);
    }
  }, [selectedBatch, selectedOrder]);

  useEffect(() => {
    if (selectedBatch || selectedOrder) {
      fetchBom();
      fetchPIs();
    }
  }, [selectedBatch, selectedOrder, fetchBom, fetchPIs]);

  // ───────────────────────────────────────────────────────────────────────────
  // 4. Action: Reserve Warehouse Stock (Option A)
  // ───────────────────────────────────────────────────────────────────────────
  const handleReserveStock = async (bomItem) => {
    const inputVal = reserveInputQty[bomItem.sku_code];
    const qtyToReserve = inputVal !== undefined ? Number(inputVal) : Math.min(bomItem.free_warehouse_stock, bomItem.required_quantity);

    if (qtyToReserve <= 0) {
      showNotification("error", "Please specify a quantity greater than 0 to reserve.");
      return;
    }

    if (qtyToReserve > bomItem.free_warehouse_stock && bomItem.free_warehouse_stock > 0) {
      showNotification("error", `Cannot reserve more than free warehouse stock (${bomItem.free_warehouse_stock}).`);
      return;
    }

    setReservingSku(bomItem.sku_code);
    try {
      const orderNumber = selectedOrder?.order_number || selectedBatch?.order_numbers?.[0] || "ORD-COMBINED-01";
      const payload = {
        warehouse_id: bomData?.destination_warehouse?.id || "670000000000000000000001",
        sku_code: bomItem.sku_code,
        sku_id: bomItem.sku_id,
        product_name: bomItem.product_name,
        customer_order_number: orderNumber,
        customer_order_id: selectedOrder?.id || null,
        order_group_id: selectedBatch?.group_id || null,
        quantity: qtyToReserve
      };

      const res = await reserveInventoryStock(payload);
      if (res?.status === "success") {
        showNotification("success", res.message);
        // Refresh BOM & reservations
        fetchBom();
        fetchBatches();
      }
    } catch (err) {
      console.error("Reservation error:", err);
      showNotification("error", err.response?.data?.message || "Failed to reserve inventory.");
    } finally {
      setReservingSku(null);
    }
  };

  // ───────────────────────────────────────────────────────────────────────────
  // 5. Action: Open PI Creation Modal (Option B)
  // ───────────────────────────────────────────────────────────────────────────
  const handleOpenPiModal = (bomItem) => {
    setActiveBomItemForPI(bomItem);
    setPiModalOpen(true);
  };

  const handleCreatePiSubmit = async (payload) => {
    try {
      const res = await createPurchaseIndent(payload);
      if (res?.status === "success") {
        showNotification("success", res.message);
        setPiModalOpen(false);
        fetchPIs();
        fetchBom();
        fetchBatches();
      }
    } catch (err) {
      console.error("PI creation error:", err);
      showNotification("error", err.response?.data?.message || "Failed to create Purchase Indent.");
    }
  };

  // ───────────────────────────────────────────────────────────────────────────
  // 6. Action: Payment Workflows
  // ───────────────────────────────────────────────────────────────────────────
  const handleOpenPaymentModal = (pi) => {
    setActivePIForPayment(pi);
    setPaymentModalOpen(true);
  };

  const handleRequestPayment = async (payload) => {
    try {
      const res = await requestSupplierPayment(payload);
      if (res?.status === "success") {
        showNotification("success", res.message);
        setPaymentModalOpen(false);
        fetchPIs();
      }
    } catch (err) {
      showNotification("error", err.response?.data?.message || "Failed to request payment.");
    }
  };

  const handleAdminApproval = async (payload) => {
    try {
      const res = await adminApproveSupplierPayment(payload);
      if (res?.status === "success") {
        showNotification("success", res.message);
        setPaymentModalOpen(false);
        fetchPIs();
      }
    } catch (err) {
      showNotification("error", err.response?.data?.message || "Admin approval failed.");
    }
  };

  const handleRecordBankPayment = async (payload) => {
    try {
      const res = await recordBankPayment(payload);
      if (res?.status === "success") {
        showNotification("success", res.message);
        setPaymentModalOpen(false);
        fetchPIs();
      }
    } catch (err) {
      showNotification("error", err.response?.data?.message || "Failed to record bank payment.");
    }
  };

  // ───────────────────────────────────────────────────────────────────────────
  // 7. Action: Fulfilment Method & Dates
  // ───────────────────────────────────────────────────────────────────────────
  const handleOpenFulfilmentModal = (pi) => {
    setActivePIForFulfilment(pi);
    setFulfilmentModalOpen(true);
  };

  const handleSaveFulfilment = async (payload) => {
    try {
      const res = await saveSupplyFulfilment(payload);
      if (res?.status === "success") {
        showNotification("success", res.message);
        setFulfilmentModalOpen(false);
        fetchPIs();
      }
    } catch (err) {
      showNotification("error", err.response?.data?.message || "Failed to save fulfilment details.");
    }
  };

  const handleUpdateDispatchStatus = async (payload) => {
    try {
      const res = await supplierUpdateDispatch(payload);
      if (res?.status === "success") {
        showNotification("success", res.message);
        setFulfilmentModalOpen(false);
        fetchPIs();
      }
    } catch (err) {
      showNotification("error", err.response?.data?.message || "Failed to update dispatch status.");
    }
  };

  // ───────────────────────────────────────────────────────────────────────────
  // 8. Action: Inward Receipt Verification
  // ───────────────────────────────────────────────────────────────────────────
  const handleOpenInwardModal = (pi) => {
    setActivePIForInward(pi);
    setInwardModalOpen(true);
  };

  const handleConfirmInward = async (payload) => {
    try {
      const res = await warehouseConfirmInward(payload);
      if (res?.status === "success") {
        showNotification("success", res.message);
        setInwardModalOpen(false);
        fetchPIs();
        fetchBom();
        fetchBatches();
      }
    } catch (err) {
      showNotification("error", err.response?.data?.message || "Inward verification failed.");
    }
  };

  // ───────────────────────────────────────────────────────────────────────────
  // 9. Action: Validate Procurement Readiness & Hand Over to Delivery Manager
  // ───────────────────────────────────────────────────────────────────────────
  const handleHandoverToDelivery = async () => {
    if (!selectedBatch && !selectedOrder) return;
    try {
      const payload = {
        group_id: selectedBatch?.group_id,
        order_number: selectedOrder?.order_number
      };

      const res = await handoverToDeliveryManager(payload);
      if (res?.status === "success") {
        showNotification("success", res.message);
        fetchBatches();
        // Redirect to Delivery Queue with notification
        setTimeout(() => {
          navigate("/warehouse-management-panel/delivery-management");
        }, 1500);
      }
    } catch (err) {
      console.error("Handover error:", err);
      showNotification("error", err.response?.data?.message || "Delivery handover validation failed.");
    }
  };

  // Filtered Batches List
  const filteredBatches = useMemo(() => {
    return batches.filter(b => {
      const q = searchTerm.trim().toLowerCase();
      const matchSearch =
        !q ||
        b.group_id?.toLowerCase().includes(q) ||
        (b.order_numbers || []).some(n => n?.toLowerCase().includes(q)) ||
        (b.geographic_summary?.states || []).some(s => s?.toLowerCase().includes(q)) ||
        (b.geographic_summary?.districts || []).some(d => d?.toLowerCase().includes(q));

      const matchStatus =
        filterStatus === "all" ||
        (filterStatus === "Batch Ready" && ["Batch Ready", "Ready for Procurement", "Sent to Procurement"].includes(b.status)) ||
        b.status === filterStatus;

      return matchSearch && matchStatus;
    });
  }, [batches, searchTerm, filterStatus]);

  // Readiness state calculation
  const currentReadiness = useMemo(() => {
    if (!selectedBatch) return "Procurement In Progress";
    if (selectedBatch.procurement_readiness_status) return selectedBatch.procurement_readiness_status;

    if (purchaseIndents.length === 0) return "Procurement In Progress";
    const allInward = purchaseIndents.every(pi => pi.fulfilment?.supply_status === "Inward Completed");
    if (allInward) return "Ready for Kit Preparation";

    const hasInTransit = purchaseIndents.some(pi => ["In Transit", "Dispatched", "Picked Up"].includes(pi.fulfilment?.supply_status));
    if (hasInTransit) return "Awaiting Warehouse Inward";

    return "Procurement In Progress";
  }, [selectedBatch, purchaseIndents]);

  return (
    <div className="space-y-6 pb-20">
      
      {/* Toast Notification */}
      {notification && (
        <div className={`fixed top-5 right-5 z-50 p-4 rounded-xl shadow-lg border text-sm font-bold flex items-center gap-3 transition-all ${
          notification.type === "error"
            ? "bg-red-500/10 text-red-600 border-red-500/30"
            : "bg-emerald-500/10 text-emerald-600 border-emerald-500/30"
        }`}>
          {notification.type === "error" ? <FaTimesCircle /> : <FaCheckCircle />}
          <span>{notification.message}</span>
        </div>
      )}

      {/* Page Header */}
      <PageHeader
        title="Procurement Module"
        description="Receive Batch Ready orders from New Orders, configure warehouse stock reservations vs supplier/OEM Purchase Indents, manage fulfilment methods and payments, and hand over to Delivery Manager."
      />

      {/* ─────────────────────────────────────────────────────────────────────
          TOP WORKFLOW PROGRESSION BANNER (New Orders -> Batch Ready -> Procurement -> Delivery)
      ───────────────────────────────────────────────────────────────────── */}
      <div className="bg-surface border border-border rounded-2xl p-4 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-600 font-black flex items-center justify-center text-[11px]">
              1
            </span>
            <span className="font-bold text-text-primary">New Orders Batch Preparation</span>
            <FaChevronRight className="text-text-muted text-[10px]" />
          </div>

          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-600 font-black flex items-center justify-center text-[11px]">
              2
            </span>
            <span className="font-bold text-emerald-600 dark:text-emerald-400">Batch Ready Orders</span>
            <FaChevronRight className="text-text-muted text-[10px]" />
          </div>

          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-primary text-white font-black flex items-center justify-center text-[11px] shadow-sm">
              3
            </span>
            <span className="font-black text-primary">Procurement Sourcing (BOM, Stock, PI)</span>
            <FaChevronRight className="text-text-muted text-[10px]" />
          </div>

          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-surface-hover text-text-muted font-bold flex items-center justify-center text-[11px]">
              4
            </span>
            <span className="font-bold text-text-muted">Delivery Manager Dispatch Handover</span>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────────────
          MAIN LAYOUT: BATCH SELECTOR (LEFT) + WORKBENCH (RIGHT)
      ───────────────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT COLUMN: Batches & Orders Explorer */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-surface border border-border rounded-2xl p-4 shadow-xs space-y-3">
            
            <div className="flex items-center justify-between border-b border-border/60 pb-2.5">
              <div className="flex items-center gap-2">
                <FaLayerGroup className="text-primary text-sm" />
                <h3 className="text-xs font-black uppercase tracking-wider text-text-primary">
                  Batches from New Orders
                </h3>
              </div>
              <button
                type="button"
                onClick={fetchBatches}
                className="text-xs text-text-muted hover:text-primary transition-colors cursor-pointer"
                title="Refresh Batches"
              >
                <FaSyncAlt className={loadingBatches ? "animate-spin" : ""} />
              </button>
            </div>

            {/* Search Input */}
            <div className="relative">
              <FaSearch className="absolute left-3 top-3 text-text-muted text-xs" />
              <input
                type="text"
                placeholder="Search batch ID, order, state..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-bg border border-border rounded-xl text-xs text-text-primary focus:outline-hidden focus:border-primary"
              />
            </div>

            {/* Filter Pills */}
            <div className="flex gap-1.5 overflow-x-auto pb-1 text-[10px] font-bold">
              {["all", "Batch Ready", "Procurement In Progress", "Transferred to Delivery"].map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setFilterStatus(st)}
                  className={`px-2.5 py-1 rounded-lg border whitespace-nowrap cursor-pointer transition-all ${
                    filterStatus === st
                      ? "bg-primary text-white border-primary"
                      : "bg-bg text-text-muted border-border hover:border-primary/40"
                  }`}
                >
                  {st === "all" ? "All Batches" : st}
                </button>
              ))}
            </div>

            {/* Batch Cards List */}
            <div className="space-y-2.5 max-h-[600px] overflow-y-auto pr-1">
              {loadingBatches ? (
                <div className="py-8 text-center text-xs text-text-muted">Loading batches...</div>
              ) : filteredBatches.length === 0 ? (
                <div className="py-8 text-center text-xs text-text-muted italic bg-bg/50 rounded-xl border border-border/40 p-4">
                  No batches matching current filter. Prepare customer orders in New Orders to generate batches.
                </div>
              ) : (
                filteredBatches.map((batch) => {
                  const isSelected = selectedBatch?.group_id === batch.group_id;
                  return (
                    <div
                      key={batch.group_id}
                      onClick={() => handleSelectBatch(batch)}
                      className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                        isSelected
                          ? "bg-primary/5 border-primary shadow-xs ring-1 ring-primary/20"
                          : "bg-surface border-border hover:border-primary/40"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-text-primary font-mono">
                          #{batch.group_id}
                        </span>
                        <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md border ${
                          batch.status === "Batch Ready" || batch.status === "Sent to Procurement"
                            ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                            : batch.status === "Transferred to Delivery"
                              ? "bg-purple-500/10 text-purple-600 border-purple-500/20"
                              : "bg-blue-500/10 text-blue-600 border-blue-500/20"
                        }`}>
                          {batch.status || "Batch Ready"}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 mt-2 text-[11px]">
                        <div>
                          <span className="text-text-muted block text-[10px]">Total Kits</span>
                          <span className="font-bold text-text-primary">{batch.total_kits || 1} Kits</span>
                        </div>
                        <div>
                          <span className="text-text-muted block text-[10px]">Orders</span>
                          <span className="font-bold text-text-primary">{batch.order_count || batch.order_numbers?.length || 1} Orders</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-[10px] text-text-muted mt-2 pt-2 border-t border-border/40">
                        <span className="truncate max-w-[150px]">
                          📍 {(batch.geographic_summary?.districts || ["Rajkot"])[0]}, {(batch.geographic_summary?.states || ["Gujarat"])[0]}
                        </span>
                        <span className="font-mono text-primary font-bold">
                          {batch.purchase_indents?.length || 0} PIs
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

          </div>
        </div>

        {/* RIGHT COLUMN: PROCUREMENT WORKBENCH */}
        <div className="lg:col-span-8 space-y-5">
          
          {/* Header Card for Selected Batch */}
          {selectedBatch ? (
            <div className="bg-surface border border-border rounded-2xl p-5 shadow-xs space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black uppercase tracking-wider text-primary">
                      Active Order Group
                    </span>
                    <span className="text-base font-black text-text-primary font-mono">
                      #{selectedBatch.group_id}
                    </span>
                  </div>
                  <p className="text-xs text-text-muted mt-0.5">
                    Destination Warehouse: <strong className="text-text-primary">{bomData?.destination_warehouse?.name || "Central Regional Warehouse"}</strong>
                  </p>
                </div>

                {/* Procurement Readiness Validation & Handover Action */}
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <span className="text-[10px] font-bold text-text-muted uppercase block">Readiness State</span>
                    <span className="text-xs font-black text-emerald-600 dark:text-emerald-400">
                      {currentReadiness}
                    </span>
                  </div>

                  <Button
                    type="button"
                    variant="primary"
                    size="md"
                    onClick={handleHandoverToDelivery}
                  >
                    <FaTruck className="text-xs mr-1.5" />
                    Transfer to Delivery Manager
                  </Button>
                </div>
              </div>

              {/* Required Batch Metadata Grid (PART 1.2 Required Fields) */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                <div>
                  <span className="text-[10px] font-bold text-text-muted uppercase block">Linked Orders</span>
                  <span className="font-black text-text-primary">
                    {selectedBatch.order_count || selectedBatch.order_numbers?.length} Orders
                  </span>
                  <span className="text-[10px] text-text-muted block truncate">
                    {(selectedBatch.order_numbers || []).slice(0, 2).join(", ")}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] font-bold text-text-muted uppercase block">Total Kit Quantity</span>
                  <span className="font-black text-text-primary">{selectedBatch.total_kits} Units</span>
                  <span className="text-[10px] text-text-muted block">Weight ~ {selectedBatch.total_weight_kg || selectedBatch.total_kits * 50} kg</span>
                </div>

                <div>
                  <span className="text-[10px] font-bold text-text-muted uppercase block">Destination Region</span>
                  <span className="font-bold text-text-primary truncate block">
                    {(selectedBatch.geographic_summary?.states || ["Gujarat"]).join(", ")}
                  </span>
                  <span className="text-[10px] text-text-muted block">
                    {(selectedBatch.geographic_summary?.districts || ["Rajkot"]).join(", ")}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] font-bold text-text-muted uppercase block">Active PIs / Sourced</span>
                  <span className="font-black text-primary font-mono">
                    {purchaseIndents.length} PIs Generated
                  </span>
                  <span className="text-[10px] text-text-muted block">
                    {purchaseIndents.filter(pi => pi.fulfilment?.supply_status === "Inward Completed").length} Inward Completed
                  </span>
                </div>
              </div>

              {/* Linked Orders Quick Filter Pills */}
              <div className="pt-2 border-t border-border/60">
                <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider block mb-1.5">
                  Filter by Individual Order in Batch:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => setSelectedOrder(null)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      selectedOrder === null
                        ? "bg-primary text-white"
                        : "bg-bg text-text-muted hover:border-primary/40 border border-border"
                    }`}
                  >
                    All Orders in Batch ({[...new Set(selectedBatch.order_numbers || [])].length || 1})
                  </button>
                  {[...new Set(selectedBatch.order_numbers || [])].map((ordNum, idx) => (
                    <button
                      key={`${ordNum}-${idx}`}
                      type="button"
                      onClick={() => setSelectedOrder({ order_number: ordNum })}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold font-mono transition-all cursor-pointer ${
                        selectedOrder?.order_number === ordNum
                          ? "bg-primary text-white"
                          : "bg-bg text-text-muted hover:border-primary/40 border border-border"
                      }`}
                    >
                      {ordNum}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-surface border border-border rounded-2xl p-8 text-center text-xs text-text-muted">
              Select an order group or batch on the left to review BOM and begin procurement.
            </div>
          )}

          {/* ─────────────────────────────────────────────────────────────────
              SECTION 1: PRODUCT-WISE BOM & PROCUREMENT CALCULATION (PART 1.3)
          ───────────────────────────────────────────────────────────────── */}
          {selectedBatch && (
            <div className="bg-surface border border-border rounded-2xl p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-border/60 pb-3">
                <div className="flex items-center gap-2">
                  <FaBoxes className="text-primary text-base" />
                  <h3 className="text-xs font-black uppercase tracking-wider text-text-primary">
                    Product-wise BOM & Procurement Calculation
                  </h3>
                </div>
                <span className="text-[10px] text-text-muted font-bold font-mono">
                  Supplier Qty = Required Qty − Reserved Stock
                </span>
              </div>

              {loadingBom ? (
                <div className="py-8 text-center text-xs text-text-muted">Calculating BOM requirements...</div>
              ) : !bomData?.bom_calculations ? (
                <div className="py-6 text-center text-xs text-text-muted">No BOM data available.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-border bg-bg/50 text-[10px] font-black uppercase tracking-wider text-text-muted">
                        <th className="py-2.5 px-3">Product / SKU</th>
                        <th className="py-2.5 px-2 text-center">Required Qty</th>
                        <th className="py-2.5 px-2 text-center">Warehouse Stock</th>
                        <th className="py-2.5 px-2 text-center">Reserved</th>
                        <th className="py-2.5 px-2 text-center">Remaining Supplier Qty</th>
                        <th className="py-2.5 px-3">Supplier / OEM Partner</th>
                        <th className="py-2.5 px-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60">
                      {bomData.bom_calculations.map((item) => {
                        const canReserve = item.free_warehouse_stock > 0 && item.supplier_quantity > 0;
                        const needsSupplier = item.supplier_quantity > 0;

                        return (
                          <tr key={item.sku_code} className="hover:bg-bg/40 transition-colors">
                            {/* Product SKU */}
                            <td className="py-3 px-3">
                              <span className="font-bold text-text-primary block">{item.product_name}</span>
                              <span className="text-[10px] text-primary font-mono">{item.sku_code}</span>
                            </td>

                            {/* Required Qty */}
                            <td className="py-3 px-2 text-center font-black text-text-primary">
                              {item.required_quantity} {item.unit}
                            </td>

                            {/* Warehouse Available Stock */}
                            <td className="py-3 px-2 text-center">
                              <span className={`font-bold ${item.free_warehouse_stock > 0 ? "text-emerald-600" : "text-text-muted"}`}>
                                {item.available_stock} {item.unit}
                              </span>
                              <span className="text-[9px] text-text-muted block">({item.free_warehouse_stock} free)</span>
                            </td>

                            {/* Reserved Stock */}
                            <td className="py-3 px-2 text-center font-bold text-amber-600">
                              {item.inventory_quantity_selected || 0} {item.unit}
                            </td>

                            {/* Supplier Procurement Required */}
                            <td className="py-3 px-2 text-center">
                              {item.supplier_quantity > 0 ? (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-red-500/10 text-red-600 border border-red-500/20">
                                  {item.supplier_quantity} {item.unit}
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                                  0 (Fully Sourced)
                                </span>
                              )}
                            </td>

                            {/* Supplier Partner */}
                            <td className="py-3 px-3">
                              <span className="font-bold text-text-primary text-[11px] block">
                                {item.selected_partner?.name || "Standard OEM"}
                              </span>
                              <span className="text-[9px] text-text-muted">
                                {item.selected_partner?.type || "Tier-1 Partner"}
                              </span>
                            </td>

                            {/* Actions: Option A (Reserve) vs Option B (Purchase Indent) */}
                            <td className="py-3 px-3 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                {/* Option A: Reserve Stock */}
                                {canReserve && (
                                  <button
                                    type="button"
                                    onClick={() => handleReserveStock(item)}
                                    disabled={reservingSku === item.sku_code}
                                    className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-amber-500/10 text-amber-700 hover:bg-amber-500/20 border border-amber-500/30 transition-all cursor-pointer flex items-center gap-1"
                                    title="Reserve from eligible Warehouse Stock"
                                  >
                                    <FaLock className="text-[9px]" />
                                    {reservingSku === item.sku_code ? "..." : "Reserve Stock"}
                                  </button>
                                )}

                                {/* Option B: Create PI */}
                                {needsSupplier && (
                                  <button
                                    type="button"
                                    onClick={() => handleOpenPiModal(item)}
                                    className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-primary text-white hover:bg-primary/90 transition-all cursor-pointer flex items-center gap-1 shadow-xs"
                                    title="Generate Supplier Purchase Indent"
                                  >
                                    <FaFileInvoice className="text-[9px]" />
                                    Create PI
                                  </button>
                                )}
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
          )}

          {/* ─────────────────────────────────────────────────────────────────
              SECTION 2: PURCHASE INDENTS & SUPPLIER PAYMENT CARDS (PART 1.5, 1.6 & 2)
          ───────────────────────────────────────────────────────────────── */}
          {selectedBatch && (
            <div className="bg-surface border border-border rounded-2xl p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-border/60 pb-3">
                <div className="flex items-center gap-2">
                  <FaFileInvoice className="text-primary text-base" />
                  <h3 className="text-xs font-black uppercase tracking-wider text-text-primary">
                    Supplier Purchase Indents & Payment Lifecycle
                  </h3>
                </div>
                <span className="text-[10px] text-text-muted font-bold font-mono">
                  {purchaseIndents.length} Indents Associated
                </span>
              </div>

              {loadingPIs ? (
                <div className="py-6 text-center text-xs text-text-muted">Loading purchase indents...</div>
              ) : purchaseIndents.length === 0 ? (
                <div className="py-6 text-center text-xs text-text-muted italic bg-bg/50 rounded-xl border border-border/40 p-4">
                  No Purchase Indents generated yet for this batch. Click "Create PI" above for any remaining supplier quantities.
                </div>
              ) : (
                <div className="space-y-3">
                  {purchaseIndents.map((pi) => {
                    const payment = pi.payment || {};
                    const fulfilment = pi.fulfilment || {};
                    const isApproved = payment.payment_status === "Approved" || payment.payment_status === "Paid";
                    const isInwarded = fulfilment.supply_status === "Inward Completed";

                    return (
                      <div
                        key={pi.pi_number}
                        className="bg-bg/60 border border-border rounded-xl p-4 space-y-3 hover:border-primary/40 transition-all"
                      >
                        {/* Top Line: PI Number, Supplier & Total Value */}
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/50 pb-2.5">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-black text-xs text-primary">#{pi.pi_number}</span>
                              <span className="text-xs font-bold text-text-primary">• {pi.supplier_name}</span>
                              {pi.is_oem_partner && (
                                <span className="text-[9px] px-1.5 py-0.2 rounded bg-purple-500/10 text-purple-600 font-bold uppercase">
                                  OEM (SOLARKITS)
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-text-muted block mt-0.5">
                              Order #{pi.customer_order_number} • Destination: {pi.destination_warehouse_name}
                            </span>
                          </div>

                          <div className="text-right">
                            <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 block">
                              ₹{(pi.total_pi_value || 0).toLocaleString("en-IN")}
                            </span>
                            <span className="text-[10px] text-text-muted font-bold">
                              Advance ({payment.advance_percentage || 30}%): ₹{(payment.advance_amount || 0).toLocaleString("en-IN")}
                            </span>
                          </div>
                        </div>

                        {/* Mid Line: Status Badges for Payment & Fulfilment */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                          {/* Payment State */}
                          <div className="flex items-center justify-between p-2 rounded-lg bg-surface border border-border/60">
                            <div className="flex items-center gap-2">
                              <FaCreditCard className="text-primary text-xs" />
                              <span className="text-[11px] font-bold text-text-muted">Payment:</span>
                              <span className="font-bold text-text-primary">{payment.payment_status || "PI Submitted"}</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleOpenPaymentModal(pi)}
                              className="text-[10px] font-bold text-primary hover:underline cursor-pointer"
                            >
                              Payment Card →
                            </button>
                          </div>

                          {/* Fulfilment State */}
                          <div className="flex items-center justify-between p-2 rounded-lg bg-surface border border-border/60">
                            <div className="flex items-center gap-2">
                              <FaTruck className="text-primary text-xs" />
                              <span className="text-[11px] font-bold text-text-muted">Fulfilment:</span>
                              <span className="font-bold text-text-primary">
                                {fulfilment.method} ({fulfilment.supply_status || "Pending"})
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleOpenFulfilmentModal(pi)}
                              className="text-[10px] font-bold text-primary hover:underline cursor-pointer"
                            >
                              Fulfilment Details →
                            </button>
                          </div>
                        </div>

                        {/* Bottom Actions: Physical Inward Verification */}
                        <div className="flex items-center justify-between pt-1 text-[11px]">
                          <span className="text-text-muted text-[10px]">
                            Expected Inward:{" "}
                            <strong>
                              {fulfilment.expected_inward_date
                                ? new Date(fulfilment.expected_inward_date).toLocaleDateString("en-IN")
                                : "TBD"}
                            </strong>
                          </span>

                          <div className="flex items-center gap-2">
                            {!isInwarded ? (
                              <button
                                type="button"
                                onClick={() => handleOpenInwardModal(pi)}
                                className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] transition-all cursor-pointer flex items-center gap-1.5 shadow-xs"
                              >
                                <FaWarehouse className="text-xs" />
                                Physical Inward & GRN
                              </button>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-emerald-600 font-bold text-[10px]">
                                <FaCheckCircle /> Inward Completed
                              </span>
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

        </div>

      </div>

      {/* ─────────────────────────────────────────────────────────────────────
          MODALS INTEGRATION
      ───────────────────────────────────────────────────────────────────── */}
      {/* 1. Purchase Indent Modal */}
      <PurchaseIndentModal
        isOpen={piModalOpen}
        onClose={() => setPiModalOpen(false)}
        selectedOrder={selectedOrder}
        selectedBatch={selectedBatch}
        bomItem={activeBomItemForPI}
        destinationWarehouse={bomData?.destination_warehouse}
        onSubmit={handleCreatePiSubmit}
      />

      {/* 2. Supplier Payment Card Modal */}
      <SupplierPaymentModal
        isOpen={paymentModalOpen}
        onClose={() => setPaymentModalOpen(false)}
        purchaseIndent={activePIForPayment}
        userRole={user?.role || "Accounts"}
        onRequestPayment={handleRequestPayment}
        onAdminApproval={handleAdminApproval}
        onRecordBankPayment={handleRecordBankPayment}
      />

      {/* 3. Supply Fulfilment Modal */}
      <SupplyFulfilmentModal
        isOpen={fulfilmentModalOpen}
        onClose={() => setFulfilmentModalOpen(false)}
        purchaseIndent={activePIForFulfilment}
        destinationWarehouse={bomData?.destination_warehouse}
        onSaveFulfilment={handleSaveFulfilment}
        onUpdateDispatchStatus={handleUpdateDispatchStatus}
      />

      {/* 4. Physical Inward Receipt Modal */}
      <InwardVerificationModal
        isOpen={inwardModalOpen}
        onClose={() => setInwardModalOpen(false)}
        purchaseIndent={activePIForInward}
        destinationWarehouse={bomData?.destination_warehouse}
        onConfirmInward={handleConfirmInward}
      />

    </div>
  );
}
