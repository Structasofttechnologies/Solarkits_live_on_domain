import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
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

export default function NewOrdersDeliveryManager({ onNavigateToOutward, onNavigateToBosKit, defaultTab = 'orders', standaloneBoskit = false }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const prefix = location.pathname.startsWith('/warehouse-management-panel')
    ? '/warehouse-management-panel'
    : '/warehouse';

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

  // View Tab: 'orders' (Delivery Orders Queue) vs 'boskit_station' (BOS Kit Preparation Workstation)
  const [mainSectionTab, setMainSectionTab] = useState(defaultTab);

  // BOS Kit Workstation Stage Filter
  const [boskitStageFilter, setBoskitStageFilter] = useState('all');

  // Order Details Modal State (Boss requirement: clean card + Eye icon/button popup)
  const [orderDetailsModalOpen, setOrderDetailsModalOpen] = useState(false);
  const [selectedOrderForDetails, setSelectedOrderForDetails] = useState(null);

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

  // Inward Enhanced Options: 2 Types (Warehouse Dock vs Direct Pickup) & 2 Execution Modes (Manual vs Scanner Gun)
  const [inwardType, setInwardType] = useState('warehouse'); // 'warehouse' | 'pickup_location'
  const [inwardExecutionMode, setInwardExecutionMode] = useState('manual'); // 'manual' | 'scanner'
  const [pickupLocationDetails, setPickupLocationDetails] = useState({
    location_name: '',
    address: '',
    contact_person: '',
    contact_phone: ''
  });
  const [scannerInput, setScannerInput] = useState('');
  const [scannedSerials, setScannedSerials] = useState([]);

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

  const handleOpenDetailsModal = (order) => {
    setSelectedOrderForDetails(order);
    setOrderDetailsModalOpen(true);
  };

  const handleOpenAssemblyModal = (order) => {
    setSelectedOrderForAssembly(order);
    setKitBarcodeLabel(order.kit_assembly_details?.kit_serial_barcode || `SK-KIT-${order.order_number}-${Date.now().toString().slice(-4)}`);
    setAssemblyModalOpen(true);
  };

  const handleAdvanceAssembly = async (stage, targetOrder = null) => {
    const orderToUpdate = targetOrder || selectedOrderForAssembly;
    if (!orderToUpdate) return;
    try {
      setSubmittingAssembly(true);
      const barcode = kitBarcodeLabel || orderToUpdate.kit_assembly_details?.kit_serial_barcode || `SK-KIT-${orderToUpdate.order_number}-${Date.now().toString().slice(-4)}`;
      const res = await updateKitAssembly(orderToUpdate._id, {
        stage,
        kit_serial_barcode: barcode
      });
      if (res.status === 'success') {
        dispatch(setAlert({ message: res.message, type: 'success' }));
        if (selectedOrderForAssembly && selectedOrderForAssembly._id === orderToUpdate._id) {
          setSelectedOrderForAssembly(res.data);
        }
        await fetchOrders();
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

  const handleSendForBosKit = async (order) => {
    const totalPendingItems = (order.items || []).reduce((acc, it) => acc + (it.pending_qty || 0), 0);
    if (totalPendingItems > 0) {
      dispatch(setAlert({
        message: `BOS Kit Assembly locked! ${totalPendingItems} units must be inwarded first in Material Inward.`,
        type: 'warning'
      }));
      return;
    }

    try {
      setSendingOrderId(order._id);
      const res = await updateKitAssembly(order._id, {
        stage: 'ready_for_assembly',
        notes: 'Inwarding completed. Order transferred to BOS Kit Assembly workstation.'
      });
      if (res.status === 'success') {
        dispatch(setAlert({
          message: `Order #${order.order_number} successfully sent to BOS Kit Assembly!`,
          type: 'success'
        }));
        await fetchOrders();
        if (onNavigateToBosKit) {
          onNavigateToBosKit(order);
        } else {
          navigate(`${prefix}/bos-kit-assembly`);
        }
      }
    } catch (err) {
      dispatch(setAlert({
        message: err.response?.data?.message || 'Failed to send order for BOS Kit Assembly.',
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

  // Relevant Filter Counts for New Orders: All Orders, Payment Done, Inward Pending, Inward Done
  const queueCounts = useMemo(() => {
    let paymentDone = 0;
    let pendingInward = 0;
    let inwardDone = 0;

    orders.forEach(ord => {
      const items = ord.items || [];
      const totalPending = items.reduce((acc, it) => acc + (it.pending_qty || 0), 0);
      const isComplete = totalPending === 0 || ord.delivery_status === 'ready_for_dispatch';

      // Payment Done: checks first-half payment is completed / verified
      const isPaymentDone = (ord.epcs || []).length === 0 || (ord.epcs || []).every(epc => epc.payment_first_half?.status === 'done');
      if (isPaymentDone) paymentDone++;

      if (isComplete) {
        inwardDone++;
      } else {
        pendingInward++;
      }
    });

    return {
      total: orders.length,
      paymentDone,
      pendingInward,
      inwardDone
    };
  }, [orders]);

  // Displayed Orders filtered by the 4 boss-defined tabs
  const displayedOrders = useMemo(() => {
    if (selectedQueueTab === 'all') return orders;
    return orders.filter(ord => {
      const items = ord.items || [];
      const totalPending = items.reduce((acc, it) => acc + (it.pending_qty || 0), 0);
      const isComplete = totalPending === 0 || ord.delivery_status === 'ready_for_dispatch';
      const isPaymentDone = (ord.epcs || []).length === 0 || (ord.epcs || []).every(epc => epc.payment_first_half?.status === 'done');

      if (selectedQueueTab === 'payment_done') return isPaymentDone;
      if (selectedQueueTab === 'pending_inward') return totalPending > 0;
      if (selectedQueueTab === 'inward_done') return isComplete;
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
    setInwardType(order.inward_type || 'warehouse');
    setInwardExecutionMode('manual');
    setPickupLocationDetails(order.pickup_location_details || {
      location_name: '',
      address: '',
      contact_person: '',
      contact_phone: ''
    });
    setScannerInput('');
    setScannedSerials(order.scanned_serials || []);
    setActiveInwardTab('inward');
    setInwardModalOpen(true);
  };

  // Barcode / QR Scanner Gun Handler: Scans item QR/barcode, increments count, records serial for Outward matching
  const handleScanItem = (e) => {
    if (e) e.preventDefault();
    const barcode = scannerInput.trim();
    if (!barcode || !selectedOrderForInward) return;

    const items = selectedOrderForInward.items || [];
    // Try matching SKU exactly or partially
    let matchedItem = items.find(it => it.sku.toLowerCase() === barcode.toLowerCase() || barcode.toLowerCase().includes(it.sku.toLowerCase()));
    
    // Fallback: match by product name prefix or find the first item with pending quantity
    if (!matchedItem) {
      matchedItem = items.find(it => (it.pending_qty || 0) > 0 && barcode.toLowerCase().includes((it.product_name || '').toLowerCase().slice(0, 5)));
    }
    if (!matchedItem) {
      matchedItem = items.find(it => (it.pending_qty || 0) > 0) || items[0];
    }

    if (!matchedItem) {
      dispatch(setAlert({ message: `Scanned code "${barcode}" could not be matched to any order item.`, type: 'warning' }));
      return;
    }

    // Check if this serial is already scanned
    if (scannedSerials.some(s => s.serial_code === barcode)) {
      dispatch(setAlert({ message: `Serial / QR "${barcode}" is already scanned!`, type: 'warning' }));
      setScannerInput('');
      return;
    }

    const currentQty = parseInt(inwardInputs[matchedItem.sku]?.qty) || 0;
    if (currentQty >= matchedItem.pending_qty) {
      dispatch(setAlert({ message: `All ${matchedItem.pending_qty} units of ${matchedItem.product_name} already accounted for!`, type: 'warning' }));
      setScannerInput('');
      return;
    }

    // Add to scanned serials
    const newSerial = {
      sku: matchedItem.sku,
      product_name: matchedItem.product_name,
      serial_code: barcode,
      scanned_at: new Date().toISOString()
    };
    setScannedSerials(prev => [newSerial, ...prev]);

    // Increment inward qty for matched item
    setInwardInputs(prev => ({
      ...prev,
      [matchedItem.sku]: {
        ...prev[matchedItem.sku],
        qty: currentQty + 1
      }
    }));

    dispatch(setAlert({
      message: `Scanned: ${matchedItem.product_name} (Serial: ${barcode})`,
      type: 'success'
    }));
    setScannerInput('');
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
              remarks: inwardRemarks,
              inward_type: inwardType,
              inward_mode: inwardExecutionMode,
              scanned_serials: scannedSerials,
              pickup_location_details: inwardType === 'pickup_location' ? pickupLocationDetails : null
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
          remarks: inwardRemarks,
          inward_type: inwardType,
          inward_mode: inwardExecutionMode,
          scanned_serials: scannedSerials,
          pickup_location_details: inwardType === 'pickup_location' ? pickupLocationDetails : null
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
    if ((item.pending_qty || 0) === 0) {
      dispatch(setAlert({
        message: `${item.product_name} is already 100% fulfilled and inwarded! No further stock allocation required.`,
        type: 'info'
      }));
      return;
    }
    setSelectedOrderForReserve(order);
    setSelectedItemForReserve(item);
    setReserveQtyInput(item.allocated_stock || Math.min(item.pending_qty, item.available_inventory_stock || 0));
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
      {/* ── Top Level View Switcher: Show only when not standaloneBoskit ── */}
      {!standaloneBoskit && (
        <div className="flex bg-surface border border-border p-1.5 rounded-2xl gap-2 shadow-xs">
          <button
            onClick={() => setMainSectionTab('orders')}
            className={`flex-1 py-3 px-5 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2.5 transition-all cursor-pointer ${
              mainSectionTab === 'orders'
                ? 'gradient-primary text-white shadow-md shadow-primary/20 scale-[1.01]'
                : 'text-text-secondary hover:bg-surface-hover hover:text-text-primary'
            }`}
          >
            <FaBoxes className="text-base" />
            <span>📦 Delivery Orders & Inward Fulfillment ({orders.length})</span>
          </button>
          <button
            onClick={() => {
              navigate(`${prefix}/bos-kit-assembly`);
            }}
            className={`flex-1 py-3 px-5 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2.5 transition-all cursor-pointer ${
              mainSectionTab === 'boskit_station'
                ? 'bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 text-white shadow-md shadow-purple-500/20 scale-[1.01]'
                : 'text-text-secondary hover:bg-surface-hover hover:text-text-primary'
            }`}
          >
            <FaTools className="text-base" />
            <span>🛠️ BOS Kit Assembly & Preparation Workstation ({orders.filter(o => o.kit_preparation_status && o.kit_preparation_status !== 'not_required').length})</span>
          </button>
        </div>
      )}

      {mainSectionTab === 'orders' ? (
        <>
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

      {/* ── Relevant Queue Filter Tabs Bar: 4 Core Tabs (All Orders, Payment Done, Inward Pending, Inward Done) ── */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
        {[
          { id: 'all', label: 'All Orders', count: queueCounts.total, icon: FaBoxes },
          { id: 'payment_done', label: 'Payment Done', count: queueCounts.paymentDone, icon: FaCheckCircle, color: 'text-blue-400' },
          { id: 'pending_inward', label: 'Inward Pending', count: queueCounts.pendingInward, icon: HiOutlineClock, color: 'text-amber-400' },
          { id: 'inward_done', label: 'Inward Done', count: queueCounts.inwardDone, icon: FaCheckCircle, color: 'text-emerald-400' },
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
            const isPartiallyInwarded = ord.delivery_status === 'partially_inwarded';
            const isReadyForDispatch = ord.delivery_status === 'ready_for_dispatch';
            const isInTransit = ord.delivery_status === 'in_transit';

            const totalOrderedItems = (ord.items || []).reduce((acc, it) => acc + (it.ordered_qty || 0), 0);
            const totalReceivedItems = (ord.items || []).reduce((acc, it) => acc + (it.received_qty || 0), 0);
            const totalPendingItems = (ord.items || []).reduce((acc, it) => acc + (it.pending_qty || 0), 0);
            const inwardPercent = totalOrderedItems > 0 ? Math.round((totalReceivedItems / totalOrderedItems) * 100) : 0;

            return (
              <div
                key={ord._id}
                className={`card rounded-2xl border transition-all duration-300 p-5 space-y-3.5 ${
                  isReadyForDispatch
                    ? 'border-success/40 bg-gradient-to-r from-success/5 via-surface to-surface shadow-xs hover:border-success/60'
                    : isPartiallyInwarded
                    ? 'border-warning/40 bg-gradient-to-r from-warning/5 via-surface to-surface shadow-xs hover:border-warning/60'
                    : 'border-border bg-surface hover:border-primary/40 shadow-xs'
                }`}
              >
                {/* ── SECTION 1: Top Bar (Order Identity on Left ──▶ Status Badges on Right) ── */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border/60">
                  {/* Left: Account Order Number & Delivery Order ID */}
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="text-lg font-black text-text-primary tracking-tight font-mono">
                      Order #{ord.order_number}
                    </span>
                    <span className="px-2.5 py-1 rounded-lg font-mono text-xs font-bold bg-primary/15 text-primary border border-primary/30 shadow-2xs">
                      {ord.delivery_order_id}
                    </span>
                    {ord.delivery_number && ord.delivery_number !== ord.delivery_order_id && (
                      <span className="px-2.5 py-1 rounded-lg font-mono text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 flex items-center gap-1.5">
                        <FaTruck className="text-[10px]" /> DEL: {ord.delivery_number}
                      </span>
                    )}
                  </div>

                  {/* Right: Status Pills Group (Clean Badges: Payment Done, Inward Status, SLA) */}
                  <div className="flex items-center gap-2 flex-wrap sm:justify-end">
                    {/* SLA Overdue if any */}
                    {ord.is_overdue && (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-danger/15 text-danger border border-danger/30 flex items-center gap-1 animate-pulse">
                        ⚠️ Overdue ({ord.overdue_days}d)
                      </span>
                    )}

                    {/* Discrepancy Alert if any */}
                    {ord.discrepancy_details && ord.discrepancy_details.length > 0 && (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-rose-500/15 text-rose-400 border border-rose-500/30 flex items-center gap-1">
                        <FaExclamationTriangle className="text-[10px]" /> {ord.discrepancy_details.length} Discrepancy
                      </span>
                    )}

                    {/* Payment Done Badge */}
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-500/15 text-blue-400 border border-blue-500/30 flex items-center gap-1">
                      <FaCheckCircle className="text-[10px]" /> Payment Done
                    </span>

                    {/* Inward Status Badge */}
                    {totalPendingItems === 0 || isReadyForDispatch ? (
                      <span className="px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center gap-1.5 shadow-2xs">
                        <FaCheckCircle className="text-[11px]" /> Inward Done (100%)
                      </span>
                    ) : isPartiallyInwarded ? (
                      <span className="px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center gap-1.5 shadow-2xs">
                        <HiOutlineExclamation className="text-xs" /> Partially Inwarded ({inwardPercent}%)
                      </span>
                    ) : (
                      <span className="px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-orange-500/15 text-orange-400 border border-orange-500/30 flex items-center gap-1.5">
                        <HiOutlineClock className="text-xs" /> Inward Pending
                      </span>
                    )}
                  </div>
                </div>

                {/* ── SECTION 2: Customer / Destination / Logistics Info Strip ── */}
                <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 text-xs text-text-secondary bg-surface-hover/30 px-3.5 py-2.5 rounded-xl border border-border/40">
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                    <span className="font-bold text-text-primary text-sm flex items-center gap-1.5">
                      <FaBuilding className="text-primary text-xs" />
                      {ord.customer_name}
                    </span>
                    {ord.customer_phone && (
                      <span className="flex items-center gap-1 text-text-muted font-medium">
                        <FaPhoneAlt className="text-[10px] text-primary" /> {ord.customer_phone}
                      </span>
                    )}
                    {(ord.destination?.city || ord.destination?.district || ord.destination?.state) && (
                      <span className="flex items-center gap-1 text-text-muted font-medium">
                        <HiOutlineLocationMarker className="text-xs text-primary" />
                        {ord.destination?.city || ord.destination?.district || ''}{ord.destination?.state ? `, ${ord.destination.state}` : ''}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3 text-text-muted text-[11px]">
                    {ord.incoming_truck_group?.vehicle_number && (
                      <span className="flex items-center gap-1.5 font-mono text-text-primary bg-surface px-2 py-0.5 rounded border border-border">
                        <FaTruck className="text-primary text-[10px]" />
                        <strong>{ord.incoming_truck_group.vehicle_number}</strong>
                        {ord.incoming_truck_group.transporter_name && (
                          <span className="text-text-muted font-sans hidden md:inline">({ord.incoming_truck_group.transporter_name})</span>
                        )}
                      </span>
                    )}
                    <span>Ordered: {new Date(ord.order_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                  </div>
                </div>

                {/* ── SECTION 3: Live Inward Progress & Action Buttons ── */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pt-1">
                  {/* Left: Progress bar with clear counts */}
                  <div className="flex items-center gap-3">
                    <span className="text-[11px] font-black text-text-muted uppercase tracking-wider shrink-0">
                      Inward Progress:
                    </span>
                    <div className="w-36 sm:w-48 h-2.5 rounded-full bg-border overflow-hidden shrink-0">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${inwardPercent === 100 ? 'bg-success' : 'bg-primary'}`}
                        style={{ width: `${inwardPercent}%` }}
                      />
                    </div>
                    <span className={`text-xs font-mono font-bold shrink-0 ${inwardPercent === 100 ? 'text-success' : 'text-primary'}`}>
                      {totalReceivedItems} / {totalOrderedItems} Pcs ({inwardPercent}%)
                    </span>
                  </div>

                  {/* Right: Action Buttons (View Details + Send for BOS Kit Assembly) */}
                  <div className="flex flex-wrap items-center gap-2 self-start lg:self-center">
                    {/* 1. View Details */}
                    <button
                      type="button"
                      onClick={() => handleOpenDetailsModal(ord)}
                      className="h-9 px-3.5 rounded-xl text-xs font-bold bg-surface-hover hover:bg-surface border border-border text-text-primary hover:border-primary/50 transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                      title="View complete order dossier, destination address, truck logistics, SKU breakdown and serials"
                    >
                      <HiOutlineEye className="text-base text-primary" />
                      <span>View Details</span>
                    </button>

                    {/* 2. Send for BOS Kit Assembly (Enabled ONLY when 100% Inwarded in Material Inward) */}
                    {(() => {
                      const isAllInwarded = totalPendingItems === 0 && totalOrderedItems > 0;
                      const isSending = sendingOrderId === ord._id;

                      return (
                        <div className="relative group">
                          <button
                            type="button"
                            onClick={() => handleSendForBosKit(ord)}
                            disabled={!isAllInwarded || isSending}
                            className={`h-9 px-4 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-200 flex items-center gap-2 shadow-sm ${
                              isAllInwarded
                                ? 'bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 hover:from-purple-500 hover:to-indigo-500 text-white cursor-pointer hover:shadow-purple-500/25 active:scale-95'
                                : 'bg-surface-hover/70 text-text-muted border border-border/80 cursor-not-allowed opacity-60'
                            }`}
                            title={
                              isAllInwarded
                                ? 'All materials inwarded! Click to send order to BOS Kit Assembly workstation'
                                : `Locked: Inward ${totalPendingItems} remaining units in Material Inward first`
                            }
                          >
                            {isSending ? (
                              <>
                                <FaSpinner className="animate-spin text-xs" />
                                <span>Sending to BOS Kit...</span>
                              </>
                            ) : (
                              <>
                                {isAllInwarded ? <FaTools className="text-xs" /> : <FaLock className="text-[11px]" />}
                                <span>Send for BOS Kit Assembly</span>
                                {isAllInwarded && <FaArrowRight className="text-[10px]" />}
                              </>
                            )}
                          </button>
                          {!isAllInwarded && (
                            <div className="absolute right-0 top-full mt-1.5 hidden group-hover:block z-30 w-64 p-2.5 rounded-xl bg-surface border border-warning/40 text-[11px] text-warning shadow-xl font-medium">
                              ⚠️ Locked: Inward remaining {totalPendingItems} units in <strong>Material Inward</strong> section before sending for BOS Kit Assembly.
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  ) : (
    /* ── DEDICATED BOS KIT ASSEMBLY & PREPARATION WORKSTATION TAB (Boss Requirement 1) ── */
    <div className="space-y-6">
      {/* BOS Kit Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-4 rounded-2xl border border-border bg-surface shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-text-secondary uppercase tracking-wider">Total BOS Kits</span>
            <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center text-sm font-bold">
              <FaTools />
            </div>
          </div>
          <div className="text-3xl font-black text-text-primary mt-2">
            {orders.filter(o => o.kit_preparation_status && o.kit_preparation_status !== 'not_required').length}
          </div>
          <div className="text-[11px] text-text-muted mt-1">Orders requiring kit assembly</div>
        </div>

        <div className="card p-4 rounded-2xl border border-amber-500/30 bg-amber-500/5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">Awaiting Components</span>
            <div className="w-9 h-9 rounded-xl bg-amber-500/15 text-amber-400 flex items-center justify-center text-sm font-bold">
              <FaExclamationTriangle />
            </div>
          </div>
          <div className="text-3xl font-black text-amber-400 mt-2">
            {orders.filter(o => o.kit_preparation_status === 'awaiting_components').length}
          </div>
          <div className="text-[11px] text-text-muted mt-1">Pending inward component shortfalls</div>
        </div>

        <div className="card p-4 rounded-2xl border border-primary/30 bg-primary/5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-primary uppercase tracking-wider">In Assembly / QC</span>
            <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center text-sm font-bold">
              <FaSpinner className="animate-spin" />
            </div>
          </div>
          <div className="text-3xl font-black text-primary mt-2">
            {orders.filter(o => o.kit_preparation_status === 'in_assembly').length}
          </div>
          <div className="text-[11px] text-text-muted mt-1">Workstation picking & QC checks active</div>
        </div>

        <div className="card p-4 rounded-2xl border border-emerald-500/30 bg-emerald-500/5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Kits Ready for Dispatch</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center text-sm font-bold">
              <FaCheckCircle />
            </div>
          </div>
          <div className="text-3xl font-black text-emerald-400 mt-2">
            {orders.filter(o => o.kit_preparation_status === 'kit_ready').length}
          </div>
          <div className="text-[11px] text-text-muted mt-1">Fully packaged, labeled & staged</div>
        </div>
      </div>

      {/* BOS Kit Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
        {[
          { id: 'all', label: 'All BOS Kits', count: orders.filter(o => o.kit_preparation_status && o.kit_preparation_status !== 'not_required').length },
          { id: 'awaiting_components', label: 'Awaiting Components', count: orders.filter(o => o.kit_preparation_status === 'awaiting_components').length, color: 'text-amber-400' },
          { id: 'in_assembly', label: 'In Assembly Station', count: orders.filter(o => o.kit_preparation_status === 'in_assembly').length, color: 'text-purple-400' },
          { id: 'kit_ready', label: 'Kit Ready for Dispatch', count: orders.filter(o => o.kit_preparation_status === 'kit_ready').length, color: 'text-emerald-400' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setBoskitStageFilter(tab.id)}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 border cursor-pointer ${
              boskitStageFilter === tab.id
                ? 'bg-purple-600 text-white border-purple-600 shadow-sm'
                : 'bg-surface hover:bg-surface-hover border-border text-text-secondary hover:text-text-primary'
            }`}
          >
            <span>{tab.label}</span>
            <span className="px-1.5 py-0.5 rounded-full text-[10px] font-mono bg-white/15 text-white">
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* BOS Kit Cards */}
      {(() => {
        const kitOrders = orders
          .filter(o => o.kit_preparation_status && o.kit_preparation_status !== 'not_required')
          .filter(o => boskitStageFilter === 'all' || o.kit_preparation_status === boskitStageFilter);

        if (kitOrders.length === 0) {
          return (
            <div className="card p-12 text-center text-text-muted space-y-3 bg-surface border border-border rounded-2xl">
              <FaTools className="text-4xl text-text-muted opacity-30 mx-auto" />
              <div className="text-base font-bold text-text-primary">No BOS Kits in this Stage</div>
              <div className="text-xs">Select another stage tab or check all kits.</div>
            </div>
          );
        }

        return (
          <div className="space-y-4">
            {kitOrders.map(ord => {
              const kitStatus = ord.kit_preparation_status || 'not_required';
              const unallocatedShortage = (ord.items || []).reduce((acc, it) => {
                const pending = it.pending_qty || 0;
                const allocated = it.allocated_stock || 0;
                return acc + Math.max(0, pending - allocated);
              }, 0);
              const hasShortage = unallocatedShortage > 0;
              const assemblyDetails = ord.kit_assembly_details || {};

              return (
                <div
                  key={ord._id}
                  className="card rounded-2xl border border-border bg-surface p-5 space-y-5 shadow-xs hover:border-purple-500/40 transition-all"
                >
                  {/* Top Context Strip */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/70 pb-3">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono font-black text-primary text-sm">{ord.delivery_order_id}</span>
                        <span className="text-text-muted text-xs">• Order #{ord.order_number}</span>
                        <span className="text-text-primary font-bold text-xs">• {ord.customer_name}</span>
                        {ord.customer_phone && (
                          <span className="text-text-muted text-[11px] font-mono">({ord.customer_phone})</span>
                        )}
                      </div>
                      <div className="text-[11px] text-text-muted mt-1">
                        Destination: {ord.destination?.address}, {ord.destination?.district}, {ord.destination?.state}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider border flex items-center gap-1.5 ${
                        kitStatus === 'kit_ready'
                          ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                          : kitStatus === 'in_assembly'
                          ? 'bg-purple-500/15 text-purple-400 border-purple-500/30 animate-pulse'
                          : 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                      }`}>
                        <FaTools className="text-xs" />
                        <span>{kitStatus.replace(/_/g, ' ')}</span>
                      </span>
                      <button
                        onClick={() => handleOpenDetailsModal(ord)}
                        className="p-2 rounded-xl bg-surface-hover hover:bg-surface border border-border text-text-secondary hover:text-text-primary text-xs"
                        title="View Full Order Dossier"
                      >
                        <HiOutlineEye />
                      </button>
                    </div>
                  </div>

                  {/* Component Shortage Warning if items pending */}
                  {hasShortage && (
                    <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs flex items-center gap-2">
                      <FaExclamationTriangle className="text-sm shrink-0" />
                      <span>
                        <strong>Component Shortage Alert:</strong> {unallocatedShortage} units have unallocated shortage. Please inward or allocate stock before final dispatch staging.
                      </span>
                    </div>
                  )}

                  {/* 5-Stage Stepper Workflow */}
                  {(() => {
                    const isPickedDone = ['ready_for_assembly', 'in_assembly', 'kit_ready'].includes(kitStatus) || !hasShortage;
                    const isAssembledDone = ['in_assembly', 'kit_ready'].includes(kitStatus) && (assemblyDetails.assembly_status === 'completed' || !!assemblyDetails.assembled_at || assemblyDetails.qc_verified || kitStatus === 'kit_ready');
                    const isQcDone = assemblyDetails.qc_verified === true || assemblyDetails.qc_status === 'passed' || kitStatus === 'kit_ready';
                    const isPackedDone = assemblyDetails.packed_and_labeled === true || !!assemblyDetails.kit_serial_barcode || kitStatus === 'kit_ready';
                    const isReadyDone = kitStatus === 'kit_ready';

                    const isStep1Active = !isPickedDone;
                    const isStep2Active = isPickedDone && !isAssembledDone;
                    const isStep3Active = isAssembledDone && !isQcDone;
                    const isStep4Active = isQcDone && !isPackedDone;
                    const isStep5Active = isPackedDone && !isReadyDone;

                    const steps = [
                      { step: '1. Picking', label: 'Pick Components', isDone: isPickedDone, isCurrent: isStep1Active },
                      { step: '2. Assembly', label: 'Assembly Station', isDone: isAssembledDone, isCurrent: isStep2Active },
                      { step: '3. QC Check', label: 'Quality Inspection', isDone: isQcDone, isCurrent: isStep3Active },
                      { step: '4. Packaging', label: 'Pack & Label Barcode', isDone: isPackedDone, isCurrent: isStep4Active },
                      { step: '5. Kit Ready', label: 'Dispatch Staging', isDone: isReadyDone, isCurrent: isReadyDone || isStep5Active }
                    ];

                    return (
                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center text-xs">
                        {steps.map((st, idx) => (
                          <div
                            key={idx}
                            className={`p-2.5 rounded-xl border transition-all ${
                              st.isDone
                                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 font-bold'
                                : st.isCurrent
                                ? 'bg-purple-500/10 border-purple-500/40 text-purple-400 font-black ring-1 ring-purple-500/30'
                                : 'bg-surface-hover/40 border-border text-text-muted'
                            }`}
                          >
                            <div className="text-[10px] uppercase font-black">{st.step}</div>
                            <div className="text-[11px] mt-0.5">{st.label}</div>
                            <div className="text-[9px] mt-1">
                              {st.isDone ? '✓ Done' : st.isCurrent ? '● Active' : '○ Pending'}
                            </div>
                          </div>
                        ))}
                      </div>
                    );
                  })()}

                  {/* Kit Components Table */}
                  <div className="border border-border rounded-xl overflow-hidden bg-surface">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-surface-hover/80 border-b border-border text-[10px] font-black uppercase text-text-muted">
                        <tr>
                          <th className="p-3">Component / SKU</th>
                          <th className="p-3">Fulfilment Method</th>
                          <th className="p-3 text-center">WH Available</th>
                          <th className="p-3 text-center">Required</th>
                          <th className="p-3 text-center">Inwarded</th>
                          <th className="p-3 text-center">Pending</th>
                          <th className="p-3 text-right">Allocation Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {(ord.items || []).map(it => {
                          const isItemDone = (it.pending_qty || 0) === 0;
                          const isFullyAllocated = (it.allocated_stock || 0) >= (it.pending_qty || 0) && (it.allocated_stock || 0) > 0;
                          const isPartiallyAllocated = (it.allocated_stock || 0) > 0 && (it.allocated_stock || 0) < (it.pending_qty || 0);

                          return (
                            <tr key={it.sku} className="hover:bg-surface-hover/30">
                              <td className="p-3">
                                <div className="font-bold text-text-primary">{it.product_name}</div>
                                <div className="text-[10px] font-mono text-primary">{it.sku}</div>
                              </td>
                              <td className="p-3 text-[11px]">
                                <span className="capitalize text-text-secondary">{it.supply_fulfilment_method ? it.supply_fulfilment_method.replace(/_/g, ' ') : 'Warehouse Stock'}</span>
                              </td>
                              <td className="p-3 text-center">
                                <div className="inline-flex flex-col items-center">
                                  <span className={`px-2 py-0.5 rounded-md text-[11px] font-mono font-bold ${
                                    (it.available_inventory_stock ?? 0) >= (it.pending_qty || 0)
                                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                                      : (it.available_inventory_stock ?? 0) > 0
                                      ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                                      : 'bg-danger/10 text-danger border border-danger/30'
                                  }`}>
                                    {it.available_inventory_stock ?? 0} Pcs
                                  </span>
                                  {it.base_warehouse_stock !== undefined && (
                                    <span className="text-[9px] text-text-muted mt-0.5" title="Physical Total Warehouse Stock">
                                      Total: {it.base_warehouse_stock}
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="p-3 text-center font-bold">{it.ordered_qty}</td>
                              <td className="p-3 text-center font-bold text-success">{it.received_qty}</td>
                              <td className="p-3 text-center">
                                {isItemDone ? (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-success/15 text-success">
                                    0 Pcs
                                  </span>
                                ) : isFullyAllocated ? (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30" title="Shortage 100% covered by warehouse allocated stock">
                                    ✓ Covered (WH)
                                  </span>
                                ) : (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-warning/15 text-warning">
                                    {Math.max(0, (it.pending_qty || 0) - (it.allocated_stock || 0))} Pcs
                                  </span>
                                )}
                              </td>
                              <td className="p-3 text-right">
                                {isItemDone ? (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-xs">
                                    <FaCheckCircle className="text-[10px]" /> Fulfilled
                                  </span>
                                ) : isFullyAllocated ? (
                                  <div className="inline-flex items-center justify-end gap-1.5">
                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                                      <FaCheckCircle className="text-[10px]" /> {it.allocated_stock} Allocated
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => handleOpenReserveModal(ord, it)}
                                      className="px-2 py-0.5 rounded text-[10px] font-bold text-text-muted hover:text-primary hover:bg-surface-hover border border-border transition-all cursor-pointer"
                                      title="Edit allocated quantity"
                                    >
                                      Edit
                                    </button>
                                  </div>
                                ) : isPartiallyAllocated ? (
                                  <div className="inline-flex items-center justify-end gap-1.5">
                                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/15 text-blue-400 border border-blue-500/30">
                                      ✓ {it.allocated_stock} Allocated
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => handleOpenReserveModal(ord, it)}
                                      className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-surface-hover hover:bg-primary hover:text-white border border-border transition-all cursor-pointer"
                                    >
                                      Allocate Rest
                                    </button>
                                    {(it.available_inventory_stock || 0) < ((it.pending_qty || 0) - (it.allocated_stock || 0)) && (
                                      <button
                                        type="button"
                                        onClick={() => handleOpenProcureModal(ord, it)}
                                        className="px-2 py-1 rounded-lg text-[10px] font-bold bg-amber-500/15 text-amber-400 hover:bg-amber-500 hover:text-white border border-amber-500/30 transition-all cursor-pointer"
                                        title="Procure shortage"
                                      >
                                        Procure
                                      </button>
                                    )}
                                  </div>
                                ) : (
                                  <div className="inline-flex items-center justify-end gap-1.5">
                                    {(it.available_inventory_stock || 0) > 0 ? (
                                      <button
                                        type="button"
                                        onClick={() => handleOpenReserveModal(ord, it)}
                                        className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-primary text-white hover:bg-primary-hover border border-primary/30 transition-all cursor-pointer shadow-xs"
                                      >
                                        Allocate Stock
                                      </button>
                                    ) : (
                                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-danger/10 text-danger border border-danger/20">
                                        0 In Stock
                                      </span>
                                    )}
                                    {((it.available_inventory_stock || 0) < (it.pending_qty || 0)) && (
                                      <button
                                        type="button"
                                        onClick={() => handleOpenProcureModal(ord, it)}
                                        className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-amber-500/15 text-amber-400 hover:bg-amber-500 hover:text-white border border-amber-500/30 transition-all cursor-pointer"
                                        title="Send procurement requisition"
                                      >
                                        Procure
                                      </button>
                                    )}
                                  </div>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Solarkits Barcode & Action Strip */}
                  <div className="p-3.5 bg-surface-hover/60 border border-border rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div className="flex items-center gap-2 flex-1 max-w-md">
                      <FaBarcode className="text-primary text-base shrink-0" />
                      <input
                        type="text"
                        value={kitBarcodeLabel || `SK-KIT-${ord.order_number}-01`}
                        onChange={(e) => setKitBarcodeLabel(e.target.value)}
                        placeholder="Kit Tracking Serial Barcode"
                        className="flex-1 p-2 text-xs font-mono font-bold bg-surface border border-border rounded-lg text-text-primary focus:border-primary"
                      />
                    </div>

                    {/* Advance Stage Buttons */}
                    <div className="flex items-center gap-2 flex-wrap">
                      {/* Step 1 -> 2: Start Assembly */}
                      {(kitStatus === 'ready_for_assembly' || kitStatus === 'awaiting_components') && (
                        <button
                          type="button"
                          disabled={submittingAssembly || hasShortage}
                          onClick={() => handleAdvanceAssembly('in_assembly', ord)}
                          className={`px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-sm transition-all ${
                            hasShortage
                              ? 'bg-surface-hover text-text-muted border border-border cursor-not-allowed opacity-50'
                              : 'bg-purple-600 hover:bg-purple-500 text-white cursor-pointer'
                          }`}
                          title={hasShortage ? 'Complete component inward first' : 'Move components to assembly station'}
                        >
                          {submittingAssembly ? <FaSpinner className="animate-spin" /> : <FaTools className="text-xs" />}
                          <span>Advance: Move to Assembly</span>
                        </button>
                      )}

                      {/* Step 2 -> 3: Complete Assembly */}
                      {kitStatus === 'in_assembly' && !assemblyDetails.assembled_at && assemblyDetails.assembly_status !== 'completed' && (
                        <button
                          type="button"
                          disabled={submittingAssembly}
                          onClick={() => handleAdvanceAssembly('assembled', ord)}
                          className="px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider bg-indigo-600 hover:bg-indigo-500 text-white cursor-pointer shadow-sm flex items-center gap-1.5"
                        >
                          {submittingAssembly ? <FaSpinner className="animate-spin" /> : <FaWrench className="text-xs" />}
                          <span>Advance: Complete Assembly</span>
                        </button>
                      )}

                      {/* Step 3 -> 4: QC Check */}
                      {kitStatus === 'in_assembly' && (assemblyDetails.assembled_at || assemblyDetails.assembly_status === 'completed') && !assemblyDetails.qc_verified && assemblyDetails.qc_status !== 'passed' && (
                        <button
                          type="button"
                          disabled={submittingAssembly}
                          onClick={() => handleAdvanceAssembly('qc_verified', ord)}
                          className="px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider bg-teal-600 hover:bg-teal-500 text-white cursor-pointer shadow-sm flex items-center gap-1.5"
                        >
                          {submittingAssembly ? <FaSpinner className="animate-spin" /> : <FaClipboardCheck className="text-xs" />}
                          <span>Advance: Pass QC Check</span>
                        </button>
                      )}

                      {/* Step 4 -> 5: Print Label & Pack */}
                      {kitStatus === 'in_assembly' && (assemblyDetails.qc_verified || assemblyDetails.qc_status === 'passed') && !assemblyDetails.packed_and_labeled && (
                        <button
                          type="button"
                          disabled={submittingAssembly}
                          onClick={() => handleAdvanceAssembly('packed_and_labeled', ord)}
                          className="px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider bg-blue-600 hover:bg-blue-500 text-white cursor-pointer shadow-sm flex items-center gap-1.5"
                        >
                          {submittingAssembly ? <FaSpinner className="animate-spin" /> : <FaBarcode className="text-xs" />}
                          <span>Advance: Pack & Label</span>
                        </button>
                      )}

                      {/* Step 5: Final Mark Kit Ready */}
                      {kitStatus !== 'kit_ready' && (assemblyDetails.packed_and_labeled || !!assemblyDetails.kit_serial_barcode) && (
                        <button
                          type="button"
                          disabled={submittingAssembly || hasShortage}
                          onClick={() => handleAdvanceAssembly('kit_ready', ord)}
                          className="px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer flex items-center gap-1.5 shadow-sm"
                        >
                          {submittingAssembly ? <FaSpinner className="animate-spin" /> : <FaCheckDouble className="text-xs" />}
                          <span>Advance: Mark Kit Ready</span>
                        </button>
                      )}

                      {kitStatus === 'kit_ready' && (
                        <>
                          <span className="px-3 py-2 rounded-xl text-xs font-black uppercase tracking-wider bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5">
                            <FaCheckCircle className="text-xs" />
                            <span>BOS Kit Complete</span>
                          </span>
                          <button
                            type="button"
                            onClick={() => handleSendForDelivery(ord)}
                            disabled={sendingOrderId === ord._id}
                            className="px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 hover:from-emerald-500 hover:to-teal-500 text-white cursor-pointer shadow-md flex items-center gap-2 transition-all active:scale-95"
                            title="Click to send order directly to Out for Delivery Station"
                          >
                            {sendingOrderId === ord._id ? (
                              <>
                                <FaSpinner className="animate-spin text-xs" />
                                <span>Sending to Delivery...</span>
                              </>
                            ) : (
                              <>
                                <FaTruck className="text-xs" />
                                <span>Send for Delivery</span>
                                <FaArrowRight className="text-[10px]" />
                              </>
                            )}
                          </button>
                        </>
                      )}

                      <button
                        type="button"
                        onClick={() => handleOpenAssemblyModal(ord)}
                        className="px-3.5 py-2 rounded-xl text-xs font-bold bg-surface-hover hover:bg-surface border border-border text-text-secondary hover:text-text-primary cursor-pointer flex items-center gap-1.5"
                      >
                        <FaTools className="text-xs text-text-muted" />
                        <span>Workstation Dossier</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setMainSectionTab('orders')}
                        className="px-3.5 py-2 rounded-xl text-xs font-bold bg-surface-hover hover:bg-surface border border-border text-text-secondary hover:text-text-primary cursor-pointer"
                      >
                        <span>Back to Orders</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        );
      })()}
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
                {/* ── Boss Requirement 3A: Inward Destination Type (Warehouse Inward vs Direct Pickup From Site/Supplier) ── */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 p-3 rounded-xl bg-surface-hover/50 border border-border">
                  <div
                    onClick={() => setInwardType('warehouse')}
                    className={`p-3 rounded-xl border cursor-pointer transition-all ${
                      inwardType === 'warehouse'
                        ? 'bg-primary/10 border-primary text-primary font-bold shadow-xs'
                        : 'bg-surface border-border text-text-secondary hover:text-text-primary'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <FaWarehouse className="text-base" />
                      <span className="text-xs font-black uppercase tracking-wider">🏢 Warehouse Dock Inward</span>
                    </div>
                    <div className="text-[10px] text-text-muted mt-1">
                      Material physically arrives at warehouse receiving bay for verification, palletizing & staging.
                    </div>
                  </div>

                  <div
                    onClick={() => setInwardType('pickup_location')}
                    className={`p-3 rounded-xl border cursor-pointer transition-all ${
                      inwardType === 'pickup_location'
                        ? 'bg-cyan-500/10 border-cyan-500 text-cyan-400 font-bold shadow-xs'
                        : 'bg-surface border-border text-text-secondary hover:text-text-primary'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <FaTruck className="text-base" />
                      <span className="text-xs font-black uppercase tracking-wider">📍 Direct Pickup from Supplier / Site</span>
                    </div>
                    <div className="text-[10px] text-text-muted mt-1">
                      Direct pickup from vendor or factory straight to customer site without storing in central hub.
                    </div>
                  </div>
                </div>

                {/* Pickup Location Details if Direct Pickup selected */}
                {inwardType === 'pickup_location' && (
                  <div className="p-3.5 rounded-xl bg-cyan-500/5 border border-cyan-500/20 space-y-2.5">
                    <div className="text-xs font-bold text-cyan-400 flex items-center gap-1.5">
                      <FaMapMarkerAlt /> Direct Pickup Location & Supplier Point Details
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 text-xs">
                      <div>
                        <label className="text-[10px] text-text-muted font-bold block mb-1">Location Name / Vendor</label>
                        <input
                          type="text"
                          placeholder="e.g. Waaree Plant / Havells Depot"
                          value={pickupLocationDetails.location_name}
                          onChange={(e) => setPickupLocationDetails(prev => ({ ...prev, location_name: e.target.value }))}
                          className="w-full p-2 text-xs bg-surface border border-border rounded-lg text-text-primary focus:border-primary"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-text-muted font-bold block mb-1">Address / Landmark</label>
                        <input
                          type="text"
                          placeholder="e.g. GIDC Industrial Area"
                          value={pickupLocationDetails.address}
                          onChange={(e) => setPickupLocationDetails(prev => ({ ...prev, address: e.target.value }))}
                          className="w-full p-2 text-xs bg-surface border border-border rounded-lg text-text-primary focus:border-primary"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-text-muted font-bold block mb-1">Contact Person</label>
                        <input
                          type="text"
                          placeholder="e.g. Rajesh Kumar"
                          value={pickupLocationDetails.contact_person}
                          onChange={(e) => setPickupLocationDetails(prev => ({ ...prev, contact_person: e.target.value }))}
                          className="w-full p-2 text-xs bg-surface border border-border rounded-lg text-text-primary focus:border-primary"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-text-muted font-bold block mb-1">Contact Phone</label>
                        <input
                          type="text"
                          placeholder="e.g. +91 98765 43210"
                          value={pickupLocationDetails.contact_phone}
                          onChange={(e) => setPickupLocationDetails(prev => ({ ...prev, contact_phone: e.target.value }))}
                          className="w-full p-2 text-xs bg-surface border border-border rounded-lg text-text-primary focus:border-primary"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* ── Boss Requirement 3B: Inward Verification Mode (Manual Entry vs Barcode/QR Scanner Gun) ── */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border pb-2 pt-1">
                  <div className="text-xs font-black text-text-primary uppercase tracking-wider flex items-center gap-1.5">
                    <span>Inward Verification Method</span>
                  </div>
                  <div className="flex bg-surface-hover border border-border p-1 rounded-xl gap-1">
                    <button
                      type="button"
                      onClick={() => setInwardExecutionMode('manual')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                        inwardExecutionMode === 'manual'
                          ? 'bg-primary text-white shadow-xs'
                          : 'text-text-secondary hover:text-text-primary'
                      }`}
                    >
                      <FaClipboardCheck className="text-xs" />
                      <span>Manual Checklist</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setInwardExecutionMode('scanner')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                        inwardExecutionMode === 'scanner'
                          ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-xs'
                          : 'text-text-secondary hover:text-text-primary'
                      }`}
                    >
                      <FaBarcode className="text-xs" />
                      <span>🔫 Online Barcode / QR Scanner Gun</span>
                    </button>
                  </div>
                </div>

                {/* ── Online Scanner Gun Input & Real-Time Outward Validation Matching ── */}
                {inwardExecutionMode === 'scanner' && (
                  <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-500/10 via-surface-hover to-surface border border-emerald-500/30 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="space-y-0.5">
                        <div className="text-xs font-black text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                          <FaBarcode className="text-sm" /> Live Barcode / QR Scanner Gun Feed
                        </div>
                        <div className="text-[11px] text-text-muted">
                          Aim your handheld scanner gun at the product QR/barcode or type & press Enter. Serials scanned here are validated during Outward dispatch.
                        </div>
                      </div>
                      <span className="px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-400 font-mono font-bold text-xs border border-emerald-500/30 shrink-0">
                        {scannedSerials.length} Serials Scanned
                      </span>
                    </div>

                    {/* Scanner Input Bar */}
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <FaBarcode className="absolute left-3.5 top-1/2 -translate-y-1/2 text-emerald-400 text-base" />
                        <input
                          type="text"
                          autoFocus
                          value={scannerInput}
                          onChange={(e) => setScannerInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleScanItem();
                            }
                          }}
                          placeholder="Aim scanner gun or enter QR / Barcode (e.g. SK-KIT-0941, WAAR-550-9842)..."
                          className="w-full pl-10 pr-4 py-2.5 text-xs font-mono font-bold bg-surface border-2 border-emerald-500/50 rounded-xl text-text-primary placeholder:text-text-muted focus:outline-none focus:border-emerald-400 shadow-inner"
                        />
                      </div>
                      <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-bold text-xs shrink-0">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                        <span>🔫 Scanner Active (Auto-Detect)</span>
                      </div>
                    </div>

                    {/* Scanned Serials Registry Table (Validates Outward Dispatch) */}
                    {scannedSerials.length > 0 && (
                      <div className="space-y-1.5">
                        <div className="text-[10px] font-black uppercase tracking-wider text-text-muted flex justify-between">
                          <span>Scanned Serial Numbers & QR Tag Registry ({scannedSerials.length})</span>
                          <button
                            type="button"
                            onClick={() => setScannedSerials([])}
                            className="text-danger hover:underline text-[10px]"
                          >
                            Clear Scans
                          </button>
                        </div>
                        <div className="max-h-36 overflow-y-auto border border-border rounded-xl bg-surface divide-y divide-border text-xs">
                          {scannedSerials.map((sn, sIdx) => (
                            <div key={sIdx} className="p-2 flex items-center justify-between hover:bg-surface-hover">
                              <div className="flex items-center gap-2">
                                <span className="font-mono font-bold text-primary">{sn.serial_code}</span>
                                <span className="text-text-secondary text-[11px] truncate max-w-xs">{sn.product_name}</span>
                                <span className="text-[10px] text-text-muted font-mono">({sn.sku})</span>
                              </div>
                              <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                                <FaCheckCircle className="text-[8px]" /> Validated for Inward
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <div className="text-[11px] text-text-muted">
                  Scan each item with barcode gun or enter quantities. Items automatically receive a green checkmark once scanned.
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
                        const itemScans = scannedSerials.filter(s => s.sku === it.sku);
                        const isFullyScanned = itemScans.length >= it.pending_qty && it.pending_qty > 0;

                        return (
                          <tr key={it.sku} className={isDone ? 'bg-surface-hover/30 opacity-70' : ''}>
                            <td className="p-3">
                              <div className="font-bold text-text-primary">{it.product_name}</div>
                              <div className="text-[10px] font-mono text-primary">{it.sku}</div>

                              {/* Live Scanned QR & Serial Tags Display */}
                              {itemScans.length > 0 && (
                                <div className="mt-1.5 space-y-1">
                                  <div className="flex flex-wrap items-center gap-1">
                                    {itemScans.map((sn, sIdx) => (
                                      <span
                                        key={sIdx}
                                        className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                                        title={`Scanned at: ${new Date(sn.scanned_at).toLocaleTimeString()}`}
                                      >
                                        <FaCheckCircle className="text-[9px]" /> {sn.serial_code}
                                      </span>
                                    ))}
                                  </div>
                                  {isFullyScanned && (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-emerald-500/25 text-emerald-300 border border-emerald-500/40">
                                      ✓ Inward Done (QR Scanned)
                                    </span>
                                  )}
                                </div>
                              )}
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
          const unallocatedShortage = (ord.items || []).reduce((acc, it) => {
            const pending = it.pending_qty || 0;
            const allocated = it.allocated_stock || 0;
            return acc + Math.max(0, pending - allocated);
          }, 0);
          const hasShortage = unallocatedShortage > 0;
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
                    <strong>Component Shortage Alert:</strong> {unallocatedShortage} units are still unallocated from inventory. Complete inward or allocate stock before marking the BOSKIT ready for dispatch.
                  </div>
                </div>
              )}

              {/* 5-Stage Visual Workflow */}
              {(() => {
                const isPickedDone = ['ready_for_assembly', 'in_assembly', 'kit_ready'].includes(kitStatus) || !hasShortage;
                const isAssembledDone = ['in_assembly', 'kit_ready'].includes(kitStatus) && (assemblyDetails.assembly_status === 'completed' || !!assemblyDetails.assembled_at || assemblyDetails.qc_verified || kitStatus === 'kit_ready');
                const isQcDone = assemblyDetails.qc_verified === true || assemblyDetails.qc_status === 'passed' || kitStatus === 'kit_ready';
                const isPackedDone = assemblyDetails.packed_and_labeled === true || !!assemblyDetails.kit_serial_barcode || kitStatus === 'kit_ready';
                const isReadyDone = kitStatus === 'kit_ready';

                const isStep1Active = !isPickedDone;
                const isStep2Active = isPickedDone && !isAssembledDone;
                const isStep3Active = isAssembledDone && !isQcDone;
                const isStep4Active = isQcDone && !isPackedDone;
                const isStep5Active = isPackedDone && !isReadyDone;

                const steps = [
                  { step: '1. Picking', label: 'Pick Components', isDone: isPickedDone, isCurrent: isStep1Active },
                  { step: '2. Assembly', label: 'Assembly Station', isDone: isAssembledDone, isCurrent: isStep2Active },
                  { step: '3. QC Check', label: 'Quality Inspection', isDone: isQcDone, isCurrent: isStep3Active },
                  { step: '4. Packaging', label: 'Pack & Label Barcode', isDone: isPackedDone, isCurrent: isStep4Active },
                  { step: '5. Kit Ready', label: 'Dispatch Staging', isDone: isReadyDone, isCurrent: isReadyDone || isStep5Active }
                ];

                return (
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-center text-xs">
                    {steps.map((st, idx) => (
                      <div
                        key={idx}
                        className={`p-3 rounded-xl border transition-all ${
                          st.isDone
                            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 font-bold'
                            : st.isCurrent
                            ? 'bg-purple-500/10 border-purple-500/40 text-purple-400 font-black ring-1 ring-purple-500/30'
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
                );
              })()}

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
                        <th className="p-2.5 text-center">WH Stock</th>
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
                          <td className="p-2.5 text-center font-mono">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-surface border border-border text-text-primary">
                              {it.available_inventory_stock ?? 0} Pcs
                            </span>
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
                  {/* Step 1 -> 2: Start Assembly */}
                  {kitStatus !== 'in_assembly' && kitStatus !== 'kit_ready' && (
                    <button
                      type="button"
                      disabled={submittingAssembly || hasShortage}
                      onClick={() => handleAdvanceAssembly('in_assembly')}
                      className={`px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-sm transition-all ${
                        hasShortage
                          ? 'bg-surface-hover text-text-muted border border-border cursor-not-allowed opacity-50'
                          : 'bg-purple-600 hover:bg-purple-500 text-white cursor-pointer'
                      }`}
                    >
                      {submittingAssembly ? <FaSpinner className="animate-spin" /> : <FaTools />}
                      <span>Step 2: Move to Assembly Station</span>
                    </button>
                  )}

                  {/* Step 2: Complete Assembly */}
                  {kitStatus === 'in_assembly' && !assemblyDetails.assembled_at && assemblyDetails.assembly_status !== 'completed' && (
                    <button
                      type="button"
                      disabled={submittingAssembly}
                      onClick={() => handleAdvanceAssembly('assembled')}
                      className="px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider bg-indigo-600 hover:bg-indigo-500 text-white cursor-pointer shadow-sm flex items-center gap-1.5"
                    >
                      {submittingAssembly ? <FaSpinner className="animate-spin" /> : <FaWrench />}
                      <span>Step 2: Complete Mechanical Assembly</span>
                    </button>
                  )}

                  {/* Step 3: QC Check */}
                  {kitStatus === 'in_assembly' && (assemblyDetails.assembled_at || assemblyDetails.assembly_status === 'completed') && !assemblyDetails.qc_verified && assemblyDetails.qc_status !== 'passed' && (
                    <button
                      type="button"
                      disabled={submittingAssembly}
                      onClick={() => handleAdvanceAssembly('qc_verified')}
                      className="px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider bg-teal-600 hover:bg-teal-500 text-white cursor-pointer shadow-sm flex items-center gap-1.5"
                    >
                      {submittingAssembly ? <FaSpinner className="animate-spin" /> : <FaClipboardCheck />}
                      <span>Step 3: Pass QC Inspection</span>
                    </button>
                  )}

                  {/* Step 4: Pack & Label */}
                  {kitStatus === 'in_assembly' && (assemblyDetails.qc_verified || assemblyDetails.qc_status === 'passed') && !assemblyDetails.packed_and_labeled && (
                    <button
                      type="button"
                      disabled={submittingAssembly}
                      onClick={() => handleAdvanceAssembly('packed_and_labeled')}
                      className="px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider bg-blue-600 hover:bg-blue-500 text-white cursor-pointer shadow-sm flex items-center gap-1.5"
                    >
                      {submittingAssembly ? <FaSpinner className="animate-spin" /> : <FaBarcode />}
                      <span>Step 4: Print Label & Pack Kit</span>
                    </button>
                  )}

                  {/* Step 5: Mark Kit Ready */}
                  {kitStatus !== 'kit_ready' && (assemblyDetails.packed_and_labeled || !!assemblyDetails.kit_serial_barcode) && (
                    <button
                      type="button"
                      disabled={submittingAssembly || hasShortage}
                      onClick={() => handleAdvanceAssembly('kit_ready')}
                      className="px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer flex items-center gap-1.5 shadow-sm"
                    >
                      {submittingAssembly ? <FaSpinner className="animate-spin" /> : <FaCheckDouble />}
                      <span>Step 5: Mark Kit Ready for Dispatch</span>
                    </button>
                  )}

                  {/* Complete status banner */}
                  {kitStatus === 'kit_ready' && (
                    <span className="px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5">
                      <FaCheckCircle className="text-sm" />
                      <span>BOS Kit 100% Ready</span>
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })()}
      </Dialog>

      {/* ── Boss Requirement: View Order Details & Incoming Truck Dossier Modal ── */}
      <Dialog
        isOpen={orderDetailsModalOpen}
        onClose={() => setOrderDetailsModalOpen(false)}
        title={`Order & Shipment Dossier: ${selectedOrderForDetails?.delivery_order_id || ''}`}
        size="xl"
      >
        {selectedOrderForDetails && (() => {
          const ord = selectedOrderForDetails;
          const totalOrderedItems = (ord.items || []).reduce((acc, it) => acc + (it.ordered_qty || 0), 0);
          const totalReceivedItems = (ord.items || []).reduce((acc, it) => acc + (it.received_qty || 0), 0);
          const totalPendingItems = (ord.items || []).reduce((acc, it) => acc + (it.pending_qty || 0), 0);
          const inwardPercent = totalOrderedItems > 0 ? Math.round((totalReceivedItems / totalOrderedItems) * 100) : 0;

          return (
            <div className="space-y-5 p-1 max-h-[80vh] overflow-y-auto pr-1">
              {/* Order Header Summary Banner */}
              <div className="p-4 bg-gradient-to-r from-primary/10 via-surface-hover to-surface border border-primary/20 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-lg font-black font-mono text-primary">{ord.delivery_order_id}</span>
                    <span className="text-xs text-text-muted font-normal">• Order #{ord.order_number}</span>
                    {ord.delivery_number && (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                        Delivery #: {ord.delivery_number}
                      </span>
                    )}
                  </div>
                  <div className="text-sm font-bold text-text-primary mt-1">
                    {ord.customer_name}
                    {ord.customer_phone && <span className="text-xs text-text-muted font-normal ml-2">({ord.customer_phone})</span>}
                  </div>
                  <div className="text-xs text-text-muted mt-0.5">
                    Ordered: {new Date(ord.order_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    {ord.sla_days && <span className="ml-2 font-semibold text-text-secondary">• SLA: {ord.sla_days} Days</span>}
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap self-start md:self-auto">
                  <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider border ${
                    ord.delivery_status === 'ready_for_dispatch'
                      ? 'bg-success/15 text-success border-success/30'
                      : ord.delivery_status === 'partially_inwarded'
                      ? 'bg-warning/15 text-warning border-warning/30'
                      : 'bg-info/15 text-info border-info/30'
                  }`}>
                    {ord.delivery_status ? ord.delivery_status.replace(/_/g, ' ') : 'New Order'}
                  </span>
                  {ord.kit_preparation_status && ord.kit_preparation_status !== 'not_required' && (
                    <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-purple-500/15 text-purple-400 border border-purple-500/30">
                      BOSKIT: {ord.kit_preparation_status.replace(/_/g, ' ')}
                    </span>
                  )}
                </div>
              </div>

              {/* Delivery Site Destination & Assigned Warehouse */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div className="p-3.5 bg-surface border border-border rounded-xl space-y-1.5">
                  <div className="text-[10px] font-black uppercase tracking-wider text-text-muted flex items-center gap-1.5">
                    <FaMapMarkerAlt className="text-primary" /> Delivery Destination Site
                  </div>
                  <div className="font-bold text-text-primary text-sm">{ord.destination?.address || '—'}</div>
                  <div className="text-text-secondary flex items-center gap-2 flex-wrap">
                    <span>District: <strong>{ord.destination?.district || '—'}</strong></span>
                    <span>State: <strong>{ord.destination?.state || '—'}</strong></span>
                    <span className="font-mono text-primary font-bold">PIN: {ord.destination?.pincode || '—'}</span>
                  </div>
                </div>

                <div className="p-3.5 bg-surface border border-border rounded-xl space-y-1.5">
                  <div className="text-[10px] font-black uppercase tracking-wider text-text-muted flex items-center gap-1.5">
                    <FaWarehouse className="text-primary" /> Assigned Fulfillment Warehouse
                  </div>
                  <div className="font-bold text-text-primary text-sm">{ord.warehouse_code || 'Central Warehouse Hub'}</div>
                  <div className="text-text-muted">
                    Assigned for inventory verification, packing, and dispatch staging.
                  </div>
                </div>
              </div>

              {/* ── Complete Incoming Consolidated Truck & Driver Logistics ── */}
              {ord.incoming_truck_group && (ord.incoming_truck_group.group_id || ord.incoming_truck_group.vehicle_number) && (
                <div className="p-4 rounded-xl bg-gradient-to-r from-blue-500/10 via-surface-hover to-surface border border-blue-500/30 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/70 pb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-primary/20 text-primary flex items-center justify-center font-bold">
                        <FaTruck />
                      </div>
                      <div>
                        <div className="font-black text-text-primary text-xs uppercase tracking-wider flex items-center gap-1.5">
                          Incoming Consolidated Truck Dossier
                        </div>
                        <div className="text-[11px] text-text-muted">
                          Multi-EPC Consignment Group: <strong className="text-text-primary font-mono">{ord.incoming_truck_group.group_id}</strong>
                          {ord.incoming_truck_group.total_epc_orders_in_truck > 1 && (
                            <span className="ml-1 text-info">({ord.incoming_truck_group.total_epc_orders_in_truck} EPC Orders bundled)</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div>
                      {ord.incoming_truck_group.is_claimed ? (
                        <div className="text-right">
                          <span className="px-2.5 py-1 rounded-full bg-success/15 text-success border border-success/30 text-xs font-bold flex items-center gap-1">
                            <FaCheckCircle className="text-[10px]" /> Claimed & Unloaded in WH
                          </span>
                          {ord.incoming_truck_group.claimed_at && (
                            <div className="text-[10px] text-text-muted mt-0.5">
                              {new Date(ord.incoming_truck_group.claimed_at).toLocaleString()} • {ord.incoming_truck_group.claimed_by_name || 'Staff'}
                            </div>
                          )}
                        </div>
                      ) : (
                        <button
                          onClick={() => handleClaimShipment(ord)}
                          disabled={claimingShipmentId === ord._id}
                          className="px-3.5 py-2 rounded-xl bg-primary text-white hover:bg-primary-hover active:scale-95 transition-all text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-sm cursor-pointer"
                        >
                          {claimingShipmentId === ord._id ? <FaSpinner className="animate-spin text-xs" /> : <FaLayerGroup className="text-xs" />}
                          <span>Claim & Unload to Warehouse</span>
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div>
                      <span className="text-[10px] text-text-muted uppercase font-bold block">Vehicle Number</span>
                      <span className="font-mono font-bold text-text-primary text-sm">{ord.incoming_truck_group.vehicle_number || 'MH-12-PQ-9080'}</span>
                      {ord.incoming_truck_group.vehicle_type && <span className="text-[10px] text-text-muted block">({ord.incoming_truck_group.vehicle_type})</span>}
                    </div>

                    <div>
                      <span className="text-[10px] text-text-muted uppercase font-bold block">Transporter / LR #</span>
                      <span className="font-bold text-text-primary">{ord.incoming_truck_group.transporter_name || 'TCI Freight'}</span>
                      {ord.incoming_truck_group.lr_number && <span className="font-mono text-primary text-[10px] block font-bold">LR: {ord.incoming_truck_group.lr_number}</span>}
                    </div>

                    <div>
                      <span className="text-[10px] text-text-muted uppercase font-bold block">Driver Contact</span>
                      <span className="font-bold text-text-primary">{ord.incoming_truck_group.driver_name || 'Sachin Patil'}</span>
                      {ord.incoming_truck_group.driver_mobile && (
                        <a href={`tel:${ord.incoming_truck_group.driver_mobile}`} className="text-primary hover:underline font-mono text-[11px] block font-semibold">
                          {ord.incoming_truck_group.driver_mobile}
                        </a>
                      )}
                    </div>

                    <div>
                      <span className="text-[10px] text-text-muted uppercase font-bold block">Unloading Dock</span>
                      <span className="font-mono font-bold text-text-primary px-2 py-0.5 rounded bg-surface border border-border inline-block mt-0.5">
                        {ord.incoming_truck_group.unloaded_dock || 'Receiving Dock #1'}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Items Breakdown Table */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-black text-text-primary uppercase tracking-wider flex items-center gap-1.5">
                    <FaBoxes className="text-primary" /> Ordered Products & Inward Status
                  </span>
                  <span className="font-bold text-text-secondary">
                    {totalReceivedItems} / {totalOrderedItems} Pcs Verified ({inwardPercent}%)
                  </span>
                </div>

                <div className="border border-border rounded-xl overflow-hidden bg-surface max-h-56 overflow-y-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-surface-hover border-b border-border text-[10px] font-black uppercase text-text-muted sticky top-0">
                      <tr>
                        <th className="p-2.5">Product Name & SKU</th>
                        <th className="p-2.5">Fulfilment Method</th>
                        <th className="p-2.5 text-center">WH Stock</th>
                        <th className="p-2.5 text-center">Ordered</th>
                        <th className="p-2.5 text-center">Inwarded</th>
                        <th className="p-2.5 text-center">Pending</th>
                        <th className="p-2.5 text-center">Rack</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {(ord.items || []).map(it => (
                        <tr key={it.sku} className="hover:bg-surface-hover/30">
                          <td className="p-2.5">
                            <div className="font-bold text-text-primary">{it.product_name}</div>
                            <div className="text-[10px] font-mono text-primary">{it.sku}</div>
                          </td>
                          <td className="p-2.5 text-[11px] text-text-secondary capitalize">
                            {it.supply_fulfilment_method ? it.supply_fulfilment_method.replace(/_/g, ' ') : 'Warehouse Stock'}
                          </td>
                          <td className="p-2.5 text-center font-mono text-[11px]">
                            <span className="font-bold text-text-primary">{it.available_inventory_stock ?? 0}</span>
                            <span className="text-[9px] text-text-muted ml-0.5">Pcs</span>
                          </td>
                          <td className="p-2.5 text-center font-bold">{it.ordered_qty}</td>
                          <td className="p-2.5 text-center font-bold text-success">{it.received_qty}</td>
                          <td className="p-2.5 text-center">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              it.pending_qty === 0 ? 'bg-success/15 text-success' : 'bg-warning/15 text-warning'
                            }`}>
                              {it.pending_qty} Pcs
                            </span>
                          </td>
                          <td className="p-2.5 text-center font-mono text-text-muted">
                            {it.rack_location || '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Scanned Serial Numbers Registry (Outward Matching) if available */}
              {ord.scanned_serials && ord.scanned_serials.length > 0 && (
                <div className="p-3.5 bg-surface border border-border rounded-xl space-y-2">
                  <div className="text-xs font-black text-text-primary uppercase tracking-wider flex items-center gap-1.5">
                    <FaBarcode className="text-primary" /> Scanned Barcodes & Serials Registry ({ord.scanned_serials.length} Registered)
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-36 overflow-y-auto text-xs">
                    {ord.scanned_serials.map((s, idx) => (
                      <div key={idx} className="p-2 rounded-lg bg-surface-hover border border-border flex justify-between items-center">
                        <div>
                          <span className="font-mono font-bold text-primary">{s.serial_code}</span>
                          <span className="text-[10px] text-text-muted block">{s.sku}</span>
                        </div>
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          {s.verified_for_outward ? '✓ Outward Verified' : 'Inward Verified'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Modal Footer Actions */}
              <div className="flex justify-between items-center pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setOrderDetailsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-surface-hover border border-border text-text-secondary"
                >
                  Close
                </button>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setOrderDetailsModalOpen(false);
                      handleOpenInwardModal(ord);
                    }}
                    className="px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider gradient-primary text-white cursor-pointer shadow-sm"
                  >
                    Inward Material
                  </button>
                  {ord.kit_preparation_status && ord.kit_preparation_status !== 'not_required' && (
                    <button
                      onClick={() => {
                        setOrderDetailsModalOpen(false);
                        setSelectedOrderForAssembly(ord);
                        setMainSectionTab('boskit_station');
                      }}
                      className="px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider bg-purple-600 hover:bg-purple-500 text-white cursor-pointer shadow-sm"
                    >
                      Open BOSKit Station
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })()}
      </Dialog>
    </div>
  );
}

