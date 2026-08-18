import React, { useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  FiSliders,
  FiCheckCircle,
  FiShoppingCart,
  FiRefreshCw,
  FiInfo,
  FiArrowRight,
  FiSun,
  FiZap,
  FiCheck,
  FiShield
} from "react-icons/fi";
import { FaSolarPanel, FaBolt, FaWarehouse, FaLeaf } from "react-icons/fa";
import { addCustomKitToCart, setShowAuthDialog } from "@/features/slice";
import Button from "@/components/Button";

export default function CustomComboKit() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { isAuthenticated } = useSelector((state) => state.auth_slice);
  const availableKits = useSelector((state) => state.slice.availableKits || []);

  const [formData, setFormData] = useState({
    industryType: "Residential Solar Systems",
    category: "Rooftop Residential",
    subcategory: "Single Phase Residential",
    systemType: "On-Grid (Net Metering)",
    projectRange: "3 kW",
    panelBrand: "Tata Power Solar",
    panelWattage: "550W",
    panelTechnology: "Mono PERC Half-Cut",
    inverterBrand: "Growatt",
    inverterType: "Single Phase MPPT String",
    structureType: "Anodized Aluminum Rooftop Rail",
    bosSafetyPackage: "Turnkey ACDB/DCDB + Type-II SPD Surge Protection",
  });

  const [calculated, setCalculated] = useState({
    capacityKW: 3,
    panelsCount: 6,
    dailyUnits: "12 - 14 Units/Day",
    annualGeneration: "4,600 kWh/Year",
    totalCost: 145000,
    marketPrice: 175000,
    annualSavings: 38000,
    co2Offset: "3.6 Tons/Year",
    roi: "3.8 Years",
  });

  const handleChange = (key, value) => {
    setFormData((prev) => {
      const updated = { ...prev, [key]: value };
      
      // Auto-recalculate specs
      const capNum = parseFloat(updated.projectRange) || 3;
      const wattNum = parseInt(updated.panelWattage) || 550;
      const panelsNeeded = Math.ceil((capNum * 1000) / wattNum);
      const estimatedCost = Math.round(capNum * 48000 + (updated.panelBrand === "Tata Power Solar" ? 5000 : 0));

      setCalculated({
        capacityKW: capNum,
        panelsCount: panelsNeeded,
        dailyUnits: `${(capNum * 4.2).toFixed(0)} - ${(capNum * 4.8).toFixed(0)} Units/Day`,
        annualGeneration: `${(capNum * 1480).toLocaleString("en-IN")} kWh/Year`,
        totalCost: estimatedCost,
        marketPrice: Math.round(estimatedCost * 1.18),
        annualSavings: Math.round(capNum * 1480 * 8.2),
        co2Offset: `${(capNum * 1.2).toFixed(1)} Tons/Year`,
        roi: "3.8 Years",
      });

      return updated;
    });
  };

  const handleAddToCart = () => {
    if (!isAuthenticated) {
      dispatch(setShowAuthDialog(true));
      return;
    }

    dispatch(
      addCustomKitToCart({
        id: `custom-kit-${Date.now()}`,
        cartItemId: `custom-kit-${Date.now()}`,
        kitName: `Custom ${formData.projectRange} Solar Kit (${formData.panelBrand} + ${formData.inverterBrand})`,
        capacityKW: calculated.capacityKW,
        qty: 1,
        ourPrice: calculated.totalCost,
        marketPrice: calculated.marketPrice,
        is_custom: true,
        productTier: "Custom Engineered",
        usageType: formData.industryType,
        panelBrand: formData.panelBrand,
        inverter: formData.inverterBrand,
        numberOfPanels: calculated.panelsCount,
        panelWattage: formData.panelWattage,
        availableStock: 999,
        inStock: true,
      })
    );
    navigate("/cart");
  };

  return (
    <div className="min-h-screen bg-bg text-text-primary py-6 max-w-7xl mx-auto px-4 sm:px-6 space-y-6">
      
      {/* Breadcrumbs */}
      <nav className="text-xs text-text-muted flex items-center gap-1.5" aria-label="Breadcrumb">
        <Link to="/" className="hover:text-primary transition-colors">Home</Link>
        <span>/</span>
        <Link to="/shop" className="hover:text-primary transition-colors">Solar Shop</Link>
        <span>/</span>
        <span className="text-text-primary font-bold">Customize Kit Configuration</span>
      </nav>

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-primary via-primary-end to-primary-navy rounded-3xl p-6 sm:p-8 text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight font-heading">
              Customize Kit Configuration
            </h1>
            <p className="text-xs sm:text-sm text-slate-200 max-w-2xl leading-relaxed">
              Manage custom brand configurations of complete solar power kit components and accessories for India.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="bg-white/15 backdrop-blur-md border border-white/25 px-5 py-3 rounded-2xl text-center shadow-xs">
              <span className="text-[10px] uppercase font-bold text-slate-300 block tracking-wider">
                Configured Custom Kits
              </span>
              <span className="text-2xl font-black text-white">
                {availableKits.length}
              </span>
              <span className="text-[10px] text-emerald-300 block font-semibold">Active Custom Options</span>
            </div>

            <Button
              variant="secondary"
              size="lg"
              onClick={() => navigate("/shop")}
              className="font-bold py-3.5 px-5 rounded-2xl shadow-md cursor-pointer whitespace-nowrap"
            >
              Browse Pre-Configured Kits
            </Button>
          </div>
        </div>
      </div>

      {/* Top 5-Hierarchy Filter Row (Matching Admin Panel) */}
      <div className="bg-surface rounded-3xl p-5 sm:p-6 border border-border shadow-xs">
        <h3 className="text-xs font-extrabold uppercase text-text-secondary tracking-wider mb-4 flex items-center gap-2">
          <FiSliders className="text-primary" size={15} />
          <span>Select Solar System Hierarchy</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5">
          
          {/* 1. Industry Type */}
          <div>
            <label className="block text-[11px] font-bold text-text-secondary mb-1">
              Industry Type
            </label>
            <select
              value={formData.industryType}
              onChange={(e) => handleChange("industryType", e.target.value)}
              className="w-full px-3 py-2 bg-surface-hover border border-border rounded-xl text-xs text-text-primary font-semibold focus:outline-none focus:border-primary cursor-pointer"
            >
              <option value="Residential Solar Systems">Residential Solar Systems</option>
              <option value="Commercial Solar Systems">Commercial Solar Systems</option>
              <option value="Industrial Solar Systems">Industrial Solar Systems</option>
              <option value="Agricultural Solar Systems">Agricultural Solar Systems</option>
            </select>
          </div>

          {/* 2. Category */}
          <div>
            <label className="block text-[11px] font-bold text-text-secondary mb-1">
              Category
            </label>
            <select
              value={formData.category}
              onChange={(e) => handleChange("category", e.target.value)}
              className="w-full px-3 py-2 bg-surface-hover border border-border rounded-xl text-xs text-text-primary font-semibold focus:outline-none focus:border-primary cursor-pointer"
            >
              <option value="Rooftop Residential">Rooftop Residential</option>
              <option value="Rooftop Commercial">Rooftop Commercial</option>
              <option value="Ground Mounted Solar">Ground Mounted Solar</option>
              <option value="Solar Carport">Solar Carport</option>
            </select>
          </div>

          {/* 3. Subcategory */}
          <div>
            <label className="block text-[11px] font-bold text-text-secondary mb-1">
              Subcategory
            </label>
            <select
              value={formData.subcategory}
              onChange={(e) => handleChange("subcategory", e.target.value)}
              className="w-full px-3 py-2 bg-surface-hover border border-border rounded-xl text-xs text-text-primary font-semibold focus:outline-none focus:border-primary cursor-pointer"
            >
              <option value="Single Phase Residential">Single Phase Residential</option>
              <option value="Three Phase Residential">Three Phase Residential</option>
              <option value="Commercial Shed">Commercial Shed</option>
              <option value="High Tension Industrial">High Tension Industrial</option>
            </select>
          </div>

          {/* 4. System Type */}
          <div>
            <label className="block text-[11px] font-bold text-text-secondary mb-1">
              System Type
            </label>
            <select
              value={formData.systemType}
              onChange={(e) => handleChange("systemType", e.target.value)}
              className="w-full px-3 py-2 bg-surface-hover border border-border rounded-xl text-xs text-text-primary font-semibold focus:outline-none focus:border-primary cursor-pointer"
            >
              <option value="On-Grid (Net Metering)">On-Grid (Net Metering)</option>
              <option value="Off-Grid (Battery Storage)">Off-Grid (Battery Storage)</option>
              <option value="Hybrid (Storage + Net-Metering)">Hybrid (Storage + Net-Metering)</option>
            </select>
          </div>

          {/* 5. Project Range */}
          <div>
            <label className="block text-[11px] font-bold text-text-secondary mb-1">
              Project Range (Capacity)
            </label>
            <select
              value={formData.projectRange}
              onChange={(e) => handleChange("projectRange", e.target.value)}
              className="w-full px-3 py-2 bg-surface-hover border border-border rounded-xl text-xs text-text-primary font-semibold focus:outline-none focus:border-primary cursor-pointer"
            >
              <option value="1 kW">1 kW (Small Home)</option>
              <option value="2 kW">2 kW (2 BHK)</option>
              <option value="3 kW">3 kW (Most Popular)</option>
              <option value="5 kW">5 kW (Large Villa)</option>
              <option value="10 kW">10 kW (Commercial)</option>
              <option value="15 kW">15 kW (Enterprise)</option>
            </select>
          </div>

        </div>
      </div>

      {/* Main Grid: Custom Component Pickers + Live Calculation Output */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: Brand & Component Inclusions */}
        <div className="lg:col-span-2 space-y-5">
          
          {/* 1. Solar Panels Selection */}
          <div className="bg-surface rounded-3xl p-6 border border-border shadow-xs space-y-4">
            <div className="flex items-center gap-3 pb-3 border-b border-border">
              <div className="w-10 h-10 rounded-2xl bg-primary-soft text-primary flex items-center justify-center">
                <FaSolarPanel size={20} />
              </div>
              <div>
                <h3 className="text-base font-bold text-text-primary">1. Solar PV Modules</h3>
                <p className="text-xs text-text-secondary">Select module brand and wattage technology</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-text-secondary mb-1">Panel Brand</label>
                <select
                  value={formData.panelBrand}
                  onChange={(e) => handleChange("panelBrand", e.target.value)}
                  className="w-full px-3 py-2.5 bg-surface-hover border border-border rounded-xl text-xs font-semibold text-text-primary"
                >
                  <option value="Tata Power Solar">Tata Power Solar</option>
                  <option value="Waaree Energies">Waaree Energies</option>
                  <option value="Adani Solar">Adani Solar</option>
                  <option value="Vikram Solar">Vikram Solar</option>
                  <option value="RenewSys">RenewSys</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-text-secondary mb-1">Module Wattage</label>
                <select
                  value={formData.panelWattage}
                  onChange={(e) => handleChange("panelWattage", e.target.value)}
                  className="w-full px-3 py-2.5 bg-surface-hover border border-border rounded-xl text-xs font-semibold text-text-primary"
                >
                  <option value="550W">550W High-Output</option>
                  <option value="540W">540W Mono PERC</option>
                  <option value="580W">580W TopCon N-Type</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-text-secondary mb-1">Cell Technology</label>
                <select
                  value={formData.panelTechnology}
                  onChange={(e) => handleChange("panelTechnology", e.target.value)}
                  className="w-full px-3 py-2.5 bg-surface-hover border border-border rounded-xl text-xs font-semibold text-text-primary"
                >
                  <option value="Mono PERC Half-Cut">Mono PERC Half-Cut</option>
                  <option value="TopCon Bifacial">TopCon Bifacial</option>
                </select>
              </div>
            </div>
          </div>

          {/* 2. Solar Inverter Selection */}
          <div className="bg-surface rounded-3xl p-6 border border-border shadow-xs space-y-4">
            <div className="flex items-center gap-3 pb-3 border-b border-border">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
                <FaBolt size={20} />
              </div>
              <div>
                <h3 className="text-base font-bold text-text-primary">2. Solar Power Inverter</h3>
                <p className="text-xs text-text-secondary">Select inverter brand with WiFi telemetry monitoring</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-text-secondary mb-1">Inverter Brand</label>
                <select
                  value={formData.inverterBrand}
                  onChange={(e) => handleChange("inverterBrand", e.target.value)}
                  className="w-full px-3 py-2.5 bg-surface-hover border border-border rounded-xl text-xs font-semibold text-text-primary"
                >
                  <option value="Growatt">Growatt (WiFi Integrated)</option>
                  <option value="Solis">Solis (Dual MPPT)</option>
                  <option value="Havells">Havells Solar</option>
                  <option value="Luminous">Luminous Solar</option>
                  <option value="Sungrow">Sungrow Enterprise</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-text-secondary mb-1">Inverter Topology</label>
                <select
                  value={formData.inverterType}
                  onChange={(e) => handleChange("inverterType", e.target.value)}
                  className="w-full px-3 py-2.5 bg-surface-hover border border-border rounded-xl text-xs font-semibold text-text-primary"
                >
                  <option value="Single Phase MPPT String">Single Phase MPPT String</option>
                  <option value="Three Phase MPPT String">Three Phase MPPT String</option>
                  <option value="Hybrid Smart Inverter">Hybrid Smart Inverter</option>
                </select>
              </div>
            </div>
          </div>

          {/* 3. Mounting & Protection Kit Inclusions */}
          <div className="bg-surface rounded-3xl p-6 border border-border shadow-xs space-y-4">
            <div className="flex items-center gap-3 pb-3 border-b border-border">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                <FiShield size={20} />
              </div>
              <div>
                <h3 className="text-base font-bold text-text-primary">3. Complete Turnkey Safety & Mounting Inclusions</h3>
                <p className="text-xs text-text-secondary">Pre-bundled accessories included inside the kit</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-border">
                <p className="font-bold text-text-primary flex items-center gap-1.5">
                  <FiCheck className="text-emerald-500" /> Structure: {formData.structureType}
                </p>
                <p className="text-[11px] text-text-muted mt-1">Wind rated 150 km/h with stainless hardware</p>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-border">
                <p className="font-bold text-text-primary flex items-center gap-1.5">
                  <FiCheck className="text-emerald-500" /> Safety: {formData.bosSafetyPackage}
                </p>
                <p className="text-[11px] text-text-muted mt-1">Includes 4 sq.mm solar cables, MC4, and copper earthing</p>
              </div>
            </div>
          </div>

        </div>

        {/* Right Col: Live Calculation Card & Add to Cart */}
        <div className="lg:col-span-1 space-y-5">
          <div className="bg-surface rounded-3xl p-6 border border-border shadow-xl sticky top-24 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <span className="text-[10px] font-extrabold uppercase text-primary tracking-wider">
                Engineering Summary
              </span>
              <span className="bg-primary text-white text-xs font-black px-2.5 py-0.5 rounded-full">
                {calculated.capacityKW} kW Kit
              </span>
            </div>

            {/* Price block */}
            <div>
              <span className="text-[10px] uppercase font-bold text-text-muted">Estimated Kit Price</span>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className="text-2xl sm:text-3xl font-black text-text-primary">
                  ₹{calculated.totalCost.toLocaleString("en-IN")}
                </span>
                <del className="text-xs text-text-muted font-medium">
                  ₹{calculated.marketPrice.toLocaleString("en-IN")}
                </del>
              </div>
              <p className="text-[11px] text-emerald-600 font-bold mt-1">
                ✓ Includes All Solar Panels, Inverter & Protection Hardware
              </p>
            </div>

            {/* System Breakdown */}
            <div className="space-y-2.5 text-xs border-t border-b border-border py-4">
              <div className="flex justify-between">
                <span className="text-text-secondary">Solar Modules:</span>
                <span className="font-bold text-text-primary">{calculated.panelsCount}x {formData.panelWattage} ({formData.panelBrand})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">Inverter:</span>
                <span className="font-bold text-text-primary">{formData.inverterBrand} {formData.projectRange}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">Daily Generation:</span>
                <span className="font-bold text-primary">{calculated.dailyUnits}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">Annual Bill Savings:</span>
                <span className="font-bold text-emerald-600">~₹{calculated.annualSavings.toLocaleString("en-IN")} / Year</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">Payback Period:</span>
                <span className="font-bold text-amber-600">{calculated.roi}</span>
              </div>
            </div>

            {/* Add to Cart Button */}
            <Button
              variant="primary"
              size="lg"
              fullWidth
              onClick={handleAddToCart}
              leftIcon={<FiShoppingCart size={17} />}
              className="font-bold py-3.5 rounded-2xl shadow-md text-sm"
            >
              Add Customized Kit to Cart
            </Button>
          </div>
        </div>

      </div>

    </div>
  );
}
