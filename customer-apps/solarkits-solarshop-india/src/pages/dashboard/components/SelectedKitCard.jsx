import { useRef, useState, memo, useCallback, useMemo, useEffect } from "react";
import {
  FaPlus, FaMinus, FaSolarPanel, FaBolt, FaBatteryFull, FaCogs,
  FaLayerGroup, FaBoxOpen, FaRupeeSign, FaCheck, FaShoppingCart, FaPiggyBank,
  FaGem, FaStar, FaHome, FaInfoCircle, FaTruck, FaTag, FaChevronDown, FaChevronUp,
  FaBalanceScale, FaAward, FaMapMarkerAlt
} from "react-icons/fa";
import { useDispatch, useSelector } from "react-redux";
import Button from "@/components/Button";
import IconButton from "@/components/IconButton";
import Dialog from "@/components/Dialog";
import { addToCart, decreaseQty, increaseQty, removeFromCart, setShowAuthDialog } from "@/features/slice";

const ImageWithPlaceholder = ({ src, alt }) => {
  const [hasError, setHasError] = useState(!src || src.includes("default"));

  if (hasError) {
    return (
      <div className="flex items-center justify-center bg-surface-hover rounded-xl p-3 w-[200px] h-[120px] mx-auto border border-dashed border-border">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-gray-300">
          <rect x="2" y="2" width="20" height="20" rx="4" fill="#F3F4F6" stroke="#E5E7EB" strokeWidth="1"/>
          <circle cx="8.5" cy="8.5" r="1.5" fill="#D1D5DB"/>
          <path d="M4 20L9 13L14 17L17 14L20 18" stroke="#D1D5DB" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className="max-w-[200px] max-h-[120px] mx-auto object-contain"
      loading="lazy"
      onError={() => setHasError(true)}
    />
  );
};

const ComponentImage = ({ src, type }) => {
  const [error, setError] = useState(!src);

  if (error) {
    const iconClass = "text-text-secondary opacity-60 text-base";
    return (
      <div className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center shrink-0 border border-border/40">
        {type === "panel" && <FaSolarPanel className={iconClass} />}
        {type === "inverter" && <FaBolt className={iconClass} />}
        {type === "bos" && <FaCogs className={iconClass} />}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={type}
      className="w-10 h-10 object-contain drop-shadow-xs"
      onError={() => setError(true)}
    />
  );
};

const KitComponentsRow = ({ kit }) => {
  const components = [];
  if (kit.includedComponents && kit.includedComponents.length > 0) {
    components.push(...kit.includedComponents);
  } else {
    if (kit.panel) components.push({ ...kit.panel, actualType: "panel", name: kit.panel.technologyType, image: kit.panel.panelImage });
    if (kit.inverter) components.push({ ...kit.inverter, actualType: "inverter", name: kit.inverter.category, image: kit.inverter.inverterImage });
  }

  const bosItems = kit.BOSKit?.components || kit.bosComponents || [];

  return (
    <div className="flex items-center justify-center gap-1.5 bg-slate-50 dark:bg-slate-900/30 p-2.5 rounded-xl border border-border/80 mb-6 max-w-md mx-auto overflow-x-auto scrollbar-none select-none">
      {components.map((comp, idx) => (
        <div key={`base-${idx}`} className="flex items-center gap-1 shrink-0">
          {idx > 0 && <span className="text-sm font-black text-text-muted select-none shrink-0">+</span>}
          <div className="flex flex-col items-center justify-center text-center shrink-0 w-[68px]">
            <ComponentImage src={comp.image || comp.panelImage || comp.inverterImage} type={comp.actualType || comp.type} />
            <span className="text-[9px] font-black text-text-primary dark:text-info mt-1 truncate max-w-[68px]" title={comp.name}>
              {comp.quantity} {comp.actualType === "panel" ? "panels" : comp.actualType === "inverter" ? "inverter" : comp.name.split(" ")[0]}
            </span>
          </div>
        </div>
      ))}

      {bosItems.map((bc, idx) => (
        <div key={`bos-${idx}`} className="flex items-center gap-1 shrink-0">
          <span className="text-sm font-black text-text-muted select-none shrink-0">+</span>
          <div className="flex flex-col items-center justify-center text-center shrink-0 w-[68px]">
            <ComponentImage src={bc.image} type="bos" />
            <span className="text-[9px] font-black text-text-primary dark:text-info mt-1 truncate max-w-[68px]" title={bc.name}>
              {bc.quantity} {bc.name.split(" ")[0]}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
};

const SelectedKitCard = memo(({ kit, initialVariantIndex = 0, isCart = false, activeOffers = [] }) => {
  const dispatch = useDispatch();
  const cart = useSelector((state) => state.slice.cart);
  const { isAuthenticated } = useSelector((state) => state.auth_slice);
  const selectedDistrict = useSelector((state) => state.slice.selectedDistrict);
  const [selectedVariant, setSelectedVariant] = useState(initialVariantIndex);

  useEffect(() => {
    setSelectedVariant(initialVariantIndex);
  }, [kit?.id]);
  const [showVariants, setShowVariants] = useState(false);
  const [showVariantComparison, setShowVariantComparison] = useState(false);
  const [showBosPopup, setShowBosPopup] = useState(false);
  const [selectedBosComp, setSelectedBosComp] = useState(null);
  const scrollRef = useRef(null);
  const [isScrolling, setIsScrolling] = useState(false);
  const [startX, setStartX] = useState(0);

  const currentVariant = kit?.variants?.[selectedVariant] || kit?.variants?.[0];
  const cartItemId = kit ? (isCart && kit.cartItemId ? kit.cartItemId : `${kit.id}-${selectedVariant}`) : "";
  const cartItem = kit ? cart.find((item) => item.cartItemId === cartItemId) : null;

  const isMaxStockReached = useMemo(() => {
    const stockLimit = currentVariant?.availableStock !== undefined ? currentVariant.availableStock : 999;
    return cartItem && cartItem.qty >= stockLimit;
  }, [cartItem, currentVariant?.availableStock]);

  // Memoize type class function for usageType
  const getUsageTypeClass = useCallback(() => {
    return "bg-primary/5 text-primary border border-primary/15";
  }, []);

  // Memoize tier styling and icon
  const getTierConfig = useCallback((tier, color, benefits = []) => {
    const tierLabel = tier || "Standard Upgrade";
    const hasCustomColor = !!color;
    const iconColor = hasCustomColor ? color : undefined;
    
    // Create a dynamic description from the first benefit or a default placeholder
    const firstBenefit = benefits && benefits.length > 0 ? benefits[0] : "";
    const description = firstBenefit || "Custom configured upgrade variant with premium components";

    return {
      bg: hasCustomColor ? "" : "bg-primary/5 dark:bg-primary/10",
      text: hasCustomColor ? "" : "text-primary dark:text-info",
      border: hasCustomColor ? "" : "border-primary/15 dark:border-info/20",
      gradient: hasCustomColor ? "" : "bg-linear-120 from-primary/5 to-primary/10",
      icon: <FaAward className={hasCustomColor ? "" : "text-primary dark:text-info"} style={iconColor ? { color: iconColor } : undefined} />,
      label: tierLabel,
      customColor: color || null,
      description: description
    };
  }, []);

  const usageTypeClass = useMemo(() => getUsageTypeClass(kit?.usageType), [getUsageTypeClass, kit?.usageType]);
  const tierConfig = useMemo(() => getTierConfig(currentVariant?.productTier, currentVariant?.tierColor, currentVariant?.tierBenefits), [getTierConfig, currentVariant?.productTier, currentVariant?.tierColor, currentVariant?.tierBenefits]);

  const isBundleEligible = useMemo(() => {
    if (!activeOffers || activeOffers.length === 0) return false;
    const bundleOffer = activeOffers.find(o => o.offer_type === 'bundle');
    if (!bundleOffer) return false;
    if (!bundleOffer.products_applicable || bundleOffer.products_applicable.length === 0) {
      return true;
    }
    return bundleOffer.products_applicable.some(pId => pId.toString() === kit.id.toString());
  }, [activeOffers, kit?.id]);

  const cardBaseClasses = "bg-surface p-3 rounded-lg border border-border min-w-[260px] flex-shrink-0 shadow-sm hover:shadow-md transition-all duration-300";

  // Scroll handlers
  const handleStart = useCallback((e) => {
    setIsScrolling(true);
    let pageX = e.type === "touchstart" ? e.touches[0].pageX : e.pageX;
    setStartX(pageX + scrollRef.current.scrollLeft);
  }, []);

  const handleMove = useCallback((e) => {
    if (!isScrolling) return;
    e.preventDefault();
    let pageX = e.type === "touchmove" ? e.touches[0].pageX : e.pageX;
    scrollRef.current.scrollLeft = startX - pageX;
  }, [isScrolling, startX]);

  const handleEnd = useCallback(() => {
    setIsScrolling(false);
  }, []);

  // Cart actions
  const handleAddToCart = useCallback(() => {
    if (!isAuthenticated) {
      dispatch(setShowAuthDialog(true));
      return;
    }
    dispatch(addToCart({ id: kit.id, variantIndex: selectedVariant }));
  }, [dispatch, kit.id, selectedVariant, isAuthenticated]);

  const handleDecreaseQty = useCallback(() => {
    if (cartItem?.qty > 1) {
      dispatch(decreaseQty(cartItemId));
    } else {
      dispatch(removeFromCart(cartItemId));
    }
  }, [dispatch, cartItemId, cartItem?.qty]);

  const handleIncreaseQty = useCallback(() => {
    dispatch(increaseQty(cartItemId));
  }, [dispatch, cartItemId]);

  const handleVariantChange = useCallback((index) => {
    setSelectedVariant(index);
    setShowVariants(false);
    setShowVariantComparison(false);
  }, []);

  // Memoize formatted prices and calculations
  const formattedPrices = useMemo(() => ({
    marketPrice: currentVariant?.marketPrice?.toLocaleString("en-IN"),
    ourPrice: currentVariant?.ourPrice?.toLocaleString("en-IN")
  }), [currentVariant?.marketPrice, currentVariant?.ourPrice]);

  const discountPercentage = useMemo(() => {
    if (!currentVariant?.marketPrice || !currentVariant?.ourPrice) return 0;
    return Math.round(((currentVariant.marketPrice - currentVariant.ourPrice) / currentVariant.marketPrice) * 100);
  }, [currentVariant?.marketPrice, currentVariant?.ourPrice]);

  // Cart calculations
  const cartCalculations = useMemo(() => {
    if (!cartItem || !currentVariant) {
      return {
        totalSavings: 0,
        totalAmount: 0,
        totalItems: 0,
        quantity: 0
      };
    }

    const quantity = cartItem.qty;
    const totalMarketPrice = quantity * currentVariant.marketPrice;
    const totalOurPrice = quantity * currentVariant.ourPrice;
    const savings = totalMarketPrice - totalOurPrice;
    const totalDeliverySavings = quantity * (currentVariant.includedDeliveryCharge || 0);
    const totalSavings = savings + totalDeliverySavings;

    return {
      savings,
      totalSavings,
      totalDeliverySavings,
      totalAmount: totalOurPrice,
      totalItems: quantity,
      quantity,
      totalMarketPrice
    };
  }, [cartItem, currentVariant]);

  const formattedCalculations = useMemo(() => ({
    savings: cartCalculations.savings?.toLocaleString("en-IN"),
    totalSavings: cartCalculations.totalSavings?.toLocaleString("en-IN"),
    totalDeliverySavings: cartCalculations.totalDeliverySavings?.toLocaleString("en-IN"),
    totalAmount: cartCalculations.totalAmount?.toLocaleString("en-IN"),
    totalMarketPrice: cartCalculations.totalMarketPrice?.toLocaleString("en-IN"),
  }), [cartCalculations]);

  // Handle variant selection from comparison modal
  const handleCompareVariantSelect = useCallback((index) => {
    setSelectedVariant(index);
    setShowVariantComparison(false);
    setShowVariants(false);
  }, []);

  // Variant comparison content
  const VariantComparisonContent = useCallback(() => (
    <div className="p-2">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {kit.variants.map((variant, index) => {
          const variantTierConfig = getTierConfig(variant.productTier, variant.tierColor, variant.tierBenefits);
          const variantDiscount = variant.marketPrice > variant.ourPrice
            ? Math.round(((variant.marketPrice - variant.ourPrice) / variant.marketPrice) * 100)
            : 0;

          return (
            <div key={index} className={`flex flex-col border rounded-lg p-4 ${index === selectedVariant ? 'border-primary ring-2 ring-primary/20' : 'border-border'}`}
              style={index === selectedVariant && variant.tierColor ? { borderColor: variant.tierColor, boxShadow: `0 0 0 2px ${variant.tierColor}30` } : undefined}
            >
              <div
                className={`flex items-center gap-2 mb-3 ${variantTierConfig.gradient} p-2 rounded-lg`}
                style={variant.tierColor ? { background: `${variant.tierColor}15` } : undefined}
              >
                {variantTierConfig.icon}
                <span
                  className={`font-bold ${variantTierConfig.text}`}
                  style={variant.tierColor ? { color: variant.tierColor } : undefined}
                >{variant.productTier}</span>
              </div>

              <div className="space-y-3 flex-1 flex flex-col justify-between">
                <div>
                  {/* Price */}
                  <div>
                    <div className="text-xs text-text-secondary">Our Price</div>
                    <div
                      className="text-2xl font-bold text-primary"
                      style={variant.tierColor ? { color: variant.tierColor } : undefined}
                    >₹{variant.ourPrice?.toLocaleString("en-IN")}</div>
                    <div className="flex items-center gap-2 text-sm">
                      {variant.marketPrice > variant.ourPrice && (
                        <span className="text-text-secondary line-through">₹{variant.marketPrice?.toLocaleString("en-IN")}</span>
                      )}
                      {variantDiscount > 0 && (
                        <span className="bg-success/10 text-success text-xs font-semibold px-2 py-0.5 rounded-full">
                          {variantDiscount}% off
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Benefits */}
                  {variant.tierBenefits && variant.tierBenefits.length > 0 && (
                    <div>
                      <div className="text-xs font-semibold text-text-primary mb-2">Benefits:</div>
                      <ul className="space-y-1">
                        {variant.tierBenefits.map((benefit, i) => (
                          <li key={i} className="text-xs flex items-start gap-1">
                            <FaCheck className="text-success text-xs mt-0.5 flex-shrink-0" />
                            <span>{benefit}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Delivery */}
                  {variant.includedDeliveryCharge > 0 && (
                    <div className="text-xs flex items-center gap-1 text-success">
                      <FaTruck />
                      Free Delivery (₹{variant.includedDeliveryCharge.toLocaleString("en-IN")} saved)
                    </div>
                  )}

                  {/* Stock Status */}
                  <div className="text-sm">
                    {variant.inStock ? (
                      <span className="text-success flex items-center gap-1">
                        <FaCheck className="text-xs" /> In Stock
                      </span>
                    ) : (
                      <span className="text-red-500">Out of Stock</span>
                    )}
                  </div>
                </div>
                {/* Select Button */}
                {index !== selectedVariant && variant.inStock && (
                  <Button
                    onClick={() => handleCompareVariantSelect(index)}
                    variant="outline"
                    size="sm"
                    className="w-full"
                  >
                    Select This Variant
                  </Button>
                )}
                {index === selectedVariant && (
                  <Button
                    variant="primary"
                    size="sm"
                    className="w-full"
                    onClick={() => setShowVariantComparison(false)}
                  >
                    Currently Selected
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  ), [kit, selectedVariant, getTierConfig, handleCompareVariantSelect]);

  // Component sections
  const componentSections = useMemo(() => {
    const sections = [];

    if (kit.includedComponents && kit.includedComponents.length > 0) {
      kit.includedComponents.forEach(comp => {
        const isPanel = comp.actualType === "panel";
        const isInverter = comp.actualType === "inverter";
        sections.push({
          icon: isPanel ? <FaSolarPanel className="text-amber-500" /> : isInverter ? <FaBolt className="text-blue-600" /> : <FaCogs className="text-purple-600" />,
          title: isPanel ? "Panel" : isInverter ? "Inverter" : comp.name || "Component",
          data: comp,
          fields: isPanel 
            ? ["brandName", "technologyType", "wattPerPanel", "quantity", "efficiencyPercent", "warrantyYears"]
            : isInverter 
            ? ["brandName", "type", "category", "capacityKW", "efficiencyPercent", "warrantyYears", "quantity"]
            : ["brandName", "skuCode", "quantity"],
          imageField: "image"
        });
      });
    } else {
      if (kit.panel) {
        sections.push({
          icon: <FaSolarPanel className="text-amber-500" />,
          title: "Panel",
          data: kit.panel,
          fields: ["brandName", "technologyType", "wattPerPanel", "quantity", "efficiencyPercent", "warrantyYears"],
          imageField: "panelImage"
        });
      }
      if (kit.inverter) {
        sections.push({
          icon: <FaBolt className="text-blue-600" />,
          title: "Inverter",
          data: kit.inverter,
          fields: ["brandName", "type", "category", "capacityKW", "efficiencyPercent", "warrantyYears", "quantity"],
          imageField: "inverterImage"
        });
      }
    }

    if (kit.BOSKit) {
      sections.push({
        icon: <FaCogs className="text-purple-600" />,
        title: "BOS Kit",
        data: kit.BOSKit,
        fields: ["brandName"],
        imageField: "BOSKitImage"
      });
    }

    return sections.filter(Boolean);
  }, [kit]);

  // Field label configuration
  const getFieldConfig = useCallback((field) => {
    const configs = {
      wattPerPanel: { label: "Watt per Panel", unit: "W" },
      capacityKW: { label: "Capacity", unit: "kW" },
      capacityKWh: { label: "Battery Capacity", unit: "kWh" },
      efficiencyPercent: { label: "Efficiency", unit: "%" },
      installationAngle: { label: "Angle", unit: "" },
      windResistanceKmph: { label: "Wind Resistance", unit: "km/h" },
      warrantyYears: { label: "Warranty", unit: "yrs" },
      cycles: { label: "Cycles", unit: "" },
      brandName: { label: "Brand", unit: "" },
      type: { label: "Type", unit: "" },
      technologyType: { label: "Technology", unit: "" },
      category: { label: "Category", unit: "" },
      quantity: { label: "Quantity", unit: "" }
    };
    return configs[field] || { label: field, unit: "" };
  }, []);

  if (!kit) return null;

  return (
    <div className="bg-surface rounded-2xl shadow-md p-6 border border-border max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6 border-b border-border pb-5">
        <div className="flex-1">
          {kit.variants && kit.variants.length > 0 ? (
            <div className={`inline-flex items-center gap-3 p-3 rounded-2xl border ${tierConfig.border} bg-gradient-to-tr ${tierConfig.gradient} shadow-xs`}
              style={currentVariant?.tierColor ? {
                borderColor: `${currentVariant.tierColor}30`,
                background: `linear-gradient(135deg, ${currentVariant.tierColor}05, ${currentVariant.tierColor}15)`
              } : undefined}
            >
              <div className="p-2.5 rounded-xl bg-surface shadow-xs">
                {tierConfig.icon}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className={`font-black text-base ${tierConfig.text}`}
                    style={currentVariant?.tierColor ? { color: currentVariant.tierColor } : undefined}
                  >{kit.brand} • {tierConfig.label}</span>
                  <span className="text-[10px] font-bold text-text-muted bg-surface px-2 py-0.5 rounded-full border border-border">
                    {currentVariant?.productTier}
                  </span>
                </div>
                <p className="text-xs text-text-secondary font-medium mt-0.5 max-w-md leading-tight">{currentVariant?.tierBenefits?.[0] || tierConfig.description}</p>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3 p-3 rounded-2xl border border-border bg-surface-hover shadow-xs">
              <div className="p-2.5 rounded-xl bg-surface shadow-xs text-text-muted">
                <FaHome />
              </div>
              <div>
                <span className="font-black text-base text-text-primary">{kit.brand}</span>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <span
            className={`inline-flex items-center gap-1.5 px-3.5 py-1 text-xs font-bold rounded-full shadow-xs ${!kit?.usageTypeColor ? usageTypeClass : ""}`}
            style={kit?.usageTypeColor ? {
              backgroundColor: `${kit.usageTypeColor}15`,
              color: kit.usageTypeColor,
              borderColor: `${kit.usageTypeColor}35`
            } : undefined}
          >
            {kit?.usageTypeImage && (
              <img
                src={kit.usageTypeImage.startsWith("http") ? kit.usageTypeImage : `http://localhost:5000${kit.usageTypeImage}`}
                alt=""
                className="w-5 h-5 object-contain rounded-full shrink-0"
              />
            )}
            <span>{kit?.usageType}</span>
          </span>
          {isBundleEligible && (
            <span className="px-3.5 py-1 text-xs font-bold rounded-full bg-blue-600 text-white shadow-xs flex items-center gap-1">
              📦 Buy Pack Offer Eligible
            </span>
          )}
          {!currentVariant?.inStock && (
            <span className="px-3.5 py-1 text-xs font-bold rounded-full bg-red-50 text-red-600 border border-red-200 shadow-xs">
              Out of Stock
            </span>
          )}
        </div>
      </div>

      {/* Variant Selector and Compare Button */}
      {kit.variants?.length > 1 && !isCart && (
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <button
              onClick={() => setShowVariants(!showVariants)}
              className="flex items-center justify-between gap-2 px-4 py-2.5 bg-surface-hover hover:bg-surface-hover/80 rounded-xl border border-border transition-colors w-full text-left"
            >
              <span className="flex items-center gap-2">
                {tierConfig.icon}
                <span className="font-semibold text-text-primary text-sm">Select Variant: </span>
                <span
                  className="font-bold text-sm"
                  style={currentVariant?.tierColor ? { color: currentVariant.tierColor } : { color: 'var(--color-primary)' }}
                >{currentVariant?.productTier}</span>
                <span
                  className="font-extrabold text-sm ml-2"
                  style={currentVariant?.tierColor ? { color: currentVariant.tierColor } : { color: 'var(--color-primary)' }}
                >
                  ₹{currentVariant?.ourPrice?.toLocaleString("en-IN")}
                </span>
              </span>
              {showVariants ? <FaChevronUp size={12} className="text-text-muted" /> : <FaChevronDown size={12} className="text-text-muted" />}
            </button>

            {showVariants && (
              <div className="absolute top-full left-0 mt-1.5 bg-surface rounded-xl border border-border shadow-xl z-20 min-w-[320px] overflow-hidden">
                {kit.variants.map((variant, index) => {
                  const variantTierConfig = getTierConfig(variant.productTier, variant.tierColor);
                  const variantDiscount = variant.marketPrice > variant.ourPrice
                    ? Math.round(((variant.marketPrice - variant.ourPrice) / variant.marketPrice) * 100)
                    : 0;
                  return (
                    <button
                      key={index}
                      onClick={() => handleVariantChange(index)}
                      className={`w-full flex items-center justify-between px-4 py-3 hover:bg-surface-hover transition-colors ${index === selectedVariant ? 'bg-primary/[0.03]' : ''
                        } ${index !== kit.variants.length - 1 ? 'border-b border-border' : ''}`}
                      style={index === selectedVariant && variant.tierColor ? { backgroundColor: `${variant.tierColor}08` } : undefined}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`p-2 rounded-lg ${variantTierConfig.gradient}`}
                          style={variant.tierColor ? { background: `${variant.tierColor}20` } : undefined}
                        >
                          {variantTierConfig.icon}
                        </div>
                        <div className="text-left">
                          <span
                            className="font-bold text-sm text-text-primary block"
                            style={variant.tierColor ? { color: variant.tierColor } : undefined}
                          >{variant.productTier}</span>
                          {variantDiscount > 0 && (
                            <span className="text-[10px] text-text-muted font-semibold">
                              Save {variantDiscount}%
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <span
                          className="font-extrabold text-sm block"
                          style={variant.tierColor ? { color: variant.tierColor } : { color: 'var(--color-primary)' }}
                        >₹{variant.ourPrice?.toLocaleString("en-IN")}</span>
                        {variant.marketPrice > variant.ourPrice && (
                          <span className="text-[10px] text-text-muted line-through font-medium">₹{variant.marketPrice?.toLocaleString("en-IN")}</span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <Button
            onClick={() => setShowVariantComparison(true)}
            variant="outline"
            size="md"
            className="sm:w-auto rounded-xl border-border text-text-primary dark:text-info font-bold hover:bg-surface-hover"
            leftIcon={<FaBalanceScale />}
          >
            Compare Variants
          </Button>
        </div>
      )}

      {/* Variant Comparison Dialog */}
      <Dialog
        isOpen={showVariantComparison}
        onClose={() => setShowVariantComparison(false)}
        title={`Compare Variants - ${kit.kitName}`}
        size="lg"
      >
        <VariantComparisonContent />
      </Dialog>

      {/* Kit Image */}
      {kit.kitImage && (
        <div className="mb-6 flex justify-center items-center bg-gradient-to-tr from-surface-hover/30 to-surface-hover/60 rounded-2xl p-2 border border-border w-full h-80 overflow-hidden group">
          <img
            src={kit.kitImage}
            alt={kit.kitName}
            className="w-full h-full object-contain transition-transform duration-500 hover:scale-110"
            loading="lazy"
          />
        </div>
      )}

      {/* Kit Name */}
      <h2 className="text-2xl font-black text-text-primary text-center mb-2 tracking-tight">
        {kit.kitName}
      </h2>
      {(kit.districtName || selectedDistrict?.name) && (
        <div className="flex justify-center mb-6">
          <span className="bg-primary/10 text-primary border border-primary/20 text-xs font-black px-3 py-1 rounded-full flex items-center gap-1.5">
            <FaMapMarkerAlt size={12} className="text-primary dark:text-info shrink-0" /> District: {kit.districtName || selectedDistrict?.name}
          </span>
        </div>
      )}

      <KitComponentsRow kit={kit} />

      {/* Specs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <div className="lg:col-span-2 bg-surface-hover/60 border border-border p-4 rounded-2xl flex items-center border-l-4 border-l-primary">
          <p className="text-xs md:text-sm text-text-secondary leading-relaxed font-medium">{kit.description}</p>
        </div>
        <div className="grid grid-cols-1 gap-2.5">
          <div className="flex items-center gap-3 p-3 bg-surface-hover/60 border border-border rounded-xl">
            <div className="p-2 rounded-lg bg-primary/10 text-primary"><FaBolt size={14} /></div>
            <div>
              <div className="text-[10px] text-text-muted font-bold uppercase tracking-wider">Capacity</div>
              <div className="text-sm font-black text-text-primary">{kit.capacityKW} kW</div>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-surface-hover/60 border border-border rounded-xl">
            <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400"><FaSolarPanel size={14} /></div>
            <div>
              <div className="text-[10px] text-text-muted font-bold uppercase tracking-wider">Annual Generation</div>
              <div className="text-sm font-black text-text-primary">{kit.generationEstimateKWhPerYear?.toLocaleString("en-IN") || "-"} kWh</div>
            </div>
          </div>
          {kit.warrantyYears && (
            <div className="flex items-center gap-3 p-3 bg-surface-hover/60 border border-border rounded-xl">
              <div className="p-2 rounded-lg bg-success/10 text-success font-semibold"><FaCheck size={14} /></div>
              <div>
                <div className="text-[10px] text-text-muted font-bold uppercase tracking-wider">Warranty</div>
                <div className="text-sm font-black text-text-primary">{kit.warrantyYears} Years</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Tier Benefits */}
      {currentVariant?.tierBenefits && currentVariant.tierBenefits.length > 0 && (
        <div
          className={`mb-6 border ${tierConfig.border} ${tierConfig.bg}/30 rounded-2xl p-5 shadow-xs`}
          style={currentVariant?.tierColor ? {
            borderColor: `${currentVariant.tierColor}40`,
            backgroundColor: `${currentVariant.tierColor}06`
          } : undefined}
        >
          <div className="flex items-center gap-2.5 mb-4">
            <span
              className={`p-2 rounded-lg bg-surface shadow-xs border ${tierConfig.border}`}
              style={currentVariant?.tierColor ? { borderColor: `${currentVariant.tierColor}40` } : undefined}
            >{tierConfig.icon}</span>
            <h4
              className="text-base font-black text-text-primary"
              style={currentVariant?.tierColor ? { color: currentVariant.tierColor } : undefined}
            >{tierConfig.label} Tier Perks & Benefits</h4>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {currentVariant.tierBenefits.map((benefit, index) => (
              <div key={index} className="flex items-center gap-3 bg-surface p-3 rounded-xl border border-border shadow-xs hover:shadow-sm transition-all duration-200">
                <div
                  className={`p-1 rounded-full ${tierConfig.bg} border ${tierConfig.border}`}
                  style={currentVariant?.tierColor ? {
                    backgroundColor: `${currentVariant.tierColor}15`,
                    borderColor: `${currentVariant.tierColor}40`
                  } : undefined}
                >
                  <FaCheck
                    className={`text-[10px] ${tierConfig.text}`}
                    style={currentVariant?.tierColor ? { color: currentVariant.tierColor } : undefined}
                  />
                </div>
                <span className="text-xs font-semibold text-text-primary">{benefit}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pricing Section */}
      <div className="mb-6 bg-gradient-to-r from-surface-hover via-surface/40 to-surface-hover/30 rounded-2xl p-5 border border-border shadow-xs">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-stretch">
          {/* Price Display */}
          <div className="lg:col-span-2 flex flex-col justify-center">
            <div className="space-y-3">
              {discountPercentage > 0 && (
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="text-[11px] text-text-muted font-bold uppercase tracking-wider">Market Price</span>
                  <span className="text-sm text-text-muted line-through font-medium">
                    ₹{formattedPrices.marketPrice}
                  </span>
                  <span className="bg-success/10 text-success font-semibold border border-success/20 text-[10px] font-bold px-2.5 py-0.5 rounded-full">
                    {discountPercentage}% Off
                  </span>
                </div>
              )}

              <div className="flex items-center gap-3 flex-wrap">
                <span className="text-[11px] text-text-muted font-bold uppercase tracking-wider">Our Price</span>
                <div
                  className="flex items-center text-primary"
                  style={currentVariant?.tierColor ? { color: currentVariant.tierColor } : undefined}
                >
                  <FaRupeeSign className="text-xl mr-0.5" />
                  <span className="text-3xl font-black tracking-tight">
                    {formattedPrices.ourPrice}
                  </span>
                </div>
                {discountPercentage > 0 && (
                  <span className="bg-emerald-500 text-white text-[11px] font-black px-2.5 py-1 rounded-full shadow-xs">
                    Save {discountPercentage}%
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Per Item Info */}
          <div className="bg-surface rounded-xl p-4 border border-border shadow-xs flex flex-col justify-between">
            <h4 className="font-bold text-text-primary mb-2.5 flex items-center gap-1.5 text-xs uppercase tracking-wider">
              <FaTag className="text-primary text-[10px]" />
              Per Kit Detail
            </h4>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between items-center pb-1.5 border-b border-border">
                <span className="text-text-muted font-medium">Price:</span>
                <span className="font-black text-text-primary">₹{formattedPrices.ourPrice}</span>
              </div>
              {currentVariant?.includedDeliveryCharge > 0 && (
                <div className="flex justify-between items-center text-success font-semibold">
                  <span className="flex items-center gap-1">
                    <FaTruck size={10} />
                    Free Delivery:
                  </span>
                  <span className="font-bold">Saved ₹{currentVariant.includedDeliveryCharge.toLocaleString("en-IN")}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Cart Summary */}
      {cartItem && cartCalculations.quantity > 0 && (
        <div className="mb-6 bg-gradient-to-r from-primary/[0.02] via-emerald/[0.02] to-blue-50/10 rounded-2xl p-5 border border-primary/20 shadow-xs">
          <h3 className="text-base font-black text-text-primary mb-4 flex items-center gap-2">
            <FaShoppingCart className="text-primary dark:text-info text-sm" />
            Cart Summary
          </h3>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Amounts */}
            <div className="space-y-2.5">
              <div className="flex justify-between items-center p-3 bg-surface border border-border rounded-xl text-xs">
                <span className="text-text-muted font-semibold">Market Total:</span>
                <span className="font-black text-text-primary line-through">₹{formattedCalculations.totalMarketPrice}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-primary/[0.03] border border-primary/20 rounded-xl text-xs">
                <span className="font-bold text-primary dark:text-info">Total:</span>
                <span className="text-base font-black text-primary dark:text-info flex items-center">
                  <FaRupeeSign className="text-xs mr-0.5" />
                  {formattedCalculations.totalAmount}
                </span>
              </div>
            </div>

            {/* Savings */}
            {cartCalculations.totalSavings > 0 && (
              <div className="bg-surface border border-border rounded-xl p-4 flex flex-col justify-between">
                <div className="flex items-center gap-1.5 mb-3">
                  <FaPiggyBank className="text-emerald-500 text-sm" />
                  <span className="font-bold text-emerald-500 text-xs uppercase tracking-wider">Total Savings</span>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-text-muted font-medium">You Save:</span>
                    <span className="font-black text-success">₹{formattedCalculations.savings}</span>
                  </div>
                  {currentVariant?.includedDeliveryCharge > 0 && (
                    <div className="flex justify-between">
                      <span className="text-text-muted font-medium">Free Delivery:</span>
                      <span className="font-black text-blue-600">₹{(currentVariant.includedDeliveryCharge * cartCalculations.quantity).toLocaleString("en-IN")}</span>
                    </div>
                  )}
                  <div className="pt-2 mt-2 border-t border-border">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-success">Total Saved:</span>
                      <span className="font-black text-success text-sm">₹{formattedCalculations.totalSavings}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Item Calculation */}
          <div className="mt-4 bg-surface/80 rounded-xl p-3 text-center border border-border text-xs">
            <p className="font-bold text-text-primary">
              {cartCalculations.quantity} {cartCalculations.quantity === 1 ? 'item' : 'items'} in cart
            </p>
            <p className="text-text-muted font-semibold mt-1">
              {cartCalculations.quantity} × ₹{formattedPrices.ourPrice} each
            </p>
          </div>
        </div>
      )}

      {/* Cart Controls */}
      <div className="mb-6 flex flex-col lg:flex-row justify-between items-center gap-4 border-b border-border pb-5">
        <div className="flex-1 w-full">
          {!currentVariant?.inStock ? (
            <Button variant="danger" size="lg" disabled className="cursor-not-allowed w-full rounded-xl py-3 font-bold">
              Out of Stock
            </Button>
          ) : !cartItem ? (
            <Button
              onClick={handleAddToCart}
              variant="primary"
              size="lg"
              className="w-full rounded-xl py-3 font-black bg-gradient-to-r from-primary to-primary-end shadow-md hover:shadow-lg transition-all duration-200 transform active:scale-98"
              leftIcon={<FaShoppingCart />}
            >
              Add to Cart
            </Button>
          ) : (
            <div className="flex justify-between items-center bg-gradient-to-r from-primary to-primary-end rounded-xl py-1 px-1.5 shadow-md">
              <IconButton
                onClick={handleDecreaseQty}
                variant="ghost"
                size="sm"
                className="bg-white/15 hover:bg-white/25 text-white border border-white/25 w-8 h-8 rounded-lg shadow-xs"
              >
                <FaMinus className="text-[10px]" />
              </IconButton>
              <span className="text-sm font-black text-white px-2">
                {cartItem.qty} {cartItem.qty === 1 ? 'Kit' : 'Kits'} in Cart
              </span>

              <IconButton
                onClick={handleIncreaseQty}
                variant="ghost"
                size="sm"
                className="bg-white/15 hover:bg-white/25 text-white border border-white/25 w-8 h-8 rounded-lg shadow-xs disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isMaxStockReached}
              >
                <FaPlus className="text-[10px]" />
              </IconButton>
            </div>
          )}
        </div>
      </div>

      {/* Components Sections */}
      <div>
        <h3 className="text-lg font-bold text-text-primary mb-3 flex items-center gap-2">
          <FaCogs className="text-primary text-sm" />
          Components
        </h3>

        <div
          ref={scrollRef}
          className="flex gap-3 overflow-x-auto pb-2 cursor-grab scrollbar-hover"
          onMouseDown={handleStart}
          onMouseMove={handleMove}
          onMouseUp={handleEnd}
          onMouseLeave={handleEnd}
          onTouchStart={handleStart}
          onTouchMove={handleMove}
          onTouchEnd={handleEnd}
          style={{ cursor: isScrolling ? "grabbing" : "grab" }}
        >
          {componentSections.map((section, idx) => (
            <div key={idx} className={cardBaseClasses}>
              <h4 className="font-semibold flex items-center justify-between mb-3 text-text-primary text-base border-b border-border pb-2">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 rounded-lg bg-surface-hover">{section.icon}</span>
                  {section.title}
                </div>
                {section.title === "BOS Kit" && section.data?.components && (
                  <button
                    onClick={() => setShowBosPopup(true)}
                    className="text-primary dark:text-info hover:text-primary-dark dark:hover:text-info/80 transition-colors p-1 rounded-full hover:bg-surface-hover"
                    title="View Components Details"
                  >
                    <FaInfoCircle size={16} />
                  </button>
                )}
              </h4>

              {section.data && section.imageField && (
                <div className="mb-3 bg-surface-hover rounded-lg p-2">
                  <ImageWithPlaceholder
                    src={section.data[section.imageField]}
                    alt={section.title}
                  />
                </div>
              )}

              <div className="space-y-1">
                {section.fields.map((field, i) => {
                  const value = section.data?.[field];
                  if (value == null) return null;

                  const { label, unit } = getFieldConfig(field);

                  return (
                    <div key={i} className="flex justify-between items-center py-1 border-b border-ring last:border-b-0 text-xs">
                      <span className="text-text-secondary">{label}</span>
                      <span className="font-medium text-text-primary">
                        {value}
                        {unit && <span className="text-text-secondary text-xs ml-0.5">{unit}</span>}
                      </span>
                    </div>
                  );
                })}

                {/* Render dynamic attributes */}
                {section.data?.attributes && Array.isArray(section.data.attributes) && section.data.attributes.map((attr, i) => {
                  // Skip duplicates of system default hardcoded fields
                  const alreadyShown = section.fields.some(f => {
                    const cfg = getFieldConfig(f);
                    return cfg.label?.toLowerCase() === attr.name?.toLowerCase();
                  });
                  if (alreadyShown || attr.value == null || attr.value === "") return null;

                  return (
                    <div key={`attr-${i}`} className="flex justify-between items-center py-1 border-b border-ring last:border-b-0 text-xs">
                      <span className="text-text-secondary">{attr.name}</span>
                      <span className="font-medium text-text-primary">{attr.value}</span>
                    </div>
                  );
                })}
              </div>

              {section.title === "BOS Kit" && section.data?.components && (
                <div className="mt-3 pt-2 border-t border-border">
                  <p className="text-xs font-semibold text-text-primary mb-2">BOS Components:</p>
                  <ul className="space-y-1">
                    {section.data.components.map((comp, i) => (
                      <li
                        key={i}
                        onClick={() => {
                          setSelectedBosComp(comp);
                          setShowBosPopup(true);
                        }}
                        className="text-xs text-text-primary flex items-start gap-1 cursor-pointer hover:bg-primary/5 dark:hover:bg-primary/10 hover:text-primary dark:hover:text-info dark:hover:text-info p-1.5 rounded-lg border border-transparent hover:border-primary/10 transition-all duration-200 group"
                      >
                        <FaCheck className="text-success text-xs mt-0.5 flex-shrink-0 group-hover:text-primary dark:hover:text-info dark:group-hover:text-info transition-colors" />
                        <span className="truncate font-medium underline decoration-dashed decoration-1 group-hover:decoration-solid">{comp.name}</span>
                        <span className="text-[10px] text-text-secondary ml-auto bg-surface-hover px-1.5 py-0.5 rounded-md font-semibold group-hover:bg-primary/10 dark:group-hover:bg-primary/20 group-hover:text-primary dark:group-hover:text-info dark:hover:text-info dark:group-hover:text-info transition-colors">
                          x{comp.quantity}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* BOS Kit Components Details Dialog */}
      <Dialog
        isOpen={showBosPopup}
        onClose={() => {
          setShowBosPopup(false);
          setSelectedBosComp(null);
        }}
        title={selectedBosComp ? "Component Product Details" : "BOS Kit Included Components"}
        size="md"
      >
        {selectedBosComp ? (
          <div className="space-y-4">
            {/* Back Button */}
            <button
              onClick={() => setSelectedBosComp(null)}
              className="flex items-center gap-1 text-xs text-primary dark:text-info font-semibold hover:underline mb-2"
            >
              &larr; Back to Components List
            </button>

            {/* Product Type Card */}
            <div className="bg-surface rounded-2xl overflow-hidden border border-border shadow-sm p-4 space-y-4">
              <div className="flex gap-4 items-start pb-4 border-b border-border">
                <div className="w-24 h-24 rounded-xl bg-surface-hover flex items-center justify-center border border-border flex-shrink-0 p-2">
                  <ImageWithPlaceholder
                    src={selectedBosComp.image || ""}
                    alt={selectedBosComp.name}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-[10px] uppercase tracking-wider font-semibold text-primary dark:text-info bg-primary/10 px-2 py-0.5 rounded-full inline-block">
                    BOS Component
                  </span>
                  <h3 className="font-bold text-text-primary text-base mt-1 line-clamp-2">
                    {selectedBosComp.name}
                  </h3>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {selectedBosComp.skuCode && (
                      <span className="text-[10px] bg-surface-hover text-text-secondary px-2 py-0.5 rounded-md font-mono">
                        SKU: {selectedBosComp.skuCode}
                      </span>
                    )}
                    <span className="text-[10px] bg-success/10 text-success font-semibold px-2 py-0.5 rounded-md font-medium">
                      Quantity: {selectedBosComp.quantity}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">
                  Technical Attributes
                </h4>
                {selectedBosComp.attributes && selectedBosComp.attributes.length > 0 ? (
                  <div className="grid grid-cols-2 gap-3">
                    {selectedBosComp.attributes.map((attr, attrIdx) => (
                      <div key={attrIdx} className="bg-surface-hover rounded-xl p-3 border border-border flex flex-col justify-center">
                        <span className="text-[10px] text-text-secondary font-medium">{attr.name}</span>
                        <span className="text-sm text-text-primary font-bold mt-1">{attr.value}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-xs text-text-secondary bg-surface-hover rounded-xl p-4 text-center border border-dashed border-border">
                    No technical attributes configured for this component.
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
            {kit.BOSKit?.components?.map((comp, idx) => (
              <div
                key={idx}
                onClick={() => setSelectedBosComp(comp)}
                className="bg-surface-hover hover:bg-primary/5 dark:hover:bg-primary/10 hover:border-primary/25 dark:hover:border-info/25 cursor-pointer rounded-xl p-3 border border-border transition-all duration-200 flex justify-between items-start group"
              >
                <div>
                  <h4 className="font-semibold text-text-primary text-sm group-hover:text-primary dark:hover:text-info dark:group-hover:text-info transition-colors underline decoration-dashed decoration-1 group-hover:decoration-solid">
                    {comp.name}
                  </h4>
                  {comp.skuCode && (
                    <span className="text-[10px] bg-surface text-text-secondary px-1.5 py-0.5 rounded-md font-mono mt-1 inline-block">
                      {comp.skuCode}
                    </span>
                  )}
                </div>
                <div className="text-right">
                  <span className="text-xs text-text-secondary block">Qty</span>
                  <span className="font-bold text-primary dark:text-info text-sm">x{comp.quantity}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </Dialog>
    </div>
  );
});

SelectedKitCard.displayName = "SelectedKitCard";

export default SelectedKitCard;