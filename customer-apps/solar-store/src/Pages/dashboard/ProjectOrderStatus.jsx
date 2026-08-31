import React, { useState, useEffect } from "react";
import axiosInstance from "@/utils/axiosInstance";
import { 
  FaShoppingCart, FaEye, FaRegClock, FaCheckCircle, 
  FaTimesCircle, FaMapMarkerAlt, FaEdit, FaTimes, FaTruck,
  FaWarehouse, FaTruckLoading, FaFileInvoice, FaRedo, FaUpload,
  FaBuilding, FaExclamationTriangle
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

  // Filter tab state
  const [activeTab, setActiveTab] = useState("All");

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

  useEffect(() => {
    fetchOrders();
    fetchStates();
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

  // Filter orders by tab
  const filteredOrders = orders.filter((o) => {
    const status = o.status?.toLowerCase();
    const pStatus = o.payment_status?.toLowerCase();
    if (activeTab === "Pending Verification") return pStatus === "pending_verification" || status === "pending_verification";
    if (activeTab === "Approved") return pStatus === "captured" || status === "confirmed";
    if (activeTab === "Dispatched") return status === "dispatched";
    if (activeTab === "Delivered") return status === "delivered" || status === "completed";
    if (activeTab === "Rejected") return pStatus === "rejected" || status === "rejected";
    return true;
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
          onClick={fetchOrders}
          className="inline-flex items-center gap-2 px-3.5 py-2 bg-surface hover:bg-surface-hover border border-border rounded-xl text-xs font-bold text-text-primary transition-colors shadow-sm self-start"
        >
          <BsArrowRepeat className={loading ? "animate-spin text-primary" : ""} /> Refresh
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
        {["All", "Pending Verification", "Approved", "Dispatched", "Delivered", "Rejected"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-xl text-xs font-black whitespace-nowrap transition-all ${
              activeTab === tab
                ? "bg-primary text-white shadow-md"
                : "bg-surface hover:bg-surface-hover text-text-secondary border border-border"
            }`}
          >
            {tab}
          </button>
        ))}
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
          <h3 className="text-base font-bold text-text-primary dark:text-white">No Orders Found</h3>
          <p className="text-xs text-text-secondary max-w-sm mx-auto">
            You don't have any purchase orders matching the "{activeTab}" filter.
          </p>
        </div>
      ) : (
        /* Orders List */
        <div className="space-y-5">
          {filteredOrders.map((order) => {
            const isEpcOrder = order.is_epc_order || order.order_type === "offline_epc_order";
            const orderId = order.order_number || order.id || order._id;
            const items = order.items || [];
            const isExpanded = expandedOrderId === orderId;

            const isPendingVerification = order.payment_status === "pending_verification" || order.status === "pending_verification";
            const isApproved = order.payment_status === "captured" || order.status === "confirmed";
            const isDispatched = order.order_status === "dispatched" || order.status === "dispatched";
            const isDelivered = order.order_status === "delivered" || order.status === "completed" || order.status === "delivered";
            const isRejected = order.payment_status === "rejected" || order.status === "rejected";

            // Determine timeline step (1: Submitted, 2: Verification, 3: Approved, 4: Dispatched, 5: Delivered)
            let step = 1;
            if (isDelivered) step = 5;
            else if (isDispatched) step = 4;
            else if (isApproved) step = 3;
            else if (isPendingVerification) step = 2;

            return (
              <div
                key={orderId}
                className="bg-surface rounded-3xl border border-border shadow-sm overflow-hidden transition-all hover:border-primary/40"
              >
                {/* Order Top Bar */}
                <div className="p-6 border-b border-border flex flex-col md:flex-row md:items-center justify-between gap-4 bg-surface-hover/30">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className="font-mono font-black text-base text-text-primary dark:text-white">
                        {order.order_number || `#${String(order._id).slice(-8).toUpperCase()}`}
                      </span>
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
                      Ordered on {new Date(order.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>

                  <div className="flex items-center gap-3 flex-wrap">
                    {/* Status Badge */}
                    {isRejected ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black bg-red-500/15 text-red-600 dark:text-red-400 border border-red-500/20">
                        <FaTimesCircle /> Payment Rejected
                      </span>
                    ) : isPendingVerification ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                        <FaRegClock /> Accounts Verification Pending
                      </span>
                    ) : isApproved && !isDispatched && !isDelivered ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                        <FaCheckCircle /> Payment Approved • Packing
                      </span>
                    ) : isDispatched ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/20">
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

                    <span className="text-base font-black text-text-primary dark:text-white">
                      ₹{(order.total_amount || order.selling_price_snapshot || 0).toLocaleString("en-IN")}
                    </span>
                  </div>
                </div>

                {/* Visual Progress Stepper */}
                {!isRejected && (
                  <div className="p-6 border-b border-border bg-surface">
                    <div className="grid grid-cols-5 gap-2 text-center text-xs">
                      {/* Step 1 */}
                      <div className={`space-y-1.5 ${step >= 1 ? "text-primary font-bold" : "text-text-muted"}`}>
                        <div className={`w-8 h-8 mx-auto rounded-full flex items-center justify-center text-xs font-black ${
                          step >= 1 ? "bg-primary text-white" : "bg-surface-hover border border-border"
                        }`}>
                          1
                        </div>
                        <p className="text-[11px] leading-tight">Order & UTR Placed</p>
                      </div>

                      {/* Step 2 */}
                      <div className={`space-y-1.5 ${step >= 2 ? "text-primary font-bold" : "text-text-muted"}`}>
                        <div className={`w-8 h-8 mx-auto rounded-full flex items-center justify-center text-xs font-black ${
                          step >= 2 ? "bg-primary text-white" : "bg-surface-hover border border-border"
                        }`}>
                          2
                        </div>
                        <p className="text-[11px] leading-tight">Accounts Review</p>
                      </div>

                      {/* Step 3 */}
                      <div className={`space-y-1.5 ${step >= 3 ? "text-primary font-bold" : "text-text-muted"}`}>
                        <div className={`w-8 h-8 mx-auto rounded-full flex items-center justify-center text-xs font-black ${
                          step >= 3 ? "bg-primary text-white" : "bg-surface-hover border border-border"
                        }`}>
                          3
                        </div>
                        <p className="text-[11px] leading-tight">Payment Approved</p>
                      </div>

                      {/* Step 4 */}
                      <div className={`space-y-1.5 ${step >= 4 ? "text-primary font-bold" : "text-text-muted"}`}>
                        <div className={`w-8 h-8 mx-auto rounded-full flex items-center justify-center text-xs font-black ${
                          step >= 4 ? "bg-primary text-white" : "bg-surface-hover border border-border"
                        }`}>
                          4
                        </div>
                        <p className="text-[11px] leading-tight">Dispatched</p>
                      </div>

                      {/* Step 5 */}
                      <div className={`space-y-1.5 ${step >= 5 ? "text-emerald-600 font-bold" : "text-text-muted"}`}>
                        <div className={`w-8 h-8 mx-auto rounded-full flex items-center justify-center text-xs font-black ${
                          step >= 5 ? "bg-emerald-500 text-white" : "bg-surface-hover border border-border"
                        }`}>
                          5
                        </div>
                        <p className="text-[11px] leading-tight">Delivered</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* High-visibility Rejection Notice if Accounts Rejected Payment */}
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
                      className="py-2.5 px-4 text-xs font-black shrink-0 shadow bg-red-600 hover:bg-red-700 border-none"
                    >
                      <FaRedo className="mr-1.5" /> Re-submit Receipt & UTR
                    </Button>
                  </div>
                )}

                {/* Dispatch / Logistics Details Bar if Dispatched */}
                {isDispatched && order.dispatch_tracking?.tracking_number && (
                  <div className="p-4 bg-purple-500/10 border-b border-purple-500/20 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-purple-900 dark:text-purple-200">
                    <div className="flex items-center gap-2.5">
                      <FaTruck className="text-purple-600 text-lg shrink-0" />
                      <div>
                        <span className="font-bold">Courier: {order.dispatch_tracking.courier_name || "Express Transport"}</span>
                        <span className="mx-2">•</span>
                        <span className="font-mono font-bold">LR / Waybill: {order.dispatch_tracking.tracking_number}</span>
                      </div>
                    </div>
                    {order.dispatch_tracking.tracking_url && (
                      <a
                        href={order.dispatch_tracking.tracking_url}
                        target="_blank"
                        rel="noreferrer"
                        className="font-black text-purple-600 dark:text-purple-400 hover:underline inline-flex items-center gap-1"
                      >
                        Live Tracking Link &rarr;
                      </a>
                    )}
                  </div>
                )}

                {/* Order Details Body */}
                <div className="p-6 space-y-4 text-xs">
                  {/* Items and quantities */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <span className="font-bold text-text-secondary block">Ordered Equipment / Kit:</span>
                      <div className="bg-surface-hover p-3 rounded-xl border border-border">
                        <p className="font-extrabold text-sm text-text-primary dark:text-white">
                          {order.combo_kit_id?.name || order.combo_kit_id?.kitName || (items[0] && items[0].item_name) || "Solar Kit Package"}
                        </p>
                        <p className="text-text-secondary text-xs mt-0.5">
                          Total Quantity: <strong>{order.total_kits || items.length || 1} Kit(s)</strong>
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <span className="font-bold text-text-secondary block">Offline Payment Details:</span>
                      <div className="bg-surface-hover p-3 rounded-xl border border-border space-y-1 font-mono">
                        <div className="flex justify-between">
                          <span className="text-text-secondary font-sans">UTR Ref:</span>
                          <span className="font-bold text-text-primary dark:text-white">
                            {order.offline_payment?.utr_number || order.payment_reference || "N/A"}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-text-secondary font-sans">Amount:</span>
                          <span className="font-bold text-emerald-600 dark:text-emerald-400 font-sans">
                            ₹{(order.offline_payment?.amount_paid || order.total_amount || 0).toLocaleString("en-IN")}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions Row */}
                  <div className="flex items-center justify-between pt-2 border-t border-border flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      {order.invoice?.invoice_number && (
                        <button
                          onClick={() => handleViewInvoice(order)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-surface hover:bg-surface-hover border border-border rounded-xl text-xs font-bold text-primary transition-colors"
                        >
                          <FaFileInvoice /> Tax Invoice ({order.invoice.invoice_number})
                        </button>
                      )}
                      {order.offline_payment?.receipt_url && (
                        <a
                          href={order.offline_payment.receipt_url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-surface hover:bg-surface-hover border border-border rounded-xl text-xs font-semibold text-text-secondary transition-colors"
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