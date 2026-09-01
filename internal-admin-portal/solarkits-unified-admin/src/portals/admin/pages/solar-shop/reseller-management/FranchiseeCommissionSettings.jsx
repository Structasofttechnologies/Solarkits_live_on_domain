import { useState, useEffect, useCallback, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import axios from "axios";
import {
  FiMapPin, FiUsers, FiPackage, FiSave, FiInfo,
  FiChevronDown, FiLoader, FiSearch, FiFilter,
  FiCheck, FiAlertCircle, FiRefreshCw, FiGrid,
  FiLayers, FiBox, FiTag, FiDollarSign, FiTruck,
  FiShoppingCart, FiSettings, FiUser, FiEdit2,
  FiX, FiCheckCircle,
} from "react-icons/fi";
import { FaRupeeSign, FaTruck, FaShoppingBag } from "react-icons/fa";
import { setAlert } from "@/features/alert.slice";
import { authHeaderObj } from "@/app/authHeader";
import Loader from "@/components/Loader";
import Dropdown from "@/components/Dropdown";
import CustomInput from "@/components/CustomInput";
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

// ─── Franchise Selector Card ─────────────────────────────────────────────────
function FranchiseCard({ reseller, selected, onClick }) {
  const isActive = reseller.activation_status === "active";
  return (
    <button
      onClick={onClick}
      className={`w-full text-left p-3.5 rounded-xl border-2 transition-all cursor-pointer ${
        selected
          ? "border-primary bg-primary/5 shadow-md"
          : "border-border hover:border-primary/40 hover:bg-surface-hover/50"
      }`}
    >
      <div className="flex items-start gap-3">
        <div
          className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-sm font-black ${
            selected ? "bg-primary text-white" : "bg-surface-hover text-text-muted"
          }`}
        >
          {(reseller.business_name || reseller.name || "F")[0].toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <div className="font-black text-text-primary text-xs truncate">
            {reseller.business_name || reseller.name || "—"}
          </div>
          <div className="text-[10px] text-text-muted mt-0.5 font-medium truncate">
            {reseller.email || reseller.mobile || "No contact"}
          </div>
          <div className="flex gap-1.5 mt-1.5 flex-wrap">
            {reseller.plan_id?.name && (
              <span className="text-[10px] font-black bg-info/10 text-info px-2 py-0.5 rounded-full border border-info/20">
                {reseller.plan_id.name}
              </span>
            )}
            <span
              className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${
                isActive
                  ? "bg-success/10 text-success border-success/20"
                  : "bg-warning/10 text-warning border-warning/20"
              }`}
            >
              {reseller.activation_status || "pending"}
            </span>
          </div>
        </div>
        {selected && (
          <FiCheckCircle className="text-primary shrink-0 mt-1" size={16} />
        )}
      </div>
    </button>
  );
}

// ─── Commission Input Cell ────────────────────────────────────────────────────
function CommCell({ value, onChange, disabled }) {
  return (
    <div className="relative flex items-center min-w-[100px]">
      <span className="absolute left-2.5 text-text-muted text-[10px] pointer-events-none">₹</span>
      <input
        type="number"
        min="0"
        step="0.01"
        disabled={disabled}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="—"
        className={`w-full pl-6 pr-2 py-1.5 text-xs font-black rounded-lg border transition-all
          ${disabled
            ? "bg-surface-hover/40 text-text-muted border-border/30 cursor-not-allowed"
            : "bg-surface border-border hover:border-primary/50 focus:border-primary focus:ring-1 focus:ring-primary/20 focus:outline-none text-text-primary"
          }`}
      />
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────
export default function FranchiseeCommissionSettings() {
  const dispatch = useDispatch();
  const token = useSelector((s) => s.auth.token);

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

  // ── Allocated products (authorization matrix) ─────────────────────────────
  const [allocatedProducts, setAllocatedProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [filterIndustry, setFilterIndustry] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterSubcategory, setFilterSubcategory] = useState("");

  // ── Combo kits (with order_quantities) ───────────────────────────────────
  const [comboKits, setComboKits] = useState([]);
  const [loadingKits, setLoadingKits] = useState(false);

  // ── Commission rules for selected franchise ───────────────────────────────
  // Structure: { [kitId_qty_orderType]: amountInRs }
  const [commissionMap, setCommissionMap] = useState({});
  const [loadingRules, setLoadingRules] = useState(false);
  const [savingRules, setSavingRules] = useState(false);
  const [savedKeys, setSavedKeys] = useState(new Set());

  // ── Active product tab for commission table ───────────────────────────────
  const [activeKitId, setActiveKitId] = useState(null);

  // ─── Step 1: Load States ────────────────────────────────────────────────
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

  // ─── Step 2: Load Districts when state changes ──────────────────────────
  useEffect(() => {
    setDistricts([]);
    setSelectedDistrict("");
    setFranchises([]);
    setSelectedFranchise(null);
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

  // ─── Step 3: Load Franchises when district changes ──────────────────────
  useEffect(() => {
    setFranchises([]);
    setSelectedFranchise(null);
    if (!selectedState) return;

    setLoadingFranchises(true);
    let url = `${API_URL}/reseller-mgmt/list?req_for=view&unique_id=${MODULE_UID}&limit=100`;
    if (selectedState) url += `&state_id=${selectedState}`;
    if (selectedDistrict) url += `&district_id=${selectedDistrict}`;

    axios
      .get(url, { headers: authHeaderObj() })
      .then((res) => {
        const data = res.data?.data || res.data?.resellers || [];
        setFranchises(data);
      })
      .catch(() => {})
      .finally(() => setLoadingFranchises(false));
  }, [selectedState, selectedDistrict]);

  // ─── Step 4: Load allocated products + combo kits + existing commission rules ─
  const loadFranchiseData = useCallback(async (franchise) => {
    if (!franchise) return;
    const rid = franchise._id || franchise.id;

    setLoadingProducts(true);
    setLoadingKits(true);
    setLoadingRules(true);
    setAllocatedProducts([]);
    setComboKits([]);
    setCommissionMap({});
    setActiveKitId(null);

    // Parallel fetches
    const [productsRes, kitsRes, rulesRes] = await Promise.allSettled([
      // 1. Allocated products/kits for this reseller
      axios.get(
        `${API_URL}/reseller-mgmt/product-auth/list?unique_id=${MODULE_UID}&req_for=view&reseller_id=${rid}`,
        { headers: authHeaderObj() }
      ),
      // 2. All combo kits with order_quantities
      axios.get(
        `${API_URL}/combo-kits/india/get-kits?unique_id=ADM_CO_MARGIN&req_for=view&is_custom=false`,
        { headers: authHeaderObj() }
      ).catch(() =>
        axios.get(
          `${API_URL}/combo-kits/get-kits?unique_id=ADM_CO_MARGIN&req_for=view&is_custom=false`,
          { headers: authHeaderObj() }
        )
      ),
      // 3. Existing individual commission rules for this reseller
      axios.get(
        `${API_URL}/franchisee/commission-rules/individual/list?unique_id=${MODULE_UID}&req_for=view&reseller_id=${rid}`,
        { headers: authHeaderObj() }
      ).catch(() => ({ data: { data: [] } })),
    ]);

    // Process products
    const rawProducts =
      productsRes.status === "fulfilled"
        ? productsRes.value.data?.data || productsRes.value.data?.authorizations || []
        : [];
    setAllocatedProducts(rawProducts);
    setLoadingProducts(false);

    // Process kits
    const rawKits =
      kitsRes.status === "fulfilled"
        ? kitsRes.value.data?.data || []
        : [];

    // Filter kits that are allocated to this franchise, or show all if no kit-scope rules
    const kitScopeRuleIds = new Set(
      rawProducts
        .filter((p) => p.scope_type === "kit" && p.is_authorized !== false)
        .map((p) => p.kit_id || p.kit?._id || p.kit?.id)
        .filter(Boolean)
    );

    let relevantKits;
    if (kitScopeRuleIds.size > 0) {
      relevantKits = rawKits.filter((k) =>
        kitScopeRuleIds.has(k._id || k.id)
      );
    } else {
      // Show all kits if no kit-specific authorization
      relevantKits = rawKits;
    }

    // Only keep kits that have order_quantities
    const kitsWithQty = relevantKits.filter(
      (k) => Array.isArray(k.order_quantities) && k.order_quantities.length > 0
    );
    setComboKits(kitsWithQty);
    setLoadingKits(false);

    if (kitsWithQty.length > 0) {
      setActiveKitId(kitsWithQty[0]._id || kitsWithQty[0].id);
    }

    // Process existing rules → build commissionMap
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
      setComboKits([]);
      setCommissionMap({});
      setActiveKitId(null);
    }
  }, [selectedFranchise, loadFranchiseData]);

  // ─── Commission map helpers ─────────────────────────────────────────────
  const getCommKey = (kitId, qty, type) => `${kitId}_${qty}_${type}`;

  const setComm = (kitId, qty, type, val) => {
    const key = getCommKey(kitId, qty, type);
    setCommissionMap((prev) => ({ ...prev, [key]: val }));
  };

  const getComm = (kitId, qty, type) =>
    commissionMap[getCommKey(kitId, qty, type)] ?? "";

  // ─── Save commission rules ──────────────────────────────────────────────
  const handleSave = async () => {
    if (!selectedFranchise) return;
    const rid = selectedFranchise._id || selectedFranchise.id;

    const rules = [];
    comboKits.forEach((kit) => {
      const kitId = kit._id || kit.id;
      (kit.order_quantities || []).forEach((qty) => {
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
      dispatch(setAlert({ type: "warning", message: "No commission values to save" }));
      return;
    }

    setSavingRules(true);
    try {
      await axios.post(
        `${API_URL}/franchisee/commission-rules/individual/save?unique_id=${MODULE_UID}&req_for=add`,
        { reseller_id: rid, rules },
        { headers: authHeaderObj() }
      );
      dispatch(setAlert({ type: "success", message: "Commission rules saved successfully!" }));
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

  // ─── Derived filter lists for products table ────────────────────────────
  const industryOptions = useMemo(() => {
    const seen = new Set();
    return allocatedProducts
      .filter((p) => {
        const name = p.industry_type?.name || p.industry_type_name || "";
        if (!name || seen.has(name)) return false;
        seen.add(name);
        return true;
      })
      .map((p) => ({
        value: p.industry_type?._id || p.industry_type_id || p.industry_type?.name,
        text: p.industry_type?.name || p.industry_type_name,
      }));
  }, [allocatedProducts]);

  const categoryOptions = useMemo(() => {
    const seen = new Set();
    return allocatedProducts
      .filter((p) => {
        if (filterIndustry) {
          const id = p.industry_type?._id || p.industry_type_id;
          if (id !== filterIndustry && p.industry_type?.name !== filterIndustry) return false;
        }
        const name = p.category?.name || p.category_name || "";
        if (!name || seen.has(name)) return false;
        seen.add(name);
        return true;
      })
      .map((p) => ({
        value: p.category?._id || p.category_id || p.category?.name,
        text: p.category?.name || p.category_name,
      }));
  }, [allocatedProducts, filterIndustry]);

  const subcategoryOptions = useMemo(() => {
    const seen = new Set();
    return allocatedProducts
      .filter((p) => {
        if (filterCategory) {
          const id = p.category?._id || p.category_id;
          if (id !== filterCategory && p.category?.name !== filterCategory) return false;
        }
        const name = p.subcategory?.name || p.subcategory_name || "";
        if (!name || seen.has(name)) return false;
        seen.add(name);
        return true;
      })
      .map((p) => ({
        value: p.subcategory?._id || p.subcategory_id || p.subcategory?.name,
        text: p.subcategory?.name || p.subcategory_name,
      }));
  }, [allocatedProducts, filterCategory]);

  // ─── Filtered product list ───────────────────────────────────────────────
  const filteredProducts = useMemo(() => {
    return allocatedProducts.filter((p) => {
      if (filterIndustry) {
        const id = p.industry_type?._id || p.industry_type_id;
        if (id !== filterIndustry && p.industry_type?.name !== filterIndustry) return false;
      }
      if (filterCategory) {
        const id = p.category?._id || p.category_id;
        if (id !== filterCategory && p.category?.name !== filterCategory) return false;
      }
      if (filterSubcategory) {
        const id = p.subcategory?._id || p.subcategory_id;
        if (id !== filterSubcategory && p.subcategory?.name !== filterSubcategory) return false;
      }
      return true;
    });
  }, [allocatedProducts, filterIndustry, filterCategory, filterSubcategory]);

  // ─── Franchise search filter ─────────────────────────────────────────────
  const filteredFranchises = useMemo(() => {
    if (!franchiseSearch.trim()) return franchises;
    const q = franchiseSearch.toLowerCase();
    return franchises.filter(
      (f) =>
        (f.business_name || "").toLowerCase().includes(q) ||
        (f.name || "").toLowerCase().includes(q) ||
        (f.email || "").toLowerCase().includes(q) ||
        (f.mobile || "").includes(q)
    );
  }, [franchises, franchiseSearch]);

  // ─── Active kit ──────────────────────────────────────────────────────────
  const activeKit = useMemo(
    () => comboKits.find((k) => (k._id || k.id) === activeKitId),
    [comboKits, activeKitId]
  );

  // ─── Scope label helper ──────────────────────────────────────────────────
  const getScopeLabel = (scopeType) =>
    ({
      all: "All Catalog",
      category: "Category",
      subcategory: "Subcategory",
      product: "Product",
      kit: "Combo Kit",
    }[scopeType] || scopeType);

  const getScopeColor = (scopeType) =>
    ({
      all: "bg-primary/10 text-primary border-primary/20",
      category: "bg-info/10 text-info border-info/20",
      subcategory: "bg-warning/10 text-warning border-warning/20",
      product: "bg-success/10 text-success border-success/20",
      kit: "bg-danger/10 text-danger border-danger/20",
    }[scopeType] || "bg-surface-hover text-text-muted border-border/40");

  const getProductName = (p) => {
    if (p.scope_type === "kit") return p.kit_name || p.kit?.kit_name || p.kit?.name || "Combo Kit";
    if (p.scope_type === "product") return p.product?.name || p.name || "Product";
    if (p.scope_type === "subcategory") return p.subcategory?.name || "Subcategory";
    if (p.scope_type === "category") return p.category?.name || "Category";
    if (p.scope_type === "all") return "All Catalog Items";
    return p.name || "—";
  };

  // ─── UI ─────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6 pb-24 animate-in fade-in duration-500">

      {/* ── Header ── */}
      <div className="relative rounded-2xl bg-linear-120 from-warning to-warning-hover shadow-xl overflow-hidden">
        <div className="absolute inset-0 bg-grid-white/10 mask-[linear-gradient(0deg,transparent,black)]" />
        <div className="relative px-6 py-7 lg:px-8 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-white/30">
              <FaRupeeSign className="text-white text-2xl" />
            </div>
            <div>
              <h1 className="text-xl lg:text-2xl font-bold text-white">
                Franchise Commission Settings
              </h1>
              <p className="text-white/80 text-xs mt-0.5 font-medium">
                Set individual per-franchise commission rates by kit quantity — PO & Loose order separately
              </p>
            </div>
          </div>
          {selectedFranchise && (
            <Button
              onClick={handleSave}
              loading={savingRules}
              variant="secondary"
              leftIcon={<FiSave />}
              className="bg-white text-warning border-white hover:bg-white/90 font-black text-xs uppercase tracking-wider rounded-xl shadow-md cursor-pointer"
            >
              Save Commission Rules
            </Button>
          )}
        </div>
      </div>

      {/* ── How it Works ── */}
      <div className="card border-2 border-info/20 bg-info/5 p-5 flex items-start gap-4">
        <div className="p-2.5 rounded-xl bg-info/10 text-info border border-info/10 shrink-0 mt-0.5">
          <FiInfo size={16} />
        </div>
        <div>
          <h3 className="font-black text-text-primary text-sm mb-1">How Individual Commission Works</h3>
          <p className="text-xs text-text-secondary font-medium leading-relaxed">
            Select a <strong>State → District → Franchise</strong> to configure commissions. 
            Commission rates are set <strong>per combo kit, per order quantity tier</strong> (e.g. 10 kits = ₹1,000 / 25 kits = ₹1,230).
            <strong> PO Orders</strong> (bulk franchise purchase) and <strong>Loose Orders</strong> (individual EPC/customer order) have separate commission rates.
            These rates are locked at order creation time and shown on the franchise dashboard.
          </p>
        </div>
      </div>

      {/* ── Main Layout: Sidebar + Content ── */}
      <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-5 items-start">

        {/* ── LEFT: Franchise Selector Panel ── */}
        <div className="space-y-4">

          {/* Geography Filters */}
          <div className="card border-2 border-border p-5 space-y-4">
            <h2 className="text-xs font-black uppercase tracking-[0.18em] text-text-primary flex items-center gap-2">
              <FiMapPin className="text-primary" size={14} />
              Select Location
            </h2>

            {/* State */}
            <div>
              <label className="block text-[10px] font-black text-text-muted uppercase tracking-wider mb-1.5">
                State
              </label>
              {loadingStates ? (
                <div className="flex items-center gap-2 py-2 text-text-muted text-xs">
                  <FiLoader className="animate-spin" size={14} /> Loading states...
                </div>
              ) : (
                <select
                  value={selectedState}
                  onChange={(e) => setSelectedState(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border-2 border-border bg-surface text-text-primary text-xs font-bold focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                >
                  <option value="">All States</option>
                  {states.map((s) => (
                    <option key={s._id || s.id} value={s._id || s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* District */}
            <div>
              <label className="block text-[10px] font-black text-text-muted uppercase tracking-wider mb-1.5">
                District
              </label>
              {loadingDistricts ? (
                <div className="flex items-center gap-2 py-2 text-text-muted text-xs">
                  <FiLoader className="animate-spin" size={14} /> Loading districts...
                </div>
              ) : (
                <select
                  value={selectedDistrict}
                  onChange={(e) => setSelectedDistrict(e.target.value)}
                  disabled={!selectedState}
                  className="w-full px-3 py-2.5 rounded-xl border-2 border-border bg-surface text-text-primary text-xs font-bold focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="">All Districts</option>
                  {districts.map((d) => (
                    <option key={d._id || d.id} value={d._id || d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>

          {/* Franchise List */}
          <div className="card border-2 border-border p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-black uppercase tracking-[0.18em] text-text-primary flex items-center gap-2">
                <FiUsers className="text-primary" size={14} />
                Franchises
              </h2>
              <span className="text-[10px] font-black text-text-muted bg-surface-hover px-2.5 py-1 rounded-lg border border-border/40">
                {filteredFranchises.length}
              </span>
            </div>

            {/* Search */}
            <div className="relative">
              <FiSearch className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-muted" size={13} />
              <input
                type="text"
                placeholder="Search franchise..."
                value={franchiseSearch}
                onChange={(e) => setFranchiseSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-2 rounded-xl border border-border bg-bg text-text-primary text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              />
            </div>

            {/* List */}
            <div className="space-y-2 max-h-[420px] overflow-y-auto pr-0.5">
              {loadingFranchises ? (
                <div className="flex items-center justify-center py-8 text-text-muted gap-2">
                  <FiLoader className="animate-spin" size={16} />
                  <span className="text-xs">Loading franchises...</span>
                </div>
              ) : !selectedState ? (
                <div className="py-8 text-center">
                  <FiMapPin className="mx-auto text-text-muted mb-2" size={24} />
                  <p className="text-xs text-text-muted font-medium">Select a state to see franchises</p>
                </div>
              ) : filteredFranchises.length === 0 ? (
                <div className="py-8 text-center">
                  <FiUsers className="mx-auto text-text-muted mb-2" size={24} />
                  <p className="text-xs text-text-muted font-medium">No franchises found in this area</p>
                </div>
              ) : (
                filteredFranchises.map((f) => (
                  <FranchiseCard
                    key={f._id || f.id}
                    reseller={f}
                    selected={(selectedFranchise?._id || selectedFranchise?.id) === (f._id || f.id)}
                    onClick={() => setSelectedFranchise(f)}
                  />
                ))
              )}
            </div>
          </div>
        </div>

        {/* ── RIGHT: Commission Settings Content ── */}
        <div className="space-y-5">
          {!selectedFranchise ? (
            /* Empty state */
            <div className="card border-2 border-dashed border-border/50 p-16 flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 rounded-2xl bg-surface-hover flex items-center justify-center mb-4">
                <FiSettings className="text-text-muted" size={28} />
              </div>
              <h3 className="font-black text-text-primary text-base mb-1">Select a Franchise</h3>
              <p className="text-xs text-text-muted font-medium max-w-xs leading-relaxed">
                Choose a state, district, and franchise from the left panel to configure their individual commission rates.
              </p>
            </div>
          ) : (
            <>
              {/* Selected Franchise Header */}
              <div className="card border-2 border-primary/20 bg-primary/5 p-4 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center text-white font-black text-lg shrink-0">
                  {(selectedFranchise.business_name || selectedFranchise.name || "F")[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-black text-text-primary text-base truncate">
                    {selectedFranchise.business_name || selectedFranchise.name}
                  </div>
                  <div className="flex gap-2 flex-wrap mt-1">
                    {selectedFranchise.plan_id?.name && (
                      <span className="text-[10px] font-black bg-info/10 text-info px-2 py-0.5 rounded-full border border-info/20">
                        Plan: {selectedFranchise.plan_id.name}
                      </span>
                    )}
                    <span className="text-[10px] font-black text-text-muted bg-surface-hover px-2 py-0.5 rounded-full border border-border/40">
                      {selectedFranchise.email || selectedFranchise.mobile || "No contact"}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedFranchise(null)}
                  className="p-2 rounded-xl border border-border/40 text-text-muted hover:bg-surface-hover hover:text-text-primary transition-colors cursor-pointer"
                  title="Deselect franchise"
                >
                  <FiX size={15} />
                </button>
              </div>

              {/* ── Section A: Allocated Products Table ── */}
              <div className="bg-surface rounded-2xl border-2 border-border/60 shadow-sm overflow-hidden">
                <div className="px-5 py-4 bg-surface-hover/30 border-b border-border flex items-center justify-between flex-wrap gap-3">
                  <h2 className="text-xs font-black text-text-primary uppercase tracking-[0.18em] flex items-center gap-2">
                    <FiPackage className="text-primary" size={14} />
                    Allocated Products & Kits
                  </h2>
                  <span className="text-[10px] font-black text-text-muted bg-surface-hover px-3 py-1.5 rounded-lg border border-border/40">
                    {filteredProducts.length} / {allocatedProducts.length} items
                  </span>
                </div>

                {/* Filters row */}
                <div className="px-5 py-3 border-b border-border/50 flex gap-3 flex-wrap items-end bg-bg/50">
                  {/* Industry Type */}
                  <div className="w-40">
                    <label className="block text-[10px] font-black text-text-muted uppercase tracking-wider mb-1">Industry</label>
                    <select
                      value={filterIndustry}
                      onChange={(e) => { setFilterIndustry(e.target.value); setFilterCategory(""); setFilterSubcategory(""); }}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-border bg-surface text-text-primary text-xs font-bold focus:outline-none focus:ring-1 focus:ring-primary/20 focus:border-primary transition-all"
                    >
                      <option value="">All Industries</option>
                      {industryOptions.map((o) => (
                        <option key={o.value} value={o.value}>{o.text}</option>
                      ))}
                    </select>
                  </div>
                  {/* Category */}
                  <div className="w-40">
                    <label className="block text-[10px] font-black text-text-muted uppercase tracking-wider mb-1">Category</label>
                    <select
                      value={filterCategory}
                      onChange={(e) => { setFilterCategory(e.target.value); setFilterSubcategory(""); }}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-border bg-surface text-text-primary text-xs font-bold focus:outline-none focus:ring-1 focus:ring-primary/20 focus:border-primary transition-all"
                    >
                      <option value="">All Categories</option>
                      {categoryOptions.map((o) => (
                        <option key={o.value} value={o.value}>{o.text}</option>
                      ))}
                    </select>
                  </div>
                  {/* Subcategory */}
                  <div className="w-44">
                    <label className="block text-[10px] font-black text-text-muted uppercase tracking-wider mb-1">Subcategory</label>
                    <select
                      value={filterSubcategory}
                      onChange={(e) => setFilterSubcategory(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-border bg-surface text-text-primary text-xs font-bold focus:outline-none focus:ring-1 focus:ring-primary/20 focus:border-primary transition-all"
                    >
                      <option value="">All Subcategories</option>
                      {subcategoryOptions.map((o) => (
                        <option key={o.value} value={o.value}>{o.text}</option>
                      ))}
                    </select>
                  </div>
                  {(filterIndustry || filterCategory || filterSubcategory) && (
                    <button
                      onClick={() => { setFilterIndustry(""); setFilterCategory(""); setFilterSubcategory(""); }}
                      className="px-3 py-1.5 rounded-lg border border-border text-xs font-black text-text-muted hover:text-danger hover:border-danger/40 transition-colors cursor-pointer"
                    >
                      <FiX size={12} className="inline mr-1" /> Clear
                    </button>
                  )}
                </div>

                {/* Products Table */}
                <div className="overflow-x-auto">
                  {loadingProducts ? (
                    <div className="flex items-center justify-center py-12 gap-2 text-text-muted">
                      <FiLoader className="animate-spin" size={18} />
                      <span className="text-sm font-medium">Loading allocated products...</span>
                    </div>
                  ) : allocatedProducts.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 gap-2">
                      <FiPackage className="text-text-muted" size={28} />
                      <p className="text-sm text-text-muted font-medium">No products allocated to this franchise yet</p>
                      <p className="text-xs text-text-muted">Go to Product Authorization to assign products/kits</p>
                    </div>
                  ) : filteredProducts.length === 0 ? (
                    <div className="py-10 text-center text-text-muted text-sm">
                      No products match the selected filters
                    </div>
                  ) : (
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-border bg-bg">
                          <th className="text-left text-text-muted font-black px-4 py-3 uppercase tracking-wider">Product / Kit</th>
                          <th className="text-left text-text-muted font-black px-4 py-3 uppercase tracking-wider hidden md:table-cell">Scope</th>
                          <th className="text-left text-text-muted font-black px-4 py-3 uppercase tracking-wider hidden lg:table-cell">Industry Type</th>
                          <th className="text-left text-text-muted font-black px-4 py-3 uppercase tracking-wider hidden lg:table-cell">Category</th>
                          <th className="text-left text-text-muted font-black px-4 py-3 uppercase tracking-wider hidden xl:table-cell">Subcategory</th>
                          <th className="text-center text-text-muted font-black px-4 py-3 uppercase tracking-wider">Authorization</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/50">
                        {filteredProducts.map((p, idx) => (
                          <tr key={p._id || p.id || idx} className="hover:bg-surface-hover/40 transition-colors">
                            <td className="px-4 py-3">
                              <span className="font-black text-text-primary">{getProductName(p)}</span>
                            </td>
                            <td className="px-4 py-3 hidden md:table-cell">
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black border ${getScopeColor(p.scope_type)}`}>
                                {getScopeLabel(p.scope_type)}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-text-secondary font-medium hidden lg:table-cell">
                              {p.industry_type?.name || p.industry_type_name || "—"}
                            </td>
                            <td className="px-4 py-3 text-text-secondary font-medium hidden lg:table-cell">
                              {p.category?.name || p.category_name || "—"}
                            </td>
                            <td className="px-4 py-3 text-text-secondary font-medium hidden xl:table-cell">
                              {p.subcategory?.name || p.subcategory_name || "—"}
                            </td>
                            <td className="px-4 py-3 text-center">
                              {p.is_authorized !== false ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-success/10 text-success border border-success/20">
                                  <FiCheckCircle size={10} /> Authorized
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-danger/10 text-danger border border-danger/20">
                                  <FiAlertCircle size={10} /> Restricted
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>

              {/* ── Section B: Kit Quantity Tier Commission Table ── */}
              <div className="bg-surface rounded-2xl border-2 border-border/60 shadow-sm overflow-hidden">
                <div className="px-5 py-4 bg-surface-hover/30 border-b border-border">
                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <div>
                      <h2 className="text-xs font-black text-text-primary uppercase tracking-[0.18em] flex items-center gap-2">
                        <FaRupeeSign className="text-warning text-sm" />
                        Commission Per Kit Quantity Tier
                      </h2>
                      <p className="text-[10px] text-text-muted mt-0.5 font-medium">
                        Set commission amounts for each order quantity tier — PO and Loose order separately
                      </p>
                    </div>
                    {selectedFranchise && (
                      <Button
                        onClick={handleSave}
                        loading={savingRules}
                        variant="primary"
                        leftIcon={<FiSave size={13} />}
                        className="rounded-xl font-black text-xs uppercase tracking-wider shadow-sm cursor-pointer"
                      >
                        Save Rules
                      </Button>
                    )}
                  </div>
                </div>

                {loadingKits || loadingRules ? (
                  <div className="flex items-center justify-center py-12 gap-2 text-text-muted">
                    <FiLoader className="animate-spin" size={18} />
                    <span className="text-sm font-medium">Loading combo kits...</span>
                  </div>
                ) : comboKits.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 gap-2">
                    <FiBox className="text-text-muted" size={28} />
                    <p className="text-sm text-text-muted font-medium">No combo kits with quantity tiers found</p>
                    <p className="text-xs text-text-muted text-center max-w-xs">
                      Combo kits need quantity variations (order_quantities) configured in the kit settings
                    </p>
                  </div>
                ) : (
                  <div className="p-5 space-y-5">

                    {/* Kit Tab Selector */}
                    <div className="flex gap-2 flex-wrap">
                      {comboKits.map((kit) => {
                        const kitId = kit._id || kit.id;
                        const isActive = activeKitId === kitId;
                        return (
                          <button
                            key={kitId}
                            onClick={() => setActiveKitId(kitId)}
                            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider border transition-all cursor-pointer ${
                              isActive
                                ? "bg-primary text-white border-primary shadow-md"
                                : "bg-surface text-text-secondary border-border hover:border-primary/40 hover:text-primary"
                            }`}
                          >
                            {kit.name || kit.kit_name || "Kit"}
                          </button>
                        );
                      })}
                    </div>

                    {/* Active Kit Commission Table */}
                    {activeKit && (
                      <div className="rounded-2xl border-2 border-border/60 overflow-hidden">
                        {/* Kit info header */}
                        <div className="px-5 py-3 bg-warning/5 border-b border-warning/20 flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-warning/10 border border-warning/20 flex items-center justify-center">
                            <FiBox className="text-warning" size={16} />
                          </div>
                          <div>
                            <div className="font-black text-text-primary text-sm">
                              {activeKit.name || activeKit.kit_name}
                            </div>
                            <div className="text-[10px] text-text-muted font-medium">
                              {(activeKit.order_quantities || []).length} quantity tier(s) configured
                            </div>
                          </div>
                        </div>

                        {/* Commission table */}
                        <div className="overflow-x-auto">
                          <table className="w-full text-xs">
                            <thead>
                              <tr className="border-b border-border bg-bg">
                                <th className="text-left text-text-muted font-black px-5 py-3.5 uppercase tracking-wider w-56">
                                  Order Quantity Tier
                                </th>
                                <th className="text-center text-text-muted font-black px-5 py-3.5 uppercase tracking-wider">
                                  <div className="flex items-center justify-center gap-1.5">
                                    <FaTruck className="text-info" size={12} />
                                    PO Order Commission
                                  </div>
                                  <div className="text-[10px] font-medium text-text-muted mt-0.5 normal-case tracking-normal">
                                    Bulk franchise purchase
                                  </div>
                                </th>
                                <th className="text-center text-text-muted font-black px-5 py-3.5 uppercase tracking-wider">
                                  <div className="flex items-center justify-center gap-1.5">
                                    <FaShoppingBag className="text-success" size={12} />
                                    Loose Order Commission
                                  </div>
                                  <div className="text-[10px] font-medium text-text-muted mt-0.5 normal-case tracking-normal">
                                    Individual EPC/customer order
                                  </div>
                                </th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-border/40">
                              {(activeKit.order_quantities || [])
                                .slice()
                                .sort((a, b) => a - b)
                                .map((qty) => {
                                  const kitId = activeKit._id || activeKit.id;
                                  const poKey = getCommKey(kitId, qty, "po");
                                  const looseKey = getCommKey(kitId, qty, "loose");
                                  const poSaved = savedKeys.has(poKey);
                                  const looseSaved = savedKeys.has(looseKey);

                                  return (
                                    <tr key={qty} className="hover:bg-surface-hover/30 transition-colors">
                                      {/* Quantity tier */}
                                      <td className="px-5 py-4">
                                        <div className="flex items-center gap-3">
                                          <div className="w-12 h-12 rounded-xl bg-warning/10 border border-warning/20 flex flex-col items-center justify-center shrink-0">
                                            <span className="text-lg font-black text-warning leading-none">{qty}</span>
                                            <span className="text-[9px] font-black text-warning/70 uppercase tracking-wider">Kits</span>
                                          </div>
                                          <div>
                                            <div className="font-black text-text-primary">{qty} Kits Order</div>
                                            <div className="text-[10px] text-text-muted font-medium mt-0.5">
                                              Min. order quantity: {qty} units
                                            </div>
                                          </div>
                                        </div>
                                      </td>

                                      {/* PO Commission */}
                                      <td className="px-5 py-4">
                                        <div className="flex flex-col items-center gap-1.5">
                                          <CommCell
                                            value={getComm(kitId, qty, "po")}
                                            onChange={(v) => setComm(kitId, qty, "po", v)}
                                          />
                                          {poSaved && getComm(kitId, qty, "po") && (
                                            <span className="text-[10px] font-black text-success flex items-center gap-1">
                                              <FiCheck size={10} /> Saved
                                            </span>
                                          )}
                                          <div className="text-[10px] text-text-muted font-medium">
                                            per kit (₹/kit)
                                          </div>
                                        </div>
                                      </td>

                                      {/* Loose Commission */}
                                      <td className="px-5 py-4">
                                        <div className="flex flex-col items-center gap-1.5">
                                          <CommCell
                                            value={getComm(kitId, qty, "loose")}
                                            onChange={(v) => setComm(kitId, qty, "loose", v)}
                                          />
                                          {looseSaved && getComm(kitId, qty, "loose") && (
                                            <span className="text-[10px] font-black text-success flex items-center gap-1">
                                              <FiCheck size={10} /> Saved
                                            </span>
                                          )}
                                          <div className="text-[10px] text-text-muted font-medium">
                                            per kit (₹/kit)
                                          </div>
                                        </div>
                                      </td>
                                    </tr>
                                  );
                                })}
                            </tbody>
                          </table>
                        </div>

                        {/* Commission Summary Preview */}
                        {(activeKit.order_quantities || []).some(
                          (qty) =>
                            getComm(activeKit._id || activeKit.id, qty, "po") ||
                            getComm(activeKit._id || activeKit.id, qty, "loose")
                        ) && (
                          <div className="px-5 py-3 bg-success/5 border-t border-success/20">
                            <div className="text-[10px] font-black text-success uppercase tracking-wider mb-2 flex items-center gap-1.5">
                              <FiCheckCircle size={11} />
                              Commission Preview — {activeKit.name || activeKit.kit_name}
                            </div>
                            <div className="flex flex-wrap gap-3">
                              {(activeKit.order_quantities || [])
                                .slice()
                                .sort((a, b) => a - b)
                                .map((qty) => {
                                  const kitId = activeKit._id || activeKit.id;
                                  const poVal = getComm(kitId, qty, "po");
                                  const looseVal = getComm(kitId, qty, "loose");
                                  if (!poVal && !looseVal) return null;
                                  return (
                                    <div key={qty} className="bg-white rounded-xl border border-success/20 px-3 py-2">
                                      <div className="text-[10px] font-black text-text-muted uppercase mb-1">{qty} Kits</div>
                                      {poVal && (
                                        <div className="text-xs font-black text-info flex items-center gap-1">
                                          <FaTruck size={10} /> PO: ₹{Number(poVal).toLocaleString("en-IN")}/kit
                                        </div>
                                      )}
                                      {looseVal && (
                                        <div className="text-xs font-black text-success flex items-center gap-1 mt-0.5">
                                          <FaShoppingBag size={10} /> Loose: ₹{Number(looseVal).toLocaleString("en-IN")}/kit
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

              {/* ── Save Footer ── */}
              <div className="sticky bottom-0 left-0 right-0 bg-surface/95 backdrop-blur-sm border-t-2 border-border px-5 py-4 rounded-2xl shadow-lg flex items-center justify-between gap-4">
                <div className="text-xs text-text-muted font-medium">
                  <span className="font-black text-text-primary">{selectedFranchise.business_name || selectedFranchise.name}</span>
                  {" "}— Set commissions above and click Save to apply
                </div>
                <Button
                  onClick={handleSave}
                  loading={savingRules}
                  variant="primary"
                  leftIcon={<FiSave size={14} />}
                  className="rounded-xl font-black text-xs uppercase tracking-wider shadow-md cursor-pointer px-6"
                >
                  {savingRules ? "Saving..." : "Save Commission Rules"}
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
