import { useEffect, useMemo, useState } from"react";
import axios from"axios";
import {
    FiGrid, FiList, FiSearch, FiX, FiShoppingCart,
    FiDollarSign, FiTag, FiPackage, FiPercent, FiTruck,
    FiShield,  FiAward, FiStar, FiHome, FiZap,
    FiTrendingUp, FiPieChart
} from 'react-icons/fi';
import { FaGem, FaSolarPanel } from"react-icons/fa";
import { useSelector } from"react-redux";
import SelectedKitCard from "@/Pages/dashboard/components/SelectedKitCard";
import KitCard from "@/Pages/dashboard/components/KitCard";
import Dialog from "@/Components/Dialog";
import GstVerificationDialog from "@/Components/GstVerificationDialog";
import Button from "@/Components/Button";
import IconButton from "@/Components/IconButton";
import Dropdown from "@/Components/Dropdown";
import CustomInput from "@/Components/CustomInput";
import { useNavigate } from"react-router-dom";

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
                const res = await axios.get(`${apiBase}/india/v1/shop/gst/status?state_id=${stateId}`, { withCredentials: true });
                if (res.data?.success && !res.data.verified) {
                    setGstStateId(stateId);
                    setShowGstDialog(true);
                    return;
                }
            } catch (err) {
                console.error("GST checkout check failed:", err);
            }
        }
        navigate('/checkout');
    };

    const handleGstVerified = () => {
        setShowGstDialog(false);
        navigate('/checkout');
    };
    
    const [checkoutSettings, setCheckoutSettings] = useState({
        enable_checkout_timer: true,
        checkout_timer_duration: 20,
        gst_rate: 13.8
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
                const distId = selectedDistrict?._id || selectedDistrict?.id ||"";
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
        return activeOffers.find(o => o.offer_type === 'bundle');
    }, [activeOffers]);
    const [selectedKit, setSelectedKit] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [viewMode, setViewMode] = useState("grid");
    const [sortBy, setSortBy] = useState("default");
    const [showSummary, setShowSummary] = useState(true);

    // Sort options for dropdown
    const sortOptions = [
        { value:"default", text:"Default Sorting" },
        { value:"price-low", text:"Price: Low to High" },
        { value:"price-high", text:"Price: High to Low" },
        { value:"capacity", text:"Capacity: High to Low" },
        { value:"discount", text:"Discount: High to Low" },
        { value:"savings", text:"Savings: High to Low" },
        { value:"name-asc", text:"Name: A to Z" },
        { value:"name-desc", text:"Name: Z to A" },
    ];

    const finalKits = useMemo(() => {
        let result = [...cart];

        // Apply search filter
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

        // Apply sorting
        if (sortBy ==="price-low") {
            result.sort((a, b) => a.ourPrice - b.ourPrice);
        } else if (sortBy ==="price-high") {
            result.sort((a, b) => b.ourPrice - a.ourPrice);
        } else if (sortBy ==="capacity") {
            result.sort((a, b) => b.capacityKW - a.capacityKW);
        } else if (sortBy ==="discount") {
            result.sort((a, b) => {
                const discountA = ((a.marketPrice - a.ourPrice) / a.marketPrice) * 100;
                const discountB = ((b.marketPrice - b.ourPrice) / b.marketPrice) * 100;
                return discountB - discountA;
            });
        } else if (sortBy ==="savings") {
            result.sort((a, b) => {
                const savingsA = (a.marketPrice - a.ourPrice) * a.qty;
                const savingsB = (b.marketPrice - b.ourPrice) * b.qty;
                return savingsB - savingsA;
            });
        } else if (sortBy ==="name-asc") {
            result.sort((a, b) => a.kitName.localeCompare(b.kitName));
        } else if (sortBy ==="name-desc") {
            result.sort((a, b) => b.kitName.localeCompare(a.kitName));
        }

        return result;
    }, [cart, searchTerm, sortBy]);

    const getTaxBreakdown = (amount) => {
        const fallbackRate = Number(checkoutSettings.gst_rate ?? 13.8);
        let taxable = 0;
        let gstAmount = 0;

        cart.forEach((kit) => {
            const itemValue = (kit.qty * kit.ourPrice);
            const itemGstRate = Number(kit.gstRate ?? kit.pricing?.gstRate ?? fallbackRate);
            const itemTaxable = Math.round(itemValue / (1 + (itemGstRate / 100)));
            const itemGst = Math.max(0, itemValue - itemTaxable);
            taxable += itemTaxable;
            gstAmount += itemGst;
        });

        const effectiveRate = taxable > 0
            ? Number(((gstAmount / taxable) * 100).toFixed(2))
            : fallbackRate;

        return {
            taxable: Math.round(amount > 0 ? (amount / (1 + (effectiveRate / 100))) : taxable),
            gstAmount: Math.max(0, amount - (amount > 0 ? (amount / (1 + (effectiveRate / 100))) : taxable)),
            gstRate: effectiveRate
        };
    };

    // Calculate cart totals with detailed breakdown
    const cartTotals = useMemo(() => {
        const total = cart.reduce((sum, kit) => sum + (kit.qty * kit.ourPrice), 0);
        const totalMarketPrice = cart.reduce((sum, kit) => sum + (kit.qty * kit.marketPrice), 0);
        const savings = totalMarketPrice - total;
        const totalItems = cart.reduce((sum, kit) => sum + kit.qty, 0);
        const totalKits = cart.length;

        // Calculate by tier
        const tierBreakdown = cart.reduce((acc, kit) => {
            const tier = kit.productTier?.toLowerCase() || 'basic';
            if (!acc[tier]) {
                acc[tier] = {
                    count: 0,
                    total: 0,
                    items: 0,
                    savings: 0,
                    tierColor: kit.tierColor || null
                };
            }
            acc[tier].count += kit.qty;
            acc[tier].items += 1;
            acc[tier].total += kit.qty * kit.ourPrice;
            acc[tier].savings += kit.qty * (kit.marketPrice - kit.ourPrice);
            return acc;
        }, {});

        // Calculate total delivery savings
        const totalDeliverySavings = cart.reduce(
            (sum, kit) => sum + (kit.includedDeliveryCharge || 0) * kit.qty,
            0
        );

        // Calculate by usage type
        const usageBreakdown = cart.reduce((acc, kit) => {
            const type = kit.usageType?.toLowerCase() || 'other';
            if (!acc[type]) {
                acc[type] = { count: 0, total: 0, savings: 0 };
            }
            acc[type].count += kit.qty;
            acc[type].total += kit.qty * kit.ourPrice;
            acc[type].savings += kit.qty * (kit.marketPrice - kit.ourPrice);
            return acc;
        }, {});

        const totalSavings = savings + totalDeliverySavings;
        // Calculate average discount
        const avgDiscount = totalMarketPrice > 0
            ? ((totalSavings / totalMarketPrice) * 100).toFixed(1)
            : 0;
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
            gstAmount
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

    // Tier badge colors using theme
    const getTierColor = (tier) => {
        switch (tier?.toLowerCase()) {
            case 'premium':
                return 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/30';
            case 'standard':
                return 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/30';
            default:
                return 'text-text-secondary bg-gray-50 dark:bg-surface border-border';
        }
    };

    // Usage type badge colors
    const getUsageTypeColor = (type) => {
        switch (type?.toLowerCase()) {
            case 'residential':
                return 'bg-success/10 text-success border border-success/30';
            case 'commercial':
                return 'bg-warning/10 text-warning border border-warning/30';
            case 'industrial':
                return 'bg-primary/10 text-primary dark:text-info border border-primary/30';
            default:
                return 'bg-primary/10 dark:bg-primary/15 text-primary dark:text-info border border-primary/30 dark:border-info/30';
        }
    };

    return (
        <div className="min-h-screen">
            {/* Enhanced Header with Theme Gradient and Stats */}
            <div className="gradient-primary rounded-xl shadow-lg mb-6">
                <div className="mx-auto px-4 py-8">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                        <div>
                            <div className="flex items-center gap-3 mb-3">
                                <div className="bg-white/20 backdrop-blur-sm p-3 rounded-xl">
                                    <FaSolarPanel className="text-text-inverse text-2xl" />
                                </div>
                                <h1 className="text-3xl lg:text-4xl font-bold text-text-inverse">
                                    Solar Kit Cart
                                </h1>
                            </div>
                            <p className="text-text-inverse/90 text-lg max-w-2xl">
                                Review and manage your selected pre-configured solar solutions
                            </p>

                            {/* Quick Stats Cards */}
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-6">
                                <div className="bg-white/10 backdrop-blur-sm px-4 py-3 rounded-xl border border-white/20">
                                    <div className="flex items-center gap-2 mb-1">
                                        <FiPackage className="text-text-inverse/80" size={16} />
                                        <span className="text-text-inverse/80 text-xs">Total Kits</span>
                                    </div>
                                    <p className="text-text-inverse font-bold text-2xl">{cartTotals.totalKits}</p>
                                </div>
                                <div className="bg-white/10 backdrop-blur-sm px-4 py-3 rounded-xl border border-white/20">
                                    <div className="flex items-center gap-2 mb-1">
                                        <FiShoppingCart className="text-text-inverse/80" size={16} />
                                        <span className="text-text-inverse/80 text-xs">Total Items</span>
                                    </div>
                                    <p className="text-text-inverse font-bold text-2xl">{cartTotals.totalItems}</p>
                                </div>
                                <div className="bg-white/10 backdrop-blur-sm px-4 py-3 rounded-xl border border-white/20">
                                    <div className="flex items-center gap-2 mb-1">
                                        <FiDollarSign className="text-text-inverse/80" size={16} />
                                        <span className="text-text-inverse/80 text-xs">Cart Value</span>
                                    </div>
                                    <p className="text-text-inverse font-bold text-2xl">₹{cartTotals.total.toLocaleString("en-IN")}</p>
                                </div>
                                {cartTotals.totalSavings > 0 && (
                                    <div className="bg-success/30 backdrop-blur-sm px-4 py-3 rounded-xl border border-success/30">
                                        <div className="flex items-center gap-2 mb-1">
                                            <FiPercent className="text-text-inverse/80" size={16} />
                                            <span className="text-text-inverse/80 text-xs">You Save</span>
                                        </div>
                                        <p className="text-text-inverse font-bold text-2xl">
                                            ₹{cartTotals.totalSavings.toLocaleString("en-IN")}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Enhanced Search + Controls */}
            <div className="bg-surface rounded-xl shadow-sm border border-border p-6 mb-6">
                {/* Results Count and Quick Summary */}
                <div className="mb-4 flex items-center justify-between">
                    <p className="text-text-secondary">
                        Showing <span className="font-semibold text-text-primary dark:text-info">{finalKits.length}</span> of{' '}
                        <span className="font-semibold text-text-primary dark:text-info">{cart.length}</span> kits in your cart
                    </p>

                    {/* Quick Summary Badge */}
                    {cartTotals.totalSavings > 0 && (
                        <div className="bg-success-soft text-success px-4 py-2 rounded-full text-sm font-semibold border border-success/30 flex items-center gap-2">
                            <FiTag size={14} />
                            <span>You save ₹{cartTotals.totalSavings.toLocaleString("en-IN")} ({cartTotals.avgDiscount}%)</span>
                        </div>
                    )}
                </div>
                <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center">
                    {/* Search Bar using CustomInput */}
                    <div className="relative flex-1 w-full">
                        <CustomInput
                            type="text"
                            name="search"
                            placeholder="Search by kit name, type, tier, capacity..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full"
                            leftIcon={<FiSearch size={20} />}
                            rightIcon={searchTerm && (
                                <IconButton
                                    onClick={() => setSearchTerm("")}
                                    variant="ghost"
                                    size="sm"
                                    className="bg-surface hover:bg-surface-hover"
                                >
                                    <FiX size={18} className="text-text-primary dark:text-info" />
                                </IconButton>
                            )}
                        />
                    </div>

                    {/* View Toggle */}
                    <div className="flex bg-surface-hover rounded-xl p-1 border border-border">
                        <IconButton
                            onClick={() => setViewMode("grid")}
                            variant={viewMode ==="grid" ?"primary" :"ghost"}
                            size="sm"
                            className={`rounded-lg ${viewMode ==="grid" ?"bg-surface shadow-sm text-primary dark:text-info" :"text-text-secondary"}`}
                            title="Grid View"
                        >
                            <FiGrid size={20} />
                        </IconButton>
                        <IconButton
                            onClick={() => setViewMode("list")}
                            variant={viewMode ==="list" ?"primary" :"ghost"}
                            size="sm"
                            className={`rounded-lg ${viewMode ==="list" ?"bg-surface shadow-sm text-primary dark:text-info" :"text-text-secondary"}`}
                            title="List View"
                        >
                            <FiList size={20} />
                        </IconButton>
                    </div>

                    {/* Sort Dropdown using Dropdown component */}
                    <div className="w-full lg:w-64">
                        <Dropdown
                            value={sortBy}
                            onChange={setSortBy}
                            options={sortOptions}
                            placeholder="Sort by..."
                            className="w-full"
                        />
                    </div>

                    {/* Toggle Summary Button */}
                    <Button
                        onClick={() => setShowSummary(!showSummary)}
                        variant="ghost"
                        size="md"
                        leftIcon={<FiPieChart size={18} />}
                        className="text-text-secondary hover:text-text-primary dark:text-info"
                    >
                        {showSummary ?"Hide" :"Show"} Summary
                    </Button>
                </div>

                {/* Active Filters */}
                {(searchTerm || sortBy !=="default") && (
                    <div className="flex flex-wrap items-center gap-2 mt-4 pt-4 border-t border-border">
                        <span className="text-sm text-text-muted">Active filters:</span>
                        {searchTerm && (
                            <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-primary/10 text-primary dark:text-info rounded-full text-sm border border-primary/20">
                                <FiSearch size={14} />"{searchTerm}"
                                <button onClick={() => setSearchTerm("")} className="ml-1 hover:text-primary-hover">
                                    <FiX size={14} />
                                </button>
                            </span>
                        )}
                        {sortBy !=="default" && (
                            <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-surface-hover text-text-primary dark:text-info rounded-full text-sm border border-border">
                                Sort: {sortOptions.find(opt => opt.value === sortBy)?.text}
                                <button onClick={() => setSortBy("default")} className="ml-1 hover:text-text-secondary">
                                    <FiX size={14} />
                                </button>
                            </span>
                        )}
                        <Button
                            onClick={clearAllFilters}
                            variant="ghost"
                            size="sm"
                            className="text-text-secondary hover:text-text-primary dark:text-info"
                        >
                            Clear all
                        </Button>
                    </div>
                )}
            </div>

            {/* Summary Section */}
            {showSummary && cart.length > 0 && (
                <div className="bg-surface rounded-xl shadow-sm border border-border p-6 mb-6">
                    <h3 className="text-lg font-bold text-text-primary dark:text-info mb-4 flex items-center gap-2">
                        <FiTrendingUp className="text-primary dark:text-info" size={20} />
                        Order Summary
                    </h3>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Tier Breakdown */}
                        <div className="bg-surface-hover rounded-xl p-4 border border-border">
                            <h4 className="font-semibold text-text-primary dark:text-info mb-3 flex items-center gap-2">
                                <FiPackage className="text-primary dark:text-info" size={16} />
                                By Solar Kit
                            </h4>
                            <div className="space-y-3">
                                {Object.entries(cartTotals.tierBreakdown).map(([tier, data]) => {
                                    const hasCustomColor = !!data.tierColor;
                                    return (
                                        <div
                                            key={tier}
                                            className={`p-3 rounded-lg border ${hasCustomColor ? '' : getTierColor(tier)}`}
                                            style={hasCustomColor ? {
                                                borderColor: `${data.tierColor}40`,
                                                backgroundColor: `${data.tierColor}06`
                                            } : undefined}
                                        >
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="flex items-center gap-2">
                                                    {tier === 'premium' && <FaGem className="text-amber-500" style={hasCustomColor ? { color: data.tierColor } : undefined} size={14} />}
                                                    {tier === 'standard' && <FiStar className="text-blue-600" style={hasCustomColor ? { color: data.tierColor } : undefined} size={14} />}
                                                    {tier === 'basic' && <FiHome className="text-text-secondary" style={hasCustomColor ? { color: data.tierColor } : undefined} size={14} />}
                                                    <span
                                                        className="font-semibold capitalize"
                                                        style={hasCustomColor ? { color: data.tierColor } : undefined}
                                                    >{tier} Solar Kit</span>
                                                </div>
                                                <span
                                                    className="text-sm font-bold bg-surface px-2 py-1 rounded-full"
                                                    style={hasCustomColor ? { color: data.tierColor, borderColor: `${data.tierColor}30`, borderWidth: '1px' } : undefined}
                                                >
                                                    {data.count} items
                                                </span>
                                            </div>
                                        <div className="grid grid-cols-2 gap-2 text-sm">
                                            <div>
                                                <span className="text-text-secondary">Value:</span>
                                                <span className="font-medium ml-1 text-text-primary dark:text-info">₹{data.total.toLocaleString("en-IN")}</span>
                                            </div>
                                            {data.savings > 0 && (
                                                <div>
                                                    <span className="text-text-secondary">Save:</span>
                                                    <span className="font-medium ml-1 text-success">₹{data.savings.toLocaleString("en-IN")}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Usage Type Breakdown */}
                        {Object.keys(cartTotals.usageBreakdown).length > 0 && (
                            <div className="bg-surface-hover rounded-xl p-4 border border-border">
                                <h4 className="font-semibold text-text-primary dark:text-info mb-3 flex items-center gap-2">
                                    <FiZap className="text-primary dark:text-info" size={16} />
                                    By Category
                                </h4>
                                <div className="space-y-3">
                                    {Object.entries(cartTotals.usageBreakdown).map(([type, data]) => (
                                        <div key={type} className={`p-3 rounded-lg border ${getUsageTypeColor(type)}`}>
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="font-semibold capitalize">{type}</span>
                                                <span className="text-sm font-bold bg-surface px-2 py-1 rounded-full">
                                                    {data.count} items
                                                </span>
                                            </div>
                                            <div className="grid grid-cols-2 gap-2 text-sm">
                                                <div>
                                                    <span className="text-text-secondary">Value:</span>
                                                    <span className="font-medium ml-1 text-text-primary dark:text-info">₹{data.total.toLocaleString("en-IN")}</span>
                                                </div>
                                                {data.savings > 0 && (
                                                    <div>
                                                        <span className="text-text-secondary">Save:</span>
                                                        <span className="font-medium ml-1 text-success">₹{data.savings.toLocaleString("en-IN")}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Savings Summary */}
                        {cartTotals.totalSavings > 0 && (
                            <div className="bg-gradient-success-soft rounded-xl p-4 border border-success/30">
                                <h4 className="font-semibold text-success mb-3 flex items-center gap-2">
                                    <FiAward className="text-success" size={16} />
                                    Your Savings Breakdown
                                </h4>
                                <div className="space-y-4">
                                    <div>
                                        <div className="flex justify-between items-center text-sm mb-2">
                                            <span className="text-text-secondary">Market Price (Incl. GST):</span>
                                            <span className="font-medium line-through">₹{cartTotals.totalMarketPrice.toLocaleString("en-IN")}</span>
                                        </div>
                                        <div className="flex justify-between items-center text-sm mb-2 border-b border-border pb-2">
                                            <span className="text-text-secondary">Items Total (Excl. GST):</span>
                                            <span className="font-semibold text-text-primary">₹{cartTotals.subtotalExcludingGst.toLocaleString("en-IN")}</span>
                                        </div>
                                        <div className="flex justify-between items-center text-sm mb-2 border-b border-border pb-2">
                                            <span className="text-text-secondary">GST ({cartTotals.gstRate}%):</span>
                                            <span className="font-semibold text-text-primary">₹{cartTotals.gstAmount.toLocaleString("en-IN")}</span>
                                        </div>
                                        <div className="flex justify-between items-center text-sm mb-2">
                                            <span className="text-text-secondary font-bold">Your Price (Incl. GST):</span>
                                            <span className="font-black text-primary dark:text-info text-base">₹{cartTotals.total.toLocaleString("en-IN")}</span>
                                        </div>
                                    </div>

                                    <div className="border-t border-success/20 pt-3">
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="font-semibold text-success">Direct Savings:</span>
                                            <span className="font-bold text-success">₹{cartTotals.savings.toLocaleString("en-IN")}</span>
                                        </div>
                                        {cartTotals.totalDeliverySavings > 0 && (
                                            <div className="bg-white/50 rounded-lg">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        <FiTruck className="text-success" size={14} />
                                                        <span className="text-sm text-text-secondary">Free Delivery Savings:</span>
                                                    </div>
                                                    <span className="font-semibold text-success">₹{cartTotals.totalDeliverySavings.toLocaleString("en-IN")}</span>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    <div className="border-t border-success/20 pt-3">
                                        <div className="flex justify-between items-center">
                                            <span className="font-semibold text-success">Total Savings:</span>
                                            <span className="font-bold text-success text-xl">₹{cartTotals.totalSavings.toLocaleString("en-IN")}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Main Content */}
            <div className="">
                {/* Desktop Results */}
                <main className="flex-1 hidden lg:block">
                    {finalKits.length === 0 ? (
                        <div className="bg-surface rounded-xl p-16 text-center border border-border shadow-sm">
                            <div className="w-24 h-24 gradient-primary-soft rounded-full flex items-center justify-center mx-auto mb-6">
                                <FiSearch size={40} className="text-primary dark:text-info" />
                            </div>
                            <h3 className="text-2xl font-semibold text-text-primary dark:text-info mb-3">No kits found</h3>
                            <p className="text-text-secondary mb-8 max-w-md mx-auto text-lg">
                                {searchTerm || sortBy !=="default"
                                    ?"No kits match your current filters. Try adjusting your search criteria."
                                    :"Your cart is empty. Browse our collection to add some solar kits!"
                                }
                            </p>
                            {(searchTerm || sortBy !=="default") && (
                                <Button
                                    onClick={clearAllFilters}
                                    variant="primary"
                                    size="lg"
                                    className="px-8"
                                >
                                    Clear Filters
                                </Button>
                            )}
                        </div>
                    ) : viewMode ==="grid" ? (
                        <div className="grid grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-5">
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
                        <div className="space-y-4">
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
                </main>

                {/* Mobile Results */}
                <div className="lg:hidden w-full">
                    {finalKits.length === 0 ? (
                        <div className="bg-surface rounded-xl p-8 text-center border border-border">
                            <div className="w-16 h-16 gradient-primary-soft rounded-full flex items-center justify-center mx-auto mb-4">
                                <FiSearch size={24} className="text-primary dark:text-info" />
                            </div>
                            <h3 className="text-xl font-semibold text-text-primary dark:text-info mb-2">No kits found</h3>
                            <p className="text-text-secondary text-sm mb-6">
                                {searchTerm || sortBy !=="default"
                                    ?"No kits match your current filters."
                                    :"Your cart is empty."
                                }
                            </p>
                            {(searchTerm || sortBy !=="default") && (
                                <Button
                                    onClick={clearAllFilters}
                                    variant="primary"
                                    size="md"
                                    fullWidth
                                >
                                    Clear Filters
                                </Button>
                            )}
                        </div>
                    ) : viewMode ==="grid" ? (
                        <div className="grid grid-cols-1 gap-4">
                            {finalKits.map((kit) => (
                                <KitCard
                                    key={kit.cartItemId || kit.id}
                                    kit={kit}
                                    selected={selectedKit?.cartItemId === kit.cartItemId}
                                    setSelected={() => setSelected(kit.cartItemId || kit.id)}
                                    viewMode={viewMode}
                                    compact={true}
                                    isCart={true}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {finalKits.map((kit) => (
                                <KitCard
                                    key={kit.cartItemId || kit.id}
                                    kit={kit}
                                    selected={selectedKit?.cartItemId === kit.cartItemId}
                                    setSelected={() => setSelected(kit.cartItemId || kit.id)}
                                    viewMode={viewMode}
                                    compact={true}
                                    isCart={true}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Enhanced Sticky Footer with Detailed Summary */}
            {cart.length > 0 && (
                <div className="sticky -bottom-4 mt-8 z-30 bg-surface shadow-lg border-t border-border rounded-t-2xl">
                    <div className="mx-auto px-4 py-5">
                        {/* Bundle Progress & Panels Limit Block */}
                        {bundleOffer && (
                            <div className="mb-4 border-b border-border pb-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                                {/* Progress Bar */}
                                <div className="flex-1">
                                    <div className="flex justify-between items-center text-xs font-semibold mb-1">
                                        <span className="text-text-primary dark:text-info">Bundle Progress: {totalKitsQuantity}/{bundleOffer.max_qty || 5} Kits Added</span>
                                        <span className={totalKitsQuantity >= (bundleOffer.max_qty || 5) ?"text-success" :"text-primary dark:text-info"}>
                                            {totalKitsQuantity >= (bundleOffer.max_qty || 5) 
                                                ?`Bulk Discount Active (₹${bundleOffer.discount_value || 500}/KW)` 
                                                :`Add ${(bundleOffer.max_qty || 5) - totalKitsQuantity} more to unlock bulk discount`}
                                        </span>
                                    </div>
                                    <div className="w-full bg-border rounded-full h-2 overflow-hidden">
                                        <div 
                                            className={`h-full transition-all duration-500 ${totalKitsQuantity >= (bundleOffer.max_qty || 5) ?"bg-success" :"bg-primary"}`}
                                            style={{ width:`${Math.min(100, (totalKitsQuantity / (bundleOffer.max_qty || 5)) * 100)}%` }}
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Main Footer Content */}
                        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                            {/* Left Section - Totals */}
                            <div className="flex flex-col lg:flex-row lg:items-center gap-6">
                                {/* Total Amount */}
                                <div className="flex items-center gap-4">
                                    <div className="gradient-primary p-3 rounded-xl shadow-md">
                                        <FiDollarSign className="text-text-inverse" size={24} />
                                    </div>
                                    <div>
                                        <p className="text-text-muted text-sm">Total Amount (Incl. GST)</p>
                                        <div className="flex items-baseline gap-3">
                                            {cartTotals.totalSavings > 0 && (
                                                <del className="text-text-secondary text-lg font-medium">
                                                    ₹{cartTotals.totalMarketPrice.toLocaleString("en-IN")}
                                                </del>
                                            )}
                                            <span className="text-3xl font-bold gradient-text-primary dark:text-info">
                                                ₹{cartTotals.total.toLocaleString("en-IN")}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Savings */}
                                {cartTotals.totalSavings > 0 && (
                                    <div className="flex items-center gap-4">
                                        <div className="gradient-success p-3 rounded-xl shadow-md">
                                            <FiTag className="text-text-inverse" size={24} />
                                        </div>
                                        <div>
                                            <p className="text-text-muted text-sm">Total Savings</p>
                                            <p className="text-2xl font-bold text-success">
                                                ₹{cartTotals.totalSavings.toLocaleString("en-IN")}
                                            </p>
                                            <p className="text-xs text-success/70">
                                                Includes ₹{cartTotals.totalDeliverySavings.toLocaleString("en-IN")} delivery savings
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Right Section - Actions */}
                            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                                {/* Cart Stats */}
                                <div className="text-center sm:text-right bg-surface-hover p-3 rounded-xl">
                                    <p className="text-text-muted text-sm">Cart Summary</p>
                                    <div className="flex items-center gap-3 justify-center sm:justify-end">
                                        <span className="text-text-primary dark:text-info font-semibold">
                                            {cartTotals.totalKits} kits
                                        </span>
                                        <span className="text-border">•</span>
                                        <span className="text-text-primary dark:text-info font-semibold">
                                            {cartTotals.totalItems} items
                                        </span>
                                    </div>
                                </div>

                                <Button
                                    onClick={handleProceedToCheckout}
                                    variant="primary"
                                    size="lg"
                                    leftIcon={<FiShoppingCart size={20} />}
                                    className="shadow-lg px-8 py-4 btn-primary"
                                >
                                    Proceed to Checkout
                                </Button>
                            </div>
                        </div>

                        {/* Savings Badges */}
                        {cartTotals.totalSavings > 0 && (
                            <div className="mt-4 pt-4 border-t border-border flex flex-wrap items-center justify-center gap-3">
                                <div className="bg-success-soft text-success text-sm font-semibold px-4 py-2 rounded-full border border-success/30 flex items-center gap-2">
                                    <FiPercent className="text-success" size={16} />
                                    You save {cartTotals.avgDiscount}% on your entire order
                                </div>
                                <div className="bg-primary/10 text-primary dark:text-info text-sm font-semibold px-4 py-2 rounded-full border border-primary/30 flex items-center gap-2">
                                    <FiTruck className="text-primary dark:text-info" size={16} />
                                    Free delivery on {cart.filter(k => k.includedDeliveryCharge > 0).length} kits
                                </div>
                                <div className="bg-amber-50 text-amber-500 text-sm font-semibold px-4 py-2 rounded-full border border-amber-200 flex items-center gap-2">
                                    <FiShield className="text-amber-500" size={16} />
                                    {cartTotals.totalKits} kits with warranty
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Selected Kit Dialog */}
            {selectedKit && (
                <Dialog
                    isOpen={!!selectedKit}
                    title={selectedKit?.kitName}
                    onClose={() => setSelected(null)}
                    size="xl"
                >
                    <SelectedKitCard kit={selectedKit} initialVariantIndex={selectedKit.variantIndex} isCart={true} activeOffers={activeOffers} />
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