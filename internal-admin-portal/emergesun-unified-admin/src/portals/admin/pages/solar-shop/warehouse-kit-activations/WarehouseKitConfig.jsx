import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import axios from "axios";
import ReactCountryFlag from "react-country-flag";
import {
  FaArrowLeft,
  FaWarehouse,
  FaMapMarkerAlt,
  FaToggleOn,
  FaCheckCircle,
  FaTimesCircle,
  FaSearch,
  FaSave,
  FaExclamationTriangle,
  FaDollarSign,
  FaLock,
  FaPercentage,
  FaSync,
} from "react-icons/fa";
import { setAlert } from "@/features/alert.slice";
import Button from "@/components/Button";
import Loader from "@/components/Loader";
import DropdownWithSearchInput from "@/components/DropdownWithSearchInput";
import { authHeaderObj } from "@/app/authHeader";

const API_URL = import.meta.env.VITE_API_URL;

export default function WarehouseKitConfig({ moduleUniqueId }) {
  const { countryName, warehouseId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const token = useSelector((state) => state.auth.token);

  // Core States
  const [warehouse, setWarehouse] = useState(null);
  const [countryObj, setCountryObj] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Combo Kits & Customize Kits (master lists from API)
  const [comboKits, setComboKits] = useState([]);
  const [customizeKits, setCustomizeKits] = useState([]);

  // Activation states from backend - keyed by combo_kit_id
  // { [kitId]: { is_combokit_active, is_customize_kit_active, activationId, kitData } }
  const [kitActivations, setKitActivations] = useState({});

  // Local toggle changes not yet saved: { [kitId]: { is_combokit_active?, is_customize_kit_active? } }
  const [pendingToggles, setPendingToggles] = useState({});

  // SKU price info per kit from backend
  const [skuPriceInfo, setSkuPriceInfo] = useState({});

  // Margin configuration status per kit from backend
  const [marginConfigured, setMarginConfigured] = useState({});

  // GST configuration status from backend, keyed by kit ID
  const [gstConfigured, setGstConfigured] = useState({});

  // Error info for save failures per kit
  const [saveErrors, setSaveErrors] = useState({});

  // Search
  const [comboSearch, setComboSearch] = useState("");
  const [customizeSearch, setCustomizeSearch] = useState("");

  // Tabs state
  const [activeTab, setActiveTab] = useState("combokit"); // combokit / customize

  // ─── Data Fetching ───────────────────────────────────────────────────────────

  const fetchActivations = async () => {
    try {
      const res = await axios.get(
        `${API_URL}/solarshop/warehouse-kit-activations/warehouse/${warehouseId}?unique_id=${moduleUniqueId}&req_for=view`,
        { headers: authHeaderObj() }
      );
      const data = res.data?.data || { combo_kits: [], customize_kits: [] };

      const activationMap = {};
      const skuPriceMap = {};
      const marginMap = {};
      const gstMap = {};

      const processKit = (a) => {
        const kitId = a.combo_kit_id?._id || a.combo_kit_id;
        if (kitId) {
          activationMap[kitId] = {
            is_combokit_active: a.is_combokit_active ?? false,
            is_customize_kit_active: a.is_customize_kit_active ?? false,
            activationId: a.id || a._id,
            kitData: a.combo_kit_id,
          };
          if (a.sku_price_info) {
            skuPriceMap[kitId] = a.sku_price_info;
          }
          // Capture margin configuration status
          marginMap[kitId] = a.is_margin_configured ?? false;
          gstMap[kitId] = a.is_gst_configured ?? false;
        }
      };

      data.combo_kits?.forEach(processKit);
      data.customize_kits?.forEach(processKit);

      setKitActivations(activationMap);
      setSkuPriceInfo(skuPriceMap);
      setMarginConfigured(marginMap);
      setGstConfigured(gstMap);
      setPendingToggles({});
      setSaveErrors({});
    } catch {
      setKitActivations({});
      setSkuPriceInfo({});
      setMarginConfigured({});
      setGstConfigured({});
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Active countries
      const countriesRes = await axios.get(
        `${API_URL}/geolocation/active-countries?unique_id=${moduleUniqueId}&req_for=view`,
        { headers: authHeaderObj() }
      );
      const activeCountries = countriesRes.data?.countries || [];
      const foundCountry = activeCountries.find(
        (c) => c.name.toLowerCase() === countryName?.toLowerCase()
      );
      setCountryObj(foundCountry);

      // 2. Warehouse details
      const warehousesRes = await axios.get(
        `${API_URL}/warehouses?unique_id=${moduleUniqueId}&req_for=view`,
        { headers: authHeaderObj() }
      );
      const allWarehouses = warehousesRes.data?.warehouses || [];
      const wh = allWarehouses.find((w) => w.id === warehouseId);
      setWarehouse(wh);

      if (wh && foundCountry) {
        const isIndia = foundCountry.iso2?.toLowerCase() === "in";

        // 3. Fetch combo kits (non-custom)
        const comboRes = await axios.get(
          `${API_URL}/combo-kits${isIndia ? "/india" : ""}/get-kits?unique_id=${moduleUniqueId}&req_for=view&is_custom=false&country_id=${foundCountry.id}`,
          { headers: authHeaderObj() }
        );
        const fetchedCombos = comboRes.data?.data || [];
        const uniqueCombos = [];
        const seenComboIds = new Set();
        for (const kit of fetchedCombos) {
          const kId = kit.id || kit._id;
          if (kId && !seenComboIds.has(kId)) {
            uniqueCombos.push(kit);
            seenComboIds.add(kId);
          }
        }
        setComboKits(uniqueCombos);

        // 4. Fetch customize kits (custom)
        const customizeRes = await axios.get(
          `${API_URL}/combo-kits${isIndia ? "/india" : ""}/get-kits?unique_id=${moduleUniqueId}&req_for=view&is_custom=true&country_id=${foundCountry.id}`,
          { headers: authHeaderObj() }
        );
        const fetchedCustomizes = customizeRes.data?.data || [];
        const uniqueCustomizes = [];
        const seenCustomizeIds = new Set();
        for (const kit of fetchedCustomizes) {
          const kId = kit.id || kit._id;
          if (kId && !seenCustomizeIds.has(kId)) {
            uniqueCustomizes.push(kit);
            seenCustomizeIds.add(kId);
          }
        }
        setCustomizeKits(uniqueCustomizes);

        // 5. Fetch existing activations
        await fetchActivations();
      }
    } catch (error) {
      console.error("Error loading warehouse kit config:", error);
      dispatch(setAlert({ type: "error", message: "Failed to load warehouse kit configuration" }));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (moduleUniqueId && token && warehouseId) {
      fetchData();
      fetchFilterCategories();
    }
  }, [moduleUniqueId, token, warehouseId, countryName]);

  // ─── Toggle Logic ──────────────────────────────────────────────────────────────
  // Gets the effective current value (saved state + pending toggle)
  const getEffectiveStatus = (kitId, field) => {
    // Check pending toggles first (local changes not yet saved)
    if (pendingToggles[kitId] && pendingToggles[kitId][field] !== undefined) {
      return pendingToggles[kitId][field];
    }
    // Fall back to saved activation state
    return kitActivations[kitId]?.[field] ?? false;
  };

  const handleToggle = (kitId, field) => {
    const currentValue = getEffectiveStatus(kitId, field);
    setPendingToggles((prev) => ({
      ...prev,
      [kitId]: {
        ...prev[kitId],
        [field]: !currentValue,
      },
    }));
    // Clear any previous save error for this kit
    setSaveErrors((prev) => {
      const next = { ...prev };
      delete next[kitId];
      return next;
    });
  };

  // ─── Save Logic ────────────────────────────────────────────────────────────────

  const hasChanges = () => {
    return Object.keys(pendingToggles).length > 0;
  };

  const handleSaveAll = async () => {
    if (!hasChanges()) {
      dispatch(setAlert({ type: "warning", message: "No changes to save." }));
      return;
    }

    setSaving(true);
    try {
      const allKits = [...comboKits, ...customizeKits];

      const activationsPayload = [];
      for (const [kitId, pending] of Object.entries(pendingToggles)) {
        const kit = allKits.find((k) => (k.id || k._id) === kitId);
        if (!kit) continue;

        // Merge saved state with pending changes
        const savedState = kitActivations[kitId] || {};
        activationsPayload.push({
          warehouse_id: warehouse.id,
          combo_kit_id: kitId,
          is_combokit_active: pending.is_combokit_active !== undefined ? pending.is_combokit_active : (savedState.is_combokit_active ?? false),
          is_customize_kit_active: pending.is_customize_kit_active !== undefined ? pending.is_customize_kit_active : (savedState.is_customize_kit_active ?? false),
        });
      }

      if (activationsPayload.length === 0) {
        dispatch(setAlert({ type: "warning", message: "No changes to save." }));
        setSaving(false);
        return;
      }

      const res = await axios.post(
        `${API_URL}/solarshop/warehouse-kit-activations/bulk-save?unique_id=${moduleUniqueId}&req_for=add`,
        { activations: activationsPayload },
        { headers: authHeaderObj() }
      );

      if (res.data?.status === "success") {
        dispatch(setAlert({ type: "success", message: "Kit activations saved successfully." }));
        await fetchActivations();

        // Check for any errors in bulk response
        const errors = res.data?.data?.errors || [];
        if (errors.length > 0) {
          const errorMap = {};
          errors.forEach((e) => {
            const kitId = e.item?.combo_kit_id;
            if (kitId) {
              errorMap[kitId] = e.message;
            }
          });
          setSaveErrors(errorMap);
          if (errorMap.length > 0) {
            dispatch(setAlert({ type: "warning", message: `${errors.length} kit(s) failed: ${errors[0].message}` }));
          }
        }
      }
    } catch (error) {
      dispatch(setAlert({ type: "error", message: error.response?.data?.message || "Failed to save kit activations" }));
    } finally {
      setSaving(false);
    }
  };

  // ─── Helpers ───────────────────────────────────────────────────────────────────

  const getSkuPriceInfo = (kitId) => {
    return skuPriceInfo[kitId] || null;
  };

  const getMarginConfigured = (kitId) => {
    // Returns true if margin is configured, false if not, null if unknown
    if (marginConfigured[kitId] === undefined) return null;
    return marginConfigured[kitId];
  };

  const getGstConfigured = (kitId) => {
    if (gstConfigured[kitId] === undefined) return null;
    return gstConfigured[kitId];
  };

  // ─── Filter States (API-driven, cascading) ───────────────────────────────────
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedSubcategory, setSelectedSubcategory] = useState("");
  const [selectedType, setSelectedType] = useState("");
  const [selectedProjectRange, setSelectedProjectRange] = useState("");

  // API-driven filter option lists
  const [filterCategories, setFilterCategories] = useState([]);
  const [filterSubcategories, setFilterSubcategories] = useState([]);
  const [filterSystemTypes, setFilterSystemTypes] = useState([]);
  const [filterProjectRanges, setFilterProjectRanges] = useState([]);

  const fetchFilterCategories = async () => {
    try {
      const res = await axios.get(
        `${API_URL}/project-types/get-categories?unique_id=${moduleUniqueId}&req_for=view`,
        { headers: authHeaderObj() }
      );
      if (res.data?.status === "success") {
        setFilterCategories(
          res.data.data.map((item) => ({ value: String(item.id), text: item.name }))
        );
      }
    } catch (e) {
      console.error("Error fetching filter categories:", e);
    }
  };

  const fetchFilterSubcategories = async (categoryId) => {
    setFilterSubcategories([]);
    setFilterSystemTypes([]);
    setFilterProjectRanges([]);
    if (!categoryId) return;
    try {
      const res = await axios.get(
        `${API_URL}/project-types/get-subcategories?unique_id=${moduleUniqueId}&req_for=view&category_id=${categoryId}`,
        { headers: authHeaderObj() }
      );
      if (res.data?.status === "success") {
        setFilterSubcategories(
          res.data.data.map((item) => ({ value: String(item.id), text: item.name }))
        );
      }
    } catch (e) {
      console.error("Error fetching filter subcategories:", e);
    }
  };

  const fetchFilterSystemTypes = async (subcategoryId) => {
    setFilterSystemTypes([]);
    setFilterProjectRanges([]);
    if (!subcategoryId) return;
    try {
      const res = await axios.get(
        `${API_URL}/project-types/get-subcategory-types?unique_id=${moduleUniqueId}&req_for=view&subcategory_id=${subcategoryId}`,
        { headers: authHeaderObj() }
      );
      if (res.data?.status === "success") {
        setFilterSystemTypes(
          res.data.data.map((item) => ({ value: String(item.subcategory_type_id), text: item.name }))
        );
      }
    } catch (e) {
      console.error("Error fetching filter system types:", e);
    }
  };

  const fetchFilterProjectRanges = async (subcategoryTypeId) => {
    setFilterProjectRanges([]);
    if (!subcategoryTypeId) return;
    try {
      const res = await axios.get(
        `${API_URL}/project-types/get-ranges?unique_id=${moduleUniqueId}&req_for=view&subcategory_type_id=${subcategoryTypeId}`,
        { headers: authHeaderObj() }
      );
      if (res.data?.status === "success") {
        setFilterProjectRanges(
          res.data.data.map((item) => ({
            value: String(item.id),
            text: `${item.min_value} - ${item.max_value} ${item.unit_symbol || "kW"}`,
          }))
        );
      }
    } catch (e) {
      console.error("Error fetching filter project ranges:", e);
    }
  };

  // Filtered lists
  const filteredComboKits = useMemo(() => {
    return comboKits.filter((k) => {
      const matchSearch =
        k.name?.toLowerCase().includes(comboSearch.toLowerCase()) ||
        k.solar_kit_id?.name?.toLowerCase().includes(comboSearch.toLowerCase());
      const matchCat = !selectedCategory ||
        String(k.solar_kit_id?.category_id?._id || k.solar_kit_id?.category_id?.id || "") === selectedCategory;
      const matchSub = !selectedSubcategory ||
        String(k.solar_kit_id?.subcategory_id?._id || k.solar_kit_id?.subcategory_id?.id || "") === selectedSubcategory;
      const matchType = !selectedType ||
        String(k.solar_kit_id?.type_id?.subcategory_type_id || k.solar_kit_id?.type_id?._id || k.solar_kit_id?.type_id?.id || "") === selectedType ||
        (k.solar_kit_id?.type_id?.type?.name || k.solar_kit_id?.type_id?.name) === selectedType;
      const matchRange = !selectedProjectRange ||
        String(k.project_range_id?._id || k.project_range_id?.id || k.project_range_id || "") === selectedProjectRange;
      return matchSearch && matchCat && matchSub && matchType && matchRange;
    });
  }, [comboKits, comboSearch, selectedCategory, selectedSubcategory, selectedType, selectedProjectRange]);

  const filteredCustomizeKits = useMemo(() => {
    return customizeKits.filter((k) => {
      const matchSearch =
        k.name?.toLowerCase().includes(customizeSearch.toLowerCase()) ||
        k.solar_kit_id?.name?.toLowerCase().includes(customizeSearch.toLowerCase());
      const matchCat = !selectedCategory ||
        String(k.solar_kit_id?.category_id?._id || k.solar_kit_id?.category_id?.id || "") === selectedCategory;
      const matchSub = !selectedSubcategory ||
        String(k.solar_kit_id?.subcategory_id?._id || k.solar_kit_id?.subcategory_id?.id || "") === selectedSubcategory;
      const matchType = !selectedType ||
        String(k.solar_kit_id?.type_id?.subcategory_type_id || k.solar_kit_id?.type_id?._id || k.solar_kit_id?.type_id?.id || "") === selectedType ||
        (k.solar_kit_id?.type_id?.type?.name || k.solar_kit_id?.type_id?.name) === selectedType;
      const matchRange = !selectedProjectRange ||
        String(k.project_range_id?._id || k.project_range_id?.id || k.project_range_id || "") === selectedProjectRange;
      return matchSearch && matchCat && matchSub && matchType && matchRange;
    });
  }, [customizeKits, customizeSearch, selectedCategory, selectedSubcategory, selectedType, selectedProjectRange]);

  // ─── Loading / Not Found ──────────────────────────────────────────────────────

  if (loading) return <Loader text="Loading warehouse kit configuration..." />;

  if (!warehouse) {
    return (
      <div className="card p-12 text-center border-2 border-dashed border-border flex flex-col justify-center items-center gap-4">
        <FaWarehouse className="text-4xl text-text-muted opacity-30" />
        <h3 className="text-lg font-black text-text-primary">Warehouse Not Found</h3>
        <Button
          onClick={() =>
            navigate(`/admin-panel/solar-shop/${countryName}/warehouse-kit-activations`)
          }
          variant="secondary"
          className="rounded-xl"
        >
          Back to List
        </Button>
      </div>
    );
  }

  // ─── Render Kits Section ───────────────────────────────────────────────────────

  const renderKitSection = (title, kits, search, setSearch, field, isCustomSection, emptyMsg) => (
    <div className="bg-surface rounded-2xl border-2 border-border/60 shadow-sm overflow-hidden flex flex-col">
      <div className="px-6 py-4 bg-surface-hover/30 border-b border-border flex items-center justify-between">
        <h3 className="text-sm font-black text-text-primary uppercase tracking-wider">
          {title}
        </h3>
        <span className="text-[10px] font-black text-text-muted bg-surface-hover px-3 py-1.5 rounded-lg border border-border/40">
          {kits.length} Kits
        </span>
      </div>

      <div className="p-6 space-y-5">
        {/* Filters and Search Grid */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
          {/* Search */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-text-secondary uppercase tracking-wider ml-1">Search</label>
            <div className="relative w-full">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-text-muted">
                <FaSearch size={12} />
              </span>
              <input
                type="text"
                placeholder={`Search ${title.toLowerCase()}...`}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full h-10 pl-9 pr-4 bg-surface border-2 border-border focus:border-primary rounded-xl text-xs font-bold text-text-primary placeholder:text-text-muted outline-none transition-colors"
              />
            </div>
          </div>

          {/* Category */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-text-secondary uppercase tracking-wider ml-1">Category</label>
            <DropdownWithSearchInput
              options={filterCategories}
              value={selectedCategory}
              onChange={(val) => {
                setSelectedCategory(val);
                setSelectedSubcategory("");
                setSelectedType("");
                setSelectedProjectRange("");
                fetchFilterSubcategories(val);
              }}
              placeholder="All Categories"
            />
          </div>

          {/* Sub-Category */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-text-secondary uppercase tracking-wider ml-1">Sub-Category</label>
            <DropdownWithSearchInput
              options={filterSubcategories}
              value={selectedSubcategory}
              onChange={(val) => {
                setSelectedSubcategory(val);
                setSelectedType("");
                setSelectedProjectRange("");
                fetchFilterSystemTypes(val);
              }}
              placeholder="All Sub-Categories"
              disabled={!selectedCategory}
            />
          </div>

          {/* System Type */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-text-secondary uppercase tracking-wider ml-1">System Type</label>
            <DropdownWithSearchInput
              options={filterSystemTypes}
              value={selectedType}
              onChange={(val) => {
                setSelectedType(val);
                setSelectedProjectRange("");
                fetchFilterProjectRanges(val);
              }}
              placeholder="All Types"
              disabled={!selectedSubcategory}
            />
          </div>

          {/* Project Range */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-text-secondary uppercase tracking-wider ml-1">Project Range</label>
            <DropdownWithSearchInput
              options={filterProjectRanges}
              value={selectedProjectRange}
              onChange={setSelectedProjectRange}
              placeholder="All Ranges"
              disabled={!selectedType}
            />
          </div>
        </div>

        {/* Kits List */}
        <div className="border border-border/60 rounded-2xl bg-surface divide-y divide-border/40 overflow-hidden">
          {kits.length > 0 ? (
            kits.map((kit) => {
              const kitId = kit.id || kit._id;
              const isActive = getEffectiveStatus(kitId, field);
              const pending = pendingToggles[kitId]?.[field] !== undefined;
              const priceInfo = getSkuPriceInfo(kitId);
              const isMarginConfigured = getMarginConfigured(kitId);
              const isGstConfigured = getGstConfigured(kitId);
              const hasMissingPrices = !isCustomSection && priceInfo && !priceInfo.allPriced;
              const hasMissingMargin = isMarginConfigured === false;
              const kitError = saveErrors[kitId];
              const hasMissingGst = isGstConfigured === false;

              // Determine if activation should be blocked
              const blockReason = !isActive
                ? hasMissingGst
                  ? "GST rate is not configured for this kit margin"
                  : (hasMissingPrices && hasMissingMargin)
                    ? "SKU benchmark prices & company margins not configured"
                    : hasMissingPrices
                      ? `${priceInfo.pricedCount}/${priceInfo.totalSkus} SKU benchmark price(s) not set`
                      : hasMissingMargin
                        ? "Company margin not configured for this warehouse"
                        : null
                : null;
              const isToggleBlocked = !!blockReason;

              return (
                <div
                  key={kitId}
                  className={`flex items-start justify-between p-4 transition-colors ${
                    isToggleBlocked && !isActive
                      ? 'bg-warning/5'
                      : pending
                        ? 'bg-primary/5 border-l-2 border-l-primary'
                        : 'hover:bg-surface-hover/30'
                  }`}
                >
                  <div className="flex flex-col gap-0.5 min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-black text-xs text-text-primary uppercase tracking-wide truncate">
                        {kit.name || "N/A"}
                      </span>
                      {pending && (
                        <span className="px-1.5 py-0.5 bg-primary/10 text-primary text-[9px] font-black rounded border border-primary/20">
                          CHANGED
                        </span>
                      )}
                      {isToggleBlocked && !isActive && (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-warning/10 text-warning text-[9px] font-black rounded border border-warning/20">
                          <FaLock size={7} /> LOCKED
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-text-muted font-bold uppercase">
                      Blueprint:{" "}
                      <strong className="text-text-secondary">
                        {kit.solar_kit_id?.name || "N/A"}
                      </strong>{" "}
                      &bull; {kit.capacity || 0} kW
                    </span>

                    {/* Blocking reason banner */}
                    {blockReason && !isActive && (
                      <div className="flex items-center gap-1.5 mt-1.5 px-2.5 py-1.5 bg-warning/10 border border-warning/25 rounded-lg">
                        <FaLock size={8} className="text-warning shrink-0" />
                        <span className="text-[9px] font-bold text-warning">
                          Cannot activate: {blockReason}
                        </span>
                      </div>
                    )}

                    {/* SKU Price Info — show for combo kits only (non-custom) */}
                    {!isCustomSection && priceInfo && (
                      <div className="flex flex-col gap-1.5 mt-1">
                        <div className={`flex items-center gap-1.5 ${hasMissingPrices ? 'text-danger' : 'text-success'}`}>
                          <FaDollarSign size={9} />
                          <span className="text-[9px] font-bold">
                            SKU Benchmark Prices: {priceInfo.pricedCount}/{priceInfo.totalSkus} configured
                          </span>
                          {hasMissingPrices && (
                            <span className="text-[9px] font-bold text-danger">
                              ({priceInfo.missingSkuIds.length} missing on linked cluster)
                            </span>
                          )}
                        </div>
                        {hasMissingPrices && priceInfo.missingSkuDetails && (
                          <div className="mt-0.5 pl-3 border-l-2 border-danger/30 space-y-1">
                            <span className="text-[9px] font-black text-text-muted uppercase tracking-wider block">
                              SKUs missing benchmark prices (linked cluster: {warehouse.cluster || "N/A"}) — click to set:
                            </span>
                            <div className="flex flex-wrap gap-1.5">
                              {priceInfo.missingSkuDetails.map((sku) => (
                                <a
                                  key={sku.sku_id}
                                  href={`/admin-panel/product-configurations/price-master?sku_id=${sku.sku_id}&cluster_id=${warehouse.cluster_id || warehouse.cluster}&state_id=${warehouse.state_id}&country_id=${warehouse.country_id}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 px-2 py-0.5 bg-danger/10 text-danger hover:bg-danger/20 hover:scale-[1.02] border border-danger/20 rounded-md text-[9px] font-bold transition-all no-underline"
                                >
                                  <span className="underline">{sku.sku_code}</span>
                                  <span className="text-[8px] text-text-muted font-normal">
                                    ({sku.product_name || "Unknown Product"})
                                  </span>
                                </a>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Margin Configuration Status */}
                    {isMarginConfigured !== null && (
                      <div className="flex flex-col gap-1.5 mt-1">
                        <div className={`flex items-center gap-1.5 ${hasMissingMargin ? 'text-danger' : 'text-success'}`}>
                          <FaPercentage size={9} />
                          <span className="text-[9px] font-bold">
                            Company Margin: {hasMissingMargin ? 'Not configured for this warehouse' : 'Configured ✓'}
                          </span>
                          {hasMissingMargin && (
                            <span
                              title="Go to Company Margin settings to configure margins for this kit"
                              className="text-[8px] font-bold text-danger/70 italic ml-0.5"
                            >
                              (required to activate)
                            </span>
                          )}
                        </div>
                        {hasMissingMargin && (
                          <div className="mt-0.5 pl-3 border-l-2 border-danger/30 space-y-1">
                            <span className="text-[9px] font-black text-text-muted uppercase tracking-wider block">
                              Company margin not set (for warehouse: {warehouse.warehouse_code || "N/A"}) — click to set:
                            </span>
                            <div className="flex flex-wrap gap-1.5">
                              <a
                                href={`/admin-panel/solar-shop/${countryName}/company-margin/${warehouseId}?combo_kit_id=${kitId}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 px-2 py-0.5 bg-danger/10 text-danger hover:bg-danger/20 hover:scale-[1.02] border border-danger/20 rounded-md text-[9px] font-bold transition-all no-underline"
                              >
                                <span className="underline">Configure Margin</span>
                                <span className="text-[8px] text-text-muted font-normal">
                                  ({kit.name || "This Kit"})
                                </span>
                              </a>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* GST Configuration Status */}
                    <div className="flex flex-col gap-1.5 mt-1">
                      <div className={`flex items-center gap-1.5 ${hasMissingGst ? 'text-danger' : 'text-success'}`}>
                        <FaPercentage size={9} />
                        <span className="text-[9px] font-bold">
                          GST: {hasMissingGst ? 'Not configured in margin settings' : 'Configured ✓'}
                        </span>
                      </div>
                    </div>

                    {/* Save Error */}
                    {kitError && (
                      <div className="flex items-center gap-1.5 mt-1">
                        <FaExclamationTriangle size={9} className="text-danger" />
                        <span className="text-[9px] font-bold text-danger">{kitError}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-4 ml-4 shrink-0">
                    {/* Status Badge */}
                    {isActive ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-success/10 text-success border border-success/20">
                        <FaCheckCircle size={9} /> Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-surface-hover text-text-muted border border-border/40">
                        <FaTimesCircle size={9} /> Inactive
                      </span>
                    )}

                    {/* Toggle Switch — disabled when activation is blocked */}
                    <div
                      title={isToggleBlocked && !isActive ? blockReason : undefined}
                      className={isToggleBlocked && !isActive ? 'opacity-40 cursor-not-allowed' : ''}
                    >
                      <label
                        className={`relative inline-flex items-center select-none ${
                          isToggleBlocked && !isActive ? 'pointer-events-none' : 'cursor-pointer'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isActive}
                          onChange={() => !isToggleBlocked || isActive ? handleToggle(kitId, field) : undefined}
                          disabled={isToggleBlocked && !isActive}
                          className="sr-only peer"
                        />
                        <div className={`w-12 h-6 rounded-full peer peer-focus:ring-2 peer-focus:ring-primary/20 peer-checked:after:translate-x-6 peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-border after:border after:rounded-full after:h-5 after:w-5 after:transition-all ${isActive ? "bg-primary" : "bg-border"}`}></div>
                      </label>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="p-10 text-center text-xs font-bold text-text-muted italic">
              {emptyMsg || "No kits found."}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  // ─── Main Render ──────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6 pb-24 animate-in fade-in duration-500">
      {/* Header Banner */}
      <div className="relative rounded-2xl bg-linear-120 from-primary to-primary-end shadow-xl">
        <div className="absolute inset-0 bg-grid-white/10 mask-[linear-gradient(0deg,transparent,black)]"></div>
        <div className="relative px-6 py-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Button
                onClick={() =>
                  navigate(`/admin-panel/solar-shop/${countryName}/warehouse-kit-activations`)
                }
                variant="secondary"
                className="w-10 h-10 p-0 rounded-full flex items-center justify-center bg-white/10 hover:bg-white/20 border-white/20 text-white shadow-sm hover:scale-105 transition-transform shrink-0"
                title="Back to List"
              >
                <FaArrowLeft />
              </Button>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center border border-white/30 text-white shrink-0">
                  <FaToggleOn className="text-2xl" />
                </div>
                <div>
                  <h1 className="text-xl lg:text-2xl font-bold text-white leading-tight">
                    Configure Kit Activations
                  </h1>
                  <p className="text-white/80 text-xs mt-0.5 font-bold">
                    Activate or deactivate combo kits and customize kits for this warehouse.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0 self-end md:self-center">
              <Button
                onClick={fetchData}
                disabled={loading}
                variant="secondary"
                className="w-10 h-10 p-0 rounded-full flex items-center justify-center bg-white/10 hover:bg-white/20 border-white/20 text-white shadow-sm hover:scale-105 transition-transform shrink-0"
                title="Refresh Page Data"
              >
                <FaSync className={loading ? "animate-spin" : ""} />
              </Button>

              {countryObj && (
                <div className="bg-white/20 backdrop-blur-sm border border-white/30 rounded-full px-4 py-2 flex items-center gap-2 shadow-sm shrink-0 w-fit">
                  <ReactCountryFlag
                    countryCode={countryObj.iso2}
                    svg
                    className="w-5 h-5 rounded-sm object-cover"
                  />
                  <span className="text-white text-xs font-bold uppercase tracking-wider">
                    {countryObj.name} Market
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Warehouse Detail Card */}
      <div className="card p-6 border-l-4 border-l-primary shadow-sm grid grid-cols-1 md:grid-cols-4 gap-6">
        <div>
          <span className="font-bold block uppercase tracking-wider text-[9px] text-text-muted">
            Warehouse Code
          </span>
          <span className="font-black text-text-primary text-sm flex items-center gap-2 mt-1">
            <FaWarehouse className="text-primary opacity-60" size={14} />
            {warehouse.warehouse_code}
          </span>
        </div>
        <div className="md:col-span-2">
          <span className="font-bold block uppercase tracking-wider text-[9px] text-text-muted">
            Address
          </span>
          <span className="font-semibold text-text-secondary text-xs mt-1 block">
            {warehouse.address} (PIN: {warehouse.pincode || "N/A"})
          </span>
        </div>
        <div>
          <span className="font-bold block uppercase tracking-wider text-[9px] text-text-muted">
            State & Cluster
          </span>
          <span className="font-bold text-text-secondary text-xs flex flex-col gap-0.5 mt-1">
            <span className="flex items-center gap-1">
              <FaMapMarkerAlt className="text-primary/50 text-[10px]" /> {warehouse.state}
            </span>
            <span className="text-text-muted pl-3.5">
              Cluster: <strong>{warehouse.cluster || "N/A"}</strong>
            </span>
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border gap-2">
        <button
          onClick={() => setActiveTab("combokit")}
          className={`px-6 py-3 text-xs font-black uppercase tracking-wider transition-all border-b-2 -mb-[2px] cursor-pointer ${
            activeTab === "combokit"
              ? "border-primary text-primary"
              : "border-transparent text-text-muted hover:text-text-primary"
          }`}
        >
          Combo Kits
        </button>
        <button
          onClick={() => setActiveTab("customize")}
          className={`px-6 py-3 text-xs font-black uppercase tracking-wider transition-all border-b-2 -mb-[2px] cursor-pointer ${
            activeTab === "customize"
              ? "border-primary text-primary"
              : "border-transparent text-text-muted hover:text-text-primary"
          }`}
        >
          Customize
        </button>
      </div>

      {/* Tab Panels */}
      <div className="space-y-6">
        {activeTab === "combokit" && (
          renderKitSection(
            "Combo Kits",
            filteredComboKits,
            comboSearch,
            setComboSearch,
            "is_combokit_active",
            false,
            "No combo kits found for this country."
          )
        )}
        {activeTab === "customize" && (
          renderKitSection(
            "Customize Kits",
            filteredCustomizeKits,
            customizeSearch,
            setCustomizeSearch,
            "is_customize_kit_active",
            true,
            "No customize kits found for this country."
          )
        )}
      </div>

      {/* Save Button */}
      <div className="sticky bottom-6 flex justify-end">
        <Button
          onClick={handleSaveAll}
          variant="primary"
          loading={saving}
          leftIcon={<FaSave />}
          className="rounded-xl shadow-lg font-black uppercase tracking-widest text-sm px-8 py-3"
          size="lg"
          disabled={!hasChanges() && !saving}
        >
          {hasChanges() ? `Save Changes (${Object.keys(pendingToggles).length} kit(s))` : "No Changes to Save"}
        </Button>
      </div>
    </div>
  );
}