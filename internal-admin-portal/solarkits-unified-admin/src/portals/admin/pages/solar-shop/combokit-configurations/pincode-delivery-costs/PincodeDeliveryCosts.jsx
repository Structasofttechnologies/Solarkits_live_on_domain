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
} from "react-icons/fa";

const API_URL = import.meta.env.VITE_API_URL;
const MODULE_UID = "ADM_COMBO_KITS";

export default function PincodeDeliveryCosts({ moduleUniqueId = MODULE_UID }) {
  const { countryName = "india" } = useParams();
  const dispatch = useDispatch();

  // State
  const [loading, setLoading] = useState(false);
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

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [filterState, setFilterState] = useState("");
  const [filterDistrict, setFilterDistrict] = useState("");
  const [filterKit, setFilterKit] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);

  // Geographic masters
  const [states, setStates] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [modalDistricts, setModalDistricts] = useState([]);
  const [comboKits, setComboKits] = useState([]);

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

  // 2. Fetch Combo Kits for product filter & modal dropdown
  useEffect(() => {
    const fetchKits = async () => {
      try {
        const res = await axios.get(
          `${API_URL}/combo-kits/india/get-kits?unique_id=${moduleUniqueId}&req_for=view`,
          { headers: authHeaderObj() }
        );
        const list = res.data?.data || [];
        setComboKits(list);
      } catch (err) {
        console.error("Failed to load combo kits:", err);
      }
    };
    fetchKits();
  }, [moduleUniqueId]);

  // 3. Filter Districts when filterState changes
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

  // 4. Modal Districts when formData.state_name changes
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

  // 5. Fetch Delivery Cost Records
  const fetchRecords = async () => {
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
      if (filterKit) params.combo_kit_id = filterKit;
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
    fetchRecords();
  }, [currentPage, filterState, filterDistrict, filterKit, filterStatus, moduleUniqueId]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchRecords();
  };

  // Reset Filters
  const handleResetFilters = () => {
    setSearchTerm("");
    setFilterState("");
    setFilterDistrict("");
    setFilterKit("");
    setFilterStatus("all");
    setCurrentPage(1);
    setLoading(true);
    axios
      .get(`${API_URL}/pincode-delivery-costs`, {
        params: {
          unique_id: moduleUniqueId,
          req_for: "view",
          page: 1,
          limit: 20,
        },
        headers: authHeaderObj(),
      })
      .then((res) => {
        if (res.data?.status === "success") {
          setItems(res.data.data || []);
          if (res.data.meta) setMeta(res.data.meta);
        }
      })
      .catch((err) => {
        console.error("Error resetting filters:", err);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  // Open Modal for Add
  const handleOpenAdd = () => {
    setEditingItem(null);
    setFormData({
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
      fetchRecords();
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
      fetchRecords();
    } catch (err) {
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

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      // Format: State, District, Pincode, Cost, KitId(optional)
      const parts = line.split(",").map((p) => p.trim());
      if (parts.length >= 4) {
        parsedItems.push({
          state_name: parts[0],
          district_name: parts[1],
          pincode: parts[2],
          delivery_cost: Number(parts[3]) || 0,
          combo_kit_id: parts[4] || null,
        });
      }
    }

    if (parsedItems.length === 0) {
      dispatch(
        setAlert({
          type: "warning",
          message: "No valid rows found. Format: State, District, Pincode, Cost (e.g. Gujarat, Devbhumi Dwarka, 361320, 1500)",
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
      fetchRecords();
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


  return (
    <div className="space-y-6">
      {/* PAGE HEADER */}
      <PageHeader
        title="Pincode Wise Delivery Cost Master"
        description="Configure product-specific and regional pincode freight rates across Indian states & districts for EPC orders"
        meta={[
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
              onClick={fetchRecords}
              leftIcon={<FaSync />}
              className="border-border text-text-secondary hover:bg-surface-hover"
            >
              Refresh
            </Button>
            <Button variant="primary" size="md" onClick={handleOpenAdd} leftIcon={<FaPlus />}>
              Add Delivery Freight
            </Button>
          </div>
        }
      />

      {/* FILTER TOOLBAR */}
      <div className="bg-surface rounded-2xl border-2 border-border/60 p-6 shadow-sm">
        <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
          {/* Search Pincode or Location */}
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

          {/* Combo Kit Filter */}
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

      {/* TABLE */}
      <div className="bg-surface rounded-2xl border-2 border-border/60 shadow-sm overflow-hidden">
        {/* Table summary bar */}
        <div className="px-6 py-4 bg-surface-hover/30 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse" />
            <span className="text-xs font-black text-text-primary uppercase tracking-wider">
              Configured Pincode Delivery Rates
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

                    {/* Applicable Product / Kit */}
                    <td className="px-6 py-4">
                      {item.combo_kit_id || item.combo_kit_name ? (
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-md bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0 font-bold text-xs">
                            <FaBoxOpen size={11} />
                          </span>
                          <div>
                            <p className="text-xs font-bold text-text-primary line-clamp-1">
                              {typeof item.combo_kit_id === 'object' && item.combo_kit_id?.name
                                ? item.combo_kit_id.name
                                : item.combo_kit_name || "Specific Kit"}
                            </p>
                            {typeof item.combo_kit_id === 'object' && item.combo_kit_id?.capacity && (
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
                        className={`inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full border ${item.is_active !== false
                          ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20"
                          : "bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20"
                          }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${item.is_active !== false ? "bg-emerald-500" : "bg-rose-500"
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
                  <td colSpan={7} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center justify-center gap-3 max-w-sm mx-auto">
                      <div className="w-14 h-14 rounded-2xl bg-surface-hover flex items-center justify-center text-text-muted">
                        <FaTruck size={24} className="opacity-40" />
                      </div>
                      <div>
                        <h4 className="font-black text-sm text-text-primary">
                          No Pincode Delivery Rules Found
                        </h4>
                        <p className="text-xs text-text-secondary mt-1">
                          No delivery freight configured matching the current filters. Add a new delivery rule or reset filters to see all records.
                        </p>
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <Button
                          variant="primary"
                          size="sm"
                          leftIcon={<FaPlus />}
                          onClick={handleOpenAdd}
                        >
                          Add Delivery Freight
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={handleResetFilters}
                        >
                          Reset Filters
                        </Button>
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

      {/* ADD / EDIT MODAL */}
      <Dialog
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingItem ? "Edit Delivery Charge Rule" : "Add Pincode Delivery Charge"}
        size="lg"
      >
        <form onSubmit={handleSaveRecord} className="space-y-5 p-1">
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

          {/* Product / Combo Kit Selector */}
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

      {/* BULK IMPORT MODAL */}
      <Dialog
        isOpen={showBulkModal}
        onClose={() => setShowBulkModal(false)}
        title="Bulk Import Pincode Delivery Rates"
        size="md"
      >
        <div className="space-y-4 p-1">
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
            placeholder={`Gujarat, Devbhumi Dwarka, 361320, 1500\nGujarat, Jamnagar, 361001, 1200\nGujarat, Ahmedabad, 380001, 800`}
            className="w-full p-3 bg-surface border-2 border-border focus:border-primary rounded-xl text-xs font-mono text-text-primary outline-none"
          />

          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={() =>
                setBulkText(
                  `Gujarat, Devbhumi Dwarka, 361320, 1500\nGujarat, Jamnagar, 361001, 1200\nGujarat, Rajkot, 360001, 1000\nMaharashtra, Pune, 411001, 1400`
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

      {/* DELETE CONFIRMATION POPUP */}
      <ConfirmationPopup
        isOpen={Boolean(deleteConfirm)}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Delivery Freight Rule"
        message={`Are you sure you want to remove delivery freight for ${deleteConfirm?.district_name || ""}, ${deleteConfirm?.state_name || ""} (${deleteConfirm?.pincode || ""})?`}
      />
    </div>
  );
}
