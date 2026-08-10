import React, { useState, useEffect, useMemo } from "react";
import PageHeader from "../components/PageHeader";
import { 
  FaClipboardList, FaFileInvoice, FaTruck, FaCheckCircle, 
  FaSearch, FaFilter, FaDownload, FaTimesCircle, FaUpload, 
  FaMapMarkerAlt, FaFilePdf, FaBoxes, FaUser, FaSpinner
} from "react-icons/fa";
import Button from "../components/Button";
import { motion, AnimatePresence } from "framer-motion";
import { supplier_api } from "../features/supplier.api";

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  // Modal State for Invoice Upload
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [invoiceNo, setInvoiceNo] = useState("");
  const [invoiceDate, setInvoiceDate] = useState("");
  const [uploadedFile, setUploadedFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Fetch orders from API
  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await supplier_api.get_orders();
      if (res.data && res.data.status === "success") {
        setOrders(res.data.data || []);
      }
    } catch (err) {
      console.error("Error fetching supplier orders:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleOpenInvoiceModal = (order) => {
    setSelectedOrder(order);
    setInvoiceNo("");
    setInvoiceDate("");
    setUploadedFile(null);
    setIsModalOpen(true);
  };

  const handleConfirmInvoice = async (e) => {
    e.preventDefault();
    if (!selectedOrder) return;
    if (!invoiceNo.trim() || !invoiceDate || !uploadedFile) {
      alert("Please fill all required fields and upload the invoice PDF.");
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("invoice_no", invoiceNo.trim());
      formData.append("invoice_date", invoiceDate);
      formData.append("invoice_pdf", uploadedFile);

      const res = await supplier_api.accept_and_invoice(selectedOrder.id || selectedOrder._id, formData);
      if (res.data && res.data.status === "success") {
        setIsModalOpen(false);
        setSelectedOrder(null);
        setUploadedFile(null);
        setInvoiceNo("");
        setInvoiceDate("");
        fetchOrders();
      } else {
        alert(res.data.message || "Failed to submit invoice.");
      }
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || err.message || "Error submitting invoice.");
    } finally {
      setSubmitting(false);
    }
  };

  // Filter functionality
  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      const matchesSearch = 
        order.po_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (order.warehouse_id?.warehouse_code || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (order.items[0]?.sku_details?.product_name || "").toLowerCase().includes(searchQuery.toLowerCase());

      const statusMap = {
        "Awaiting Invoice": "pending",
        "Invoiced": "invoiced",
        "Delivered": "delivered"
      };

      const matchesStatus = 
        statusFilter === "All" || 
        (statusFilter === "Invoiced" 
          ? order.status === "invoiced" || order.status === "paid" 
          : order.status === statusMap[statusFilter]);

      return matchesSearch && matchesStatus;
    });
  }, [orders, searchQuery, statusFilter]);

  // Compute stats
  const stats = useMemo(() => {
    return {
      pending: orders.filter(o => o.status === 'pending').length,
      invoiced: orders.filter(o => o.status === 'invoiced' || o.status === 'paid').length,
      delivered: orders.filter(o => o.status === 'delivered').length,
    };
  }, [orders]);

  return (
    <div className="space-y-8 pb-10">
      <PageHeader 
        title="Assigned Orders Portfolio" 
        subtitle="Accept purchase orders from developers/accounts, generate billing invoices, and track delivery status." 
        icon={FaClipboardList}
      />

      {/* Stats counter */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="card p-5 bg-surface border-border flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-warning/10 text-warning flex items-center justify-center text-xl shadow-inner">
            <FaClipboardList />
          </div>
          <div>
            <p className="text-2xl font-black text-text-primary tracking-tight">
              {stats.pending}
            </p>
            <p className="text-[10px] font-black text-text-muted uppercase tracking-widest">Awaiting Invoice</p>
          </div>
        </div>
        <div className="card p-5 bg-surface border-border flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center text-xl shadow-inner">
            <FaFileInvoice />
          </div>
          <div>
            <p className="text-2xl font-black text-text-primary tracking-tight">
              {stats.invoiced}
            </p>
            <p className="text-[10px] font-black text-text-muted uppercase tracking-widest">Invoiced POs</p>
          </div>
        </div>
        <div className="card p-5 bg-surface border-border flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-success/10 text-success flex items-center justify-center text-xl shadow-inner">
            <FaCheckCircle />
          </div>
          <div>
            <p className="text-2xl font-black text-text-primary tracking-tight">
              {stats.delivered}
            </p>
            <p className="text-[10px] font-black text-text-muted uppercase tracking-widest">Closed / Delivered</p>
          </div>
        </div>
      </div>

      {/* Orders Table Container */}
      <div className="card bg-surface border-border overflow-hidden shadow-md">
        
        {/* Search and Filters */}
        <div className="p-6 border-b border-border flex flex-col md:flex-row justify-between gap-4 bg-linear-to-b from-surface to-surface-hover/30">
          <div className="relative flex-1 max-w-md">
            <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" />
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by PO Number or Product Name..." 
              className="w-full h-11 bg-surface-hover border-2 border-transparent focus:border-primary/30 rounded-xl pl-12 pr-4 text-sm font-bold transition-all outline-none text-text-primary"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {["All", "Awaiting Invoice", "Invoiced", "Delivered"].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest border transition-all duration-200 ${
                  statusFilter === status 
                    ? "bg-primary text-white border-primary shadow-sm" 
                    : "bg-surface border-border text-text-secondary hover:bg-surface-hover"
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        {/* Table list */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-16 text-center text-sm font-bold text-text-secondary flex items-center justify-center gap-2">
              <FaSpinner className="animate-spin text-primary text-xl" /> Fetching Purchase Orders...
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="p-16 text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 text-primary text-2xl">
                <FaClipboardList />
              </div>
              <h4 className="text-lg font-black text-text-primary">No purchase orders assigned</h4>
              <p className="text-xs text-text-secondary mt-1">Check back later or change filters.</p>
            </div>
          ) : (
            <table className="w-full text-left">
              <thead>
                <tr className="bg-surface-hover/50 text-[10px] font-black text-text-muted uppercase tracking-widest">
                  <th className="px-6 py-4">PO Number</th>
                  <th className="px-6 py-4">Fulfillment Destination</th>
                  <th className="px-6 py-4">Order Items / Specs</th>
                  <th className="px-6 py-4">Commercials</th>
                  <th className="px-6 py-4">Due Timeline</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-center">Fulfillment Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {filteredOrders.map((order) => {
                  const item = order.items[0] || {};
                  const totalVal = item.order_price * item.qty;
                  return (
                    <tr key={order.id || order._id} className="hover:bg-surface-hover/20 transition-colors group">
                      <td className="px-6 py-4">
                        <span className="text-sm font-black text-primary uppercase tracking-tight group-hover:text-primary transition-colors">{order.po_number}</span>
                        <p className="text-[10px] font-bold text-text-muted mt-0.5">Ordered: {new Date(order.createdAt).toLocaleDateString()}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm font-bold text-text-primary">{order.warehouse_id?.warehouse_code || "N/A"}</p>
                        <p className="text-[10px] font-medium text-text-secondary">{order.warehouse_id?.address || "N/A"}</p>
                      </td>
                      <td className="px-6 py-4 max-w-xs">
                        <p className="text-xs font-bold text-text-primary">{item.sku_details?.product_name || item.sku_code}</p>
                        <p className="text-[10px] text-text-muted mt-0.5">Brand: {item.sku_details?.brand_name || "N/A"} | Category: {item.sku_details?.category || "N/A"}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-black text-text-primary">₹{totalVal?.toLocaleString()}</span>
                        <p className="text-[9px] text-text-muted">₹{item.order_price?.toLocaleString()} x {item.qty} units</p>
                      </td>
                      <td className="px-6 py-4 text-xs font-semibold text-text-secondary">
                        {new Date(order.timeline).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-[9px] font-black uppercase px-2 py-1 rounded border ${
                          order.status === 'delivered' ? 'bg-success/10 text-success border-success/20' : 
                          order.status === 'invoiced' ? 'bg-primary/10 text-primary border-primary/20' : 
                          order.status === 'paid' ? 'bg-info/10 text-info border-info/20' : 
                          'bg-warning/10 text-warning border-warning/20 animate-pulse'
                        }`}>
                          {order.status === 'pending' ? 'awaiting invoice' : order.status === 'paid' ? 'Paid' : order.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2">
                          {order.status === 'pending' && (
                            <button
                              onClick={() => handleOpenInvoiceModal(order)}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white text-xs font-black uppercase tracking-widest rounded-lg hover:bg-primary/95 transition-all shadow-sm"
                            >
                              <FaUpload size={10} /> Accept & Invoice
                            </button>
                          )}

                          {order.status === 'invoiced' && (
                            <div className="text-xs space-y-1 text-center">
                              <span className="text-primary font-bold block">Invoice Registered</span>
                              <a 
                                href={order.proforma_invoice_pdf || order.invoice_pdf} 
                                target="_blank" 
                                rel="noreferrer" 
                                className="inline-flex items-center gap-1 text-[10px] text-danger font-extrabold hover:underline"
                              >
                                <FaFilePdf /> View Invoice PDF
                              </a>
                            </div>
                          )}

                          {order.status === 'paid' && (
                            <div className="text-xs space-y-1 text-center">
                              <span className="text-success font-bold block">Invoice Paid</span>
                              <a 
                                href={order.proforma_invoice_pdf || order.invoice_pdf} 
                                target="_blank" 
                                rel="noreferrer" 
                                className="inline-flex items-center gap-1 text-[10px] text-danger font-extrabold hover:underline"
                              >
                                <FaFilePdf /> View Invoice PDF
                              </a>
                            </div>
                          )}

                          {order.status === 'delivered' && (
                            <div className="text-xs text-center space-y-0.5">
                              <span className="text-success font-black uppercase tracking-wider block">Closed & Delivered</span>
                              <a 
                                href={order.invoice_pdf} 
                                target="_blank" 
                                rel="noreferrer" 
                                className="inline-flex items-center gap-1 text-[10px] text-danger font-extrabold hover:underline"
                              >
                                <FaFilePdf /> Invoice
                              </a>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* MODAL: Accept & Upload Invoice Form */}
      <AnimatePresence>
        {isModalOpen && selectedOrder && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-surface border border-border rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl"
            >
              {/* Header */}
              <div className="relative bg-linear-to-b from-primary to-primary/80 p-6 text-white">
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="absolute top-4 right-4 text-white/80 hover:text-white text-lg"
                >
                  <FaTimesCircle />
                </button>
                <span className="text-[10px] font-black uppercase tracking-widest bg-white/20 px-2.5 py-1 rounded-full">
                  Fulfillment Invoice
                </span>
                <h3 className="text-xl font-black mt-2">Generate Billing Invoice</h3>
                <p className="text-xs text-white/80 mt-1">PO Reference: {selectedOrder.po_number}</p>
              </div>

              {/* Form Body */}
              <form onSubmit={handleConfirmInvoice} className="p-6 space-y-5">
                
                {/* Invoice inputs */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-black text-text-muted uppercase tracking-widest">Invoice Number</label>
                    <input 
                      type="text" 
                      required
                      value={invoiceNo}
                      onChange={(e) => setInvoiceNo(e.target.value)}
                      placeholder="e.g. INV-2026-001"
                      className="w-full h-11 bg-surface-hover border border-border focus:border-primary rounded-xl px-4 text-sm font-bold text-text-primary outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-black text-text-muted uppercase tracking-widest">Invoice Date</label>
                    <input 
                      type="date" 
                      required
                      max={new Date().toLocaleDateString('en-CA')}
                      value={invoiceDate}
                      onChange={(e) => setInvoiceDate(e.target.value)}
                      className="w-full h-11 bg-surface-hover border border-border focus:border-primary rounded-xl px-4 text-sm font-bold text-text-primary outline-none cursor-pointer"
                    />
                  </div>
                </div>

                {/* Upload Section */}
                <div className="space-y-2">
                  <label className="text-xs font-black text-text-muted uppercase tracking-widest">Clearing Sales Invoice (PDF)</label>
                  <div className="border-2 border-dashed border-border hover:border-primary/50 rounded-2xl p-6 text-center cursor-pointer transition-all bg-surface-hover/30">
                    <input 
                      type="file" 
                      required
                      accept=".pdf"
                      id="invoice-file" 
                      className="hidden" 
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          setUploadedFile(e.target.files[0]);
                        }
                      }}
                    />
                    <label htmlFor="invoice-file" className="cursor-pointer space-y-2 block">
                      <FaUpload className="text-3xl text-primary/60 mx-auto" />
                      <p className="text-sm font-bold text-text-primary">
                        {uploadedFile ? uploadedFile.name : 'Select Invoice PDF'}
                      </p>
                      <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">
                        {uploadedFile ? `${(uploadedFile.size / 1024).toFixed(1)} KB` : 'Attachment is compulsory'}
                      </p>
                    </label>
                  </div>
                </div>

                {/* Submit actions */}
                <div className="flex justify-end gap-3 pt-4 border-t border-border">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsModalOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    variant="primary" 
                    disabled={submitting}
                    loading={submitting}
                  >
                    Confirm & Invoice
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
