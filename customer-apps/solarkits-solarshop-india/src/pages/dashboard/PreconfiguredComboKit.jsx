import React, { useState, useMemo, useEffect } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import {
  FiFilter,
  FiGrid,
  FiList,
  FiSearch,
  FiX,
  FiSliders,
  FiSun,
  FiZap,
  FiBatteryCharging,
  FiHome,
  FiBriefcase,
  FiCheckCircle,
  FiLayers,
  FiArrowRight,
  FiHelpCircle,
  FiRefreshCw,
  FiPackage,
  FiCheck
} from "react-icons/fi";
import { FaSolarPanel, FaBolt, FaWarehouse } from "react-icons/fa";
import { getAvailableKitData } from "@/features/slice";

import KitProductCard from "@/components/storefront/KitProductCard";
import KitProductModal from "@/components/storefront/KitProductModal";
import KitComparisonDrawer from "@/components/storefront/KitComparisonDrawer";
import ExpertHelpModal from "@/components/storefront/ExpertHelpModal";
import Button from "@/components/Button";
import IconButton from "@/components/IconButton";

// Safe string helper to avoid React child object errors
const safeString = (val) => {
  if (!val) return "";
  if (typeof val === "string") return val.trim();
  if (typeof val === "number") return String(val);
  if (typeof val === "object") {
    return (val.text || val.name || val.title || val.symbol || "").trim();
  }
  return String(val).trim();
};

export default function PreconfiguredComboKit() {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();

  const rawKits = useSelector((state) => state.slice?.availableKits);
  const availableKits = useMemo(() => (Array.isArray(rawKits) ? rawKits : []), [rawKits]);
  const selectedDistrict = useSelector((state) => state.slice?.selectedDistrict);

  // Read URL query params
  const searchParams = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const urlSearch = searchParams.get("search") || "";
  const urlType = searchParams.get("type") || "all";
  const urlApp = searchParams.get("application") || "all";
  const urlCap = searchParams.get("capacity") || "all";

  // Filter States matching Admin Panel Hierarchy
  const [searchTerm, setSearchTerm] = useState(urlSearch);
  const [selectedIndustryType, setSelectedIndustryType] = useState("all");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedSubCategory, setSelectedSubCategory] = useState("all");
  const [selectedSystemType, setSelectedSystemType] = useState("all");
  const [selectedProjectRange, setSelectedProjectRange] = useState("all");
  const [inStockOnly, setInStockOnly] = useState(false);
  const [sortBy, setSortBy] = useState("featured");
  const [viewMode, setViewMode] = useState("grid");
  const [activeCatalogTab, setActiveCatalogTab] = useState("combo-kits");

  // Modals & Drawers
  const [quickViewKit, setQuickViewKit] = useState(null);
  const [quickViewVariantIndex, setQuickViewVariantIndex] = useState(0);
  const [comparedKits, setComparedKits] = useState([]);
  const [showCompareDrawer, setShowCompareDrawer] = useState(false);
  const [showExpertModal, setShowExpertModal] = useState(false);
  const [expertPreselectedKit, setExpertPreselectedKit] = useState(null);

  // Sync state if URL query params change
  useEffect(() => {
    if (urlSearch) setSearchTerm(urlSearch);
    if (urlType !== "all") {
      if (urlType === "on-grid") setSelectedCategory("On-Grid");
      else if (urlType === "off-grid") setSelectedCategory("Off-Grid");
      else if (urlType === "hybrid") setSelectedCategory("Hybrid");
    }
    if (urlApp !== "all") {
      if (urlApp === "residential") setSelectedIndustryType("Residential");
      else if (urlApp === "commercial") setSelectedIndustryType("Commercial");
    }
    if (urlCap !== "all") setSelectedProjectRange(urlCap);
  }, [urlSearch, urlType, urlApp, urlCap]);

  // Dynamically extract unique filter options safely
  const filterOptions = useMemo(() => {
    const industries = new Set();
    const categories = new Set();
    const subCategories = new Set();
    const systemTypes = new Set();
    const projectRanges = new Set();

    availableKits.forEach((k) => {
      const ind = safeString(k.industryType || k.industry_type_name);
      if (ind) industries.add(ind);

      const cat = safeString(k.category);
      if (cat) categories.add(cat);

      const sub = safeString(k.subCategory || k.usageType);
      if (sub) subCategories.add(sub);

      const sys = safeString(k.projectType || k.inverter?.type);
      if (sys) systemTypes.add(sys);

      if (k.capacityKW) {
        projectRanges.add(`${k.capacityKW} kW`);
      }
      if (k.projectRange) {
        const pr = safeString(k.projectRange);
        if (pr) projectRanges.add(pr);
      }
    });

    return {
      industries: Array.from(industries).filter(Boolean),
      categories: Array.from(categories).filter(Boolean),
      subCategories: Array.from(subCategories).filter(Boolean),
      systemTypes: Array.from(systemTypes).filter(Boolean),
      projectRanges: Array.from(projectRanges).filter(Boolean).sort((a, b) => parseFloat(a) - parseFloat(b)),
    };
  }, [availableKits]);

  // Comparison handlers
  const handleToggleCompare = (kit) => {
    setComparedKits((prev) => {
      const exists = prev.find((k) => k.id === kit.id);
      if (exists) return prev.filter((k) => k.id !== kit.id);
      if (prev.length >= 4) {
        alert("You can compare up to 4 complete solar kits simultaneously.");
        return prev;
      }
      return [...prev, kit];
    });
  };

  const handleQuickView = (kit, variantIdx = 0) => {
    setQuickViewKit(kit);
    setQuickViewVariantIndex(variantIdx);
  };

  const handleOpenExpertHelp = (kit = null) => {
    setExpertPreselectedKit(kit);
    setShowExpertModal(true);
  };

  // Filter and sort logic
  const filteredKits = useMemo(() => {
    let result = [...availableKits];

    // 1. Search filter
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase().trim();
      result = result.filter(
        (k) =>
          safeString(k.kitName).toLowerCase().includes(q) ||
          safeString(k.industryType).toLowerCase().includes(q) ||
          safeString(k.industry_type_name).toLowerCase().includes(q) ||
          safeString(k.category).toLowerCase().includes(q) ||
          safeString(k.subCategory).toLowerCase().includes(q) ||
          safeString(k.usageType).toLowerCase().includes(q) ||
          safeString(k.projectType).toLowerCase().includes(q) ||
          safeString(k.brand).toLowerCase().includes(q) ||
          safeString(k.description).toLowerCase().includes(q) ||
          `${k.capacityKW}kw`.includes(q.replace(/\s+/g, ""))
      );
    }

    // 2. Industry Type filter
    if (selectedIndustryType !== "all") {
      const target = selectedIndustryType.toLowerCase();
      result = result.filter(
        (k) =>
          safeString(k.industryType).toLowerCase().includes(target) ||
          safeString(k.industry_type_name).toLowerCase().includes(target) ||
          safeString(k.usageType).toLowerCase().includes(target) ||
          safeString(k.category).toLowerCase().includes(target)
      );
    }

    // 3. Category filter
    if (selectedCategory !== "all") {
      const target = selectedCategory.toLowerCase();
      result = result.filter(
        (k) =>
          safeString(k.category).toLowerCase().includes(target) ||
          safeString(k.projectType).toLowerCase().includes(target) ||
          safeString(k.inverter?.type).toLowerCase().includes(target)
      );
    }

    // 4. Sub-Category filter
    if (selectedSubCategory !== "all") {
      const target = selectedSubCategory.toLowerCase();
      result = result.filter(
        (k) =>
          safeString(k.subCategory).toLowerCase().includes(target) ||
          safeString(k.usageType).toLowerCase().includes(target)
      );
    }

    // 5. System Type filter
    if (selectedSystemType !== "all") {
      const target = selectedSystemType.toLowerCase();
      result = result.filter(
        (k) =>
          safeString(k.projectType).toLowerCase().includes(target) ||
          safeString(k.inverter?.type).toLowerCase().includes(target)
      );
    }

    // 6. Project Range / Capacity filter
    if (selectedProjectRange !== "all") {
      const capNum = parseFloat(selectedProjectRange);
      if (!isNaN(capNum)) {
        result = result.filter((k) => (k.capacityKW || 0) === capNum || Math.floor(k.capacityKW || 0) === capNum);
      }
    }

    // 7. In-Stock filter
    if (inStockOnly) {
      result = result.filter((k) => k.variants?.some((v) => v.inStock !== false));
    }

    // 8. Sorting
    if (sortBy === "price-low") {
      result.sort((a, b) => (a.variants?.[0]?.ourPrice || 0) - (b.variants?.[0]?.ourPrice || 0));
    } else if (sortBy === "price-high") {
      result.sort((a, b) => (b.variants?.[0]?.ourPrice || 0) - (a.variants?.[0]?.ourPrice || 0));
    } else if (sortBy === "capacity-high") {
      result.sort((a, b) => (b.capacityKW || 0) - (a.capacityKW || 0));
    } else if (sortBy === "capacity-low") {
      result.sort((a, b) => (a.capacityKW || 0) - (b.capacityKW || 0));
    } else if (sortBy === "savings") {
      result.sort((a, b) => {
        const savA = (a.variants?.[0]?.marketPrice || 0) - (a.variants?.[0]?.ourPrice || 0);
        const savB = (b.variants?.[0]?.marketPrice || 0) - (b.variants?.[0]?.ourPrice || 0);
        return savB - savA;
      });
    }

    return result;
  }, [
    availableKits,
    searchTerm,
    selectedIndustryType,
    selectedCategory,
    selectedSubCategory,
    selectedSystemType,
    selectedProjectRange,
    inStockOnly,
    sortBy,
  ]);

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (searchTerm.trim()) count++;
    if (selectedIndustryType !== "all") count++;
    if (selectedCategory !== "all") count++;
    if (selectedSubCategory !== "all") count++;
    if (selectedSystemType !== "all") count++;
    if (selectedProjectRange !== "all") count++;
    if (inStockOnly) count++;
    return count;
  }, [
    searchTerm,
    selectedIndustryType,
    selectedCategory,
    selectedSubCategory,
    selectedSystemType,
    selectedProjectRange,
    inStockOnly,
  ]);

  const handleClearAllFilters = () => {
    setSearchTerm("");
    setSelectedIndustryType("all");
    setSelectedCategory("all");
    setSelectedSubCategory("all");
    setSelectedSystemType("all");
    setSelectedProjectRange("all");
    setInStockOnly(false);
    setSortBy("featured");
    navigate("/shop");
  };

  return (
    <div className="min-h-screen bg-bg text-text-primary py-6 max-w-7xl mx-auto px-4 sm:px-6 space-y-6">
      
      {/* Breadcrumbs */}
      <nav className="text-xs text-text-muted flex items-center gap-1.5" aria-label="Breadcrumb">
        <Link to="/" className="hover:text-primary transition-colors">Home</Link>
        <span>/</span>
        <span className="text-primary font-bold">Solar Kit Marketplace</span>
        <span>/</span>
        <span className="text-text-primary font-bold">
          {activeCatalogTab === "combo-kits" ? "Combo Kit Configuration" : "Customize Kit Configuration"}
        </span>
      </nav>

      {/* ─── Header Banner with Active Kit Count & Mode Switcher ───── */}
      <div className="bg-gradient-to-r from-primary via-primary-end to-primary-navy rounded-3xl p-6 sm:p-8 text-white shadow-lg relative overflow-hidden">
        <div className="absolute right-0 top-0 w-80 h-80 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold text-white flex items-center gap-1.5">
                <FiPackage size={14} className="text-secondary" />
                <span>Turnkey Solar Power Kits</span>
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight font-heading">
              {activeCatalogTab === "combo-kits" ? "Combokit Configuration" : "Customize Kit Configuration"}
            </h1>
            <p className="text-xs sm:text-sm text-slate-200 max-w-2xl leading-relaxed">
              {activeCatalogTab === "combo-kits"
                ? "Browse verified, pre-configured solar combo kits bundled with Tier-1 solar panels, inverters, mounting rails, and AC/DC safety boxes."
                : "Customize your own solar power kit by choosing tailored panel brands, inverters, and electrical protection components."}
            </p>
          </div>

          {/* Stats Badge & Custom Kit Action */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="bg-white/15 backdrop-blur-md border border-white/25 px-5 py-3 rounded-2xl text-center shadow-xs">
              <span className="text-[10px] uppercase font-bold text-slate-300 block tracking-wider">
                Configured Kits
              </span>
              <span className="text-2xl font-black text-white">
                {availableKits.length}
              </span>
              <span className="text-[10px] text-emerald-300 block font-semibold">Active India Catalog</span>
            </div>

            <Button
              variant={activeCatalogTab === "custom-kits" ? "primary" : "secondary"}
              size="lg"
              onClick={() => {
                if (activeCatalogTab === "combo-kits") {
                  navigate("/custom-combo-kit");
                } else {
                  setActiveCatalogTab("combo-kits");
                }
              }}
              className="font-bold py-3.5 px-5 rounded-2xl shadow-md cursor-pointer whitespace-nowrap"
            >
              {activeCatalogTab === "combo-kits" ? "+ Customize Solar Kit" : "View Combo Kits"}
            </Button>
          </div>
        </div>

        {/* Mode Switcher Tabs */}
        <div className="flex items-center gap-2 mt-6 pt-4 border-t border-white/15">
          <button
            type="button"
            onClick={() => setActiveCatalogTab("combo-kits")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeCatalogTab === "combo-kits"
                ? "bg-white text-primary shadow-sm"
                : "bg-white/10 text-white hover:bg-white/20"
            }`}
          >
            <FiSun size={14} />
            <span>Pre-Configured Combo Kits ({availableKits.length})</span>
          </button>

          <button
            type="button"
            onClick={() => navigate("/custom-combo-kit")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeCatalogTab === "custom-kits"
                ? "bg-white text-primary shadow-sm"
                : "bg-white/10 text-white hover:bg-white/20"
            }`}
          >
            <FiSliders size={14} />
            <span>Custom Brand Sizing Tool</span>
          </button>
        </div>
      </div>

      {/* ─── Exact Admin Panel Filter Bar ──────────────────────────── */}
      <div className="bg-surface rounded-3xl p-5 sm:p-6 border border-border shadow-xs space-y-4">
        
        {/* Top Title & Clear Filter Button */}
        <div className="flex items-center justify-between pb-3 border-b border-border">
          <div className="flex items-center gap-2">
            <FiSliders className="text-primary" size={17} />
            <h3 className="font-extrabold text-sm text-text-primary uppercase tracking-wider">
              Filter Catalog Kits
            </h3>
          </div>
          {activeFiltersCount > 0 && (
            <button
              onClick={handleClearAllFilters}
              className="text-xs font-bold text-danger hover:underline cursor-pointer flex items-center gap-1"
            >
              <FiX size={13} />
              <span>Clear All ({activeFiltersCount})</span>
            </button>
          )}
        </div>

        {/* Exact 6 Filter Dropdowns Row (Matching Admin Panel) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          
          {/* 1. SEARCH INPUT */}
          <div>
            <label className="block text-[10px] font-extrabold uppercase text-text-secondary tracking-wider mb-1.5">
              SEARCH
            </label>
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={14} />
              <input
                type="text"
                placeholder="Search kits..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-3 py-2 bg-surface-hover border border-border rounded-xl text-xs text-text-primary focus:outline-none focus:border-primary font-medium"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary"
                >
                  <FiX size={12} />
                </button>
              )}
            </div>
          </div>

          {/* 2. INDUSTRY TYPE */}
          <div>
            <label className="block text-[10px] font-extrabold uppercase text-text-secondary tracking-wider mb-1.5">
              INDUSTRY TYPE
            </label>
            <select
              value={selectedIndustryType}
              onChange={(e) => setSelectedIndustryType(e.target.value)}
              className="w-full px-3 py-2 bg-surface-hover border border-border rounded-xl text-xs text-text-primary font-semibold focus:outline-none focus:border-primary cursor-pointer"
            >
              <option value="all">All Industry Types</option>
              {filterOptions.industries.map((ind, idx) => {
                const label = safeString(ind);
                return <option key={idx} value={label}>{label}</option>;
              })}
              <option value="Residential">Residential</option>
              <option value="Commercial">Commercial</option>
              <option value="Industrial">Industrial</option>
            </select>
          </div>

          {/* 3. CATEGORY */}
          <div>
            <label className="block text-[10px] font-extrabold uppercase text-text-secondary tracking-wider mb-1.5">
              CATEGORY
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 bg-surface-hover border border-border rounded-xl text-xs text-text-primary font-semibold focus:outline-none focus:border-primary cursor-pointer"
            >
              <option value="all">All Categories</option>
              {filterOptions.categories.map((cat, idx) => {
                const label = safeString(cat);
                return <option key={idx} value={label}>{label}</option>;
              })}
              <option value="On-Grid">On-Grid Solar Kits</option>
              <option value="Off-Grid">Off-Grid Solar Kits</option>
              <option value="Hybrid">Hybrid Solar Kits</option>
            </select>
          </div>

          {/* 4. SUB-CATEGORY */}
          <div>
            <label className="block text-[10px] font-extrabold uppercase text-text-secondary tracking-wider mb-1.5">
              SUB-CATEGORY
            </label>
            <select
              value={selectedSubCategory}
              onChange={(e) => setSelectedSubCategory(e.target.value)}
              className="w-full px-3 py-2 bg-surface-hover border border-border rounded-xl text-xs text-text-primary font-semibold focus:outline-none focus:border-primary cursor-pointer"
            >
              <option value="all">All Sub-Categories</option>
              {filterOptions.subCategories.map((sub, idx) => {
                const label = safeString(sub);
                return <option key={idx} value={label}>{label}</option>;
              })}
              <option value="Residential Rooftop">Residential Rooftop</option>
              <option value="Commercial Shed">Commercial Shed</option>
              <option value="Ground Mount">Ground Mount</option>
            </select>
          </div>

          {/* 5. SYSTEM TYPE */}
          <div>
            <label className="block text-[10px] font-extrabold uppercase text-text-secondary tracking-wider mb-1.5">
              SYSTEM TYPE
            </label>
            <select
              value={selectedSystemType}
              onChange={(e) => setSelectedSystemType(e.target.value)}
              className="w-full px-3 py-2 bg-surface-hover border border-border rounded-xl text-xs text-text-primary font-semibold focus:outline-none focus:border-primary cursor-pointer"
            >
              <option value="all">All Types</option>
              {filterOptions.systemTypes.map((sys, idx) => {
                const label = safeString(sys);
                return <option key={idx} value={label}>{label}</option>;
              })}
              <option value="Single Phase">Single Phase (1-Phase)</option>
              <option value="Three Phase">Three Phase (3-Phase)</option>
              <option value="String Inverter">String Inverter</option>
              <option value="Micro Inverter">Micro Inverter</option>
            </select>
          </div>

          {/* 6. PROJECT RANGE */}
          <div>
            <label className="block text-[10px] font-extrabold uppercase text-text-secondary tracking-wider mb-1.5">
              PROJECT RANGE
            </label>
            <select
              value={selectedProjectRange}
              onChange={(e) => setSelectedProjectRange(e.target.value)}
              className="w-full px-3 py-2 bg-surface-hover border border-border rounded-xl text-xs text-text-primary font-semibold focus:outline-none focus:border-primary cursor-pointer"
            >
              <option value="all">All Ranges</option>
              {filterOptions.projectRanges.map((rng, idx) => {
                const label = safeString(rng);
                return <option key={idx} value={label}>{label}</option>;
              })}
              <option value="1">1 kW</option>
              <option value="2">2 kW</option>
              <option value="3">3 kW</option>
              <option value="5">5 kW</option>
              <option value="10">10 kW</option>
              <option value="15">15 kW+</option>
            </select>
          </div>

        </div>

        {/* Secondary controls: In-Stock checkbox, Sort, View switcher */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-border">
          
          {/* In-Stock filter & active count */}
          <div className="flex items-center gap-4 flex-wrap">
            <label className="flex items-center gap-2 text-xs font-bold text-text-primary cursor-pointer select-none">
              <input
                type="checkbox"
                checked={inStockOnly}
                onChange={(e) => setInStockOnly(e.target.checked)}
                className="h-4 w-4 rounded text-primary focus:ring-primary"
              />
              <span>In-Stock Only</span>
            </label>

            <span className="text-xs text-text-muted">
              Showing <strong>{filteredKits.length}</strong> of <strong>{availableKits.length}</strong> complete kits
            </span>
          </div>

          {/* Sorting & Grid/List switcher */}
          <div className="flex items-center gap-2.5">
            <div className="flex items-center gap-1.5 text-xs text-text-secondary">
              <span className="font-bold">Sort:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-surface-hover border border-border text-text-primary rounded-xl px-3 py-1.5 text-xs font-semibold focus:outline-none focus:border-primary cursor-pointer"
              >
                <option value="featured">Featured Solar Kits</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="capacity-high">Capacity: High to Low</option>
                <option value="capacity-low">Capacity: Low to High</option>
                <option value="savings">Highest Savings</option>
              </select>
            </div>

            <div className="flex items-center bg-surface-hover p-0.5 rounded-xl border border-border">
              <IconButton
                variant={viewMode === "grid" ? "primary" : "ghost"}
                size="sm"
                onClick={() => setViewMode("grid")}
                className={`rounded-lg ${viewMode === "grid" ? "bg-primary text-white" : "text-text-secondary"}`}
                aria-label="Grid View"
              >
                <FiGrid size={14} />
              </IconButton>
              <IconButton
                variant={viewMode === "list" ? "primary" : "ghost"}
                size="sm"
                onClick={() => setViewMode("list")}
                className={`rounded-lg ${viewMode === "list" ? "bg-primary text-white" : "text-text-secondary"}`}
                aria-label="List View"
              >
                <FiList size={14} />
              </IconButton>
            </div>

            {comparedKits.length > 0 && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => setShowCompareDrawer(true)}
                leftIcon={<FiLayers size={13} />}
                className="font-bold rounded-xl"
              >
                Compare ({comparedKits.length})
              </Button>
            )}
          </div>

        </div>

        {/* Active Filter Badges */}
        {activeFiltersCount > 0 && (
          <div className="flex items-center gap-2 flex-wrap text-xs pt-1">
            <span className="text-text-muted font-bold text-[11px]">Applied Filters:</span>
            {searchTerm && (
              <span className="inline-flex items-center gap-1 bg-primary-soft text-primary font-bold px-2.5 py-0.5 rounded-full border border-primary/20 text-[11px]">
                Search: "{searchTerm}"
                <button onClick={() => setSearchTerm("")} className="hover:text-danger"><FiX size={11} /></button>
              </span>
            )}
            {selectedIndustryType !== "all" && (
              <span className="inline-flex items-center gap-1 bg-primary-soft text-primary font-bold px-2.5 py-0.5 rounded-full border border-primary/20 text-[11px]">
                Industry: {safeString(selectedIndustryType)}
                <button onClick={() => setSelectedIndustryType("all")} className="hover:text-danger"><FiX size={11} /></button>
              </span>
            )}
            {selectedCategory !== "all" && (
              <span className="inline-flex items-center gap-1 bg-primary-soft text-primary font-bold px-2.5 py-0.5 rounded-full border border-primary/20 text-[11px]">
                Category: {safeString(selectedCategory)}
                <button onClick={() => setSelectedCategory("all")} className="hover:text-danger"><FiX size={11} /></button>
              </span>
            )}
            {selectedSubCategory !== "all" && (
              <span className="inline-flex items-center gap-1 bg-primary-soft text-primary font-bold px-2.5 py-0.5 rounded-full border border-primary/20 text-[11px]">
                Sub-Category: {safeString(selectedSubCategory)}
                <button onClick={() => setSelectedSubCategory("all")} className="hover:text-danger"><FiX size={11} /></button>
              </span>
            )}
            {selectedSystemType !== "all" && (
              <span className="inline-flex items-center gap-1 bg-primary-soft text-primary font-bold px-2.5 py-0.5 rounded-full border border-primary/20 text-[11px]">
                System: {safeString(selectedSystemType)}
                <button onClick={() => setSelectedSystemType("all")} className="hover:text-danger"><FiX size={11} /></button>
              </span>
            )}
            {selectedProjectRange !== "all" && (
              <span className="inline-flex items-center gap-1 bg-primary-soft text-primary font-bold px-2.5 py-0.5 rounded-full border border-primary/20 text-[11px]">
                Range: {safeString(selectedProjectRange)}
                <button onClick={() => setSelectedProjectRange("all")} className="hover:text-danger"><FiX size={11} /></button>
              </span>
            )}
          </div>
        )}

      </div>

      {/* ─── Product Results Section ───────────────────────────────── */}
      <div>
        {filteredKits.length === 0 ? (
          <div className="bg-surface rounded-3xl p-12 text-center border border-border shadow-xs space-y-4">
            <div className="w-16 h-16 bg-primary-soft text-primary rounded-full flex items-center justify-center mx-auto">
              <FiSearch size={28} />
            </div>
            <h3 className="text-lg font-bold text-text-primary">No Matching Solar Kits Found</h3>
            <p className="text-xs text-text-secondary max-w-sm mx-auto">
              No complete kits match the selected filter combination. Try selecting "All Categories" or clearing the search query.
            </p>
            <Button
              variant="primary"
              size="md"
              onClick={handleClearAllFilters}
              className="font-bold"
            >
              Reset Filters
            </Button>
          </div>
        ) : (
          <div
            className={
              viewMode === "grid"
                ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5"
                : "space-y-4"
            }
          >
            {filteredKits.map((kit) => (
              <KitProductCard
                key={kit.id}
                kit={kit}
                onQuickView={handleQuickView}
                isCompared={comparedKits.some((k) => k.id === kit.id)}
                onToggleCompare={handleToggleCompare}
                viewMode={viewMode}
              />
            ))}
          </div>
        )}
      </div>

      {/* ─── MODALS ────────────────────────────────────────────────── */}
      {quickViewKit && (
        <KitProductModal
          kit={quickViewKit}
          initialVariantIndex={quickViewVariantIndex}
          isOpen={!!quickViewKit}
          onClose={() => setQuickViewKit(null)}
          onOpenExpertHelp={handleOpenExpertHelp}
        />
      )}

      <KitComparisonDrawer
        comparedKits={comparedKits}
        isOpen={showCompareDrawer}
        onClose={() => setShowCompareDrawer(false)}
        onRemoveKit={(id) => setComparedKits((p) => p.filter((k) => k.id !== id))}
        onClearAll={() => setComparedKits([])}
      />

      <ExpertHelpModal
        isOpen={showExpertModal}
        onClose={() => setShowExpertModal(false)}
        preselectedKit={expertPreselectedKit}
      />

    </div>
  );
}
