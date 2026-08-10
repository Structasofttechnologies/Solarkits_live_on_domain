import React, { useState, useEffect, useMemo } from "react";
import { useSelector } from "react-redux";
import {
  FaCreditCard, FaSearch, FaSpinner,
  FaCheckCircle, FaHistory,
  FaClipboardList, FaFilePdf, FaEye
} from "react-icons/fa";
import { getPurchaseOrders, payPurchaseOrder, uploadPaymentReceipt, cancelPurchaseOrder } from "../../api/accounts";
import PageHeader from "../../components/PageHeader";
import Button from "../../components/Button";
import CustomTable from "../../components/CustomTable";
import Pagination from "../../components/Pagination";
import CustomInput from "../../components/CustomInput";
import DropdownWithSearchInput from "../../components/DropdownWithSearchInput";
import Dialog from "../../components/Dialog";
import CustomFilePicker from "../../components/CustomFilePicker";
import ConfirmationPopup from "../../components/ConfirmationPopup";

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
    setWarehouseFilter("All");
    setSupplierFilter("All");
    setPage(1);
  }, [activeClusterId, activeStateId, activeCountryId]);

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

  // Filter pending vs history
  const filteredPOList = useMemo(() => {
    return purchaseOrders.filter((po) => {
      const matchesSearch =
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

      return matchesSearch && matchesTab && matchesWarehouse && matchesSupplier;
    });
  }, [purchaseOrders, searchQuery, activeTab, warehouseFilter, supplierFilter]);

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
      <div className="flex bg-surface border border-border p-1 rounded-xl gap-1 max-w-md">
        <button
          onClick={() => {
            setActiveTab("pending");
            setPage(1);
          }}
          className={`flex-1 py-2 px-4 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${activeTab === "pending"
            ? "bg-primary text-white shadow-sm"
            : "text-text-secondary hover:bg-surface-hover"
            }`}
        >
          <FaClipboardList />
          Awaiting Payment
        </button>
        <button
          onClick={() => {
            setActiveTab("history");
            setPage(1);
          }}
          className={`flex-1 py-2 px-4 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${activeTab === "history"
            ? "bg-primary text-white shadow-sm"
            : "text-text-secondary hover:bg-surface-hover"
            }`}
        >
          <FaHistory />
          Payment History
        </button>
      </div>

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
            emptyMessage="No purchase orders found."
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
    </div>
  );
}
