import { useState, useEffect, useMemo, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import axios from "axios";
import {
  FaLayerGroup,
  FaHandshake,
  FaTruck,
  FaSearch,
  FaSync,
  FaCheck,
  FaTimes,
  FaSave,
  FaMapMarkerAlt,
  FaTrademark,
  FaBuilding,
  FaImage
} from "react-icons/fa";
import { setAlert } from "@/features/alert.slice";
import Loader from "@/components/Loader";
import Button from "@/components/Button";
import MultiSelectDropdownWithSearchInput from "@/components/MultiSelectDropdownWithSearchInput";
import { authHeaderObj } from "@/app/authHeader";

const API_URL = import.meta.env.VITE_API_URL;
const CLUSTER_API = `${API_URL}/solarshop/cluster-routing/clusters`;
const BRANDS_API = `${API_URL}/brand-manufacturer/get-brands`;

export default function AdminSupplierSettings() {
  const dispatch = useDispatch();
  const token = useSelector((state) => state.auth.token);

  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const [clusters, setClusters] = useState([]);
  const [brands, setBrands] = useState([]);

  // Local state for each cluster's OEM and Supplier brand selections
  // format: { [clusterId]: { oem_brand_ids: [...], supplier_brand_ids: [...] } }
  const [clusterSettings, setClusterSettings] = useState({});
  const [savingClusterId, setSavingClusterId] = useState(null);
  const [savedSuccessMap, setSavedSuccessMap] = useState({});

  // ─────────────────────────────────────────────────────────────
  // Fetch Data (Clusters & Brand Manufacturers)
  // ─────────────────────────────────────────────────────────────
  const fetchData = useCallback(async (isManual = false) => {
    if (isManual) setRefreshing(true);
    else setLoading(true);

    try {
      const headers = authHeaderObj();

      const [clustersRes, brandsRes] = await Promise.allSettled([
        axios.get(CLUSTER_API, { headers }),
        axios.get(`${BRANDS_API}?unique_id=ADM_ORDER_SETTINGS&req_for=view`, { headers })
      ]);

      // Process Clusters
      if (clustersRes.status === "fulfilled" && clustersRes.value?.data?.data) {
        const clusterList = clustersRes.value.data.data;
        setClusters(clusterList);

        // Initialize local settings map
        const initialMap = {};
        clusterList.forEach((c) => {
          const cId = c.id || c._id;
          initialMap[cId] = {
            oem_brand_ids: Array.isArray(c.oem_brand_ids) ? c.oem_brand_ids.map(id => id.toString ? id.toString() : id) : [],
            supplier_brand_ids: Array.isArray(c.supplier_brand_ids) ? c.supplier_brand_ids.map(id => id.toString ? id.toString() : id) : []
          };
        });
        setClusterSettings(initialMap);
      }

      // Process Brands
      if (brandsRes.status === "fulfilled" && brandsRes.value?.data?.data) {
        setBrands(brandsRes.value.data.data);
      }
    } catch (err) {
      console.error("Error fetching admin supplier setting data:", err);
      dispatch(
        setAlert({
          type: "error",
          message: "Failed to load cluster or brand settings data",
          duration: 4000
        })
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [dispatch]);

  useEffect(() => {
    if (token) {
      fetchData();
    }
  }, [token, fetchData]);

  // Brand quick lookup map
  const brandMap = useMemo(() => {
    const map = {};
    brands.forEach((b) => {
      const bId = (b.id || b._id)?.toString();
      if (bId) map[bId] = b;
    });
    return map;
  }, [brands]);

  // Dropdown options formatted for MultiSelectDropdownWithSearchInput
  const oemBrandOptions = useMemo(() => {
    return brands.map((b) => ({
      value: (b.id || b._id)?.toString(),
      text: `${b.brand_name}${b.is_oem_partner ? " ★ (OEM Partner)" : ""}`
    }));
  }, [brands]);

  const supplierBrandOptions = useMemo(() => {
    return brands.map((b) => ({
      value: (b.id || b._id)?.toString(),
      text: `${b.brand_name}${b.is_supplier ? " ★ (Supplier)" : ""}`
    }));
  }, [brands]);

  // Filter clusters by search query
  const filteredClusters = useMemo(() => {
    if (!searchQuery.trim()) return clusters;
    const query = searchQuery.toLowerCase();
    return clusters.filter((c) => {
      const matchesName = c.name?.toLowerCase().includes(query);
      const matchesCode = c.code?.toLowerCase().includes(query);
      const matchesStates = c.states?.some((s) => s.toLowerCase().includes(query));
      return matchesName || matchesCode || matchesStates;
    });
  }, [clusters, searchQuery]);

  // ─────────────────────────────────────────────────────────────
  // Handlers for Brand Selection
  // ─────────────────────────────────────────────────────────────
  const handleOemChange = (clusterId, newIds) => {
    setClusterSettings((prev) => ({
      ...prev,
      [clusterId]: {
        ...prev[clusterId],
        oem_brand_ids: newIds
      }
    }));
  };

  const handleSupplierChange = (clusterId, newIds) => {
    setClusterSettings((prev) => ({
      ...prev,
      [clusterId]: {
        ...prev[clusterId],
        supplier_brand_ids: newIds
      }
    }));
  };

  const handleRemoveOem = (clusterId, brandId) => {
    setClusterSettings((prev) => {
      const current = prev[clusterId]?.oem_brand_ids || [];
      return {
        ...prev,
        [clusterId]: {
          ...prev[clusterId],
          oem_brand_ids: current.filter((id) => id !== brandId)
        }
      };
    });
  };

  const handleRemoveSupplier = (clusterId, brandId) => {
    setClusterSettings((prev) => {
      const current = prev[clusterId]?.supplier_brand_ids || [];
      return {
        ...prev,
        [clusterId]: {
          ...prev[clusterId],
          supplier_brand_ids: current.filter((id) => id !== brandId)
        }
      };
    });
  };

  // ─────────────────────────────────────────────────────────────
  // Save Settings for a Single Cluster
  // ─────────────────────────────────────────────────────────────
  const handleSaveCluster = async (cluster) => {
    const clusterId = cluster.id || cluster._id;
    const config = clusterSettings[clusterId] || { oem_brand_ids: [], supplier_brand_ids: [] };

    setSavingClusterId(clusterId);
    try {
      const headers = authHeaderObj();
      const res = await axios.put(
        `${CLUSTER_API}/${clusterId}?unique_id=ADM_ORDER_SETTINGS&req_for=edit`,
        {
          oem_brand_ids: config.oem_brand_ids,
          supplier_brand_ids: config.supplier_brand_ids
        },
        { headers }
      );

      if (res.data?.status === "success") {
        // Update clusters state
        setClusters((prev) =>
          prev.map((c) =>
            (c.id || c._id) === clusterId
              ? {
                  ...c,
                  oem_brand_ids: config.oem_brand_ids,
                  supplier_brand_ids: config.supplier_brand_ids
                }
              : c
          )
        );

        // Flash success
        setSavedSuccessMap((prev) => ({ ...prev, [clusterId]: true }));
        setTimeout(() => {
          setSavedSuccessMap((prev) => ({ ...prev, [clusterId]: false }));
        }, 3000);

        dispatch(
          setAlert({
            type: "success",
            message: `Supplier & OEM settings saved for "${cluster.name}"`,
            duration: 3000
          })
        );
      }
    } catch (err) {
      console.error("Error saving cluster supplier settings:", err);
      dispatch(
        setAlert({
          type: "error",
          message: err.response?.data?.message || "Failed to save cluster settings",
          duration: 4000
        })
      );
    } finally {
      setSavingClusterId(null);
    }
  };

  // ─────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="bg-surface p-6 rounded-2xl border border-border shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-primary/10 rounded-xl text-primary">
              <FaHandshake size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-text-primary tracking-tight">
                Admin Supplier Settings
              </h1>
              <p className="text-text-secondary text-sm mt-0.5">
                Configure state-wise cluster brand settings for OEM Partners and Suppliers.
              </p>
            </div>
          </div>
        </div>

        {/* Refresh & Search */}
        <div className="flex items-center gap-3">
          <div className="relative w-full sm:w-72">
            <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-secondary text-sm pointer-events-none" />
            <input
              type="text"
              placeholder="Search clusters or states..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-sm bg-bg border border-border rounded-xl focus:outline-none focus:border-primary text-text-primary placeholder:text-text-secondary/60 transition-colors"
            />
          </div>

          <button
            onClick={() => fetchData(true)}
            disabled={refreshing || loading}
            className="p-2.5 rounded-xl border border-border bg-bg text-text-secondary hover:text-primary hover:border-primary/40 transition-colors disabled:opacity-50"
            title="Refresh clusters and brands"
          >
            <FaSync className={refreshing ? "animate-spin text-primary" : ""} />
          </button>
        </div>
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="py-24">
          <Loader text="Loading Regional Clusters & Brand Manufacturers..." />
        </div>
      ) : filteredClusters.length === 0 ? (
        /* Empty State */
        <div className="bg-surface p-12 rounded-2xl border border-border text-center space-y-3">
          <FaLayerGroup className="mx-auto text-5xl text-text-secondary/40" />
          <h3 className="text-lg font-bold text-text-primary">No Regional Clusters Found</h3>
          <p className="text-sm text-text-secondary max-w-md mx-auto">
            {searchQuery
              ? "No clusters match your search query. Try adjusting your search."
              : "No state-wise clusters found in the cluster routing network."}
          </p>
        </div>
      ) : (
        /* Clusters Cards Grid */
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {filteredClusters.map((cluster) => {
            const clusterId = cluster.id || cluster._id;
            const currentConfig = clusterSettings[clusterId] || {
              oem_brand_ids: [],
              supplier_brand_ids: []
            };

            const selectedOemIds = currentConfig.oem_brand_ids || [];
            const selectedSupplierIds = currentConfig.supplier_brand_ids || [];

            const isSavingThis = savingClusterId === clusterId;
            const isSavedSuccess = savedSuccessMap[clusterId];

            return (
              <div
                key={clusterId}
                className="bg-surface rounded-2xl border border-border shadow-sm hover:border-primary/30 transition-all flex flex-col overflow-hidden"
              >
                {/* Cluster Header */}
                <div className="p-5 border-b border-border bg-linear-to-r from-primary/5 via-transparent to-transparent flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <h3 className="font-bold text-lg text-text-primary tracking-tight">
                        {cluster.name}
                      </h3>
                      <span className="px-2.5 py-0.5 rounded-md text-[11px] font-black uppercase tracking-wider bg-primary/10 text-primary border border-primary/20">
                        {cluster.code}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                          cluster.status === "Active"
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                            : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                        }`}
                      >
                        {cluster.status || "Active"}
                      </span>
                    </div>

                    {/* Assigned States */}
                    <div className="flex items-center gap-1.5 flex-wrap pt-1">
                      <FaMapMarkerAlt className="text-text-secondary/70 text-xs shrink-0" />
                      <span className="text-xs text-text-secondary font-medium">Covered States:</span>
                      {cluster.states && cluster.states.length > 0 ? (
                        cluster.states.map((st, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-surface-hover text-text-primary border border-border/80"
                          >
                            {st}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-text-secondary italic">No states mapped</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Settings Body */}
                <div className="p-6 space-y-6 flex-1">
                  {/* 1. OEM Partners Section */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-black uppercase tracking-wider text-text-secondary flex items-center gap-2">
                        <FaHandshake className="text-blue-400" /> OEM Partners
                      </label>
                      <span className="text-[11px] font-bold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-md border border-blue-500/20">
                        {selectedOemIds.length} Selected
                      </span>
                    </div>

                    <MultiSelectDropdownWithSearchInput
                      placeholder="Select OEM partner brands..."
                      searchPlaceholder="Search brands..."
                      options={oemBrandOptions}
                      values={selectedOemIds}
                      onChange={(vals) => handleOemChange(clusterId, vals)}
                      className="w-full"
                    />

                    {/* Selected OEM Brand Badges with Remove */}
                    {selectedOemIds.length > 0 && (
                      <div className="flex flex-wrap gap-2 pt-1">
                        {selectedOemIds.map((bId) => {
                          const brandObj = brandMap[bId];
                          return (
                            <div
                              key={bId}
                              className="inline-flex items-center gap-2 px-2.5 py-1 rounded-lg bg-blue-500/10 border border-blue-500/20 text-text-primary text-xs font-medium"
                            >
                              {brandObj?.logo ? (
                                <img
                                  src={brandObj.logo}
                                  alt=""
                                  className="w-4 h-4 rounded-sm object-contain bg-white p-0.5"
                                />
                              ) : (
                                <FaTrademark size={10} className="text-blue-400" />
                              )}
                              <span>{brandObj?.brand_name || "Unknown Brand"}</span>
                              <button
                                type="button"
                                onClick={() => handleRemoveOem(clusterId, bId)}
                                className="text-text-secondary hover:text-danger ml-0.5 transition-colors"
                                title="Remove brand"
                              >
                                <FaTimes size={11} />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* 2. Suppliers Section */}
                  <div className="space-y-3 pt-3 border-t border-border/50">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-black uppercase tracking-wider text-text-secondary flex items-center gap-2">
                        <FaTruck className="text-emerald-400" /> Suppliers
                      </label>
                      <span className="text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                        {selectedSupplierIds.length} Selected
                      </span>
                    </div>

                    <MultiSelectDropdownWithSearchInput
                      placeholder="Select supplier brands..."
                      searchPlaceholder="Search brands..."
                      options={supplierBrandOptions}
                      values={selectedSupplierIds}
                      onChange={(vals) => handleSupplierChange(clusterId, vals)}
                      className="w-full"
                    />

                    {/* Selected Supplier Brand Badges with Remove */}
                    {selectedSupplierIds.length > 0 && (
                      <div className="flex flex-wrap gap-2 pt-1">
                        {selectedSupplierIds.map((bId) => {
                          const brandObj = brandMap[bId];
                          return (
                            <div
                              key={bId}
                              className="inline-flex items-center gap-2 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-text-primary text-xs font-medium"
                            >
                              {brandObj?.logo ? (
                                <img
                                  src={brandObj.logo}
                                  alt=""
                                  className="w-4 h-4 rounded-sm object-contain bg-white p-0.5"
                                />
                              ) : (
                                <FaBuilding size={10} className="text-emerald-400" />
                              )}
                              <span>{brandObj?.brand_name || "Unknown Brand"}</span>
                              <button
                                type="button"
                                onClick={() => handleRemoveSupplier(clusterId, bId)}
                                className="text-text-secondary hover:text-danger ml-0.5 transition-colors"
                                title="Remove brand"
                              >
                                <FaTimes size={11} />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Footer: Save Button */}
                <div className="px-6 py-4 border-t border-border bg-bg/50 flex items-center justify-between gap-4">
                  <div className="text-xs text-text-secondary">
                    <span className="font-bold text-text-primary">{selectedOemIds.length}</span> OEM •{" "}
                    <span className="font-bold text-text-primary">{selectedSupplierIds.length}</span> Supplier
                  </div>

                  <Button
                    variant={isSavedSuccess ? "success" : "primary"}
                    onClick={() => handleSaveCluster(cluster)}
                    loading={isSavingThis}
                    disabled={isSavingThis}
                    className="px-6 shadow-sm"
                    leftIcon={isSavedSuccess ? <FaCheck /> : <FaSave />}
                  >
                    {isSavedSuccess ? "Saved!" : "Save Settings"}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
