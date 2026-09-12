import React, { useState, useEffect } from "react";
import axiosInstance from "@/utils/axiosInstance";
import {
  FaShoppingCart, FaEye, FaRegClock, FaCheckCircle,
  FaTimesCircle, FaMapMarkerAlt, FaEdit, FaTimes, FaTruck,
  FaWarehouse, FaTruckLoading, FaFileInvoice, FaRedo, FaUpload,
  FaBuilding, FaExclamationTriangle, FaCopy, FaCheck, FaExternalLinkAlt,
  FaSearch, FaBoxOpen, FaRoute
} from "react-icons/fa";
import { BsArrowRepeat } from "react-icons/bs";
import Button from "@/Components/Button";
import CustomInput from "@/Components/CustomInput";
import MapLocationPicker from "@/Components/MapLocationPicker";

export default function ProjectOrderStatus() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [expandedOrderId, setExpandedOrderId] = useState(null);

  // Search & Copy state
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedKey, setCopiedKey] = useState(null);

  const handleCopy = (text, key) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Re-submit payment proof modal state
  const [resubmittingOrder, setResubmittingOrder] = useState(null);
  const [newUtr, setNewUtr] = useState("");
  const [newAmount, setNewAmount] = useState("");
  const [newDate, setNewDate] = useState(new Date().toISOString().slice(0, 10));
  const [newBank, setNewBank] = useState("");
  const [newReceiptFile, setNewReceiptFile] = useState(null);
  const [newReceiptPreview, setNewReceiptPreview] = useState(null);
  const [resubmitLoading, setResubmitLoading] = useState(false);
  const [resubmitError, setResubmitError] = useState("");

  // Invoice view modal state
  const [viewingInvoice, setViewingInvoice] = useState(null);
  const [invoiceLoading, setInvoiceLoading] = useState(false);

  // Address edit modal state
  const [editingOrder, setEditingOrder] = useState(null);
  const [statesList, setStatesList] = useState([]);
  const [districtsList, setDistrictsList] = useState([]);
  const [selectedStateId, setSelectedStateId] = useState("");
  const [selectedDistrictId, setSelectedDistrictId] = useState("");
  const [streetAddress, setStreetAddress] = useState("");
  const [pincode, setPincode] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [contactName, setContactName] = useState("");
  const [selectedLat, setSelectedLat] = useState("");
  const [selectedLng, setSelectedLng] = useState("");
  const [modalError, setModalError] = useState("");
  const [savingAddress, setSavingAddress] = useState(false);
  const [boundaries, setBoundaries] = useState([]);

  // PO Allocations state
  const [poAllocations, setPoAllocations] = useState([]);
  const [poLoading, setPoLoading] = useState(false);
  const [mainTab, setMainTab] = useState("direct"); // "direct" | "po_allocations"
  const [selectedPoForUpload, setSelectedPoForUpload] = useState(null);
  const [poReceiptFile, setPoReceiptFile] = useState(null);
  const [poUploading, setPoUploading] = useState(false);
  const [poUploadMsg, setPoUploadMsg] = useState("");

  // Fetch orders
  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get("/india/v1/shop/orders");
      if (res.data?.success) {
        setOrders(res.data.data || []);
      } else {
        setErrorMsg("Failed to load orders.");
      }
    } catch (err) {
      console.error("Failed to load orders:", err);
      setErrorMsg(err.response?.data?.message || "Error fetching order list. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const fetchPoAllocations = async () => {
    setPoLoading(true);
    try {
      const res = await axiosInstance.get("/india/v1/shop/po-allocations");
      if (res.data?.success || res.data?.status === "success") {
        setPoAllocations(res.data.data || []);
      }
    } catch (err) {
      console.error("Failed to load PO allocations:", err);
    } finally {
      setPoLoading(false);
    }
  };

  const handlePoReceiptUpload = async (poId) => {
    if (!poReceiptFile) {
      setPoUploadMsg("Please select a receipt image or PDF to upload.");
      return;
    }
    const formData = new FormData();
    formData.append("files", poReceiptFile);
    setPoUploading(true);
    setPoUploadMsg("");
    try {
      const res = await axiosInstance.post(`/india/v1/shop/po-allocations/${poId}/upload-receipt`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      if (res.data?.success || res.data?.status === "success") {
        setSelectedPoForUpload(null);
        setPoReceiptFile(null);
        fetchPoAllocations();
      } else {
        setPoUploadMsg(res.data?.message || "Failed to upload receipt.");
      }
    } catch (err) {
      setPoUploadMsg(err.response?.data?.message || "Failed to upload receipt.");
    } finally {
      setPoUploading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    fetchPoAllocations();
    fetchStates();

    // Listen for ICICI real-time payment credits to auto-refresh order statuses
    const rawApiUrl = import.meta.env.VITE_API_URL || "http://localhost:5000";
    const baseUrl = rawApiUrl.replace(/\/api\/?$/, "").replace(/\/+$/, "");
    const streamUrl = `${baseUrl}/api/v1/payments/icici/stream?role=epc`;
    const es = new EventSource(streamUrl);

    es.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "ICICI_PAYMENT_CREDITED") {
          console.log("⚡ Auto-refreshing orders due to ICICI payment credit:", data);
          fetchOrders();
          fetchPoAllocations();
        }
      } catch (err) {
        console.error(err);
      }
    };

    return () => es.close();
  }, []);

  const fetchStates = async () => {
    try {
      const response = await axiosInstance.get(`/india/v1/geo/states`);
      if (response.data?.states) {
        setStatesList(response.data.states);
      }
    } catch (error) {
      console.error("Error fetching states:", error);
    }
  };

  // Open Re-submit Payment Modal
  const handleOpenResubmit = (order) => {
    setResubmittingOrder(order);
    setNewUtr(order.offline_payment?.utr_number || order.payment_reference || "");
    setNewAmount(order.offline_payment?.amount_paid || order.total_amount || "");
    setNewDate(new Date().toISOString().slice(0, 10));
    setNewBank(order.offline_payment?.sender_bank_name || "");
    setNewReceiptFile(null);
    setNewReceiptPreview(null);
    setResubmitError("");
  };

  const handleResubmitFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setNewReceiptFile(file);
      if (file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onload = (ev) => setNewReceiptPreview(ev.target.result);
        reader.readAsDataURL(file);
      } else {
        setNewReceiptPreview(null);
      }
    }
  };

  const handleConfirmResubmit = async (e) => {
    e.preventDefault();
    if (!newUtr.trim()) {
      setResubmitError("Please enter a valid UTR number.");
      return;
    }
    if (!newAmount || Number(newAmount) <= 0) {
      setResubmitError("Please enter a valid payment amount.");
      return;
    }

    setResubmitLoading(true);
    setResubmitError("");
    try {
      const formData = new FormData();
      formData.append("utr_number", newUtr.trim().toUpperCase());
      formData.append("amount_paid", newAmount);
      formData.append("payment_date", newDate);
      formData.append("sender_bank_name", newBank);
      if (newReceiptFile) {
        formData.append("payment_receipt", newReceiptFile);
      }

      const res = await axiosInstance.post(
        `/india/v1/shop/offline-checkout/${resubmittingOrder.id || resubmittingOrder._id}/resubmit`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );

      if (res.data?.success) {
        setResubmittingOrder(null);
        fetchOrders();
      } else {
        setResubmitError(res.data?.message || "Failed to re-submit payment proof.");
      }
    } catch (err) {
      setResubmitError(err.response?.data?.message || "Re-submission failed. Please try again.");
    } finally {
      setResubmitLoading(false);
    }
  };

  // Open Tax Invoice View Modal
  const handleViewInvoice = async (order) => {
    setViewingInvoice(order);
    setInvoiceLoading(true);
    try {
      const res = await axiosInstance.get(`/india/v1/shop/orders/${order.id || order._id}/invoice-data`);
      if (res.data?.success) {
        setViewingInvoice(res.data.data);
      }
    } catch (err) {
      console.error("Error fetching invoice:", err);
    } finally {
      setInvoiceLoading(false);
    }
  };

  // Filter orders by search query across Order #, UTR, kit name, and tracking LR
  const filteredOrders = orders.filter((o) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    const orderNum = (o.order_number || o.id || o._id || "").toLowerCase();
    const utr = (o.offline_payment?.utr_number || o.payment_reference || "").toLowerCase();
    const kitName = (o.combo_kit_id?.name || o.combo_kit_id?.kitName || (o.items?.[0] && o.items[0].item_name) || "").toLowerCase();
    const lr = (o.dispatch_tracking?.tracking_number || "").toLowerCase();
    const courier = (o.dispatch_tracking?.courier_name || "").toLowerCase();
    return orderNum.includes(q) || utr.includes(q) || kitName.includes(q) || lr.includes(q) || courier.includes(q);
  });

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <h1 className="text-2xl font-black text-text-primary dark:text-white flex items-center gap-2.5">
            <FaShoppingCart className="text-primary" /> My Solar Kit Orders & Live Tracking
          </h1>
          <p className="text-xs text-text-secondary mt-1">
            Real-time status tracking for Direct EPC and Franchise-attributed purchase orders.
          </p>
        </div>

        <button
          onClick={() => {
            fetchOrders();
            fetchPoAllocations();
          }}
          className="inline-flex items-center gap-2 px-3.5 py-2 bg-surface hover:bg-surface-hover border border-border rounded-xl text-xs font-bold text-text-primary transition-colors shadow-sm self-start cursor-pointer"
        >
          <BsArrowRepeat className={(loading || poLoading) ? "animate-spin text-primary" : ""} /> Refresh
        </button>
      </div>

      {/* ── Segment Switcher: Direct Orders vs Franchisee PO Allocations ──────── */}
      <div className="flex items-center gap-2 p-1.5 bg-surface border border-border rounded-2xl w-fit shadow-xs">
        <button
          onClick={() => setMainTab("direct")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${mainTab === "direct"
              ? "bg-primary text-white shadow-sm"
              : "text-text-secondary hover:text-text-primary"
            }`}
        >
          <FaShoppingCart size={13} />
          <span>Direct Kit Orders ({orders.length})</span>
        </button>
        <button
          onClick={() => setMainTab("po_allocations")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${mainTab === "po_allocations"
              ? "bg-primary text-white shadow-sm"
              : "text-text-secondary hover:text-text-primary"
            }`}
        >
          <FaBuilding size={13} />
          <span>Franchisee PO Allocations ({poAllocations.length})</span>
          {poAllocations.some((o) =>
            (o.items || []).some((i) =>
              (i.epc_allocations || []).some((a) => a.payment_status === "RECEIPT_SUBMITTED")
            )
          ) && (
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-ping" />
            )}
        </button>
      </div>

      {mainTab === "direct" ? (
        <>

          {/* Search & Stats Bar (Status Filter Pills Removed as requested) */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-surface p-3 rounded-2xl border border-border shadow-xs">
            <div className="relative flex-1">
              <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted text-xs" />
              <input
                type="text"
                placeholder="Search by Order #, UTR number, Kit package, or Waybill/LR..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-8 py-2 bg-surface-hover/50 hover:bg-surface-hover border border-border rounded-xl text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary/50 transition-colors"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary p-0.5"
                >
                  <FaTimes size={11} />
                </button>
              )}
            </div>
            <div className="flex items-center gap-2 text-xs font-bold text-text-secondary px-2">
              <span>
                Showing <strong className="text-text-primary dark:text-white">{filteredOrders.length}</strong> of {orders.length} order{orders.length === 1 ? "" : "s"}
              </span>
            </div>
          </div>

          {/* Loading & Empty States */}
          {loading ? (
            <div className="py-20 text-center space-y-3">
              <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs font-bold text-text-secondary">Loading your order history & live tracking...</p>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="py-20 text-center bg-surface rounded-3xl border border-border shadow-sm p-8 space-y-3">
              <FaShoppingCart className="mx-auto text-text-muted text-4xl" />
              <h3 className="text-base font-bold text-text-primary dark:text-white">
                {searchQuery ? "No Matching Orders Found" : "No Orders Placed Yet"}
              </h3>
              <p className="text-xs text-text-secondary max-w-sm mx-auto">
                {searchQuery
                  ? `No purchase orders match your search query "${searchQuery}".`
                  : "When you place an order for Solar Combo Kits, real-time live journey tracking will appear here."}
              </p>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="px-4 py-1.5 rounded-xl bg-primary text-white text-xs font-bold hover:opacity-90 transition-opacity"
                >
                  Clear Search
                </button>
              )}
            </div>
          ) : (
            /* Orders List */
            <div className="space-y-6">
              {filteredOrders.map((order) => {
                const isEpcOrder = order.is_epc_order || order.order_type === "offline_epc_order";
                const orderId = order.order_number || order.id || order._id;
                const items = order.items || [];

                const isPendingVerification = order.payment_status === "pending_verification" || order.status === "pending_verification";
                const isApproved = order.payment_status === "captured" || order.status === "confirmed";
                const isDispatched = order.order_status === "dispatched" || order.status === "dispatched" || Boolean(order.dispatch_tracking?.tracking_number);
                const isDelivered = order.order_status === "delivered" || order.status === "completed" || order.status === "delivered";
                const isRejected = order.payment_status === "rejected" || order.status === "rejected";

                // Determine timeline step progression (1: Order Placed, 2: Verification, 3: Approved & Packaged, 4: Dispatched & In Transit, 5: Delivered)
                let step = 1;
                if (isDelivered) step = 5;
                else if (isDispatched) step = 4;
                else if (isApproved) step = 3;
                else if (isPendingVerification) step = 2;

                const orderNumStr = order.order_number || `#${String(order._id).slice(-8).toUpperCase()}`;
                const utrStr = order.offline_payment?.utr_number || order.payment_reference || "N/A";
                const courierName = order.dispatch_tracking?.courier_name || "Express Logistics";
                const lrNumber = order.dispatch_tracking?.tracking_number || "";
                const trackingUrl = order.dispatch_tracking?.tracking_url || "";
                const dispatchedDate = order.dispatch_tracking?.dispatched_at;
                const estimatedDate = order.dispatch_tracking?.estimated_delivery;

                return (
                  <div
                    key={orderId}
                    className="bg-surface rounded-3xl border border-border shadow-sm overflow-hidden transition-all hover:border-primary/40"
                  >
                    {/* ── Order Top Header ────────────────────────────────────── */}
                    <div className="p-5 sm:p-6 border-b border-border flex flex-col md:flex-row md:items-center justify-between gap-4 bg-surface-hover/30">
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono font-black text-base text-text-primary dark:text-white">
                            {orderNumStr}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopy(orderNumStr, `order-${orderId}`)}
                            className="p-1 text-text-secondary hover:text-primary transition-colors cursor-pointer"
                            title="Copy Order Number"
                          >
                            {copiedKey === `order-${orderId}` ? (
                              <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-0.5">
                                <FaCheck size={9} /> Copied
                              </span>
                            ) : (
                              <FaCopy size={12} />
                            )}
                          </button>

                          {isEpcOrder && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/15 text-amber-700 dark:text-amber-300">
                              Direct EPC Order
                            </span>
                          )}

                          {order.reseller?.business_name ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300">
                              <FaBuilding size={10} /> Franchise: {order.reseller.business_name}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-500/15 text-blue-700 dark:text-blue-300">
                              <FaWarehouse size={10} /> Central Company Fulfillment
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-text-secondary">
                          Ordered on {new Date(order.created_at).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>

                      <div className="flex items-center gap-3 flex-wrap">
                        {/* Live Order Status Badge */}
                        {isRejected ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black bg-red-500/15 text-red-600 dark:text-red-400 border border-red-500/20">
                            <FaTimesCircle /> Payment Rejected
                          </span>
                        ) : isPendingVerification ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                            <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                            <FaRegClock /> Accounts Verification Pending
                          </span>
                        ) : isApproved && !isDispatched && !isDelivered ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                            <FaCheckCircle /> Payment Approved • Packing
                          </span>
                        ) : isDispatched && !isDelivered ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                            <span className="w-2 h-2 rounded-full bg-purple-600 animate-ping" />
                            <FaTruck /> Dispatched & In Transit
                          </span>
                        ) : isDelivered ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                            <FaCheckCircle /> Delivered & Completed
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-black bg-surface text-text-secondary border border-border">
                            {order.status}
                          </span>
                        )}

                        <div className="text-right">
                          <span className="text-base font-black text-text-primary dark:text-white block">
                            ₹{(order.total_amount || order.selling_price_snapshot || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                          <span className="text-[10px] text-text-muted font-semibold">Incl. of GST</span>
                        </div>
                      </div>
                    </div>

                    {/* ── Industry Standard Order Journey Stepper ─────────────── */}
                    {!isRejected && (
                      <div className="p-6 border-b border-border bg-surface">
                        <div className="relative max-w-4xl mx-auto">
                          {/* Connecting Progress Track */}
                          <div className="absolute top-4 left-6 right-6 h-1 bg-border rounded-full -z-0 hidden sm:block" />
                          <div
                            className="absolute top-4 left-6 h-1 bg-gradient-to-r from-primary via-indigo-600 to-emerald-500 rounded-full transition-all duration-500 -z-0 hidden sm:block"
                            style={{ width: `${Math.min(100, Math.max(0, ((step - 1) / 4) * 100))}%` }}
                          />

                          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 sm:gap-2 relative z-10">
                            {/* Step 1: Order Placed */}
                            <div className="flex flex-col items-center text-center space-y-1.5">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black transition-all ${step >= 1 ? "bg-primary text-white shadow-md shadow-primary/25" : "bg-surface-hover border border-border text-text-muted"
                                }`}>
                                ✓
                              </div>
                              <p className="text-xs font-extrabold text-text-primary dark:text-white">Order Placed</p>
                              <p className="text-[10px] text-text-secondary font-mono">
                                UTR: {utrStr.slice(0, 10)}{utrStr.length > 10 ? "..." : ""}
                              </p>
                              <p className="text-[10px] text-text-muted hidden sm:block">
                                {new Date(order.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                              </p>
                            </div>

                            {/* Step 2: Accounts Verification */}
                            <div className="flex flex-col items-center text-center space-y-1.5">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black transition-all ${step >= 2 && !isApproved
                                  ? "bg-amber-500 text-white shadow-md shadow-amber-500/25 ring-4 ring-amber-500/20"
                                  : step >= 3
                                    ? "bg-primary text-white shadow-md shadow-primary/25"
                                    : "bg-surface-hover border border-border text-text-muted"
                                }`}>
                                {step >= 3 ? "✓" : step === 2 ? "⏳" : "2"}
                              </div>
                              <p className="text-xs font-extrabold text-text-primary dark:text-white">Accounts Review</p>
                              <p className="text-[10px] text-text-secondary">
                                {step >= 3 ? "Verified & Settled" : "Verifying Bank UTR"}
                              </p>
                              {order.invoice?.invoice_number && (
                                <span className="text-[9px] font-bold text-emerald-600 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                                  Tax Invoice Ready
                                </span>
                              )}
                            </div>

                            {/* Step 3: Payment Approved & Packed */}
                            <div className="flex flex-col items-center text-center space-y-1.5">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black transition-all ${step >= 3 ? "bg-primary text-white shadow-md shadow-primary/25" : "bg-surface-hover border border-border text-text-muted"
                                }`}>
                                {step >= 3 ? "✓" : "3"}
                              </div>
                              <p className="text-xs font-extrabold text-text-primary dark:text-white">Payment Approved</p>
                              <p className="text-[10px] text-text-secondary">
                                {step >= 4 ? "Stock Allocated" : step === 3 ? "Packing Solar Kit" : "Awaiting Approval"}
                              </p>
                              <p className="text-[10px] text-text-muted hidden sm:block">
                                {order.fulfillment_source === "franchise_warehouse" ? "Franchise Stock" : "Central Hub"}
                              </p>
                            </div>

                            {/* Step 4: Dispatched & In Transit */}
                            <div className="flex flex-col items-center text-center space-y-1.5">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black transition-all ${step === 4
                                  ? "bg-purple-600 text-white shadow-md shadow-purple-600/30 ring-4 ring-purple-600/20"
                                  : step >= 5
                                    ? "bg-primary text-white shadow-md shadow-primary/25"
                                    : "bg-surface-hover border border-border text-text-muted"
                                }`}>
                                {step >= 5 ? "✓" : step === 4 ? <FaTruck size={12} /> : "4"}
                              </div>
                              <p className="text-xs font-extrabold text-text-primary dark:text-white">Dispatched</p>
                              <p className="text-[10px] text-purple-700 dark:text-purple-300 font-bold">
                                {isDispatched ? courierName : "Awaiting Dispatch"}
                              </p>
                              {dispatchedDate && (
                                <p className="text-[10px] text-text-muted hidden sm:block">
                                  {new Date(dispatchedDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                                </p>
                              )}
                            </div>

                            {/* Step 5: Delivered */}
                            <div className="flex flex-col items-center text-center space-y-1.5">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black transition-all ${step >= 5
                                  ? "bg-emerald-500 text-white shadow-md shadow-emerald-500/30 ring-4 ring-emerald-500/20"
                                  : "bg-surface-hover border border-border text-text-muted"
                                }`}>
                                {step >= 5 ? "✓" : "5"}
                              </div>
                              <p className="text-xs font-extrabold text-text-primary dark:text-white">Delivered</p>
                              <p className="text-[10px] text-text-secondary">
                                {isDelivered
                                  ? "Completed & Installed"
                                  : estimatedDate
                                    ? `Est: ${new Date(estimatedDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}`
                                    : "Site Handover"}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* ── High-visibility Rejection Notice if Accounts Rejected Payment ── */}
                    {isRejected && (
                      <div className="p-6 bg-red-500/10 border-b border-red-500/20 text-red-800 dark:text-red-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div className="flex items-start gap-3">
                          <FaExclamationTriangle className="text-red-500 text-2xl shrink-0 mt-0.5" />
                          <div>
                            <h4 className="font-extrabold text-sm text-red-600 dark:text-red-400">
                              Payment Verification Rejected by Accounts
                            </h4>
                            <p className="text-xs mt-0.5 text-text-secondary">
                              <strong>Reason:</strong> {order.offline_payment?.rejection_reason || "Payment amount or UTR could not be verified."}
                            </p>
                            <p className="text-[11px] text-text-muted mt-1">
                              Please verify your bank transaction and re-upload the receipt with the correct UTR number.
                            </p>
                          </div>
                        </div>

                        <Button
                          onClick={() => handleOpenResubmit(order)}
                          variant="primary"
                          className="py-2.5 px-4 text-xs font-black shrink-0 shadow bg-red-600 hover:bg-red-700 border-none cursor-pointer"
                        >
                          <FaRedo className="mr-1.5" /> Re-submit Receipt & UTR
                        </Button>
                      </div>
                    )}

                    {/* ── DEDICATED LOGISTICS & DISPATCH TRACKING CARD (Industry Standard) ── */}
                    {(isDispatched || lrNumber) && (
                      <div className="p-5 sm:p-6 bg-gradient-to-r from-purple-500/10 via-indigo-500/10 to-blue-500/10 border-b border-purple-500/25 text-xs space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <span className="p-2.5 rounded-2xl bg-purple-600 text-white shadow-md shadow-purple-600/30 shrink-0">
                              <FaTruck size={16} />
                            </span>
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <h4 className="font-black text-sm text-purple-950 dark:text-purple-100">
                                  Logistics & Waybill Tracking
                                </h4>
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-purple-500/20 text-purple-700 dark:text-purple-300 border border-purple-500/30">
                                  <span className="w-1.5 h-1.5 rounded-full bg-purple-600 animate-ping" />
                                  {isDelivered ? "Delivered" : "In Transit with Courier"}
                                </span>
                              </div>
                              <p className="text-[11px] text-text-secondary mt-0.5">
                                Official transport consignment recorded by Operations & Warehouse team
                              </p>
                            </div>
                          </div>

                          {trackingUrl && (
                            <a
                              href={trackingUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black bg-purple-600 hover:bg-purple-700 text-white shadow-md shadow-purple-600/25 transition-all self-start sm:self-auto cursor-pointer shrink-0"
                            >
                              <span>Track Live on Courier Portal</span>
                              <FaExternalLinkAlt size={11} />
                            </a>
                          )}
                        </div>

                        {/* 4-Column Shipment Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                          {/* Courier Partner */}
                          <div className="bg-surface/90 backdrop-blur-sm p-3.5 rounded-2xl border border-purple-500/20 space-y-1">
                            <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider block">
                              Logistics Partner
                            </span>
                            <p className="font-black text-sm text-text-primary dark:text-white flex items-center gap-1.5">
                              <FaRoute className="text-purple-600" />
                              {courierName}
                            </p>
                            <span className="text-[10px] text-text-secondary block">Express Road Transport</span>
                          </div>

                          {/* LR / Tracking Number with One-Click Copy */}
                          <div className="bg-surface/90 backdrop-blur-sm p-3.5 rounded-2xl border border-purple-500/20 space-y-1">
                            <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider block">
                              LR / Consignment No.
                            </span>
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-mono font-black text-sm text-purple-700 dark:text-purple-300">
                                {lrNumber || "Pending Entry"}
                              </span>
                              {lrNumber && (
                                <button
                                  type="button"
                                  onClick={() => handleCopy(lrNumber, `lr-${orderId}`)}
                                  className="p-1 rounded-lg text-text-secondary hover:text-purple-600 hover:bg-purple-500/10 transition-colors cursor-pointer"
                                  title="Copy LR / Tracking Number"
                                >
                                  {copiedKey === `lr-${orderId}` ? (
                                    <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-0.5">
                                      <FaCheck size={9} /> Copied
                                    </span>
                                  ) : (
                                    <FaCopy size={13} />
                                  )}
                                </button>
                              )}
                            </div>
                            <span className="text-[10px] text-text-secondary block">Docket Reference ID</span>
                          </div>

                          {/* Dispatched Date */}
                          <div className="bg-surface/90 backdrop-blur-sm p-3.5 rounded-2xl border border-purple-500/20 space-y-1">
                            <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider block">
                              Dispatched On
                            </span>
                            <p className="font-extrabold text-xs text-text-primary dark:text-white">
                              {dispatchedDate
                                ? new Date(dispatchedDate).toLocaleDateString("en-IN", {
                                  day: "numeric",
                                  month: "short",
                                  year: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })
                                : "Handed over to carrier"}
                            </p>
                            <span className="text-[10px] text-text-secondary block">Warehouse Exit Timestamp</span>
                          </div>

                          {/* Estimated Delivery */}
                          <div className="bg-surface/90 backdrop-blur-sm p-3.5 rounded-2xl border border-purple-500/20 space-y-1">
                            <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider block">
                              Estimated Delivery
                            </span>
                            <p className="font-extrabold text-xs text-emerald-600 dark:text-emerald-400">
                              {estimatedDate
                                ? new Date(estimatedDate).toLocaleDateString("en-IN", {
                                  day: "numeric",
                                  month: "short",
                                  year: "numeric",
                                })
                                : "Within 3 - 5 business days"}
                            </p>
                            <span className="text-[10px] text-text-secondary block">Destination Site ETA</span>
                          </div>
                        </div>

                        {order.dispatch_tracking?.dispatch_notes && (
                          <div className="p-3 rounded-xl bg-surface/70 border border-purple-500/20 text-xs text-text-secondary">
                            <strong className="text-text-primary font-bold">Consignment Notes / Remarks:</strong>{" "}
                            {order.dispatch_tracking.dispatch_notes}
                          </div>
                        )}
                      </div>
                    )}

                    {/* ── Order Details & Site Address Body ───────────────────── */}
                    <div className="p-6 space-y-4 text-xs">
                      {/* Equipment & Payment Details Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-text-secondary block">Ordered Equipment / Kit:</span>
                            {(items.length > 1) && (
                              <span className="text-[11px] font-semibold text-text-muted">
                                {items.length} Items
                              </span>
                            )}
                          </div>

                          {(() => {
                            const displayItems = items && items.length > 0
                              ? items
                              : [
                                {
                                  item_name: order.combo_kit_id?.name || order.combo_kit_id?.kitName || "Solar Kit Package",
                                  image: order.combo_kit_id?.image || order.combo_kit_id?.kit_image || null,
                                  capacity: order.combo_kit_id?.capacity || null,
                                  description: order.combo_kit_id?.description || null,
                                  quantity: order.total_kits || 1,
                                  scope_type: "kit",
                                },
                              ];

                            return (
                              <div className="bg-surface-hover/70 rounded-2xl border border-border overflow-hidden divide-y divide-border/60">
                                {displayItems.map((item, idx) => {
                                  const itemImg = item.image || item.kit_image || (idx === 0 && (order.combo_kit_id?.image || order.combo_kit_id?.kit_image));
                                  const itemName = item.item_name || (idx === 0 && (order.combo_kit_id?.name || order.combo_kit_id?.kitName)) || "Solar Kit Package";
                                  const itemCapacity = item.capacity || (idx === 0 && order.combo_kit_id?.capacity);
                                  const itemDesc = item.description || (idx === 0 && order.combo_kit_id?.description);
                                  const itemQty = item.quantity || (idx === 0 ? order.total_kits : 1) || 1;
                                  const scope = item.scope_type || (item.kit_id ? "kit" : "product");

                                  return (
                                    <div key={idx} className="p-3.5 sm:p-4 flex gap-3.5 items-start">
                                      {/* Product / Kit Image */}
                                      <div className="relative w-16 h-16 sm:w-20 sm:h-20 shrink-0 rounded-xl overflow-hidden border border-border bg-surface shadow-xs flex items-center justify-center">
                                        {itemImg ? (
                                          <img
                                            src={itemImg}
                                            alt={itemName}
                                            className="w-full h-full object-cover rounded-xl transition-transform hover:scale-105 duration-300"
                                            onError={(e) => {
                                              e.currentTarget.style.display = "none";
                                              if (e.currentTarget.nextSibling) {
                                                e.currentTarget.nextSibling.style.display = "flex";
                                              }
                                            }}
                                          />
                                        ) : null}
                                        <div
                                          className="w-full h-full flex items-center justify-center bg-primary/5 text-primary"
                                          style={{ display: itemImg ? "none" : "flex" }}
                                        >
                                          <FaBoxOpen size={24} />
                                        </div>
                                      </div>

                                      {/* Details Column */}
                                      <div className="flex-1 min-w-0 space-y-1.5">
                                        <h4
                                          className="font-black text-sm text-text-primary dark:text-white leading-snug line-clamp-2"
                                          title={itemName}
                                        >
                                          {itemName}
                                        </h4>

                                        <div className="flex items-center gap-1.5 flex-wrap">
                                          {itemCapacity && (
                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/25">
                                              ⚡ {itemCapacity}
                                            </span>
                                          )}
                                          <span className="inline-block px-2 py-0.5 rounded-md text-[10px] font-bold bg-primary/10 text-primary uppercase tracking-wide border border-primary/20">
                                            Scope: {scope}
                                          </span>
                                          <span className="text-xs text-text-secondary">
                                            Qty: <strong className="text-text-primary font-bold">{itemQty} {scope === "kit" ? "Kit(s)" : "Unit(s)"}</strong>
                                          </span>
                                        </div>

                                        {itemDesc && (
                                          <p className="text-[11px] text-text-secondary/80 line-clamp-2 leading-relaxed">
                                            {itemDesc}
                                          </p>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            );
                          })()}
                        </div>

                        <div className="space-y-2">
                          <span className="font-bold text-text-secondary block">Bank Transfer / Payment Proof:</span>
                          <div className="bg-surface-hover/70 p-4 rounded-2xl border border-border space-y-1.5 font-mono">
                            <div className="flex justify-between items-center">
                              <span className="text-text-secondary font-sans">UTR Ref:</span>
                              <div className="flex items-center gap-1.5">
                                <span className="font-bold text-text-primary dark:text-white">
                                  {utrStr}
                                </span>
                                {utrStr !== "N/A" && (
                                  <button
                                    type="button"
                                    onClick={() => handleCopy(utrStr, `utr-${orderId}`)}
                                    className="p-0.5 text-text-secondary hover:text-primary transition-colors cursor-pointer"
                                    title="Copy UTR"
                                  >
                                    {copiedKey === `utr-${orderId}` ? (
                                      <span className="text-[10px] font-bold text-emerald-600 font-sans">Copied!</span>
                                    ) : (
                                      <FaCopy size={11} />
                                    )}
                                  </button>
                                )}
                              </div>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-text-secondary font-sans">Amount Paid:</span>
                              <span className="font-bold text-emerald-600 dark:text-emerald-400 font-sans text-sm">
                                ₹{(order.offline_payment?.amount_paid || order.total_amount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </span>
                            </div>
                            {order.offline_payment?.sender_bank_name && (
                              <div className="flex justify-between items-center text-[11px]">
                                <span className="text-text-secondary font-sans">Bank:</span>
                                <span className="text-text-primary font-sans">{order.offline_payment.sender_bank_name}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Delivery / Installation Site Address */}
                      {order.delivery_address && (order.delivery_address.line || order.delivery_address.district_name || order.delivery_address.state_name) && (
                        <div className="bg-surface-hover/60 p-4 rounded-2xl border border-border flex items-start gap-3">
                          <div className="p-2 rounded-xl bg-primary/10 text-primary shrink-0 mt-0.5">
                            <FaMapMarkerAlt size={14} />
                          </div>
                          <div className="space-y-0.5 flex-1 min-w-0">
                            <div className="flex items-center justify-between flex-wrap gap-1">
                              <span className="font-extrabold text-xs text-text-primary dark:text-white">
                                Delivery Destination
                              </span>
                              {order.delivery_address.pincode && (
                                <span className="text-[11px] font-mono font-bold text-text-muted bg-surface px-2 py-0.5 rounded border border-border">
                                  PIN: {order.delivery_address.pincode}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-text-secondary">
                              {order.delivery_address.line}
                              {order.delivery_address.district_name ? `, ${order.delivery_address.district_name}` : ""}
                              {order.delivery_address.state_name ? `, ${order.delivery_address.state_name}` : ""}
                            </p>
                            {(order.delivery_address.contact_name || order.delivery_address.contact_phone) && (
                              <p className="text-[11px] text-text-muted pt-0.5">
                                Site Contact: <strong>{order.delivery_address.contact_name || "Site Supervisor"}</strong>
                                {order.delivery_address.contact_phone ? ` • Phone: ${order.delivery_address.contact_phone}` : ""}
                              </p>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Actions & Documents Row */}
                      <div className="flex items-center justify-between pt-3 border-t border-border flex-wrap gap-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          {order.invoice?.invoice_number && (
                            <button
                              onClick={() => handleViewInvoice(order)}
                              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-primary/10 hover:bg-primary/20 border border-primary/30 rounded-xl text-xs font-bold text-primary transition-colors cursor-pointer"
                            >
                              <FaFileInvoice /> View Tax Invoice ({order.invoice.invoice_number})
                            </button>
                          )}
                          {order.offline_payment?.receipt_url && (
                            <a
                              href={order.offline_payment.receipt_url}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-surface hover:bg-surface-hover border border-border rounded-xl text-xs font-semibold text-text-secondary transition-colors cursor-pointer"
                            >
                              <FaEye /> View Uploaded Receipt
                            </a>
                          )}
                        </div>

                        <span className="text-text-muted text-[11px]">
                          Fulfillment: {order.fulfillment_source === "franchise_warehouse" ? "Franchise Partner Stock" : "Central Company Hub"}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      ) : (
        /* ── Franchisee PO Allocations Tracking Tab ────────────────────────── */
        <div className="space-y-6">
          {poLoading ? (
            <div className="py-20 text-center space-y-3">
              <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs font-bold text-text-secondary">Loading Franchisee PO Allocations...</p>
            </div>
          ) : poAllocations.length === 0 ? (
            <div className="py-20 text-center bg-surface rounded-3xl border border-border shadow-sm p-8 space-y-3">
              <FaBuilding className="mx-auto text-text-muted text-4xl" />
              <h3 className="text-base font-bold text-text-primary dark:text-white">No Franchisee PO Allocations</h3>
              <p className="text-xs text-text-secondary max-w-md mx-auto">
                When your Franchise Partner creates a Purchase Order and allocates solar combo kits to your company, they will appear here for payment upload and live tracking.
              </p>
            </div>
          ) : (
            <div className="space-y-5">
              {poAllocations.map((order) => {
                const item = order.items?.[0] || {};
                const epcAlloc = item.epc_allocations?.[0] || {};
                const allocQty = epcAlloc.allocated_quantity || 1;
                const baseAmount = ((item.unit_price_paise || 0) * allocQty) / 100;
                const taxAmount = item.quantity > 0
                  ? (((item.tax_paise || 0) / item.quantity) * allocQty) / 100
                  : 0;
                const totalPayable = baseAmount + taxAmount;
                const payStatus = epcAlloc.payment_status || "PENDING";
                const isPoPaid = ["PAID", "STOCK_ALLOCATED", "PROCESSING", "DISPATCHED", "DELIVERED", "COMPLETED"].includes(order.status);
                const isDispatched = ["DISPATCHED", "DELIVERED", "COMPLETED"].includes(order.status);
                const isDelivered = ["DELIVERED", "COMPLETED"].includes(order.status);

                // Step Progression
                let step = 1;
                if (isDelivered) step = 5;
                else if (isDispatched) step = 4;
                else if (isPoPaid) step = 3;
                else if (payStatus === "RECEIPT_SUBMITTED" || payStatus === "VERIFIED") step = 2;

                return (
                  <div
                    key={order._id}
                    className="bg-surface rounded-3xl border border-border shadow-sm overflow-hidden transition-all hover:shadow-md"
                  >
                    {/* Header */}
                    <div className="p-5 border-b border-border bg-surface-hover/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-black text-sm text-text-primary dark:text-white">
                            {order.po_number}
                          </span>
                          <span className="text-xs text-text-muted">
                            • {new Date(order.created_at || order.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                          </span>
                        </div>
                        <div className="text-xs text-text-secondary mt-0.5">
                          Franchisee: <strong className="text-text-primary">{order.franchisee_id?.business_name || "Franchise Partner"}</strong>
                          {order.franchisee_id?.mobile && ` (${order.franchisee_id.mobile})`}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="px-3 py-1 rounded-full text-xs font-black bg-indigo-50 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                          PO Status: {order.status}
                        </span>
                      </div>
                    </div>

                    {/* Stepper Timeline */}
                    <div className="p-6 border-b border-border bg-surface">
                      <div className="relative flex justify-between items-center max-w-3xl mx-auto">
                        <div className="absolute top-1/2 left-0 right-0 -translate-y-1/2 h-1 bg-border -z-0" />
                        <div
                          className="absolute top-1/2 left-0 -translate-y-1/2 h-1 bg-primary transition-all duration-500 -z-0"
                          style={{ width: `${((step - 1) / 4) * 100}%` }}
                        />

                        {[
                          { title: "Allocated", desc: "Kits Assigned" },
                          { title: "Payment", desc: payStatus === "VERIFIED" ? "Verified ✓" : payStatus === "RECEIPT_SUBMITTED" ? "Under Review ⏳" : "Receipt Due" },
                          { title: "PO Confirmed", desc: isPoPaid ? "Stock Paid ✓" : "Pending Total" },
                          { title: "Dispatched", desc: isDispatched ? "In Transit 🚚" : "Warehouse" },
                          { title: "Delivered", desc: isDelivered ? "Delivered 🎉" : "Destination" },
                        ].map((s, idx) => {
                          const num = idx + 1;
                          const isDone = num <= step;
                          return (
                            <div key={idx} className="flex flex-col items-center gap-1.5 relative z-10 bg-surface px-1">
                              <div
                                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black transition-all ${isDone
                                    ? "bg-primary text-white shadow-md shadow-primary/20 scale-105"
                                    : "bg-surface-hover text-text-muted border border-border"
                                  }`}
                              >
                                {isDone ? "✓" : num}
                              </div>
                              <span className={`text-[11px] font-black ${isDone ? "text-text-primary dark:text-white" : "text-text-muted"}`}>
                                {s.title}
                              </span>
                              <span className="text-[9px] text-text-muted text-center hidden sm:block">
                                {s.desc}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Card Body */}
                    <div className="p-6 space-y-4 text-xs">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <span className="font-bold text-text-secondary block">Allocated Solar Kit:</span>
                          <div className="bg-surface-hover/70 p-3.5 sm:p-4 rounded-2xl border border-border flex gap-3.5 items-start">
                            <div className="relative w-14 h-14 sm:w-16 sm:h-16 shrink-0 rounded-xl overflow-hidden border border-border bg-surface shadow-xs flex items-center justify-center">
                              {item.image || item.kit_image ? (
                                <img
                                  src={item.image || item.kit_image}
                                  alt={item.item_name}
                                  className="w-full h-full object-cover rounded-xl"
                                  onError={(e) => {
                                    e.currentTarget.style.display = "none";
                                    if (e.currentTarget.nextSibling) e.currentTarget.nextSibling.style.display = "flex";
                                  }}
                                />
                              ) : null}
                              <div
                                className="w-full h-full flex items-center justify-center bg-primary/5 text-primary"
                                style={{ display: (item.image || item.kit_image) ? "none" : "flex" }}
                              >
                                <FaBoxOpen size={20} />
                              </div>
                            </div>
                            <div className="flex-1 min-w-0 space-y-1">
                              <p className="font-black text-sm text-text-primary dark:text-white leading-snug line-clamp-2">
                                {item.item_name || "Solar Kit Package"}
                              </p>
                              <div className="flex justify-between text-text-secondary text-[11px] pt-0.5">
                                <span>Allocated Quantity:</span>
                                <strong className="text-text-primary font-mono font-bold">{allocQty} Kit(s)</strong>
                              </div>
                              <div className="flex justify-between text-text-secondary text-[11px]">
                                <span>Rate per Kit:</span>
                                <span className="font-mono font-bold text-text-primary">₹{((item.unit_price_paise || 0) / 100).toLocaleString("en-IN")}</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <span className="font-bold text-text-secondary block">Commercial Payable Breakdown:</span>
                          <div className="bg-surface-hover p-4 rounded-2xl border border-border space-y-1.5">
                            <div className="flex justify-between text-text-secondary">
                              <span>Base Amount:</span>
                              <span className="font-mono">₹{baseAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                            </div>
                            <div className="flex justify-between text-text-secondary">
                              <span>GST ({item.gst_rate || 12}%):</span>
                              <span className="font-mono">₹{taxAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                            </div>
                            <div className="flex justify-between text-text-primary font-black text-sm pt-2 border-t border-border">
                              <span>Total Amount to Pay:</span>
                              <span className="text-primary font-mono text-base">₹{totalPayable.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Payment Verification Status Banner & Upload Action */}
                      <div className="pt-2">
                        {payStatus === "PENDING" && (
                          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2 text-amber-700 dark:text-amber-300 font-black">
                                <FaExclamationTriangle size={16} />
                                <span>Bank Transfer Payment Proof Required</span>
                              </div>
                              <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-amber-500/20 text-amber-800 dark:text-amber-200">
                                Payment Pending
                              </span>
                            </div>

                            {epcAlloc.payment_notes && (
                              <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-xs font-semibold">
                                Rejection Note from Franchisee/Admin: {epcAlloc.payment_notes}
                              </div>
                            )}

                            {selectedPoForUpload === order._id ? (
                              <div className="space-y-3 pt-2">
                                <input
                                  type="file"
                                  accept="image/*,.pdf"
                                  onChange={(e) => setPoReceiptFile(e.target.files[0])}
                                  className="block w-full text-xs text-text-secondary file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                                />
                                {poUploadMsg && (
                                  <p className="text-red-500 text-xs font-bold">{poUploadMsg}</p>
                                )}
                                <div className="flex gap-2">
                                  <button
                                    disabled={poUploading}
                                    onClick={() => handlePoReceiptUpload(order._id)}
                                    className="px-4 py-2 rounded-xl bg-primary text-white font-bold text-xs hover:opacity-90 disabled:opacity-50 cursor-pointer"
                                  >
                                    {poUploading ? "Uploading..." : "Submit Receipt for Verification"}
                                  </button>
                                  <button
                                    onClick={() => { setSelectedPoForUpload(null); setPoReceiptFile(null); setPoUploadMsg(""); }}
                                    className="px-4 py-2 rounded-xl bg-surface border border-border text-text-secondary font-bold text-xs hover:bg-surface-hover cursor-pointer"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-center justify-between pt-1">
                                <p className="text-xs text-text-secondary">
                                  Transfer ₹{totalPayable.toLocaleString("en-IN")} to the Franchisee's account and upload the receipt screenshot.
                                </p>
                                <button
                                  onClick={() => setSelectedPoForUpload(order._id)}
                                  className="px-4 py-2 rounded-xl bg-primary text-white font-black text-xs hover:opacity-90 cursor-pointer shadow-xs inline-flex items-center gap-1.5 shrink-0"
                                >
                                  <FaUpload size={12} /> Upload Receipt
                                </button>
                              </div>
                            )}
                          </div>
                        )}

                        {payStatus === "RECEIPT_SUBMITTED" && (
                          <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                            <div className="flex items-center gap-2.5">
                              <div className="p-2 rounded-xl bg-blue-500/20 text-blue-600 dark:text-blue-400 shrink-0">
                                <FaRegClock size={16} />
                              </div>
                              <div>
                                <div className="font-black text-blue-800 dark:text-blue-300 text-xs">
                                  Receipt Under Verification ⏳
                                </div>
                                <div className="text-xs text-text-secondary mt-0.5">
                                  Your Franchise Partner and Accounts team have received your payment proof and are verifying it. Once verified, this order will be confirmed.
                                </div>
                              </div>
                            </div>

                            {epcAlloc.payment_receipt_url && (
                              <a
                                href={
                                  epcAlloc.payment_receipt_url.startsWith("http")
                                    ? epcAlloc.payment_receipt_url
                                    : `${(import.meta.env.VITE_API_URL || "http://localhost:5000/api").replace(/\/api\/?$/, "")}${epcAlloc.payment_receipt_url.startsWith("/") ? "" : "/"}${epcAlloc.payment_receipt_url}`
                                }
                                target="_blank"
                                rel="noreferrer"
                                className="px-3 py-1.5 rounded-xl text-xs font-bold bg-surface border border-border text-primary hover:bg-surface-hover inline-flex items-center gap-1 shrink-0"
                              >
                                <FaEye size={12} /> View Receipt
                              </a>
                            )}
                          </div>
                        )}

                        {payStatus === "VERIFIED" && (
                          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                            <div className="flex items-center gap-2.5">
                              <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 shrink-0">
                                <FaCheckCircle size={16} />
                              </div>
                              <div>
                                <div className="font-black text-emerald-800 dark:text-emerald-300 text-xs">
                                  Payment Verified & Allocation Confirmed ✓
                                </div>
                                <div className="text-xs text-text-secondary mt-0.5">
                                  Payment receipt confirmed by Franchisee Partner & Accounts. Your kits are booked for dispatch.
                                </div>
                              </div>
                            </div>

                            {epcAlloc.payment_receipt_url && (
                              <a
                                href={
                                  epcAlloc.payment_receipt_url.startsWith("http")
                                    ? epcAlloc.payment_receipt_url
                                    : `${(import.meta.env.VITE_API_URL || "http://localhost:5000/api").replace(/\/api\/?$/, "")}${epcAlloc.payment_receipt_url.startsWith("/") ? "" : "/"}${epcAlloc.payment_receipt_url}`
                                }
                                target="_blank"
                                rel="noreferrer"
                                className="px-3 py-1.5 rounded-xl text-xs font-bold bg-surface border border-border text-text-primary hover:bg-surface-hover inline-flex items-center gap-1 shrink-0"
                              >
                                <FaEye size={12} /> View Receipt
                              </a>
                            )}
                          </div>
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

      {/* ── Re-submit Payment Proof Modal ────────────────────────────────────── */}
      {resubmittingOrder && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface rounded-3xl border border-border shadow-2xl max-w-lg w-full p-6 space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex justify-between items-center border-b border-border pb-3">
              <div>
                <h3 className="text-lg font-black text-text-primary dark:text-white">
                  Re-submit Payment Proof & UTR
                </h3>
                <p className="text-xs text-text-secondary mt-0.5">
                  Order #{resubmittingOrder.order_number}
                </p>
              </div>
              <button onClick={() => setResubmittingOrder(null)} className="text-text-secondary hover:text-text-primary p-1">
                <FaTimes size={18} />
              </button>
            </div>

            <form onSubmit={handleConfirmResubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-text-primary dark:text-white mb-1">
                  Correct UTR / Transaction Ref No. <span className="text-red-500">*</span>
                </label>
                <CustomInput
                  value={newUtr}
                  onChange={(e) => setNewUtr(e.target.value.toUpperCase())}
                  required
                  placeholder="e.g. HDFC0001928374"
                  className="font-mono uppercase font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-text-primary dark:text-white mb-1">
                    Amount Paid (₹) <span className="text-red-500">*</span>
                  </label>
                  <CustomInput
                    type="number"
                    value={newAmount}
                    onChange={(e) => setNewAmount(e.target.value)}
                    required
                    className="font-bold font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-text-primary dark:text-white mb-1">
                    Payment Date
                  </label>
                  <CustomInput
                    type="date"
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-text-primary dark:text-white mb-1">
                  Upload Fresh Receipt / Screenshot
                </label>
                <div className="border-2 border-dashed border-border rounded-xl p-4 text-center cursor-pointer relative bg-surface-hover">
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={handleResubmitFileChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  {newReceiptPreview ? (
                    <img src={newReceiptPreview} alt="Preview" className="max-h-28 mx-auto rounded object-contain" />
                  ) : (
                    <p className="text-xs text-text-secondary">
                      {newReceiptFile ? newReceiptFile.name : "Click to browse new payment screenshot"}
                    </p>
                  )}
                </div>
              </div>

              {resubmitError && (
                <div className="text-xs text-red-500 font-bold p-2 bg-red-500/10 rounded-lg">
                  {resubmitError}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="secondary" onClick={() => setResubmittingOrder(null)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" loading={resubmitLoading}>
                  Submit for Re-verification
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Tax Invoice View Modal ───────────────────────────────────────────── */}
      {viewingInvoice && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface rounded-3xl border border-border shadow-2xl max-w-2xl w-full p-6 space-y-5 animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-border pb-3">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 bg-emerald-500/15 text-emerald-600 rounded">
                  Official Tax Invoice
                </span>
                <h3 className="text-lg font-black text-text-primary dark:text-white mt-1">
                  Invoice #{viewingInvoice.invoice_number || "INV-SK-2026-001"}
                </h3>
              </div>
              <button onClick={() => setViewingInvoice(null)} className="text-text-secondary hover:text-text-primary p-1">
                <FaTimes size={18} />
              </button>
            </div>

            {invoiceLoading ? (
              <div className="py-12 text-center">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
              </div>
            ) : (
              <div className="space-y-4 text-xs">
                {/* Seller & Buyer Header */}
                <div className="grid grid-cols-2 gap-4 p-4 bg-surface-hover rounded-2xl border border-border">
                  <div>
                    <span className="text-[10px] font-bold text-text-muted uppercase">Seller</span>
                    <p className="font-extrabold text-text-primary dark:text-white mt-0.5">SolarKits Technologies Pvt Ltd</p>
                    <p className="text-text-secondary">GSTIN: 27AABCS1234F1Z5</p>
                    <p className="text-text-secondary text-[11px]">Mumbai, Maharashtra</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-text-muted uppercase">Billed To (EPC)</span>
                    <p className="font-extrabold text-text-primary dark:text-white mt-0.5">
                      {viewingInvoice.buyer?.company_name || viewingInvoice.buyer?.name}
                    </p>
                    <p className="text-text-secondary">GSTIN: {viewingInvoice.buyer?.gstin || "N/A"}</p>
                    <p className="text-text-secondary text-[11px]">{viewingInvoice.buyer?.email}</p>
                  </div>
                </div>

                {/* Items Table */}
                <div className="border border-border rounded-xl overflow-hidden">
                  <table className="w-full text-left">
                    <thead className="bg-surface-hover border-b border-border text-[11px] font-bold text-text-secondary">
                      <tr>
                        <th className="p-2.5">Item Description</th>
                        <th className="p-2.5 text-center">Qty</th>
                        <th className="p-2.5 text-right">Taxable</th>
                        <th className="p-2.5 text-right">GST (13.8%)</th>
                        <th className="p-2.5 text-right">Total (₹)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {(viewingInvoice.items || []).map((item, idx) => (
                        <tr key={idx}>
                          <td className="p-2.5 font-bold text-text-primary dark:text-white">{item.item_name}</td>
                          <td className="p-2.5 text-center">{item.quantity}</td>
                          <td className="p-2.5 text-right">₹{(item.taxable_amount || 0).toLocaleString("en-IN")}</td>
                          <td className="p-2.5 text-right">₹{(item.tax_amount || 0).toLocaleString("en-IN")}</td>
                          <td className="p-2.5 text-right font-bold">₹{(item.total_amount || 0).toLocaleString("en-IN")}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Total */}
                <div className="flex justify-between items-center p-3 bg-surface-hover rounded-xl font-bold text-sm">
                  <span>Grand Total (Incl. GST):</span>
                  <span className="text-lg font-black text-primary">
                    ₹{(viewingInvoice.financials?.grand_total || 0).toLocaleString("en-IN")}
                  </span>
                </div>

                {/* Payment Receipt Info */}
                <div className="p-3 border border-border rounded-xl flex justify-between items-center text-xs font-mono">
                  <span>UTR Reference: {viewingInvoice.payment?.utr_number}</span>
                  <span className="text-emerald-600 font-sans font-bold">Payment Verified & Settled</span>
                </div>

                <div className="flex justify-end pt-2">
                  <Button variant="secondary" onClick={() => window.print()} className="text-xs">
                    Print Invoice
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}