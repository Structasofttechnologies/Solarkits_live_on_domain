import React, { useState, useEffect, useMemo } from "react";
import { useDispatch } from "react-redux";
import axios from "axios";
import {
  FaBoxOpen,
  FaIndustry,
  FaTags,
  FaPlus,
  FaTrash,
  FaPercent,
  FaInfoCircle,
  FaCheckCircle,
  FaCoins,
  FaReceipt,
  FaArrowUp,
  FaArrowDown
} from "react-icons/fa";
import Dialog from "@/components/Dialog";
import Button from "@/components/Button";
import IconButton from "@/components/IconButton";
import CustomInput from "@/components/CustomInput";
import { setAlert } from "@/features/alert.slice";
import { authHeaderObj } from "@/app/authHeader";
import { computeKitFinancials } from "./KitProductPriceBreakdown";

const API_URL = import.meta.env.VITE_API_URL;

/**
 * KitTierPricingModal
 * Allows admin to configure separate per-kit pricing for:
 * 1. Loose Orders (small/mid quantity tiers, e.g. 5, 10, 15, 20 kits)
 * 2. PO (Purchase Order) Orders (bulk quantity tiers, e.g. 200, 500, 1000 kits)
 */
export default function KitTierPricingModal({
  isOpen,
  onClose,
  kit,
  warehouse,
  countryObj,
  moduleUniqueId,
  initialMargins = {},
  skuPrices = {},
  onSaved
}) {
  const dispatch = useDispatch();
  const [activeTab, setActiveTab] = useState("loose"); // 'loose' | 'po'
  const [saving, setSaving] = useState(false);

  // Separate states for Loose and PO tiers
  // Each tier: { quantity: Number, price_per_kit: Number | string, is_preset: boolean }
  const [looseTiers, setLooseTiers] = useState([]);
  const [poTiers, setPoTiers] = useState([]);

  // New Custom Tier Input States
  const [customLooseQty, setCustomLooseQty] = useState("");
  const [customPoQty, setCustomPoQty] = useState("");

  // Calculate Base Financials for reference (1-kit baseline price)
  const kitFinancials = useMemo(() => {
    return computeKitFinancials(kit, skuPrices, initialMargins);
  }, [kit, skuPrices, initialMargins]);

  // Baseline reference selling price per kit (including GST if set)
  const baselineKitPrice = useMemo(() => {
    if (!kitFinancials) return 0;
    if (kitFinancials.totalWithGst > 0) return Math.round(kitFinancials.totalWithGst);
    if (kitFinancials.standardSellingPrice > 0) return Math.round(kitFinancials.standardSellingPrice);
    if (kitFinancials.totalBaseCost > 0) return Math.round(kitFinancials.totalBaseCost);
    return 0;
  }, [kitFinancials]);

  // Initialize or synchronize tiers when modal opens or kit changes
  useEffect(() => {
    if (!isOpen || !kit) return;

    // 1. Prepare Loose Tiers
    // Fetch preset quantities from kit.loose_order_quantities
    const rawLoosePresets = Array.isArray(kit.loose_order_quantities)
      ? kit.loose_order_quantities.map(Number).filter((n) => !isNaN(n) && n > 0)
      : [];

    const existingLoosePricing = Array.isArray(initialMargins.loose_order_pricing)
      ? initialMargins.loose_order_pricing
      : [];

    const looseMap = new Map();

    // First populate from saved pricing
    existingLoosePricing.forEach((entry) => {
      const q = Number(entry.quantity);
      if (q > 0) {
        looseMap.set(q, {
          quantity: q,
          price_per_kit: entry.price_per_kit !== undefined ? entry.price_per_kit : "",
          is_preset: rawLoosePresets.includes(q)
        });
      }
    });

    // Next, make sure all preset quantities are present in the list
    rawLoosePresets.forEach((q) => {
      if (!looseMap.has(q)) {
        looseMap.set(q, {
          quantity: q,
          price_per_kit: "",
          is_preset: true
        });
      }
    });

    const sortedLoose = Array.from(looseMap.values()).sort((a, b) => a.quantity - b.quantity);
    setLooseTiers(sortedLoose);

    // 2. Prepare PO Tiers
    // Fetch preset quantities from kit.order_quantities
    const rawPoPresets = Array.isArray(kit.order_quantities)
      ? kit.order_quantities.map(Number).filter((n) => !isNaN(n) && n > 0)
      : [];

    const existingPoPricing = Array.isArray(initialMargins.po_order_pricing)
      ? initialMargins.po_order_pricing
      : [];

    const poMap = new Map();

    // Populate from saved pricing
    existingPoPricing.forEach((entry) => {
      const q = Number(entry.quantity);
      if (q > 0) {
        poMap.set(q, {
          quantity: q,
          price_per_kit: entry.price_per_kit !== undefined ? entry.price_per_kit : "",
          is_preset: rawPoPresets.includes(q)
        });
      }
    });

    // Ensure all PO preset quantities are present
    rawPoPresets.forEach((q) => {
      if (!poMap.has(q)) {
        poMap.set(q, {
          quantity: q,
          price_per_kit: "",
          is_preset: true
        });
      }
    });

    const sortedPo = Array.from(poMap.values()).sort((a, b) => a.quantity - b.quantity);
    setPoTiers(sortedPo);
  }, [isOpen, kit, initialMargins]);

  // Update Loose Tier price handler
  const handleLoosePriceChange = (quantity, value) => {
    setLooseTiers((prev) =>
      prev.map((t) => (t.quantity === quantity ? { ...t, price_per_kit: value } : t))
    );
  };

  // Update PO Tier price handler
  const handlePoPriceChange = (quantity, value) => {
    setPoTiers((prev) =>
      prev.map((t) => (t.quantity === quantity ? { ...t, price_per_kit: value } : t))
    );
  };

  // Delete a tier
  const handleDeleteLooseTier = (quantity) => {
    setLooseTiers((prev) => prev.filter((t) => t.quantity !== quantity));
  };

  const handleDeletePoTier = (quantity) => {
    setPoTiers((prev) => prev.filter((t) => t.quantity !== quantity));
  };

  // Add custom Loose Tier
  const handleAddCustomLooseTier = (e) => {
    if (e) e.preventDefault();
    const qty = parseInt(customLooseQty, 10);
    if (isNaN(qty) || qty <= 0) {
      dispatch(setAlert({ type: "warning", message: "Please enter a valid positive quantity" }));
      return;
    }
    if (looseTiers.some((t) => t.quantity === qty)) {
      dispatch(setAlert({ type: "warning", message: `Tier for ${qty} kits already exists` }));
      return;
    }
    setLooseTiers((prev) =>
      [...prev, { quantity: qty, price_per_kit: "", is_preset: false }].sort(
        (a, b) => a.quantity - b.quantity
      )
    );
    setCustomLooseQty("");
  };

  // Add custom PO Tier
  const handleAddCustomPoTier = (e) => {
    if (e) e.preventDefault();
    const qty = parseInt(customPoQty, 10);
    if (isNaN(qty) || qty <= 0) {
      dispatch(setAlert({ type: "warning", message: "Please enter a valid positive quantity" }));
      return;
    }
    if (poTiers.some((t) => t.quantity === qty)) {
      dispatch(setAlert({ type: "warning", message: `Tier for ${qty} kits already exists` }));
      return;
    }
    setPoTiers((prev) =>
      [...prev, { quantity: qty, price_per_kit: "", is_preset: false }].sort(
        (a, b) => a.quantity - b.quantity
      )
    );
    setCustomPoQty("");
  };

  // Quick helper: Prefill all empty tiers with baseline price
  const handlePrefillBaseline = (type) => {
    if (baselineKitPrice <= 0) {
      dispatch(setAlert({ type: "warning", message: "Baseline price is not configured for this kit yet." }));
      return;
    }
    if (type === "loose") {
      setLooseTiers((prev) =>
        prev.map((t) => ({
          ...t,
          price_per_kit:
            t.price_per_kit === "" || t.price_per_kit === undefined
              ? baselineKitPrice
              : t.price_per_kit
        }))
      );
    } else {
      setPoTiers((prev) =>
        prev.map((t) => ({
          ...t,
          price_per_kit:
            t.price_per_kit === "" || t.price_per_kit === undefined
              ? baselineKitPrice
              : t.price_per_kit
        }))
      );
    }
    dispatch(setAlert({ type: "info", message: "Filled empty tiers with baseline 1-kit price" }));
  };

  // Save Pricing Tiers to Backend
  const handleSaveTiers = async () => {
    if (!warehouse || !countryObj || !kit) return;

    // Filter and sanitize loose order pricing
    const formattedLoosePricing = looseTiers
      .filter((t) => t.price_per_kit !== "" && t.price_per_kit !== null && !isNaN(Number(t.price_per_kit)))
      .map((t) => {
        const unitPrice = Number(t.price_per_kit);
        const discountAmt = baselineKitPrice > 0 ? Math.max(0, baselineKitPrice - unitPrice) : 0;
        return {
          quantity: Number(t.quantity),
          price_per_kit: unitPrice,
          discount_amount: discountAmt
        };
      })
      .sort((a, b) => a.quantity - b.quantity);

    // Filter and sanitize PO order pricing
    const formattedPoPricing = poTiers
      .filter((t) => t.price_per_kit !== "" && t.price_per_kit !== null && !isNaN(Number(t.price_per_kit)))
      .map((t) => {
        const unitPrice = Number(t.price_per_kit);
        const discountAmt = baselineKitPrice > 0 ? Math.max(0, baselineKitPrice - unitPrice) : 0;
        return {
          quantity: Number(t.quantity),
          price_per_kit: unitPrice,
          discount_amount: discountAmt
        };
      })
      .sort((a, b) => a.quantity - b.quantity);

    setSaving(true);
    try {
      const isIndia = countryObj.iso2?.toLowerCase() === "in";
      const endpointBase = isIndia ? "india/company-margins" : "company-margins";

      const payload = {
        country_id: warehouse.country_id,
        state_id: warehouse.state_id,
        cluster_id: warehouse.cluster_id || warehouse.cluster,
        warehouse_id: warehouse.id || warehouse._id,
        combo_kit_id: kit.id || kit._id,
        showcase_margin: initialMargins.showcase_margin !== undefined ? Number(initialMargins.showcase_margin) : 0,
        standard_margin: initialMargins.standard_margin !== undefined ? Number(initialMargins.standard_margin) : 0,
        po_discounted_margin: initialMargins.po_margin !== undefined ? Number(initialMargins.po_margin) : 0,
        gst_rate: initialMargins.gst_rate !== undefined && initialMargins.gst_rate !== "" ? Number(initialMargins.gst_rate) : null,
        loose_order_pricing: formattedLoosePricing,
        po_order_pricing: formattedPoPricing
      };

      const res = await axios.post(
        `${API_URL}/solarshop/${endpointBase}/save?unique_id=${moduleUniqueId}&req_for=add`,
        payload,
        { headers: authHeaderObj() }
      );

      if (res.data?.status === "success" || res.status === 200) {
        dispatch(
          setAlert({
            type: "success",
            message: `Pricing tiers saved successfully (${formattedLoosePricing.length} Loose, ${formattedPoPricing.length} PO)`
          })
        );
        if (onSaved) {
          onSaved({
            loose_order_pricing: formattedLoosePricing,
            po_order_pricing: formattedPoPricing
          });
        }
        onClose();
      }
    } catch (err) {
      console.error("Error saving kit pricing tiers:", err);
      dispatch(
        setAlert({
          type: "error",
          message: err.response?.data?.message || "Failed to save pricing tiers"
        })
      );
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen || !kit) return null;

  const activeTiers = activeTab === "loose" ? looseTiers : poTiers;

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Configure Loose & PO Order Tier Pricing"
      size="xl"
    >
      <div className="space-y-6 pt-1">
        {/* Kit & Warehouse Overview Header Card */}
        <div className="bg-surface-hover/50 rounded-2xl p-4 sm:p-5 border border-border shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-bold uppercase tracking-wider text-[9px] px-2 py-0.5 rounded-md bg-primary/10 text-primary border border-primary/20">
                Combo Kit
              </span>
              <span className="text-[10px] text-text-muted font-bold">
                Warehouse: {warehouse?.warehouse_code || warehouse?.name || "N/A"}
              </span>
            </div>
            <h3 className="text-base font-black text-text-primary uppercase tracking-wide">
              {kit.name}
            </h3>
            <p className="text-xs text-text-muted font-bold">
              Blueprint: {kit.solar_kit_id?.name || "N/A"} • Capacity: {kit.capacity || 0} kW
            </p>
          </div>

          {/* Reference Price Metrics */}
          <div className="flex items-center gap-3 bg-surface p-3 rounded-xl border border-border/80 shrink-0">
            <div>
              <span className="block text-[9px] uppercase font-black tracking-wider text-text-muted">
                Kit Base Cost
              </span>
              <span className="text-xs font-mono font-black text-text-secondary">
                ₹{Number(kitFinancials?.totalBaseCost || 0).toLocaleString("en-IN")}
              </span>
            </div>
            <div className="h-7 w-px bg-border"></div>
            <div>
              <span className="block text-[9px] uppercase font-black tracking-wider text-primary">
                1-Kit Baseline Price
              </span>
              <span className="text-sm font-mono font-black text-primary">
                {baselineKitPrice > 0 ? `₹${Number(baselineKitPrice).toLocaleString("en-IN")}` : "₹0"}
              </span>
              <span className="text-[8px] font-bold text-text-muted block">
                {baselineKitPrice > 0
                  ? (kitFinancials?.gstRatePct > 0 ? `Incl. ${kitFinancials.gstRatePct}% GST` : "Excl. GST")
                  : "Price Not Configured"}
              </span>
            </div>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-border bg-surface-hover/40 p-1.5 rounded-xl gap-2">
          <button
            type="button"
            onClick={() => setActiveTab("loose")}
            className={`flex-1 flex items-center justify-center gap-2.5 py-3 px-4 rounded-lg text-xs font-black uppercase tracking-wider transition-all cursor-pointer border-none outline-none ${
              activeTab === "loose"
                ? "bg-sky-600 text-white shadow-md shadow-sky-600/25"
                : "text-text-secondary hover:bg-surface-hover hover:text-text-primary"
            }`}
          >
            <FaBoxOpen size={15} />
            Loose Orders Pricing
            <span
              className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold ${
                activeTab === "loose" ? "bg-white/20 text-white" : "bg-border text-text-muted"
              }`}
            >
              {looseTiers.length} Tiers
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("po")}
            className={`flex-1 flex items-center justify-center gap-2.5 py-3 px-4 rounded-lg text-xs font-black uppercase tracking-wider transition-all cursor-pointer border-none outline-none ${
              activeTab === "po"
                ? "bg-amber-600 text-white shadow-md shadow-amber-600/25"
                : "text-text-secondary hover:bg-surface-hover hover:text-text-primary"
            }`}
          >
            <FaIndustry size={15} />
            PO (Purchase Order) Pricing
            <span
              className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold ${
                activeTab === "po" ? "bg-white/20 text-white" : "bg-border text-text-muted"
              }`}
            >
              {poTiers.length} Tiers
            </span>
          </button>
        </div>

        {/* Description Banner */}
        <div
          className={`p-3.5 rounded-xl border flex items-center justify-between text-xs font-medium gap-3 ${
            activeTab === "loose"
              ? "bg-sky-500/10 border-sky-500/20 text-sky-900 dark:text-sky-200"
              : "bg-amber-500/10 border-amber-500/20 text-amber-900 dark:text-amber-200"
          }`}
        >
          <div className="flex items-center gap-2.5">
            <FaInfoCircle className="shrink-0 text-sm opacity-80" />
            <span>
              {activeTab === "loose" ? (
                <>
                  Set custom per-kit prices for <strong>Loose Orders</strong> (e.g. 5 kits, 10 kits, 15 kits). Quantities are fetched from the Combo Kit configuration.
                </>
              ) : (
                <>
                  Set custom per-kit prices for <strong>PO Orders</strong> (e.g. 200 kits, 500 kits, 1000 kits). Quantities are fetched from the Combo Kit configuration.
                </>
              )}
            </span>
          </div>

          {baselineKitPrice > 0 && (
            <button
              type="button"
              onClick={() => handlePrefillBaseline(activeTab)}
              className="text-[11px] font-bold underline hover:opacity-80 shrink-0 cursor-pointer"
            >
              Prefill Baseline Price (₹{Number(baselineKitPrice).toLocaleString("en-IN")})
            </button>
          )}
        </div>

        {/* Pricing Tiers Table */}
        <div className="bg-surface rounded-xl border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-surface-hover/70 text-text-muted font-black uppercase tracking-wider text-[10px] border-b border-border">
                  <th className="px-4 py-3 w-[22%]">Order Quantity</th>
                  <th className="px-4 py-3 w-[28%]">Per-Kit Price (₹)</th>
                  <th className="px-4 py-3 w-[22%]">Savings vs Baseline</th>
                  <th className="px-4 py-3 w-[22%] text-right">Total Order Value (₹)</th>
                  <th className="px-4 py-3 w-[6%] text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {activeTiers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-text-muted">
                      <div className="flex flex-col items-center gap-2">
                        <FaTags className="text-3xl opacity-30 text-text-muted" />
                        <p className="font-bold text-xs text-text-secondary">
                          No quantity tiers configured yet for {activeTab === "loose" ? "Loose Orders" : "PO Orders"}.
                        </p>
                        <p className="text-[11px] text-text-muted">
                          Use the form below to add quantity tiers for this combo kit.
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  activeTiers.map((tier) => {
                    const priceNum = Number(tier.price_per_kit);
                    const hasValidPrice =
                      tier.price_per_kit !== "" &&
                      tier.price_per_kit !== null &&
                      !isNaN(priceNum) &&
                      priceNum >= 0;

                    const totalOrderAmt = hasValidPrice ? tier.quantity * priceNum : 0;
                    const diff = hasValidPrice && baselineKitPrice > 0 ? baselineKitPrice - priceNum : 0;
                    const discountPercent =
                      hasValidPrice && baselineKitPrice > 0 ? (diff / baselineKitPrice) * 100 : 0;

                    return (
                      <tr
                        key={tier.quantity}
                        className="hover:bg-surface-hover/40 transition-colors duration-150"
                      >
                        {/* Quantity Badge */}
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-2">
                            <span
                              className={`px-3 py-1.5 rounded-xl font-mono font-black text-xs border shadow-2xs ${
                                activeTab === "loose"
                                  ? "bg-sky-500/10 text-sky-700 border-sky-500/25"
                                  : "bg-amber-500/10 text-amber-800 border-amber-500/25"
                              }`}
                            >
                              {tier.quantity} KITS
                            </span>
                            {tier.is_preset && (
                              <span
                                className="text-[9px] font-bold text-text-muted uppercase"
                                title="Preset from Combo Kit definition"
                              >
                                (Preset)
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Price Per Kit Input */}
                        <td className="px-4 py-3.5">
                          <div className="relative max-w-xs">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono font-bold text-xs text-text-muted">
                              ₹
                            </span>
                            <input
                              type="number"
                              min="0"
                              step="1"
                              placeholder={baselineKitPrice > 0 ? `e.g. ${baselineKitPrice}` : "Enter per-kit price"}
                              value={tier.price_per_kit}
                              onChange={(e) =>
                                activeTab === "loose"
                                  ? handleLoosePriceChange(tier.quantity, e.target.value)
                                  : handlePoPriceChange(tier.quantity, e.target.value)
                              }
                              className="w-full pl-7 pr-3 py-2 bg-surface rounded-xl border border-border text-xs font-mono font-black text-text-primary focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all shadow-2xs"
                            />
                          </div>
                        </td>

                        {/* Savings / Discount Badge */}
                        <td className="px-4 py-3.5">
                          {hasValidPrice ? (
                            baselineKitPrice > 0 ? (
                              diff > 0 ? (
                                <div className="flex flex-col">
                                  <span className="inline-flex items-center gap-1 text-[11px] font-black text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-lg border border-emerald-500/20 w-fit">
                                    <FaArrowDown size={9} /> ₹{diff.toLocaleString("en-IN")}/kit OFF
                                  </span>
                                  <span className="text-[10px] text-emerald-600/80 font-bold mt-0.5">
                                    {discountPercent.toFixed(1)}% discount
                                  </span>
                                </div>
                              ) : diff < 0 ? (
                                <span className="inline-flex items-center gap-1 text-[11px] font-black text-rose-600 bg-rose-500/10 px-2 py-0.5 rounded-lg border border-rose-500/20 w-fit">
                                  <FaArrowUp size={9} /> +₹{Math.abs(diff).toLocaleString("en-IN")}/kit higher
                                </span>
                              ) : (
                                <span className="text-[11px] font-bold text-text-muted">
                                  Standard Base Price
                                </span>
                              )
                            ) : (
                              <span className="text-[10px] text-text-muted italic">
                                Baseline not set
                              </span>
                            )
                          ) : (
                            <span className="text-[11px] font-bold text-text-muted italic">
                              Price not set
                            </span>
                          )}
                        </td>

                        {/* Total Order Amount */}
                        <td className="px-4 py-3.5 text-right">
                          <div className="flex flex-col items-end">
                            <span className="font-mono font-black text-xs text-text-primary">
                              {hasValidPrice
                                ? `₹${totalOrderAmt.toLocaleString("en-IN")}`
                                : "—"}
                            </span>
                            {hasValidPrice && (
                              <span className="text-[9px] text-text-muted font-bold mt-0.5">
                                {tier.quantity} × ₹{priceNum.toLocaleString("en-IN")}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Delete action */}
                        <td className="px-4 py-3.5 text-center">
                          <button
                            type="button"
                            onClick={() =>
                              activeTab === "loose"
                                ? handleDeleteLooseTier(tier.quantity)
                                : handleDeletePoTier(tier.quantity)
                            }
                            className="text-text-muted hover:text-rose-600 transition-colors p-1.5 rounded-lg hover:bg-rose-500/10 cursor-pointer"
                            title="Remove tier"
                          >
                            <FaTrash size={12} />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Add Custom Quantity Tier Section */}
          <div className="p-4 bg-surface-hover/30 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-3">
            <span className="text-xs font-bold text-text-muted flex items-center gap-1.5">
              <FaPlus size={11} className="text-primary" />
              Add custom {activeTab === "loose" ? "Loose" : "PO"} quantity tier:
            </span>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <input
                type="number"
                min="1"
                placeholder="e.g. 25"
                value={activeTab === "loose" ? customLooseQty : customPoQty}
                onChange={(e) =>
                  activeTab === "loose"
                    ? setCustomLooseQty(e.target.value)
                    : setCustomPoQty(e.target.value)
                }
                className="w-28 px-3 py-1.5 bg-surface rounded-xl border border-border text-xs font-mono font-black text-text-primary focus:border-primary outline-none"
              />
              <span className="text-xs font-bold text-text-muted">KITS</span>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={
                  activeTab === "loose" ? handleAddCustomLooseTier : handleAddCustomPoTier
                }
                className="rounded-xl text-xs font-black uppercase tracking-wider whitespace-nowrap"
              >
                + Add Tier
              </Button>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-border">
          <div className="flex items-center gap-2 text-xs text-text-muted font-bold">
            <FaCheckCircle className="text-success" />
            <span>
              Total configured: <strong>{looseTiers.filter((t) => t.price_per_kit !== "").length} Loose</strong> & <strong>{poTiers.filter((t) => t.price_per_kit !== "").length} PO</strong> pricing tiers
            </span>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              disabled={saving}
              className="rounded-xl text-xs font-bold flex-1 sm:flex-initial"
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="primary"
              onClick={handleSaveTiers}
              loading={saving}
              className="rounded-xl text-xs font-black uppercase tracking-wider shadow-lg flex-1 sm:flex-initial"
            >
              Save Pricing Tiers
            </Button>
          </div>
        </div>
      </div>
    </Dialog>
  );
}
