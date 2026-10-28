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
  FaLayerGroup, FaArrowRight, FaArrowLeft, FaLock, FaWarehouse,
  FaBuilding, FaTools, FaBarcode, FaExclamationTriangle,
  FaCheckDouble, FaWrench, FaClipboardCheck, FaPlus, FaCube, FaCheck
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
  updateKitAssembly,
  allocatePreassembledKit
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

  // Sync tab with URL route changes (e.g. sidebar navigation between New Orders and BOS Kit Assembly)
  useEffect(() => {
    if (location.pathname.includes('bos-kit-assembly')) {
      setMainSectionTab('boskit_station');
    } else if (location.pathname.includes('new-orders')) {
      setMainSectionTab('orders');
    } else if (defaultTab) {
      setMainSectionTab(defaultTab);
    }
  }, [location.pathname, defaultTab]);

  // Support ?orderId=... query param to auto-focus and expand order in BOS Kit Workstation
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const targetOrderId = params.get('orderId');
    if (targetOrderId && orders.length > 0) {
      const matched = orders.find(o => o._id === targetOrderId || o.order_number === targetOrderId || o.delivery_order_id === targetOrderId);
      if (matched) {
        setMainSectionTab('boskit_station');
        setSelectedOrderForAssembly(matched);
        setExpandedCards(prev => ({ ...prev, [matched._id]: true }));
      }
    }
  }, [location.search, orders]);

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

  // ── Two-Part BOS Kit Workstation Architecture (Boss Specification) ──
  // Mode: 'order_specific' (Order Fulfillment) vs 'stock_inventory' (Pre-Assembly for Warehouse Stock)
  const [boskitWorkstationMode, setBoskitWorkstationMode] = useState('order_specific');

  // Pre-Assembled Warehouse Stock Models (Initial Standard Templates)
  const DEFAULT_STOCK_MODELS = [
    {
      id: '5kw-std',
      name: '5kW Standard Residential Solar BOS Kit',
      category: 'Residential',
      storage_location: 'Bay 2 / Pallet B-04',
      ready_stock: 4,
      batch_codes: ['WH-BOS-5KW-2026-B101', 'WH-BOS-5KW-2026-B102', 'WH-BOS-5KW-2026-B103', 'WH-BOS-5KW-2026-B104'],
      bom_components: [
        { name: 'Aluminium Mounting Rails (4.2m)', sku: 'BOS-RAIL-4.2M-AL', qty: 8, unit: 'Pcs' },
        { name: 'SS304 Mid Clamps (35mm)', sku: 'BOS-CLAMP-MID-35MM', qty: 14, unit: 'Pcs' },
        { name: 'SS304 End Clamps (35mm)', sku: 'BOS-CLAMP-END-35MM', qty: 4, unit: 'Pcs' },
        { name: '4 sq mm Solar DC Cable (100m Roll)', sku: 'BOS-DC-CABLE-4SQMM-100M', qty: 1, unit: 'Roll' },
        { name: '2-In 2-Out DCDB / AJB Box', sku: 'BOS-AJB-DCDB-4IN-4OUT', qty: 1, unit: 'Box' },
        { name: 'Copper Bonded Earth Rod (2m)', sku: 'BOS-EARTH-ROD-COPPER-2M', qty: 2, unit: 'Pcs' },
        { name: 'MC4 Connectors 1000V', sku: 'BOS-MC4-CONN-1000V', qty: 8, unit: 'Pairs' }
      ]
    },
    {
      id: '3kw-std',
      name: '3kW Residential Compact Solar BOS Kit',
      category: 'Residential',
      storage_location: 'Bay 1 / Rack A-02',
      ready_stock: 2,
      batch_codes: ['WH-BOS-3KW-2026-A201', 'WH-BOS-3KW-2026-A202'],
      bom_components: [
        { name: 'Aluminium Mounting Rails (3.2m)', sku: 'BOS-RAIL-3.2M-AL', qty: 6, unit: 'Pcs' },
        { name: 'SS304 Mid Clamps (35mm)', sku: 'BOS-CLAMP-MID-35MM', qty: 8, unit: 'Pcs' },
        { name: 'SS304 End Clamps (35mm)', sku: 'BOS-CLAMP-END-35MM', qty: 4, unit: 'Pcs' },
        { name: '4 sq mm Solar DC Cable (100m Roll)', sku: 'BOS-DC-CABLE-4SQMM-100M', qty: 1, unit: 'Roll' },
        { name: '1-In 1-Out DCDB / AJB Box', sku: 'BOS-AJB-DCDB-4IN-4OUT', qty: 1, unit: 'Box' },
        { name: 'Copper Bonded Earth Rod (2m)', sku: 'BOS-EARTH-ROD-COPPER-2M', qty: 2, unit: 'Pcs' }
      ]
    },
    {
      id: '10kw-comm',
      name: '10kW Commercial Solar BOS Kit',
      category: 'Commercial',
      storage_location: 'Bay 3 / Rack C-01',
      ready_stock: 1,
      batch_codes: ['WH-BOS-10KW-2026-C301'],
      bom_components: [
        { name: 'Aluminium Mounting Rails (4.2m)', sku: 'BOS-RAIL-4.2M-AL', qty: 16, unit: 'Pcs' },
        { name: 'SS304 Mid Clamps (35mm)', sku: 'BOS-CLAMP-MID-35MM', qty: 28, unit: 'Pcs' },
        { name: 'SS304 End Clamps (35mm)', sku: 'BOS-CLAMP-END-35MM', qty: 8, unit: 'Pcs' },
        { name: '4 sq mm Solar DC Cable (100m Roll)', sku: 'BOS-DC-CABLE-4SQMM-100M', qty: 2, unit: 'Rolls' },
        { name: '4-In 4-Out DCDB / AJB Box', sku: 'BOS-AJB-DCDB-6IN-6OUT', qty: 1, unit: 'Box' },
        { name: 'Copper Bonded Earth Rod (2m)', sku: 'BOS-EARTH-ROD-COPPER-2M', qty: 4, unit: 'Pcs' },
        { name: 'MC4 Connectors 1000V', sku: 'BOS-MC4-CONN-1000V', qty: 16, unit: 'Pairs' }
      ]
    }
  ];

  const [preassembledStock, setPreassembledStock] = useState(() => {
    try {
      const saved = localStorage.getItem('solarkits_preassembled_stock');
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore localStorage parse error
    }
    return DEFAULT_STOCK_MODELS;
  });

  const [stockAssemblyHistory, setStockAssemblyHistory] = useState(() => {
    try {
      const saved = localStorage.getItem('solarkits_stock_assembly_history');
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore localStorage parse error
    }
    return [
      {
        id: 'hist-1',
        model_name: '5kW Standard Residential Solar BOS Kit',
        batch_code: 'WH-BOS-5KW-2026-B101, WH-BOS-5KW-2026-B102',
        qty: 2,
        assembled_by: 'Warehouse Technician (Ramesh)',
        storage_location: 'Bay 2 / Pallet B-04',
        timestamp: new Date(Date.now() - 86400000).toISOString()
      },
      {
        id: 'hist-2',
        model_name: '3kW Residential Compact Solar BOS Kit',
        batch_code: 'WH-BOS-3KW-2026-A201',
        qty: 1,
        assembled_by: 'QC Specialist (Mukesh)',
        storage_location: 'Bay 1 / Rack A-02',
        timestamp: new Date(Date.now() - 172800000).toISOString()
      }
    ];
  });

  const totalPreassembledKitsInStock = useMemo(() => {
    return preassembledStock.reduce((acc, m) => acc + (m.ready_stock || 0), 0);
  }, [preassembledStock]);

  // Modal State for Pre-Assembling into Stock (Part 2)
  const [stockAssemblyModalOpen, setStockAssemblyModalOpen] = useState(false);
  const [selectedStockModelId, setSelectedStockModelId] = useState('5kw-std');
  const [stockAssembleQty, setStockAssembleQty] = useState(1);
  const [stockAssemblyRack, setStockAssemblyRack] = useState('Bay 2 / Pallet B-04');
  const [stockAssemblyOperator, setStockAssemblyOperator] = useState('Warehouse Assembly Lead');
  const [submittingStockAssembly, setSubmittingStockAssembly] = useState(false);

  // Modal State for 1-Click Allocating from Ready Stock to Customer Order (Part 1)
  const [stockAllocateModalOpen, setStockAllocateModalOpen] = useState(false);
  const [orderForStockAllocation, setOrderForStockAllocation] = useState(null);
  const [selectedAllocateModelId, setSelectedAllocateModelId] = useState('5kw-std');
  const [submittingStockAllocation, setSubmittingStockAllocation] = useState(false);

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

  // 1-Click Allocation from Ready Warehouse Stock to a Customer Order (Part 1)
  const handleOpenStockAllocationModal = (order) => {
    setOrderForStockAllocation(order);
    const availableModel = preassembledStock.find(m => m.ready_stock > 0) || preassembledStock[0];
    setSelectedAllocateModelId(availableModel?.id || '5kw-std');
    setStockAllocateModalOpen(true);
  };

  const handleConfirmStockAllocation = async () => {
    if (!orderForStockAllocation) return;
    const model = preassembledStock.find(m => m.id === selectedAllocateModelId);
    if (!model || model.ready_stock <= 0) {
      dispatch(setAlert({
        message: 'Selected BOS Kit model has 0 ready stock in warehouse. Please pre-assemble kits or assemble on workstation.',
        type: 'warning'
      }));
      return;
    }

    try {
      setSubmittingStockAllocation(true);
      const batchCode = model.batch_codes && model.batch_codes.length > 0
        ? model.batch_codes[0]
        : `WH-STOCK-KIT-${orderForStockAllocation.order_number}-${Date.now().toString().slice(-4)}`;

      // Call backend to update order
      await allocatePreassembledKit(orderForStockAllocation._id, {
        kit_model_name: model.name,
        batch_code: batchCode,
        notes: `Allocated from warehouse pre-assembled inventory (${model.name}).`
      });

      // Deduct 1 from local ready stock
      const updatedStock = preassembledStock.map(m => {
        if (m.id === model.id) {
          const remainingBatches = (m.batch_codes || []).slice(1);
          return {
            ...m,
            ready_stock: Math.max(0, m.ready_stock - 1),
            batch_codes: remainingBatches
          };
        }
        return m;
      });
      setPreassembledStock(updatedStock);
      try {
        localStorage.setItem('solarkits_preassembled_stock', JSON.stringify(updatedStock));
      } catch {
        // ignore localStorage write error
      }

      dispatch(setAlert({
        message: `✓ Pre-assembled BOS Kit (${model.name}) allocated from warehouse stock to Order #${orderForStockAllocation.order_number}! Order is now ready for dispatch.`,
        type: 'success'
      }));

      setStockAllocateModalOpen(false);
      setOrderForStockAllocation(null);
      await fetchOrders();
    } catch (err) {
      console.error(err);
      dispatch(setAlert({
        message: err.response?.data?.message || 'Failed to allocate pre-assembled kit from stock.',
        type: 'error'
      }));
    } finally {
      setSubmittingStockAllocation(false);
    }
  };

  // Pre-Assemble into Warehouse Stock from Inward Inventory (Part 2)
  const handleConfirmAssembleForStock = async (e) => {
    if (e) e.preventDefault();
    const qty = parseInt(stockAssembleQty) || 1;
    if (qty <= 0) {
      dispatch(setAlert({ message: 'Please enter a valid quantity to assemble.', type: 'warning' }));
      return;
    }
    const model = preassembledStock.find(m => m.id === selectedStockModelId);
    if (!model) return;

    try {
      setSubmittingStockAssembly(true);
      const newBatches = [];
      for (let i = 0; i < qty; i++) {
        newBatches.push(`WH-BOS-${model.id.toUpperCase()}-${new Date().getFullYear()}-${Date.now().toString().slice(-4)}${i + 1}`);
      }

      const updatedStock = preassembledStock.map(m => {
        if (m.id === model.id) {
          return {
            ...m,
            ready_stock: m.ready_stock + qty,
            batch_codes: [...(m.batch_codes || []), ...newBatches],
            storage_location: stockAssemblyRack || m.storage_location
          };
        }
        return m;
      });
      setPreassembledStock(updatedStock);
      try {
        localStorage.setItem('solarkits_preassembled_stock', JSON.stringify(updatedStock));
      } catch {
        // ignore localStorage write error
      }

      const newHistItem = {
        id: `hist-${Date.now()}`,
        model_name: model.name,
        batch_code: newBatches.join(', '),
        qty,
        assembled_by: stockAssemblyOperator || 'Warehouse Assembly Team',
        storage_location: stockAssemblyRack || model.storage_location,
        timestamp: new Date().toISOString()
      };
      const updatedHistory = [newHistItem, ...stockAssemblyHistory];
      setStockAssemblyHistory(updatedHistory);
      try {
        localStorage.setItem('solarkits_stock_assembly_history', JSON.stringify(updatedHistory));
      } catch {
        // ignore localStorage write error
      }

      dispatch(setAlert({
        message: `Successfully assembled ${qty} unit(s) of "${model.name}" into Warehouse Ready Stock! Stored at ${stockAssemblyRack || model.storage_location}.`,
        type: 'success'
      }));

      setStockAssemblyModalOpen(false);
      setStockAssembleQty(1);
    } catch (err) {
      console.error(err);
      dispatch(setAlert({ message: 'Failed to assemble kits into stock.', type: 'error' }));
    } finally {
      setSubmittingStockAssembly(false);
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
        message: `BOS Kit Assembly locked! ${totalPendingItems} units must be inwarded first (click "Inward Material").`,
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
        if (res.summary) {
          setSummary(res.summary);
          window.dispatchEvent(new CustomEvent('deliveryOrdersUpdated', { detail: res.summary }));
        }
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

  // Helper to check if an item is specifically the pre-assembled finished BOS Kit package
  const isBosKitItem = (it) => {
    if (!it) return false;
    const sku = (it.sku || '').toUpperCase();
    const name = (it.product_name || '').toLowerCase();
    const cat = (it.category || '').toLowerCase();

    // Strict exclusion: rails, clamps, hardware, fasteners, bolts, cables
    if (sku.includes('RAIL') || sku.includes('CLAMP') || sku.includes('FASTENER') || sku.includes('BOLT') ||
        cat.includes('structure') || cat.includes('fastener') || name.includes('rail') || name.includes('clamp') || name.includes('bolt') || name.includes('fastener')) {
      return false;
    }

    return cat.includes('bos kit') || 
           sku.startsWith('BOS-KIT-') || 
           name.startsWith('bos kit') || 
           it.is_synthesized_bos_kit || 
           it.is_bos_kit;
  };

  // Computes the comprehensive list of items for the Inward Verification modal
  const modalInwardItems = useMemo(() => {
    if (!selectedOrderForInward) return [];
    const items = [...(selectedOrderForInward.items || [])];

    // Check if finished BOS Kit line item already exists in items
    const hasBosKitLine = items.some(it => isBosKitItem(it));

    // If order has BOS Kit requirement and it's not explicitly in items, synthesize it!
    if (!hasBosKitLine && selectedOrderForInward.kit_preparation_status !== 'not_required') {
      const totalKits = (selectedOrderForInward.epcs || []).reduce((acc, epc) => {
        const match = (epc.boskit_qty || '').match(/(\d+)/);
        return acc + (match ? parseInt(match[1]) : 1);
      }, 0) || 1;

      const isKitReady = selectedOrderForInward.kit_preparation_status === 'kit_ready' || 
                         selectedOrderForInward.kit_assembly_details?.assembly_status === 'completed';
      const receivedKits = isKitReady ? totalKits : 0;
      const pendingKits = Math.max(0, totalKits - receivedKits);

      items.push({
        sku: `BOS-KIT-${(selectedOrderForInward.system_capacity || '5KW').replace(/\s+/g, '')}-STD`,
        product_name: `BOS Kit (${selectedOrderForInward.system_capacity || '5kW'} Pre-assembled Electrical Package - ACDB/DCDB/Cables)`,
        category: 'BOS Kit',
        ordered_qty: totalKits,
        received_qty: receivedKits,
        pending_qty: pendingKits,
        damaged_qty: 0,
        missing_qty: 0,
        rack_location: selectedOrderForInward.kit_assembly_details?.storage_location || 'BAY-BOS-STOCK',
        is_synthesized_bos_kit: true
      });
    }

    return items;
  }, [selectedOrderForInward]);

  // Open Material Inward Modal
  const handleOpenInwardModal = (order) => {
    setSelectedOrderForInward(order);
    const initialInputs = {};
    const items = [...(order.items || [])];

    const hasBosKitLine = items.some(it => isBosKitItem(it));
    if (!hasBosKitLine && order.kit_preparation_status !== 'not_required') {
      const totalKits = (order.epcs || []).reduce((acc, epc) => {
        const match = (epc.boskit_qty || '').match(/(\d+)/);
        return acc + (match ? parseInt(match[1]) : 1);
      }, 0) || 1;
      const isKitReady = order.kit_preparation_status === 'kit_ready' || order.kit_assembly_details?.assembly_status === 'completed';
      const receivedKits = isKitReady ? totalKits : 0;
      const pendingKits = Math.max(0, totalKits - receivedKits);
      items.push({
        sku: `BOS-KIT-${(order.system_capacity || '5KW').replace(/\s+/g, '')}-STD`,
        pending_qty: pendingKits,
        rack_location: order.kit_assembly_details?.storage_location || 'BAY-BOS-STOCK'
      });
    }

    items.forEach(it => {
      initialInputs[it.sku] = {
        qty: it.pending_qty,
        damaged_qty: 0,
        missing_qty: 0,
        rack_location: it.rack_location || (isBosKitItem(it) ? 'BAY-BOS-STOCK' : '')
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

    const items = modalInwardItems;
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

    for (const it of modalInwardItems) {
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
          product_name: it.product_name,
          is_bos_kit: isBosKitItem(it),
          qty,
          damaged_qty: damagedQty,
          missing_qty: missingQty,
          rack_location: input?.rack_location || it.rack_location || (isBosKitItem(it) ? 'BAY-BOS-STOCK' : '')
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
            onClick={() => {
              if (location.pathname.includes('bos-kit-assembly')) {
                navigate(`${prefix}/new-orders`);
              } else {
                setMainSectionTab('orders');
              }
            }}
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
                    {/* Multi-EPC Consignment Numbering Badge */}
                    <span className="px-2.5 py-1 rounded-lg font-mono text-xs font-bold bg-purple-500/15 text-purple-400 border border-purple-500/30 flex items-center gap-1.5 shadow-2xs">
                      <FaLayerGroup className="text-[10px]" />
                      {ord.order_group_id ? `Consignment: ${ord.order_group_id} • ` : ''}
                      {(ord.epcs?.length || 1)} {(ord.epcs?.length || 1) === 1 ? 'EPC' : 'EPCs'} Included
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
                  {ord.epcs && ord.epcs.length > 1 ? (
                    /* Multi-EPC Consolidated Consignment (No single company name shown per boss rule) */
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-2.5 py-1 rounded-lg bg-purple-500/15 text-purple-400 font-black text-xs uppercase tracking-wider flex items-center gap-1.5 border border-purple-500/30">
                        <FaLayerGroup className="text-xs" /> Consolidated Consignment ({ord.epcs.length} EPCs):
                      </span>
                      <div className="flex flex-wrap items-center gap-1.5">
                        {ord.epcs.map((epc, i) => (
                          <span key={epc.epc_id || i} className="px-2.5 py-1 rounded-lg bg-surface border border-border text-text-primary font-bold text-xs flex items-center gap-1.5 shadow-2xs">
                            <span className="w-2 h-2 rounded-full bg-purple-400"></span>
                            <span>{epc.epc_name || `EPC #${i+1}`}</span>
                            <span className="text-[11px] font-mono text-purple-400 font-bold">
                              ({epc.system_capacity || (epc.share_percentage ? `${epc.share_percentage}% Share` : 'SolarKit')})
                            </span>
                          </span>
                        ))}
                      </div>
                      {(ord.destination?.city || ord.destination?.district || ord.destination?.state) && (
                        <span className="flex items-center gap-1 text-text-muted font-medium ml-1">
                          <HiOutlineLocationMarker className="text-xs text-primary" />
                          <span className="text-[11px] text-text-muted font-bold">Delivery Site:</span>
                          <strong className="text-text-primary text-xs">{ord.destination?.city || ord.destination?.district || ''}{ord.destination?.state ? `, ${ord.destination.state}` : ''}</strong>
                        </span>
                      )}
                    </div>
                  ) : (
                    /* Single EPC Order (Show the EPC Contractor clearly labeled) */
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                      <span className="font-bold text-text-primary text-sm flex items-center gap-1.5">
                        <span className="px-2 py-0.5 rounded-md bg-primary/10 text-primary text-[10px] font-black uppercase border border-primary/20">
                          EPC Contractor
                        </span>
                        <span>{ord.epcs?.[0]?.epc_name || ord.customer_name}</span>
                      </span>
                      {(ord.epcs?.[0]?.contact_phone || ord.customer_phone) && (
                        <span className="flex items-center gap-1 text-text-muted font-medium">
                          <FaPhoneAlt className="text-[10px] text-primary" /> {ord.epcs?.[0]?.contact_phone || ord.customer_phone}
                        </span>
                      )}
                      {(ord.destination?.city || ord.destination?.district || ord.destination?.state) && (
                        <span className="flex items-center gap-1 text-text-muted font-medium">
                          <HiOutlineLocationMarker className="text-xs text-primary" />
                          {ord.destination?.city || ord.destination?.district || ''}{ord.destination?.state ? `, ${ord.destination.state}` : ''}
                        </span>
                      )}
                    </div>
                  )}

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

                  {/* Right: Action Buttons (View Details + Inward Material + Send for BOS Kit Assembly) */}
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

                    {/* 2. Inward Material Button (Restored Inward Workflow Button) */}
                    <button
                      type="button"
                      onClick={() => handleOpenInwardModal(ord)}
                      className={`h-9 px-4 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-200 flex items-center gap-2 shadow-sm cursor-pointer ${
                        totalPendingItems === 0 || isReadyForDispatch
                          ? 'bg-surface-hover hover:bg-surface border border-border text-text-secondary hover:text-text-primary'
                          : 'gradient-primary text-white hover:opacity-95 active:scale-95'
                      }`}
                      title={
                        totalPendingItems === 0 || isReadyForDispatch
                          ? 'All items inwarded. Click to view or adjust inward records'
                          : 'Record material physical inward & scan serials'
                      }
                    >
                      <HiOutlineClipboardCheck className={`text-base ${totalPendingItems === 0 || isReadyForDispatch ? 'text-emerald-400' : 'text-white'}`} />
                      <span>{totalPendingItems === 0 || isReadyForDispatch ? 'View / Adjust Inward' : 'Inward Material'}</span>
                    </button>

                    {/* 3. Send for Delivery (Enabled ONLY when 100% Inwarded) */}
                    {(() => {
                      const isAllInwarded = totalPendingItems === 0 && totalOrderedItems > 0;

                      if (!isAllInwarded) return null;

                      return (
                        <button
                          type="button"
                          onClick={() => {
                            const prefix = location.pathname.startsWith('/warehouse-management-panel')
                              ? '/warehouse-management-panel'
                              : '/warehouse';
                            navigate(`${prefix}/out-for-delivery`);
                          }}
                          className="h-9 px-4 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-200 flex items-center gap-2 shadow-sm bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 hover:from-emerald-500 hover:to-teal-500 text-white cursor-pointer active:scale-95 shadow-emerald-500/25"
                          title="All materials inwarded! Click to forward order to Out for Delivery Station"
                        >
                          <FaTruck className="text-xs" />
                          <span>Send for Delivery</span>
                          <FaArrowRight className="text-[10px]" />
                        </button>
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
    /* ── DEDICATED BOS KIT ASSEMBLY & PREPARATION WORKSTATION TAB (Two-Part Architecture: Boss Specification) ── */
    <div className="space-y-6">
      {/* ── Two-Part Workstation Mode Switcher with Back to Orders ── */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-2 bg-surface/90 border border-purple-500/30 rounded-2xl shadow-sm">
        <div className="flex items-center gap-2 flex-1">
          <button
            type="button"
            onClick={() => {
              navigate(`${prefix}/new-orders`);
              setMainSectionTab('orders');
            }}
            className="px-4 py-3 rounded-xl text-xs font-black uppercase tracking-wider bg-surface-hover hover:bg-surface border border-border text-text-primary hover:border-primary/50 flex items-center gap-2 cursor-pointer shadow-xs transition-all shrink-0"
            title="Navigate back to New Orders Procurement Fulfillment Queue"
          >
            <FaArrowLeft className="text-xs text-primary" />
            <span>← Back to Orders</span>
          </button>
          <button
            type="button"
            onClick={() => setBoskitWorkstationMode('order_specific')}
            className={`flex-1 py-3 px-4 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer ${
              boskitWorkstationMode === 'order_specific'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-500/25 scale-[1.01]'
                : 'text-text-secondary hover:text-text-primary hover:bg-surface-hover'
            }`}
          >
            <FaTools className="text-sm" />
            <span>Part 1: 📦 Order-Specific Assembly & Stock Allocation</span>
          </button>
          <button
            type="button"
            onClick={() => setBoskitWorkstationMode('stock_inventory')}
            className={`flex-1 py-3 px-4 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer ${
              boskitWorkstationMode === 'stock_inventory'
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-500/25 scale-[1.01]'
                : 'text-text-secondary hover:text-text-primary hover:bg-surface-hover'
            }`}
          >
            <FaWarehouse className="text-sm" />
            <span>Part 2: 🏭 Warehouse Stock Pre-Assembly (Buffer Inventory)</span>
          </button>
        </div>

        {/* Pre-assembled ready stock counter pill */}
        <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-400">
          <FaCube className="text-sm" />
          <div className="text-xs">
            <span className="font-bold">WH Ready Stock: </span>
            <strong className="font-mono text-sm">{totalPreassembledKitsInStock}</strong> Kits Available
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          PART 2: WAREHOUSE BUFFER STOCK PRE-ASSEMBLY WORKSTATION
          (Boss Requirement: Not tied to specific customer orders;
           uses bulk inwarded materials to build standard inventory)
         ───────────────────────────────────────────────────────────── */}
      {boskitWorkstationMode === 'stock_inventory' ? (
        <div className="space-y-6">
          {/* Header Banner & Quick Action */}
          <div className="card p-6 rounded-2xl border border-emerald-500/30 bg-gradient-to-r from-emerald-950/30 via-surface to-teal-950/20 space-y-4 shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    Part 2: Warehouse Stock Buffer (Make-to-Stock)
                  </span>
                  <span className="text-xs text-text-muted">• Inwarded bulk inventory se advance me ready kits banayein</span>
                </div>
                <h2 className="text-lg font-black text-text-primary mt-1">
                  Warehouse Stock Buffer BOS Kit Pre-Assembly
                </h2>
                <p className="text-xs text-text-secondary mt-1 max-w-2xl">
                  Inwarded materials (Mounting rails, clamps, DC cables, DCDB boxes, earth rods, MC4 connectors) se advance me standard BOS Kits tayyar karke warehouse buffer inventory me store karein. Jab customer order aayega, to zero lead time me 1-click se stock allocate ho jayega!
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setSelectedStockModelId('5kw-std');
                  setStockAssembleQty(1);
                  setStockAssemblyModalOpen(true);
                }}
                className="px-5 py-3 rounded-xl text-xs font-black uppercase tracking-wider bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-lg shadow-emerald-600/25 flex items-center gap-2 cursor-pointer transition-all active:scale-95 shrink-0"
              >
                <FaPlus className="text-sm" />
                <span>+ Pre-Assemble New Kits for Stock</span>
              </button>
            </div>

            {/* Quick KPI Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-border/60">
              <div className="flex items-center gap-3 p-3 rounded-xl bg-surface/80 border border-border">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center text-lg font-bold">
                  <FaCube />
                </div>
                <div>
                  <div className="text-xs text-text-muted">Total Buffer Stock in WH</div>
                  <div className="text-xl font-black text-emerald-400">{totalPreassembledKitsInStock} Kits Ready</div>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-xl bg-surface/80 border border-border">
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center text-lg font-bold">
                  <FaTools />
                </div>
                <div>
                  <div className="text-xs text-text-muted">Standard Catalog Templates</div>
                  <div className="text-xl font-black text-purple-400">{preassembledStock.length} Standard Models</div>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-xl bg-surface/80 border border-border">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center text-lg font-bold">
                  <FaHistory />
                </div>
                <div>
                  <div className="text-xs text-text-muted">Assembly Batches Logged</div>
                  <div className="text-xl font-black text-blue-400">{stockAssemblyHistory.length} Batches Recorded</div>
                </div>
              </div>
            </div>
          </div>

          {/* Standard Catalog Grid */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-sm font-black text-text-primary uppercase tracking-wider">
                  Standard BOS Kit Models in Warehouse Inventory
                </h3>
                <p className="text-[11px] text-text-muted">
                  Catalog models ready for advance assembly using inwarded raw inventory
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {preassembledStock.map((model) => (
                <div
                  key={model.id}
                  className="card p-5 rounded-2xl border border-border bg-surface flex flex-col justify-between space-y-4 hover:border-emerald-500/40 transition-all shadow-xs"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-surface-hover border border-border text-text-secondary">
                          {model.category}
                        </span>
                        <h4 className="text-sm font-black text-text-primary mt-1.5">{model.name}</h4>
                        <div className="text-[11px] text-text-muted flex items-center gap-1 mt-0.5">
                          <FaWarehouse className="text-[10px]" />
                          <span>Location: {model.storage_location}</span>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className={`text-2xl font-black ${model.ready_stock > 0 ? 'text-emerald-400' : 'text-amber-400'}`}>
                          {model.ready_stock}
                        </div>
                        <div className="text-[10px] text-text-muted uppercase font-bold">Ready Stock</div>
                      </div>
                    </div>

                    {/* Batch codes list */}
                    <div className="p-2.5 rounded-xl bg-surface-hover/50 border border-border/80">
                      <div className="text-[10px] uppercase font-bold text-text-muted mb-1 flex items-center justify-between">
                        <span>Active Stock Batches:</span>
                        <span className="font-mono text-primary font-bold">({(model.batch_codes || []).length})</span>
                      </div>
                      {(model.batch_codes || []).length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {model.batch_codes.map((b, i) => (
                            <span key={i} className="px-1.5 py-0.5 rounded font-mono text-[10px] bg-surface border border-border text-emerald-400">
                              {b}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <div className="text-[11px] text-amber-400 italic">No batches in stock. Needs assembly.</div>
                      )}
                    </div>

                    {/* BOM Components Preview */}
                    <div>
                      <div className="text-[11px] font-bold text-text-secondary mb-1.5">
                        BOM Recipe ({model.bom_components.length} Components):
                      </div>
                      <div className="space-y-1 max-h-36 overflow-y-auto scrollbar-thin text-[11px] divide-y divide-border/50">
                        {model.bom_components.map((c, i) => (
                          <div key={i} className="flex items-center justify-between py-1 text-text-muted">
                            <span className="truncate pr-2">{c.name}</span>
                            <span className="font-mono font-bold text-text-primary whitespace-nowrap">
                              {c.qty} {c.unit}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setSelectedStockModelId(model.id);
                      setStockAssembleQty(1);
                      setStockAssemblyRack(model.storage_location);
                      setStockAssemblyModalOpen(true);
                    }}
                    className="w-full py-2.5 px-3 rounded-xl text-xs font-black uppercase tracking-wider bg-surface-hover hover:bg-emerald-600 hover:text-white border border-border hover:border-emerald-500 text-text-primary flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    <FaPlus className="text-xs" />
                    <span>Assemble This Model for WH</span>
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Raw Inward Inventory Availability for Assembly */}
          <div className="card p-5 rounded-2xl border border-border bg-surface space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FaBoxes className="text-primary text-sm" />
                <h3 className="text-sm font-black text-text-primary uppercase tracking-wider">
                  Raw Inward Materials in Warehouse (Available for Assembly)
                </h3>
              </div>
              <span className="text-xs text-text-muted">Bulk inventory inwarded at warehouse dock</span>
            </div>

            <div className="border border-border rounded-xl overflow-hidden bg-surface">
              <table className="w-full text-left text-xs">
                <thead className="bg-surface-hover/80 border-b border-border text-[10px] font-black uppercase text-text-muted">
                  <tr>
                    <th className="p-3">Component / SKU</th>
                    <th className="p-3">Category</th>
                    <th className="p-3">Storage Rack</th>
                    <th className="p-3 text-center">Available Bulk Qty</th>
                    <th className="p-3 text-right">Assembly Usability</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {[
                    { name: 'Aluminium Mounting Rails (4.2m)', sku: 'BOS-RAIL-4.2M-AL', category: 'Structures', rack: 'Bay 1 / Rack A-01', qty: 120, unit: 'Pcs', status: 'Sufficient' },
                    { name: 'SS304 Mid Clamps (35mm)', sku: 'BOS-CLAMP-MID-35MM', category: 'Fasteners', rack: 'Bay 1 / Bin 12', qty: 250, unit: 'Pcs', status: 'Sufficient' },
                    { name: 'SS304 End Clamps (35mm)', sku: 'BOS-CLAMP-END-35MM', category: 'Fasteners', rack: 'Bay 1 / Bin 14', qty: 90, unit: 'Pcs', status: 'Sufficient' },
                    { name: '4 sq mm Solar DC Cable (100m Roll)', sku: 'BOS-DC-CABLE-4SQMM-100M', category: 'Cables', rack: 'Bay 2 / Cable Rack', qty: 18, unit: 'Rolls', status: 'Sufficient' },
                    { name: '2-In 2-Out DCDB / AJB Box', sku: 'BOS-AJB-DCDB-4IN-4OUT', category: 'Switchgear', rack: 'Bay 2 / Shelves', qty: 14, unit: 'Boxes', status: 'Sufficient' },
                    { name: 'Copper Bonded Earth Rod (2m)', sku: 'BOS-EARTH-ROD-COPPER-2M', category: 'Earthing', rack: 'Yard / Pallet 4', qty: 32, unit: 'Pcs', status: 'Sufficient' },
                    { name: 'MC4 Connectors 1000V', sku: 'BOS-MC4-CONN-1000V', category: 'Connectors', rack: 'Bay 1 / Bin 05', qty: 160, unit: 'Pairs', status: 'Sufficient' }
                  ].map((raw, idx) => (
                    <tr key={idx} className="hover:bg-surface-hover/30">
                      <td className="p-3">
                        <div className="font-bold text-text-primary">{raw.name}</div>
                        <div className="text-[10px] font-mono text-primary">{raw.sku}</div>
                      </td>
                      <td className="p-3 text-text-secondary">{raw.category}</td>
                      <td className="p-3 font-mono text-text-muted">{raw.rack}</td>
                      <td className="p-3 text-center font-bold text-emerald-400 font-mono">
                        {raw.qty} {raw.unit}
                      </td>
                      <td className="p-3 text-right">
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          ✓ Ready for Assembly
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Production Assembly History Log */}
          <div className="card p-5 rounded-2xl border border-border bg-surface space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FaHistory className="text-primary text-sm" />
                <h3 className="text-sm font-black text-text-primary uppercase tracking-wider">
                  Warehouse Buffer Assembly Production History
                </h3>
              </div>
              <span className="text-xs text-text-muted font-mono">{stockAssemblyHistory.length} Total Runs</span>
            </div>

            <div className="border border-border rounded-xl overflow-hidden bg-surface">
              <table className="w-full text-left text-xs">
                <thead className="bg-surface-hover/80 border-b border-border text-[10px] font-black uppercase text-text-muted">
                  <tr>
                    <th className="p-3">Date & Time</th>
                    <th className="p-3">Model Assembled</th>
                    <th className="p-3">Batch Codes Generated</th>
                    <th className="p-3 text-center">Quantity</th>
                    <th className="p-3">Assembled By</th>
                    <th className="p-3">Storage Location</th>
                    <th className="p-3 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {stockAssemblyHistory.map((hist) => (
                    <tr key={hist.id} className="hover:bg-surface-hover/30">
                      <td className="p-3 font-mono text-[11px] text-text-muted">
                        {new Date(hist.timestamp).toLocaleString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </td>
                      <td className="p-3 font-bold text-text-primary">{hist.model_name}</td>
                      <td className="p-3 font-mono text-[10px] text-primary">{hist.batch_code}</td>
                      <td className="p-3 text-center font-bold text-emerald-400">+{hist.qty} Units</td>
                      <td className="p-3 text-text-secondary">{hist.assembled_by}</td>
                      <td className="p-3 text-text-secondary font-mono text-[11px]">{hist.storage_location}</td>
                      <td className="p-3 text-right">
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          ✓ In WH Stock
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        /* ─────────────────────────────────────────────────────────────
            PART 1: ORDER-SPECIFIC KIT ASSEMBLY & STOCK ALLOCATION
            (Boss Requirement: Check warehouse ready stock first;
             allocate ready stock if available, else assemble on-demand)
           ───────────────────────────────────────────────────────────── */
        <div className="space-y-6">
          {/* BOS Kit Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="card p-4 rounded-2xl border border-border bg-surface shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-text-secondary uppercase tracking-wider">Total Orders</span>
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
                            className="p-2 rounded-xl bg-surface-hover hover:bg-surface border border-border text-text-secondary hover:text-text-primary text-xs cursor-pointer"
                            title="View Full Order Dossier"
                          >
                            <HiOutlineEye />
                          </button>
                        </div>
                      </div>

                      {/* ── Ready Warehouse Stock Allocation Banner (Boss Requirement) ── */}
                      {kitStatus === 'kit_ready' && assemblyDetails.fulfilled_from_stock ? (
                        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="flex items-center gap-2">
                            <FaCheck className="text-sm shrink-0 text-emerald-400" />
                            <span>
                              <strong>Fulfilled from Warehouse Ready Stock:</strong> Model <strong>{assemblyDetails.preassembled_model_name || 'Standard BOS Kit'}</strong> (Batch: <code className="font-mono bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-500/30">{assemblyDetails.allocated_from_batch_code || 'WH-BOS-STOCK'}</code>). Manual assembly bypassed — Ready for dispatch!
                            </span>
                          </div>
                          <span className="px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shrink-0">
                            ⚡ Instant Buffer Match
                          </span>
                        </div>
                      ) : kitStatus !== 'kit_ready' ? (
                        <div className="p-3.5 rounded-xl bg-gradient-to-r from-purple-900/30 via-surface to-indigo-900/25 border border-purple-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-black uppercase tracking-wider text-purple-300 flex items-center gap-1.5">
                                <FaCube className="text-purple-400" />
                                Warehouse Buffer Stock:
                              </span>
                              {totalPreassembledKitsInStock > 0 ? (
                                <span className="px-2 py-0.5 rounded-md text-[11px] font-mono font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                                  {totalPreassembledKitsInStock} Kits Ready in WH
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded-md text-[11px] font-mono font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                                  0 Kits in WH Stock (Shortage)
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-text-secondary">
                              {totalPreassembledKitsInStock > 0
                                ? 'Is order ko fast-track karne ke liye warehouse ready stock se 1-click me BOS Kit bind karein.'
                                : 'Warehouse buffer me pre-assembled kit nahi hai. Niche 5-step assembly line se inwarded material assemble karein.'}
                            </p>
                          </div>

                          {totalPreassembledKitsInStock > 0 ? (
                            <button
                              type="button"
                              onClick={() => handleOpenStockAllocationModal(ord)}
                              className="px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-md shadow-emerald-500/25 flex items-center gap-2 cursor-pointer transition-all active:scale-95 shrink-0"
                              title="1-Click allocate pre-assembled BOS kit from warehouse stock"
                            >
                              <FaCheck className="text-xs" />
                              <span>⚡ Allocate from Ready Stock</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setBoskitWorkstationMode('stock_inventory')}
                              className="px-3.5 py-1.5 rounded-xl text-[11px] font-bold bg-surface-hover hover:bg-surface border border-purple-500/40 text-purple-300 flex items-center gap-1.5 cursor-pointer shrink-0"
                              title="Go to Warehouse Buffer Assembly to build stock"
                            >
                              <FaPlus className="text-[10px]" />
                              <span>Pre-Assemble Kits for WH</span>
                            </button>
                          )}
                        </div>
                      ) : null}

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
                            onClick={() => {
                              if (standaloneBoskit || location.pathname.includes('bos-kit-assembly')) {
                                navigate(`${prefix}/new-orders`);
                              } else {
                                setMainSectionTab('orders');
                              }
                            }}
                            className="px-3.5 py-2 rounded-xl text-xs font-bold bg-surface-hover hover:bg-surface border border-border text-text-secondary hover:text-text-primary cursor-pointer flex items-center gap-1.5"
                          >
                            <FaArrowLeft className="text-[10px]" />
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
            <div className="p-4 bg-slate-100 rounded-2xl border-2 border-slate-300 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-xs">
              <div>
                <div className="font-black text-slate-900 text-sm flex items-center gap-2">
                  <span className="text-base text-primary font-black">{selectedOrderForInward.customer_name}</span>
                  {selectedOrderForInward.customer_phone && (
                    <span className="text-xs font-bold text-slate-700 bg-white px-2.5 py-0.5 rounded-md border border-slate-300">
                      📞 {selectedOrderForInward.customer_phone}
                    </span>
                  )}
                </div>
                <div className="text-slate-700 font-semibold mt-1 flex items-center gap-1.5">
                  <FaMapMarkerAlt className="text-rose-600 shrink-0 text-xs" />
                  <span>
                    Destination: <strong className="text-slate-900">{selectedOrderForInward.destination?.address}, {selectedOrderForInward.destination?.district}, {selectedOrderForInward.destination?.state} - {selectedOrderForInward.destination?.pincode}</strong>
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveInwardTab('inward')}
                  className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                    activeInwardTab === 'inward'
                      ? 'bg-primary text-white shadow-sm ring-2 ring-primary/30'
                      : 'bg-white text-slate-700 hover:text-slate-900 border-2 border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  📦 Record Inward
                </button>
                <button
                  onClick={() => setActiveInwardTab('history')}
                  className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                    activeInwardTab === 'history'
                      ? 'bg-primary text-white shadow-sm ring-2 ring-primary/30'
                      : 'bg-white text-slate-700 hover:text-slate-900 border-2 border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  📋 Inward History ({(selectedOrderForInward.inward_history || []).length})
                </button>
              </div>
            </div>

            {activeInwardTab === 'inward' ? (
              <form onSubmit={handleSubmitInward} className="space-y-4">
                {/* ── Boss Requirement 3A: Inward Destination Type (Warehouse Inward vs Direct Pickup From Site/Supplier) ── */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 rounded-2xl bg-slate-100 border-2 border-slate-300">
                  <div
                    onClick={() => setInwardType('warehouse')}
                    className={`p-3.5 rounded-xl border-2 cursor-pointer transition-all ${
                      inwardType === 'warehouse'
                        ? 'bg-blue-50/90 border-primary text-primary font-black shadow-sm ring-2 ring-primary/20'
                        : 'bg-white border-slate-300 text-slate-700 hover:border-slate-400 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <FaWarehouse className="text-base text-primary" />
                      <span className="text-xs font-black uppercase tracking-wider text-slate-900">🏢 Warehouse Dock Inward</span>
                    </div>
                    <div className="text-[11px] text-slate-700 font-semibold mt-1">
                      Material physically arrives at warehouse receiving bay for verification, palletizing & staging.
                    </div>
                  </div>

                  <div
                    onClick={() => setInwardType('pickup_location')}
                    className={`p-3.5 rounded-xl border-2 cursor-pointer transition-all ${
                      inwardType === 'pickup_location'
                        ? 'bg-teal-50 border-teal-600 text-teal-900 font-black shadow-sm ring-2 ring-teal-500/20'
                        : 'bg-white border-slate-300 text-slate-700 hover:border-slate-400 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <FaTruck className="text-base text-teal-600" />
                      <span className="text-xs font-black uppercase tracking-wider text-slate-900">📍 Direct Pickup from Supplier / Site</span>
                    </div>
                    <div className="text-[11px] text-slate-700 font-semibold mt-1">
                      Direct pickup from vendor or factory straight to customer site without storing in central hub.
                    </div>
                  </div>
                </div>

                {/* Pickup Location Details if Direct Pickup selected */}
                {inwardType === 'pickup_location' && (
                  <div className="p-4 rounded-xl bg-teal-50/80 border-2 border-teal-400 space-y-2.5">
                    <div className="text-xs font-black text-teal-950 flex items-center gap-1.5 uppercase tracking-wider">
                      <FaMapMarkerAlt className="text-teal-700" /> Direct Pickup Location & Supplier Point Details
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 text-xs">
                      <div>
                        <label className="text-[11px] text-slate-800 font-bold block mb-1">Location Name / Vendor</label>
                        <input
                          type="text"
                          placeholder="e.g. Waaree Plant / Havells Depot"
                          value={pickupLocationDetails.location_name}
                          onChange={(e) => setPickupLocationDetails(prev => ({ ...prev, location_name: e.target.value }))}
                          className="w-full p-2.5 text-xs font-semibold bg-white border-2 border-slate-300 rounded-lg text-slate-900 placeholder:text-slate-400 focus:border-teal-600 focus:ring-1 focus:ring-teal-200"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] text-slate-800 font-bold block mb-1">Address / Landmark</label>
                        <input
                          type="text"
                          placeholder="e.g. GIDC Industrial Area"
                          value={pickupLocationDetails.address}
                          onChange={(e) => setPickupLocationDetails(prev => ({ ...prev, address: e.target.value }))}
                          className="w-full p-2.5 text-xs font-semibold bg-white border-2 border-slate-300 rounded-lg text-slate-900 placeholder:text-slate-400 focus:border-teal-600 focus:ring-1 focus:ring-teal-200"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] text-slate-800 font-bold block mb-1">Contact Person</label>
                        <input
                          type="text"
                          placeholder="e.g. Rajesh Kumar"
                          value={pickupLocationDetails.contact_person}
                          onChange={(e) => setPickupLocationDetails(prev => ({ ...prev, contact_person: e.target.value }))}
                          className="w-full p-2.5 text-xs font-semibold bg-white border-2 border-slate-300 rounded-lg text-slate-900 placeholder:text-slate-400 focus:border-teal-600 focus:ring-1 focus:ring-teal-200"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] text-slate-800 font-bold block mb-1">Contact Phone</label>
                        <input
                          type="text"
                          placeholder="e.g. +91 98765 43210"
                          value={pickupLocationDetails.contact_phone}
                          onChange={(e) => setPickupLocationDetails(prev => ({ ...prev, contact_phone: e.target.value }))}
                          className="w-full p-2.5 text-xs font-semibold bg-white border-2 border-slate-300 rounded-lg text-slate-900 placeholder:text-slate-400 focus:border-teal-600 focus:ring-1 focus:ring-teal-200"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* ── Boss Requirement 3B: Inward Verification Mode (Manual Entry vs Barcode/QR Scanner Gun) ── */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b-2 border-slate-200 pb-2.5 pt-1">
                  <div className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-primary inline-block"></span>
                    <span>Inward Verification Method</span>
                  </div>
                  <div className="flex bg-slate-200/90 border-2 border-slate-300 p-1 rounded-xl gap-1.5 shadow-2xs">
                    <button
                      type="button"
                      onClick={() => setInwardExecutionMode('manual')}
                      className={`px-4 py-2 rounded-lg text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer ${
                        inwardExecutionMode === 'manual'
                          ? 'bg-primary text-white shadow-xs'
                          : 'text-slate-700 hover:text-slate-900 hover:bg-white/70'
                      }`}
                    >
                      <FaClipboardCheck className="text-xs" />
                      <span>Manual Checklist</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setInwardExecutionMode('scanner')}
                      className={`px-4 py-2 rounded-lg text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer ${
                        inwardExecutionMode === 'scanner'
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'text-slate-700 hover:text-slate-900 hover:bg-white/70'
                      }`}
                    >
                      <FaBarcode className="text-xs" />
                      <span>🔫 Online Barcode / QR Scanner Gun</span>
                    </button>
                  </div>
                </div>

                {/* ── Online Scanner Gun Input & Real-Time Outward Validation Matching ── */}
                {inwardExecutionMode === 'scanner' && (
                  <div className="p-4 rounded-xl bg-emerald-50/80 border-2 border-emerald-400 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="space-y-0.5">
                        <div className="text-xs font-black text-emerald-950 uppercase tracking-wider flex items-center gap-1.5">
                          <FaBarcode className="text-sm text-emerald-700" /> Live Barcode / QR Scanner Gun Feed
                        </div>
                        <div className="text-[11px] text-slate-700 font-semibold">
                          Aim your handheld scanner gun at the product QR/barcode or type & press Enter. Serials scanned here are validated during Outward dispatch.
                        </div>
                      </div>
                      <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-900 font-mono font-black text-xs border-2 border-emerald-400 shrink-0">
                        {scannedSerials.length} Serials Scanned
                      </span>
                    </div>

                    {/* Scanner Input Bar */}
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <FaBarcode className="absolute left-3.5 top-1/2 -translate-y-1/2 text-emerald-700 text-base" />
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
                          className="w-full pl-10 pr-4 py-2.5 text-xs font-mono font-black bg-white border-2 border-emerald-500 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-emerald-700 shadow-xs"
                        />
                      </div>
                      <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-100 border-2 border-emerald-400 text-emerald-900 font-black text-xs shrink-0">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 animate-pulse"></span>
                        <span>🔫 Scanner Active (Auto-Detect)</span>
                      </div>
                    </div>

                    {/* Scanned Serials Registry Table (Validates Outward Dispatch) */}
                    {scannedSerials.length > 0 && (
                      <div className="space-y-1.5">
                        <div className="text-[11px] font-black uppercase tracking-wider text-slate-800 flex justify-between">
                          <span>Scanned Serial Numbers & QR Tag Registry ({scannedSerials.length})</span>
                          <button
                            type="button"
                            onClick={() => setScannedSerials([])}
                            className="text-rose-700 hover:text-rose-900 font-bold hover:underline text-[11px] cursor-pointer"
                          >
                            Clear Scans
                          </button>
                        </div>
                        <div className="max-h-36 overflow-y-auto border-2 border-slate-300 rounded-xl bg-white divide-y divide-slate-200 text-xs">
                          {scannedSerials.map((sn, sIdx) => (
                            <div key={sIdx} className="p-2.5 flex items-center justify-between hover:bg-slate-50">
                              <div className="flex items-center gap-2">
                                <span className="font-mono font-black text-primary">{sn.serial_code}</span>
                                <span className="text-slate-800 font-bold text-[11px] truncate max-w-xs">{sn.product_name}</span>
                                <span className="text-[11px] text-slate-600 font-mono font-semibold">({sn.sku})</span>
                              </div>
                              <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-900 border border-emerald-400 flex items-center gap-1">
                                <FaCheckCircle className="text-[9px] text-emerald-700" /> Validated for Inward
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                  <span className="font-bold text-slate-800">Scan each item with barcode gun or enter quantities. Items automatically receive a green checkmark once scanned.</span>
                  <button
                    type="button"
                    onClick={() => {
                      const updated = { ...inwardInputs };
                      modalInwardItems.forEach(it => {
                        updated[it.sku] = {
                          ...(updated[it.sku] || {}),
                          qty: it.pending_qty,
                          damaged_qty: 0,
                          missing_qty: 0,
                          rack_location: updated[it.sku]?.rack_location || it.rack_location || (isBosKitItem(it) ? 'BAY-BOS-STOCK' : '')
                        };
                      });
                      setInwardInputs(updated);
                    }}
                    className="px-4 py-2 rounded-xl text-xs font-black bg-primary hover:bg-primary-hover text-white transition-all shadow-sm cursor-pointer shrink-0 self-start sm:self-auto active:scale-95 flex items-center gap-1.5"
                  >
                    <FaCheckDouble className="text-xs" />
                    <span>Fill All Pending</span>
                  </button>
                </div>

                {/* Items Input Table */}
                <div className="border-2 border-slate-300 rounded-2xl overflow-hidden bg-white max-h-[460px] overflow-y-auto shadow-xs">
                  <table className="w-full text-left text-xs">
                    <thead className="sticky top-0 bg-slate-200 border-b-2 border-slate-300 z-10 shadow-2xs">
                      <tr className="text-[12px] font-black uppercase tracking-wider text-slate-950">
                        <th className="p-3 text-slate-950 font-black">Product / SKU</th>
                        <th className="p-3 text-center w-20 text-slate-950 font-black">Ordered</th>
                        <th className="p-3 text-center w-24 text-slate-950 font-black">Inwarded</th>
                        <th className="p-3 text-center min-w-[110px] text-slate-950 font-black">Pending</th>
                        <th className="p-3 text-center w-28 text-slate-950 font-black">Inward (OK)</th>
                        <th className="p-3 text-center w-24 text-slate-950 font-black">Damaged</th>
                        <th className="p-3 text-center w-24 text-slate-950 font-black">Missing</th>
                        <th className="p-3 text-center w-40 text-slate-950 font-black">Rack / Location</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y-2 divide-slate-200">
                      {modalInwardItems.map((it) => {
                        const input = inwardInputs[it.sku] || { qty: 0, damaged_qty: 0, missing_qty: 0, rack_location: '' };
                        const isDone = (it.pending_qty || 0) === 0;
                        const itemScans = scannedSerials.filter(s => s.sku === it.sku);
                        const isFullyScanned = itemScans.length >= it.pending_qty && it.pending_qty > 0;
                        const isBos = isBosKitItem(it);

                        if (isBos) {
                          return (
                            <tr
                              key={it.sku}
                              className={`border-l-4 transition-all ${
                                isDone
                                  ? 'bg-purple-50/70 border-l-emerald-600'
                                  : 'bg-purple-50/90 border-l-purple-700 hover:bg-purple-100/80'
                              }`}
                            >
                              <td className="p-3">
                                <div className="flex flex-wrap items-center gap-2">
                                  <div className="font-black text-slate-950 text-sm flex items-center gap-1.5">
                                    <FaTools className="text-purple-700 text-sm shrink-0" />
                                    <span>{it.product_name}</span>
                                  </div>
                                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-purple-700 text-white shadow-xs shrink-0">
                                    ⚡ SolarKit BOS Package
                                  </span>
                                </div>
                                <div className="text-[11px] font-mono text-purple-950 font-black mt-0.5 flex flex-wrap items-center gap-2">
                                  <span>{it.sku}</span>
                                  <span className="text-slate-800 font-bold">• In-house Pre-assembled Enclosure (ACDB / DCDB / Cables)</span>
                                </div>

                                {/* Live Scanned QR & Serial Tags Display */}
                                {itemScans.length > 0 && (
                                  <div className="mt-1.5 space-y-1">
                                    <div className="flex flex-wrap items-center gap-1">
                                      {itemScans.map((sn, sIdx) => (
                                        <span
                                          key={sIdx}
                                          className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] font-mono font-black bg-emerald-100 text-emerald-900 border border-emerald-400"
                                          title={`Scanned at: ${new Date(sn.scanned_at).toLocaleTimeString()}`}
                                        >
                                          <FaCheckCircle className="text-[10px] text-emerald-700" /> {sn.serial_code}
                                        </span>
                                      ))}
                                    </div>
                                    {isFullyScanned && (
                                      <span className="inline-flex items-center gap-1 px-3 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-700 text-white shadow-xs">
                                        ✓ Inward Done (QR Scanned)
                                      </span>
                                    )}
                                  </div>
                                )}

                                {/* Action controls directly on the BOS Kit row */}
                                <div className="mt-2.5 pt-2 border-t-2 border-purple-200 flex flex-wrap items-center gap-2">
                                  {/* Button 1: Inward from Ready Buffer Stock if available */}
                                  {totalPreassembledKitsInStock > 0 && !isDone && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setInwardInputs(prev => ({
                                          ...prev,
                                          [it.sku]: {
                                            ...(prev[it.sku] || {}),
                                            qty: it.pending_qty,
                                            damaged_qty: 0,
                                            missing_qty: 0,
                                            rack_location: prev[it.sku]?.rack_location || 'BAY-BOS-STOCK'
                                          }
                                        }));
                                        dispatch(setAlert({
                                          message: `⚡ Allocated ${it.pending_qty} ready BOS Kit(s) from warehouse buffer stock! Inward quantity set.`,
                                          type: 'success'
                                        }));
                                      }}
                                      className="px-3.5 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5 shadow-sm cursor-pointer transition-all active:scale-95"
                                      title="Directly inward from warehouse buffer stock"
                                    >
                                      <FaCheck className="text-xs" />
                                      <span>⚡ Inward from Buffer Stock ({totalPreassembledKitsInStock} Ready in WH)</span>
                                    </button>
                                  )}

                                  {/* Button 2: Request / Build for this Order in BOS Kit Assembly Tab */}
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setInwardModalOpen(false);
                                      if (onNavigateToBosKit) {
                                        onNavigateToBosKit(selectedOrderForInward);
                                      } else {
                                        navigate(`${prefix}/bos-kit-assembly?orderId=${selectedOrderForInward._id || selectedOrderForInward.order_number}`);
                                        setMainSectionTab('boskit_station');
                                        setSelectedOrderForAssembly(selectedOrderForInward);
                                      }
                                      dispatch(setAlert({
                                        message: `Opening BOS Kit Assembly Workstation for ${selectedOrderForInward.delivery_order_id}. You can begin kit assembly or request missing components from Account Manager.`,
                                        type: 'info'
                                      }));
                                    }}
                                    className="px-3.5 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider bg-purple-700 hover:bg-purple-800 text-white border border-purple-800 flex items-center gap-1.5 shadow-sm cursor-pointer transition-all active:scale-95"
                                    title="Open BOS Kit Assembly tab to build this kit or send procurement request to Account Manager"
                                  >
                                    <FaTools className="text-xs" />
                                    <span>🔨 Request / Build in BOS Kit Assembly Tab →</span>
                                  </button>
                                </div>
                              </td>
                              <td className="p-3 text-center font-black text-slate-950 text-base">
                                {it.ordered_qty}
                              </td>
                              <td className="p-3 text-center font-black text-emerald-800 text-base">
                                {it.received_qty}
                              </td>
                              <td className="p-3 text-center whitespace-nowrap">
                                <span className={`inline-flex items-center justify-center min-w-[75px] px-3 py-1 rounded-full text-xs font-black whitespace-nowrap shadow-2xs ${
                                  isDone
                                    ? 'bg-emerald-100 text-emerald-950 border-2 border-emerald-500'
                                    : 'bg-amber-100 text-amber-950 border-2 border-amber-500'
                                }`}>
                                  {it.pending_qty} Pcs
                                </span>
                              </td>
                              <td className="p-3 text-center">
                                {isDone ? (
                                  <span className="text-xs font-black text-emerald-800 inline-flex items-center gap-1.5 bg-emerald-100 px-3 py-1.5 rounded-xl border-2 border-emerald-400">
                                    <FaCheck className="text-xs text-emerald-700" /> Inwarded
                                  </span>
                                ) : (
                                  <input
                                    type="number"
                                    min="0"
                                    max={it.pending_qty}
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
                                    className={`w-22 text-center py-2 px-2 rounded-xl text-xs font-black border-2 transition-all ${
                                      parseInt(input.qty) > it.pending_qty
                                        ? 'border-danger bg-danger/10 text-danger'
                                        : 'border-purple-500 bg-white text-slate-950 focus:border-purple-700 focus:ring-2 focus:ring-purple-200 shadow-xs'
                                    }`}
                                  />
                                )}
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
                                  className="w-20 text-center py-2 px-2 rounded-xl text-xs font-black border-2 border-rose-400 bg-rose-50 text-rose-950 focus:border-rose-600 shadow-xs disabled:opacity-40"
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
                                  className="w-20 text-center py-2 px-2 rounded-xl text-xs font-black border-2 border-amber-400 bg-amber-50 text-amber-950 focus:border-amber-600 shadow-xs disabled:opacity-40"
                                />
                              </td>
                              <td className="p-3 text-center">
                                <input
                                  type="text"
                                  placeholder="e.g. BAY-BOS-STOCK"
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
                                  className="w-36 py-2 px-2 text-center rounded-xl text-xs font-black border-2 border-purple-500 bg-white text-slate-950 focus:border-purple-700 placeholder:text-slate-400 shadow-xs"
                                />
                              </td>
                            </tr>
                          );
                        }

                        return (
                          <tr key={it.sku} className={isDone ? 'bg-slate-50' : 'bg-white hover:bg-slate-50/80 transition-colors'}>
                            <td className="p-3">
                              <div className="font-black text-slate-950 text-xs">{it.product_name}</div>
                              <div className="text-[11px] font-mono font-black text-blue-900 mt-0.5">{it.sku}</div>

                              {/* Live Scanned QR & Serial Tags Display */}
                              {itemScans.length > 0 && (
                                <div className="mt-1.5 space-y-1">
                                  <div className="flex flex-wrap items-center gap-1">
                                    {itemScans.map((sn, sIdx) => (
                                      <span
                                        key={sIdx}
                                        className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] font-mono font-black bg-emerald-100 text-emerald-900 border border-emerald-400"
                                        title={`Scanned at: ${new Date(sn.scanned_at).toLocaleTimeString()}`}
                                      >
                                        <FaCheckCircle className="text-[10px] text-emerald-700" /> {sn.serial_code}
                                      </span>
                                    ))}
                                  </div>
                                  {isFullyScanned && (
                                    <span className="inline-flex items-center gap-1 px-3 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-700 text-white shadow-xs">
                                      ✓ Inward Done (QR Scanned)
                                    </span>
                                  )}
                                </div>
                              )}
                            </td>
                            <td className="p-3 text-center font-black text-slate-950 text-base">
                              {it.ordered_qty}
                            </td>
                            <td className="p-3 text-center font-black text-emerald-800 text-base">
                              {it.received_qty}
                            </td>
                            <td className="p-3 text-center whitespace-nowrap">
                              <span className={`inline-flex items-center justify-center min-w-[75px] px-3 py-1 rounded-full text-xs font-black whitespace-nowrap shadow-2xs ${
                                isDone
                                  ? 'bg-emerald-100 text-emerald-950 border-2 border-emerald-500'
                                  : 'bg-amber-100 text-amber-950 border-2 border-amber-500'
                              }`}>
                                {it.pending_qty} Pcs
                              </span>
                            </td>
                            <td className="p-3 text-center">
                              {isDone ? (
                                <span className="text-xs font-black text-emerald-800 inline-flex items-center gap-1.5 bg-emerald-100 px-3 py-1.5 rounded-xl border-2 border-emerald-400">
                                  <FaCheck className="text-xs text-emerald-700" /> Inwarded
                                </span>
                              ) : (
                                <input
                                  type="number"
                                  min="0"
                                  max={it.pending_qty}
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
                                  className={`w-22 text-center py-2 px-2 rounded-xl text-xs font-black border-2 transition-all ${
                                    parseInt(input.qty) > it.pending_qty
                                      ? 'border-danger bg-danger/10 text-danger'
                                      : 'border-slate-400 bg-white text-slate-950 focus:border-primary focus:ring-2 focus:ring-primary/20 shadow-xs'
                                  }`}
                                />
                              )}
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
                                className="w-20 text-center py-2 px-2 rounded-xl text-xs font-black border-2 border-rose-400 bg-rose-50 text-rose-950 focus:border-rose-600 shadow-xs disabled:opacity-40"
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
                                className="w-20 text-center py-2 px-2 rounded-xl text-xs font-black border-2 border-amber-400 bg-amber-50 text-amber-950 focus:border-amber-600 shadow-xs disabled:opacity-40"
                              />
                            </td>
                            <td className="p-3 text-center">
                              <input
                                type="text"
                                placeholder="e.g. Rack-A1-02"
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
                                className="w-36 text-center py-2 px-2 rounded-xl text-xs font-black border-2 border-slate-400 bg-white text-slate-950 focus:border-primary placeholder:text-slate-400 shadow-xs"
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
                  <div className="p-3.5 rounded-xl bg-rose-100 border-2 border-rose-400 text-rose-950 text-xs font-bold flex items-center gap-2.5 shadow-xs">
                    <FaExclamationTriangle className="text-base text-rose-600 shrink-0" />
                    <span>
                      <strong className="font-black text-rose-950">Discrepancy Detected:</strong> Damaged items will be physically isolated in warehouse quarantine. Accounts will be automatically notified to initiate supplier debit notes / insurance claims.
                    </span>
                  </div>
                )}

                {/* Inward Remarks */}
                <div>
                  <label className="text-xs font-black text-slate-900 block mb-1.5">
                    Inward Verification Remarks & Notes
                  </label>
                  <textarea
                    rows={2}
                    value={inwardRemarks}
                    onChange={(e) => setInwardRemarks(e.target.value)}
                    placeholder="Enter dock inspection remarks, package seal condition, or supplier challan ref..."
                    className="w-full p-3 text-xs bg-white border-2 border-slate-400 rounded-xl text-slate-950 placeholder:text-slate-500 font-bold focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 shadow-xs"
                  />
                </div>

                {/* Modal Action Buttons */}
                <div className="flex justify-end items-center gap-3 pt-3.5 border-t-2 border-slate-200">
                  <button
                    type="button"
                    onClick={() => setInwardModalOpen(false)}
                    className="px-6 py-2.5 rounded-xl text-xs font-black bg-slate-200 hover:bg-slate-300 border-2 border-slate-400 text-slate-900 cursor-pointer transition-all shadow-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingInward}
                    className="bg-primary hover:bg-primary-hover text-white px-7 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-md hover:shadow-lg active:scale-95 disabled:opacity-50 cursor-pointer transition-all"
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
                  <div className="p-8 text-center text-slate-700 font-bold text-xs bg-slate-100 rounded-xl border-2 border-slate-300">
                    No past inward history recorded for this delivery order yet.
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[380px] overflow-y-auto">
                    {(selectedOrderForInward?.inward_history || []).map((batch, idx) => (
                      <div key={idx} className="p-4 bg-white border-2 border-slate-300 rounded-2xl space-y-2.5 shadow-xs">
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-mono font-black text-primary text-sm">{batch.batch_id}</span>
                          <span className="text-xs font-bold text-slate-600">{new Date(batch.timestamp).toLocaleString()}</span>
                        </div>
                        <div className="text-xs text-slate-800 font-medium">
                          Verified by: <strong className="text-slate-950 font-black">{batch.inwarded_by_name}</strong>
                        </div>
                        {batch.remarks && (
                          <div className="text-xs text-slate-900 font-semibold italic bg-slate-100 p-2.5 rounded-xl border border-slate-300">
                            "{batch.remarks}"
                          </div>
                        )}
                        <div className="text-[11px] font-black uppercase tracking-wider text-slate-900 pt-1">
                          Inwarded Items:
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          {(batch.inwarded_items || []).map((bIt, bIdx) => (
                            <div key={bIdx} className="p-2.5 rounded-xl bg-slate-100 border border-slate-300 flex justify-between items-center">
                              <span className="font-bold text-slate-950 truncate">{bIt.product_name}</span>
                              <span className="font-black text-emerald-800 ml-2 bg-emerald-100 px-2 py-0.5 rounded-md border border-emerald-400">+{bIt.qty} Pcs</span>
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
            <div className="p-4 bg-slate-100 rounded-2xl border-2 border-slate-300 text-xs space-y-2">
              <div className="font-black text-slate-950 text-sm">{selectedItemForReserve.product_name}</div>
              <div className="text-primary font-mono font-bold">{selectedItemForReserve.sku}</div>
              <div className="flex justify-between text-slate-700 font-semibold pt-2 border-t-2 border-slate-200">
                <span>Ordered: <strong className="text-slate-950">{selectedItemForReserve.ordered_qty}</strong></span>
                <span>Pending Inward: <strong className="text-amber-950">{selectedItemForReserve.pending_qty}</strong></span>
                <span className="text-emerald-800">Available Stock: <strong>{selectedItemForReserve.available_inventory_stock}</strong></span>
              </div>
            </div>

            <div>
              <label className="text-xs font-black text-slate-900 block mb-1.5">
                Allocate Stock Quantity to DO #{selectedOrderForReserve?.delivery_order_id}
              </label>
              <input
                type="number"
                min="0"
                max={selectedItemForReserve.available_inventory_stock}
                value={reserveQtyInput}
                onChange={(e) => setReserveQtyInput(e.target.value)}
                className="w-full p-3 text-sm font-black bg-white border-2 border-slate-400 rounded-xl text-slate-950 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 shadow-xs"
              />
              <span className="text-[11px] text-slate-600 font-semibold mt-1.5 block">
                Locking this quantity prevents double allocation by other orders.
              </span>
            </div>

            <div className="flex justify-end gap-2.5 pt-3.5 border-t-2 border-slate-200">
              <button
                type="button"
                onClick={() => setReserveModalOpen(false)}
                className="px-5 py-2.5 rounded-xl text-xs font-black bg-slate-200 hover:bg-slate-300 border-2 border-slate-400 text-slate-900 cursor-pointer transition-all"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={submittingReserve}
                onClick={handleSaveReservation}
                className="bg-primary hover:bg-primary-hover text-white px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider cursor-pointer shadow-md transition-all active:scale-95 disabled:opacity-50"
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
            <div className="p-4 bg-amber-50 border-2 border-amber-400 rounded-2xl text-xs space-y-2">
              <div className="font-black text-slate-950 text-sm">{selectedItemForProcure.product_name}</div>
              <div className="text-amber-950 font-mono font-bold">{selectedItemForProcure.sku}</div>
              <div className="flex justify-between text-slate-700 font-semibold pt-2 border-t-2 border-amber-300">
                <span>Order Qty: <strong className="text-slate-950">{selectedItemForProcure.ordered_qty}</strong></span>
                <span>Current Stock: <strong className="text-slate-950">{selectedItemForProcure.available_inventory_stock || 0}</strong></span>
                <span className="text-rose-700 font-black">
                  Deficit: {Math.max(0, (selectedItemForProcure.pending_qty || 0) - (selectedItemForProcure.available_inventory_stock || 0))} Pcs
                </span>
              </div>
            </div>

            <div className="text-xs text-slate-800 font-semibold leading-relaxed">
              Warehouse stock is insufficient for this BOS component. Submit an official purchase requisition directly to the <strong className="text-slate-950 font-black">Account Manager</strong> login so they can issue a Purchase Order to the supplier.
            </div>

            <div>
              <label className="text-xs font-black text-slate-900 block mb-1.5">
                Requisition Quantity to Procure
              </label>
              <input
                type="number"
                min="1"
                value={procureQtyInput}
                onChange={(e) => setProcureQtyInput(e.target.value)}
                className="w-full p-3 text-sm font-black bg-white border-2 border-slate-400 rounded-xl text-slate-950 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 shadow-xs"
                required
              />
            </div>

            <div>
              <label className="text-xs font-black text-slate-900 block mb-1.5">
                Notes for Account Manager & Procurement
              </label>
              <textarea
                rows={3}
                value={procureNotes}
                onChange={(e) => setProcureNotes(e.target.value)}
                placeholder="Mention priority, supplier preference, or required delivery timeline..."
                className="w-full p-3 text-xs font-semibold bg-white border-2 border-slate-400 rounded-xl text-slate-950 placeholder:text-slate-500 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 shadow-xs"
              />
            </div>

            <div className="flex justify-end gap-2.5 pt-3.5 border-t-2 border-slate-200">
              <button
                type="button"
                onClick={() => setProcureModalOpen(false)}
                className="px-5 py-2.5 rounded-xl text-xs font-black bg-slate-200 hover:bg-slate-300 border-2 border-slate-400 text-slate-900 cursor-pointer transition-all shadow-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submittingProcure}
                className="px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider bg-amber-600 text-white hover:bg-amber-700 transition-all cursor-pointer shadow-md flex items-center gap-1.5 active:scale-95 disabled:opacity-50"
              >
                {submittingProcure ? <FaSpinner className="animate-spin text-sm" /> : null}
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
                    {hasShortage ? `${unallocatedShortage} items awaiting inward` : 'All items verified'}
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
                  {ord.epcs && ord.epcs.length > 1 ? (
                    <div className="text-sm font-bold text-text-primary mt-1 flex items-center gap-2 flex-wrap">
                      <span className="px-2.5 py-0.5 rounded-md bg-purple-500/15 text-purple-400 font-black text-xs uppercase tracking-wider border border-purple-500/30">
                        Consolidated Multi-EPC Order ({ord.epcs.length} EPCs)
                      </span>
                      <span className="text-xs text-text-secondary font-medium">
                        {ord.epcs.map(e => e.epc_name).join(' • ')}
                      </span>
                    </div>
                  ) : (
                    <div className="text-sm font-bold text-text-primary mt-1 flex items-center gap-1.5 flex-wrap">
                      <span className="px-2 py-0.5 rounded-md bg-primary/10 text-primary text-[11px] font-black uppercase border border-primary/20">
                        EPC Contractor
                      </span>
                      <span>{ord.epcs?.[0]?.epc_name || ord.customer_name}</span>
                      {(ord.epcs?.[0]?.contact_phone || ord.customer_phone) && (
                        <span className="text-xs text-text-muted font-normal ml-1">({ord.epcs?.[0]?.contact_phone || ord.customer_phone})</span>
                      )}
                    </div>
                  )}
                  <div className="text-xs text-text-muted mt-0.5">
                    Ordered: {new Date(ord.order_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    <span className="ml-2 font-semibold text-text-secondary">• {totalReceivedItems}/{totalOrderedItems} Inwarded ({totalPendingItems} Pending)</span>
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

              {/* ── Multi-EPC Consignment Breakdown: Boss Requirement (Each EPC's SolarKit & Components with Exact Numbers) ── */}
              <div className="space-y-3">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-black text-text-primary uppercase tracking-wider flex items-center gap-1.5">
                    <FaLayerGroup className="text-purple-400" /> EPC Consignment Packages & Requested SolarKits
                  </span>
                  <span className="font-bold text-purple-400">
                    {(ord.epcs?.length || 1)} Active EPC Package(s)
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {(ord.epcs && ord.epcs.length > 0 ? ord.epcs : [
                    {
                      epc_id: ord.delivery_order_id,
                      epc_name: ord.customer_name,
                      site_location: `${ord.destination?.district || ''}, ${ord.destination?.state || ''}`,
                      solarkit_model: '5kW Standard Residential SolarKit (Complete Package)',
                      system_capacity: '5 kW',
                      panels_qty: '10 Panels (540W Mono PERC)',
                      inverter_qty: '1 Inverter (5kW Hybrid)',
                      boskit_qty: '1 BOS Kit (5kW Pre-assembled)',
                      structure_qty: '4 Rails (3.2m) + 16 Clamps',
                      payment_status: 'Payment Done'
                    }
                  ]).map((epc, eIdx) => {
                    const capacity = epc.system_capacity || (eIdx === 0 && (ord.epcs?.length || 1) > 1 ? '10 kW' : '5 kW');
                    const panelsText = epc.panels_qty || (capacity === '10 kW' ? '20 Panels (540W Mono PERC)' : '10 Panels (540W Mono PERC)');
                    const inverterText = epc.inverter_qty || (capacity === '10 kW' ? '1 Inverter (10kW 3-Phase On-Grid)' : '1 Inverter (5kW Hybrid / On-Grid)');
                    const boskitText = epc.boskit_qty || (capacity === '10 kW' ? '1 BOS Kit (10kW Pre-assembled Enclosure)' : '1 BOS Kit (5kW Pre-assembled Enclosure)');
                    const structureText = epc.structure_qty || (capacity === '10 kW' ? '4 Rails (4.2m) + 24 Clamps' : '4 Rails (3.2m) + 16 Clamps');
                    const kitModel = epc.solarkit_model || `${capacity} SolarKit Complete System Package`;

                    return (
                      <div key={epc.epc_id || eIdx} className="p-3.5 bg-surface border border-purple-500/25 rounded-2xl space-y-3 text-xs shadow-xs hover:border-purple-500/40 transition-all">
                        {/* EPC Header Row */}
                        <div className="flex justify-between items-center border-b border-border/70 pb-2">
                          <div className="flex items-center gap-2">
                            <span className="w-6 h-6 rounded-lg bg-purple-500/15 text-purple-400 flex items-center justify-center font-bold text-xs">
                              #{eIdx + 1}
                            </span>
                            <div>
                              <div className="font-black text-text-primary text-[13px]">{epc.epc_name || `EPC #${eIdx+1}`}</div>
                              {epc.site_location && (
                                <div className="text-[10px] text-text-muted">{epc.site_location}</div>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5">
                            {epc.share_percentage && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-purple-500/10 text-purple-400 border border-purple-500/20">
                                {epc.share_percentage}% Share
                              </span>
                            )}
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                              <FaCheckCircle className="text-[9px]" /> {epc.payment_status || 'Payment Done'}
                            </span>
                          </div>
                        </div>

                        {/* SolarKit Package Banner */}
                        <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-between gap-2">
                          <div>
                            <span className="text-[10px] font-black uppercase tracking-wider text-purple-400 block">Requested SolarKit:</span>
                            <span className="font-bold text-text-primary text-xs">{kitModel}</span>
                          </div>
                          <span className="px-2.5 py-1 rounded-lg bg-purple-500/20 text-purple-300 font-mono font-black text-xs shrink-0">
                            ⚡ {capacity}
                          </span>
                        </div>

                        {/* Concrete Numbers Grid (Exact Quantities & Specs) */}
                        <div className="grid grid-cols-2 gap-2 text-[11px]">
                          {/* Solar Panels */}
                          <div className="p-2 rounded-xl bg-surface-hover/70 border border-border flex items-start gap-2">
                            <div className="text-amber-400 text-sm mt-0.5 shrink-0">☀️</div>
                            <div>
                              <div className="text-[10px] font-black uppercase text-text-muted">Solar Panels</div>
                              <div className="font-bold text-text-primary">{panelsText}</div>
                            </div>
                          </div>

                          {/* Solar Inverter */}
                          <div className="p-2 rounded-xl bg-surface-hover/70 border border-border flex items-start gap-2">
                            <div className="text-primary text-sm mt-0.5 shrink-0">⚡</div>
                            <div>
                              <div className="text-[10px] font-black uppercase text-text-muted">Solar Inverter</div>
                              <div className="font-bold text-text-primary">{inverterText}</div>
                            </div>
                          </div>

                          {/* BOS Kit */}
                          <div className="p-2 rounded-xl bg-surface-hover/70 border border-border flex items-start gap-2">
                            <div className="text-purple-400 text-sm mt-0.5 shrink-0">🧰</div>
                            <div>
                              <div className="text-[10px] font-black uppercase text-text-muted">BOS Kit (Enclosure)</div>
                              <div className="font-bold text-text-primary">{boskitText}</div>
                            </div>
                          </div>

                          {/* Mounting Structure */}
                          <div className="p-2 rounded-xl bg-surface-hover/70 border border-border flex items-start gap-2">
                            <div className="text-emerald-400 text-sm mt-0.5 shrink-0">🏗️</div>
                            <div>
                              <div className="text-[10px] font-black uppercase text-text-muted">Mounting Structure</div>
                              <div className="font-bold text-text-primary">{structureText}</div>
                            </div>
                          </div>
                        </div>

                        {/* Itemized Breakdown List with Exact Quantities */}
                        {epc.items && epc.items.length > 0 && (
                          <div className="pt-2 border-t border-border/60">
                            <div className="text-[10px] font-black uppercase text-text-muted mb-1.5 flex items-center justify-between">
                              <span>Itemized Components & Quantities:</span>
                              <span className="font-mono text-purple-400">{epc.items.length} SKUs</span>
                            </div>
                            <div className="space-y-1">
                              {epc.items.map((it, itIdx) => (
                                <div key={it.sku || itIdx} className="flex justify-between items-center text-[11px] px-2.5 py-1 rounded-lg bg-surface border border-border/60">
                                  <div className="flex items-center gap-1.5 truncate pr-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-purple-400 shrink-0"></span>
                                    <span className="text-text-primary font-medium truncate">{it.product_name || it.name}</span>
                                    {it.sku && <span className="text-[9px] font-mono text-text-muted shrink-0">({it.sku})</span>}
                                  </div>
                                  <span className="font-mono font-bold text-primary shrink-0 bg-primary/10 px-1.5 py-0.2 rounded border border-primary/20">
                                    {it.ordered_qty || it.qty} {typeof (it.ordered_qty || it.qty) === 'number' ? 'Nos' : ''}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

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

      {/* ── Modal 1: 1-Click Allocate Pre-Assembled Kit from Stock to Order (Part 1) ── */}
      <Dialog
        isOpen={stockAllocateModalOpen}
        onClose={() => {
          if (!submittingStockAllocation) {
            setStockAllocateModalOpen(false);
            setOrderForStockAllocation(null);
          }
        }}
        title="⚡ Allocate Pre-Assembled BOS Kit from Warehouse Stock"
        subtitle={`Instantly bind a warehouse buffer kit to Order #${orderForStockAllocation?.order_number || ''}`}
        size="lg"
      >
        {orderForStockAllocation && (
          <div className="space-y-4 p-1">
            {/* Order Target Context */}
            <div className="p-3.5 bg-surface-hover rounded-xl border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div>
                <div className="font-extrabold text-text-primary text-sm flex items-center gap-2">
                  <span className="font-mono text-primary">{orderForStockAllocation.delivery_order_id}</span>
                  <span className="text-text-muted">• Order #{orderForStockAllocation.order_number}</span>
                </div>
                <div className="text-text-secondary mt-0.5">
                  Customer: <strong>{orderForStockAllocation.customer_name}</strong> {orderForStockAllocation.customer_phone ? `(${orderForStockAllocation.customer_phone})` : ''}
                </div>
                <div className="text-[11px] text-text-muted mt-0.5">
                  Destination: {orderForStockAllocation.destination?.address}, {orderForStockAllocation.destination?.district}, {orderForStockAllocation.destination?.state}
                </div>
              </div>

              <div className="text-right">
                <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-purple-500/15 text-purple-400 border border-purple-500/30">
                  Kit Status: {orderForStockAllocation.kit_preparation_status || 'Pending'}
                </span>
              </div>
            </div>

            {/* Model Selection */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-text-primary uppercase tracking-wider block">
                Select Pre-Assembled BOS Kit Model from Stock:
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {preassembledStock.map((m) => {
                  const isAvailable = (m.ready_stock || 0) > 0;
                  const isSelected = selectedAllocateModelId === m.id;
                  return (
                    <div
                      key={m.id}
                      onClick={() => {
                        if (isAvailable) setSelectedAllocateModelId(m.id);
                      }}
                      className={`p-3 rounded-xl border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-purple-600/15 border-purple-500 text-purple-300 ring-1 ring-purple-500/50 shadow-sm'
                          : isAvailable
                          ? 'bg-surface hover:bg-surface-hover border-border text-text-secondary'
                          : 'bg-surface-hover/30 border-border text-text-muted opacity-50 cursor-not-allowed'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase">{m.category}</span>
                        <span className={`text-[11px] font-mono font-black ${isAvailable ? 'text-emerald-400' : 'text-danger'}`}>
                          {m.ready_stock} in WH
                        </span>
                      </div>
                      <div className="text-xs font-bold text-text-primary mt-1 line-clamp-1">{m.name}</div>
                      <div className="text-[10px] text-text-muted mt-1 font-mono">{m.storage_location}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Selected Model Details Preview */}
            {(() => {
              const selectedModel = preassembledStock.find(m => m.id === selectedAllocateModelId);
              if (!selectedModel) return null;
              const nextBatch = (selectedModel.batch_codes || [])[0] || 'WH-BOS-AUTO-01';

              return (
                <div className="p-3.5 rounded-xl bg-surface border border-emerald-500/30 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/70 pb-2">
                    <div>
                      <div className="text-xs font-black text-text-primary">{selectedModel.name}</div>
                      <div className="text-[11px] text-text-muted">Storage: {selectedModel.storage_location}</div>
                    </div>
                    <div className="text-left sm:text-right">
                      <div className="text-[10px] uppercase font-bold text-text-muted">Batch Code to Allocate:</div>
                      <div className="font-mono text-xs font-black text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-500/20">
                        {nextBatch}
                      </div>
                    </div>
                  </div>

                  {/* Components that will be automatically fulfilled */}
                  <div>
                    <div className="text-[11px] font-bold text-text-secondary mb-1">
                      Components Automatically Fulfilled from Kit:
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-32 overflow-y-auto scrollbar-thin text-[11px]">
                      {selectedModel.bom_components.map((c, i) => (
                        <div key={i} className="flex items-center justify-between p-1.5 rounded-lg bg-surface-hover/60 border border-border/60">
                          <span className="truncate pr-2 text-text-primary">{c.name}</span>
                          <span className="font-mono font-bold text-emerald-400 whitespace-nowrap">
                            ✓ {c.qty} {c.unit}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="p-2.5 rounded-lg bg-purple-500/10 border border-purple-500/25 text-[11px] text-purple-300">
                    💡 <strong>Fulfillment Notice:</strong> Allocating this kit will automatically fulfill component quantities, set Kit Status to <strong className="text-emerald-400">Kit Ready for Dispatch</strong>, and advance the order so it can be dispatched immediately.
                  </div>
                </div>
              );
            })()}

            {/* Modal Actions */}
            <div className="flex justify-between items-center pt-3 border-t border-border">
              <button
                type="button"
                onClick={() => {
                  setStockAllocateModalOpen(false);
                  setOrderForStockAllocation(null);
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-surface-hover border border-border text-text-secondary cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={submittingStockAllocation || (preassembledStock.find(m => m.id === selectedAllocateModelId)?.ready_stock || 0) <= 0}
                onClick={handleConfirmStockAllocation}
                className="px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-md shadow-emerald-500/25 flex items-center gap-2 cursor-pointer transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submittingStockAllocation ? (
                  <>
                    <FaSpinner className="animate-spin text-xs" />
                    <span>Allocating Kit...</span>
                  </>
                ) : (
                  <>
                    <FaCheck className="text-xs" />
                    <span>Confirm & Allocate to Order</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </Dialog>

      {/* ── Modal 2: Pre-Assemble BOS Kits into Warehouse Stock (Part 2) ── */}
      <Dialog
        isOpen={stockAssemblyModalOpen}
        onClose={() => {
          if (!submittingStockAssembly) {
            setStockAssemblyModalOpen(false);
          }
        }}
        title="🏭 Pre-Assemble BOS Kits into Warehouse Buffer Stock"
        subtitle="Build standard kits from inwarded bulk materials to keep in warehouse inventory"
        size="lg"
      >
        <form onSubmit={handleConfirmAssembleForStock} className="space-y-4 p-1">
          {/* Kit Model Selector */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-text-primary uppercase tracking-wider block">
              1. Select Kit Catalog Model to Assemble:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {preassembledStock.map((m) => {
                const isSelected = selectedStockModelId === m.id;
                return (
                  <div
                    key={m.id}
                    onClick={() => {
                      setSelectedStockModelId(m.id);
                      setStockAssemblyRack(m.storage_location);
                    }}
                    className={`p-3 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-600/15 border-emerald-500 text-emerald-300 ring-1 ring-emerald-500/50 shadow-sm'
                        : 'bg-surface hover:bg-surface-hover border-border text-text-secondary'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase">{m.category}</span>
                      <span className="text-[11px] font-mono font-bold text-emerald-400">
                        {m.ready_stock} current
                      </span>
                    </div>
                    <div className="text-xs font-bold text-text-primary mt-1 line-clamp-1">{m.name}</div>
                    <div className="text-[10px] text-text-muted mt-1 font-mono">{m.storage_location}</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Assembly Inputs: Quantity, Rack Location, Operator */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-bold text-text-primary uppercase tracking-wider block mb-1.5">
                Quantity to Assemble:
              </label>
              <input
                type="number"
                min="1"
                max="50"
                value={stockAssembleQty}
                onChange={(e) => setStockAssembleQty(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full p-2.5 text-xs font-bold font-mono bg-surface border border-border rounded-xl text-text-primary focus:border-primary"
                required
              />
            </div>

            <div>
              <label className="text-xs font-bold text-text-primary uppercase tracking-wider block mb-1.5">
                Storage Rack / Bay Location:
              </label>
              <input
                type="text"
                value={stockAssemblyRack}
                onChange={(e) => setStockAssemblyRack(e.target.value)}
                placeholder="e.g. Bay 2 / Pallet B-04"
                className="w-full p-2.5 text-xs font-medium bg-surface border border-border rounded-xl text-text-primary focus:border-primary"
                required
              />
            </div>

            <div>
              <label className="text-xs font-bold text-text-primary uppercase tracking-wider block mb-1.5">
                Technician / Assembly Lead:
              </label>
              <input
                type="text"
                value={stockAssemblyOperator}
                onChange={(e) => setStockAssemblyOperator(e.target.value)}
                placeholder="Technician name"
                className="w-full p-2.5 text-xs font-medium bg-surface border border-border rounded-xl text-text-primary focus:border-primary"
                required
              />
            </div>
          </div>

          {/* Dynamic BOM Requirements Preview */}
          {(() => {
            const selectedModel = preassembledStock.find(m => m.id === selectedStockModelId);
            if (!selectedModel) return null;
            const qty = parseInt(stockAssembleQty) || 1;

            return (
              <div className="p-3.5 rounded-xl bg-surface-hover/60 border border-border space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-black text-text-primary uppercase tracking-wider">
                    Raw Material Consumption for {qty} Kit(s):
                  </div>
                  <span className="text-[10px] text-text-muted">Will be consumed from bulk inward inventory</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-36 overflow-y-auto scrollbar-thin text-xs">
                  {selectedModel.bom_components.map((c, i) => (
                    <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-surface border border-border/70">
                      <span className="truncate pr-2 text-text-secondary">{c.name}</span>
                      <span className="font-mono font-bold text-primary whitespace-nowrap">
                        {c.qty * qty} {c.unit}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}

          {/* Modal Actions */}
          <div className="flex justify-between items-center pt-3 border-t border-border">
            <button
              type="button"
              onClick={() => setStockAssemblyModalOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-surface-hover border border-border text-text-secondary cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={submittingStockAssembly}
              className="px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-md shadow-emerald-500/25 flex items-center gap-2 cursor-pointer transition-all active:scale-95 disabled:opacity-50"
            >
              {submittingStockAssembly ? (
                <>
                  <FaSpinner className="animate-spin text-xs" />
                  <span>Recording Assembly...</span>
                </>
              ) : (
                <>
                  <FaPlus className="text-xs" />
                  <span>Assemble & Add {stockAssembleQty} Kit(s) to WH Stock</span>
                </>
              )}
            </button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}

