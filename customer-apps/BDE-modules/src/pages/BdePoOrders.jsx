import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import {
  ShoppingCart,
  Plus,
  CheckCircle2,
  Clock,
  AlertCircle,
  Loader2,
  Search,
  FileText,
  Layers,
  Users,
  Package,
  DollarSign,
  X,
  Check,
  Shield,
  Info,
  LayoutGrid,
  List,
  Eye,
  RotateCw,
  Target,
  Lock,
  Truck,
  Store,
  Zap,
  UserCheck,
} from 'lucide-react';
import api from '../services/api';
import { useBdeAuth } from '../context/BdeAuthContext';

// ── STATUS CONFIGURATION (Exact match to Franchise PO Portal) ──
const STATUS_CONFIG = {
  DRAFT: { label: 'Draft', bg: 'bg-slate-100 text-slate-700 border-slate-200', icon: FileText },
  PENDING_ALLOCATION: { label: 'Pending Allocation', bg: 'bg-amber-50 text-amber-700 border-amber-300', icon: Package },
  AWAITING_TOKEN_PAYMENT: { label: 'Awaiting Token Payment', bg: 'bg-orange-50 text-orange-700 border-orange-300', icon: DollarSign },
  PO_STARTED: { label: 'PO Started', bg: 'bg-blue-50 text-blue-700 border-blue-300', icon: Zap },
  VALIDATING: { label: 'Validating...', bg: 'bg-cyan-50 text-cyan-700 border-cyan-300', icon: RotateCw },
  VALIDATED: { label: 'Validated ✓', bg: 'bg-emerald-50 text-emerald-700 border-emerald-300', icon: CheckCircle2 },
  SUBMITTED: { label: 'Submitted', bg: 'bg-blue-50 text-blue-700 border-blue-300', icon: Clock },
  PENDING_APPROVAL: { label: 'Pending Approval', bg: 'bg-amber-50 text-amber-700 border-amber-300', icon: Clock },
  CHANGES_REQUESTED: { label: 'Changes Requested', bg: 'bg-orange-50 text-orange-700 border-orange-300', icon: AlertCircle },
  APPROVED: { label: 'Approved', bg: 'bg-emerald-50 text-emerald-700 border-emerald-300', icon: CheckCircle2 },
  REJECTED: { label: 'Rejected', bg: 'bg-rose-50 text-rose-700 border-rose-300', icon: X },
  AWAITING_PAYMENT: { label: 'Awaiting Payment', bg: 'bg-indigo-50 text-indigo-700 border-indigo-300', icon: DollarSign },
  PARTIALLY_PAID: { label: 'Partially Paid', bg: 'bg-teal-50 text-teal-700 border-teal-300', icon: DollarSign },
  PAID: { label: 'Paid', bg: 'bg-emerald-50 text-emerald-700 border-emerald-300', icon: CheckCircle2 },
  CONFIRMED: { label: 'Confirmed', bg: 'bg-emerald-50 text-emerald-700 border-emerald-300', icon: CheckCircle2 },
  PROCESSING: { label: 'Processing', bg: 'bg-cyan-50 text-cyan-700 border-cyan-300', icon: RotateCw },
  DISPATCHED: { label: 'Dispatched', bg: 'bg-purple-50 text-purple-700 border-purple-300', icon: Truck },
  DELIVERED: { label: 'Delivered', bg: 'bg-emerald-50 text-emerald-700 border-emerald-300', icon: CheckCircle2 },
  COMPLETED: { label: 'Completed', bg: 'bg-emerald-50 text-emerald-700 border-emerald-300', icon: CheckCircle2 },
  EXPIRED: { label: 'Expired', bg: 'bg-rose-50 text-rose-700 border-rose-300', icon: Clock },
  REFUND_REQUESTED: { label: 'Refund Requested', bg: 'bg-amber-50 text-amber-700 border-amber-300', icon: Clock },
  REFUND_APPROVED: { label: 'Refund Approved', bg: 'bg-blue-50 text-blue-700 border-blue-300', icon: CheckCircle2 },
  REFUND_SETTLED: { label: 'Refund Settled', bg: 'bg-emerald-50 text-emerald-700 border-emerald-300', icon: DollarSign },
  REFUND_REJECTED: { label: 'Refund Rejected', bg: 'bg-rose-50 text-rose-700 border-rose-300', icon: X },
  CANCELLED: { label: 'Cancelled', bg: 'bg-rose-50 text-rose-700 border-rose-300', icon: X },
};

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.SUBMITTED;
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border ${cfg.bg}`}>
      <Icon className="w-3.5 h-3.5" />
      <span>{cfg.label}</span>
    </span>
  );
}

// ── ESCROW BANK DETAILS ──
const ESCROW_BANK = {
  account_name: 'SolarKits Technologies Pvt Ltd (Escrow Account)',
  bank_name: 'ICICI Bank Corporate Banking',
  account_number: '000205018899',
  ifsc_code: 'ICIC0000002',
  branch: 'Bandra Kurla Complex, Mumbai',
  upi_id: 'solarkits.token@icici',
};

// ── DEFAULT COMBO KITS (Fallback Catalog) ──
const DEFAULT_COMBO_KITS = [
  {
    _id: 'kit-01',
    name: '3kW Residential On-Grid Solar ComboKit',
    capacity_kw: 3,
    system_type: 'On-Grid',
    base_price_paise: 16500000, // ₹1,65,000
    token_rate_per_kit_paise: 500000, // ₹5,000 / kit
    min_po_quantity: 25,
    specifications: '3kW Tier-1 TopCon DCR Panels + 3.3kW Grid Inverter + BOS Structure',
  },
  {
    _id: 'kit-02',
    name: '5kW Commercial Dual-MPPT Solar ComboKit',
    capacity_kw: 5,
    system_type: 'On-Grid',
    base_price_paise: 24500000, // ₹2,45,000
    token_rate_per_kit_paise: 500000, // ₹5,000 / kit
    min_po_quantity: 25,
    specifications: '5kW Mono Perc Panels + 5kW Three-Phase Inverter + Heavy Galvanized BOS',
  },
  {
    _id: 'kit-03',
    name: '10kW Industrial Mega Solar ComboKit',
    capacity_kw: 10,
    system_type: 'On-Grid',
    base_price_paise: 48000000, // ₹4,80,000
    token_rate_per_kit_paise: 1000000, // ₹10,000 / kit
    min_po_quantity: 10,
    specifications: '10kW High-Efficiency Bifacial Array + 10kW Smart Inverter + Lightning Protection',
  },
];

// ── INITIAL PRE-SEEDED ORDERS (Realistic 4-Stage Lifecycle) ──
const SEED_STORAGE_KEY = 'solarkits_bde_po_orders_v1';

const INITIAL_SEED_ORDERS = [
  {
    _id: 'bde-po-101',
    po_number: 'PO-2026-BDE-001',
    order_type: 'po_order',
    po_category: 'SINGLE_PO',
    status: 'VALIDATED',
    created_by_role: 'BDE',
    creator_name: 'Navaz Khan',
    creator_code: 'BDE-WEST-04',
    created_at: new Date(Date.now() - 6 * 24 * 3600 * 1000).toISOString(),
    lock_expires_at: new Date(Date.now() + 24 * 24 * 3600 * 1000).toISOString(),
    customer_details: {
      franchisee_id: 'FR-GJ-SUR-01',
      company_name: 'Surat Solar Superstore & Service Hub',
      district: 'Surat',
      state: 'Gujarat',
      phone: '+91 98250 11223',
    },
    target_committed_quantity: 100,
    total_booked_quantity: 100,
    fulfilled_quantity: 35,
    remaining_quantity: 65,
    token_amount_paise: 50000000, // ₹5,00,000 (100 * ₹5,000)
    token_paid_paise: 50000000,
    token_payment_status: 'PAID',
    token_balance_paise: 32500000,
    token_adjusted_total_paise: 17500000,
    token_settlement_mode: 'PRO_RATA',
    utr_number: 'ICICI-UTR-99882211',
    sender_bank_name: 'HDFC Bank',
    payment_date: '2026-10-04',
    items: [
      {
        kit_id: 'kit-01',
        item_name: '3kW Residential On-Grid Solar ComboKit',
        quantity: 100,
        unit_price_paise: 16500000,
        token_rate_paise: 500000,
        subtotal_paise: 1650000000,
        epc_allocations: [
          {
            epc_buyer_id: 'epc-01',
            company_name: 'Apex Solar Solutions Gujarat',
            buyer_name: 'Ramesh Patel',
            allocated_quantity: 100,
            payment_status: 'PAID',
          },
        ],
      },
    ],
    po_settings_snapshot: { po_validity_days: 30, po_lock_days: 30 },
  },
  {
    _id: 'bde-po-102',
    po_number: 'PO-2026-BDE-002',
    order_type: 'po_order',
    po_category: 'COMBINE_PO',
    status: 'AWAITING_TOKEN_PAYMENT',
    created_by_role: 'BDE',
    creator_name: 'Navaz Khan',
    creator_code: 'BDE-WEST-04',
    created_at: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(),
    lock_expires_at: new Date(Date.now() + 28 * 24 * 3600 * 1000).toISOString(),
    customer_details: {
      franchisee_id: 'FR-GJ-AHM-02',
      company_name: 'Ahmedabad Renewable Power Store',
      district: 'Ahmedabad',
      state: 'Gujarat',
      phone: '+91 97120 44556',
    },
    target_committed_quantity: 150,
    total_booked_quantity: 150,
    fulfilled_quantity: 0,
    remaining_quantity: 150,
    token_amount_paise: 75000000, // ₹7,50,000
    token_paid_paise: 0,
    token_payment_status: 'PENDING',
    token_balance_paise: 0,
    token_adjusted_total_paise: 0,
    token_settlement_mode: 'PRO_RATA',
    items: [
      {
        kit_id: 'kit-02',
        item_name: '5kW Commercial Dual-MPPT Solar ComboKit',
        quantity: 150,
        unit_price_paise: 24500000,
        token_rate_paise: 500000,
        subtotal_paise: 3675000000,
        epc_allocations: [
          {
            epc_buyer_id: 'epc-02',
            company_name: 'SunPower EPC Infra',
            buyer_name: 'Vikram Joshi',
            allocated_quantity: 90,
            payment_status: 'PENDING',
          },
          {
            epc_buyer_id: 'epc-03',
            company_name: 'GreenGrid EPC Contractors',
            buyer_name: 'Anil Desai',
            allocated_quantity: 60,
            payment_status: 'PENDING',
          },
        ],
      },
    ],
    po_settings_snapshot: { po_validity_days: 30, po_lock_days: 30 },
  },
  {
    _id: 'bde-po-103',
    po_number: 'PO-2026-BDE-003',
    order_type: 'po_order',
    po_category: 'SINGLE_PO',
    status: 'PENDING_ALLOCATION',
    created_by_role: 'BDE',
    creator_name: 'Navaz Khan',
    creator_code: 'BDE-WEST-04',
    created_at: new Date(Date.now() - 4 * 3600 * 1000).toISOString(),
    lock_expires_at: new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString(),
    customer_details: {
      franchisee_id: 'FR-GJ-VAD-03',
      company_name: 'Vadodara SunEnergy Store',
      district: 'Vadodara',
      state: 'Gujarat',
      phone: '+91 99090 77889',
    },
    target_committed_quantity: 50,
    total_booked_quantity: 50,
    fulfilled_quantity: 0,
    remaining_quantity: 50,
    token_amount_paise: 25000000,
    token_paid_paise: 0,
    token_payment_status: 'PENDING',
    token_balance_paise: 0,
    token_adjusted_total_paise: 0,
    token_settlement_mode: 'PRO_RATA',
    items: [],
    po_settings_snapshot: { po_validity_days: 30, po_lock_days: 30 },
  },
];

export default function BdePoOrders() {
  const location = useLocation();
  const { user } = useBdeAuth();

  // ── ORDERS STATE ──
  const [orders, setOrders] = useState(() => {
    try {
      const saved = localStorage.getItem(SEED_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.warn('Failed to parse saved POs:', e);
    }
    return INITIAL_SEED_ORDERS;
  });

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [viewMode, setViewMode] = useState('card'); // 'card' | 'table'
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [categoryTab, setCategoryTab] = useState('ALL'); // 'ALL' | 'SINGLE_PO' | 'COMBINE_PO'

  // Master Data (Franchisees, EPCs, Kits)
  const [franchisees, setFranchisees] = useState([]);
  const [epcList, setEpcList] = useState([]);
  const [comboKits, setComboKits] = useState(DEFAULT_COMBO_KITS);

  // Copy Feedback State
  const [copiedField, setCopiedField] = useState('');
  const handleCopy = (text, field) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(''), 2000);
  };

  // ── MODAL STATES ──
  // 1. Create Modal
  const [createModal, setCreateModal] = useState(false);
  const [selectedFranchiseeId, setSelectedFranchiseeId] = useState('');
  const [poCategory, setPoCategory] = useState('SINGLE_PO');
  const [singleTargetType, setSingleTargetType] = useState('single_epc'); // 'single_epc' | 'warehouse'
  const [selectedSingleEpcId, setSelectedSingleEpcId] = useState('');
  const [singlePoQty, setSinglePoQty] = useState(100);
  const [createSubmitting, setCreateSubmitting] = useState(false);
  const [createError, setCreateError] = useState('');

  // 2. Allocate Modal (Stage 2)
  const [allocateModal, setAllocateModal] = useState(false);
  const [allocatingOrder, setAllocatingOrder] = useState(null);
  const [allocateKitId, setAllocateKitId] = useState('');
  const [allocateSingleTarget, setAllocateSingleTarget] = useState('single_epc');
  const [allocateSingleEpcId, setAllocateSingleEpcId] = useState('');
  const [allocateMultiAllocs, setAllocateMultiAllocs] = useState({}); // { [epcId]: qty }
  const [allocateSubmitting, setAllocateSubmitting] = useState(false);
  const [allocateError, setAllocateError] = useState('');

  // 3. Token Payment Modal (Stage 3)
  const [tokenModal, setTokenModal] = useState(false);
  const [tokenOrder, setTokenOrder] = useState(null);
  const [tokenUtr, setTokenUtr] = useState('');
  const [tokenBank, setTokenBank] = useState('');
  const [tokenDate, setTokenDate] = useState(new Date().toISOString().slice(0, 10));
  const [tokenRemarks, setTokenRemarks] = useState('');
  const [tokenSubmitting, setTokenSubmitting] = useState(false);
  const [tokenError, setTokenError] = useState('');

  // 4. Detail Modal
  const [detailModal, setDetailModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  // 5. Reorder Modal (Stage 4 Drawdown)
  const [reorderModal, setReorderModal] = useState(false);
  const [reorderOrder, setReorderOrder] = useState(null);
  const [reorderQty, setReorderQty] = useState(1);
  const [reorderUtr, setReorderUtr] = useState('');
  const [reorderBank, setReorderBank] = useState('');
  const [reorderDate, setReorderDate] = useState(new Date().toISOString().slice(0, 10));
  const [reorderSubmitting, setReorderSubmitting] = useState(false);
  const [reorderError, setReorderError] = useState('');

  // 6. Refund Modal
  const [refundModal, setRefundModal] = useState(false);
  const [refundOrder, setRefundOrder] = useState(null);
  const [refundForm, setRefundForm] = useState({
    account_holder_name: '',
    bank_name: '',
    account_number: '',
    confirm_account_number: '',
    ifsc_code: '',
    notes: '',
  });
  const [refundSubmitting, setRefundSubmitting] = useState(false);
  const [refundError, setRefundError] = useState('');

  // Persist orders to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(SEED_STORAGE_KEY, JSON.stringify(orders));
    } catch (e) {
      console.warn('Storage save error:', e);
    }
  }, [orders]);

  // Load Real Master Data (Franchisees, EPCs, Kits)
  const fetchMasterData = useCallback(async () => {
    try {
      // 1. Franchisees
      const fRes = await api.get('/franchisees').catch(() => null);
      if (fRes?.data?.status === 'success') {
        const raw = fRes.data.data;
        const list = Array.isArray(raw)
          ? raw
          : Array.isArray(raw?.franchisees)
          ? raw.franchisees
          : [];
        if (list.length > 0) setFranchisees(list);
      }
      if (franchisees.length === 0) {
        // Fallback default franchisees in territory
        setFranchisees([
          {
            _id: 'FR-GJ-SUR-01',
            franchisee_id: 'FR-GJ-SUR-01',
            company_name: 'Surat Solar Superstore & Service Hub',
            name: 'Surat Solar Superstore',
            district: 'Surat',
            state: 'Gujarat',
            phone: '+91 98250 11223',
            plan_name: 'District Master Franchise',
          },
          {
            _id: 'FR-GJ-AHM-02',
            franchisee_id: 'FR-GJ-AHM-02',
            company_name: 'Ahmedabad Renewable Power Store',
            name: 'Ahmedabad Renewable Store',
            district: 'Ahmedabad',
            state: 'Gujarat',
            phone: '+91 97120 44556',
            plan_name: 'Standard Franchise',
          },
          {
            _id: 'FR-GJ-VAD-03',
            franchisee_id: 'FR-GJ-VAD-03',
            company_name: 'Vadodara SunEnergy Store',
            name: 'Vadodara SunEnergy Store',
            district: 'Vadodara',
            state: 'Gujarat',
            phone: '+91 99090 77889',
            plan_name: 'District Franchise',
          },
        ]);
      }

      // 2. EPC List
      const epcRes = await api.get('/quotes/eligible-epcs').catch(() => null);
      if (epcRes?.data?.status === 'success') {
        const raw = epcRes.data.data;
        const list = Array.isArray(raw) ? raw : Array.isArray(raw?.epcs) ? raw.epcs : [];
        if (list.length > 0) setEpcList(list);
      }
      if (epcList.length === 0) {
        setEpcList([
          {
            _id: 'epc-01',
            company_name: 'Apex Solar Solutions Gujarat',
            buyer_name: 'Ramesh Patel',
            phone: '+91 98790 12345',
            gstin: '24AAAAA0000A1Z5',
            district: 'Surat',
          },
          {
            _id: 'epc-02',
            company_name: 'SunPower EPC Infra',
            buyer_name: 'Vikram Joshi',
            phone: '+91 94280 23456',
            gstin: '24BBBBB1111B2Z6',
            district: 'Ahmedabad',
          },
          {
            _id: 'epc-03',
            company_name: 'GreenGrid EPC Contractors',
            buyer_name: 'Anil Desai',
            phone: '+91 97250 34567',
            gstin: '24CCCCC2222C3Z7',
            district: 'Vadodara',
          },
          {
            _id: 'epc-04',
            company_name: 'Om Solar Power Engineering',
            buyer_name: 'Kunal Shah',
            phone: '+91 98980 45678',
            gstin: '24DDDDD3333D4Z8',
            district: 'Surat',
          },
        ]);
      }

      // 3. Kits
      const kitRes = await api.get('/quotes/eligible-kits').catch(() => null);
      if (kitRes?.data?.status === 'success') {
        const raw = kitRes.data.data;
        const list = Array.isArray(raw) ? raw : Array.isArray(raw?.kits) ? raw.kits : [];
        if (list.length > 0) {
          const formatted = list.map((k) => ({
            _id: k._id || k.id,
            name: k.name || k.kit_name || 'Solar ComboKit',
            capacity_kw: k.capacity_kw || 3,
            system_type: k.system_type || 'On-Grid',
            base_price_paise: k.price_paise || k.base_price_paise || 16500000,
            token_rate_per_kit_paise: 500000,
            min_po_quantity: k.min_po_quantity || 25,
            specifications: k.description || 'Tier-1 Approved Components',
          }));
          setComboKits(formatted);
        }
      }
    } catch (err) {
      console.warn('Master data load note:', err);
    }
  }, [franchisees.length, epcList.length]);

  useEffect(() => {
    fetchMasterData();
  }, [fetchMasterData]);

  // Handle URL query parameters (e.g. from Franchisees page ?action=create&franchisee_id=...)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('action') === 'create') {
      const fId = params.get('franchisee_id');
      if (fId) setSelectedFranchiseeId(fId);
      setCreateModal(true);
    }
  }, [location.search]);

  // ── REFRESH HANDLER ──
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchMasterData();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  // ── RESET TO SAMPLE DATA ──
  const handleResetData = () => {
    if (window.confirm('Reset all PO orders back to default sample state?')) {
      setOrders(INITIAL_SEED_ORDERS);
      localStorage.setItem(SEED_STORAGE_KEY, JSON.stringify(INITIAL_SEED_ORDERS));
    }
  };

  // ── FILTERED ORDERS ──
  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      // Category Tab filter
      if (categoryTab !== 'ALL' && o.po_category !== categoryTab) return false;

      // Status filter
      if (statusFilter !== 'ALL' && o.status !== statusFilter) return false;

      // Search query
      if (search.trim()) {
        const q = search.toLowerCase();
        const poNum = (o.po_number || '').toLowerCase();
        const fName = (o.customer_details?.company_name || o.customer_details?.name || '').toLowerCase();
        const kitName = (o.items?.[0]?.item_name || '').toLowerCase();
        const epcName = (o.items?.[0]?.epc_allocations?.[0]?.company_name || '').toLowerCase();
        if (!poNum.includes(q) && !fName.includes(q) && !kitName.includes(q) && !epcName.includes(q)) {
          return false;
        }
      }
      return true;
    });
  }, [orders, categoryTab, statusFilter, search]);

  // Territory KPI Summary Calculations
  const stats = useMemo(() => {
    const totalCount = orders.length;
    const validatedCount = orders.filter((o) =>
      ['VALIDATED', 'CONFIRMED', 'PROCESSING', 'DISPATCHED', 'COMPLETED'].includes(o.status)
    ).length;
    const pendingAllocCount = orders.filter((o) => o.status === 'PENDING_ALLOCATION').length;
    const awaitingTokenCount = orders.filter((o) => o.status === 'AWAITING_TOKEN_PAYMENT').length;

    const totalBooked = orders.reduce((sum, o) => sum + (o.total_booked_quantity || o.target_committed_quantity || 0), 0);
    const totalFulfilled = orders.reduce((sum, o) => sum + (o.fulfilled_quantity || 0), 0);
    const totalRemaining = orders.reduce((sum, o) => sum + (o.remaining_quantity || 0), 0);
    const totalTokenPaise = orders.reduce((sum, o) => sum + (o.token_paid_paise || 0), 0);

    return {
      totalCount,
      validatedCount,
      pendingAllocCount,
      awaitingTokenCount,
      totalBooked,
      totalFulfilled,
      totalRemaining,
      totalTokenINR: Math.round(totalTokenPaise / 100),
    };
  }, [orders]);

  // ─────────────────────────────────────────────────────────────────────────────
  // STAGE 1: CREATE PO ORDER
  // ─────────────────────────────────────────────────────────────────────────────
  const handleOpenCreateModal = () => {
    setCreateError('');
    if (!selectedFranchiseeId && franchisees.length > 0) {
      setSelectedFranchiseeId(franchisees[0]._id || franchisees[0].franchisee_id);
    }
    if (!selectedSingleEpcId && epcList.length > 0) {
      setSelectedSingleEpcId(epcList[0]._id);
    }
    setSinglePoQty(100);
    setPoCategory('SINGLE_PO');
    setSingleTargetType('single_epc');
    setCreateModal(true);
  };

  const handleCreateOrder = (e) => {
    e.preventDefault();
    if (!selectedFranchiseeId) {
      setCreateError('Please select a Franchisee.');
      return;
    }
    if (singlePoQty < 25) {
      setCreateError('Committed Quota must be at least 25 kits.');
      return;
    }

    setCreateSubmitting(true);
    setTimeout(() => {
      const selectedFranchiseObj = franchisees.find(
        (f) => (f._id || f.franchisee_id) === selectedFranchiseeId
      ) || {
        franchisee_id: selectedFranchiseeId,
        company_name: 'Selected Franchisee Store',
        district: 'Territory District',
        state: 'Territory State',
      };

      const newPoNumber = `PO-${new Date().getFullYear()}-BDE-${String(orders.length + 1).padStart(3, '0')}`;
      const tokenPerKitPaise = 500000; // ₹5,000 / kit
      const totalTokenPaise = singlePoQty * tokenPerKitPaise;

      const newOrder = {
        _id: `bde-po-${Date.now()}`,
        po_number: newPoNumber,
        order_type: 'po_order',
        po_category: poCategory,
        status: 'PENDING_ALLOCATION',
        created_by_role: 'BDE',
        creator_name: user?.full_name || 'BDE Officer',
        creator_code: user?.bde_id || 'BDE-OFFICER',
        created_at: new Date().toISOString(),
        lock_expires_at: new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString(),
        customer_details: {
          franchisee_id: selectedFranchiseObj.franchisee_id || selectedFranchiseObj._id,
          company_name: selectedFranchiseObj.company_name || selectedFranchiseObj.name,
          district: selectedFranchiseObj.district,
          state: selectedFranchiseObj.state,
          phone: selectedFranchiseObj.phone,
        },
        target_committed_quantity: singlePoQty,
        total_booked_quantity: singlePoQty,
        fulfilled_quantity: 0,
        remaining_quantity: singlePoQty,
        token_amount_paise: totalTokenPaise,
        token_paid_paise: 0,
        token_payment_status: 'PENDING',
        token_balance_paise: 0,
        token_adjusted_total_paise: 0,
        token_settlement_mode: 'PRO_RATA',
        items: [],
        po_settings_snapshot: { po_validity_days: 30, po_lock_days: 30 },
      };

      setOrders((prev) => [newOrder, ...prev]);
      setCreateSubmitting(false);
      setCreateModal(false);

      // Automatically transition user to Stage 2: Product Allocation
      handleOpenAllocateModal(newOrder);
    }, 400);
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // STAGE 2: ALLOCATE PRODUCTS & EPCs
  // ─────────────────────────────────────────────────────────────────────────────
  const handleOpenAllocateModal = (order) => {
    setAllocatingOrder(order);
    setAllocateError('');
    const defaultKit = comboKits[0];
    setAllocateKitId(defaultKit?._id || 'kit-01');

    const totalQty = order.target_committed_quantity || order.total_booked_quantity || 100;
    setAllocateSingleQty(totalQty);

    if (order.po_category === 'COMBINE_PO') {
      // Split between first 2 EPCs by default
      const initialMap = {};
      if (epcList.length >= 2) {
        const half = Math.floor(totalQty / 2);
        initialMap[epcList[0]._id] = half;
        initialMap[epcList[1]._id] = totalQty - half;
      } else if (epcList.length === 1) {
        initialMap[epcList[0]._id] = totalQty;
      }
      setAllocateMultiAllocs(initialMap);
    } else {
      setAllocateSingleTarget('single_epc');
      setAllocateSingleEpcId(epcList[0]?._id || '');
    }

    setAllocateModal(true);
  };

  const handleAllocateSubmit = (e) => {
    e.preventDefault();
    if (!allocatingOrder) return;

    const kitObj = comboKits.find((k) => k._id === allocateKitId) || comboKits[0];
    const isCombine = allocatingOrder.po_category === 'COMBINE_PO';
    const totalCommitted = allocatingOrder.target_committed_quantity || allocatingOrder.total_booked_quantity;

    let allocations = [];
    if (isCombine) {
      const sum = Object.values(allocateMultiAllocs).reduce((acc, q) => acc + (parseInt(q, 10) || 0), 0);
      if (sum !== totalCommitted) {
        setAllocateError(`Allocations sum (${sum}) must equal committed quota (${totalCommitted} kits).`);
        return;
      }
      allocations = Object.entries(allocateMultiAllocs)
        .filter(([, q]) => parseInt(q, 10) > 0)
        .map(([epcId, q]) => {
          const epc = epcList.find((b) => b._id === epcId);
          return {
            epc_buyer_id: epcId,
            company_name: epc?.company_name || 'EPC Contractor',
            buyer_name: epc?.buyer_name || 'Partner',
            allocated_quantity: parseInt(q, 10),
            payment_status: 'PENDING',
          };
        });
    } else {
      if (allocateSingleTarget === 'single_epc') {
        const epc = epcList.find((b) => b._id === allocateSingleEpcId);
        allocations = [
          {
            epc_buyer_id: allocateSingleEpcId,
            company_name: epc?.company_name || 'Single EPC Partner',
            buyer_name: epc?.buyer_name || 'EPC Contractor',
            allocated_quantity: totalCommitted,
            payment_status: 'PENDING',
          },
        ];
      } else {
        allocations = [
          {
            epc_buyer_id: null,
            company_name: 'Franchise Warehouse Stock',
            buyer_name: allocatingOrder.customer_details?.company_name || 'Warehouse',
            allocated_quantity: totalCommitted,
            payment_status: 'PENDING',
          },
        ];
      }
    }

    setAllocateSubmitting(true);
    setTimeout(() => {
      const tokenRate = kitObj.token_rate_per_kit_paise || 500000;
      const totalTokenPaise = totalCommitted * tokenRate;

      const updatedOrder = {
        ...allocatingOrder,
        status: 'AWAITING_TOKEN_PAYMENT',
        token_amount_paise: totalTokenPaise,
        items: [
          {
            kit_id: kitObj._id,
            item_name: kitObj.name,
            quantity: totalCommitted,
            unit_price_paise: kitObj.base_price_paise,
            token_rate_paise: tokenRate,
            subtotal_paise: totalCommitted * kitObj.base_price_paise,
            epc_allocations: allocations,
          },
        ],
      };

      setOrders((prev) => prev.map((o) => (o._id === updatedOrder._id ? updatedOrder : o)));
      setAllocateSubmitting(false);
      setAllocateModal(false);
    }, 400);
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // STAGE 3: RECORD TOKEN PAYMENT
  // ─────────────────────────────────────────────────────────────────────────────
  const handleOpenTokenModal = (order) => {
    setTokenOrder(order);
    setTokenError('');
    setTokenUtr(`ICICI-UTR-${Math.floor(10000000 + Math.random() * 90000000)}`);
    setTokenBank('ICICI Bank / HDFC Bank');
    setTokenDate(new Date().toISOString().slice(0, 10));
    setTokenRemarks('');
    setTokenModal(true);
  };

  const handleTokenSubmit = (e) => {
    e.preventDefault();
    if (!tokenOrder) return;
    if (!tokenUtr.trim()) {
      setTokenError('Please enter the Bank UTR / Reference number.');
      return;
    }

    setTokenSubmitting(true);
    setTimeout(() => {
      const tokenPaise = tokenOrder.token_amount_paise || 50000000;

      // Mark all allocations as paid
      const updatedItems = (tokenOrder.items || []).map((it) => ({
        ...it,
        epc_allocations: (it.epc_allocations || []).map((a) => ({
          ...a,
          payment_status: 'PAID',
        })),
      }));

      const updatedOrder = {
        ...tokenOrder,
        status: 'VALIDATED', // Automatically validates once token is verified!
        token_paid_paise: tokenPaise,
        token_payment_status: 'PAID',
        token_balance_paise: tokenPaise,
        utr_number: tokenUtr,
        sender_bank_name: tokenBank,
        payment_date: tokenDate,
        payment_remarks: tokenRemarks,
        items: updatedItems,
      };

      setOrders((prev) => prev.map((o) => (o._id === updatedOrder._id ? updatedOrder : o)));
      setTokenSubmitting(false);
      setTokenModal(false);
    }, 400);
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // STAGE 4: VALIDATE & REORDER DRAWDOWN
  // ─────────────────────────────────────────────────────────────────────────────
  const handleValidateInstant = (order) => {
    const updated = {
      ...order,
      status: 'VALIDATED',
    };
    setOrders((prev) => prev.map((o) => (o._id === order._id ? updated : o)));
  };

  const handleOpenReorderModal = (order) => {
    setReorderOrder(order);
    setReorderError('');
    setReorderQty(Math.min(10, order.remaining_quantity || 1));
    setReorderUtr(`REORDER-UTR-${Math.floor(10000000 + Math.random() * 90000000)}`);
    setReorderBank('ICICI Bank');
    setReorderDate(new Date().toISOString().slice(0, 10));
    setReorderModal(true);
  };

  const handleReorderSubmit = (e) => {
    e.preventDefault();
    if (!reorderOrder) return;
    const qty = parseInt(reorderQty, 10) || 0;
    if (qty <= 0 || qty > reorderOrder.remaining_quantity) {
      setReorderError(`Quantity must be between 1 and ${reorderOrder.remaining_quantity}.`);
      return;
    }

    setReorderSubmitting(true);
    setTimeout(() => {
      const newFulfilled = (reorderOrder.fulfilled_quantity || 0) + qty;
      const newRemaining = Math.max(0, (reorderOrder.total_booked_quantity || 0) - newFulfilled);
      const isComplete = newRemaining === 0;

      const tokenPerKit = Math.round((reorderOrder.token_amount_paise || 0) / (reorderOrder.total_booked_quantity || 1));
      const adjustedThis = qty * tokenPerKit;
      const newAdjusted = (reorderOrder.token_adjusted_total_paise || 0) + adjustedThis;
      const newBalance = Math.max(0, (reorderOrder.token_paid_paise || 0) - newAdjusted);

      const updated = {
        ...reorderOrder,
        fulfilled_quantity: newFulfilled,
        remaining_quantity: newRemaining,
        status: isComplete ? 'COMPLETED' : reorderOrder.status,
        token_adjusted_total_paise: newAdjusted,
        token_balance_paise: newBalance,
      };

      setOrders((prev) => prev.map((o) => (o._id === updated._id ? updated : o)));
      setReorderSubmitting(false);
      setReorderModal(false);
    }, 400);
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // STAGE 5: REFUND REQUEST
  // ─────────────────────────────────────────────────────────────────────────────
  const handleOpenRefundModal = (order) => {
    setRefundOrder(order);
    setRefundError('');
    setRefundForm({
      account_holder_name: order.customer_details?.company_name || '',
      bank_name: 'HDFC Bank',
      account_number: '50100445588990',
      confirm_account_number: '50100445588990',
      ifsc_code: 'HDFC0001234',
      notes: 'Token refund on remaining unfulfilled quota.',
    });
    setRefundModal(true);
  };

  const handleRefundSubmit = (e) => {
    e.preventDefault();
    if (refundForm.account_number !== refundForm.confirm_account_number) {
      setRefundError('Account numbers do not match.');
      return;
    }

    setRefundSubmitting(true);
    setTimeout(() => {
      const updated = {
        ...refundOrder,
        status: 'REFUND_REQUESTED',
        refund_request_snapshot: {
          requested_at: new Date().toISOString(),
          status: 'REFUND_REQUESTED',
          refund_form: refundForm,
        },
      };
      setOrders((prev) => prev.map((o) => (o._id === updated._id ? updated : o)));
      setRefundSubmitting(false);
      setRefundModal(false);
    }, 400);
  };

  return (
    <div className="space-y-6 pb-24">
      {/* ── Top Header Banner (Exact match to Franchise PO design) ── */}
      <div
        className="relative rounded-3xl p-6 sm:p-8 text-white shadow-xl overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 50%, #2563eb 100%)' }}
      >
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-400/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black tracking-wider uppercase bg-white/20 backdrop-blur-md border border-white/20 text-white">
                <Shield className="w-3.5 h-3.5" /> BDE Field PO & Quota Booking
              </span>
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-amber-400/30 text-amber-200 border border-amber-400/40">
                ★ Territory Network Management
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              Purchase Orders & Token Booking
            </h1>
            <p className="text-white/80 text-xs sm:text-sm max-w-2xl leading-relaxed">
              Create and manage bulk solar kit quotas on behalf of onboarded franchisees and EPC partners.
              Lock prices with dynamic token deposits (Single PO or Combine EPC Pool), manage product allocation,
              and track loose order drawdown.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleRefresh}
              className="p-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white border border-white/20 transition-all cursor-pointer"
              title="Refresh Data"
            >
              <RotateCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={handleOpenCreateModal}
              className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-white text-blue-900 hover:bg-white/90 text-sm font-black shadow-lg transition-all transform active:scale-95 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Create Purchase Order</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── Monthly Territory Kit Target & Goal Bar ── */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-blue-600/10 text-blue-600 flex items-center justify-center font-bold shrink-0">
            <Target className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-500">
                Territory Monthly Fulfillment Goal
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-blue-100 text-blue-800">
                {Math.min(100, Math.round((stats.totalFulfilled / Math.max(1, stats.totalBooked)) * 100))}% Fulfilled
              </span>
            </div>
            <div className="text-xs sm:text-sm font-black text-slate-900 mt-0.5">
              {stats.totalFulfilled} / {stats.totalBooked} Kits Fulfilled
              <span className="text-xs font-normal text-slate-500 ml-2">
                ({stats.totalRemaining} kits remaining in active price-locked quotas)
              </span>
            </div>
          </div>
        </div>

        <div className="w-full md:w-64 space-y-1.5 shrink-0">
          <div className="flex justify-between text-[11px] font-bold text-slate-500">
            <span>Quota Drawdown</span>
            <span>{stats.validatedCount} Validated POs</span>
          </div>
          <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200">
            <div
              className="h-full rounded-full bg-blue-600 transition-all duration-500"
              style={{
                width: `${Math.min(
                  100,
                  Math.max(5, Math.round((stats.totalFulfilled / Math.max(1, stats.totalBooked)) * 100))
                )}%`,
              }}
            />
          </div>
        </div>
      </div>

      {/* ── Active Policy & Rules Strip ── */}
      <div className="rounded-2xl p-4 sm:p-5 border border-slate-200 bg-white shadow-xs">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="space-y-1">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-blue-600" /> BDE Territory
            </div>
            <div className="text-sm font-black text-slate-900">Gujarat Cluster (Surat / Ahm)</div>
            <div className="text-[11px] font-semibold text-emerald-600">3 Active Franchisees</div>
          </div>

          <div className="space-y-1">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Package className="w-3.5 h-3.5 text-blue-600" /> Min Quota Threshold
            </div>
            <div className="text-sm font-black text-slate-900">25 Kits Minimum</div>
            <div className="text-[11px] text-slate-500">Per Bulk PO Order</div>
          </div>

          <div className="space-y-1">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-blue-600" /> Price Lock Duration
            </div>
            <div className="text-sm font-black text-slate-900">30 Days Guaranteed</div>
            <div className="text-[11px] text-slate-500">Fixed rate lock from token deposit</div>
          </div>

          <div className="space-y-1">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <DollarSign className="w-3.5 h-3.5 text-emerald-600" /> Token Booking Mode
            </div>
            <div className="text-sm font-black text-emerald-600">₹5,000 / Kit Flat</div>
            <div className="text-[11px] text-slate-500">Auto-adjusted on final orders</div>
          </div>
        </div>
      </div>

      {/* ── Control Bar: Search, Category Tabs, Status Filter, View Mode ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Category Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-2xl w-fit border border-slate-200">
          <button
            onClick={() => setCategoryTab('ALL')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
              categoryTab === 'ALL'
                ? 'bg-white text-blue-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All Orders ({orders.length})
          </button>
          <button
            onClick={() => setCategoryTab('SINGLE_PO')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
              categoryTab === 'SINGLE_PO'
                ? 'bg-white text-blue-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Single PO ({orders.filter((o) => o.po_category === 'SINGLE_PO').length})
          </button>
          <button
            onClick={() => setCategoryTab('COMBINE_PO')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
              categoryTab === 'COMBINE_PO'
                ? 'bg-white text-purple-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Combine PO ({orders.filter((o) => o.po_category === 'COMBINE_PO').length})
          </button>
        </div>

        {/* Search, Filter & View Toggle */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Search */}
          <div className="relative min-w-[220px]">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search PO#, Franchise, EPC..."
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 bg-white text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 shadow-2xs"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700 focus:outline-none focus:border-blue-500 shadow-2xs"
          >
            <option value="ALL">All Statuses</option>
            <option value="PENDING_ALLOCATION">1. Pending Allocation</option>
            <option value="AWAITING_TOKEN_PAYMENT">2. Awaiting Token</option>
            <option value="PO_STARTED">3. PO Started</option>
            <option value="VALIDATED">4. Validated ✓</option>
            <option value="COMPLETED">Completed</option>
            <option value="REFUND_REQUESTED">Refund Requested</option>
          </select>

          {/* View Toggle */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl border border-slate-200">
            <button
              onClick={() => setViewMode('card')}
              className={`p-1.5 rounded-lg transition ${
                viewMode === 'card' ? 'bg-white text-blue-700 shadow-2xs' : 'text-slate-500 hover:text-slate-700'
              }`}
              title="Card View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg transition ${
                viewMode === 'table' ? 'bg-white text-blue-700 shadow-2xs' : 'text-slate-500 hover:text-slate-700'
              }`}
              title="Table View"
            >
              <List className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={handleResetData}
            className="px-2.5 py-1.5 rounded-xl border border-dashed border-slate-300 text-[11px] font-semibold text-slate-500 hover:bg-slate-50"
            title="Reset to sample PO orders"
          >
            Reset Demo
          </button>
        </div>
      </div>

      {/* ── Order List: Card View or Table View ── */}
      {filteredOrders.length === 0 ? (
        <div className="p-12 text-center rounded-3xl border-2 border-dashed border-slate-200 bg-white space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
            <ShoppingCart className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-base font-black text-slate-800">No Purchase Orders Found</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
              No PO orders match your current filter. Create a new bulk PO for your onboarded franchisees or adjust your filters.
            </p>
          </div>
          <button
            onClick={handleOpenCreateModal}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 text-white text-xs font-black shadow-md hover:bg-blue-700 transition"
          >
            <Plus className="w-4 h-4" />
            <span>Create Purchase Order</span>
          </button>
        </div>
      ) : viewMode === 'card' ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredOrders.map((order) => (
            <PoCardItem
              key={order._id}
              order={order}
              onSelectOrder={() => {
                setSelectedOrder(order);
                setDetailModal(true);
              }}
              onOpenAllocate={() => handleOpenAllocateModal(order)}
              onOpenToken={() => handleOpenTokenModal(order)}
              onValidateOrder={() => handleValidateInstant(order)}
              onOpenReorder={() => handleOpenReorderModal(order)}
              onOpenRefund={() => handleOpenRefundModal(order)}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                  <th className="py-3 px-4">PO Number & Creator</th>
                  <th className="py-3 px-4">Franchisee & Beneficiary</th>
                  <th className="py-3 px-4">Status & Stage</th>
                  <th className="py-3 px-4">Kit & Committed Quota</th>
                  <th className="py-3 px-4">Progress</th>
                  <th className="py-3 px-4">Token Balance</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {filteredOrders.map((order) => {
                  const item = order.items?.[0] || {};
                  const isCombine = order.po_category === 'COMBINE_PO';
                  const booked = order.total_booked_quantity || order.target_committed_quantity || 0;
                  const fulfilled = order.fulfilled_quantity || 0;
                  const remaining = order.remaining_quantity ?? Math.max(0, booked - fulfilled);
                  const progressPct = booked > 0 ? Math.round((fulfilled / booked) * 100) : 0;
                  const tokenPaidINR = Math.round((order.token_paid_paise || 0) / 100);

                  return (
                    <tr key={order._id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3.5 px-4">
                        <div className="font-mono font-black text-slate-900">{order.po_number}</div>
                        <div className="text-[10px] text-amber-600 font-bold mt-0.5">
                          BDE: {order.creator_name} ({order.creator_code})
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">
                          {order.customer_details?.company_name || 'Franchisee Hub'}
                        </div>
                        <div className="text-[10px] text-slate-500">
                          {isCombine
                            ? `Combine Pool (${item.epc_allocations?.length || 0} EPCs)`
                            : item.epc_allocations?.[0]?.company_name || 'Single EPC Partner'}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <StatusBadge status={order.status} />
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900 truncate max-w-[200px]">
                          {item.item_name || 'Pending Allocation'}
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono">
                          {booked} Kits Total
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-blue-600 rounded-full"
                              style={{ width: `${progressPct}%` }}
                            />
                          </div>
                          <span className="font-bold text-[11px]">{progressPct}%</span>
                        </div>
                        <div className="text-[10px] text-slate-500">
                          {fulfilled} / {booked} (rem: {remaining})
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-black text-emerald-700">₹{tokenPaidINR.toLocaleString('en-IN')}</div>
                        <div className="text-[10px] text-slate-500 uppercase">{order.token_payment_status || 'PENDING'}</div>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => {
                              setSelectedOrder(order);
                              setDetailModal(true);
                            }}
                            className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100"
                            title="View Details"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          {order.status === 'PENDING_ALLOCATION' && (
                            <button
                              onClick={() => handleOpenAllocateModal(order)}
                              className="px-2.5 py-1 rounded-lg bg-amber-500 text-white font-black text-[10px] hover:bg-amber-600"
                            >
                              Allocate ⚡
                            </button>
                          )}
                          {order.status === 'AWAITING_TOKEN_PAYMENT' && (
                            <button
                              onClick={() => handleOpenTokenModal(order)}
                              className="px-2.5 py-1 rounded-lg bg-orange-500 text-white font-black text-[10px] hover:bg-orange-600"
                            >
                              Token 🔒
                            </button>
                          )}
                          {order.status === 'VALIDATED' && remaining > 0 && (
                            <button
                              onClick={() => handleOpenReorderModal(order)}
                              className="px-2.5 py-1 rounded-lg bg-blue-600 text-white font-black text-[10px] hover:bg-blue-700"
                            >
                              Reorder
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
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────────────────
          MODAL 1: CREATE PURCHASE ORDER (STAGE 1)
      ───────────────────────────────────────────────────────────────────────────── */}
      {createModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-xs">
          <div className="relative w-full max-w-3xl lg:max-w-4xl max-h-[92vh] flex flex-col rounded-3xl bg-white border border-slate-200 shadow-2xl overflow-hidden z-10 animate-fadeIn">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-blue-100 text-blue-700 border border-blue-200">
                    Stage 1 of 4
                  </span>
                  <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                    <ShoppingCart className="w-5 h-5 text-blue-600" /> Create Purchase Order
                  </h2>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  BDE Field PO Creation • Min Quota MOQ: <strong className="text-emerald-600">25 kits</strong>
                </p>
              </div>
              <button
                onClick={() => setCreateModal(false)}
                disabled={createSubmitting}
                className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Lifecycle Stage Guide Bar */}
            <div className="px-6 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-[11px] font-bold">
              <span className="text-blue-600 flex items-center gap-1 font-black">
                <CheckCircle2 className="w-3.5 h-3.5" /> 1. Create PO Card
              </span>
              <span className="text-slate-400">➔ 2. Allocate Product</span>
              <span className="text-slate-400">➔ 3. Waiting for Token</span>
              <span className="text-slate-400">➔ 4. Validated</span>
            </div>

            {/* Modal Form Content */}
            <form onSubmit={handleCreateOrder} className="flex-1 overflow-y-auto p-6 space-y-5">
              {createError && (
                <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{createError}</span>
                </div>
              )}

              {/* Franchisee Selector (BDE Specific Addition) */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                  Select Onboarded Franchisee <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Store className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <select
                    value={selectedFranchiseeId}
                    onChange={(e) => setSelectedFranchiseeId(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-800 focus:outline-none focus:border-blue-500"
                    required
                  >
                    <option value="">-- Choose Franchisee Store --</option>
                    {franchisees.map((f) => (
                      <option key={f._id || f.franchisee_id} value={f._id || f.franchisee_id}>
                        {f.company_name || f.name} • {f.district}, {f.state} ({f.franchisee_id || 'Active'})
                      </option>
                    ))}
                  </select>
                </div>
                <p className="text-[11px] text-slate-400">
                  This PO will be credited to this franchisee's store quota & targets.
                </p>
              </div>

              {/* Section 1: PO Category Selector */}
              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                  Purchase Order Type <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div
                    onClick={() => setPoCategory('SINGLE_PO')}
                    className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-start gap-3 ${
                      poCategory === 'SINGLE_PO'
                        ? 'border-blue-600 bg-blue-50/50 shadow-xs'
                        : 'border-slate-200 hover:border-blue-300 bg-white'
                    }`}
                  >
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                        poCategory === 'SINGLE_PO' ? 'bg-blue-600 text-white' : 'bg-blue-100 text-blue-600'
                      }`}
                    >
                      <UserCheck className="w-4 h-4" />
                    </div>
                    <div className="space-y-0.5">
                      <div className="font-black text-xs text-slate-900 flex items-center gap-1">
                        Single PO
                        {poCategory === 'SINGLE_PO' && <Check className="w-3.5 h-3.5 text-blue-600" />}
                      </div>
                      <p className="text-[11px] text-slate-500 leading-tight">
                        Dedicated to 1 EPC Partner or Franchise Warehouse stock.
                      </p>
                    </div>
                  </div>

                  <div
                    onClick={() => setPoCategory('COMBINE_PO')}
                    className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-start gap-3 ${
                      poCategory === 'COMBINE_PO'
                        ? 'border-purple-600 bg-purple-50/50 shadow-xs'
                        : 'border-slate-200 hover:border-purple-300 bg-white'
                    }`}
                  >
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                        poCategory === 'COMBINE_PO' ? 'bg-purple-600 text-white' : 'bg-purple-100 text-purple-600'
                      }`}
                    >
                      <Users className="w-4 h-4" />
                    </div>
                    <div className="space-y-0.5">
                      <div className="font-black text-xs text-slate-900 flex items-center gap-1">
                        Combine PO (Multi-EPC)
                        {poCategory === 'COMBINE_PO' && <Check className="w-3.5 h-3.5 text-purple-600" />}
                      </div>
                      <p className="text-[11px] text-slate-500 leading-tight">
                        Pool demand from multiple onboarded EPC contractors.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Single PO Beneficiary Selector */}
                {poCategory === 'SINGLE_PO' && (
                  <div className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50 space-y-2 mt-2">
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600">
                      Single PO Destination / Beneficiary
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div
                        onClick={() => setSingleTargetType('single_epc')}
                        className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center gap-2 ${
                          singleTargetType === 'single_epc'
                            ? 'border-blue-600 bg-blue-50 text-blue-700 font-bold'
                            : 'border-slate-200 bg-white text-slate-600'
                        }`}
                      >
                        <UserCheck className="w-4 h-4" />
                        <span className="text-xs">1 Onboarded EPC Partner</span>
                      </div>
                      <div
                        onClick={() => setSingleTargetType('warehouse')}
                        className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center gap-2 ${
                          singleTargetType === 'warehouse'
                            ? 'border-blue-600 bg-blue-50 text-blue-700 font-bold'
                            : 'border-slate-200 bg-white text-slate-600'
                        }`}
                      >
                        <Package className="w-4 h-4" />
                        <span className="text-xs">Warehouse Self-Stock</span>
                      </div>
                    </div>

                    {singleTargetType === 'single_epc' && (
                      <div className="pt-2 border-t border-slate-200 space-y-1">
                        <label className="block text-[10px] font-bold uppercase text-slate-500">
                          Select EPC Contractor:
                        </label>
                        <select
                          value={selectedSingleEpcId}
                          onChange={(e) => setSelectedSingleEpcId(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl text-xs font-bold border border-slate-200 bg-white text-slate-800 focus:outline-none focus:border-blue-500"
                        >
                          <option value="">-- Choose EPC Partner --</option>
                          {epcList.map((b) => (
                            <option key={b._id} value={b._id}>
                              {b.company_name} ({b.buyer_name}) - {b.district || 'Territory'}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Section 2: Target Committed Quota */}
              <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50 space-y-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                    Enter Target Committed Quota (Kits) <span className="text-rose-500">*</span>
                  </label>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Minimum required commitment: <strong className="text-blue-600">25 kits</strong>.
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setSinglePoQty((prev) => Math.max(25, (parseInt(prev, 10) || 0) - 25))}
                    className="w-10 h-10 rounded-xl bg-white hover:bg-slate-100 text-slate-800 font-black text-base flex items-center justify-center border border-slate-200 cursor-pointer shadow-2xs"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    min={25}
                    value={singlePoQty}
                    onChange={(e) => setSinglePoQty(Math.max(0, parseInt(e.target.value, 10) || 0))}
                    className="flex-1 text-center py-2.5 rounded-xl text-base font-black border border-slate-200 bg-white text-slate-900 focus:border-blue-500 outline-none shadow-2xs"
                  />
                  <button
                    type="button"
                    onClick={() => setSinglePoQty((prev) => (parseInt(prev, 10) || 0) + 25)}
                    className="w-10 h-10 rounded-xl bg-white hover:bg-slate-100 text-slate-800 font-black text-base flex items-center justify-center border border-slate-200 cursor-pointer shadow-2xs"
                  >
                    +
                  </button>
                </div>

                {/* Preset Pills */}
                <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-200">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Quick Presets:
                  </span>
                  {[25, 50, 100, 250, 500].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setSinglePoQty(preset)}
                      className={`px-3 py-1 rounded-xl text-xs font-black transition cursor-pointer border ${
                        singlePoQty === preset
                          ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                          : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
                      }`}
                    >
                      {preset} Kits
                    </button>
                  ))}
                </div>
              </div>

              {/* Workflow Banner */}
              <div className="p-3.5 rounded-2xl bg-blue-50 border border-blue-200 text-xs text-blue-900 space-y-1">
                <div className="font-black flex items-center gap-1.5">
                  <Info className="w-4 h-4 text-blue-600" /> What happens next?
                </div>
                <p className="text-[11px] leading-relaxed text-blue-800">
                  Once you submit, a new <strong>PO Order Card</strong> is generated with status{' '}
                  <strong>Pending Allocation</strong>. The wizard will automatically prompt you to allocate Solar
                  ComboKits and EPC partners in Stage 2.
                </p>
              </div>

              {/* Modal Footer */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setCreateModal(false)}
                  disabled={createSubmitting}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createSubmitting || singlePoQty < 25}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 text-white text-xs font-black shadow-md hover:bg-blue-700 transition cursor-pointer disabled:opacity-50"
                >
                  {createSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Generating PO Card...</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      <span>Create PO Order (Generate Card) →</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────────────────
          MODAL 2: PRODUCT & EPC ALLOCATION (STAGE 2)
      ───────────────────────────────────────────────────────────────────────────── */}
      {allocateModal && allocatingOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-xs">
          <div className="relative w-full max-w-3xl lg:max-w-4xl max-h-[92vh] flex flex-col rounded-3xl bg-white border border-slate-200 shadow-2xl overflow-hidden z-10 animate-fadeIn">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-amber-100 text-amber-700 border border-amber-200">
                    Stage 2 of 4
                  </span>
                  <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                    <Package className="w-5 h-5 text-amber-600" /> Allocate Solar ComboKit & EPCs
                  </h2>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  PO: <strong className="font-mono text-slate-800">{allocatingOrder.po_number}</strong> • Franchise:{' '}
                  <strong className="text-slate-800">{allocatingOrder.customer_details?.company_name}</strong> • Quota:{' '}
                  <strong className="text-blue-600">
                    {allocatingOrder.target_committed_quantity || allocatingOrder.total_booked_quantity} Kits
                  </strong>
                </p>
              </div>
              <button
                onClick={() => setAllocateModal(false)}
                disabled={allocateSubmitting}
                className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAllocateSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
              {allocateError && (
                <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{allocateError}</span>
                </div>
              )}

              {/* ComboKit Selection */}
              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                  1. Choose Authorized Solar ComboKit <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-1 gap-2.5">
                  {comboKits.map((kit) => {
                    const isSelected = allocateKitId === kit._id;
                    const priceRupees = Math.round(kit.base_price_paise / 100);
                    const tokenRupees = Math.round(kit.token_rate_per_kit_paise / 100);

                    return (
                      <div
                        key={kit._id}
                        onClick={() => setAllocateKitId(kit._id)}
                        className={`p-3.5 rounded-2xl border-2 transition cursor-pointer flex items-center justify-between gap-3 ${
                          isSelected
                            ? 'border-blue-600 bg-blue-50/40 shadow-xs'
                            : 'border-slate-200 hover:border-blue-300 bg-white'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs ${
                              isSelected ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {kit.capacity_kw}kW
                          </div>
                          <div>
                            <div className="font-bold text-xs text-slate-900">{kit.name}</div>
                            <div className="text-[11px] text-slate-500">{kit.specifications}</div>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <div className="font-black text-xs text-slate-900">
                            ₹{priceRupees.toLocaleString('en-IN')}{' '}
                            <span className="text-[10px] font-normal text-slate-400">/kit</span>
                          </div>
                          <div className="text-[10px] text-emerald-600 font-bold">
                            Token: ₹{tokenRupees.toLocaleString('en-IN')}/kit
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Allocation Breakdown */}
              <div className="space-y-3 pt-2 border-t border-slate-100">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                  2. {allocatingOrder.po_category === 'COMBINE_PO' ? 'EPC Pool Split' : 'Single EPC Allocation'}{' '}
                  <span className="text-rose-500">*</span>
                </label>

                {allocatingOrder.po_category === 'COMBINE_PO' ? (
                  <div className="space-y-2.5">
                    <p className="text-[11px] text-slate-500">
                      Assign kit quantities to onboarded EPC partners. The sum must exactly equal{' '}
                      <strong>{allocatingOrder.target_committed_quantity} kits</strong>.
                    </p>
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 space-y-2">
                      {epcList.map((epc) => {
                        const currentVal = allocateMultiAllocs[epc._id] || 0;
                        return (
                          <div
                            key={epc._id}
                            className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-slate-200"
                          >
                            <div>
                              <div className="font-bold text-xs text-slate-900">{epc.company_name}</div>
                              <div className="text-[10px] text-slate-400">
                                {epc.buyer_name} • {epc.district || 'Territory'}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <input
                                type="number"
                                min={0}
                                max={allocatingOrder.target_committed_quantity}
                                value={currentVal}
                                onChange={(e) =>
                                  setAllocateMultiAllocs((prev) => ({
                                    ...prev,
                                    [epc._id]: Math.max(0, parseInt(e.target.value, 10) || 0),
                                  }))
                                }
                                className="w-20 text-center py-1 rounded-lg border border-slate-200 text-xs font-bold text-slate-900 focus:outline-none focus:border-blue-500"
                              />
                              <span className="text-xs text-slate-500">kits</span>
                            </div>
                          </div>
                        );
                      })}
                      <div className="pt-2 flex justify-between text-xs font-black text-slate-800">
                        <span>Total Assigned:</span>
                        <span
                          className={
                            Object.values(allocateMultiAllocs).reduce((a, b) => a + (parseInt(b, 10) || 0), 0) ===
                            allocatingOrder.target_committed_quantity
                              ? 'text-emerald-600'
                              : 'text-rose-600'
                          }
                        >
                          {Object.values(allocateMultiAllocs).reduce((a, b) => a + (parseInt(b, 10) || 0), 0)} /{' '}
                          {allocatingOrder.target_committed_quantity} Kits
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50 space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                      <div
                        onClick={() => setAllocateSingleTarget('single_epc')}
                        className={`p-2.5 rounded-xl border text-center cursor-pointer text-xs font-bold transition ${
                          allocateSingleTarget === 'single_epc'
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'bg-white text-slate-700 border-slate-200'
                        }`}
                      >
                        Single EPC Partner
                      </div>
                      <div
                        onClick={() => setAllocateSingleTarget('warehouse')}
                        className={`p-2.5 rounded-xl border text-center cursor-pointer text-xs font-bold transition ${
                          allocateSingleTarget === 'warehouse'
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'bg-white text-slate-700 border-slate-200'
                        }`}
                      >
                        Warehouse Self-Stock
                      </div>
                    </div>

                    {allocateSingleTarget === 'single_epc' && (
                      <div className="space-y-1">
                        <label className="block text-[11px] font-bold uppercase text-slate-500">
                          Select Destination EPC Contractor:
                        </label>
                        <select
                          value={allocateSingleEpcId}
                          onChange={(e) => setAllocateSingleEpcId(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl text-xs font-bold border border-slate-200 bg-white text-slate-800 focus:outline-none focus:border-blue-500"
                        >
                          {epcList.map((epc) => (
                            <option key={epc._id} value={epc._id}>
                              {epc.company_name} ({epc.buyer_name})
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Commercial Summary Strip */}
              {(() => {
                const kitObj = comboKits.find((k) => k._id === allocateKitId) || comboKits[0];
                const totalCommitted = allocatingOrder.target_committed_quantity || 100;
                const tokenPerKitINR = Math.round((kitObj.token_rate_per_kit_paise || 500000) / 100);
                const totalTokenINR = totalCommitted * tokenPerKitINR;
                const totalOrderValINR = Math.round((totalCommitted * kitObj.base_price_paise) / 100);

                return (
                  <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 text-xs space-y-1.5">
                    <div className="flex justify-between text-slate-700">
                      <span>Total Committed Quota:</span>
                      <span className="font-bold text-slate-900">{totalCommitted} Kits</span>
                    </div>
                    <div className="flex justify-between text-slate-700">
                      <span>Total PO Commercial Value:</span>
                      <span className="font-bold text-slate-900">₹{totalOrderValINR.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between pt-1 border-t border-emerald-200 text-emerald-800 font-black text-sm">
                      <span>Required Token Deposit:</span>
                      <span>₹{totalTokenINR.toLocaleString('en-IN')} (₹{tokenPerKitINR}/kit)</span>
                    </div>
                  </div>
                );
              })()}

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setAllocateModal(false)}
                  disabled={allocateSubmitting}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={allocateSubmitting}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-amber-600 text-white text-xs font-black shadow-md hover:bg-amber-700 transition cursor-pointer disabled:opacity-50"
                >
                  {allocateSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Saving Allocation...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Confirm Allocation & Calculate Token →</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────────────────
          MODAL 3: RECORD TOKEN PAYMENT (STAGE 3)
      ───────────────────────────────────────────────────────────────────────────── */}
      {tokenModal && tokenOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-xs">
          <div className="relative w-full max-w-2xl lg:max-w-3xl max-h-[92vh] flex flex-col rounded-3xl bg-white border border-slate-200 shadow-2xl overflow-hidden z-10 animate-fadeIn">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-orange-100 text-orange-700 border border-orange-200">
                    Stage 3 of 4
                  </span>
                  <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-orange-600" /> Record Token Payment Deposit
                  </h2>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  PO: <strong className="font-mono text-slate-800">{tokenOrder.po_number}</strong> • Deposit Required:{' '}
                  <strong className="text-emerald-600">
                    ₹{Math.round((tokenOrder.token_amount_paise || 0) / 100).toLocaleString('en-IN')}
                  </strong>
                </p>
              </div>
              <button
                onClick={() => setTokenModal(false)}
                disabled={tokenSubmitting}
                className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleTokenSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
              {tokenError && (
                <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{tokenError}</span>
                </div>
              )}

              {/* Escrow Bank Account Card */}
              <div className="p-4 rounded-2xl border border-blue-200 bg-blue-50/50 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-black uppercase tracking-wider text-blue-900 flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-blue-600" /> Escrow Deposit Account
                  </span>
                  <span className="text-[10px] px-2 py-0.5 bg-blue-100 text-blue-800 rounded font-bold">Verified Escrow</span>
                </div>

                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between items-center py-1 border-b border-blue-100">
                    <span className="text-slate-500">Beneficiary:</span>
                    <span className="font-bold text-slate-900">{ESCROW_BANK.account_name}</span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-blue-100">
                    <span className="text-slate-500">Bank & Branch:</span>
                    <span className="font-bold text-slate-900">
                      {ESCROW_BANK.bank_name} ({ESCROW_BANK.branch})
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-blue-100">
                    <span className="text-slate-500">Account Number:</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-black text-slate-900">{ESCROW_BANK.account_number}</span>
                      <button
                        type="button"
                        onClick={() => handleCopy(ESCROW_BANK.account_number, 'acc')}
                        className="text-blue-600 hover:text-blue-800 text-[10px] font-bold cursor-pointer"
                      >
                        {copiedField === 'acc' ? 'Copied!' : 'Copy'}
                      </button>
                    </div>
                  </div>
                  <div className="flex justify-between items-center py-1">
                    <span className="text-slate-500">IFSC Code:</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-black text-slate-900">{ESCROW_BANK.ifsc_code}</span>
                      <button
                        type="button"
                        onClick={() => handleCopy(ESCROW_BANK.ifsc_code, 'ifsc')}
                        className="text-blue-600 hover:text-blue-800 text-[10px] font-bold cursor-pointer"
                      >
                        {copiedField === 'ifsc' ? 'Copied!' : 'Copy'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* UTR Entry Form */}
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                    Bank UTR / Transaction Reference Number <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={tokenUtr}
                    onChange={(e) => setTokenUtr(e.target.value)}
                    placeholder="e.g. ICICI992823812 or CMS-REF-001"
                    className="w-full mt-1 px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-blue-500"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                      Depositor Bank
                    </label>
                    <input
                      type="text"
                      value={tokenBank}
                      onChange={(e) => setTokenBank(e.target.value)}
                      placeholder="e.g. HDFC Bank"
                      className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                      Payment Date
                    </label>
                    <input
                      type="date"
                      value={tokenDate}
                      onChange={(e) => setTokenDate(e.target.value)}
                      className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                    Verification Notes
                  </label>
                  <input
                    type="text"
                    value={tokenRemarks}
                    onChange={(e) => setTokenRemarks(e.target.value)}
                    placeholder="Optional remarks from franchisee or EPC partner"
                    className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setTokenModal(false)}
                  disabled={tokenSubmitting}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={tokenSubmitting}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-orange-600 text-white text-xs font-black shadow-md hover:bg-orange-700 transition cursor-pointer disabled:opacity-50"
                >
                  {tokenSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Verifying Token...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Verify & Validate PO (Activate Quota) →</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────────────────
          MODAL 4: FULL PO DETAIL DRAWER
      ───────────────────────────────────────────────────────────────────────────── */}
      {detailModal && selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-xs">
          <div className="relative w-full max-w-4xl lg:max-w-5xl max-h-[92vh] flex flex-col rounded-3xl bg-white border border-slate-200 shadow-2xl overflow-hidden z-10 animate-fadeIn">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-black text-sm text-slate-900 px-2.5 py-1 rounded-xl bg-slate-100 border border-slate-200">
                    {selectedOrder.po_number}
                  </span>
                  <StatusBadge status={selectedOrder.status} />
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Franchisee: <strong>{selectedOrder.customer_details?.company_name}</strong> • Created by:{' '}
                  <strong>
                    {selectedOrder.creator_name} ({selectedOrder.creator_code})
                  </strong>
                </p>
              </div>
              <button
                onClick={() => setDetailModal(false)}
                className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Quota Progress */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-[10px] font-bold uppercase text-slate-400">Total Booked Quota</div>
                  <div className="text-lg font-black text-slate-900 mt-0.5">
                    {selectedOrder.total_booked_quantity || selectedOrder.target_committed_quantity} Kits
                  </div>
                </div>
                <div>
                  <div className="text-[10px] font-bold uppercase text-slate-400">Fulfilled to Date</div>
                  <div className="text-lg font-black text-emerald-600 mt-0.5">
                    {selectedOrder.fulfilled_quantity || 0} Kits
                  </div>
                </div>
                <div>
                  <div className="text-[10px] font-bold uppercase text-slate-400">Remaining Balance</div>
                  <div className="text-lg font-black text-blue-600 mt-0.5">
                    {selectedOrder.remaining_quantity || 0} Kits
                  </div>
                </div>
              </div>

              {/* Items Breakdown */}
              <div className="space-y-2">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-500">Allocated Solar Products</h4>
                {(selectedOrder.items || []).length === 0 ? (
                  <div className="p-4 rounded-xl border border-dashed border-amber-300 bg-amber-50 text-amber-800 text-xs">
                    Pending product allocation. Please click "Allocate Products" to select solar kits.
                  </div>
                ) : (
                  (selectedOrder.items || []).map((it, idx) => (
                    <div key={idx} className="p-4 rounded-2xl border border-slate-200 bg-white space-y-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-bold text-sm text-slate-900">{it.item_name}</div>
                          <div className="text-xs text-slate-500">Quantity: {it.quantity} Kits</div>
                        </div>
                        <div className="text-right">
                          <div className="font-black text-slate-900">
                            ₹{Math.round((it.subtotal_paise || 0) / 100).toLocaleString('en-IN')}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            ₹{Math.round((it.unit_price_paise || 0) / 100).toLocaleString('en-IN')}/kit
                          </div>
                        </div>
                      </div>

                      {/* EPC Allocations table */}
                      {(it.epc_allocations || []).length > 0 && (
                        <div className="pt-2 border-t border-slate-100">
                          <div className="text-[11px] font-bold text-slate-400 uppercase mb-1.5">
                            EPC Partner Quota Split
                          </div>
                          <div className="space-y-1.5">
                            {it.epc_allocations.map((a, aIdx) => (
                              <div
                                key={aIdx}
                                className="flex justify-between items-center text-xs p-2 rounded-xl bg-slate-50"
                              >
                                <span className="font-bold text-slate-800">
                                  {a.company_name || a.buyer_name || 'Warehouse Stock'}
                                </span>
                                <div className="flex items-center gap-3">
                                  <span className="font-mono font-bold text-blue-600">
                                    {a.allocated_quantity} Kits
                                  </span>
                                  <span
                                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                      a.payment_status === 'PAID'
                                        ? 'bg-emerald-100 text-emerald-800'
                                        : 'bg-amber-100 text-amber-800'
                                    }`}
                                  >
                                    {a.payment_status || 'PENDING'}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>

              {/* Payment Details */}
              <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50 space-y-2 text-xs">
                <div className="font-black uppercase tracking-wider text-slate-500 text-[11px]">
                  Token & Escrow Settlement Info
                </div>
                <div className="grid grid-cols-2 gap-2 text-slate-700">
                  <div>
                    <span className="text-slate-400">Token Paid:</span>{' '}
                    <strong className="text-emerald-700">
                      ₹{Math.round((selectedOrder.token_paid_paise || 0) / 100).toLocaleString('en-IN')}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-400">Payment Status:</span>{' '}
                    <strong className="uppercase">{selectedOrder.token_payment_status || 'PENDING'}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400">Bank UTR:</span>{' '}
                    <strong className="font-mono">{selectedOrder.utr_number || 'N/A'}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400">Payment Date:</span>{' '}
                    <strong>{selectedOrder.payment_date || 'N/A'}</strong>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 flex items-center justify-end">
              <button
                onClick={() => setDetailModal(false)}
                className="px-5 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────────────────
          MODAL 5: REORDER DRAWDOWN
      ───────────────────────────────────────────────────────────────────────────── */}
      {reorderModal && reorderOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-xs">
          <div className="relative w-full max-w-xl lg:max-w-2xl rounded-3xl bg-white border border-slate-200 shadow-2xl overflow-hidden z-10 animate-fadeIn">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
                  <Package className="w-5 h-5 text-blue-600" /> Drawdown Loose Reorder
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Drawdown from PO <strong className="font-mono">{reorderOrder.po_number}</strong> • Remaining:{' '}
                  <strong className="text-blue-600">{reorderOrder.remaining_quantity} Kits</strong>
                </p>
              </div>
              <button
                onClick={() => setReorderModal(false)}
                className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleReorderSubmit} className="p-6 space-y-4">
              {reorderError && (
                <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{reorderError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                  Quantity to Drawdown (Kits) <span className="text-rose-500">*</span>
                </label>
                <div className="flex items-center gap-3 mt-1.5">
                  <button
                    type="button"
                    onClick={() => setReorderQty((prev) => Math.max(1, (parseInt(prev, 10) || 1) - 1))}
                    className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 font-black text-slate-800"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    min={1}
                    max={reorderOrder.remaining_quantity}
                    value={reorderQty}
                    onChange={(e) => setReorderQty(Math.max(1, parseInt(e.target.value, 10) || 1))}
                    className="flex-1 text-center py-2 rounded-xl text-base font-black border border-slate-200 text-slate-900"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setReorderQty((prev) =>
                        Math.min(reorderOrder.remaining_quantity, (parseInt(prev, 10) || 1) + 1)
                      )
                    }
                    className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 font-black text-slate-800"
                  >
                    +
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                  Payment Reference / UTR
                </label>
                <input
                  type="text"
                  value={reorderUtr}
                  onChange={(e) => setReorderUtr(e.target.value)}
                  placeholder="e.g. HDFC-REORDER-9911"
                  className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                    Remitting Bank
                  </label>
                  <input
                    type="text"
                    value={reorderBank}
                    onChange={(e) => setReorderBank(e.target.value)}
                    placeholder="e.g. ICICI Bank"
                    className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                    Drawdown Date
                  </label>
                  <input
                    type="date"
                    value={reorderDate}
                    onChange={(e) => setReorderDate(e.target.value)}
                    className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-900"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setReorderModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={reorderSubmitting}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 text-white text-xs font-black shadow-md hover:bg-blue-700"
                >
                  {reorderSubmitting ? 'Processing...' : 'Confirm Reorder Drawdown'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────────────────
          MODAL 6: REFUND REQUEST
      ───────────────────────────────────────────────────────────────────────────── */}
      {refundModal && refundOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-xs">
          <div className="relative w-full max-w-xl lg:max-w-2xl rounded-3xl bg-white border border-slate-200 shadow-2xl overflow-hidden z-10 animate-fadeIn">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-rose-600" /> Request Token Deposit Refund
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  PO: <strong className="font-mono">{refundOrder.po_number}</strong> • Token Balance:{' '}
                  <strong className="text-emerald-600">
                    ₹{Math.round((refundOrder.token_balance_paise || 0) / 100).toLocaleString('en-IN')}
                  </strong>
                </p>
              </div>
              <button
                onClick={() => setRefundModal(false)}
                className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleRefundSubmit} className="p-6 space-y-3">
              {refundError && (
                <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{refundError}</span>
                </div>
              )}

              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-600">Account Holder Name</label>
                <input
                  type="text"
                  value={refundForm.account_holder_name}
                  onChange={(e) => setRefundForm({ ...refundForm, account_holder_name: e.target.value })}
                  className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-600">Bank Name</label>
                  <input
                    type="text"
                    value={refundForm.bank_name}
                    onChange={(e) => setRefundForm({ ...refundForm, bank_name: e.target.value })}
                    className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-600">IFSC Code</label>
                  <input
                    type="text"
                    value={refundForm.ifsc_code}
                    onChange={(e) => setRefundForm({ ...refundForm, ifsc_code: e.target.value })}
                    className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono font-bold"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-600">Account Number</label>
                <input
                  type="text"
                  value={refundForm.account_number}
                  onChange={(e) => setRefundForm({ ...refundForm, account_number: e.target.value })}
                  className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono font-bold"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-600">Confirm Account Number</label>
                <input
                  type="text"
                  value={refundForm.confirm_account_number}
                  onChange={(e) => setRefundForm({ ...refundForm, confirm_account_number: e.target.value })}
                  className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono font-bold"
                  required
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setRefundModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={refundSubmitting}
                  className="px-5 py-2.5 rounded-xl bg-rose-600 text-white text-xs font-black shadow-md hover:bg-rose-700"
                >
                  {refundSubmitting ? 'Submitting...' : 'Submit Refund Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PO CARD ITEM COMPONENT (Matches Franchise PO Card 4-Stage Lifecycle)
// ─────────────────────────────────────────────────────────────────────────────
function PoCardItem({
  order,
  onSelectOrder,
  onOpenAllocate,
  onOpenToken,
  onValidateOrder,
  onOpenReorder,
  onOpenRefund,
}) {
  const item = order.items?.[0] || {};
  const isCombine = order.po_category === 'COMBINE_PO';
  const singleEpcAlloc = !isCombine && item.epc_allocations?.length === 1 ? item.epc_allocations[0] : null;

  const booked = order.total_booked_quantity || order.target_committed_quantity || item.quantity || 0;
  const fulfilled = order.fulfilled_quantity || 0;
  const remaining = order.remaining_quantity != null ? order.remaining_quantity : Math.max(0, booked - fulfilled);
  const progressPct = booked > 0 ? Math.min(100, Math.round((fulfilled / booked) * 100)) : 0;

  const tokenRequiredINR = Math.round((order.token_amount_paise || 0) / 100);
  const tokenPaidINR = Math.round((order.token_paid_paise || 0) / 100);
  const tokenAdjustedINR = Math.round((order.token_adjusted_total_paise || 0) / 100);
  const tokenBalanceINR =
    order.token_balance_paise != null
      ? Math.round(order.token_balance_paise / 100)
      : Math.max(0, tokenPaidINR - tokenAdjustedINR);

  // Creator Attribution
  const isBdeCreated = order.created_by_role === 'BDE';
  const creatorDisplay = isBdeCreated
    ? `BDE: ${order.creator_name || 'Assigned Officer'}${order.creator_code ? ` (${order.creator_code})` : ''}`
    : 'Franchisee Direct';

  // Customer / Franchise Details
  const franchiseName = order.customer_details?.company_name || order.customer_details?.name || 'Franchisee Hub';
  const franchiseLocation =
    [order.customer_details?.district, order.customer_details?.state].filter(Boolean).join(', ') || 'Territory Hub';

  // Lifecycle Stage Calculations
  const hasAllocatedItems = (order.items || []).length > 0 && Boolean(order.items[0]?.item_name);
  const isPendingAllocation = order.status === 'PENDING_ALLOCATION' || !hasAllocatedItems;
  const isValidated =
    order.status === 'VALIDATED' ||
    ['APPROVED', 'CONFIRMED', 'PROCESSING', 'DISPATCHED', 'DELIVERED', 'COMPLETED'].includes(order.status);
  const allAllocsPaid =
    (item.epc_allocations || []).length > 0 &&
    item.epc_allocations.every((a) => a.payment_status === 'PAID' || a.payment_status === 'VERIFIED');
  const isPoStarted = order.status === 'PO_STARTED' || (allAllocsPaid && !isValidated);
  const isTokenPaid =
    order.token_payment_status === 'PAID' ||
    isPoStarted ||
    isValidated ||
    allAllocsPaid ||
    (tokenPaidINR >= tokenRequiredINR && tokenRequiredINR > 0);
  const isAwaitingToken =
    !isPendingAllocation &&
    !isPoStarted &&
    !isValidated &&
    !allAllocsPaid &&
    (order.status === 'AWAITING_TOKEN_PAYMENT' || !isTokenPaid);

  let step = 1;
  let stageLabel = '1. PO Created';
  if (isValidated) {
    step = 4;
    stageLabel = '4. Validated ✓';
  } else if (isPoStarted) {
    step = 3;
    stageLabel = '3. PO Started';
  } else if (isAwaitingToken) {
    step = 2;
    stageLabel = '2. Awaiting Token Payment';
  } else if (!isPendingAllocation) {
    step = 2;
    stageLabel = '2. Products Allocated';
  }

  const isExpired = order.status === 'EXPIRED';
  const canReorder = remaining > 0 && !isExpired && isValidated && !['CANCELLED', 'REJECTED'].includes(order.status);
  const canRequestRefund = tokenBalanceINR > 0 && (isExpired || remaining === 0);

  return (
    <div
      className="rounded-3xl border-2 p-5 sm:p-6 shadow-xs flex flex-col justify-between gap-5 relative overflow-hidden transition-all hover:shadow-lg bg-white"
      style={{
        borderColor: isPendingAllocation
          ? 'rgba(245, 158, 11, 0.4)'
          : isAwaitingToken
          ? 'rgba(249, 115, 22, 0.4)'
          : isPoStarted
          ? 'rgba(59, 130, 246, 0.4)'
          : '#e2e8f0',
      }}
    >
      <div className="space-y-4">
        {/* Row 1: PO Number, Creator Badge, Category Badge & Status */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono font-black text-sm text-slate-900 px-2.5 py-1 rounded-xl bg-slate-100 border border-slate-200">
              {order.po_number}
            </span>

            {/* Created By Badge */}
            <span
              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-black border ${
                isBdeCreated
                  ? 'bg-amber-500/10 text-amber-700 border-amber-500/30'
                  : 'bg-blue-500/10 text-blue-700 border-blue-500/30'
              }`}
            >
              {isBdeCreated ? <Users className="w-3 h-3" /> : <Shield className="w-3 h-3" />}
              {creatorDisplay}
            </span>

            {isCombine ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-black bg-purple-50 text-purple-700 border border-purple-200">
                <Users className="w-3 h-3" /> Combine PO ({(item.epc_allocations || []).length} EPCs)
              </span>
            ) : singleEpcAlloc ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-black bg-blue-50 text-blue-700 border border-blue-200">
                <UserCheck className="w-3 h-3" /> Single PO ({singleEpcAlloc.company_name || '1 EPC'})
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-black bg-slate-100 text-slate-700 border border-slate-200">
                <Package className="w-3 h-3" /> Single PO (Warehouse Stock)
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <StatusBadge status={order.status} />
          </div>
        </div>

        {/* Row 2: 4-Step Lifecycle Stepper */}
        <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
          <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-wider text-slate-500">
            <span>PO Lifecycle Stage</span>
            <span className="text-blue-600 font-extrabold">{stageLabel}</span>
          </div>
          <div className="grid grid-cols-4 gap-1.5 text-center">
            <div
              className={`p-1.5 rounded-xl border text-[10px] font-bold ${
                step >= 1
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700'
                  : 'bg-white border-slate-200 text-slate-400'
              }`}
            >
              1. Created ✓
            </div>
            <div
              className={`p-1.5 rounded-xl border text-[10px] font-bold ${
                step >= 2
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700'
                  : step === 1
                  ? 'bg-amber-500/15 border-amber-500/40 text-amber-700 font-black animate-pulse'
                  : 'bg-white border-slate-200 text-slate-400'
              }`}
            >
              2. Allocate {step >= 2 ? '✓' : '⚡'}
            </div>
            <div
              className={`p-1.5 rounded-xl border text-[10px] font-bold ${
                step >= 3
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700'
                  : step === 2
                  ? 'bg-orange-500/15 border-orange-500/40 text-orange-700 font-black animate-pulse'
                  : 'bg-white border-slate-200 text-slate-400'
              }`}
            >
              3. Token Pay {step >= 3 ? '✓' : '🔒'}
            </div>
            <div
              className={`p-1.5 rounded-xl border text-[10px] font-bold ${
                step >= 4
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700'
                  : step === 3
                  ? 'bg-blue-500/15 border-blue-500/40 text-blue-700 font-black'
                  : 'bg-white border-slate-200 text-slate-400'
              }`}
            >
              4. Validated {step >= 4 ? '✓' : '⏳'}
            </div>
          </div>
        </div>

        {/* Row 3: Franchisee & EPC Details */}
        <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
          <div>
            <div className="text-[10px] font-black uppercase tracking-wider text-slate-400">
              Franchisee & Beneficiary
            </div>
            <div className="font-bold text-slate-900 mt-0.5">{franchiseName}</div>
            <div className="text-[11px] text-slate-500">
              {franchiseLocation} •{' '}
              {isCombine
                ? `${(item.epc_allocations || []).length} Pooled EPCs`
                : singleEpcAlloc
                ? `Allocated: ${singleEpcAlloc.company_name}`
                : 'Direct Warehouse Stock'}
            </div>
          </div>
          <div className="text-left sm:text-right text-[11px] text-slate-400">
            <div>Created: {new Date(order.created_at).toLocaleDateString('en-IN')}</div>
            {order.lock_expires_at && (
              <div className="text-blue-600 font-bold">
                Lock Valid: {new Date(order.lock_expires_at).toLocaleDateString('en-IN')}
              </div>
            )}
          </div>
        </div>

        {/* Row 4: Product & Rate Lock Info */}
        <div className="space-y-1.5">
          <div className="flex justify-between items-baseline text-xs">
            <span className="font-bold text-slate-900">
              {item.item_name || (
                <span className="text-amber-600 font-bold flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" /> Stage 2: Product Allocation Required
                </span>
              )}
            </span>
            {item.unit_price_paise && (
              <span className="font-black text-slate-900">
                ₹{Math.round(item.unit_price_paise / 100).toLocaleString('en-IN')}
                <span className="text-[10px] font-normal text-slate-500"> /kit</span>
              </span>
            )}
          </div>

          {isValidated && (
            <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-800 text-[10px] font-bold">
              <Lock className="w-3 h-3 text-emerald-600" /> Guaranteed Price Lock Active (30 Days)
            </div>
          )}
        </div>

        {/* Row 5: Fulfillment Progress Bar */}
        <div className="space-y-1.5 pt-1">
          <div className="flex justify-between items-center text-xs font-bold">
            <span className="text-slate-500">
              Quota Fulfillment: <strong className="text-slate-900">{fulfilled}</strong> / {booked} Kits
            </span>
            <span className="text-blue-600 font-black">{progressPct}%</span>
          </div>
          <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-200">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                progressPct >= 100 ? 'bg-emerald-500' : 'bg-blue-600'
              }`}
              style={{ width: `${Math.min(100, progressPct)}%` }}
            />
          </div>
          <div className="flex justify-between text-[11px] text-slate-400">
            <span>Remaining Drawdown: {remaining} kits</span>
            <span>Committed: {booked} kits</span>
          </div>
        </div>

        {/* Row 6: Token Commercial Breakdown Strip */}
        <div className="grid grid-cols-3 gap-2 p-3 rounded-2xl bg-slate-50 border border-slate-200 text-center text-xs">
          <div>
            <div className="text-[10px] font-bold uppercase text-slate-400">Token Required</div>
            <div className="font-black text-slate-800 mt-0.5">₹{tokenRequiredINR.toLocaleString('en-IN')}</div>
          </div>
          <div>
            <div className="text-[10px] font-bold uppercase text-slate-400">Token Paid</div>
            <div
              className={`font-black mt-0.5 ${
                tokenPaidINR >= tokenRequiredINR && tokenRequiredINR > 0 ? 'text-emerald-600' : 'text-slate-700'
              }`}
            >
              ₹{tokenPaidINR.toLocaleString('en-IN')}
            </div>
          </div>
          <div>
            <div className="text-[10px] font-bold uppercase text-slate-400">Token Balance</div>
            <div className="font-black text-blue-600 mt-0.5">₹{tokenBalanceINR.toLocaleString('en-IN')}</div>
          </div>
        </div>
      </div>

      {/* Row 7: Action Buttons according to Stage */}
      <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
        <button
          onClick={onSelectOrder}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
        >
          <Eye className="w-3.5 h-3.5 text-slate-500" />
          <span>Full Details</span>
        </button>

        <div className="flex flex-wrap items-center gap-2">
          {isPendingAllocation && (
            <button
              onClick={onOpenAllocate}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 text-white text-xs font-black shadow-sm hover:bg-amber-600 transition cursor-pointer animate-pulse"
            >
              <Package className="w-3.5 h-3.5" />
              <span>Allocate Products (Stage 2) →</span>
            </button>
          )}

          {isAwaitingToken && (
            <button
              onClick={onOpenToken}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-orange-600 text-white text-xs font-black shadow-sm hover:bg-orange-700 transition cursor-pointer"
            >
              <DollarSign className="w-3.5 h-3.5" />
              <span>Record Token Payment →</span>
            </button>
          )}

          {isPoStarted && !isValidated && (
            <button
              onClick={onValidateOrder}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-black shadow-sm hover:bg-blue-700 transition cursor-pointer"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Validate PO Now</span>
            </button>
          )}

          {canReorder && (
            <button
              onClick={onOpenReorder}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-black shadow-sm hover:bg-blue-700 transition cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Drawdown Reorder</span>
            </button>
          )}

          {canRequestRefund && (
            <button
              onClick={onOpenRefund}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-rose-200 bg-rose-50 text-rose-700 text-xs font-black hover:bg-rose-100 transition cursor-pointer"
            >
              <DollarSign className="w-3.5 h-3.5" />
              <span>Request Refund</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
