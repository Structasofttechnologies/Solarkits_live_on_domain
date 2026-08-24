import { memo, useCallback, useMemo, useState, useEffect } from"react";
import {
  FaPlus, FaMinus, FaRupeeSign, FaCheck,
  FaShoppingCart, FaTag, FaStar, FaGem, FaHome, FaBolt,
  FaInfoCircle, FaTruck, FaPiggyBank, FaAward,
  FaShieldAlt, FaClock, FaLeaf, FaChevronDown, FaChevronUp,
  FaMapMarkerAlt, FaCogs, FaSolarPanel
} from"react-icons/fa";
import { useDispatch, useSelector } from "react-redux";
import {
  addToCart,
  decreaseQty,
  increaseQty,
  removeFromCart,
  setShowAuthDialog,
  selectLiveStock,
} from "@/features/slice";
import Button from "@/Components/Button";
import IconButton from "@/Components/IconButton";

const DEFAULT_KIT_IMAGE = "https://images.unsplash.com/photo-1509391365360-2e959784a276?w=600&auto=format&fit=crop&q=80";

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
    <div className="flex items-center justify-start gap-1 bg-slate-50 dark:bg-slate-900/30 p-2 rounded-xl border border-border/80 mb-4 overflow-x-auto scrollbar-none select-none">
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

import { FaLayerGroup } from "react-icons/fa";

const KitCard = memo(({ kit, selected, setSelected, viewMode = "grid", compact = false, isCart = false, activeOffers = [], isCompared = false, onToggleCompare = null }) => {
  const dispatch = useDispatch();
  const cart = useSelector((state) => state.slice.cart);
  const liveStock = useSelector(selectLiveStock);
  const { isAuthenticated } = useSelector((state) => state.auth_slice);
  const selectedDistrict = useSelector((state) => state.slice.selectedDistrict);
  const districtName = isCart ? kit.districtName : selectedDistrict?.name;
  const [selectedVariant, setSelectedVariant] = useState(isCart && kit.variantIndex !== undefined ? kit.variantIndex : 0);

  useEffect(() => {
    if (isCart) {
      if (kit.variantIndex !== undefined) {
        setSelectedVariant(kit.variantIndex);
      }
      return;
    }
    if (kit.variants) {
      const cartIndex = kit.variants.findIndex((v, idx) => 
        cart.some(item => item.id === kit.id && item.variantIndex === idx)
      );
      if (cartIndex >= 0) {
        setSelectedVariant(cartIndex);
      }
    }
  }, [kit.id, isCart, kit.variantIndex]);

  const [showVariants, setShowVariants] = useState(false);
  const [showPerksTooltip, setShowPerksTooltip] = useState(false);

  useEffect(() => {
    if (!showPerksTooltip) return;
    const handleOutsideClick = () => {
      setShowPerksTooltip(false);
    };
    document.addEventListener("click", handleOutsideClick);
    return () => {
      document.removeEventListener("click", handleOutsideClick);
    };
  }, [showPerksTooltip]);

  const currentVariant = useMemo(() => {
    if (kit.variants && kit.variants.length > 0) {
      return kit.variants[selectedVariant] || kit.variants[0];
    }
    const ourP = Number(kit.ourPrice || kit.selling_price_inr || kit.price || kit.discounted_price || kit.mrp || 0);
    const mktP = Number(kit.marketPrice || kit.mrp || (ourP > 0 ? Math.round(ourP * 1.15) : 0));
    const gstR = Number(kit.gstRate ?? kit.pricing?.gstRate ?? (kit.taxes_and_charges_inr ? 13.8 : 13.8));
    const cap = kit.capacityKW || (kit.wattage ? (kit.wattage >= 100 ? (kit.wattage / 1000) : kit.wattage) : 0.55);
    return {
      productTier: kit.productTier || kit.tier || kit.sku_code || "Tier-1 High Efficiency",
      ourPrice: ourP,
      marketPrice: mktP,
      gstRate: gstR,
      availableStock: kit.availableStock ?? kit.stock_quantity ?? 999,
      inStock: kit.inStock !== false,
      capacityKW: cap,
      tierColor: kit.tierColor || null,
      tierBenefits: kit.tierBenefits || ["Verified Tier-1 Quality", "Factory Direct Supply"],
      includedDeliveryCharge: kit.includedDeliveryCharge || 0,
      image: kit.kitImage || kit.image_url || kit.image || kit.product_image || DEFAULT_KIT_IMAGE,
    };
  }, [kit, selectedVariant]);

  // Memoize the type class function for usageType
  const getUsageTypeClass = useCallback(() => {
    return "bg-primary/5 dark:bg-primary/10 dark:bg-primary/15 text-primary dark:text-info border border-primary/15 dark:border-info/20";
  }, []);

  // Memoize tier styling and icon
  const getTierConfig = useCallback((tier, color) => {
    const tierLabel = tier || "Standard Upgrade";
    // Use custom color if provided (from dynamic DB config)
    const hasCustomColor = !!color;
    return {
      text: hasCustomColor ? "" : "text-primary dark:text-info",
      border: hasCustomColor ? "" : "border-primary/15 dark:border-info/20",
      icon: <FaAward className={hasCustomColor ? "" : "text-primary dark:text-info"} style={hasCustomColor ? { color } : undefined} />,
      label: tierLabel,
      bg: hasCustomColor ? "" : "bg-primary/5 dark:bg-primary/10",
      badgeBg: hasCustomColor ? "" : "bg-primary/5 dark:bg-primary/10",
      badgeText: hasCustomColor ? "" : "text-primary dark:text-info",
      accent: "primary",
      gradient: "from-primary to-primary",
      customColor: color || null,
    };
  }, []);

  // Memoize derived values
  const cartItemId = useMemo(() => isCart && kit.cartItemId ? kit.cartItemId : `${kit.id}-${selectedVariant}`,
    [kit.id, selectedVariant, isCart, kit.cartItemId]
  );

  const cartItem = useMemo(() =>
    cart.find((item) => item.cartItemId === cartItemId),
    [cart, cartItemId]
  );

  // Use liveStock if available for real-time stock check
  const effectiveAvailableStock = useMemo(() => {
    if (liveStock[kit.id] !== undefined) return liveStock[kit.id];
    return currentVariant?.availableStock !== undefined ? currentVariant.availableStock : 999;
  }, [liveStock, kit.id, currentVariant?.availableStock]);

  const effectiveInStock = useMemo(() => {
    if (liveStock[kit.id] !== undefined) return liveStock[kit.id] > 0;
    return currentVariant?.inStock !== false;
  }, [liveStock, kit.id, currentVariant?.inStock]);

  const totalKitQtyInCart = useMemo(() => {
    return cart
      .filter(item => item.id === kit.id)
      .reduce((sum, item) => sum + item.qty, 0);
  }, [cart, kit.id]);

  const isMaxStockReached = useMemo(() => {
    return totalKitQtyInCart >= effectiveAvailableStock;
  }, [totalKitQtyInCart, effectiveAvailableStock]);

  const isSelected = useMemo(() =>
    selected === cartItemId,
    [selected, cartItemId]
  );

  const usageTypeClass = useMemo(() =>
    getUsageTypeClass(kit.usageType),
    [getUsageTypeClass, kit.usageType]
  );

  const tierConfig = useMemo(() =>
    getTierConfig(currentVariant?.productTier, currentVariant?.tierColor),
    [getTierConfig, currentVariant?.productTier, currentVariant?.tierColor]
  );

  const isBundleEligible = useMemo(() => {
    if (!activeOffers || activeOffers.length === 0) return false;
    const bundleOffer = activeOffers.find(o => o.offer_type === 'bundle');
    if (!bundleOffer) return false;
    if (!bundleOffer.products_applicable || bundleOffer.products_applicable.length === 0) {
      return true;
    }
    return bundleOffer.products_applicable.some(pId => pId.toString() === kit.id.toString());
  }, [activeOffers, kit.id]);

  // Memoize event handlers
  const handleSelect = useCallback(() => {
    setSelected(isSelected ? null : cartItemId);
  }, [isSelected, cartItemId, setSelected]);

  const handleKeyPress = useCallback((e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleSelect();
    }
  }, [handleSelect]);

  const handleAddToCart = useCallback((e) => {
    e.stopPropagation();
    if (!isAuthenticated) {
      dispatch(setShowAuthDialog(true));
      return;
    }
    if (kit.limitedStock?.displayPopup) {
      alert(`⚠️ Limited Stock Warning!\nOnly ${kit.limitedStock.quantityLeft} kits are available in inventory for this configuration. Hurry and complete your checkout!`);
    }
    dispatch(addToCart({ id: kit.id, variantIndex: selectedVariant }));
  }, [dispatch, kit.id, selectedVariant, kit.limitedStock, isAuthenticated]);

  const handleDecreaseQty = useCallback((e) => {
    e.stopPropagation();
    if (cartItem?.qty > 1) {
      dispatch(decreaseQty(cartItemId));
    } else {
      dispatch(removeFromCart(cartItemId));
    }
  }, [dispatch, cartItemId, cartItem?.qty]);

  const handleIncreaseQty = useCallback((e) => {
    e.stopPropagation();
    dispatch(increaseQty(cartItemId));
  }, [dispatch, cartItemId]);

  const handleVariantChange = useCallback((index) => {
    setSelectedVariant(index);
    setShowVariants(false);
  }, []);

  // Memoize formatted prices
  const formattedPrices = useMemo(() => {
    const ourPriceNum = Number(currentVariant?.ourPrice || kit?.ourPrice || kit?.selling_price_inr || 0);
    const marketPriceNum = Number(currentVariant?.marketPrice || kit?.marketPrice || (ourPriceNum > 0 ? Math.round(ourPriceNum * 1.15) : 0));
    const gstRate = Number(currentVariant?.gstRate ?? kit?.gstRate ?? kit?.pricing?.gstRate ?? 13.8);
    const gstIncludedAmount = ourPriceNum > 0 && !isNaN(ourPriceNum)
      ? Math.max(0, ourPriceNum - Math.round(ourPriceNum / (1 + (gstRate / 100))))
      : 0;

    return {
      marketPrice: marketPriceNum > 0 ? marketPriceNum.toLocaleString("en-IN") : "",
      ourPrice: ourPriceNum > 0 ? ourPriceNum.toLocaleString("en-IN") : "0",
      gstIncluded: gstIncludedAmount > 0 ? gstIncludedAmount.toLocaleString("en-IN") : "0",
      gstRate: !isNaN(gstRate) ? gstRate : 13.8
    };
  }, [currentVariant?.marketPrice, currentVariant?.ourPrice, currentVariant?.gstRate, kit]);

  // Dynamic capacity & display values
  const displayCapacity = useMemo(() => {
    if (kit?.capacityKW !== undefined && kit.capacityKW !== null && kit.capacityKW !== "") {
      return `${kit.capacityKW} kW`;
    }
    if (currentVariant?.capacityKW !== undefined && currentVariant.capacityKW !== null && currentVariant.capacityKW !== "") {
      return `${currentVariant.capacityKW} kW`;
    }
    if (kit?.wattage) {
      return kit.wattage >= 100 ? `${(kit.wattage / 1000).toFixed(2)} kW` : `${kit.wattage} kW`;
    }
    return "0.55 kW";
  }, [kit?.capacityKW, currentVariant?.capacityKW, kit?.wattage]);

  const displayImage = useMemo(() => {
    return resolveImageUrl(
      kit?.kitImage ||
      kit?.image_url ||
      kit?.image ||
      kit?.product_image ||
      currentVariant?.image ||
      kit?.panel?.panelImage ||
      DEFAULT_KIT_IMAGE
    );
  }, [kit, currentVariant]);

  const displayDescription = useMemo(() => {
    return kit?.description || kit?.summary || currentVariant?.description || "High-efficiency Tier-1 Solar PV Module engineered for rooftop and ground mount installations.";
  }, [kit?.description, kit?.summary, currentVariant?.description]);

  const displayKitName = useMemo(() => {
    return kit?.kitName || kit?.title || kit?.name || "Solar Module";
  }, [kit?.kitName, kit?.title, kit?.name]);

  const generationEstimateDisplay = useMemo(() => {
    if (kit?.generationEstimateKWhPerYear && !isNaN(kit.generationEstimateKWhPerYear)) {
      return Number(kit.generationEstimateKWhPerYear).toLocaleString("en-IN");
    }
    const capNum = parseFloat(displayCapacity) || 0.55;
    return Math.round(capNum * 4 * 365).toLocaleString("en-IN");
  }, [kit?.generationEstimateKWhPerYear, displayCapacity]);

  // Use backend-computed discount percent (showcase price vs our price)
  // Falls back to frontend calculation if field is missing (backwards compat)
  const discountPercentage = useMemo(() => {
    if (currentVariant?.discountPercent !== undefined) return currentVariant.discountPercent;
    const mkt = Number(currentVariant?.marketPrice || kit?.marketPrice || 0);
    const our = Number(currentVariant?.ourPrice || kit?.ourPrice || 0);
    if (!mkt || !our || mkt <= our) return 0;
    return Math.round(((mkt - our) / mkt) * 100);
  }, [currentVariant?.discountPercent, currentVariant?.marketPrice, currentVariant?.ourPrice, kit]);

  // Cart calculations for total and savings
  const cartCalculations = useMemo(() => {
    if (!cartItem || !currentVariant) {
      return {
        totalSavings: 0,
        totalAmount: 0,
        totalItems: 0,
        quantity: 0,
        totalMarketPrice: 0
      };
    }

    const quantity = cartItem.qty;
    const totalMarketPrice = quantity * currentVariant.marketPrice;
    const totalOurPrice = quantity * currentVariant.ourPrice;
    const totalSavings = totalMarketPrice - totalOurPrice;

    return {
      totalSavings,
      totalAmount: totalOurPrice,
      totalItems: quantity,
      quantity,
      totalMarketPrice
    };
  }, [cartItem, currentVariant]);

  const formattedCalculations = useMemo(() => ({
    totalSavings: cartCalculations.totalSavings.toLocaleString("en-IN"),
    totalAmount: cartCalculations.totalAmount.toLocaleString("en-IN"),
    totalMarketPrice: cartCalculations.totalMarketPrice.toLocaleString("en-IN"),
  }), [cartCalculations]);

  // Get first benefit for preview
  const firstBenefit = useMemo(() =>
    currentVariant?.tierBenefits && currentVariant.tierBenefits.length > 0 ? currentVariant.tierBenefits[0] : null,
    [currentVariant?.tierBenefits]
  );

  // Delivery charge display
  const deliverySavings = useMemo(() =>
    currentVariant?.includedDeliveryCharge?.toLocaleString("en-IN") || 0,
    [currentVariant?.includedDeliveryCharge]
  );

  // Grid View Component
  // Grid View Component
  const GridView = () => (
    <div
      className={`relative bg-surface rounded-2xl border flex flex-col transition-all duration-300 cursor-pointer overflow-hidden h-full group ${
        isSelected
          ?"border-primary ring-2 ring-primary/20 bg-gradient-to-b from-primary/[0.01] to-primary/[0.02] shadow-lg"
          :"border-border hover:border-primary/30 hover:shadow-xl hover:-translate-y-1.5"
      } ${compact ? 'p-3' : 'p-5'}`}
      onClick={handleSelect}
      onKeyDown={handleKeyPress}
      tabIndex={0}
      role="button"
      aria-pressed={isSelected}
      aria-label={`Select ${kit.kitName} kit`}
    >
      {/* Selection Glow Indicator */}
      {isSelected && (
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-primary-end" />
      )}

      {/* Header Row */}
      <div className="flex justify-between items-center mb-4 gap-2">
        {kit.hasNoAssignedVariants ? (
          kit.brand ? (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border border-border bg-surface-hover text-text-primary">
              <span>{kit.brand}</span>
            </div>
          ) : (
            <div />
          )
        ) : kit.variants && kit.variants.length > 0 ? (
          <div
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border transition-all duration-200 group-hover:scale-105 ${!currentVariant?.tierColor ?`${tierConfig.border} ${tierConfig.bg}` :""}`}
            style={currentVariant?.tierColor ? {
              backgroundColor:`${currentVariant.tierColor}15`,
              color: currentVariant.tierColor,
              borderColor:`${currentVariant.tierColor}35`
            } : undefined}
          >
            <span className={!currentVariant?.tierColor ? tierConfig.text :""} style={currentVariant?.tierColor ? { color: currentVariant.tierColor } : undefined}>
              {tierConfig.icon}
            </span>
            <span className={!currentVariant?.tierColor ? tierConfig.text :""} style={currentVariant?.tierColor ? { color: currentVariant.tierColor } : undefined}>
              {kit.brand ? `${kit.brand} • ` : ""}{currentVariant?.productTier}
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border border-border bg-surface-hover text-text-primary">
            <span>{kit.brand}</span>
          </div>
        )}
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full border shadow-xs ${!kit.usageTypeColor ? usageTypeClass :""}`}
          style={kit.usageTypeColor ? {
            backgroundColor:`${kit.usageTypeColor}15`,
            color: kit.usageTypeColor,
            borderColor:`${kit.usageTypeColor}35`
          } : undefined}
        >
          {kit.usageTypeImage && (
            <img
              src={resolveImageUrl(kit.usageTypeImage)}
              alt=""
              className="w-5 h-5 object-contain rounded-full shrink-0"
              onError={(e) => { e.target.style.display = "none"; }}
            />
          )}
          <span>{kit.usageType}</span>
        </span>
      </div>

      {/* Image container with gradient and hover zoom */}
      <div className={`relative z-[2] mb-4 flex justify-center items-center bg-gradient-to-tr from-gray-50/50 to-slate-100/50 rounded-xl overflow-hidden border border-border w-full ${compact ? 'h-36' : 'h-64'}`}>
        {/* Badges Overlay */}
        <div className="absolute top-2 left-2 flex flex-col gap-1.5 z-10">
          {districtName && (
            <span className="bg-primary/90 text-white text-[9px] font-black px-2 py-0.5 rounded-md shadow-md flex items-center gap-1">
              <FaMapMarkerAlt size={9} className="text-white shrink-0" /> {districtName}
            </span>
          )}
          {kit.limitedStock?.displayBadge && (
            <span className="bg-red-500 text-white text-[10px] font-bold px-2.5 py-1 rounded-lg shadow-md flex items-center gap-1 animate-pulse">
              🔥 Only {kit.limitedStock.quantityLeft} Left
            </span>
          )}
          {kit.flashSale && (
            <span className="bg-amber-500 text-white text-[10px] font-bold px-2.5 py-1 rounded-lg shadow-md flex items-center gap-1">
              ⚡ Flash Sale
            </span>
          )}
          {isBundleEligible && (
            <span className="bg-blue-600 text-white text-[10px] font-bold px-2.5 py-1 rounded-lg shadow-md flex items-center gap-1">
              📦 Buy Pack Offer
            </span>
          )}
        </div>
        {onToggleCompare && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleCompare(kit);
            }}
            className={`absolute top-2 right-2 z-10 px-2.5 py-1 rounded-lg text-[10px] font-black flex items-center gap-1.5 transition-all shadow-md cursor-pointer ${
              isCompared
                ? "bg-primary text-white ring-2 ring-primary/40"
                : "bg-white/95 dark:bg-slate-900/95 text-text-primary hover:bg-white border border-border"
            }`}
            title={isCompared ? "Remove from comparison" : "Add to comparison"}
          >
            <FaLayerGroup size={10} className={isCompared ? "text-white" : "text-primary"} />
            <span>{isCompared ? "✓ Compared" : "Compare"}</span>
          </button>
        )}
        <img
          src={displayImage}
          alt={displayKitName}
          className="w-full h-full p-2 object-contain transition-transform duration-500 group-hover:scale-110"
          loading="lazy"
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = DEFAULT_KIT_IMAGE;
          }}
        />
        {/* Decorative background circle */}
        <div className="absolute -z-10 w-40 h-40 bg-primary/5 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
      </div>

      {/* Text Details */}
      <div className="flex-1 flex flex-col">
        <h3 className={`font-bold text-text-primary mb-1.5 line-clamp-1 leading-tight group-hover:text-primary dark:group-hover:text-info transition-colors ${compact ? 'text-base' : 'text-lg'}`}>
          {displayKitName}
        </h3>
        <p className="text-text-secondary text-xs line-clamp-2 leading-relaxed mb-4">
          {displayDescription}
        </p>

        {/* Dynamic Capacity Badge & Warranty Info Row */}
        <div className="flex items-center gap-2 mb-4">
          <div className="flex items-center gap-1.5 bg-primary/5 dark:bg-primary/10 dark:bg-primary/15 text-primary dark:text-info border border-primary/10 dark:border-info/10 text-xs font-bold px-2.5 py-1 rounded-lg">
            <FaBolt className="text-[10px]" />
            <span>{displayCapacity}</span>
          </div>
          {kit.warrantyYears && (
            <div className="flex items-center gap-1.5 bg-primary/5 dark:bg-primary/10 dark:bg-primary/15 text-primary dark:text-info border border-primary/10 dark:border-info/10 text-xs font-bold px-2.5 py-1 rounded-lg">
              <FaShieldAlt className="text-[10px]" />
              <span>{kit.warrantyYears} Years</span>
            </div>
          )}
        </div>

        <KitComponentsRow kit={kit} />

        {/* Variant Selector Dropdown */}
        {kit.variants?.length > 1 && !isCart && (
          <div className="relative mb-4" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setShowVariants(!showVariants)}
              className="w-full flex items-center justify-between px-3 py-2 bg-surface-hover hover:bg-surface-hover/80 rounded-xl border border-border text-xs font-semibold text-text-primary transition-colors"
            >
              <span className="flex items-center gap-2">
                {tierConfig.icon}
                <span style={currentVariant?.tierColor ? { color: currentVariant.tierColor } : undefined}>{currentVariant?.productTier}</span>
              </span>
              <span className="flex items-center gap-1 text-text-secondary font-normal">
                <span className="font-bold" style={currentVariant?.tierColor ? { color: currentVariant.tierColor } : { color: 'var(--color-primary)' }}>₹{currentVariant?.ourPrice?.toLocaleString("en-IN")}</span>
                {showVariants ? <FaChevronUp size={10} className="ml-1" /> : <FaChevronDown size={10} className="ml-1" />}
              </span>
            </button>
            
            {showVariants && (
              <div className="absolute bottom-full mb-1 left-0 right-0 bg-surface rounded-xl border border-border shadow-xl z-20 overflow-hidden divide-y divide-border animate-in fade-in slide-in-from-bottom-2 duration-200">
                {kit.variants.map((variant, index) => {
                  const variantTierConfig = getTierConfig(variant.productTier, variant.tierColor);
                  const variantDiscount = variant.marketPrice > variant.ourPrice
                    ? Math.round(((variant.marketPrice - variant.ourPrice) / variant.marketPrice) * 100)
                    : 0;
                  return (
                    <button
                      key={index}
                      onClick={() => handleVariantChange(index)}
                      className={`w-full flex items-center justify-between px-3 py-2.5 hover:bg-surface-hover text-xs transition-colors ${
                        index === selectedVariant ? 'bg-primary/[0.03] font-bold' : 'text-text-primary'
                      }`}
                      style={index === selectedVariant && variant.tierColor ? { color: variant.tierColor, backgroundColor:`${variant.tierColor}08` } : undefined}
                    >
                      <span className="flex items-center gap-2">
                        <span>{variantTierConfig.icon}</span>
                        <span>{variant.productTier}</span>
                      </span>
                      <div className="text-right">
                        <span className="font-bold" style={variant.tierColor ? { color: variant.tierColor } : { color: 'var(--color-primary)' }}>
                          ₹{variant.ourPrice?.toLocaleString("en-IN")}
                        </span>
                        {variantDiscount > 0 && (
                          <span className="block text-[9px] text-text-muted font-normal line-through">
                            ₹{variant.marketPrice?.toLocaleString("en-IN")}
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Pricing Info */}
        <div className="flex items-end justify-between mb-4 border-t border-border pt-4">
          <div className="text-left">
            <span className="text-[10px] text-text-muted font-bold uppercase tracking-wider block mb-0.5">Special Price</span>
            <div className="flex items-center gap-1">
              <span className="text-lg font-extrabold text-text-primary leading-none">₹{formattedPrices.ourPrice}</span>
              {discountPercentage > 0 && (
                <del className="text-xs text-text-muted font-semibold ml-1">₹{formattedPrices.marketPrice}</del>
              )}
            </div>
            {formattedPrices.gstIncluded && (
              <span className="text-[10px] text-success font-semibold block mt-0.5">
                (Includes ₹{formattedPrices.gstIncluded} GST @ {formattedPrices.gstRate}%)
              </span>
            )}
          </div>
          {discountPercentage > 0 && (
            <span className="bg-primary/5 dark:bg-primary/10 dark:bg-primary/15 text-primary dark:text-info text-xs font-bold px-2.5 py-1 rounded-lg border border-primary/15 dark:border-info/20 shadow-2xs">
              Save {discountPercentage}%
            </span>
          )}
        </div>

        {/* Promo Badges (Free Delivery, Savings) */}
        {currentVariant?.includedDeliveryCharge > 0 && (
          <div className="flex items-center justify-between bg-blue-500/5 text-blue-700 rounded-xl px-3 py-2 border border-blue-500/10 text-xs font-bold mb-4">
            <span className="flex items-center gap-1.5">
              <FaTruck size={12} className="text-blue-500" />
              Free Shipping Included
            </span>
            <span>Save ₹{deliverySavings}</span>
          </div>
        )}

        {/* Tier Benefits Quick Popup Badge */}
        {currentVariant?.tierBenefits && currentVariant.tierBenefits.length > 0 && (
          <div className="relative mb-4 w-fit">
            {showPerksTooltip && (
              <div className="absolute bottom-full left-0 mb-2 w-56 p-3 bg-gray-900/95 backdrop-blur-xs text-white text-xs rounded-xl z-20 shadow-xl border border-gray-800 animate-in fade-in slide-in-from-bottom-1 duration-150">
                <div className="font-bold flex items-center justify-between mb-2 gap-2 border-b border-gray-800 pb-1.5">
                  <div className="flex items-center gap-2">
                    <FaAward className={tierConfig.text} />
                    <span>{currentVariant?.productTier} Tier Perks</span>
                  </div>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowPerksTooltip(false);
                    }}
                    className="text-white/60 hover:text-white text-xs font-bold w-4 h-4 flex items-center justify-center rounded-full hover:bg-white/10"
                  >
                    ✕
                  </button>
                </div>
                <ul className="space-y-1.5">
                  {currentVariant.tierBenefits.map((benefit, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <FaCheck className="text-green-400 text-[10px] mt-0.5 flex-shrink-0" />
                      <span className="text-gray-300 leading-tight">{benefit}</span>
                    </li>
                  ))}
                </ul>
                <div className="absolute top-full left-4 border-4 border-transparent border-t-gray-900" />
              </div>
            )}

            <div 
              onClick={(e) => {
                e.stopPropagation();
                setShowPerksTooltip(!showPerksTooltip);
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold cursor-pointer select-none transition-colors border ${tierConfig.badgeBg} ${tierConfig.badgeText} ${tierConfig.border}`}
            >
              <FaInfoCircle size={12} className={tierConfig.text} />
              <span className="truncate max-w-[150px]">{firstBenefit}</span>
              {currentVariant.tierBenefits.length > 1 && (
                <span className={`bg-white/70 shadow-3xs px-1.5 py-0.5 rounded-full text-[9px] font-bold ${tierConfig.text}`}>
                  +{currentVariant.tierBenefits.length - 1}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Cart Item Detail */}
        {cartItem && cartCalculations.quantity > 0 && (
          <div className="mb-4 p-3 bg-primary/[0.02] border border-primary/20 dark:border-info/25 rounded-xl text-xs space-y-1.5">
            <div className="flex justify-between items-center text-text-secondary font-medium">
              <span>Selected Qty:</span>
              <span className="font-bold text-text-primary">{cartCalculations.quantity} {cartCalculations.quantity === 1 ? 'kit' : 'kits'}</span>
            </div>
            {cartCalculations.totalSavings > 0 && (
              <div className="flex justify-between items-center text-green-700 font-bold">
                <span className="flex items-center gap-1">
                  <FaPiggyBank size={12} />
                  Total Savings:
                </span>
                <span>₹{formattedCalculations.totalSavings}</span>
              </div>
            )}
          </div>
        )}

        {/* Action Button Section */}
        <div className="mt-auto pt-2">
          {cartItem ? (
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
                {cartItem.qty} {cartItem.qty === 1 ? 'Kit' : 'Kits'}
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
          ) : !effectiveInStock ? (
            <Button
              variant="danger"
              size="md"
              fullWidth
              disabled
              className="bg-red-50 text-red-500 border border-red-200 cursor-not-allowed hover:bg-red-50"
            >
              Out of Stock
            </Button>
          ) : (
            <Button
              onClick={handleAddToCart}
              variant="primary"
              size="md"
              fullWidth
              leftIcon={<FaShoppingCart />}
              className="bg-gradient-to-r from-primary to-primary-end text-white font-bold rounded-xl shadow-md hover:shadow-lg transition-all duration-200 transform active:scale-98"
            >
              Add to Cart
            </Button>
          )}
        </div>

        {/* Eco & Generation footer stats */}
        <div className="mt-4 flex justify-between items-center text-[10px] text-text-muted font-bold border-t border-border pt-3">
          <span className="flex items-center gap-1">
            <FaClock className="text-primary/70 dark:text-info/70" />
            {generationEstimateDisplay} kWh/Yr
          </span>
          <span className="flex items-center gap-1 text-primary dark:text-info">
            <FaLeaf />
            Clean Energy
          </span>
        </div>
      </div>
    </div>
  );

  // List View Component
  const ListView = () => (
    <div
      className={`relative bg-surface rounded-2xl border flex transition-all duration-300 cursor-pointer overflow-hidden group w-full ${
        isSelected
          ?"border-primary ring-2 ring-primary/20 bg-gradient-to-r from-primary/[0.01] to-primary/[0.02] shadow-lg"
          :"border-border hover:border-primary/30 hover:shadow-xl hover:-translate-y-1"
      } ${compact ? 'p-3' : 'p-5'}`}
      onClick={handleSelect}
      onKeyDown={handleKeyPress}
      tabIndex={0}
      role="button"
      aria-pressed={isSelected}
      aria-label={`Select ${displayKitName} kit`}
    >
      {/* Selection indicators */}
      {isSelected && (
        <div className="absolute top-0 bottom-0 left-0 w-1 bg-gradient-to-b from-primary to-primary-end" />
      )}

      <div className="flex gap-5 w-full items-stretch">
        {/* Left: Image with hover effect */}
        <div className={`relative z-[2] flex-shrink-0 bg-gradient-to-tr from-gray-50/50 to-slate-100/50 rounded-xl overflow-hidden border border-border flex items-center justify-center ${
          compact ? 'w-28 h-28' : 'w-52 h-52'
        }`}>
          {/* Badges Overlay */}
          <div className="absolute top-1 left-1 flex flex-col gap-1 z-10">
            {districtName && (
              <span className="bg-primary/90 text-white text-[7px] font-black px-1 py-0.5 rounded shadow flex items-center gap-1">
                <FaMapMarkerAlt size={7} className="text-white shrink-0" /> {districtName}
              </span>
            )}
            {kit.limitedStock?.displayBadge && (
              <span className="bg-red-500 text-white text-[8px] font-bold px-1.5 py-0.5 rounded shadow flex items-center gap-0.5 animate-pulse">
                🔥 Only {kit.limitedStock.quantityLeft} Left
              </span>
            )}
            {kit.flashSale && (
              <span className="bg-amber-500 text-white text-[8px] font-bold px-1.5 py-0.5 rounded shadow flex items-center gap-0.5">
                ⚡ Sale
              </span>
            )}
            {isBundleEligible && (
              <span className="bg-blue-600 text-white text-[8px] font-bold px-1.5 py-0.5 rounded shadow flex items-center gap-0.5">
                📦 Buy Pack Offer
              </span>
            )}
          </div>
          {onToggleCompare && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onToggleCompare(kit);
              }}
              className={`absolute top-1 right-1 z-10 px-1.5 py-0.5 rounded text-[8px] font-bold flex items-center gap-1 transition-all shadow cursor-pointer ${
                isCompared
                  ? "bg-primary text-white"
                  : "bg-white/95 dark:bg-slate-900/95 text-text-primary hover:bg-white border border-border"
              }`}
              title={isCompared ? "Remove from comparison" : "Add to comparison"}
            >
              <FaLayerGroup size={8} className={isCompared ? "text-white" : "text-primary"} />
              <span>{isCompared ? "✓" : "Compare"}</span>
            </button>
          )}
          <img
            src={displayImage}
            alt={displayKitName}
            className="w-full h-full p-2.5 object-contain transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = DEFAULT_KIT_IMAGE;
            }}
          />
        </div>

        {/* Right Content */}
        <div className="flex-1 flex flex-col md:flex-row gap-4 justify-between">
          {/* Main info section */}
          <div className="flex-1 min-w-0 flex flex-col justify-between">
            <div>
              {/* Badges Row */}
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                {kit.hasNoAssignedVariants ? (
                  kit.brand ? (
                    <div className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border border-border bg-surface-hover text-text-primary">
                      <span>{kit.brand}</span>
                    </div>
                  ) : null
                ) : (
                  <div
                    className={`flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${!currentVariant?.tierColor ?`${tierConfig.border} ${tierConfig.bg}` :""}`}
                    style={currentVariant?.tierColor ? {
                      backgroundColor:`${currentVariant.tierColor}15`,
                      color: currentVariant.tierColor,
                      borderColor:`${currentVariant.tierColor}35`
                    } : undefined}
                  >
                    <span className={!currentVariant?.tierColor ? tierConfig.text :""} style={currentVariant?.tierColor ? { color: currentVariant.tierColor } : undefined}>
                      {tierConfig.icon}
                    </span>
                    <span className={!currentVariant?.tierColor ? tierConfig.text :""} style={currentVariant?.tierColor ? { color: currentVariant.tierColor } : undefined}>
                      {kit.brand ? `${kit.brand} • ` : ""}{currentVariant?.productTier}
                    </span>
                  </div>
                )}
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 text-[11px] font-semibold rounded-full border shadow-xs ${!kit.usageTypeColor ? usageTypeClass :""}`}
                  style={kit.usageTypeColor ? {
                    backgroundColor:`${kit.usageTypeColor}15`,
                    color: kit.usageTypeColor,
                    borderColor:`${kit.usageTypeColor}35`
                  } : undefined}
                >
                  {kit.usageTypeImage && (
                    <img
                      src={resolveImageUrl(kit.usageTypeImage)}
                      alt=""
                      className="w-5 h-5 object-contain rounded-full shrink-0"
                      onError={(e) => { e.target.style.display = "none"; }}
                    />
                  )}
                  <span>{kit.usageType}</span>
                </span>
                {!currentVariant?.inStock && (
                  <span className="px-2.5 py-0.5 text-[11px] font-semibold rounded-full bg-red-50 text-red-600 border border-red-200">
                    Out of Stock
                  </span>
                )}
              </div>

              {/* Title & Desc */}
              <h3 className={`font-bold text-text-primary mb-1 line-clamp-1 leading-tight group-hover:text-primary dark:group-hover:text-info transition-colors ${compact ? 'text-base' : 'text-lg'}`}>
                {displayKitName}
              </h3>
              <p className="text-text-secondary text-xs line-clamp-2 leading-relaxed mb-3">
                {displayDescription}
              </p>
            </div>

            <KitComponentsRow kit={kit} />

            {/* Spec Badges Row & Benefits */}
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2">
                <span className="bg-blue-50/80 text-blue-700 border border-primary/20/80 text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1">
                  <FaBolt size={10} />
                  {displayCapacity} Capacity
                </span>
                {discountPercentage > 0 && (
                  <span className="bg-green-50 text-green-700 border border-green-100 text-[10px] font-bold px-2 py-0.5 rounded-md">
                    {discountPercentage}% Off
                  </span>
                )}
                {currentVariant?.includedDeliveryCharge > 0 && (
                  <span className="bg-primary/10 dark:bg-primary/15 text-primary dark:text-info border border-primary/20 dark:border-info/25 text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1">
                    <FaTruck size={10} />
                    Free Delivery
                  </span>
                )}
              </div>

              {/* Benefits list */}
              {currentVariant?.tierBenefits && currentVariant.tierBenefits.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {currentVariant.tierBenefits.slice(0, 2).map((benefit, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center gap-1 text-[10px] bg-green-500/10 text-green-700 px-2 py-1 rounded-md border border-green-500/20"
                      title={benefit}
                    >
                      <FaCheck className="text-green-600 text-[8px]" />
                      {benefit.length > 24 ?`${benefit.substring(0, 24)}...` : benefit}
                    </span>
                  ))}
                  {currentVariant.tierBenefits.length > 2 && (
                    <span className="inline-flex items-center text-[10px] bg-surface-hover text-text-secondary px-2 py-1 rounded-md border border-border">
                      +{currentVariant.tierBenefits.length - 2} more
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Right sidebar action & pricing section */}
          <div className="flex-shrink-0 w-full md:w-52 flex flex-col justify-between border-t md:border-t-0 md:border-l border-border pt-3 md:pt-0 md:pl-4">
            {/* Pricing Section */}
            <div className="mb-3 text-left md:text-right">
              <span className="text-[10px] text-text-muted font-bold uppercase tracking-wider block mb-0.5">Special Price</span>
              <div className="flex items-baseline md:justify-end gap-1.5 flex-wrap">
                <span className="text-xl font-extrabold text-text-primary">₹{formattedPrices.ourPrice}</span>
                {discountPercentage > 0 && (
                  <del className="text-xs text-text-muted font-semibold">₹{formattedPrices.marketPrice}</del>
                )}
              </div>
              {formattedPrices.gstIncluded && (
                <span className="text-[10px] text-success font-semibold block mt-0.5 md:text-right">
                  (Includes ₹{formattedPrices.gstIncluded} GST @ {formattedPrices.gstRate}%)
                </span>
              )}
                
                {/* Variant Selector Button - List View */}
                {kit.variants?.length > 1 && (
                  <div className="relative mb-3 w-full" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => setShowVariants(!showVariants)}
                      className="w-full flex items-center justify-between px-2.5 py-1.5 bg-surface-hover hover:bg-surface-hover rounded-lg border border-border text-xs font-semibold text-text-primary"
                    >
                      <span className="flex items-center gap-1.5">
                        {tierConfig.icon}
                        <span style={currentVariant?.tierColor ? { color: currentVariant.tierColor } : undefined}>{currentVariant?.productTier}</span>
                      </span>
                      {showVariants ? <FaChevronUp size={10} /> : <FaChevronDown size={10} />}
                    </button>
                    
                    {showVariants && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-surface rounded-xl border border-border shadow-xl z-20 overflow-hidden divide-y divide-border">
                        {kit.variants.map((variant, index) => {
                          const variantTierConfig = getTierConfig(variant.productTier, variant.tierColor);
                          const variantDiscount = variant.marketPrice > variant.ourPrice
                            ? Math.round(((variant.marketPrice - variant.ourPrice) / variant.marketPrice) * 100)
                            : 0;
                          return (
                            <button
                              key={index}
                              onClick={() => handleVariantChange(index)}
                              className={`w-full flex items-center justify-between px-3 py-2 hover:bg-surface-hover text-xs transition-colors ${
                                index === selectedVariant ? 'bg-primary/[0.03] font-bold' : 'text-text-primary'
                              }`}
                              style={index === selectedVariant && variant.tierColor ? { color: variant.tierColor, backgroundColor:`${variant.tierColor}08` } : undefined}
                            >
                              <span className="flex items-center gap-1.5">
                                <span>{variantTierConfig.icon}</span>
                                <span>{variant.productTier}</span>
                              </span>
                              <div className="text-right">
                                <span className="font-bold" style={variant.tierColor ? { color: variant.tierColor } : { color: 'var(--color-primary)' }}>
                                  ₹{variant.ourPrice?.toLocaleString("en-IN")}
                                </span>
                                {variantDiscount > 0 && (
                                  <span className="block text-[9px] text-text-muted font-normal line-through">
                                    ₹{variant.marketPrice?.toLocaleString("en-IN")}
                                  </span>
                                )}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Cart Calculations Summary */}
            {cartItem && cartCalculations.quantity > 0 && (
              <div className="mb-3 p-2 bg-primary/[0.02] border border-primary/20 dark:border-info/25 rounded-xl text-[11px] space-y-1">
                <div className="flex justify-between items-center text-text-secondary">
                  <span>Selected:</span>
                  <span className="font-bold text-text-primary">{cartCalculations.quantity} kits</span>
                </div>
                {cartCalculations.totalSavings > 0 && (
                  <div className="flex justify-between items-center text-green-700 font-bold">
                    <span>Savings:</span>
                    <span>₹{formattedCalculations.totalSavings}</span>
                  </div>
                )}
              </div>
            )}

            {/* Cart Button */}
            <div>
              {!currentVariant?.inStock ? (
                <Button
                  variant="danger"
                  size="md"
                  fullWidth
                  disabled
                  className="bg-red-50 text-red-500 border border-red-200 cursor-not-allowed"
                >
                  Out of Stock
                </Button>
              ) : !cartItem ? (
                <Button
                  onClick={handleAddToCart}
                  variant="primary"
                  size="md"
                  fullWidth
                  leftIcon={<FaShoppingCart />}
                  className="bg-gradient-to-r from-primary to-primary-end text-white font-bold rounded-xl shadow-md hover:shadow-lg transition-all duration-200 transform active:scale-98"
                >
                  Add to Cart
                </Button>
              ) : (
                <div className="flex justify-between items-center bg-gradient-to-r from-primary to-primary-end rounded-xl py-1 px-1.5 shadow-md font-bold text-white px-2">
                  <IconButton
                    onClick={handleDecreaseQty}
                    variant="ghost"
                    size="sm"
                    className="bg-white/15 hover:bg-white/25 text-white border border-white/25 w-8 h-8 rounded-lg shadow-xs"
                  >
                    <FaMinus className="text-[10px]" />
                  </IconButton>
                  <span className="text-sm font-black text-white px-2">
                    {cartItem.qty}
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
        </div>
      </div>
  );

  return viewMode ==="list" ? <ListView /> : <GridView />;
});

KitCard.displayName ="KitCard";

export default KitCard;