import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
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
  FaAward,
  FaPlus,
  FaSearch,
  FaEdit,
  FaTrash,
  FaSync,
  FaMapMarkerAlt,
  FaBoxOpen,
  FaCheckCircle,
  FaStar,
  FaFire,
  FaArrowLeft,
  FaBolt
} from "react-icons/fa";

const API_URL = import.meta.env.VITE_API_URL;
const MODULE_UID = "ADM_COMBO_KITS";

const DEFAULT_KIT_IMAGE = "https://images.unsplash.com/photo-1509391365360-2e959784a276?w=400&auto=format&fit=crop&q=80";

export default function BestSellerConfiguration({ moduleUniqueId = MODULE_UID }) {
  const { countryName = "india" } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  // State
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState({
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 1,
    stats: {
      totalActive: 0,
      distinctStatesCount: 0,
      distinctDistrictsCount: 0,
      distinctKitsCount: 0
    }
  });

  // Filters
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

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [formData, setFormData] = useState({
    state_id: "",
    state_name: "",
    district_id: "",
    district_name: "",
    combo_kit_id: "",
    badge_text: "Our Best Seller",
    priority: 1,
    is_active: true,
    notes: ""
  });

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

  // 2. Fetch Combo Kits
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
          (s) => s.name?.toLowerCase() === filterState.toLowerCase() || s.id === filterState || s._id === filterState
        );
        const stateId = selectedStateObj?._id || selectedStateObj?.id || filterState;
        const res = await axios.get(
          `${API_URL}/geolocation/districts?unique_id=${moduleUniqueId}&req_for=view&state_id=${stateId}`,
          { headers: authHeaderObj() }
        );
        const list = res.data?.districts || res.data?.data || [];
        setDistricts(list);
      } catch (err) {
        console.error("Failed to load districts for filter:", err);
      }
    };
    fetchDistricts();
  }, [filterState, states, moduleUniqueId]);

  // 4. Modal Districts when formData.state_id changes
  useEffect(() => {
    if (!formData.state_id) {
      setModalDistricts([]);
      return;
    }
    const fetchModalDistricts = async () => {
      try {
        const res = await axios.get(
          `${API_URL}/geolocation/districts?unique_id=${moduleUniqueId}&req_for=view&state_id=${formData.state_id}`,
          { headers: authHeaderObj() }
        );
        const list = res.data?.districts || res.data?.data || [];
        setModalDistricts(list);
      } catch (err) {
        console.error("Failed to load modal districts:", err);
      }
    };
    fetchModalDistricts();
  }, [formData.state_id, moduleUniqueId]);

  // 5. Fetch Best Seller Records
  const fetchRecords = async () => {
    setLoading(true);
    try {
      const selectedStateObj = states.find(
        (s) => s.name?.toLowerCase() === filterState.toLowerCase() || s.id === filterState || s._id === filterState
      );
      const stateId = selectedStateObj?._id || selectedStateObj?.id || "";

      let distId = "";
      if (filterDistrict) {
        const selectedDistObj = districts.find(
          (d) => d.name?.toLowerCase() === filterDistrict.toLowerCase() || d.id === filterDistrict || d._id === filterDistrict
        );
        distId = selectedDistObj?._id || selectedDistObj?.id || filterDistrict;
      }

      const res = await axios.get(`${API_URL}/best-seller-configs`, {
        params: {
          unique_id: moduleUniqueId,
          req_for: "view",
          page: currentPage,
          limit: 20,
          search: searchTerm.trim(),
          state_id: stateId,
          district_id: distId,
          combo_kit_id: filterKit,
          status: filterStatus
        },
        headers: authHeaderObj()
      });

      if (res.data?.status === "success") {
        setItems(res.data.data || []);
        if (res.data.meta) setMeta(res.data.meta);
      }
    } catch (err) {
      console.error("Failed to load best sellers:", err);
      dispatch(
        setAlert({
          type: "error",
          message: err.response?.data?.message || "Failed to load best seller configurations."
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

  const handleResetFilters = () => {
    setSearchTerm("");
    setFilterState("");
    setFilterDistrict("");
    setFilterKit("");
    setFilterStatus("all");
    setCurrentPage(1);
  };

  // Open Modal for Add
  const handleOpenAdd = () => {
    setEditingItem(null);
    setFormData({
      state_id: "",
      state_name: "",
      district_id: "",
      district_name: "",
      combo_kit_id: "",
      badge_text: "Our Best Seller",
      priority: (meta.total || items.length) + 1,
      is_active: true,
      notes: ""
    });
    setShowModal(true);
  };

  // Open Modal for Edit
  const handleOpenEdit = (item) => {
    setEditingItem(item);
    setFormData({
      state_id: item.state_id?._id || item.state_id || "",
      state_name: item.state_name || "",
      district_id: item.district_id?._id || item.district_id || "",
      district_name: item.district_name || "All Districts",
      combo_kit_id: item.combo_kit_id?._id || item.combo_kit_id?.id || item.combo_kit_id || "",
      badge_text: item.badge_text || "Our Best Seller",
      priority: item.priority || 1,
      is_active: item.is_active !== false,
      notes: item.notes || ""
    });
    setShowModal(true);
  };

  // Save Modal (Create / Update)
  const handleSaveForm = async (e) => {
    e.preventDefault();
    if (!formData.state_id) {
      dispatch(setAlert({ type: "error", message: "Please select a State." }));
      return;
    }
    if (!formData.combo_kit_id) {
      dispatch(setAlert({ type: "error", message: "Please select a Combo Kit." }));
      return;
    }

    setModalLoading(true);
    try {
      if (editingItem) {
        // UPDATE
        const res = await axios.put(
          `${API_URL}/best-seller-configs/${editingItem._id || editingItem.id}?unique_id=${moduleUniqueId}&req_for=edit`,
          {
            district_id: formData.district_id || null,
            badge_text: formData.badge_text,
            priority: parseInt(formData.priority, 10) || 1,
            is_active: formData.is_active,
            notes: formData.notes
          },
          { headers: authHeaderObj() }
        );
        if (res.data?.status === "success") {
          dispatch(setAlert({ type: "success", message: "Best Seller configuration updated." }));
          setShowModal(false);
          fetchRecords();
        }
      } else {
        // CREATE
        const res = await axios.post(
          `${API_URL}/best-seller-configs?unique_id=${moduleUniqueId}&req_for=add`,
          {
            state_id: formData.state_id,
            district_id: formData.district_id || null,
            combo_kit_id: formData.combo_kit_id,
            badge_text: formData.badge_text || "Our Best Seller",
            priority: parseInt(formData.priority, 10) || 1,
            is_active: formData.is_active,
            notes: formData.notes
          },
          { headers: authHeaderObj() }
        );
        if (res.data?.status === "success") {
          dispatch(setAlert({ type: "success", message: "Combo Kit tagged as Best Seller successfully." }));
          setShowModal(false);
          fetchRecords();
        }
      }
    } catch (err) {
      console.error("Save error:", err);
      dispatch(
        setAlert({
          type: "error",
          message: err.response?.data?.message || "Failed to save Best Seller configuration."
        })
      );
    } finally {
      setModalLoading(false);
    }
  };

  // Delete
  const handleDeleteConfirm = async () => {
    if (!deleteConfirm) return;
    try {
      const res = await axios.delete(
        `${API_URL}/best-seller-configs/${deleteConfirm._id || deleteConfirm.id}?unique_id=${moduleUniqueId}&req_for=delete`,
        { headers: authHeaderObj() }
      );
      if (res.data?.status === "success") {
        dispatch(setAlert({ type: "success", message: "Best Seller tag removed successfully." }));
        setDeleteConfirm(null);
        fetchRecords();
      }
    } catch (err) {
      console.error("Delete error:", err);
      dispatch(
        setAlert({
          type: "error",
          message: err.response?.data?.message || "Failed to delete Best Seller tag."
        })
      );
    }
  };

  // Inline Status Toggle
  const handleToggleStatus = async (item) => {
    try {
      const res = await axios.patch(
        `${API_URL}/best-seller-configs/${item._id || item.id}/toggle-status?unique_id=${moduleUniqueId}&req_for=edit`,
        {},
        { headers: authHeaderObj() }
      );
      if (res.data?.status === "success") {
        setItems((prev) =>
          prev.map((it) =>
            (it._id || it.id) === (item._id || item.id) ? { ...it, is_active: res.data.is_active } : it
          )
        );
        dispatch(
          setAlert({
            type: "success",
            message: `Tag marked as ${res.data.is_active ? "Active" : "Inactive"}.`
          })
        );
      }
    } catch (err) {
      console.error("Status toggle error:", err);
      dispatch(setAlert({ type: "error", message: "Failed to update status." }));
    }
  };

  // Selected kit for form preview
  const selectedKitPreview = useMemo(() => {
    if (!formData.combo_kit_id) return null;
    return comboKits.find((k) => (k._id || k.id) === formData.combo_kit_id);
  }, [formData.combo_kit_id, comboKits]);

  return (
    <div className="space-y-6">
      {/* PAGE HEADER */}
      <PageHeader
        title="Best Seller Configuration"
        subtitle="Tag and prioritize top-performing Combo Kits for specific States and Districts (e.g. Gujarat → Rajkot) to showcase in the customer store."
        icon={FaAward}
        stats={[
          {
            label: "Total Best Sellers",
            value: meta.total || items.length,
            description: "Configured kit tags",
            icon: FaStar
          },
          {
            label: "Active States",
            value: meta.stats?.distinctStatesCount || 0,
            description: "States with active tags",
            icon: FaMapMarkerAlt
          },
          {
            label: "Covered Districts",
            value: meta.stats?.distinctDistrictsCount || 0,
            description: "Targeted districts",
            icon: FaFire
          },
          {
            label: "Unique Kits Tagged",
            value: meta.stats?.distinctKitsCount || 0,
            description: "Catalog combo kits",
            icon: FaBoxOpen
          }
        ]}
        actions={
          <div className="flex items-center gap-3">
            <Button
              variant="secondary"
              size="md"
              leftIcon={<FaArrowLeft />}
              onClick={() =>
                navigate(`/admin-panel/solar-shop/${countryName || "india"}/combokit-configurations/combo-kits`)
              }
            >
              Combo Kits
            </Button>
            <Button
              variant="primary"
              size="md"
              leftIcon={<FaPlus />}
              onClick={handleOpenAdd}
              className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white shadow-md cursor-pointer font-bold"
            >
              Add Best Seller Tag
            </Button>
          </div>
        }
      />

      {/* FILTER & SEARCH BAR */}
      <div className="bg-surface rounded-2xl p-5 border border-border/80 shadow-xs">
        <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
          {/* Search */}
          <div className="space-y-1 lg:col-span-1">
            <label className="text-[10px] font-bold text-text-secondary uppercase tracking-wider ml-1">
              Search
            </label>
            <div className="relative">
              <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted text-xs pointer-events-none" />
              <input
                type="text"
                placeholder="Search kit or location..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full h-10 pl-9 pr-4 bg-surface border border-border focus:border-amber-500 rounded-xl text-xs font-semibold text-text-primary placeholder:text-text-muted outline-none transition-colors"
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
                ...states.map((s) => ({ text: s.name, label: s.name, value: s.name }))
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
                ...districts.map((d) => ({ text: d.name, label: d.name, value: d.name }))
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

          {/* Status Filter */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-text-secondary uppercase tracking-wider ml-1">
              Status
            </label>
            <select
              value={filterStatus}
              onChange={(e) => {
                setFilterStatus(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full h-10 px-3 bg-surface border border-border rounded-xl text-xs font-semibold text-text-primary outline-none focus:border-amber-500 transition-colors"
            >
              <option value="all">All Status</option>
              <option value="active">Active Only</option>
              <option value="inactive">Inactive Only</option>
            </select>
          </div>

          {/* Filter Buttons */}
          <div className="flex gap-2">
            <Button type="submit" variant="primary" size="md" className="flex-1 font-bold">
              Filter
            </Button>
            <Button type="button" variant="secondary" size="md" onClick={handleResetFilters}>
              Reset
            </Button>
          </div>
        </form>
      </div>

      {/* BEST SELLERS TABLE */}
      <div className="bg-surface rounded-2xl border border-border/80 shadow-xs overflow-hidden">
        <div className="px-6 py-4 bg-surface-hover/30 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
            <span className="text-xs font-black text-text-primary uppercase tracking-wider">
              State & District Best Seller Matrix
            </span>
          </div>
          <span className="text-[11px] font-bold text-text-secondary bg-surface px-3 py-1 rounded-full border border-border">
            Total {meta.total || items.length} Configuration{meta.total === 1 ? "" : "s"}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="bg-surface-hover/60 border-b border-border text-[11px] font-black uppercase tracking-wider text-text-secondary">
                <th className="px-6 py-4">Rank / Priority</th>
                <th className="px-6 py-4">Combo Kit Details</th>
                <th className="px-6 py-4">Target Region (State & District)</th>
                <th className="px-6 py-4">Badge / Tag Display</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60 text-xs">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <div className="animate-spin rounded-full h-9 w-9 border-3 border-amber-500 border-t-transparent" />
                      <p className="text-xs font-bold text-text-secondary">
                        Loading best seller configurations...
                      </p>
                    </div>
                  </td>
                </tr>
              ) : items.length > 0 ? (
                items.map((item) => {
                  const kit = item.combo_kit_id || {};
                  return (
                    <tr
                      key={item._id || item.id}
                      className="hover:bg-amber-500/5 transition-colors group"
                    >
                      {/* Priority Rank */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className={`w-8 h-8 rounded-xl font-black flex items-center justify-center text-xs shadow-xs border ${
                            item.priority === 1
                              ? "bg-amber-500 text-white border-amber-400"
                              : item.priority <= 3
                              ? "bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/30"
                              : "bg-surface-hover text-text-primary border-border"
                          }`}>
                            #{item.priority}
                          </span>
                        </div>
                      </td>

                      {/* Combo Kit Info */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={kit.kit_image || DEFAULT_KIT_IMAGE}
                            alt={kit.name || "Combo Kit"}
                            className="w-12 h-12 object-cover rounded-xl border border-border shadow-xs shrink-0"
                            onError={(e) => { e.currentTarget.src = DEFAULT_KIT_IMAGE; }}
                          />
                          <div>
                            <p className="font-bold text-text-primary text-sm line-clamp-1">
                              {kit.name || "Unnamed Kit"}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-primary/10 text-primary border border-primary/20">
                                <FaBolt className="inline mr-1 text-[9px]" />
                                {kit.capacity ? `${kit.capacity} kW` : "Custom"}
                              </span>
                              {kit.base_price_cached > 0 && (
                                <span className="text-[11px] font-bold text-text-secondary">
                                  ₹{Number(kit.base_price_cached).toLocaleString("en-IN")}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Region (State & District) */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                            <FaMapMarkerAlt size={12} />
                          </span>
                          <div>
                            <p className="font-black text-text-primary text-xs uppercase tracking-wide">
                              {item.state_name}
                            </p>
                            <span className={`inline-block text-[11px] font-semibold mt-0.5 ${
                              item.district_id
                                ? "text-emerald-600 dark:text-emerald-400 font-bold"
                                : "text-text-muted"
                            }`}>
                              {item.district_id ? `District: ${item.district_name}` : "All Districts (State-wide)"}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Badge Preview */}
                      <td className="px-6 py-4">
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-xs">
                          <FaStar className="text-yellow-200 text-[10px]" />
                          <span>{item.badge_text || "Our Best Seller"}</span>
                        </div>
                        {item.notes && (
                          <p className="text-[10px] text-text-muted mt-1 italic max-w-xs truncate">
                            Note: {item.notes}
                          </p>
                        )}
                      </td>

                      {/* Active Status Toggle */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(item)}
                          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                            item.is_active ? "bg-emerald-500" : "bg-slate-300 dark:bg-slate-700"
                          }`}
                          title={`Click to ${item.is_active ? "deactivate" : "activate"}`}
                        >
                          <span
                            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                              item.is_active ? "translate-x-5" : "translate-x-0"
                            }`}
                          />
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2">
                          <IconButton
                            icon={<FaEdit size={13} />}
                            variant="secondary"
                            size="sm"
                            title="Edit Configuration"
                            onClick={() => handleOpenEdit(item)}
                          />
                          <IconButton
                            icon={<FaTrash size={13} />}
                            variant="danger"
                            size="sm"
                            title="Delete Tag"
                            onClick={() => setDeleteConfirm(item)}
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <div className="w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
                        <FaAward size={26} />
                      </div>
                      <p className="text-sm font-bold text-text-primary">
                        No Best Seller tags configured yet
                      </p>
                      <p className="text-xs text-text-secondary max-w-md">
                        Assign Combo Kits as "Our Best Seller" for Gujarat → Rajkot or other regions so EPC buyers and store customers see localized top recommendations.
                      </p>
                      <Button
                        variant="primary"
                        size="sm"
                        leftIcon={<FaPlus />}
                        onClick={handleOpenAdd}
                        className="mt-2 bg-amber-500 hover:bg-amber-600 text-white font-bold cursor-pointer"
                      >
                        Add First Best Seller Tag
                      </Button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINATION */}
        {meta.totalPages > 1 && (
          <div className="p-4 border-t border-border flex justify-end">
            <Pagination
              currentPage={currentPage}
              totalPages={meta.totalPages}
              onPageChange={(page) => setCurrentPage(page)}
            />
          </div>
        )}
      </div>

      {/* ADD / EDIT MODAL DIALOG */}
      <Dialog
        isOpen={showModal}
        onClose={() => !modalLoading && setShowModal(false)}
        title={editingItem ? "Edit Best Seller Configuration" : "Add 'Our Best Seller' Tag"}
        size="lg"
      >
        <form onSubmit={handleSaveForm} className="space-y-5">
          {/* Notice Alert */}
          <div className="p-3.5 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-start gap-3">
            <FaStar className="text-amber-500 mt-0.5 shrink-0" size={16} />
            <p className="text-xs text-text-secondary leading-relaxed">
              When tagged, this Combo Kit will appear in the <strong>"Our Best Seller"</strong> showcase for buyers browsing from the selected State and District (e.g. <strong>Gujarat → Rajkot</strong>).
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* State Select */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-text-primary">
                Select State <span className="text-danger">*</span>
              </label>
              <DropdownWithSearchInput
                options={states.map((s) => ({
                  text: s.name,
                  label: s.name,
                  value: s._id || s.id
                }))}
                value={formData.state_id}
                onChange={(val) => {
                  const stateObj = states.find((s) => (s._id || s.id) === val);
                  setFormData((prev) => ({
                    ...prev,
                    state_id: val,
                    state_name: stateObj?.name || "",
                    district_id: "",
                    district_name: "All Districts"
                  }));
                }}
                placeholder="Choose State (e.g. Gujarat)"
                disabled={!!editingItem}
              />
            </div>

            {/* District Select */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-text-primary">
                Select District <span className="text-text-muted font-normal">(Optional / All)</span>
              </label>
              <DropdownWithSearchInput
                options={[
                  { text: "★ All Districts in State (State-wide)", label: "★ All Districts in State (State-wide)", value: "" },
                  ...modalDistricts.map((d) => ({
                    text: d.name,
                    label: d.name,
                    value: d._id || d.id
                  }))
                ]}
                value={formData.district_id}
                onChange={(val) => {
                  const distObj = modalDistricts.find((d) => (d._id || d.id) === val);
                  setFormData((prev) => ({
                    ...prev,
                    district_id: val,
                    district_name: distObj ? distObj.name : "All Districts"
                  }));
                }}
                placeholder={formData.state_id ? "Choose District (e.g. Rajkot)" : "Select State First"}
                disabled={!formData.state_id}
              />
            </div>
          </div>

          {/* Combo Kit Selection */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-text-primary">
              Select Combo Kit to Tag <span className="text-danger">*</span>
            </label>
            <DropdownWithSearchInput
              options={comboKits.map((k) => ({
                text: `${k.name} — ${k.capacity || 0} kW ${k.base_price_cached ? `(₹${Number(k.base_price_cached).toLocaleString("en-IN")})` : ""}`,
                label: `${k.name} — ${k.capacity || 0} kW`,
                value: k._id || k.id
              }))}
              value={formData.combo_kit_id}
              onChange={(val) => setFormData((prev) => ({ ...prev, combo_kit_id: val }))}
              placeholder="Search and choose a created Combo Kit..."
              disabled={!!editingItem}
            />

            {/* Kit Preview Card */}
            {selectedKitPreview && (
              <div className="mt-2 p-3 bg-surface-hover rounded-xl border border-border flex items-center gap-3">
                <img
                  src={selectedKitPreview.kit_image || DEFAULT_KIT_IMAGE}
                  alt={selectedKitPreview.name}
                  className="w-12 h-12 object-cover rounded-lg border border-border shrink-0"
                  onError={(e) => { e.currentTarget.src = DEFAULT_KIT_IMAGE; }}
                />
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-text-primary text-xs truncate">
                    {selectedKitPreview.name}
                  </p>
                  <p className="text-[11px] text-text-secondary mt-0.5">
                    Capacity: <strong>{selectedKitPreview.capacity || 0} kW</strong> • Inverter: {selectedKitPreview.inverter_mode || "Single"}
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Custom Badge Text */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-text-primary">
                Badge / Tag Text
              </label>
              <input
                type="text"
                value={formData.badge_text}
                onChange={(e) => setFormData((prev) => ({ ...prev, badge_text: e.target.value }))}
                placeholder="e.g. Our Best Seller / Most Popular"
                className="w-full h-10 px-3 bg-surface border border-border focus:border-amber-500 rounded-xl text-xs font-semibold text-text-primary outline-none"
              />
              <p className="text-[10px] text-text-muted">
                Preview: <span className="text-amber-500 font-bold">★ {formData.badge_text || "Our Best Seller"}</span>
              </p>
            </div>

            {/* Priority Ranking */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-text-primary">
                Display Rank / Priority
              </label>
              <input
                type="number"
                min="1"
                max="99"
                value={formData.priority}
                onChange={(e) => setFormData((prev) => ({ ...prev, priority: e.target.value }))}
                className="w-full h-10 px-3 bg-surface border border-border focus:border-amber-500 rounded-xl text-xs font-semibold text-text-primary outline-none"
              />
              <p className="text-[10px] text-text-muted">
                1 is shown first, followed by 2, 3...
              </p>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-text-primary">
              Admin Notes / Justification <span className="text-text-muted font-normal">(Internal only)</span>
            </label>
            <textarea
              rows="2"
              value={formData.notes}
              onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
              placeholder="e.g. High EPC demand for 3kW subsidy models in Rajkot district"
              className="w-full p-3 bg-surface border border-border focus:border-amber-500 rounded-xl text-xs text-text-primary outline-none resize-none"
            />
          </div>

          {/* Active Switch */}
          <div className="flex items-center justify-between p-3 bg-surface-hover rounded-xl border border-border">
            <div>
              <p className="text-xs font-bold text-text-primary">Active Status</p>
              <p className="text-[10px] text-text-muted">Enable to show immediately in the store</p>
            </div>
            <button
              type="button"
              onClick={() => setFormData((prev) => ({ ...prev, is_active: !prev.is_active }))}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                formData.is_active ? "bg-emerald-500" : "bg-slate-300 dark:bg-slate-700"
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                  formData.is_active ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          {/* Dialog Action Buttons */}
          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="secondary"
              size="md"
              onClick={() => setShowModal(false)}
              disabled={modalLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="md"
              disabled={modalLoading}
              className="bg-amber-500 hover:bg-amber-600 text-white font-bold cursor-pointer"
            >
              {modalLoading ? "Saving..." : editingItem ? "Update Tag" : "Save Best Seller Tag"}
            </Button>
          </div>
        </form>
      </Dialog>

      {/* DELETE CONFIRMATION POPUP */}
      <ConfirmationPopup
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={handleDeleteConfirm}
        title="Remove Best Seller Tag?"
        message={`Are you sure you want to remove the Best Seller tag for "${deleteConfirm?.combo_kit_id?.name || 'this kit'}" in ${deleteConfirm?.state_name} → ${deleteConfirm?.district_name}? It will no longer appear in the curated Best Seller section.`}
        confirmText="Remove Tag"
        cancelText="Keep"
        variant="danger"
      />
    </div>
  );
}
