import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import axios from "axios";
import {
  FaLayerGroup,
  FaWarehouse,
  FaBoxes,
  FaPlus,
  FaEdit,
  FaTrash,
  FaCheck,
  FaTimes,
  FaSearch,
  FaMapMarkerAlt,
} from "react-icons/fa";
import { setAlert } from "@/features/alert.slice";
import Button from "@/components/Button";
import Loader from "@/components/Loader";
import CustomInput from "@/components/CustomInput";
import Dialog from "@/components/Dialog";
import ToggleButton from "@/components/ToggleButton";
import { authHeaderObj } from "@/app/authHeader";

const API_URL = import.meta.env.VITE_API_URL;

// Initial Mock Data
const MOCK_CLUSTERS = [
  {
    id: "cl-1",
    name: "North Cluster (NCR & Punjab)",
    code: "CL-NORTH-01",
    states: ["Delhi", "Haryana", "Punjab", "Uttar Pradesh (West)"],
    status: "Active",
    warehouses_count: 2,
    created_at: "2026-01-15",
  },
  {
    id: "cl-2",
    name: "West Cluster (Gujarat & Maharashtra)",
    code: "CL-WEST-01",
    states: ["Gujarat", "Maharashtra", "Goa"],
    status: "Active",
    warehouses_count: 3,
    created_at: "2026-02-01",
  },
  {
    id: "cl-3",
    name: "South Cluster (Karnataka & TN)",
    code: "CL-SOUTH-01",
    states: ["Karnataka", "Tamil Nadu", "Telangana", "Andhra Pradesh"],
    status: "Active",
    warehouses_count: 2,
    created_at: "2026-02-10",
  },
  {
    id: "cl-4",
    name: "Central & East Cluster",
    code: "CL-EAST-01",
    states: ["Madhya Pradesh", "Rajasthan", "West Bengal", "Bihar"],
    status: "Inactive",
    warehouses_count: 1,
    created_at: "2026-03-01",
  },
];

const MOCK_MAPPINGS = [
  {
    id: "wm-1",
    warehouse_name: "Bhiwandi Central Hub (WH-01)",
    warehouse_code: "WH-BHI-01",
    cluster_id: "cl-2",
    cluster_name: "West Cluster (Gujarat & Maharashtra)",
    states: ["Maharashtra", "Goa"],
    kit_types: ["Combo Kit", "Customize Kit", "Bulk Kit"],
    effective_from: "2026-01-01",
    status: "Active",
  },
  {
    id: "wm-2",
    warehouse_name: "Ahmedabad Sub-Depot (WH-02)",
    warehouse_code: "WH-AHM-02",
    cluster_id: "cl-2",
    cluster_name: "West Cluster (Gujarat & Maharashtra)",
    states: ["Gujarat"],
    kit_types: ["Combo Kit"],
    effective_from: "2026-01-15",
    status: "Active",
  },
  {
    id: "wm-3",
    warehouse_name: "Gurgaon NCR Hub (WH-03)",
    warehouse_code: "WH-GUR-03",
    cluster_id: "cl-1",
    cluster_name: "North Cluster (NCR & Punjab)",
    states: ["Delhi", "Haryana", "Uttar Pradesh (West)"],
    kit_types: ["Combo Kit", "Customize Kit", "Bulk Kit"],
    effective_from: "2026-01-01",
    status: "Active",
  },
  {
    id: "wm-4",
    warehouse_name: "Bengaluru Master Hub (WH-04)",
    warehouse_code: "WH-BLR-04",
    cluster_id: "cl-3",
    cluster_name: "South Cluster (Karnataka & TN)",
    states: ["Karnataka", "Tamil Nadu", "Telangana"],
    kit_types: ["Combo Kit", "Customize Kit"],
    effective_from: "2026-02-01",
    status: "Active",
  },
];

const MOCK_WAREHOUSE_CAPABILITIES = [
  {
    warehouse_id: "WH-BHI-01",
    warehouse_name: "Bhiwandi Central Hub",
    location: "Thane, Maharashtra",
    capabilities: {
      combo_kit: true,
      customize_kit: true,
      bulk_kit: true,
    },
    daily_capacity: 45,
    cutoff_time: "17:00",
  },
  {
    warehouse_id: "WH-AHM-02",
    warehouse_name: "Ahmedabad Sub-Depot",
    location: "Sanand, Gujarat",
    capabilities: {
      combo_kit: true,
      customize_kit: false,
      bulk_kit: false,
    },
    daily_capacity: 20,
    cutoff_time: "15:30",
  },
  {
    warehouse_id: "WH-GUR-03",
    warehouse_name: "Gurgaon NCR Hub",
    location: "Manesar, Haryana",
    capabilities: {
      combo_kit: true,
      customize_kit: true,
      bulk_kit: true,
    },
    daily_capacity: 40,
    cutoff_time: "18:00",
  },
  {
    warehouse_id: "WH-BLR-04",
    warehouse_name: "Bengaluru Master Hub",
    location: "Peenya, Bengaluru",
    capabilities: {
      combo_kit: true,
      customize_kit: true,
      bulk_kit: false,
    },
    daily_capacity: 35,
    cutoff_time: "16:00",
  },
];

const ALL_INDIAN_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Delhi",
  "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala",
  "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland",
  "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura",
  "Uttar Pradesh", "Uttarakhand", "West Bengal"
];

export default function ClusterWarehouseRouting() {
  const dispatch = useDispatch();
  const token = useSelector((state) => state.auth.token);

  const [activeTab, setActiveTab] = useState("clusters"); // "clusters" | "mappings" | "capabilities"
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Data states
  const [clusters, setClusters] = useState(MOCK_CLUSTERS);
  const [mappings, setMappings] = useState(MOCK_MAPPINGS);
  const [capabilities, setCapabilities] = useState(MOCK_WAREHOUSE_CAPABILITIES);

  // Modal states
  const [clusterModalOpen, setClusterModalOpen] = useState(false);
  const [editingCluster, setEditingCluster] = useState(null);
  const [clusterFormData, setClusterFormData] = useState({
    name: "",
    code: "",
    states: [],
    status: "Active",
  });

  const [mappingModalOpen, setMappingModalOpen] = useState(false);
  const [editingMapping, setEditingMapping] = useState(null);
  const [mappingFormData, setMappingFormData] = useState({
    warehouse_name: "",
    warehouse_code: "",
    cluster_id: "",
    states: [],
    kit_types: ["Combo Kit"],
    effective_from: new Date().toISOString().split("T")[0],
    status: "Active",
  });

  // Fetch data
  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/admin/geolocation/clusters`, {
        headers: authHeaderObj(),
      });
      if (res.data?.status === "success" && res.data.data) {
        setClusters(res.data.data);
      }
    } catch (err) {
      console.warn("Clusters API not available yet, using mock fallback:", err?.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchData();
    }
  }, [token]);

  // Cluster Modal Handlers
  const handleOpenClusterModal = (cluster = null) => {
    if (cluster) {
      setEditingCluster(cluster);
      setClusterFormData({ ...cluster });
    } else {
      setEditingCluster(null);
      setClusterFormData({
        name: "",
        code: `CL-${Date.now().toString().slice(-4)}`,
        states: [],
        status: "Active",
      });
    }
    setClusterModalOpen(true);
  };

  const handleSaveCluster = (e) => {
    e.preventDefault();
    if (!clusterFormData.name) {
      dispatch(setAlert({ type: "warning", message: "Please enter cluster name" }));
      return;
    }
    if (clusterFormData.states.length === 0) {
      dispatch(setAlert({ type: "warning", message: "Please select at least one state" }));
      return;
    }

    if (editingCluster) {
      setClusters((prev) =>
        prev.map((c) => (c.id === editingCluster.id ? { ...c, ...clusterFormData } : c))
      );
      dispatch(setAlert({ type: "success", message: "Cluster updated successfully!" }));
    } else {
      const newCluster = {
        ...clusterFormData,
        id: `cl-${Date.now()}`,
        warehouses_count: 0,
        created_at: new Date().toISOString().split("T")[0],
      };
      setClusters((prev) => [newCluster, ...prev]);
      dispatch(setAlert({ type: "success", message: "Cluster created successfully!" }));
    }
    setClusterModalOpen(false);
  };

  const handleDeleteCluster = (id) => {
    setClusters((prev) => prev.filter((c) => c.id !== id));
    dispatch(setAlert({ type: "info", message: "Cluster removed" }));
  };

  // Mapping Modal Handlers
  const handleOpenMappingModal = (mapping = null) => {
    if (mapping) {
      setEditingMapping(mapping);
      setMappingFormData({ ...mapping });
    } else {
      setEditingMapping(null);
      setMappingFormData({
        warehouse_name: "",
        warehouse_code: "",
        cluster_id: clusters[0]?.id || "",
        states: [],
        kit_types: ["Combo Kit"],
        effective_from: new Date().toISOString().split("T")[0],
        status: "Active",
      });
    }
    setMappingModalOpen(true);
  };

  const handleSaveMapping = (e) => {
    e.preventDefault();
    if (!mappingFormData.warehouse_name || !mappingFormData.cluster_id) {
      dispatch(setAlert({ type: "warning", message: "Warehouse and Cluster are required" }));
      return;
    }

    const selectedCluster = clusters.find((c) => c.id === mappingFormData.cluster_id);
    const updatedPayload = {
      ...mappingFormData,
      cluster_name: selectedCluster?.name || "Cluster",
    };

    if (editingMapping) {
      setMappings((prev) =>
        prev.map((m) => (m.id === editingMapping.id ? { ...m, ...updatedPayload } : m))
      );
      dispatch(setAlert({ type: "success", message: "Mapping updated successfully!" }));
    } else {
      const newMapping = {
        ...updatedPayload,
        id: `wm-${Date.now()}`,
      };
      setMappings((prev) => [newMapping, ...prev]);
      dispatch(setAlert({ type: "success", message: "Warehouse mapped successfully!" }));
    }
    setMappingModalOpen(false);
  };

  // Capability Toggle Handler
  const handleToggleCapability = (warehouseId, capabilityKey) => {
    setCapabilities((prev) =>
      prev.map((wh) => {
        if (wh.warehouse_id === warehouseId) {
          return {
            ...wh,
            capabilities: {
              ...wh.capabilities,
              [capabilityKey]: !wh.capabilities[capabilityKey],
            },
          };
        }
        return wh;
      })
    );
    dispatch(setAlert({ type: "success", message: "Kit capability updated" }));
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-surface p-6 rounded-xl border border-border shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-text-primary flex items-center gap-2">
            <FaLayerGroup className="text-primary" /> State-wise Cluster & Warehouse Routing
          </h2>
          <p className="text-text-secondary text-sm">
            Define multi-state clusters, map primary fulfillment warehouses, and configure kit capability routing.
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex bg-bg p-1 rounded-lg border border-border">
          <button
            onClick={() => setActiveTab("clusters")}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-all flex items-center gap-2 ${
              activeTab === "clusters"
                ? "bg-primary text-white shadow-sm"
                : "text-text-secondary hover:text-text-primary"
            }`}
          >
            <FaLayerGroup /> Clusters
          </button>
          <button
            onClick={() => setActiveTab("mappings")}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-all flex items-center gap-2 ${
              activeTab === "mappings"
                ? "bg-primary text-white shadow-sm"
                : "text-text-secondary hover:text-text-primary"
            }`}
          >
            <FaWarehouse /> Warehouse Mapping
          </button>
          <button
            onClick={() => setActiveTab("capabilities")}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-all flex items-center gap-2 ${
              activeTab === "capabilities"
                ? "bg-primary text-white shadow-sm"
                : "text-text-secondary hover:text-text-primary"
            }`}
          >
            <FaBoxes /> Kit Capabilities
          </button>
        </div>
      </div>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* TAB 1: CLUSTERS */}
      {/* ───────────────────────────────────────────────────────────── */}
      {activeTab === "clusters" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="relative w-full sm:w-72">
              <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary text-sm" />
              <input
                type="text"
                placeholder="Search clusters or states..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm bg-surface border border-border rounded-lg focus:outline-none focus:border-primary text-text-primary"
              />
            </div>
            <Button
              onClick={() => handleOpenClusterModal()}
              className="w-full sm:w-auto flex items-center justify-center gap-2"
            >
              <FaPlus /> Add New Cluster
            </Button>
          </div>

          <div className="bg-surface rounded-xl border border-border overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-bg border-b border-border text-xs uppercase font-semibold text-text-secondary">
                    <th className="p-4">Cluster Name & Code</th>
                    <th className="p-4">Assigned States</th>
                    <th className="p-4">Mapped Warehouses</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border text-sm">
                  {clusters
                    .filter(
                      (c) =>
                        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        c.states.some((s) => s.toLowerCase().includes(searchQuery.toLowerCase()))
                    )
                    .map((cluster) => (
                      <tr key={cluster.id} className="hover:bg-bg/50 transition-colors">
                        <td className="p-4 font-medium text-text-primary">
                          <div>{cluster.name}</div>
                          <span className="text-xs text-text-secondary font-mono">
                            {cluster.code}
                          </span>
                        </td>
                        <td className="p-4">
                          <div className="flex flex-wrap gap-1.5 max-w-md">
                            {cluster.states.map((st) => (
                              <span
                                key={st}
                                className="px-2 py-0.5 rounded-full text-xs bg-primary/10 text-primary border border-primary/20"
                              >
                                {st}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="p-4">
                          <span className="font-semibold text-text-primary">
                            {cluster.warehouses_count || 0}
                          </span>{" "}
                          warehouse(s)
                        </td>
                        <td className="p-4">
                          <span
                            className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                              cluster.status === "Active"
                                ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20"
                                : "bg-zinc-500/10 text-zinc-500 border border-zinc-500/20"
                            }`}
                          >
                            {cluster.status}
                          </span>
                        </td>
                        <td className="p-4 text-right space-x-2">
                          <button
                            onClick={() => handleOpenClusterModal(cluster)}
                            className="p-1.5 hover:bg-bg rounded text-text-secondary hover:text-primary transition-colors"
                            title="Edit Cluster"
                          >
                            <FaEdit />
                          </button>
                          <button
                            onClick={() => handleDeleteCluster(cluster.id)}
                            className="p-1.5 hover:bg-bg rounded text-text-secondary hover:text-red-500 transition-colors"
                            title="Delete Cluster"
                          >
                            <FaTrash />
                          </button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* TAB 2: WAREHOUSE MAPPING */}
      {/* ───────────────────────────────────────────────────────────── */}
      {activeTab === "mappings" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="text-sm text-text-secondary">
              Configure which warehouse services which cluster and states for specific kit types.
            </div>
            <Button
              onClick={() => handleOpenMappingModal()}
              className="w-full sm:w-auto flex items-center justify-center gap-2"
            >
              <FaPlus /> Map Warehouse to Cluster
            </Button>
          </div>

          <div className="bg-surface rounded-xl border border-border overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-bg border-b border-border text-xs uppercase font-semibold text-text-secondary">
                    <th className="p-4">Warehouse</th>
                    <th className="p-4">Cluster Assigned</th>
                    <th className="p-4">Fulfillment States</th>
                    <th className="p-4">Kit Types Capable</th>
                    <th className="p-4">Effective Date</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border text-sm">
                  {mappings.map((item) => (
                    <tr key={item.id} className="hover:bg-bg/50 transition-colors">
                      <td className="p-4">
                        <div className="font-medium text-text-primary">{item.warehouse_name}</div>
                        <div className="text-xs text-text-secondary font-mono">{item.warehouse_code}</div>
                      </td>
                      <td className="p-4 font-medium text-text-primary">
                        {item.cluster_name}
                      </td>
                      <td className="p-4">
                        <div className="flex flex-wrap gap-1 max-w-xs">
                          {item.states.map((st) => (
                            <span
                              key={st}
                              className="px-2 py-0.5 rounded text-xs bg-bg border border-border text-text-secondary"
                            >
                              {st}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex flex-wrap gap-1">
                          {item.kit_types.map((kt) => (
                            <span
                              key={kt}
                              className="px-2 py-0.5 rounded text-xs bg-amber-500/10 text-amber-600 border border-amber-500/20 font-medium"
                            >
                              {kt}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="p-4 text-text-secondary">{item.effective_from}</td>
                      <td className="p-4">
                        <span
                          className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                            item.status === "Active"
                              ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20"
                              : "bg-zinc-500/10 text-zinc-500 border border-zinc-500/20"
                          }`}
                        >
                          {item.status}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <button
                          onClick={() => handleOpenMappingModal(item)}
                          className="p-1.5 hover:bg-bg rounded text-text-secondary hover:text-primary transition-colors"
                        >
                          <FaEdit />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* TAB 3: KIT CAPABILITIES PER WAREHOUSE */}
      {/* ───────────────────────────────────────────────────────────── */}
      {activeTab === "capabilities" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {capabilities.map((wh) => (
            <div
              key={wh.warehouse_id}
              className="bg-surface rounded-xl border border-border p-6 shadow-sm space-y-4 hover:border-primary/50 transition-all"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-bold text-text-primary text-lg flex items-center gap-2">
                    <FaWarehouse className="text-primary" /> {wh.warehouse_name}
                  </h3>
                  <p className="text-xs text-text-secondary flex items-center gap-1 mt-1">
                    <FaMapMarkerAlt /> {wh.location} | ID: {wh.warehouse_id}
                  </p>
                </div>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-bg border border-border text-text-primary">
                  Cutoff: {wh.cutoff_time}
                </span>
              </div>

              <div className="bg-bg/60 p-4 rounded-lg border border-border space-y-3">
                <div className="text-xs font-semibold uppercase text-text-secondary tracking-wider">
                  Supported Kit Fulfillment Types
                </div>

                <div className="flex items-center justify-between py-1 border-b border-border/50">
                  <div>
                    <div className="text-sm font-medium text-text-primary">Combo Kits</div>
                    <div className="text-xs text-text-secondary">Standard pre-engineered turnkey packages</div>
                  </div>
                  <ToggleButton
                    isChecked={wh.capabilities.combo_kit}
                    onChange={() => handleToggleCapability(wh.warehouse_id, "combo_kit")}
                  />
                </div>

                <div className="flex items-center justify-between py-1 border-b border-border/50">
                  <div>
                    <div className="text-sm font-medium text-text-primary">Customize Kits</div>
                    <div className="text-xs text-text-secondary">Customized BOM configurations</div>
                  </div>
                  <ToggleButton
                    isChecked={wh.capabilities.customize_kit}
                    onChange={() => handleToggleCapability(wh.warehouse_id, "customize_kit")}
                  />
                </div>

                <div className="flex items-center justify-between py-1">
                  <div>
                    <div className="text-sm font-medium text-text-primary">Bulk Kits</div>
                    <div className="text-xs text-text-secondary">High-capacity palletized commercial lots</div>
                  </div>
                  <ToggleButton
                    isChecked={wh.capabilities.bulk_kit}
                    onChange={() => handleToggleCapability(wh.warehouse_id, "bulk_kit")}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-text-secondary pt-2">
                <span>Max Daily Dispatch: <strong>{wh.daily_capacity} Kits/day</strong></span>
                <span className="text-emerald-500 font-medium flex items-center gap-1">
                  <FaCheck /> Routing Active
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* MODAL: ADD / EDIT CLUSTER */}
      {/* ───────────────────────────────────────────────────────────── */}
      {clusterModalOpen && (
        <Dialog
          isOpen={clusterModalOpen}
          onClose={() => setClusterModalOpen(false)}
          title={editingCluster ? "Edit Regional Cluster" : "Create Regional Cluster"}
        >
          <form onSubmit={handleSaveCluster} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1">
                Cluster Name *
              </label>
              <CustomInput
                placeholder="e.g. North Zone - Haryana & Punjab"
                value={clusterFormData.name}
                onChange={(e) => setClusterFormData({ ...clusterFormData, name: e.target.value })}
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1">
                Cluster Identifier Code
              </label>
              <CustomInput
                placeholder="e.g. CL-NORTH-01"
                value={clusterFormData.code}
                onChange={(e) => setClusterFormData({ ...clusterFormData, code: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1">
                Assign States to Cluster * ({clusterFormData.states.length} selected)
              </label>
              <div className="max-h-48 overflow-y-auto bg-bg p-3 rounded-lg border border-border grid grid-cols-2 gap-2 text-xs">
                {ALL_INDIAN_STATES.map((state) => {
                  const isChecked = clusterFormData.states.includes(state);
                  return (
                    <label
                      key={state}
                      className="flex items-center gap-2 cursor-pointer hover:text-primary transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {
                          if (isChecked) {
                            setClusterFormData({
                              ...clusterFormData,
                              states: clusterFormData.states.filter((s) => s !== state),
                            });
                          } else {
                            setClusterFormData({
                              ...clusterFormData,
                              states: [...clusterFormData.states, state],
                            });
                          }
                        }}
                        className="rounded border-border text-primary focus:ring-primary"
                      />
                      <span>{state}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1">Status</label>
              <select
                value={clusterFormData.status}
                onChange={(e) => setClusterFormData({ ...clusterFormData, status: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-bg border border-border rounded-lg text-text-primary focus:outline-none focus:border-primary"
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-border">
              <Button variant="secondary" onClick={() => setClusterModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Save Cluster</Button>
            </div>
          </form>
        </Dialog>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* MODAL: ADD / EDIT WAREHOUSE MAPPING */}
      {/* ───────────────────────────────────────────────────────────── */}
      {mappingModalOpen && (
        <Dialog
          isOpen={mappingModalOpen}
          onClose={() => setMappingModalOpen(false)}
          title={editingMapping ? "Edit Warehouse Mapping" : "Map Warehouse to Cluster"}
        >
          <form onSubmit={handleSaveMapping} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1">
                Warehouse Name *
              </label>
              <CustomInput
                placeholder="e.g. Bhiwandi Central Hub (WH-01)"
                value={mappingFormData.warehouse_name}
                onChange={(e) =>
                  setMappingFormData({ ...mappingFormData, warehouse_name: e.target.value })
                }
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1">
                Target Cluster *
              </label>
              <select
                value={mappingFormData.cluster_id}
                onChange={(e) =>
                  setMappingFormData({ ...mappingFormData, cluster_id: e.target.value })
                }
                className="w-full px-3 py-2 text-sm bg-bg border border-border rounded-lg text-text-primary focus:outline-none focus:border-primary"
              >
                <option value="">Select a Cluster</option>
                {clusters.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.states.join(", ")})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1">
                Kit Types Capable
              </label>
              <div className="flex gap-4">
                {["Combo Kit", "Customize Kit", "Bulk Kit"].map((kt) => {
                  const isChecked = mappingFormData.kit_types.includes(kt);
                  return (
                    <label key={kt} className="flex items-center gap-1.5 text-xs text-text-primary cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {
                          if (isChecked) {
                            setMappingFormData({
                              ...mappingFormData,
                              kit_types: mappingFormData.kit_types.filter((k) => k !== kt),
                            });
                          } else {
                            setMappingFormData({
                              ...mappingFormData,
                              kit_types: [...mappingFormData.kit_types, kt],
                            });
                          }
                        }}
                      />
                      <span>{kt}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1">
                Effective From Date
              </label>
              <CustomInput
                type="date"
                value={mappingFormData.effective_from}
                onChange={(e) =>
                  setMappingFormData({ ...mappingFormData, effective_from: e.target.value })
                }
              />
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-border">
              <Button variant="secondary" onClick={() => setMappingModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Save Mapping</Button>
            </div>
          </form>
        </Dialog>
      )}
    </div>
  );
}
