import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HiOutlineSearch, HiOutlineFilter, HiOutlineRefresh,
  HiOutlineCheckCircle, HiOutlineClock, HiOutlineExclamation,
  HiOutlineTruck, HiOutlineLocationMarker, HiOutlineClipboardCheck,
  HiOutlineCube, HiOutlineEye, HiOutlineChevronDown, HiOutlineChevronUp
} from 'react-icons/hi';
import {
  FaBoxes, FaTruck, FaMapMarkerAlt, FaCalendarAlt,
  FaCheckCircle, FaSpinner, FaExchangeAlt, FaHistory,
  FaPhoneAlt, FaEnvelope, FaShieldAlt, FaExternalLinkAlt,
  FaLayerGroup, FaArrowRight, FaLock, FaWarehouse,
  FaBuilding, FaTools, FaBarcode, FaExclamationTriangle,
  FaCheckDouble, FaWrench, FaClipboardCheck
} from 'react-icons/fa';
import { useDispatch } from 'react-redux';
import { setAlert } from '@/features/alert.slice';

import {
  getDeliveryOrders,
  reserveDeliveryInventory,
  requestDeliveryOrderProcurement,
  inwardDeliveryOrder,
  claimIncomingShipment,
  sendOrderForDelivery,
  recordInwardDiscrepancy,
  updateSupplyStatus,
  updateKitAssembly
} from '../../api/deliveryOrders';

import Button from '../../components/Button';
import Dialog from '../../components/Dialog';
import CustomInput from '../../components/CustomInput';
import DropdownWithSearchInput from '../../components/DropdownWithSearchInput';

export default function NewOrdersDeliveryManager({ onNavigateToOutward }) {
  const dispatch = useDispatch();

  // Orders State
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState({
    total: 0,
    new_orders: 0,
    ready_for_dispatch: 0,
    in_transit: 0,
    delivered: 0
  });

  // Filters State
  const [search, setSearch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedQueueTab, setSelectedQueueTab] = useState('all'); // Boss Spec 14 Queue Filters
  const [selectedState, setSelectedState] = useState('all');
  const [selectedDistrict, setSelectedDistrict] = useState('all');
  const [pincodeFilter, setPincodeFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [expandedCards, setExpandedCards] = useState({});

  // BOSKIT Preparation & Assembly Modal State
  const [assemblyModalOpen, setAssemblyModalOpen] = useState(false);
  const [selectedOrderForAssembly, setSelectedOrderForAssembly] = useState(null);
  const [submittingAssembly, setSubmittingAssembly] = useState(false);
  const [kitBarcodeLabel, setKitBarcodeLabel] = useState('');

  // Inward Modal State
  const [inwardModalOpen, setInwardModalOpen] = useState(false);
  const [selectedOrderForInward, setSelectedOrderForInward] = useState(null);
  const [inwardInputs, setInwardInputs] = useState({});
  const [inwardRemarks, setInwardRemarks] = useState('');
  const [submittingInward, setSubmittingInward] = useState(false);
  const [activeInwardTab, setActiveInwardTab] = useState('inward'); // 'inward' or 'history'

  // Reserve Inventory Modal State
  const [reserveModalOpen, setReserveModalOpen] = useState(false);
  const [selectedOrderForReserve, setSelectedOrderForReserve] = useState(null);
  const [selectedItemForReserve, setSelectedItemForReserve] = useState(null);
  const [reserveQtyInput, setReserveQtyInput] = useState(0);
  const [submittingReserve, setSubmittingReserve] = useState(false);

  // Account Panel Procurement Requisition Modal State
  const [procureModalOpen, setProcureModalOpen] = useState(false);
  const [selectedOrderForProcure, setSelectedOrderForProcure] = useState(null);
  const [selectedItemForProcure, setSelectedItemForProcure] = useState(null);
  const [procureQtyInput, setProcureQtyInput] = useState(0);
  const [procureNotes, setProcureNotes] = useState('');
  const [submittingProcure, setSubmittingProcure] = useState(false);

  // Send for Delivery State & Handler
  const [sendingOrderId, setSendingOrderId] = useState(null);

  const handleOpenAssemblyModal = (order) => {
    setSelectedOrderForAssembly(order);
    setKitBarcodeLabel(order.kit_assembly_details?.kit_serial_barcode || `SK-KIT-${order.order_number}-${Date.now().toString().slice(-4)}`);
    setAssemblyModalOpen(true);
  };

  const handleAdvanceAssembly = async (stage) => {
    if (!selectedOrderForAssembly) return;
    try {
      setSubmittingAssembly(true);
      const res = await updateKitAssembly(selectedOrderForAssembly._id, {
        stage,
        kit_serial_barcode: kitBarcodeLabel
      });
      if (res.status === 'success') {
        dispatch(setAlert({ message: res.message, type: 'success' }));
        setSelectedOrderForAssembly(res.data);
        fetchOrders();
      }
    } catch (err) {
      dispatch(setAlert({
        message: err.response?.data?.message || 'Failed to update kit assembly stage.',
        type: 'error'
      }));
    } finally {
      setSubmittingAssembly(false);
    }
  };

  const handleSendForDelivery = async (order) => {
    const totalPendingItems = (order.items || []).reduce((acc, it) => acc + (it.pending_qty || 0), 0);
    if (totalPendingItems > 0) {
      dispatch(setAlert({
        message: `Send for Delivery locked! ${totalPendingItems} units must be inwarded first.`,
        type: 'warning'
      }));
      return;
    }

    try {
      setSendingOrderId(order._id);
      const res = await sendOrderForDelivery(order._id);
      if (res.status === 'success') {
        dispatch(setAlert({
          message: res.message || 'Order successfully sent for delivery! Transferred to Out for Delivery.',
          type: 'success'
        }));
        await fetchOrders();
        if (onNavigateToOutward) {
          onNavigateToOutward(order);
        }
      }
    } catch (err) {
      dispatch(setAlert({
        message: err.response?.data?.message || 'Failed to send order for delivery.',
        type: 'error'
      }));
    } finally {
      setSendingOrderId(null);
    }
  };

  // Claim Incoming Shipment State & Handler
  const [claimingShipmentId, setClaimingShipmentId] = useState(null);

  const handleClaimShipment = async (order) => {
    try {
      setClaimingShipmentId(order._id);
      const res = await claimIncomingShipment(order._id, {
        dock_bay: order.incoming_truck_group?.unloaded_dock || 'Receiving Dock #2',
        remarks: `Consignment claimed from incoming truck ${order.incoming_truck_group?.vehicle_number || ''}`
      });
      if (res.status === 'success') {
        dispatch(setAlert({
          message: res.message || 'Incoming truck goods claimed & received at warehouse dock!',
          type: 'success'
        }));
        fetchOrders();
      }
    } catch (err) {
      dispatch(setAlert({
        message: err.response?.data?.message || 'Failed to claim incoming shipment.',
        type: 'error'
      }));
    } finally {
      setClaimingShipmentId(null);
    }
  };

  // Load orders
  const fetchOrders = async () => {
    try {
      setLoading(true);
      const params = {};
      if (selectedStatus !== 'all') params.status = selectedStatus;
      if (selectedState !== 'all') params.state = selectedState;
      if (selectedDistrict !== 'all') params.district = selectedDistrict;
      if (pincodeFilter.trim()) params.pincode = pincodeFilter.trim();
      if (search.trim()) params.search = search.trim();
      if (dateFilter) {
        params.startDate = dateFilter;
        params.endDate = dateFilter;
      }

      const res = await getDeliveryOrders(params);
      if (res.status === 'success') {
        setOrders(res.data || []);
        if (res.summary) setSummary(res.summary);
      }
    } catch (err) {
      console.error('Failed to fetch delivery orders:', err);
      dispatch(setAlert({ message: 'Failed to load delivery orders', type: 'error' }));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [selectedStatus, selectedState, selectedDistrict, pincodeFilter, dateFilter]);

  // Handle Search on Enter or debounce
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchOrders();
  };

  // Extract unique states and districts for filters
  const stateOptions = useMemo(() => {
    const states = new Set(orders.map(o => o.destination?.state).filter(Boolean));
    return ['all', ...Array.from(states)];
  }, [orders]);

  const districtOptions = useMemo(() => {
    const filteredByState = selectedState === 'all'
      ? orders
      : orders.filter(o => o.destination?.state?.toLowerCase() === selectedState.toLowerCase());
    const districts = new Set(filteredByState.map(o => o.destination?.district).filter(Boolean));
    return ['all', ...Array.from(districts)];
  }, [orders, selectedState]);

  const toggleCardExpansion = (orderId) => {
    setExpandedCards(prev => ({
      ...prev,
      [orderId]: !prev[orderId]
    }));
  };

  // Boss Specification: 14 Queue Filter Counts
  const queueCounts = useMemo(() => {
    let pickupPending = 0;
    let supplierDispatchPending = 0;
    let inTransitSupplier = 0;
    let pendingInward = 0;
    let kitPrepRequired = 0;
    let awaitingComponents = 0;
    let readyForDispatch = 0;
    let overdue = 0;

    orders.forEach(ord => {
      const totalPending = (ord.items || []).reduce((acc, it) => acc + (it.pending_qty || 0), 0);
      if ((ord.items || []).some(it => it.supply_fulfilment_method === 'company_pickup' && it.pending_qty > 0)) pickupPending++;
      if ((ord.items || []).some(it => it.supply_fulfilment_method === 'supplier_delivery' && it.pending_qty > 0 && it.supply_status !== 'in_transit')) supplierDispatchPending++;
      if ((ord.items || []).some(it => ['picked_up', 'dispatched', 'in_transit'].includes(it.supply_status) && it.pending_qty > 0)) inTransitSupplier++;
      if (totalPending > 0) pendingInward++;
      if (totalPending === 0 && ord.kit_preparation_status !== 'kit_ready') kitPrepRequired++;
      if (ord.kit_preparation_status === 'awaiting_components' || (ord.discrepancy_details && ord.discrepancy_details.length > 0)) awaitingComponents++;
      if (totalPending === 0 && (ord.kit_preparation_status === 'kit_ready' || ord.delivery_status === 'ready_for_dispatch')) readyForDispatch++;
      if (ord.sla_days && (Date.now() - new Date(ord.order_date).getTime()) > (ord.sla_days * 24 * 3600 * 1000)) overdue++;
    });

    return {
      total: orders.length,
      pickupPending,
      supplierDispatchPending,
      inTransitSupplier,
      pendingInward,
      kitPrepRequired,
      awaitingComponents,
      readyForDispatch,
      overdue
    };
  }, [orders]);

  // Displayed Orders filtered by Queue Tab
  const displayedOrders = useMemo(() => {
    if (selectedQueueTab === 'all') return orders;
    return orders.filter(ord => {
      const totalPending = (ord.items || []).reduce((acc, it) => acc + (it.pending_qty || 0), 0);
      if (selectedQueueTab === 'pickup_pending') {
        return (ord.items || []).some(it => it.supply_fulfilment_method === 'company_pickup' && it.pending_qty > 0);
      }
      if (selectedQueueTab === 'supplier_dispatch_pending') {
        return (ord.items || []).some(it => it.supply_fulfilment_method === 'supplier_delivery' && it.pending_qty > 0 && it.supply_status !== 'in_transit');
      }
      if (selectedQueueTab === 'in_transit_supplier') {
        return (ord.items || []).some(it => ['picked_up', 'dispatched', 'in_transit'].includes(it.supply_status) && it.pending_qty > 0);
      }
      if (selectedQueueTab === 'pending_inward') {
        return totalPending > 0;
      }
      if (selectedQueueTab === 'kit_prep_required') {
        return totalPending === 0 && ord.kit_preparation_status !== 'kit_ready';
      }
      if (selectedQueueTab === 'awaiting_components') {
        return ord.kit_preparation_status === 'awaiting_components' || (ord.discrepancy_details && ord.discrepancy_details.length > 0);
      }
      if (selectedQueueTab === 'ready_for_dispatch') {
        return totalPending === 0 && (ord.kit_preparation_status === 'kit_ready' || ord.delivery_status === 'ready_for_dispatch');
      }
      if (selectedQueueTab === 'overdue') {
        return ord.sla_days && (Date.now() - new Date(ord.order_date).getTime()) > (ord.sla_days * 24 * 3600 * 1000);
      }
      return true;
    });
  }, [orders, selectedQueueTab]);

  // Open Material Inward Modal
  const handleOpenInwardModal = (order) => {
    setSelectedOrderForInward(order);
    const initialInputs = {};
    (order.items || []).forEach(it => {
      initialInputs[it.sku] = {
        qty: it.pending_qty,
        damaged_qty: 0,
        missing_qty: 0,
        rack_location: it.rack_location || ''
      };
    });
    setInwardInputs(initialInputs);
    setInwardRemarks('');
    setActiveInwardTab('inward');
    setInwardModalOpen(true);
  };

  // Submit Inward Form (Handles Clean Inward & Discrepancy Logging)
  const handleSubmitInward = async (e) => {
    e.preventDefault();
    if (!selectedOrderForInward) return;

    const itemsToInward = [];
    let hasDiscrepancy = false;

    for (const it of (selectedOrderForInward?.items || [])) {
      const input = inwardInputs[it.sku];
      const qty = parseInt(input?.qty) || 0;
      const damagedQty = parseInt(input?.damaged_qty) || 0;
      const missingQty = parseInt(input?.missing_qty) || 0;

      if (damagedQty > 0 || missingQty > 0) {
        hasDiscrepancy = true;
      }

      if (qty > 0 || damagedQty > 0 || missingQty > 0) {
        itemsToInward.push({
          sku: it.sku,
          qty,
          damaged_qty: damagedQty,
          missing_qty: missingQty,
          rack_location: input?.rack_location || it.rack_location
        });
      }
    }

    if (itemsToInward.length === 0) {
      dispatch(setAlert({
        message: 'Please enter at least one positive inward quantity.',
        type: 'warning'
      }));
      return;
    }

    try {
      setSubmittingInward(true);
      if (hasDiscrepancy) {
        for (const itm of itemsToInward) {
          if (itm.damaged_qty > 0 || itm.missing_qty > 0) {
            await recordInwardDiscrepancy(selectedOrderForInward._id, {
              sku: itm.sku,
              received_qty: itm.qty,
              damaged_qty: itm.damaged_qty,
              missing_qty: itm.missing_qty,
              remarks: inwardRemarks
            });
          } else if (itm.qty > 0) {
            await inwardDeliveryOrder(selectedOrderForInward._id, {
              items: [{ sku: itm.sku, qty: itm.qty, rack_location: itm.rack_location }],
              remarks: inwardRemarks
            });
          }
        }
        dispatch(setAlert({
          message: 'Inward recorded with discrepancy logging. Accounts team notified for debit note/replacement.',
          type: 'warning'
        }));
      } else {
        const res = await inwardDeliveryOrder(selectedOrderForInward._id, {
          items: itemsToInward,
          remarks: inwardRemarks
        });
        dispatch(setAlert({
          message: res.message || 'Material inward verified & updated!',
          type: 'success'
        }));
      }

      setInwardModalOpen(false);
      fetchOrders();
    } catch (err) {
      console.error('Inward error:', err);
      dispatch(setAlert({
        message: err.response?.data?.message || 'Failed to record material inward.',
        type: 'error'
      }));
    } finally {
      setSubmittingInward(false);
    }
  };

  // Open Reserve Inventory Modal
  const handleOpenReserveModal = (order, item) => {
    setSelectedOrderForReserve(order);
    setSelectedItemForReserve(item);
    setReserveQtyInput(item.allocated_stock || Math.min(item.pending_qty, item.available_inventory_stock));
    setReserveModalOpen(true);
  };

  const handleSaveReservation = async () => {
    if (!selectedOrderForReserve || !selectedItemForReserve) return;
    const qty = parseInt(reserveQtyInput);
    if (isNaN(qty) || qty < 0) {
      dispatch(setAlert({ message: 'Enter a valid quantity', type: 'error' }));
      return;
    }
    if (qty > selectedItemForReserve.available_inventory_stock) {
      dispatch(setAlert({
        message: `Cannot allocate more than available warehouse stock (${selectedItemForReserve.available_inventory_stock})`,
        type: 'error'
      }));
      return;
    }

    try {
      setSubmittingReserve(true);
      const res = await reserveDeliveryInventory(selectedOrderForReserve._id, {
        sku: selectedItemForReserve.sku,
        allocated_stock: qty
      });
      if (res.status === 'success') {
        dispatch(setAlert({ message: 'Inventory stock allocated and reserved!', type: 'success' }));
        setReserveModalOpen(false);
        fetchOrders();
      }
    } catch (err) {
      dispatch(setAlert({ message: err.response?.data?.message || 'Failed to allocate stock', type: 'error' }));
    } finally {
      setSubmittingReserve(false);
    }
  };

  // Open Procurement Requisition Modal for Account Manager
  const handleOpenProcureModal = (order, item) => {
    setSelectedOrderForProcure(order);
    setSelectedItemForProcure(item);
    const shortage = Math.max(0, (item.pending_qty || 0) - (item.available_inventory_stock || 0));
    setProcureQtyInput(shortage > 0 ? shortage : item.pending_qty);
    setProcureNotes(`BOS Kit stock shortage for Order #${order.order_number} (${order.customer_name}). Please procure from vendor.`);
    setProcureModalOpen(true);
  };

  const handleSaveProcureRequest = async (e) => {
    if (e) e.preventDefault();
    if (!selectedOrderForProcure || !selectedItemForProcure) return;
    const qty = parseInt(procureQtyInput);
    if (isNaN(qty) || qty <= 0) {
      dispatch(setAlert({ message: 'Enter a valid quantity to requisition.', type: 'error' }));
      return;
    }

    try {
      setSubmittingProcure(true);
      const res = await requestDeliveryOrderProcurement(selectedOrderForProcure._id, {
        sku: selectedItemForProcure.sku,
        requested_qty: qty,
        notes: procureNotes
      });

      if (res.status === 'success') {
        dispatch(setAlert({
          message: res.message || 'Requisition forwarded to Account Manager login!',
          type: 'success'
        }));
        setProcureModalOpen(false);
        fetchOrders();
      }
    } catch (err) {
      dispatch(setAlert({
        message: err.response?.data?.message || 'Failed to send requisition to Account Panel.',
        type: 'error'
      }));
    } finally {
      setSubmittingProcure(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* ── Top Metric KPI Summary (Boss Requirement: 3 Focused Cards) ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: New Orders (Confirmed) */}
        <div
          onClick={() => setSelectedStatus('all')}
          className={`card p-4 rounded-2xl cursor-pointer transition-all border ${
            selectedStatus === 'all'
              ? 'border-primary ring-2 ring-primary/20 bg-primary/5 shadow-sm'
              : 'border-border hover:border-primary/40 bg-surface'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-text-secondary uppercase tracking-wider">New Orders (Confirmed)</span>
            <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center text-sm font-bold">
              <FaBoxes />
            </div>
          </div>
          <div className="text-3xl font-black text-text-primary mt-2">
            {summary.total || 0}
          </div>
          <div className="text-[11px] text-text-muted mt-1">Confirmed by Account Manager for fulfillment</div>
        </div>

        {/* Card 2: Pending Inward */}
        <div
          onClick={() => setSelectedStatus('pending_inward')}
          className={`card p-4 rounded-2xl cursor-pointer transition-all border ${
            selectedStatus === 'pending_inward'
              ? 'border-info ring-2 ring-info/20 bg-info/5 shadow-sm'
              : 'border-border hover:border-info/40 bg-surface'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-info uppercase tracking-wider">Pending Inward</span>
            <div className="w-9 h-9 rounded-xl bg-info/10 text-info flex items-center justify-center text-sm font-bold">
              <HiOutlineClock />
            </div>
          </div>
          <div className="text-3xl font-black text-info mt-2">
            {summary.pending_inward || summary.new_orders || 0}
          </div>
          <div className="text-[11px] text-text-muted mt-1">Awaiting BOS Kit physical inward & verification</div>
        </div>

        {/* Card 3: Overdue Orders (SLA Exceeded) */}
        <div
          onClick={() => setSelectedStatus('overdue')}
          className={`card p-4 rounded-2xl cursor-pointer transition-all border ${
            selectedStatus === 'overdue'
              ? 'border-danger ring-2 ring-danger/30 bg-danger/10 shadow-sm'
              : 'border-danger/40 hover:border-danger bg-danger/5'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-danger uppercase tracking-wider flex items-center gap-1.5">
              <HiOutlineExclamation className="text-base" /> Overdue Orders
            </span>
            <div className="w-9 h-9 rounded-xl bg-danger/15 text-danger flex items-center justify-center text-sm font-bold">
              ⚠️
            </div>
          </div>
          <div className="text-3xl font-black text-danger mt-2 flex items-baseline gap-2">
            <span>{summary.overdue_orders || 0}</span>
            <span className="text-xs font-semibold text-danger/80">orders delayed</span>
          </div>
          <div className="text-[11px] text-danger/80 mt-1 font-medium">Exceeded SLA / Max Days defined in Admin Panel</div>
        </div>
      </div>

      {/* ── Filters & Search Control Bar ── */}
      <div className="bg-surface border border-border p-4 rounded-2xl space-y-3 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search Box */}
          <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-md">
            <HiOutlineSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted text-base" />
            <input
              type="text"
              placeholder="Search by DO #, Order #, Client, Truck/Group, Phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-xs bg-surface-hover border border-border rounded-xl text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary transition-all"
            />
          </form>

          {/* Quick Refresh */}
          <button
            onClick={fetchOrders}
            disabled={loading}
            className="self-end md:self-auto px-3 py-2 rounded-xl bg-surface-hover border border-border text-text-secondary hover:text-text-primary hover:border-primary text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <HiOutlineRefresh className={`text-sm ${loading ? 'animate-spin text-primary' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>

        {/* Filter Dropdowns Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 pt-2 border-t border-border/60">
          {/* Status Filter */}
          <div>
            <label className="text-[10px] font-black text-text-muted uppercase tracking-wider block mb-1">
              Order Status
            </label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full py-1.5 px-2.5 text-xs bg-surface-hover border border-border rounded-lg text-text-primary focus:outline-none focus:border-primary font-medium"
            >
              <option value="all">All New Orders</option>
              <option value="pending_inward">Pending Inward</option>
              <option value="overdue">⚠️ Overdue Orders</option>
              <option value="partially_inwarded">Partially Inwarded</option>
              <option value="ready_for_dispatch">Ready for Dispatch</option>
              <option value="in_transit">In Transit</option>
              <option value="delivered">Delivered</option>
            </select>
          </div>

          {/* State Filter */}
          <div>
            <label className="text-[10px] font-black text-text-muted uppercase tracking-wider block mb-1">
              State
            </label>
            <select
              value={selectedState}
              onChange={(e) => {
                setSelectedState(e.target.value);
                setSelectedDistrict('all');
              }}
              className="w-full py-1.5 px-2.5 text-xs bg-surface-hover border border-border rounded-lg text-text-primary focus:outline-none focus:border-primary font-medium"
            >
              <option value="all">All States</option>
              {stateOptions.filter(s => s !== 'all').map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          {/* District Filter */}
          <div>
            <label className="text-[10px] font-black text-text-muted uppercase tracking-wider block mb-1">
              District
            </label>
            <select
              value={selectedDistrict}
              onChange={(e) => setSelectedDistrict(e.target.value)}
              className="w-full py-1.5 px-2.5 text-xs bg-surface-hover border border-border rounded-lg text-text-primary focus:outline-none focus:border-primary font-medium"
            >
              <option value="all">All Districts</option>
              {districtOptions.filter(d => d !== 'all').map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>

          {/* PIN Code Filter */}
          <div>
            <label className="text-[10px] font-black text-text-muted uppercase tracking-wider block mb-1">
              PIN Code
            </label>
            <input
              type="text"
              placeholder="e.g. 411026"
              value={pincodeFilter}
              onChange={(e) => setPincodeFilter(e.target.value)}
              className="w-full py-1.5 px-2.5 text-xs bg-surface-hover border border-border rounded-lg text-text-primary focus:outline-none focus:border-primary font-medium placeholder:text-text-muted"
            />
          </div>

          {/* Date Filter */}
          <div>
            <label className="text-[10px] font-black text-text-muted uppercase tracking-wider block mb-1">
              Order Date
            </label>
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-full py-1.5 px-2.5 text-xs bg-surface-hover border border-border rounded-lg text-text-primary focus:outline-none focus:border-primary font-medium"
            />
          </div>
        </div>
      </div>

      {/* ── Boss Specification: 14 Queue Filter Tabs Bar ── */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
        {[
          { id: 'all', label: 'All Orders', count: queueCounts.total, icon: FaBoxes },
          { id: 'pickup_pending', label: 'Pickup Pending', count: queueCounts.pickupPending, icon: FaTruck, color: 'text-cyan-400' },
          { id: 'supplier_dispatch_pending', label: 'Supplier Dispatch Pending', count: queueCounts.supplierDispatchPending, icon: FaBuilding, color: 'text-amber-400' },
          { id: 'in_transit_supplier', label: 'In-Transit (Supplier)', count: queueCounts.inTransitSupplier, icon: HiOutlineTruck, color: 'text-blue-400' },
          { id: 'pending_inward', label: 'Inward Pending', count: queueCounts.pendingInward, icon: HiOutlineClock, color: 'text-orange-400' },
          { id: 'kit_prep_required', label: 'BOSKIT Assembly Required', count: queueCounts.kitPrepRequired, icon: FaTools, color: 'text-purple-400' },
          { id: 'awaiting_components', label: 'Awaiting Components / Discrepancy', count: queueCounts.awaitingComponents, icon: FaExclamationTriangle, color: 'text-rose-400' },
          { id: 'ready_for_dispatch', label: 'Ready for Dispatch', count: queueCounts.readyForDispatch, icon: FaCheckCircle, color: 'text-emerald-400' },
          { id: 'overdue', label: 'SLA Overdue', count: queueCounts.overdue, icon: HiOutlineExclamation, color: 'text-red-400' },
        ].map((tab) => {
          const isActive = selectedQueueTab === tab.id;
          const TabIcon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setSelectedQueueTab(tab.id)}
              className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all duration-200 flex items-center gap-2 border cursor-pointer ${
                isActive
                  ? 'bg-primary text-white border-primary shadow-sm'
                  : 'bg-surface hover:bg-surface-hover border-border text-text-secondary hover:text-text-primary'
              }`}
            >
              <TabIcon className={`text-xs ${isActive ? 'text-white' : tab.color || 'text-text-muted'}`} />
              <span>{tab.label}</span>
              <span
                className={`px-1.5 py-0.5 rounded-full text-[10px] font-black font-mono ${
                  isActive
                    ? 'bg-white/20 text-white'
                    : 'bg-surface-hover border border-border/80 text-text-primary'
                }`}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* ── Order Cards List ── */}
      {loading ? (
        <div className="card p-12 text-center text-text-muted space-y-3 bg-surface border border-border rounded-2xl">
          <FaSpinner className="animate-spin text-3xl text-primary mx-auto" />
          <div className="text-sm font-bold text-text-primary">Loading Delivery Orders...</div>
          <div className="text-xs">Fetching confirmed orders forwarded from Account Manager & Procurement.</div>
        </div>
      ) : displayedOrders.length === 0 ? (
        <div className="card p-12 text-center text-text-muted space-y-3 bg-surface border border-border rounded-2xl">
          <FaBoxes className="text-4xl text-text-muted opacity-30 mx-auto" />
          <div className="text-base font-bold text-text-primary">No Delivery Orders Found</div>
          <div className="text-xs max-w-md mx-auto">
            No orders match the selected queue filter ({selectedQueueTab.replace(/_/g, ' ')}). Clear filters or select another category.
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {displayedOrders.map((ord) => {
            const isExpanded = !!expandedCards[ord._id];
            const isPartiallyInwarded = ord.delivery_status === 'partially_inwarded';
            const isReadyForDispatch = ord.delivery_status === 'ready_for_dispatch';
            const isInTransit = ord.delivery_status === 'in_transit';
            const isDelivered = ord.delivery_status === 'delivered';

            const totalOrderedItems = (ord.items || []).reduce((acc, it) => acc + (it.ordered_qty || 0), 0);
            const totalReceivedItems = (ord.items || []).reduce((acc, it) => acc + (it.received_qty || 0), 0);
            const totalPendingItems = (ord.items || []).reduce((acc, it) => acc + (it.pending_qty || 0), 0);
            const inwardPercent = totalOrderedItems > 0 ? Math.round((totalReceivedItems / totalOrderedItems) * 100) : 0;

            return (
              <div
                key={ord._id}
                className={`card rounded-2xl border transition-all duration-300 overflow-hidden ${
                  isReadyForDispatch
                    ? 'border-success/40 bg-gradient-to-r from-success/5 via-surface to-surface'
                    : isPartiallyInwarded
                    ? 'border-warning/40 bg-gradient-to-r from-warning/5 via-surface to-surface'
                    : 'border-border bg-surface'
                }`}
              >
                {/* ── Top Header Strip ── */}
                <div className="p-5 border-b border-border/70 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-base font-black text-text-primary flex items-center gap-1.5 flex-wrap">
                        <span className="text-primary font-mono">{ord.delivery_order_id}</span>
                        <span className="text-text-muted font-normal text-xs">• Order #{ord.order_number}</span>
                        {ord.delivery_number && (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                            <FaTruck className="text-[9px]" /> Delivery #: {ord.delivery_number}
                          </span>
                        )}
                      </span>

                      {/* Status Badges */}
                      {ord.is_overdue && (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-danger/15 text-danger border border-danger/30 flex items-center gap-1 animate-pulse">
                          ⚠️ Overdue ({ord.overdue_days} {ord.overdue_days === 1 ? 'day' : 'days'})
                        </span>
                      )}
                      {ord.delivery_status === 'new_order' && (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-info/10 text-info border border-info/20 flex items-center gap-1">
                          <HiOutlineClock className="text-xs" /> New Order
                        </span>
                      )}
                      {isPartiallyInwarded && (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-warning/15 text-warning border border-warning/30 flex items-center gap-1 animate-pulse">
                          <HiOutlineExclamation className="text-xs" /> Partially Inwarded ({inwardPercent}%)
                        </span>
                      )}
                      {isReadyForDispatch && (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-success/15 text-success border border-success/30 flex items-center gap-1">
                          <FaCheckCircle className="text-xs" /> Ready for Dispatch
                        </span>
                      )}
                      {isInTransit && (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-primary/15 text-primary border border-primary/30 flex items-center gap-1">
                          <FaTruck className="text-xs" /> In Transit
                        </span>
                      )}
                      {isDelivered && (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                          <HiOutlineClipboardCheck className="text-xs" /> Delivered
                        </span>
                      )}

                      {/* Multi-EPC Consignment Badge */}
                      {ord.epcs && ord.epcs.length > 0 && (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-purple-500/15 text-purple-400 border border-purple-500/30 flex items-center gap-1">
                          <FaLayerGroup className="text-[9px]" /> {ord.epcs.length} EPCs Consolidated
                        </span>
                      )}

                      {/* BOSKIT Assembly Badge */}
                      {ord.kit_preparation_status && ord.kit_preparation_status !== 'not_required' && (
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border flex items-center gap-1 ${
                          ord.kit_preparation_status === 'kit_ready'
                            ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                            : ord.kit_preparation_status === 'in_assembly'
                            ? 'bg-purple-500/15 text-purple-400 border-purple-500/30 animate-pulse'
                            : 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                        }`}>
                          <FaTools className="text-[9px]" /> BOSKIT: {ord.kit_preparation_status.replace(/_/g, ' ')}
                        </span>
                      )}

                      {/* Discrepancy Alert Badge */}
                      {ord.discrepancy_details && ord.discrepancy_details.length > 0 && (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-500/15 text-rose-400 border border-rose-500/30 flex items-center gap-1 animate-pulse">
                          <FaExclamationTriangle className="text-[9px]" /> {ord.discrepancy_details.length} Inward Discrepancy
                        </span>
                      )}

                      {/* Required Vehicle Badge */}
                      {ord.required_vehicle && (
                        <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-surface-hover border border-border text-text-secondary flex items-center gap-1">
                          <HiOutlineTruck className="text-xs text-primary" /> {ord.required_vehicle}
                        </span>
                      )}
                    </div>

                    <div className="text-xs font-bold text-text-primary flex items-center gap-3">
                      <span>{ord.customer_name}</span>
                      <span className="text-[11px] text-text-muted flex items-center gap-1 font-normal">
                        <FaPhoneAlt className="text-[9px]" /> {ord.customer_phone}
                      </span>
                      <span className="text-[11px] text-text-muted flex items-center gap-1 font-normal">
                        <FaCalendarAlt className="text-[9px]" /> Ordered {new Date(ord.order_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </span>
                    </div>
                  </div>

                  {/* Right Action Buttons */}
                  <div className="flex flex-wrap items-center gap-2.5 self-start lg:self-auto">
                    {/* Primary Inward Material Button */}
                    <button
                      onClick={() => handleOpenInwardModal(ord)}
                      className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-200 flex items-center gap-2 shadow-sm cursor-pointer ${
                        isReadyForDispatch
                          ? 'bg-surface-hover text-text-secondary border border-border hover:text-text-primary'
                          : 'gradient-primary text-white hover:opacity-95 active:scale-95'
                      }`}
                    >
                      <HiOutlineClipboardCheck className="text-sm" />
                      <span>{isReadyForDispatch ? 'View / Adjust Inward' : 'Inward Material'}</span>
                    </button>

                    {/* BOSKIT Assembly Station Button */}
                    <button
                      onClick={() => handleOpenAssemblyModal(ord)}
                      className={`px-3 py-2 rounded-xl text-xs font-bold transition-all duration-200 flex items-center gap-1.5 border cursor-pointer ${
                        ord.kit_preparation_status === 'kit_ready'
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
                          : ord.kit_preparation_status === 'in_assembly'
                          ? 'bg-purple-500/15 text-purple-400 border-purple-500/30 hover:bg-purple-500/25 animate-pulse'
                          : 'bg-surface-hover text-text-primary border-border hover:border-primary/50'
                      }`}
                      title="BOSKIT Assembly & Preparation Station"
                    >
                      <FaTools className="text-xs text-primary" />
                      <span>
                        {ord.kit_preparation_status === 'kit_ready'
                          ? 'Kit Ready'
                          : ord.kit_preparation_status === 'in_assembly'
                          ? 'Assembling Kit'
                          : 'Assemble BOSKIT'}
                      </span>
                      {ord.kit_preparation_status === 'kit_ready' && <FaCheckCircle className="text-xs text-emerald-400" />}
                    </button>

                    {/* Send for Delivery Button (Boss Rule: Enabled ONLY when all materials are inwarded) */}
                    {(() => {
                      const isAllInwarded = totalPendingItems === 0 && totalOrderedItems > 0;
                      const isSending = sendingOrderId === ord._id;

                      return (
                        <div className="relative group">
                          <button
                            onClick={() => handleSendForDelivery(ord)}
                            disabled={!isAllInwarded || isSending}
                            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-200 flex items-center gap-2 shadow-sm ${
                              isAllInwarded
                                ? 'bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 hover:from-emerald-500 hover:to-teal-500 text-white cursor-pointer hover:shadow-emerald-500/25 active:scale-95'
                                : 'bg-surface-hover/70 text-text-muted border border-border/80 cursor-not-allowed opacity-60'
                            }`}
                            title={
                              isAllInwarded
                                ? 'Click to send this order to Out for Delivery tab'
                                : `Disabled: ${totalPendingItems} units still pending inward`
                            }
                          >
                            {isSending ? (
                              <>
                                <FaSpinner className="animate-spin text-xs" />
                                <span>Sending...</span>
                              </>
                            ) : (
                              <>
                                {isAllInwarded ? <FaTruck className="text-xs" /> : <FaLock className="text-[11px]" />}
                                <span>Send for Delivery</span>
                                {isAllInwarded && <FaArrowRight className="text-[10px]" />}
                              </>
                            )}
                          </button>

                          {/* Tooltip when disabled */}
                          {!isAllInwarded && (
                            <div className="absolute right-0 top-full mt-1.5 hidden group-hover:block z-30 w-56 p-2 rounded-lg bg-surface border border-danger/30 text-[10px] text-danger shadow-xl font-medium">
                              ⚠️ Locked: All materials must be 100% inwarded ({totalPendingItems} units pending) before sending for delivery.
                            </div>
                          )}
                        </div>
                      );
                    })()}

                    {/* Toggle Items Expand */}
                    <button
                      onClick={() => toggleCardExpansion(ord._id)}
                      className="p-2 rounded-xl bg-surface-hover border border-border text-text-secondary hover:text-text-primary transition-all text-xs flex items-center gap-1 cursor-pointer"
                      title={isExpanded ? 'Collapse item details' : 'Expand item details'}
                    >
                      <span className="text-[11px] font-semibold">{isExpanded ? 'Hide Items' : 'View BOS Items'}</span>
                      {isExpanded ? <HiOutlineChevronUp /> : <HiOutlineChevronDown />}
                    </button>
                  </div>
                </div>

                {/* ── Destination & Inward Progress Bar ── */}
                <div className="px-5 py-3 bg-surface-hover/40 border-b border-border/50 grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                  {/* Address */}
                  <div className="flex items-start gap-2">
                    <HiOutlineLocationMarker className="text-base text-primary shrink-0 mt-0.5" />
                    <div>
                      <div className="font-bold text-text-primary">{ord.destination?.address}</div>
                      <div className="text-[11px] text-text-muted mt-0.5 flex items-center gap-1.5 flex-wrap">
                        <span className="px-1.5 py-0.2 rounded bg-surface border border-border text-text-secondary font-mono">{ord.destination?.district}</span>
                        <span className="px-1.5 py-0.2 rounded bg-surface border border-border text-text-secondary font-mono">{ord.destination?.state}</span>
                        <span className="px-1.5 py-0.2 rounded bg-primary/10 text-primary font-mono font-bold">PIN: {ord.destination?.pincode}</span>
                      </div>
                    </div>
                  </div>

                  {/* Inward Progress */}
                  <div className="flex flex-col justify-center space-y-1">
                    <div className="flex justify-between text-[11px] font-bold">
                      <span className="text-text-secondary">Inward Verification Progress</span>
                      <span className={inwardPercent === 100 ? 'text-success' : 'text-primary'}>
                        {totalReceivedItems} / {totalOrderedItems} Pcs ({inwardPercent}%)
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-border overflow-hidden">
                      <div
                        className={`h-full transition-all duration-500 rounded-full ${
                          inwardPercent === 100 ? 'bg-success' : 'bg-primary'
                        }`}
                        style={{ width: `${inwardPercent}%` }}
                      />
                    </div>
                    <div className="text-[10px] text-text-muted">
                      {totalPendingItems > 0 ? (
                        <span className="text-warning font-semibold">{totalPendingItems} units pending inward</span>
                      ) : (
                        <span className="text-success font-semibold">All items verified and ready</span>
                      )}
                    </div>
                  </div>

                  {/* Inventory Availability Summary */}
                  <div className="flex items-center justify-start md:justify-end gap-3">
                    <div className="text-right">
                      <div className="text-[10px] font-bold text-text-muted uppercase">BOS Items in Kit</div>
                      <div className="text-sm font-black text-text-primary">
                        {(ord.items || []).length} SKUs ({totalOrderedItems} Total Units)
                      </div>
                    </div>
                  </div>
                </div>

                {/* ── Incoming Consolidated Truck Shipment Section (Boss Requirement 3: Multi-EPC Group Truck) ── */}
                {ord.incoming_truck_group && (ord.incoming_truck_group.group_id || ord.incoming_truck_group.vehicle_number) && (
                  <div className="px-5 py-3 bg-gradient-to-r from-blue-500/10 via-surface-hover/50 to-surface border-b border-border/70 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-xl bg-primary/15 text-primary flex items-center justify-center shrink-0 text-base font-bold">
                        <FaTruck />
                      </div>
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-black text-text-primary uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                            <FaLayerGroup className="text-primary text-[10px]" />
                            Incoming Consolidated Truck:
                          </span>
                          <span className="px-2 py-0.5 rounded-md bg-primary/10 border border-primary/20 text-primary font-mono font-bold text-[10px]">
                            {ord.incoming_truck_group.group_id || 'TRK-CONSOLIDATED'}
                          </span>
                          {ord.incoming_truck_group.total_epc_orders_in_truck > 1 && (
                            <span className="px-2 py-0.5 rounded-md bg-info/15 text-info font-bold text-[10px] border border-info/20">
                              Carrying {ord.incoming_truck_group.total_epc_orders_in_truck} EPC Orders in this Truck
                            </span>
                          )}
                          <span className="text-[11px] text-text-muted">
                            ({ord.incoming_truck_group.group_name || 'Multi-EPC Account Consignment'})
                          </span>
                        </div>

                        {/* Truck & Driver Details */}
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-text-secondary">
                          <span className="font-semibold text-text-primary flex items-center gap-1">
                            <span className="text-text-muted font-normal">Vehicle:</span>
                            <span className="font-mono bg-surface px-1.5 py-0.5 rounded border border-border">{ord.incoming_truck_group.vehicle_number || 'MH-12-PQ-9080'}</span>
                            {ord.incoming_truck_group.vehicle_type && <span className="text-text-muted text-[10px]">({ord.incoming_truck_group.vehicle_type})</span>}
                          </span>

                          {ord.incoming_truck_group.transporter_name && (
                            <span className="flex items-center gap-1">
                              <span className="text-text-muted">Transporter:</span>
                              <strong className="text-text-primary">{ord.incoming_truck_group.transporter_name}</strong>
                              {ord.incoming_truck_group.lr_number && <span className="font-mono text-[10px] text-primary">({ord.incoming_truck_group.lr_number})</span>}
                            </span>
                          )}

                          {ord.incoming_truck_group.driver_name && (
                            <span className="flex items-center gap-1">
                              <span className="text-text-muted">Driver:</span>
                              <strong className="text-text-primary">{ord.incoming_truck_group.driver_name}</strong>
                              {ord.incoming_truck_group.driver_mobile && (
                                <a href={`tel:${ord.incoming_truck_group.driver_mobile}`} className="text-primary hover:underline font-mono">
                                  {ord.incoming_truck_group.driver_mobile}
                                </a>
                              )}
                            </span>
                          )}

                          {ord.incoming_truck_group.unloaded_dock && (
                            <span className="flex items-center gap-1">
                              <span className="text-text-muted">Dock:</span>
                              <span className="px-1.5 py-0.5 rounded bg-surface border border-border text-text-primary font-mono text-[10px]">
                                {ord.incoming_truck_group.unloaded_dock}
                              </span>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right: Claim Status / Action */}
                    <div className="shrink-0 flex items-center gap-2 self-start md:self-center">
                      {ord.incoming_truck_group.is_claimed ? (
                        <div className="text-right">
                          <span className="px-3 py-1.5 rounded-xl bg-success/15 text-success border border-success/30 font-bold text-[11px] flex items-center gap-1.5 shadow-xs">
                            <FaCheckCircle className="text-xs" />
                            <span>Claimed & Received in Warehouse</span>
                          </span>
                          {ord.incoming_truck_group.claimed_at && (
                            <div className="text-[10px] text-text-muted mt-0.5">
                              {new Date(ord.incoming_truck_group.claimed_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {ord.incoming_truck_group.claimed_by_name || 'Staff'}
                            </div>
                          )}
                        </div>
                      ) : (
                        <button
                          onClick={() => handleClaimShipment(ord)}
                          disabled={claimingShipmentId === ord._id}
                          className="px-3.5 py-2 rounded-xl bg-primary text-white hover:bg-primary-hover active:scale-95 transition-all text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-sm cursor-pointer"
                        >
                          {claimingShipmentId === ord._id ? (
                            <>
                              <FaSpinner className="animate-spin text-xs" />
                              <span>Claiming...</span>
                            </>
                          ) : (
                            <>
                              <FaLayerGroup className="text-xs" />
                              <span>Claim & Unload to Warehouse</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* ── Expandable BOS Kit Items Table ── */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                      className="p-5 bg-surface-hover/20 border-b border-border/60"
                    >
                      <div className="text-xs font-black text-text-primary uppercase tracking-wider mb-2.5 flex items-center justify-between">
                        <span className="flex items-center gap-1.5">
                          <FaBoxes className="text-primary" /> Ordered BOS Kit Products & Warehouse Stock Match
                        </span>
                        <span className="text-[10px] font-normal text-text-muted">
                          Allocate inventory directly to lock stock against this delivery order
                        </span>
                      </div>

                      <div className="overflow-x-auto border border-border rounded-xl bg-surface">
                        <table className="w-full text-left text-xs">
                          <thead>
                            <tr className="border-b border-border bg-surface-hover/60 text-[10px] font-black uppercase tracking-wider text-text-muted">
                              <th className="p-3">SKU & Product Name</th>
                              <th className="p-3">Fulfilment Method</th>
                              <th className="p-3">Category</th>
                              <th className="p-3 text-center">Ordered Qty</th>
                              <th className="p-3 text-center">Inwarded Qty</th>
                              <th className="p-3 text-center">Pending Qty</th>
                              <th className="p-3 text-center">Warehouse Stock</th>
                              <th className="p-3 text-center">Stock Allocation</th>
                              <th className="p-3 text-right">Action</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border">
                            {(ord.items || []).map((it) => {
                              const isItemFullyInwarded = it.pending_qty === 0;
                              const hasStockDeficit = it.available_inventory_stock < it.pending_qty;

                              return (
                                <tr key={it.sku} className="hover:bg-surface-hover/40 transition-colors">
                                  <td className="p-3">
                                    <div className="font-bold text-text-primary">{it.product_name}</div>
                                    <div className="text-[10px] font-mono text-primary mt-0.5">{it.sku}</div>
                                    {it.rack_location && (
                                      <div className="text-[9px] text-text-muted">Rack: {it.rack_location}</div>
                                    )}
                                  </td>
                                  <td className="p-3">
                                    {it.supply_fulfilment_method === 'company_pickup' ? (
                                      <div className="space-y-0.5">
                                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 flex items-center gap-1 w-max">
                                          <FaTruck className="text-[9px]" /> Company Pickup
                                        </span>
                                        <div className="text-[10px] text-text-muted">
                                          From: <strong className="text-text-primary">{it.supplier_warehouse || it.supplier_name || 'Supplier Hub'}</strong>
                                        </div>
                                        {it.supply_status && (
                                          <div className="text-[9px] font-bold text-cyan-300 uppercase">
                                            Status: {it.supply_status.replace(/_/g, ' ')}
                                          </div>
                                        )}
                                      </div>
                                    ) : it.supply_fulfilment_method === 'supplier_delivery' ? (
                                      <div className="space-y-0.5">
                                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/15 text-amber-400 border border-amber-500/30 flex items-center gap-1 w-max">
                                          <FaBuilding className="text-[9px]" /> Supplier Delivery
                                        </span>
                                        <div className="text-[10px] text-text-muted">
                                          By: <strong className="text-text-primary">{it.supplier_name || 'OEM Supplier'}</strong>
                                        </div>
                                        {it.supplier_dispatch_reference && (
                                          <div className="text-[9px] font-mono text-amber-300">
                                            Ref: {it.supplier_dispatch_reference}
                                          </div>
                                        )}
                                      </div>
                                    ) : (
                                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-purple-500/15 text-purple-400 border border-purple-500/30 flex items-center gap-1 w-max">
                                        <FaWarehouse className="text-[9px]" /> Warehouse Stock
                                      </span>
                                    )}
                                  </td>
                                  <td className="p-3 text-text-secondary text-[11px]">
                                    {it.category || 'BOS Kit'}
                                  </td>
                                  <td className="p-3 text-center font-black text-text-primary">
                                    {it.ordered_qty}
                                  </td>
                                  <td className="p-3 text-center font-black text-success">
                                    {it.received_qty}
                                  </td>
                                  <td className="p-3 text-center">
                                    {it.pending_qty > 0 ? (
                                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-warning/15 text-warning border border-warning/30">
                                        {it.pending_qty} Pcs
                                      </span>
                                    ) : (
                                      <span className="text-[10px] text-success font-bold flex items-center justify-center gap-1">
                                        <FaCheckCircle className="text-[9px]" /> Completed
                                      </span>
                                    )}
                                  </td>
                                  <td className="p-3 text-center">
                                    <span className={`font-mono text-xs font-bold ${
                                      hasStockDeficit ? 'text-danger' : 'text-text-primary'
                                    }`}>
                                      {it.available_inventory_stock} Pcs
                                    </span>
                                    {hasStockDeficit && (
                                      <span className="block text-[9px] font-bold text-danger uppercase">
                                        Stock Shortage
                                      </span>
                                    )}
                                  </td>
                                  <td className="p-3 text-center">
                                    <span className="px-2 py-0.5 rounded-lg bg-primary/10 text-primary border border-primary/20 font-mono text-xs font-bold">
                                      {it.allocated_stock || 0} Reserved
                                    </span>
                                  </td>
                                  <td className="p-3 text-right">
                                    <div className="flex items-center justify-end gap-1.5 flex-wrap">
                                      <button
                                        onClick={() => handleOpenReserveModal(ord, it)}
                                        className="px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider bg-surface-hover hover:bg-primary hover:text-white border border-border transition-all cursor-pointer whitespace-nowrap"
                                        title="Allocate stock from warehouse inventory"
                                      >
                                        Allocate Stock
                                      </button>
                                      {hasStockDeficit && (
                                        <button
                                          onClick={() => handleOpenProcureModal(ord, it)}
                                          className="px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider bg-amber-500/15 text-amber-500 hover:bg-amber-500 hover:text-white border border-amber-500/30 transition-all cursor-pointer whitespace-nowrap"
                                          title="BOS stock short - send requisition to Account Panel"
                                        >
                                          Order via Account
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

                      {/* Inward History snippet if available */}
                      {ord.inward_history && ord.inward_history.length > 0 && (
                        <div className="mt-3 p-3 bg-surface rounded-xl border border-border/70">
                          <div className="text-[10px] font-black text-text-muted uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                            <FaHistory className="text-primary" /> Recent Inward Batches for this Order
                          </div>
                          <div className="space-y-1.5">
                            {ord.inward_history.slice(-2).map((h, idx) => (
                              <div key={idx} className="text-[11px] text-text-secondary flex items-center justify-between border-b border-border/40 pb-1 last:border-0 last:pb-0">
                                <span className="font-mono text-text-primary font-bold">{h.batch_id}</span>
                                <span>{h.inwarded_by_name}</span>
                                <span className="text-text-muted">{new Date(h.timestamp).toLocaleString()}</span>
                                <span className="text-text-primary italic">"{h.remarks}"</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Order-Specific Material Inward Modal ── */}
      <Dialog
        isOpen={inwardModalOpen}
        onClose={() => setInwardModalOpen(false)}
        title={`Material Inward Entry: ${selectedOrderForInward?.delivery_order_id || ''}`}
        size="xl"
      >
        {selectedOrderForInward && (
          <div className="space-y-4 p-1">
            {/* Order Brief Header */}
            <div className="p-3.5 bg-surface-hover rounded-xl border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div>
                <div className="font-extrabold text-text-primary text-sm flex items-center gap-2">
                  <span>{selectedOrderForInward.customer_name}</span>
                  <span className="text-[11px] font-normal text-text-muted">({selectedOrderForInward.customer_phone})</span>
                </div>
                <div className="text-text-muted mt-0.5">
                  Destination: {selectedOrderForInward.destination?.address}, {selectedOrderForInward.destination?.district}, {selectedOrderForInward.destination?.state} - {selectedOrderForInward.destination?.pincode}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveInwardTab('inward')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    activeInwardTab === 'inward' ? 'bg-primary text-white shadow-xs' : 'bg-surface text-text-secondary hover:text-text-primary'
                  }`}
                >
                  Record Inward
                </button>
                <button
                  onClick={() => setActiveInwardTab('history')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    activeInwardTab === 'history' ? 'bg-primary text-white shadow-xs' : 'bg-surface text-text-secondary hover:text-text-primary'
                  }`}
                >
                  Inward History ({(selectedOrderForInward.inward_history || []).length})
                </button>
              </div>
            </div>

            {activeInwardTab === 'inward' ? (
              <form onSubmit={handleSubmitInward} className="space-y-4">
                <div className="text-[11px] text-text-muted">
                  Enter received quantities against each pending product. The system strictly prevents inward quantities from exceeding the permissible pending limit. Once all items are 100% verified, the order automatically transitions to <strong>Out for Delivery</strong>.
                </div>

                {/* Items Input Table */}
                <div className="border border-border rounded-xl overflow-hidden bg-surface max-h-[360px] overflow-y-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="sticky top-0 bg-surface-hover border-b border-border z-10">
                      <tr className="text-[10px] font-black uppercase tracking-wider text-text-muted">
                        <th className="p-3">Product / SKU</th>
                        <th className="p-3 text-center">Ordered</th>
                        <th className="p-3 text-center">Inwarded</th>
                        <th className="p-3 text-center">Pending</th>
                        <th className="p-3 text-center w-28">Inward (OK)</th>
                        <th className="p-3 text-center w-24">Damaged</th>
                        <th className="p-3 text-center w-24">Missing</th>
                        <th className="p-3 text-center w-32">Rack / Location</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {(selectedOrderForInward?.items || []).map((it) => {
                        const input = inwardInputs[it.sku] || { qty: 0, damaged_qty: 0, missing_qty: 0, rack_location: '' };
                        const isDone = it.pending_qty === 0;

                        return (
                          <tr key={it.sku} className={isDone ? 'bg-surface-hover/30 opacity-70' : ''}>
                            <td className="p-3">
                              <div className="font-bold text-text-primary">{it.product_name}</div>
                              <div className="text-[10px] font-mono text-primary">{it.sku}</div>
                            </td>
                            <td className="p-3 text-center font-bold text-text-primary">
                              {it.ordered_qty}
                            </td>
                            <td className="p-3 text-center font-bold text-success">
                              {it.received_qty}
                            </td>
                            <td className="p-3 text-center">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                                isDone ? 'bg-success/15 text-success' : 'bg-warning/15 text-warning'
                              }`}>
                                {it.pending_qty} Pcs
                              </span>
                            </td>
                            <td className="p-3 text-center">
                              <input
                                type="number"
                                min="0"
                                max={it.pending_qty}
                                disabled={isDone}
                                value={input.qty}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setInwardInputs(prev => ({
                                    ...prev,
                                    [it.sku]: {
                                      ...prev[it.sku],
                                      qty: val === '' ? '' : parseInt(val) || 0
                                    }
                                  }));
                                }}
                                className={`w-20 text-center py-1.5 px-2 rounded-lg text-xs font-bold border transition-all ${
                                  parseInt(input.qty) > it.pending_qty
                                    ? 'border-danger bg-danger/10 text-danger'
                                    : 'border-border bg-surface-hover text-text-primary focus:border-primary'
                                }`}
                              />
                            </td>
                            <td className="p-3 text-center">
                              <input
                                type="number"
                                min="0"
                                max={it.pending_qty}
                                disabled={isDone}
                                value={input.damaged_qty || 0}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setInwardInputs(prev => ({
                                    ...prev,
                                    [it.sku]: {
                                      ...prev[it.sku],
                                      damaged_qty: val === '' ? '' : parseInt(val) || 0
                                    }
                                  }));
                                }}
                                className="w-18 text-center py-1.5 px-2 rounded-lg text-xs font-bold border border-rose-500/40 bg-rose-500/10 text-rose-400 focus:border-rose-500"
                              />
                            </td>
                            <td className="p-3 text-center">
                              <input
                                type="number"
                                min="0"
                                max={it.pending_qty}
                                disabled={isDone}
                                value={input.missing_qty || 0}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setInwardInputs(prev => ({
                                    ...prev,
                                    [it.sku]: {
                                      ...prev[it.sku],
                                      missing_qty: val === '' ? '' : parseInt(val) || 0
                                    }
                                  }));
                                }}
                                className="w-18 text-center py-1.5 px-2 rounded-lg text-xs font-bold border border-amber-500/40 bg-amber-500/10 text-amber-400 focus:border-amber-500"
                              />
                            </td>
                            <td className="p-3 text-center">
                              <input
                                type="text"
                                placeholder="e.g. Rack-A1"
                                disabled={isDone}
                                value={input.rack_location}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setInwardInputs(prev => ({
                                    ...prev,
                                    [it.sku]: {
                                      ...prev[it.sku],
                                      rack_location: val
                                    }
                                  }));
                                }}
                                className="w-28 py-1.5 px-2 rounded-lg text-xs border border-border bg-surface-hover text-text-primary focus:border-primary"
                              />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Discrepancy Note banner if any damaged or missing */}
                {Object.values(inwardInputs).some(inp => (parseInt(inp?.damaged_qty) || 0) > 0 || (parseInt(inp?.missing_qty) || 0) > 0) && (
                  <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
                    <FaExclamationTriangle className="text-sm shrink-0" />
                    <span>
                      <strong>Discrepancy Detected:</strong> Damaged items will be physically isolated in warehouse quarantine. Accounts will be automatically notified to initiate supplier debit notes / insurance claims.
                    </span>
                  </div>
                )}

                {/* Inward Remarks */}
                <div>
                  <label className="text-xs font-bold text-text-primary block mb-1">
                    Inward Verification Remarks & Notes
                  </label>
                  <textarea
                    rows={2}
                    value={inwardRemarks}
                    onChange={(e) => setInwardRemarks(e.target.value)}
                    placeholder="Enter dock inspection remarks, package seal condition, or supplier challan ref..."
                    className="w-full p-2.5 text-xs bg-surface-hover border border-border rounded-xl text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary"
                  />
                </div>

                {/* Modal Action Buttons */}
                <div className="flex justify-end items-center gap-3 pt-3 border-t border-border">
                  <button
                    type="button"
                    onClick={() => setInwardModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-surface-hover border border-border text-text-secondary hover:text-text-primary"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingInward}
                    className="gradient-primary text-white px-5 py-2 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 hover:opacity-95 active:scale-95 disabled:opacity-50 cursor-pointer shadow-sm"
                  >
                    {submittingInward ? (
                      <>
                        <FaSpinner className="animate-spin text-sm" />
                        <span>Verifying & Recording Inward...</span>
                      </>
                    ) : (
                      <>
                        <HiOutlineCheckCircle className="text-base" />
                        <span>Confirm & Save Inward</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            ) : (
              /* Inward History Tab */
              <div className="space-y-3">
                {(selectedOrderForInward.inward_history || []).length === 0 ? (
                  <div className="p-8 text-center text-text-muted text-xs">
                    No past inward history recorded for this delivery order yet.
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[380px] overflow-y-auto">
                    {(selectedOrderForInward?.inward_history || []).map((batch, idx) => (
                      <div key={idx} className="p-3.5 bg-surface border border-border rounded-xl space-y-2">
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-mono font-black text-primary">{batch.batch_id}</span>
                          <span className="text-[11px] text-text-muted">{new Date(batch.timestamp).toLocaleString()}</span>
                        </div>
                        <div className="text-[11px] text-text-secondary">
                          Verified by: <strong>{batch.inwarded_by_name}</strong>
                        </div>
                        {batch.remarks && (
                          <div className="text-[11px] text-text-primary italic bg-surface-hover p-2 rounded-lg border border-border/50">
                            "{batch.remarks}"
                          </div>
                        )}
                        <div className="text-[10px] font-black uppercase tracking-wider text-text-muted pt-1">
                          Inwarded Items:
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          {(batch.inwarded_items || []).map((bIt, bIdx) => (
                            <div key={bIdx} className="p-2 rounded bg-surface-hover border border-border/40 flex justify-between">
                              <span className="font-semibold text-text-primary truncate">{bIt.product_name}</span>
                              <span className="font-bold text-success ml-2">+{bIt.qty} Pcs</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </Dialog>

      {/* ── Select BOS Kit Stock / Reserve Inventory Modal ── */}
      <Dialog
        isOpen={reserveModalOpen}
        onClose={() => setReserveModalOpen(false)}
        title="Select & Reserve Warehouse BOS Stock"
        size="md"
      >
        {selectedItemForReserve && (
          <div className="space-y-4 p-1">
            <div className="p-3 bg-surface-hover rounded-xl border border-border text-xs space-y-1">
              <div className="font-bold text-text-primary">{selectedItemForReserve.product_name}</div>
              <div className="text-primary font-mono">{selectedItemForReserve.sku}</div>
              <div className="flex justify-between text-text-muted pt-2 border-t border-border/50">
                <span>Ordered: <strong>{selectedItemForReserve.ordered_qty}</strong></span>
                <span>Pending Inward: <strong>{selectedItemForReserve.pending_qty}</strong></span>
                <span className="text-success">Available Stock: <strong>{selectedItemForReserve.available_inventory_stock}</strong></span>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-text-primary block mb-1">
                Allocate Stock Quantity to DO #{selectedOrderForReserve?.delivery_order_id}
              </label>
              <input
                type="number"
                min="0"
                max={selectedItemForReserve.available_inventory_stock}
                value={reserveQtyInput}
                onChange={(e) => setReserveQtyInput(e.target.value)}
                className="w-full p-2.5 text-sm font-bold bg-surface-hover border border-border rounded-xl text-text-primary focus:outline-none focus:border-primary"
              />
              <span className="text-[11px] text-text-muted mt-1 block">
                Locking this quantity prevents double allocation by other orders.
              </span>
            </div>

            <div className="flex justify-end gap-2.5 pt-3 border-t border-border">
              <button
                type="button"
                onClick={() => setReserveModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-surface-hover border border-border text-text-secondary"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={submittingReserve}
                onClick={handleSaveReservation}
                className="gradient-primary text-white px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider cursor-pointer shadow-sm"
              >
                {submittingReserve ? 'Reserving...' : 'Confirm Stock Reservation'}
              </button>
            </div>
          </div>
        )}
      </Dialog>

      {/* ── Procurement Requisition to Account Manager Modal ── */}
      <Dialog
        isOpen={procureModalOpen}
        onClose={() => setProcureModalOpen(false)}
        title="Send Procurement Requisition to Account Panel"
        size="md"
      >
        {selectedItemForProcure && (
          <form onSubmit={handleSaveProcureRequest} className="space-y-4 p-1">
            <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs space-y-1">
              <div className="font-bold text-text-primary text-sm">{selectedItemForProcure.product_name}</div>
              <div className="text-primary font-mono">{selectedItemForProcure.sku}</div>
              <div className="flex justify-between text-text-muted pt-2 border-t border-amber-500/20">
                <span>Order Qty: <strong>{selectedItemForProcure.ordered_qty}</strong></span>
                <span>Current Stock: <strong>{selectedItemForProcure.available_inventory_stock || 0}</strong></span>
                <span className="text-danger font-bold">
                  Deficit: {Math.max(0, (selectedItemForProcure.pending_qty || 0) - (selectedItemForProcure.available_inventory_stock || 0))} Pcs
                </span>
              </div>
            </div>

            <div className="text-xs text-text-secondary leading-relaxed">
              Warehouse stock is insufficient for this BOS component. Submit an official purchase requisition directly to the <strong>Account Manager</strong> login so they can issue a Purchase Order to the supplier.
            </div>

            <div>
              <label className="text-xs font-bold text-text-primary block mb-1">
                Requisition Quantity to Procure
              </label>
              <input
                type="number"
                min="1"
                value={procureQtyInput}
                onChange={(e) => setProcureQtyInput(e.target.value)}
                className="w-full p-2.5 text-sm font-bold bg-surface-hover border border-border rounded-xl text-text-primary focus:outline-none focus:border-primary"
                required
              />
            </div>

            <div>
              <label className="text-xs font-bold text-text-primary block mb-1">
                Notes for Account Manager & Procurement
              </label>
              <textarea
                rows={3}
                value={procureNotes}
                onChange={(e) => setProcureNotes(e.target.value)}
                placeholder="Mention priority, supplier preference, or required delivery timeline..."
                className="w-full p-2.5 text-xs bg-surface-hover border border-border rounded-xl text-text-primary focus:outline-none focus:border-primary"
              />
            </div>

            <div className="flex justify-end gap-2.5 pt-3 border-t border-border">
              <button
                type="button"
                onClick={() => setProcureModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-surface-hover border border-border text-text-secondary cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submittingProcure}
                className="px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider bg-amber-500 text-white hover:bg-amber-600 transition-all cursor-pointer shadow-sm flex items-center gap-1.5"
              >
                {submittingProcure ? <FaSpinner className="animate-spin" /> : null}
                <span>{submittingProcure ? 'Sending Requisition...' : 'Send to Account Panel'}</span>
              </button>
            </div>
          </form>
        )}
      </Dialog>

      {/* ── Boss Specification: BOSKIT Preparation & Assembly Station Modal ── */}
      <Dialog
        isOpen={assemblyModalOpen}
        onClose={() => setAssemblyModalOpen(false)}
        title={`BOSKIT Assembly & Preparation Station: Order #${selectedOrderForAssembly?.order_number || ''}`}
        size="xl"
      >
        {selectedOrderForAssembly && (() => {
          const ord = selectedOrderForAssembly;
          const kitStatus = ord.kit_preparation_status || 'not_required';
          const totalPending = (ord.items || []).reduce((acc, it) => acc + (it.pending_qty || 0), 0);
          const hasShortage = totalPending > 0;
          const assemblyDetails = ord.kit_assembly_details || {};

          return (
            <div className="space-y-5 p-1">
              {/* Order Context Strip */}
              <div className="p-3.5 bg-surface-hover rounded-xl border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div>
                  <div className="font-extrabold text-text-primary text-sm flex items-center gap-2">
                    <span className="text-primary font-mono">{ord.delivery_order_id}</span>
                    <span>• {ord.customer_name}</span>
                  </div>
                  <div className="text-text-muted mt-0.5">
                    Kit Status: <strong className="text-text-primary uppercase">{kitStatus.replace(/_/g, ' ')}</strong>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                    kitStatus === 'kit_ready'
                      ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                      : kitStatus === 'in_assembly'
                      ? 'bg-purple-500/15 text-purple-400 border-purple-500/30 animate-pulse'
                      : 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                  }`}>
                    {kitStatus.replace(/_/g, ' ')}
                  </span>
                </div>
              </div>

              {/* Shortage Alert Banner if items pending */}
              {hasShortage && (
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs flex items-center gap-2">
                  <FaExclamationTriangle className="text-sm shrink-0" />
                  <div>
                    <strong>Component Shortage Alert:</strong> {totalPending} units are still pending inward from supplier or inventory. Complete inward before marking the BOSKIT ready for dispatch.
                  </div>
                </div>
              )}

              {/* 5-Stage Visual Workflow */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-center text-xs">
                {[
                  {
                    step: '1. Picking',
                    label: 'Pick Components',
                    isDone: ['ready_for_assembly', 'in_assembly', 'kit_ready'].includes(kitStatus) && !hasShortage,
                    isCurrent: kitStatus === 'awaiting_components' || kitStatus === 'ready_for_assembly'
                  },
                  {
                    step: '2. Assembly',
                    label: 'Assembly Station',
                    isDone: ['in_assembly', 'kit_ready'].includes(kitStatus) && assemblyDetails.assembly_status === 'completed',
                    isCurrent: kitStatus === 'in_assembly'
                  },
                  {
                    step: '3. QC Check',
                    label: 'Quality Inspection',
                    isDone: assemblyDetails.qc_status === 'passed',
                    isCurrent: kitStatus === 'in_assembly' && assemblyDetails.qc_status === 'pending'
                  },
                  {
                    step: '4. Packaging',
                    label: 'Pack & Label Barcode',
                    isDone: !!assemblyDetails.kit_serial_barcode,
                    isCurrent: kitStatus === 'in_assembly' && assemblyDetails.qc_status === 'passed'
                  },
                  {
                    step: '5. Kit Ready',
                    label: 'Dispatch Staging',
                    isDone: kitStatus === 'kit_ready',
                    isCurrent: kitStatus === 'kit_ready'
                  }
                ].map((st, idx) => (
                  <div
                    key={idx}
                    className={`p-3 rounded-xl border transition-all ${
                      st.isDone
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                        : st.isCurrent
                        ? 'bg-primary/10 border-primary/40 text-primary font-bold'
                        : 'bg-surface-hover/50 border-border text-text-muted'
                    }`}
                  >
                    <div className="text-[10px] font-black uppercase tracking-wider">{st.step}</div>
                    <div className="text-xs mt-1 font-semibold">{st.label}</div>
                    <div className="text-[10px] mt-1">
                      {st.isDone ? '✓ Completed' : st.isCurrent ? '● Active' : '○ Pending'}
                    </div>
                  </div>
                ))}
              </div>

              {/* BOM Checklist for this Kit */}
              <div>
                <div className="text-xs font-black text-text-primary uppercase tracking-wider mb-2 flex items-center justify-between">
                  <span>Kit Components Verification ({(ord.items || []).length} SKUs)</span>
                  <span className="text-[11px] text-text-muted font-normal">
                    {hasShortage ? `${totalPending} items awaiting inward` : 'All items verified'}
                  </span>
                </div>
                <div className="border border-border rounded-xl overflow-hidden bg-surface max-h-[220px] overflow-y-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="sticky top-0 bg-surface-hover border-b border-border text-[10px] font-black uppercase text-text-muted">
                      <tr>
                        <th className="p-2.5">Component</th>
                        <th className="p-2.5">Fulfilment Method</th>
                        <th className="p-2.5 text-center">Required</th>
                        <th className="p-2.5 text-center">Inwarded</th>
                        <th className="p-2.5 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {(ord.items || []).map((it) => (
                        <tr key={it.sku} className="hover:bg-surface-hover/30">
                          <td className="p-2.5">
                            <div className="font-bold text-text-primary">{it.product_name}</div>
                            <div className="text-[10px] font-mono text-primary">{it.sku}</div>
                          </td>
                          <td className="p-2.5 text-[11px]">
                            {it.supply_fulfilment_method === 'company_pickup' ? (
                              <span className="text-cyan-400 font-semibold">Company Pickup</span>
                            ) : it.supply_fulfilment_method === 'supplier_delivery' ? (
                              <span className="text-amber-400 font-semibold">Supplier Delivery</span>
                            ) : (
                              <span className="text-purple-400 font-semibold">Warehouse Stock</span>
                            )}
                          </td>
                          <td className="p-2.5 text-center font-bold">{it.ordered_qty}</td>
                          <td className="p-2.5 text-center font-bold text-success">{it.received_qty}</td>
                          <td className="p-2.5 text-center">
                            {it.pending_qty === 0 ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-success/15 text-success">
                                Ready
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-400">
                                {it.pending_qty} Pending
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Kit Barcode Label Generation */}
              <div className="p-3.5 bg-surface-hover/60 border border-border rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black text-text-primary uppercase tracking-wider flex items-center gap-1.5">
                    <FaBarcode className="text-primary text-sm" /> SolarKits Barcode & Serial Label
                  </label>
                  <span className="text-[10px] text-text-muted">Unique tracking barcode for assembled BOSKIT</span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={kitBarcodeLabel}
                    onChange={(e) => setKitBarcodeLabel(e.target.value)}
                    placeholder="e.g. SK-KIT-1002-9988"
                    className="flex-1 p-2 text-xs font-mono font-bold bg-surface border border-border rounded-lg text-text-primary focus:border-primary"
                  />
                  <button
                    type="button"
                    onClick={() => setKitBarcodeLabel(`SK-KIT-${ord.order_number}-${Date.now().toString().slice(-4)}`)}
                    className="px-3 py-2 rounded-lg bg-surface border border-border text-xs font-bold text-text-secondary hover:text-text-primary cursor-pointer"
                  >
                    Regenerate
                  </button>
                </div>
              </div>

              {/* Action Buttons to Advance Assembly Stage */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setAssemblyModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-surface-hover border border-border text-text-secondary cursor-pointer"
                >
                  Close
                </button>

                <div className="flex flex-wrap items-center gap-2">
                  {kitStatus !== 'in_assembly' && kitStatus !== 'kit_ready' && (
                    <button
                      type="button"
                      disabled={submittingAssembly}
                      onClick={() => handleAdvanceAssembly('in_assembly')}
                      className="px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider bg-purple-600 hover:bg-purple-500 text-white cursor-pointer shadow-sm flex items-center gap-1.5"
                    >
                      {submittingAssembly ? <FaSpinner className="animate-spin" /> : <FaTools />}
                      <span>Move to Assembly Station</span>
                    </button>
                  )}

                  {kitStatus === 'in_assembly' && assemblyDetails.qc_status !== 'passed' && (
                    <button
                      type="button"
                      disabled={submittingAssembly}
                      onClick={() => handleAdvanceAssembly('quality_check')}
                      className="px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider bg-teal-600 hover:bg-teal-500 text-white cursor-pointer shadow-sm flex items-center gap-1.5"
                    >
                      {submittingAssembly ? <FaSpinner className="animate-spin" /> : <FaClipboardCheck />}
                      <span>Pass QC Inspection</span>
                    </button>
                  )}

                  {kitStatus === 'in_assembly' && assemblyDetails.qc_status === 'passed' && (
                    <button
                      type="button"
                      disabled={submittingAssembly}
                      onClick={() => handleAdvanceAssembly('packed')}
                      className="px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider bg-blue-600 hover:bg-blue-500 text-white cursor-pointer shadow-sm flex items-center gap-1.5"
                    >
                      {submittingAssembly ? <FaSpinner className="animate-spin" /> : <FaBarcode />}
                      <span>Print Label & Pack Kit</span>
                    </button>
                  )}

                  <button
                    type="button"
                    disabled={submittingAssembly || hasShortage || kitStatus === 'kit_ready'}
                    onClick={() => handleAdvanceAssembly('kit_ready')}
                    className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-sm transition-all ${
                      hasShortage || kitStatus === 'kit_ready'
                        ? 'bg-surface-hover text-text-muted border border-border cursor-not-allowed opacity-50'
                        : 'bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer'
                    }`}
                    title={hasShortage ? 'Cannot mark kit ready while components are pending inward' : 'Mark BOSKIT Ready for Dispatch'}
                  >
                    {submittingAssembly ? <FaSpinner className="animate-spin" /> : <FaCheckDouble />}
                    <span>{kitStatus === 'kit_ready' ? 'Kit is Ready' : 'Mark BOSKIT Ready'}</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })()}
      </Dialog>
    </div>
  );
}

