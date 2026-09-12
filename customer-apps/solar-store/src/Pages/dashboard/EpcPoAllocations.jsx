import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import axiosInstance from '@/utils/axiosInstance';
import {
  FiCheckCircle,
  FiUploadCloud,
  FiClock,
  FiXCircle,
  FiCopy,
  FiCheck,
  FiDollarSign,
  FiShield,
  FiZap,
  FiLayers,
  FiPackage,
  FiUser,
  FiPhone,
  FiMail,
  FiExternalLink
} from 'react-icons/fi';
import toast from 'react-hot-toast';

export default function EpcPoAllocations() {
  const { user } = useSelector((state) => state.auth_slice);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  // ICICI Virtual Account State
  const [iciciVanDetails, setIciciVanDetails] = useState(null);
  const [copiedField, setCopiedField] = useState('');

  // Manual Receipt Upload State
  const [activeUploadOrderId, setActiveUploadOrderId] = useState(null);
  const [receiptFile, setReceiptFile] = useState(null);
  const [manualUtr, setManualUtr] = useState('');
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchAllocations();
  }, []);

  // Fetch ICICI Virtual Account details & listen for real-time payment credit
  useEffect(() => {
    const rawApiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    const baseUrl = rawApiUrl.replace(/\/api\/?$/, '').replace(/\/+$/, '');
    const userPhone = user?.whatsapp || user?.registered_whatsapp || user?.mobile || '9876543210';

    // Fetch dynamic VAN
    fetch(`${baseUrl}/api/v1/payments/icici/van-details?phone=${userPhone}`)
      .then((res) => res.json())
      .then((d) => {
        if (d?.success) setIciciVanDetails(d.data);
      })
      .catch((err) => console.warn('Could not load ICICI VAN details:', err));

    // Real-time EventSource listener for instant payment verification
    const epcId = user?._id || user?.id || user?.account_id;
    const streamUrl = `${baseUrl}/api/v1/payments/icici/stream?role=epc&epc_id=${epcId || ''}`;
    const es = new EventSource(streamUrl);

    es.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'ICICI_PAYMENT_CREDITED') {
          console.log('⚡ Auto-detected ICICI Payment credit for PO Allocation!', data);
          toast.success(
            `Payment of ${data.amountFormatted || '₹' + data.amount} confirmed via ICICI UTR: ${data.utr}!`,
            { duration: 7000 }
          );
          fetchAllocations();
        }
      } catch (err) {
        console.error(err);
      }
    };

    return () => es.close();
  }, [user]);

  const fetchAllocations = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get('/india/v1/shop/po-allocations');
      if (res.data?.success) {
        setOrders(res.data.data);
      }
    } catch (err) {
      toast.error('Failed to load PO allocations');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyText = (text, field) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    toast.success(`Copied: ${text}`);
    setTimeout(() => setCopiedField(''), 2500);
  };

  const handleUpload = async (poId) => {
    if (!receiptFile) {
      toast.error('Please select a receipt file to upload');
      return;
    }

    const formData = new FormData();
    formData.append('files', receiptFile);
    if (manualUtr) formData.append('utr_number', manualUtr);

    setUploading(true);
    try {
      const res = await axiosInstance.post(`/india/v1/shop/po-allocations/${poId}/upload-receipt`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      if (res.data?.success) {
        toast.success('Receipt submitted successfully for verification');
        setReceiptFile(null);
        setManualUtr('');
        setActiveUploadOrderId(null);
        fetchAllocations();
      } else {
        toast.error(res.data?.message || 'Failed to upload receipt');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to upload receipt');
    } finally {
      setUploading(false);
    }
  };

  const StatusBadge = ({ status, utr }) => {
    if (status === 'VERIFIED' || status === 'PAID') {
      return (
        <div className="flex items-center gap-1.5">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-500/30 shadow-sm">
            <FiCheckCircle className="mr-1 text-emerald-600" />
            PAID & VERIFIED
          </span>
          {utr && (
            <span className="text-[11px] font-mono font-semibold text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
              UTR: {utr}
            </span>
          )}
        </div>
      );
    }

    if (status === 'RECEIPT_SUBMITTED') {
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-300 border border-blue-500/30 shadow-sm">
          <FiUploadCloud className="mr-1 text-blue-600" />
          RECEIPT SUBMITTED (VERIFICATION PENDING)
        </span>
      );
    }

    return (
      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-500/30 shadow-sm">
        <FiClock className="mr-1 text-amber-600" />
        PAYMENT PENDING
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-surface p-6 rounded-2xl border border-border shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-md bg-[#264baa]/15 text-[#264baa] dark:text-blue-300 text-[11px] font-black uppercase tracking-wider border border-[#264baa]/25">
              Franchise Allocated Inventory
            </span>
            <span className="text-xs font-bold text-text-secondary bg-surface-hover px-2 py-0.5 rounded border border-border">
              {orders.length} Allocation{orders.length === 1 ? '' : 's'}
            </span>
          </div>
          <h2 className="text-2xl font-black text-text-primary dark:text-white mt-1">
            Purchase Orders (Franchise Allocated)
          </h2>
          <p className="text-xs text-text-secondary mt-1">
            Complete instant bank transfer via ICICI Virtual Account (Auto-Verified in 10s) or submit your payment receipt.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={fetchAllocations}
            className="px-4 py-2 bg-surface hover:bg-surface-hover text-text-primary text-xs font-bold rounded-xl border border-border shadow-sm transition-all flex items-center gap-1.5"
          >
            <FiZap className="text-[#264baa]" /> Refresh Status
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center p-16 bg-surface rounded-2xl border border-border">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#264baa]"></div>
          <p className="text-xs font-bold text-text-secondary mt-3">Loading allocated purchase orders...</p>
        </div>
      ) : orders.length === 0 ? (
        <div className="bg-surface border border-border rounded-2xl p-16 text-center shadow-sm">
          <div className="w-16 h-16 rounded-full bg-[#264baa]/10 flex items-center justify-center mx-auto mb-3">
            <FiPackage className="h-8 w-8 text-[#264baa]" />
          </div>
          <h3 className="text-base font-bold text-text-primary dark:text-white">No PO Allocations Found</h3>
          <p className="text-xs text-text-secondary mt-1 max-w-md mx-auto">
            You do not currently have any pending purchase order allocations from your Franchise Partner.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {orders.map((order) => {
            // Find allocation for this EPC
            let epcAlloc = null;
            let allocatedItem = null;
            order.items?.forEach((item) => {
              item.epc_allocations?.forEach((alloc) => {
                epcAlloc = alloc;
                allocatedItem = item;
              });
            });

            if (!epcAlloc || !allocatedItem) return null;

            const unitPrice = allocatedItem.unit_price_paise ? allocatedItem.unit_price_paise / 100 : 0;
            const allocatedQty = epcAlloc.allocated_quantity || 1;
            const amountToPay = (allocatedItem.unit_price_paise * allocatedQty) / 100;
            const gstRate = allocatedItem.gst_rate || 13.8;
            const taxToPay = allocatedItem.tax_paise
              ? ((allocatedItem.tax_paise / (allocatedItem.quantity || allocatedQty)) * allocatedQty) / 100
              : Math.round(amountToPay * (gstRate / 100));
            const totalToPay = amountToPay + taxToPay;

            const kitCapacity = allocatedItem.capacity || 3;
            const totalCapacityKw = kitCapacity * allocatedQty;
            const isPaid = epcAlloc.payment_status === 'VERIFIED' || epcAlloc.payment_status === 'PAID';

            return (
              <div
                key={order._id}
                className="bg-surface rounded-2xl shadow-md border-2 border-border overflow-hidden transition-all hover:border-[#264baa]/40"
              >
                {/* Order Top Bar */}
                <div className="bg-gradient-to-r from-[#264baa]/10 via-surface to-surface p-4 sm:p-5 border-b border-border flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-text-muted">Purchase Order Reference</span>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="font-mono text-base sm:text-lg font-black text-[#264baa] dark:text-blue-300">
                        {order.po_number}
                      </span>
                      <span className="text-xs text-text-secondary">
                        • Placed {new Date(order.created_at || Date.now()).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                    </div>
                  </div>

                  <div>
                    <StatusBadge status={epcAlloc.payment_status} utr={order.offline_payment?.utr_number || order.payment_utr} />
                  </div>
                </div>

                {/* Main Content Grid: Left (Kit Details & Image) + Right (Pricing & ICICI Payment) */}
                <div className="p-5 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
                  {/* Left Section: Kit Image, Title & Specs (7 cols) */}
                  <div className="lg:col-span-7 space-y-5">
                    <div className="flex flex-col sm:flex-row items-start gap-4">
                      {/* Kit Image Thumbnail */}
                      <div className="w-full sm:w-36 sm:h-36 shrink-0 rounded-xl bg-surface-hover border border-border overflow-hidden relative group">
                        {allocatedItem.kit_image ? (
                          <img
                            src={allocatedItem.kit_image}
                            alt={allocatedItem.item_name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = 'https://res.cloudinary.com/dggmbagax/image/upload/v1788328068/solarkits/solarkits-admin-panel-backend/public/uploads/combo_kits/KIT_1788328066633_236114742.jpg';
                            }}
                          />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center p-3 text-[#264baa] bg-[#264baa]/5">
                            <FiPackage className="text-3xl mb-1" />
                            <span className="text-[10px] font-bold text-center">Solar Combo Kit</span>
                          </div>
                        )}
                        <span className="absolute bottom-1.5 left-1.5 px-2 py-0.5 rounded bg-black/75 text-white font-mono font-bold text-[10px]">
                          {kitCapacity} kW / Unit
                        </span>
                      </div>

                      {/* Kit Details */}
                      <div className="flex-1 space-y-2">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="px-2 py-0.5 rounded bg-[#264baa]/15 text-[#264baa] dark:text-blue-300 text-[10px] font-black uppercase">
                            {allocatedItem.brand_name || 'Tata Power Solar'}
                          </span>
                          <span className="px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold">
                            On-Grid Standard
                          </span>
                        </div>

                        <h3 className="text-base sm:text-lg font-black text-text-primary dark:text-white leading-snug">
                          {allocatedItem.item_name}
                        </h3>

                        <p className="text-xs text-text-secondary line-clamp-2">
                          {allocatedItem.description ||
                            'High-efficiency commercial grade solar system equipped with Tier-1 string inverter, certified mounting modules, and comprehensive BOS kit.'}
                        </p>

                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1 text-xs">
                          <div className="bg-surface-hover p-2 rounded-lg border border-border">
                            <span className="text-[10px] text-text-muted block">Allocated Units</span>
                            <span className="font-bold text-text-primary dark:text-white text-sm">
                              {allocatedQty} Units
                            </span>
                          </div>
                          <div className="bg-surface-hover p-2 rounded-lg border border-border">
                            <span className="text-[10px] text-text-muted block">Total Capacity</span>
                            <span className="font-bold text-[#264baa] dark:text-blue-400 text-sm">
                              {totalCapacityKw} kW
                            </span>
                          </div>
                          <div className="bg-surface-hover p-2 rounded-lg border border-border col-span-2 sm:col-span-1">
                            <span className="text-[10px] text-text-muted block">Unit Price (Excl. Tax)</span>
                            <span className="font-mono font-bold text-text-primary dark:text-white text-sm">
                              ₹{unitPrice.toLocaleString('en-IN')}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Franchise Partner Info Card */}
                    <div className="p-3.5 rounded-xl bg-surface-hover/70 border border-border flex flex-wrap items-center justify-between gap-3 text-xs">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted flex items-center gap-1">
                          <FiUser className="text-[#264baa]" /> Franchise Partner Details
                        </span>
                        <div className="font-bold text-text-primary dark:text-white text-sm mt-0.5">
                          {order.franchisee_id?.business_name || 'Gujarat SolarTech Enterprises'}
                        </div>
                      </div>

                      <div className="flex items-center gap-4 text-xs text-text-secondary">
                        {order.franchisee_id?.mobile && (
                          <div className="flex items-center gap-1 font-semibold">
                            <FiPhone className="text-emerald-500" /> {order.franchisee_id?.mobile}
                          </div>
                        )}
                        {order.franchisee_id?.email && (
                          <div className="flex items-center gap-1">
                            <FiMail className="text-blue-500" /> {order.franchisee_id?.email}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right Section: Pricing Breakdown & ICICI Checkout Flow (5 cols) */}
                  <div className="lg:col-span-5 space-y-4">
                    {/* Financial Summary Card */}
                    <div className="p-4 rounded-xl bg-surface-hover/50 border border-border space-y-2.5">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-text-secondary">Base Amount ({allocatedQty} Kits):</span>
                        <span className="font-mono font-bold text-text-primary dark:text-white">
                          ₹{amountToPay.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-text-secondary">GST Tax ({gstRate}%):</span>
                        <span className="font-mono font-bold text-text-primary dark:text-white">
                          ₹{taxToPay.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                      <div className="flex justify-between items-center pt-2.5 border-t border-border">
                        <span className="font-extrabold text-sm text-text-primary dark:text-white">Total Payable:</span>
                        <span className="font-mono text-xl font-black text-[#264baa] dark:text-blue-300">
                          ₹{totalToPay.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>

                    {/* If Already Paid */}
                    {isPaid ? (
                      <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300 space-y-2 text-xs">
                        <div className="flex items-center gap-2 font-bold text-sm">
                          <FiCheckCircle className="text-emerald-600 text-lg" />
                          Payment Confirmed & Verified!
                        </div>
                        <p className="text-text-secondary">
                          Your payment of ₹{totalToPay.toLocaleString('en-IN')} has been verified. Equipment reservation is locked with your franchise partner.
                        </p>
                        {epcAlloc.payment_notes && (
                          <div className="font-mono text-[11px] bg-white/60 dark:bg-black/30 p-2 rounded border border-emerald-500/20">
                            {epcAlloc.payment_notes}
                          </div>
                        )}
                      </div>
                    ) : (
                      /* ICICI Dedicated Virtual Account Transfer Card (Same as EPC Checkout) */
                      <div className="bg-gradient-to-br from-[#264baa]/10 via-surface to-[#264baa]/5 p-4 rounded-2xl border-2 border-[#264baa]/40 shadow-sm space-y-3.5">
                        <div className="flex items-center justify-between gap-2 border-b border-[#264baa]/20 pb-2.5">
                          <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 bg-[#264baa]/15 text-[#264baa] dark:text-blue-300 rounded border border-[#264baa]/25">
                            <span className="flex h-1.5 w-1.5 relative">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#264baa] opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#264baa]"></span>
                            </span>
                            ⚡ ICICI Virtual Account (Auto-Verified in 10s)
                          </span>
                          <span className="text-[10px] font-bold text-[#264baa] dark:text-blue-300 bg-[#264baa]/10 px-2 py-0.5 rounded border border-[#264baa]/30">
                            Zero Fees • RTGS / NEFT / UPI
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                          {/* Beneficiary */}
                          <div className="bg-surface p-2.5 rounded-lg border border-border flex justify-between items-center">
                            <div>
                              <span className="text-text-muted block text-[10px]">Beneficiary Name</span>
                              <span className="font-bold text-text-primary dark:text-white text-xs">
                                {iciciVanDetails?.beneficiary_name || 'SolarKits Technologies Pvt Ltd'}
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleCopyText(iciciVanDetails?.beneficiary_name || 'SolarKits Technologies Pvt Ltd', 'name')}
                              className="p-1 text-text-secondary hover:text-[#264baa]"
                              title="Copy Beneficiary Name"
                            >
                              {copiedField === 'name' ? <FiCheck className="text-emerald-500" /> : <FiCopy />}
                            </button>
                          </div>

                          {/* IFSC Code */}
                          <div className="bg-surface p-2.5 rounded-lg border border-border flex justify-between items-center">
                            <div>
                              <span className="text-text-muted block text-[10px]">IFSC Code</span>
                              <span className="font-mono font-black text-text-primary dark:text-white text-xs">
                                {iciciVanDetails?.ifsc_code || 'ICIC0000104'}
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleCopyText(iciciVanDetails?.ifsc_code || 'ICIC0000104', 'ifsc')}
                              className="p-1 text-text-secondary hover:text-[#264baa]"
                              title="Copy IFSC Code"
                            >
                              {copiedField === 'ifsc' ? <FiCheck className="text-emerald-500" /> : <FiCopy />}
                            </button>
                          </div>

                          {/* Highlighted VAN Box */}
                          <div className="bg-[#264baa]/10 dark:bg-[#264baa]/20 p-3 rounded-xl border-2 border-[#264baa]/50 flex justify-between items-center sm:col-span-2 shadow-sm">
                            <div>
                              <span className="text-[#264baa] dark:text-blue-300 block text-[10px] font-black uppercase tracking-wider">
                                Your Unique Virtual Account No (VAN)
                              </span>
                              <span className="font-mono font-black text-[#264baa] dark:text-blue-200 text-base tracking-wider">
                                {iciciVanDetails?.virtual_account_number || `SLRK${(user?.whatsapp || user?.mobile || '9876543210').slice(-10)}`}
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleCopyText(iciciVanDetails?.virtual_account_number || `SLRK${(user?.whatsapp || user?.mobile || '9876543210').slice(-10)}`, 'van')}
                              className="px-3 py-1.5 bg-[#264baa] hover:bg-[#1f3f91] text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-md shadow-[#264baa]/30 transition-all active:scale-95"
                            >
                              {copiedField === 'van' ? <FiCheck /> : <FiCopy />}
                              <span>{copiedField === 'van' ? 'Copied' : 'Copy VAN'}</span>
                            </button>
                          </div>
                        </div>

                        {/* UPI Quick Pay & Pulse Info */}
                        <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-lg bg-[#264baa]/10 border border-[#264baa]/25 text-[11px]">
                          <div className="flex items-center gap-1.5 text-[#264baa] dark:text-blue-200">
                            <FiCheckCircle className="text-sm text-[#264baa] dark:text-blue-400 shrink-0" />
                            <span>Auto-reconciliation in 10s</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-text-primary dark:text-white">
                              UPI: {iciciVanDetails?.upi_handle || `${iciciVanDetails?.virtual_account_number || 'SLRK9876543210'}@icici`}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleCopyText(iciciVanDetails?.upi_handle || `${iciciVanDetails?.virtual_account_number || 'SLRK9876543210'}@icici`, 'upi')}
                              className="font-bold text-[#264baa] dark:text-blue-400 hover:underline text-[11px]"
                            >
                              {copiedField === 'upi' ? 'Copied!' : 'Copy UPI'}
                            </button>
                          </div>
                        </div>

                        {/* Collapsible Manual Receipt Upload Section */}
                        <div className="pt-2 border-t border-border">
                          {activeUploadOrderId === order._id ? (
                            <div className="space-y-2.5 bg-surface p-3 rounded-xl border border-border">
                              <div className="flex justify-between items-center">
                                <label className="block text-xs font-bold text-text-primary dark:text-white">
                                  Upload Bank Transfer Receipt (UTR)
                                </label>
                                <button
                                  type="button"
                                  onClick={() => { setActiveUploadOrderId(null); setReceiptFile(null); }}
                                  className="text-[11px] text-text-secondary hover:text-text-primary"
                                >
                                  Cancel
                                </button>
                              </div>

                              <input
                                type="text"
                                placeholder="Enter Bank UTR / Transaction No."
                                value={manualUtr}
                                onChange={(e) => setManualUtr(e.target.value)}
                                className="w-full px-3 py-1.5 text-xs rounded-lg border border-border bg-surface-hover font-mono"
                              />

                              <input
                                type="file"
                                accept="image/*,.pdf"
                                onChange={(e) => setReceiptFile(e.target.files[0])}
                                className="block w-full text-xs text-text-secondary file:mr-3 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-[#264baa]/10 file:text-[#264baa] hover:file:bg-[#264baa]/20"
                              />

                              <button
                                type="button"
                                onClick={() => handleUpload(order._id)}
                                disabled={uploading}
                                className="w-full bg-[#264baa] hover:bg-[#1f3f91] text-white py-2 px-3 rounded-lg text-xs font-bold disabled:opacity-50 transition-all shadow"
                              >
                                {uploading ? 'Submitting Receipt...' : 'Submit Receipt for Accounts Verification'}
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setActiveUploadOrderId(order._id)}
                              className="w-full py-2 px-3 rounded-xl bg-surface hover:bg-surface-hover border border-border text-xs font-bold text-text-secondary hover:text-text-primary transition-all flex items-center justify-center gap-1.5"
                            >
                              <FiUploadCloud className="text-[#264baa]" />
                              <span>Already paid via Traditional Bank? Upload Slip / UTR</span>
                            </button>
                          )}
                        </div>
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
  );
}
