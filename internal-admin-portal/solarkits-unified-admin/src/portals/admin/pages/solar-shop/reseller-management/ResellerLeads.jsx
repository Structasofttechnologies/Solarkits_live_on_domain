import { useState, useEffect, useMemo, useCallback } from "react";
import { useDispatch } from "react-redux";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import {
  FiUsers,
  FiSearch,
  FiFilter,
  FiEye,
  FiPhone,
  FiMail,
  FiMapPin,
  FiCheckCircle,
  FiClock,
  FiXCircle,
  FiAlertCircle,
  FiDownload,
  FiPlus,
  FiTrash2,
  FiMessageSquare,
  FiExternalLink,
  FiCopy,
  FiCheck,
  FiX,
  FiFileText,
  FiBriefcase,
  FiLayers,
  FiSend,
  FiRefreshCw,
  FiLoader,
} from "react-icons/fi";
import { FaWhatsapp, FaBuilding } from "react-icons/fa";
import { authHeaderObj } from "@/app/authHeader";
import { setAlert } from "../../../features/alert.slice";

const API_BASE = import.meta.env.VITE_API_URL;
const MODULE_UID = "RSL_MGMT";
const STORAGE_KEY = "solarkits_crm_leads";

// Initial realistic seed leads matching the form structure
const INITIAL_DEMO_LEADS = [
  {
    id: "LEAD-1724213890101",
    actionType: "franchise_apply",
    selectedSolution: "Header Fast Application",
    fullName: "Ramesh Chandra",
    businessName: "Chandra Solar & Electricals",
    mobileNumber: "9876543210",
    whatsappNumber: "9876543210",
    email: "ramesh@chandrasolar.com",
    gstin: "27AAAAA0000A1Z5",
    state: "Maharashtra",
    district: "Pune",
    pincode: "411001",
    businessProfile: "Solar EPC Contractor",
    expectedOrderQty: "1 - 3 Kits / Month (Starter)",
    notes: "Looking for 550W Mono PERC DCR kits with 5kW-10kW On-grid inverters. Target MSEDCL rooftop scheme.",
    consent: true,
    status: "NEW",
    submittedAt: "2026-08-21T08:30:00.000Z",
    adminRemarks: "New application from Pune. High intent for rooftop EPC supply.",
  },
  {
    id: "LEAD-1724213890102",
    actionType: "franchise_apply",
    selectedSolution: "District Franchisee Plan",
    fullName: "Suresh Sharma",
    businessName: "Sharma Power & Green Energy",
    mobileNumber: "9823456789",
    whatsappNumber: "9823456789",
    email: "suresh@sharmapower.in",
    gstin: "24AAACS1234F1Z8",
    state: "Gujarat",
    district: "Surat",
    pincode: "395007",
    businessProfile: "Solar Retailer",
    expectedOrderQty: "4 - 10 Kits / Month (Growth)",
    notes: "Requires exclusive district distribution rights for Surat & Navsari. Ready with commercial warehouse.",
    consent: true,
    status: "IN_REVIEW",
    submittedAt: "2026-08-20T14:15:00.000Z",
    adminRemarks: "Initial call done. Sent product catalog and franchise terms document.",
  },
  {
    id: "LEAD-1724213890103",
    actionType: "franchise_apply",
    selectedSolution: "State Franchisee Plan",
    fullName: "Vikram Malhotra",
    businessName: "V-Tech Energy Solutions Pvt Ltd",
    mobileNumber: "9811122334",
    whatsappNumber: "9811122334",
    email: "vikram@vtechenergy.com",
    gstin: "07AABCV5678G1Z2",
    state: "Delhi",
    district: "New Delhi",
    pincode: "110001",
    businessProfile: "Hardware & Electrical Distributor",
    expectedOrderQty: "10+ Kits / Month (Enterprise)",
    notes: "Interested in state master dealership and sub-dealer network deployment across Delhi-NCR.",
    consent: true,
    status: "APPROVED_CONVERTED",
    submittedAt: "2026-08-19T11:00:00.000Z",
    adminRemarks: "Agreement signed, onboarding completed into Franchisee Accounts.",
  },
  {
    id: "LEAD-1724213890104",
    actionType: "franchise_apply",
    selectedSolution: "Header Fast Application",
    fullName: "Pooja Reddy",
    businessName: "Reddy Solar Systems",
    mobileNumber: "9988776655",
    whatsappNumber: "9988776655",
    email: "pooja@reddysolar.co.in",
    gstin: "36AAECR9988H1ZV",
    state: "Telangana",
    district: "Hyderabad",
    pincode: "500034",
    businessProfile: "Rooftop Solar Installer",
    expectedOrderQty: "1 - 3 Kits / Month (Starter)",
    notes: "Interested in residential 3kW/5kW hybrid kits with Lithium battery storage.",
    consent: true,
    status: "CONTACTED",
    submittedAt: "2026-08-18T16:45:00.000Z",
    adminRemarks: "WhatsApp introduction sent. Awaiting quotation confirmation.",
  },
  {
    id: "LEAD-1724213890105",
    actionType: "franchise_apply",
    selectedSolution: "District Franchisee Plan",
    fullName: "Anand Kumar Verma",
    businessName: "Verma Electricals & Solar",
    mobileNumber: "9456123789",
    whatsappNumber: "9456123789",
    email: "anand.verma@gmail.com",
    gstin: "09AAFFV4433K1Z3",
    state: "Uttar Pradesh",
    district: "Lucknow",
    pincode: "226010",
    businessProfile: "Electrical Trader",
    expectedOrderQty: "1 - 3 Kits / Month (Starter)",
    notes: "Looking to expand retail shop with complete Solar Kits inventory.",
    consent: true,
    status: "NEW",
    submittedAt: "2026-08-21T06:20:00.000Z",
    adminRemarks: "Fresh lead from UP. Assign to North Regional Manager.",
  },
];

const STATUS_CONFIG = {
  ALL: { label: "All Leads", color: "bg-surface-hover text-text-primary" },
  NEW: { label: "New Lead", bg: "bg-danger-soft", text: "text-danger", border: "border-danger/20", icon: FiAlertCircle },
  CONTACTED: { label: "Contacted", bg: "bg-info-soft", text: "text-info", border: "border-info/20", icon: FiClock },
  IN_REVIEW: { label: "In Review", bg: "bg-warning-soft", text: "text-warning", border: "border-warning/20", icon: FiClock },
  APPROVED_CONVERTED: { label: "Converted", bg: "bg-success-soft", text: "text-success", border: "border-success/20", icon: FiCheckCircle },
  REJECTED: { label: "Rejected", bg: "bg-surface-hover", text: "text-text-muted", border: "border-border", icon: FiXCircle },
};

const BUSINESS_PROFILES = [
  "Solar EPC Contractor",
  "Solar Retailer",
  "Electrical Trader",
  "Rooftop Solar Installer",
  "Hardware & Electrical Distributor",
  "System Integrator",
  "New Solar Entrepreneur",
];

const ORDER_VOLUMES = [
  "1 - 3 Kits / Month (Starter)",
  "4 - 10 Kits / Month (Growth)",
  "10+ Kits / Month (Enterprise)",
];

const INDIAN_STATES = [
  "Maharashtra",
  "Gujarat",
  "Rajasthan",
  "Delhi",
  "Uttar Pradesh",
  "Karnataka",
  "Tamil Nadu",
  "Telangana",
  "Madhya Pradesh",
  "Haryana",
  "Punjab",
  "Kerala",
  "West Bengal",
  "Odisha",
  "Bihar",
  "Andhra Pradesh",
];

export default function ResellerLeads() {
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);

  // Load leads from localStorage + demo seeds as initial cache
  const [leads, setLeads] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn("Error reading local leads:", e);
    }
    return INITIAL_DEMO_LEADS;
  });

  // Fetch leads from backend API
  const fetchLeads = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get(
        `${API_BASE}/resellers/leads/list?req_for=view&unique_id=${MODULE_UID}`,
        { headers: authHeaderObj() }
      );
      if (res.data?.status === "success" && Array.isArray(res.data.data?.leads)) {
        setLeads(res.data.data.leads);
      }
    } catch (err) {
      console.warn("Live leads fetch note, using cached leads:", err?.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  // Save to localStorage when state updates
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(leads));
    } catch (e) {
      console.warn("Error saving leads to localStorage:", e);
    }
  }, [leads]);

  // Filters & Search
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [stateFilter, setStateFilter] = useState("ALL");
  const [profileFilter, setProfileFilter] = useState("ALL");

  // Selected lead for detail view modal
  const [selectedLead, setSelectedLead] = useState(null);

  // Manual Add Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    businessName: "",
    mobileNumber: "",
    whatsappNumber: "",
    email: "",
    gstin: "",
    state: "Maharashtra",
    district: "",
    pincode: "",
    businessProfile: "Solar EPC Contractor",
    expectedOrderQty: "1 - 3 Kits / Month (Starter)",
    selectedSolution: "Header Fast Application",
    notes: "",
    consent: true,
  });

  // Copy helper
  const [copiedId, setCopiedId] = useState(null);
  const handleCopy = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    dispatch(setAlert({ type: "info", message: `Copied "${text}" to clipboard` }));
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Status Change Handler
  const handleStatusChange = async (leadId, newStatus) => {
    setLeads((prev) =>
      prev.map((l) => (l.id === leadId ? { ...l, status: newStatus } : l))
    );
    if (selectedLead?.id === leadId) {
      setSelectedLead((prev) => ({ ...prev, status: newStatus }));
    }

    try {
      await axios.put(
        `${API_BASE}/resellers/leads/${leadId}/status?req_for=edit&unique_id=${MODULE_UID}`,
        { status: newStatus },
        { headers: authHeaderObj() }
      );
    } catch (err) {
      console.warn("Status update API note:", err?.message);
    }

    dispatch(
      setAlert({
        type: "success",
        message: `Lead status updated to ${STATUS_CONFIG[newStatus]?.label || newStatus}`,
      })
    );
  };

  // Admin Remark Save Handler
  const handleSaveRemarks = async (leadId, remarks) => {
    setLeads((prev) =>
      prev.map((l) => (l.id === leadId ? { ...l, adminRemarks: remarks } : l))
    );
    if (selectedLead?.id === leadId) {
      setSelectedLead((prev) => ({ ...prev, adminRemarks: remarks }));
    }

    try {
      await axios.put(
        `${API_BASE}/resellers/leads/${leadId}/status?req_for=edit&unique_id=${MODULE_UID}`,
        { admin_remarks: remarks },
        { headers: authHeaderObj() }
      );
    } catch (err) {
      console.warn("Remarks save API note:", err?.message);
    }

    dispatch(setAlert({ type: "success", message: "Admin remarks saved" }));
  };

  // Delete Lead Handler
  const handleDeleteLead = async (leadId) => {
    if (window.confirm("Are you sure you want to delete this lead?")) {
      setLeads((prev) => prev.filter((l) => (l.id || l._id) !== leadId));
      if ((selectedLead?.id || selectedLead?._id) === leadId) setSelectedLead(null);

      try {
        await axios.delete(
          `${API_BASE}/resellers/leads/${leadId}?req_for=delete&unique_id=${MODULE_UID}`,
          { headers: authHeaderObj(), data: { id: leadId } }
        );
      } catch (err) {
        console.warn("Delete API note:", err?.message);
      }

      dispatch(setAlert({ type: "info", message: "Lead removed from system" }));
    }
  };

  // Manual Add Form Submit
  const handleCreateLead = async (e) => {
    e.preventDefault();
    if (!formData.fullName.trim() || !formData.mobileNumber.trim()) {
      dispatch(setAlert({ type: "error", message: "Name and Mobile number are required" }));
      return;
    }

    const newLead = {
      id: `LEAD-${Date.now()}`,
      actionType: "franchise_apply",
      ...formData,
      status: "NEW",
      submittedAt: new Date().toISOString(),
      adminRemarks: "Manually recorded by Admin.",
    };

    setLeads((prev) => [newLead, ...prev]);
    setIsAddModalOpen(false);

    try {
      await axios.post(
        `${API_BASE}/resellers/leads/add?req_for=add&unique_id=${MODULE_UID}`,
        formData,
        { headers: authHeaderObj() }
      );
    } catch (err) {
      console.warn("Manual add API note:", err?.message);
    }

    setFormData({
      fullName: "",
      businessName: "",
      mobileNumber: "",
      whatsappNumber: "",
      email: "",
      gstin: "",
      state: "Maharashtra",
      pincode: "",
      businessProfile: "Solar EPC Contractor",
      expectedOrderQty: "1 - 3 Kits / Month (Starter)",
      selectedSolution: "Header Fast Application",
      notes: "",
      consent: true,
    });
    dispatch(setAlert({ type: "success", message: "New Franchisee Lead recorded successfully!" }));
  };

  // Export CSV
  const handleExportCSV = () => {
    if (filteredLeads.length === 0) {
      dispatch(setAlert({ type: "warning", message: "No leads to export" }));
      return;
    }

    const headers = [
      "Lead ID",
      "Full Name",
      "Business Name",
      "Mobile",
      "WhatsApp",
      "Email",
      "GSTIN",
      "State",
      "District",
      "Pincode",
      "Business Profile",
      "Expected Volume",
      "Selected Solution",
      "Status",
      "Specific Remarks",
      "Admin Notes",
      "Submitted Date",
    ];

    const rows = filteredLeads.map((l) => [
      l.id,
      `"${(l.fullName || "").replace(/"/g, '""')}"`,
      `"${(l.businessName || "").replace(/"/g, '""')}"`,
      l.mobileNumber || "",
      l.whatsappNumber || "",
      l.email || "",
      l.gstin || "",
      l.state || "",
      l.district || "",
      l.pincode || "",
      `"${(l.businessProfile || "").replace(/"/g, '""')}"`,
      `"${(l.expectedOrderQty || "").replace(/"/g, '""')}"`,
      `"${(l.selectedSolution || "").replace(/"/g, '""')}"`,
      l.status || "NEW",
      `"${(l.notes || "").replace(/"/g, '""')}"`,
      `"${(l.adminRemarks || "").replace(/"/g, '""')}"`,
      l.submittedAt || "",
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `solarkits_franchisee_leads_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    dispatch(setAlert({ type: "success", message: `Exported ${filteredLeads.length} leads to CSV` }));
  };

  // Metrics Calculation
  const stats = useMemo(() => {
    const total = leads.length;
    const newCount = leads.filter((l) => l.status === "NEW").length;
    const inReviewCount = leads.filter((l) => l.status === "IN_REVIEW" || l.status === "CONTACTED").length;
    const convertedCount = leads.filter((l) => l.status === "APPROVED_CONVERTED").length;
    return { total, newCount, inReviewCount, convertedCount };
  }, [leads]);

  // Filtered Leads
  const filteredLeads = useMemo(() => {
    return leads.filter((item) => {
      const matchesSearch =
        search === "" ||
        (item.fullName || "").toLowerCase().includes(search.toLowerCase()) ||
        (item.businessName || "").toLowerCase().includes(search.toLowerCase()) ||
        (item.mobileNumber || "").includes(search) ||
        (item.whatsappNumber || "").includes(search) ||
        (item.email || "").toLowerCase().includes(search.toLowerCase()) ||
        (item.district || "").toLowerCase().includes(search.toLowerCase()) ||
        (item.gstin || "").toLowerCase().includes(search.toLowerCase());

      const matchesStatus = statusFilter === "ALL" || item.status === statusFilter;
      const matchesState = stateFilter === "ALL" || item.state === stateFilter;
      const matchesProfile = profileFilter === "ALL" || item.businessProfile === profileFilter;

      return matchesSearch && matchesStatus && matchesState && matchesProfile;
    });
  }, [leads, search, statusFilter, stateFilter, profileFilter]);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-primary/10 text-primary">
              <FiUsers size={22} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-text-primary">
                Franchisee Application Leads
              </h1>
              <p className="text-sm text-text-muted mt-0.5">
                Incoming partner applications, territory inquiries, and B2B franchise requests
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={fetchLeads}
            disabled={loading}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-border bg-surface text-text-secondary hover:text-text-primary hover:bg-surface-hover text-sm font-medium transition-all shadow-sm disabled:opacity-50"
            title="Refresh Leads from Database"
          >
            <FiRefreshCw size={16} className={loading ? "animate-spin text-primary" : ""} />
            <span>{loading ? "Refreshing..." : "Refresh"}</span>
          </button>

          <button
            type="button"
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-border bg-surface text-text-secondary hover:text-text-primary hover:bg-surface-hover text-sm font-medium transition-all shadow-sm"
            title="Download CSV"
          >
            <FiDownload size={16} />
            <span>Export CSV</span>
          </button>

          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary-hover transition-all shadow-md shadow-primary/20 hover:shadow-lg hover:shadow-primary/30"
          >
            <FiPlus size={16} />
            <span>Add Manual Lead</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-surface p-5 rounded-2xl border border-border shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-text-muted uppercase tracking-wider">Total Leads</p>
            <p className="text-2xl font-black text-text-primary mt-1">{stats.total}</p>
            <p className="text-xs text-text-muted mt-0.5">All channel submissions</p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
            <FiLayers size={20} />
          </div>
        </div>

        <div className="bg-surface p-5 rounded-2xl border border-border shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-danger uppercase tracking-wider">New Action Required</p>
            <p className="text-2xl font-black text-danger mt-1">{stats.newCount}</p>
            <p className="text-xs text-text-muted mt-0.5">Awaiting first contact</p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-danger-soft text-danger flex items-center justify-center">
            <FiAlertCircle size={20} />
          </div>
        </div>

        <div className="bg-surface p-5 rounded-2xl border border-border shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-warning uppercase tracking-wider">In Discussion</p>
            <p className="text-2xl font-black text-warning mt-1">{stats.inReviewCount}</p>
            <p className="text-xs text-text-muted mt-0.5">Under territory evaluation</p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-warning-soft text-warning flex items-center justify-center">
            <FiClock size={20} />
          </div>
        </div>

        <div className="bg-surface p-5 rounded-2xl border border-border shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-success uppercase tracking-wider">Converted Partners</p>
            <p className="text-2xl font-black text-success mt-1">{stats.convertedCount}</p>
            <p className="text-xs text-text-muted mt-0.5">Approved & onboarded</p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-success-soft text-success flex items-center justify-center">
            <FiCheckCircle size={20} />
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-surface p-4 rounded-2xl border border-border shadow-sm space-y-4">
        {/* Status Filter Tabs */}
        <div className="flex flex-wrap gap-2 pb-2 border-b border-border">
          {Object.entries(STATUS_CONFIG).map(([key, cfg]) => {
            const isSel = statusFilter === key;
            const count =
              key === "ALL"
                ? leads.length
                : leads.filter((l) => l.status === key).length;

            return (
              <button
                key={key}
                onClick={() => setStatusFilter(key)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  isSel
                    ? "bg-primary text-white shadow-sm"
                    : "bg-bg text-text-secondary hover:text-text-primary hover:bg-surface-hover border border-border"
                }`}
              >
                <span>{cfg.label}</span>
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                    isSel ? "bg-white/25 text-white" : "bg-surface text-text-muted"
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search and Dropdown Controls */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" size={16} />
            <input
              type="text"
              placeholder="Search by Name, Company, Mobile, Email, GSTIN, District..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-border bg-bg text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
            />
          </div>

          <div className="flex gap-2 flex-wrap sm:flex-nowrap">
            <select
              value={stateFilter}
              onChange={(e) => setStateFilter(e.target.value)}
              className="px-3 py-2 rounded-xl border border-border bg-bg text-text-primary text-xs font-medium focus:outline-none focus:border-primary transition-all min-w-[140px]"
            >
              <option value="ALL">All States</option>
              {INDIAN_STATES.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>

            <select
              value={profileFilter}
              onChange={(e) => setProfileFilter(e.target.value)}
              className="px-3 py-2 rounded-xl border border-border bg-bg text-text-primary text-xs font-medium focus:outline-none focus:border-primary transition-all min-w-[160px]"
            >
              <option value="ALL">All Business Profiles</option>
              {BUSINESS_PROFILES.map((bp) => (
                <option key={bp} value={bp}>
                  {bp}
                </option>
              ))}
            </select>

            {(search || statusFilter !== "ALL" || stateFilter !== "ALL" || profileFilter !== "ALL") && (
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setStatusFilter("ALL");
                  setStateFilter("ALL");
                  setProfileFilter("ALL");
                }}
                className="px-3 py-2 rounded-xl border border-border text-xs text-text-muted hover:text-danger hover:bg-danger-soft transition-all"
                title="Reset Filters"
              >
                Reset
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Leads Table */}
      <div className="bg-surface rounded-2xl border border-border shadow-sm overflow-hidden">
        {filteredLeads.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-center p-6">
            <div className="w-14 h-14 rounded-full bg-surface-hover flex items-center justify-center">
              <FiUsers size={24} className="text-text-muted" />
            </div>
            <div>
              <p className="text-sm font-semibold text-text-primary">No Franchisee Leads Match Your Filters</p>
              <p className="text-xs text-text-muted mt-1">
                Try adjusting your search criteria or click "Add Manual Lead" to create a new one.
              </p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-bg text-xs">
                  <th className="text-left text-text-muted font-semibold px-5 py-3.5">Applicant & Business</th>
                  <th className="text-left text-text-muted font-semibold px-5 py-3.5">Contact Details</th>
                  <th className="text-left text-text-muted font-semibold px-5 py-3.5">Target Territory</th>
                  <th className="text-left text-text-muted font-semibold px-5 py-3.5">Profile & Volume</th>
                  <th className="text-center text-text-muted font-semibold px-4 py-3.5">Status</th>
                  <th className="text-left text-text-muted font-semibold px-4 py-3.5">Date</th>
                  <th className="text-right text-text-muted font-semibold px-5 py-3.5">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                <AnimatePresence>
                  {filteredLeads.map((lead) => {
                    const statusCfg = STATUS_CONFIG[lead.status] || STATUS_CONFIG.NEW;
                    const StatusIcon = statusCfg.icon || FiClock;
                    const formattedDate = lead.submittedAt
                      ? new Date(lead.submittedAt).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })
                      : "Recent";

                    return (
                      <motion.tr
                        key={lead.id}
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="hover:bg-surface-hover/80 transition-colors"
                      >
                        {/* Applicant & Business */}
                        <td className="px-5 py-4">
                          <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary font-bold flex items-center justify-center shrink-0 uppercase text-xs">
                              {lead.fullName
                                ? lead.fullName
                                    .split(" ")
                                    .map((n) => n[0])
                                    .slice(0, 2)
                                    .join("")
                                : "FL"}
                            </div>
                            <div className="space-y-1">
                              <div className="font-bold text-text-primary flex items-center gap-2">
                                <span>{lead.fullName}</span>
                                {lead.selectedSolution && (
                                  <span className="px-2 py-0.5 rounded-md bg-info-soft text-primary text-[10px] font-bold">
                                    {lead.selectedSolution}
                                  </span>
                                )}
                              </div>

                              <div className="text-xs text-text-secondary flex items-center gap-1.5 font-medium">
                                <FaBuilding className="text-text-muted" size={11} />
                                <span>{lead.businessName || "Individual Applicant"}</span>
                              </div>

                              {lead.gstin && (
                                <div className="text-[10px] text-text-muted font-mono bg-bg px-1.5 py-0.5 rounded border border-border inline-block">
                                  GST: {lead.gstin}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Contact Details */}
                        <td className="px-5 py-4">
                          <div className="space-y-1.5 text-xs">
                            {/* Phone with Call Link */}
                            <div className="flex items-center gap-2">
                              <a
                                href={`tel:${lead.mobileNumber}`}
                                className="flex items-center gap-1 font-semibold text-text-primary hover:text-primary transition"
                              >
                                <FiPhone size={12} className="text-primary" />
                                <span>+91 {lead.mobileNumber}</span>
                              </a>
                              <button
                                type="button"
                                onClick={() => handleCopy(lead.mobileNumber, `phone-${lead.id}`)}
                                className="text-text-muted hover:text-text-primary"
                                title="Copy Number"
                              >
                                {copiedId === `phone-${lead.id}` ? <FiCheck size={12} className="text-success" /> : <FiCopy size={12} />}
                              </button>
                            </div>

                            {/* WhatsApp with Direct Link */}
                            {lead.whatsappNumber && (
                              <div className="flex items-center gap-2">
                                <a
                                  href={`https://wa.me/91${lead.whatsappNumber}?text=Hi%20${encodeURIComponent(
                                    lead.fullName
                                  )},%20thank%20you%20for%20applying%20for%20the%20SolarKits%20Franchise%20Partner%20Program.`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold text-[11px] hover:bg-emerald-100 transition"
                                >
                                  <FaWhatsapp size={12} className="text-emerald-600" />
                                  <span>WhatsApp</span>
                                </a>
                              </div>
                            )}

                            {/* Email */}
                            {lead.email && (
                              <div className="flex items-center gap-1 text-text-muted text-[11px]">
                                <FiMail size={11} />
                                <span className="truncate max-w-[170px]">{lead.email}</span>
                              </div>
                            )}
                          </div>
                        </td>

                        {/* Target Territory */}
                        <td className="px-5 py-4">
                          <div className="space-y-1">
                            <div className="font-semibold text-text-primary flex items-center gap-1.5 text-xs">
                              <FiMapPin className="text-danger shrink-0" size={13} />
                              <span>{lead.district ? `${lead.district}, ${lead.state}` : lead.state}</span>
                            </div>
                            {lead.pincode && (
                              <p className="text-[11px] text-text-muted font-mono pl-4">
                                PIN: {lead.pincode}
                              </p>
                            )}
                          </div>
                        </td>

                        {/* Profile & Volume */}
                        <td className="px-5 py-4">
                          <div className="space-y-1">
                            <span className="inline-block px-2.5 py-0.5 rounded-lg bg-bg border border-border text-xs font-semibold text-text-secondary">
                              {lead.businessProfile || "Solar Partner"}
                            </span>
                            {lead.expectedOrderQty && (
                              <p className="text-[11px] text-text-muted font-medium">
                                Vol: <strong className="text-text-primary">{lead.expectedOrderQty}</strong>
                              </p>
                            )}
                          </div>
                        </td>

                        {/* Status with Inline Dropdown */}
                        <td className="px-4 py-4 text-center">
                          <select
                            value={lead.status || "NEW"}
                            onChange={(e) => handleStatusChange(lead.id, e.target.value)}
                            className={`px-2.5 py-1 rounded-full text-xs font-bold border focus:outline-none transition-all cursor-pointer ${statusCfg.bg} ${statusCfg.text} ${statusCfg.border}`}
                          >
                            <option value="NEW">New Lead</option>
                            <option value="CONTACTED">Contacted</option>
                            <option value="IN_REVIEW">In Review</option>
                            <option value="APPROVED_CONVERTED">Converted</option>
                            <option value="REJECTED">Rejected</option>
                          </select>
                        </td>

                        {/* Date */}
                        <td className="px-4 py-4 text-xs text-text-muted whitespace-nowrap">
                          {formattedDate}
                        </td>

                        {/* Actions */}
                        <td className="px-5 py-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => setSelectedLead(lead)}
                              title="View Full Application Details"
                              className="p-2 rounded-xl text-primary bg-primary/10 hover:bg-primary hover:text-white transition-all shadow-sm"
                            >
                              <FiEye size={15} />
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDeleteLead(lead.id)}
                              title="Delete Lead"
                              className="p-2 rounded-xl text-text-muted hover:text-danger hover:bg-danger-soft transition-all"
                            >
                              <FiTrash2 size={15} />
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    );
                  })}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── DETAIL MODAL / DRAWER ────────────────────────────────────────── */}
      <AnimatePresence>
        {selectedLead && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-surface rounded-3xl shadow-2xl border border-border w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"
            >
              {/* Modal Header */}
              <div className="p-6 border-b border-border bg-bg/50 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-primary/10 text-primary">
                      {selectedLead.selectedSolution || "Franchise Lead"}
                    </span>
                    <span className="text-xs text-text-muted font-mono">{selectedLead.id}</span>
                  </div>
                  <h3 className="text-xl font-bold text-text-primary mt-1">{selectedLead.fullName}</h3>
                  <p className="text-xs text-text-secondary">
                    {selectedLead.businessName} • {selectedLead.businessProfile}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedLead(null)}
                  className="p-2 rounded-xl text-text-muted hover:bg-surface-hover hover:text-text-primary transition"
                >
                  <FiX size={20} />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 space-y-5 overflow-y-auto max-h-[70vh]">
                {/* Status Bar */}
                <div className="flex items-center justify-between p-4 rounded-2xl bg-bg border border-border">
                  <div>
                    <p className="text-xs font-semibold text-text-muted">Current Application Status</p>
                    <p className="text-sm font-bold text-text-primary mt-0.5">
                      {STATUS_CONFIG[selectedLead.status]?.label || selectedLead.status}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <select
                      value={selectedLead.status}
                      onChange={(e) => handleStatusChange(selectedLead.id, e.target.value)}
                      className="px-3 py-1.5 rounded-xl border border-border bg-surface text-xs font-bold text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                    >
                      <option value="NEW">New Lead</option>
                      <option value="CONTACTED">Contacted</option>
                      <option value="IN_REVIEW">In Review</option>
                      <option value="APPROVED_CONVERTED">Converted to Franchisee</option>
                      <option value="REJECTED">Rejected</option>
                    </select>
                  </div>
                </div>

                {/* Direct Action Buttons */}
                <div className="grid grid-cols-2 gap-3">
                  <a
                    href={`https://wa.me/91${selectedLead.whatsappNumber || selectedLead.mobileNumber}?text=Hi%20${encodeURIComponent(
                      selectedLead.fullName
                    )},%20regarding%20your%20SolarKits%20franchise%20application%20for%20${encodeURIComponent(
                      selectedLead.district || selectedLead.state
                    )}...`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 py-3 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition shadow-sm"
                  >
                    <FaWhatsapp size={16} />
                    <span>WhatsApp Applicant</span>
                  </a>

                  <a
                    href={`tel:${selectedLead.mobileNumber}`}
                    className="flex items-center justify-center gap-2 py-3 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary-hover transition shadow-sm"
                  >
                    <FiPhone size={16} />
                    <span>Call +91 {selectedLead.mobileNumber}</span>
                  </a>
                </div>

                {/* Contact & Business Grid */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-2xl bg-bg border border-border space-y-2">
                    <p className="text-xs font-bold uppercase tracking-wider text-text-muted">Contact Info</p>
                    <div className="text-xs space-y-1.5">
                      <p className="text-text-primary">
                        <strong>Calling:</strong> +91 {selectedLead.mobileNumber}
                      </p>
                      <p className="text-text-primary">
                        <strong>WhatsApp:</strong> +91 {selectedLead.whatsappNumber || selectedLead.mobileNumber}
                      </p>
                      <p className="text-text-primary">
                        <strong>Email:</strong> {selectedLead.email || "N/A"}
                      </p>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-bg border border-border space-y-2">
                    <p className="text-xs font-bold uppercase tracking-wider text-text-muted">Business & GST</p>
                    <div className="text-xs space-y-1.5">
                      <p className="text-text-primary">
                        <strong>Company:</strong> {selectedLead.businessName || "Individual"}
                      </p>
                      <p className="text-text-primary">
                        <strong>GSTIN:</strong> {selectedLead.gstin || "Not Provided"}
                      </p>
                      <p className="text-text-primary">
                        <strong>Profile:</strong> {selectedLead.businessProfile}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Territory & Procurement Scope */}
                <div className="p-4 rounded-2xl bg-bg border border-border space-y-3">
                  <p className="text-xs font-bold uppercase tracking-wider text-text-muted">
                    Territory & Deployment Intent
                  </p>
                  <div className="grid grid-cols-3 gap-3 text-xs">
                    <div>
                      <p className="text-text-muted text-[11px]">Target State</p>
                      <p className="font-bold text-text-primary mt-0.5">{selectedLead.state}</p>
                    </div>
                    <div>
                      <p className="text-text-muted text-[11px]">Target District</p>
                      <p className="font-bold text-text-primary mt-0.5">{selectedLead.district || "All / District Center"}</p>
                    </div>
                    <div>
                      <p className="text-text-muted text-[11px]">Expected Volume</p>
                      <p className="font-bold text-primary mt-0.5">{selectedLead.expectedOrderQty}</p>
                    </div>
                  </div>
                </div>

                {/* Specific Requirements / Remarks from Applicant */}
                <div className="p-4 rounded-2xl bg-info-soft/40 border border-info/20 space-y-2">
                  <p className="text-xs font-bold text-primary flex items-center gap-1.5">
                    <FiFileText size={14} />
                    Specific Requirements / Remarks from Form
                  </p>
                  <p className="text-xs text-text-primary leading-relaxed bg-surface p-3 rounded-xl border border-border">
                    {selectedLead.notes || "No additional specific requirements provided."}
                  </p>
                </div>

                {/* Admin Internal Notes */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-text-secondary uppercase tracking-wider">
                    Admin Notes & Evaluation Follow-up
                  </label>
                  <textarea
                    rows={3}
                    defaultValue={selectedLead.adminRemarks || ""}
                    onBlur={(e) => handleSaveRemarks(selectedLead.id, e.target.value)}
                    placeholder="Add internal notes about call discussions, territory conflicts, or franchise onboarding readiness..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-bg text-text-primary text-xs focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition resize-none"
                  />
                  <p className="text-[10px] text-text-muted">Auto-saves on blur or click away.</p>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-4 border-t border-border bg-bg/50 flex justify-between items-center">
                <button
                  type="button"
                  onClick={() => handleDeleteLead(selectedLead.id)}
                  className="px-4 py-2 text-danger hover:bg-danger-soft rounded-xl text-xs font-bold transition flex items-center gap-1.5"
                >
                  <FiTrash2 size={14} />
                  <span>Delete Application</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedLead(null)}
                  className="px-5 py-2.5 bg-primary text-white rounded-xl text-xs font-bold hover:bg-primary-hover transition"
                >
                  Close Detail
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── ADD MANUAL LEAD MODAL ────────────────────────────────────────── */}
      <AnimatePresence>
        {isAddModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-surface rounded-3xl shadow-2xl border border-border w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"
            >
              <div className="p-6 border-b border-border bg-bg/50 flex items-center justify-between">
                <div>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-primary/10 text-primary">
                    Franchise Partner Program
                  </span>
                  <h3 className="text-lg font-bold text-text-primary mt-1">Record Franchise Lead Manually</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="p-2 rounded-xl text-text-muted hover:bg-surface-hover hover:text-text-primary"
                >
                  <FiX size={18} />
                </button>
              </div>

              <form onSubmit={handleCreateLead} className="p-6 space-y-4 overflow-y-auto max-h-[70vh]">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-text-secondary mb-1">Full Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Ramesh Chandra"
                      value={formData.fullName}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-bg text-text-primary text-xs focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-text-secondary mb-1">Business / Company Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Chandra Solar & Electricals"
                      value={formData.businessName}
                      onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-bg text-text-primary text-xs focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-text-secondary mb-1">Mobile Number (Calling) *</label>
                    <input
                      type="tel"
                      required
                      placeholder="9876543210"
                      value={formData.mobileNumber}
                      onChange={(e) => setFormData({ ...formData, mobileNumber: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-bg text-text-primary text-xs focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-text-secondary mb-1">WhatsApp Number</label>
                    <input
                      type="tel"
                      placeholder="9876543210"
                      value={formData.whatsappNumber}
                      onChange={(e) => setFormData({ ...formData, whatsappNumber: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-bg text-text-primary text-xs focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-text-secondary mb-1">Email Address</label>
                    <input
                      type="email"
                      placeholder="ramesh@chandrasolar.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-bg text-text-primary text-xs focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-text-secondary mb-1">GSTIN (Optional)</label>
                    <input
                      type="text"
                      placeholder="27AAAAA0000A1Z5"
                      value={formData.gstin}
                      onChange={(e) => setFormData({ ...formData, gstin: e.target.value.toUpperCase() })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-bg text-text-primary text-xs uppercase font-mono focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-text-secondary mb-1">State *</label>
                    <select
                      value={formData.state}
                      onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                      className="w-full px-3 py-2.5 rounded-xl border border-border bg-bg text-text-primary text-xs focus:outline-none focus:ring-2 focus:ring-primary/30"
                    >
                      {INDIAN_STATES.map((st) => (
                        <option key={st} value={st}>
                          {st}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-text-secondary mb-1">Target District *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Pune"
                      value={formData.district}
                      onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-bg text-text-primary text-xs focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-text-secondary mb-1">Pincode</label>
                    <input
                      type="text"
                      placeholder="e.g. 411001"
                      value={formData.pincode}
                      onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-bg text-text-primary text-xs focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-text-secondary mb-1">Business Profile</label>
                    <select
                      value={formData.businessProfile}
                      onChange={(e) => setFormData({ ...formData, businessProfile: e.target.value })}
                      className="w-full px-3 py-2.5 rounded-xl border border-border bg-bg text-text-primary text-xs focus:outline-none focus:ring-2 focus:ring-primary/30"
                    >
                      {BUSINESS_PROFILES.map((bp) => (
                        <option key={bp} value={bp}>
                          {bp}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-text-secondary mb-1">Expected Order / Project Volume</label>
                    <select
                      value={formData.expectedOrderQty}
                      onChange={(e) => setFormData({ ...formData, expectedOrderQty: e.target.value })}
                      className="w-full px-3 py-2.5 rounded-xl border border-border bg-bg text-text-primary text-xs focus:outline-none focus:ring-2 focus:ring-primary/30"
                    >
                      {ORDER_VOLUMES.map((vol) => (
                        <option key={vol} value={vol}>
                          {vol}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-text-secondary mb-1">Selected Solution / Plan</label>
                  <input
                    type="text"
                    placeholder="e.g. Header Fast Application or Gold District Plan"
                    value={formData.selectedSolution}
                    onChange={(e) => setFormData({ ...formData, selectedSolution: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-bg text-text-primary text-xs focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-text-secondary mb-1">Specific Requirements / Remarks</label>
                  <textarea
                    rows={2}
                    placeholder="Mention panel wattage, inverter brand, target DISCOM name..."
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-bg text-text-primary text-xs focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-3">
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="px-4 py-2.5 rounded-xl border border-border text-xs font-semibold text-text-secondary hover:bg-surface-hover"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-primary text-white rounded-xl text-xs font-bold hover:bg-primary-hover shadow-md shadow-primary/20"
                  >
                    Save Franchise Lead
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
