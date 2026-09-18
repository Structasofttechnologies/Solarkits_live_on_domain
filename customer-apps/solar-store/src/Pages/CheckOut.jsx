import React, { useState, useEffect, useMemo } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  FiClock, FiTag, FiCheckCircle, FiAlertTriangle, FiShoppingCart,
  FiLock, FiAward, FiMapPin, FiUsers, FiUploadCloud, FiCopy,
  FiFileText, FiDollarSign, FiCalendar, FiCreditCard, FiCheck
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
  const [_reserving, setReserving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // GST State Verification
  const selectedState = useSelector((state) => state.slice.selectedState);
  const [showGstDialog, setShowGstDialog] = useState(false);
  const [gstStateId, setGstStateId] = useState("");

  // Company Bank Details
  const [bankDetails, setBankDetails] = useState({
    account_name: "SolarKits Technologies Pvt Ltd",
    bank_name: "HDFC Bank",
    account_number: "50200088991122",
    ifsc_code: "HDFC0001234",
    branch_name: "Corporate Financial Center, Mumbai",
    account_type: "Current Account",
    upi_id: "solarkits.pay@hdfcbank",
  });
  const [copiedField, setCopiedField] = useState("");
  const [iciciVanDetails, setIciciVanDetails] = useState(null);

  // Offline Payment Form State
  const [utrNumber, setUtrNumber] = useState("");
  const [amountPaid, setAmountPaid] = useState("");
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().slice(0, 10));
  const [senderBankName, setSenderBankName] = useState("");
  const [accountHolderName, _setAccountHolderName] = useState("");
  const [receiptFile, setReceiptFile] = useState(null);
  const [receiptPreview, setReceiptPreview] = useState(null);

  // Timer State
  const [timerEnabled, setTimerEnabled] = useState(true);
  const [timeLeft, setTimeLeft] = useState(0);
  const [expiryTime, setExpiryTime] = useState(null);

  // Checkout Settings
  const [checkoutSettings, setCheckoutSettings] = useState({
    enable_checkout_timer: true,
    checkout_timer_duration: 20,
    gst_rate: 13.8,
  });

  // Offers and Coupons
  const [activeOffers, setActiveOffers] = useState([]);
  const [couponCodeInput, setCouponCodeInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponError, setCouponError] = useState("");
  const [showCouponInput, setShowCouponInput] = useState(false); // collapsed by default

  // Submission State
  const [submitting, setSubmitting] = useState(false);
  const [orderConfirmed, setOrderConfirmed] = useState(false);
  const [confirmedOrderData, setConfirmedOrderData] = useState(null);

  // Multi-district delivery addresses
  const _groupedCart = useMemo(() => {
    const groups = {};
    cart.forEach((item) => {
      const distId = item.districtId || "default";
      const distName = item.districtName || "Standard";
      if (!groups[distId]) {
        groups[distId] = {
          districtId: distId,
          districtName: distName,
          items: [],
        };
      }
      groups[distId].items.push(item);
    });
    return Object.values(groups);
  }, [cart]);

  // Delivery Address State
  const [deliveryAddress, setDeliveryAddress] = useState({
    line: "",
    pincode: "",
    district_name: "",
    state_name: "",
    contact_name: "",
    contact_phone: "",
  });

  // ── Module 1.1: 3 Fulfillment Modes & Live Warehouse Capacity Check ────────
  const [fulfillmentMode, setFulfillmentMode] = useState("franchisee_warehouse"); // 'franchisee_warehouse' | 'epc_warehouse' | 'direct_site'
  const [capacityChecking, setCapacityChecking] = useState(false);
  const [capacityResult, setCapacityResult] = useState(null);

  // Compute Order Load Metrics — must use item.qty (Redux cart field), NOT item.quantity (undefined for EPC catalogue items)
  const orderLoadMetrics = useMemo(() => {
    return cart.reduce((acc, item) => {
      const qty = Number(item.qty || 1);  // ← item.qty is the Redux cart quantity field
      let kw = Number(item.kw || item.capacity_kw || (item.capacity ? parseFloat(item.capacity) : 0) || (item.capacityKW || 0)) || 0;
      if (kw === 0) {
        const m = (item.kitName || item.name || item.title || '').match(/(\d+(?:\.\d+)?)\s*k?w\b/i);
        if (m) kw = parseFloat(m[1]) || 0;
      }
      const weight = Number(item.weight_kg || item.weight) || (kw > 0 ? Math.round(kw * 75) : 150);
      acc.total_kits += qty;
      acc.total_kw += qty * kw;
      acc.total_weight_kg += qty * weight;
      return acc;
    }, { total_kits: 0, total_kw: 0, total_weight_kg: 0 });
  }, [cart]);

  // Live Warehouse Capacity Check
  useEffect(() => {
    if (cart.length === 0) return;
    if (fulfillmentMode === "direct_site") {
      setCapacityResult({ allowed: true, message: "Direct site delivery: no warehouse capacity limits apply." });
      return;
    }

    const verifyCapacity = async () => {
      setCapacityChecking(true);
      try {
        const cartItemsParam = cart.map(item => {
          let kw = Number(item.kw || item.capacity_kw || (item.capacity ? parseFloat(item.capacity) : 0) || (item.capacityKW || 0)) || 0;
          if (kw === 0) {
            const m = (item.kitName || item.name || item.title || '').match(/(\d+(?:\.\d+)?)\s*k?w\b/i);
            if (m) kw = parseFloat(m[1]) || 0;
          }
          return {
            quantity: item.qty || 1,  // ← use item.qty (Redux cart field), not item.quantity
            kw_per_kit: kw,
            weight_kg_per_kit: Number(item.weight_kg || item.weight) || (kw > 0 ? Math.round(kw * 75) : 250),
          };
        });

        const res = await axios.get(
          `${API_URL}/india/v1/shop/checkout/warehouse-capacity-check`,
          {
            params: {
              fulfillment_mode: fulfillmentMode,
              cart_items: JSON.stringify(cartItemsParam),
              district_id: selectedDistrict?.id || selectedDistrict?._id,
            },
            withCredentials: true,
          }
        );

        if (res.data?.success && res.data?.data) {
          setCapacityResult(res.data.data);
        } else {
          setCapacityResult({ allowed: true });
        }
      } catch (err) {
        console.warn("Capacity check warning:", err);
        setCapacityResult({ allowed: true, note: "Offline capacity check fallback" });
      } finally {
        setCapacityChecking(false);
      }
    };

    verifyCapacity();
  }, [cart, fulfillmentMode, selectedDistrict]);

  useEffect(() => {
    if (user || selectedState || selectedDistrict || cart.length > 0) {
      const pinFromCart = cart.find((k) => k.delivery_pincode)?.delivery_pincode;
      setDeliveryAddress((prev) => ({
        line: prev.line || user?.address || "",
        pincode: pinFromCart || prev.pincode || user?.pincode || "380001",
        district_name: prev.district_name || selectedDistrict?.name || user?.district_name || "",
        state_name: prev.state_name || selectedState?.name || user?.state_name || "",
        contact_name: prev.contact_name || user?.name || "EPC Contractor",
        contact_phone: prev.contact_phone || user?.whatsapp || user?.mobile || "",
      }));
    }
  }, [user, selectedState, selectedDistrict, cart]);

  // Fetch ICICI Virtual Account details and listen for real-time payment confirmation
  useEffect(() => {
    const rawApiUrl = import.meta.env.VITE_API_URL || "http://localhost:5000";
    const baseUrl = rawApiUrl.replace(/\/api\/?$/, "").replace(/\/+$/, "");
    const userPhone = user?.whatsapp || user?.registered_whatsapp || user?.mobile || "9876543210";

    axios.get(`${baseUrl}/api/v1/payments/icici/van-details?phone=${userPhone}`)
      .then((res) => {
        if (res.data?.success) setIciciVanDetails(res.data.data);
      })
      .catch((err) => console.warn("Could not load ICICI VAN details:", err));

    const epcId = user?._id || user?.id;
    const streamUrl = `${baseUrl}/api/v1/payments/icici/stream?role=epc&epc_id=${epcId || ""}`;
    const es = new EventSource(streamUrl);

    es.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "ICICI_PAYMENT_CREDITED") {
          console.log("⚡ Auto-detected ICICI Payment credit during checkout!", data);
          dispatch(setAlert({
            type: "success",
            message: `Payment of ${data.amountFormatted || ('₹' + data.amount)} confirmed via ICICI UTR: ${data.utr}!`
          }));
          setUtrNumber(data.utr);
          setAmountPaid(String(data.amount));
          setOrderConfirmed(true);
          setConfirmedOrderData((prev) => ({
            ...(prev || {}),
            order_number: data.orderNumber || "CONFIRMED",
            utr_number: data.utr,
            status: "confirmed"
          }));
          dispatch(clearCart());
        }
      } catch (err) {
        console.error(err);
      }
    };

    return () => es.close();
  }, [user, dispatch]);

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

  // Stock reservation on mount
  const handleReserveStock = async () => {
    if (orderConfirmed || !cart || cart.length === 0) return;
    setReserving(true);
    setErrorMsg("");
    try {
      const payloadItems = cart.map((item) => ({
        id: item.id,
        qty: item.qty,
        is_custom: item.is_custom || false,
      }));

      if (payloadItems.length === 0) {
        setReserving(false);
        setLoading(false);
        return;
      }

      const res = await axios.post(
        `${API_URL}/india/v1/shop/reserve-stock`,
        { items: payloadItems },
        { withCredentials: true }
      );

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
      if (!orderConfirmed) {
        setErrorMsg(error.response?.data?.message || "Stock reservation failed. Some items may no longer be available in warehouse.");
      }
    } finally {
      setReserving(false);
      setLoading(false);
    }
  };

  const fetchActiveOffers = async () => {
    try {
      const distId = selectedDistrict?._id || selectedDistrict?.id || "";
      const res = await axios.get(`${API_URL}/india/v1/shop/active-offers?district_id=${distId}`);
      if (res.data?.success) {
        setActiveOffers(res.data.data || []);
      }
    } catch (error) {
      console.error("Error loading offers:", error);
    }
  };

  const fetchBankDetails = async () => {
    try {
      const res = await axios.get(`${API_URL}/india/v1/shop/bank-details`);
      if (res.data?.success && res.data.data) {
        setBankDetails(res.data.data);
      }
    } catch (err) {
      console.error("Error fetching bank details:", err);
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
    fetchBankDetails();
  }, []);

  useEffect(() => {
    if (orderConfirmed) return;
    if (cart.length === 0) {
      navigate("/cart");
      return;
    }
    handleReserveStock();
    fetchActiveOffers();
    checkGstStatus();
  }, [cart, navigate, selectedDistrict, selectedState, orderConfirmed]);

  // Countdown timer logic
  useEffect(() => {
    if (!timerEnabled || !expiryTime || timeLeft <= 0) return;

    const interval = setInterval(() => {
      const diff = Math.max(0, Math.floor((expiryTime.getTime() - Date.now()) / 1000));
      setTimeLeft(diff);

      if (diff <= 0) {
        clearInterval(interval);
        dispatch(setAlert({ type: "warning", message: "Checkout session reservation expired! Your items have been released." }));
        navigate("/cart");
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [timerEnabled, expiryTime, timeLeft, navigate]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  const getTaxBreakdown = (amount) => {
    const fallbackRate = Number(checkoutSettings.gst_rate ?? 13.8);
    let taxable = 0;
    let gstAmount = 0;

    cart.forEach((item) => {
      const itemValue = item.qty * item.ourPrice;
      const itemGstRate = Number(item.gstRate ?? item.pricing?.gstRate ?? fallbackRate);
      const itemTaxable = Math.round(itemValue / (1 + itemGstRate / 100));
      const itemGst = Math.max(0, itemValue - itemTaxable);
      taxable += itemTaxable;
      gstAmount += itemGst;
    });

    const effectiveRate = taxable > 0 ? Number(((gstAmount / taxable) * 100).toFixed(2)) : fallbackRate;
    const computedTaxable = Math.round(amount > 0 ? amount / (1 + effectiveRate / 100) : taxable);
    const computedGstAmount = Math.max(0, amount - computedTaxable);

    return {
      taxable: computedTaxable,
      gstAmount: computedGstAmount,
      gstRate: effectiveRate,
    };
  };

  const subtotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.qty * item.ourPrice, 0);
  }, [cart]);

  const totalKitsQuantity = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.qty, 0);
  }, [cart]);

  const totalCapacityKW = useMemo(() => {
    return cart.reduce((sum, item) => sum + (item.capacityKW || 0) * item.qty, 0);
  }, [cart]);

  // Dynamic Discounts & Priority Logic Calculations
  const calculatedDiscounts = useMemo(() => {
    let flashSaleDiscount = 0;
    let bundleDiscount = 0;
    let couponDiscount = 0;
    let standardDiscount = 0;

    let activeOfferName = "None";
    let activeOfferType = "";

    const activeFlashSales = cart.map((item) => item.flashSale).filter(Boolean);
    if (activeFlashSales.length > 0) {
      const fs = activeFlashSales[0];
      activeOfferName = fs.name;
      activeOfferType = "Flash Sale";
      cart.forEach((item) => {
        if (item.flashSale) {
          if (fs.discountType === "percent") {
            flashSaleDiscount += Math.round(item.qty * item.ourPrice * (fs.discountValue / 100));
          } else {
            flashSaleDiscount += item.qty * fs.discountValue;
          }
        }
      });
    }

    const bundleOffer = activeOffers.find((o) => o.offer_type === "bundle");
    const minQty = bundleOffer && bundleOffer.max_qty ? bundleOffer.max_qty : 5;
    const bundleCartItems =
      bundleOffer && bundleOffer.products_applicable && bundleOffer.products_applicable.length > 0
        ? cart.filter((item) => bundleOffer.products_applicable.some((pId) => pId.toString() === item.id.toString()))
        : cart;
    const bundleKitsQuantity = bundleCartItems.reduce((sum, item) => sum + item.qty, 0);
    const bundleCapacityKW = bundleCartItems.reduce((sum, item) => sum + (item.capacityKW || 0) * item.qty, 0);

    if (bundleOffer && bundleKitsQuantity >= minQty) {
      bundleDiscount = bundleCapacityKW * bundleOffer.discount_value;
    }
    // NOTE: No fallback hardcoded discount — only apply when admin has configured a Bundle Offer

    if (appliedCoupon) {
      const applicableSubtotal =
        appliedCoupon.products_applicable && appliedCoupon.products_applicable.length > 0
          ? cart
            .filter((item) => appliedCoupon.products_applicable.some((pId) => pId.toString() === item.id.toString()))
            .reduce((sum, item) => sum + item.qty * item.ourPrice, 0)
          : subtotal;

      if (applicableSubtotal > 0) {
        if (appliedCoupon.discount_type === "percent") {
          couponDiscount = Math.round(applicableSubtotal * (appliedCoupon.discount_value / 100));
        } else {
          couponDiscount = appliedCoupon.discount_value;
        }
      }
    }

    const discountOffers = activeOffers.filter((o) => o.offer_type === "discount");
    cart.forEach((item) => {
      const itemOffer = discountOffers.find(
        (o) => o.products_applicable && o.products_applicable.some((pId) => pId.toString() === item.id.toString())
      );
      if (itemOffer) {
        if (itemOffer.discount_type === "percent") {
          standardDiscount += Math.round(item.qty * item.ourPrice * (itemOffer.discount_value / 100));
        } else {
          standardDiscount += item.qty * itemOffer.discount_value;
        }
      }
    });

    let appliedDiscountValue = 0;
    let selectedOffers = [];

    const hasFlashSale = flashSaleDiscount > 0;
    const hasBundle = bundleDiscount > 0;
    const hasCoupon = couponDiscount > 0;
    const hasStandard = standardDiscount > 0;

    if (hasFlashSale) {
      appliedDiscountValue += flashSaleDiscount;
      selectedOffers.push(`Flash Sale: -₹${flashSaleDiscount.toLocaleString("en-IN")}`);
      activeOfferName = activeFlashSales[0].name;
      activeOfferType = "Flash Sale";
    } else if (hasBundle) {
      appliedDiscountValue += bundleDiscount;
      selectedOffers.push(`Buy Pack Offer: -₹${bundleDiscount.toLocaleString("en-IN")}`);
      activeOfferName = bundleOffer?.offer_name || "Buy Pack Offer";
      activeOfferType = "Bundle";
    } else if (hasCoupon) {
      appliedDiscountValue += couponDiscount;
      selectedOffers.push(`Coupon (${appliedCoupon.coupon_code}): -₹${couponDiscount.toLocaleString("en-IN")}`);
      activeOfferName = `Coupon: ${appliedCoupon.coupon_code}`;
      activeOfferType = "Coupon";
    } else if (hasStandard) {
      appliedDiscountValue += standardDiscount;
      selectedOffers.push(`Standard Discount: -₹${standardDiscount.toLocaleString("en-IN")}`);
      activeOfferName = "Standard Discount";
      activeOfferType = "Discount";
    }

    const totalDeliveryFreight = cart.reduce((sum, item) => sum + (Number(item.delivery_cost) || 0), 0);
    const finalTotal = Math.max(0, subtotal - appliedDiscountValue) + totalDeliveryFreight;

    return {
      discountAmount: appliedDiscountValue,
      offersApplied: selectedOffers,
      offerName: activeOfferName,
      offerType: activeOfferType,
      totalDeliveryFreight,
      finalTotal,
    };
  }, [cart, totalKitsQuantity, totalCapacityKW, appliedCoupon, activeOffers, subtotal]);

  // Set default amount paid once total is computed
  useEffect(() => {
    if (calculatedDiscounts.finalTotal > 0 && !amountPaid) {
      setAmountPaid(calculatedDiscounts.finalTotal);
    }
  }, [calculatedDiscounts.finalTotal]);

  const handleCopyText = (text, fieldName) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(""), 2000);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        dispatch(setAlert({ type: "error", message: "File size exceeds 10MB limit." }));
        return;
      }
      setReceiptFile(file);
      if (file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onload = (ev) => setReceiptPreview(ev.target.result);
        reader.readAsDataURL(file);
      } else {
        setReceiptPreview(null);
      }
    }
  };

  const handleApplyCoupon = () => {
    setCouponError("");
    if (!couponCodeInput) return;

    const matched = activeOffers.find(
      (o) => o.offer_type === "coupon" && o.coupon_code.toUpperCase() === couponCodeInput.toUpperCase()
    );

    if (!matched) {
      setCouponError("Invalid or expired coupon code.");
      return;
    }
    setAppliedCoupon(matched);
    setCouponCodeInput("");
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
  };

  // Submit Offline Bank Transfer Checkout
  const handleSubmitOfflineOrder = async (e) => {
    e.preventDefault();

    if (!utrNumber.trim()) {
      dispatch(setAlert({ type: "error", message: "Please enter the UTR / Transaction Reference Number." }));
      return;
    }

    if (!amountPaid || Number(amountPaid) <= 0) {
      dispatch(setAlert({ type: "error", message: "Please enter a valid payment amount." }));
      return;
    }

    if (!receiptFile) {
      dispatch(setAlert({ type: "error", message: "Please upload the payment transfer receipt / screenshot." }));
      return;
    }

    // Re-verify GST status
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

    setSubmitting(true);
    try {
      const itemsPayload = cart.map((item) => ({
        scope_type: item.is_custom ? "product" : "kit",
        product_id: item.is_custom ? item.id : null,
        kit_id: item.is_custom ? null : item.id,
        item_name: item.kitName || item.name || "Solar Kit",
        image: item.image || item.kit_image || item.img || (item.images && item.images[0]) || null,
        capacity: (() => {
          if (item.capacity) return String(item.capacity).includes('kW') ? String(item.capacity) : `${item.capacity} kW`;
          if (item.capacity_kw) return `${item.capacity_kw} kW`;
          if (item.kw) return `${item.kw} kW`;
          if (item.capacityKW) return `${item.capacityKW} kW`;
          const m = (item.kitName || item.name || item.title || '').match(/(\d+(?:\.\d+)?)\s*k?w\b/i);
          return m ? `${m[1]} kW` : null;
        })(),
        description: item.description || null,
        quantity: item.qty || 1,
        ourPrice: item.ourPrice,
        gstRate: item.gstRate,
        districtId: item.districtId,
        is_trial_kit: Boolean(item.is_trial_kit),
        delivery_cost: Number(item.delivery_cost || 0),
        delivery_pincode: item.delivery_pincode || null,
        warehouse_name: item.warehouse_name || null,
        fulfillment_source: item.fulfillment_source || null,
      }));

      if (!deliveryAddress.line || !deliveryAddress.line.trim()) {
        dispatch(setAlert({ type: "error", message: "Please provide Delivery / Installation Site Address." }));
        return;
      }
      if (!deliveryAddress.pincode || deliveryAddress.pincode.trim().length < 6) {
        dispatch(setAlert({ type: "error", message: "Please enter a valid 6-digit Delivery PIN Code." }));
        return;
      }

      const addressData = {
        line: deliveryAddress.line.trim(),
        address_line: deliveryAddress.line.trim(),
        pincode: deliveryAddress.pincode.trim(),
        district_name: deliveryAddress.district_name?.trim() || selectedDistrict?.name || "",
        district_id: selectedDistrict?.id || selectedDistrict?._id || null,
        state_name: deliveryAddress.state_name?.trim() || selectedState?.name || "",
        state_id: selectedState?.id || selectedState?._id || null,
        contact_name: deliveryAddress.contact_name?.trim() || user?.name || "EPC Contractor",
        contact_phone: deliveryAddress.contact_phone?.trim() || user?.whatsapp || user?.mobile || "",
      };

      // Capacity Guard Validation
      if (fulfillmentMode === "franchisee_warehouse" && capacityResult && capacityResult.allowed === false) {
        dispatch(
          setAlert({
            type: "error",
            message: "Franchisee warehouse is at capacity limit. Please select Direct Delivery or EPC Warehouse to proceed.",
          })
        );
        setSubmitting(false);
        return;
      }

      const formData = new FormData();
      formData.append("items", JSON.stringify(itemsPayload));
      formData.append("delivery_address", JSON.stringify(addressData));
      formData.append("fulfillment_mode", fulfillmentMode);
      formData.append("order_load_metrics", JSON.stringify(orderLoadMetrics));
      formData.append(
        "offline_payment_data",
        JSON.stringify({
          utr_number: utrNumber.trim().toUpperCase(),
          amount_paid: Number(amountPaid),
          payment_date: paymentDate,
          sender_bank_name: senderBankName,
          account_holder_name: accountHolderName,
        })
      );
      formData.append("payment_receipt", receiptFile);

      const res = await axios.post(`${API_URL}/india/v1/shop/offline-checkout/create`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
        withCredentials: true,
      });

      if (res.data?.success) {
        const orderData = res.data.data?.order || res.data.data;
        setConfirmedOrderData(orderData);
        setOrderConfirmed(true);
        setErrorMsg("");
        setLoading(false);
        dispatch(clearCart());
        dispatch(
          setAlert({
            type: "success",
            message: "Order submitted! Your payment receipt is being verified by Accounts.",
          })
        );
      } else {
        throw new Error(res.data?.message || "Failed to place offline order.");
      }
    } catch (err) {
      console.error("Offline order creation error:", err);
      dispatch(
        setAlert({
          type: "error",
          message: err.response?.data?.message || err.message || "Failed to submit offline order. Please check inputs.",
        })
      );
    } finally {
      setSubmitting(false);
    }
  };

  // ── Success State: Order Submitted for Accounts Verification (Render First) ──────────────
  if (orderConfirmed && confirmedOrderData) {
    return (
      <div className="max-w-xl mx-auto my-10 bg-surface p-8 rounded-3xl border border-border shadow-2xl text-center space-y-6 animate-in fade-in zoom-in-95 duration-300">
        <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto shadow-inner border border-emerald-500/20">
          <FiCheckCircle size={44} />
        </div>

        <div>
          <span className="inline-block px-3 py-1 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 rounded-full text-xs font-black uppercase tracking-wider mb-2">
            ✓ Order Placed Successfully
          </span>
          <h2 className="text-3xl font-black text-text-primary dark:text-white">Order Confirmed!</h2>
          <p className="text-sm text-text-secondary mt-1.5 max-w-md mx-auto">
            Aapka Order Confirm Ho Gaya Hai! Your payment receipt & UTR reference have been forwarded to our <strong>Accounts Department</strong> for authorization.
          </p>
        </div>

        <div className="bg-surface-hover p-5 rounded-2xl border border-border text-left space-y-3 text-sm">
          <div className="flex justify-between items-center pb-2 border-b border-border">
            <span className="text-text-secondary font-medium">Order Number:</span>
            <span className="font-mono font-black text-primary text-base">{confirmedOrderData.order_number}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-text-secondary">UTR Reference:</span>
            <span className="font-mono font-bold text-text-primary dark:text-white">
              {confirmedOrderData.offline_payment?.utr_number || utrNumber}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-text-secondary">Amount Paid:</span>
            <span className="font-black text-emerald-600 dark:text-emerald-400">
              ₹{(confirmedOrderData.offline_payment?.amount_paid || calculatedDiscounts.finalTotal).toLocaleString("en-IN")}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-text-secondary">Verification Status:</span>
            <span className="inline-flex items-center gap-1.5 text-xs font-extrabold px-2.5 py-1 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-300">
              <FiClock size={12} /> Pending Accounts Approval
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-text-secondary">Warehouse Stock:</span>
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">Reserved (48-hr Hold)</span>
          </div>
          {deliveryAddress.pincode && (
            <div className="flex justify-between items-center pt-2 border-t border-border text-xs">
              <span className="text-text-secondary flex items-center gap-1">
                <FiMapPin size={12} className="text-primary" /> Delivery PIN:
              </span>
              <span className="font-mono font-bold text-text-primary dark:text-white">
                {deliveryAddress.pincode}
              </span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          <Button
            onClick={() => navigate("/dashboard/order-status")}
            variant="primary"
            className="py-3.5 shadow-md font-bold text-sm"
          >
            Track Live Order Status
          </Button>
          <Button
            onClick={() => navigate("/preconfigured-combo-kit")}
            variant="secondary"
            className="py-3.5 text-sm font-semibold"
          >
            Return to Product Catalogue
          </Button>
        </div>
      </div>
    );
  }

  if (loading) {
    return <Loader text="Securing warehouse inventory and loading checkout..." />;
  }

  if (errorMsg) {
    return (
      <div className="max-w-md mx-auto my-12 bg-surface p-8 rounded-2xl border border-border shadow-lg text-center space-y-4">
        <div className="w-16 h-16 bg-red-100 dark:bg-red-950/40 text-red-500 rounded-full flex items-center justify-center mx-auto">
          <FiAlertTriangle size={32} />
        </div>
        <h3 className="text-xl font-bold text-text-primary dark:text-white">Inventory Lock Blocked</h3>
        <p className="text-sm text-text-secondary">{errorMsg}</p>
        <Button onClick={() => navigate("/cart")} variant="secondary" className="w-full">
          Return to Cart
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      {/* Checkout timer bar */}
      {timerEnabled && (
        <div className="bg-amber-500/10 border border-amber-500/25 p-4 rounded-2xl flex items-center justify-between gap-4 shadow-sm">
          <div className="flex items-center gap-2.5 text-amber-600 dark:text-amber-400 text-sm font-semibold">
            <FiClock size={18} className="shrink-0" />
            <span>Stock reserved in warehouse! Complete bank transfer details before reservation session expires.</span>
          </div>
          <span className="bg-amber-500 text-white font-mono font-extrabold px-3 py-1.5 rounded-xl text-xs shrink-0 shadow">
            {formatTime(timeLeft)} Remaining
          </span>
        </div>
      )}

      {/* Franchise Attribution Banner */}
      {user?.reseller?.business_name && (
        <div className="bg-emerald-500/10 border border-emerald-500/25 p-4 rounded-2xl flex items-center gap-3 text-emerald-700 dark:text-emerald-300 shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center shrink-0 text-emerald-600 dark:text-emerald-400">
            <FiUsers size={20} />
          </div>
          <div className="text-xs">
            <p className="font-extrabold text-sm text-emerald-800 dark:text-emerald-200">
              Franchise Partner Network: {user.reseller.business_name}
            </p>
            <p className="mt-0.5 opacity-90">
              This order will be fulfilled and attributed through your authorized Franchise Partner (
              <strong>{user.reseller.business_name}</strong>).
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Columns: Order Review & Official Bank Transfer Upload Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Items Review */}
          <div className="bg-surface p-6 rounded-2xl border border-border shadow-sm">
            <h3 className="text-lg font-black text-text-primary dark:text-white mb-4 flex items-center gap-2 border-b border-border pb-3">
              <FiShoppingCart className="text-primary" /> Review Selected Solar Kits ({totalKitsQuantity} Units)
            </h3>

            <div className="divide-y divide-border">
              {cart.map((item) => (
                <div key={item.cartItemId} className="py-4 flex gap-4 items-center">
                  <div className="w-16 h-16 bg-surface-hover border border-border rounded-xl flex items-center justify-center overflow-hidden shrink-0">
                    <img src={item.kitImage} alt={item.kitName} className="object-contain w-12 h-12" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h4 className="font-bold text-sm text-text-primary dark:text-white truncate">{item.kitName}</h4>
                      {item.is_trial_kit && (
                        <span className="inline-block bg-amber-500/15 text-amber-700 dark:text-amber-300 text-[10px] font-black px-2 py-0.5 rounded-md border border-amber-500/30">
                          Trial Order ({item.qty} Units • PIN: {item.delivery_pincode || 'Specified'})
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-text-secondary mt-0.5 flex items-center gap-1.5 flex-wrap">
                      <span>{item.is_custom ? "Custom Configured" : `${item.productTier || "Standard"} Kit`} • {item.capacityKW} kW</span>
                      {item.districtName && (
                        <span className="inline-flex items-center gap-0.5 ml-1">
                          • <FiMapPin size={11} className="text-primary" /> {item.districtName}
                        </span>
                      )}
                    </p>
                    {item.flashSale && (
                      <span className="inline-block bg-amber-500/15 text-amber-600 text-[10px] font-bold px-2 py-0.5 rounded-md border border-amber-500/20 mt-1">
                        ⚡ Flash Sale Applied
                      </span>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <div className="font-black text-text-primary dark:text-white">
                      ₹{(item.qty * item.ourPrice).toLocaleString("en-IN")}
                    </div>
                    <div className="text-xs text-text-muted">Qty: {item.qty}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Official ICICI Virtual Account Card */}
          <div className="bg-gradient-to-br from-[#264baa]/10 via-surface to-[#264baa]/5 p-5 sm:p-6 rounded-2xl border-2 border-[#264baa]/40 shadow-md space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#264baa]/20 pb-3.5">
              <div>
                <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider px-2.5 py-1 bg-[#264baa]/15 text-[#264baa] dark:text-blue-300 rounded-md border border-[#264baa]/25">
                  <span className="flex h-1.5 w-1.5 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#264baa] opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#264baa]"></span>
                  </span>
                  Official ICICI Virtual Account (VAN)
                </span>
                <h3 className="text-lg sm:text-xl font-black text-text-primary dark:text-white mt-1.5 flex items-center gap-2">
                  <FiDollarSign className="text-[#264baa] dark:text-blue-400" /> Transfer to ICICI Virtual Account
                </h3>
              </div>
              <span className="text-xs font-bold text-[#264baa] dark:text-blue-300 bg-[#264baa]/10 px-3 py-1.5 rounded-lg border border-[#264baa]/30 shadow-sm">
                Zero Gateway Fees • RTGS / NEFT / IMPS / UPI
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 text-xs">
              <div className="bg-surface p-3.5 rounded-xl border border-border flex justify-between items-center">
                <div>
                  <span className="text-text-muted block text-[11px] font-medium">Beneficiary Name</span>
                  <span className="font-bold text-text-primary dark:text-white text-sm">
                    {iciciVanDetails?.beneficiary_name || "SolarKits Technologies Pvt Ltd"}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopyText(iciciVanDetails?.beneficiary_name || "SolarKits Technologies Pvt Ltd", "name")}
                  className="p-1.5 text-text-secondary hover:text-[#264baa] rounded-lg hover:bg-surface-hover transition-colors"
                  title="Copy Beneficiary Name"
                >
                  {copiedField === "name" ? <FiCheck className="text-emerald-500" /> : <FiCopy />}
                </button>
              </div>

              <div className="bg-surface p-3.5 rounded-xl border border-border flex justify-between items-center">
                <div>
                  <span className="text-text-muted block text-[11px] font-medium">Bank & Branch</span>
                  <span className="font-bold text-text-primary dark:text-white text-sm">
                    {iciciVanDetails?.bank_name || "ICICI Bank"}, {iciciVanDetails?.branch_name || "CMS Branch, Mumbai"}
                  </span>
                </div>
              </div>

              {/* Highlighted VAN Box */}
              <div className="bg-[#264baa]/10 dark:bg-[#264baa]/20 p-4 rounded-xl border-2 border-[#264baa]/50 flex justify-between items-center shadow-sm">
                <div>
                  <span className="text-[#264baa] dark:text-blue-300 block text-[11px] font-extrabold uppercase tracking-wide">
                    Your Unique Virtual Account No (VAN)
                  </span>
                  <span className="font-mono font-black text-[#264baa] dark:text-blue-200 text-lg tracking-wider">
                    {iciciVanDetails?.virtual_account_number || `SLRK${(user?.whatsapp || user?.mobile || '9876543210').slice(-10)}`}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopyText(iciciVanDetails?.virtual_account_number || `SLRK${(user?.whatsapp || user?.mobile || '9876543210').slice(-10)}`, "van")}
                  className="px-3 py-2 bg-[#264baa] hover:bg-[#1f3f91] text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-md shadow-[#264baa]/30 transition-all active:scale-95"
                >
                  {copiedField === "van" ? <FiCheck /> : <FiCopy />}
                  <span>{copiedField === "van" ? "Copied" : "Copy VAN"}</span>
                </button>
              </div>

              <div className="bg-surface p-3.5 rounded-xl border border-border flex justify-between items-center">
                <div>
                  <span className="text-text-muted block text-[11px] font-medium">IFSC Code</span>
                  <span className="font-mono font-black text-text-primary dark:text-white text-base">
                    {iciciVanDetails?.ifsc_code || "ICIC0000104"}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopyText(iciciVanDetails?.ifsc_code || "ICIC0000104", "ifsc")}
                  className="p-1.5 text-text-secondary hover:text-[#264baa] rounded-lg hover:bg-surface-hover transition-colors"
                  title="Copy IFSC Code"
                >
                  {copiedField === "ifsc" ? <FiCheck className="text-emerald-500" /> : <FiCopy />}
                </button>
              </div>
            </div>


          </div>

          {/* Checkout Submission Form */}
          <form onSubmit={handleSubmitOfflineOrder} className="space-y-6">
            {/* Step 1: Delivery & Installation Site Address */}
            <div className="bg-surface p-6 rounded-2xl border border-border shadow-sm space-y-4">
              <div className="border-b border-border pb-3 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-black text-text-primary dark:text-white flex items-center gap-2">
                    <FiMapPin className="text-primary" /> Step 1: Delivery Site Address
                  </h3>
                  <p className="text-xs text-text-secondary mt-0.5">
                    Physical site location where the solar kit equipment will be dispatched and delivered.
                  </p>
                </div>
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 bg-primary/10 text-primary rounded-md">
                  Required
                </span>
              </div>

              <div className="space-y-4">
                {/* ── Module 1.1: 3 Fulfillment Modes Selection ── */}
                <div className="space-y-3 pb-3 border-b border-border">
                  <label className="block text-xs font-black uppercase tracking-wider text-text-secondary">
                    Select Delivery Fulfillment Mode <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {/* Mode 1: Franchisee Warehouse */}
                    <div
                      onClick={() => setFulfillmentMode("franchisee_warehouse")}
                      className={`p-4 rounded-2xl border-2 transition-all cursor-pointer relative flex flex-col justify-between ${fulfillmentMode === "franchisee_warehouse"
                        ? "border-primary bg-primary/5 shadow-md ring-2 ring-primary/20"
                        : "border-border bg-surface hover:border-primary/50"
                        }`}
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-2xl">🏬</span>
                          <span className={`w-4 h-4 rounded-full border flex items-center justify-center ${fulfillmentMode === "franchisee_warehouse" ? "border-primary bg-primary text-white" : "border-border"
                            }`}>
                            {fulfillmentMode === "franchisee_warehouse" && <FiCheck size={10} />}
                          </span>
                        </div>
                        <h4 className="font-extrabold text-sm text-text-primary">Franchisee Warehouse</h4>
                        <p className="text-[11px] text-text-secondary leading-relaxed">
                          Delivery to nearest authorized Franchisee Regional Hub Warehouse.
                        </p>
                      </div>

                      {/* Live Capacity Validation Indicator */}
                      <div className="mt-3 pt-2 border-t border-border/60">
                        {capacityChecking ? (
                          <span className="text-[10px] text-primary flex items-center gap-1 font-semibold animate-pulse">
                            Checking live warehouse capacity...
                          </span>
                        ) : capacityResult?.allowed === false ? (
                          <div className="p-1.5 bg-red-500/10 border border-red-500/30 rounded-lg text-[10px] text-red-600 font-bold flex items-center gap-1">
                            <FiAlertTriangle className="shrink-0" /> At Capacity Limit ({capacityResult?.available_kits || 0} left)
                          </div>
                        ) : (
                          <div className="text-[10px] text-emerald-600 font-bold flex items-center gap-1">
                            <FiCheckCircle className="shrink-0" /> Available Capacity Verified
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Mode 2: EPC Warehouse / Self Warehouse */}
                    <div
                      onClick={() => setFulfillmentMode("epc_warehouse")}
                      className={`p-4 rounded-2xl border-2 transition-all cursor-pointer relative flex flex-col justify-between ${fulfillmentMode === "epc_warehouse"
                        ? "border-primary bg-primary/5 shadow-md ring-2 ring-primary/20"
                        : "border-border bg-surface hover:border-primary/50"
                        }`}
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-2xl">🏭</span>
                          <span className={`w-4 h-4 rounded-full border flex items-center justify-center ${fulfillmentMode === "epc_warehouse" ? "border-primary bg-primary text-white" : "border-border"
                            }`}>
                            {fulfillmentMode === "epc_warehouse" && <FiCheck size={10} />}
                          </span>
                        </div>
                        <h4 className="font-extrabold text-sm text-text-primary">EPC Warehouse / Self Depot</h4>
                        <p className="text-[11px] text-text-secondary leading-relaxed">
                          Direct bulk dispatch to your company depot or contractor warehouse.
                        </p>
                      </div>
                      <div className="mt-3 pt-2 border-t border-border/60 text-[10px] text-text-muted">
                        Central Direct Dispatch
                      </div>
                    </div>

                    {/* Mode 3: Direct Site Address / Pincode Delivery */}
                    <div
                      onClick={() => setFulfillmentMode("direct_site")}
                      className={`p-4 rounded-2xl border-2 transition-all cursor-pointer relative flex flex-col justify-between ${fulfillmentMode === "direct_site"
                        ? "border-primary bg-primary/5 shadow-md ring-2 ring-primary/20"
                        : "border-border bg-surface hover:border-primary/50"
                        }`}
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-2xl">🚚</span>
                          <span className={`w-4 h-4 rounded-full border flex items-center justify-center ${fulfillmentMode === "direct_site" ? "border-primary bg-primary text-white" : "border-border"
                            }`}>
                            {fulfillmentMode === "direct_site" && <FiCheck size={10} />}
                          </span>
                        </div>
                        <h4 className="font-extrabold text-sm text-text-primary">Direct Site Delivery</h4>
                        <p className="text-[11px] text-text-secondary leading-relaxed">
                          Transport directly unloaded at the installation site address or pincode.
                        </p>
                      </div>
                      <div className="mt-3 pt-2 border-t border-border/60 text-[10px] text-emerald-600 font-bold flex items-center gap-1">
                        <FiCheckCircle /> Site Pincode Delivery
                      </div>
                    </div>
                  </div>

                  {/* Capacity Warning Banner if Franchisee Warehouse is full */}
                  {fulfillmentMode === "franchisee_warehouse" && capacityResult?.allowed === false && (
                    <div className="p-3 bg-amber-500/10 border-2 border-amber-500/30 rounded-xl text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2 animate-in fade-in duration-200">
                      <FiAlertTriangle className="text-amber-600 text-base shrink-0 mt-0.5" />
                      <div>
                        <strong className="block font-bold">Franchisee warehouse at capacity limit.</strong>
                        <span>
                          {capacityResult?.reason || "Current stored inventory and incoming reserved commitments have reached storage limits."} Please select <strong>Direct Delivery</strong> or <strong>EPC Warehouse</strong> above.
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Order Load Metrics Pill */}
                  <div className="bg-surface-hover/60 p-2.5 rounded-xl border border-border flex flex-wrap items-center justify-between gap-2 text-xs">
                    <span className="text-text-muted font-medium">Order Load Metrics:</span>
                    <div className="flex items-center gap-3 font-semibold text-text-primary">
                      <span>📦 <strong>{orderLoadMetrics.total_kits}</strong> Kits</span>
                      <span>⚡ <strong>{orderLoadMetrics.total_kw.toFixed(1)}</strong> kW</span>
                      <span>⚖️ <strong>{orderLoadMetrics.total_weight_kg.toFixed(0)}</strong> kg Payload</span>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-text-primary dark:text-white mb-1.5">
                    Site Street Address / Plot / Industrial Area <span className="text-red-500">*</span>
                  </label>
                  <CustomInput
                    placeholder="e.g. Survey No. 42, GIDC Industrial Estate, Ring Road"
                    value={deliveryAddress.line}
                    onChange={(e) => setDeliveryAddress((prev) => ({ ...prev, line: e.target.value }))}
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-text-primary dark:text-white mb-1.5">
                      Delivery PIN Code <span className="text-red-500">*</span>
                    </label>
                    <CustomInput
                      placeholder="e.g. 380001"
                      value={deliveryAddress.pincode}
                      maxLength={6}
                      onChange={(e) => setDeliveryAddress((prev) => ({ ...prev, pincode: e.target.value.replace(/\D/g, '') }))}
                      required
                      className="font-mono font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-text-primary dark:text-white mb-1.5">
                      District / City
                    </label>
                    <CustomInput
                      placeholder="e.g. Ahmedabad"
                      value={deliveryAddress.district_name}
                      onChange={(e) => setDeliveryAddress((prev) => ({ ...prev, district_name: e.target.value }))}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-text-primary dark:text-white mb-1.5">
                      State
                    </label>
                    <CustomInput
                      placeholder="e.g. Gujarat"
                      value={deliveryAddress.state_name}
                      onChange={(e) => setDeliveryAddress((prev) => ({ ...prev, state_name: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-text-primary dark:text-white mb-1.5">
                      Site Contact Person
                    </label>
                    <CustomInput
                      placeholder="Receiver / Site Engineer Name"
                      value={deliveryAddress.contact_name}
                      onChange={(e) => setDeliveryAddress((prev) => ({ ...prev, contact_name: e.target.value }))}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-text-primary dark:text-white mb-1.5">
                      Site Contact Phone / WhatsApp <span className="text-red-500">*</span>
                    </label>
                    <CustomInput
                      placeholder="e.g. 9876543210"
                      value={deliveryAddress.contact_phone}
                      onChange={(e) => setDeliveryAddress((prev) => ({ ...prev, contact_phone: e.target.value }))}
                      required
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Step 2: Payment Receipt Upload & UTR Submission Form */}
            <div className="bg-surface p-6 rounded-2xl border border-border shadow-sm space-y-5">
              <div className="border-b border-border pb-3">
                <h3 className="text-lg font-black text-text-primary dark:text-white flex items-center gap-2">
                  <FiUploadCloud className="text-primary" /> Step 2: Upload Payment Receipt & Enter UTR
                </h3>
                <p className="text-xs text-text-secondary mt-0.5">
                  Complete bank transfer using company bank account details above and attach verification proof below.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-text-primary dark:text-white mb-1.5">
                    UTR / Transaction Ref No. <span className="text-red-500">*</span>
                  </label>
                  <CustomInput
                    placeholder="e.g. HDFC0001928374 or 239847192834"
                    value={utrNumber}
                    onChange={(e) => setUtrNumber(e.target.value.toUpperCase())}
                    required
                    className="font-mono uppercase font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-text-primary dark:text-white mb-1.5">
                    Amount Paid (₹) <span className="text-red-500">*</span>
                  </label>
                  <CustomInput
                    type="number"
                    placeholder="Order Total Amount"
                    value={amountPaid}
                    onChange={(e) => setAmountPaid(e.target.value)}
                    required
                    className="font-bold font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-text-primary dark:text-white mb-1.5">
                    Payment Date <span className="text-red-500">*</span>
                  </label>
                  <CustomInput
                    type="date"
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-text-primary dark:text-white mb-1.5">
                    Sender Bank Name
                  </label>
                  <CustomInput
                    placeholder="e.g. State Bank of India / ICICI"
                    value={senderBankName}
                    onChange={(e) => setSenderBankName(e.target.value)}
                  />
                </div>
              </div>

              {/* Receipt Upload Box */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-text-primary dark:text-white">
                  Upload Payment Transfer Receipt / Screenshot <span className="text-red-500">*</span>
                </label>

                <div className="border-2 border-dashed border-border hover:border-primary rounded-2xl p-5 text-center transition-colors bg-surface-hover cursor-pointer relative">
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={handleFileChange}
                    required={!receiptFile}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  {receiptPreview ? (
                    <div className="space-y-2">
                      <img src={receiptPreview} alt="Receipt preview" className="max-h-36 mx-auto rounded-lg object-contain border border-border" />
                      <p className="text-xs font-bold text-primary">{receiptFile?.name}</p>
                      <p className="text-[11px] text-text-muted">Click to change receipt file</p>
                    </div>
                  ) : receiptFile ? (
                    <div className="flex items-center justify-center gap-2 text-primary font-bold text-sm">
                      <FiFileText size={24} />
                      <span>{receiptFile.name} (Ready to upload)</span>
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      <FiUploadCloud size={32} className="mx-auto text-primary" />
                      <p className="text-xs font-bold text-text-primary dark:text-white">
                        Drag & Drop payment receipt or <span className="text-primary underline">browse</span>
                      </p>
                      <p className="text-[11px] text-text-muted">Supports JPG, PNG, PDF (Max 10MB)</p>
                    </div>
                  )}
                </div>
              </div>

              <Button
                type="submit"
                variant="primary"
                size="lg"
                fullWidth
                loading={submitting}
                className="py-4 shadow-lg font-black text-base"
              >
                Submit Payment for Accounts Verification
              </Button>
            </div>
          </form>
        </div>

        {/* Right Column: Totals Summary & Coupon */}
        <div className="space-y-6">
          <div className="bg-surface p-6 rounded-2xl border border-border shadow-sm space-y-4">
            <h3 className="text-lg font-black text-text-primary dark:text-white border-b border-border pb-3">
              Order Pricing Summary
            </h3>

            <div className="space-y-2 text-sm border-b border-border pb-3">
              <div className="flex justify-between text-text-secondary">
                <span>Items Total (Excl. GST):</span>
                <span className="font-semibold text-text-primary dark:text-white">
                  ₹{getTaxBreakdown(subtotal).taxable.toLocaleString("en-IN")}
                </span>
              </div>
              <div className="flex justify-between text-text-secondary">
                <span>GST ({getTaxBreakdown(subtotal).gstRate}%):</span>
                <span className="font-semibold text-text-primary dark:text-white">
                  ₹{getTaxBreakdown(subtotal).gstAmount.toLocaleString("en-IN")}
                </span>
              </div>
              <div className="flex justify-between text-text-secondary border-t border-border pt-2">
                <span>Subtotal (Incl. GST):</span>
                <span className="font-black text-text-primary dark:text-white">₹{subtotal.toLocaleString("en-IN")}</span>
              </div>
              <div className="flex justify-between text-text-secondary">
                <span>Total Capacity:</span>
                <span className="font-bold text-text-primary dark:text-white">{totalCapacityKW} KW</span>
              </div>

              {calculatedDiscounts.discountAmount > 0 && (
                <div className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 p-3 rounded-xl border border-emerald-500/20 space-y-1.5 mt-2">
                  <div className="text-xs font-bold flex items-center gap-1">
                    <FiAward /> Applied Discounts:
                  </div>
                  {calculatedDiscounts.offersApplied.map((offerStr, idx) => (
                    <div key={idx} className="flex justify-between text-xs">
                      <span>{offerStr.split(":")[0]}</span>
                      <span className="font-bold">{offerStr.split(":")[1]}</span>
                    </div>
                  ))}
                </div>
              )}
              {calculatedDiscounts.totalDeliveryFreight > 0 && (
                <div className="flex justify-between text-text-secondary text-emerald-600 dark:text-emerald-400 font-bold border-t border-dashed border-border pt-2">
                  <span>Delivery Charge:</span>
                  <span>+₹{calculatedDiscounts.totalDeliveryFreight.toLocaleString("en-IN")}</span>
                </div>
              )}
            </div>

            <div className="flex justify-between items-baseline pt-2">
              <span className="font-black text-text-primary dark:text-white">Total Payable:</span>
              <span className="text-2xl font-black text-primary">
                ₹{calculatedDiscounts.finalTotal.toLocaleString("en-IN")}
              </span>
            </div>
          </div>

          {/* Coupon Code Entry — collapsed by default */}
          <div className="bg-surface px-5 py-4 rounded-2xl border border-border shadow-sm">
            {appliedCoupon ? (
              /* Applied state — always visible when active */
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-sm">
                  <FiTag className="text-primary" />
                  <span className="font-bold text-primary font-mono">{appliedCoupon.coupon_code}</span>
                  <span className="text-text-muted text-xs">applied</span>
                </div>
                <button
                  onClick={() => { handleRemoveCoupon(); setShowCouponInput(false); }}
                  className="text-text-secondary hover:text-red-500 font-bold text-lg leading-none"
                  title="Remove coupon"
                >
                  &times;
                </button>
              </div>
            ) : (
              <>
                {/* Toggle link */}
                <button
                  type="button"
                  onClick={() => setShowCouponInput((v) => !v)}
                  className="flex items-center gap-1.5 text-sm text-text-secondary hover:text-primary transition-colors w-full text-left"
                >
                  <FiTag size={14} className="text-primary" />
                  <span className="font-medium">Have a coupon code?</span>
                  <span className="ml-auto text-xs text-text-muted">{showCouponInput ? "▲ Hide" : "▼ Enter code"}</span>
                </button>

                {/* Expandable input */}
                {showCouponInput && (
                  <div className="mt-3 space-y-2">
                    <div className="flex gap-2">
                      <CustomInput
                        placeholder="Enter coupon code"
                        value={couponCodeInput}
                        onChange={(e) => setCouponCodeInput(e.target.value)}
                        className="flex-1 uppercase font-mono"
                      />
                      <Button onClick={handleApplyCoupon} variant="primary" className="py-2.5 px-4 shadow-sm">
                        Apply
                      </Button>
                    </div>
                    {couponError && (
                      <div className="text-xs text-red-500 font-semibold bg-red-500/10 p-2.5 rounded-lg border border-red-500/20 flex items-center gap-1">
                        <FiAlertTriangle /> {couponError}
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      <GstVerificationDialog
        isOpen={showGstDialog}
        onClose={() => {
          setShowGstDialog(false);
          navigate("/cart");
        }}
        stateId={gstStateId}
        onVerified={() => setShowGstDialog(false)}
      />
    </div>
  );
}
