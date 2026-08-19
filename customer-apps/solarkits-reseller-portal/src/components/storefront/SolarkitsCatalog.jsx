import { useState, useEffect, useMemo, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiSearch,
  FiFilter,
  FiX,
  FiEye,
  FiCheckCircle,
  FiShoppingBag,
  FiDollarSign,
  FiTruck,
  FiShield,
  FiTrendingUp,
  FiBookmark,
  FiMessageSquare,
  FiSliders,
  FiRotateCcw,
  FiPackage,
  FiAlertCircle,
  FiArrowRight,
  FiCheck,
} from "react-icons/fi";
import {
  SOLARKITS_DATA,
  PANEL_WATTAGES,
  APPLICATION_TYPES,
  SYSTEM_CAPACITIES,
  BRANDS,
  PHASES,
  GOV_SCHEMES,
} from "../../data/solarkitsData";

export default function SolarkitsCatalog({
  onOpenKitDetails,
  onOpenLeadModal,
  onToggleCompare,
  compareList = [],
  filterOverride = {},
}) {
  const [searchParams, setSearchParams] = useSearchParams();

  // Filter States initialized from URL params if present
  const [searchQuery, setSearchQuery] = useState(searchParams.get("q") || "");
  const [selectedWattage, setSelectedWattage] = useState(searchParams.get("wattage") || "All Wattages");
  const [selectedApplication, setSelectedApplication] = useState(searchParams.get("app") || "All Applications");
  const [selectedCapacity, setSelectedCapacity] = useState(searchParams.get("capacity") || "All Capacities");
  const [selectedBrand, setSelectedBrand] = useState(searchParams.get("brand") || "All Brands");
  const [selectedPhase, setSelectedPhase] = useState(searchParams.get("phase") || "All Phases");
  const [selectedDcr, setSelectedDcr] = useState(searchParams.get("dcr") || "all"); // 'all' | 'dcr' | 'nondcr'
  const [selectedScheme, setSelectedScheme] = useState(searchParams.get("scheme") || "All Schemes");
  const [maxPrice, setMaxPrice] = useState(Number(searchParams.get("maxPrice")) || 1000000);
  const [onlyInStock, setOnlyInStock] = useState(searchParams.get("inStock") === "true");

  // Shortlisted kits ID list stored in localStorage
  const [shortlist, setShortlist] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("solarkits_shortlist") || "[]");
    } catch {
      return [];
    }
  });

  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  // Sync state if parent passes filterOverride (e.g. clicking BrowseByApplication)
  useEffect(() => {
    if (filterOverride.application) setSelectedApplication(filterOverride.application);
    if (filterOverride.capacity) setSelectedCapacity(filterOverride.capacity);
    if (filterOverride.wattage) {
      if (filterOverride.wattage === "DCR") setSelectedDcr("dcr");
      else if (filterOverride.wattage === "Non-DCR") setSelectedDcr("nondcr");
      else setSelectedWattage(filterOverride.wattage);
    }
  }, [filterOverride]);

  // Sync state to URL Query Parameters
  const updateUrlParams = useCallback(() => {
    const params = new URLSearchParams();
    if (searchQuery.trim()) params.set("q", searchQuery.trim());
    if (selectedWattage !== "All Wattages") params.set("wattage", selectedWattage);
    if (selectedApplication !== "All Applications") params.set("app", selectedApplication);
    if (selectedCapacity !== "All Capacities") params.set("capacity", selectedCapacity);
    if (selectedBrand !== "All Brands") params.set("brand", selectedBrand);
    if (selectedPhase !== "All Phases") params.set("phase", selectedPhase);
    if (selectedDcr !== "all") params.set("dcr", selectedDcr);
    if (selectedScheme !== "All Schemes") params.set("scheme", selectedScheme);
    if (maxPrice < 1000000) params.set("maxPrice", maxPrice.toString());
    if (onlyInStock) params.set("inStock", "true");

    setSearchParams(params, { replace: true });
  }, [
    searchQuery,
    selectedWattage,
    selectedApplication,
    selectedCapacity,
    selectedBrand,
    selectedPhase,
    selectedDcr,
    selectedScheme,
    maxPrice,
    onlyInStock,
    setSearchParams,
  ]);

  useEffect(() => {
    updateUrlParams();
  }, [updateUrlParams]);

  // Handle Shortlist toggle
  const toggleShortlist = (kitId) => {
    const updated = shortlist.includes(kitId)
      ? shortlist.filter((id) => id !== kitId)
      : [...shortlist, kitId];
    setShortlist(updated);
    localStorage.setItem("solarkits_shortlist", JSON.stringify(updated));
  };

  // Clear all filters
  const handleClearAll = () => {
    setSearchQuery("");
    setSelectedWattage("All Wattages");
    setSelectedApplication("All Applications");
    setSelectedCapacity("All Capacities");
    setSelectedBrand("All Brands");
    setSelectedPhase("All Phases");
    setSelectedDcr("all");
    setSelectedScheme("All Schemes");
    setMaxPrice(1000000);
    setOnlyInStock(false);
  };

  // Active filter tags computation
  const activeFilters = useMemo(() => {
    const tags = [];
    if (searchQuery.trim()) tags.push({ label: `"${searchQuery.trim()}"`, clear: () => setSearchQuery("") });
    if (selectedWattage !== "All Wattages") tags.push({ label: `Wattage: ${selectedWattage}`, clear: () => setSelectedWattage("All Wattages") });
    if (selectedApplication !== "All Applications") tags.push({ label: selectedApplication, clear: () => setSelectedApplication("All Applications") });
    if (selectedCapacity !== "All Capacities") tags.push({ label: `Capacity: ${selectedCapacity}`, clear: () => setSelectedCapacity("All Capacities") });
    if (selectedBrand !== "All Brands") tags.push({ label: `Brand: ${selectedBrand}`, clear: () => setSelectedBrand("All Brands") });
    if (selectedPhase !== "All Phases") tags.push({ label: selectedPhase, clear: () => setSelectedPhase("All Phases") });
    if (selectedDcr === "dcr") tags.push({ label: "DCR Compliant", clear: () => setSelectedDcr("all") });
    if (selectedDcr === "nondcr") tags.push({ label: "Non-DCR", clear: () => setSelectedDcr("all") });
    if (selectedScheme !== "All Schemes") tags.push({ label: selectedScheme, clear: () => setSelectedScheme("All Schemes") });
    if (onlyInStock) tags.push({ label: "In Stock Only", clear: () => setOnlyInStock(false) });
    if (maxPrice < 1000000) tags.push({ label: `Max ₹${maxPrice.toLocaleString("en-IN")}`, clear: () => setMaxPrice(1000000) });
    return tags;
  }, [
    searchQuery,
    selectedWattage,
    selectedApplication,
    selectedCapacity,
    selectedBrand,
    selectedPhase,
    selectedDcr,
    selectedScheme,
    onlyInStock,
    maxPrice,
  ]);

  // Main Filtering Engine
  const filteredKits = useMemo(() => {
    return SOLARKITS_DATA.filter((kit) => {
      // 1. Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = kit.name.toLowerCase().includes(q);
        const matchesId = kit.id.toLowerCase().includes(q);
        const matchesBrand = kit.panelBrand.toLowerCase().includes(q) || kit.inverterBrand.toLowerCase().includes(q);
        const matchesApp = kit.applicationType.toLowerCase().includes(q);
        if (!matchesName && !matchesId && !matchesBrand && !matchesApp) return false;
      }

      // 2. Wattage filter
      if (selectedWattage !== "All Wattages") {
        if (selectedWattage === "DCR" && !kit.isDcr) return false;
        if (selectedWattage === "Non-DCR" && kit.isDcr) return false;
        if (selectedWattage !== "DCR" && selectedWattage !== "Non-DCR") {
          if (kit.wattageCategory !== selectedWattage) return false;
        }
      }

      // 3. Application Type
      if (selectedApplication !== "All Applications") {
        if (kit.applicationType !== selectedApplication) return false;
      }

      // 4. Capacity filter
      if (selectedCapacity !== "All Capacities") {
        if (kit.capacityCategory !== selectedCapacity && !kit.capacityDisplay.includes(selectedCapacity)) return false;
      }

      // 5. Brand filter
      if (selectedBrand !== "All Brands") {
        if (!kit.panelBrand.includes(selectedBrand) && !kit.inverterBrand.includes(selectedBrand)) return false;
      }

      // 6. Phase filter
      if (selectedPhase !== "All Phases") {
        if (selectedPhase.includes("Single") && kit.phase !== "single-phase") return false;
        if (selectedPhase.includes("Three") && kit.phase !== "three-phase") return false;
      }

      // 7. DCR / Non-DCR filter
      if (selectedDcr === "dcr" && !kit.isDcr) return false;
      if (selectedDcr === "nondcr" && kit.isDcr) return false;

      // 8. Government Scheme
      if (selectedScheme !== "All Schemes") {
        const matchesScheme = kit.schemeEligibility?.some((s) => s.toLowerCase().includes(selectedScheme.toLowerCase()));
        if (!matchesScheme) return false;
      }

      // 9. Price
      if (kit.wholesalePrice > maxPrice) return false;

      // 10. In stock
      if (onlyInStock && !kit.inStock) return false;

      return true;
    });
  }, [
    searchQuery,
    selectedWattage,
    selectedApplication,
    selectedCapacity,
    selectedBrand,
    selectedPhase,
    selectedDcr,
    selectedScheme,
    maxPrice,
    onlyInStock,
  ]);

  // Closest recommendations when filter yields 0 results
  const recommendedKits = useMemo(() => {
    if (filteredKits.length > 0) return [];
    return SOLARKITS_DATA.slice(0, 3);
  }, [filteredKits]);

  const handleWhatsAppKit = (kit) => {
    const text = encodeURIComponent(
      `Hello SolarKits,\nI would like to inquire about the following SolarKit:\n*${kit.name}*\nWholesale: ₹${kit.wholesalePrice.toLocaleString("en-IN")}\nSKU: ${kit.id}`
    );
    window.open(`https://wa.me/919876543210?text=${text}`, "_blank");
  };

  return (
    <section id="catalog-browser" className="py-14 sm:py-20 bg-white text-slate-900 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Title Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200 pb-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-50 border border-sky-100 shadow-xs">
              <FiPackage className="text-[#0575B8]" size={14} />
              <span className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-[#0575B8]">
                Kit-First B2B Procurement
              </span>
            </div>

            <h2 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight">
              Browse & Configure Complete{" "}
              <span className="text-[#F49222]">
                Solarkits
              </span>
            </h2>

            <p className="text-xs sm:text-base text-slate-600 font-normal">
              Search by panel wattage, application type, and kW system capacity. All solutions are supplied complete with pre-wired switchgear and warranty certificates.
            </p>
          </div>

          {/* Quick Search Input */}
          <div className="w-full md:w-80">
            <div className="relative">
              <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by kW, 550W, DCR, Brand..."
                className="w-full pl-10 pr-9 py-2.5 sm:py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-[#0575B8] shadow-xs transition-colors"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <FiX size={14} />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Multi-Parameter Quick Filter Tabs Bar (Horizontal Scroll on Touch Devices) */}
        <div className="pt-6 pb-2 space-y-3">
          
          {/* Row 1: Application Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 shrink-0 mr-1">
              Application:
            </span>
            {APPLICATION_TYPES.map((app) => (
              <button
                key={app}
                onClick={() => setSelectedApplication(app)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all shrink-0 cursor-pointer ${
                  selectedApplication === app
                    ? "bg-[#0575B8] text-white shadow-sm"
                    : "bg-slate-100 text-slate-700 hover:bg-sky-50 hover:text-[#0575B8]"
                }`}
              >
                {app}
              </button>
            ))}
          </div>

          {/* Row 2: Wattage & DCR Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 shrink-0 mr-1">
              Panel Wattage:
            </span>
            {PANEL_WATTAGES.map((watt) => (
              <button
                key={watt}
                onClick={() => {
                  if (watt === "DCR") setSelectedDcr(selectedDcr === "dcr" ? "all" : "dcr");
                  else if (watt === "Non-DCR") setSelectedDcr(selectedDcr === "nondcr" ? "all" : "nondcr");
                  else setSelectedWattage(watt);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all shrink-0 cursor-pointer ${
                  (watt === "DCR" && selectedDcr === "dcr") ||
                  (watt === "Non-DCR" && selectedDcr === "nondcr") ||
                  (watt !== "DCR" && watt !== "Non-DCR" && selectedWattage === watt)
                    ? "bg-[#F49222] text-white shadow-sm"
                    : "bg-slate-100 text-slate-700 hover:bg-amber-50 hover:text-[#D97E15]"
                }`}
              >
                {watt}
              </button>
            ))}
          </div>

          {/* Row 3: Capacity Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 shrink-0 mr-1">
              Capacity:
            </span>
            {SYSTEM_CAPACITIES.map((cap) => (
              <button
                key={cap}
                onClick={() => setSelectedCapacity(cap)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all shrink-0 cursor-pointer ${
                  selectedCapacity === cap
                    ? "bg-[#0575B8] text-white shadow-sm"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200 hover:text-slate-900"
                }`}
              >
                {cap}
              </button>
            ))}
          </div>
        </div>

        {/* Active Filters Bar & Count */}
        <div className="flex flex-wrap items-center justify-between gap-3 py-4 border-y border-slate-100 mt-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-700">
              Showing <strong className="text-[#0575B8]">{filteredKits.length}</strong> Complete Solarkits
            </span>
            {activeFilters.length > 0 && (
              <button
                onClick={handleClearAll}
                className="text-xs font-bold text-red-600 hover:text-red-700 underline ml-2 cursor-pointer"
              >
                Clear All Filters
              </button>
            )}
          </div>

          {/* Active Filter Tags */}
          <div className="flex flex-wrap items-center gap-1.5">
            {activeFilters.map((tag, idx) => (
              <span
                key={idx}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-sky-50 text-[#0575B8] border border-sky-200 text-[11px] font-bold"
              >
                <span>{tag.label}</span>
                <button onClick={tag.clear} className="hover:text-red-600">
                  <FiX size={12} />
                </button>
              </span>
            ))}
          </div>
        </div>

        {/* Product Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-6">
          {filteredKits.map((kit, idx) => {
            const isCompared = compareList.some((k) => k.id === kit.id);
            const isShortlisted = shortlist.includes(kit.id);
            const marginAmount = Math.max(0, kit.mrp - kit.wholesalePrice);
            const marginPercent = Math.round((marginAmount / kit.mrp) * 100);

            return (
              <motion.div
                key={kit.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: (idx % 3) * 0.08 }}
                className="group rounded-3xl bg-white border border-slate-200 hover:border-slate-300 shadow-sm hover:shadow-xl flex flex-col justify-between overflow-hidden transition-all duration-300 hover:-translate-y-1 relative"
              >
                <div>
                  {/* Top Image Container */}
                  <div className="relative h-52 sm:h-56 w-full bg-slate-100 overflow-hidden">
                    <img
                      src={kit.imageUrl}
                      alt={kit.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent" />

                    {/* SOLARKIT Category Header Badge */}
                    <div className="absolute top-3 left-3 flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#0575B8] text-white text-[9px] sm:text-[10px] font-black uppercase tracking-wider shadow-sm">
                      <FiPackage size={11} />
                      <span>SOLARKIT</span>
                    </div>

                    {/* DCR status pill */}
                    <div className="absolute top-3 right-3 flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/95 backdrop-blur-md text-slate-800 text-[9px] sm:text-[10px] font-black uppercase tracking-wider shadow-xs">
                      {kit.isDcr ? (
                        <span className="text-emerald-700 flex items-center gap-1">
                          <FiCheck size={11} className="text-emerald-600" />
                          DCR Kit
                        </span>
                      ) : (
                        <span className="text-slate-600">Non-DCR</span>
                      )}
                    </div>

                    {/* Shortlist Bookmark Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleShortlist(kit.id);
                      }}
                      className={`absolute bottom-3 right-3 p-2 rounded-xl backdrop-blur-md transition-colors ${
                        isShortlisted
                          ? "bg-red-500 text-white"
                          : "bg-white/90 text-slate-700 hover:text-red-500"
                      }`}
                      title="Shortlist Kit"
                    >
                      <FiBookmark size={14} className={isShortlisted ? "fill-current" : ""} />
                    </button>

                    {/* Stock Hub Tag */}
                    <div className="absolute bottom-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black/60 backdrop-blur-md text-white text-[10px] font-bold">
                      <FiTruck size={12} className="text-emerald-400" />
                      <span>{kit.stockStatus}</span>
                    </div>
                  </div>

                  {/* Card Content Body */}
                  <div className="p-5 sm:p-6 space-y-4">
                    
                    {/* Title & Capacity */}
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-[#0575B8] uppercase tracking-wider">
                          {kit.applicationType} • {kit.capacityDisplay}
                        </span>
                        <span className="text-[10px] font-mono text-slate-400">
                          {kit.id}
                        </span>
                      </div>
                      <h3 className="text-base font-black text-slate-900 group-hover:text-[#0575B8] transition-colors mt-0.5 leading-snug">
                        {kit.name}
                      </h3>
                    </div>

                    {/* Standard Solarkit Specification Breakdown Box */}
                    <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2 text-xs">
                      <div className="flex items-start gap-2 text-slate-700">
                        <span className="h-1.5 w-1.5 rounded-full bg-[#F49222] mt-1.5 shrink-0" />
                        <span>
                          <strong>Panels:</strong> {kit.panelWattage}W × {kit.panelCount} Tier-1 Modules
                        </span>
                      </div>

                      <div className="flex items-start gap-2 text-slate-700">
                        <span className="h-1.5 w-1.5 rounded-full bg-[#0575B8] mt-1.5 shrink-0" />
                        <span>
                          <strong>Inverter:</strong> {kit.inverterSpec}
                        </span>
                      </div>

                      <div className="flex items-start gap-2 text-slate-700">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 mt-1.5 shrink-0" />
                        <span>
                          <strong>BOS Kit:</strong> Pre-wired IP65 ACDB/DCDB, UV DC Cables & Earthing
                        </span>
                      </div>
                    </div>

                    {/* Pricing & GST Treatment */}
                    <div className="p-3.5 rounded-2xl bg-sky-50/70 border border-sky-100 space-y-2">
                      <div className="flex items-baseline justify-between">
                        <div>
                          <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">
                            Franchisee Wholesale
                          </span>
                          <span className="text-xl sm:text-2xl font-black text-[#0575B8]">
                            ₹{kit.wholesalePrice.toLocaleString("en-IN")}
                          </span>
                          <span className="text-[10px] text-slate-500 font-semibold block">
                            + 12% GST (ITC Claimable)
                          </span>
                        </div>

                        <div className="text-right">
                          <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">
                            Customer MRP
                          </span>
                          <span className="text-xs sm:text-sm font-semibold text-slate-400 line-through">
                            ₹{kit.mrp.toLocaleString("en-IN")}
                          </span>
                        </div>
                      </div>

                      {/* Margin estimation */}
                      <div className="flex items-center justify-between pt-2 border-t border-sky-200/60 text-[11px] font-bold">
                        <span className="text-slate-600 flex items-center gap-1">
                          <FiTrendingUp className="text-emerald-600" />
                          Est. Dealer Margin:
                        </span>
                        <span className="text-emerald-800 bg-emerald-100/80 px-1.5 py-0.5 rounded text-[10px] font-black">
                          +₹{marginAmount.toLocaleString("en-IN")} ({marginPercent}%)
                        </span>
                      </div>
                    </div>

                    {/* Badges Bar (Gov Scheme / MOQ / Delivery) */}
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      {kit.isGovSchemeCompatible && (
                        <span className="px-2 py-0.5 rounded-md bg-amber-50 text-[#D97E15] border border-amber-200 text-[10px] font-extrabold flex items-center gap-1">
                          <FiCheckCircle size={11} />
                          PM Surya Ghar
                        </span>
                      )}
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-bold">
                        MOQ: {kit.moq} {kit.moqUnit}
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-bold">
                        {kit.estimatedDelivery.split(" ")[0]} Dispatch
                      </span>
                    </div>

                  </div>
                </div>

                {/* Card Action Footer */}
                <div className="p-5 sm:p-6 pt-0 space-y-2.5">
                  
                  {/* Compare checkbox & WhatsApp */}
                  <div className="flex items-center justify-between text-xs text-slate-600 pt-1">
                    <label className="flex items-center gap-1.5 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={isCompared}
                        onChange={() => onToggleCompare && onToggleCompare(kit)}
                        className="accent-[#0575B8] rounded"
                      />
                      <span className="text-[11px] font-semibold">Compare Kit</span>
                    </label>

                    <button
                      onClick={() => handleWhatsAppKit(kit)}
                      className="text-[11px] font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
                    >
                      <FiMessageSquare />
                      <span>WhatsApp</span>
                    </button>
                  </div>

                  {/* Primary and Secondary CTA buttons */}
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => onOpenKitDetails(kit)}
                      className="py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold flex items-center justify-center gap-1 transition-all border border-slate-200 cursor-pointer"
                    >
                      <FiEye size={13} />
                      <span>View Details</span>
                    </button>

                    <button
                      onClick={() => onOpenLeadModal({ kitName: kit.name, capacityDisplay: kit.capacityDisplay }, "bulk_price")}
                      className="py-2.5 px-3 rounded-xl bg-gradient-to-r from-[#0575B8] to-[#1965B0] hover:from-[#045D93] hover:to-[#0575B8] text-white text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1 transition-all shadow-md shadow-blue-500/20 cursor-pointer"
                    >
                      <FiDollarSign size={13} />
                      <span>Bulk Price</span>
                    </button>
                  </div>
                </div>

              </motion.div>
            );
          })}
        </div>

        {/* Empty State with Closest Recommendations */}
        {filteredKits.length === 0 && (
          <div className="py-12 sm:py-16 text-center space-y-6">
            <div className="h-16 w-16 bg-amber-50 text-[#F49222] rounded-3xl border border-amber-200 flex items-center justify-center mx-auto shadow-xs">
              <FiAlertCircle size={32} />
            </div>

            <div className="space-y-2 max-w-md mx-auto">
              <h3 className="text-xl font-black text-slate-900">
                No exact Solarkit match found for your active filters
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Try resetting your filters or check our recommended compatible solar kits below. You can also request a custom engineered configuration.
              </p>

              <div className="pt-2 flex items-center justify-center gap-3">
                <button
                  onClick={handleClearAll}
                  className="px-4 py-2 bg-[#0575B8] hover:bg-[#045D93] text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
                >
                  Reset All Filters
                </button>
                <button
                  onClick={() => onOpenLeadModal({ requiredConfig: "Custom Engineered SolarKit" }, "custom_config")}
                  className="px-4 py-2 bg-[#F49222] text-white rounded-xl text-xs font-bold shadow-md shadow-amber-500/20"
                >
                  Request Custom Configuration
                </button>
              </div>
            </div>

            {/* Closest Compatible Kits Recommendation */}
            <div className="pt-8 border-t border-slate-100 max-w-5xl mx-auto text-left space-y-4">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-700">
                Recommended Alternative SolarKits:
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {recommendedKits.map((rec) => (
                  <div
                    key={rec.id}
                    className="p-4 rounded-2xl bg-slate-50 border border-slate-200 hover:border-[#0575B8] transition-all space-y-2"
                  >
                    <span className="text-[10px] font-bold text-[#0575B8] uppercase">
                      {rec.capacityDisplay} • {rec.applicationType}
                    </span>
                    <h5 className="text-xs font-black text-slate-900 truncate">
                      {rec.name}
                    </h5>
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-xs font-black text-[#0575B8]">
                        ₹{rec.wholesalePrice.toLocaleString("en-IN")}
                      </span>
                      <button
                        onClick={() => onOpenKitDetails(rec)}
                        className="text-xs font-bold text-slate-700 hover:text-[#0575B8]"
                      >
                        View Specs →
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

      </div>
    </section>
  );
}
