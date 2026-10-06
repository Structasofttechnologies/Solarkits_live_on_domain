import { useState, useEffect, useMemo } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { useDispatch } from "react-redux";
import { setAlert } from "@/features/alert.slice";
import { authHeaderObj } from "@/app/authHeader";

import Button from "@/components/Button";
import IconButton from "@/components/IconButton";
import PageHeader from "@/components/PageHeader";
import ConfirmationPopup from "@/components/ConfirmationPopup";
import DropdownWithSearchInput from "@/components/DropdownWithSearchInput";
import Pagination from "@/components/Pagination";
import Dialog from "@/components/Dialog";

import {
  FaTruck,
  FaPlus,
  FaSearch,
  FaEdit,
  FaTrash,
  FaFileImport,
  FaSync,
  FaMapMarkerAlt,
  FaBoxOpen,
  FaCheckCircle,
  FaClock,
  FaArrowLeft,
  FaBolt,
  FaThLarge,
  FaTable,
  FaLayerGroup,
  FaRupeeSign,
  FaCheck,
  FaExclamationTriangle,
} from "react-icons/fa";

const API_URL = import.meta.env.VITE_API_URL;
const MODULE_UID = "ADM_COMBO_KITS";

const DEFAULT_KIT_IMAGE =
  "https://images.unsplash.com/photo-1509391365360-2e959784a276?w=600&auto=format&fit=crop&q=80";

const resolveImageUrl = (url) => {
  if (!url || typeof url !== "string" || url.trim() === "") return DEFAULT_KIT_IMAGE;
  if (url.includes("localhost:3001")) {
    return url.replace("localhost:3001", "localhost:5000");
  }
  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }
  const cleanBase = (API_URL || "http://localhost:5000").replace(/\/admin-api|\/api/g, "");
  return `${cleanBase}/${url.startsWith("/") ? url.slice(1) : url}`;
};

export default function PincodeDeliveryCosts({ moduleUniqueId = MODULE_UID }) {
  const { countryName = "india" } = useParams();
  const dispatch = useDispatch();

  // Navigation & View Mode
  const [selectedKit, setSelectedKit] = useState(null); // null = Cards view, or Kit object / "default"
  const [viewMode, setViewMode] = useState("cards"); // "cards" | "table"
  const [kitSearchTerm, setKitSearchTerm] = useState("");

  // Loading States
  const [loading, setLoading] = useState(false);
  const [kitsLoading, setKitsLoading] = useState(false);
  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState({
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 1,
    totalActive: 0,
    distinctPincodesCount: 0,
    distinctDistrictsCount: 0,
  });

  // Filters for Pincodes
  const [searchTerm, setSearchTerm] = useState("");
  const [filterState, setFilterState] = useState("");
  const [filterDistrict, setFilterDistrict] = useState("");
  const [filterKit, setFilterKit] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);

  // Geographic masters & Combo Kits
  const [states, setStates] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [modalDistricts, setModalDistricts] = useState([]);
  const [comboKits, setComboKits] = useState([]);
  const [kitStats, setKitStats] = useState({});

  // Add / Edit Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [formData, setFormData] = useState({
    state_id: "",
    state_name: "",
    district_id: "",
    district_name: "",
    pincode: "",
    combo_kit_id: "",
    combo_kit_name: "",
    delivery_cost: 1500,
    estimated_days_min: 3,
    estimated_days_max: 7,
    is_active: true,
    notes: "",
  });

  // Bulk Import Modal State
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkText, setBulkText] = useState("");
  const [bulkLoading, setBulkLoading] = useState(false);

  // Delete Confirmation
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  // 1. Fetch States
  useEffect(() => {
    const fetchStates = async () => {
      try {
        const res = await axios.get(
          `${API_URL}/geolocation/active-states?unique_id=${moduleUniqueId}&req_for=view`,
          { headers: authHeaderObj() }
        );
        const list = res.data?.states || res.data?.data || [];
        setStates(list);
      } catch (err) {
        console.error("Failed to load states:", err);
      }
    };
    fetchStates();
  }, [moduleUniqueId]);

  // 2. Fetch Configured Combo Kits
  const fetchKits = async () => {
    try {
      setKitsLoading(true);
      const isIndia = (countryName || "india").toLowerCase() === "india";
      const res = await axios.get(
        `${API_URL}/combo-kits${isIndia ? "/india" : ""}/get-kits?unique_id=${moduleUniqueId}&req_for=view&is_custom=false`,
        { headers: authHeaderObj() }
      );
      const list = res.data?.data || [];
      setComboKits(list);
    } catch (err) {
      console.error("Failed to load combo kits:", err);
    } finally {
      setKitsLoading(false);
    }
  };

  // 3. Fetch Kit Stats (Count & Price ranges grouped by kit)
  const fetchKitStats = async () => {
    try {
      const res = await axios.get(
        `${API_URL}/pincode-delivery-costs/kit-stats?unique_id=${moduleUniqueId}&req_for=view`,
        { headers: authHeaderObj() }
      );
      if (res.data?.status === "success" && Array.isArray(res.data?.data)) {
        const map = {};
        res.data.data.forEach((s) => {
          const key = s._id ? String(s._id) : "default";
          map[key] = {
            total_pincodes: s.total_pincodes || 0,
            min_cost: s.min_cost || 0,
            max_cost: s.max_cost || 0,
            active_count: s.active_count || 0,
          };
        });
        setKitStats(map);
      }
    } catch (err) {
      console.error("Failed to load kit stats:", err);
    }
  };

  useEffect(() => {
    fetchKits();
    fetchKitStats();
  }, [moduleUniqueId, countryName]);

  // 4. Filter Districts when filterState changes
  useEffect(() => {
    if (!filterState) {
      setDistricts([]);
      setFilterDistrict("");
      return;
    }
    const fetchDistricts = async () => {
      try {
        const selectedStateObj = states.find(
          (s) => s.name?.toLowerCase() === filterState.toLowerCase() || s.id === filterState
        );
        const stateId = selectedStateObj?._id || selectedStateObj?.id || filterState;
        const res = await axios.get(
          `${API_URL}/geolocation/districts?unique_id=${moduleUniqueId}&req_for=view&state_id=${stateId}`,
          { headers: authHeaderObj() }
        );
        const list = res.data?.districts || res.data?.data || [];
        setDistricts(list);
      } catch (err) {
        console.error("Failed to load districts:", err);
      }
    };
    fetchDistricts();
  }, [filterState, states, moduleUniqueId]);

  // 5. Modal Districts when formData.state_name changes
  useEffect(() => {
    if (!formData.state_name && !formData.state_id) {
      setModalDistricts([]);
      return;
    }
    const fetchModalDistricts = async () => {
      try {
        const stateId =
          formData.state_id ||
          states.find((s) => s.name?.toLowerCase() === formData.state_name?.toLowerCase())?._id ||
          states.find((s) => s.name?.toLowerCase() === formData.state_name?.toLowerCase())?.id;

        if (!stateId) return;
        const res = await axios.get(
          `${API_URL}/geolocation/districts?unique_id=${moduleUniqueId}&req_for=view&state_id=${stateId}`,
          { headers: authHeaderObj() }
        );
        const list = res.data?.districts || res.data?.data || [];
        setModalDistricts(list);
      } catch (err) {
        console.error("Failed to load modal districts:", err);
      }
    };
    fetchModalDistricts();
  }, [formData.state_name, formData.state_id, states, moduleUniqueId]);

  // 6. Fetch Delivery Cost Records
  const fetchRecords = async (targetKit = selectedKit) => {
    setLoading(true);
    try {
      const params = {
        unique_id: moduleUniqueId,
        req_for: "view",
        page: currentPage,
        limit: 20,
      };

      if (searchTerm.trim()) params.search = searchTerm.trim();
      if (filterState) params.state_name = filterState;
      if (filterDistrict) params.district_name = filterDistrict;

      if (targetKit) {
        if (targetKit === "default") {
          params.combo_kit_id = "default";
        } else {
          params.combo_kit_id = targetKit._id || targetKit.id;
        }
      } else if (filterKit) {
        params.combo_kit_id = filterKit;
      }

      if (filterStatus !== "all") params.is_active = filterStatus === "active";

      const res = await axios.get(`${API_URL}/pincode-delivery-costs`, {
        params,
        headers: authHeaderObj(),
      });

      if (res.data?.status === "success") {
        setItems(res.data.data || []);
        if (res.data.meta) setMeta(res.data.meta);
      }
    } catch (err) {
      console.error("Failed to load delivery costs:", err);
      dispatch(
        setAlert({
          type: "error",
          message: err.response?.data?.message || "Failed to load pincode delivery costs.",
        })
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords(selectedKit);
  }, [selectedKit, currentPage, filterState, filterDistrict, filterKit, filterStatus, moduleUniqueId]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchRecords(selectedKit);
  };

  // Reset Filters
  const handleResetFilters = () => {
    setSearchTerm("");
    setFilterState("");
    setFilterDistrict("");
    setFilterKit("");
    setFilterStatus("all");
    setCurrentPage(1);
    fetchRecords(selectedKit);
  };

  // Refresh entire page data
  const handleRefreshAll = () => {
    fetchKits();
    fetchKitStats();
    fetchRecords(selectedKit);
  };

  // Select a kit and drill down into its pincode delivery rates
  const handleSelectKit = (kit) => {
    setSelectedKit(kit);
    setCurrentPage(1);
    setSearchTerm("");
    setFilterState("");
    setFilterDistrict("");
  };

  // Return to all kits overview
  const handleBackToKits = () => {
    setSelectedKit(null);
    setCurrentPage(1);
    setSearchTerm("");
    setFilterState("");
    setFilterDistrict("");
    fetchKitStats();
  };

  // Open Modal for Add
  const handleOpenAddForKit = (kit = selectedKit) => {
    setEditingItem(null);
    const targetKitId = kit && kit !== "default" ? kit._id || kit.id : "";
    const targetKitName = kit && kit !== "default" ? kit.name : (kit === "default" ? "All Products (Default Rate)" : "");

    setFormData({
      state_id: "",
      state_name: "",
      district_id: "",
      district_name: "",
      pincode: "",
      combo_kit_id: targetKitId,
      combo_kit_name: targetKitName,
      delivery_cost: 1500,
      estimated_days_min: 3,
      estimated_days_max: 7,
      is_active: true,
      notes: "",
    });
    setShowModal(true);
  };

  // Open Modal for Edit
  const handleOpenEdit = (item) => {
    setEditingItem(item);
    setFormData({
      state_id: item.state_id || "",
      state_name: item.state_name || "",
      district_id: item.district_id || "",
      district_name: item.district_name || "",
      pincode: item.pincode || "",
      combo_kit_id: item.combo_kit_id?._id || item.combo_kit_id?.id || item.combo_kit_id || "",
      combo_kit_name: item.combo_kit_name || item.combo_kit_id?.name || "",
      delivery_cost: item.delivery_cost || 0,
      estimated_days_min: item.estimated_days_min || 3,
      estimated_days_max: item.estimated_days_max || 7,
      is_active: item.is_active !== false,
      notes: item.notes || "",
    });
    setShowModal(true);
  };

  // Save Modal Record
  const handleSaveRecord = async (e) => {
    e.preventDefault();

    if (!formData.state_name || !formData.district_name || !formData.pincode) {
      dispatch(setAlert({ type: "warning", message: "State, District, and Pincode are required." }));
      return;
    }

    if (!/^\d{6}$/.test(String(formData.pincode).trim())) {
      dispatch(setAlert({ type: "warning", message: "Please enter a valid 6-digit Indian PIN code." }));
      return;
    }

    if (formData.delivery_cost === "" || Number(formData.delivery_cost) < 0) {
      dispatch(setAlert({ type: "warning", message: "Please enter a valid delivery freight amount." }));
      return;
    }

    setModalLoading(true);
    try {
      const payload = {
        state_id: formData.state_id || null,
        state_name: formData.state_name.trim(),
        district_id: formData.district_id || null,
        district_name: formData.district_name.trim(),
        pincode: String(formData.pincode).trim(),
        combo_kit_id: formData.combo_kit_id || null,
        delivery_cost: Number(formData.delivery_cost),
        estimated_days_min: Number(formData.estimated_days_min) || 3,
        estimated_days_max: Number(formData.estimated_days_max) || 7,
        is_active: Boolean(formData.is_active),
        notes: formData.notes?.trim() || null,
      };

      if (editingItem) {
        await axios.put(
          `${API_URL}/pincode-delivery-costs/${editingItem._id || editingItem.id}?unique_id=${moduleUniqueId}&req_for=edit`,
          payload,
          { headers: authHeaderObj() }
        );
        dispatch(setAlert({ type: "success", message: "Delivery cost rule updated successfully!" }));
      } else {
        await axios.post(
          `${API_URL}/pincode-delivery-costs?unique_id=${moduleUniqueId}&req_for=add`,
          payload,
          { headers: authHeaderObj() }
        );
        dispatch(setAlert({ type: "success", message: "Pincode delivery cost rule created successfully!" }));
      }

      setShowModal(false);
      fetchRecords(selectedKit);
      fetchKitStats();
    } catch (err) {
      console.error("Save error:", err);
      dispatch(
        setAlert({
          type: "error",
          message: err.response?.data?.message || "Failed to save delivery cost rule.",
        })
      );
    } finally {
      setModalLoading(false);
    }
  };

  // Delete Record
  const handleDeleteConfirm = async () => {
    if (!deleteConfirm) return;
    try {
      await axios.delete(
        `${API_URL}/pincode-delivery-costs/${deleteConfirm._id || deleteConfirm.id}?unique_id=${moduleUniqueId}&req_for=delete`,
        { headers: authHeaderObj() }
      );
      dispatch(setAlert({ type: "success", message: "Delivery cost rule deleted." }));
      setDeleteConfirm(null);
      fetchRecords(selectedKit);
      fetchKitStats();
    } catch (err) {
      console.error("Failed to delete rule:", err);
      dispatch(setAlert({ type: "error", message: "Failed to delete rule." }));
    }
  };

  // Bulk Import
  const handleBulkImport = async () => {
    if (!bulkText.trim()) {
      dispatch(setAlert({ type: "warning", message: "Please paste CSV / tabular lines to import." }));
      return;
    }

    const lines = bulkText.split("\n").map((l) => l.trim()).filter(Boolean);
    const parsedItems = [];

    const defaultKitId =
      selectedKit && selectedKit !== "default" ? selectedKit._id || selectedKit.id : null;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const parts = line.split(",").map((p) => p.trim());
      if (parts.length >= 4) {
        parsedItems.push({
          state_name: parts[0],
          district_name: parts[1],
          pincode: parts[2],
          delivery_cost: Number(parts[3]) || 0,
          combo_kit_id: parts[4] || defaultKitId || null,
        });
      }
    }

    if (parsedItems.length === 0) {
      dispatch(
        setAlert({
          type: "warning",
          message: "No valid rows found. Format: State, District, Pincode, Cost (e.g. Gujarat, Devbhoomi Dwarka, 361320, 1500)",
        })
      );
      return;
    }

    setBulkLoading(true);
    try {
      const res = await axios.post(
        `${API_URL}/pincode-delivery-costs/bulk-import?unique_id=${moduleUniqueId}&req_for=add`,
        { items: parsedItems },
        { headers: authHeaderObj() }
      );

      dispatch(
        setAlert({
          type: "success",
          message: res.data?.message || `Successfully processed ${parsedItems.length} pincodes!`,
        })
      );
      setShowBulkModal(false);
      setBulkText("");
      fetchRecords(selectedKit);
      fetchKitStats();
    } catch (err) {
      dispatch(
        setAlert({
          type: "error",
          message: err.response?.data?.message || "Failed to bulk import.",
        })
      );
    } finally {
      setBulkLoading(false);
    }
  };

  // Filtered kits based on kitSearchTerm
  const filteredKits = useMemo(() => {
    if (!kitSearchTerm.trim()) return comboKits;
    const term = kitSearchTerm.toLowerCase();
    return comboKits.filter(
      (k) =>
        k.name?.toLowerCase().includes(term) ||
        String(k.capacity || "").includes(term) ||
        k.description?.toLowerCase().includes(term)
    );
  }, [comboKits, kitSearchTerm]);

  return (
    <div className="space-y-6">
      {/* PAGE HEADER */}
      <PageHeader
        title="Pincode Wise Delivery Cost Master"
        description="Configure product-specific and regional pincode freight rates across Indian states & districts for configured solar combo kits"
        meta={[
          { label: "Configured Kits", value: comboKits.length },
          { label: "Total Rates", value: meta.total },
          { label: "Active Pincodes", value: meta.distinctPincodesCount },
          { label: "Districts Covered", value: meta.distinctDistrictsCount },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="md"
              onClick={() => setShowBulkModal(true)}
              leftIcon={<FaFileImport />}
              className="border-border text-text-secondary hover:bg-surface-hover"
            >
              Bulk Import
            </Button>
            <Button
              variant="outline"
              size="md"
              onClick={handleRefreshAll}
              leftIcon={<FaSync />}
              className="border-border text-text-secondary hover:bg-surface-hover"
            >
              Refresh
            </Button>
            {/* Note: As requested, the generic "+ Add Delivery Freight" button is removed from this main header.
                Admins add charges specifically under each configured combo kit card! */}
          </div>
        }
      />

      {/* ──────────────────────────────────────────────────────────────────────────
          VIEW 1: SELECTED KIT PINCODE RATES MANAGER (Drill-down view)
          ────────────────────────────────────────────────────────────────────────── */}
      {selectedKit ? (
        <div className="space-y-6">
          {/* Back Button & Kit Banner */}
          <div className="bg-surface rounded-2xl border-2 border-border/80 p-6 shadow-sm">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
              <div className="flex items-start sm:items-center gap-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleBackToKits}
                  leftIcon={<FaArrowLeft />}
                  className="shrink-0 border-border text-text-secondary hover:bg-surface-hover"
                >
                  All Combo Kits
                </Button>

                <div className="h-10 w-px bg-border/60 hidden sm:block" />

                {selectedKit === "default" ? (
                  <div className="flex items-center gap-3">
                    <div className="w-14 h-14 rounded-xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center shrink-0">
                      <FaTruck size={22} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-primary/10 text-primary border border-primary/20">
                          General Fallback Rate
                        </span>
                      </div>
                      <h2 className="text-base sm:text-lg font-black text-text-primary mt-0.5">
                        All Products / General Delivery Rates
                      </h2>
                      <p className="text-xs text-text-secondary">
                        Applies to any customer order when no specific combo kit freight rule is configured
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <div className="w-14 h-14 rounded-xl border-2 border-border/70 overflow-hidden bg-surface-hover shrink-0">
                      <img
                        src={resolveImageUrl(selectedKit.kit_image)}
                        alt={selectedKit.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = DEFAULT_KIT_IMAGE;
                        }}
                      />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20 flex items-center gap-1">
                          <FaBolt size={9} />
                          {selectedKit.capacity || 0} kW Capacity
                        </span>
                        <span className="text-[10px] font-bold text-text-muted">
                          {kitStats[String(selectedKit._id || selectedKit.id)]?.total_pincodes || 0} Configured Pincodes
                        </span>
                      </div>
                      <h2 className="text-base sm:text-lg font-black text-text-primary mt-0.5">
                        {selectedKit.name}
                      </h2>
                      <p className="text-xs text-text-secondary line-clamp-1">
                        {selectedKit.description || "Manage pincode delivery freight charges for this solar combo kit"}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Action buttons inside this kit */}
              <div className="flex items-center gap-2 w-full lg:w-auto justify-end">
                <Button
                  variant="outline"
                  size="md"
                  onClick={() => setShowBulkModal(true)}
                  leftIcon={<FaFileImport />}
                  className="border-border text-text-secondary hover:bg-surface-hover"
                >
                  Bulk Import for Kit
                </Button>
                <Button
                  variant="primary"
                  size="md"
                  onClick={() => handleOpenAddForKit(selectedKit)}
                  leftIcon={<FaPlus />}
                >
                  Add Delivery Freight
                </Button>
              </div>
            </div>
          </div>

          {/* Filter Toolbar for this Kit */}
          <div className="bg-surface rounded-2xl border-2 border-border/60 p-5 shadow-sm">
            <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
              {/* Search PIN / City */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-text-secondary uppercase tracking-wider ml-1">
                  Search PIN / City
                </label>
                <div className="relative w-full">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-text-muted">
                    <FaSearch size={12} />
                  </span>
                  <input
                    type="text"
                    placeholder="e.g. 361320 or Dwarka"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full h-10 pl-9 pr-4 bg-surface border-2 border-border focus:border-primary rounded-xl text-xs font-bold text-text-primary placeholder:text-text-muted outline-none transition-colors"
                  />
                </div>
              </div>

              {/* State Filter */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-text-secondary uppercase tracking-wider ml-1">
                  State
                </label>
                <DropdownWithSearchInput
                  options={[
                    { text: "All States", label: "All States", value: "" },
                    ...states.map((s) => ({ text: s.name, label: s.name, value: s.name })),
                  ]}
                  value={filterState}
                  onChange={(val) => {
                    setFilterState(val);
                    setFilterDistrict("");
                    setCurrentPage(1);
                  }}
                  placeholder="All States"
                />
              </div>

              {/* District Filter */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-text-secondary uppercase tracking-wider ml-1">
                  District
                </label>
                <DropdownWithSearchInput
                  options={[
                    { text: "All Districts", label: "All Districts", value: "" },
                    ...districts.map((d) => ({ text: d.name, label: d.name, value: d.name })),
                  ]}
                  value={filterDistrict}
                  onChange={(val) => {
                    setFilterDistrict(val);
                    setCurrentPage(1);
                  }}
                  placeholder="All Districts"
                  disabled={!filterState}
                />
              </div>

              {/* Filter Actions */}
              <div className="flex gap-2">
                <Button type="submit" variant="primary" size="md" className="flex-1">
                  Filter
                </Button>
                <Button type="button" variant="secondary" size="md" onClick={handleResetFilters}>
                  Reset
                </Button>
              </div>
            </form>
          </div>

          {/* Table of Pincode Rates for this Kit */}
          <div className="bg-surface rounded-2xl border-2 border-border/60 shadow-sm overflow-hidden">
            <div className="px-6 py-4 bg-surface-hover/30 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse" />
                <span className="text-xs font-black text-text-primary uppercase tracking-wider">
                  Configured Pincode Delivery Rates for{" "}
                  {selectedKit === "default" ? "All Products" : selectedKit.name}
                </span>
              </div>
              <span className="text-[11px] font-bold text-text-secondary bg-surface px-3 py-1 rounded-full border border-border">
                Total {meta.total || items.length} Record{meta.total === 1 ? "" : "s"}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="bg-surface-hover/60 border-b border-border text-[11px] font-black uppercase tracking-wider text-text-secondary">
                    <th className="px-6 py-4">State & District</th>
                    <th className="px-6 py-4">PIN Code</th>
                    <th className="px-6 py-4">Delivery Freight</th>
                    <th className="px-6 py-4">Est. Transit</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60 text-xs">
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-16 text-center">
                        <div className="flex flex-col items-center justify-center gap-3">
                          <div className="animate-spin rounded-full h-9 w-9 border-3 border-primary border-t-transparent" />
                          <p className="text-xs font-bold text-text-secondary">
                            Loading pincode delivery freight rates...
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : items.length > 0 ? (
                    items.map((item) => (
                      <tr
                        key={item._id || item.id}
                        className="hover:bg-primary/5 transition-colors group"
                      >
                        {/* State & District */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <span className="w-6 h-6 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                              <FaMapMarkerAlt size={11} />
                            </span>
                            <div>
                              <p className="font-black text-text-primary text-xs uppercase tracking-wide">
                                {item.state_name}
                              </p>
                              <p className="text-[11px] font-semibold text-text-secondary">
                                {item.district_name || "All Districts"}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* PIN Code */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="font-mono text-xs font-black text-primary px-2.5 py-1 bg-primary/10 rounded-lg border border-primary/20">
                            {item.pincode}
                          </span>
                        </td>

                        {/* Delivery Freight */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="font-black text-sm text-emerald-700 dark:text-emerald-400">
                            ₹{Number(item.delivery_cost || 0).toLocaleString("en-IN")}
                          </span>
                        </td>

                        {/* Est Transit */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-1.5 text-text-secondary font-semibold">
                            <FaClock size={11} className="text-text-muted" />
                            <span>
                              {item.estimated_days_min || 3} - {item.estimated_days_max || 7} Days
                            </span>
                          </div>
                        </td>

                        {/* Status */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full border ${
                              item.is_active !== false
                                ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20"
                                : "bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20"
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                item.is_active !== false ? "bg-emerald-500" : "bg-rose-500"
                              }`}
                            />
                            {item.is_active !== false ? "Active" : "Inactive"}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="px-6 py-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            <IconButton
                              variant="secondary"
                              size="sm"
                              onClick={() => handleOpenEdit(item)}
                              title="Edit Rate"
                            >
                              <FaEdit size={12} />
                            </IconButton>
                            <IconButton
                              variant="danger"
                              size="sm"
                              onClick={() => setDeleteConfirm(item)}
                              title="Delete Rule"
                            >
                              <FaTrash size={12} />
                            </IconButton>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="px-6 py-16 text-center">
                        <div className="flex flex-col items-center justify-center gap-3 max-w-sm mx-auto">
                          <div className="w-14 h-14 rounded-2xl bg-surface-hover flex items-center justify-center text-text-muted">
                            <FaTruck size={24} className="opacity-40" />
                          </div>
                          <div>
                            <h4 className="font-black text-sm text-text-primary">
                              No Pincode Rates Configured for this Kit
                            </h4>
                            <p className="text-xs text-text-secondary mt-1">
                              Configure pincode delivery freight charges for {selectedKit === "default" ? "general products" : selectedKit.name} to accurately calculate shipping costs during checkout.
                            </p>
                          </div>
                          <div className="flex items-center gap-2 mt-2">
                            <Button
                              variant="primary"
                              size="sm"
                              leftIcon={<FaPlus />}
                              onClick={() => handleOpenAddForKit(selectedKit)}
                            >
                              Add Delivery Freight
                            </Button>
                            {searchTerm && (
                              <Button
                                variant="secondary"
                                size="sm"
                                onClick={handleResetFilters}
                              >
                                Reset Filters
                              </Button>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {meta.totalPages > 1 && (
              <div className="p-4 border-t border-border flex items-center justify-between">
                <p className="text-xs text-text-secondary font-medium">
                  Showing page {currentPage} of {meta.totalPages} ({meta.total} total rules)
                </p>
                <Pagination
                  currentPage={currentPage}
                  totalPages={meta.totalPages}
                  onPageChange={(p) => setCurrentPage(p)}
                />
              </div>
            )}
          </div>
        </div>
      ) : (
        /* ──────────────────────────────────────────────────────────────────────────
           VIEW 2: CONFIGURED COMBO KITS (CARDS FORMAT) - MAIN PAGE
           ────────────────────────────────────────────────────────────────────────── */
        <div className="space-y-6">
          {/* Subheader Toolbar & Mode Switcher */}
          <div className="bg-surface rounded-2xl border-2 border-border/70 p-5 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-primary/10 text-primary rounded-xl border border-primary/20">
                <FaLayerGroup size={18} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-black text-text-primary uppercase tracking-wider">
                    Configured Combo Kits
                  </h3>
                  <span className="text-[10px] font-black bg-primary/10 text-primary px-2 py-0.5 rounded-full border border-primary/20">
                    {filteredKits.length} Kits Available
                  </span>
                </div>
                <p className="text-xs text-text-secondary mt-0.5">
                  Click on any combo kit below to view and add pincode-wise delivery freight charges
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              {/* Search combo kit cards */}
              <div className="relative min-w-56 flex-1 sm:flex-initial">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-text-muted">
                  <FaSearch size={12} />
                </span>
                <input
                  type="text"
                  placeholder="Search kit by name, kW..."
                  value={kitSearchTerm}
                  onChange={(e) => setKitSearchTerm(e.target.value)}
                  className="w-full h-10 pl-9 pr-3 bg-surface border-2 border-border focus:border-primary rounded-xl text-xs font-bold text-text-primary placeholder:text-text-muted outline-none transition-colors"
                />
              </div>

              {/* Switch View (Cards vs Master Table) */}
              <div className="flex items-center bg-surface-hover/80 p-1 rounded-xl border border-border">
                <button
                  type="button"
                  onClick={() => setViewMode("cards")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    viewMode === "cards"
                      ? "bg-surface text-primary shadow-xs"
                      : "text-text-secondary hover:text-text-primary"
                  }`}
                  title="Card Grid View"
                >
                  <FaThLarge size={12} />
                  <span>Cards</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("table")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    viewMode === "table"
                      ? "bg-surface text-primary shadow-xs"
                      : "text-text-secondary hover:text-text-primary"
                  }`}
                  title="Master Table View"
                >
                  <FaTable size={12} />
                  <span>Master Table</span>
                </button>
              </div>
            </div>
          </div>

          {/* If ViewMode is Table, show full Master Table across all products */}
          {viewMode === "table" ? (
            <div className="space-y-6">
              {/* FILTER TOOLBAR */}
              <div className="bg-surface rounded-2xl border-2 border-border/60 p-6 shadow-sm">
                <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-text-secondary uppercase tracking-wider ml-1">
                      Search PIN / City
                    </label>
                    <div className="relative w-full">
                      <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-text-muted">
                        <FaSearch size={12} />
                      </span>
                      <input
                        type="text"
                        placeholder="e.g. 361320 or Dwarka"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full h-10 pl-9 pr-4 bg-surface border-2 border-border focus:border-primary rounded-xl text-xs font-bold text-text-primary placeholder:text-text-muted outline-none transition-colors"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-text-secondary uppercase tracking-wider ml-1">
                      State
                    </label>
                    <DropdownWithSearchInput
                      options={[
                        { text: "All States", label: "All States", value: "" },
                        ...states.map((s) => ({ text: s.name, label: s.name, value: s.name })),
                      ]}
                      value={filterState}
                      onChange={(val) => {
                        setFilterState(val);
                        setFilterDistrict("");
                        setCurrentPage(1);
                      }}
                      placeholder="All States"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-text-secondary uppercase tracking-wider ml-1">
                      District
                    </label>
                    <DropdownWithSearchInput
                      options={[
                        { text: "All Districts", label: "All Districts", value: "" },
                        ...districts.map((d) => ({ text: d.name, label: d.name, value: d.name })),
                      ]}
                      value={filterDistrict}
                      onChange={(val) => {
                        setFilterDistrict(val);
                        setCurrentPage(1);
                      }}
                      placeholder="All Districts"
                      disabled={!filterState}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-text-secondary uppercase tracking-wider ml-1">
                      Product / Kit
                    </label>
                    <DropdownWithSearchInput
                      options={[
                        { text: "All Products / Defaults", label: "All Products / Defaults", value: "" },
                        { text: "General Pincode Rate (No Specific Kit)", label: "General Pincode Rate (No Specific Kit)", value: "default" },
                        ...comboKits.map((k) => ({
                          text: `${k.name} (${k.capacity || 0}kW)`,
                          label: `${k.name} (${k.capacity || 0}kW)`,
                          value: k._id || k.id,
                        })),
                      ]}
                      value={filterKit}
                      onChange={(val) => {
                        setFilterKit(val);
                        setCurrentPage(1);
                      }}
                      placeholder="Filter by Product"
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button type="submit" variant="primary" size="md" className="flex-1">
                      Filter
                    </Button>
                    <Button type="button" variant="secondary" size="md" onClick={handleResetFilters}>
                      Reset
                    </Button>
                  </div>
                </form>
              </div>

              {/* Master Table */}
              <div className="bg-surface rounded-2xl border-2 border-border/60 shadow-sm overflow-hidden">
                <div className="px-6 py-4 bg-surface-hover/30 border-b border-border flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse" />
                    <span className="text-xs font-black text-text-primary uppercase tracking-wider">
                      All Configured Pincode Delivery Rates
                    </span>
                  </div>
                  <span className="text-[11px] font-bold text-text-secondary bg-surface px-3 py-1 rounded-full border border-border">
                    Total {meta.total || items.length} Records
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-left">
                    <thead>
                      <tr className="bg-surface-hover/60 border-b border-border text-[11px] font-black uppercase tracking-wider text-text-secondary">
                        <th className="px-6 py-4">State & District</th>
                        <th className="px-6 py-4">PIN Code</th>
                        <th className="px-6 py-4">Applicable Product / Kit</th>
                        <th className="px-6 py-4">Delivery Freight</th>
                        <th className="px-6 py-4">Est. Transit</th>
                        <th className="px-6 py-4">Status</th>
                        <th className="px-6 py-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60 text-xs">
                      {loading ? (
                        <tr>
                          <td colSpan={7} className="px-6 py-16 text-center">
                            <div className="flex flex-col items-center justify-center gap-3">
                              <div className="animate-spin rounded-full h-9 w-9 border-3 border-primary border-t-transparent" />
                              <p className="text-xs font-bold text-text-secondary">
                                Loading delivery freight configurations...
                              </p>
                            </div>
                          </td>
                        </tr>
                      ) : items.length > 0 ? (
                        items.map((item) => (
                          <tr
                            key={item._id || item.id}
                            className="hover:bg-primary/5 transition-colors group"
                          >
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2">
                                <span className="w-6 h-6 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                                  <FaMapMarkerAlt size={11} />
                                </span>
                                <div>
                                  <p className="font-black text-text-primary text-xs uppercase tracking-wide">
                                    {item.state_name}
                                  </p>
                                  <p className="text-[11px] font-semibold text-text-secondary">
                                    {item.district_name || "All Districts"}
                                  </p>
                                </div>
                              </div>
                            </td>

                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="font-mono text-xs font-black text-primary px-2.5 py-1 bg-primary/10 rounded-lg border border-primary/20">
                                {item.pincode}
                              </span>
                            </td>

                            <td className="px-6 py-4">
                              {item.combo_kit_id || item.combo_kit_name ? (
                                <div className="flex items-center gap-2">
                                  <span className="w-6 h-6 rounded-md bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0 font-bold text-xs">
                                    <FaBoxOpen size={11} />
                                  </span>
                                  <div>
                                    <p className="text-xs font-bold text-text-primary line-clamp-1">
                                      {typeof item.combo_kit_id === "object" && item.combo_kit_id?.name
                                        ? item.combo_kit_id.name
                                        : item.combo_kit_name || "Specific Kit"}
                                    </p>
                                    {typeof item.combo_kit_id === "object" && item.combo_kit_id?.capacity && (
                                      <span className="text-[10px] text-text-muted font-bold">
                                        Capacity: {item.combo_kit_id.capacity} kW
                                      </span>
                                    )}
                                  </div>
                                </div>
                              ) : (
                                <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted bg-surface-hover px-2.5 py-1 rounded-md border border-border">
                                  All Products (Default Rate)
                                </span>
                              )}
                            </td>

                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="font-black text-sm text-emerald-700 dark:text-emerald-400">
                                ₹{Number(item.delivery_cost || 0).toLocaleString("en-IN")}
                              </span>
                            </td>

                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center gap-1.5 text-text-secondary font-semibold">
                                <FaClock size={11} className="text-text-muted" />
                                <span>
                                  {item.estimated_days_min || 3} - {item.estimated_days_max || 7} Days
                                </span>
                              </div>
                            </td>

                            <td className="px-6 py-4 whitespace-nowrap">
                              <span
                                className={`inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full border ${
                                  item.is_active !== false
                                    ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20"
                                    : "bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20"
                                }`}
                              >
                                <span
                                  className={`w-1.5 h-1.5 rounded-full ${
                                    item.is_active !== false ? "bg-emerald-500" : "bg-rose-500"
                                  }`}
                                />
                                {item.is_active !== false ? "Active" : "Inactive"}
                              </span>
                            </td>

                            <td className="px-6 py-4 text-right whitespace-nowrap">
                              <div className="flex items-center justify-end gap-1.5">
                                <IconButton
                                  variant="secondary"
                                  size="sm"
                                  onClick={() => handleOpenEdit(item)}
                                  title="Edit Rate"
                                >
                                  <FaEdit size={12} />
                                </IconButton>
                                <IconButton
                                  variant="danger"
                                  size="sm"
                                  onClick={() => setDeleteConfirm(item)}
                                  title="Delete Rule"
                                >
                                  <FaTrash size={12} />
                                </IconButton>
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={7} className="px-6 py-16 text-center">
                            <p className="text-xs font-bold text-text-secondary">
                              No delivery cost records found.
                            </p>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {meta.totalPages > 1 && (
                  <div className="p-4 border-t border-border flex items-center justify-between">
                    <p className="text-xs text-text-secondary font-medium">
                      Showing page {currentPage} of {meta.totalPages} ({meta.total} total rules)
                    </p>
                    <Pagination
                      currentPage={currentPage}
                      totalPages={meta.totalPages}
                      onPageChange={(p) => setCurrentPage(p)}
                    />
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* CARDS GRID VIEW */
            <div className="space-y-6">
              {kitsLoading ? (
                <div className="py-20 text-center flex flex-col items-center justify-center gap-3">
                  <div className="animate-spin rounded-full h-10 w-10 border-3 border-primary border-t-transparent" />
                  <p className="text-xs font-bold text-text-secondary">
                    Loading configured combo kits...
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {/* SPECIAL CARD: Default / Fallback Rate for All Products */}
                  <div
                    onClick={() => handleSelectKit("default")}
                    className="group bg-surface rounded-2xl border-2 border-dashed border-primary/40 hover:border-primary p-6 shadow-sm hover:shadow-lg transition-all cursor-pointer flex flex-col justify-between relative overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-full pointer-events-none group-hover:scale-110 transition-transform" />

                    <div className="space-y-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary border border-primary/20 flex items-center justify-center shrink-0 shadow-xs group-hover:bg-primary group-hover:text-white transition-colors">
                          <FaTruck size={24} />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-primary/10 text-primary border border-primary/20">
                          Fallback Rate
                        </span>
                      </div>

                      <div>
                        <h4 className="text-base font-black text-text-primary group-hover:text-primary transition-colors">
                          All Products (Default Pincode Rates)
                        </h4>
                        <p className="text-xs text-text-secondary mt-1 leading-relaxed">
                          Standard pincode freight applied when an ordered combo kit does not have an explicit rate rule.
                        </p>
                      </div>

                      {/* Stats box */}
                      <div className="p-3 bg-surface-hover/70 rounded-xl border border-border flex items-center justify-between">
                        <div>
                          <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider">
                            Configured Pincodes
                          </p>
                          <p className="text-sm font-black text-text-primary">
                            {kitStats["default"]?.total_pincodes || 0} Pincodes
                          </p>
                        </div>
                        {kitStats["default"]?.total_pincodes > 0 && (
                          <div className="text-right">
                            <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider">
                              Freight Range
                            </p>
                            <p className="text-xs font-black text-emerald-700 dark:text-emerald-400">
                              ₹{kitStats["default"]?.min_cost?.toLocaleString("en-IN")} - ₹{kitStats["default"]?.max_cost?.toLocaleString("en-IN")}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="pt-5 mt-4 border-t border-border flex items-center gap-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        className="flex-1"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectKit("default");
                        }}
                      >
                        Manage Rates
                      </Button>
                      <Button
                        variant="primary"
                        size="sm"
                        leftIcon={<FaPlus />}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenAddForKit("default");
                        }}
                      >
                        Add Rate
                      </Button>
                    </div>
                  </div>

                  {/* CONFIGURED COMBO KIT CARDS */}
                  {filteredKits.map((kit) => {
                    const kitId = String(kit._id || kit.id);
                    const stats = kitStats[kitId] || { total_pincodes: 0, min_cost: 0, max_cost: 0, active_count: 0 };
                    const hasRates = stats.total_pincodes > 0;

                    return (
                      <div
                        key={kitId}
                        onClick={() => handleSelectKit(kit)}
                        className="group bg-surface rounded-2xl border-2 border-border/80 hover:border-primary/60 shadow-sm hover:shadow-xl transition-all cursor-pointer flex flex-col justify-between overflow-hidden"
                      >
                        {/* Cover Image with Badges */}
                        <div className="relative h-44 w-full bg-surface-hover overflow-hidden">
                          <img
                            src={resolveImageUrl(kit.kit_image)}
                            alt={kit.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = DEFAULT_KIT_IMAGE;
                            }}
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

                          {/* Capacity Pill (Top Left) */}
                          <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-md text-amber-300 border border-amber-300/30 px-2.5 py-1 rounded-lg text-xs font-black flex items-center gap-1 shadow-sm">
                            <FaBolt size={10} className="text-amber-400" />
                            <span>{kit.capacity || 0} kW</span>
                          </div>

                          {/* Pincode Configuration Status Badge (Top Right) */}
                          <div className="absolute top-3 right-3">
                            {hasRates ? (
                              <span className="bg-emerald-600/90 backdrop-blur-md text-white text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg flex items-center gap-1 shadow-sm border border-emerald-400/40">
                                <FaCheck size={9} />
                                {stats.total_pincodes} Pincode{stats.total_pincodes === 1 ? "" : "s"}
                              </span>
                            ) : (
                              <span className="bg-amber-600/90 backdrop-blur-md text-white text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg flex items-center gap-1 shadow-sm border border-amber-400/40">
                                <FaExclamationTriangle size={9} />
                                No Rates Set
                              </span>
                            )}
                          </div>

                          {/* Kit Title at bottom of cover */}
                          <div className="absolute bottom-3 left-3 right-3">
                            <h4 className="text-sm font-black text-white line-clamp-1 drop-shadow-sm group-hover:text-primary-light transition-colors">
                              {kit.name}
                            </h4>
                          </div>
                        </div>

                        {/* Card Body */}
                        <div className="p-5 space-y-4 flex-1 flex flex-col justify-between">
                          <div className="space-y-2.5">
                            <div className="flex items-center gap-2 text-[11px] font-bold text-text-secondary">
                              <span className="px-2 py-0.5 rounded-md bg-surface-hover border border-border">
                                {kit.base_components?.length || 0} Base Modules
                              </span>
                              <span>•</span>
                              <span className="px-2 py-0.5 rounded-md bg-surface-hover border border-border">
                                {kit.bos_kits?.length || 0} BOS Kits
                              </span>
                            </div>

                            {/* Freight Rate Metric Box */}
                            <div className="p-3 bg-surface-hover/60 rounded-xl border border-border/80 flex items-center justify-between">
                              <div>
                                <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider">
                                  Delivery Freight
                                </p>
                                {hasRates ? (
                                  <p className="text-sm font-black text-emerald-700 dark:text-emerald-400">
                                    {stats.min_cost === stats.max_cost
                                      ? `₹${stats.min_cost.toLocaleString("en-IN")}`
                                      : `₹${stats.min_cost.toLocaleString("en-IN")} - ₹${stats.max_cost.toLocaleString("en-IN")}`}
                                  </p>
                                ) : (
                                  <p className="text-xs font-bold text-amber-600 dark:text-amber-400">
                                    Not Configured
                                  </p>
                                )}
                              </div>
                              <div className="text-right">
                                <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider">
                                  Coverage
                                </p>
                                <p className="text-xs font-black text-text-primary">
                                  {hasRates ? `${stats.active_count} Active Routes` : "0 Routes"}
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* Footer Actions */}
                          <div className="pt-3 border-t border-border flex items-center gap-2">
                            <Button
                              variant="secondary"
                              size="sm"
                              className="flex-1 text-xs"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSelectKit(kit);
                              }}
                            >
                              Manage Pincodes ({stats.total_pincodes})
                            </Button>
                            <Button
                              variant="primary"
                              size="sm"
                              leftIcon={<FaPlus />}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenAddForKit(kit);
                              }}
                            >
                              Add Freight
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {filteredKits.length === 0 && !kitsLoading && (
                <div className="py-16 text-center bg-surface rounded-2xl border-2 border-border/60">
                  <div className="w-14 h-14 rounded-2xl bg-surface-hover flex items-center justify-center text-text-muted mx-auto mb-3">
                    <FaBoxOpen size={24} className="opacity-40" />
                  </div>
                  <h4 className="font-black text-sm text-text-primary">
                    No Combo Kits Found
                  </h4>
                  <p className="text-xs text-text-secondary mt-1">
                    No combo kits matching &quot;{kitSearchTerm}&quot;. Try resetting your search.
                  </p>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="mt-3"
                    onClick={() => setKitSearchTerm("")}
                  >
                    Clear Search
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────────────────────
          ADD / EDIT MODAL
          ────────────────────────────────────────────────────────────────────────── */}
      <Dialog
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingItem ? "Edit Delivery Charge Rule" : "Add Pincode Delivery Charge"}
        size="lg"
      >
        <form onSubmit={handleSaveRecord} className="space-y-5 p-1">
          {/* Target Combo Kit Badge in Modal */}
          {formData.combo_kit_id || (selectedKit && selectedKit !== "default") ? (
            <div className="p-3 bg-primary/10 border-2 border-primary/20 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-primary/20 text-primary flex items-center justify-center font-bold">
                  <FaBoxOpen size={16} />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-wider text-text-secondary">
                    Configuring Freight For Kit
                  </p>
                  <p className="text-xs font-black text-text-primary">
                    {formData.combo_kit_name ||
                      comboKits.find((k) => (k._id || k.id) === formData.combo_kit_id)?.name ||
                      (selectedKit && selectedKit.name) ||
                      "Selected Combo Kit"}
                  </p>
                </div>
              </div>
              {!selectedKit && (
                <button
                  type="button"
                  onClick={() => setFormData((prev) => ({ ...prev, combo_kit_id: "", combo_kit_name: "" }))}
                  className="text-[11px] text-primary font-bold hover:underline"
                >
                  Change / Set Default
                </button>
              )}
            </div>
          ) : (
            /* Combo Kit Dropdown if opened globally */
            <div className="space-y-1.5">
              <label className="text-xs font-black uppercase tracking-wider text-text-secondary">
                Applicable Product / Combo Kit (Optional)
              </label>
              <DropdownWithSearchInput
                options={[
                  { text: "All Products (General rate for this PIN)", label: "All Products (General rate for this PIN)", value: "" },
                  ...comboKits.map((k) => ({
                    text: `${k.name} (${k.capacity || 0}kW)`,
                    label: `${k.name} (${k.capacity || 0}kW)`,
                    value: k._id || k.id,
                  })),
                ]}
                value={formData.combo_kit_id}
                onChange={(val) => {
                  const kObj = comboKits.find((k) => (k._id || k.id) === val);
                  setFormData((prev) => ({
                    ...prev,
                    combo_kit_id: val,
                    combo_kit_name: kObj ? kObj.name : "",
                  }));
                }}
                placeholder="All Products (Default)"
              />
              <p className="text-[10px] text-text-muted">
                Leave blank to make this the standard rate for all products in this PIN, or select a specific Kit.
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* State */}
            <div className="space-y-1.5">
              <label className="text-xs font-black uppercase tracking-wider text-text-secondary">
                State <span className="text-rose-500">*</span>
              </label>
              <DropdownWithSearchInput
                options={states.map((s) => ({ text: s.name, label: s.name, value: s.name, id: s._id || s.id }))}
                value={formData.state_name}
                onChange={(val) => {
                  const sObj = states.find((s) => s.name === val);
                  setFormData((prev) => ({
                    ...prev,
                    state_name: val,
                    state_id: sObj?._id || sObj?.id || "",
                    district_name: "",
                    district_id: "",
                  }));
                }}
                placeholder="Select State (e.g. Gujarat)"
              />
            </div>

            {/* District */}
            <div className="space-y-1.5">
              <label className="text-xs font-black uppercase tracking-wider text-text-secondary">
                District <span className="text-rose-500">*</span>
              </label>
              <DropdownWithSearchInput
                options={modalDistricts.map((d) => ({ text: d.name, label: d.name, value: d.name, id: d._id || d.id }))}
                value={formData.district_name}
                onChange={(val) => {
                  const dObj = modalDistricts.find((d) => d.name === val);
                  setFormData((prev) => ({
                    ...prev,
                    district_name: val,
                    district_id: dObj?._id || dObj?.id || "",
                  }));
                }}
                placeholder="Select District (e.g. Devbhumi Dwarka)"
                disabled={!formData.state_name}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Pincode */}
            <div className="space-y-1.5">
              <label className="text-xs font-black uppercase tracking-wider text-text-secondary">
                PIN Code <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                maxLength={6}
                value={formData.pincode}
                onChange={(e) => setFormData((prev) => ({ ...prev, pincode: e.target.value.replace(/\D/g, "") }))}
                placeholder="e.g. 361320"
                className="w-full h-11 px-4 bg-surface border-2 border-border focus:border-primary rounded-xl text-sm font-bold text-text-primary outline-none transition-colors font-mono"
              />
              <p className="text-[10px] text-text-muted">Must be exact 6-digit postal PIN code</p>
            </div>

            {/* Delivery Freight Cost */}
            <div className="space-y-1.5">
              <label className="text-xs font-black uppercase tracking-wider text-text-secondary">
                Delivery Cost (₹ INR) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-text-muted font-bold text-sm">
                  ₹
                </span>
                <input
                  type="number"
                  min="0"
                  step="50"
                  value={formData.delivery_cost}
                  onChange={(e) => setFormData((prev) => ({ ...prev, delivery_cost: e.target.value }))}
                  placeholder="e.g. 1500"
                  className="w-full h-11 pl-8 pr-4 bg-surface border-2 border-border focus:border-primary rounded-xl text-sm font-black text-text-primary outline-none transition-colors"
                />
              </div>
              <p className="text-[10px] text-text-muted">Total freight charge added at checkout for this PIN</p>
            </div>
          </div>

          {/* Transit Days & Active */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-text-secondary">Min Transit Days</label>
              <input
                type="number"
                min="1"
                max="30"
                value={formData.estimated_days_min}
                onChange={(e) => setFormData((prev) => ({ ...prev, estimated_days_min: e.target.value }))}
                className="w-full h-10 px-3 bg-surface border-2 border-border focus:border-primary rounded-xl text-xs font-bold text-text-primary outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-text-secondary">Max Transit Days</label>
              <input
                type="number"
                min="1"
                max="60"
                value={formData.estimated_days_max}
                onChange={(e) => setFormData((prev) => ({ ...prev, estimated_days_max: e.target.value }))}
                className="w-full h-10 px-3 bg-surface border-2 border-border focus:border-primary rounded-xl text-xs font-bold text-text-primary outline-none"
              />
            </div>

            <div className="pt-4 flex items-center gap-3">
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={Boolean(formData.is_active)}
                  onChange={(e) => setFormData((prev) => ({ ...prev, is_active: e.target.checked }))}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-surface-hover peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-border after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
              </label>
              <span className="text-xs font-bold text-text-primary">
                {formData.is_active ? "Active Route" : "Disabled Route"}
              </span>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-text-secondary">Internal Logistics Notes</label>
            <input
              type="text"
              value={formData.notes}
              onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
              placeholder="e.g. Dispatched from Ahmedabad Regional Hub"
              className="w-full h-10 px-3 bg-surface border-2 border-border focus:border-primary rounded-xl text-xs text-text-primary outline-none"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-3 border-t border-border">
            <Button type="button" variant="secondary" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={modalLoading}>
              {editingItem ? "Update Delivery Charge Rule" : "Create Delivery Charge Rule"}
            </Button>
          </div>
        </form>
      </Dialog>

      {/* ──────────────────────────────────────────────────────────────────────────
          BULK IMPORT MODAL
          ────────────────────────────────────────────────────────────────────────── */}
      <Dialog
        isOpen={showBulkModal}
        onClose={() => setShowBulkModal(false)}
        title={
          selectedKit && selectedKit !== "default"
            ? `Bulk Import Pincodes for ${selectedKit.name}`
            : "Bulk Import Pincode Delivery Rates"
        }
        size="md"
      >
        <div className="space-y-4 p-1">
          {selectedKit && selectedKit !== "default" && (
            <div className="p-2.5 bg-primary/10 border border-primary/20 rounded-xl text-xs font-bold text-primary flex items-center gap-2">
              <FaBoxOpen />
              <span>
                All imported rows will automatically be linked to: <strong>{selectedKit.name}</strong>
              </span>
            </div>
          )}

          <p className="text-xs text-text-secondary leading-relaxed">
            Paste rows in CSV format: <br />
            <code className="bg-surface-hover px-1.5 py-0.5 rounded text-primary font-mono text-[11px]">
              State, District, Pincode, DeliveryCost
            </code>
          </p>

          <textarea
            rows={8}
            value={bulkText}
            onChange={(e) => setBulkText(e.target.value)}
            placeholder={`Gujarat, Devbhoomi Dwarka, 361320, 1500\nGujarat, Jamnagar, 361001, 1200\nGujarat, Ahmedabad, 380001, 800`}
            className="w-full p-3 bg-surface border-2 border-border focus:border-primary rounded-xl text-xs font-mono text-text-primary outline-none"
          />

          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={() =>
                setBulkText(
                  `Gujarat, Devbhoomi Dwarka, 361320, 1500\nGujarat, Jamnagar, 361001, 1200\nGujarat, Rajkot, 360001, 1000\nMaharashtra, Pune, 411001, 1400`
                )
              }
              className="text-[11px] text-primary font-bold hover:underline"
            >
              Load Sample Data
            </button>

            <div className="flex gap-2">
              <Button variant="secondary" onClick={() => setShowBulkModal(false)}>
                Cancel
              </Button>
              <Button variant="primary" loading={bulkLoading} onClick={handleBulkImport}>
                Import Rates
              </Button>
            </div>
          </div>
        </div>
      </Dialog>

      {/* ──────────────────────────────────────────────────────────────────────────
          DELETE CONFIRMATION POPUP
          ────────────────────────────────────────────────────────────────────────── */}
      <ConfirmationPopup
        isOpen={Boolean(deleteConfirm)}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Delivery Freight Rule"
        message={`Are you sure you want to remove delivery freight for ${
          deleteConfirm?.district_name || ""
        }, ${deleteConfirm?.state_name || ""} (${deleteConfirm?.pincode || ""})?`}
      />
    </div>
  );
}
