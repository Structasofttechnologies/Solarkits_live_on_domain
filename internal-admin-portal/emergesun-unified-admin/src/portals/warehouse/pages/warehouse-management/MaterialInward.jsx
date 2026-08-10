import React, { useState, useEffect, useMemo } from "react";
import { Routes, Route, Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { useDispatch } from "react-redux";
import { setAlert } from "../../features/alert.slice";
import { motion, AnimatePresence } from "framer-motion";
import {
  HiCube, HiOutlineUpload, HiOutlineCheckCircle,
  HiOutlineExclamationCircle, HiOutlineClipboardList,
  HiOutlineHashtag, HiOutlineQrcode, HiOutlineDownload,
  HiOutlineSearch, HiOutlinePlus, HiOutlineTrash, HiDuplicate
} from 'react-icons/hi';
import { FaBoxes, FaBarcode, FaListAlt, FaExchangeAlt, FaDollyFlatbed, FaBuilding, FaCheckCircle, FaSpinner, FaFilePdf, FaEye, FaShippingFast, FaHandshake, FaInfoCircle, FaClock, FaUser, FaFileInvoice } from "react-icons/fa";
import { getInwardActiveSkus, saveInward, getInwardLogs, getInwardStockStatus, getWarehousePurchaseOrders, markPurchaseOrderDelivered, uploadTaxInvoice, createPoRequest, getPoRequests } from "../../api/inward";
import axios from "axios";
import { authHeaderObj } from "../../app/authHeader";

// Custom UI Components
import Button from "../../components/Button";
import CustomInput from "../../components/CustomInput";
import DropdownWithSearchInput from "../../components/DropdownWithSearchInput";
import ConfirmationPopup from "../../components/ConfirmationPopup";
import CustomTable from "../../components/CustomTable";
import Pagination from "../../components/Pagination";
import CustomFilePicker from "../../components/CustomFilePicker";
import Dialog from "../../components/Dialog";
import PageHeader from "../../components/PageHeader";

// ─── Inline Proforma Invoice Modal ────────────────────────────────────────────
// ─── Inline Proforma Invoice Modal ────────────────────────────────────────────
function ProformaInvoiceModal({ isOpen, onClose, po, defaultTab = "po" }) {
  const [activeTab, setActiveTab] = useState(defaultTab); // "po" or "pi"

  // Reset tab when modal opens
  useEffect(() => {
    if (isOpen) {
      setActiveTab(defaultTab);
    }
  }, [isOpen, defaultTab]);

  if (!po) return null;

  const purchaseOrderPdf = po.purchase_order_pdf;
  const proformaPdfUrl = po.proforma_invoice_pdf;
  const totalValue = (po.items || []).reduce((acc, it) => acc + (it.qty * (it.order_price || 0)), 0);
  const issueDate = new Date(po.createdAt || po.created_at).toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" });
  const dueDate = new Date(po.timeline).toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" });

  return (
    <Dialog isOpen={isOpen} onClose={onClose} title="Order Documents Viewer" size="lg">
      <div className="space-y-4 p-1">
        {/* Toggle between PO and Proforma Invoice */}
        <div className="flex bg-surface-hover border border-border p-1 rounded-xl gap-1 max-w-xs">
          <button
            onClick={() => setActiveTab("po")}
            className={`flex-1 py-1.5 px-3 rounded-lg text-[10px] font-black uppercase transition-all ${
              activeTab === "po" ? "bg-primary text-white shadow-sm" : "text-text-secondary hover:bg-surface-hover"
            }`}
          >
            Purchase Order
          </button>
          <button
            onClick={() => setActiveTab("pi")}
            className={`flex-1 py-1.5 px-3 rounded-lg text-[10px] font-black uppercase transition-all ${
              activeTab === "pi" ? "bg-primary text-white shadow-sm" : "text-text-secondary hover:bg-surface-hover"
            }`}
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
            <>
              <div className="flex justify-between items-start bg-primary/5 border border-primary/20 rounded-2xl p-5">
                <div>
                  <div className="text-[10px] font-black text-primary uppercase tracking-widest mb-1">Purchase Order (No PDF)</div>
                  <div className="text-xl font-black text-text-primary">{po.po_number}</div>
                  <div className="text-xs text-text-secondary mt-1">Issue Date: <span className="font-bold text-text-primary">{issueDate}</span></div>
                  <div className="text-xs text-text-secondary">Delivery Due: <span className="font-bold text-text-primary">{dueDate}</span></div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-1">Status</div>
                  <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase border ${
                    po.status === 'delivered' ? 'bg-success/10 text-success border-success/20' :
                    po.status === 'paid' ? 'bg-success/10 text-success border-success/20' :
                    po.status === 'invoiced' ? 'bg-info/10 text-info border-info/20' :
                    'bg-warning/10 text-warning border-warning/20'
                  }`}>{po.status}</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-surface-hover/50 rounded-xl border border-border p-4 space-y-1">
                  <div className="text-[10px] font-black text-text-muted uppercase tracking-widest">Supplier / Vendor</div>
                  <div className="font-black text-text-primary text-sm">{po.supplier_id?.company_name || "N/A"}</div>
                  <div className="text-xs text-text-secondary">Brand: {po.supplier_id?.brand_name || "N/A"}</div>
                  {po.supplier_id?.gst_number && <div className="text-[10px] font-mono text-text-muted">GSTIN: {po.supplier_id.gst_number}</div>}
                </div>
                <div className="bg-surface-hover/50 rounded-xl border border-border p-4 space-y-1">
                  <div className="text-[10px] font-black text-text-muted uppercase tracking-widest">Delivery Warehouse</div>
                  <div className="font-black text-text-primary text-sm">{po.warehouse_id?.warehouse_code || "N/A"}</div>
                  <div className="text-xs text-text-secondary leading-relaxed">{po.warehouse_id?.address || "—"}</div>
                </div>
              </div>
              <div className="rounded-xl border border-border overflow-hidden">
                <div className="bg-surface-hover/50 px-4 py-2.5 border-b border-border">
                  <span className="text-[10px] font-black text-text-muted uppercase tracking-widest">Ordered Items</span>
                </div>
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-border bg-surface">
                      <th className="px-4 py-3 text-left font-black text-text-muted uppercase tracking-wider text-[10px]">#</th>
                      <th className="px-4 py-3 text-left font-black text-text-muted uppercase tracking-wider text-[10px]">SKU Code</th>
                      <th className="px-4 py-3 text-left font-black text-text-muted uppercase tracking-wider text-[10px]">Product</th>
                      <th className="px-4 py-3 text-right font-black text-text-muted uppercase tracking-wider text-[10px]">Qty</th>
                      <th className="px-4 py-3 text-right font-black text-text-muted uppercase tracking-wider text-[10px]">Unit Price</th>
                      <th className="px-4 py-3 text-right font-black text-text-muted uppercase tracking-wider text-[10px]">Line Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {(po.items || []).map((it, idx) => (
                      <tr key={idx} className="hover:bg-surface-hover/30 transition-colors">
                        <td className="px-4 py-3 text-text-muted">{idx + 1}</td>
                        <td className="px-4 py-3 font-extrabold text-primary tracking-widest">{it.sku_code}</td>
                        <td className="px-4 py-3 font-semibold text-text-primary">{it.sku_details?.product_name || it.sku_code}</td>
                        <td className="px-4 py-3 text-right font-bold text-text-primary">{it.qty?.toLocaleString()} pcs</td>
                        <td className="px-4 py-3 text-right text-text-secondary font-mono">
                          {it.order_price_per_watt ? (
                            <span>
                              ₹{Number(it.order_price_per_watt).toFixed(2)}/W
                              <span className="text-[10px] text-text-secondary block font-bold mt-0.5">
                                (₹{Number(it.order_price).toFixed(2)}/pc)
                              </span>
                            </span>
                          ) : (
                            `₹${Number(it.order_price || 0).toLocaleString()}`
                          )}
                        </td>
                        <td className="px-4 py-3 text-right font-black text-text-primary">₹{(it.qty * (it.order_price || 0)).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-primary/5 border-t-2 border-primary/20">
                      <td colSpan={5} className="px-4 py-3 text-right font-black text-text-primary text-xs uppercase tracking-wider">Total Order Value</td>
                      <td className="px-4 py-3 text-right font-black text-primary text-sm">₹{totalValue.toLocaleString()}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </>
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

// ─── Inward Details Modal ─────────────────────────────────────────────────────
function InwardDetailsModal({ isOpen, onClose, log, activeSkus }) {
  if (!log) return null;

  const totalQty = (log.items || []).reduce((acc, it) => acc + (it.qty || 0), 0);
  const inwardDate = log.invoice_date ? new Date(log.invoice_date).toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" }) : "N/A";

  return (
    <Dialog isOpen={isOpen} onClose={onClose} title="Inward Receipt Details" size="lg">
      <div className="space-y-4 p-1">
        <div className="flex justify-between items-start bg-primary/5 border border-primary/20 rounded-2xl p-5">
          <div>
            <div className="text-[10px] font-black text-primary uppercase tracking-widest mb-1">Goods Receipt Note (GRN)</div>
            <div className="text-xl font-black text-text-primary">{log.grn_no}</div>
            <div className="text-xs text-text-secondary mt-1">Inward Date: <span className="font-bold text-text-primary">{inwardDate}</span></div>
            <div className="text-xs text-text-secondary">Invoice / Ref No: <span className="font-bold text-text-primary">{log.invoice_no}</span></div>
          </div>
          <div className="text-right">
            <div className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-1">QC Status</div>
            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase border ${
              log.status === 'approved' ? 'bg-success/10 text-success border-success/20' :
              log.status === 'rejected' ? 'bg-danger/10 text-danger border-danger/20' :
              'bg-warning/10 text-warning border-warning/20'
            }`}>{log.status}</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-surface-hover/50 rounded-xl border border-border p-4 space-y-1">
            <div className="text-[10px] font-black text-text-muted uppercase tracking-widest">Supplier / Origin</div>
            <div className="font-black text-text-primary text-sm">{log.supplier_name}</div>
            <div className="text-xs text-text-secondary">Type: <span className="capitalize">{log.inward_type}</span></div>
          </div>
          <div className="bg-surface-hover/50 rounded-xl border border-border p-4 space-y-1">
            <div className="text-[10px] font-black text-text-muted uppercase tracking-widest">Receipt Summary</div>
            <div className="font-black text-text-primary text-sm">{totalQty.toLocaleString()} Total Units</div>
            {(log.items || []).some(it => {
              const sku = activeSkus.find(s => s.id === it.sku_id) || {};
              return sku.category === "Solar Panel" || sku.category?.toLowerCase()?.includes("solar");
            }) && (
              <div className="text-xs text-text-secondary">
                Capacity: {" "}
                <span className="font-bold text-text-primary">
                  {(log.items || []).reduce((acc, it) => {
                    const sku = activeSkus.find(s => s.id === it.sku_id) || {};
                    const isSolar = sku.category === "Solar Panel" || sku.category?.toLowerCase()?.includes("solar");
                    return acc + (isSolar ? (it.qty * (sku.wattage || 550)) / 1000 : 0);
                  }, 0).toFixed(2)} kW
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-border overflow-hidden">
          <div className="bg-surface-hover/50 px-4 py-2.5 border-b border-border">
            <span className="text-[10px] font-black text-text-muted uppercase tracking-widest">Inwarded SKU Items</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border bg-surface">
                  <th className="px-4 py-3 text-left font-black text-text-muted uppercase tracking-wider text-[10px]">#</th>
                  <th className="px-4 py-3 text-left font-black text-text-muted uppercase tracking-wider text-[10px]">SKU Code</th>
                  <th className="px-4 py-3 text-left font-black text-text-muted uppercase tracking-wider text-[10px]">Product / Brand</th>
                  <th className="px-4 py-3 text-right font-black text-text-muted uppercase tracking-wider text-[10px]">Qty Received</th>
                  <th className="px-4 py-3 text-left font-black text-text-muted uppercase tracking-wider text-[10px]">Allocation Rack</th>
                  <th className="px-4 py-3 text-left font-black text-text-muted uppercase tracking-wider text-[10px]">QC Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {(log.items || []).map((it, idx) => {
                  const sku = activeSkus.find(s => s.id === it.sku_id) || {};
                  const isSolar = sku.category === "Solar Panel" || sku.category?.toLowerCase()?.includes("solar");
                  const itemKw = isSolar ? `${((it.qty * (sku.wattage || 550)) / 1000).toFixed(2)} kW` : null;

                  return (
                    <tr key={idx} className="hover:bg-surface-hover/30 transition-colors">
                      <td className="px-4 py-3 text-text-muted">{idx + 1}</td>
                      <td className="px-4 py-3 font-extrabold text-primary tracking-widest">{sku.sku_code || it.sku_code || "N/A"}</td>
                      <td className="px-4 py-3">
                        <div className="font-semibold text-text-primary">{sku.product_name || "N/A"}</div>
                        <div className="text-[10px] text-text-secondary">{sku.brand_name || "N/A"} ({sku.category || "N/A"})</div>
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-text-primary">
                        <div>{it.qty?.toLocaleString()} pcs</div>
                        {itemKw && <div className="text-[10px] font-bold text-text-secondary">{itemKw}</div>}
                      </td>
                      <td className="px-4 py-3 font-medium text-text-primary">{it.allocation_rack || "N/A"}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full font-bold text-[9px] border ${
                          (it.qc_status || "passed").toLowerCase() === 'passed' ? 'bg-success/10 text-success border-success/20' : 'bg-danger/10 text-danger border-danger/20'
                        }`}>{it.qc_status || "Passed"}</span>
                        {it.damage_notes && <div className="text-[10px] text-danger font-medium mt-1">Notes: {it.damage_notes}</div>}
                        {it.serials && it.serials.length > 0 && (
                          <div className="mt-1 text-[9px] text-text-muted font-mono leading-tight whitespace-pre-line">
                            Serials: {it.serials.join(", ")}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Dialog>
  );
}

const initialPendingTransfers = [
  {
    transferId: "TRN-9091",
    origin: "Jaipur Main Hub (Master)",
    dateSent: "2026-06-14",
    items: [
      { category: "Solar Panel", brand: "Waaree", specs: "550W TOPCon", qty: 100, kws: 55 },
      { category: "Inverter", brand: "Solis", specs: "50kW", qty: 2, kws: 100 }
    ],
    status: "Awaiting Receipt"
  },
  {
    transferId: "TRN-9092",
    origin: "Ahmedabad GIDC Hub (Master)",
    dateSent: "2026-06-15",
    items: [
      { category: "ACDC Cables", brand: "Polycab", specs: "4 sq mm", qty: 20, kws: 0 }
    ],
    status: "Received"
  }
];

export default function MaterialInward() {
  const dispatch = useDispatch();
  const [warehouseMode, setWarehouseMode] = useState(localStorage.getItem('warehouseMode') || 'master');
  const todayStr = new Date().toLocaleDateString('en-CA');

  // Pagination states
  const [logsPage, setLogsPage] = useState(1);
  const logsPageSize = 5;

  const [posPage, setPosPage] = useState(1);
  const posPageSize = 5;

  const [stockPage, setStockPage] = useState(1);
  const stockPageSize = 5;

  // Watch for warehouse mode updates
  useEffect(() => {
    const handleModeChanged = () => {
      setWarehouseMode(localStorage.getItem('warehouseMode') || 'master');
      setLogsPage(1);
      setPosPage(1);
      setStockPage(1);
    };
    window.addEventListener('warehouseModeChanged', handleModeChanged);
    return () => window.removeEventListener('warehouseModeChanged', handleModeChanged);
  }, []);

  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState(() => {
    return sessionStorage.getItem("inwardActiveTab") || "local";
  });

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    sessionStorage.setItem("inwardActiveTab", tabId);
    setLogsPage(1);
    setPosPage(1);
    setStockPage(1);
  };

  useEffect(() => {
    if (warehouseMode !== 'sub' && activeTab === 'transfers') {
      handleTabChange('local');
    }
  }, [warehouseMode, activeTab]);

  const tabs = useMemo(() => [
    { id: "local", label: "Inventory Inward" },
    { id: "supplier", label: "Order Inward" },
    ...(warehouseMode === 'sub' ? [{ id: "transfers", label: "Stock Transfers" }] : []),
    { id: "inventory", label: "Stock Updates" }
  ], [warehouseMode]);

  // Dynamic States
  const [activeSkus, setActiveSkus] = useState([]);
  const [inwardLogs, setInwardLogs] = useState([]);
  const [stockStatus, setStockStatus] = useState([]);
  const [loadingSkus, setLoadingSkus] = useState(false);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [loadingStock, setLoadingStock] = useState(false);

  // Purchase Orders (POs) State
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [loadingPOs, setLoadingPOs] = useState(false);
  const [isDelivering, setIsDelivering] = useState(false);

  // PO Status Filter
  const [poStatusFilter, setPoStatusFilter] = useState("All");

  // Proforma Invoice Modal
  const [proformaModalOpen, setProformaModalOpen] = useState(false);
  const [proformaPO, setProformaPO] = useState(null);
  const [proformaModalDefaultTab, setProformaModalDefaultTab] = useState("po");

  // Inward Details Modal
  const [inwardDetailsModalOpen, setInwardDetailsModalOpen] = useState(false);
  const [selectedInwardLog, setSelectedInwardLog] = useState(null);

  // Delivery Modal State
  const [isDeliverModalOpen, setIsDeliverModalOpen] = useState(false);
  const [selectedPOForDelivery, setSelectedPOForDelivery] = useState(null);
  const [deliveryForm, setDeliveryForm] = useState({
    invoice_no: "",
    invoice_date: new Date().toLocaleDateString('en-CA'),
    invoice_pdf: "",
    supplier_gst: ""
  });
  const [deliveryFormError, setDeliveryFormError] = useState("");
  const [uploadingPdf, setUploadingPdf] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);

  // (Pagination states moved to the top of MaterialInward)

  const showAlert = (message, title = "Notification", variant = "info", onConfirm = null) => {
    // Map variant names to alert slice types
    const typeMap = { warning: 'warning', danger: 'error', success: 'success', info: 'info', error: 'error' };
    dispatch(setAlert({ type: typeMap[variant] || 'info', message }));
    if (onConfirm) {
      onConfirm();
    }
  };

  // Compliance checks for transfer receipt
  const [complianceChecks, setComplianceChecks] = useState([]);
  const handleComplianceChange = (e) => {
    const { value, checked } = e.target;
    if (checked) {
      setComplianceChecks(prev => [...prev, value]);
    } else {
      setComplianceChecks(prev => prev.filter(c => c !== value));
    }
  };

  // Master Form State
  const [supplierInvoiceForm, setSupplierInvoiceForm] = useState({
    supplierName: '',
    invoiceNo: '',
    invoiceDate: '',
    sku_id: '',
    qty: 100,
    invoice_price: '',
    allocationRack: 'Aisle A - Section 1',
    qcStatus: 'Passed',
    damageNotes: '',
    serials: ''
  });

  // Sub Form State
  const [pendingTransfers, setPendingTransfers] = useState(initialPendingTransfers);
  const [activeTransferToReceive, setActiveTransferToReceive] = useState(null);


  // Generated GRN simulator
  const [latestGRN, setLatestGRN] = useState(null);

  const [selectedStockItem, setSelectedStockItem] = useState(null);
  const [infoModalOpen, setInfoModalOpen] = useState(false);
  const [activeInfoTab, setActiveInfoTab] = useState("bookings");

  const [poQty, setPoQty] = useState(1);
  const [submittingPoRequest, setSubmittingPoRequest] = useState(false);
  const [poRequestSuccess, setPoRequestSuccess] = useState("");
  const [skuPoRequests, setSkuPoRequests] = useState([]);
  const [loadingSkuPoRequests, setLoadingSkuPoRequests] = useState(false);

  const [searchParams, setSearchParams] = useSearchParams();

  const fetchSkuPoRequests = async (skuId) => {
    setLoadingSkuPoRequests(true);
    try {
      const res = await getPoRequests(skuId);
      if (res && res.status === "success") {
        setSkuPoRequests(res.data || []);
      }
    } catch (err) {
      console.error("Failed to fetch SKU PO requests:", err);
    } finally {
      setLoadingSkuPoRequests(false);
    }
  };

  const handleShowSkuInfo = (st) => {
    setSelectedStockItem(st);
    setActiveInfoTab("bookings");
    setPoQty(st.pre_booked_qty > 0 ? st.pre_booked_qty : 1);
    setPoRequestSuccess("");
    setSkuPoRequests([]);
    setInfoModalOpen(true);
    fetchSkuPoRequests(st.sku_id?._id || st.sku_id);
  };

  const handleRaisePoDirect = (st) => {
    setSelectedStockItem(st);
    setActiveInfoTab("raise_po");
    setPoQty(st.pre_booked_qty > 0 ? st.pre_booked_qty : 1);
    setPoRequestSuccess("");
    setSkuPoRequests([]);
    setInfoModalOpen(true);
    fetchSkuPoRequests(st.sku_id?._id || st.sku_id);
  };

  const handlePostPoRequest = async (e) => {
    e.preventDefault();
    if (poQty <= 0) return;
    setSubmittingPoRequest(true);
    setPoRequestSuccess("");
    try {
      const sku = selectedStockItem.sku_id || {};
      const skuCode = selectedStockItem.sku_code || sku.sku_code || "N/A";
      const payload = [{
        sku_id: sku._id || selectedStockItem.sku_id,
        sku_code: skuCode,
        qty: Number(poQty)
      }];
      const res = await createPoRequest(payload);
      if (res && res.status === "success") {
        setPoRequestSuccess("Procurement Request submitted successfully!");
        setPoQty(1);
        await fetchSkuPoRequests(sku._id || selectedStockItem.sku_id);
      }
    } catch (err) {
      console.error("Error submitting PO request:", err);
    } finally {
      setSubmittingPoRequest(false);
    }
  };

  useEffect(() => {
    const focusSkuId = searchParams.get("focus_sku");
    if (focusSkuId && stockStatus && stockStatus.length > 0) {
      const found = stockStatus.find(st => {
        const itemSkuId = st.sku_id?._id?.toString() || st.sku_id?.toString() || '';
        return itemSkuId === focusSkuId;
      });
      if (found) {
        handleRaisePoDirect(found);
        // Clear param to avoid re-opening
        const newParams = new URLSearchParams(searchParams);
        newParams.delete("focus_sku");
        setSearchParams(newParams);
      }
    }
  }, [searchParams, stockStatus]);

  // Search filter
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch functions
  const fetchLogs = async () => {
    setLoadingLogs(true);
    try {
      const res = await getInwardLogs("WH_MAT_INWARD");
      if (res && res.status === "success") {
        setInwardLogs(res.data || []);
      }
    } catch (err) {
      console.error("Failed to fetch inward logs:", err);
    } finally {
      setLoadingLogs(false);
    }
  };

  const fetchStock = async () => {
    setLoadingStock(true);
    try {
      const res = await getInwardStockStatus("WH_MAT_INWARD");
      if (res && res.status === "success") {
        setStockStatus(res.data || []);
      }
    } catch (err) {
      console.error("Failed to fetch stock status:", err);
    } finally {
      setLoadingStock(false);
    }
  };

  useEffect(() => {
    const fetchSkus = async () => {
      setLoadingSkus(true);
      try {
        const res = await getInwardActiveSkus("WH_MAT_INWARD");
        if (res && res.status === "success") {
          setActiveSkus(res.data || []);
        }
      } catch (err) {
        console.error("Failed to fetch active SKUs:", err);
      } finally {
        setLoadingSkus(false);
      }
    };

    fetchSkus();
    fetchLogs();
    fetchStock();
  }, [warehouseMode]);

  const fetchPOs = async () => {
    setLoadingPOs(true);
    try {
      const res = await getWarehousePurchaseOrders("WH_MAT_INWARD");
      if (res && res.status === "success") {
        setPurchaseOrders(res.data || []);
      }
    } catch (err) {
      console.error("Failed to fetch POs in warehouse:", err);
    } finally {
      setLoadingPOs(false);
    }
  };

  const handleOpenDeliveryModal = (po) => {
    setSelectedPOForDelivery(po);
    setDeliveryForm({
      invoice_no: "",
      invoice_date: new Date().toLocaleDateString('en-CA'),
      invoice_pdf: "",
      supplier_gst: ""
    });
    setSelectedFile(null);
    setUploadingPdf(false);
    setDeliveryFormError("");
    setIsDeliverModalOpen(true);
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setDeliveryFormError("");
  };

  const handleMarkDelivered = async (e) => {
    if (e) e.preventDefault();
    if (!deliveryForm.invoice_no.trim() || !deliveryForm.invoice_date) {
      setDeliveryFormError("Tax Invoice Number and Date are required.");
      return;
    }

    if (!deliveryForm.supplier_gst.trim()) {
      setDeliveryFormError("Supplier GSTIN is required for verification.");
      return;
    }

    if (!selectedFile && !deliveryForm.invoice_pdf) {
      setDeliveryFormError("Please upload the Supplier Tax Invoice PDF or Image.");
      return;
    }

    setDeliveryFormError("");
    setIsDelivering(true);
    setUploadingPdf(true);

    let finalInvoicePdf = deliveryForm.invoice_pdf;

    if (selectedFile) {
      try {
        const res = await uploadTaxInvoice(selectedFile, "WH_MAT_INWARD");
        if (res && res.status === "success" && res.url) {
          finalInvoicePdf = res.url;
        } else {
          setDeliveryFormError(res.message || "Failed to upload file to cloud storage.");
          setIsDelivering(false);
          setUploadingPdf(false);
          return;
        }
      } catch (err) {
        console.error("Invoice upload error:", err);
        setDeliveryFormError(err.response?.data?.message || err.message || "Error uploading file.");
        setIsDelivering(false);
        setUploadingPdf(false);
        return;
      } finally {
        setUploadingPdf(false);
      }
    }

    try {
      const res = await markPurchaseOrderDelivered(
        selectedPOForDelivery.id || selectedPOForDelivery._id,
        {
          invoice_no: deliveryForm.invoice_no.trim(),
          invoice_date: deliveryForm.invoice_date,
          invoice_pdf: finalInvoicePdf.trim(),
          supplier_gst: deliveryForm.supplier_gst.trim().toUpperCase()
        },
        "WH_MAT_INWARD"
      );

      if (res && res.status === "success") {
        showAlert("Order delivery completed successfully! Stock updated.", "Success", "success");
        setIsDeliverModalOpen(false);
        fetchPOs();
        fetchStock();
        fetchLogs();
      } else {
        setDeliveryFormError(res.message || "Failed to mark delivery complete.");
      }
    } catch (err) {
      console.error(err);
      setDeliveryFormError(err.response?.data?.message || err.message || "Error completing delivery.");
    } finally {
      setIsDelivering(false);
    }
  };

  useEffect(() => {
    if (activeTab === "local") {
      fetchPOs();
    }
  }, [activeTab]);

  // ----------------------------------------------------
  // HANDLERS
  // ----------------------------------------------------
  // Dynamic Invoice Items lists
  const [supplierInvoiceItems, setSupplierInvoiceItems] = useState([]);


  const handleAddSupplierItem = (e) => {
    e?.preventDefault();
    const selectedSku = activeSkus.find(s => s.id === supplierInvoiceForm.sku_id);
    if (!selectedSku) {
      showAlert("Please select a valid SKU", "Validation Error", "warning");
      return;
    }
    if (!supplierInvoiceForm.invoice_price || Number(supplierInvoiceForm.invoice_price) <= 0) {
      showAlert("Please enter a valid invoice price", "Validation Error", "warning");
      return;
    }
    const isSolar = selectedSku.category === "Solar Panel" || selectedSku.category?.toLowerCase()?.includes("solar");
    const enteredPrice = Number(supplierInvoiceForm.invoice_price);
    const maxAllowedPrice = isSolar ? selectedSku.benchmark_price_per_watt : selectedSku.benchmark_price;
    if (enteredPrice > maxAllowedPrice) {
      showAlert(`Invoice price (${isSolar ? `₹${enteredPrice}/W` : `₹${enteredPrice}`}) cannot exceed benchmark limit (${isSolar ? `₹${maxAllowedPrice}/W` : `₹${maxAllowedPrice}`}).`, "Price Limit Exceeded", "danger");
      return;
    }
    if (Number(supplierInvoiceForm.qty) <= 0) {
      showAlert("Quantity must be greater than 0", "Validation Error", "warning");
      return;
    }

    const serialsArray = supplierInvoiceForm.serials.split('\n').filter(s => s.trim());
    if (serialsArray.length > 0 && serialsArray.length !== Number(supplierInvoiceForm.qty)) {
      showAlert(`Quantity is ${supplierInvoiceForm.qty} but you entered ${serialsArray.length} serial numbers. They must match if serials are provided.`, "Serial Count Mismatch", "warning");
      return;
    }

    const newItem = {
      sku_id: supplierInvoiceForm.sku_id,
      sku_code: selectedSku.sku_code,
      product_name: selectedSku.product_name,
      brand_name: selectedSku.brand_name,
      category: selectedSku.category,
      qty: Number(supplierInvoiceForm.qty),
      invoice_price: enteredPrice, // send the entered price (per watt for solar, total unit price for others)
      qc_status: supplierInvoiceForm.qcStatus,
      damage_notes: supplierInvoiceForm.damageNotes,
      serials: serialsArray,
      allocation_rack: supplierInvoiceForm.allocationRack
    };

    setSupplierInvoiceItems([...supplierInvoiceItems, newItem]);

    // Clear product fields only
    setSupplierInvoiceForm(prev => ({
      ...prev,
      sku_id: '',
      qty: 100,
      invoice_price: '',
      qcStatus: 'Passed',
      damageNotes: '',
      serials: ''
    }));
  };

  const handleDeleteSupplierItem = (index) => {
    setSupplierInvoiceItems(supplierInvoiceItems.filter((_, idx) => idx !== index));
  };



  const handleSupplierInvoiceSubmit = async (e) => {
    e?.preventDefault();
    if (!supplierInvoiceForm.supplierName || !supplierInvoiceForm.supplierName.trim()) {
      showAlert("Please enter the Supplier Name.", "Validation Error", "warning");
      return;
    }
    if (!supplierInvoiceForm.invoiceNo || !supplierInvoiceForm.invoiceNo.trim()) {
      showAlert("Please enter the Invoice Number.", "Validation Error", "warning");
      return;
    }
    if (!supplierInvoiceForm.invoiceDate) {
      showAlert("Please select the Invoice Date.", "Validation Error", "warning");
      return;
    }
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    if (new Date(supplierInvoiceForm.invoiceDate) > today) {
      showAlert("Invoice date cannot be in the future.", "Validation Error", "warning");
      return;
    }
    if (supplierInvoiceItems.length === 0) {
      showAlert("Please add at least one product to the invoice.", "Validation Error", "warning");
      return;
    }

    try {
      const payload = {
        inward_type: "supplier",
        supplier_name: supplierInvoiceForm.supplierName,
        invoice_no: supplierInvoiceForm.invoiceNo,
        invoice_date: supplierInvoiceForm.invoiceDate,
        items: supplierInvoiceItems.map(item => ({
          sku_id: item.sku_id,
          qty: item.qty,
          invoice_price: item.invoice_price,
          qc_status: item.qc_status,
          damage_notes: item.damage_notes,
          serials: item.serials,
          allocation_rack: item.allocation_rack
        }))
      };

      const res = await saveInward(payload, "WH_MAT_INWARD");
      if (res && res.status === "success") {
        setSupplierInvoiceItems([]);
        setSupplierInvoiceForm({
          supplierName: '',
          invoiceNo: '',
          invoiceDate: '',
          sku_id: '',
          qty: 100,
          invoice_price: '',
          allocationRack: 'Aisle A - Section 1',
          qcStatus: 'Passed',
          damageNotes: '',
          serials: ''
        });
        fetchLogs();
        fetchStock();
        showAlert("Supplier stock inward invoice registered successfully!", "Success", "success", () => {
          handleTabChange('inventory');
        });
      } else {
        showAlert(res.message || "Failed to save inward.", "Save Failed", "danger");
      }
    } catch (err) {
      console.error(err);
      const msg = err?.response?.data?.message || err?.message || "Error saving inward entry.";
      showAlert(msg, "Error", "danger");
    }
  };



  const confirmTransferReceipt = (transfer) => {
    setPendingTransfers(pendingTransfers.map(t =>
      t.transferId === transfer.transferId ? { ...t, status: "Received" } : t
    ));

    setActiveTransferToReceive(null);
    showAlert("Transfer stock received successfully!", "Success", "success", () => {
      handleTabChange('inventory');
    });
  };

  // ----------------------------------------------------
  // MEMOIZED FILTERS
  // ----------------------------------------------------
  const filteredMasterLogs = useMemo(() => {
    return inwardLogs
      .filter(log => log.inward_type === 'supplier')
      .filter(log =>
        log.supplier_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.grn_no.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.invoice_no.toLowerCase().includes(searchQuery.toLowerCase())
      );
  }, [inwardLogs, searchQuery]);

  const filteredSubLogs = useMemo(() => {
    return inwardLogs
      .filter(log => log.inward_type === 'local' || log.inward_type === 'transfer')
      .filter(log =>
        log.supplier_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.grn_no.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.invoice_no.toLowerCase().includes(searchQuery.toLowerCase())
      );
  }, [inwardLogs, searchQuery]);

  const currentLogs = useMemo(() => {
    return inwardLogs.filter(log =>
      warehouseMode === 'sub'
        ? (log.inward_type === 'local' || log.inward_type === 'transfer')
        : log.inward_type === 'supplier'
    );
  }, [inwardLogs, warehouseMode]);

  const stockSummary = useMemo(() => {
    let solarPanelsQty = 0;
    let solarPanelsKw = 0;
    let invertersQty = 0;
    let invertersBrands = new Set();
    let cablesQty = 0;
    let cablesBrands = new Set();
    let structuresQty = 0;

    stockStatus.forEach(st => {
      const sku = st.sku_id || {};
      const prod = sku.product_id || {};
      const catName = prod.template_id?.name || "";
      const brandName = prod.brand_id?.brand_name || "";

      if (catName === "Solar Panel" || catName.toLowerCase().includes("solar")) {
        solarPanelsQty += st.qty || 0;
        solarPanelsKw += st.total_kw || 0;
      } else if (catName === "Inverter" || catName.toLowerCase().includes("inverter")) {
        invertersQty += st.qty || 0;
        if (brandName) invertersBrands.add(brandName);
      } else if (catName.toLowerCase().includes("cable")) {
        cablesQty += st.qty || 0;
        if (brandName) cablesBrands.add(brandName);
      } else {
        structuresQty += st.qty || 0;
      }
    });

    return [
      {
        title: "Solar Panels",
        count: `${solarPanelsQty} Units`,
        sub: `${solarPanelsKw.toFixed(2)} kW Total`,
        bg: "bg-blue-500/5"
      },
      {
        title: "Inverters",
        count: `${invertersQty} Units`,
        sub: invertersBrands.size > 0 ? Array.from(invertersBrands).join(" & ") : "Solis & Growatt",
        bg: "bg-purple-500/5"
      },
      {
        title: "ACDC Cables",
        count: `${cablesQty} Units`,
        sub: cablesBrands.size > 0 ? Array.from(cablesBrands).join(" & ") : "Polycab",
        bg: "bg-emerald-500/5"
      },
      {
        title: "Other / Structure Kits",
        count: `${structuresQty} Units`,
        sub: "Structure & Accessories",
        bg: "bg-amber-500/5"
      }
    ];
  }, [stockStatus]);

  const paginatedSubLogs = useMemo(() => {
    const start = (logsPage - 1) * logsPageSize;
    return filteredSubLogs.slice(start, start + logsPageSize);
  }, [filteredSubLogs, logsPage]);

  const paginatedMasterLogs = useMemo(() => {
    const start = (logsPage - 1) * logsPageSize;
    return filteredMasterLogs.slice(start, start + logsPageSize);
  }, [filteredMasterLogs, logsPage]);

  const renderInventoryRow = (st) => {
    const sku = st.sku_id || {};
    const prod = sku.product_id || {};
    const catName = prod.template_id?.name || "N/A";
    const brandName = prod.brand_id?.brand_name || "N/A";
    return (
      <>
        <td className="px-6 py-4 text-sm font-bold text-primary whitespace-nowrap">{st.sku_code}</td>
        <td className="px-6 py-4 text-sm font-semibold text-text-primary min-w-[200px]">{prod.name || "N/A"}</td>
        <td className="px-6 py-4 text-sm text-text-secondary whitespace-nowrap">{catName}</td>
        <td className="px-6 py-4 text-sm text-text-secondary whitespace-nowrap">{brandName}</td>
        <td className="px-6 py-4 text-sm text-right font-black text-text-primary whitespace-nowrap">{st.qty} pcs</td>
        <td className="px-6 py-4 text-sm text-right font-bold text-success whitespace-nowrap">{st.booked_qty || 0} pcs</td>
        <td className="px-6 py-4 text-sm text-right font-bold text-warning whitespace-nowrap">{st.reserved_qty || 0} pcs</td>
        <td className="px-6 py-4 text-sm text-right font-bold text-danger whitespace-nowrap">{st.pre_booked_qty || 0} pcs</td>
        <td className="px-6 py-4 text-sm text-right text-text-secondary whitespace-nowrap">
          {st.total_kw > 0 ? `${st.total_kw.toFixed(2)} kW` : "-"}
        </td>
        <td className="px-6 py-4 text-sm text-right text-text-secondary whitespace-nowrap">₹{st.average_invoice_price?.toLocaleString() || 0}</td>
        <td className="px-6 py-4 text-sm text-right text-text-secondary whitespace-nowrap">₹{st.average_benchmark_price?.toLocaleString() || 0}</td>
        <td className="px-6 py-4 text-sm text-center">
          <div className="flex items-center justify-center gap-1.5">
            <button 
              onClick={() => handleShowSkuInfo(st)}
              className="p-1 rounded bg-info/10 text-info hover:bg-info/20 border border-info/20 inline-flex items-center justify-center cursor-pointer"
              title="View allocation details"
            >
              <FaInfoCircle size={12} />
            </button>
            <button 
              onClick={() => handleRaisePoDirect(st)}
              className="p-1 rounded bg-primary/10 text-primary hover:bg-primary/20 border border-primary/20 inline-flex items-center justify-center cursor-pointer"
              title="Direct PO Request"
            >
              <FaFileInvoice size={12} />
            </button>
          </div>
        </td>
      </>
    );
  };

  const renderSubLogRow = (log) => (
    <>
      <td className="px-6 py-4 text-sm font-bold text-primary">{log.grn_no}</td>
      <td className="px-6 py-4 text-sm font-semibold text-text-primary">{log.supplier_name}</td>
      <td className="px-6 py-4 text-sm text-text-secondary">{log.invoice_no}</td>
      <td className="px-6 py-4 text-sm text-text-secondary font-medium">
        {log.invoice_date ? new Date(log.invoice_date).toLocaleDateString() : ""}
      </td>
      <td className="px-6 py-4 text-sm">
        <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] border ${log.status === 'approved' ? 'bg-success/10 text-success border-success/20' :
            log.status === 'rejected' ? 'bg-danger/10 text-danger border-danger/20' :
              'bg-warning/10 text-warning border-warning/20'
          }`}>
          {log.status}
        </span>
      </td>
    </>
  );

  const renderMasterLogRow = (log) => {
    const totalQty = (log.items || []).reduce((acc, it) => acc + (it.qty || 0), 0);
    const skuCount = (log.items || []).length;

    return (
      <>
        <td className="px-6 py-4 text-sm font-bold text-primary">
          {log.grn_no}
          <div className="text-[10px] text-text-secondary font-medium mt-0.5">
            {log.invoice_date ? new Date(log.invoice_date).toLocaleDateString() : ""}
          </div>
        </td>
        <td className="px-6 py-4 text-sm">
          <div className="font-semibold text-text-primary">{log.supplier_name}</div>
          <div className="text-[10px] text-text-secondary">{log.inward_type}</div>
        </td>
        <td className="px-6 py-4 text-sm font-semibold text-text-primary">{log.invoice_no}</td>
        <td className="px-6 py-4 text-sm">
          <div className="font-bold text-text-primary">
            {skuCount} SKU{skuCount !== 1 ? 's' : ''}
          </div>
          <button
            onClick={() => { setSelectedInwardLog(log); setInwardDetailsModalOpen(true); }}
            className="mt-1.5 inline-flex items-center gap-1 text-[10px] text-primary font-black hover:underline"
          >
            <FaEye size={10} /> View Items
          </button>
        </td>

        <td className="px-6 py-4 text-sm text-center">
          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${log.status === 'approved' ? 'bg-success/10 text-success border-success/20' :
              log.status === 'rejected' ? 'bg-danger/10 text-danger border-danger/20' :
                'bg-warning/10 text-warning border-warning/20'
            }`}>
            {log.status}
          </span>
        </td>
      </>
    );
  };

  // Filtered POs based on status
  const filteredPOs = useMemo(() => {
    if (poStatusFilter === "All") return purchaseOrders;
    if (poStatusFilter === "Overdue") {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return purchaseOrders.filter(po => {
        if (po.status === "delivered") return false;
        const timelineDateObj = new Date(po.timeline);
        timelineDateObj.setHours(0, 0, 0, 0);
        return timelineDateObj < today;
      });
    }
    if (poStatusFilter === "Invoiced") {
      return purchaseOrders.filter(po => po.status === "invoiced" || po.status === "paid");
    }
    return purchaseOrders.filter(po => po.status === poStatusFilter.toLowerCase());
  }, [purchaseOrders, poStatusFilter]);

  const paginatedPOs = useMemo(() => {
    const start = (posPage - 1) * posPageSize;
    return filteredPOs.slice(start, start + posPageSize);
  }, [filteredPOs, posPage]);

  const paginatedStock = useMemo(() => {
    const start = (stockPage - 1) * stockPageSize;
    return stockStatus.slice(start, start + stockPageSize);
  }, [stockStatus, stockPage]);

  const renderSkuInfoModal = () => {
    if (!selectedStockItem) return null;

    const sku = selectedStockItem.sku_id || {};
    const prod = sku.product_id || {};
    const skuCode = selectedStockItem.sku_code || sku.sku_code || "N/A";
    const productName = prod.name || "N/A";
    const catName = prod.template_id?.name || "N/A";
    const brandName = prod.brand_id?.brand_name || "N/A";

    const bookings = selectedStockItem.bookings_breakdown || [];
    const reservations = selectedStockItem.reservations_breakdown || [];
    const attrs = selectedStockItem.attributes || [];

    return (
      <Dialog
        isOpen={infoModalOpen}
        onClose={() => setInfoModalOpen(false)}
        title="Stock Allocation & Reservations Info"
        size="lg"
      >
        <div className="space-y-6">
          {/* Header Card */}
          <div className="p-4 rounded-xl bg-slate-50 border border-border space-y-2">
            <h3 className="text-base font-black text-text-primary">{productName}</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-semibold text-text-secondary">
              <div>
                <span className="text-text-muted block">SKU Code</span>
                <span className="font-bold text-primary">{skuCode}</span>
              </div>
              <div>
                <span className="text-text-muted block">Category</span>
                <span>{catName}</span>
              </div>
              <div>
                <span className="text-text-muted block">Brand</span>
                <span>{brandName}</span>
              </div>
              <div>
                <span className="text-text-muted block">Live Physical Stock</span>
                <span className="font-bold text-text-primary">{selectedStockItem.qty || 0} pcs</span>
              </div>
            </div>
          </div>

          {/* Technical Specifications (Attributes) */}
          {attrs.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-black uppercase tracking-wider text-text-muted">Technical Specifications</h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {attrs.map((attr, idx) => (
                  <div key={idx} className="p-2.5 rounded-lg border border-border bg-slate-50/50">
                    <span className="text-[10px] text-text-muted font-bold block capitalize">{attr.name}</span>
                    <span className="text-xs font-semibold text-text-primary mt-0.5">{attr.value} {attr.unit}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quick Metrics Dashboard */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="p-3 rounded-xl border border-border bg-slate-50/50 flex flex-col justify-between">
              <span className="text-[10px] uppercase font-bold tracking-wider text-text-muted block">Physical Stock</span>
              <span className="text-lg font-black text-text-primary mt-1">{selectedStockItem.qty || 0} pcs</span>
            </div>
            <div className="p-3 rounded-xl border border-success/20 bg-success/5 flex flex-col justify-between">
              <span className="text-[10px] uppercase font-bold tracking-wider text-success block">Booked Stock</span>
              <span className="text-lg font-black text-success mt-1">{selectedStockItem.booked_qty || 0} pcs</span>
            </div>
            <div className="p-3 rounded-xl border border-warning/20 bg-warning/5 flex flex-col justify-between">
              <span className="text-[10px] uppercase font-bold tracking-wider text-warning block">Reserved (Cart)</span>
              <span className="text-lg font-black text-warning mt-1">{selectedStockItem.reserved_qty || 0} pcs</span>
            </div>
            <div className="p-3 rounded-xl border border-danger/20 bg-danger/5 flex flex-col justify-between">
              <span className="text-[10px] uppercase font-bold tracking-wider text-danger block">Pre-Booked (Shortage)</span>
              <span className="text-lg font-black text-danger mt-1">{selectedStockItem.pre_booked_qty || 0} pcs</span>
            </div>
          </div>

          {/* Tabs */}
          <div className="border-b border-border flex gap-4 text-xs font-bold uppercase tracking-wider overflow-x-auto pb-1">
            <button
              onClick={() => setActiveInfoTab("bookings")}
              className={`pb-2 transition-all cursor-pointer border-b-2 whitespace-nowrap ${
                activeInfoTab === "bookings" ? "border-primary text-primary" : "border-transparent text-text-muted hover:text-text-secondary"
              }`}
            >
              Bookings ({bookings.length})
            </button>
            <button
              onClick={() => setActiveInfoTab("reservations")}
              className={`pb-2 transition-all cursor-pointer border-b-2 whitespace-nowrap ${
                activeInfoTab === "reservations" ? "border-primary text-primary" : "border-transparent text-text-muted hover:text-text-secondary"
              }`}
            >
              Active Cart Holds ({reservations.length})
            </button>
            <button
              onClick={() => setActiveInfoTab("raise_po")}
              className={`pb-2 transition-all cursor-pointer border-b-2 whitespace-nowrap ${
                activeInfoTab === "raise_po" ? "border-primary text-primary" : "border-transparent text-text-muted hover:text-text-secondary"
              }`}
            >
              Raise PO Request
            </button>
            <button
              onClick={() => setActiveInfoTab("po_history")}
              className={`pb-2 transition-all cursor-pointer border-b-2 whitespace-nowrap ${
                activeInfoTab === "po_history" ? "border-primary text-primary" : "border-transparent text-text-muted hover:text-text-secondary"
              }`}
            >
              Procurement History ({skuPoRequests.length})
            </button>
          </div>

          {/* Content Area */}
          <div className="max-h-[350px] overflow-y-auto">
            {activeInfoTab === "bookings" ? (
              bookings.length === 0 ? (
                <div className="p-8 text-center text-xs text-text-muted italic bg-slate-50 rounded-xl">
                  No confirmed purchase orders are currently booking this SKU.
                </div>
              ) : (
                <div className="overflow-x-auto w-full border border-border rounded-xl">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-border bg-slate-50 text-text-muted font-bold">
                        <th className="p-2.5">Order ID</th>
                        <th className="p-2.5">Customer Name</th>
                        <th className="p-2.5 text-right">Allocated Qty</th>
                        <th className="p-2.5 text-right">Pending Qty</th>
                        <th className="p-2.5 text-right">Order Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bookings.map((booking, idx) => (
                        <tr key={idx} className="border-b border-border hover:bg-slate-50/50">
                          <td className="p-2.5 font-bold text-primary">{booking.order_id}</td>
                          <td className="p-2.5 font-medium text-text-primary">{booking.customer_name}</td>
                          <td className="p-2.5 text-right text-success font-black">{booking.allocated_qty} pcs</td>
                          <td className="p-2.5 text-right text-danger font-black">{booking.pending_qty} pcs</td>
                          <td className="p-2.5 text-right text-text-muted">
                            {booking.created_at ? new Date(booking.created_at).toLocaleDateString("en-IN") : "N/A"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )
            ) : activeInfoTab === "reservations" ? (
              reservations.length === 0 ? (
                <div className="p-8 text-center text-xs text-text-muted italic bg-slate-50 rounded-xl">
                  No active customer checkouts are currently reserving this SKU.
                </div>
              ) : (
                <div className="overflow-x-auto w-full border border-border rounded-xl">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-border bg-slate-50 text-text-muted font-bold">
                        <th className="p-2.5">Customer Name</th>
                        <th className="p-2.5 text-right">Reserved Qty</th>
                        <th className="p-2.5 text-right">Expires At</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reservations.map((resv, idx) => (
                        <tr key={idx} className="border-b border-border hover:bg-slate-50/50">
                          <td className="p-2.5 font-medium text-text-primary">{resv.customer_name}</td>
                          <td className="p-2.5 text-right text-warning font-black">{resv.quantity} pcs</td>
                          <td className="p-2.5 text-right text-text-muted">
                            {resv.expiry_time ? new Date(resv.expiry_time).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) : "N/A"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )
            ) : activeInfoTab === "raise_po" ? (
              <div className="space-y-4">
                <h4 className="text-xs font-black uppercase tracking-wider text-text-muted">Submit Procurement Request</h4>
                <form onSubmit={handlePostPoRequest} className="space-y-4 max-w-sm">
                  <div>
                    <label className="block text-xs font-bold text-text-secondary mb-1">Quantity to Request</label>
                    <CustomInput
                      type="number"
                      min="1"
                      value={poQty}
                      onChange={(e) => setPoQty(Math.max(1, Number(e.target.value)))}
                      className="w-full font-black text-sm"
                      disabled={submittingPoRequest}
                    />
                  </div>
                  {poRequestSuccess && (
                    <div className="text-xs font-bold text-success bg-success/15 border border-success/30 p-2.5 rounded-lg">
                      {poRequestSuccess}
                    </div>
                  )}
                  <Button
                    type="submit"
                    variant="primary"
                    disabled={submittingPoRequest}
                    loading={submittingPoRequest}
                  >
                    Submit Request
                  </Button>
                </form>
              </div>
            ) : (
              <div className="space-y-4">
                <h4 className="text-xs font-black uppercase tracking-wider text-text-muted">Historical Procurement Requests</h4>
                {loadingSkuPoRequests ? (
                  <div className="p-8 text-center text-xs text-text-muted flex items-center justify-center gap-2">
                    <FaSpinner className="animate-spin text-sm" /> Loading procurement history...
                  </div>
                ) : skuPoRequests.length === 0 ? (
                  <div className="p-8 text-center text-xs text-text-muted italic bg-slate-50 rounded-xl">
                    No prior procurement requests have been raised for this product.
                  </div>
                ) : (
                  <div className="overflow-x-auto w-full border border-border rounded-xl">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-border bg-slate-50 text-text-muted font-bold">
                          <th className="p-2.5">Request No</th>
                          <th className="p-2.5 text-right">Requested Qty</th>
                          <th className="p-2.5">Requested By</th>
                          <th className="p-2.5 text-center">Status</th>
                          <th className="p-2.5 text-right">Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {skuPoRequests.map((req, idx) => {
                          const item = (req.items || []).find(it => {
                            const reqSkuId = it.sku_id?.toString() || '';
                            const selectedSkuId = selectedStockItem.sku_id?._id?.toString() || selectedStockItem.sku_id?.toString() || '';
                            return reqSkuId === selectedSkuId;
                          });
                          const qty = item ? item.qty : 0;
                          return (
                            <tr key={idx} className="border-b border-border hover:bg-slate-50/50">
                              <td className="p-2.5 font-bold text-primary">{req.request_number}</td>
                              <td className="p-2.5 text-right font-black text-text-primary">{qty} pcs</td>
                              <td className="p-2.5 font-semibold text-text-secondary">{req.created_by?.name || req.created_by || 'Manager'}</td>
                              <td className="p-2.5 text-center">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
                                  req.status === 'approved' ? 'bg-success/15 text-success' :
                                  req.status === 'rejected' ? 'bg-danger/15 text-danger' : 'bg-warning/15 text-warning'
                                }`}>
                                  {req.status}
                                </span>
                              </td>
                              <td className="p-2.5 text-right text-text-muted">
                                {req.created_at ? new Date(req.created_at).toLocaleDateString("en-IN") : new Date(req.createdAt).toLocaleDateString("en-IN")}
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
          </div>
        </div>
      </Dialog>
    );
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title={warehouseMode === 'sub' ? 'Sub-Warehouse Inward Control' : 'Master-Warehouse Inward Control'}
        subtitle={
          warehouseMode === 'sub'
            ? 'Receive purchase orders, stock transfers from Master Hub, generate GRN and increment local inventory.'
            : 'Bulk suppliers stock entries, inventory verification check and allocation of racks.'
        }
        icon={HiCube}
      />

      {/* Premium Tab Navigation */}
      <div className="flex bg-surface border border-border/60 p-1.5 rounded-2xl gap-1 max-w-xl shadow-inner relative overflow-hidden backdrop-blur-md">
        {tabs.map((tab) => {
          const isSelected = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`flex-1 relative py-2.5 px-4 rounded-xl text-xs font-bold transition-all duration-300 flex items-center justify-center gap-2 overflow-hidden
                ${isSelected
                  ? "gradient-primary text-white shadow-md shadow-primary/20 scale-[1.02]"
                  : "text-text-secondary hover:bg-surface-hover hover:text-primary"
                }`}
            >
              {tab.id === 'local' && <HiOutlineClipboardList className="text-base" />}
              {tab.id === 'supplier' && <FaBoxes className="text-base" />}
              {tab.id === 'transfers' && <FaExchangeAlt className="text-base" />}
              {tab.id === 'inventory' && <HiCube className="text-base" />}
              {tab.label}
              {isSelected && (
                <motion.div
                  layoutId="activeTabGlow"
                  className="absolute inset-0 bg-white/5 pointer-events-none"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}
            </button>
          );
        })}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -15 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="w-full"
        >
          {activeTab === "local" && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300 w-full max-w-full overflow-hidden">
              <div className="card p-6 space-y-4 w-full max-w-full overflow-hidden">
                <div className="border-b border-border pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <h3 className="text-base font-bold text-text-primary flex items-center gap-2">
                    <FaBoxes className="text-primary" />
                    Supplier Purchase Orders (Inventory Inward)
                  </h3>
                  {/* Status Filter */}
                  <div className="flex flex-wrap gap-1.5">
                    {["All", "Pending", "Accepted", "Invoiced", "Delivered", "Overdue"].map(st => (
                      <button
                        key={st}
                        onClick={() => {
                          setPoStatusFilter(st);
                          setPosPage(1);
                        }}
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border transition-all ${
                          poStatusFilter === st
                            ? st === "Overdue" ? "bg-danger text-white border-danger" : "bg-primary text-white border-primary"
                            : "bg-surface border-border text-text-secondary hover:bg-surface-hover"
                        }`}
                      >
                        {st}
                      </button>
                    ))}
                  </div>
                </div>

                <CustomTable
                  containerClassName="border border-border rounded-xl shadow-xs bg-surface p-0 overflow-hidden w-full"
                  headers={[
                    { key: "po_number", label: "PO Number" },
                    { key: "supplier", label: "Supplier" },
                    { key: "total_value", label: "Total Order Value" },
                    { key: "timeline", label: "Delivery Due Date" },
                    { key: "status", label: "Status" },
                    { key: "proforma", label: "PO & PI Documents" },
                    { key: "tax_invoice", label: "Supplier Tax Invoice" },
                    { key: "action", label: "Action", align: "center" }
                  ]}
                  data={paginatedPOs}
                  loading={loadingPOs}
                  renderRow={(po) => {
                    const timelineDateObj = new Date(po.timeline);
                    timelineDateObj.setHours(0, 0, 0, 0);
                    const todayObj = new Date();
                    todayObj.setHours(0, 0, 0, 0);
                    const diffTime = todayObj - timelineDateObj;
                    const overdueDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
                    const isOverdue = po.status !== "delivered" && overdueDays > 0;
                    const totalValue = (po.items || []).reduce((acc, it) => acc + (it.qty * (it.order_price || 0)), 0);
                    return (
                      <>
                        <td className="p-3">
                          <div className="font-extrabold text-primary text-xs uppercase">{po.po_number}</div>
                          <div className="text-[9px] text-text-secondary mt-0.5">
                            Ordered: {new Date(po.createdAt || po.created_at).toLocaleDateString()}
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="font-bold text-text-primary text-xs">{po.supplier_id?.company_name || "N/A"}</div>
                          <div className="text-[9px] text-text-secondary">Brand: {po.supplier_id?.brand_name || "N/A"}</div>
                        </td>
                        <td className="p-3">
                          <div className="font-black text-text-primary text-sm">₹{totalValue.toLocaleString()}</div>
                          <div className="text-[9px] text-text-muted mt-0.5">
                            {(po.items || []).length} SKU{(po.items || []).length !== 1 ? "s" : ""} ({(po.items || []).reduce((acc, it) => acc + (it.qty || 0), 0).toLocaleString()} Pcs)
                          </div>
                          <button
                            onClick={() => { setProformaPO(po); setProformaModalOpen(true); }}
                            className="mt-1.5 inline-flex items-center gap-1 text-[10px] text-primary font-black hover:underline"
                          >
                            <FaEye size={10} /> View Items
                          </button>
                        </td>
                        <td className="p-3">
                          <span className={`text-xs font-semibold ${isOverdue ? 'text-danger font-extrabold' : 'text-text-primary'}`}>
                            {new Date(po.timeline).toLocaleDateString()}
                          </span>
                          {isOverdue && (
                            <span className="block text-[9px] font-black text-danger uppercase tracking-wider animate-pulse mt-0.5">
                              ⚠️ Overdue ({overdueDays} {overdueDays === 1 ? 'day' : 'days'})
                            </span>
                          )}
                        </td>
                        <td className="p-3">
                          <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase border ${
                            po.status === 'delivered' ? 'bg-success/10 text-success border-success/20' :
                            po.status === 'paid' ? 'bg-primary/10 text-primary border-primary/20 animate-pulse' :
                            po.status === 'invoiced' ? 'bg-info/10 text-info border-info/20' :
                            po.status === 'accepted' ? 'bg-info/10 text-info border-info/20' :
                            'bg-warning/10 text-warning border-warning/20'
                          }`}>
                            {po.status === 'pending' ? 'Awaiting Invoice' :
                             po.status === 'paid' ? 'Awaiting Delivery' :
                             po.status === 'invoiced' ? 'Awaiting Payment' :
                             po.status === 'accepted' ? 'Accepted' :
                             po.status}
                          </span>
                        </td>
                        {/* PO & PI Documents */}
                        <td className="p-3">
                          <div className="flex flex-col gap-1.5 max-w-[120px]">
                            {po.purchase_order_pdf ? (
                              <button
                                onClick={() => { setProformaPO(po); setProformaModalDefaultTab("po"); setProformaModalOpen(true); }}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20 text-[9px] font-bold uppercase tracking-wide hover:bg-primary/20 transition-all justify-center w-full"
                              >
                                <FaFilePdf size={9} /> PO PDF
                              </button>
                            ) : (
                              <span className="text-[9px] text-text-muted italic text-center">No PO PDF</span>
                            )}
                            {po.proforma_invoice_pdf ? (
                              <button
                                onClick={() => { setProformaPO(po); setProformaModalDefaultTab("pi"); setProformaModalOpen(true); }}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-info/10 text-info border border-info/20 text-[9px] font-bold uppercase tracking-wide hover:bg-info/20 transition-all justify-center w-full"
                              >
                                <FaFilePdf size={9} /> PI PDF
                              </button>
                            ) : (
                              <span className="text-[9px] text-text-muted italic text-center">No PI PDF</span>
                            )}
                          </div>
                        </td>
                        {/* Supplier Tax Invoice */}
                        <td className="p-3">
                          {po.invoice_no ? (
                            <div className="text-xs space-y-1">
                              <div className="font-bold text-text-primary text-[10px]">#{po.invoice_no}</div>
                              {po.supplier_gst && (
                                <div className="text-[9px] font-mono text-text-secondary bg-surface-hover border border-border px-1.5 py-0.5 rounded inline-block">GST: {po.supplier_gst}</div>
                              )}
                              <div className="text-[10px] text-text-muted">{po.invoice_date ? new Date(po.invoice_date).toLocaleDateString() : ""}</div>
                              {po.invoice_pdf && (
                                <a
                                  href={po.invoice_pdf}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-danger/10 text-danger border border-danger/20 text-[10px] font-black uppercase hover:bg-danger/20 transition-all"
                                >
                                  <FaFilePdf size={10} /> Tax Invoice PDF
                                </a>
                              )}
                            </div>
                          ) : (
                            <span className="text-[10px] text-text-muted italic">Awaiting Supplier</span>
                          )}
                        </td>
                        <td className="p-3 text-center">
                          {po.status === 'paid' ? (
                            <Button
                              onClick={() => handleOpenDeliveryModal(po)}
                              variant="primary"
                              size="sm"
                              className="text-[10px] py-1 px-2.5 font-extrabold uppercase"
                              disabled={isDelivering}
                            >
                              {isDelivering ? "Processing..." : "Complete Delivery"}
                            </Button>
                          ) : po.status === 'delivered' ? (
                            <span className="text-success text-[10px] font-bold flex items-center justify-center gap-1">
                              <FaCheckCircle /> Delivery Completed
                            </span>
                          ) : (
                            <span className="text-[10px] text-text-muted italic">Pending Supplier Action</span>
                          )}
                        </td>
                      </>
                    );
                  }}
                  emptyMessage="No supplier purchase orders assigned to this warehouse."
                />

                <Pagination
                  currentPage={posPage}
                  totalPages={Math.ceil(filteredPOs.length / posPageSize)}
                  onPageChange={setPosPage}
                  totalItems={filteredPOs.length}
                  pageSize={posPageSize}
                />
              </div>
            </div>
          )}

          {activeTab === "supplier" && (
            <div className="card p-8 flex flex-col items-center justify-center text-center space-y-4 max-w-xl mx-auto border border-border bg-surface-hover/30 shadow-lg mt-8 rounded-3xl relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent pointer-events-none" />
              <div className="w-16 h-16 rounded-full bg-primary/10 text-primary flex items-center justify-center text-2xl animate-pulse">
                <FaBoxes />
              </div>
              <h3 className="text-lg font-black text-text-primary">Order Fulfillment Inward</h3>
              <p className="text-xs text-text-secondary leading-relaxed">
                This section handles client order fulfillment inward. The client ordering logistics and matching system is currently under development.
              </p>
              <span className="px-3.5 py-1 text-[10px] bg-primary/10 text-primary border border-primary/20 rounded-full font-black uppercase tracking-wider">
                Under Development
              </span>
            </div>
          )}

          {activeTab === "transfers" && warehouseMode === 'sub' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="card p-6 space-y-4">
                <h3 className="text-base font-bold text-text-primary border-b border-border pb-3 flex items-center gap-2">
                  <FaExchangeAlt className="text-primary" />
                  Awaiting Transfer Receipts from Master Warehouse
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {pendingTransfers.map(trn => (
                    <div
                      key={trn.transferId}
                      className={`p-4 border rounded-xl flex flex-col justify-between transition-all ${trn.status === 'Received'
                          ? 'bg-success/5 border-success/20 opacity-80'
                          : 'bg-surface border-border hover:border-primary/40'
                        }`}
                    >
                      <div>
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-primary text-xs tracking-wider">{trn.transferId}</span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${trn.status === 'Received'
                              ? 'bg-success/10 text-success'
                              : 'bg-warning/10 text-warning animate-pulse'
                            }`}>
                            {trn.status}
                          </span>
                        </div>
                        <div className="mt-2 text-xs text-text-secondary">
                          <strong>From:</strong> {trn.origin} <br />
                          <strong>Sent:</strong> {trn.dateSent}
                        </div>
                        <div className="mt-3 space-y-1 bg-bg p-2 rounded-lg border border-border/50">
                          {trn.items.map((it, idx) => (
                            <div key={idx} className="text-xs text-text-primary flex justify-between font-semibold">
                              <span>{it.qty}x {it.brand} ({it.specs})</span>
                              {it.kws > 0 && <span className="text-[10px] text-text-muted">{it.kws} kW</span>}
                            </div>
                          ))}
                        </div>
                      </div>

                      {trn.status !== 'Received' && (
                        <div className="mt-4 flex gap-2">
                          <Button
                            onClick={() => {
                              setComplianceChecks([]);
                              setActiveTransferToReceive(trn);
                            }}
                            variant="outline"
                            size="sm"
                            fullWidth
                          >
                            Verify Items & Receive
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Receive Modal / Form overlay */}
              {activeTransferToReceive && (
                <div className="fixed inset-0 bg-black/55 backdrop-blur-xs flex items-center justify-center p-4 z-999 animate-in fade-in duration-300">
                  <div className="bg-surface border border-border rounded-2xl p-6 max-w-md w-full space-y-4 shadow-xl">
                    <div className="flex justify-between items-center border-b border-border pb-3">
                      <h4 className="font-bold text-text-primary text-sm flex items-center gap-1">
                        <FaExchangeAlt /> Confirm Stock Receipt: {activeTransferToReceive.transferId}
                      </h4>
                      <Button
                        variant="ghost"
                        onClick={() => setActiveTransferToReceive(null)}
                        className="w-8 h-8 rounded-full p-0 flex items-center justify-center text-text-muted hover:text-text-primary font-bold text-xs"
                      >
                        ✕
                      </Button>
                    </div>

                    <div className="space-y-3 text-xs text-text-secondary">
                      <p>Check off the compliance items below to complete transfer receipt:</p>

                      <div className="space-y-2">
                        <CustomInput
                          type="checkbox"
                          customCheckbox={true}
                          options={[
                            { value: 'qty', label: 'Quantities match master invoice' },
                            { value: 'serials', label: 'Serial numbers scanned & registered' },
                            { value: 'qc', label: 'QC Seal is intact on boxes' }
                          ]}
                          checked={complianceChecks}
                          onChange={handleComplianceChange}
                        />
                      </div>
                    </div>

                    <div className="flex gap-3 pt-3 border-t border-border">
                      <Button
                        onClick={() => setActiveTransferToReceive(null)}
                        variant="secondary"
                        size="md"
                        fullWidth
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={() => confirmTransferReceipt(activeTransferToReceive)}
                        variant="primary"
                        size="md"
                        fullWidth
                        disabled={complianceChecks.length < 3}
                      >
                        Confirm Receipt & Generate GRN
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === "inventory" && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300 w-full max-w-full overflow-hidden">
              <div className="card p-6 space-y-4 w-full max-w-full overflow-hidden">
                <h3 className="text-base font-bold text-text-primary border-b border-border pb-3 flex justify-between items-center">
                  <span>
                    {warehouseMode === 'sub'
                      ? 'Local Sub-Warehouse Inventory Status'
                      : 'Master-Warehouse Inventory Status'}
                  </span>
                  <span className="text-xs bg-primary/10 text-primary px-2.5 py-0.5 rounded-full font-bold">Updated Live</span>
                </h3>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {stockSummary.map((item, idx) => (
                    <div key={idx} className={`p-4 rounded-2xl border border-border/50 ${item.bg}`}>
                      <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider">{item.title}</span>
                      <h4 className="text-lg font-black text-text-primary mt-1">{item.count}</h4>
                      <p className="text-xs text-text-secondary mt-0.5">{item.sub}</p>
                    </div>
                  ))}
                </div>

                {/* Detailed stock items */}
                <div className="pt-4">
                  <h4 className="font-bold text-xs text-text-muted uppercase tracking-wider mb-2">Live Inventory Details</h4>
                    <CustomTable
                      containerClassName="border border-border rounded-xl shadow-xs bg-surface p-0 overflow-hidden w-full"
                      headers={[
                        { key: "sku_code", label: "SKU Code" },
                        { key: "product_name", label: "Product Name" },
                        { key: "category", label: "Category" },
                        { key: "brand", label: "Brand" },
                        { key: "qty", label: "Live Stock", align: "right" },
                        { key: "booked_qty", label: "Booked", align: "right" },
                        { key: "reserved_qty", label: "Reserved", align: "right" },
                        { key: "pre_booked_qty", label: "Pre-Booked", align: "right" },
                        { key: "total_kw", label: "Total Capacity", align: "right" },
                        { key: "average_invoice_price", label: "Avg Invoice Price", align: "right" },
                        { key: "average_benchmark_price", label: "Avg Benchmark Price", align: "right" },
                        { key: "actions", label: "Actions", align: "center" }
                      ]}
                      data={paginatedStock}
                      loading={loadingStock}
                      renderRow={warehouseMode === 'sub' ? renderInventoryRow : (st) => {
                        const sku = st.sku_id || {};
                        const prod = sku.product_id || {};
                        const catName = prod.template_id?.name || "N/A";
                        const brandName = prod.brand_id?.brand_name || "N/A";

                        return (
                          <>
                            <td className="p-3 font-bold text-primary whitespace-nowrap">{st.sku_code}</td>
                            <td className="p-3 font-semibold text-text-primary min-w-[200px]">{prod.name || "N/A"}</td>
                            <td className="p-3 text-text-secondary whitespace-nowrap">{catName}</td>
                            <td className="p-3 text-text-secondary whitespace-nowrap">{brandName}</td>
                            <td className="p-3 text-right font-black text-text-primary whitespace-nowrap">{st.qty} pcs</td>
                            <td className="p-3 text-right font-bold text-success whitespace-nowrap">{st.booked_qty || 0} pcs</td>
                            <td className="p-3 text-right font-bold text-warning whitespace-nowrap">{st.reserved_qty || 0} pcs</td>
                            <td className="p-3 text-right font-bold text-danger whitespace-nowrap">{st.pre_booked_qty || 0} pcs</td>
                            <td className="p-3 text-right text-text-secondary whitespace-nowrap">
                              {st.total_kw > 0 ? `${st.total_kw.toFixed(2)} kW` : "-"}
                            </td>
                            <td className="p-3 text-right text-text-secondary whitespace-nowrap">₹{st.average_invoice_price?.toLocaleString() || 0}</td>
                            <td className="p-3 text-right text-text-secondary whitespace-nowrap">₹{st.average_benchmark_price?.toLocaleString() || 0}</td>
                            <td className="p-3 text-center">
                              <div className="flex items-center justify-center gap-1.5">
                                <button 
                                  onClick={() => handleShowSkuInfo(st)}
                                  className="p-1 rounded bg-info/10 text-info hover:bg-info/20 border border-info/20 inline-flex items-center justify-center cursor-pointer"
                                  title="View allocation details"
                                >
                                  <FaInfoCircle size={12} />
                                </button>
                                <button 
                                  onClick={() => handleRaisePoDirect(st)}
                                  className="p-1 rounded bg-primary/10 text-primary hover:bg-primary/20 border border-primary/20 inline-flex items-center justify-center cursor-pointer"
                                  title="Direct PO Request"
                                >
                                  <FaFileInvoice size={12} />
                                </button>
                              </div>
                            </td>
                          </>
                        );
                      }}
                      emptyMessage="No stock recorded."
                    />

                  <Pagination
                    currentPage={stockPage}
                    totalPages={Math.ceil(stockStatus.length / stockPageSize)}
                    onPageChange={setStockPage}
                    totalItems={stockStatus.length}
                    pageSize={stockPageSize}
                  />
                </div>

                {/* Log files of all receipts */}
                <div className="pt-4 border-t border-border mt-6 space-y-6">
                  {/* Stats Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Total Delivered */}
                    <div className="card p-4 flex items-center gap-3 bg-surface border-border/60">
                      <div className="w-11 h-11 rounded-xl bg-success/10 text-success flex items-center justify-center text-lg flex-shrink-0">
                        <FaCheckCircle />
                      </div>
                      <div>
                        <h4 className="text-2xl font-black text-text-primary">{currentLogs.length}</h4>
                        <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider">
                          {warehouseMode === 'sub' ? 'Total Inward Logs' : 'Total Delivered POs'}
                        </p>
                      </div>
                    </div>

                    {/* Total Value */}
                    <div className="card p-4 flex items-center gap-3 bg-surface border-border/60">
                      <div className="w-11 h-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center text-lg flex-shrink-0">
                        <FaShippingFast />
                      </div>
                      <div>
                        <h4 className="text-xl font-black text-text-primary">
                          ₹{(() => {
                            return currentLogs.reduce((acc, log) => acc + (log.items || []).reduce((s, it) => s + (it.invoice_price || it.order_price || 0) * (it.qty || 0), 0), 0);
                          })().toLocaleString()}
                        </h4>
                        <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider">
                          {warehouseMode === 'sub' ? 'Total Inward Value' : 'Total Delivery Value'}
                        </p>
                      </div>
                    </div>

                    {/* Total Items */}
                    <div className="card p-4 flex items-center gap-3 bg-surface border-border/60">
                      <div className="w-11 h-11 rounded-xl bg-info/10 text-info flex items-center justify-center text-lg flex-shrink-0">
                        <FaBoxes />
                      </div>
                      <div>
                        <h4 className="text-2xl font-black text-text-primary">
                          {(() => {
                            return currentLogs.reduce((acc, log) => acc + (log.items || []).reduce((s, it) => s + (it.qty || 0), 0), 0);
                          })().toLocaleString()}
                        </h4>
                        <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider">
                          {warehouseMode === 'sub' ? 'Total Items Received' : 'Total Items Delivered'}
                        </p>
                      </div>
                    </div>

                    {/* Unique Suppliers */}
                    <div className="card p-4 flex items-center gap-3 bg-surface border-border/60">
                      <div className="w-11 h-11 rounded-xl bg-warning/10 text-warning flex items-center justify-center text-lg flex-shrink-0">
                        <FaHandshake />
                      </div>
                      <div>
                        <h4 className="text-2xl font-black text-text-primary">
                          {new Set(currentLogs.map(log => log.supplier_name).filter(Boolean)).size}
                        </h4>
                        <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider">
                          {warehouseMode === 'sub' ? 'Partners Involved' : 'Suppliers Involved'}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-3 pt-4 border-t border-border/30">
                    <h4 className="font-bold text-xs text-text-muted uppercase tracking-wider">
                      {warehouseMode === 'sub' ? 'Inward Receipts History' : 'Supplier Inward Receipts History'}
                    </h4>
                    <div className="w-full md:w-72">
                      <CustomInput
                        type="text"
                        placeholder="Search logs..."
                        value={searchQuery}
                        onChange={(e) => {
                          setSearchQuery(e.target.value);
                          setLogsPage(1);
                        }}
                        inputClassName="text-xs"
                      />
                    </div>
                  </div>

                    <CustomTable
                      containerClassName="border border-border rounded-xl shadow-xs bg-surface p-0 overflow-hidden w-full"
                      headers={warehouseMode === 'sub' ? [
                        { key: "grn_no", label: "GRN No" },
                        { key: "supplier_name", label: "Partner / Origin" },
                        { key: "invoice_no", label: "Invoice / Transfer Ref" },
                        { key: "invoice_date", label: "Date" },
                        { key: "status", label: "QC Status" }
                      ] : [
                        { key: "grn_no", label: "GRN No" },
                        { key: "supplier_name", label: "Supplier Name" },
                        { key: "invoice_no", label: "Invoice details" },
                        { key: "specs", label: "Inventory Affected" },
                        { key: "status", label: "QC Status", align: "center" }
                      ]}
                      data={warehouseMode === 'sub' ? paginatedSubLogs : paginatedMasterLogs}
                      loading={loadingLogs}
                      renderRow={warehouseMode === 'sub' ? renderSubLogRow : renderMasterLogRow}
                      emptyMessage="No inward logs found."
                    />

                  <Pagination
                    currentPage={logsPage}
                    totalPages={Math.ceil(
                      (warehouseMode === 'sub' ? filteredSubLogs.length : filteredMasterLogs.length) / logsPageSize
                    )}
                    onPageChange={setLogsPage}
                    totalItems={warehouseMode === 'sub' ? filteredSubLogs.length : filteredMasterLogs.length}
                    pageSize={logsPageSize}
                  />
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
      {/* Delivery Confirmation Dialog */}
      <Dialog
        isOpen={isDeliverModalOpen}
        onClose={() => !isDelivering && setIsDeliverModalOpen(false)}
        title={`Complete Delivery - ${selectedPOForDelivery?.po_number}`}
        size="md"
      >
        <form onSubmit={handleMarkDelivered} className="space-y-4">
          {deliveryFormError && (
            <div className="p-3 bg-danger/5 border border-danger/25 text-danger rounded-xl text-xs font-semibold">
              ⚠️ {deliveryFormError}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <CustomInput
                label="Supplier Tax Invoice Number *"
                placeholder="e.g. GST/2026/0045"
                required
                value={deliveryForm.invoice_no}
                onChange={(e) => setDeliveryForm({ ...deliveryForm, invoice_no: e.target.value })}
              />
            </div>

            <div className="col-span-2">
              <CustomInput
                label="Supplier GSTIN (Tax ID) *"
                placeholder="e.g. 27AAAAA0000A1Z5"
                required
                value={deliveryForm.supplier_gst}
                onChange={(e) => setDeliveryForm({ ...deliveryForm, supplier_gst: e.target.value })}
              />
            </div>

            <div className="col-span-2">
              <CustomInput
                label="Tax Invoice Date *"
                type="date"
                required
                max={new Date().toLocaleDateString('en-CA')}
                value={deliveryForm.invoice_date}
                onChange={(e) => setDeliveryForm({ ...deliveryForm, invoice_date: e.target.value })}
              />
            </div>

            <div className="col-span-2 space-y-2">
              <CustomFilePicker
                name="invoice_pdf"
                label="Supplier Tax Invoice PDF / Image Document *"
                accept="application/pdf,image/*"
                onChange={handleFileChange}
                disabled={uploadingPdf || isDelivering}
                files={selectedFile ? [selectedFile] : []}
              />
              {uploadingPdf && (
                <div className="text-[10px] text-primary font-bold flex items-center gap-1.5 animate-pulse mt-1">
                  <FaSpinner className="animate-spin text-xs" /> Uploading invoice document to Cloudinary...
                </div>
              )}
              {(selectedFile || deliveryForm.invoice_pdf) && (
                <div className="text-[10px] text-success font-black flex items-center gap-1 mt-1">
                  <FaCheckCircle className="text-xs" /> Document selected: {selectedFile ? selectedFile.name : "invoice_pdf"} {" "}
                  <a
                    href={selectedFile ? URL.createObjectURL(selectedFile) : deliveryForm.invoice_pdf}
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
              disabled={isDelivering}
              onClick={() => setIsDeliverModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={isDelivering}
              loading={isDelivering}
              leftIcon={<HiOutlineCheckCircle />}
            >
              Complete Delivery
            </Button>
          </div>
        </form>
      </Dialog>
      {/* Proforma Invoice Modal */}
      <ProformaInvoiceModal
        isOpen={proformaModalOpen}
        onClose={() => setProformaModalOpen(false)}
        po={proformaPO}
        defaultTab={proformaModalDefaultTab}
      />
      {/* Inward Details Modal */}
      <InwardDetailsModal
        isOpen={inwardDetailsModalOpen}
        onClose={() => setInwardDetailsModalOpen(false)}
        log={selectedInwardLog}
        activeSkus={activeSkus}
      />
      {renderSkuInfoModal()}
    </div>
  );
}
