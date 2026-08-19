import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  FiGrid,
  FiList,
  FiSearch,
  FiX,
  FiShoppingCart,
  FiDollarSign,
  FiTag,
  FiPackage,
  FiPercent,
  FiTruck,
  FiShield,
  FiAward,
  FiStar,
  FiHome,
  FiZap,
  FiTrendingUp,
  FiPieChart,
  FiArrowRight,
  FiChevronDown,
  FiChevronUp,
  FiCheckCircle,
} from "react-icons/fi";
import { FaGem, FaSolarPanel } from "react-icons/fa";
import { useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import SelectedKitCard from "@/pages/dashboard/components/SelectedKitCard";
import KitCard from "@/pages/dashboard/components/KitCard";
import Dialog from "@/components/Dialog";
import GstVerificationDialog from "@/components/GstVerificationDialog";
import Button from "@/components/Button";
import IconButton from "@/components/IconButton";
import Dropdown from "@/components/Dropdown";
import CustomInput from "@/components/CustomInput";

export default function PreConfiguredKitOrderCart() {
  const navigate = useNavigate();
  const cart = useSelector((state) => state.slice.cart);
  const selectedDistrict = useSelector((state) => state.slice.selectedDistrict);
  const selectedState = useSelector((state) => state.slice.selectedState);
  const [selected, setSelected] = useState(null);
  const [activeOffers, setActiveOffers] = useState([]);

  // GST State Verification
  const [showGstDialog, setShowGstDialog] = useState(false);
  const [gstStateId, setGstStateId] = useState("");

  const handleProceedToCheckout = async () => {
    const stateId = selectedState?.id || selectedState?._id;
    if (stateId) {
      try {
        const apiBase = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
        const res = await axios.get(`${apiBase}/india/v1/shop/gst/status?state_id=${stateId}`, {
          withCredentials: true,
        });
        if (res.data?.success && !res.data.verified) {
          setGstStateId(stateId);
          setShowGstDialog(true);
          return;
        }
      } catch (err) {
        console.error("GST checkout check failed:", err);
      }
    }
    navigate("/checkout");
  };

  const handleGstVerified = () => {
    setShowGstDialog(false);
    navigate("/checkout");
  };

  const [checkoutSettings, setCheckoutSettings] = useState({
    enable_checkout_timer: true,
    checkout_timer_duration: 20,
    gst_rate: 13.8,
  });

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const apiBase = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
        const res = await axios.get(`${apiBase}/india/v1/shop/checkout-settings`);
        if (res.data?.success && res.data.data) {
          setCheckoutSettings(res.data.data);
        }
      } catch (err) {
        console.error("Failed to load checkout settings", err);
      }
    };
    fetchSettings();
  }, []);

  useEffect(() => {
    const fetchActiveOffers = async () => {
      try {
        const apiBase = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
        const distId = selectedDistrict?._id || selectedDistrict?.id || "";
        const res = await axios.get(`${apiBase}/india/v1/shop/active-offers?district_id=${distId}`);
        if (res.data?.success) {
          setActiveOffers(res.data.data || []);
        }
      } catch (error) {
        console.error("Error loading offers in cart:", error);
      }
    };
    fetchActiveOffers();
  }, [selectedDistrict]);

  const bundleOffer = useMemo(() => {
    return activeOffers.find((o) => o.offer_type === "bundle");
  }, [activeOffers]);

  const [selectedKit, setSelectedKit] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState("grid");
  const [sortBy, setSortBy] = useState("default");
  const [showTierBreakdown, setShowTierBreakdown] = useState(false);

  const sortOptions = [
    { value: "default", text: "Default Sorting" },
    { value: "price-low", text: "Price: Low to High" },
    { value: "price-high", text: "Price: High to Low" },
    { value: "capacity", text: "Capacity: High to Low" },
    { value: "discount", text: "Discount: High to Low" },
    { value: "savings", text: "Savings: High to Low" },
    { value: "name-asc", text: "Name: A to Z" },
    { value: "name-desc", text: "Name: Z to A" },
  ];

  const finalKits = useMemo(() => {
    let result = [...cart];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (k) =>
          k.kitName?.toLowerCase().includes(term) ||
          k.usageType?.toLowerCase().includes(term) ||
          k.productTier?.toLowerCase().includes(term) ||
          k.description?.toLowerCase().includes(term) ||
          k.capacityKW?.toString().includes(term)
      );
    }

    if (sortBy === "price-low") {
      result.sort((a, b) => a.ourPrice - b.ourPrice);
    } else if (sortBy === "price-high") {
      result.sort((a, b) => b.ourPrice - a.ourPrice);
    } else if (sortBy === "capacity") {
      result.sort((a, b) => b.capacityKW - a.capacityKW);
    } else if (sortBy === "discount") {
      result.sort((a, b) => {
        const discountA = ((a.marketPrice - a.ourPrice) / a.marketPrice) * 100;
        const discountB = ((b.marketPrice - b.ourPrice) / b.marketPrice) * 100;
        return discountB - discountA;
      });
    } else if (sortBy === "savings") {
      result.sort((a, b) => {
        const savingsA = (a.marketPrice - a.ourPrice) * a.qty;
        const savingsB = (b.marketPrice - b.ourPrice) * b.qty;
        return savingsB - savingsA;
      });
    } else if (sortBy === "name-asc") {
      result.sort((a, b) => a.kitName.localeCompare(b.kitName));
    } else if (sortBy === "name-desc") {
      result.sort((a, b) => b.kitName.localeCompare(a.kitName));
    }

    return result;
  }, [cart, searchTerm, sortBy]);

  const getTaxBreakdown = (amount) => {
    const fallbackRate = Number(checkoutSettings.gst_rate ?? 13.8);
    let taxable = 0;
    let gstAmount = 0;

    cart.forEach((kit) => {
      const itemValue = kit.qty * kit.ourPrice;
      const itemGstRate = Number(kit.gstRate ?? fallbackRate);
      const itemTaxable = Math.round(itemValue / (1 + itemGstRate / 100));
      const itemGst = Math.max(0, itemValue - itemTaxable);
      taxable += itemTaxable;
      gstAmount += itemGst;
    });

    const effectiveRate =
      taxable > 0 ? Number(((gstAmount / taxable) * 100).toFixed(2)) : fallbackRate;

    return {
      taxable: Math.round(amount > 0 ? amount / (1 + effectiveRate / 100) : taxable),
      gstAmount: Math.max(
        0,
        amount - (amount > 0 ? amount / (1 + effectiveRate / 100) : taxable)
      ),
      gstRate: effectiveRate,
    };
  };

  const cartTotals = useMemo(() => {
    const total = cart.reduce((sum, kit) => sum + kit.qty * kit.ourPrice, 0);
    const totalMarketPrice = cart.reduce((sum, kit) => sum + kit.qty * kit.marketPrice, 0);
    const savings = totalMarketPrice - total;
    const totalItems = cart.reduce((sum, kit) => sum + kit.qty, 0);
    const totalKits = cart.length;

    const tierBreakdown = cart.reduce((acc, kit) => {
      const tier = kit.productTier?.toLowerCase() || "basic";
      if (!acc[tier]) {
        acc[tier] = {
          count: 0,
          total: 0,
          items: 0,
          savings: 0,
          tierColor: kit.tierColor || null,
        };
      }
      acc[tier].count += kit.qty;
      acc[tier].items += 1;
      acc[tier].total += kit.qty * kit.ourPrice;
      acc[tier].savings += kit.qty * (kit.marketPrice - kit.ourPrice);
      return acc;
    }, {});

    const totalDeliverySavings = cart.reduce(
      (sum, kit) => sum + (kit.includedDeliveryCharge || 0) * kit.qty,
      0
    );

    const usageBreakdown = cart.reduce((acc, kit) => {
      const type = kit.usageType?.toLowerCase() || "other";
      if (!acc[type]) {
        acc[type] = { count: 0, total: 0, savings: 0 };
      }
      acc[type].count += kit.qty;
      acc[type].total += kit.qty * kit.ourPrice;
      acc[type].savings += kit.qty * (kit.marketPrice - kit.ourPrice);
      return acc;
    }, {});

    const totalSavings = savings + totalDeliverySavings;
    const avgDiscount =
      totalMarketPrice > 0 ? ((totalSavings / totalMarketPrice) * 100).toFixed(1) : 0;
    const { taxable: subtotalExcludingGst, gstAmount, gstRate } = getTaxBreakdown(total);

    return {
      total,
      totalMarketPrice,
      savings,
      totalSavings,
      totalItems,
      totalKits,
      avgDiscount,
      tierBreakdown,
      usageBreakdown,
      totalDeliverySavings,
      gstRate,
      subtotalExcludingGst,
      gstAmount,
    };
  }, [cart, checkoutSettings.gst_rate]);

  const totalKitsQuantity = useMemo(() => {
    return cart.reduce((sum, kit) => sum + kit.qty, 0);
  }, [cart]);

  useEffect(() => {
    setSelectedKit(selected ? cart.find((k) => k.cartItemId === selected) : null);
  }, [selected, cart]);

  const clearAllFilters = () => {
    setSearchTerm("");
    setSortBy("default");
  };

  const getTierColor = (tier) => {
    switch (tier?.toLowerCase()) {
      case "premium":
        return "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/30";
      case "standard":
        return "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/30";
      default:
        return "text-slate-600 bg-slate-50 border-slate-200";
    }
  };

  /* ── Empty Cart State ──────────────────────────────────────────────────── */
  if (cart.length === 0) {
    return (
      <div className="bg-surface rounded-2xl p-12 text-center border border-border shadow-xs max-w-xl mx-auto space-y-4 my-8">
        <div className="w-16 h-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto shadow-inner">
          <FiShoppingCart size={32} />
        </div>
        <div className="space-y-1">
          <h2 className="text-xl font-bold text-text-primary dark:text-info">
            Your Solar Cart is Empty
          </h2>
          <p className="text-xs sm:text-sm text-text-secondary">
            Explore our curated turnkey solar packages configured with high-efficiency PV modules and inverters.
          </p>
        </div>
        <div className="pt-2">
          <Link
            to="/shop"
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-bold shadow-sm transition-all"
          >
            <FaSolarPanel size={14} /> Browse Pre-Configured Solar Kits
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      
      {/* ── Compact Top Summary Bar ────────────────────────────────────────── */}
      <div className="bg-surface rounded-xl border border-border p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-primary/10 text-primary border border-primary/20 shrink-0">
            <FiShoppingCart size={20} />
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-bold text-text-primary dark:text-info flex items-center gap-2">
              <span>Your Solar Kit Cart</span>
              <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
                {cartTotals.totalKits} {cartTotals.totalKits === 1 ? "Kit" : "Kits"}
              </span>
            </h1>
            <p className="text-xs text-text-secondary">
              Review configuration, inventory availability, and input tax credit benefits before checkout.
            </p>
          </div>
        </div>

        {/* Inline Quick Stats */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <div className="px-3 py-1.5 rounded-lg bg-surface-hover border border-border flex items-center gap-1.5">
            <span className="text-text-secondary">Cart Value:</span>
            <strong className="text-text-primary font-mono text-sm">
              ₹{cartTotals.total.toLocaleString("en-IN")}
            </strong>
          </div>

          {cartTotals.totalSavings > 0 && (
            <div className="px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1 font-semibold">
              <FiTag size={13} className="text-emerald-600" />
              <span>Save ₹{cartTotals.totalSavings.toLocaleString("en-IN")} ({cartTotals.avgDiscount}%)</span>
            </div>
          )}
        </div>
      </div>

      {/* ── Two Column Responsive Layout ──────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        
        {/* ── Left Column: Items & Filters (8 Cols) ────────────────────────── */}
        <div className="lg:col-span-8 space-y-4">
          
          {/* Compact Filter & Search Bar */}
          <div className="bg-surface rounded-xl border border-border p-3 shadow-xs space-y-2.5">
            <div className="flex flex-col sm:flex-row gap-2.5 items-center">
              
              {/* Search */}
              <div className="relative flex-1 w-full">
                <CustomInput
                  type="text"
                  name="search"
                  placeholder="Search kit name, type, tier, capacity..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full text-xs"
                  leftIcon={<FiSearch size={16} />}
                  rightIcon={
                    searchTerm && (
                      <IconButton
                        onClick={() => setSearchTerm("")}
                        variant="ghost"
                        size="sm"
                        className="bg-surface hover:bg-surface-hover"
                      >
                        <FiX size={15} />
                      </IconButton>
                    )
                  }
                />
              </div>

              {/* View Toggle */}
              <div className="flex bg-surface-hover rounded-xl p-0.5 border border-border shrink-0">
                <IconButton
                  onClick={() => setViewMode("grid")}
                  variant={viewMode === "grid" ? "primary" : "ghost"}
                  size="sm"
                  className={`rounded-lg ${
                    viewMode === "grid" ? "bg-surface shadow-xs text-primary" : "text-text-secondary"
                  }`}
                  title="Grid View"
                >
                  <FiGrid size={16} />
                </IconButton>
                <IconButton
                  onClick={() => setViewMode("list")}
                  variant={viewMode === "list" ? "primary" : "ghost"}
                  size="sm"
                  className={`rounded-lg ${
                    viewMode === "list" ? "bg-surface shadow-xs text-primary" : "text-text-secondary"
                  }`}
                  title="List View"
                >
                  <FiList size={16} />
                </IconButton>
              </div>

              {/* Sort Dropdown */}
              <div className="w-full sm:w-48 shrink-0">
                <Dropdown
                  value={sortBy}
                  onChange={setSortBy}
                  options={sortOptions}
                  placeholder="Sort by..."
                  className="w-full text-xs"
                />
              </div>

            </div>

            {/* Active Filters */}
            {(searchTerm || sortBy !== "default") && (
              <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-border text-xs">
                <span className="text-text-secondary">Filtered:</span>
                {searchTerm && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-primary/10 text-primary rounded-lg border border-primary/20 text-[11px]">
                    <FiSearch size={12} /> "{searchTerm}"
                    <button onClick={() => setSearchTerm("")} className="ml-1 hover:opacity-75">
                      <FiX size={12} />
                    </button>
                  </span>
                )}
                {sortBy !== "default" && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-surface-hover text-text-primary rounded-lg border border-border text-[11px]">
                    Sort: {sortOptions.find((opt) => opt.value === sortBy)?.text}
                    <button onClick={() => setSortBy("default")} className="ml-1 hover:opacity-75">
                      <FiX size={12} />
                    </button>
                  </span>
                )}
                <Button onClick={clearAllFilters} variant="ghost" size="sm" className="text-xs text-text-secondary">
                  Clear all
                </Button>
              </div>
            )}
          </div>

          {/* Kits Grid / List */}
          {finalKits.length === 0 ? (
            <div className="bg-surface rounded-xl p-10 text-center border border-border shadow-xs space-y-3">
              <FiSearch size={32} className="mx-auto text-text-secondary" />
              <h3 className="text-base font-bold text-text-primary">No matching kits</h3>
              <p className="text-xs text-text-secondary max-w-sm mx-auto">
                No solar kits match your search filter. Try adjusting your query.
              </p>
              <Button onClick={clearAllFilters} variant="primary" size="sm">
                Reset Filters
              </Button>
            </div>
          ) : viewMode === "grid" ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {finalKits.map((kit) => (
                <KitCard
                  key={kit.cartItemId || kit.id}
                  kit={kit}
                  selected={selectedKit?.cartItemId === kit.cartItemId}
                  setSelected={() => setSelected(kit.cartItemId || kit.id)}
                  viewMode={viewMode}
                  isCart={true}
                />
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {finalKits.map((kit) => (
                <KitCard
                  key={kit.cartItemId || kit.id}
                  kit={kit}
                  selected={selectedKit?.cartItemId === kit.cartItemId}
                  setSelected={() => setSelected(kit.cartItemId || kit.id)}
                  viewMode={viewMode}
                  isCart={true}
                />
              ))}
            </div>
          )}

          {/* Collapsible Tier & Category Breakdown Accordion */}
          <div className="bg-surface rounded-xl border border-border overflow-hidden shadow-xs">
            <button
              onClick={() => setShowTierBreakdown(!showTierBreakdown)}
              className="w-full p-3.5 flex items-center justify-between text-left text-xs font-bold text-text-primary hover:bg-surface-hover transition-colors"
            >
              <span className="flex items-center gap-2">
                <FiPieChart className="text-primary" size={15} />
                <span>Kit Breakdown & Category Distribution</span>
              </span>
              {showTierBreakdown ? <FiChevronUp size={16} /> : <FiChevronDown size={16} />}
            </button>

            {showTierBreakdown && (
              <div className="p-4 pt-0 border-t border-border grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {/* By Tier */}
                <div className="space-y-2">
                  <h4 className="font-semibold text-text-secondary uppercase text-[10px] tracking-wider">
                    Solar Kit Tier
                  </h4>
                  {Object.entries(cartTotals.tierBreakdown).map(([tier, data]) => (
                    <div key={tier} className={`p-2.5 rounded-lg border flex justify-between items-center ${getTierColor(tier)}`}>
                      <div className="flex items-center gap-1.5 capitalize font-medium">
                        {tier === "premium" ? <FaGem size={12} className="text-amber-500" /> : <FiStar size={12} />}
                        <span>{tier} ({data.count} items)</span>
                      </div>
                      <strong className="font-mono">₹{data.total.toLocaleString("en-IN")}</strong>
                    </div>
                  ))}
                </div>

                {/* By Usage */}
                <div className="space-y-2">
                  <h4 className="font-semibold text-text-secondary uppercase text-[10px] tracking-wider">
                    Application Type
                  </h4>
                  {Object.entries(cartTotals.usageBreakdown).map(([type, data]) => (
                    <div key={type} className="p-2.5 rounded-lg border border-border bg-surface-hover flex justify-between items-center">
                      <span className="capitalize font-medium text-text-primary">{type} ({data.count} items)</span>
                      <strong className="font-mono text-text-primary">₹{data.total.toLocaleString("en-IN")}</strong>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

        </div>

        {/* ── Right Column: Sticky Order Summary (4 Cols) ─────────────────── */}
        <div className="lg:col-span-4 space-y-4 sticky top-20">
          
          <div className="bg-surface border border-border rounded-2xl p-5 shadow-xs space-y-4">
            
            <h2 className="font-bold text-sm text-text-primary dark:text-info uppercase tracking-wider flex items-center justify-between border-b border-border pb-3">
              <span className="flex items-center gap-2">
                <FiTrendingUp className="text-primary" />
                <span>Order Summary</span>
              </span>
              <span className="text-xs font-mono font-medium text-text-secondary">
                {cartTotals.totalItems} items
              </span>
            </h2>

            {/* Bundle Offer Progress if present */}
            {bundleOffer && (
              <div className="p-3 rounded-xl bg-primary/5 border border-primary/20 space-y-1.5 text-xs">
                <div className="flex justify-between text-[11px] font-semibold">
                  <span className="text-text-primary">Bundle Progress:</span>
                  <span className={totalKitsQuantity >= (bundleOffer.max_qty || 5) ? "text-emerald-700 font-bold" : "text-primary"}>
                    {totalKitsQuantity >= (bundleOffer.max_qty || 5)
                      ? "Bulk Discount Active"
                      : `${totalKitsQuantity}/${bundleOffer.max_qty || 5} Kits`}
                  </span>
                </div>
                <div className="w-full bg-border rounded-full h-1.5 overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${
                      totalKitsQuantity >= (bundleOffer.max_qty || 5) ? "bg-emerald-600" : "bg-primary"
                    }`}
                    style={{
                      width: `${Math.min(100, (totalKitsQuantity / (bundleOffer.max_qty || 5)) * 100)}%`,
                    }}
                  />
                </div>
              </div>
            )}

            {/* Price Calculations */}
            <div className="space-y-2 text-xs text-text-secondary border-b border-border pb-3.5">
              <div className="flex justify-between">
                <span>Market M.R.P. Total:</span>
                <span className="line-through font-mono">₹{cartTotals.totalMarketPrice.toLocaleString("en-IN")}</span>
              </div>

              {cartTotals.totalSavings > 0 && (
                <div className="flex justify-between text-emerald-700 dark:text-emerald-400 font-semibold">
                  <span className="flex items-center gap-1">
                    <FiTag size={12} /> Direct Solar Discount:
                  </span>
                  <span className="font-mono">-₹{cartTotals.savings.toLocaleString("en-IN")}</span>
                </div>
              )}

              <div className="flex justify-between">
                <span>Items Subtotal (Excl. GST):</span>
                <span className="font-mono text-text-primary">₹{cartTotals.subtotalExcludingGst.toLocaleString("en-IN")}</span>
              </div>

              <div className="flex justify-between">
                <span>GST ({cartTotals.gstRate}% ITC Eligible):</span>
                <span className="font-mono text-text-primary">₹{cartTotals.gstAmount.toLocaleString("en-IN")}</span>
              </div>

              <div className="flex justify-between">
                <span>Delivery & Handling:</span>
                <span className="font-bold text-emerald-700 dark:text-emerald-400">FREE</span>
              </div>
            </div>

            {/* Grand Total */}
            <div className="flex items-baseline justify-between pt-1">
              <div>
                <span className="text-xs font-bold text-text-secondary uppercase block">
                  Grand Total (Incl. GST)
                </span>
                <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-medium">
                  Input Tax Credit (ITC) Available
                </span>
              </div>
              <span className="font-black text-xl text-primary dark:text-info font-mono">
                ₹{cartTotals.total.toLocaleString("en-IN")}
              </span>
            </div>

            {/* Checkout CTA */}
            <Button
              onClick={handleProceedToCheckout}
              variant="primary"
              size="lg"
              fullWidth
              leftIcon={<FiShoppingCart size={18} />}
              className="py-3 text-xs sm:text-sm font-bold shadow-md cursor-pointer"
            >
              Proceed to Secure Checkout
            </Button>

            {/* Trust Badges */}
            <div className="pt-2 border-t border-border space-y-1.5 text-[11px] text-text-secondary">
              <div className="flex items-center gap-2">
                <FiShield className="text-primary shrink-0" />
                <span>Tier-1 Modules · 25-Year Performance Warranty</span>
              </div>
              <div className="flex items-center gap-2">
                <FiTruck className="text-primary shrink-0" />
                <span>Insured Freight & Doorstep Site Delivery</span>
              </div>
              <div className="flex items-center gap-2">
                <FiCheckCircle className="text-emerald-600 shrink-0" />
                <span>100% GST-Compliant B2B / B2C Tax Invoice</span>
              </div>
            </div>

          </div>

        </div>

      </div>

      {/* Selected Kit Dialog */}
      {selectedKit && (
        <Dialog
          isOpen={!!selectedKit}
          title={selectedKit?.kitName}
          onClose={() => setSelected(null)}
          size="xl"
        >
          <SelectedKitCard
            kit={selectedKit}
            initialVariantIndex={selectedKit.variantIndex}
            isCart={true}
            activeOffers={activeOffers}
          />
        </Dialog>
      )}

      <GstVerificationDialog
        isOpen={showGstDialog}
        onClose={() => setShowGstDialog(false)}
        stateId={gstStateId}
        onVerified={handleGstVerified}
      />
    </div>
  );
}