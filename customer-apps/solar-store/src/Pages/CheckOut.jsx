import React, { useState, useEffect, useMemo } from"react";
import { useSelector, useDispatch } from"react-redux";
import { useNavigate } from"react-router-dom";
import axios from"axios";
import { 
  FiClock, FiTag, FiCheckCircle, FiAlertTriangle, FiShoppingCart, FiCreditCard, FiLock, FiAward, FiMapPin, FiUsers
} from "react-icons/fi";
import { clearCart } from "@/features/slice";
import { setAlert } from "@/features/alert.slice";
import Button from "@/Components/Button";
import Loader from "@/Components/Loader";
import CustomInput from "@/Components/CustomInput";
import GstVerificationDialog from "@/Components/GstVerificationDialog";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export default function CheckOut() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const cart = useSelector((state) => state.slice.cart);
  const selectedDistrict = useSelector((state) => state.slice.selectedDistrict);
  const { user } = useSelector((state) => state.auth_slice);
  
  // Settings & Status
  const [loading, setLoading] = useState(true);
  const [reserving, setReserving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // GST State Verification
  const selectedState = useSelector((state) => state.slice.selectedState);
  const [showGstDialog, setShowGstDialog] = useState(false);
  const [gstStateId, setGstStateId] = useState("");

  const checkGstStatus = async () => {
    const stateId = selectedState?.id || selectedState?._id;
    if (!stateId) return;
    try {
      const res = await axios.get(`${API_URL}/india/v1/shop/gst/status?state_id=${stateId}`, { withCredentials: true });
      if (res.data?.success && !res.data.verified) {
        setGstStateId(stateId);
        setShowGstDialog(true);
      }
    } catch (err) {
      console.error("Failed to check GST status:", err);
    }
  };
  
  // Timer State
  const [timerEnabled, setTimerEnabled] = useState(true);
  const [timeLeft, setTimeLeft] = useState(0); // in seconds
  const [expiryTime, setExpiryTime] = useState(null);
  
  // Checkout Settings
  const [checkoutSettings, setCheckoutSettings] = useState({
    enable_checkout_timer: true,
    checkout_timer_duration: 20,
    gst_rate: 13.8
  });
  
  // Offers and Coupons
  const [activeOffers, setActiveOffers] = useState([]);
  const [couponCodeInput, setCouponCodeInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponError, setCouponError] = useState("");
  
  // Payment Simulation
  const [paying, setPaying] = useState(false);
  const [orderConfirmed, setOrderConfirmed] = useState(false);
  const [orderId, setOrderId] = useState("");

  // Grouped Cart for multi-district address inputs
  const groupedCart = useMemo(() => {
    const groups = {};
    cart.forEach(item => {
      const distId = item.districtId || "default";
      const distName = item.districtName || "Standard";
      if (!groups[distId]) {
        groups[distId] = {
          districtId: distId,
          districtName: distName,
          items: []
        };
      }
      groups[distId].items.push(item);
    });
    return Object.values(groups);
  }, [cart]);

  const [deliveryAddresses, setDeliveryAddresses] = useState({});

  useEffect(() => {
    if (cart.length > 0) {
      const initialAddresses = {};
      groupedCart.forEach(group => {
        const distId = group.districtId;
        const defaultStateName = group.items[0]?.state_name || selectedState?.name || "";
        const defaultStateId = group.items[0]?.state_id || selectedState?.id || selectedState?._id || "";
        
        initialAddresses[distId] = {
          address_line: deliveryAddresses[distId]?.address_line || "",
          state_id: defaultStateId,
          state_name: defaultStateName,
          district_id: distId === "default" ? null : distId,
          district_name: distId === "default" ? null : group.districtName,
          pincode: deliveryAddresses[distId]?.pincode || ""
        };
      });
      setDeliveryAddresses(prev => ({
        ...prev,
        ...initialAddresses
      }));
    }
  }, [cart, groupedCart, selectedState]);

  // Step 1: Initial reservation on page mount
  const handleReserveStock = async () => {
    setReserving(true);
    setErrorMsg("");
    try {
      const payloadItems = cart.map(item => ({
        id: item.id,
        qty: item.qty,
        is_custom: item.is_custom || false
      }));
      
      const res = await axios.post(`${API_URL}/india/v1/shop/reserve-stock`, {
        items: payloadItems
      }, { withCredentials: true });
      
      if (res.data?.success) {
        if (res.data.timer_enabled || res.data.expiry_time) {
          setTimerEnabled(true);
          const expTime = new Date(res.data.expiry_time);
          setExpiryTime(expTime);
          const diffSeconds = Math.max(0, Math.floor((expTime.getTime() - Date.now()) / 1000));
          setTimeLeft(diffSeconds);
        } else {
          setTimerEnabled(false);
        }
      }
    } catch (error) {
      console.error("Reservation failed:", error);
      setErrorMsg(error.response?.data?.message ||"Stock reservation failed. Some items may no longer be available in warehouse.");
    } finally {
      setReserving(false);
      setLoading(false);
    }
  };

  const fetchActiveOffers = async () => {
    try {
      const distId = selectedDistrict?._id || selectedDistrict?.id ||"";
      const res = await axios.get(`${API_URL}/india/v1/shop/active-offers?district_id=${distId}`);
      if (res.data?.success) {
        setActiveOffers(res.data.data || []);
      }
    } catch (error) {
      console.error("Error loading offers:", error);
    }
  };

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await axios.get(`${API_URL}/india/v1/shop/checkout-settings`);
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
    if (cart.length === 0 && !orderConfirmed) {
      navigate('/cart');
      return;
    }
    handleReserveStock();
    fetchActiveOffers();
    checkGstStatus();
  }, [cart, navigate, selectedDistrict, selectedState]);

  // Load Razorpay script dynamically
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    document.body.appendChild(script);
    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, []);

  // Countdown timer logic
  useEffect(() => {
    if (!timerEnabled || !expiryTime || timeLeft <= 0) return;
    
    const interval = setInterval(() => {
      const diff = Math.max(0, Math.floor((expiryTime.getTime() - Date.now()) / 1000));
      setTimeLeft(diff);
      
      if (diff <= 0) {
        clearInterval(interval);
        dispatch(setAlert({ type: "warning", message: "Checkout session reservation expired! Your items have been released." }));
        navigate('/cart');
      }
    }, 1000);
    
    return () => clearInterval(interval);
  }, [timerEnabled, expiryTime, timeLeft, navigate]);

  // Format time (MM:SS)
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return`${String(mins).padStart(2,"0")}:${String(secs).padStart(2,"0")}`;
  };

  const getTaxBreakdown = (amount) => {
    const fallbackRate = Number(checkoutSettings.gst_rate ?? 13.8);
    let taxable = 0;
    let gstAmount = 0;

    cart.forEach((item) => {
      const itemValue = (item.qty * item.ourPrice);
      const itemGstRate = Number(item.gstRate ?? item.pricing?.gstRate ?? fallbackRate);
      const itemTaxable = Math.round(itemValue / (1 + (itemGstRate / 100)));
      const itemGst = Math.max(0, itemValue - itemTaxable);
      taxable += itemTaxable;
      gstAmount += itemGst;
    });

    const effectiveRate = taxable > 0
      ? Number(((gstAmount / taxable) * 100).toFixed(2))
      : fallbackRate;

    const computedTaxable = Math.round(amount > 0 ? (amount / (1 + (effectiveRate / 100))) : taxable);
    const computedGstAmount = Math.max(0, amount - computedTaxable);

    return {
      taxable: computedTaxable,
      gstAmount: computedGstAmount,
      gstRate: effectiveRate
    };
  };

  // Calculations
  const subtotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + (item.qty * item.ourPrice), 0);
  }, [cart]);

  const totalKitsQuantity = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.qty, 0);
  }, [cart]);

  const totalCapacityKW = useMemo(() => {
    return cart.reduce((sum, item) => sum + ((item.capacityKW || 0) * item.qty), 0);
  }, [cart]);

  // Dynamic Discounts & Priority Logic Calculations
  const calculatedDiscounts = useMemo(() => {
    let flashSaleDiscount = 0;
    let bundleDiscount = 0;
    let couponDiscount = 0;
    let standardDiscount = 0;
    
    let activeOfferName = "None";
    let activeOfferType = "";
    
    // A. Flash Sale (Priority 1)
    const activeFlashSales = cart.map(item => item.flashSale).filter(Boolean);
    if (activeFlashSales.length > 0) {
      const fs = activeFlashSales[0];
      activeOfferName = fs.name;
      activeOfferType = "Flash Sale";
      cart.forEach(item => {
        if (item.flashSale) {
          if (fs.discountType === 'percent') {
            flashSaleDiscount += Math.round(item.qty * item.ourPrice * (fs.discountValue / 100));
          } else {
            flashSaleDiscount += item.qty * fs.discountValue;
          }
        }
      });
    }

    // B. Bundle Offer (Priority 2) - Buy Pack Offer
    const bundleOffer = activeOffers.find(o => o.offer_type === 'bundle');
    const minQty = (bundleOffer && bundleOffer.max_qty) ? bundleOffer.max_qty : 5;
    const bundleCartItems = (bundleOffer && bundleOffer.products_applicable && bundleOffer.products_applicable.length > 0)
      ? cart.filter(item => bundleOffer.products_applicable.some(pId => pId.toString() === item.id.toString()))
      : cart;
    const bundleKitsQuantity = bundleCartItems.reduce((sum, item) => sum + item.qty, 0);
    const bundleCapacityKW = bundleCartItems.reduce((sum, item) => sum + ((item.capacityKW || 0) * item.qty), 0);

    if (bundleOffer && bundleKitsQuantity >= minQty) {
      bundleDiscount = bundleCapacityKW * bundleOffer.discount_value;
    } else if (bundleKitsQuantity >= 5 && (!bundleOffer || !bundleOffer.products_applicable || bundleOffer.products_applicable.length === 0)) {
      bundleDiscount = bundleCapacityKW * 500;
    }

    // C. Coupon Discount (Priority 3)
    if (appliedCoupon) {
      const applicableSubtotal = (appliedCoupon.products_applicable && appliedCoupon.products_applicable.length > 0)
        ? cart.filter(item => 
            appliedCoupon.products_applicable.some(pId => pId.toString() === item.id.toString())
          ).reduce((sum, item) => sum + (item.qty * item.ourPrice), 0)
        : subtotal;

      if (applicableSubtotal > 0) {
        if (appliedCoupon.discount_type === 'percent') {
          couponDiscount = Math.round(applicableSubtotal * (appliedCoupon.discount_value / 100));
        } else {
          couponDiscount = appliedCoupon.discount_value;
        }
      }
    }

    // D. Standard Discount (Priority 4)
    const discountOffers = activeOffers.filter(o => o.offer_type === 'discount');
    cart.forEach(item => {
      const itemOffer = discountOffers.find(o => 
        o.products_applicable && o.products_applicable.some(pId => pId.toString() === item.id.toString())
      );
      if (itemOffer) {
        if (itemOffer.discount_type === 'percent') {
          standardDiscount += Math.round(item.qty * item.ourPrice * (itemOffer.discount_value / 100));
        } else {
          standardDiscount += item.qty * itemOffer.discount_value;
        }
      }
    });

    // Priority checks & stacking logic
    let appliedDiscountValue = 0;
    let selectedOffers = [];

    const hasFlashSale = flashSaleDiscount > 0;
    const hasBundle = bundleDiscount > 0;
    const hasCoupon = couponDiscount > 0;
    const hasStandard = standardDiscount > 0;

    const flashSaleOfferObj = activeOffers.find(o => o.offer_type === 'sales_day');
    const isFlashSaleStackable = flashSaleOfferObj ? flashSaleOfferObj.stackable : false;
    const isBundleStackable = bundleOffer ? bundleOffer.stackable : false;
    const isCouponStackable = appliedCoupon ? appliedCoupon.stackable : false;
    
    const firstActiveDiscountOfferObj = discountOffers.find(o => 
      cart.some(item => o.products_applicable && o.products_applicable.some(pId => pId.toString() === item.id.toString()))
    );
    const isStandardStackable = firstActiveDiscountOfferObj ? firstActiveDiscountOfferObj.stackable : false;

    if (hasFlashSale) {
      appliedDiscountValue += flashSaleDiscount;
      selectedOffers.push(`Flash Sale: -₹${flashSaleDiscount.toLocaleString("en-IN")}`);
      activeOfferName = activeFlashSales[0].name;
      activeOfferType = "Flash Sale";

      if (isFlashSaleStackable) {
        if (hasBundle && isBundleStackable) {
          appliedDiscountValue += bundleDiscount;
          selectedOffers.push(`Buy Pack Offer: -₹${bundleDiscount.toLocaleString("en-IN")}`);
        }
        if (hasCoupon && isCouponStackable) {
          appliedDiscountValue += couponDiscount;
          selectedOffers.push(`Coupon (${appliedCoupon.coupon_code}): -₹${couponDiscount.toLocaleString("en-IN")}`);
        }
        if (hasStandard && isStandardStackable) {
          appliedDiscountValue += standardDiscount;
          selectedOffers.push(`Standard Discount: -₹${standardDiscount.toLocaleString("en-IN")}`);
        }
      }
    } else if (hasBundle) {
      appliedDiscountValue += bundleDiscount;
      selectedOffers.push(`Buy Pack Offer: -₹${bundleDiscount.toLocaleString("en-IN")}`);
      activeOfferName = bundleOffer?.offer_name || "Buy Pack Offer";
      activeOfferType = "Bundle";

      if (isBundleStackable) {
        if (hasCoupon && isCouponStackable) {
          appliedDiscountValue += couponDiscount;
          selectedOffers.push(`Coupon (${appliedCoupon.coupon_code}): -₹${couponDiscount.toLocaleString("en-IN")}`);
        }
        if (hasStandard && isStandardStackable) {
          appliedDiscountValue += standardDiscount;
          selectedOffers.push(`Standard Discount: -₹${standardDiscount.toLocaleString("en-IN")}`);
        }
      }
    } else if (hasCoupon) {
      appliedDiscountValue += couponDiscount;
      selectedOffers.push(`Coupon (${appliedCoupon.coupon_code}): -₹${couponDiscount.toLocaleString("en-IN")}`);
      activeOfferName = `Coupon: ${appliedCoupon.coupon_code}`;
      activeOfferType = "Coupon";

      if (isCouponStackable) {
        if (hasStandard && isStandardStackable) {
          appliedDiscountValue += standardDiscount;
          selectedOffers.push(`Standard Discount: -₹${standardDiscount.toLocaleString("en-IN")}`);
        }
      }
    } else if (hasStandard) {
      appliedDiscountValue += standardDiscount;
      selectedOffers.push(`Standard Discount: -₹${standardDiscount.toLocaleString("en-IN")}`);
      activeOfferName = firstActiveDiscountOfferObj?.offer_name || "Standard Discount";
      activeOfferType = "Discount";
    }

    const finalTotal = Math.max(0, subtotal - appliedDiscountValue);

    return {
      discountAmount: appliedDiscountValue,
      offersApplied: selectedOffers,
      offerName: activeOfferName,
      offerType: activeOfferType,
      finalTotal
    };
  }, [cart, totalKitsQuantity, totalCapacityKW, appliedCoupon, activeOffers, subtotal]);

  const handleApplyCoupon = () => {
    setCouponError("");
    if (!couponCodeInput) return;

    const matched = activeOffers.find(
      o => o.offer_type === 'coupon' && o.coupon_code.toUpperCase() === couponCodeInput.toUpperCase()
    );

    if (!matched) {
      setCouponError("Invalid or expired coupon code.");
      return;
    }

    // Check Priority stacking rules
    const hasFlashSale = cart.some(i => i.flashSale);
    const bundleOffer = activeOffers.find(o => o.offer_type === 'bundle');
    const minQty = (bundleOffer && bundleOffer.max_qty) ? bundleOffer.max_qty : 5;
    const hasBundle = totalKitsQuantity >= minQty;

    if (hasFlashSale) {
      const activeFlashSale = cart.find(i => i.flashSale).flashSale;
      const fsOffer = activeOffers.find(o => o.offer_type === 'sales_day');
      if (fsOffer && !fsOffer.stackable) {
        setCouponError(`Cannot apply coupon. Highest priority offer (${activeFlashSale.name}) is already active and is not stackable.`);
        return;
      }
    }

    if (hasBundle && !hasFlashSale) {
      if (bundleOffer && !bundleOffer.stackable) {
        setCouponError("Cannot apply coupon. Buy Pack Offer is active and not stackable.");
        return;
      }
    }

    setAppliedCoupon(matched);
    setCouponCodeInput("");
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
  };

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        return resolve(true);
      }
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleConfirmPurchase = async () => {
    // Re-verify GST status before checkout
    const stateId = selectedState?.id || selectedState?._id;
    if (stateId) {
      try {
        const res = await axios.get(`${API_URL}/india/v1/shop/gst/status?state_id=${stateId}`, { withCredentials: true });
        if (res.data?.success && !res.data.verified) {
          setGstStateId(stateId);
          setShowGstDialog(true);
          return;
        }
      } catch (err) {
        console.error("GST confirm re-check failed:", err);
      }
    }

    setPaying(true);
    try {
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        throw new Error("Razorpay SDK failed to load. Please check your internet connection and try again.");
      }

      const itemsPayload = cart.map(item => ({
        scope_type: item.is_custom ? 'product' : 'kit',
        product_id: item.is_custom ? item.id : null,
        kit_id: item.is_custom ? null : item.id,
        quantity: item.qty || 1,
        districtId: item.districtId,
      }));

      const addressData = Object.values(deliveryAddresses)[0] || {};

      // 1. Create Razorpay order with server-validated pricing
      const rzpOrderRes = await axios.post(`${API_URL}/india/v1/shop/razorpay/create-order`, {
        items: itemsPayload,
        delivery_address: addressData,
        is_end_customer_sale: true,
      }, { withCredentials: true });

      if (!rzpOrderRes.data?.success) {
        throw new Error(rzpOrderRes.data?.message || "Failed to initialize Razorpay payment session.");
      }

      const rzpOrderData = rzpOrderRes.data;

      // 2. Open real Razorpay Popup
      const options = {
        key: rzpOrderData.key || import.meta.env.VITE_RAZORPAY_KEY_ID || "rzp_test_T8B85UkbvoXBOQ",
        amount: rzpOrderData.amount,
        currency: rzpOrderData.currency || "INR",
        name: "SolarKits SolarShop",
        description: `Order #${rzpOrderData.order_number || rzpOrderData.id}`,
        order_id: rzpOrderData.id,
        prefill: {
          name: user?.name || "",
          email: user?.email || "",
          contact: user?.mobile || "",
        },
        handler: async function (response) {
          try {
            setPaying(true);
            const verifyRes = await axios.post(`${API_URL}/india/v1/shop/razorpay/verify-payment`, {
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_signature: response.razorpay_signature,
              internal_order_id: rzpOrderData.internal_order_id,
            }, { withCredentials: true });

            if (verifyRes.data?.success) {
              setOrderId(rzpOrderData.order_number || response.razorpay_order_id);
              setOrderConfirmed(true);
              dispatch(clearCart());
              dispatch(setAlert({ type: "success", message: "Payment successful! Order confirmed." }));
            }
          } catch (error) {
            console.error("Order payment verification failed:", error);
            dispatch(setAlert({ type: "error", message: error.response?.data?.message || "Payment verification failed." }));
          } finally {
            setPaying(false);
          }
        },
        modal: {
          ondismiss: function () {
            setPaying(false);
            dispatch(setAlert({ type: "info", message: "Payment cancelled." }));
          }
        },
        theme: {
          color: "#2563EB"
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.open();

    } catch (error) {
      console.error("Order payment initialization failed:", error);
      dispatch(setAlert({ type: "error", message: error.response?.data?.message || error.message || "Payment gateway connection failed. Please try again." }));
      setPaying(false);
    }
  };

  if (loading) {
    return <Loader text="Securing stock and preparing checkout..." />;
  }

  if (errorMsg) {
    return (
      <div className="max-w-md mx-auto my-12 bg-surface p-8 rounded-xl border border-border shadow-lg text-center space-y-4">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto text-red-500">
          <FiAlertTriangle size={32} />
        </div>
        <h3 className="text-xl font-bold text-text-primary dark:text-info">Stock Lock Blocked</h3>
        <p className="text-sm text-text-secondary">{errorMsg}</p>
        <Button onClick={() => navigate('/cart')} variant="secondary" className="w-full">
          Return to Cart
        </Button>
      </div>
    );
  }

  if (orderConfirmed) {
    return (
      <div className="max-w-md mx-auto my-12 bg-surface p-8 rounded-2xl border border-border shadow-xl text-center space-y-6 animate-in fade-in zoom-in-95 duration-300">
        <div className="w-20 h-20 bg-success-soft text-success rounded-full flex items-center justify-center mx-auto shadow-inner border border-success/20">
          <FiCheckCircle size={44} className="animate-bounce" />
        </div>
        <div>
          <h2 className="text-2xl font-black text-text-primary dark:text-info">Order Confirmed!</h2>
          <p className="text-xs text-text-muted mt-1">Payment processed successfully and stock reserved permanently.</p>
        </div>
        
        <div className="bg-surface-hover p-4 rounded-xl border border-border text-left space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-text-secondary">Order ID:</span>
            <span className="font-mono font-bold text-text-primary dark:text-info">{orderId}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-text-secondary">Total Paid:</span>
            <span className="font-bold text-primary dark:text-info">₹{calculatedDiscounts.finalTotal.toLocaleString("en-IN")}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-text-secondary">Status:</span>
            <span className="text-success font-semibold">Booked</span>
          </div>
        </div>

        <Button onClick={() => navigate('/dashboard')} variant="primary" className="w-full py-3.5 shadow-md">
          Go to Dashboard
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      
      {/* Checkout timer bar */}
      {timerEnabled && (
        <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-xl flex items-center justify-between gap-4 animate-pulse">
          <div className="flex items-center gap-2 text-amber-600 text-sm font-semibold">
            <FiClock size={18} />
            <span>Stock reserved for you! Complete checkout before the reservation timer expires.</span>
          </div>
          <span className="bg-amber-500 text-white font-mono font-bold px-3 py-1.5 rounded-lg text-sm shadow">
            {formatTime(timeLeft)} Remaining
          </span>
        </div>
      )}

      {/* Franchisee Order Attribution Notice */}
      {user?.reseller?.business_name && (
        <div className="bg-emerald-500/10 border border-emerald-500/25 p-4 rounded-2xl flex items-center gap-3 text-emerald-700 dark:text-emerald-300 shadow-sm">
          <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0 text-emerald-600 dark:text-emerald-400">
            <FiUsers size={20} />
          </div>
          <div className="text-xs">
            <p className="font-extrabold text-sm text-emerald-800 dark:text-emerald-200">
              Partner Network Attribution: {user.reseller.business_name}
            </p>
            <p className="mt-0.5 opacity-90">
              This order will be processed and assigned under your authorized Franchisee Partner (<strong>{user.reseller.business_name}</strong>).
            </p>
          </div>
        </div>
      )}

      {/* Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2/3 - Order Review and simulated payment */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-surface p-6 rounded-xl border border-border shadow-sm">
            <h3 className="text-lg font-bold text-text-primary dark:text-info mb-4 flex items-center gap-2 border-b border-border pb-3">
              <FiShoppingCart className="text-primary dark:text-info" /> Review Selected Solar Kits
            </h3>

            <div className="divide-y divide-border">
              {cart.map((item) => (
                <div key={item.cartItemId} className="py-4 flex gap-4 items-center">
                  <div className="w-16 h-16 bg-surface-hover border border-border rounded-lg flex items-center justify-center overflow-hidden shrink-0">
                    <img src={item.kitImage} alt={item.kitName} className="object-contain w-12 h-12" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-sm text-text-primary dark:text-info truncate">{item.kitName}</h4>
                    <p className="text-xs text-text-secondary mt-0.5 flex items-center gap-1 flex-wrap">
                      <span>{item.is_custom ? 'Custom Configured' : `${item.productTier} Kit`} • {item.capacityKW} kW</span>
                      {item.districtName && (
                        <span className="inline-flex items-center gap-0.5 ml-1">
                          • <FiMapPin size={11} className="text-primary dark:text-info" /> {item.districtName}
                        </span>
                      )}
                    </p>
                    {item.flashSale && (
                      <span className="inline-block bg-amber-500/15 text-amber-600 text-[10px] font-bold px-2 py-0.5 rounded border border-amber-500/20 mt-1">
                        ⚡ Flash Sale Applied
                      </span>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <div className="font-bold text-text-primary dark:text-info">₹{(item.qty * item.ourPrice).toLocaleString("en-IN")}</div>
                    <div className="text-xs text-text-muted">Qty: {item.qty}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Payment Simulation Form */}
          <div className="bg-surface p-6 rounded-xl border border-border shadow-sm space-y-4">
            <h3 className="text-lg font-bold text-text-primary dark:text-info flex items-center gap-2 border-b border-border pb-3">
              <FiCreditCard className="text-primary dark:text-info" /> Razorpay Payment Gateway
            </h3>

            <div className="flex items-center gap-2 text-xs text-text-muted bg-surface-hover p-3 rounded-lg border border-border">
              <FiLock className="text-success shrink-0" size={14} />
              <span>Razorpay secures your inventory slot and books proceeds directly through your active solar warehouse contract.</span>
            </div>

            <Button 
              onClick={handleConfirmPurchase} 
              variant="primary" 
              size="lg" 
              fullWidth 
              loading={paying}
              className="py-3.5 shadow-md font-bold"
            >
              Proceed to Razorpay Payment
            </Button>
          </div>
        </div>

        {/* Right 1/3 - Totals Summary & Coupon */}
        <div className="space-y-6">
          <div className="bg-surface p-6 rounded-xl border border-border shadow-sm space-y-4">
            <h3 className="text-lg font-bold text-text-primary dark:text-info border-b border-border pb-3">
              Order Pricing Summary
            </h3>

            <div className="space-y-2 text-sm border-b border-border pb-3">
              <div className="flex justify-between text-text-secondary">
                <span>Items Total (Excl. GST):</span>
                <span className="font-medium text-text-primary dark:text-info">₹{getTaxBreakdown(subtotal).taxable.toLocaleString("en-IN")}</span>
              </div>
              <div className="flex justify-between text-text-secondary">
                <span>GST ({getTaxBreakdown(subtotal).gstRate}%):</span>
                <span className="font-medium text-text-primary dark:text-info">₹{getTaxBreakdown(subtotal).gstAmount.toLocaleString("en-IN")}</span>
              </div>
              <div className="flex justify-between text-text-secondary border-t border-border pt-2">
                <span>Subtotal (Incl. GST):</span>
                <span className="font-bold text-text-primary dark:text-info">₹{subtotal.toLocaleString("en-IN")}</span>
              </div>
              <div className="flex justify-between text-text-secondary">
                <span>Total Capacity:</span>
                <span className="font-medium text-text-primary dark:text-info">{totalCapacityKW} KW</span>
              </div>
              
              {/* Promo code applied visual */}
              {calculatedDiscounts.discountAmount > 0 && (
                <div className="bg-success-soft text-success p-3 rounded-xl border border-success/20 space-y-1.5 mt-2">
                  <div className="text-xs font-bold flex items-center gap-1">
                    <FiAward /> Active Benefits Applied:
                  </div>
                  {calculatedDiscounts.offersApplied.map((offerStr, idx) => (
                    <div key={idx} className="flex justify-between text-xs">
                      <span>{offerStr.split(':')[0]}</span>
                      <span className="font-bold">{offerStr.split(':')[1]}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-2 text-xs border-b border-border pb-2">
              <div className="flex justify-between text-text-secondary">
                <span>Total Taxable (Excl. GST):</span>
                <span>₹{getTaxBreakdown(calculatedDiscounts.finalTotal).taxable.toLocaleString("en-IN")}</span>
              </div>
              <div className="flex justify-between text-text-secondary">
                <span>Final Tax GST ({getTaxBreakdown(calculatedDiscounts.finalTotal).gstRate}%):</span>
                <span>₹{getTaxBreakdown(calculatedDiscounts.finalTotal).gstAmount.toLocaleString("en-IN")}</span>
              </div>
            </div>

            <div className="flex justify-between items-baseline pt-2">
              <span className="font-bold text-text-primary dark:text-info">Total Payable (Incl. GST):</span>
              <span className="text-2xl font-black text-primary dark:text-info">₹{calculatedDiscounts.finalTotal.toLocaleString("en-IN")}</span>
            </div>
          </div>

          {/* Coupon Code Entry */}
          <div className="bg-surface p-6 rounded-xl border border-border shadow-sm space-y-3">
            <h4 className="font-bold text-text-primary dark:text-info text-sm flex items-center gap-1.5">
              <FiTag className="text-primary dark:text-info" /> Apply Coupon Code
            </h4>
            
            {appliedCoupon ? (
              <div className="bg-primary-soft p-3 rounded-xl border border-primary/20 flex justify-between items-center text-xs">
                <div>
                  <span className="font-bold text-primary dark:text-info font-mono">{appliedCoupon.coupon_code}</span>
                  <span className="text-text-muted ml-2">applied</span>
                </div>
                <button onClick={handleRemoveCoupon} className="text-text-secondary hover:text-danger font-bold text-sm">
                  &times;
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <CustomInput
                  placeholder="SOLAR500"
                  value={couponCodeInput}
                  onChange={(e) => setCouponCodeInput(e.target.value)}
                  className="flex-1"
                />
                <Button onClick={handleApplyCoupon} variant="primary" className="py-2.5 px-4 shadow-sm">
                  Apply
                </Button>
              </div>
            )}

            {couponError && (
              <div className="text-xs text-danger font-semibold bg-danger-soft p-2.5 rounded-lg border border-danger/10 flex items-center gap-1 mt-2">
                <FiAlertTriangle /> {couponError}
              </div>
            )}
          </div>

        </div>

      </div>

      <GstVerificationDialog
        isOpen={showGstDialog}
        onClose={() => {
          setShowGstDialog(false);
          navigate('/cart');
        }}
        stateId={gstStateId}
        onVerified={() => setShowGstDialog(false)}
      />
    </div>
  );
}
