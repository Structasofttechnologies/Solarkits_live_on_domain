import { useState, useEffect, useMemo, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useSearchParams } from "react-router-dom";
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
  FaImage,
  FaBoxes,
  FaCube,
  FaPlus,
  FaExternalLinkAlt,
  FaTrashAlt,
  FaTag,
  FaCheckCircle,
  FaExclamationCircle
} from "react-icons/fa";
import { setAlert } from "@/features/alert.slice";
import Loader from "@/components/Loader";
import Button from "@/components/Button";
import MultiSelectDropdownWithSearchInput from "@/components/MultiSelectDropdownWithSearchInput";
import { authHeaderObj } from "@/app/authHeader";
import OemProductAssignModal from "./components/OemProductAssignModal";

const API_URL = import.meta.env.VITE_API_URL;
const CLUSTER_API = `${API_URL}/solarshop/cluster-routing/clusters`;
const BRANDS_API = `${API_URL}/brand-manufacturer/get-brands`;
const OEM_PARTNERS_API = `${API_URL}/solarshop/oem-partner-products`;

export default function AdminSupplierSettings() {
  const dispatch = useDispatch();
  const token = useSelector((state) => state.auth.token);
  const [searchParams, setSearchParams] = useSearchParams();

  // Active Tab: 'clusters' or 'oem-products'
  const initialTab = searchParams.get("tab") === "oem-products" ? "oem-products" : "clusters";
  const [activeTab, setActiveTab] = useState(initialTab);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setSearchParams(tab === "oem-products" ? { tab: "oem-products" } : {});
  };

  // =========================================================================
  // TAB 1: REGIONAL CLUSTERS STATE
  // =========================================================================
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

  // =========================================================================
  // TAB 2: OEM PARTNER PRODUCTS STATE
  // =========================================================================
  const [oemLoading, setOemLoading] = useState(false);
  const [oemRefreshing, setOemRefreshing] = useState(false);
  const [oemSearchQuery, setOemSearchQuery] = useState("");
  const [oemPartners, setOemPartners] = useState([]);
  const [selectedPartnerForAssign, setSelectedPartnerForAssign] = useState(null);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [removingProductKey, setRemovingProductKey] = useState(null); // 'partnerId_productId'

  // ─────────────────────────────────────────────────────────────
  // Fetch Clusters & Brands Data (Tab 1)
  // ─────────────────────────────────────────────────────────────
  const fetchClusterData = useCallback(async (isManual = false) => {
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
            oem_brand_ids: Array.isArray(c.oem_brand_ids)
              ? c.oem_brand_ids.map((id) => (id.toString ? id.toString() : id))
              : [],
            supplier_brand_ids: Array.isArray(c.supplier_brand_ids)
              ? c.supplier_brand_ids.map((id) => (id.toString ? id.toString() : id))
              : []
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

  // ─────────────────────────────────────────────────────────────
  // Fetch OEM Partners & Assigned Products (Tab 2)
  // ─────────────────────────────────────────────────────────────
  const fetchOemPartners = useCallback(async (isManual = false) => {
    if (isManual) setOemRefreshing(true);
    else setOemLoading(true);

    try {
      const headers = authHeaderObj();
      const res = await axios.get(OEM_PARTNERS_API, { headers });

      if (res.data?.status === "success") {
        setOemPartners(res.data.data || []);
      }
    } catch (err) {
      console.error("Error fetching OEM partners with products:", err);
      dispatch(
        setAlert({
          type: "error",
          message: "Failed to load OEM Partner product assignments",
          duration: 4000
        })
      );
    } finally {
      setOemLoading(false);
      setOemRefreshing(false);
    }
  }, [dispatch]);

  // Initial Load
  useEffect(() => {
    if (token) {
      fetchClusterData();
      fetchOemPartners();
    }
  }, [token, fetchClusterData, fetchOemPartners]);

  // Brand quick lookup map (Tab 1)
  const brandMap = useMemo(() => {
    const map = {};
    brands.forEach((b) => {
      const bId = (b.id || b._id)?.toString();
      if (bId) map[bId] = b;
    });
    return map;
  }, [brands]);

  // Dropdown options for Tab 1
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

  // Filter clusters by search query (Tab 1)
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

  // Filter OEM partners by search query (Tab 2)
  const filteredOemPartners = useMemo(() => {
    if (!oemSearchQuery.trim()) return oemPartners;
    const q = oemSearchQuery.toLowerCase();
    return oemPartners.filter((p) => {
      const matchBrand = p.brand_name?.toLowerCase().includes(q);
      const matchCompany = p.company_name?.toLowerCase().includes(q);
      const matchProduct = p.assigned_products?.some(
        (prod) =>
          prod.name?.toLowerCase().includes(q) ||
          prod.sku_code?.toLowerCase().includes(q) ||
          prod.template_name?.toLowerCase().includes(q)
      );
      return matchBrand || matchCompany || matchProduct;
    });
  }, [oemPartners, oemSearchQuery]);

  // Total metrics for Tab 2
  const oemMetrics = useMemo(() => {
    const totalPartners = oemPartners.length;
    let totalAssignedProducts = 0;
    let unassignedCount = 0;

    oemPartners.forEach((p) => {
      const count = p.assigned_count || 0;
      totalAssignedProducts += count;
      if (count === 0) unassignedCount += 1;
    });

    return { totalPartners, totalAssignedProducts, unassignedCount };
  }, [oemPartners]);

  // ─────────────────────────────────────────────────────────────
  // Cluster Handlers (Tab 1)
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
  // OEM Partner Product Assignment Handlers (Tab 2)
  // ─────────────────────────────────────────────────────────────
  const handleOpenAssignModal = (partner) => {
    setSelectedPartnerForAssign(partner);
    setIsAssignModalOpen(true);
  };

  const handleSaveModalSuccess = () => {
    fetchOemPartners();
  };

  // Remove a single product from an OEM partner card directly
  const handleRemoveAssignedProduct = async (partnerId, productId, productName) => {
    const key = `${partnerId}_${productId}`;
    setRemovingProductKey(key);

    try {
      const headers = authHeaderObj();
      const res = await axios.delete(
        `${OEM_PARTNERS_API}/${partnerId}/products/${productId}`,
        { headers }
      );

      if (res.data?.status === "success") {
        // Optimistically update partner's assigned products in state
        setOemPartners((prev) =>
          prev.map((p) => {
            if ((p.id || p._id) === partnerId) {
              const remainingProducts = (p.assigned_products || []).filter(
                (prod) => (prod.id || prod._id) !== productId
              );
              return {
                ...p,
                assigned_products: remainingProducts,
                assigned_product_ids: remainingProducts.map((prod) => prod.id || prod._id),
                assigned_count: remainingProducts.length
              };
            }
            return p;
          })
        );

        dispatch(
          setAlert({
            type: "success",
            message: `Removed "${productName}" from OEM Partner`,
            duration: 3000
          })
        );
      }
    } catch (err) {
      console.error("Error removing product from OEM Partner:", err);
      dispatch(
        setAlert({
          type: "error",
          message: err.response?.data?.message || "Failed to remove product from OEM Partner",
          duration: 4000
        })
      );
    } finally {
      setRemovingProductKey(null);
    }
  };

  // ─────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6 pb-16">
      {/* Header Banner */}
      <div className="bg-surface p-6 rounded-2xl border border-border shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3.5">
            <div className="p-3 bg-primary/10 rounded-2xl text-primary shadow-xs">
              <FaHandshake size={26} />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-2xl font-bold text-text-primary tracking-tight">
                  Admin Supplier & OEM Settings
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-primary/10 text-primary border border-primary/20">
                  SolarShop Core
                </span>
              </div>
              <p className="text-text-secondary text-sm mt-0.5">
                Manage state-wise cluster brand routing and assign system catalog products to OEM Partners.
              </p>
            </div>
          </div>
        </div>

        {/* Global Tab Refresh & Search */}
        <div className="flex items-center gap-3">
          {activeTab === "clusters" ? (
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
          ) : (
            <div className="relative w-full sm:w-80">
              <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-secondary text-sm pointer-events-none" />
              <input
                type="text"
                placeholder="Search OEM partners or assigned products..."
                value={oemSearchQuery}
                onChange={(e) => setOemSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 text-sm bg-bg border border-border rounded-xl focus:outline-none focus:border-primary text-text-primary placeholder:text-text-secondary/60 transition-colors"
              />
            </div>
          )}

          <button
            onClick={() => {
              if (activeTab === "clusters") fetchClusterData(true);
              else fetchOemPartners(true);
            }}
            disabled={refreshing || loading || oemRefreshing || oemLoading}
            className="p-2.5 rounded-xl border border-border bg-bg text-text-secondary hover:text-primary hover:border-primary/40 transition-colors disabled:opacity-50 shrink-0"
            title="Refresh current tab data"
          >
            <FaSync
              className={
                refreshing || oemRefreshing
                  ? "animate-spin text-primary"
                  : ""
              }
            />
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-3 border-b border-border">
        {/* Tab 1: Regional Cluster Routing */}
        <button
          onClick={() => handleTabChange("clusters")}
          className={`flex items-center gap-2.5 px-6 py-3.5 text-sm font-bold border-b-2 transition-all ${
            activeTab === "clusters"
              ? "border-primary text-primary bg-primary/5 rounded-t-2xl shadow-2xs"
              : "border-transparent text-text-secondary hover:text-text-primary hover:bg-bg/40 rounded-t-2xl"
          }`}
        >
          <FaLayerGroup size={16} />
          <span>Regional Cluster Routing</span>
          <span
            className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
              activeTab === "clusters"
                ? "bg-primary text-white"
                : "bg-surface border border-border text-text-secondary"
            }`}
          >
            {clusters.length}
          </span>
        </button>

        {/* Tab 2: OEM Partner Products (New Requested Tab) */}
        <button
          onClick={() => handleTabChange("oem-products")}
          className={`flex items-center gap-2.5 px-6 py-3.5 text-sm font-bold border-b-2 transition-all ${
            activeTab === "oem-products"
              ? "border-primary text-primary bg-primary/5 rounded-t-2xl shadow-2xs"
              : "border-transparent text-text-secondary hover:text-text-primary hover:bg-bg/40 rounded-t-2xl"
          }`}
        >
          <FaBoxes size={16} />
          <span>OEM Partner Products</span>
          <span
            className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
              activeTab === "oem-products"
                ? "bg-primary text-white"
                : "bg-primary/10 text-primary border border-primary/20"
            }`}
          >
            {oemPartners.length}
          </span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1 CONTENT: REGIONAL CLUSTER ROUTING                                   */}
      {/* ========================================================================= */}
      {activeTab === "clusters" && (
        <div className="space-y-6">
          {loading ? (
            <div className="py-24">
              <Loader text="Loading Regional Clusters & Brand Manufacturers..." />
            </div>
          ) : filteredClusters.length === 0 ? (
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
                          <span className="text-xs text-text-secondary font-medium">
                            Covered States:
                          </span>
                          {cluster.states && cluster.states.length > 0 ? (
                            cluster.states.map((st, idx) => (
                              <span
                                key={idx}
                                className="px-2 py-0.5 rounded-md text-[11px] bg-bg border border-border text-text-secondary"
                              >
                                {st}
                              </span>
                            ))
                          ) : (
                            <span className="text-xs text-text-secondary/60 italic">
                              No states mapped
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Cluster Card Body */}
                    <div className="p-6 space-y-6 flex-1">
                      {/* 1. OEM Partners Section */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-bold uppercase tracking-wider text-text-secondary flex items-center gap-2">
                            <FaHandshake className="text-blue-400" /> OEM Partners
                          </label>
                          <span className="text-xs text-text-secondary font-semibold">
                            {selectedOemIds.length} Selected
                          </span>
                        </div>

                        <MultiSelectDropdownWithSearchInput
                          placeholder="Select OEM partner brands..."
                          searchPlaceholder="Search OEM brands..."
                          options={oemBrandOptions}
                          values={selectedOemIds}
                          onChange={(vals) => handleOemChange(clusterId, vals)}
                        />

                        {/* Selected OEM Badges */}
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
                                    <FaBuilding size={10} className="text-blue-400" />
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
                      <div className="space-y-3 pt-2 border-t border-border/60">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-bold uppercase tracking-wider text-text-secondary flex items-center gap-2">
                            <FaTruck className="text-emerald-400" /> Suppliers / Manufacturers
                          </label>
                          <span className="text-xs text-text-secondary font-semibold">
                            {selectedSupplierIds.length} Selected
                          </span>
                        </div>

                        <MultiSelectDropdownWithSearchInput
                          placeholder="Select supplier brands..."
                          searchPlaceholder="Search supplier brands..."
                          options={supplierBrandOptions}
                          values={selectedSupplierIds}
                          onChange={(vals) => handleSupplierChange(clusterId, vals)}
                        />

                        {/* Selected Supplier Badges */}
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
      )}

      {/* ========================================================================= */}
      {/* TAB 2 CONTENT: OEM PARTNER PRODUCTS (CARDS FORMAT)                        */}
      {/* ========================================================================= */}
      {activeTab === "oem-products" && (
        <div className="space-y-6">
          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-surface p-4 rounded-2xl border border-border flex items-center gap-3.5 shadow-2xs">
              <div className="p-3 bg-blue-500/10 text-blue-500 rounded-xl">
                <FaHandshake size={20} />
              </div>
              <div>
                <div className="text-2xl font-black text-text-primary tracking-tight">
                  {oemMetrics.totalPartners}
                </div>
                <div className="text-xs text-text-secondary font-medium">
                  Verified OEM Partners
                </div>
              </div>
            </div>

            <div className="bg-surface p-4 rounded-2xl border border-border flex items-center gap-3.5 shadow-2xs">
              <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-xl">
                <FaCube size={20} />
              </div>
              <div>
                <div className="text-2xl font-black text-text-primary tracking-tight">
                  {oemMetrics.totalAssignedProducts}
                </div>
                <div className="text-xs text-text-secondary font-medium">
                  Total Catalog Products Assigned
                </div>
              </div>
            </div>

            <div className="bg-surface p-4 rounded-2xl border border-border flex items-center gap-3.5 shadow-2xs">
              <div className="p-3 bg-amber-500/10 text-amber-500 rounded-xl">
                <FaExclamationCircle size={20} />
              </div>
              <div>
                <div className="text-2xl font-black text-text-primary tracking-tight">
                  {oemMetrics.unassignedCount}
                </div>
                <div className="text-xs text-text-secondary font-medium">
                  Partners Pending Product Assignment
                </div>
              </div>
            </div>
          </div>

          {/* OEM Partners Grid */}
          {oemLoading ? (
            <div className="py-24">
              <Loader text="Loading OEM Partners & Catalog Product Mappings..." />
            </div>
          ) : filteredOemPartners.length === 0 ? (
            <div className="bg-surface p-12 rounded-2xl border border-border text-center space-y-3">
              <FaHandshake className="mx-auto text-5xl text-text-secondary/40" />
              <h3 className="text-lg font-bold text-text-primary">No OEM Partners Found</h3>
              <p className="text-sm text-text-secondary max-w-md mx-auto">
                {oemSearchQuery
                  ? "No OEM Partners or assigned products match your search query."
                  : "No brands have been flagged as OEM Partners yet. You can mark brands as OEM Partner in Manufacturing Brands."}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-6">
              {filteredOemPartners.map((partner) => {
                const partnerId = partner.id || partner._id;
                const assignedList = partner.assigned_products || [];
                const assignedCount = assignedList.length;

                return (
                  <div
                    key={partnerId}
                    className="bg-surface rounded-2xl border border-border shadow-sm hover:border-primary/40 hover:shadow-md transition-all flex flex-col overflow-hidden"
                  >
                    {/* OEM Partner Card Header */}
                    <div className="p-5 border-b border-border bg-linear-to-r from-primary/5 via-transparent to-transparent flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        {partner.logo ? (
                          <img
                            src={partner.logo}
                            alt={partner.brand_name}
                            className="w-12 h-12 rounded-xl object-contain bg-white p-1.5 border border-border shadow-xs shrink-0"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary border border-primary/20 flex items-center justify-center font-black text-lg shrink-0">
                            {partner.brand_name?.[0]?.toUpperCase() || "O"}
                          </div>
                        )}

                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="font-bold text-base text-text-primary tracking-tight truncate">
                              {partner.brand_name}
                            </h3>
                          </div>
                          {partner.company_name && (
                            <p className="text-xs text-text-secondary truncate mt-0.5">
                              {partner.company_name}
                            </p>
                          )}
                          <div className="flex items-center gap-2 pt-1 flex-wrap">
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-blue-500/10 text-blue-500 border border-blue-500/20">
                              ★ OEM Partner
                            </span>
                            {partner.is_supplier && (
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                                Supplier
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Products count pill */}
                      <span
                        className={`px-2.5 py-1 rounded-xl text-xs font-bold shrink-0 ${
                          assignedCount > 0
                            ? "bg-primary/10 text-primary border border-primary/20"
                            : "bg-amber-500/10 text-amber-500 border border-amber-500/20"
                        }`}
                      >
                        {assignedCount} {assignedCount === 1 ? "Product" : "Products"}
                      </span>
                    </div>

                    {/* OEM Partner Card Body: Assigned Products List */}
                    <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                      <div className="space-y-2.5">
                        <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-text-secondary">
                          <span>Assigned System Products</span>
                          <span className="font-semibold text-text-primary">
                            {assignedCount} mapped
                          </span>
                        </div>

                        {assignedCount === 0 ? (
                          /* Empty state for this partner */
                          <div className="p-6 rounded-xl border border-dashed border-border bg-bg/40 text-center space-y-2">
                            <FaCube className="mx-auto text-2xl text-text-secondary/40" />
                            <p className="text-xs font-medium text-text-secondary">
                              No catalog products assigned to this OEM Partner yet.
                            </p>
                            <p className="text-[11px] text-text-secondary/70">
                              Click &quot;Assign Products&quot; below to choose from system products.
                            </p>
                          </div>
                        ) : (
                          /* Visual product list with quick remove */
                          <div className="space-y-2 max-h-56 overflow-y-auto pr-1 scrollbar-thin">
                            {assignedList.map((prod) => {
                              const prodId = prod.id || prod._id;
                              const isRemoving = removingProductKey === `${partnerId}_${prodId}`;

                              return (
                                <div
                                  key={prodId}
                                  className="p-2.5 rounded-xl border border-border bg-bg/50 hover:bg-bg hover:border-primary/30 transition-all flex items-center justify-between gap-3 group"
                                >
                                  <div className="flex items-center gap-2.5 min-w-0">
                                    {prod.image ? (
                                      <img
                                        src={prod.image}
                                        alt={prod.name}
                                        className="w-9 h-9 rounded-lg object-contain bg-white p-0.5 border border-border shrink-0"
                                      />
                                    ) : (
                                      <div className="w-9 h-9 rounded-lg bg-surface border border-border text-text-secondary flex items-center justify-center shrink-0">
                                        <FaCube size={14} />
                                      </div>
                                    )}

                                    <div className="min-w-0">
                                      <div className="text-xs font-bold text-text-primary truncate">
                                        {prod.name}
                                      </div>
                                      <div className="flex items-center gap-1.5 text-[10px] text-text-secondary pt-0.5 truncate">
                                        <span className="font-mono bg-surface px-1 py-0.2 rounded border border-border">
                                          {prod.sku_code}
                                        </span>
                                        <span>• {prod.template_name}</span>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Quick Remove Button */}
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleRemoveAssignedProduct(partnerId, prodId, prod.name)
                                    }
                                    disabled={isRemoving}
                                    className="p-1.5 rounded-lg text-text-secondary/60 hover:text-danger hover:bg-danger/10 transition-colors opacity-80 group-hover:opacity-100 disabled:opacity-40 shrink-0"
                                    title="Unassign this product from OEM partner"
                                  >
                                    <FaTimes
                                      size={13}
                                      className={isRemoving ? "animate-spin text-danger" : ""}
                                    />
                                  </button>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Card Footer: Assign Products Button */}
                    <div className="px-5 py-4 border-t border-border bg-bg/50 flex items-center justify-between gap-3">
                      <div className="text-[11px] text-text-secondary">
                        {assignedCount > 0
                          ? `Ready for PO & orders routing`
                          : `Needs catalog mapping`}
                      </div>

                      <Button
                        variant="primary"
                        onClick={() => handleOpenAssignModal(partner)}
                        className="px-5 text-xs shadow-xs"
                        leftIcon={<FaBoxes />}
                      >
                        {assignedCount > 0 ? "Manage Products" : "Assign Products"}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Product Assignment Modal */}
      <OemProductAssignModal
        isOpen={isAssignModalOpen}
        onClose={() => {
          setIsAssignModalOpen(false);
          setSelectedPartnerForAssign(null);
        }}
        partner={selectedPartnerForAssign}
        onSaveSuccess={handleSaveModalSuccess}
      />
    </div>
  );
}
