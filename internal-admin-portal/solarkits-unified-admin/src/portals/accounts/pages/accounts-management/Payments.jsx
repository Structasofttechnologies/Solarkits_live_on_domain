import React, { useState, useEffect, useMemo, useRef } from "react";
import { useSelector } from "react-redux";
import {
  FaCreditCard, FaSearch, FaSpinner,
  FaCheckCircle, FaHistory,
  FaClipboardList, FaFilePdf, FaEye, FaChevronDown, FaChevronUp, FaFilter,
  FaUsers, FaLink, FaBuilding, FaBoxOpen, FaLayerGroup, FaTimes,
  FaMapMarkerAlt, FaPhone, FaEnvelope, FaShoppingCart, FaPlus, FaTrash,
  FaStore
} from "react-icons/fa";
import {
  getPurchaseOrders, payPurchaseOrder, uploadPaymentReceipt, cancelPurchaseOrder,
  getHierarchyOptions, getWarehouses, getWarehouseSuppliers, getWarehouseSkus,
  getPendingEpcFranchiseOrders, createCombinedSupplierPayment,
  getStates, getDistricts, getAllComboKits
} from "../../api/accounts";
import PageHeader from "../../components/PageHeader";
import Button from "../../components/Button";
import CustomTable from "../../components/CustomTable";
import Pagination from "../../components/Pagination";
import CustomInput from "../../components/CustomInput";
import DropdownWithSearchInput from "../../components/DropdownWithSearchInput";
import Dialog from "../../components/Dialog";
import CustomFilePicker from "../../components/CustomFilePicker";
import ConfirmationPopup from "../../components/ConfirmationPopup";

// ─── Default Product Images for BOM Breakdown ──────────────────────────────
const DEFAULT_PANEL_IMG = "https://images.unsplash.com/photo-1509391365360-2e959784a276?w=200&auto=format&fit=crop";
const DEFAULT_INVERTER_IMG = "https://images.unsplash.com/photo-1620714223084-8fcacc6dfd8d?w=200&auto=format&fit=crop";
const DEFAULT_STRUCTURE_IMG = "https://images.unsplash.com/photo-1545259741-2ea3ebf61fa3?w=200&auto=format&fit=crop";
const DEFAULT_ACDB_IMG = "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=200&auto=format&fit=crop";
const DEFAULT_CABLE_IMG = "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=200&auto=format&fit=crop";

function getItemBreakdown(item) {
  if (item.breakdown && item.breakdown.panels) {
    return item.breakdown;
  }
  const qty = Number(item.quantity) || 1;
  const itemName = (item.item_name || "").toLowerCase();
  const kwMatch = itemName.match(/(\d+(\.\d+)?)\s*kw/) || (item.capacity || "").match(/(\d+(\.\d+)?)/);
  const capacityKw = kwMatch ? parseFloat(kwMatch[1]) : 5;
  const panelsPerKit = Math.ceil((capacityKw * 1000) / 550) || 9;

  return {
    capacity_kw: capacityKw,
    kit_image: item.image || DEFAULT_PANEL_IMG,
    panels: {
      type: "solar_panel",
      name: "Bifacial Mono PERC 550W Solar Panel",
      sku_code: "PANEL-550W",
      brand: "Adani Solar / Tier-1",
      wattage: 550,
      quantity_per_kit: panelsPerKit,
      total_quantity: panelsPerKit * qty,
      image: DEFAULT_PANEL_IMG
    },
    inverters: {
      type: "inverter",
      name: `${capacityKw} kW On-Grid Solar Inverter`,
      sku_code: `INV-${capacityKw}KW`,
      brand: "Growatt / Sungrow",
      capacity_kw: capacityKw,
      quantity_per_kit: 1,
      total_quantity: 1 * qty,
      image: DEFAULT_INVERTER_IMG
    },
    bos_components: [
      {
        type: "Mounting Structure",
        name: "GI Hot-Dip Rooftop Mounting Structure",
        brand: "Heavy Duty Structural",
        quantity_per_kit: 1,
        total_quantity: 1 * qty,
        image: DEFAULT_STRUCTURE_IMG
      },
      {
        type: "Protection Box",
        name: "ACDB & DCDB IP65 Surge Protection Distribution Box",
        brand: "Schneider / Havells",
        quantity_per_kit: 1,
        total_quantity: 1 * qty,
        image: DEFAULT_ACDB_IMG
      },
      {
        type: "Cabling & Safety",
        name: "Solar DC Cable (4/6 sq.mm) & Earthing Kit",
        brand: "Polycab Solar",
        quantity_per_kit: 1,
        total_quantity: 1 * qty,
        image: DEFAULT_CABLE_IMG
      }
    ]
  };
}

// ─── Proforma Invoice Modal ────────────────────────────────────────────────────
function ProformaInvoiceModal({ isOpen, onClose, po, initialTab = "po" }) {
  const [activeTab, setActiveTab] = useState("po"); // "po" or "pi"

  // Reset tab when modal opens/closes
  useEffect(() => {
    if (isOpen) setActiveTab(initialTab);
  }, [isOpen, initialTab]);

  if (!po) return null;

  const purchaseOrderPdf = po.purchase_order_pdf;
  const proformaPdfUrl = po.proforma_invoice_pdf;

  return (
    <Dialog isOpen={isOpen} onClose={onClose} title="Order Documents Viewer" size="lg">
      <div className="space-y-4 p-1">
        {/* Toggle between PO and Proforma Invoice */}
        <div className="flex bg-surface-hover border border-border p-1 rounded-xl gap-1 max-w-xs">
          <button
            onClick={() => setActiveTab("po")}
            type="button"
            className={`flex-1 py-1.5 px-3 rounded-lg text-[10px] font-black uppercase transition-all ${activeTab === "po" ? "bg-primary text-white shadow-xs" : "text-text-secondary"}`}
          >
            Purchase Order
          </button>
          <button
            onClick={() => setActiveTab("pi")}
            type="button"
            className={`flex-1 py-1.5 px-3 rounded-lg text-[10px] font-black uppercase transition-all ${activeTab === "pi" ? "bg-primary text-white shadow-xs" : "text-text-secondary"}`}
          >
            Proforma Invoice
          </button>
        </div>

        {activeTab === "po" ? (
          purchaseOrderPdf ? (
            <div className="flex flex-col space-y-3">
              <div className="flex justify-between items-center bg-surface-hover border border-border p-3 rounded-xl">
                <div>
                  <span className="text-[10px] font-black text-text-muted uppercase tracking-widest block">Purchase Order No.</span>
                  <span className="text-sm font-black text-text-primary">#{po.po_number}</span>
                </div>
                <a
                  href={purchaseOrderPdf}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-white text-xs font-black uppercase tracking-wider hover:bg-primary/95 transition-all shadow-sm"
                >
                  <FaFilePdf size={10} /> Open In New Tab
                </a>
              </div>
              <div className="w-full h-[550px] border border-border rounded-xl overflow-hidden shadow-inner bg-slate-100 flex items-center justify-center">
                <iframe
                  src={purchaseOrderPdf}
                  className="w-full h-full"
                  title={`Purchase Order ${po.po_number}`}
                />
              </div>
            </div>
          ) : (
            <div className="p-12 text-center text-xs text-text-muted bg-surface-hover rounded-xl border border-dashed border-border italic">
              No system Purchase Order PDF has been generated for this order.
            </div>
          )
        ) : (
          proformaPdfUrl ? (
            <div className="flex flex-col space-y-3">
              <div className="flex justify-between items-center bg-surface-hover border border-border p-3 rounded-xl">
                <div>
                  <span className="text-[10px] font-black text-text-muted uppercase tracking-widest block">Proforma Invoice PDF</span>
                </div>
                <a
                  href={proformaPdfUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-info text-white text-xs font-black uppercase tracking-wider hover:bg-info/95 transition-all shadow-sm"
                >
                  <FaFilePdf size={10} /> Open In New Tab
                </a>
              </div>
              <div className="w-full h-[550px] border border-border rounded-xl overflow-hidden shadow-inner bg-slate-100 flex items-center justify-center">
                <iframe
                  src={proformaPdfUrl}
                  className="w-full h-full"
                  title={`Proforma Invoice ${po.po_number}`}
                />
              </div>
            </div>
          ) : (
            <div className="p-12 text-center text-xs text-text-muted bg-surface-hover rounded-xl border border-dashed border-border italic">
              No Proforma Invoice document has been uploaded for this order yet.
            </div>
          )
        )}
      </div>
    </Dialog>
  );
}

// ─── Reusable Customer Orders Table (Separate for EPC & Franchise) ───────────
function CustomerOrdersTable({
  title,
  icon: Icon,
  type, // "epc" | "franchise"
  orders,
  totalPendingCount,
  selectedOrderIds,
  toggleOrderSelection,
  onSelectAll,
  isAllSelected,
  selectedCount,
  expandedOrderId,
  setExpandedOrderId,
  hasActiveFilters,
  onResetFilters,
  loading,
}) {
  const isEpc = type === "epc";
  const themeAccent = isEpc ? "accent-blue-600" : "accent-purple-600";
  const themeIconBg = isEpc ? "bg-blue-500/10 text-blue-600" : "bg-purple-500/10 text-purple-600";
  const themeBadgeBg = isEpc ? "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300" : "bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300";
  const themeSelectedBg = isEpc
    ? "text-blue-600 bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800"
    : "text-purple-600 bg-purple-50 dark:bg-purple-950/40 border-purple-200 dark:border-purple-800";
  const themeHighlightRow = isEpc ? "bg-blue-50/50 dark:bg-blue-900/10" : "bg-purple-50/50 dark:bg-purple-900/10";

  return (
    <div className="space-y-3">
      {/* Section Title Header */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <span className={`p-1.5 rounded-lg ${themeIconBg}`}>
            <Icon className="w-3.5 h-3.5" />
          </span>
          <h3 className="font-bold text-sm text-text-primary">
            {title}
          </h3>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${themeBadgeBg}`}>
            {hasActiveFilters ? `${orders.length} of ${totalPendingCount} orders` : `${totalPendingCount} order${totalPendingCount !== 1 ? "s" : ""}`}
          </span>
        </div>
        {selectedCount > 0 && (
          <span className={`text-xs font-black px-3 py-1 rounded-lg border ${themeSelectedBg}`}>
            {selectedCount} Selected for Combined Supplier Payment
          </span>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16 bg-surface border border-border rounded-2xl">
          <FaSpinner className={`animate-spin ${isEpc ? "text-blue-600" : "text-purple-600"} text-2xl`} />
          <span className="ml-3 text-sm text-text-secondary font-semibold">Loading {isEpc ? "EPC" : "Franchise"} orders...</span>
        </div>
      ) : totalPendingCount === 0 ? (
        <div className="bg-surface border border-dashed border-border rounded-2xl p-10 text-center">
          <FaBoxOpen className="text-4xl text-text-muted mx-auto mb-2 opacity-50" />
          <p className="text-sm font-bold text-text-secondary">No pending {isEpc ? "EPC customer" : "Franchise"} orders</p>
          <p className="text-xs text-text-muted mt-0.5">All {isEpc ? "EPC" : "Franchise"} orders have been combined and paid to suppliers.</p>
        </div>
      ) : orders.length === 0 ? (
        <div className="bg-surface border border-dashed border-border rounded-2xl p-10 text-center">
          <FaBoxOpen className="text-4xl text-text-muted mx-auto mb-2 opacity-50" />
          <p className="text-sm font-bold text-text-secondary">No {isEpc ? "EPC" : "Franchise"} orders matching the selected master filters</p>
          <p className="text-xs text-text-muted mt-0.5">Try adjusting or clearing your filter criteria above.</p>
          <button
            type="button"
            onClick={onResetFilters}
            className={`mt-3 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-white text-xs font-bold transition-all cursor-pointer shadow-xs ${isEpc ? "bg-blue-600 hover:bg-blue-700" : "bg-purple-600 hover:bg-purple-700"}`}
          >
            <FaTimes size={10} />
            <span>Reset All Filters</span>
          </button>
        </div>
      ) : (
        <div className="bg-surface border border-border rounded-2xl overflow-hidden shadow-xs">
          {/* Table header */}
          <div className="px-6 py-3.5 border-b border-border bg-surface-hover flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={isAllSelected}
                onChange={onSelectAll}
                className={`w-4 h-4 rounded border-border ${themeAccent} cursor-pointer`}
              />
              <span className="text-xs font-black text-text-secondary uppercase tracking-wider">
                Select All {isEpc ? "EPC" : "Franchise"} Orders
              </span>
            </div>
            <span className="text-[10px] text-text-muted font-bold">
              Click any order to view exact solar panels, inverters &amp; BOS breakdown with images
            </span>
          </div>

          <div className="divide-y divide-border">
            {orders.map((order) => {
              const orderId = order.id || order._id;
              const isSelected = selectedOrderIds.has(orderId);
              const isExpanded = expandedOrderId === orderId;
              return (
                <div key={orderId} className={`transition-all ${isSelected ? themeHighlightRow : "hover:bg-surface-hover/60"}`}>
                  {/* Row */}
                  <div className="px-6 py-4 flex items-start gap-4">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleOrderSelection(orderId)}
                      className={`mt-1 w-4 h-4 rounded border-border ${themeAccent} cursor-pointer flex-shrink-0`}
                    />
                    <div
                      className="flex-1 grid grid-cols-5 gap-4 min-w-0 cursor-pointer select-none"
                      onClick={() => setExpandedOrderId(isExpanded ? null : orderId)}
                      title={isExpanded ? "Click to collapse / close order" : "Click to view breakdown & images"}
                    >
                      {/* Order Number + Type */}
                      <div>
                        <div className="text-[10px] text-text-muted uppercase font-bold mb-1">Order</div>
                        <div className="text-xs font-black text-text-primary">{order.order_number}</div>
                        <span className={`inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase border ${order.order_type === "epc" ? "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-700/40" : "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/20 dark:text-purple-400 dark:border-purple-700/40"}`}>
                          {order.order_type === "epc" ? <FaBuilding size={8} /> : <FaStore size={8} />} {order.order_type === "epc" ? "EPC Customer" : "Franchise Store"}
                        </span>
                      </div>
                      {/* Customer */}
                      <div className="space-y-1">
                        <div className="text-[10px] text-text-muted uppercase font-bold">
                          {order.order_type === "franchise" ? "Franchise Partner" : "EPC Buyer"}
                        </div>
                        <div className="text-xs font-black text-text-primary truncate" title={order.customer_name}>
                          {order.customer_name}
                        </div>
                        {order.customer_gstin && order.customer_gstin !== "-" ? (
                          <div className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-[10px] font-mono font-bold text-emerald-700 dark:text-emerald-300">
                            <span className="text-[8px] uppercase tracking-wider text-emerald-600 dark:text-emerald-400">GSTIN:</span>
                            <span>{order.customer_gstin}</span>
                          </div>
                        ) : (
                          <div className="inline-flex items-center px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[9px] font-mono text-text-muted">
                            GST: Not Available
                          </div>
                        )}
                        <div className="text-[10px] text-text-muted flex items-center gap-1">
                          <FaPhone size={8} className="text-text-muted flex-shrink-0" />
                          <span>{order.customer_contact}</span>
                        </div>
                      </div>
                      {/* Delivery Location */}
                      <div>
                        <div className="text-[10px] text-text-muted uppercase font-bold mb-1">
                          {order.order_type === "franchise" ? "Store Location" : "Delivery To"}
                        </div>
                        {order.delivery_address ? (
                          <>
                            <div className="text-xs font-semibold text-text-primary flex items-center gap-1">
                              <FaMapMarkerAlt size={9} className={`${isEpc ? "text-blue-500" : "text-purple-500"} flex-shrink-0`} />
                              {order.delivery_address.district_name || order.delivery_address.city || order.delivery_address.address_line || "—"}
                            </div>
                            <div className="text-[10px] text-text-muted">{order.delivery_address.state_name || ""}</div>
                            {order.delivery_address.pincode && (
                              <div className="text-[9px] text-text-muted">PIN: {order.delivery_address.pincode}</div>
                            )}
                          </>
                        ) : (
                          <div className="text-[10px] text-text-muted italic">No address</div>
                        )}
                      </div>
                      {/* Order Value */}
                      <div>
                        <div className="text-[10px] text-text-muted uppercase font-bold mb-1">Order Value</div>
                        <div className="text-sm font-black text-text-primary">₹{(order.order_amount || 0).toLocaleString("en-IN")}</div>
                        <div className="text-[10px] text-text-muted mt-0.5">{order.items?.length || 0} item(s)</div>
                      </div>
                      {/* Status + Date */}
                      <div>
                        <div className="text-[10px] text-text-muted uppercase font-bold mb-1">Status</div>
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase border inline-block ${order.payment_status === "captured" || order.payment_status === "paid" ? "bg-success/10 text-success border-success/20" : "bg-warning/10 text-warning border-warning/20"}`}>
                          {order.payment_status === "captured" || order.payment_status === "paid" ? "Paid" : "Pending Verification"}
                        </span>
                        <div className="text-[9px] text-text-muted mt-1.5">{order.created_at ? new Date(order.created_at).toLocaleDateString() : "—"}</div>
                      </div>
                    </div>
                    {/* Expand / Collapse button */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setExpandedOrderId(isExpanded ? null : orderId);
                      }}
                      className={`flex-shrink-0 p-1.5 rounded-lg border transition-all cursor-pointer ${
                        isExpanded
                          ? "text-primary border-primary/30 bg-primary/10 hover:bg-primary/20"
                          : "text-text-muted hover:text-primary border-transparent hover:border-border hover:bg-surface-hover"
                      }`}
                      title={isExpanded ? "Collapse / Close Order" : "View Breakdown & Images"}
                    >
                      <FaChevronDown className={`text-xs transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`} />
                    </button>
                  </div>

                  {/* Expanded item details with rich BOM breakdown & product images */}
                  {isExpanded && (
                    <div className="px-6 py-5 bg-surface-hover/30 border-t border-border space-y-4">
                      <div className="flex items-center justify-between gap-3 flex-wrap">
                        <div className="text-[11px] font-black text-text-muted uppercase tracking-widest flex items-center gap-2">
                          <FaBoxOpen className="text-primary text-xs" />
                          Order Items &amp; Complete Kit Component Breakdown
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-[10px] font-bold text-text-muted">
                            {(order.items || []).length} item{(order.items || []).length !== 1 ? "s" : ""}
                          </span>
                          <button
                            type="button"
                            onClick={() => setExpandedOrderId(null)}
                            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold text-text-secondary hover:text-danger bg-surface border border-border hover:border-danger/30 hover:bg-danger/5 transition-all cursor-pointer shadow-xs"
                            title="Close Order Tab"
                          >
                            <FaTimes size={10} className="text-danger" />
                            <span>Close Order Tab</span>
                          </button>
                        </div>
                      </div>

                      <div className="space-y-4">
                        {(order.items || []).map((item, idx) => {
                          const isKit = item.scope_type === "kit" || (!item.scope_type && item.kit_id) || (item.item_name || "").toLowerCase().includes("kit") || item.breakdown;
                          const breakdown = isKit ? getItemBreakdown(item) : null;

                          return (
                            <div key={idx} className="bg-surface rounded-2xl border border-border shadow-xs overflow-hidden">
                              {/* Item Title Bar */}
                              <div className="p-4 bg-surface-hover/50 border-b border-border flex flex-col md:flex-row md:items-center justify-between gap-3">
                                <div className="flex items-center gap-3.5 min-w-0">
                                  <img
                                    src={item.image || breakdown?.kit_image || DEFAULT_PANEL_IMG}
                                    alt={item.item_name}
                                    className="w-14 h-14 rounded-xl object-cover border border-border shadow-xs flex-shrink-0 bg-white"
                                  />
                                  <div className="min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <h4 className="text-sm font-black text-text-primary tracking-tight">{item.item_name}</h4>
                                      {isKit && (
                                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-purple-50 text-purple-700 border border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800">
                                          Combo Kit
                                        </span>
                                      )}
                                      {item.capacity && (
                                        <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-primary/10 text-primary border border-primary/20">
                                          {item.capacity}
                                        </span>
                                      )}
                                    </div>
                                    <div className="text-xs text-text-secondary font-semibold mt-1 flex items-center gap-2 flex-wrap">
                                      <span>Order Quantity: <strong className="text-text-primary font-black">{item.quantity} {isKit ? "Kit" : "Unit"}{item.quantity > 1 ? "s" : ""}</strong></span>
                                      <span className="text-text-muted">•</span>
                                      <span>Rate: <strong className="text-text-primary">₹{(item.unit_price || 0).toLocaleString("en-IN")}</strong> / {isKit ? "kit" : "unit"}</span>
                                    </div>
                                  </div>
                                </div>
                                <div className="text-right flex-shrink-0 bg-primary/5 px-4 py-2 rounded-xl border border-primary/10">
                                  <div className="text-[10px] font-black text-text-muted uppercase tracking-wider">Item Total Value</div>
                                  <div className="text-base font-black text-primary">₹{(item.total_price || 0).toLocaleString("en-IN")}</div>
                                </div>
                              </div>

                              {/* Rich Component Breakdown for Combo Kits */}
                              {breakdown && (
                                <div className="p-4 bg-bg/40 space-y-3">
                                  <div className="flex items-center justify-between">
                                    <span className="text-[11px] font-black uppercase tracking-wider text-text-secondary flex items-center gap-1.5">
                                      <FaBoxOpen className="text-amber-500 text-xs" />
                                      Bill of Materials (BOM) Breakdown — Exact Components to Procure
                                    </span>
                                    <span className="text-[10px] font-bold text-text-muted">
                                      Total components for {item.quantity} Kit{item.quantity > 1 ? "s" : ""}
                                    </span>
                                  </div>

                                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                    {/* 1. Solar Panels Card */}
                                    {breakdown.panels && (
                                      <div className="p-3.5 rounded-xl border border-amber-300/80 dark:border-amber-700/60 bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent flex items-start gap-3">
                                        <img
                                          src={breakdown.panels.image || DEFAULT_PANEL_IMG}
                                          alt={breakdown.panels.name}
                                          className="w-16 h-16 rounded-lg object-cover border border-amber-300 dark:border-amber-700/60 flex-shrink-0 shadow-xs bg-white"
                                        />
                                        <div className="min-w-0 flex-1">
                                          <div className="flex items-center justify-between gap-1 mb-1">
                                            <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-amber-500 text-white shadow-xs">
                                              ☀️ Solar Panels
                                            </span>
                                            <span className="text-xs font-black text-amber-700 dark:text-amber-300">
                                              {breakdown.panels.total_quantity} Pcs Total
                                            </span>
                                          </div>
                                          <div className="text-xs font-bold text-text-primary line-clamp-1">
                                            {breakdown.panels.name}
                                          </div>
                                          <div className="text-[10px] text-text-secondary font-medium mt-0.5">
                                            Brand: <strong className="text-text-primary">{breakdown.panels.brand}</strong>
                                          </div>
                                          <div className="text-[10px] font-semibold text-amber-800 dark:text-amber-200/90 mt-1 bg-amber-100/70 dark:bg-amber-950/60 px-2 py-0.5 rounded-md inline-block">
                                            {breakdown.panels.quantity_per_kit} pcs/kit × {item.quantity} kits = <strong className="font-black text-amber-900 dark:text-amber-100">{breakdown.panels.total_quantity} Panels</strong>
                                          </div>
                                        </div>
                                      </div>
                                    )}

                                    {/* 2. Inverters Card */}
                                    {breakdown.inverters && (
                                      <div className="p-3.5 rounded-xl border border-blue-300/80 dark:border-blue-700/60 bg-gradient-to-br from-blue-500/10 via-blue-500/5 to-transparent flex items-start gap-3">
                                        <img
                                          src={breakdown.inverters.image || DEFAULT_INVERTER_IMG}
                                          alt={breakdown.inverters.name}
                                          className="w-16 h-16 rounded-lg object-cover border border-blue-300 dark:border-blue-700/60 flex-shrink-0 shadow-xs bg-white"
                                        />
                                        <div className="min-w-0 flex-1">
                                          <div className="flex items-center justify-between gap-1 mb-1">
                                            <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-blue-600 text-white shadow-xs">
                                              ⚡ Solar Inverter
                                            </span>
                                            <span className="text-xs font-black text-blue-700 dark:text-blue-300">
                                              {breakdown.inverters.total_quantity} Pcs Total
                                            </span>
                                          </div>
                                          <div className="text-xs font-bold text-text-primary line-clamp-1">
                                            {breakdown.inverters.name}
                                          </div>
                                          <div className="text-[10px] text-text-secondary font-medium mt-0.5">
                                            Brand: <strong className="text-text-primary">{breakdown.inverters.brand}</strong>
                                          </div>
                                          <div className="text-[10px] font-semibold text-blue-800 dark:text-blue-200/90 mt-1 bg-blue-100/70 dark:bg-blue-950/60 px-2 py-0.5 rounded-md inline-block">
                                            {breakdown.inverters.quantity_per_kit} pc/kit × {item.quantity} kits = <strong className="font-black text-blue-900 dark:text-blue-100">{breakdown.inverters.total_quantity} Inverters</strong>
                                          </div>
                                        </div>
                                      </div>
                                    )}

                                    {/* 3. BOS & Protection Items Card */}
                                    {breakdown.bos_components && breakdown.bos_components.length > 0 && (
                                      <div className="p-3.5 rounded-xl border border-emerald-300/80 dark:border-emerald-700/60 bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-transparent flex flex-col justify-between">
                                        <div>
                                          <div className="flex items-center justify-between gap-1 mb-2">
                                            <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-emerald-600 text-white shadow-xs">
                                              🔧 BOS &amp; Protection
                                            </span>
                                            <span className="text-[10px] font-extrabold text-emerald-700 dark:text-emerald-300">
                                              Complete Kit Included
                                            </span>
                                          </div>
                                          <div className="space-y-1.5">
                                            {breakdown.bos_components.map((bos, bIdx) => (
                                              <div key={bIdx} className="flex items-center gap-2 bg-white/70 dark:bg-surface/70 px-2 py-1 rounded-lg border border-emerald-100 dark:border-emerald-900/40 text-[10px]">
                                                <img src={bos.image || DEFAULT_STRUCTURE_IMG} alt={bos.name} className="w-5 h-5 rounded object-cover flex-shrink-0" />
                                                <span className="font-bold text-text-primary truncate flex-1">{bos.name}</span>
                                                <span className="font-black text-emerald-700 dark:text-emerald-300 whitespace-nowrap">
                                                  {bos.total_quantity} Sets
                                                </span>
                                              </div>
                                            ))}
                                          </div>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {/* Bottom close bar */}
                      <div className="pt-2 flex items-center justify-between border-t border-border/60">
                        <span className="text-[10px] text-text-muted font-medium">
                          Viewing itemized Bill of Materials &amp; equipment specifications for order <strong className="text-text-primary font-bold">{order.order_number}</strong>
                        </span>
                        <button
                          type="button"
                          onClick={() => setExpandedOrderId(null)}
                          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold text-text-secondary hover:text-text-primary bg-surface border border-border hover:bg-surface-hover hover:border-primary/40 transition-all cursor-pointer shadow-xs"
                        >
                          <FaChevronUp size={11} className="text-primary" />
                          <span>Close / Collapse Tab</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default function Payments() {
  const { selectedScope } = useSelector((state) => state.user_slice);
  const activeClusterName = selectedScope?.clusterName || "Selected Cluster";
  const activeClusterId = selectedScope?.cluster;
  const activeStateId = selectedScope?.state;
  const activeCountryId = selectedScope?.country;

  const [activeTab, setActiveTab] = useState("pending"); // "pending" or "history"
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [warehouseFilter, setWarehouseFilter] = useState("All");
  const [supplierFilter, setSupplierFilter] = useState("All");

  // Quick Filters (Industry → Category → Sub Category → System Type → Project Range)
  const [quickFilters, setQuickFilters] = useState({
    industryType: "all",
    category: "all",
    subCategory: "all",
    systemType: "all",
    projectRange: "all",
  });

  const [hierarchy, setHierarchy] = useState({
    shopHierarchy: [],
    industries: [],
    categories: [],
    subcategories: [],
    types: [],
    ranges: [],
  });

  const fetchHierarchy = async () => {
    try {
      const res = await getHierarchyOptions();
      if (res?.status === "success" && res.data) {
        setHierarchy(res.data);
      }
    } catch (err) {
      console.error("Failed to load hierarchy options:", err);
    }
  };

  useEffect(() => {
    fetchHierarchy();
  }, []);

  // ── Location Filter State (State & District) ───────────────────────────────
  const [selectedState, setSelectedState] = useState("all");
  const [selectedDistrict, setSelectedDistrict] = useState("all");
  const [statesList, setStatesList] = useState([]);
  const [districtsList, setDistrictsList] = useState([]);
  const [loadingDistricts, setLoadingDistricts] = useState(false);

  // ── Product Filter State (Admin Combo Kits) ────────────────────────────────
  const [selectedComboKit, setSelectedComboKit] = useState("all");
  const [allAdminKits, setAllAdminKits] = useState([]);
  const [loadingAdminKits, setLoadingAdminKits] = useState(false);

  // ── EPC & Franchise Specific Entity Filter States ─────────────────────────
  const [selectedEpcId, setSelectedEpcId] = useState("all");
  const [selectedFranchiseId, setSelectedFranchiseId] = useState("all");
  const [epcList, setEpcList] = useState([]);
  const [franchiseList, setFranchiseList] = useState([]);

  // Load States on mount
  useEffect(() => {
    const fetchStates = async () => {
      try {
        const res = await getStates();
        if (res?.data || res?.states) {
          setStatesList(res.data || res.states || []);
        }
      } catch (err) {
        console.error("Failed to fetch states:", err);
      }
    };
    fetchStates();
  }, []);

  // Load Districts when state changes
  useEffect(() => {
    if (!selectedState || selectedState === "all") {
      setDistrictsList([]);
      setSelectedDistrict("all");
      return;
    }
    const fetchDistricts = async () => {
      setLoadingDistricts(true);
      try {
        const found = statesList.find(s => String(s.id || s._id) === String(selectedState) || s.name?.toLowerCase() === String(selectedState).toLowerCase());
        const sId = found ? (found.id || found._id) : selectedState;
        const res = await getDistricts(sId);
        if (res?.data || res?.districts) {
          setDistrictsList(res.data || res.districts || []);
        }
      } catch (err) {
        console.error("Failed to fetch districts:", err);
      } finally {
        setLoadingDistricts(false);
      }
    };
    fetchDistricts();
  }, [selectedState, statesList]);

  // Load All Admin Combo Kits on mount
  useEffect(() => {
    const fetchKits = async () => {
      setLoadingAdminKits(true);
      try {
        const res = await getAllComboKits();
        if (res?.status === "success" && res.data) {
          setAllAdminKits(res.data || []);
        }
      } catch (err) {
        console.error("Failed to load admin combo kits:", err);
      } finally {
        setLoadingAdminKits(false);
      }
    };
    fetchKits();
  }, []);

  // Pay Modal State
  const [selectedPO, setSelectedPO] = useState(null);
  const [isPayOpen, setIsPayOpen] = useState(false);
  const [payForm, setPayForm] = useState({
    reference_no: "",
    proforma_invoice_no: "",
    payment_date: new Date().toLocaleDateString('en-CA'),
    amount: "",
    payment_mode: "NEFT",
    receipt_url: ""
  });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [uploadingReceipt, setUploadingReceipt] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadingPI, setUploadingPI] = useState(false);
  const [selectedPIFile, setSelectedPIFile] = useState(null);

  // Proforma Invoice Modal State
  const [proformaModalOpen, setProformaModalOpen] = useState(false);
  const [proformaPO, setProformaPO] = useState(null);
  const [proformaInitialTab, setProformaInitialTab] = useState("po");

  // Products Ordered Modal State
  const [itemsModalOpen, setItemsModalOpen] = useState(false);
  const [selectedItems, setSelectedItems] = useState([]);

  // Cancel PO Dialog State
  const [cancelConfirmOpen, setCancelConfirmOpen] = useState(false);
  const [cancelPoId, setCancelPoId] = useState(null);
  const [cancelLoading, setCancelLoading] = useState(false);

  // ── EPC & Franchise Pending Orders ─────────────────────────────────────────
  const [pendingEpcOrders, setPendingEpcOrders] = useState([]);
  const [loadingEpcOrders, setLoadingEpcOrders] = useState(false);
  const [selectedOrderIds, setSelectedOrderIds] = useState(new Set()); // checked order IDs
  const [expandedOrderId, setExpandedOrderId] = useState(null);        // expanded order detail row
  const [awaitingSubFilter, setAwaitingSubFilter] = useState("all");    // "all" | "customer_orders" | "supplier_pos"

  // Auto-expand the first pending customer order only once upon initial data load
  const hasAutoExpandedRef = useRef(false);
  useEffect(() => {
    if (pendingEpcOrders.length > 0 && !hasAutoExpandedRef.current) {
      hasAutoExpandedRef.current = true;
      setExpandedOrderId(pendingEpcOrders[0].id || pendingEpcOrders[0]._id);
    }
  }, [pendingEpcOrders]);

  const pendingPOCount = useMemo(() => {
    return purchaseOrders.filter(po => po.status === "pending" || po.status === "accepted" || po.status === "invoiced").length;
  }, [purchaseOrders]);

  // ── Combine & Pay Supplier Modal ───────────────────────────────────────────
  const [combineModalOpen, setCombineModalOpen] = useState(false);
  const [warehouses, setWarehouses] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [combineForm, setCombineForm] = useState({
    warehouse_id: "",
    supplier_id: "",
    timeline: new Date(Date.now() + 7 * 86400000).toLocaleDateString('en-CA'), // +7 days
    // Payment details
    reference_no: "",
    proforma_invoice_no: "",
    payment_date: new Date().toLocaleDateString('en-CA'),
    amount: "",
    payment_mode: "NEFT",
    receipt_url: "",
  });
  const [combineItems, setCombineItems] = useState([]); // [{sku_id, sku_code, qty, order_price}]
  const [combineSubmitting, setCombineSubmitting] = useState(false);
  const [combineError, setCombineError] = useState("");
  const [combineSuccess, setCombineSuccess] = useState("");
  const [combineReceiptFile, setCombineReceiptFile] = useState(null);
  const [uploadingCombineReceipt, setUploadingCombineReceipt] = useState(false);
  const [warehouseSkus, setWarehouseSkus] = useState([]);
  const [loadingSkus, setLoadingSkus] = useState(false);

  const fetchPendingEpcOrders = async () => {
    setLoadingEpcOrders(true);
    try {
      const res = await getPendingEpcFranchiseOrders();
      if (res?.status === "success") {
        const epc = res.data?.epc_orders || [];
        const fpo = res.data?.franchise_orders || [];
        setPendingEpcOrders([...epc, ...fpo]);
        if (res.data?.epc_list) setEpcList(res.data.epc_list);
        if (res.data?.franchise_list) setFranchiseList(res.data.franchise_list);
      }
    } catch (err) {
      console.error("Failed to fetch pending EPC/Franchise orders:", err);
    } finally {
      setLoadingEpcOrders(false);
    }
  };

  const computedEpcOptions = useMemo(() => {
    const map = new Map();
    (epcList || []).forEach(e => {
      const key = String(e.id || e.name);
      map.set(key, { ...e, id: key });
    });
    (pendingEpcOrders || []).filter(o => o.order_type === "epc").forEach(o => {
      const key = String(o.entity_id || o.customer_name);
      if (!map.has(key)) {
        map.set(key, {
          id: key,
          name: o.customer_name,
          gstin: o.customer_gstin !== "-" ? o.customer_gstin : "",
          pending_count: 1
        });
      } else {
        const existing = map.get(key);
        if (!existing.gstin && o.customer_gstin && o.customer_gstin !== "-") {
          existing.gstin = o.customer_gstin;
        }
      }
    });
    return Array.from(map.values()).sort((a, b) => (b.pending_count || 0) - (a.pending_count || 0) || a.name.localeCompare(b.name));
  }, [epcList, pendingEpcOrders]);

  const computedFranchiseOptions = useMemo(() => {
    const map = new Map();
    (franchiseList || []).forEach(f => {
      const key = String(f.id || f.name);
      map.set(key, { ...f, id: key });
    });
    (pendingEpcOrders || []).filter(o => o.order_type === "franchise").forEach(o => {
      const key = String(o.entity_id || o.customer_name);
      if (!map.has(key)) {
        map.set(key, {
          id: key,
          name: o.customer_name,
          gstin: o.customer_gstin !== "-" ? o.customer_gstin : "",
          pending_count: 1
        });
      } else {
        const existing = map.get(key);
        if (!existing.gstin && o.customer_gstin && o.customer_gstin !== "-") {
          existing.gstin = o.customer_gstin;
        }
      }
    });
    return Array.from(map.values()).sort((a, b) => (b.pending_count || 0) - (a.pending_count || 0) || a.name.localeCompare(b.name));
  }, [franchiseList, pendingEpcOrders]);

  const handleCombineWarehouseChange = async (whId) => {
    setCombineForm(prev => ({ ...prev, warehouse_id: whId, supplier_id: "" }));
    fetchSuppliersForWarehouse(whId);
    if (whId) {
      setLoadingSkus(true);
      try {
        const res = await getWarehouseSkus(whId);
        if (res?.status === "success") {
          setWarehouseSkus(res.data || []);
        }
      } catch (err) {
        console.error("Failed to load warehouse SKUs:", err);
      } finally {
        setLoadingSkus(false);
      }
    } else {
      setWarehouseSkus([]);
    }
  };

  const fetchWarehouses = async () => {
    try {
      const res = await getWarehouses(activeClusterId || "", activeStateId || "", activeCountryId || "");
      if (res?.status === "success") setWarehouses(res.data || []);
    } catch (err) { console.error("Failed to load warehouses:", err); }
  };

  const fetchSuppliersForWarehouse = async (warehouseId) => {
    if (!warehouseId) { setSuppliers([]); return; }
    try {
      const res = await getWarehouseSuppliers(warehouseId);
      if (res?.status === "success") setSuppliers(res.data || []);
    } catch (err) { console.error("Failed to load suppliers:", err); }
  };

  const fetchOrders = async () => {
    setLoadingOrders(true);
    try {
      const res = await getPurchaseOrders(activeClusterId || "", activeStateId || "", activeCountryId || "");
      if (res && res.status === "success") {
        setPurchaseOrders(res.data || []);
      }
    } catch (err) {
      console.error("Failed to fetch purchase orders:", err);
    } finally {
      setLoadingOrders(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    fetchPendingEpcOrders();
    fetchWarehouses();
    setWarehouseFilter("All");
    setSupplierFilter("All");
    setQuickFilters({ industryType: "all", category: "all", subCategory: "all", systemType: "all", projectRange: "all" });
    setPage(1);
  }, [activeClusterId, activeStateId, activeCountryId]);

  // Toggle selection of an EPC/Franchise order
  const toggleOrderSelection = (id) => {
    setSelectedOrderIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAllOrders = () => {
    if (selectedOrderIds.size === filteredEpcOrders.length && filteredEpcOrders.length > 0) {
      setSelectedOrderIds(new Set());
    } else {
      setSelectedOrderIds(new Set(filteredEpcOrders.map(o => o.id || o._id)));
    }
  };

  const openCombineModal = () => {
    if (selectedOrderIds.size === 0) return;
    setCombineForm({
      warehouse_id: "",
      supplier_id: "",
      timeline: new Date(Date.now() + 7 * 86400000).toLocaleDateString('en-CA'),
      reference_no: "",
      proforma_invoice_no: "",
      payment_date: new Date().toLocaleDateString('en-CA'),
      amount: "",
      payment_mode: "NEFT",
      receipt_url: "",
    });
    setCombineItems([{ sku_id: "", sku_code: "", qty: 1, order_price: "" }]);
    setSuppliers([]);
    setWarehouseSkus([]);
    setCombineError("");
    setCombineSuccess("");
    setCombineReceiptFile(null);
    setCombineModalOpen(true);
  };

  const handleCombineSubmit = async (e) => {
    e.preventDefault();
    setCombineError("");
    setCombineSuccess("");

    if (!combineForm.warehouse_id || !combineForm.supplier_id || !combineForm.reference_no || !combineForm.payment_date || !combineForm.amount || !combineForm.payment_mode) {
      setCombineError("All fields are required.");
      return;
    }
    const validItems = combineItems.filter(it => it.sku_id && it.qty > 0 && it.order_price > 0);
    if (validItems.length === 0) {
      setCombineError("Add at least one valid SKU item.");
      return;
    }

    setCombineSubmitting(true);
    let receiptUrl = combineForm.receipt_url;

    if (combineReceiptFile) {
      setUploadingCombineReceipt(true);
      try {
        const uploadRes = await uploadPaymentReceipt(combineReceiptFile);
        if (uploadRes?.status === "success" && uploadRes.url) {
          receiptUrl = uploadRes.url;
        } else {
          setCombineError(uploadRes.message || "Failed to upload receipt.");
          setCombineSubmitting(false);
          setUploadingCombineReceipt(false);
          return;
        }
      } catch (err) {
        setCombineError(err.response?.data?.message || err.message || "Upload failed.");
        setCombineSubmitting(false);
        setUploadingCombineReceipt(false);
        return;
      } finally {
        setUploadingCombineReceipt(false);
      }
    }

    const selectedOrders = pendingEpcOrders.filter(o => selectedOrderIds.has(o.id || o._id));
    const payload = {
      warehouse_id: combineForm.warehouse_id,
      supplier_id: combineForm.supplier_id,
      timeline: combineForm.timeline,
      source_order_ids: selectedOrders.map(o => ({ order_id: o.id || o._id, order_type: o.order_type })),
      items: validItems.map(it => ({
        sku_id: it.sku_id,
        sku_code: it.sku_code || "",
        qty: Number(it.qty),
        order_price: Number(it.order_price),
      })),
      payment: {
        reference_no: combineForm.reference_no,
        proforma_invoice_no: combineForm.proforma_invoice_no,
        payment_date: combineForm.payment_date,
        amount: Number(combineForm.amount),
        payment_mode: combineForm.payment_mode,
        receipt_url: receiptUrl,
      },
    };

    try {
      const res = await createCombinedSupplierPayment(payload);
      if (res?.status === "success") {
        setCombineSuccess(`✅ ${res.message || "Combined PO created and payment recorded!"}`);
        setSelectedOrderIds(new Set());
        fetchPendingEpcOrders();
        fetchOrders();
        setTimeout(() => {
          setCombineModalOpen(false);
          setCombineSuccess("");
        }, 2500);
      } else {
        setCombineError(res.message || "Failed to create combined payment.");
      }
    } catch (err) {
      setCombineError(err.response?.data?.message || err.message || "Failed to create combined payment.");
    } finally {
      setCombineSubmitting(false);
    }
  };


  const handleOpenPay = (po) => {
    setSelectedPO(po);
    const totalVal = (po.items || []).reduce((acc, it) => acc + (it.qty * it.order_price), 0);
    setPayForm({
      reference_no: "",
      proforma_invoice_no: po.proforma_invoice_no || "",
      payment_date: new Date().toLocaleDateString('en-CA'),
      amount: totalVal || "",
      payment_mode: "NEFT",
      receipt_url: ""
    });
    setSelectedFile(null);
    setSelectedPIFile(null);
    setUploadingReceipt(false);
    setUploadingPI(false);
    setFormError("");
    setSuccessMsg("");
    setIsPayOpen(true);
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setFormError("");
  };

  const openCancelConfirm = (poId) => {
    setCancelPoId(poId);
    setCancelConfirmOpen(true);
  };

  const handleConfirmCancel = async () => {
    if (!cancelPoId) return;
    setCancelLoading(true);
    try {
      const res = await cancelPurchaseOrder(cancelPoId);
      if (res && res.status === "success") {
        fetchOrders();
        setCancelConfirmOpen(false);
      }
    } catch (err) {
      console.error("Cancel PO error:", err);
    } finally {
      setCancelLoading(false);
    }
  };

  const handlePaySubmit = async (e) => {
    e.preventDefault();
    setFormError("");
    setSuccessMsg("");

    if (!payForm.reference_no.trim() || !payForm.proforma_invoice_no.trim() || !payForm.payment_date || !payForm.amount || !payForm.payment_mode) {
      setFormError("All required fields must be filled.");
      return;
    }

    if (Number(payForm.amount) <= 0) {
      setFormError("Amount must be greater than zero.");
      return;
    }

    if (!selectedFile && !payForm.receipt_url) {
      setFormError("Please upload the payment transaction receipt/screenshot.");
      return;
    }

    if (!selectedPIFile && !selectedPO?.proforma_invoice_pdf) {
      setFormError("Please upload the Proforma Invoice PDF.");
      return;
    }

    setSubmitting(true);

    let finalReceiptUrl = payForm.receipt_url;
    let finalPIUrl = selectedPO?.proforma_invoice_pdf || "";

    if (selectedFile) {
      setUploadingReceipt(true);
      try {
        const res = await uploadPaymentReceipt(selectedFile);
        if (res && res.status === "success" && res.url) {
          finalReceiptUrl = res.url;
        } else {
          setFormError(res.message || "Failed to upload receipt screenshot.");
          setSubmitting(false);
          setUploadingReceipt(false);
          return;
        }
      } catch (err) {
        console.error("Receipt upload error:", err);
        setFormError(err.response?.data?.message || err.message || "Error uploading receipt file.");
        setSubmitting(false);
        setUploadingReceipt(false);
        return;
      } finally {
        setUploadingReceipt(false);
      }
    }

    if (selectedPIFile) {
      setUploadingPI(true);
      try {
        const res = await uploadPaymentReceipt(selectedPIFile);
        if (res && res.status === "success" && res.url) {
          finalPIUrl = res.url;
        } else {
          setFormError(res.message || "Failed to upload Proforma Invoice PDF.");
          setSubmitting(false);
          setUploadingPI(false);
          return;
        }
      } catch (err) {
        console.error("PI upload error:", err);
        setFormError(err.response?.data?.message || err.message || "Error uploading proforma invoice file.");
        setSubmitting(false);
        setUploadingPI(false);
        return;
      } finally {
        setUploadingPI(false);
      }
    }

    try {
      const res = await payPurchaseOrder(selectedPO._id || selectedPO.id, {
        reference_no: payForm.reference_no.trim(),
        proforma_invoice_no: payForm.proforma_invoice_no.trim(),
        payment_date: payForm.payment_date,
        amount: Number(payForm.amount),
        payment_mode: payForm.payment_mode,
        receipt_url: finalReceiptUrl.trim(),
        proforma_invoice_pdf: finalPIUrl.trim()
      });

      if (res && res.status === "success") {
        setSuccessMsg("Payment details submitted successfully!");
        fetchOrders();
        setTimeout(() => {
          setIsPayOpen(false);
          setSuccessMsg("");
        }, 1500);
      } else {
        setFormError(res.message || "Failed to record payment.");
      }
    } catch (err) {
      setFormError(err.response?.data?.message || err.message || "Failed to record payment.");
    } finally {
      setSubmitting(false);
    }
  };

  const uniqueWarehouses = useMemo(() => {
    const map = new Map();
    purchaseOrders.forEach(po => { if (po.warehouse_id) map.set(po.warehouse_id._id || po.warehouse_id.id, po.warehouse_id); });
    return Array.from(map.values());
  }, [purchaseOrders]);

  const uniqueSuppliers = useMemo(() => {
    const map = new Map();
    purchaseOrders.forEach(po => { if (po.supplier_id) map.set(po.supplier_id._id || po.supplier_id.id, po.supplier_id); });
    return Array.from(map.values());
  }, [purchaseOrders]);

  // ── Quick Filter Options (from Shop Hierarchy) ───────────────────────────
  const shopHierarchy = useMemo(() => hierarchy.shopHierarchy || [], [hierarchy.shopHierarchy]);

  const qfIndustryTypeOptions = useMemo(() => {
    const list = [];
    const seen = new Set();
    if (shopHierarchy && shopHierarchy.length > 0) {
      shopHierarchy.forEach((ind) => {
        if (ind.name && !seen.has(ind.name.toLowerCase())) {
          seen.add(ind.name.toLowerCase());
          list.push({ value: ind.name, text: ind.name });
        }
      });
    } else if (hierarchy?.industries && hierarchy.industries.length > 0) {
      hierarchy.industries.forEach((ind) => {
        if (ind.name && !seen.has(ind.name.toLowerCase())) {
          seen.add(ind.name.toLowerCase());
          list.push({ value: ind.name, text: ind.name });
        }
      });
    }
    return [{ value: "all", text: "All Industry Types" }, ...list];
  }, [shopHierarchy, hierarchy]);

  const qfCategoryOptions = useMemo(() => {
    const catMap = new Map();
    if (shopHierarchy && shopHierarchy.length > 0) {
      const targetInds = quickFilters.industryType === "all"
        ? shopHierarchy
        : shopHierarchy.filter(
          (ind) =>
            ind.name?.toLowerCase() === quickFilters.industryType.toLowerCase() ||
            String(ind.id) === String(quickFilters.industryType)
        );

      targetInds.forEach((ind) => {
        (ind.categories || []).forEach((cat) => {
          if (cat.name && !catMap.has(cat.name.toLowerCase())) {
            catMap.set(cat.name.toLowerCase(), { value: cat.name, text: cat.name });
          }
        });
      });
    } else if (hierarchy?.categories && hierarchy.categories.length > 0) {
      const matchedInd = (hierarchy?.industries || []).find(
        (i) =>
          i.name?.toLowerCase() === quickFilters.industryType.toLowerCase() ||
          String(i._id) === String(quickFilters.industryType)
      );
      (hierarchy.categories || []).forEach((cat) => {
        if (
          (quickFilters.industryType === "all" || (matchedInd && String(cat.industry_type_id) === String(matchedInd._id))) &&
          cat.name &&
          !catMap.has(cat.name.toLowerCase())
        ) {
          catMap.set(cat.name.toLowerCase(), { value: cat.name, text: cat.name });
        }
      });
    }
    return [{ value: "all", text: "All Categories" }, ...Array.from(catMap.values())];
  }, [shopHierarchy, hierarchy, quickFilters.industryType]);

  const qfSubCategoryOptions = useMemo(() => {
    const subsMap = new Map();
    if (shopHierarchy && shopHierarchy.length > 0) {
      const targetInds = quickFilters.industryType === "all"
        ? shopHierarchy
        : shopHierarchy.filter(
          (ind) =>
            ind.name?.toLowerCase() === quickFilters.industryType.toLowerCase() ||
            String(ind.id) === String(quickFilters.industryType)
        );

      targetInds.forEach((ind) => {
        (ind.categories || []).forEach((cat) => {
          if (
            quickFilters.category === "all" ||
            cat.name?.toLowerCase() === quickFilters.category.toLowerCase() ||
            String(cat.id) === String(quickFilters.category)
          ) {
            (cat.subcategories || []).forEach((sub) => {
              if (sub.name && !subsMap.has(sub.name.toLowerCase())) {
                subsMap.set(sub.name.toLowerCase(), { value: sub.name, text: sub.name });
              }
            });
          }
        });
      });
    } else if (hierarchy?.subcategories && hierarchy.subcategories.length > 0) {
      const matchedCat = (hierarchy?.categories || []).find(
        (c) =>
          c.name?.toLowerCase() === quickFilters.category.toLowerCase() ||
          String(c._id) === String(quickFilters.category)
      );
      (hierarchy.subcategories || []).forEach((sub) => {
        if (
          (quickFilters.category === "all" || (matchedCat && String(sub.category) === String(matchedCat._id))) &&
          sub.name &&
          !subsMap.has(sub.name.toLowerCase())
        ) {
          subsMap.set(sub.name.toLowerCase(), { value: sub.name, text: sub.name });
        }
      });
    }
    return [{ value: "all", text: "All Sub-Categories" }, ...Array.from(subsMap.values())];
  }, [shopHierarchy, hierarchy, quickFilters.industryType, quickFilters.category]);

  const qfSystemTypeOptions = useMemo(() => {
    const typesMap = new Map();
    if (shopHierarchy && shopHierarchy.length > 0) {
      const targetInds = quickFilters.industryType === "all"
        ? shopHierarchy
        : shopHierarchy.filter(
          (ind) =>
            ind.name?.toLowerCase() === quickFilters.industryType.toLowerCase() ||
            String(ind.id) === String(quickFilters.industryType)
        );

      targetInds.forEach((ind) => {
        (ind.categories || []).forEach((cat) => {
          if (
            quickFilters.category === "all" ||
            cat.name?.toLowerCase() === quickFilters.category.toLowerCase() ||
            String(cat.id) === String(quickFilters.category)
          ) {
            (cat.subcategories || []).forEach((sub) => {
              if (
                quickFilters.subCategory === "all" ||
                sub.name?.toLowerCase() === quickFilters.subCategory.toLowerCase() ||
                String(sub.id) === String(quickFilters.subCategory)
              ) {
                (sub.mappedTypes || []).forEach((mt) => {
                  if (mt.name && !typesMap.has(mt.name.toLowerCase())) {
                    typesMap.set(mt.name.toLowerCase(), { value: mt.name, text: mt.name });
                  }
                });
              }
            });
          }
        });
      });
    } else if (hierarchy?.types && hierarchy.types.length > 0) {
      hierarchy.types.forEach((t) => {
        if (t.name && !typesMap.has(t.name.toLowerCase())) {
          typesMap.set(t.name.toLowerCase(), { value: t.name, text: t.name });
        }
      });
    }
    return [{ value: "all", text: "All System Types" }, ...Array.from(typesMap.values())];
  }, [shopHierarchy, hierarchy, quickFilters.industryType, quickFilters.category, quickFilters.subCategory]);

  const qfProjectRangeOptions = useMemo(() => {
    const rangesMap = new Map();
    if (shopHierarchy && shopHierarchy.length > 0) {
      const targetInds = quickFilters.industryType === "all"
        ? shopHierarchy
        : shopHierarchy.filter(
          (ind) =>
            ind.name?.toLowerCase() === quickFilters.industryType.toLowerCase() ||
            String(ind.id) === String(quickFilters.industryType)
        );

      targetInds.forEach((ind) => {
        (ind.categories || []).forEach((cat) => {
          if (
            quickFilters.category === "all" ||
            cat.name?.toLowerCase() === quickFilters.category.toLowerCase() ||
            String(cat.id) === String(quickFilters.category)
          ) {
            (cat.subcategories || []).forEach((sub) => {
              if (
                quickFilters.subCategory === "all" ||
                sub.name?.toLowerCase() === quickFilters.subCategory.toLowerCase() ||
                String(sub.id) === String(quickFilters.subCategory)
              ) {
                (sub.mappedTypes || []).forEach((mt) => {
                  if (
                    quickFilters.systemType === "all" ||
                    mt.name?.toLowerCase() === quickFilters.systemType.toLowerCase() ||
                    String(mt.id || mt.type_id) === String(quickFilters.systemType)
                  ) {
                    (mt.ranges || []).forEach((r) => {
                      const idVal = String(r.range_label || `${r.min_value} - ${r.max_value} ${r.unit_symbol || "kW"}`);
                      if (idVal && !rangesMap.has(idVal.toLowerCase())) {
                        rangesMap.set(idVal.toLowerCase(), {
                          value: r.range_label || idVal,
                          text: r.range_label || `${r.min_value} - ${r.max_value} ${r.unit_symbol || "kW"}`,
                        });
                      }
                    });
                  }
                });
              }
            });
          }
        });
      });
    } else if (hierarchy?.ranges && hierarchy.ranges.length > 0) {
      hierarchy.ranges.forEach((r) => {
        const idVal = String(r.range_label || `${r.min_value} - ${r.max_value} ${r.unit_id?.symbol || "kW"}`);
        if (idVal && !rangesMap.has(idVal.toLowerCase())) {
          rangesMap.set(idVal.toLowerCase(), {
            value: r.range_label || idVal,
            text: r.range_label || `${r.min_value} - ${r.max_value} ${r.unit_id?.symbol || "kW"}`,
          });
        }
      });
    }
    return [{ value: "all", text: "All Project Ranges" }, ...Array.from(rangesMap.values())];
  }, [
    shopHierarchy,
    hierarchy,
    quickFilters.industryType,
    quickFilters.category,
    quickFilters.subCategory,
    quickFilters.systemType,
  ]);

  const hasActiveQuickFilters =
    quickFilters.industryType !== "all" || quickFilters.category !== "all" ||
    quickFilters.subCategory !== "all" || quickFilters.systemType !== "all" || quickFilters.projectRange !== "all";

  const hasActiveLocationFilters =
    selectedState !== "all" || selectedDistrict !== "all";

  const hasActiveProductFilters =
    selectedComboKit !== "all";

  const hasActiveMasterFilters =
    hasActiveQuickFilters ||
    hasActiveLocationFilters ||
    hasActiveProductFilters ||
    selectedEpcId !== "all" ||
    selectedFranchiseId !== "all" ||
    searchQuery.trim() !== "";

  const activeFiltersCount = [
    quickFilters.industryType !== "all",
    quickFilters.category !== "all",
    quickFilters.subCategory !== "all",
    quickFilters.systemType !== "all",
    quickFilters.projectRange !== "all",
    selectedState !== "all",
    selectedDistrict !== "all",
    selectedComboKit !== "all",
    selectedEpcId !== "all",
    selectedFranchiseId !== "all",
    searchQuery.trim() !== "",
  ].filter(Boolean).length;

  const clearQuickFilters = () =>
    setQuickFilters({ industryType: "all", category: "all", subCategory: "all", systemType: "all", projectRange: "all" });

  const clearLocationFilters = () => {
    setSelectedState("all");
    setSelectedDistrict("all");
  };

  const clearProductFilters = () => {
    setSelectedComboKit("all");
  };

  const resetAllMasterFilters = () => {
    clearQuickFilters();
    clearLocationFilters();
    clearProductFilters();
    setSelectedEpcId("all");
    setSelectedFranchiseId("all");
    setSearchQuery("");
    setPage(1);
  };

  // ── Filter Franchise & EPC Customer Orders ────────────────────────────────
  const filteredEpcOrders = useMemo(() => {
    return pendingEpcOrders.filter((order) => {
      // 1. Search Query (Matches Order #, Customer / Partner Name, Phone / Contact, GSTIN, and Products)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesNum = (order.order_number || "").toLowerCase().includes(q);
        const matchesCust = (order.customer_name || "").toLowerCase().includes(q);
        const matchesContact = (order.customer_contact || "").toLowerCase().includes(q);
        const matchesGstin = (order.customer_gstin || "").toLowerCase().includes(q);
        const matchesItem = (order.items || []).some(it => (it.item_name || "").toLowerCase().includes(q));
        if (!matchesNum && !matchesCust && !matchesContact && !matchesGstin && !matchesItem) {
          return false;
        }
      }

      // 1.1 Dedicated EPC Partner Filter (by entity ID, name, or GSTIN)
      if (selectedEpcId !== "all") {
        if (order.order_type !== "epc") return false;
        const target = selectedEpcId.toLowerCase();
        const matchesId = String(order.entity_id || "").toLowerCase() === target;
        const matchesName = String(order.customer_name || "").toLowerCase() === target;
        const matchesGstin = String(order.customer_gstin || "").toLowerCase() === target;
        if (!matchesId && !matchesName && !matchesGstin) return false;
      }

      // 1.2 Dedicated Franchise Partner Filter (by entity ID, name, or GSTIN)
      if (selectedFranchiseId !== "all") {
        if (order.order_type !== "franchise") return false;
        const target = selectedFranchiseId.toLowerCase();
        const matchesId = String(order.entity_id || "").toLowerCase() === target;
        const matchesName = String(order.customer_name || "").toLowerCase() === target;
        const matchesGstin = String(order.customer_gstin || "").toLowerCase() === target;
        if (!matchesId && !matchesName && !matchesGstin) return false;
      }

      // 2. Location Filter (State & District)
      if (selectedState !== "all") {
        const targetState = selectedState.toLowerCase();
        const orderStateId = (order.delivery_address?.state_id || order.state_id || "").toString().toLowerCase();
        const orderStateName = (order.delivery_address?.state_name || order.state_name || "").toLowerCase();
        if (orderStateId !== targetState && orderStateName !== targetState) {
          return false;
        }
      }

      if (selectedDistrict !== "all") {
        const targetDist = selectedDistrict.toLowerCase();
        const orderDistId = (order.delivery_address?.district_id || order.district_id || "").toString().toLowerCase();
        const orderDistName = (order.delivery_address?.district_name || order.district_name || "").toLowerCase();
        if (orderDistId !== targetDist && orderDistName !== targetDist) {
          return false;
        }
      }

      // 3. Product / ComboKit Filter (Admin Combo Kits)
      if (selectedComboKit !== "all") {
        const targetKitId = selectedComboKit.toString().toLowerCase();
        const selectedKitObj = allAdminKits.find(k => String(k._id || k.id).toLowerCase() === targetKitId);
        const targetKitName = selectedKitObj?.name?.toLowerCase();
        const targetKitCap = selectedKitObj?.capacity || selectedKitObj?.capacity_kw;

        const hasKit =
          (order.kit_ids || []).some(kId => String(kId).toLowerCase() === targetKitId) ||
          (order.items || []).some(it =>
            String(it.kit_id).toLowerCase() === targetKitId ||
            (it.breakdown && String(it.breakdown.kit_id).toLowerCase() === targetKitId) ||
            (targetKitName && (it.item_name || "").toLowerCase().includes(targetKitName)) ||
            (targetKitCap && ((it.capacity && String(it.capacity).includes(String(targetKitCap))) || (it.item_name || "").toLowerCase().includes(`${targetKitCap} kw`)))
          );
        if (!hasKit) return false;
      }

      // 4. Classification Quick Filters (Industry, Category, SubCategory, SystemType, ProjectRange)
      if (hasActiveQuickFilters) {
        if (quickFilters.industryType !== "all") {
          const target = quickFilters.industryType.toLowerCase();
          const hasInd =
            (order.industry_types || []).some(t => t?.toLowerCase() === target) ||
            (order.items || []).some(it => (it.industry_type_name || it.item_name || "").toLowerCase().includes(target));
          if (!hasInd) return false;
        }

        if (quickFilters.category !== "all") {
          const target = quickFilters.category.toLowerCase();
          const hasCat =
            (order.categories || []).some(c => c?.toLowerCase() === target) ||
            (order.items || []).some(it => (it.category_name || it.item_name || "").toLowerCase().includes(target));
          if (!hasCat) return false;
        }

        if (quickFilters.subCategory !== "all") {
          const target = quickFilters.subCategory.toLowerCase();
          const hasSub =
            (order.subcategories || []).some(s => s?.toLowerCase() === target) ||
            (order.items || []).some(it => (it.subcategory_name || it.item_name || "").toLowerCase().includes(target));
          if (!hasSub) return false;
        }

        if (quickFilters.systemType !== "all") {
          const target = quickFilters.systemType.toLowerCase();
          const hasSys =
            (order.system_types || []).some(t => t?.toLowerCase() === target) ||
            (order.items || []).some(it => (it.system_type_name || it.item_name || "").toLowerCase().includes(target));
          if (!hasSys) return false;
        }

        if (quickFilters.projectRange !== "all") {
          const target = quickFilters.projectRange.toLowerCase();
          const hasRange =
            (order.project_ranges || []).some(r => r?.toLowerCase() === target) ||
            (order.items || []).some(it => (it.capacity || it.item_name || "").toLowerCase().includes(target));
          if (!hasRange) return false;
        }
      }

      return true;
    });
  }, [pendingEpcOrders, searchQuery, selectedEpcId, selectedFranchiseId, selectedState, selectedDistrict, selectedComboKit, quickFilters, hasActiveQuickFilters]);

  // Separate EPC & Franchise Orders
  const pendingEpcCount = useMemo(() => {
    return pendingEpcOrders.filter(o => o.order_type === "epc").length;
  }, [pendingEpcOrders]);

  const pendingFranchiseCount = useMemo(() => {
    return pendingEpcOrders.filter(o => o.order_type === "franchise").length;
  }, [pendingEpcOrders]);

  const filteredEpcOnlyOrders = useMemo(() => {
    return filteredEpcOrders.filter(o => o.order_type === "epc");
  }, [filteredEpcOrders]);

  const filteredFranchiseOnlyOrders = useMemo(() => {
    return filteredEpcOrders.filter(o => o.order_type === "franchise");
  }, [filteredEpcOrders]);

  const selectedEpcCount = useMemo(() => {
    return filteredEpcOnlyOrders.filter(o => selectedOrderIds.has(o.id || o._id)).length;
  }, [filteredEpcOnlyOrders, selectedOrderIds]);

  const isAllEpcSelected = useMemo(() => {
    return filteredEpcOnlyOrders.length > 0 && selectedEpcCount === filteredEpcOnlyOrders.length;
  }, [filteredEpcOnlyOrders, selectedEpcCount]);

  const selectedFranchiseCount = useMemo(() => {
    return filteredFranchiseOnlyOrders.filter(o => selectedOrderIds.has(o.id || o._id)).length;
  }, [filteredFranchiseOnlyOrders, selectedOrderIds]);

  const isAllFranchiseSelected = useMemo(() => {
    return filteredFranchiseOnlyOrders.length > 0 && selectedFranchiseCount === filteredFranchiseOnlyOrders.length;
  }, [filteredFranchiseOnlyOrders, selectedFranchiseCount]);

  const selectAllEpcOrders = () => {
    const epcIds = filteredEpcOnlyOrders.map(o => o.id || o._id);
    const allSelected = epcIds.length > 0 && epcIds.every(id => selectedOrderIds.has(id));
    setSelectedOrderIds(prev => {
      const next = new Set(prev);
      if (allSelected) {
        epcIds.forEach(id => next.delete(id));
      } else {
        epcIds.forEach(id => next.add(id));
      }
      return next;
    });
  };

  const selectAllFranchiseOrders = () => {
    const franIds = filteredFranchiseOnlyOrders.map(o => o.id || o._id);
    const allSelected = franIds.length > 0 && franIds.every(id => selectedOrderIds.has(id));
    setSelectedOrderIds(prev => {
      const next = new Set(prev);
      if (allSelected) {
        franIds.forEach(id => next.delete(id));
      } else {
        franIds.forEach(id => next.add(id));
      }
      return next;
    });
  };

  // ── Filter Supplier Purchase Orders (POs) ─────────────────────────────────
  const filteredPOList = useMemo(() => {
    return purchaseOrders.filter((po) => {
      const matchesSearch =
        !searchQuery.trim() ||
        po.po_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (po.invoice_no || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (po.supplier_id?.company_name || "").toLowerCase().includes(searchQuery.toLowerCase());

      const matchesTab =
        activeTab === "pending"
          ? po.status === "pending" || po.status === "accepted" || po.status === "invoiced"
          : po.status === "paid" || po.status === "delivered";

      const matchesWarehouse =
        warehouseFilter === "All" ? true :
          (po.warehouse_id?._id || po.warehouse_id?.id) === warehouseFilter;

      const matchesSupplier =
        supplierFilter === "All" ? true :
          (po.supplier_id?._id || po.supplier_id?.id) === supplierFilter;

      // Location Filter (State & District)
      if (selectedState !== "all") {
        const targetState = selectedState.toLowerCase();
        const poStateId = (po.state_id || po.warehouse_id?.level_1 || "").toString().toLowerCase();
        const poStateName = (po.state_name || "").toLowerCase();
        const sourceStateMatches = (po.source_orders || []).some(so => {
          const soStateId = (so.delivery_address?.state_id || "").toString().toLowerCase();
          const soStateName = (so.delivery_address?.state_name || "").toLowerCase();
          return soStateId === targetState || soStateName === targetState;
        });
        if (poStateId !== targetState && poStateName !== targetState && !sourceStateMatches) {
          return false;
        }
      }

      if (selectedDistrict !== "all") {
        const targetDist = selectedDistrict.toLowerCase();
        const poDistId = (po.district_id || po.warehouse_id?.level_2 || "").toString().toLowerCase();
        const poDistName = (po.district_name || "").toLowerCase();
        const sourceDistMatches = (po.source_orders || []).some(so => {
          const soDistId = (so.delivery_address?.district_id || "").toString().toLowerCase();
          const soDistName = (so.delivery_address?.district_name || "").toLowerCase();
          return soDistId === targetDist || soDistName === targetDist;
        });
        if (poDistId !== targetDist && poDistName !== targetDist && !sourceDistMatches) {
          return false;
        }
      }

      // Product / ComboKit Filter (Admin Combo Kits)
      if (selectedComboKit !== "all") {
        const targetKit = selectedComboKit.toString().toLowerCase();
        const selectedKitObj = allAdminKits.find(k => String(k._id || k.id).toLowerCase() === targetKit);
        const targetKitName = selectedKitObj?.name?.toLowerCase();
        const targetKitCap = selectedKitObj?.capacity || selectedKitObj?.capacity_kw;

        const matchesDirectKit = po.combo_kit_id && String(po.combo_kit_id).toLowerCase() === targetKit;
        const matchesKitArray = (po.combo_kit_ids || []).some(kId => String(kId).toLowerCase() === targetKit);
        const matchesSourceOrders = (po.source_orders || []).some(so =>
          (so.items || []).some(si =>
            String(si.kit_id).toLowerCase() === targetKit ||
            (targetKitName && (si.item_name || "").toLowerCase().includes(targetKitName))
          )
        );
        const matchesPoItems = (po.items || []).some(pi =>
          (targetKitName && (pi.sku_details?.product_name || pi.item_name || "").toLowerCase().includes(targetKitName)) ||
          (targetKitCap && ((pi.capacity && String(pi.capacity).includes(String(targetKitCap))) || (pi.item_name || "").toLowerCase().includes(`${targetKitCap} kw`)))
        );
        if (!matchesDirectKit && !matchesKitArray && !matchesSourceOrders && !matchesPoItems) {
          return false;
        }
      }

      // Quick Filters — match if ANY item or PO matches active filters
      const matchesQuickFilters = (() => {
        if (!hasActiveQuickFilters) return true;

        if (quickFilters.industryType !== "all") {
          const target = quickFilters.industryType.toLowerCase();
          const hasInd =
            (po.industry_types || []).some(t => t?.toLowerCase() === target) ||
            (po.items || []).some(it => (it.sku_details?.industry_type_name || it.industry_type_name || "").toLowerCase() === target);
          if (!hasInd) return false;
        }

        if (quickFilters.category !== "all") {
          const target = quickFilters.category.toLowerCase();
          const hasCat =
            (po.categories || []).some(c => c?.toLowerCase() === target) ||
            (po.items || []).some(it => (it.sku_details?.category_name || it.category_name || it.sku_details?.category || "").toLowerCase() === target);
          if (!hasCat) return false;
        }

        if (quickFilters.subCategory !== "all") {
          const target = quickFilters.subCategory.toLowerCase();
          const hasSub =
            (po.subcategories || []).some(s => s?.toLowerCase() === target) ||
            (po.items || []).some(it => (it.sku_details?.subcategory_name || it.subcategory_name || "").toLowerCase() === target);
          if (!hasSub) return false;
        }

        if (quickFilters.systemType !== "all") {
          const target = quickFilters.systemType.toLowerCase();
          const hasSys =
            (po.system_types || []).some(t => t?.toLowerCase() === target) ||
            (po.items || []).some(it => (it.sku_details?.system_type_name || it.system_type_name || "").toLowerCase() === target);
          if (!hasSys) return false;
        }

        if (quickFilters.projectRange !== "all") {
          const target = quickFilters.projectRange.toLowerCase();
          const hasRange =
            (po.project_ranges || []).some(r => r?.toLowerCase() === target) ||
            (po.items || []).some(it => (it.sku_details?.project_range_name || it.sku_details?.project_range_label || it.project_range_label || "").toLowerCase() === target);
          if (!hasRange) return false;
        }

        return true;
      })();

      return matchesSearch && matchesTab && matchesWarehouse && matchesSupplier && matchesQuickFilters;
    });
  }, [purchaseOrders, searchQuery, activeTab, warehouseFilter, supplierFilter, selectedState, selectedDistrict, selectedComboKit, quickFilters, hasActiveQuickFilters]);

  // Paginated POs
  const paginatedPOs = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredPOList.slice(start, start + pageSize);
  }, [filteredPOList, page]);

  return (
    <div className="space-y-6 pb-10">
      <PageHeader
        title="Supplier Payments Control"
        subtitle={`Process supplier proforma payments and track transaction logs for ${activeClusterName}.`}
        icon={FaCreditCard}
      />

      {/* Tabs */}
      <div className="flex bg-surface border border-border p-1 rounded-xl gap-1 max-w-xl">
        <button
          onClick={() => { setActiveTab("pending"); setPage(1); }}
          className={`flex-1 py-2 px-4 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${activeTab === "pending" ? "bg-primary text-white shadow-sm" : "text-text-secondary hover:bg-surface-hover"}`}
        >
          <FaClipboardList />
          Awaiting Order
          {(pendingEpcOrders.length > 0 || pendingPOCount > 0) && (
            <span className={`min-w-[18px] h-[18px] rounded-full text-[10px] font-black flex items-center justify-center px-1.5 ${activeTab === "pending" ? "bg-white text-primary" : "bg-primary/10 text-primary"}`}>
              {pendingEpcOrders.length + pendingPOCount}
            </span>
          )}
        </button>
        <button
          onClick={() => { setActiveTab("history"); setPage(1); }}
          className={`flex-1 py-2 px-4 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${activeTab === "history" ? "bg-primary text-white shadow-sm" : "text-text-secondary hover:bg-surface-hover"}`}
        >
          <FaHistory />
          Payment History
        </button>
      </div>

      {/* ─── Sub-filters & Actions for Awaiting Payment ─────────────────────── */}
      {activeTab === "pending" && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-surface border border-border p-2.5 rounded-2xl shadow-xs">
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              type="button"
              onClick={() => { setAwaitingSubFilter("all"); setPage(1); }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${awaitingSubFilter === "all" ? "bg-primary text-white shadow-xs" : "text-text-secondary hover:bg-surface-hover"}`}
            >
              <span>All Orders Awaiting Action</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${awaitingSubFilter === "all" ? "bg-white/20 text-white" : "bg-primary/10 text-primary"}`}>
                {pendingEpcOrders.length + pendingPOCount}
              </span>
            </button>
            <button
              type="button"
              onClick={() => {
                setAwaitingSubFilter("epc_orders");
                setSelectedFranchiseId("all");
                setPage(1);
              }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${awaitingSubFilter === "epc_orders" ? "bg-blue-600 text-white shadow-xs" : "text-text-secondary hover:bg-surface-hover"}`}
            >
              <FaBuilding size={11} />
              <span>EPC Orders</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${awaitingSubFilter === "epc_orders" ? "bg-white text-blue-600" : "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300"}`}>
                {hasActiveMasterFilters ? filteredEpcOnlyOrders.length : pendingEpcCount}
              </span>
            </button>
            <button
              type="button"
              onClick={() => {
                setAwaitingSubFilter("franchise_orders");
                setSelectedEpcId("all");
                setPage(1);
              }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${awaitingSubFilter === "franchise_orders" ? "bg-purple-600 text-white shadow-xs" : "text-text-secondary hover:bg-surface-hover"}`}
            >
              <FaStore size={11} />
              <span>Franchise Orders</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${awaitingSubFilter === "franchise_orders" ? "bg-white text-purple-600" : "bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300"}`}>
                {hasActiveMasterFilters ? filteredFranchiseOnlyOrders.length : pendingFranchiseCount}
              </span>
            </button>
            <button
              type="button"
              onClick={() => setAwaitingSubFilter("supplier_pos")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${awaitingSubFilter === "supplier_pos" ? "bg-primary text-white shadow-xs" : "text-text-secondary hover:bg-surface-hover"}`}
            >
              <FaClipboardList size={11} />
              <span>Supplier Purchase Orders (PO)</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${awaitingSubFilter === "supplier_pos" ? "bg-white text-primary" : "bg-primary/10 text-primary"}`}>
                {pendingPOCount}
              </span>
            </button>
          </div>

          {/* Action button: Combine & Pay Supplier */}
          {(awaitingSubFilter === "all" || awaitingSubFilter === "epc_orders" || awaitingSubFilter === "franchise_orders") && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={fetchPendingEpcOrders}
                className="text-xs text-text-secondary hover:text-primary font-semibold px-3 py-1.5 border border-border rounded-lg hover:border-primary/30 transition-all cursor-pointer"
              >
                Refresh
              </button>
              <button
                onClick={openCombineModal}
                disabled={selectedOrderIds.size === 0}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wide transition-all shadow-sm ${selectedOrderIds.size > 0
                  ? "bg-amber-500 hover:bg-amber-600 text-white shadow-amber-200 dark:shadow-amber-900 cursor-pointer"
                  : "bg-surface border border-border text-text-muted cursor-not-allowed opacity-60"
                  }`}
              >
                <FaLink />
                Combine &amp; Pay Supplier ({selectedOrderIds.size})
              </button>
            </div>
          )}
        </div>
      )}

      {/* ─── Master Order Filters Bar ───────────────────────────────────────── */}
      <div className="bg-surface border border-border rounded-2xl p-4.5 space-y-3.5 shadow-xs">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2 border-b border-border/60">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="p-2 rounded-xl bg-primary/10 text-primary">
              <FaFilter className="w-3.5 h-3.5" />
            </span>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-sm text-text-primary tracking-tight">Master Order Filters</h3>
              {activeFiltersCount > 0 && (
                <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-primary/15 text-primary border border-primary/20">
                  {activeFiltersCount} active
                </span>
              )}
            </div>
            <span className="text-[11px] text-text-muted hidden md:inline">
              — Filter customer orders and supplier POs by industry classification, geography, and combo kit
            </span>
          </div>

          <div className="flex items-center gap-3 self-end sm:self-auto">
            {hasActiveQuickFilters && (
              <button
                type="button"
                onClick={clearQuickFilters}
                className="text-xs font-bold text-primary hover:text-primary/75 hover:underline cursor-pointer transition-colors"
                title="Reset Industry, Category, Sub Category, System Type & Project Range"
              >
                Clear Main
              </button>
            )}
            {hasActiveMasterFilters && (
              <button
                type="button"
                onClick={resetAllMasterFilters}
                className="text-xs font-bold text-text-secondary hover:text-danger px-2.5 py-1 rounded-lg border border-border hover:border-danger/30 hover:bg-danger/5 transition-all cursor-pointer flex items-center gap-1.5"
                title="Reset all classification, location, and product filters"
              >
                <FaTimes size={10} />
                <span>Reset All</span>
              </button>
            )}
          </div>
        </div>

        {/* Row 1: Classification Quick Filters (Industry Type -> Category -> Sub Category -> System Type -> Project Range) */}
        <div>
          <div className="text-[10px] font-bold text-text-muted uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <FaLayerGroup size={10} className="text-primary/70" />
            <span>1. Classification Filters</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {/* 1. Industry Type */}
            <div>
              <label className="block text-[10px] font-semibold text-text-secondary mb-1 uppercase tracking-wider">
                Industry Type
              </label>
              <div className="relative">
                <select
                  value={quickFilters.industryType}
                  onChange={(e) => {
                    setQuickFilters({
                      industryType: e.target.value,
                      category: "all",
                      subCategory: "all",
                      systemType: "all",
                      projectRange: "all"
                    });
                    setPage(1);
                  }}
                  className="w-full appearance-none h-9 bg-bg border border-border focus:border-primary rounded-xl px-3 pr-8 text-xs font-medium text-text-primary outline-none cursor-pointer transition-colors"
                >
                  {qfIndustryTypeOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.text}</option>
                  ))}
                </select>
                <FaChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted text-[9px] pointer-events-none" />
              </div>
            </div>

            {/* 2. Category */}
            <div>
              <label className="block text-[10px] font-semibold text-text-secondary mb-1 uppercase tracking-wider">
                Category
              </label>
              <div className="relative">
                <select
                  value={quickFilters.category}
                  onChange={(e) => {
                    setQuickFilters(prev => ({
                      ...prev,
                      category: e.target.value,
                      subCategory: "all",
                      systemType: "all",
                      projectRange: "all"
                    }));
                    setPage(1);
                  }}
                  className="w-full appearance-none h-9 bg-bg border border-border focus:border-primary rounded-xl px-3 pr-8 text-xs font-medium text-text-primary outline-none cursor-pointer transition-colors"
                >
                  {qfCategoryOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.text}</option>
                  ))}
                </select>
                <FaChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted text-[9px] pointer-events-none" />
              </div>
            </div>

            {/* 3. Sub Category */}
            <div>
              <label className="block text-[10px] font-semibold text-text-secondary mb-1 uppercase tracking-wider">
                Sub Category
              </label>
              <div className="relative">
                <select
                  value={quickFilters.subCategory}
                  onChange={(e) => {
                    setQuickFilters(prev => ({
                      ...prev,
                      subCategory: e.target.value,
                      systemType: "all",
                      projectRange: "all"
                    }));
                    setPage(1);
                  }}
                  className="w-full appearance-none h-9 bg-bg border border-border focus:border-primary rounded-xl px-3 pr-8 text-xs font-medium text-text-primary outline-none cursor-pointer transition-colors"
                >
                  {qfSubCategoryOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.text}</option>
                  ))}
                </select>
                <FaChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted text-[9px] pointer-events-none" />
              </div>
            </div>

            {/* 4. System Type */}
            <div>
              <label className="block text-[10px] font-semibold text-text-secondary mb-1 uppercase tracking-wider">
                System Type
              </label>
              <div className="relative">
                <select
                  value={quickFilters.systemType}
                  onChange={(e) => {
                    setQuickFilters(prev => ({
                      ...prev,
                      systemType: e.target.value,
                      projectRange: "all"
                    }));
                    setPage(1);
                  }}
                  className="w-full appearance-none h-9 bg-bg border border-border focus:border-primary rounded-xl px-3 pr-8 text-xs font-medium text-text-primary outline-none cursor-pointer transition-colors"
                >
                  {qfSystemTypeOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.text}</option>
                  ))}
                </select>
                <FaChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted text-[9px] pointer-events-none" />
              </div>
            </div>

            {/* 5. Project Range */}
            <div>
              <label className="block text-[10px] font-semibold text-text-secondary mb-1 uppercase tracking-wider">
                Project Range
              </label>
              <div className="relative">
                <select
                  value={quickFilters.projectRange}
                  onChange={(e) => {
                    setQuickFilters(prev => ({ ...prev, projectRange: e.target.value }));
                    setPage(1);
                  }}
                  className="w-full appearance-none h-9 bg-bg border border-border focus:border-primary rounded-xl px-3 pr-8 text-xs font-medium text-text-primary outline-none cursor-pointer transition-colors"
                >
                  {qfProjectRangeOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.text}</option>
                  ))}
                </select>
                <FaChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted text-[9px] pointer-events-none" />
              </div>
            </div>
          </div>
        </div>

        {/* Row 2: Location (State & District), Product (Combo Kit), and Search Input */}
        <div className="pt-2 border-t border-border/40">
          <div className="text-[10px] font-bold text-text-muted uppercase tracking-wider mb-2 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <FaMapMarkerAlt size={10} className="text-amber-500/80" />
              <span>2. Location, Customer &amp; Product Filters</span>
            </div>
            {awaitingSubFilter === "epc_orders" && (
              <span className="text-[10px] text-blue-600 dark:text-blue-400 font-bold uppercase tracking-wider flex items-center gap-1">
                <FaBuilding size={9} /> EPC Filter Mode Active
              </span>
            )}
            {awaitingSubFilter === "franchise_orders" && (
              <span className="text-[10px] text-purple-600 dark:text-purple-400 font-bold uppercase tracking-wider flex items-center gap-1">
                <FaStore size={9} /> Franchise Filter Mode Active
              </span>
            )}
          </div>
          <div className={`grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 ${
            awaitingSubFilter === "epc_orders" || awaitingSubFilter === "franchise_orders" || awaitingSubFilter === "all"
              ? "lg:grid-cols-5"
              : "lg:grid-cols-4"
          } gap-3`}>
            {/* 1. State */}
            <div>
              <label className="block text-[10px] font-semibold text-text-secondary mb-1 uppercase tracking-wider">
                Location: State
              </label>
              <div className="relative">
                <select
                  value={selectedState}
                  onChange={(e) => {
                    setSelectedState(e.target.value);
                    setSelectedDistrict("all");
                    setPage(1);
                  }}
                  className="w-full appearance-none h-9 bg-bg border border-border focus:border-primary rounded-xl px-3 pr-8 text-xs font-medium text-text-primary outline-none cursor-pointer transition-colors"
                >
                  <option value="all">All States</option>
                  {statesList.map(st => (
                    <option key={st.id || st._id} value={st.id || st._id}>
                      {st.name}
                    </option>
                  ))}
                </select>
                <FaChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted text-[9px] pointer-events-none" />
              </div>
            </div>

            {/* 2. District */}
            <div>
              <label className="block text-[10px] font-semibold text-text-secondary mb-1 uppercase tracking-wider flex items-center justify-between">
                <span>Location: District</span>
                {loadingDistricts && <FaSpinner className="animate-spin text-primary text-[10px]" />}
              </label>
              <div className="relative">
                <select
                  value={selectedDistrict}
                  onChange={(e) => {
                    setSelectedDistrict(e.target.value);
                    setPage(1);
                  }}
                  disabled={!selectedState || selectedState === "all"}
                  className={`w-full appearance-none h-9 bg-bg border border-border focus:border-primary rounded-xl px-3 pr-8 text-xs font-medium text-text-primary outline-none transition-colors ${!selectedState || selectedState === "all" ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
                    }`}
                >
                  <option value="all">
                    {!selectedState || selectedState === "all" ? "Select State First" : "All Districts"}
                  </option>
                  {districtsList.map(dst => (
                    <option key={dst.id || dst._id} value={dst.id || dst._id}>
                      {dst.name}
                    </option>
                  ))}
                </select>
                <FaChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted text-[9px] pointer-events-none" />
              </div>
            </div>

            {/* 3. Product / Admin Combo Kit */}
            <div>
              <label className="block text-[10px] font-semibold text-text-secondary mb-1 uppercase tracking-wider flex items-center justify-between">
                <span>Product: Combo Kit</span>
                {loadingAdminKits && <FaSpinner className="animate-spin text-primary text-[10px]" />}
              </label>
              <div className="relative">
                <select
                  value={selectedComboKit}
                  onChange={(e) => {
                    setSelectedComboKit(e.target.value);
                    setPage(1);
                  }}
                  className="w-full appearance-none h-9 bg-bg border border-border focus:border-primary rounded-xl px-3 pr-8 text-xs font-medium text-text-primary outline-none cursor-pointer transition-colors"
                >
                  <option value="all">All Admin Combo Kits</option>
                  {allAdminKits.map(kit => (
                    <option key={kit._id || kit.id} value={kit._id || kit.id}>
                      {kit.name} {kit.capacity ? `(${kit.capacity})` : ""}
                    </option>
                  ))}
                </select>
                <FaChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted text-[9px] pointer-events-none" />
              </div>
            </div>

            {/* 4. Dedicated EPC Partner Filter (when viewing EPC tab) */}
            {awaitingSubFilter === "epc_orders" && (
              <div>
                <label className="block text-[10px] font-semibold text-blue-600 dark:text-blue-400 mb-1 uppercase tracking-wider flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <FaBuilding size={9} />
                    EPC Partner &amp; GSTIN
                  </span>
                  <span className="text-[9px] text-text-muted font-bold">({computedEpcOptions.length})</span>
                </label>
                <div className="relative">
                  <select
                    value={selectedEpcId}
                    onChange={(e) => {
                      setSelectedEpcId(e.target.value);
                      setPage(1);
                    }}
                    className="w-full appearance-none h-9 bg-blue-50/50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 focus:border-blue-500 rounded-xl px-3 pr-8 text-xs font-medium text-text-primary outline-none cursor-pointer transition-colors"
                  >
                    <option value="all">All EPC Partners ({computedEpcOptions.length})</option>
                    {computedEpcOptions.map((epc) => (
                      <option key={epc.id || epc.name} value={epc.id || epc.name}>
                        {epc.name} {epc.gstin ? `— GST: ${epc.gstin}` : ""} {epc.pending_count > 0 ? `(${epc.pending_count} pending)` : ""}
                      </option>
                    ))}
                  </select>
                  <FaChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-500 text-[9px] pointer-events-none" />
                </div>
              </div>
            )}

            {/* 4. Dedicated Franchise Partner Filter (when viewing Franchise tab) */}
            {awaitingSubFilter === "franchise_orders" && (
              <div>
                <label className="block text-[10px] font-semibold text-purple-600 dark:text-purple-400 mb-1 uppercase tracking-wider flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <FaStore size={9} />
                    Franchise Partner &amp; GSTIN
                  </span>
                  <span className="text-[9px] text-text-muted font-bold">({computedFranchiseOptions.length})</span>
                </label>
                <div className="relative">
                  <select
                    value={selectedFranchiseId}
                    onChange={(e) => {
                      setSelectedFranchiseId(e.target.value);
                      setPage(1);
                    }}
                    className="w-full appearance-none h-9 bg-purple-50/50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800 focus:border-purple-500 rounded-xl px-3 pr-8 text-xs font-medium text-text-primary outline-none cursor-pointer transition-colors"
                  >
                    <option value="all">All Franchise Partners ({computedFranchiseOptions.length})</option>
                    {computedFranchiseOptions.map((fran) => (
                      <option key={fran.id || fran.name} value={fran.id || fran.name}>
                        {fran.name} {fran.gstin ? `— GST: ${fran.gstin}` : ""} {fran.pending_count > 0 ? `(${fran.pending_count} pending)` : ""}
                      </option>
                    ))}
                  </select>
                  <FaChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-purple-500 text-[9px] pointer-events-none" />
                </div>
              </div>
            )}

            {/* 4. Customer Filter (when viewing All Orders awaiting action) */}
            {awaitingSubFilter === "all" && (
              <div>
                <label className="block text-[10px] font-semibold text-text-secondary mb-1 uppercase tracking-wider">
                  Partner / Customer (Name &amp; GST)
                </label>
                <div className="relative">
                  <select
                    value={selectedEpcId !== "all" ? `epc_${selectedEpcId}` : selectedFranchiseId !== "all" ? `fran_${selectedFranchiseId}` : "all"}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === "all") {
                        setSelectedEpcId("all");
                        setSelectedFranchiseId("all");
                      } else if (val.startsWith("epc_")) {
                        setSelectedEpcId(val.replace("epc_", ""));
                        setSelectedFranchiseId("all");
                      } else if (val.startsWith("fran_")) {
                        setSelectedFranchiseId(val.replace("fran_", ""));
                        setSelectedEpcId("all");
                      }
                      setPage(1);
                    }}
                    className="w-full appearance-none h-9 bg-bg border border-border focus:border-primary rounded-xl px-3 pr-8 text-xs font-medium text-text-primary outline-none cursor-pointer transition-colors"
                  >
                    <option value="all">All Partners &amp; Customers</option>
                    {computedEpcOptions.length > 0 && (
                      <optgroup label="🏢 EPC Buyers">
                        {computedEpcOptions.map((epc) => (
                          <option key={`epc_${epc.id || epc.name}`} value={`epc_${epc.id || epc.name}`}>
                            {epc.name} {epc.gstin ? `(GST: ${epc.gstin})` : ""}
                          </option>
                        ))}
                      </optgroup>
                    )}
                    {computedFranchiseOptions.length > 0 && (
                      <optgroup label="🏪 Franchise Partners">
                        {computedFranchiseOptions.map((fran) => (
                          <option key={`fran_${fran.id || fran.name}`} value={`fran_${fran.id || fran.name}`}>
                            {fran.name} {fran.gstin ? `(GST: ${fran.gstin})` : ""}
                          </option>
                        ))}
                      </optgroup>
                    )}
                  </select>
                  <FaChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted text-[9px] pointer-events-none" />
                </div>
              </div>
            )}

            {/* 5. Search Filter Input */}
            <div>
              <label className="block text-[10px] font-semibold text-text-secondary mb-1 uppercase tracking-wider">
                {awaitingSubFilter === "epc_orders"
                  ? "Search EPC Orders"
                  : awaitingSubFilter === "franchise_orders"
                  ? "Search Franchise Orders"
                  : "Search Orders & POs"}
              </label>
              <div className="relative">
                <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted text-xs pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setPage(1);
                  }}
                  placeholder={
                    awaitingSubFilter === "epc_orders"
                      ? "EPC Name, GSTIN, Order #..."
                      : awaitingSubFilter === "franchise_orders"
                      ? "Franchise Name, GSTIN, Order #..."
                      : "Order #, Customer, GSTIN, PO..."
                  }
                  className="w-full h-9 bg-bg border border-border focus:border-primary rounded-xl pl-8 pr-7 text-xs font-medium text-text-primary outline-none transition-colors"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => { setSearchQuery(""); setPage(1); }}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary cursor-pointer"
                  >
                    <FaTimes size={10} />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Row 3: Active Filters Chips */}
        {hasActiveMasterFilters && (
          <div className="pt-2 border-t border-border/40 flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] font-black text-text-muted uppercase tracking-wider mr-1">Active:</span>

              {quickFilters.industryType !== "all" && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-primary/10 text-primary text-[11px] font-semibold border border-primary/20">
                  <span>Industry: {quickFilters.industryType}</span>
                  <button
                    type="button"
                    onClick={() => { setQuickFilters(prev => ({ ...prev, industryType: "all" })); setPage(1); }}
                    className="hover:text-primary-dark ml-0.5 cursor-pointer"
                  >
                    <FaTimes size={9} />
                  </button>
                </span>
              )}

              {quickFilters.category !== "all" && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-primary/10 text-primary text-[11px] font-semibold border border-primary/20">
                  <span>Category: {quickFilters.category}</span>
                  <button
                    type="button"
                    onClick={() => { setQuickFilters(prev => ({ ...prev, category: "all" })); setPage(1); }}
                    className="hover:text-primary-dark ml-0.5 cursor-pointer"
                  >
                    <FaTimes size={9} />
                  </button>
                </span>
              )}

              {quickFilters.subCategory !== "all" && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-primary/10 text-primary text-[11px] font-semibold border border-primary/20">
                  <span>Sub: {quickFilters.subCategory}</span>
                  <button
                    type="button"
                    onClick={() => { setQuickFilters(prev => ({ ...prev, subCategory: "all" })); setPage(1); }}
                    className="hover:text-primary-dark ml-0.5 cursor-pointer"
                  >
                    <FaTimes size={9} />
                  </button>
                </span>
              )}

              {quickFilters.systemType !== "all" && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-primary/10 text-primary text-[11px] font-semibold border border-primary/20">
                  <span>Type: {quickFilters.systemType}</span>
                  <button
                    type="button"
                    onClick={() => { setQuickFilters(prev => ({ ...prev, systemType: "all" })); setPage(1); }}
                    className="hover:text-primary-dark ml-0.5 cursor-pointer"
                  >
                    <FaTimes size={9} />
                  </button>
                </span>
              )}

              {quickFilters.projectRange !== "all" && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-primary/10 text-primary text-[11px] font-semibold border border-primary/20">
                  <span>Range: {quickFilters.projectRange}</span>
                  <button
                    type="button"
                    onClick={() => { setQuickFilters(prev => ({ ...prev, projectRange: "all" })); setPage(1); }}
                    className="hover:text-primary-dark ml-0.5 cursor-pointer"
                  >
                    <FaTimes size={9} />
                  </button>
                </span>
              )}

              {selectedState !== "all" && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-700 dark:text-amber-400 text-[11px] font-semibold border border-amber-500/20">
                  <FaMapMarkerAlt size={9} />
                  <span>State: {statesList.find(s => String(s.id || s._id) === String(selectedState))?.name || selectedState}</span>
                  <button
                    type="button"
                    onClick={() => { setSelectedState("all"); setSelectedDistrict("all"); setPage(1); }}
                    className="hover:text-amber-900 ml-0.5 cursor-pointer"
                  >
                    <FaTimes size={9} />
                  </button>
                </span>
              )}

              {selectedDistrict !== "all" && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-700 dark:text-amber-400 text-[11px] font-semibold border border-amber-500/20">
                  <FaMapMarkerAlt size={9} />
                  <span>District: {districtsList.find(d => String(d.id || d._id) === String(selectedDistrict))?.name || selectedDistrict}</span>
                  <button
                    type="button"
                    onClick={() => { setSelectedDistrict("all"); setPage(1); }}
                    className="hover:text-amber-900 ml-0.5 cursor-pointer"
                  >
                    <FaTimes size={9} />
                  </button>
                </span>
              )}

              {selectedComboKit !== "all" && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 text-[11px] font-semibold border border-indigo-500/20">
                  <FaBoxOpen size={9} />
                  <span>Kit: {allAdminKits.find(k => String(k._id || k.id) === String(selectedComboKit))?.name || "Selected Kit"}</span>
                  <button
                    type="button"
                    onClick={() => { setSelectedComboKit("all"); setPage(1); }}
                    className="hover:text-indigo-900 ml-0.5 cursor-pointer"
                  >
                    <FaTimes size={9} />
                  </button>
                </span>
              )}

              {selectedEpcId !== "all" && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-500/10 text-blue-700 dark:text-blue-400 text-[11px] font-semibold border border-blue-500/20">
                  <FaBuilding size={9} />
                  <span>EPC: {computedEpcOptions.find(e => String(e.id || e.name) === String(selectedEpcId))?.name || selectedEpcId}</span>
                  {computedEpcOptions.find(e => String(e.id || e.name) === String(selectedEpcId))?.gstin && (
                    <span className="font-mono text-[9px] bg-blue-100 dark:bg-blue-900/60 px-1 py-0.2 rounded font-bold">
                      {computedEpcOptions.find(e => String(e.id || e.name) === String(selectedEpcId))?.gstin}
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => { setSelectedEpcId("all"); setPage(1); }}
                    className="hover:text-blue-900 ml-0.5 cursor-pointer"
                  >
                    <FaTimes size={9} />
                  </button>
                </span>
              )}

              {selectedFranchiseId !== "all" && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-purple-500/10 text-purple-700 dark:text-purple-400 text-[11px] font-semibold border border-purple-500/20">
                  <FaStore size={9} />
                  <span>Franchise: {computedFranchiseOptions.find(f => String(f.id || f.name) === String(selectedFranchiseId))?.name || selectedFranchiseId}</span>
                  {computedFranchiseOptions.find(f => String(f.id || f.name) === String(selectedFranchiseId))?.gstin && (
                    <span className="font-mono text-[9px] bg-purple-100 dark:bg-purple-900/60 px-1 py-0.2 rounded font-bold">
                      {computedFranchiseOptions.find(f => String(f.id || f.name) === String(selectedFranchiseId))?.gstin}
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => { setSelectedFranchiseId("all"); setPage(1); }}
                    className="hover:text-purple-900 ml-0.5 cursor-pointer"
                  >
                    <FaTimes size={9} />
                  </button>
                </span>
              )}

              {searchQuery.trim() && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-500/10 text-slate-700 dark:text-slate-300 text-[11px] font-semibold border border-slate-500/20">
                  <FaSearch size={9} />
                  <span>"{searchQuery.trim()}"</span>
                  <button
                    type="button"
                    onClick={() => { setSearchQuery(""); setPage(1); }}
                    className="hover:text-slate-900 ml-0.5 cursor-pointer"
                  >
                    <FaTimes size={9} />
                  </button>
                </span>
              )}
            </div>

            <div className="text-[11px] font-bold text-text-secondary">
              Matches: <span className="text-blue-600 font-black">{filteredEpcOnlyOrders.length}</span> EPC Orders,{" "}
              <span className="text-purple-600 font-black">{filteredFranchiseOnlyOrders.length}</span> Franchise Orders,{" "}
              <span className="text-primary font-black">{filteredPOList.length}</span> Supplier POs
            </div>
          </div>
        )}
      </div>

      {/* ─── EPC Customer Orders Section ─────── */}
      {activeTab === "pending" && (awaitingSubFilter === "all" || awaitingSubFilter === "epc_orders") && (
        <CustomerOrdersTable
          title="EPC Customer Orders (Awaiting Supplier Procurement)"
          icon={FaBuilding}
          type="epc"
          orders={filteredEpcOnlyOrders}
          totalPendingCount={pendingEpcCount}
          selectedOrderIds={selectedOrderIds}
          toggleOrderSelection={toggleOrderSelection}
          onSelectAll={selectAllEpcOrders}
          isAllSelected={isAllEpcSelected}
          selectedCount={selectedEpcCount}
          expandedOrderId={expandedOrderId}
          setExpandedOrderId={setExpandedOrderId}
          hasActiveFilters={hasActiveMasterFilters}
          onResetFilters={resetAllMasterFilters}
          loading={loadingEpcOrders}
        />
      )}

      {/* ─── Franchise Customer Orders Section ─────── */}
      {activeTab === "pending" && (awaitingSubFilter === "all" || awaitingSubFilter === "franchise_orders") && (
        <CustomerOrdersTable
          title="Franchise Orders (Awaiting Supplier Procurement)"
          icon={FaStore}
          type="franchise"
          orders={filteredFranchiseOnlyOrders}
          totalPendingCount={pendingFranchiseCount}
          selectedOrderIds={selectedOrderIds}
          toggleOrderSelection={toggleOrderSelection}
          onSelectAll={selectAllFranchiseOrders}
          isAllSelected={isAllFranchiseSelected}
          selectedCount={selectedFranchiseCount}
          expandedOrderId={expandedOrderId}
          setExpandedOrderId={setExpandedOrderId}
          hasActiveFilters={hasActiveMasterFilters}
          onResetFilters={resetAllMasterFilters}
          loading={loadingEpcOrders}
        />
      )}

      {/* ─── Supplier Purchase Orders Section (POs) ───────────────────────── */}
      {((activeTab === "pending" && (awaitingSubFilter === "all" || awaitingSubFilter === "supplier_pos")) || activeTab === "history") && (
        <div className="space-y-6">
          {/* Section Title Header when viewing All */}
          {activeTab === "pending" && awaitingSubFilter === "all" && (
            <div className="flex items-center justify-between px-1 pt-2">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-primary/10 text-primary">
                  <FaClipboardList className="w-3.5 h-3.5" />
                </span>
                <h3 className="font-bold text-sm text-text-primary">
                  Supplier Purchase Orders (PO) Awaiting Order
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                  {hasActiveMasterFilters ? `${filteredPOList.length} of ${purchaseOrders.length} orders` : `${filteredPOList.length} order${filteredPOList.length !== 1 ? "s" : ""}`}
                </span>
              </div>
            </div>
          )}

          {/* Table Section */}
          <div className="card bg-surface border border-border">
            <div className="p-4 border-b border-border flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="flex flex-col md:flex-row gap-3 flex-1">
                <div className="relative flex-1 max-w-xs">
                  <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted text-xs" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setPage(1);
                    }}
                    placeholder="Search PO, Proforma Invoice, supplier..."
                    className="w-full h-10 bg-bg border border-border focus:border-primary rounded-xl pl-9 pr-4 text-xs font-semibold outline-none text-text-primary"
                  />
                </div>

                {/* Warehouse Filter */}
                <DropdownWithSearchInput
                  value={warehouseFilter}
                  onChange={(val) => { setWarehouseFilter(val); setPage(1); }}
                  options={[
                    { value: "All", text: "All Warehouses" },
                    ...uniqueWarehouses.map(w => ({ value: w._id || w.id, text: `${w.warehouse_code} (${w.address})` }))
                  ]}
                  placeholder="Filter by Warehouse..."
                  className="w-56 text-left"
                />

                {/* Supplier Filter */}
                <DropdownWithSearchInput
                  value={supplierFilter}
                  onChange={(val) => { setSupplierFilter(val); setPage(1); }}
                  options={[
                    { value: "All", text: "All Suppliers" },
                    ...uniqueSuppliers.map(s => ({ value: s._id || s.id, text: `${s.company_name} (${s.brand_name})` }))
                  ]}
                  placeholder="Filter by Supplier..."
                  className="w-56 text-left"
                />
              </div>
            </div>

            <div className="overflow-x-auto px-6 pb-6 pt-2">
              <CustomTable
                containerClassName="shadow-none border-none bg-transparent"
                headers={[
                  { key: "po_number", label: "PO Details" },
                  { key: "supplier", label: "Supplier / Brand" },
                  { key: "items", label: "Products ordered" },
                  { key: "total_amount", label: "Total Order Price" },
                  { key: "timeline", label: "Due Timeline" },
                  { key: "documents", label: "Documents" },
                  { key: "status", label: "Status" },
                  { key: "action", label: "Actions", align: "center" }
                ]}
                data={paginatedPOs}
                loading={loadingOrders}
                renderRow={(po) => {
                  const totalVal = (po.items || []).reduce((acc, it) => acc + (it.qty * it.order_price), 0);
                  const timelineDateObj = new Date(po.timeline);
                  timelineDateObj.setHours(0, 0, 0, 0);
                  const todayObj = new Date();
                  todayObj.setHours(0, 0, 0, 0);
                  const diffTime = todayObj - timelineDateObj;
                  const overdueDays = Math.max(0, Math.floor(diffTime / (1000 * 60 * 60 * 24)));
                  const isPoOverdue = po.status !== "delivered" && overdueDays > 0;

                  return (
                    <>
                      <td className="px-6 py-4">
                        <span className="font-extrabold text-primary text-xs uppercase block">{po.po_number}</span>
                        <span className="text-[10px] text-text-secondary font-bold block mt-0.5">PI No: {po.invoice_no || "—"}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-bold text-text-primary text-xs">{po.supplier_id?.company_name || "N/A"}</span>
                        <div className="text-[10px] text-text-secondary">Brand: {po.supplier_id?.brand_name || "N/A"}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-xs font-bold text-text-primary">
                          {(po.items || []).length} SKU{(po.items || []).length !== 1 ? "s" : ""}
                        </div>
                        <div className="text-[10px] text-text-secondary mt-0.5">
                          {((po.items || []).reduce((acc, it) => acc + (it.qty || 0), 0)).toLocaleString()} pcs total
                        </div>
                        <button
                          onClick={() => {
                            setSelectedItems(po.items || []);
                            setItemsModalOpen(true);
                          }}
                          className="mt-1.5 inline-flex items-center gap-1 text-[10px] text-primary font-black hover:underline"
                        >
                          <FaEye size={10} /> View Items
                        </button>
                      </td>
                      <td className="px-6 py-4 font-black text-text-primary text-xs">
                        ₹{totalVal.toLocaleString()}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-xs font-semibold ${isPoOverdue ? 'text-danger font-extrabold' : 'text-text-primary'}`}>
                          {new Date(po.timeline).toLocaleDateString()}
                        </span>
                        {isPoOverdue && (
                          <span className="block text-[9px] font-black text-danger uppercase tracking-wider animate-pulse mt-0.5">
                            ⚠️ Overdue ({overdueDays} {overdueDays === 1 ? 'day' : 'days'})
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1.5 max-w-[120px]">
                          {po.purchase_order_pdf ? (
                            <button
                              onClick={() => {
                                setProformaPO(po);
                                setProformaInitialTab("po");
                                setProformaModalOpen(true);
                              }}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20 text-[9px] font-bold uppercase tracking-wide hover:bg-primary/20 transition-all justify-center"
                            >
                              <FaFilePdf size={9} /> PO PDF
                            </button>
                          ) : (
                            <span className="text-[9px] text-text-muted italic text-center">No PO PDF</span>
                          )}
                          {po.proforma_invoice_pdf ? (
                            <button
                              onClick={() => {
                                setProformaPO(po);
                                setProformaInitialTab("pi");
                                setProformaModalOpen(true);
                              }}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-info/10 text-info border border-info/20 text-[9px] font-bold uppercase tracking-wide hover:bg-info/20 transition-all justify-center"
                            >
                              <FaFilePdf size={9} /> PI PDF
                            </button>
                          ) : (
                            <span className="text-[9px] text-text-muted italic text-center">No PI PDF</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase border ${po.status === 'delivered' ? 'bg-success/10 text-success border-success/20' :
                          po.status === 'paid' ? 'bg-success/10 text-success border-success/20' :
                            po.status === 'invoiced' ? 'bg-warning/10 text-warning border-warning/20' :
                              po.status === 'pending' ? 'bg-primary/10 text-primary border-primary/20' :
                                po.status === 'cancelled' ? 'bg-danger/10 text-danger border-danger/20' :
                                  'bg-warning/10 text-warning border-warning/20'
                          }`}>
                          {po.status === 'pending' ? 'Pending Payment' : po.status === 'invoiced' ? 'Awaiting Payment' : po.status === 'paid' ? 'Paid / Awaiting Delivery' : po.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        {["pending", "accepted", "invoiced"].includes(po.status) ? (
                          <div className="flex flex-col gap-2 items-center justify-center">
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={() => handleOpenPay(po)}
                              className="text-[10px] font-extrabold uppercase py-1 px-3"
                            >
                              Add Payment Details
                            </Button>
                            <button
                              type="button"
                              onClick={() => openCancelConfirm(po.id || po._id)}
                              className="text-[10px] text-danger font-bold hover:underline"
                            >
                              Cancel PO
                            </button>
                          </div>
                        ) : po.status === "cancelled" ? (
                          <span className="text-[10px] text-text-muted italic">Order Cancelled</span>
                        ) : (
                          <div className="text-left text-[10px] space-y-0.5 bg-bg p-2 rounded-xl border border-border max-w-[170px] inline-block font-medium">
                            <div className="text-text-secondary">UTR: <span className="font-bold text-text-primary">{po.payment_details?.reference_no}</span></div>
                            <div className="text-text-secondary">Mode: <span className="font-bold text-text-primary">{po.payment_details?.payment_mode}</span></div>
                            <div className="text-text-secondary">Paid: <span className="font-bold text-text-primary">₹{po.payment_details?.amount?.toLocaleString()}</span></div>
                            {po.payment_details?.receipt_url && (
                              <div className="mt-1">
                                <a
                                  href={po.payment_details.receipt_url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-primary underline font-extrabold hover:text-primary-dark"
                                >
                                  📄 View Receipt
                                </a>
                              </div>
                            )}
                          </div>
                        )}
                      </td>
                    </>
                  );
                }}
                emptyMessage={hasActiveMasterFilters ? "No purchase orders matching the selected master filters." : "No purchase orders found."}
              />
            </div>

            <div className="p-6 border-t border-border">
              <Pagination
                currentPage={page}
                totalPages={Math.ceil(filteredPOList.length / pageSize)}
                onPageChange={setPage}
                totalItems={filteredPOList.length}
                pageSize={pageSize}
              />
            </div>
          </div>
        </div>
      )}

      {/* Pay Details Dialog */}
      <Dialog
        isOpen={isPayOpen}
        onClose={() => !submitting && setIsPayOpen(false)}
        title={`Add Payment Details - ${selectedPO?.po_number}`}
        size="md"
      >
        <form onSubmit={handlePaySubmit} className="space-y-4">
          {formError && (
            <div className="p-3 bg-danger/5 border border-danger/25 text-danger rounded-xl text-xs font-semibold">
              ⚠️ {formError}
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-success/5 border border-success/25 text-success rounded-xl text-xs font-semibold">
              ✅ {successMsg}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="text-[10px] font-black text-text-secondary uppercase">Select Payment Mode *</label>
              <DropdownWithSearchInput
                value={payForm.payment_mode}
                onChange={(val) => setPayForm({ ...payForm, payment_mode: val })}
                options={[
                  { value: "NEFT", text: "NEFT Bank Transfer" },
                  { value: "RTGS", text: "RTGS Bank Transfer" },
                  { value: "IMPS", text: "IMPS Bank Transfer" },
                  { value: "UPI", text: "UPI Instant Payment" },
                  { value: "Card", text: "Credit / Debit Card" },
                  { value: "Cash", text: "Cash Payment" }
                ]}
                placeholder="Select Mode..."
                className="w-full"
              />
            </div>

            <div className="col-span-2">
              <CustomInput
                label="Proforma Invoice Number (PI No) *"
                placeholder="e.g. PI-2026-0041"
                required
                value={payForm.proforma_invoice_no}
                onChange={(e) => setPayForm({ ...payForm, proforma_invoice_no: e.target.value })}
              />
            </div>

            <CustomInput
              label="Transaction reference / UTR No. *"
              placeholder="e.g. UTR123456789"
              required
              value={payForm.reference_no}
              onChange={(e) => setPayForm({ ...payForm, reference_no: e.target.value })}
            />

            <CustomInput
              label="Payment Date *"
              type="date"
              required
              max={new Date().toLocaleDateString('en-CA')}
              value={payForm.payment_date}
              onChange={(e) => setPayForm({ ...payForm, payment_date: e.target.value })}
            />

            <div className="col-span-2">
              <CustomInput
                label="Paid Amount (₹) *"
                type="number"
                required
                min="1"
                placeholder="e.g. 50000"
                value={payForm.amount}
                onChange={(e) => setPayForm({ ...payForm, amount: e.target.value })}
              />
            </div>

            <div className="col-span-2 space-y-2">
              <CustomFilePicker
                name="receipt_url"
                label="Payment Receipt / Screenshot Document *"
                accept="application/pdf,image/*"
                onChange={handleFileChange}
                disabled={uploadingReceipt || submitting}
                files={selectedFile ? [selectedFile] : []}
              />
              {uploadingReceipt && (
                <div className="text-[10px] text-primary font-bold flex items-center gap-1.5 animate-pulse mt-1">
                  <FaSpinner className="animate-spin text-xs" /> Uploading receipt screenshot to Cloudinary...
                </div>
              )}
              {(selectedFile || payForm.receipt_url) && (
                <div className="text-[10px] text-success font-black flex items-center gap-1 mt-1">
                  <FaCheckCircle className="text-xs" /> Document selected: {selectedFile ? selectedFile.name : "receipt_url"} {" "}
                  <a
                    href={selectedFile ? URL.createObjectURL(selectedFile) : payForm.receipt_url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-primary underline font-extrabold hover:text-primary-dark ml-1"
                  >
                    View File
                  </a>
                </div>
              )}
            </div>

            <div className="col-span-2 space-y-2 border-t border-border/30 pt-3">
              <CustomFilePicker
                name="proforma_invoice_pdf"
                label="Proforma Invoice PDF (from Supplier) *"
                accept="application/pdf"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    setSelectedPIFile(file);
                    setFormError("");
                  }
                }}
                disabled={uploadingPI || submitting}
                files={selectedPIFile ? [selectedPIFile] : []}
              />
              {uploadingPI && (
                <div className="text-[10px] text-primary font-bold flex items-center gap-1.5 animate-pulse mt-1">
                  <FaSpinner className="animate-spin text-xs" /> Uploading Proforma Invoice PDF to Cloudinary...
                </div>
              )}
              {(selectedPIFile || selectedPO?.proforma_invoice_pdf) && (
                <div className="text-[10px] text-success font-black flex items-center gap-1 mt-1">
                  <FaCheckCircle className="text-xs" /> PI Document selected: {selectedPIFile ? selectedPIFile.name : "proforma_invoice_pdf"} {" "}
                  <a
                    href={selectedPIFile ? URL.createObjectURL(selectedPIFile) : selectedPO?.proforma_invoice_pdf}
                    target="_blank"
                    rel="noreferrer"
                    className="text-primary underline font-extrabold hover:text-primary-dark ml-1"
                  >
                    View File
                  </a>
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-3 justify-end pt-4 border-t border-border">
            <Button
              type="button"
              variant="secondary"
              disabled={submitting}
              onClick={() => setIsPayOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={submitting}
              loading={submitting}
              leftIcon={<FaCheckCircle />}
            >
              Complete Payment
            </Button>
          </div>
        </form>
      </Dialog>

      <ProformaInvoiceModal
        isOpen={proformaModalOpen}
        onClose={() => setProformaModalOpen(false)}
        po={proformaPO}
        initialTab={proformaInitialTab}
      />

      {/* Cancel PO Confirmation Popup */}
      <ConfirmationPopup
        isOpen={cancelConfirmOpen}
        title="Cancel Purchase Order"
        message="This action cannot be undone. The PO status will be permanently set to Cancelled."
        variant="danger"
        confirmText="Yes, Cancel PO"
        cancelText="No, Keep PO"
        isLoading={cancelLoading}
        onConfirm={handleConfirmCancel}
        onCancel={() => { if (!cancelLoading) setCancelConfirmOpen(false); }}
      />
      {/* Products Ordered Dialog */}
      <Dialog
        isOpen={itemsModalOpen}
        onClose={() => setItemsModalOpen(false)}
        title="Products Ordered"
        size="md"
      >
        <div className="space-y-3 p-1 divide-y divide-border/60 max-h-[400px] overflow-y-auto">
          {selectedItems.map((it, idx) => {
            const buyingPrice = it.order_price || 0;
            const totalPrice = it.qty * buyingPrice;
            return (
              <div key={idx} className="pt-3 first:pt-0 pb-2 flex justify-between items-center gap-4">
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-text-primary">
                    {it.sku_details?.product_name || it.sku_code}
                  </span>
                  <span className="text-[10px] text-text-secondary mt-0.5">
                    Qty: {it.qty} pcs
                  </span>
                </div>
                <div className="flex flex-col items-end text-right">
                  <span className="text-xs font-semibold text-text-secondary">
                    ₹{buyingPrice.toLocaleString("en-IN")} / pc
                  </span>
                  <span className="text-xs font-extrabold text-primary mt-0.5">
                    Total: ₹{totalPrice.toLocaleString("en-IN")}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </Dialog>



      {/* ─── Combine & Pay Supplier Modal ──────────────────────────────────── */}
      <Dialog
        isOpen={combineModalOpen}
        onClose={() => !combineSubmitting && setCombineModalOpen(false)}
        title={`Combine & Pay Supplier — ${selectedOrderIds.size} Orders Selected`}
        size="lg"
      >
        <form onSubmit={handleCombineSubmit} className="space-y-5">
          {combineError && (
            <div className="p-3 bg-danger/5 border border-danger/25 text-danger rounded-xl text-xs font-semibold">⚠️ {combineError}</div>
          )}
          {combineSuccess && (
            <div className="p-3 bg-success/5 border border-success/25 text-success rounded-xl text-xs font-semibold">{combineSuccess}</div>
          )}

          {/* Selected Orders Summary */}
          <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-700/40 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <FaLink className="text-amber-600" />
              <span className="text-xs font-black text-amber-700 dark:text-amber-400 uppercase tracking-wide">Selected Orders Being Combined</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {pendingEpcOrders.filter(o => selectedOrderIds.has(o.id || o._id)).map(o => (
                <span key={o.id || o._id} className="inline-flex items-center gap-1.5 text-[10px] font-bold bg-white dark:bg-surface border border-amber-300 dark:border-amber-700/50 text-amber-800 dark:text-amber-300 px-2.5 py-1 rounded-full">
                  <FaBuilding size={8} /> {o.order_number} — {o.customer_name} — ₹{(o.order_amount || 0).toLocaleString("en-IN")}
                </span>
              ))}
            </div>
          </div>

          {/* Warehouse & Supplier */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-black text-text-secondary uppercase block mb-1">Destination Warehouse *</label>
              <select
                value={combineForm.warehouse_id}
                onChange={(e) => handleCombineWarehouseChange(e.target.value)}
                className="w-full rounded-xl border border-border bg-surface text-text-primary text-xs font-semibold px-3 py-2.5 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                required
              >
                <option value="">Select warehouse...</option>
                {warehouses.map(wh => (
                  <option key={wh._id} value={wh._id}>{wh.warehouse_code || wh.address?.city || wh._id}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-black text-text-secondary uppercase block mb-1">Supplier *</label>
              <select
                value={combineForm.supplier_id}
                onChange={(e) => setCombineForm({ ...combineForm, supplier_id: e.target.value })}
                className="w-full rounded-xl border border-border bg-surface text-text-primary text-xs font-semibold px-3 py-2.5 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                required
                disabled={!combineForm.warehouse_id}
              >
                <option value="">Select supplier...</option>
                {suppliers.map(s => (
                  <option key={s.supplier_id} value={s.supplier_id}>{s.company_name} — GST: {s.gst_number || "N/A"}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-black text-text-secondary uppercase block mb-1">Expected Delivery By *</label>
              <input
                type="date"
                value={combineForm.timeline}
                min={new Date().toLocaleDateString('en-CA')}
                onChange={(e) => setCombineForm({ ...combineForm, timeline: e.target.value })}
                className="w-full rounded-xl border border-border bg-surface text-text-primary text-xs font-semibold px-3 py-2.5 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                required
              />
            </div>
            <div>
              <label className="text-[10px] font-black text-text-secondary uppercase block mb-1">PI / Reference No. (Optional)</label>
              <input
                type="text"
                value={combineForm.proforma_invoice_no}
                onChange={(e) => setCombineForm({ ...combineForm, proforma_invoice_no: e.target.value })}
                placeholder="e.g. PI-2026-001"
                className="w-full rounded-xl border border-border bg-surface text-text-primary text-xs font-semibold px-3 py-2.5 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
              />
            </div>
          </div>

          {/* SKU Items */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-[10px] font-black text-text-secondary uppercase">
                SKU Items Being Ordered from Supplier *
                {loadingSkus && <span className="ml-2 text-primary font-normal">Loading catalog...</span>}
              </label>
              <button
                type="button"
                onClick={() => setCombineItems([...combineItems, { sku_id: "", sku_code: "", qty: 1, order_price: "" }])}
                className="text-[10px] font-black text-primary flex items-center gap-1 hover:underline"
              >
                <FaPlus size={9} /> Add Item
              </button>
            </div>
            <div className="space-y-2">
              {combineItems.map((item, idx) => (
                <div key={idx} className="grid grid-cols-12 gap-2 items-center bg-surface-hover rounded-xl p-3 border border-border">
                  <div className="col-span-5">
                    {warehouseSkus.length > 0 ? (
                      <select
                        value={item.sku_id}
                        onChange={(e) => {
                          const val = e.target.value;
                          const selected = warehouseSkus.find(s => (s.sku_id?._id || s._id) === val);
                          const copy = [...combineItems];
                          copy[idx].sku_id = val;
                          copy[idx].sku_code = selected ? (selected.sku_code || selected.code || "") : "";
                          if (selected && !copy[idx].order_price) {
                            copy[idx].order_price = selected.benchmark_price || "";
                          }
                          setCombineItems(copy);
                        }}
                        className="w-full text-xs border border-border rounded-lg px-2 py-1.5 bg-surface text-text-primary focus:ring-1 focus:ring-primary/20 outline-none"
                        required
                      >
                        <option value="">-- Choose SKU from Catalog --</option>
                        {warehouseSkus.map(s => {
                          const sId = s.sku_id?._id || s._id;
                          const sName = s.product_name || s.sku_details?.product_name || s.name || s.sku_code;
                          return (
                            <option key={sId} value={sId}>
                              {s.sku_code} — {sName} (₹{s.benchmark_price || 0})
                            </option>
                          );
                        })}
                      </select>
                    ) : (
                      <input
                        type="text"
                        placeholder="SKU ID (MongoDB ObjectId)"
                        value={item.sku_id}
                        onChange={(e) => { const copy = [...combineItems]; copy[idx].sku_id = e.target.value; setCombineItems(copy); }}
                        className="w-full text-xs font-mono border border-border rounded-lg px-2 py-1.5 bg-surface text-text-primary focus:ring-1 focus:ring-primary/20 outline-none"
                        required
                      />
                    )}
                  </div>
                  <div className="col-span-2">
                    <input
                      type="text"
                      placeholder="SKU Code"
                      value={item.sku_code}
                      onChange={(e) => { const copy = [...combineItems]; copy[idx].sku_code = e.target.value; setCombineItems(copy); }}
                      className="w-full text-xs border border-border rounded-lg px-2 py-1.5 bg-surface text-text-primary focus:ring-1 focus:ring-primary/20 outline-none"
                    />
                  </div>
                  <div className="col-span-2">
                    <input
                      type="number"
                      placeholder="Qty"
                      min="1"
                      value={item.qty}
                      onChange={(e) => { const copy = [...combineItems]; copy[idx].qty = Number(e.target.value); setCombineItems(copy); }}
                      className="w-full text-xs border border-border rounded-lg px-2 py-1.5 bg-surface text-text-primary focus:ring-1 focus:ring-primary/20 outline-none"
                    />
                  </div>
                  <div className="col-span-2">
                    <input
                      type="number"
                      placeholder="Price (₹)"
                      min="0"
                      step="0.01"
                      value={item.order_price}
                      onChange={(e) => { const copy = [...combineItems]; copy[idx].order_price = e.target.value; setCombineItems(copy); }}
                      className="w-full text-xs border border-border rounded-lg px-2 py-1.5 bg-surface text-text-primary focus:ring-1 focus:ring-primary/20 outline-none"
                    />
                  </div>
                  <div className="col-span-1 flex justify-center">
                    {combineItems.length > 1 && (
                      <button type="button" onClick={() => setCombineItems(combineItems.filter((_, i) => i !== idx))} className="text-danger hover:text-danger/70 p-1">
                        <FaTrash size={11} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Payment Details */}
          <div className="border-t border-border pt-4">
            <div className="text-xs font-black text-text-secondary uppercase tracking-widest mb-3 flex items-center gap-2">
              <FaCreditCard className="text-primary" /> Supplier Payment Details
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-black text-text-secondary uppercase block mb-1">Payment Mode *</label>
                <select
                  value={combineForm.payment_mode}
                  onChange={(e) => setCombineForm({ ...combineForm, payment_mode: e.target.value })}
                  className="w-full rounded-xl border border-border bg-surface text-text-primary text-xs font-semibold px-3 py-2.5 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                >
                  {["NEFT", "RTGS", "IMPS", "UPI", "Card", "Cash"].map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-black text-text-secondary uppercase block mb-1">UTR / Reference No. *</label>
                <input
                  type="text"
                  placeholder="e.g. UTR123456789"
                  value={combineForm.reference_no}
                  onChange={(e) => setCombineForm({ ...combineForm, reference_no: e.target.value })}
                  className="w-full rounded-xl border border-border bg-surface text-text-primary text-xs font-semibold px-3 py-2.5 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                  required
                />
              </div>
              <div>
                <label className="text-[10px] font-black text-text-secondary uppercase block mb-1">Payment Date *</label>
                <input
                  type="date"
                  value={combineForm.payment_date}
                  max={new Date().toLocaleDateString('en-CA')}
                  onChange={(e) => setCombineForm({ ...combineForm, payment_date: e.target.value })}
                  className="w-full rounded-xl border border-border bg-surface text-text-primary text-xs font-semibold px-3 py-2.5 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                  required
                />
              </div>
              <div>
                <label className="text-[10px] font-black text-text-secondary uppercase block mb-1">Amount Paid (₹) *</label>
                <input
                  type="number"
                  min="1"
                  placeholder="e.g. 125000"
                  value={combineForm.amount}
                  onChange={(e) => setCombineForm({ ...combineForm, amount: e.target.value })}
                  className="w-full rounded-xl border border-border bg-surface text-text-primary text-xs font-semibold px-3 py-2.5 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                  required
                />
              </div>
              <div className="col-span-2">
                <label className="text-[10px] font-black text-text-secondary uppercase block mb-1">Payment Receipt (Optional)</label>
                <input
                  type="file"
                  accept="application/pdf,image/*"
                  onChange={(e) => setCombineReceiptFile(e.target.files?.[0] || null)}
                  className="w-full text-xs text-text-primary file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 transition-all cursor-pointer"
                />
                {uploadingCombineReceipt && (
                  <div className="text-[10px] text-primary font-bold flex items-center gap-1.5 animate-pulse mt-1">
                    <FaSpinner className="animate-spin" /> Uploading receipt...
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex gap-3 justify-end pt-4 border-t border-border">
            <button
              type="button"
              onClick={() => setCombineModalOpen(false)}
              disabled={combineSubmitting}
              className="px-5 py-2 rounded-xl text-xs font-bold border border-border text-text-secondary hover:bg-surface-hover transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={combineSubmitting}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-black uppercase tracking-wide transition-all shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {combineSubmitting ? <FaSpinner className="animate-spin" /> : <FaCheckCircle />}
              {combineSubmitting ? "Processing..." : `Confirm & Pay Supplier`}
            </button>
          </div>
        </form>
      </Dialog>

    </div>
  );
}

