import React, { useState, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  FiX,
  FiCheck,
  FiZap,
  FiShield,
  FiTruck,
  FiMapPin,
  FiShoppingCart,
  FiPhoneCall,
  FiFileText,
  FiHelpCircle,
  FiCheckCircle,
  FiClock,
  FiInfo,
  FiAward,
  FiChevronDown,
  FiChevronUp,
  FiArrowRight
} from "react-icons/fi";
import { FaSolarPanel, FaBolt, FaShieldAlt, FaWarehouse, FaLeaf } from "react-icons/fa";
import { addToCart, setShowAuthDialog, selectLiveStock } from "@/features/slice";
import Button from "../Button";
import IconButton from "../IconButton";

const DEFAULT_KIT_IMAGE = "https://images.unsplash.com/photo-1509391365360-2e959784a276?w=800&auto=format&fit=crop&q=80";

const resolveImageUrl = (url) => {
  if (!url) return DEFAULT_KIT_IMAGE;
  if (url.includes("localhost:3001")) {
    return url.replace("localhost:3001", "localhost:5000");
  }
  if (url.startsWith("/")) {
    return `http://localhost:5000${url}`;
  }
  return url;
};

export default function KitProductModal({
  kit,
  initialVariantIndex = 0,
  isOpen,
  onClose,
  onOpenExpertHelp
}) {
  const dispatch = useDispatch();
  const liveStock = useSelector(selectLiveStock);
  const { isAuthenticated } = useSelector((state) => state.auth_slice);
  const selectedDistrict = useSelector((state) => state.slice.selectedDistrict);
  const districtName = selectedDistrict?.name || "Local Distribution Center";

  const [selectedVariantIndex, setSelectedVariantIndex] = useState(initialVariantIndex);
  const [activeTab, setActiveTab] = useState("included");
  const [pincodeCheck, setPincodeCheck] = useState("");
  const [pincodeResult, setPincodeResult] = useState(null);
  const [openFaqIndex, setOpenFaqIndex] = useState(null);

  if (!isOpen || !kit) return null;

  const variants = kit.variants || [];
  const currentVariant = variants[selectedVariantIndex] || variants[0] || {};

  const availableStock = liveStock[kit.id] !== undefined
    ? liveStock[kit.id]
    : (currentVariant.availableStock ?? 99);
  const inStock = availableStock > 0 && currentVariant.inStock !== false;

  const discountPercent = currentVariant.marketPrice && currentVariant.ourPrice
    ? Math.max(0, Math.round(((currentVariant.marketPrice - currentVariant.ourPrice) / currentVariant.marketPrice) * 100))
    : 0;

  const gstRate = Number(currentVariant.gstRate ?? kit?.gstRate ?? kit?.pricing?.gstRate ?? 13.8);
  const gstAmount = currentVariant.ourPrice
    ? currentVariant.ourPrice - Math.round(currentVariant.ourPrice / (1 + (gstRate / 100)))
    : 0;

  const handleAddToCart = () => {
    if (!isAuthenticated) {
      dispatch(setShowAuthDialog(true));
      return;
    }
    dispatch(addToCart({ id: kit.id, variantIndex: selectedVariantIndex }));
    if (onClose) onClose();
  };

  const handleCheckPincode = (e) => {
    e.preventDefault();
    if (/^\d{6}$/.test(pincodeCheck.trim())) {
      setPincodeResult({
        available: true,
        message: `Delivery available in PIN ${pincodeCheck} (${districtName}) within 3-5 business days.`
      });
    } else {
      setPincodeResult({
        available: false,
        message: "Please enter a valid 6-digit Indian PIN code."
      });
    }
  };

  // Extract included components
  const includedComponentsList = useMemo(() => {
    const list = [];
    if (kit.panel) {
      list.push({
        title: "Tier-1 High Efficiency Solar Panels",
        desc: `${kit.panel.panelCount || Math.ceil((kit.capacityKW * 1000) / (kit.panel.wattPerPanel || 550))}x ${kit.panel.brandName || "Tier-1"} ${kit.panel.wattPerPanel || 550}W ${kit.panel.technologyType || "Mono PERC / TopCon"} Modules`,
        icon: FaSolarPanel,
        warranty: `${kit.panel.warrantyYears || 25} Years Performance Warranty`
      });
    }
    if (kit.inverter) {
      list.push({
        title: "Solar Power Inverter with Smart Monitoring",
        desc: `1x ${kit.inverter.brandName || "Certified"} ${kit.inverter.capacityKW || kit.capacityKW} kW ${kit.inverter.type || "On-Grid"} (${kit.inverter.phase || "Single"} Phase) Inverter`,
        icon: FaBolt,
        warranty: `${kit.inverter.warrantyYears || 5} Years Manufacturer Warranty`
      });
    }
    list.push({
      title: "Solar Module Mounting Structure",
      desc: "High-grade anodized aluminum / HDG structure engineered for 150 km/h wind resilience",
      icon: FaWarehouse,
      warranty: "10 Years Structural Warranty"
    });
    list.push({
      title: "ACDB & DCDB Distribution Safety Boxes",
      desc: "Equipped with Type-II SPDs (Surge Protection), DC fuses, and MCBs for electrical protection",
      icon: FiShield,
      warranty: "2 Years Protection Box Warranty"
    });
    list.push({
      title: "Solar DC Cables & Connectors",
      desc: "4 sq.mm UV-resistant TUV-certified DC solar cables with IP68 waterproof MC4 connectors",
      icon: FiCheckCircle,
      warranty: "TUV / BIS Certified"
    });
    list.push({
      title: "Earthing Kits & Lightning Arrester",
      desc: "Copper-bonded earthing electrodes with chemical compound and lightning protection arrester",
      icon: FiCheck,
      warranty: "Certified Electrical Protection"
    });
    return list;
  }, [kit]);

  const faqs = [
    {
      q: "Does this complete solar kit include all cables and safety hardware?",
      a: "Yes! Every SOLARKITS kit is a complete turnkey package containing solar panels, inverter, mounting rails, AC/DC safety distribution boxes, MC4 connectors, and solar DC cables. You don't need to procure loose electrical items separately."
    },
    {
      q: "Is net-metering supported with this system?",
      a: "On-grid and hybrid kits comply with Indian DISCOM standards for net-metering bidirectional solar meter installation. You can apply to your local electricity board upon kit delivery."
    },
    {
      q: "How are warranties claimed if a component malfunctions?",
      a: "All items include manufacturer warranty certificates and GST tax invoices. Our support team assists you with component replacement or repair under official brand warranties."
    }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      {/* Dark backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/75 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="relative bg-surface rounded-3xl border border-border shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden z-10 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-slate-50 dark:bg-slate-900/50">
          <div className="flex items-center gap-2.5">
            <span className="bg-primary text-white text-xs font-black px-2.5 py-1 rounded-full shadow-xs">
              {kit.capacityKW} kW System
            </span>
            <span className="text-xs font-bold text-text-secondary">
              {kit.brand ? `${kit.brand} • ` : ""}Complete Solar Kit
            </span>
          </div>
          <IconButton
            variant="ghost"
            size="md"
            onClick={onClose}
            className="text-text-muted hover:text-text-primary rounded-full hover:bg-slate-200 dark:hover:bg-slate-800"
            aria-label="Close dialog"
          >
            <FiX size={20} />
          </IconButton>
        </div>

        {/* Modal Body Scrollable */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hover">
          
          {/* Top Section: Gallery + Purchase Column */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Left: Product Image & Badges */}
            <div className="space-y-4">
              <div className="relative bg-gradient-to-tr from-slate-50 to-slate-100 dark:from-slate-800/40 dark:to-slate-900/60 rounded-2xl p-6 border border-border flex items-center justify-center h-64 sm:h-80 overflow-hidden">
                <img
                  src={resolveImageUrl(kit.kitImage)}
                  alt={kit.kitName}
                  className="w-full h-full object-contain drop-shadow-md"
                />
                {discountPercent > 0 && (
                  <span className="absolute top-3 left-3 bg-secondary text-white text-xs font-black px-3 py-1 rounded-xl shadow-md">
                    Save {discountPercent}%
                  </span>
                )}
                <div className="absolute bottom-3 right-3 flex items-center gap-1 bg-surface/90 backdrop-blur-xs text-text-primary px-2.5 py-1 rounded-lg text-xs font-semibold border border-border shadow-xs">
                  <FiMapPin className="text-primary" size={12} />
                  <span>Ships to {districtName}</span>
                </div>
              </div>

              {/* Inclusions summary strip */}
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-border">
                  <FaSolarPanel className="text-primary mx-auto mb-1" size={16} />
                  <p className="font-bold text-text-primary">{kit.panel?.wattPerPanel || 550}W Panels</p>
                  <p className="text-[10px] text-text-muted">Tier-1 Modules</p>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-border">
                  <FaBolt className="text-amber-500 mx-auto mb-1" size={16} />
                  <p className="font-bold text-text-primary">{kit.capacityKW} kW Inverter</p>
                  <p className="text-[10px] text-text-muted">{kit.inverter?.type || "On-Grid"}</p>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-border">
                  <FiAward className="text-emerald-500 mx-auto mb-1" size={16} />
                  <p className="font-bold text-text-primary">{kit.warrantyYears || 25} Yrs Warranty</p>
                  <p className="text-[10px] text-text-muted">Full Assurance</p>
                </div>
              </div>
            </div>

            {/* Right: Title, Pricing, Variant selection, Buy Actions */}
            <div className="space-y-4 flex flex-col justify-between">
              <div>
                <span className="text-xs font-extrabold uppercase tracking-wider text-primary">
                  {kit.usageType || kit.category || "Residential Solar Power System"}
                </span>
                <h2 className="text-xl sm:text-2xl font-black text-text-primary mt-1 leading-snug">
                  {kit.kitName}
                </h2>
                <p className="text-xs text-text-secondary mt-2 leading-relaxed">
                  {kit.description || "A complete, pre-engineered solar power kit designed for effortless rooftop installation, maximum power harvest, and zero-compromise safety."}
                </p>

                {/* Price block */}
                <div className="mt-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-border">
                  <span className="text-[10px] text-text-muted uppercase font-bold tracking-wider block mb-0.5">
                    Special Direct-from-Warehouse Price
                  </span>
                  <div className="flex items-baseline gap-3">
                    <span className="text-2xl sm:text-3xl font-black text-text-primary">
                      ₹{currentVariant.ourPrice ? currentVariant.ourPrice.toLocaleString("en-IN") : "N/A"}
                    </span>
                    {currentVariant.marketPrice && currentVariant.marketPrice > currentVariant.ourPrice && (
                      <del className="text-sm text-text-muted font-medium">
                        ₹{currentVariant.marketPrice.toLocaleString("en-IN")}
                      </del>
                    )}
                  </div>
                  {gstAmount > 0 && (
                    <p className="text-xs text-emerald-600 font-semibold mt-1 flex items-center gap-1">
                      <FiCheckCircle size={13} />
                      Includes ₹{gstAmount.toLocaleString("en-IN")} GST @ {gstRate}% (GST invoice provided)
                    </p>
                  )}
                </div>

                {/* Variant Tier Picker */}
                {variants.length > 1 && (
                  <div className="mt-4">
                    <label className="block text-xs font-bold text-text-secondary uppercase mb-1.5">
                      Choose Package Quality Tier:
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {variants.map((v, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setSelectedVariantIndex(idx)}
                          className={`p-2.5 rounded-xl border text-center transition-all ${
                            selectedVariantIndex === idx
                              ? "bg-primary text-white border-primary shadow-md font-bold"
                              : "bg-surface hover:bg-slate-100 dark:hover:bg-slate-800 border-border text-text-secondary"
                          }`}
                        >
                          <p className="text-xs font-bold">{v.productTier}</p>
                          <p className={`text-[10px] ${selectedVariantIndex === idx ? "text-white/80" : "text-primary font-bold"}`}>
                            ₹{v.ourPrice ? v.ourPrice.toLocaleString("en-IN") : ""}
                          </p>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Delivery PIN Code Checker */}
                <form onSubmit={handleCheckPincode} className="mt-4">
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <FiMapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={14} />
                      <input
                        type="text"
                        maxLength={6}
                        placeholder="Enter 6-digit Delivery PIN"
                        value={pincodeCheck}
                        onChange={(e) => setPincodeCheck(e.target.value.replace(/\D/g, ""))}
                        className="w-full pl-8 pr-3 py-2 text-xs bg-surface border border-border rounded-xl focus:outline-none focus:border-primary"
                      />
                    </div>
                    <button
                      type="submit"
                      className="px-3 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-xl cursor-pointer"
                    >
                      Check
                    </button>
                  </div>
                  {pincodeResult && (
                    <p className={`text-xs mt-1.5 font-medium ${pincodeResult.available ? "text-emerald-600" : "text-danger"}`}>
                      {pincodeResult.message}
                    </p>
                  )}
                </form>
              </div>

              {/* Add to Cart & Buy CTAs */}
              <div className="pt-4 border-t border-border flex flex-col sm:flex-row items-center gap-3">
                <Button
                  variant="primary"
                  size="lg"
                  disabled={!inStock}
                  onClick={handleAddToCart}
                  leftIcon={<FiShoppingCart size={17} />}
                  className="flex-1 w-full font-bold py-3.5 px-4 rounded-xl shadow-md whitespace-nowrap justify-center"
                >
                  {inStock ? "Add to Cart" : "Out of Stock"}
                </Button>

                {onOpenExpertHelp && (
                  <Button
                    variant="secondary"
                    size="lg"
                    onClick={() => {
                      if (onClose) onClose();
                      onOpenExpertHelp(kit);
                    }}
                    leftIcon={<FiPhoneCall size={16} />}
                    className="flex-1 w-full font-bold py-3.5 px-4 rounded-xl shadow-xs whitespace-nowrap justify-center"
                  >
                    Request Quote
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Tabbed In-Depth Sections */}
          <div className="border-t border-border pt-6">
            <div className="flex border-b border-border gap-2 overflow-x-auto scrollbar-none pb-1">
              {[
                { id: "included", label: "What's Included in Kit", icon: FiCheckCircle },
                { id: "specs", label: "Technical Specifications", icon: FiFileText },
                { id: "generation", label: "Estimated Generation & Impact", icon: FaLeaf },
                { id: "faqs", label: "FAQs & Warranty", icon: FiHelpCircle },
              ].map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold rounded-xl whitespace-nowrap transition-all cursor-pointer ${
                      activeTab === tab.id
                        ? "bg-primary text-white shadow-xs"
                        : "text-text-secondary hover:text-text-primary hover:bg-slate-100 dark:hover:bg-slate-800"
                    }`}
                  >
                    <Icon size={14} />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Tab 1: What's Included */}
            {activeTab === "included" && (
              <div className="py-4 space-y-3">
                <p className="text-xs text-text-secondary mb-2">
                  This complete solar kit comes packed with all components required for standard rooftop installation. No standalone loose parts are needed.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {includedComponentsList.map((comp, idx) => {
                    const CompIcon = comp.icon;
                    return (
                      <div key={idx} className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-border flex items-start gap-3">
                        <div className="w-9 h-9 rounded-xl bg-primary-soft text-primary flex items-center justify-center shrink-0 mt-0.5">
                          <CompIcon size={17} />
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-text-primary">{comp.title}</h4>
                          <p className="text-[11px] text-text-secondary mt-0.5">{comp.desc}</p>
                          <span className="inline-block text-[10px] font-bold text-emerald-600 mt-1">
                            ✓ {comp.warranty}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Tab 2: Technical Specifications */}
            {activeTab === "specs" && (
              <div className="py-4">
                <div className="rounded-2xl border border-border overflow-hidden divide-y divide-border text-xs">
                  <div className="grid grid-cols-2 p-3 bg-slate-50 dark:bg-slate-800/50 font-bold text-text-primary">
                    <span>Specification Attribute</span>
                    <span>Configuration Value</span>
                  </div>
                  <div className="grid grid-cols-2 p-3">
                    <span className="text-text-secondary">System Capacity</span>
                    <span className="font-bold text-text-primary">{kit.capacityKW} kW DC</span>
                  </div>
                  <div className="grid grid-cols-2 p-3">
                    <span className="text-text-secondary">Solar Panel Technology</span>
                    <span className="font-bold text-text-primary">{kit.panel?.technologyType || "Mono PERC / TopCon Half-Cut"}</span>
                  </div>
                  <div className="grid grid-cols-2 p-3">
                    <span className="text-text-secondary">Wattage per Panel</span>
                    <span className="font-bold text-text-primary">{kit.panel?.wattPerPanel || 550} Watts</span>
                  </div>
                  <div className="grid grid-cols-2 p-3">
                    <span className="text-text-secondary">Inverter Type & Phase</span>
                    <span className="font-bold text-text-primary">{kit.inverter?.type || "On-Grid String Inverter"} ({kit.inverter?.phase || "Single"} Phase)</span>
                  </div>
                  <div className="grid grid-cols-2 p-3">
                    <span className="text-text-secondary">Inverter Peak Efficiency</span>
                    <span className="font-bold text-text-primary">{kit.inverter?.efficiencyPercent || "98.4"}%</span>
                  </div>
                  <div className="grid grid-cols-2 p-3">
                    <span className="text-text-secondary">Expected Roof Area Needed</span>
                    <span className="font-bold text-text-primary">~{(kit.capacityKW * 80).toFixed(0)} to {(kit.capacityKW * 100).toFixed(0)} sq.ft</span>
                  </div>
                  <div className="grid grid-cols-2 p-3">
                    <span className="text-text-secondary">Surge & Electrical Protection</span>
                    <span className="font-bold text-text-primary">Type-II DC/AC SPD with Earth Protection</span>
                  </div>
                </div>
              </div>
            )}

            {/* Tab 3: Estimated Generation & Impact */}
            {activeTab === "generation" && (
              <div className="py-4 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-4 rounded-2xl bg-primary-soft border border-primary/20 text-center">
                    <FiZap className="text-primary mx-auto mb-1" size={24} />
                    <p className="text-xs text-text-secondary">Estimated Generation</p>
                    <p className="text-lg font-black text-primary mt-1">
                      {kit.generationEstimateKWhPerYear ? kit.generationEstimateKWhPerYear.toLocaleString("en-IN") : (kit.capacityKW * 1450).toLocaleString("en-IN")} kWh / Year
                    </p>
                    <p className="text-[10px] text-text-muted mt-0.5">Approx. 4-5 units/kW daily</p>
                  </div>

                  <div className="p-4 rounded-2xl bg-secondary-soft border border-secondary/20 text-center">
                    <FiAward className="text-secondary mx-auto mb-1" size={24} />
                    <p className="text-xs text-text-secondary">Estimated Electricity Savings</p>
                    <p className="text-lg font-black text-amber-700 mt-1">
                      ₹{((kit.generationEstimateKWhPerYear || kit.capacityKW * 1450) * 8.5).toLocaleString("en-IN", { maximumFractionDigits: 0 })} / Year
                    </p>
                    <p className="text-[10px] text-text-muted mt-0.5">Based on avg. ₹8.5/unit tariff</p>
                  </div>

                  <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-500/20 text-center">
                    <FaLeaf className="text-emerald-500 mx-auto mb-1" size={24} />
                    <p className="text-xs text-text-secondary">CO2 Emission Offset</p>
                    <p className="text-lg font-black text-emerald-600 mt-1">
                      {(kit.capacityKW * 1.2).toFixed(1)} Tons / Year
                    </p>
                    <p className="text-[10px] text-text-muted mt-0.5">Equivalent to planting ~50 trees</p>
                  </div>
                </div>

                <p className="text-[11px] text-text-muted italic text-center">
                  * Generation figures are engineering estimates based on average Indian sun hours (4.5 to 5.2 peak sun hours/day). Actual output varies with geographical orientation, weather, and shading.
                </p>
              </div>
            )}

            {/* Tab 4: FAQs */}
            {activeTab === "faqs" && (
              <div className="py-4 space-y-2">
                {faqs.map((faq, idx) => (
                  <div key={idx} className="rounded-xl border border-border overflow-hidden">
                    <button
                      onClick={() => setOpenFaqIndex(openFaqIndex === idx ? null : idx)}
                      className="w-full flex items-center justify-between p-3.5 text-left text-xs font-bold text-text-primary hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                    >
                      <span>{faq.q}</span>
                      {openFaqIndex === idx ? <FiChevronUp size={16} /> : <FiChevronDown size={16} />}
                    </button>
                    {openFaqIndex === idx && (
                      <div className="p-3.5 pt-0 text-xs text-text-secondary leading-relaxed bg-slate-50/50 dark:bg-slate-800/30">
                        {faq.a}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
