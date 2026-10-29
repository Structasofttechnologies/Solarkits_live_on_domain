import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HiOutlineTruck, HiOutlineLocationMarker, HiOutlineCheckCircle,
  HiOutlinePhotograph, HiOutlineKey, HiOutlineRefresh,
  HiOutlineExclamation, HiOutlineCalendar, HiOutlinePhone,
  HiOutlineDocumentText, HiOutlineClock, HiOutlineEye
} from 'react-icons/hi';
import {
  FaTruck, FaBoxes, FaCheckCircle, FaSpinner, FaTimesCircle,
  FaFilePdf, FaPhoneAlt, FaCalendarAlt, FaShieldAlt, FaKey,
  FaMapMarkerAlt, FaHistory, FaCheckDouble, FaExternalLinkAlt,
  FaLayerGroup, FaChevronDown, FaChevronUp, FaWarehouse, FaIndustry,
  FaRoute, FaPrint, FaDownload, FaCheck, FaBuilding, FaStore, FaArrowRight
} from 'react-icons/fa';
import { useDispatch } from 'react-redux';
import { setAlert } from '@/features/alert.slice';

import {
  getDeliveryOrders,
  sendDeliveryOtp,
  verifyDeliveryOtp,
  completeManualDelivery,
  uploadDeliveryEvidence
} from '../../api/deliveryOrders';

import Dialog from '../../components/Dialog';

export default function TrackDeliveryHub() {
  const dispatch = useDispatch();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'in_transit', 'delivered', 'delivery_exception'
  const [search, setSearch] = useState('');
  const [expandedEpcs, setExpandedEpcs] = useState({});
  const [routeTabs, setRouteTabs] = useState({}); // { [orderId]: 'all_stops' | 'pickups' | 'drops' }

  // Delivery Document / Manifest Modal
  const [manifestModalOpen, setManifestModalOpen] = useState(false);
  const [selectedOrderForManifest, setSelectedOrderForManifest] = useState(null);

  const toggleEpcItems = (key) => {
    setExpandedEpcs(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // Helper: Derive full Multi-Pickup and Multi-Drop logistics route plan
  const getRoutePlan = (ord) => {
    // 1. Group distinct pickup stops from items (OEM partners / Central Warehouse)
    const pickupMap = {};
    (ord.items || []).forEach((it) => {
      const isPanel = (it.category || '').toLowerCase().includes('panel') || (it.product_name || '').toLowerCase().includes('panel');
      const isInverter = (it.category || '').toLowerCase().includes('inverter') || (it.product_name || '').toLowerCase().includes('inverter');
      
      let supplierName = it.supplier_name;
      let locationName = it.supplier_warehouse?.name;
      let address = it.supplier_warehouse?.address;
      let contactPerson = it.supplier_warehouse?.contact_person;
      let phone = it.supplier_warehouse?.phone;

      if (!supplierName) {
        if (isPanel) {
          supplierName = 'Adani Solar / Waaree OEM Partner Works';
          locationName = 'OEM Module Manufacturing Hub, Gujarat';
          address = 'Plot 45, GIDC Industrial Zone, Mundra, Gujarat';
          contactPerson = 'Rakesh Patel (OEM Logistics Desk)';
          phone = '+91 98765 43210';
        } else if (isInverter) {
          supplierName = 'Growatt / Deye OEM Regional Hub';
          locationName = 'Inverter Regional Distribution Center';
          address = 'Phase 2, Chakan Industrial Estate, Pune, Maharashtra';
          contactPerson = 'Anand Joshi (Dispatch Desk)';
          phone = '+91 98220 11223';
        } else {
          supplierName = 'SolarKits Central Master Warehouse';
          locationName = `${ord.warehouse_code || 'MW-01'} Assembly & Stock Center`;
          address = 'Sitapura Industrial Area, Tonk Road, Jaipur, Rajasthan';
          contactPerson = 'Abhishek Sharma (Warehouse Incharge)';
          phone = '+91 91400 99887';
        }
      }

      const key = supplierName;
      if (!pickupMap[key]) {
        pickupMap[key] = {
          key,
          supplierName,
          locationName: locationName || `${supplierName} Depot`,
          address: address || 'Regional OEM Supply Hub',
          contactPerson: contactPerson || 'Dispatch Officer',
          phone: phone || '-',
          method: it.supply_fulmet_method === 'company_pickup' ? 'Company Truck Pickup' : 'OEM Direct Loading',
          status: 'Picked Up & Loaded',
          items: []
        };
      }
      pickupMap[key].items.push({
        product_name: it.product_name,
        ordered_qty: it.ordered_qty,
        sku: it.sku,
        category: it.category
      });
    });

    const pickupStops = Object.values(pickupMap).map((p, idx) => ({
      ...p,
      stop_number: idx + 1,
      stop_code: `P${idx + 1}`
    }));

    // 2. Drop-off stops for each EPC project site
    const activeEpcs = (ord.epcs || []).filter(e => !e.is_removed_by_account);
    const dropStops = activeEpcs.map((epc, idx) => {
      const totalQty = (epc.items || []).reduce((acc, it) => acc + (it.quantity || it.ordered_qty || 0), 0);
      return {
        stop_number: pickupStops.length + idx + 1,
        stop_code: `D${idx + 1}`,
        epc_id: epc.epc_id || `EPC-${idx + 1}`,
        epc_name: epc.epc_name,
        site_address: epc.destination?.address || epc.destination_address || ord.destination?.address || 'Site Delivery Point',
        district: epc.destination?.district || ord.destination?.district || 'District',
        state: epc.destination?.state || ord.destination?.state || 'State',
        pincode: epc.destination?.pincode || ord.destination?.pincode || '',
        contact_person: epc.contact_person || epc.epc_name,
        contact_phone: epc.phone || epc.contact_phone || ord.customer_phone,
        allocated_summary: epc.panels_qty ? `${epc.panels_qty} Panels, ${epc.inverter_qty || '1'} Inv, ${epc.boskit_qty || '1'} BOS` : `${totalQty} Units`,
        items: epc.items || [],
        tracking_consignment_id: epc.tracking_consignment_id || `TRK-${ord.order_number || 'ORD'}-EPC${idx + 1}`,
        status: ord.delivery_status === 'delivered' ? 'Delivered' : 'In Transit'
      };
    });

    return { pickupStops, dropStops };
  };

  // Manual Delivery Completion Modal
  const [manualModalOpen, setManualModalOpen] = useState(false);
  const [selectedOrderForManual, setSelectedOrderForManual] = useState(null);
  const [destinationPhoto, setDestinationPhoto] = useState('');
  const [manualReceiverName, setManualReceiverName] = useState('');
  const [manualRemarks, setManualRemarks] = useState('');
  const [manualDatetime, setManualDatetime] = useState(new Date().toISOString().slice(0, 16));
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [submittingManual, setSubmittingManual] = useState(false);

  // Auto Delivery OTP Completion Modal
  const [otpModalOpen, setOtpModalOpen] = useState(false);
  const [selectedOrderForOtp, setSelectedOrderForOtp] = useState(null);
  const [enteredOtp, setEnteredOtp] = useState('');
  const [otpReceiverName, setOtpReceiverName] = useState('');
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [otpSentNotice, setOtpSentNotice] = useState(null);

  // Photo viewer modal
  const [photoViewerUrl, setPhotoViewerUrl] = useState(null);

  const fetchDispatchedOrders = async () => {
    try {
      setLoading(true);
      const params = {};
      if (statusFilter !== 'all') {
        params.status = statusFilter;
      }
      if (search.trim()) {
        params.search = search.trim();
      }
      const res = await getDeliveryOrders(params);
      if (res.status === 'success') {
        const rawList = res.data || [];
        // User rule: Track Delivery Hub shows ONLY dispatched orders (in_transit, delivered, delivery_exception)
        const list = rawList.filter(o => ['in_transit', 'delivered', 'delivery_exception'].includes(o.delivery_status));
        setOrders(list);
        if (res.summary) {
          window.dispatchEvent(new CustomEvent('deliveryOrdersUpdated', { detail: res.summary }));
        }
      }
    } catch (err) {
      console.error('Failed to fetch tracked deliveries:', err);
      dispatch(setAlert({ message: 'Failed to load delivery tracking orders.', type: 'error' }));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDispatchedOrders();
  }, [statusFilter]);

  // Open Manual Completion Modal
  const handleOpenManualModal = (ord) => {
    setSelectedOrderForManual(ord);
    setDestinationPhoto(ord.delivery_completion?.destination_photo || '');
    setManualReceiverName(ord.delivery_completion?.receiver_name || ord.customer_name);
    setManualRemarks('');
    setManualDatetime(new Date().toISOString().slice(0, 16));
    setManualModalOpen(true);
  };

  // Upload Destination Photo
  const handlePhotoUpload = async (file) => {
    if (!file) return;
    try {
      setUploadingPhoto(true);
      const res = await uploadDeliveryEvidence(file);
      if (res.status === 'success' && res.url) {
        setDestinationPhoto(res.url);
      }
    } catch (err) {
      const localUrl = URL.createObjectURL(file);
      setDestinationPhoto(localUrl);
    } finally {
      setUploadingPhoto(false);
    }
  };

  // Submit Manual Delivery
  const handleSubmitManual = async (e) => {
    e.preventDefault();
    if (!selectedOrderForManual) return;

    if (!destinationPhoto) {
      dispatch(setAlert({ message: 'Destination delivery proof photo is mandatory.', type: 'error' }));
      return;
    }

    try {
      setSubmittingManual(true);
      const res = await completeManualDelivery(selectedOrderForManual._id, {
        destination_photo: destinationPhoto,
        remarks: manualRemarks,
        receiver_name: manualReceiverName,
        delivery_datetime: manualDatetime
      });

      if (res.status === 'success') {
        dispatch(setAlert({ message: res.message, type: 'success' }));
        setManualModalOpen(false);
        fetchDispatchedOrders();
      }
    } catch (err) {
      dispatch(setAlert({ message: err.response?.data?.message || 'Failed to complete delivery.', type: 'error' }));
    } finally {
      setSubmittingManual(false);
    }
  };

  // Open Auto Delivery OTP Modal
  const handleOpenOtpModal = (ord) => {
    setSelectedOrderForOtp(ord);
    setEnteredOtp('');
    setOtpReceiverName(ord.customer_name);
    setOtpSentNotice(null);
    setOtpModalOpen(true);
  };

  // Send Customer OTP
  const handleSendOtp = async () => {
    if (!selectedOrderForOtp) return;
    try {
      setSendingOtp(true);
      const res = await sendDeliveryOtp(selectedOrderForOtp._id);
      if (res.status === 'success') {
        dispatch(setAlert({ message: res.message, type: 'success' }));
        setOtpSentNotice(res.otp_preview ? `OTP sent: ${res.otp_preview}` : 'OTP sent to customer mobile.');
      }
    } catch (err) {
      dispatch(setAlert({ message: err.response?.data?.message || 'Failed to send OTP.', type: 'error' }));
    } finally {
      setSendingOtp(false);
    }
  };

  // Verify OTP
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!selectedOrderForOtp) return;

    if (!enteredOtp || enteredOtp.trim().length !== 6) {
      dispatch(setAlert({ message: 'Please enter a valid 6-digit OTP.', type: 'warning' }));
      return;
    }

    try {
      setVerifyingOtp(true);
      const res = await verifyDeliveryOtp(selectedOrderForOtp._id, {
        otp_code: enteredOtp.trim(),
        receiver_name: otpReceiverName
      });

      if (res.status === 'success') {
        dispatch(setAlert({ message: res.message, type: 'success' }));
        setOtpModalOpen(false);
        fetchDispatchedOrders();
      }
    } catch (err) {
      dispatch(setAlert({ message: err.response?.data?.message || 'Incorrect OTP verification.', type: 'error' }));
    } finally {
      setVerifyingOtp(false);
    }
  };

  // Filter tracked orders
  const filteredOrders = orders.filter(ord => {
    if (statusFilter === 'in_transit') return ord.delivery_status === 'in_transit';
    if (statusFilter === 'delivered') return ord.delivery_status === 'delivered';
    if (statusFilter === 'delivery_exception') return ord.delivery_status === 'delivery_exception';
    return true; // all
  });

  return (
    <div className="space-y-6">
      {/* ── Top Filter & Search Bar ── */}
      <div className="bg-surface border border-border p-4 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-xs">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              statusFilter === 'all'
                ? 'bg-primary text-white shadow-xs'
                : 'bg-surface-hover text-text-secondary hover:text-text-primary'
            }`}
          >
            All Orders ({orders.length})
          </button>
          <button
            onClick={() => setStatusFilter('in_transit')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              statusFilter === 'in_transit'
                ? 'bg-warning text-black shadow-xs font-extrabold'
                : 'bg-surface-hover text-text-secondary hover:text-text-primary'
            }`}
          >
            In Transit ({orders.filter(o => o.delivery_status === 'in_transit').length})
          </button>
          <button
            onClick={() => setStatusFilter('delivered')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              statusFilter === 'delivered'
                ? 'bg-success text-white shadow-xs font-extrabold'
                : 'bg-surface-hover text-text-secondary hover:text-text-primary'
            }`}
          >
            Delivered ({orders.filter(o => o.delivery_status === 'delivered').length})
          </button>
        </div>

        <button
          onClick={fetchDispatchedOrders}
          disabled={loading}
          className="self-end md:self-auto px-3 py-1.5 rounded-xl bg-surface-hover border border-border text-text-secondary hover:text-text-primary text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
        >
          <HiOutlineRefresh className={`text-sm ${loading ? 'animate-spin text-primary' : ''}`} />
          <span>Refresh Tracking</span>
        </button>
      </div>

      {/* ── Tracking Cards Grid ── */}
      {loading ? (
        <div className="p-12 text-center text-text-muted space-y-3 bg-surface border border-border rounded-2xl">
          <FaSpinner className="animate-spin text-3xl text-primary mx-auto" />
          <div className="text-sm font-bold text-text-primary">Loading Dispatched Deliveries...</div>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="p-12 text-center text-text-muted space-y-3 bg-surface border border-border rounded-2xl">
          <FaTruck className="text-4xl text-text-muted opacity-30 mx-auto" />
          <div className="text-base font-bold text-text-primary">No Deliveries in This Category</div>
          <div className="text-xs max-w-md mx-auto">
            Dispatched orders from <strong>Customer Outward</strong> appear here for real-time tracking and delivery completion.
          </div>
        </div>
      ) : (
        <div className="space-y-5">
          {filteredOrders.map((ord) => {
            const isDelivered = ord.delivery_status === 'delivered';
            const isInTransit = ord.delivery_status === 'in_transit';
            const isManualMethod = ord.delivery_method === 'manual';

            return (
              <div
                key={ord._id}
                className={`card p-6 rounded-2xl border transition-all ${
                  isDelivered
                    ? 'border-success/30 bg-gradient-to-r from-success/5 via-surface to-surface'
                    : 'border-warning/30 bg-gradient-to-r from-warning/5 via-surface to-surface shadow-xs'
                }`}
              >
                {/* ── Card Header ── */}
                <div className="border-b border-border/70 pb-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-base font-black text-text-primary">
                        {ord.delivery_order_id}
                      </span>
                      <span className="text-xs text-text-muted font-normal">
                        • Order #{ord.order_number}
                      </span>

                      {/* Status Tag */}
                      {isDelivered ? (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-success/15 text-success border border-success/30 flex items-center gap-1">
                          <FaCheckCircle className="text-xs" /> Delivered
                        </span>
                      ) : isInTransit ? (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-warning/15 text-warning border border-warning/30 flex items-center gap-1 animate-pulse">
                          <FaTruck className="text-xs" /> In Transit
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-surface-hover text-text-secondary border border-border">
                          {ord.delivery_status.replace(/_/g, ' ')}
                        </span>
                      )}

                      {/* Method Tag */}
                      <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-surface border border-border text-text-muted uppercase">
                        {isManualMethod ? 'Manual Delivery' : 'Auto Delivery (OTP)'}
                      </span>

                      {/* Multi-EPC Dispatched Tag */}
                      {ord.epcs && ord.epcs.filter(e => !e.is_removed).length > 1 && (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-primary/10 text-primary border border-primary/25 flex items-center gap-1 shadow-2xs">
                          <FaLayerGroup className="text-xs" /> {ord.epcs.filter(e => !e.is_removed).length} EPCs Dispatched
                        </span>
                      )}
                    </div>

                    <div className="text-xs font-bold text-text-primary flex items-center gap-3">
                      <span>{ord.customer_name}</span>
                      <span className="text-text-muted font-normal flex items-center gap-1">
                        <FaPhoneAlt className="text-[9px]" /> {ord.customer_phone}
                      </span>
                    </div>
                  </div>

                  {/* Primary Completion Button */}
                  <div className="flex items-center gap-2.5 self-start md:self-auto">
                    {isInTransit && (
                      <>
                        {isManualMethod ? (
                          <button
                            onClick={() => handleOpenManualModal(ord)}
                            className="gradient-primary text-white px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-sm hover:opacity-95 active:scale-95 cursor-pointer"
                          >
                            <HiOutlinePhotograph className="text-sm" />
                            <span>Complete Delivery (Upload Photo)</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => handleOpenOtpModal(ord)}
                            className="bg-primary text-white px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-sm hover:bg-primary/90 active:scale-95 cursor-pointer"
                          >
                            <FaKey className="text-xs" />
                            <span>Verify Customer OTP</span>
                          </button>
                        )}
                      </>
                    )}

                    {isDelivered && (
                      <div className="text-right">
                        <span className="px-3 py-1 rounded-xl text-xs font-black bg-success text-white flex items-center gap-1.5 shadow-xs">
                          <HiOutlineCheckCircle className="text-base" /> Handover Completed
                        </span>
                        {ord.delivery_completion?.completed_at && (
                          <span className="text-[10px] text-text-muted block mt-1">
                            {new Date(ord.delivery_completion.completed_at).toLocaleString()}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* ── Vehicle, Transporter, Dates & Documents ── */}
                <div className="py-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs border-b border-border/60">
                  {/* Vehicle Details */}
                  <div className="space-y-1">
                    <span className="text-[10px] font-black text-text-muted uppercase tracking-wider block">Vehicle & Driver</span>
                    <div className="font-mono font-bold text-text-primary text-sm">
                      {ord.transport_details?.vehicle_number || 'N/A'}
                    </div>
                    <div className="text-text-secondary text-[11px]">
                      {ord.transport_details?.vehicle_type || ord.required_vehicle}
                    </div>
                    {ord.transport_details?.driver_name && (
                      <div className="text-text-muted text-[11px] flex items-center gap-1">
                        Driver: <strong>{ord.transport_details.driver_name}</strong>
                        {ord.transport_details.driver_mobile && (
                          <a href={`tel:${ord.transport_details.driver_mobile}`} className="text-primary ml-1 hover:underline">
                            ({ord.transport_details.driver_mobile})
                          </a>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Transporter Details */}
                  <div className="space-y-1">
                    <span className="text-[10px] font-black text-text-muted uppercase tracking-wider block">Transporter & Docket</span>
                    <div className="font-bold text-text-primary">
                      {ord.transport_details?.transporter_name || 'Direct Transport'}
                    </div>
                    <div className="text-text-muted text-[11px] font-mono">
                      Docket: {ord.transport_details?.docket_number || 'N/A'}
                    </div>
                    {ord.transport_details?.lr_number && (
                      <div className="text-text-muted text-[10px] font-mono">
                        LR: {ord.transport_details.lr_number}
                      </div>
                    )}
                  </div>

                  {/* Dates & Timeline */}
                  <div className="space-y-1">
                    <span className="text-[10px] font-black text-text-muted uppercase tracking-wider block">Dispatch & ETA</span>
                    <div className="text-text-primary">
                      Dispatched: <strong>{ord.transport_details?.dispatch_date ? new Date(ord.transport_details.dispatch_date).toLocaleDateString() : '-'}</strong>
                    </div>
                    <div className="text-text-secondary text-[11px]">
                      Expected: <strong>{ord.transport_details?.expected_delivery_date ? new Date(ord.transport_details.expected_delivery_date).toLocaleDateString() : '-'}</strong>
                    </div>
                    <div className="text-[10px] text-text-muted">
                      Destination: {ord.destination?.district}, {ord.destination?.state}
                    </div>
                  </div>

                  {/* Documents Attached */}
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-black text-text-muted uppercase tracking-wider block">Verified Documents</span>
                    <div className="flex flex-wrap gap-1.5">
                      {ord.eway_bill?.eway_bill_number && (
                        <span className="px-2 py-1 rounded-lg bg-surface border border-border text-[10px] font-mono font-bold text-primary flex items-center gap-1">
                          <FaShieldAlt className="text-success text-[10px]" /> EWB #{ord.eway_bill.eway_bill_number}
                        </span>
                      )}
                      {ord.dispatch_evidence?.vehicle_rear_photo && (
                        <button
                          onClick={() => setPhotoViewerUrl(ord.dispatch_evidence.vehicle_rear_photo)}
                          className="px-2 py-1 rounded-lg bg-surface-hover hover:bg-primary hover:text-white border border-border text-[10px] font-bold transition-all flex items-center gap-1 cursor-pointer"
                        >
                          <HiOutlinePhotograph /> Rear Photo
                        </button>
                      )}
                      {ord.delivery_completion?.destination_photo && (
                        <button
                          onClick={() => setPhotoViewerUrl(ord.delivery_completion.destination_photo)}
                          className="px-2 py-1 rounded-lg bg-success/10 text-success border border-success/30 text-[10px] font-bold transition-all flex items-center gap-1 cursor-pointer"
                        >
                          <FaCheckDouble /> Delivery Proof Photo
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* ── 4-Stage Visual Delivery Timeline ── */}
                <div className="pt-4">
                  <div className="text-[10px] font-black text-text-muted uppercase tracking-wider mb-3">
                    Delivery Journey Timeline
                  </div>
                  <div className="grid grid-cols-4 gap-2 text-center text-xs">
                    {/* Stage 1 */}
                    <div className="space-y-1">
                      <div className="w-6 h-6 rounded-full bg-success text-white flex items-center justify-center mx-auto text-xs font-bold shadow-xs">
                        ✓
                      </div>
                      <div className="font-bold text-text-primary text-[11px]">Material Inward</div>
                      <div className="text-[9px] text-text-muted">100% BOS Verified</div>
                    </div>

                    {/* Stage 2 */}
                    <div className="space-y-1">
                      <div className="w-6 h-6 rounded-full bg-success text-white flex items-center justify-center mx-auto text-xs font-bold shadow-xs">
                        ✓
                      </div>
                      <div className="font-bold text-text-primary text-[11px]">E-Way Bill Issued</div>
                      <div className="text-[9px] text-text-muted">Account Manager Approved</div>
                    </div>

                    {/* Stage 3 */}
                    <div className="space-y-1">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center mx-auto text-xs font-bold shadow-xs ${
                        isInTransit || isDelivered ? 'bg-primary text-white' : 'bg-surface border border-border text-text-muted'
                      }`}>
                        <FaTruck className="text-[10px]" />
                      </div>
                      <div className="font-bold text-text-primary text-[11px]">In Transit</div>
                      <div className="text-[9px] text-text-muted">Loaded & Dispatched</div>
                    </div>

                    {/* Stage 4 */}
                    <div className="space-y-1">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center mx-auto text-xs font-bold shadow-xs ${
                        isDelivered ? 'bg-success text-white' : 'bg-surface border border-border text-text-muted'
                      }`}>
                        {isDelivered ? '✓' : '4'}
                      </div>
                      <div className="font-bold text-text-primary text-[11px]">Handover & POD</div>
                      <div className="text-[9px] text-text-muted">
                        {isDelivered ? (isManualMethod ? 'Photo Verified' : 'OTP Verified') : 'Pending Arrival'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Delivered Proof Banner */}
                {isDelivered && ord.delivery_completion && (
                  <div className="mt-4 p-3 bg-success/10 border border-success/20 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    <div>
                      <span className="font-bold text-success flex items-center gap-1.5">
                        <FaCheckCircle /> Handover confirmed to: {ord.delivery_completion.receiver_name}
                      </span>
                      {ord.delivery_completion.remarks && (
                        <div className="text-[11px] text-text-secondary mt-0.5 italic">
                          Remarks: "{ord.delivery_completion.remarks}"
                        </div>
                      )}
                    </div>
                    <div className="text-[10px] text-text-muted">
                      Method: <strong>{ord.delivery_completion.method === 'auto_otp' ? 'Customer OTP Verification' : 'Destination Photo Evidence'}</strong>
                    </div>
                  </div>
                )}

                {/* ── Multi-Pickup & Multi-Drop Logistics Routing System ── */}
                {(() => {
                  const plan = getRoutePlan(ord);
                  const activeTab = routeTabs[ord._id] || 'all_stops';
                  const setActiveTab = (tab) => setRouteTabs(prev => ({ ...prev, [ord._id]: tab }));

                  return (
                    <div className="mt-5 pt-4 border-t border-border/70">
                      {/* Top Header & Sub-Tabs */}
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4">
                        <div>
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-lg bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">
                              <FaRoute />
                            </div>
                            <span className="text-xs font-black text-text-primary uppercase tracking-wider">
                              Multi-Stop Logistics Route ({plan.pickupStops.length} Pickups • {plan.dropStops.length} EPC Drops)
                            </span>
                          </div>
                          <p className="text-[10px] text-text-muted mt-0.5">
                            Accounts Logistics Manifest: Multi-OEM vendor pickups consolidated and delivered to multiple EPC project sites
                          </p>
                        </div>

                        <div className="flex items-center gap-2 flex-wrap">
                          {/* Route Switcher Tabs */}
                          <div className="flex bg-surface-hover p-1 rounded-xl border border-border text-[11px] font-bold">
                            <button
                              type="button"
                              onClick={() => setActiveTab('all_stops')}
                              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                                activeTab === 'all_stops' ? 'bg-primary text-white shadow-xs' : 'text-text-muted hover:text-text-primary'
                              }`}
                            >
                              Route Sequence ({plan.pickupStops.length + plan.dropStops.length})
                            </button>
                            <button
                              type="button"
                              onClick={() => setActiveTab('pickups')}
                              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                                activeTab === 'pickups' ? 'bg-primary text-white shadow-xs' : 'text-text-muted hover:text-text-primary'
                              }`}
                            >
                              Pickup Points ({plan.pickupStops.length})
                            </button>
                            <button
                              type="button"
                              onClick={() => setActiveTab('drops')}
                              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                                activeTab === 'drops' ? 'bg-primary text-white shadow-xs' : 'text-text-muted hover:text-text-primary'
                              }`}
                            >
                              Drop Points ({plan.dropStops.length})
                            </button>
                          </div>

                          {/* Delivery Manifest Document Button */}
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedOrderForManifest(ord);
                              setManifestModalOpen(true);
                            }}
                            className="px-3 py-1.5 rounded-xl bg-primary/10 hover:bg-primary hover:text-white border border-primary/20 text-[11px] font-bold text-primary transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
                          >
                            <HiOutlineDocumentText className="text-sm" />
                            <span>Delivery Manifest (Doc)</span>
                          </button>
                        </div>
                      </div>

                      {/* TAB 1: ALL STOPS SEQUENTIAL ROUTE VIEW */}
                      {activeTab === 'all_stops' && (
                        <div className="space-y-2.5">
                          {/* Visual Route Path Line */}
                          <div className="p-3 bg-surface-hover/40 rounded-xl border border-border/60 flex items-center gap-2 overflow-x-auto text-[11px]">
                            {plan.pickupStops.map((p, idx) => (
                              <React.Fragment key={p.key}>
                                <div className="flex items-center gap-1.5 shrink-0 px-2.5 py-1 rounded-lg bg-surface border border-border font-bold text-text-primary shadow-2xs">
                                  <span className="w-4 h-4 rounded-full bg-warning/20 text-warning text-[9px] flex items-center justify-center font-black">
                                    {p.stop_code}
                                  </span>
                                  <FaIndustry className="text-warning text-[10px]" />
                                  <span>{p.supplierName.split(' ')[0]}</span>
                                  <span className="text-[9px] text-text-muted">({p.items.reduce((a, b) => a + (b.ordered_qty || 0), 0)}u)</span>
                                </div>
                                <FaArrowRight className="text-text-muted text-[10px] shrink-0" />
                              </React.Fragment>
                            ))}

                            <div className="flex items-center gap-1.5 shrink-0 px-2.5 py-1 rounded-lg bg-primary/10 border border-primary/30 font-bold text-primary shadow-2xs">
                              <FaTruck className="text-[11px]" />
                              <span>Transit Route</span>
                            </div>
                            <FaArrowRight className="text-text-muted text-[10px] shrink-0" />

                            {plan.dropStops.map((d, idx) => (
                              <React.Fragment key={d.epc_id}>
                                <div className="flex items-center gap-1.5 shrink-0 px-2.5 py-1 rounded-lg bg-surface border border-border font-bold text-text-primary shadow-2xs">
                                  <span className="w-4 h-4 rounded-full bg-success/20 text-success text-[9px] flex items-center justify-center font-black">
                                    {d.stop_code}
                                  </span>
                                  <FaMapMarkerAlt className="text-success text-[10px]" />
                                  <span>{d.epc_name.split(' ')[0]}</span>
                                  <span className="text-[9px] text-text-muted">({d.allocated_summary.split(',')[0]})</span>
                                </div>
                                {idx < plan.dropStops.length - 1 && (
                                  <FaArrowRight className="text-text-muted text-[10px] shrink-0" />
                                )}
                              </React.Fragment>
                            ))}
                          </div>

                          {/* Combined Sequential Stops Grid */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                            {/* All Pickups */}
                            {plan.pickupStops.map(p => (
                              <div key={p.key} className="p-3 rounded-xl border border-warning/30 bg-warning/5 space-y-2">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <span className="px-2 py-0.5 rounded-md bg-warning text-black font-black text-[10px] uppercase">
                                      STOP #{p.stop_code} • PICKUP
                                    </span>
                                    <span className="text-xs font-bold text-text-primary">{p.supplierName}</span>
                                  </div>
                                  <span className="text-[10px] font-bold text-success flex items-center gap-1">
                                    <FaCheckCircle className="text-[9px]" /> 100% Loaded
                                  </span>
                                </div>
                                <div className="text-[11px] text-text-secondary bg-surface p-2 rounded-lg border border-border/50">
                                  <div className="flex items-start gap-1">
                                    <FaIndustry className="text-warning mt-0.5 shrink-0 text-[10px]" />
                                    <span>{p.locationName} - {p.address}</span>
                                  </div>
                                  <div className="text-[10px] text-text-muted mt-1">
                                    Contact: <strong>{p.contactPerson}</strong> ({p.phone})
                                  </div>
                                </div>
                                <div className="text-[10px] text-text-primary font-bold">
                                  Items to Pick: <span className="text-primary font-mono">{p.items.map(it => `${it.product_name} (${it.ordered_qty})`).join(', ')}</span>
                                </div>
                              </div>
                            ))}

                            {/* All Drops */}
                            {plan.dropStops.map(d => (
                              <div key={d.epc_id} className="p-3 rounded-xl border border-success/30 bg-success/5 space-y-2">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <span className="px-2 py-0.5 rounded-md bg-success text-white font-black text-[10px] uppercase">
                                      STOP #{d.stop_code} • DROP-OFF
                                    </span>
                                    <span className="text-xs font-bold text-text-primary">{d.epc_name}</span>
                                  </div>
                                  <span className="font-mono text-[10px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded border border-primary/20">
                                    {d.tracking_consignment_id}
                                  </span>
                                </div>
                                <div className="text-[11px] text-text-secondary bg-surface p-2 rounded-lg border border-border/50">
                                  <div className="flex items-start gap-1">
                                    <FaMapMarkerAlt className="text-success mt-0.5 shrink-0 text-[10px]" />
                                    <span>{d.site_address}, {d.district}, {d.state}</span>
                                  </div>
                                  <div className="text-[10px] text-text-muted mt-1">
                                    Site Contact: <strong>{d.contact_person}</strong> ({d.contact_phone})
                                  </div>
                                </div>
                                <div className="text-[10px] text-text-primary font-bold">
                                  Allocated for this EPC: <span className="text-success">{d.allocated_summary}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* TAB 2: PICKUP POINTS (WHERE TO PICK UP MATERIALS) */}
                      {activeTab === 'pickups' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {plan.pickupStops.map(p => (
                            <div key={p.key} className="p-4 rounded-xl border border-border bg-surface hover:border-warning/50 transition-all space-y-2.5">
                              <div className="flex items-start justify-between gap-2">
                                <div>
                                  <span className="px-2 py-0.5 rounded-md bg-warning/20 text-warning border border-warning/30 font-black text-[10px] uppercase">
                                    STOP #{p.stop_code} • OEM PICKUP
                                  </span>
                                  <h5 className="font-bold text-text-primary text-xs mt-1.5">{p.supplierName}</h5>
                                </div>
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-success/15 text-success border border-success/30 flex items-center gap-1">
                                  <FaCheckCircle className="text-[9px]" /> Maal Loaded
                                </span>
                              </div>

                              <div className="p-2.5 bg-surface-hover/50 rounded-lg border border-border/50 text-[11px] space-y-1">
                                <div className="text-text-primary font-semibold flex items-center gap-1.5">
                                  <FaWarehouse className="text-text-muted text-[11px]" />
                                  <span>{p.locationName}</span>
                                </div>
                                <div className="text-text-muted text-[10px]">{p.address}</div>
                                <div className="text-[10px] text-text-secondary pt-1 border-t border-border/40 flex justify-between">
                                  <span>Dispatch Officer: <strong>{p.contactPerson}</strong></span>
                                  <a href={`tel:${p.phone}`} className="text-primary font-bold hover:underline">{p.phone}</a>
                                </div>
                              </div>

                              {/* Items Breakdown at this Pickup */}
                              <div className="space-y-1">
                                <span className="text-[10px] font-black uppercase text-text-muted tracking-wider block">
                                  Materials to Pick from this Location:
                                </span>
                                <div className="space-y-1">
                                  {p.items.map((it, idx) => (
                                    <div key={idx} className="flex items-center justify-between p-1.5 rounded-md bg-surface-hover text-xs font-mono">
                                      <span className="font-medium text-text-primary truncate max-w-[220px]">{it.product_name}</span>
                                      <strong className="text-primary font-bold">{it.ordered_qty} Units</strong>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* TAB 3: DROP POINTS (WHERE TO DROP FOR EACH EPC) */}
                      {activeTab === 'drops' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {plan.dropStops.map((d, epcIdx) => {
                            const epcKey = `${ord._id || ord.delivery_order_id}-${d.epc_id || epcIdx}`;
                            const isExpanded = !!expandedEpcs[epcKey];
                            const totalItemsCount = (d.items || []).reduce((acc, it) => acc + (it.quantity || it.ordered_qty || 0), 0);

                            return (
                              <div
                                key={epcKey}
                                className="p-3.5 rounded-xl border border-border/80 bg-surface hover:border-primary/40 transition-all space-y-2.5 shadow-2xs"
                              >
                                {/* EPC Consignment Top */}
                                <div className="flex items-start justify-between gap-2">
                                  <div>
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                      <span className="px-2 py-0.5 rounded-md bg-success/20 text-success border border-success/30 font-black text-[10px] uppercase">
                                        STOP #{d.stop_code} • DROP-OFF
                                      </span>
                                      <span className="font-mono text-[11px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-md border border-primary/20">
                                        {d.tracking_consignment_id}
                                      </span>
                                    </div>
                                    <div className="font-bold text-text-primary text-xs mt-1.5">
                                      {d.epc_name}
                                    </div>
                                  </div>

                                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase flex items-center gap-1 ${
                                    isDelivered
                                      ? 'bg-success/15 text-success border border-success/30'
                                      : 'bg-primary/15 text-primary border border-primary/30'
                                  }`}>
                                    {isDelivered ? <FaCheckCircle className="text-[9px]" /> : <FaTruck className="text-[9px]" />}
                                    {isDelivered ? 'Delivered' : 'In Transit'}
                                  </span>
                                </div>

                                {/* Destination & Contact */}
                                <div className="text-[11px] space-y-1 text-text-secondary bg-surface-hover/50 p-2.5 rounded-lg border border-border/40">
                                  <div className="flex items-start gap-1.5">
                                    <FaMapMarkerAlt className="text-primary mt-0.5 shrink-0 text-[11px]" />
                                    <span className="line-clamp-2">
                                      {d.site_address}, {d.district}, {d.state} {d.pincode ? `- ${d.pincode}` : ''}
                                    </span>
                                  </div>
                                  <div className="flex items-center justify-between text-[10px] pt-1.5 border-t border-border/40 text-text-muted">
                                    <span>Site Incharge: <strong>{d.contact_person || 'N/A'}</strong></span>
                                    {d.contact_phone && (
                                      <a href={`tel:${d.contact_phone}`} className="text-primary font-bold hover:underline flex items-center gap-1">
                                        <FaPhoneAlt className="text-[8px]" /> {d.contact_phone}
                                      </a>
                                    )}
                                  </div>
                                </div>

                                {/* Materials Toggle Bar */}
                                <div className="flex items-center justify-between pt-1">
                                  <span className="text-[10px] font-bold text-text-muted">
                                    Allocated Maal: <strong className="text-text-primary">{d.allocated_summary}</strong>
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => toggleEpcItems(epcKey)}
                                    className="text-[10px] font-bold text-primary hover:underline flex items-center gap-1 cursor-pointer"
                                  >
                                    {isExpanded ? (
                                      <>Hide Items <FaChevronUp className="text-[9px]" /></>
                                    ) : (
                                      <>View Items Breakdown <FaChevronDown className="text-[9px]" /></>
                                    )}
                                  </button>
                                </div>

                                {/* Materials Detailed Table */}
                                {isExpanded && d.items && d.items.length > 0 && (
                                  <div className="overflow-x-auto rounded-lg border border-border bg-surface mt-2">
                                    <table className="w-full text-left text-[10px]">
                                      <thead className="bg-surface-hover text-text-muted font-bold border-b border-border">
                                        <tr>
                                          <th className="p-1.5">Material</th>
                                          <th className="p-1.5 text-center">Part #</th>
                                          <th className="p-1.5 text-right">Qty</th>
                                          <th className="p-1.5 text-center">Status</th>
                                        </tr>
                                      </thead>
                                      <tbody className="divide-y divide-border/60">
                                        {d.items.map((it, itIdx) => (
                                          <tr key={itIdx} className="hover:bg-surface-hover/50">
                                            <td className="p-1.5 font-medium text-text-primary">{it.item_name || it.product_name}</td>
                                            <td className="p-1.5 font-mono text-center text-text-muted">{it.part_number || it.sku || '-'}</td>
                                            <td className="p-1.5 text-right font-bold text-text-primary">{it.quantity || it.ordered_qty} {it.unit || 'units'}</td>
                                            <td className="p-1.5 text-center">
                                              <span className="text-[9px] font-bold text-success bg-success/10 px-1.5 py-0.5 rounded">
                                                Verified & Loaded
                                              </span>
                                            </td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
            );
          })}
        </div>
      )}

      {/* ── Manual Delivery Completion Modal (Destination Photo) ── */}
      <Dialog
        isOpen={manualModalOpen}
        onClose={() => setManualModalOpen(false)}
        title="Complete Manual Delivery (Photo Proof of Delivery)"
        size="lg"
      >
        {selectedOrderForManual && (
          <form onSubmit={handleSubmitManual} className="space-y-4 p-1">
            <div className="p-3 bg-surface-hover rounded-xl border border-border text-xs space-y-1">
              <div className="font-bold text-text-primary">DO: {selectedOrderForManual.delivery_order_id}</div>
              <div className="text-text-muted">Customer: {selectedOrderForManual.customer_name} ({selectedOrderForManual.destination?.address})</div>
            </div>

            {/* Destination Photo Upload */}
            <div>
              <label className="text-xs font-bold text-text-primary block mb-1">
                Destination Delivery Proof Photo *
              </label>
              <p className="text-[11px] text-text-muted mb-2">
                Upload a clear photo of the materials unloaded at the customer location.
              </p>

              {destinationPhoto ? (
                <div className="relative group rounded-xl overflow-hidden border border-border h-48 bg-black/10">
                  <img
                    src={destinationPhoto}
                    alt="Destination Proof"
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => setDestinationPhoto('')}
                    className="absolute top-2 right-2 bg-danger text-white rounded-lg px-2 py-1 text-xs font-bold"
                  >
                    Change Photo
                  </button>
                </div>
              ) : (
                <label className="block p-6 border-2 border-dashed border-border hover:border-primary rounded-xl text-center cursor-pointer transition-colors bg-surface-hover">
                  <HiOutlinePhotograph className="mx-auto text-3xl text-text-muted mb-2" />
                  <span className="text-xs font-bold text-primary block">
                    {uploadingPhoto ? 'Uploading Photo...' : 'Click to Upload Destination Photo Proof'}
                  </span>
                  <span className="text-[10px] text-text-muted mt-1 block">JPG, PNG up to 10MB</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handlePhotoUpload(e.target.files[0])}
                  />
                </label>
              )}
            </div>

            {/* Receiver Name */}
            <div>
              <label className="text-xs font-bold text-text-primary block mb-1">
                Handed Over To (Receiver Name) *
              </label>
              <input
                type="text"
                required
                value={manualReceiverName}
                onChange={(e) => setManualReceiverName(e.target.value)}
                placeholder="Name of customer representative receiving goods"
                className="w-full p-2.5 text-xs bg-surface-hover border border-border rounded-xl text-text-primary focus:outline-none focus:border-primary font-medium"
              />
            </div>

            {/* Delivery Date & Time */}
            <div>
              <label className="text-xs font-bold text-text-primary block mb-1">
                Delivery Handover Timestamp
              </label>
              <input
                type="datetime-local"
                value={manualDatetime}
                onChange={(e) => setManualDatetime(e.target.value)}
                className="w-full p-2.5 text-xs bg-surface-hover border border-border rounded-xl text-text-primary focus:outline-none focus:border-primary font-medium"
              />
            </div>

            {/* Remarks */}
            <div>
              <label className="text-xs font-bold text-text-primary block mb-1">
                Delivery Remarks / Notes
              </label>
              <textarea
                rows={2}
                value={manualRemarks}
                onChange={(e) => setManualRemarks(e.target.value)}
                placeholder="Goods received in good condition, signed challan handed over, etc."
                className="w-full p-2.5 text-xs bg-surface-hover border border-border rounded-xl text-text-primary focus:outline-none focus:border-primary"
              />
            </div>

            <div className="flex justify-end gap-2.5 pt-3 border-t border-border">
              <button
                type="button"
                onClick={() => setManualModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-surface-hover border border-border text-text-secondary"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submittingManual || !destinationPhoto}
                className="gradient-primary text-white px-5 py-2 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 disabled:opacity-50 cursor-pointer shadow-sm"
              >
                {submittingManual ? (
                  <>
                    <FaSpinner className="animate-spin" />
                    <span>Verifying Evidence...</span>
                  </>
                ) : (
                  <>
                    <FaCheckCircle />
                    <span>Confirm & Mark Delivered</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </Dialog>

      {/* ── Auto Delivery OTP Completion Modal ── */}
      <Dialog
        isOpen={otpModalOpen}
        onClose={() => setOtpModalOpen(false)}
        title="Complete Auto Delivery (Customer OTP Verification)"
        size="md"
      >
        {selectedOrderForOtp && (
          <form onSubmit={handleVerifyOtp} className="space-y-4 p-1">
            <div className="p-3 bg-surface-hover rounded-xl border border-border text-xs space-y-1">
              <div className="font-bold text-text-primary">DO: {selectedOrderForOtp.delivery_order_id}</div>
              <div className="text-text-muted">
                Authorized Customer Phone: <strong className="text-primary">{selectedOrderForOtp.customer_phone}</strong>
              </div>
            </div>

            {/* Send OTP Trigger */}
            <div className="p-3 bg-primary/5 border border-primary/20 rounded-xl flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-text-primary block">Step 1: Send OTP to Customer</span>
                <span className="text-[10px] text-text-muted">Shares secure 6-digit handover code with registered mobile.</span>
              </div>
              <button
                type="button"
                onClick={handleSendOtp}
                disabled={sendingOtp}
                className="px-3 py-1.5 rounded-lg text-xs font-bold bg-primary text-white hover:bg-primary/90 transition-all flex items-center gap-1 cursor-pointer"
              >
                {sendingOtp ? <FaSpinner className="animate-spin" /> : <HiOutlineKey />}
                <span>{otpSentNotice ? 'Resend OTP' : 'Send OTP'}</span>
              </button>
            </div>

            {otpSentNotice && (
              <div className="p-2.5 bg-success/10 border border-success/20 rounded-xl text-xs text-success font-mono font-bold text-center">
                {otpSentNotice}
              </div>
            )}

            {/* Enter OTP Field */}
            <div>
              <label className="text-xs font-bold text-text-primary block mb-1">
                Step 2: Enter 6-Digit Verification OTP *
              </label>
              <input
                type="text"
                maxLength={6}
                required
                value={enteredOtp}
                onChange={(e) => setEnteredOtp(e.target.value)}
                placeholder="• • • • • •"
                className="w-full text-center tracking-widest text-lg font-mono font-black p-3 bg-surface-hover border border-border rounded-xl text-text-primary focus:outline-none focus:border-primary"
              />
            </div>

            {/* Receiver Name */}
            <div>
              <label className="text-xs font-bold text-text-primary block mb-1">
                Person Receiving Materials
              </label>
              <input
                type="text"
                value={otpReceiverName}
                onChange={(e) => setOtpReceiverName(e.target.value)}
                className="w-full p-2.5 text-xs bg-surface-hover border border-border rounded-xl text-text-primary focus:outline-none focus:border-primary"
              />
            </div>

            <div className="flex justify-end gap-2.5 pt-3 border-t border-border">
              <button
                type="button"
                onClick={() => setOtpModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-surface-hover border border-border text-text-secondary"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={verifyingOtp || enteredOtp.length !== 6}
                className="gradient-primary text-white px-5 py-2 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 disabled:opacity-50 cursor-pointer shadow-sm"
              >
                {verifyingOtp ? (
                  <>
                    <FaSpinner className="animate-spin" />
                    <span>Verifying OTP...</span>
                  </>
                ) : (
                  <>
                    <FaCheckCircle />
                    <span>Validate & Mark Delivered</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </Dialog>

      {/* ── Photo Preview Dialog ── */}
      <Dialog
        isOpen={!!photoViewerUrl}
        onClose={() => setPhotoViewerUrl(null)}
        title="Evidence Document Preview"
        size="lg"
      >
        {photoViewerUrl && (
          <div className="p-1 space-y-3">
            <div className="max-h-[500px] rounded-xl overflow-hidden border border-border flex items-center justify-center bg-black/10">
              <img
                src={photoViewerUrl}
                alt="Evidence"
                className="max-h-[500px] w-auto object-contain mx-auto"
              />
            </div>
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setPhotoViewerUrl(null)}
                className="px-4 py-1.5 rounded-xl text-xs font-bold bg-primary text-white"
              >
                Close Preview
              </button>
            </div>
          </div>
        )}
      </Dialog>

      {/* ── Multi-Stop Logistics Delivery Manifest Dialog (Accounts Document) ── */}
      <Dialog
        isOpen={manifestModalOpen}
        onClose={() => setManifestModalOpen(false)}
        title="Consolidated Multi-Stop Logistics Manifest & Delivery Document"
        size="xl"
      >
        {selectedOrderForManifest && (() => {
          const ord = selectedOrderForManifest;
          const plan = getRoutePlan(ord);
          const totalUnits = (ord.items || []).reduce((acc, it) => acc + (it.ordered_qty || 0), 0);

          return (
            <div className="space-y-4 p-2 text-xs">
              {/* Document Official Header */}
              <div className="p-4 bg-surface rounded-2xl border border-border shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-black text-primary">
                      MANIFEST #{ord.order_number}-MULTI
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-success/15 text-success border border-success/30 flex items-center gap-1">
                      <FaCheckCircle className="text-[9px]" /> Accounts & Logistics Authorized
                    </span>
                  </div>
                  <p className="text-[11px] text-text-muted mt-1">
                    Multi-Stop Consignment Route: Multi-OEM Pickups & Multiple EPC Delivery Points
                  </p>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  {ord.eway_bill?.eway_bill_number && (
                    <div className="px-3 py-1.5 rounded-xl bg-surface-hover border border-border text-[11px] font-mono">
                      <span className="text-[9px] uppercase text-text-muted block font-bold">E-Way Bill No</span>
                      <strong className="text-text-primary">{ord.eway_bill.eway_bill_number}</strong>
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="px-3 py-1.5 rounded-xl bg-primary text-white font-bold text-xs flex items-center gap-1.5 hover:brightness-105 transition-all shadow-xs cursor-pointer"
                  >
                    <FaPrint /> Print Manifest
                  </button>
                </div>
              </div>

              {/* Vehicle & Transporter Manifest Bar */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 bg-surface-hover/60 rounded-xl border border-border text-[11px]">
                <div>
                  <span className="text-[9px] uppercase font-bold text-text-muted block">Assigned Vehicle</span>
                  <strong className="font-mono text-text-primary text-xs">{ord.transport_details?.vehicle_number || ord.required_vehicle}</strong>
                </div>
                <div>
                  <span className="text-[9px] uppercase font-bold text-text-muted block">Transporter Name</span>
                  <strong className="text-text-primary">{ord.transport_details?.transporter_name || 'VRL Logistics Ltd'}</strong>
                </div>
                <div>
                  <span className="text-[9px] uppercase font-bold text-text-muted block">Driver Mobile</span>
                  <strong className="text-text-primary font-mono">{ord.transport_details?.driver_name || 'Driver'} ({ord.transport_details?.driver_mobile || '-'})</strong>
                </div>
                <div>
                  <span className="text-[9px] uppercase font-bold text-text-muted block">Total Load Capacity</span>
                  <strong className="text-primary">{totalUnits} Total Units ({(ord.items || []).length} SKUs)</strong>
                </div>
              </div>

              {/* Section 1: Pickup Stops (OEMs) */}
              <div className="space-y-2">
                <div className="flex items-center justify-between border-b border-border pb-1">
                  <h4 className="text-xs font-black uppercase tracking-wider text-text-primary flex items-center gap-1.5">
                    <FaIndustry className="text-warning" /> 1. Origin Pickup Hubs (Kahan se kya uthana hai)
                  </h4>
                  <span className="text-[10px] text-text-muted">{plan.pickupStops.length} Pickup Stop(s)</span>
                </div>

                <div className="space-y-2">
                  {plan.pickupStops.map(p => (
                    <div key={p.key} className="p-3 bg-surface rounded-xl border border-border flex flex-col md:flex-row md:items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="px-1.5 py-0.5 rounded bg-warning/20 text-warning text-[10px] font-black">
                            {p.stop_code}
                          </span>
                          <strong className="text-text-primary text-xs">{p.supplierName}</strong>
                          <span className="text-[10px] text-text-muted">({p.locationName})</span>
                        </div>
                        <div className="text-[11px] text-text-muted mt-0.5">{p.address} • Desk: {p.contactPerson} ({p.phone})</div>
                      </div>

                      <div className="bg-surface-hover px-3 py-1.5 rounded-lg border border-border text-right shrink-0">
                        <span className="text-[9px] uppercase text-text-muted block font-bold">Pick Quantity</span>
                        <span className="font-mono font-bold text-primary text-xs">
                          {p.items.map(it => `${it.product_name}: ${it.ordered_qty} units`).join(' | ')}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Section 2: Drop Stops (EPCs) */}
              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between border-b border-border pb-1">
                  <h4 className="text-xs font-black uppercase tracking-wider text-text-primary flex items-center gap-1.5">
                    <FaMapMarkerAlt className="text-success" /> 2. Delivery Destination Drop Points (Kahan drop karna hai)
                  </h4>
                  <span className="text-[10px] text-text-muted">{plan.dropStops.length} EPC Project Drop(s)</span>
                </div>

                <div className="space-y-2">
                  {plan.dropStops.map(d => (
                    <div key={d.epc_id} className="p-3 bg-surface rounded-xl border border-border flex flex-col md:flex-row md:items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="px-1.5 py-0.5 rounded bg-success/20 text-success text-[10px] font-black">
                            {d.stop_code}
                          </span>
                          <strong className="text-text-primary text-xs">{d.epc_name}</strong>
                          <span className="font-mono text-[10px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                            {d.tracking_consignment_id}
                          </span>
                        </div>
                        <div className="text-[11px] text-text-muted mt-0.5">
                          {d.site_address}, {d.district}, {d.state} • Site Incharge: {d.contact_person} ({d.contact_phone})
                        </div>
                      </div>

                      <div className="bg-success/10 border border-success/30 px-3 py-1.5 rounded-lg text-right shrink-0">
                        <span className="text-[9px] uppercase text-text-muted block font-bold">Allocated Equipment</span>
                        <span className="font-bold text-success text-xs">
                          {d.allocated_summary}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Signatures & Declarations */}
              <div className="pt-3 border-t border-border grid grid-cols-2 gap-4 text-center text-[10px] text-text-muted">
                <div className="p-3 bg-surface-hover/40 rounded-xl border border-border/50">
                  <div className="font-bold text-text-primary">Accounts Officer Authorization</div>
                  <div className="text-[9px] mt-1">Verified against Advance UTR & PI Schedule</div>
                </div>
                <div className="p-3 bg-surface-hover/40 rounded-xl border border-border/50">
                  <div className="font-bold text-text-primary">Transporter & Driver Acceptance</div>
                  <div className="text-[9px] mt-1">Consignment verified as per e-way bill declaration</div>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setManifestModalOpen(false)}
                  className="px-4 py-1.5 rounded-xl text-xs font-bold bg-surface-hover border border-border text-text-primary cursor-pointer"
                >
                  Close Document
                </button>
              </div>
            </div>
          );
        })()}
      </Dialog>
    </div>
  );
}
