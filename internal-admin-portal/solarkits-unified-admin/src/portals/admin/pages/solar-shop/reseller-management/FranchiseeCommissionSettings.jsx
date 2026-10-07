import { useState, useEffect, useCallback, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import axios from "axios";
import {
  FiMapPin, FiUsers, FiPackage, FiSave, FiInfo,
  FiChevronDown, FiLoader, FiSearch, FiFilter,
  FiCheck, FiAlertCircle, FiRefreshCw, FiGrid,
  FiLayers, FiBox, FiTag, FiDollarSign, FiTruck,
  FiShoppingCart, FiSettings, FiUser, FiEdit2,
  FiX, FiCheckCircle, FiPlus, FiArrowRight,
  FiSliders, FiCheckSquare, FiAward,
} from "react-icons/fi";
import { FaRupeeSign, FaTruck, FaShoppingBag, FaChevronDown } from "react-icons/fa";
import { setAlert } from "@/features/alert.slice";
import { authHeaderObj } from "@/app/authHeader";
import Button from "@/components/Button";

const API_URL = import.meta.env.VITE_API_URL;
const MODULE_UID = "FPO_COMM";

// ─── Helpers ────────────────────────────────────────────────────────────────
const fmt = (paise) =>
  paise != null ? `₹${(paise / 100).toLocaleString("en-IN")}` : "—";

const paiseToCurrency = (val) =>
  val != null && val !== "" ? Math.round(Number(val) * 100) : null;

const currencyToPaise = (paise) =>
  paise != null ? String(paise / 100) : "";

const getCleanId = (item) => {
  if (!item) return "";
  if (typeof item === "string") return item;
  return item._id || item.id || "";
};

// ─── Franchise Selector Card ─────────────────────────────────────────────────
function FranchiseCard({ reseller, selected, onClick }) {
  const isActive = reseller.activation_status === "active";
  return (
    <button
      onClick={onClick}
      className={`w-full text-left p-3.5 rounded-xl border-2 transition-all cursor-pointer ${
        selected
          ? "border-primary bg-primary/5 shadow-sm ring-2 ring-primary/20"
          : "border-border hover:border-primary/40 hover:bg-surface-hover/50"
      }`}
    >
      <div className="flex items-start gap-3">
        <div
          className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-xs font-black transition-colors ${
            selected ? "bg-primary text-white shadow-sm" : "bg-surface-hover text-text-muted"
          }`}
        >
          {(reseller.business_name || reseller.name || "F")[0].toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <div className="font-bold text-text-primary text-xs truncate">
            {reseller.business_name || reseller.name || "—"}
          </div>
          <div className="text-[11px] text-text-muted mt-0.5 font-medium truncate">
            {reseller.email || reseller.mobile || "No contact"}
          </div>
          <div className="flex gap-1.5 mt-2 flex-wrap items-center">
            {reseller.plan_id?.name && (
              <span className="text-[10px] font-bold bg-info/10 text-info px-2 py-0.5 rounded-full border border-info/20">
                {reseller.plan_id.name}
              </span>
            )}
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                isActive
                  ? "bg-success/10 text-success border-success/20"
                  : "bg-warning/10 text-warning border-warning/20"
              }`}
            >
              {reseller.activation_status || "pending"}
            </span>
            {reseller.city && (
              <span className="text-[10px] text-text-muted flex items-center gap-0.5">
                <FiMapPin size={10} /> {reseller.city}
              </span>
            )}
          </div>
        </div>
        {selected && (
          <FiCheckCircle className="text-primary shrink-0 mt-0.5" size={16} />
        )}
      </div>
    </button>
  );
}

// ─── Commission Input Cell ────────────────────────────────────────────────────
function CommCell({ value, onChange, disabled }) {
  return (
    <div className="relative flex items-center min-w-[120px] max-w-[150px]">
      <span className="absolute left-2.5 text-text-muted text-xs font-semibold pointer-events-none">₹</span>
      <input
        type="number"
        min="0"
        step="0.01"
        disabled={disabled}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="0.00"
        className={`w-full pl-6 pr-2.5 py-2 text-xs font-bold rounded-xl border transition-all text-right
          ${
            disabled
              ? "bg-surface-hover/40 text-text-muted border-border/30 cursor-not-allowed"
              : "bg-surface border-border hover:border-primary/50 focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none text-text-primary shadow-xs"
          }`}
      />
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────
export default function FranchiseeCommissionSettings() {
  const dispatch = useDispatch();
  const token = useSelector((s) => s.auth.token);

  // ── Hierarchy for the 5 Cascading Quick Filters ───────────────────────────
  const [hierarchy, setHierarchy] = useState({
    industries: [],
    categories: [],
    subcategories: [],
    types: [],
    ranges: [],
    shopHierarchy: [],
  });
  const [loadingHierarchy, setLoadingHierarchy] = useState(false);

  // The 5 Quick Filters State (Industry Type, Category, Sub Category, System Type, Project Range)
  const [quickFilters, setQuickFilters] = useState({
    industryType: "all",
    category: "all",
    subCategory: "all",
    systemType: "all",
    projectRange: "all",
  });

  // ── Geography selectors ──────────────────────────────────────────────────
  const [states, setStates] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [selectedState, setSelectedState] = useState("");
  const [selectedDistrict, setSelectedDistrict] = useState("");
  const [loadingStates, setLoadingStates] = useState(false);
  const [loadingDistricts, setLoadingDistricts] = useState(false);

  // ── Franchise list ────────────────────────────────────────────────────────
  const [franchises, setFranchises] = useState([]);
  const [loadingFranchises, setLoadingFranchises] = useState(false);
  const [franchiseSearch, setFranchiseSearch] = useState("");
  const [selectedFranchise, setSelectedFranchise] = useState(null);

  // ── Allocated / Authorized products ──────────────────────────────────────
  const [allocatedProducts, setAllocatedProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [productSearch, setProductSearch] = useState("");

  // ── Combo kits ───────────────────────────────────────────────────────────
  const [allKits, setAllKits] = useState([]);
  const [loadingKits, setLoadingKits] = useState(false);

  // ── Commission rules for selected franchise ───────────────────────────────
  // Structure: { [kitId_qty_orderType]: amountInRs }
  const [commissionMap, setCommissionMap] = useState({});
  const [loadingRules, setLoadingRules] = useState(false);
  const [savingRules, setSavingRules] = useState(false);
  const [savedKeys, setSavedKeys] = useState(new Set());

  // ── Active product tab for commission table ───────────────────────────────
  const [activeKitId, setActiveKitId] = useState(null);
  const [customTiers, setCustomTiers] = useState({}); // { [kitId]: [qty1, qty2] }
  const [newTierInput, setNewTierInput] = useState("");

  // ─── Step 1: Load Hierarchy Options for 5 Quick Filters ───────────────────
  useEffect(() => {
    if (!token) return;
    setLoadingHierarchy(true);

    // Try universal delivery-management hierarchy options first
    axios
      .get(`${API_URL}/delivery-management/hierarchy-options`, {
        headers: authHeaderObj(),
      })
      .then((res) => {
        if (res.data?.status === "success" && res.data.data) {
          setHierarchy(res.data.data);
        }
      })
      .catch(() => {
        // Fallback to estimator hierarchy options
        axios
          .get(`${API_URL}/admin-api/estimator/project-boms/hierarchy-options`, {
            headers: authHeaderObj(),
          })
          .then((res) => {
            if (res.data?.status === "success" && res.data.data) {
              setHierarchy(res.data.data);
            }
          })
          .catch(() => {});
      })
      .finally(() => setLoadingHierarchy(false));
  }, [token]);

  // ─── Step 2: Load States on mount ─────────────────────────────────────────
  useEffect(() => {
    if (!token) return;
    setLoadingStates(true);
    axios
      .get(`${API_URL}/geolocation/active-states?unique_id=${MODULE_UID}&req_for=view`, {
        headers: authHeaderObj(),
      })
      .then((res) => {
        const data = res.data?.states || res.data?.data || [];
        setStates(data);
      })
      .catch(() => {})
      .finally(() => setLoadingStates(false));
  }, [token]);

  // ─── Step 3: Load Districts when state changes ────────────────────────────
  useEffect(() => {
    setDistricts([]);
    setSelectedDistrict("");
    if (!selectedState) return;

    setLoadingDistricts(true);
    axios
      .get(
        `${API_URL}/geolocation/districts?unique_id=${MODULE_UID}&req_for=view&state_id=${selectedState}`,
        { headers: authHeaderObj() }
      )
      .then((res) => {
        const data = res.data?.districts || res.data?.data || [];
        setDistricts(data);
      })
      .catch(() => {})
      .finally(() => setLoadingDistricts(false));
  }, [selectedState]);

  // ─── Step 4: Load Franchises (immediate load on mount + filter on state/district) ─
  useEffect(() => {
    if (!token) return;
    setLoadingFranchises(true);
    let url = `${API_URL}/reseller-mgmt/list?req_for=view&unique_id=${MODULE_UID}&limit=100`;
    if (selectedState) url += `&state_id=${selectedState}`;
    if (selectedDistrict) url += `&district_id=${selectedDistrict}`;

    axios
      .get(url, { headers: authHeaderObj() })
      .then((res) => {
        const data = res.data?.data || res.data?.resellers || [];
        setFranchises(data);
        // If no franchise is selected yet, select the first one by default
        setSelectedFranchise((prev) => {
          if (prev && data.some((f) => getCleanId(f) === getCleanId(prev))) {
            return prev;
          }
          return data[0] || null;
        });
      })
      .catch(() => {})
      .finally(() => setLoadingFranchises(false));
  }, [token, selectedState, selectedDistrict]);

  // ─── Step 5: Load Franchise Data (authorizations + kits + rules) ──────────
  const loadFranchiseData = useCallback(async (franchise) => {
    if (!franchise) return;
    const rid = getCleanId(franchise);

    setLoadingProducts(true);
    setLoadingKits(true);
    setLoadingRules(true);
    setAllocatedProducts([]);
    setAllKits([]);
    setCommissionMap({});
    setActiveKitId(null);

    // Parallel fetches
    const [productsRes, kitsRes, rulesRes] = await Promise.allSettled([
      // 1. Allocated products/authorizations for this reseller
      axios
        .get(
          `${API_URL}/reseller-mgmt/product-auth/list/${rid}?unique_id=${MODULE_UID}&req_for=view`,
          { headers: authHeaderObj() }
        )
        .catch(() =>
          axios.get(
            `${API_URL}/reseller-mgmt/product-auth/list?unique_id=${MODULE_UID}&req_for=view&reseller_id=${rid}`,
            { headers: authHeaderObj() }
          )
        ),
      // 2. All combo kits
      axios
        .get(
          `${API_URL}/combo-kits/india/get-kits?unique_id=${MODULE_UID}&req_for=view&is_custom=false`,
          { headers: authHeaderObj() }
        )
        .catch(() =>
          axios.get(
            `${API_URL}/combo-kits/get-kits?unique_id=${MODULE_UID}&req_for=view&is_custom=false`,
            { headers: authHeaderObj() }
          )
        ),
      // 3. Existing individual commission rules for this reseller
      axios
        .get(
          `${API_URL}/franchisee/commission-rules/individual/list?unique_id=${MODULE_UID}&req_for=view&reseller_id=${rid}`,
          { headers: authHeaderObj() }
        )
        .catch(() => ({ data: { data: [] } })),
    ]);

    // Process authorizations
    const rawAuthorizations =
      productsRes.status === "fulfilled"
        ? productsRes.value.data?.data || productsRes.value.data?.authorizations || []
        : [];
    setAllocatedProducts(rawAuthorizations);
    setLoadingProducts(false);

    // Process kits
    const rawKits =
      kitsRes.status === "fulfilled"
        ? kitsRes.value.data?.data || []
        : [];
    setAllKits(rawKits);
    setLoadingKits(false);

    if (rawKits.length > 0) {
      setActiveKitId(getCleanId(rawKits[0]));
    }

    // Process existing individual rules → build commissionMap
    const rawRules =
      rulesRes.status === "fulfilled"
        ? rulesRes.value.data?.data || []
        : [];

    const map = {};
    rawRules.forEach((rule) => {
      const kitId = rule.combo_kit_id?._id || rule.combo_kit_id;
      const qty = rule.order_quantity;
      const type = rule.order_type; // "po" | "loose"
      const key = `${kitId}_${qty}_${type}`;
      map[key] = currencyToPaise(rule.commission_amount_paise);
    });
    setCommissionMap(map);
    setSavedKeys(new Set(Object.keys(map)));
    setLoadingRules(false);
  }, []);

  useEffect(() => {
    if (selectedFranchise) {
      loadFranchiseData(selectedFranchise);
    } else {
      setAllocatedProducts([]);
      setAllKits([]);
      setCommissionMap({});
      setActiveKitId(null);
    }
  }, [selectedFranchise, loadFranchiseData]);

  // ─── Cascading 5 Quick Filter Options ─────────────────────────────────────
  const shopHierarchy = useMemo(() => hierarchy.shopHierarchy || [], [hierarchy.shopHierarchy]);

  // 1. Industry Type Options
  const industryTypeOptions = useMemo(() => {
    const list = [];
    const seen = new Set();
    if (shopHierarchy && shopHierarchy.length > 0) {
      shopHierarchy.forEach((ind) => {
        const id = ind.id || ind._id;
        const name = ind.name;
        if (name && !seen.has(name.toLowerCase())) {
          seen.add(name.toLowerCase());
          list.push({ value: String(id), text: name });
        }
      });
    } else if (hierarchy?.industries && hierarchy.industries.length > 0) {
      hierarchy.industries.forEach((ind) => {
        const id = ind._id || ind.id;
        const name = ind.name;
        if (name && !seen.has(name.toLowerCase())) {
          seen.add(name.toLowerCase());
          list.push({ value: String(id), text: name });
        }
      });
    }
    return [{ value: "all", text: "All Industry Types" }, ...list];
  }, [shopHierarchy, hierarchy]);

  // 2. Category Options (cascading from Industry Type)
  const categoryOptions = useMemo(() => {
    if (!quickFilters.industryType || quickFilters.industryType === "all") {
      return [{ value: "all", text: "All Categories" }];
    }
    const catMap = new Map();
    if (shopHierarchy && shopHierarchy.length > 0) {
      const selectedInd = shopHierarchy.find(
        (ind) =>
          String(ind.id || ind._id) === String(quickFilters.industryType) ||
          ind.name?.toLowerCase() === quickFilters.industryType.toLowerCase()
      );
      if (selectedInd && selectedInd.categories) {
        selectedInd.categories.forEach((cat) => {
          if (cat.name && !catMap.has(cat.name.toLowerCase())) {
            catMap.set(cat.name.toLowerCase(), {
              value: String(cat.id || cat._id),
              text: cat.name,
            });
          }
        });
      }
    } else if (hierarchy?.categories && hierarchy.categories.length > 0) {
      hierarchy.categories.forEach((cat) => {
        if (
          String(cat.industry_type_id) === String(quickFilters.industryType) &&
          cat.name &&
          !catMap.has(cat.name.toLowerCase())
        ) {
          catMap.set(cat.name.toLowerCase(), {
            value: String(cat._id || cat.id),
            text: cat.name,
          });
        }
      });
    }
    return [{ value: "all", text: "All Categories" }, ...Array.from(catMap.values())];
  }, [shopHierarchy, hierarchy, quickFilters.industryType]);

  // 3. Sub Category Options (cascading from Category)
  const subCategoryOptions = useMemo(() => {
    if (
      !quickFilters.industryType ||
      quickFilters.industryType === "all" ||
      !quickFilters.category ||
      quickFilters.category === "all"
    ) {
      return [{ value: "all", text: "All Sub-Categories" }];
    }
    const subsMap = new Map();
    if (shopHierarchy && shopHierarchy.length > 0) {
      const selectedInd = shopHierarchy.find(
        (ind) =>
          String(ind.id || ind._id) === String(quickFilters.industryType) ||
          ind.name?.toLowerCase() === quickFilters.industryType.toLowerCase()
      );
      if (selectedInd && selectedInd.categories) {
        const selectedCat = selectedInd.categories.find(
          (cat) =>
            String(cat.id || cat._id) === String(quickFilters.category) ||
            cat.name?.toLowerCase() === quickFilters.category.toLowerCase()
        );
        if (selectedCat && selectedCat.subcategories) {
          selectedCat.subcategories.forEach((sub) => {
            if (sub.name && !subsMap.has(sub.name.toLowerCase())) {
              subsMap.set(sub.name.toLowerCase(), {
                value: String(sub.id || sub._id),
                text: sub.name,
              });
            }
          });
        }
      }
    } else if (hierarchy?.subcategories && hierarchy.subcategories.length > 0) {
      hierarchy.subcategories.forEach((sub) => {
        if (
          String(sub.category) === String(quickFilters.category) &&
          sub.name &&
          !subsMap.has(sub.name.toLowerCase())
        ) {
          subsMap.set(sub.name.toLowerCase(), {
            value: String(sub._id || sub.id),
            text: sub.name,
          });
        }
      });
    }
    return [{ value: "all", text: "All Sub-Categories" }, ...Array.from(subsMap.values())];
  }, [shopHierarchy, hierarchy, quickFilters.industryType, quickFilters.category]);

  // 4. System Type Options (cascading from Sub Category)
  const systemTypeOptions = useMemo(() => {
    if (
      !quickFilters.category ||
      quickFilters.category === "all" ||
      !quickFilters.subCategory ||
      quickFilters.subCategory === "all"
    ) {
      return [{ value: "all", text: "All System Types" }];
    }
    const typesMap = new Map();
    if (shopHierarchy && shopHierarchy.length > 0) {
      const selectedInd = shopHierarchy.find(
        (ind) =>
          String(ind.id || ind._id) === String(quickFilters.industryType) ||
          ind.name?.toLowerCase() === quickFilters.industryType.toLowerCase()
      );
      if (selectedInd && selectedInd.categories) {
        const selectedCat = selectedInd.categories.find(
          (cat) =>
            String(cat.id || cat._id) === String(quickFilters.category) ||
            cat.name?.toLowerCase() === quickFilters.category.toLowerCase()
        );
        if (selectedCat && selectedCat.subcategories) {
          const selectedSub = selectedCat.subcategories.find(
            (sub) =>
              String(sub.id || sub._id) === String(quickFilters.subCategory) ||
              sub.name?.toLowerCase() === quickFilters.subCategory.toLowerCase()
          );
          if (selectedSub && selectedSub.mappedTypes) {
            selectedSub.mappedTypes.forEach((mt) => {
              if (mt.name && !typesMap.has(mt.name.toLowerCase())) {
                typesMap.set(mt.name.toLowerCase(), {
                  value: String(mt.type_id || mt.id || mt._id),
                  text: mt.name,
                });
              }
            });
          }
        }
      }
    } else if (hierarchy?.types && hierarchy.types.length > 0) {
      hierarchy.types.forEach((t) => {
        if (t.name && !typesMap.has(t.name.toLowerCase())) {
          typesMap.set(t.name.toLowerCase(), {
            value: String(t._id || t.id),
            text: t.name,
          });
        }
      });
    }
    return [{ value: "all", text: "All System Types" }, ...Array.from(typesMap.values())];
  }, [shopHierarchy, hierarchy, quickFilters.industryType, quickFilters.category, quickFilters.subCategory]);

  // 5. Project Range Options
  const projectRangeOptions = useMemo(() => {
    if (
      !quickFilters.subCategory ||
      quickFilters.subCategory === "all" ||
      !quickFilters.systemType ||
      quickFilters.systemType === "all"
    ) {
      return [{ value: "all", text: "All Project Ranges" }];
    }
    const rangesMap = new Map();
    if (shopHierarchy && shopHierarchy.length > 0) {
      const selectedInd = shopHierarchy.find(
        (ind) =>
          String(ind.id || ind._id) === String(quickFilters.industryType) ||
          ind.name?.toLowerCase() === quickFilters.industryType.toLowerCase()
      );
      if (selectedInd && selectedInd.categories) {
        const selectedCat = selectedInd.categories.find(
          (cat) =>
            String(cat.id || cat._id) === String(quickFilters.category) ||
            cat.name?.toLowerCase() === quickFilters.category.toLowerCase()
        );
        if (selectedCat && selectedCat.subcategories) {
          const selectedSub = selectedCat.subcategories.find(
            (sub) =>
              String(sub.id || sub._id) === String(quickFilters.subCategory) ||
              sub.name?.toLowerCase() === quickFilters.subCategory.toLowerCase()
          );
          if (selectedSub && selectedSub.mappedTypes) {
            const selectedMt = selectedSub.mappedTypes.find(
              (mt) =>
                String(mt.type_id || mt.id) === String(quickFilters.systemType) ||
                mt.name?.toLowerCase() === quickFilters.systemType.toLowerCase()
            );
            if (selectedMt && selectedMt.ranges) {
              selectedMt.ranges.forEach((r) => {
                const label = r.range_label || `${r.min_value} - ${r.max_value} kW`;
                if (!rangesMap.has(label)) {
                  rangesMap.set(label, {
                    value: String(r.id || r._id),
                    text: label,
                    min: r.min_value,
                    max: r.max_value,
                  });
                }
              });
            }
          }
        }
      }
    } else if (hierarchy?.ranges && hierarchy.ranges.length > 0) {
      hierarchy.ranges.forEach((r) => {
        const label = `${r.min_value} - ${r.max_value} kW`;
        if (!rangesMap.has(label)) {
          rangesMap.set(label, {
            value: String(r._id || r.id),
            text: label,
            min: r.min_value,
            max: r.max_value,
          });
        }
      });
    }
    return [{ value: "all", text: "All Project Ranges" }, ...Array.from(rangesMap.values())];
  }, [shopHierarchy, hierarchy, quickFilters.industryType, quickFilters.category, quickFilters.subCategory, quickFilters.systemType]);

  // Check if any quick filter is active
  const hasActiveQuickFilters = useMemo(() => {
    return (
      quickFilters.industryType !== "all" ||
      quickFilters.category !== "all" ||
      quickFilters.subCategory !== "all" ||
      quickFilters.systemType !== "all" ||
      quickFilters.projectRange !== "all"
    );
  }, [quickFilters]);

  const clearQuickFilters = () => {
    setQuickFilters({
      industryType: "all",
      category: "all",
      subCategory: "all",
      systemType: "all",
      projectRange: "all",
    });
  };

  // ─── Filtered Combo Kits matching 5 Quick Filters ─────────────────────────
  const filteredComboKits = useMemo(() => {
    return allKits.filter((kit) => {
      // 1. Industry Type
      const kitIndId = getCleanId(
        kit.solar_kit_id?.category_id?.industry_type_id?._id ||
        kit.solar_kit_id?.category_id?.industry_type_id ||
        kit.category_id?.industry_type_id?._id ||
        kit.category_id?.industry_type_id ||
        kit.industry_type_id
      );
      const kitIndName = (
        kit.solar_kit_id?.category_id?.industry_type_id?.name ||
        kit.category_id?.industry_type_id?.name ||
        kit.industry_type?.name ||
        ""
      ).toLowerCase();

      if (quickFilters.industryType !== "all") {
        const matchesInd =
          kitIndId === quickFilters.industryType ||
          kitIndName === quickFilters.industryType.toLowerCase();
        if (!matchesInd && kitIndId) return false;
      }

      // 2. Category
      const kitCatId = getCleanId(
        kit.solar_kit_id?.category_id?._id ||
        kit.solar_kit_id?.category_id ||
        kit.category_id?._id ||
        kit.category_id
      );
      const kitCatName = (
        kit.solar_kit_id?.category_id?.name ||
        kit.category_id?.name ||
        ""
      ).toLowerCase();

      if (quickFilters.category !== "all") {
        const matchesCat =
          kitCatId === quickFilters.category ||
          kitCatName === quickFilters.category.toLowerCase();
        if (!matchesCat && kitCatId) return false;
      }

      // 3. Subcategory
      const kitSubId = getCleanId(
        kit.solar_kit_id?.subcategory_id?._id ||
        kit.solar_kit_id?.subcategory_id ||
        kit.subcategory_id?._id ||
        kit.subcategory_id
      );
      const kitSubName = (
        kit.solar_kit_id?.subcategory_id?.name ||
        kit.subcategory_id?.name ||
        ""
      ).toLowerCase();

      if (quickFilters.subCategory !== "all") {
        const matchesSub =
          kitSubId === quickFilters.subCategory ||
          kitSubName === quickFilters.subCategory.toLowerCase();
        if (!matchesSub && kitSubId) return false;
      }

      // 4. System Type
      const kitTypeId = getCleanId(
        kit.solar_kit_id?.type_id?._id ||
        kit.solar_kit_id?.type_id?.type?._id ||
        kit.solar_kit_id?.type_id ||
        kit.type_id
      );
      if (quickFilters.systemType !== "all") {
        const matchesType = kitTypeId === quickFilters.systemType;
        if (!matchesType && kitTypeId) return false;
      }

      // 5. Project Range
      const kitRangeId = getCleanId(
        kit.project_range_id?._id ||
        kit.project_range_id ||
        kit.solar_kit_id?.project_range_id?._id ||
        kit.solar_kit_id?.project_range_id
      );
      if (quickFilters.projectRange !== "all") {
        const selectedRangeObj = projectRangeOptions.find(
          (o) => o.value === quickFilters.projectRange
        );
        let matchesRange = kitRangeId === quickFilters.projectRange;
        if (
          !matchesRange &&
          selectedRangeObj &&
          selectedRangeObj.min != null &&
          selectedRangeObj.max != null
        ) {
          const cap = Number(kit.capacity || 0);
          if (cap >= Number(selectedRangeObj.min) && cap <= Number(selectedRangeObj.max)) {
            matchesRange = true;
          }
        }
        if (!matchesRange && kitRangeId) return false;
      }

      return true;
    });
  }, [allKits, quickFilters, projectRangeOptions]);

  // Keep active kit valid
  useEffect(() => {
    if (filteredComboKits.length > 0) {
      if (!filteredComboKits.some((k) => getCleanId(k) === activeKitId)) {
        setActiveKitId(getCleanId(filteredComboKits[0]));
      }
    } else {
      setActiveKitId(null);
    }
  }, [filteredComboKits, activeKitId]);

  // ─── Filtered Catalog / Allocated Products List ───────────────────────────
  // Combines authorizations or fallback to combo kits
  const catalogItems = useMemo(() => {
    // Build a map of kit authorizations
    const authMap = new Map();
    allocatedProducts.forEach((auth) => {
      const kid = getCleanId(auth.kit || auth.kit_id);
      if (kid) authMap.set(kid, auth);
    });

    return filteredComboKits.map((kit) => {
      const kid = getCleanId(kit);
      const auth = authMap.get(kid);
      return {
        _id: kid,
        name: kit.name || kit.kit_name || "Solar Combo Kit",
        capacity: kit.capacity || 0,
        scope_type: "kit",
        is_authorized: auth ? auth.is_authorized !== false : true, // Default authorized if no restrictive rule
        is_custom_rule: !!auth,
        industry_name:
          kit.solar_kit_id?.category_id?.industry_type_id?.name ||
          kit.category_id?.industry_type_id?.name ||
          "Solar PV",
        category_name:
          kit.solar_kit_id?.category_id?.name ||
          kit.category_id?.name ||
          "Residential Solar",
        subcategory_name:
          kit.solar_kit_id?.subcategory_id?.name ||
          kit.subcategory_id?.name ||
          "Standard Rooftop",
        base_price: kit.base_price_cached,
        selling_price: kit.selling_price_cached,
        order_quantities: kit.order_quantities || [],
        image: kit.kit_image,
      };
    });
  }, [filteredComboKits, allocatedProducts]);

  const searchedCatalogItems = useMemo(() => {
    if (!productSearch.trim()) return catalogItems;
    const q = productSearch.toLowerCase();
    return catalogItems.filter(
      (item) =>
        item.name.toLowerCase().includes(q) ||
        item.category_name.toLowerCase().includes(q) ||
        item.subcategory_name.toLowerCase().includes(q)
    );
  }, [catalogItems, productSearch]);

  // ─── Active Kit for Commission Table ──────────────────────────────────────
  const activeKit = useMemo(
    () => filteredComboKits.find((k) => getCleanId(k) === activeKitId),
    [filteredComboKits, activeKitId]
  );

  // Active Kit quantity tiers (use configured tiers or default tiers + custom additions)
  const activeKitTiers = useMemo(() => {
    if (!activeKit) return [];
    const kid = getCleanId(activeKit);
    let tiers = Array.isArray(activeKit.order_quantities) && activeKit.order_quantities.length > 0
      ? [...activeKit.order_quantities]
      : [10, 25, 50, 100]; // Default tiers if not configured on kit

    // Merge any custom added tiers for this kit
    if (customTiers[kid]) {
      tiers = [...new Set([...tiers, ...customTiers[kid]])];
    }
    return tiers.sort((a, b) => a - b);
  }, [activeKit, customTiers]);

  const handleAddCustomTier = () => {
    const val = parseInt(newTierInput, 10);
    if (!val || val <= 0 || !activeKit) return;
    const kid = getCleanId(activeKit);
    setCustomTiers((prev) => ({
      ...prev,
      [kid]: [...(prev[kid] || []), val],
    }));
    setNewTierInput("");
  };

  // ─── Commission map helpers ─────────────────────────────────────────────
  const getCommKey = (kitId, qty, type) => `${kitId}_${qty}_${type}`;

  const setComm = (kitId, qty, type, val) => {
    const key = getCommKey(kitId, qty, type);
    setCommissionMap((prev) => ({ ...prev, [key]: val }));
  };

  const getComm = (kitId, qty, type) =>
    commissionMap[getCommKey(kitId, qty, type)] ?? "";

  // Helper to copy PO commissions to Loose commissions for active kit
  const handleCopyPoToLoose = () => {
    if (!activeKit) return;
    const kid = getCleanId(activeKit);
    const updates = {};
    activeKitTiers.forEach((qty) => {
      const poVal = getComm(kid, qty, "po");
      if (poVal !== "") {
        updates[getCommKey(kid, qty, "loose")] = poVal;
      }
    });
    setCommissionMap((prev) => ({ ...prev, ...updates }));
    dispatch(setAlert({ type: "info", message: "Copied PO rates to Loose rates for this kit" }));
  };

  // ─── Save commission rules ──────────────────────────────────────────────
  const handleSave = async () => {
    if (!selectedFranchise) return;
    const rid = getCleanId(selectedFranchise);

    const rules = [];
    allKits.forEach((kit) => {
      const kitId = getCleanId(kit);
      const kidTiers = Array.isArray(kit.order_quantities) && kit.order_quantities.length > 0
        ? kit.order_quantities
        : [10, 25, 50, 100];
      const allTierList = customTiers[kitId]
        ? [...new Set([...kidTiers, ...customTiers[kitId]])]
        : kidTiers;

      allTierList.forEach((qty) => {
        ["po", "loose"].forEach((type) => {
          const val = getComm(kitId, qty, type);
          if (val !== "" && val !== null && !isNaN(Number(val))) {
            rules.push({
              reseller_id: rid,
              combo_kit_id: kitId,
              order_quantity: qty,
              order_type: type,
              commission_amount_paise: paiseToCurrency(val),
            });
          }
        });
      });
    });

    if (rules.length === 0) {
      dispatch(setAlert({ type: "warning", message: "No commission values entered to save" }));
      return;
    }

    setSavingRules(true);
    try {
      await axios.post(
        `${API_URL}/franchisee/commission-rules/individual/save?unique_id=${MODULE_UID}&req_for=add`,
        { reseller_id: rid, rules },
        { headers: authHeaderObj() }
      );
      dispatch(setAlert({ type: "success", message: `Successfully saved ${rules.length} commission rule(s)!` }));
      setSavedKeys(new Set(Object.keys(commissionMap).filter((k) => commissionMap[k] !== "")));
    } catch (err) {
      dispatch(
        setAlert({
          type: "error",
          message: err.response?.data?.message || "Failed to save commission rules",
        })
      );
    } finally {
      setSavingRules(false);
    }
  };

  // ─── Franchise Search Filter ─────────────────────────────────────────────
  const filteredFranchises = useMemo(() => {
    if (!franchiseSearch.trim()) return franchises;
    const q = franchiseSearch.toLowerCase();
    return franchises.filter(
      (f) =>
        (f.business_name || "").toLowerCase().includes(q) ||
        (f.name || "").toLowerCase().includes(q) ||
        (f.email || "").toLowerCase().includes(q) ||
        (f.mobile || "").includes(q) ||
        (f.city || "").toLowerCase().includes(q)
    );
  }, [franchises, franchiseSearch]);

  return (
    <div className="space-y-6 pb-24 animate-in fade-in duration-300">

      {/* ── Header Banner ── */}
      <div className="relative rounded-2xl bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 shadow-lg overflow-hidden text-white">
        <div className="absolute inset-0 bg-grid-white/10 opacity-30" />
        <div className="relative px-6 py-6 lg:px-8 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/30 shadow-inner">
              <FaRupeeSign className="text-white text-2xl" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-white/20 border border-white/30 text-white">
                  Reseller Management
                </span>
                <span className="text-[10px] font-bold text-white/80">Solar Shop India</span>
              </div>
              <h1 className="text-xl lg:text-2xl font-black text-white mt-1">
                Franchise Commission Settings
              </h1>
              <p className="text-white/85 text-xs mt-0.5 font-medium">
                Set individual per-franchise commission rates by kit quantity tier — PO & Loose order separately
              </p>
            </div>
          </div>

          {selectedFranchise && (
            <div className="flex items-center gap-3">
              <Button
                onClick={handleSave}
                loading={savingRules}
                variant="secondary"
                leftIcon={<FiSave size={14} />}
                className="bg-white text-orange-700 hover:bg-orange-50 font-black text-xs uppercase tracking-wider rounded-xl shadow-md cursor-pointer border-0"
              >
                Save All Rules
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* ── Main Layout: Sidebar + Content ── */}
      <div className="grid grid-cols-1 lg:grid-cols-[330px_1fr] gap-5 items-start">

        {/* ── LEFT: Franchise Selector Panel ── */}
        <div className="space-y-4">

          {/* Geography Filters */}
          <div className="card border-2 border-border p-4.5 space-y-3.5 bg-surface rounded-2xl shadow-xs">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-black uppercase tracking-[0.16em] text-text-primary flex items-center gap-2">
                <FiMapPin className="text-primary" size={14} />
                Location Filter
              </h2>
              {(selectedState || selectedDistrict) && (
                <button
                  onClick={() => { setSelectedState(""); setSelectedDistrict(""); }}
                  className="text-[11px] font-bold text-primary hover:underline cursor-pointer"
                >
                  Reset
                </button>
              )}
            </div>

            {/* State */}
            <div>
              <label className="block text-[10px] font-black text-text-muted uppercase tracking-wider mb-1">
                State
              </label>
              <div className="relative">
                <select
                  value={selectedState}
                  onChange={(e) => setSelectedState(e.target.value)}
                  className="w-full appearance-none px-3 py-2 rounded-xl border border-border bg-surface text-text-primary text-xs font-bold focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all cursor-pointer"
                >
                  <option value="">All States ({states.length})</option>
                  {states.map((s) => (
                    <option key={s._id || s.id} value={s._id || s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
                <FaChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted text-[10px] pointer-events-none" />
              </div>
            </div>

            {/* District */}
            <div>
              <label className="block text-[10px] font-black text-text-muted uppercase tracking-wider mb-1">
                District
              </label>
              <div className="relative">
                <select
                  value={selectedDistrict}
                  onChange={(e) => setSelectedDistrict(e.target.value)}
                  disabled={!selectedState}
                  className="w-full appearance-none px-3 py-2 rounded-xl border border-border bg-surface text-text-primary text-xs font-bold focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="">All Districts ({districts.length})</option>
                  {districts.map((d) => (
                    <option key={d._id || d.id} value={d._id || d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
                <FaChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted text-[10px] pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Franchise List */}
          <div className="card border-2 border-border p-4.5 space-y-3 bg-surface rounded-2xl shadow-xs">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-black uppercase tracking-[0.16em] text-text-primary flex items-center gap-2">
                <FiUsers className="text-primary" size={14} />
                Franchises
              </h2>
              <span className="text-[10px] font-black text-text-muted bg-surface-hover px-2.5 py-1 rounded-lg border border-border/40">
                {filteredFranchises.length} found
              </span>
            </div>

            {/* Search */}
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={13} />
              <input
                type="text"
                placeholder="Search franchise or city..."
                value={franchiseSearch}
                onChange={(e) => setFranchiseSearch(e.target.value)}
                className="w-full pl-8.5 pr-3 py-2 rounded-xl border border-border bg-surface text-text-primary text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              />
            </div>

            {/* List */}
            <div className="space-y-2 max-h-[440px] overflow-y-auto pr-0.5">
              {loadingFranchises ? (
                <div className="flex items-center justify-center py-8 text-text-muted gap-2">
                  <FiLoader className="animate-spin text-primary" size={16} />
                  <span className="text-xs font-medium">Loading franchises...</span>
                </div>
              ) : filteredFranchises.length === 0 ? (
                <div className="py-8 text-center">
                  <FiUsers className="mx-auto text-text-muted mb-2" size={24} />
                  <p className="text-xs text-text-muted font-bold">No franchises found</p>
                  <p className="text-[11px] text-text-muted mt-0.5">Try clearing location or search filters</p>
                </div>
              ) : (
                filteredFranchises.map((f) => (
                  <FranchiseCard
                    key={getCleanId(f)}
                    reseller={f}
                    selected={getCleanId(selectedFranchise) === getCleanId(f)}
                    onClick={() => setSelectedFranchise(f)}
                  />
                ))
              )}
            </div>
          </div>
        </div>

        {/* ── RIGHT: Quick Filters + Catalog + Commission Rules ── */}
        <div className="space-y-5">
          {!selectedFranchise ? (
            /* Empty state */
            <div className="card border-2 border-dashed border-border/70 p-16 flex flex-col items-center justify-center text-center rounded-2xl bg-surface/50">
              <div className="w-16 h-16 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center mb-4 border border-amber-500/20">
                <FiUsers size={28} />
              </div>
              <h3 className="font-black text-text-primary text-base mb-1">Select a Franchise</h3>
              <p className="text-xs text-text-muted font-medium max-w-sm leading-relaxed">
                Choose a franchise from the left panel to configure individual commission rates by kit quantity tier.
              </p>
            </div>
          ) : (
            <>
              {/* Selected Franchise Summary Banner */}
              <div className="card border-2 border-primary/20 bg-primary/5 p-4 rounded-2xl flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-11 h-11 rounded-xl bg-primary flex items-center justify-center text-white font-black text-base shrink-0 shadow-sm">
                    {(selectedFranchise.business_name || selectedFranchise.name || "F")[0].toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="font-black text-text-primary text-sm truncate flex items-center gap-2">
                      <span>{selectedFranchise.business_name || selectedFranchise.name}</span>
                      <span className="text-[10px] font-bold bg-success/10 text-success border border-success/20 px-2 py-0.5 rounded-full">
                        {selectedFranchise.activation_status || "Active"}
                      </span>
                    </div>
                    <div className="flex gap-2 flex-wrap items-center mt-1">
                      {selectedFranchise.plan_id?.name && (
                        <span className="text-[10px] font-bold bg-info/10 text-info px-2 py-0.5 rounded-full border border-info/20">
                          Plan: {selectedFranchise.plan_id.name}
                        </span>
                      )}
                      <span className="text-[11px] text-text-muted font-medium">
                        {selectedFranchise.email || selectedFranchise.mobile}
                      </span>
                      {selectedFranchise.city && (
                        <span className="text-[11px] text-text-muted font-medium flex items-center gap-0.5">
                          • <FiMapPin size={10} /> {selectedFranchise.city}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-text-muted font-medium">
                    {allKits.length} total kits available
                  </span>
                  <button
                    onClick={() => setSelectedFranchise(null)}
                    className="p-1.5 rounded-lg border border-border/40 text-text-muted hover:bg-surface-hover hover:text-text-primary transition-colors cursor-pointer"
                    title="Deselect franchise"
                  >
                    <FiX size={14} />
                  </button>
                </div>
              </div>

              {/* ── 5 Cascading Quick Filters (Matches Screenshot 3) ── */}
              <div className="bg-surface rounded-2xl border-2 border-border/70 p-4 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                      <FiBox size={14} />
                    </div>
                    <h3 className="font-bold text-xs text-text-primary uppercase tracking-wider">
                      Quick Filters
                    </h3>
                    {hasActiveQuickFilters && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                        Active Filter ({filteredComboKits.length} kits)
                      </span>
                    )}
                  </div>

                  {hasActiveQuickFilters && (
                    <button
                      type="button"
                      onClick={clearQuickFilters}
                      className="text-xs font-bold text-primary hover:text-primary-hover hover:underline cursor-pointer transition-colors"
                    >
                      Clear Main
                    </button>
                  )}
                </div>

                {/* 5 Cascading Dropdowns Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                  {/* 1. Industry Type */}
                  <div>
                    <label className="block text-[11px] font-bold text-text-muted uppercase tracking-wider mb-1">
                      Industry Type
                    </label>
                    <div className="relative">
                      <select
                        value={quickFilters.industryType}
                        onChange={(e) =>
                          setQuickFilters({
                            industryType: e.target.value,
                            category: "all",
                            subCategory: "all",
                            systemType: "all",
                            projectRange: "all",
                          })
                        }
                        className="w-full appearance-none px-3 py-2 pr-7 text-xs font-semibold rounded-xl border border-border bg-surface text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all cursor-pointer shadow-xs"
                      >
                        {industryTypeOptions.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.text}
                          </option>
                        ))}
                      </select>
                      <FaChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-muted text-[9px] pointer-events-none" />
                    </div>
                  </div>

                  {/* 2. Category */}
                  <div>
                    <label className="block text-[11px] font-bold text-text-muted uppercase tracking-wider mb-1">
                      Category
                    </label>
                    <div className="relative">
                      <select
                        value={quickFilters.category}
                        disabled={quickFilters.industryType === "all"}
                        onChange={(e) =>
                          setQuickFilters((prev) => ({
                            ...prev,
                            category: e.target.value,
                            subCategory: "all",
                            systemType: "all",
                            projectRange: "all",
                          }))
                        }
                        className="w-full appearance-none px-3 py-2 pr-7 text-xs font-semibold rounded-xl border border-border bg-surface text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all cursor-pointer shadow-xs disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-surface-hover/40"
                      >
                        {categoryOptions.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.text}
                          </option>
                        ))}
                      </select>
                      <FaChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-muted text-[9px] pointer-events-none" />
                    </div>
                  </div>

                  {/* 3. Sub Category */}
                  <div>
                    <label className="block text-[11px] font-bold text-text-muted uppercase tracking-wider mb-1">
                      Sub Category
                    </label>
                    <div className="relative">
                      <select
                        value={quickFilters.subCategory}
                        disabled={quickFilters.category === "all"}
                        onChange={(e) =>
                          setQuickFilters((prev) => ({
                            ...prev,
                            subCategory: e.target.value,
                            systemType: "all",
                            projectRange: "all",
                          }))
                        }
                        className="w-full appearance-none px-3 py-2 pr-7 text-xs font-semibold rounded-xl border border-border bg-surface text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all cursor-pointer shadow-xs disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-surface-hover/40"
                      >
                        {subCategoryOptions.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.text}
                          </option>
                        ))}
                      </select>
                      <FaChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-muted text-[9px] pointer-events-none" />
                    </div>
                  </div>

                  {/* 4. System Type */}
                  <div>
                    <label className="block text-[11px] font-bold text-text-muted uppercase tracking-wider mb-1">
                      System Type
                    </label>
                    <div className="relative">
                      <select
                        value={quickFilters.systemType}
                        disabled={quickFilters.subCategory === "all"}
                        onChange={(e) =>
                          setQuickFilters((prev) => ({
                            ...prev,
                            systemType: e.target.value,
                            projectRange: "all",
                          }))
                        }
                        className="w-full appearance-none px-3 py-2 pr-7 text-xs font-semibold rounded-xl border border-border bg-surface text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all cursor-pointer shadow-xs disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-surface-hover/40"
                      >
                        {systemTypeOptions.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.text}
                          </option>
                        ))}
                      </select>
                      <FaChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-muted text-[9px] pointer-events-none" />
                    </div>
                  </div>

                  {/* 5. Project Range */}
                  <div>
                    <label className="block text-[11px] font-bold text-text-muted uppercase tracking-wider mb-1">
                      Project Range
                    </label>
                    <div className="relative">
                      <select
                        value={quickFilters.projectRange}
                        disabled={quickFilters.systemType === "all"}
                        onChange={(e) =>
                          setQuickFilters((prev) => ({
                            ...prev,
                            projectRange: e.target.value,
                          }))
                        }
                        className="w-full appearance-none px-3 py-2 pr-7 text-xs font-semibold rounded-xl border border-border bg-surface text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all cursor-pointer shadow-xs disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-surface-hover/40"
                      >
                        {projectRangeOptions.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.text}
                          </option>
                        ))}
                      </select>
                      <FaChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-muted text-[9px] pointer-events-none" />
                    </div>
                  </div>
                </div>
              </div>

              {/* ── Section A: Allocated Products & Kits ── */}
              <div className="bg-surface rounded-2xl border-2 border-border/70 shadow-xs overflow-hidden">
                <div className="px-5 py-4 bg-surface-hover/30 border-b border-border flex items-center justify-between flex-wrap gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
                      <FiPackage size={15} />
                    </div>
                    <div>
                      <h2 className="text-xs font-black text-text-primary uppercase tracking-[0.16em]">
                        Allocated Products & Kits
                      </h2>
                      <p className="text-[10px] text-text-muted font-medium">
                        Products & Kits available to this franchise according to authorization matrix
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {/* Live search input */}
                    <div className="relative w-44">
                      <FiSearch className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-muted" size={12} />
                      <input
                        type="text"
                        placeholder="Search items..."
                        value={productSearch}
                        onChange={(e) => setProductSearch(e.target.value)}
                        className="w-full pl-7.5 pr-2.5 py-1.5 rounded-lg border border-border bg-surface text-text-primary text-xs font-medium focus:outline-none focus:ring-1 focus:ring-primary/30"
                      />
                    </div>
                    <span className="text-[10px] font-black text-text-muted bg-surface-hover px-2.5 py-1 rounded-lg border border-border/40 shrink-0">
                      {searchedCatalogItems.length} / {allKits.length} items
                    </span>
                  </div>
                </div>

                {/* Products Table */}
                <div className="overflow-x-auto">
                  {loadingProducts || loadingKits ? (
                    <div className="flex items-center justify-center py-12 gap-2 text-text-muted">
                      <FiLoader className="animate-spin text-primary" size={18} />
                      <span className="text-xs font-bold">Loading allocated products & kits...</span>
                    </div>
                  ) : searchedCatalogItems.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 gap-2 text-center px-4">
                      <FiBox className="text-text-muted opacity-60" size={32} />
                      <p className="text-sm text-text-primary font-bold">No products match the selected filters</p>
                      <p className="text-xs text-text-muted max-w-xs">
                        {hasActiveQuickFilters
                          ? "Try clearing the Quick Filters above to view all catalog items."
                          : "No combo kits found in the database."}
                      </p>
                      {hasActiveQuickFilters && (
                        <button
                          onClick={clearQuickFilters}
                          className="mt-2 text-xs font-bold text-primary hover:underline cursor-pointer"
                        >
                          Clear Quick Filters
                        </button>
                      )}
                    </div>
                  ) : (
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-border bg-bg/60 text-text-muted">
                          <th className="text-left font-black px-4 py-3 uppercase tracking-wider">Product / Combo Kit</th>
                          <th className="text-left font-black px-4 py-3 uppercase tracking-wider hidden md:table-cell">Capacity</th>
                          <th className="text-left font-black px-4 py-3 uppercase tracking-wider hidden lg:table-cell">Industry & Category</th>
                          <th className="text-right font-black px-4 py-3 uppercase tracking-wider hidden sm:table-cell">Base / Selling Price</th>
                          <th className="text-center font-black px-4 py-3 uppercase tracking-wider">Authorization Status</th>
                          <th className="text-center font-black px-4 py-3 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/50">
                        {searchedCatalogItems.map((item) => {
                          const isCurrentActive = activeKitId === item._id;
                          return (
                            <tr
                              key={item._id}
                              className={`transition-colors hover:bg-surface-hover/40 ${
                                isCurrentActive ? "bg-primary/5" : ""
                              }`}
                            >
                              <td className="px-4 py-3.5">
                                <div className="flex items-center gap-3">
                                  {item.image ? (
                                    <img
                                      src={item.image}
                                      alt={item.name}
                                      className="w-10 h-10 rounded-xl object-cover border border-border/50 shrink-0"
                                    />
                                  ) : (
                                    <div className="w-10 h-10 rounded-xl bg-surface-hover flex items-center justify-center shrink-0 text-text-muted">
                                      <FiBox size={16} />
                                    </div>
                                  )}
                                  <div className="min-w-0">
                                    <div className="font-bold text-text-primary text-xs leading-snug">
                                      {item.name}
                                    </div>
                                    <div className="text-[10px] text-text-muted font-medium mt-0.5">
                                      {item.order_quantities.length > 0
                                        ? `${item.order_quantities.length} quantity tier(s) configured`
                                        : "Default tiers available"}
                                    </div>
                                  </div>
                                </div>
                              </td>

                              <td className="px-4 py-3.5 hidden md:table-cell">
                                <span className="inline-flex items-center px-2 py-0.5 rounded-lg text-[11px] font-bold bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">
                                  {item.capacity} kW
                                </span>
                              </td>

                              <td className="px-4 py-3.5 hidden lg:table-cell">
                                <div className="text-xs font-semibold text-text-primary">{item.industry_name}</div>
                                <div className="text-[10px] text-text-muted">{item.category_name} • {item.subcategory_name}</div>
                              </td>

                              <td className="px-4 py-3.5 text-right hidden sm:table-cell">
                                <div className="text-xs font-bold text-text-primary">
                                  {item.selling_price ? fmt(item.selling_price * 100) : "—"}
                                </div>
                                {item.base_price && (
                                  <div className="text-[10px] text-text-muted">
                                    Base: {fmt(item.base_price * 100)}
                                  </div>
                                )}
                              </td>

                              <td className="px-4 py-3.5 text-center">
                                {item.is_authorized ? (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-success/10 text-success border border-success/20">
                                    <FiCheckCircle size={11} /> {item.is_custom_rule ? "Authorized" : "Authorized (Default)"}
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-danger/10 text-danger border border-danger/20">
                                    <FiAlertCircle size={11} /> Restricted
                                  </span>
                                )}
                              </td>

                              <td className="px-4 py-3.5 text-center">
                                <button
                                  onClick={() => setActiveKitId(item._id)}
                                  className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-all ${
                                    isCurrentActive
                                      ? "bg-primary text-white shadow-xs"
                                      : "border border-border text-text-secondary hover:border-primary hover:text-primary hover:bg-primary/5"
                                  }`}
                                >
                                  {isCurrentActive ? "Active Kit" : "Set Commission"}
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>

              {/* ── Section B: Kit Quantity Tier Commission Table ── */}
              <div className="bg-surface rounded-2xl border-2 border-border/70 shadow-xs overflow-hidden">
                <div className="px-5 py-4 bg-surface-hover/30 border-b border-border flex items-center justify-between flex-wrap gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold">
                      <FaRupeeSign size={15} />
                    </div>
                    <div>
                      <h2 className="text-xs font-black text-text-primary uppercase tracking-[0.16em]">
                        Commission Per Kit Quantity Tier
                      </h2>
                      <p className="text-[10px] text-text-muted font-medium">
                        Set commission amounts per unit for each quantity tier — PO (Bulk) and Loose (Individual)
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5">
                    {activeKit && (
                      <button
                        onClick={handleCopyPoToLoose}
                        className="px-3 py-1.5 rounded-xl border border-border text-text-secondary hover:text-text-primary hover:border-primary/40 text-xs font-bold transition-colors cursor-pointer"
                        title="Copy all PO commission amounts into Loose commission inputs"
                      >
                        Copy PO → Loose
                      </button>
                    )}
                    <Button
                      onClick={handleSave}
                      loading={savingRules}
                      variant="primary"
                      leftIcon={<FiSave size={13} />}
                      className="rounded-xl font-bold text-xs uppercase tracking-wider shadow-xs cursor-pointer"
                    >
                      Save Rules
                    </Button>
                  </div>
                </div>

                {loadingKits || loadingRules ? (
                  <div className="flex items-center justify-center py-12 gap-2 text-text-muted">
                    <FiLoader className="animate-spin text-primary" size={18} />
                    <span className="text-xs font-bold">Loading combo kits & commission rules...</span>
                  </div>
                ) : filteredComboKits.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 gap-2 text-center px-4">
                    <FiBox className="text-text-muted opacity-60" size={32} />
                    <p className="text-sm text-text-primary font-bold">No combo kits match the current filters</p>
                    <p className="text-xs text-text-muted max-w-xs">
                      Adjust your Quick Filters above to select the kits you wish to configure.
                    </p>
                  </div>
                ) : (
                  <div className="p-5 space-y-5">

                    {/* Kit Tab Selector */}
                    <div>
                      <label className="block text-[10px] font-black text-text-muted uppercase tracking-wider mb-2">
                        Select Combo Kit to Configure ({filteredComboKits.length})
                      </label>
                      <div className="flex gap-2 flex-wrap">
                        {filteredComboKits.map((kit) => {
                          const kitId = getCleanId(kit);
                          const isActive = activeKitId === kitId;
                          return (
                            <button
                              key={kitId}
                              onClick={() => setActiveKitId(kitId)}
                              className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center gap-2 ${
                                isActive
                                  ? "bg-primary text-white border-primary shadow-sm"
                                  : "bg-surface text-text-secondary border-border hover:border-primary/40 hover:text-primary hover:bg-primary/5"
                              }`}
                            >
                              <span>{kit.name || kit.kit_name || "Kit"}</span>
                              <span
                                className={`text-[10px] font-black px-1.5 py-0.2 rounded-md ${
                                  isActive ? "bg-white/20 text-white" : "bg-surface-hover text-text-muted"
                                }`}
                              >
                                {kit.capacity}kW
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Active Kit Commission Configuration Table */}
                    {activeKit && (
                      <div className="rounded-2xl border-2 border-border/70 overflow-hidden shadow-xs">
                        {/* Kit info banner */}
                        <div className="px-5 py-3.5 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 border-b border-border/70 flex items-center justify-between flex-wrap gap-3">
                          <div className="flex items-center gap-3">
                            {activeKit.kit_image ? (
                              <img
                                src={activeKit.kit_image}
                                alt={activeKit.name}
                                className="w-11 h-11 rounded-xl object-cover border border-border shrink-0 shadow-xs"
                              />
                            ) : (
                              <div className="w-11 h-11 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0 border border-amber-500/20">
                                <FiBox size={18} />
                              </div>
                            )}
                            <div>
                              <div className="font-black text-text-primary text-sm flex items-center gap-2">
                                <span>{activeKit.name || activeKit.kit_name}</span>
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">
                                  {activeKit.capacity} kW
                                </span>
                              </div>
                              <div className="text-[11px] text-text-muted font-medium mt-0.5">
                                Base: {activeKit.base_price_cached ? fmt(activeKit.base_price_cached * 100) : "—"} • Selling: {activeKit.selling_price_cached ? fmt(activeKit.selling_price_cached * 100) : "—"}
                              </div>
                            </div>
                          </div>

                          {/* Quick inline tier adder */}
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] font-bold text-text-muted uppercase">Add Tier:</span>
                            <div className="flex items-center gap-1.5">
                              <input
                                type="number"
                                min="1"
                                placeholder="Qty (e.g. 15)"
                                value={newTierInput}
                                onChange={(e) => setNewTierInput(e.target.value)}
                                className="w-24 px-2.5 py-1.5 text-xs font-bold rounded-lg border border-border bg-surface text-text-primary focus:outline-none focus:ring-1 focus:ring-primary"
                              />
                              <button
                                onClick={handleAddCustomTier}
                                className="px-2.5 py-1.5 rounded-lg bg-primary text-white text-xs font-bold hover:bg-primary-hover transition-colors cursor-pointer flex items-center gap-1"
                              >
                                <FiPlus size={12} /> Add
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Commission Rates Table */}
                        <div className="overflow-x-auto">
                          <table className="w-full text-xs">
                            <thead>
                              <tr className="border-b border-border bg-bg/70">
                                <th className="text-left text-text-muted font-black px-5 py-3.5 uppercase tracking-wider w-64">
                                  Order Quantity Tier
                                </th>
                                <th className="text-center text-text-muted font-black px-5 py-3.5 uppercase tracking-wider">
                                  <div className="flex items-center justify-center gap-1.5">
                                    <FaTruck className="text-info" size={13} />
                                    PO Order Commission (₹ / kit)
                                  </div>
                                  <div className="text-[10px] font-normal text-text-muted mt-0.5 normal-case tracking-normal">
                                    Bulk franchise purchase & inventory replenishment
                                  </div>
                                </th>
                                <th className="text-center text-text-muted font-black px-5 py-3.5 uppercase tracking-wider">
                                  <div className="flex items-center justify-center gap-1.5">
                                    <FaShoppingBag className="text-success" size={13} />
                                    Loose Order Commission (₹ / kit)
                                  </div>
                                  <div className="text-[10px] font-normal text-text-muted mt-0.5 normal-case tracking-normal">
                                    Individual EPC / customer single-order fulfillment
                                  </div>
                                </th>
                                <th className="text-right text-text-muted font-black px-5 py-3.5 uppercase tracking-wider w-44 hidden md:table-cell">
                                  Tier Earnings Preview
                                </th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-border/50">
                              {activeKitTiers.map((qty) => {
                                const kitId = getCleanId(activeKit);
                                const poKey = getCommKey(kitId, qty, "po");
                                const looseKey = getCommKey(kitId, qty, "loose");
                                const poVal = getComm(kitId, qty, "po");
                                const looseVal = getComm(kitId, qty, "loose");
                                const poSaved = savedKeys.has(poKey);
                                const looseSaved = savedKeys.has(looseKey);

                                const poTotal = Number(poVal || 0) * qty;
                                const looseTotal = Number(looseVal || 0) * qty;

                                return (
                                  <tr key={qty} className="hover:bg-surface-hover/30 transition-colors">
                                    {/* Quantity Tier Badge */}
                                    <td className="px-5 py-4">
                                      <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex flex-col items-center justify-center shrink-0">
                                          <span className="text-base font-black text-amber-600 dark:text-amber-400 leading-none">
                                            {qty}
                                          </span>
                                          <span className="text-[9px] font-black text-amber-600/70 dark:text-amber-400/70 uppercase tracking-wider mt-0.5">
                                            Kits
                                          </span>
                                        </div>
                                        <div>
                                          <div className="font-bold text-text-primary text-xs">
                                            {qty} Units Batch
                                          </div>
                                          <div className="text-[10px] text-text-muted font-medium mt-0.5">
                                            Minimum tier threshold
                                          </div>
                                        </div>
                                      </div>
                                    </td>

                                    {/* PO Commission */}
                                    <td className="px-5 py-4">
                                      <div className="flex flex-col items-center gap-1.5">
                                        <CommCell
                                          value={poVal}
                                          onChange={(v) => setComm(kitId, qty, "po", v)}
                                        />
                                        <div className="flex items-center gap-2">
                                          {poSaved && poVal && (
                                            <span className="text-[10px] font-bold text-success flex items-center gap-1">
                                              <FiCheck size={10} /> Saved
                                            </span>
                                          )}
                                          <span className="text-[10px] text-text-muted">₹ / kit</span>
                                        </div>
                                      </div>
                                    </td>

                                    {/* Loose Commission */}
                                    <td className="px-5 py-4">
                                      <div className="flex flex-col items-center gap-1.5">
                                        <CommCell
                                          value={looseVal}
                                          onChange={(v) => setComm(kitId, qty, "loose", v)}
                                        />
                                        <div className="flex items-center gap-2">
                                          {looseSaved && looseVal && (
                                            <span className="text-[10px] font-bold text-success flex items-center gap-1">
                                              <FiCheck size={10} /> Saved
                                            </span>
                                          )}
                                          <span className="text-[10px] text-text-muted">₹ / kit</span>
                                        </div>
                                      </div>
                                    </td>

                                    {/* Earnings Preview */}
                                    <td className="px-5 py-4 text-right hidden md:table-cell">
                                      {poVal || looseVal ? (
                                        <div className="space-y-1">
                                          {poVal && (
                                            <div className="text-[11px] font-bold text-info">
                                              PO: ₹{poTotal.toLocaleString("en-IN")}
                                            </div>
                                          )}
                                          {looseVal && (
                                            <div className="text-[11px] font-bold text-success">
                                              Loose: ₹{looseTotal.toLocaleString("en-IN")}
                                            </div>
                                          )}
                                        </div>
                                      ) : (
                                        <span className="text-text-muted text-xs font-medium">—</span>
                                      )}
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>

                        {/* Summary Preview Cards */}
                        {activeKitTiers.some(
                          (qty) =>
                            getComm(getCleanId(activeKit), qty, "po") ||
                            getComm(getCleanId(activeKit), qty, "loose")
                        ) && (
                          <div className="px-5 py-3.5 bg-success/5 border-t border-success/20">
                            <div className="text-[10px] font-black text-success uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                              <FiCheckCircle size={12} />
                              Active Rates Summary Preview — {activeKit.name || activeKit.kit_name}
                            </div>
                            <div className="flex flex-wrap gap-2.5">
                              {activeKitTiers.map((qty) => {
                                const kid = getCleanId(activeKit);
                                const po = getComm(kid, qty, "po");
                                const loose = getComm(kid, qty, "loose");
                                if (!po && !loose) return null;
                                return (
                                  <div
                                    key={qty}
                                    className="bg-surface rounded-xl border border-success/30 px-3 py-2 shadow-xs"
                                  >
                                    <div className="text-[10px] font-black text-text-muted uppercase mb-1">
                                      {qty} Kits Order
                                    </div>
                                    {po && (
                                      <div className="text-xs font-bold text-info flex items-center gap-1">
                                        <FaTruck size={10} /> PO: ₹{Number(po).toLocaleString("en-IN")}/kit
                                      </div>
                                    )}
                                    {loose && (
                                      <div className="text-xs font-bold text-success flex items-center gap-1 mt-0.5">
                                        <FaShoppingBag size={10} /> Loose: ₹{Number(loose).toLocaleString("en-IN")}/kit
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* ── Sticky Bottom Save Bar ── */}
              <div className="sticky bottom-4 left-0 right-0 bg-surface/95 backdrop-blur-md border-2 border-border px-5 py-3.5 rounded-2xl shadow-xl flex items-center justify-between gap-4 z-20">
                <div className="text-xs text-text-muted font-medium flex items-center gap-2">
                  <FiAward className="text-primary" size={16} />
                  <span>
                    Configuring for <strong className="text-text-primary">{selectedFranchise.business_name || selectedFranchise.name}</strong>
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <Button
                    onClick={handleSave}
                    loading={savingRules}
                    variant="primary"
                    leftIcon={<FiSave size={14} />}
                    className="rounded-xl font-black text-xs uppercase tracking-wider shadow-md cursor-pointer px-6"
                  >
                    {savingRules ? "Saving Rules..." : "Save Commission Rules"}
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
