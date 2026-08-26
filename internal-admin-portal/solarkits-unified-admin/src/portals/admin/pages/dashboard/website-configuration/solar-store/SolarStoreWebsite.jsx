import React, { useState, useEffect, useCallback } from "react";
import {
  FiMonitor,
  FiEdit3,
  FiEye,
  FiLayers,
  FiSave,
  FiExternalLink,
  FiPlus,
  FiTrash2,
  FiRefreshCw,
  FiCheckCircle,
  FiAlertCircle,
  FiStar,
  FiPhone,
  FiMail,
  FiMapPin,
  FiMessageSquare,
  FiShield,
  FiHelpCircle,
  FiPackage,
  FiZap,
  FiSun,
  FiGrid,
  FiAward,
  FiShoppingCart,
  FiTag,
} from "react-icons/fi";
import { FaStore, FaBoxOpen, FaHandshake, FaComments } from "react-icons/fa";
import {
  getWebsiteContent,
  updateWebsiteContent,
  resetWebsiteContent,
} from "../../../../api/websiteContentApi";
import Loader from "../../../../components/Loader";

const DEFAULT_SOLAR_STORE_STATE = {
  hero: {
    enabled: true,
    slides: [
      {
        id: 1,
        tag: "🌞 India's #1 Solar Kits Marketplace",
        title: "Complete Solar Kits\nFor Homes & Business",
        subtitle: "Certified pre-configured & custom solar kits — panels, inverter, mounting structure & BOS in one box. Save up to ₹78,000 with PM Surya Ghar Subsidy.",
        cta1: { label: "Shop Solar Kits", href: "#products" },
        cta2: { label: "Calculate Savings", href: "#calculator" },
        bg: "from-navy via-primary-700 to-primary-500",
      },
      {
        id: 2,
        tag: "💰 PM Surya Ghar Yojana",
        title: "Get Govt. Subsidy\nUp to ₹78,000 on Solar Kits",
        subtitle: "Under PM Surya Ghar Muft Bijli Yojana, install 1kW-3kW Rooftop Solar Kits with verified subsidy approval. Apply now through SolarKits!",
        cta1: { label: "Check Subsidy Kits", href: "#subsidy" },
        cta2: { label: "Talk to Expert", href: "#contact" },
        bg: "from-[#0D3B6E] via-[#1565C0] to-[#29ABE2]",
      },
      {
        id: 3,
        tag: "⚡ Complete Plug & Play Solar Kits",
        title: "Everything You Need\nin One Box",
        subtitle: "From 1kW Home Kits to 100kW Commercial Kits — our complete kits include high-efficiency panels, inverter, mounting structures & AC/DC BOS. Fast delivery across India!",
        cta1: { label: "View Solar Kits", href: "#products" },
        cta2: { label: "Get Free Quote", href: "#quote" },
        bg: "from-[#0D3B6E] to-primary-600",
      },
    ],
    trust_badges: ["✅ BIS Certified", "📋 GST Invoice", "🚚 Free Delivery", "⭐ 4.8 Rating"],
    stats: [
      { val: "10,000+", label: "Happy Customers" },
      { val: "50 MW+", label: "Installed Capacity" },
    ],
  },
  categories: {
    enabled: true,
    badge_text: "Browse Solar Kit Categories",
    heading: "Find the Right Solar",
    highlight_heading: "Kit Solution",
    subtitle: "Explore our certified range of complete solar kits designed for homes, businesses, farms and commercial projects.",
    items: [
      {
        id: 1,
        name: "On-Grid Solar Kits",
        desc: "Grid-tied rooftop solar kits from 1kW to 10kW with net-metering & PM Surya Ghar subsidy.",
        count: "45+ Kits",
        label: "On-Grid",
        href: "#products",
      },
      {
        id: 2,
        name: "Off-Grid Solar Kits",
        desc: "Battery-backed complete solar kits for 24x7 independent power without grid reliance.",
        count: "30+ Kits",
        label: "Off-Grid",
        href: "#products",
      },
      {
        id: 3,
        name: "Hybrid Solar Kits",
        desc: "Best of both: Grid connectivity with battery backup for uninterrupted power & maximum savings.",
        count: "25+ Kits",
        label: "Hybrid",
        href: "#products",
      },
      {
        id: 4,
        name: "Solar Custom Kits",
        desc: "Pre-wired AC/DC distribution boxes, lightning arrestors, earthing kits and custom combos.",
        count: "50+ Kits",
        label: "Custom Kits",
        href: "#products",
      },
    ],
    quality_note_1: "All products are quality verified",
    quality_note_2: "Pan-India delivery and installation support",
  },
  featured_products: {
    enabled: true,
    badge_text: "Most Popular",
    heading: "Bestselling Solar Kits",
    subtitle: "Explore our most trusted pre-configured solar combo kits selected for high performance, durability and maximum subsidy benefits.",
    view_all_text: "View All Solar Kits",
    view_all_href: "#all-products",
    items: [
      {
        id: 1,
        name: "SolarKits 1kW Smart On-Grid Home Kit",
        category: "On-Grid Solar Kit",
        badge: "Subsidy Eligible",
        badgeColor: "bg-green-500 text-white",
        rating: 4.8,
        reviews: 234,
        price: 48000,
        mrp: 65000,
        discount: 26,
        watt: "1kW Kit",
        brand: "SolarKits Prime",
      },
      {
        id: 2,
        name: "SolarKits 2kW Rooftop Solar Combo Kit",
        category: "On-Grid Solar Kit",
        badge: "PM Surya Ghar Ready",
        badgeColor: "bg-sky-500 text-white",
        rating: 4.9,
        reviews: 189,
        price: 95000,
        mrp: 125000,
        discount: 24,
        watt: "2kW Kit",
        brand: "SolarKits Prime",
      },
      {
        id: 3,
        name: "SolarKits 3kW Complete Home Combo Kit",
        category: "On-Grid Solar Kit",
        badge: "🔥 Bestseller",
        badgeColor: "bg-red-500 text-white",
        rating: 4.9,
        reviews: 312,
        price: 145000,
        mrp: 195000,
        discount: 26,
        watt: "3kW Kit",
        brand: "SolarKits Prime",
      },
      {
        id: 4,
        name: "SolarKits 5kW Heavy Duty Hybrid Solar Kit",
        category: "Hybrid Solar Kit",
        badge: "Battery Backup",
        badgeColor: "bg-orange-500 text-white",
        rating: 4.8,
        reviews: 156,
        price: 265000,
        mrp: 340000,
        discount: 22,
        watt: "5kW Kit",
        brand: "SolarKits Ultra",
      },
      {
        id: 5,
        name: "SolarKits 10kW Commercial 3-Phase Kit",
        category: "Commercial Solar Kit",
        badge: "High ROI",
        badgeColor: "bg-blue-600 text-white",
        rating: 4.8,
        reviews: 98,
        price: 490000,
        mrp: 620000,
        discount: 21,
        watt: "10kW Kit",
        brand: "SolarKits Pro",
      },
      {
        id: 6,
        name: "SolarKits Universal Complete Solar BOS Kit",
        category: "Solar BOS Kit",
        badge: "Plug & Play",
        badgeColor: "bg-purple-500 text-white",
        rating: 4.7,
        reviews: 142,
        price: 18500,
        mrp: 24000,
        discount: 23,
        watt: "Universal BOS",
        brand: "SolarKits",
      },
    ],
  },
  why_choose: {
    enabled: true,
    badge_text: "Why SolarKits?",
    heading: "The SolarKits Advantage",
    subtitle: "We don't just sell solar — we deliver a complete, worry-free solar experience",
    items: [
      {
        emoji: "🏅",
        title: "BIS & MNRE Certified",
        desc: "All products are certified by Bureau of Indian Standards and Ministry of New & Renewable Energy.",
        color: "bg-blue-50 border-blue-100",
        iconBg: "bg-primary-100",
      },
      {
        emoji: "🚚",
        title: "Free Pan-India Delivery",
        desc: "We deliver to 18,000+ pincodes across India. Free shipping on orders above ₹5,000.",
        color: "bg-orange-50 border-orange-100",
        iconBg: "bg-accent-50",
      },
      {
        emoji: "🛡️",
        title: "25-Year Warranty",
        desc: "Industry-leading 25-year performance warranty on solar panels + 5-year product warranty.",
        color: "bg-green-50 border-green-100",
        iconBg: "bg-green-100",
      },
      {
        emoji: "⚙️",
        title: "Expert Installation",
        desc: "Trained solar engineers install your system within 48–72 hours of delivery. MNRE empanelled.",
        color: "bg-purple-50 border-purple-100",
        iconBg: "bg-purple-100",
      },
      {
        emoji: "💰",
        title: "Easy EMI Options",
        desc: "0% EMI available for 6/12 months on orders above ₹25,000 via top bank credit cards.",
        color: "bg-sky-50 border-sky-100",
        iconBg: "bg-sky-100",
      },
      {
        emoji: "📋",
        title: "GST Invoice & Tax Benefits",
        desc: "Get official GST invoices for every purchase. Businesses can claim input tax credit.",
        color: "bg-teal-50 border-teal-100",
        iconBg: "bg-teal-100",
      },
    ],
  },
  brands: {
    enabled: true,
    badge_text: "Our Brand Partners",
    heading: "Top Solar Kit Brand Partners",
    subtitle: "Explore certified Tier-1 component manufacturers integrated into SolarKits complete solar solutions, selected for quality, efficiency and long-term performance.",
    cta_label: "Explore All Brands",
    cta_href: "#all-brands",
    items: [
      { id: 1, name: "Adani Solar", type: "Solar Kit Partner", description: "Tier-1 high-efficiency Mono PERC solar modules" },
      { id: 2, name: "Waaree", type: "Solar Kit Partner", description: "Reliable mono and bifacial solar kit modules" },
      { id: 3, name: "Tata Power Solar", type: "Solar Kit Partner", description: "Trusted residential and commercial kit panels" },
      { id: 4, name: "Vikram Solar", type: "Solar Kit Partner", description: "Premium high-performance solar kit modules" },
      { id: 5, name: "Luminous", type: "Solar Kit Partner", description: "Complete rooftop solar kit power solutions" },
      { id: 6, name: "Loom Solar", type: "Solar Kit Partner", description: "Advanced rooftop solar kit technology" },
      { id: 7, name: "RenewSys", type: "Solar Kit Partner", description: "Durable and efficient PV solar kit modules" },
      { id: 8, name: "Goldi Solar", type: "Solar Kit Partner", description: "Quality-certified Indian solar kit modules" },
      { id: 9, name: "Solis", type: "Solar Kit Partner", description: "Smart on-grid and hybrid solar kit power systems" },
      { id: 10, name: "Growatt", type: "Solar Kit Partner", description: "Intelligent residential solar kit power units" },
      { id: 11, name: "Microtek", type: "Solar Kit Partner", description: "Reliable solar kit power conditioning units" },
      { id: 12, name: "UTL Solar", type: "Solar Kit Partner", description: "Complete off-grid and hybrid solar kit packages" },
    ],
  },
  testimonials: {
    enabled: true,
    badge_text: "Customer Stories",
    heading: "Loved by Solar Customers",
    subtitle: "Real experiences from families and businesses that switched to clean, affordable solar energy.",
    overall_rating: "4.8",
    review_count: "Based on 2,400+ reviews",
    platforms: [
      { platform: "Google", rating: "4.9", reviews: "1.2K reviews", color: "bg-blue-50 text-blue-600" },
      { platform: "Trustpilot", rating: "4.7", reviews: "520 reviews", color: "bg-green-50 text-green-600" },
      { platform: "Amazon", rating: "4.8", reviews: "410 reviews", color: "bg-orange-50 text-orange-600" },
      { platform: "Flipkart", rating: "4.8", reviews: "270 reviews", color: "bg-sky-50 text-sky-600" },
    ],
    items: [
      {
        id: 1,
        name: "Ramesh Sharma",
        city: "Jaipur, Rajasthan",
        role: "Homeowner",
        rating: 5,
        review: "We installed a 3kW system through SolarKits. The whole process from ordering to installation was super smooth. My electricity bill dropped from ₹2,800 to just ₹120! Best investment ever.",
        system: "3kW On-Grid System",
        savings: "₹2,680/mo",
        initials: "RS",
      },
      {
        id: 2,
        name: "Priya Menon",
        city: "Coimbatore, Tamil Nadu",
        role: "Factory Owner",
        rating: 5,
        review: "Ordered 50 panels for our factory rooftop. Delivery was on time and the panels are top quality — all MNRE certified. Our energy costs have fallen by 65%. Highly recommend SolarKits!",
        system: "25kW Commercial System",
        savings: "₹42,000/mo",
        initials: "PM",
      },
      {
        id: 3,
        name: "Ajay Verma",
        city: "Lucknow, Uttar Pradesh",
        role: "Farmer",
        rating: 5,
        review: "Maine 5kW off-grid system lagaya apne khet ke liye. Ab pump chalta hai bina bijli bill ke. SolarKits ka support team bahut helpful tha. Thank you!",
        system: "5kW Off-Grid System",
        savings: "₹5,200/mo",
        initials: "AV",
      },
      {
        id: 4,
        name: "Sunita Patel",
        city: "Surat, Gujarat",
        role: "Homeowner",
        rating: 4,
        review: "Got subsidy of ₹78,000 with help from SolarKits team. The installation team was professional and completed the job in just 2 days. Very satisfied with the quality and service.",
        system: "4kW On-Grid System",
        savings: "₹3,500/mo",
        initials: "SP",
      },
      {
        id: 5,
        name: "Mohit Gupta",
        city: "Pune, Maharashtra",
        role: "IT Professional",
        rating: 5,
        review: "The SolarKits app made it so easy to track my production. I'm producing 18–20 units daily. The 25-year warranty gives me complete peace of mind. Great product, great service!",
        system: "3kW Hybrid System",
        savings: "₹2,900/mo",
        initials: "MG",
      },
    ],
  },
  footer: {
    consultation_box: {
      badge: "Free solar consultation",
      heading: "Ready to switch to solar?",
      subtitle: "Share your pincode and our expert will suggest the right solar kit.",
      button_text: "Get free quote",
    },
    description: "Quality solar kits, honest guidance and reliable support for homes, farms and businesses across India.",
    phone: "1800-SOLAR-KIT",
    email: "support@solarkits.in",
    address: "Mumbai, Maharashtra, India",
    shop_links: ["On-Grid Solar Kits", "Off-Grid Solar Kits", "Hybrid Solar Kits", "Commercial Solar Kits"],
    help_links: ["About Us", "Contact Us", "Installation Guide", "Product Warranty"],
    policy_links: ["Privacy", "Terms", "Returns", "Shipping"],
    copyright_text: "© 2026 SolarKits™ Pvt. Ltd. All Rights Reserved.",
    floating_whatsapp: {
      number: "919876543210",
      label: "Chat on WhatsApp",
    },
  },
};

export default function SolarStoreWebsite() {
  const [activeTab, setActiveTab] = useState("hero");
  const [sections, setSections] = useState(DEFAULT_SOLAR_STORE_STATE);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [alert, setAlert] = useState(null);

  const fetchContent = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getWebsiteContent("solar-store");
      if (res && res.data && res.data.sections) {
        setSections({
          ...DEFAULT_SOLAR_STORE_STATE,
          ...res.data.sections,
          featured_products: {
            ...DEFAULT_SOLAR_STORE_STATE.featured_products,
            ...(res.data.sections.featured_products || {}),
          },
        });
      }
    } catch (err) {
      console.warn("Could not load from API, using default store data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchContent();
  }, [fetchContent]);

  const handleSave = async () => {
    setSaving(true);
    setAlert(null);
    try {
      const res = await updateWebsiteContent("solar-store", sections);
      if (res && res.status === "success") {
        setAlert({
          type: "success",
          message: "Solar Store landing page content saved & synced successfully!",
        });
        if (res.data && res.data.sections) {
          setSections((prev) => ({
            ...prev,
            ...res.data.sections,
          }));
        }
      }
    } catch (err) {
      console.error("Save error:", err);
      setAlert({
        type: "error",
        message: err?.response?.data?.message || "Failed to save Solar Store content.",
      });
    } finally {
      setSaving(false);
      setTimeout(() => setAlert(null), 5000);
    }
  };

  const handleReset = async () => {
    if (!window.confirm("Reset all Solar Store content to factory defaults?")) return;
    setSaving(true);
    try {
      const res = await resetWebsiteContent("solar-store");
      if (res && res.status === "success") {
        setSections(DEFAULT_SOLAR_STORE_STATE);
        setAlert({ type: "success", message: "Solar Store reset to factory defaults successfully!" });
      }
    } catch (err) {
      setAlert({ type: "error", message: "Failed to reset content." });
    } finally {
      setSaving(false);
      setTimeout(() => setAlert(null), 5000);
    }
  };

  // ── Slide Helpers ──────────────────────────────────────────────────────────
  const handleAddSlide = () => {
    const newSlide = {
      id: Date.now(),
      tag: "⚡ New Solar Promotion",
      title: "New Seasonal Solar Kits\nExclusive Savings",
      subtitle: "Experience seamless clean energy with next-gen smart inverters and high-yield bifacial panels.",
      cta1: { label: "Shop Now", href: "#products" },
      cta2: { label: "Learn More", href: "#about" },
      bg: "from-[#0D3B6E] via-[#1565C0] to-[#29ABE2]",
    };
    setSections((prev) => ({
      ...prev,
      hero: {
        ...prev.hero,
        slides: [...(prev.hero?.slides || []), newSlide],
      },
    }));
  };

  const handleUpdateSlide = (idx, field, value) => {
    setSections((prev) => {
      const slides = [...(prev.hero?.slides || [])];
      slides[idx] = { ...slides[idx], [field]: value };
      return {
        ...prev,
        hero: { ...prev.hero, slides },
      };
    });
  };

  const handleDeleteSlide = (idx) => {
    setSections((prev) => ({
      ...prev,
      hero: {
        ...prev.hero,
        slides: (prev.hero?.slides || []).filter((_, i) => i !== idx),
      },
    }));
  };

  // ── Category Helpers ───────────────────────────────────────────────────────
  const handleAddCategory = () => {
    const newCat = {
      id: Date.now(),
      name: "New Solar Category",
      desc: "High-efficiency systems designed for reliability and savings.",
      count: "20+ Kits",
      label: "Special Kits",
      href: "#products",
    };
    setSections((prev) => ({
      ...prev,
      categories: {
        ...prev.categories,
        items: [...(prev.categories?.items || []), newCat],
      },
    }));
  };

  const handleUpdateCategory = (idx, field, value) => {
    setSections((prev) => {
      const items = [...(prev.categories?.items || [])];
      items[idx] = { ...items[idx], [field]: value };
      return {
        ...prev,
        categories: { ...prev.categories, items },
      };
    });
  };

  const handleDeleteCategory = (idx) => {
    setSections((prev) => ({
      ...prev,
      categories: {
        ...prev.categories,
        items: (prev.categories?.items || []).filter((_, i) => i !== idx),
      },
    }));
  };

  // ── Featured Products Helpers ──────────────────────────────────────────────
  const handleAddProduct = () => {
    const newProd = {
      id: Date.now(),
      name: "SolarKits Custom High-Efficiency Solar Kit",
      category: "Hybrid Solar Kit",
      badge: "🔥 New Arrival",
      badgeColor: "bg-orange-500 text-white",
      rating: 5.0,
      reviews: 1,
      price: 180000,
      mrp: 230000,
      discount: 22,
      watt: "3.3kW Kit",
      brand: "SolarKits Ultra",
    };
    setSections((prev) => ({
      ...prev,
      featured_products: {
        ...prev.featured_products,
        items: [...(prev.featured_products?.items || []), newProd],
      },
    }));
  };

  const handleUpdateProduct = (idx, field, value) => {
    setSections((prev) => {
      const items = [...(prev.featured_products?.items || [])];
      items[idx] = { ...items[idx], [field]: value };
      return {
        ...prev,
        featured_products: { ...prev.featured_products, items },
      };
    });
  };

  const handleDeleteProduct = (idx) => {
    setSections((prev) => ({
      ...prev,
      featured_products: {
        ...prev.featured_products,
        items: (prev.featured_products?.items || []).filter((_, i) => i !== idx),
      },
    }));
  };

  // ── Why Choose Us Helpers ──────────────────────────────────────────────────
  const handleAddFeature = () => {
    const newFeat = {
      emoji: "🌟",
      title: "New Feature Title",
      desc: "Description of the advantage or service benefit provided.",
      color: "bg-blue-50 border-blue-100",
      iconBg: "bg-primary-100",
    };
    setSections((prev) => ({
      ...prev,
      why_choose: {
        ...prev.why_choose,
        items: [...(prev.why_choose?.items || []), newFeat],
      },
    }));
  };

  const handleUpdateFeature = (idx, field, value) => {
    setSections((prev) => {
      const items = [...(prev.why_choose?.items || [])];
      items[idx] = { ...items[idx], [field]: value };
      return {
        ...prev,
        why_choose: { ...prev.why_choose, items },
      };
    });
  };

  const handleDeleteFeature = (idx) => {
    setSections((prev) => ({
      ...prev,
      why_choose: {
        ...prev.why_choose,
        items: (prev.why_choose?.items || []).filter((_, i) => i !== idx),
      },
    }));
  };

  // ── Brand Helpers ──────────────────────────────────────────────────────────
  const handleAddBrand = () => {
    const newBrand = {
      id: Date.now(),
      name: "New Partner Brand",
      type: "Solar Kit Partner",
      description: "Certified component manufacturer integrated in complete SolarKits.",
    };
    setSections((prev) => ({
      ...prev,
      brands: {
        ...prev.brands,
        items: [...(prev.brands?.items || []), newBrand],
      },
    }));
  };

  const handleUpdateBrand = (idx, field, value) => {
    setSections((prev) => {
      const items = [...(prev.brands?.items || [])];
      items[idx] = { ...items[idx], [field]: value };
      return {
        ...prev,
        brands: { ...prev.brands, items },
      };
    });
  };

  const handleDeleteBrand = (idx) => {
    setSections((prev) => ({
      ...prev,
      brands: {
        ...prev.brands,
        items: (prev.brands?.items || []).filter((_, i) => i !== idx),
      },
    }));
  };

  // ── Testimonial Helpers ────────────────────────────────────────────────────
  const handleAddTestimonial = () => {
    const newTestimonial = {
      id: Date.now(),
      name: "Happy Customer",
      city: "Ahmedabad, Gujarat",
      role: "Homeowner",
      rating: 5,
      review: "SolarKits transformed our rooftop energy! Very professional installation and genuine subsidy approval.",
      system: "3kW On-Grid System",
      savings: "₹2,500/mo",
      initials: "HC",
    };
    setSections((prev) => ({
      ...prev,
      testimonials: {
        ...prev.testimonials,
        items: [...(prev.testimonials?.items || []), newTestimonial],
      },
    }));
  };

  const handleUpdateTestimonial = (idx, field, value) => {
    setSections((prev) => {
      const items = [...(prev.testimonials?.items || [])];
      items[idx] = { ...items[idx], [field]: value };
      return {
        ...prev,
        testimonials: { ...prev.testimonials, items },
      };
    });
  };

  const handleDeleteTestimonial = (idx) => {
    setSections((prev) => ({
      ...prev,
      testimonials: {
        ...prev.testimonials,
        items: (prev.testimonials?.items || []).filter((_, i) => i !== idx),
      },
    }));
  };

  if (loading) {
    return <Loader text="Loading Solar Store Landing Page configurations..." />;
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Banner */}
      <div className="bg-surface border border-border rounded-2xl p-6 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 flex items-center justify-center text-xl shrink-0 mt-1 shadow-sm">
            <FaStore size={24} />
          </div>
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h2 className="text-xl font-bold text-text-primary">Solar Store Landing Page CMS</h2>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live on Port 5179
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
                Full Dynamic Sync
              </span>
            </div>
            <p className="text-sm text-text-secondary mt-1">
              Customize the Solar Store Hero Carousels, Category Ribbons, Bestselling Products, Why Choose Us, Brand Partners, Customer Stories, and Footer Consultation desks.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={() => window.open("http://localhost:5179", "_blank")}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border bg-surface-hover text-text-primary text-sm font-semibold hover:border-primary/50 transition-all cursor-pointer"
          >
            <FiExternalLink />
            <span>Open Solar Store</span>
          </button>

          <button
            onClick={handleReset}
            disabled={saving}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-border text-text-secondary hover:text-red-500 hover:border-red-300 text-sm font-semibold transition-all cursor-pointer"
            title="Reset to factory defaults"
          >
            <FiRefreshCw className={saving ? "animate-spin" : ""} />
            <span>Reset</span>
          </button>

          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl gradient-primary text-white text-sm font-bold shadow-md shadow-primary/20 hover:opacity-95 transition-all cursor-pointer disabled:opacity-50"
          >
            <FiSave />
            <span>{saving ? "Saving..." : "Save All Changes"}</span>
          </button>
        </div>
      </div>

      {/* Alert message */}
      {alert && (
        <div
          className={`p-4 rounded-xl text-sm font-medium flex items-center gap-3 border ${
            alert.type === "success"
              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
              : "bg-red-50 text-red-800 border-red-200"
          }`}
        >
          {alert.type === "success" ? <FiCheckCircle size={18} /> : <FiAlertCircle size={18} />}
          <span>{alert.message}</span>
        </div>
      )}

      {/* Section Navigation Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
        {[
          { id: "hero", label: "1. Hero Slides", icon: <FiMonitor /> },
          { id: "categories", label: "2. Categories", icon: <FaBoxOpen /> },
          { id: "featured_products", label: "3. Bestselling Kits", icon: <FiShoppingCart /> },
          { id: "why_choose", label: "4. Why Us", icon: <FiAward /> },
          { id: "brands", label: "5. Brands", icon: <FaHandshake /> },
          { id: "testimonials", label: "6. Reviews", icon: <FaComments /> },
          { id: "footer", label: "7. Footer & Desk", icon: <FiPhone /> },
        ].map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 font-bold text-xs transition-all cursor-pointer ${
                isActive
                  ? "bg-primary text-white border-primary shadow-md shadow-primary/20"
                  : "bg-surface border-border text-text-secondary hover:text-text-primary hover:bg-surface-hover"
              }`}
            >
              <span className="text-base">{tab.icon}</span>
              <span className="truncate">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ── Tab 1: Hero Carousel & Stats ─────────────────────────────── */}
      {activeTab === "hero" && (
        <div className="bg-surface border border-border rounded-2xl p-6 shadow-sm space-y-6">
          <div className="border-b border-border pb-4 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-text-primary flex items-center gap-2">
                <FiMonitor className="text-primary" size={20} />
                <span>Store Hero Carousel Slides & Quick Stats</span>
              </h3>
              <p className="text-xs text-text-secondary mt-0.5">
                Manage promotional hero banners, sale announcements, trust badges, and floating statistics.
              </p>
            </div>
            <button
              type="button"
              onClick={handleAddSlide}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-primary text-white hover:opacity-95 font-bold text-xs shadow-sm transition-all cursor-pointer"
            >
              <FiPlus /> Add Hero Slide
            </button>
          </div>

          {/* Slides List */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-text-secondary uppercase tracking-wider">
              Hero Carousel Slides ({sections.hero?.slides?.length || 0})
            </h4>

            <div className="space-y-4">
              {(sections.hero?.slides || []).map((slide, sIdx) => (
                <div
                  key={slide.id || sIdx}
                  className="p-5 rounded-xl border border-border bg-surface-hover shadow-xs space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-primary bg-primary/10 px-2.5 py-1 rounded-lg">
                      Slide #{sIdx + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleDeleteSlide(sIdx)}
                      className="text-red-500 hover:text-red-700 p-1.5 rounded hover:bg-red-50 transition-colors"
                      title="Delete Slide"
                    >
                      <FiTrash2 size={16} />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-bold text-text-secondary block mb-1">
                        Slide Badge / Tag
                      </label>
                      <input
                        type="text"
                        value={slide.tag || ""}
                        onChange={(e) => handleUpdateSlide(sIdx, "tag", e.target.value)}
                        className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-xs font-bold text-text-primary"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-text-secondary block mb-1">
                        Gradient Theme
                      </label>
                      <input
                        type="text"
                        value={slide.bg || ""}
                        onChange={(e) => handleUpdateSlide(sIdx, "bg", e.target.value)}
                        placeholder="from-navy via-primary-700 to-primary-500"
                        className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-xs font-mono text-text-secondary"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="text-[10px] font-bold text-text-secondary block mb-1">
                        Main Headline (Use \n for new line)
                      </label>
                      <input
                        type="text"
                        value={slide.title || ""}
                        onChange={(e) => handleUpdateSlide(sIdx, "title", e.target.value)}
                        className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-sm font-extrabold text-text-primary"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="text-[10px] font-bold text-text-secondary block mb-1">
                        Slide Subtitle / Description
                      </label>
                      <textarea
                        rows={2}
                        value={slide.subtitle || ""}
                        onChange={(e) => handleUpdateSlide(sIdx, "subtitle", e.target.value)}
                        className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-xs text-text-secondary resize-none"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-text-secondary block mb-1">
                        Primary CTA Label
                      </label>
                      <input
                        type="text"
                        value={slide.cta1?.label || ""}
                        onChange={(e) =>
                          handleUpdateSlide(sIdx, "cta1", { ...slide.cta1, label: e.target.value })
                        }
                        className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-xs font-bold text-emerald-600"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-text-secondary block mb-1">
                        Secondary CTA Label
                      </label>
                      <input
                        type="text"
                        value={slide.cta2?.label || ""}
                        onChange={(e) =>
                          handleUpdateSlide(sIdx, "cta2", { ...slide.cta2, label: e.target.value })
                        }
                        className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-xs font-bold text-text-primary"
                      />
                    </div>
                  </div>
                </div>
              ))}

              <button
                type="button"
                onClick={handleAddSlide}
                className="w-full p-4 rounded-xl border-2 border-dashed border-primary/30 hover:border-primary bg-primary/5 hover:bg-primary/10 flex items-center justify-center gap-2 text-primary font-bold text-xs transition-all cursor-pointer"
              >
                <FiPlus size={16} />
                <span>+ Add Another Hero Slide</span>
              </button>
            </div>
          </div>

          {/* Floating Stats & Trust Badges */}
          <div className="p-5 rounded-xl border border-border bg-surface-hover space-y-4">
            <h4 className="text-xs font-bold text-text-secondary uppercase tracking-wider">
              Floating Stats & Trust Badges
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-bold text-text-secondary block mb-1">
                  Stat 1 (Value & Label)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={sections.hero?.stats?.[0]?.val || "10,000+"}
                    onChange={(e) => {
                      const stats = [...(sections.hero?.stats || [])];
                      stats[0] = { ...stats[0], val: e.target.value };
                      setSections((prev) => ({ ...prev, hero: { ...prev.hero, stats } }));
                    }}
                    className="w-1/3 px-3 py-2 bg-surface border border-border rounded-lg text-xs font-bold text-text-primary"
                  />
                  <input
                    type="text"
                    value={sections.hero?.stats?.[0]?.label || "Happy Customers"}
                    onChange={(e) => {
                      const stats = [...(sections.hero?.stats || [])];
                      stats[0] = { ...stats[0], label: e.target.value };
                      setSections((prev) => ({ ...prev, hero: { ...prev.hero, stats } }));
                    }}
                    className="w-2/3 px-3 py-2 bg-surface border border-border rounded-lg text-xs text-text-secondary"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-text-secondary block mb-1">
                  Stat 2 (Value & Label)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={sections.hero?.stats?.[1]?.val || "50 MW+"}
                    onChange={(e) => {
                      const stats = [...(sections.hero?.stats || [])];
                      stats[1] = { ...stats[1], val: e.target.value };
                      setSections((prev) => ({ ...prev, hero: { ...prev.hero, stats } }));
                    }}
                    className="w-1/3 px-3 py-2 bg-surface border border-border rounded-lg text-xs font-bold text-text-primary"
                  />
                  <input
                    type="text"
                    value={sections.hero?.stats?.[1]?.label || "Installed Capacity"}
                    onChange={(e) => {
                      const stats = [...(sections.hero?.stats || [])];
                      stats[1] = { ...stats[1], label: e.target.value };
                      setSections((prev) => ({ ...prev, hero: { ...prev.hero, stats } }));
                    }}
                    className="w-2/3 px-3 py-2 bg-surface border border-border rounded-lg text-xs text-text-secondary"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Tab 2: Categories ────────────────────────────────────────── */}
      {activeTab === "categories" && (
        <div className="bg-surface border border-border rounded-2xl p-6 shadow-sm space-y-6">
          <div className="border-b border-border pb-4 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-text-primary flex items-center gap-2">
                <FaBoxOpen className="text-primary" size={20} />
                <span>Product Categories Ribbons</span>
              </h3>
              <p className="text-xs text-text-secondary mt-0.5">
                Customize category cards, kit count counters, badges, and headline copy.
              </p>
            </div>
            <button
              type="button"
              onClick={handleAddCategory}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-primary text-white hover:opacity-95 font-bold text-xs shadow-sm transition-all cursor-pointer"
            >
              <FiPlus /> Add Category Card
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 rounded-xl bg-surface-hover border border-border">
            <div>
              <label className="text-[10px] font-bold text-text-secondary uppercase block mb-1">
                Badge Header
              </label>
              <input
                type="text"
                value={sections.categories?.badge_text || ""}
                onChange={(e) =>
                  setSections((prev) => ({
                    ...prev,
                    categories: { ...prev.categories, badge_text: e.target.value },
                  }))
                }
                className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-xs font-bold text-text-primary"
              />
            </div>

            <div>
              <label className="text-[10px] font-bold text-text-secondary uppercase block mb-1">
                Main Heading
              </label>
              <input
                type="text"
                value={sections.categories?.heading || ""}
                onChange={(e) =>
                  setSections((prev) => ({
                    ...prev,
                    categories: { ...prev.categories, heading: e.target.value },
                  }))
                }
                className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-xs font-bold text-text-primary"
              />
            </div>

            <div>
              <label className="text-[10px] font-bold text-text-secondary uppercase block mb-1">
                Highlighted Word(s)
              </label>
              <input
                type="text"
                value={sections.categories?.highlight_heading || ""}
                onChange={(e) =>
                  setSections((prev) => ({
                    ...prev,
                    categories: { ...prev.categories, highlight_heading: e.target.value },
                  }))
                }
                className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-xs font-bold text-primary"
              />
            </div>

            <div className="md:col-span-3">
              <label className="text-[10px] font-bold text-text-secondary uppercase block mb-1">
                Subtitle Description
              </label>
              <input
                type="text"
                value={sections.categories?.subtitle || ""}
                onChange={(e) =>
                  setSections((prev) => ({
                    ...prev,
                    categories: { ...prev.categories, subtitle: e.target.value },
                  }))
                }
                className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-xs text-text-secondary"
              />
            </div>
          </div>

          {/* Cards Grid */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-text-secondary uppercase tracking-wider">
                Category Cards ({sections.categories?.items?.length || 0})
              </h4>
              <button
                type="button"
                onClick={handleAddCategory}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-white font-bold text-xs shadow-sm cursor-pointer"
              >
                <FiPlus size={14} /> Add Category
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {(sections.categories?.items || []).map((cat, idx) => (
                <div
                  key={cat.id || idx}
                  className="p-4 rounded-xl border border-border bg-surface shadow-xs space-y-3 relative group"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-text-secondary bg-surface-hover px-2 py-0.5 rounded">
                      #{idx + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleDeleteCategory(idx)}
                      className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50 transition-colors"
                      title="Delete category"
                    >
                      <FiTrash2 size={14} />
                    </button>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-text-secondary block">
                      Category Name
                    </label>
                    <input
                      type="text"
                      value={cat.name}
                      onChange={(e) => handleUpdateCategory(idx, "name", e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-surface-hover border border-border rounded-lg text-xs font-bold text-text-primary"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] font-bold text-text-secondary block">
                        Count Label
                      </label>
                      <input
                        type="text"
                        value={cat.count}
                        onChange={(e) => handleUpdateCategory(idx, "count", e.target.value)}
                        placeholder="45+ Kits"
                        className="w-full px-2.5 py-1.5 bg-surface-hover border border-border rounded-lg text-xs font-bold text-primary"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-text-secondary block">
                        Badge Label
                      </label>
                      <input
                        type="text"
                        value={cat.label}
                        onChange={(e) => handleUpdateCategory(idx, "label", e.target.value)}
                        placeholder="On-Grid"
                        className="w-full px-2.5 py-1.5 bg-surface-hover border border-border rounded-lg text-xs text-text-secondary"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-text-secondary block">
                      Description
                    </label>
                    <textarea
                      rows={2}
                      value={cat.desc}
                      onChange={(e) => handleUpdateCategory(idx, "desc", e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-surface-hover border border-border rounded-lg text-xs text-text-secondary resize-none"
                    />
                  </div>
                </div>
              ))}

              <button
                type="button"
                onClick={handleAddCategory}
                className="p-6 rounded-xl border-2 border-dashed border-primary/40 hover:border-primary bg-primary/5 hover:bg-primary/10 flex flex-col items-center justify-center gap-2 text-primary font-bold text-xs transition-all cursor-pointer min-h-[200px]"
              >
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary text-lg">
                  <FiPlus size={20} />
                </div>
                <span className="font-bold text-sm">+ Add Category</span>
                <span className="text-[11px] text-text-secondary font-normal text-center">
                  Click to add another product category card
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Tab 3: Featured Products (Bestselling Solar Kits) ────────── */}
      {activeTab === "featured_products" && (
        <div className="bg-surface border border-border rounded-2xl p-6 shadow-sm space-y-6">
          <div className="border-b border-border pb-4 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-text-primary flex items-center gap-2">
                <FiShoppingCart className="text-primary" size={20} />
                <span>Bestselling Solar Combo Kits Showcase</span>
              </h3>
              <p className="text-xs text-text-secondary mt-0.5">
                Customize product cards, selling prices, MRPs, discount percentages, watt ratings, and badges.
              </p>
            </div>
            <button
              type="button"
              onClick={handleAddProduct}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-primary text-white hover:opacity-95 font-bold text-xs shadow-sm transition-all cursor-pointer"
            >
              <FiPlus /> Add Product Card
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 rounded-xl bg-surface-hover border border-border">
            <div>
              <label className="text-[10px] font-bold text-text-secondary uppercase block mb-1">
                Badge Header
              </label>
              <input
                type="text"
                value={sections.featured_products?.badge_text || "Most Popular"}
                onChange={(e) =>
                  setSections((prev) => ({
                    ...prev,
                    featured_products: { ...prev.featured_products, badge_text: e.target.value },
                  }))
                }
                className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-xs font-bold text-text-primary"
              />
            </div>

            <div>
              <label className="text-[10px] font-bold text-text-secondary uppercase block mb-1">
                Section Heading
              </label>
              <input
                type="text"
                value={sections.featured_products?.heading || "Bestselling Solar Kits"}
                onChange={(e) =>
                  setSections((prev) => ({
                    ...prev,
                    featured_products: { ...prev.featured_products, heading: e.target.value },
                  }))
                }
                className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-xs font-bold text-text-primary"
              />
            </div>

            <div>
              <label className="text-[10px] font-bold text-text-secondary uppercase block mb-1">
                View All CTA Label
              </label>
              <input
                type="text"
                value={sections.featured_products?.view_all_text || "View All Solar Kits"}
                onChange={(e) =>
                  setSections((prev) => ({
                    ...prev,
                    featured_products: { ...prev.featured_products, view_all_text: e.target.value },
                  }))
                }
                className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-xs font-bold text-primary"
              />
            </div>

            <div className="md:col-span-3">
              <label className="text-[10px] font-bold text-text-secondary uppercase block mb-1">
                Subtitle Description
              </label>
              <input
                type="text"
                value={sections.featured_products?.subtitle || ""}
                onChange={(e) =>
                  setSections((prev) => ({
                    ...prev,
                    featured_products: { ...prev.featured_products, subtitle: e.target.value },
                  }))
                }
                className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-xs text-text-secondary"
              />
            </div>
          </div>

          {/* Product Cards Grid */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-text-secondary uppercase tracking-wider">
                Showcase Products ({sections.featured_products?.items?.length || 0})
              </h4>
              <button
                type="button"
                onClick={handleAddProduct}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-white font-bold text-xs shadow-sm cursor-pointer"
              >
                <FiPlus size={14} /> Add Product
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {(sections.featured_products?.items || []).map((prod, idx) => (
                <div
                  key={prod.id || idx}
                  className="p-5 rounded-2xl border border-border bg-surface shadow-xs space-y-3.5 relative group"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-text-secondary bg-surface-hover px-2.5 py-1 rounded-lg">
                      Product #{idx + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleDeleteProduct(idx)}
                      className="text-red-500 hover:text-red-700 p-1.5 rounded-lg hover:bg-red-50 transition-colors"
                      title="Delete Product"
                    >
                      <FiTrash2 size={16} />
                    </button>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-text-secondary block mb-1">
                      Product Name
                    </label>
                    <input
                      type="text"
                      value={prod.name || ""}
                      onChange={(e) => handleUpdateProduct(idx, "name", e.target.value)}
                      className="w-full px-3 py-2 bg-surface-hover border border-border rounded-lg text-xs font-bold text-text-primary"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="text-[10px] font-bold text-text-secondary block mb-1">
                        Brand
                      </label>
                      <input
                        type="text"
                        value={prod.brand || ""}
                        onChange={(e) => handleUpdateProduct(idx, "brand", e.target.value)}
                        placeholder="SolarKits Prime"
                        className="w-full px-2.5 py-1.5 bg-surface-hover border border-border rounded-lg text-xs font-medium text-text-secondary"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-text-secondary block mb-1">
                        Category
                      </label>
                      <input
                        type="text"
                        value={prod.category || ""}
                        onChange={(e) => handleUpdateProduct(idx, "category", e.target.value)}
                        placeholder="On-Grid Solar Kit"
                        className="w-full px-2.5 py-1.5 bg-surface-hover border border-border rounded-lg text-xs font-medium text-text-secondary"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="text-[10px] font-bold text-text-secondary block mb-1">
                        Badge Tag
                      </label>
                      <input
                        type="text"
                        value={prod.badge || ""}
                        onChange={(e) => handleUpdateProduct(idx, "badge", e.target.value)}
                        placeholder="Subsidy Eligible"
                        className="w-full px-2.5 py-1.5 bg-surface-hover border border-border rounded-lg text-xs font-bold text-emerald-600"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-text-secondary block mb-1">
                        Capacity / Watt Badge
                      </label>
                      <input
                        type="text"
                        value={prod.watt || ""}
                        onChange={(e) => handleUpdateProduct(idx, "watt", e.target.value)}
                        placeholder="5kW Kit"
                        className="w-full px-2.5 py-1.5 bg-surface-hover border border-border rounded-lg text-xs font-bold text-primary"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 bg-surface-hover p-3 rounded-xl border border-border">
                    <div>
                      <label className="text-[10px] font-bold text-text-secondary block mb-1">
                        Price (₹)
                      </label>
                      <input
                        type="number"
                        value={prod.price || 0}
                        onChange={(e) => handleUpdateProduct(idx, "price", Number(e.target.value))}
                        className="w-full px-2 py-1.5 bg-surface border border-border rounded-lg text-xs font-black text-navy"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-text-secondary block mb-1">
                        MRP (₹)
                      </label>
                      <input
                        type="number"
                        value={prod.mrp || 0}
                        onChange={(e) => handleUpdateProduct(idx, "mrp", Number(e.target.value))}
                        className="w-full px-2 py-1.5 bg-surface border border-border rounded-lg text-xs text-text-secondary"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-text-secondary block mb-1">
                        Discount %
                      </label>
                      <input
                        type="number"
                        value={prod.discount || 0}
                        onChange={(e) => handleUpdateProduct(idx, "discount", Number(e.target.value))}
                        className="w-full px-2 py-1.5 bg-surface border border-border rounded-lg text-xs font-bold text-red-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="text-[10px] font-bold text-text-secondary block mb-1">
                        Star Rating
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        min="1"
                        max="5"
                        value={prod.rating || 4.8}
                        onChange={(e) => handleUpdateProduct(idx, "rating", Number(e.target.value))}
                        className="w-full px-2.5 py-1.5 bg-surface-hover border border-border rounded-lg text-xs font-bold text-amber-500"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-text-secondary block mb-1">
                        Review Count
                      </label>
                      <input
                        type="number"
                        value={prod.reviews || 100}
                        onChange={(e) => handleUpdateProduct(idx, "reviews", Number(e.target.value))}
                        className="w-full px-2.5 py-1.5 bg-surface-hover border border-border rounded-lg text-xs text-text-secondary"
                      />
                    </div>
                  </div>
                </div>
              ))}

              <button
                type="button"
                onClick={handleAddProduct}
                className="p-6 rounded-2xl border-2 border-dashed border-primary/40 hover:border-primary bg-primary/5 hover:bg-primary/10 flex flex-col items-center justify-center gap-2 text-primary font-bold text-xs transition-all cursor-pointer min-h-[220px]"
              >
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xl">
                  <FiPlus size={24} />
                </div>
                <span className="font-bold text-sm">+ Add Bestselling Product</span>
                <span className="text-[11px] text-text-secondary font-normal text-center">
                  Click to add another showcase solar kit
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Tab 4: Why Choose Us ─────────────────────────────────────── */}
      {activeTab === "why_choose" && (
        <div className="bg-surface border border-border rounded-2xl p-6 shadow-sm space-y-6">
          <div className="border-b border-border pb-4 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-text-primary flex items-center gap-2">
                <FiAward className="text-amber-500" size={20} />
                <span>Why Choose SolarKits (The Advantage)</span>
              </h3>
              <p className="text-xs text-text-secondary mt-0.5">
                Manage the 6 value pillars highlighting warranty, certifications, pan-India delivery, and EMI.
              </p>
            </div>
            <button
              type="button"
              onClick={handleAddFeature}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-primary text-white hover:opacity-95 font-bold text-xs shadow-sm transition-all cursor-pointer"
            >
              <FiPlus /> Add Advantage Card
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-xl bg-surface-hover border border-border">
            <div>
              <label className="text-[10px] font-bold text-text-secondary uppercase block mb-1">
                Main Heading
              </label>
              <input
                type="text"
                value={sections.why_choose?.heading || ""}
                onChange={(e) =>
                  setSections((prev) => ({
                    ...prev,
                    why_choose: { ...prev.why_choose, heading: e.target.value },
                  }))
                }
                className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-xs font-bold text-text-primary"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-text-secondary uppercase block mb-1">
                Subtitle Description
              </label>
              <input
                type="text"
                value={sections.why_choose?.subtitle || ""}
                onChange={(e) =>
                  setSections((prev) => ({
                    ...prev,
                    why_choose: { ...prev.why_choose, subtitle: e.target.value },
                  }))
                }
                className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-xs text-text-secondary"
              />
            </div>
          </div>

          {/* Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {(sections.why_choose?.items || []).map((feat, idx) => (
              <div
                key={idx}
                className="p-4 rounded-xl border border-border bg-surface shadow-xs space-y-3 relative group"
              >
                <div className="flex items-center justify-between">
                  <input
                    type="text"
                    value={feat.emoji}
                    onChange={(e) => handleUpdateFeature(idx, "emoji", e.target.value)}
                    className="w-10 text-center text-xl p-1 bg-surface-hover border border-border rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={() => handleDeleteFeature(idx)}
                    className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50 transition-colors"
                  >
                    <FiTrash2 size={14} />
                  </button>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-text-secondary block">
                    Feature Title
                  </label>
                  <input
                    type="text"
                    value={feat.title}
                    onChange={(e) => handleUpdateFeature(idx, "title", e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-surface-hover border border-border rounded-lg text-xs font-bold text-text-primary"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-text-secondary block">
                    Description
                  </label>
                  <textarea
                    rows={2}
                    value={feat.desc}
                    onChange={(e) => handleUpdateFeature(idx, "desc", e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-surface-hover border border-border rounded-lg text-xs text-text-secondary resize-none"
                  />
                </div>
              </div>
            ))}

            <button
              type="button"
              onClick={handleAddFeature}
              className="p-6 rounded-xl border-2 border-dashed border-primary/40 hover:border-primary bg-primary/5 hover:bg-primary/10 flex flex-col items-center justify-center gap-2 text-primary font-bold text-xs transition-all cursor-pointer min-h-[180px]"
            >
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary text-lg">
                <FiPlus size={20} />
              </div>
              <span className="font-bold text-sm">+ Add Advantage Card</span>
            </button>
          </div>
        </div>
      )}

      {/* ── Tab 5: Brand Partners ────────────────────────────────────── */}
      {activeTab === "brands" && (
        <div className="bg-surface border border-border rounded-2xl p-6 shadow-sm space-y-6">
          <div className="border-b border-border pb-4 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-text-primary flex items-center gap-2">
                <FaHandshake className="text-primary" size={20} />
                <span>Tier-1 Brand Partners Carousel</span>
              </h3>
              <p className="text-xs text-text-secondary mt-0.5">
                Manage partner manufacturers (Waaree, Adani, Tata, Vikram, Sungrow, Growatt, etc.).
              </p>
            </div>
            <button
              type="button"
              onClick={handleAddBrand}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-primary text-white hover:opacity-95 font-bold text-xs shadow-sm transition-all cursor-pointer"
            >
              <FiPlus /> Add Partner Brand
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-xl bg-surface-hover border border-border">
            <div>
              <label className="text-[10px] font-bold text-text-secondary uppercase block mb-1">
                Section Heading
              </label>
              <input
                type="text"
                value={sections.brands?.heading || ""}
                onChange={(e) =>
                  setSections((prev) => ({
                    ...prev,
                    brands: { ...prev.brands, heading: e.target.value },
                  }))
                }
                className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-xs font-bold text-text-primary"
              />
            </div>

            <div>
              <label className="text-[10px] font-bold text-text-secondary uppercase block mb-1">
                CTA Button Text
              </label>
              <input
                type="text"
                value={sections.brands?.cta_label || ""}
                onChange={(e) =>
                  setSections((prev) => ({
                    ...prev,
                    brands: { ...prev.brands, cta_label: e.target.value },
                  }))
                }
                className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-xs text-primary font-bold"
              />
            </div>
          </div>

          {/* Brands list */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {(sections.brands?.items || []).map((brand, idx) => (
              <div
                key={brand.id || idx}
                className="p-4 rounded-xl border border-border bg-surface shadow-xs space-y-3 relative group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-text-secondary bg-surface-hover px-2 py-0.5 rounded">
                    #{idx + 1}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleDeleteBrand(idx)}
                    className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50 transition-colors"
                  >
                    <FiTrash2 size={14} />
                  </button>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-text-secondary block">
                    Brand Name
                  </label>
                  <input
                    type="text"
                    value={brand.name}
                    onChange={(e) => handleUpdateBrand(idx, "name", e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-surface-hover border border-border rounded-lg text-xs font-bold text-text-primary"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-text-secondary block">
                    Short Description
                  </label>
                  <input
                    type="text"
                    value={brand.description}
                    onChange={(e) => handleUpdateBrand(idx, "description", e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-surface-hover border border-border rounded-lg text-xs text-text-secondary"
                  />
                </div>
              </div>
            ))}

            <button
              type="button"
              onClick={handleAddBrand}
              className="p-6 rounded-xl border-2 border-dashed border-primary/40 hover:border-primary bg-primary/5 hover:bg-primary/10 flex flex-col items-center justify-center gap-2 text-primary font-bold text-xs transition-all cursor-pointer min-h-[160px]"
            >
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary text-lg">
                <FiPlus size={20} />
              </div>
              <span className="font-bold text-sm">+ Add Brand Partner</span>
            </button>
          </div>
        </div>
      )}

      {/* ── Tab 6: Customer Stories & Ratings ───────────────────────── */}
      {activeTab === "testimonials" && (
        <div className="bg-surface border border-border rounded-2xl p-6 shadow-sm space-y-6">
          <div className="border-b border-border pb-4 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-text-primary flex items-center gap-2">
                <FaComments className="text-emerald-500" size={20} />
                <span>Customer Stories, Reviews & Platform Ratings</span>
              </h3>
              <p className="text-xs text-text-secondary mt-0.5">
                Manage customer feedback cards, star ratings, monthly savings proofs, and platform badges.
              </p>
            </div>
            <button
              type="button"
              onClick={handleAddTestimonial}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-primary text-white hover:opacity-95 font-bold text-xs shadow-sm transition-all cursor-pointer"
            >
              <FiPlus /> Add Review Story
            </button>
          </div>

          {/* Overall Rating Settings */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-xl bg-surface-hover border border-border">
            <div>
              <label className="text-[10px] font-bold text-text-secondary uppercase block mb-1">
                Overall Star Rating
              </label>
              <input
                type="text"
                value={sections.testimonials?.overall_rating || "4.8"}
                onChange={(e) =>
                  setSections((prev) => ({
                    ...prev,
                    testimonials: { ...prev.testimonials, overall_rating: e.target.value },
                  }))
                }
                className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-sm font-black text-text-primary"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-text-secondary uppercase block mb-1">
                Review Count Copy
              </label>
              <input
                type="text"
                value={sections.testimonials?.review_count || ""}
                onChange={(e) =>
                  setSections((prev) => ({
                    ...prev,
                    testimonials: { ...prev.testimonials, review_count: e.target.value },
                  }))
                }
                placeholder="Based on 2,400+ reviews"
                className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-xs text-text-secondary"
              />
            </div>
          </div>

          {/* Testimonial Cards */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-text-secondary uppercase tracking-wider">
                Customer Story Cards ({sections.testimonials?.items?.length || 0})
              </h4>
              <button
                type="button"
                onClick={handleAddTestimonial}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-white font-bold text-xs shadow-sm cursor-pointer"
              >
                <FiPlus size={14} /> Add Story
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {(sections.testimonials?.items || []).map((item, idx) => (
                <div
                  key={item.id || idx}
                  className="p-4 rounded-xl border border-border bg-surface shadow-xs space-y-3 relative group"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-text-secondary bg-surface-hover px-2 py-0.5 rounded">
                      #{idx + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleDeleteTestimonial(idx)}
                      className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50 transition-colors"
                    >
                      <FiTrash2 size={14} />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] font-bold text-text-secondary block">
                        Customer Name
                      </label>
                      <input
                        type="text"
                        value={item.name}
                        onChange={(e) => handleUpdateTestimonial(idx, "name", e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-surface-hover border border-border rounded-lg text-xs font-bold text-text-primary"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-text-secondary block">
                        City / State
                      </label>
                      <input
                        type="text"
                        value={item.city}
                        onChange={(e) => handleUpdateTestimonial(idx, "city", e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-surface-hover border border-border rounded-lg text-xs text-text-secondary"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] font-bold text-text-secondary block">
                        System Installed
                      </label>
                      <input
                        type="text"
                        value={item.system}
                        onChange={(e) => handleUpdateTestimonial(idx, "system", e.target.value)}
                        placeholder="3kW On-Grid System"
                        className="w-full px-2.5 py-1.5 bg-surface-hover border border-border rounded-lg text-xs text-primary font-bold"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-text-secondary block">
                        Monthly Savings
                      </label>
                      <input
                        type="text"
                        value={item.savings}
                        onChange={(e) => handleUpdateTestimonial(idx, "savings", e.target.value)}
                        placeholder="₹2,680/mo"
                        className="w-full px-2.5 py-1.5 bg-surface-hover border border-border rounded-lg text-xs text-emerald-600 font-bold"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-text-secondary block">
                      Review Quote
                    </label>
                    <textarea
                      rows={3}
                      value={item.review}
                      onChange={(e) => handleUpdateTestimonial(idx, "review", e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-surface-hover border border-border rounded-lg text-xs text-text-primary resize-none"
                    />
                  </div>
                </div>
              ))}

              <button
                type="button"
                onClick={handleAddTestimonial}
                className="p-6 rounded-xl border-2 border-dashed border-primary/40 hover:border-primary bg-primary/5 hover:bg-primary/10 flex flex-col items-center justify-center gap-2 text-primary font-bold text-xs transition-all cursor-pointer min-h-[220px]"
              >
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary text-lg">
                  <FiPlus size={22} />
                </div>
                <span className="font-bold text-sm">+ Add Review Story</span>
                <span className="text-[11px] text-text-secondary font-normal text-center">
                  Click to add another customer review card
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Tab 7: Store Footer & Consultation Box ──────────────────── */}
      {activeTab === "footer" && (
        <div className="bg-surface border border-border rounded-2xl p-6 shadow-sm space-y-6">
          <div className="border-b border-border pb-4">
            <h3 className="text-lg font-bold text-text-primary flex items-center gap-2">
              <FiPhone className="text-primary" size={20} />
              <span>Store Footer, Consultation Desk & WhatsApp</span>
            </h3>
            <p className="text-xs text-text-secondary mt-0.5">
              Configure the top quote CTA card, contact details, floating WhatsApp button, and copyright notice.
            </p>
          </div>

          {/* Consultation Box Card */}
          <div className="p-5 rounded-xl border border-border bg-surface-hover space-y-4">
            <h4 className="text-xs font-bold text-text-secondary uppercase tracking-wider">
              Top Free Solar Consultation Box
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-bold text-text-secondary block mb-1">
                  Box Headline
                </label>
                <input
                  type="text"
                  value={sections.footer?.consultation_box?.heading || ""}
                  onChange={(e) =>
                    setSections((prev) => ({
                      ...prev,
                      footer: {
                        ...prev.footer,
                        consultation_box: {
                          ...prev.footer?.consultation_box,
                          heading: e.target.value,
                        },
                      },
                    }))
                  }
                  className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-xs font-bold text-text-primary"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-text-secondary block mb-1">
                  Button Text
                </label>
                <input
                  type="text"
                  value={sections.footer?.consultation_box?.button_text || ""}
                  onChange={(e) =>
                    setSections((prev) => ({
                      ...prev,
                      footer: {
                        ...prev.footer,
                        consultation_box: {
                          ...prev.footer?.consultation_box,
                          button_text: e.target.value,
                        },
                      },
                    }))
                  }
                  className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-xs font-bold text-primary"
                />
              </div>

              <div className="md:col-span-2">
                <label className="text-[10px] font-bold text-text-secondary block mb-1">
                  Box Subtitle
                </label>
                <input
                  type="text"
                  value={sections.footer?.consultation_box?.subtitle || ""}
                  onChange={(e) =>
                    setSections((prev) => ({
                      ...prev,
                      footer: {
                        ...prev.footer,
                        consultation_box: {
                          ...prev.footer?.consultation_box,
                          subtitle: e.target.value,
                        },
                      },
                    }))
                  }
                  className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-xs text-text-secondary"
                />
              </div>
            </div>
          </div>

          {/* Contact Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-1.5 md:col-span-2">
              <label className="text-xs font-bold text-text-secondary uppercase tracking-wider">
                Store Company Description
              </label>
              <textarea
                rows={2}
                value={sections.footer?.description || ""}
                onChange={(e) =>
                  setSections((prev) => ({
                    ...prev,
                    footer: { ...prev.footer, description: e.target.value },
                  }))
                }
                className="w-full px-4 py-2.5 bg-surface-hover border border-border rounded-xl text-sm text-text-primary resize-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-text-secondary uppercase tracking-wider">
                Support Phone Number
              </label>
              <input
                type="text"
                value={sections.footer?.phone || ""}
                onChange={(e) =>
                  setSections((prev) => ({
                    ...prev,
                    footer: { ...prev.footer, phone: e.target.value },
                  }))
                }
                className="w-full px-4 py-2.5 bg-surface-hover border border-border rounded-xl text-sm text-text-primary"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-text-secondary uppercase tracking-wider">
                Support Email
              </label>
              <input
                type="text"
                value={sections.footer?.email || ""}
                onChange={(e) =>
                  setSections((prev) => ({
                    ...prev,
                    footer: { ...prev.footer, email: e.target.value },
                  }))
                }
                className="w-full px-4 py-2.5 bg-surface-hover border border-border rounded-xl text-sm text-text-primary"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-text-secondary uppercase tracking-wider">
                Floating WhatsApp Number
              </label>
              <input
                type="text"
                value={sections.footer?.floating_whatsapp?.number || ""}
                onChange={(e) =>
                  setSections((prev) => ({
                    ...prev,
                    footer: {
                      ...prev.footer,
                      floating_whatsapp: {
                        ...prev.footer?.floating_whatsapp,
                        number: e.target.value,
                      },
                    },
                  }))
                }
                placeholder="e.g. 919876543210"
                className="w-full px-4 py-2.5 bg-surface-hover border border-border rounded-xl text-sm font-mono text-emerald-600 font-bold"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-text-secondary uppercase tracking-wider">
                Office / Hub Location
              </label>
              <input
                type="text"
                value={sections.footer?.address || ""}
                onChange={(e) =>
                  setSections((prev) => ({
                    ...prev,
                    footer: { ...prev.footer, address: e.target.value },
                  }))
                }
                className="w-full px-4 py-2.5 bg-surface-hover border border-border rounded-xl text-sm text-text-primary"
              />
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <label className="text-xs font-bold text-text-secondary uppercase tracking-wider">
                Copyright Notice
              </label>
              <input
                type="text"
                value={sections.footer?.copyright_text || ""}
                onChange={(e) =>
                  setSections((prev) => ({
                    ...prev,
                    footer: { ...prev.footer, copyright_text: e.target.value },
                  }))
                }
                className="w-full px-4 py-2.5 bg-surface-hover border border-border rounded-xl text-xs text-text-secondary"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}