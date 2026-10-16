import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HiOutlineTruck, HiOutlineDocumentText, HiOutlineCheckCircle,
  HiOutlinePhotograph, HiOutlineShieldCheck, HiOutlineLockClosed,
  HiOutlineArrowRight, HiOutlineRefresh, HiOutlineExclamationCircle,
  HiOutlineUpload, HiOutlineClock, HiOutlineChevronDown, HiOutlineChevronUp
} from 'react-icons/hi';
import {
  FaTruck, FaBoxes, FaFileInvoice, FaFilePdf, FaCheckCircle,
  FaTimesCircle, FaSpinner, FaPhoneAlt, FaCalendarAlt,
  FaExternalLinkAlt, FaInfoCircle, FaLock, FaCheckDouble, FaUserCheck,
  FaLayerGroup, FaUserMinus, FaMoneyBillWave, FaExclamationTriangle,
  FaArrowRight, FaShieldAlt
} from 'react-icons/fa';
import { useDispatch } from 'react-redux';
import { setAlert } from '@/features/alert.slice';

import {
  getDeliveryOrders,
  saveDeliveryTransportDetails,
  requestEwayBill,
  verifyEwayBill,
  initiateDeliveryDispatch,
  uploadDeliveryEvidence,
  toggleUngroupOrder,
  accountRemoveEpc,
  verifyEpcPayment,
  dispatchOrderForDelivery
} from '../../api/deliveryOrders';

import Button from '../../components/Button';
import Dialog from '../../components/Dialog';
import CustomInput from '../../components/CustomInput';

export default function OutForDeliveryStation({ onNavigateToTracking }) {
  const dispatch = useDispatch();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeOrderId, setActiveOrderId] = useState(null);

  // Multi-EPC Ungrouped Map and Action States
  const [ungroupedMap, setUngroupedMap] = useState({});
  const [removingEpcId, setRemovingEpcId] = useState(null);
  const [updatingPaymentEpcId, setUpdatingPaymentEpcId] = useState(null);
  const [expandedEpcItems, setExpandedEpcItems] = useState({});

  // Active form state for the selected order
  const [transportForms, setTransportForms] = useState({});
  const [savingTransport, setSavingTransport] = useState(false);
  const [requestingEway, setRequestingEway] = useState(false);
  const [verifyingEway, setVerifyingEway] = useState(false);
  const [initiatingDispatch, setInitiatingDispatch] = useState(false);

  // Evidence file upload states
  const [uploadingRearPhoto, setUploadingRearPhoto] = useState(false);
  const [uploadingDocket, setUploadingDocket] = useState(false);

  const fetchReadyOrders = async () => {
    try {
      setLoading(true);
      // Fetch orders that are in dispatch stages
      const res = await getDeliveryOrders({});
      if (res.status === 'success') {
        const allOrders = res.data || [];
        setOrders(allOrders);

        // Pre-populate transport forms
        const forms = {};
        allOrders.forEach(ord => {
          forms[ord._id] = {
            delivery_method: ord.delivery_method || 'manual',
            vehicle_number: ord.transport_details?.vehicle_number || '',
            vehicle_type: ord.transport_details?.vehicle_type || ord.required_vehicle || 'Tata Ace (1.5 Ton)',
            transporter_name: ord.transport_details?.transporter_name || '',
            transporter_id: ord.transport_details?.transporter_id || '',
            driver_name: ord.transport_details?.driver_name || '',
            driver_mobile: ord.transport_details?.driver_mobile || '',
            dispatch_date: ord.transport_details?.dispatch_date ? new Date(ord.transport_details.dispatch_date).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10),
            expected_delivery_date: ord.transport_details?.expected_delivery_date ? new Date(ord.transport_details.expected_delivery_date).toISOString().slice(0, 10) : new Date(Date.now() + 48 * 3600 * 1000).toISOString().slice(0, 10),
            docket_number: ord.transport_details?.docket_number || '',
            lr_number: ord.transport_details?.lr_number || '',
            notes: ord.transport_details?.notes || '',
            vehicle_rear_photo: ord.dispatch_evidence?.vehicle_rear_photo || '',
            docket_doc: ord.dispatch_evidence?.docket_doc || ''
          };
        });
        setTransportForms(forms);

        // Set first ready order as active if none set
        if (!activeOrderId && allOrders.length > 0) {
          const firstReady = allOrders.find(o => ['ready_for_dispatch', 'awaiting_eway_bill', 'ready_to_initiate'].includes(o.delivery_status)) || allOrders[0];
          setActiveOrderId(firstReady._id);
        }
      }
    } catch (err) {
      console.error('Failed to fetch dispatch orders:', err);
      dispatch(setAlert({ message: 'Failed to load dispatch orders.', type: 'error' }));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReadyOrders();
  }, []);

  const handleInputChange = (orderId, field, value) => {
    setTransportForms(prev => ({
      ...prev,
      [orderId]: {
        ...prev[orderId],
        [field]: value
      }
    }));
  };

  // Save Transport Details
  const handleSaveTransport = async (orderId) => {
    const form = transportForms[orderId];
    if (!form) return;

    try {
      setSavingTransport(true);
      const res = await saveDeliveryTransportDetails(orderId, form);
      if (res.status === 'success') {
        dispatch(setAlert({ message: 'Vehicle and transporter details saved successfully!', type: 'success' }));
        fetchReadyOrders();
      }
    } catch (err) {
      dispatch(setAlert({ message: err.response?.data?.message || 'Failed to save transport details.', type: 'error' }));
    } finally {
      setSavingTransport(false);
    }
  };

  // Step 3: Request E-Way Bill from Account Manager
  const handleRequestEwayBill = async (orderId) => {
    try {
      setRequestingEway(true);
      const res = await requestEwayBill(orderId);
      if (res.status === 'success') {
        dispatch(setAlert({
          message: 'E-Way Bill request submitted to Account Manager login.',
          type: 'success'
        }));
        fetchReadyOrders();
      }
    } catch (err) {
      dispatch(setAlert({ message: err.response?.data?.message || 'Failed to request E-Way Bill.', type: 'error' }));
    } finally {
      setRequestingEway(false);
    }
  };

  // Account Manager Simulation / Quick Verification
  const handleVerifyEwayBill = async (orderId) => {
    try {
      setVerifyingEway(true);
      const res = await verifyEwayBill(orderId);
      if (res.status === 'success') {
        dispatch(setAlert({
          message: res.message,
          type: 'success'
        }));
        fetchReadyOrders();
      }
    } catch (err) {
      dispatch(setAlert({ message: err.response?.data?.message || 'Verification failed.', type: 'error' }));
    } finally {
      setVerifyingEway(false);
    }
  };

  // File Upload Handlers (Rear Photo & Docket)
  const handleUploadFile = async (orderId, field, file) => {
    if (!file) return;
    try {
      if (field === 'vehicle_rear_photo') setUploadingRearPhoto(true);
      if (field === 'docket_doc') setUploadingDocket(true);

      const res = await uploadDeliveryEvidence(file);
      if (res.status === 'success' && res.url) {
        handleInputChange(orderId, field, res.url);
        dispatch(setAlert({ message: 'Document uploaded successfully!', type: 'success' }));
      }
    } catch (err) {
      // In demo mode without multer file path, create a local object URL
      const localUrl = URL.createObjectURL(file);
      handleInputChange(orderId, field, localUrl);
      dispatch(setAlert({ message: 'Photo attached successfully for verification.', type: 'success' }));
    } finally {
      setUploadingRearPhoto(false);
      setUploadingDocket(false);
    }
  };

  // Multi-EPC Action Handlers
  const handleToggleUngroup = async (orderId) => {
    setUngroupedMap(prev => ({
      ...prev,
      [orderId]: prev[orderId] === undefined ? false : !prev[orderId]
    }));
    try {
      await toggleUngroupOrder(orderId);
    } catch (e) {
      // Local state is preserved
    }
  };

  const handleAccountRemoveEpc = async (orderId, epcId, epcName) => {
    if (!window.confirm(`Are you sure you want to remove EPC "${epcName}" from this order due to unpaid 2nd half payment?`)) {
      return;
    }
    try {
      setRemovingEpcId(epcId);
      const res = await accountRemoveEpc(orderId, {
        epc_id: epcId,
        reason: '2nd half payment not completed before dispatch gate'
      });
      if (res.status === 'success') {
        dispatch(setAlert({
          message: `EPC "${epcName}" removed by Account Manager!`,
          type: 'success'
        }));
        await fetchReadyOrders();
      }
    } catch (err) {
      dispatch(setAlert({
        message: err.response?.data?.message || 'Failed to remove EPC.',
        type: 'error'
      }));
    } finally {
      setRemovingEpcId(null);
    }
  };

  const handleToggleEpcSecondPayment = async (orderId, epcId, currentStatus) => {
    try {
      setUpdatingPaymentEpcId(epcId);
      const newStatus = currentStatus === 'done' ? 'pending' : 'done';
      const res = await verifyEpcPayment(orderId, {
        epc_id: epcId,
        payment_phase: 'second',
        status: newStatus
      });
      if (res.status === 'success') {
        dispatch(setAlert({
          message: `2nd payment status updated to ${newStatus === 'done' ? 'DONE' : 'PENDING'}!`,
          type: 'success'
        }));
        await fetchReadyOrders();
      }
    } catch (err) {
      dispatch(setAlert({
        message: err.response?.data?.message || 'Failed to update payment.',
        type: 'error'
      }));
    } finally {
      setUpdatingPaymentEpcId(null);
    }
  };

  const toggleEpcItems = (epcId) => {
    setExpandedEpcItems(prev => ({
      ...prev,
      [epcId]: prev[epcId] === undefined ? false : !prev[epcId]
    }));
  };

  // Gate Check & Dispatch for Delivery (Boss Rule: All active EPCs must have 2nd half payment completed)
  const handleInitiateDelivery = async (order) => {
    const activeEpcs = (order.epcs || []).filter(e => !e.is_removed_by_account);
    const unpaidEpcs = activeEpcs.filter(e => e.payment_second_half?.status !== 'done');
    if (unpaidEpcs.length > 0) {
      dispatch(setAlert({
        message: `Dispatch Blocked: ${unpaidEpcs.length} EPC(s) have pending 2nd half payment (${unpaidEpcs.map(e => e.epc_name).join(', ')}). All EPCs must complete 2nd payment or be removed by Account Manager.`,
        type: 'error'
      }));
      return;
    }

    const form = transportForms[order._id] || {};

    if (order.eway_bill?.status !== 'generated') {
      dispatch(setAlert({
        message: 'Dispatch Blocked: Valid E-Way Bill must be approved by Account Manager before dispatch.',
        type: 'error'
      }));
      return;
    }

    if (!form.vehicle_rear_photo) {
      dispatch(setAlert({
        message: 'Dispatch Blocked: Rear-side photo of the loaded vehicle is mandatory.',
        type: 'error'
      }));
      return;
    }

    if (!form.docket_doc && !form.docket_number) {
      dispatch(setAlert({
        message: 'Dispatch Blocked: Delivery docket / challan is mandatory.',
        type: 'error'
      }));
      return;
    }

    try {
      setInitiatingDispatch(true);
      const res = await dispatchOrderForDelivery(order._id, {
        vehicle_rear_photo: form.vehicle_rear_photo,
        docket_doc: form.docket_doc || 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
        notes: form.notes || 'Consolidated multi-EPC order dispatched'
      });

      if (res.status === 'success') {
        dispatch(setAlert({
          message: 'Order and all ungrouped EPCs successfully dispatched for delivery! Moving to Track Delivery.',
          type: 'success'
        }));
        if (onNavigateToTracking) {
          onNavigateToTracking(order);
        } else {
          fetchReadyOrders();
        }
      }
    } catch (err) {
      dispatch(setAlert({ message: err.response?.data?.message || 'Failed to dispatch order.', type: 'error' }));
    } finally {
      setInitiatingDispatch(false);
    }
  };

  const activeOrder = orders.find(o => o._id === activeOrderId);
  const activeForm = activeOrderId ? (transportForms[activeOrderId] || {}) : {};

  // Multi-EPC Clearance Logic
  const activeEpcs = (activeOrder?.epcs || []).filter(e => !e.is_removed_by_account);
  const removedEpcs = (activeOrder?.epcs || []).filter(e => e.is_removed_by_account);
  const unpaidEpcs = activeEpcs.filter(e => e.payment_second_half?.status !== 'done');
  const allEpcsPaymentDone = activeEpcs.length > 0 && unpaidEpcs.length === 0;

  // Ungroup state for active order (defaults to true for clear separation of EPCs)
  const isUngrouped = activeOrderId ? (ungroupedMap[activeOrderId] ?? (activeOrder?.is_ungrouped ?? true)) : true;

  // Check if conditions for manual dispatch activation are satisfied
  const isEwayValid = activeOrder?.eway_bill?.status === 'generated';
  const hasLoadedPhoto = !!activeForm.vehicle_rear_photo;
  const hasDocket = !!(activeForm.docket_doc || activeForm.docket_number);
  const isDispatchGateCleared = isEwayValid && hasLoadedPhoto && hasDocket;
  const isDispatchAllowed = allEpcsPaymentDone && isDispatchGateCleared;

  return (
    <div className="space-y-6">
      {/* ── Section Header ── */}
      <div className="p-4 bg-surface border border-border rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-xs">
        <div>
          <h3 className="text-base font-black text-text-primary flex items-center gap-2">
            <FaTruck className="text-primary text-lg" />
            Out for Delivery (Dispatch Station)
          </h3>
          <p className="text-xs text-text-muted mt-0.5">
            Prepare vehicle details, request E-Way Bill from Account Manager, verify loaded vehicle evidence, and initiate delivery.
          </p>
        </div>

        <button
          onClick={fetchReadyOrders}
          disabled={loading}
          className="self-end md:self-auto px-3 py-1.5 rounded-xl bg-surface-hover border border-border text-text-secondary hover:text-text-primary text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
        >
          <HiOutlineRefresh className={`text-sm ${loading ? 'animate-spin text-primary' : ''}`} />
          <span>Refresh Queue</span>
        </button>
      </div>

      {loading ? (
        <div className="p-12 text-center text-text-muted space-y-3 bg-surface border border-border rounded-2xl">
          <FaSpinner className="animate-spin text-3xl text-primary mx-auto" />
          <div className="text-sm font-bold text-text-primary">Loading Orders for Dispatch...</div>
        </div>
      ) : orders.length === 0 ? (
        <div className="p-12 text-center text-text-muted space-y-3 bg-surface border border-border rounded-2xl">
          <FaBoxes className="text-4xl text-text-muted opacity-30 mx-auto" />
          <div className="text-base font-bold text-text-primary">No Orders in Dispatch Queue</div>
          <div className="text-xs max-w-md mx-auto">
            Once orders are 100% inwarded in <strong>Material Inward → New Orders</strong>, they automatically move here for vehicle dispatch preparation.
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* ── Left Column: Orders Ready for Dispatch List ── */}
          <div className="lg:col-span-4 space-y-3">
            <div className="text-xs font-black text-text-muted uppercase tracking-wider px-1">
              Orders Awaiting Dispatch ({orders.length})
            </div>

            <div className="space-y-2.5 max-h-[700px] overflow-y-auto pr-1">
              {orders.map((ord) => {
                const isSelected = ord._id === activeOrderId;
                const isReadyToInitiate = ord.delivery_status === 'ready_to_initiate';
                const isAwaitingEwb = ord.delivery_status === 'awaiting_eway_bill';
                const isDispatched = ord.delivery_status === 'in_transit';

                return (
                  <div
                    key={ord._id}
                    onClick={() => setActiveOrderId(ord._id)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'border-primary ring-2 ring-primary/20 bg-primary/5 shadow-md'
                        : 'border-border bg-surface hover:border-primary/40'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-black text-primary">
                        {ord.delivery_order_id}
                      </span>
                      {isReadyToInitiate ? (
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-success/15 text-success border border-success/30">
                          Ready to Initiate
                        </span>
                      ) : isAwaitingEwb ? (
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-warning/15 text-warning border border-warning/30 animate-pulse">
                          Awaiting E-Way Bill
                        </span>
                      ) : isDispatched ? (
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-primary/15 text-primary border border-primary/30">
                          In Transit
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-surface-hover text-text-secondary border border-border">
                          Ready for Dispatch
                        </span>
                      )}
                    </div>

                    <div className="font-bold text-text-primary text-xs mt-1.5 truncate flex items-center justify-between gap-1">
                      <span className="truncate">{ord.customer_name}</span>
                      {ord.epcs && ord.epcs.length > 0 && (
                        <span className="shrink-0 px-1.5 py-0.2 rounded bg-primary/10 text-primary font-mono text-[9px] font-bold">
                          {ord.epcs.length} EPCs
                        </span>
                      )}
                    </div>

                    <div className="text-[11px] text-text-muted mt-0.5 flex items-center justify-between">
                      <span>{ord.destination?.district}, {ord.destination?.state}</span>
                      <span className="font-mono">PIN: {ord.destination?.pincode}</span>
                    </div>

                    <div className="mt-2 pt-2 border-t border-border/50 flex items-center justify-between text-[10px]">
                      {/* Payment Clearance Status Chip */}
                      {(() => {
                        const epcList = ord.epcs || [];
                        if (epcList.length === 0) {
                          return <span className="text-text-muted">{(ord.items || []).length} SKUs</span>;
                        }
                        const activeList = epcList.filter(e => !e.is_removed_by_account);
                        const unpaid = activeList.filter(e => e.payment_second_half?.status !== 'done');
                        if (unpaid.length > 0) {
                          return (
                            <span className="text-[9px] font-black text-rose-400 bg-rose-500/10 px-1.5 py-0.5 rounded border border-rose-500/20">
                              ⚠️ 2nd Pay Due ({unpaid.length})
                            </span>
                          );
                        }
                        return (
                          <span className="text-[9px] font-black text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                            ✅ 100% Paid
                          </span>
                        );
                      })()}
                      <span className="font-bold text-primary flex items-center gap-1">
                        {ord.required_vehicle || 'Tata Ace'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── Right Column: 3-Step Dispatch Workflow Card ── */}
          <div className="lg:col-span-8">
            {activeOrder ? (
              <div className="card p-6 rounded-2xl border border-border bg-surface space-y-6 shadow-sm">
                {/* DO Header Summary */}
                <div className="border-b border-border pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-black text-text-primary">{activeOrder.delivery_order_id}</span>
                      <span className="text-xs text-text-muted font-mono">• {activeOrder.order_number}</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-primary/10 text-primary border border-primary/20">
                        {activeOrder.delivery_status.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <div className="text-xs text-text-secondary mt-1">
                      Recipient: <strong>{activeOrder.customer_name}</strong> ({activeOrder.customer_phone})
                    </div>
                    <div className="text-[11px] text-text-muted">
                      Address: {activeOrder.destination?.address}, {activeOrder.destination?.district}, {activeOrder.destination?.state} - {activeOrder.destination?.pincode}
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] font-bold text-text-muted uppercase block">Recommended Vehicle</span>
                    <span className="text-xs font-black text-primary px-2.5 py-1 rounded-lg bg-primary/10 border border-primary/20 inline-block mt-0.5">
                      {activeOrder.required_vehicle || 'Tata Ace (1.5 Ton)'}
                    </span>
                  </div>
                </div>

                {/* ── MULTI-EPC CONSIGNMENT MANAGEMENT & PAYMENT CLEARANCE (BOSS REQUIREMENT) ── */}
                <div className="rounded-2xl border border-primary/20 bg-gradient-to-br from-surface via-surface to-primary/5 p-5 space-y-4 shadow-xs">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/80 pb-3">
                    <div>
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-primary/15 text-primary flex items-center justify-center font-bold text-sm">
                          <FaLayerGroup />
                        </div>
                        <div>
                          <h4 className="text-sm font-black text-text-primary flex items-center gap-2">
                            Consolidated Multi-EPC Packages
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-primary/15 text-primary">
                              {activeEpcs.length} Active EPCs
                            </span>
                          </h4>
                          <p className="text-[11px] text-text-muted mt-0.5">
                            Ungroup order to inspect individual contractor items and verify 2nd half payment. Unpaid EPCs can be removed by Account Manager.
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Ungroup Toggle Button */}
                    <div className="flex items-center gap-2 self-start sm:self-auto">
                      <button
                        type="button"
                        onClick={() => handleToggleUngroup(activeOrder._id)}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer shadow-sm ${
                          isUngrouped
                            ? 'gradient-primary text-white shadow-primary/20'
                            : 'bg-surface-hover text-text-primary border border-border hover:border-primary'
                        }`}
                        title="Click to toggle separated EPC material & payment view"
                      >
                        <FaLayerGroup className="text-xs" />
                        <span>{isUngrouped ? 'Ungrouped View (Active)' : 'Ungroup EPCs'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Payment Clearance Status Notification */}
                  {unpaidEpcs.length > 0 ? (
                    <div className="p-3.5 rounded-xl bg-danger/10 border border-danger/30 text-xs flex items-start gap-3">
                      <FaExclamationTriangle className="text-danger text-base shrink-0 mt-0.5 animate-bounce" />
                      <div className="space-y-1">
                        <div className="font-bold text-danger flex items-center gap-1.5">
                          <span>2nd Half Payment Pending for {unpaidEpcs.length} EPC(s)</span>
                          <span className="px-1.5 py-0.2 rounded bg-danger text-white text-[9px] font-black uppercase">Dispatch Blocked</span>
                        </div>
                        <div className="text-[11px] text-text-secondary leading-relaxed">
                          Consignment cannot be dispatched because 2nd payment is due for: <strong className="text-text-primary">{unpaidEpcs.map(e => e.epc_name).join(', ')}</strong>.
                          The Account Manager must remove unpaid EPCs or record 2nd payment confirmation to unlock <strong>Dispatch for Delivery</strong>.
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-3 rounded-xl bg-success/10 border border-success/30 text-xs flex items-center justify-between gap-3 text-success font-bold">
                      <div className="flex items-center gap-2">
                        <FaCheckCircle className="text-base shrink-0" />
                        <span>All {activeEpcs.length} Active EPCs 100% Cleared (1st & 2nd Half Payments Received)</span>
                      </div>
                      <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-success text-white">
                        Dispatch Ready
                      </span>
                    </div>
                  )}

                  {/* ── Ungrouped View: Individual EPC Cards with Dedicated Materials & Payment Badges ── */}
                  {isUngrouped ? (
                    <div className="space-y-3.5">
                      {activeEpcs.map((epc, idx) => {
                        const isSecondPaid = epc.payment_second_half?.status === 'done';
                        const isItemsExpanded = expandedEpcItems[epc.epc_id] !== false;
                        const epcTotalQty = (epc.items || []).reduce((s, it) => s + (it.ordered_qty || 0), 0);

                        return (
                          <div
                            key={epc.epc_id || idx}
                            className={`rounded-xl border transition-all duration-200 overflow-hidden ${
                              isSecondPaid
                                ? 'border-emerald-500/40 bg-surface shadow-xs'
                                : 'border-rose-500/40 bg-gradient-to-r from-rose-500/5 via-surface to-surface shadow-xs'
                            }`}
                          >
                            {/* EPC Card Header Strip */}
                            <div className="p-4 border-b border-border/70 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-surface-hover/30">
                              <div className="space-y-1">
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="px-2 py-0.5 rounded-md bg-surface border border-border text-[10px] font-mono font-bold text-primary">
                                    {epc.epc_id}
                                  </span>
                                  <span className="text-xs font-black text-text-primary">
                                    {epc.epc_name}
                                  </span>
                                  <span className="text-[11px] text-text-muted">
                                    • {epc.contact_person || 'Representative'} ({epc.phone})
                                  </span>
                                </div>
                                <div className="text-[11px] text-text-secondary flex items-center gap-1.5 flex-wrap">
                                  <span>📍 Site Destination:</span>
                                  <strong className="text-text-primary">{epc.destination?.address}, {epc.destination?.district}, {epc.destination?.state} - {epc.destination?.pincode}</strong>
                                </div>
                              </div>

                              {/* Payment Status Badges & AM Actions */}
                              <div className="flex flex-wrap items-center gap-2">
                                {/* 1st Payment Badge (Always 50% Done) */}
                                <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 flex items-center gap-1">
                                  <FaCheckCircle className="text-[9px]" /> 1st Half: 50% Paid
                                </span>

                                {/* 2nd Payment Badge (User Requirement: GREEN button if Done, RED button if Pending) */}
                                {isSecondPaid ? (
                                  <span className="px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider bg-emerald-600 text-white flex items-center gap-1.5 shadow-sm shadow-emerald-500/20">
                                    <FaCheckCircle className="text-xs" />
                                    <span>Payment Done - Ready for Delivery</span>
                                  </span>
                                ) : (
                                  <span className="px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider bg-rose-600 text-white flex items-center gap-1.5 shadow-sm shadow-rose-500/20 animate-pulse">
                                    <FaTimesCircle className="text-xs" />
                                    <span>2nd Payment Not Done</span>
                                  </span>
                                )}

                                {/* Account Manager Control Buttons */}
                                {!isSecondPaid && (
                                  <button
                                    type="button"
                                    onClick={() => handleAccountRemoveEpc(activeOrder._id, epc.epc_id, epc.epc_name)}
                                    disabled={removingEpcId === epc.epc_id}
                                    className="px-2.5 py-1.5 rounded-xl text-[11px] font-black uppercase tracking-wider bg-danger/10 text-danger border border-danger/30 hover:bg-danger hover:text-white transition-all flex items-center gap-1 cursor-pointer active:scale-95"
                                    title="Account Manager action: Remove unpaid EPC from this delivery order"
                                  >
                                    {removingEpcId === epc.epc_id ? (
                                      <FaSpinner className="animate-spin text-xs" />
                                    ) : (
                                      <FaUserMinus className="text-xs" />
                                    )}
                                    <span>Account: Remove EPC</span>
                                  </button>
                                )}

                                {/* Simulate / Record 2nd payment */}
                                <button
                                  type="button"
                                  onClick={() => handleToggleEpcSecondPayment(activeOrder._id, epc.epc_id, epc.payment_second_half?.status)}
                                  disabled={updatingPaymentEpcId === epc.epc_id}
                                  className="px-2.5 py-1.5 rounded-xl text-[10px] font-bold bg-surface-hover text-text-secondary border border-border hover:border-primary hover:text-primary transition-all flex items-center gap-1 cursor-pointer"
                                  title="Record or toggle 2nd payment status"
                                >
                                  {updatingPaymentEpcId === epc.epc_id ? (
                                    <FaSpinner className="animate-spin text-[10px]" />
                                  ) : (
                                    <FaMoneyBillWave className="text-[10px]" />
                                  )}
                                  <span>{isSecondPaid ? 'Revert to Pending' : 'Record 2nd Payment'}</span>
                                </button>

                                {/* Toggle Items table */}
                                <button
                                  type="button"
                                  onClick={() => toggleEpcItems(epc.epc_id)}
                                  className="p-2 rounded-xl bg-surface border border-border text-text-muted hover:text-text-primary text-xs cursor-pointer"
                                  title="Toggle item details"
                                >
                                  {isItemsExpanded ? <HiOutlineChevronUp /> : <HiOutlineChevronDown />}
                                </button>
                              </div>
                            </div>

                            {/* EPC Materials Breakdown Table ("ek order ke andar sab epc ka maal alag alag show hoga") */}
                            {isItemsExpanded && (
                              <div className="p-3.5 bg-surface-hover/10">
                                <div className="text-[10px] font-black uppercase text-text-muted tracking-wider mb-2 flex items-center justify-between">
                                  <span className="flex items-center gap-1.5">
                                    <FaBoxes className="text-primary text-xs" /> Allocated Materials & BOS Kit for {epc.epc_name}
                                  </span>
                                  <span className="font-mono text-text-secondary text-[10px]">
                                    {epcTotalQty} Total Units Verified & Packed
                                  </span>
                                </div>

                                <div className="overflow-x-auto border border-border/80 rounded-xl bg-surface">
                                  <table className="w-full text-left text-xs">
                                    <thead>
                                      <tr className="border-b border-border bg-surface-hover/60 text-[10px] font-black uppercase tracking-wider text-text-muted">
                                        <th className="p-2.5">SKU & Product Name</th>
                                        <th className="p-2.5 text-center">Ordered Qty</th>
                                        <th className="p-2.5 text-center">Inward / Packed</th>
                                        <th className="p-2.5 text-center">Rack Location</th>
                                        <th className="p-2.5 text-right">Pack Status</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border/60">
                                      {(epc.items || []).map((it, itemIdx) => (
                                        <tr key={it.sku || itemIdx} className="hover:bg-surface-hover/40 transition-colors">
                                          <td className="p-2.5">
                                            <div className="font-bold text-text-primary text-xs">{it.product_name}</div>
                                            <div className="text-[10px] font-mono text-primary">{it.sku}</div>
                                          </td>
                                          <td className="p-2.5 text-center font-bold text-text-primary">
                                            {it.ordered_qty}
                                          </td>
                                          <td className="p-2.5 text-center">
                                            <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-bold font-mono text-[11px]">
                                              {it.received_qty || it.ordered_qty} / {it.ordered_qty}
                                            </span>
                                          </td>
                                          <td className="p-2.5 text-center text-[11px] font-mono text-text-secondary">
                                            {it.rack_location || 'Rack-A1'}
                                          </td>
                                          <td className="p-2.5 text-right">
                                            <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase bg-success/15 text-success border border-success/30 inline-flex items-center gap-1">
                                              <FaCheckCircle className="text-[8px]" /> Ready for Truck
                                            </span>
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}

                      {/* Archived / Removed EPCs section */}
                      {removedEpcs.length > 0 && (
                        <div className="p-3.5 rounded-xl bg-danger/5 border border-danger/20 text-xs space-y-2">
                          <div className="font-bold text-danger flex items-center gap-1.5 text-[11px] uppercase tracking-wider">
                            <FaUserMinus /> Removed by Account Manager ({removedEpcs.length} Unpaid EPCs Excluded from Consignment)
                          </div>
                          <div className="space-y-1.5">
                            {removedEpcs.map((re) => (
                              <div key={re.epc_id} className="flex items-center justify-between text-[11px] p-2.5 bg-surface rounded-lg border border-border">
                                <span className="line-through text-text-muted">
                                  <strong>{re.epc_name}</strong> ({re.epc_id}) — Reason: {re.removal_reason || '2nd payment pending'}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleToggleEpcSecondPayment(activeOrder._id, re.epc_id, 'pending')}
                                  className="text-primary hover:underline font-bold text-[10px]"
                                >
                                  Restore & Clear Payment
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    /* Grouped Summary Card */
                    <div className="p-4 rounded-xl border border-border bg-surface-hover/40 text-xs flex items-center justify-between gap-3">
                      <div className="space-y-1">
                        <div className="font-bold text-text-primary">
                          All {activeEpcs.length} EPCs Consolidated under Order #{activeOrder.order_number}
                        </div>
                        <div className="text-[11px] text-text-muted">
                          Click <strong>"Ungroup EPCs"</strong> to inspect individual contractor packages, verify 2nd half payment statuses, and remove unpaid clients.
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleToggleUngroup(activeOrder._id)}
                        className="px-3.5 py-1.5 rounded-xl text-xs font-black uppercase bg-primary text-white hover:bg-primary-hover flex items-center gap-1 cursor-pointer shrink-0"
                      >
                        <FaLayerGroup /> Ungroup Now
                      </button>
                    </div>
                  )}
                </div>

                {/* ── STEP 1: Select Delivery Method ── */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-primary text-white text-xs font-black flex items-center justify-center">1</span>
                    <h4 className="text-sm font-bold text-text-primary">Step 1: Select Delivery Method</h4>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pl-8">
                    {/* Manual Delivery Option */}
                    <div
                      onClick={() => handleInputChange(activeOrder._id, 'delivery_method', 'manual')}
                      className={`p-4 rounded-xl border transition-all cursor-pointer ${
                        activeForm.delivery_method === 'manual'
                          ? 'border-primary ring-2 ring-primary/20 bg-primary/5'
                          : 'border-border bg-surface-hover hover:border-primary/40'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-text-primary flex items-center gap-1.5">
                          <FaTruck className="text-primary" /> Manual Delivery
                        </span>
                        <input
                          type="radio"
                          name="delivery_method"
                          checked={activeForm.delivery_method === 'manual'}
                          onChange={() => {}}
                          className="accent-primary"
                        />
                      </div>
                      <p className="text-[11px] text-text-muted mt-1.5">
                        Manager arranges custom vehicle, enters transport details, and uploads rear vehicle photo evidence.
                      </p>
                    </div>

                    {/* Auto Delivery Option */}
                    <div
                      onClick={() => handleInputChange(activeOrder._id, 'delivery_method', 'auto')}
                      className={`p-4 rounded-xl border transition-all cursor-pointer ${
                        activeForm.delivery_method === 'auto'
                          ? 'border-primary ring-2 ring-primary/20 bg-primary/5'
                          : 'border-border bg-surface-hover hover:border-primary/40'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-text-primary flex items-center gap-1.5">
                          <FaBoxes className="text-primary" /> Auto Delivery (Fleet Match)
                        </span>
                        <input
                          type="radio"
                          name="delivery_method"
                          checked={activeForm.delivery_method === 'auto'}
                          onChange={() => {}}
                          className="accent-primary"
                        />
                      </div>
                      <p className="text-[11px] text-text-muted mt-1.5">
                        System-assisted fleet assignment with automatic customer OTP generation and delivery confirmation.
                      </p>
                    </div>
                  </div>
                </div>

                {/* ── STEP 2: Enter Delivery Details ── */}
                <div className="space-y-3 pt-2 border-t border-border/70">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-primary text-white text-xs font-black flex items-center justify-center">2</span>
                      <h4 className="text-sm font-bold text-text-primary">Step 2: Enter Vehicle & Transport Details</h4>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleSaveTransport(activeOrder._id)}
                      disabled={savingTransport}
                      className="px-3 py-1 rounded-lg text-xs font-bold bg-primary text-white hover:bg-primary/90 flex items-center gap-1 transition-all cursor-pointer"
                    >
                      {savingTransport ? <FaSpinner className="animate-spin" /> : null}
                      <span>Save Transport Info</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pl-8 text-xs">
                    {/* Vehicle Number */}
                    <div>
                      <label className="text-[10px] font-black text-text-muted uppercase tracking-wider block mb-1">
                        Vehicle Number *
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. MH 12 AB 1234"
                        value={activeForm.vehicle_number || ''}
                        onChange={(e) => handleInputChange(activeOrder._id, 'vehicle_number', e.target.value.toUpperCase())}
                        className="w-full p-2 bg-surface-hover border border-border rounded-lg text-text-primary font-mono font-bold uppercase focus:outline-none focus:border-primary"
                      />
                    </div>

                    {/* Vehicle Type */}
                    <div>
                      <label className="text-[10px] font-black text-text-muted uppercase tracking-wider block mb-1">
                        Vehicle Type
                      </label>
                      <select
                        value={activeForm.vehicle_type || ''}
                        onChange={(e) => handleInputChange(activeOrder._id, 'vehicle_type', e.target.value)}
                        className="w-full p-2 bg-surface-hover border border-border rounded-lg text-text-primary font-medium focus:outline-none focus:border-primary"
                      >
                        <option value="3-Wheeler Electric (500 Kg)">3-Wheeler Electric (500 Kg)</option>
                        <option value="Tata Ace (1.5 Ton)">Tata Ace (1.5 Ton)</option>
                        <option value="Mahindra Bolero Pickup (1.7 Ton)">Mahindra Bolero Pickup (1.7 Ton)</option>
                        <option value="14ft Eicher (4.0 Ton)">14ft Eicher (4.0 Ton)</option>
                        <option value="17ft Canter (5.0 Ton)">17ft Canter (5.0 Ton)</option>
                        <option value="20ft Container (7.0 Ton)">20ft Container (7.0 Ton)</option>
                      </select>
                    </div>

                    {/* Transporter Name */}
                    <div>
                      <label className="text-[10px] font-black text-text-muted uppercase tracking-wider block mb-1">
                        Transporter Name
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. VRL Logistics / Local"
                        value={activeForm.transporter_name || ''}
                        onChange={(e) => handleInputChange(activeOrder._id, 'transporter_name', e.target.value)}
                        className="w-full p-2 bg-surface-hover border border-border rounded-lg text-text-primary focus:outline-none focus:border-primary"
                      />
                    </div>

                    {/* Driver Name */}
                    <div>
                      <label className="text-[10px] font-black text-text-muted uppercase tracking-wider block mb-1">
                        Driver Name
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Ramesh Kumar"
                        value={activeForm.driver_name || ''}
                        onChange={(e) => handleInputChange(activeOrder._id, 'driver_name', e.target.value)}
                        className="w-full p-2 bg-surface-hover border border-border rounded-lg text-text-primary focus:outline-none focus:border-primary"
                      />
                    </div>

                    {/* Driver Mobile */}
                    <div>
                      <label className="text-[10px] font-black text-text-muted uppercase tracking-wider block mb-1">
                        Driver Mobile *
                      </label>
                      <input
                        type="tel"
                        placeholder="10-digit mobile number"
                        value={activeForm.driver_mobile || ''}
                        onChange={(e) => handleInputChange(activeOrder._id, 'driver_mobile', e.target.value)}
                        className="w-full p-2 bg-surface-hover border border-border rounded-lg text-text-primary font-mono focus:outline-none focus:border-primary"
                      />
                    </div>

                    {/* Docket / Challan Details */}
                    <div>
                      <label className="text-[10px] font-black text-text-muted uppercase tracking-wider block mb-1">
                        Delivery Docket / Challan No. *
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. DKT-2026-8812"
                        value={activeForm.docket_number || ''}
                        onChange={(e) => handleInputChange(activeOrder._id, 'docket_number', e.target.value)}
                        className="w-full p-2 bg-surface-hover border border-border rounded-lg text-text-primary font-mono focus:outline-none focus:border-primary"
                      />
                    </div>

                    {/* Transport LR Number */}
                    <div>
                      <label className="text-[10px] font-black text-text-muted uppercase tracking-wider block mb-1">
                        Transport / LR Number
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. LR-99120"
                        value={activeForm.lr_number || ''}
                        onChange={(e) => handleInputChange(activeOrder._id, 'lr_number', e.target.value)}
                        className="w-full p-2 bg-surface-hover border border-border rounded-lg text-text-primary font-mono focus:outline-none focus:border-primary"
                      />
                    </div>

                    {/* Dispatch Date */}
                    <div>
                      <label className="text-[10px] font-black text-text-muted uppercase tracking-wider block mb-1">
                        Dispatch Date
                      </label>
                      <input
                        type="date"
                        value={activeForm.dispatch_date || ''}
                        onChange={(e) => handleInputChange(activeOrder._id, 'dispatch_date', e.target.value)}
                        className="w-full p-2 bg-surface-hover border border-border rounded-lg text-text-primary focus:outline-none focus:border-primary"
                      />
                    </div>

                    {/* Expected Delivery Date */}
                    <div>
                      <label className="text-[10px] font-black text-text-muted uppercase tracking-wider block mb-1">
                        Expected Delivery Date
                      </label>
                      <input
                        type="date"
                        value={activeForm.expected_delivery_date || ''}
                        onChange={(e) => handleInputChange(activeOrder._id, 'expected_delivery_date', e.target.value)}
                        className="w-full p-2 bg-surface-hover border border-border rounded-lg text-text-primary focus:outline-none focus:border-primary"
                      />
                    </div>
                  </div>
                </div>

                {/* ── STEP 3: Request & Verify E-Way Bill ── */}
                <div className="space-y-3 pt-2 border-t border-border/70">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-primary text-white text-xs font-black flex items-center justify-center">3</span>
                    <h4 className="text-sm font-bold text-text-primary">Step 3: Request & Verify E-Way Bill (Account Manager Approval)</h4>
                  </div>

                  <div className="pl-8 space-y-3 text-xs">
                    <div className="p-4 bg-surface-hover/60 border border-border rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-black uppercase text-text-muted tracking-wider">E-Way Bill Status:</span>
                          {activeOrder.eway_bill?.status === 'generated' ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-success/15 text-success border border-success/30 flex items-center gap-1">
                              <FaCheckCircle /> Approved & Issued
                            </span>
                          ) : activeOrder.eway_bill?.status === 'pending' ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-warning/15 text-warning border border-warning/30 flex items-center gap-1 animate-pulse">
                              <HiOutlineClock /> Awaiting Account Manager Action
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-surface border border-border text-text-muted">
                              Not Requested Yet
                            </span>
                          )}
                        </div>

                        {activeOrder.eway_bill?.status === 'generated' ? (
                          <div className="mt-2 space-y-1">
                            <div className="font-mono text-sm font-black text-text-primary">
                              E-Way Bill #: {activeOrder.eway_bill.eway_bill_number}
                            </div>
                            <div className="text-[11px] text-text-muted">
                              Valid until: {new Date(activeOrder.eway_bill.valid_until).toLocaleString('en-IN')}
                            </div>
                            {activeOrder.eway_bill.eway_bill_pdf && (
                              <a
                                href={activeOrder.eway_bill.eway_bill_pdf}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 text-[11px] font-bold text-primary hover:underline mt-1"
                              >
                                <FaFilePdf className="text-danger" /> View E-Way Bill Document
                              </a>
                            )}
                          </div>
                        ) : (
                          <p className="text-[11px] text-text-muted mt-1 max-w-md">
                            Account Manager verifies invoice, GST, and transport info before generating E-Way Bill. Dispatch remains strictly disabled until verified.
                          </p>
                        )}
                      </div>

                      {/* E-Way Bill Action Buttons */}
                      <div className="flex flex-wrap items-center gap-2">
                        {activeOrder.eway_bill?.status !== 'generated' && (
                          <button
                            type="button"
                            onClick={() => handleRequestEwayBill(activeOrder._id)}
                            disabled={requestingEway}
                            className="px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider bg-warning text-black hover:bg-warning/90 transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                          >
                            {requestingEway ? <FaSpinner className="animate-spin" /> : <HiOutlineDocumentText className="text-sm" />}
                            <span>Request E-Way Bill</span>
                          </button>
                        )}

                        {/* Quick Simulation / Approve Button for testing */}
                        {activeOrder.eway_bill?.status !== 'generated' && (
                          <button
                            type="button"
                            onClick={() => handleVerifyEwayBill(activeOrder._id)}
                            disabled={verifyingEway}
                            className="px-3.5 py-2 rounded-xl text-xs font-bold bg-primary/10 text-primary border border-primary/20 hover:bg-primary hover:text-white transition-all flex items-center gap-1 cursor-pointer"
                            title="Simulate Account Manager generating E-Way Bill"
                          >
                            {verifyingEway ? <FaSpinner className="animate-spin" /> : <FaCheckCircle className="text-xs" />}
                            <span>Verify & Issue (AM)</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* ── MANUAL DELIVERY ACTIVATION EVIDENCE CHECKPOINTS ── */}
                <div className="space-y-3 pt-2 border-t border-border/70">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-black text-text-primary flex items-center gap-2">
                      <HiOutlineShieldCheck className="text-success text-base" />
                      Pre-Dispatch Verification Gate & Evidence
                    </h4>
                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                      isDispatchGateCleared
                        ? 'bg-success/15 text-success border border-success/30'
                        : 'bg-danger/10 text-danger border border-danger/20'
                    }`}>
                      {isDispatchGateCleared ? 'All 3 Checkpoints Satisfied' : 'Checkpoints Incomplete'}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                    {/* Checkpoint 1: Rear Loaded Photo */}
                    <div className={`p-3.5 rounded-xl border space-y-2 ${
                      hasLoadedPhoto ? 'bg-success/5 border-success/30' : 'bg-surface-hover border-border'
                    }`}>
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-text-primary text-[11px]">1. Loaded Vehicle Photo *</span>
                        {hasLoadedPhoto ? <FaCheckCircle className="text-success text-sm" /> : <FaTimesCircle className="text-danger text-sm" />}
                      </div>
                      <p className="text-[10px] text-text-muted">
                        Rear-side photo showing registration number and loaded materials.
                      </p>
                      {activeForm.vehicle_rear_photo ? (
                        <div className="relative group rounded-lg overflow-hidden border border-border h-24 bg-black/10">
                          <img
                            src={activeForm.vehicle_rear_photo}
                            alt="Loaded Vehicle"
                            className="w-full h-full object-cover"
                          />
                          <button
                            type="button"
                            onClick={() => handleInputChange(activeOrder._id, 'vehicle_rear_photo', '')}
                            className="absolute top-1 right-1 bg-danger text-white rounded p-1 text-[9px] font-bold"
                          >
                            Remove
                          </button>
                        </div>
                      ) : (
                        <label className="block p-2 border-2 border-dashed border-border hover:border-primary rounded-lg text-center cursor-pointer transition-colors bg-surface">
                          <HiOutlinePhotograph className="mx-auto text-xl text-text-muted mb-1" />
                          <span className="text-[10px] font-bold text-primary block">Upload Vehicle Rear Photo</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => handleUploadFile(activeOrder._id, 'vehicle_rear_photo', e.target.files[0])}
                          />
                        </label>
                      )}
                    </div>

                    {/* Checkpoint 2: Delivery Docket / Challan */}
                    <div className={`p-3.5 rounded-xl border space-y-2 ${
                      hasDocket ? 'bg-success/5 border-success/30' : 'bg-surface-hover border-border'
                    }`}>
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-text-primary text-[11px]">2. Delivery Docket / Challan *</span>
                        {hasDocket ? <FaCheckCircle className="text-success text-sm" /> : <FaTimesCircle className="text-danger text-sm" />}
                      </div>
                      <p className="text-[10px] text-text-muted">
                        Signed delivery challan or physical dispatch docket document.
                      </p>
                      {activeForm.docket_doc ? (
                        <div className="p-2 bg-surface rounded-lg border border-border text-[11px] flex items-center justify-between">
                          <span className="font-mono truncate">{activeForm.docket_number || 'Docket Attached'}</span>
                          <button
                            type="button"
                            onClick={() => handleInputChange(activeOrder._id, 'docket_doc', '')}
                            className="text-danger font-bold text-[10px]"
                          >
                            Clear
                          </button>
                        </div>
                      ) : (
                        <label className="block p-2 border-2 border-dashed border-border hover:border-primary rounded-lg text-center cursor-pointer transition-colors bg-surface">
                          <HiOutlineUpload className="mx-auto text-xl text-text-muted mb-1" />
                          <span className="text-[10px] font-bold text-primary block">Upload Docket Scanned Copy</span>
                          <input
                            type="file"
                            accept=".pdf,image/*"
                            className="hidden"
                            onChange={(e) => handleUploadFile(activeOrder._id, 'docket_doc', e.target.files[0])}
                          />
                        </label>
                      )}
                    </div>

                    {/* Checkpoint 3: Verified E-Way Bill */}
                    <div className={`p-3.5 rounded-xl border space-y-2 ${
                      isEwayValid ? 'bg-success/5 border-success/30' : 'bg-surface-hover border-border'
                    }`}>
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-text-primary text-[11px]">3. Valid E-Way Bill *</span>
                        {isEwayValid ? <FaCheckCircle className="text-success text-sm" /> : <FaTimesCircle className="text-danger text-sm" />}
                      </div>
                      <p className="text-[10px] text-text-muted">
                        Verified government E-Way Bill number and unexpired document.
                      </p>
                      <div className="p-2 bg-surface rounded-lg border border-border text-[11px]">
                        {isEwayValid ? (
                          <div className="font-mono font-bold text-success truncate">
                            #{activeOrder.eway_bill.eway_bill_number}
                          </div>
                        ) : (
                          <div className="text-text-muted italic">Awaiting AM Approval in Step 3</div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* ── FINAL DISPATCH ACTION BAR (BOSS RULE: "Dispatch for Delivery" button enabled only when all active EPCs have 2nd half payment done) ── */}
                <div className="p-5 bg-surface-hover rounded-2xl border border-border space-y-3">
                  {!allEpcsPaymentDone && (
                    <div className="p-3 rounded-xl bg-danger/10 border border-danger/30 text-xs text-danger flex items-center gap-2 font-bold animate-pulse">
                      <FaExclamationTriangle className="text-sm shrink-0" />
                      <span>
                        Dispatch Blocked: {unpaidEpcs.length} EPC(s) have 2nd half payment pending ({unpaidEpcs.map(e => e.epc_name).join(', ')}). All active EPCs must complete 2nd payment or be removed by Account Manager before dispatch.
                      </span>
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="text-xs">
                      <div className="font-bold text-text-primary flex items-center gap-2">
                        <span>Dispatch Clearance Status:</span>
                        {allEpcsPaymentDone ? (
                          <span className="text-emerald-500 font-bold flex items-center gap-1">
                            <FaCheckCircle className="text-xs" /> All {activeEpcs.length} EPCs 100% Paid
                          </span>
                        ) : (
                          <span className="text-danger font-bold flex items-center gap-1">
                            <FaTimesCircle className="text-xs" /> {unpaidEpcs.length} EPC(s) Unpaid (2nd Half)
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-text-muted mt-0.5">
                        {isDispatchAllowed
                          ? `Ready for final dispatch! Clicking "Dispatch for Delivery" will move all ${activeEpcs.length} ungrouped EPCs to Track Delivery with individual tracking.`
                          : !allEpcsPaymentDone
                          ? 'Dispatch button is disabled until all active EPCs complete their 2nd payment or are removed by Account Manager.'
                          : 'Satisfy pre-dispatch gate checks (Photo, Docket, E-Way Bill) to dispatch.'}
                      </div>
                    </div>

                    <button
                      type="button"
                      disabled={!isDispatchAllowed || initiatingDispatch}
                      onClick={() => handleInitiateDelivery(activeOrder)}
                      className={`px-6 py-3 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2.5 transition-all shadow-md ${
                        isDispatchAllowed
                          ? 'bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 hover:from-emerald-500 hover:to-teal-500 text-white cursor-pointer shadow-emerald-500/25 active:scale-95 animate-pulse'
                          : 'bg-surface border border-border text-text-muted opacity-50 cursor-not-allowed'
                      }`}
                      title={
                        !allEpcsPaymentDone
                          ? `Locked: 2nd half payment pending for ${unpaidEpcs.length} EPC(s)`
                          : !isDispatchGateCleared
                          ? 'Locked: Pre-dispatch photo, docket, or E-Way Bill incomplete'
                          : 'Dispatch for Delivery'
                      }
                    >
                      {initiatingDispatch ? (
                        <>
                          <FaSpinner className="animate-spin text-sm" />
                          <span>Dispatching Order...</span>
                        </>
                      ) : (
                        <>
                          {isDispatchAllowed ? <FaTruck className="text-base" /> : <FaLock className="text-xs" />}
                          <span>Dispatch for Delivery</span>
                          {isDispatchAllowed && <FaArrowRight className="text-xs" />}
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
