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
  FiUploadCloud,
  FiImage,
} from "react-icons/fi";
import { FaStore, FaBoxOpen, FaHandshake, FaComments } from "react-icons/fa";
import {
  getWebsiteContent,
  updateWebsiteContent,
  resetWebsiteContent,
  uploadWebsiteImage,
} from "../../../../api/websiteContentApi";
import Loader from "../../../../components/Loader";

const DEFAULT_SOLAR_STORE_STATE = {
  hero: {
    enabled: true,
    bg_image: "",
    slides: [],
    trust_badges: [],
    stats: [],
  },
  categories: {
    enabled: true,
    badge_text: "",
    heading: "",
    highlight_heading: "",
    subtitle: "",
    items: [],
    quality_note_1: "",
    quality_note_2: "",
  },
  featured_products: {
    enabled: true,
    badge_text: "",
    heading: "",
    subtitle: "",
    view_all_text: "",
    view_all_href: "",
    items: [],
  },
  why_choose: {
    enabled: true,
    badge_text: "",
    heading: "",
    subtitle: "",
    items: [],
  },
  brands: {
    enabled: true,
    badge_text: "",
    heading: "",
    subtitle: "",
    cta_label: "",
    cta_href: "",
    items: [],
  },
  testimonials: {
    enabled: true,
    badge_text: "",
    heading: "",
    subtitle: "",
    overall_rating: "",
    review_count: "",
    platforms: [],
    items: [],
  },
  footer: {
    consultation_box: {
      badge: "",
      heading: "",
      subtitle: "",
      button_text: "",
    },
    description: "",
    phone: "",
    email: "",
    address: "",
    shop_links: [],
    help_links: [],
    policy_links: [],
    copyright_text: "",
    floating_whatsapp: {
      number: "",
      label: "",
    },
  },
};

export default function SolarStoreWebsite() {
  const [activeTab, setActiveTab] = useState("hero");
  const [sections, setSections] = useState(DEFAULT_SOLAR_STORE_STATE);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [alert, setAlert] = useState(null);
  const [uploadingSlideIdx, setUploadingSlideIdx] = useState(null);
  const [uploadingGlobalBg, setUploadingGlobalBg] = useState(false);

  const fetchContent = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getWebsiteContent("solar-store");
      if (res && res.data && res.data.sections) {
        setSections({
          ...DEFAULT_SOLAR_STORE_STATE,
          ...res.data.sections,
        });
      }
    } catch (err) {
      console.warn("Could not load from API, using clean default store data:", err);
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
        setSections(res.data?.sections || DEFAULT_SOLAR_STORE_STATE);
        setAlert({ type: "success", message: "Solar Store reset to factory defaults successfully!" });
      }
    } catch (err) {
      setAlert({ type: "error", message: "Failed to reset content." });
    } finally {
      setSaving(false);
      setTimeout(() => setAlert(null), 5000);
    }
  };

  // ── Slide Background Image Upload Handlers ─────────────────────────────────
  const handleSlideImageUpload = async (sIdx, e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setAlert({ type: "error", message: "File size exceeds 10MB limit." });
      return;
    }

    setUploadingSlideIdx(sIdx);
    try {
      const formData = new FormData();
      formData.append("image", file);

      const res = await uploadWebsiteImage(formData);
      if (res && res.status === "success" && res.data?.url) {
        handleUpdateSlide(sIdx, "image", res.data.url);
        setAlert({
          type: "success",
          message: `Slide #${sIdx + 1} background image uploaded! Remember to click "Save All Changes" to publish.`,
        });
      } else {
        throw new Error(res?.message || "Upload failed");
      }
    } catch (err) {
      console.error("Slide image upload failed:", err);
      setAlert({
        type: "error",
        message: "Image upload failed: " + (err.response?.data?.message || err.message),
      });
    } finally {
      setUploadingSlideIdx(null);
      e.target.value = "";
    }
  };

  const handleGlobalBgUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setAlert({ type: "error", message: "File size exceeds 10MB limit." });
      return;
    }

    setUploadingGlobalBg(true);
    try {
      const formData = new FormData();
      formData.append("image", file);

      const res = await uploadWebsiteImage(formData);
      if (res && res.status === "success" && res.data?.url) {
        setSections((prev) => ({
          ...prev,
          hero: {
            ...prev.hero,
            bg_image: res.data.url,
          },
        }));
        setAlert({
          type: "success",
          message: 'Global hero background image uploaded! Remember to click "Save All Changes" to publish.',
        });
      } else {
        throw new Error(res?.message || "Upload failed");
      }
    } catch (err) {
      console.error("Global background upload failed:", err);
      setAlert({
        type: "error",
        message: "Image upload failed: " + (err.response?.data?.message || err.message),
      });
    } finally {
      setUploadingGlobalBg(false);
      e.target.value = "";
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
      image: "",
      image_opacity: "30",
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

          {/* Global Fallback Hero Background Banner */}
          <div className="p-4 rounded-xl border border-dashed border-border bg-surface-hover/60 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h4 className="text-xs font-bold text-text-primary flex items-center gap-2">
                  <FiImage className="text-primary" size={15} />
                  <span>Default Hero Background (Global fallback for all slides)</span>
                </h4>
                <p className="text-[11px] text-text-secondary mt-0.5">
                  Applies automatically to any carousel slide that does not have an individual custom background image.
                </p>
              </div>
              {sections.hero?.bg_image && (
                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-500/10 px-2.5 py-1 rounded-md border border-emerald-500/20 shrink-0">
                  Global Image Configured
                </span>
              )}
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3">
              <input
                type="text"
                value={sections.hero?.bg_image || ""}
                onChange={(e) =>
                  setSections((prev) => ({
                    ...prev,
                    hero: { ...prev.hero, bg_image: e.target.value },
                  }))
                }
                placeholder="Global background image URL (e.g. https://... or Cloudinary link)"
                className="flex-1 px-3 py-2 bg-surface border border-border rounded-lg text-xs text-text-primary focus:border-primary outline-none"
              />

              <label
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-surface border border-border hover:border-primary text-text-primary text-xs font-bold cursor-pointer transition-all shadow-xs shrink-0 ${
                  uploadingGlobalBg ? "opacity-60 pointer-events-none" : ""
                }`}
              >
                <FiUploadCloud size={14} className={uploadingGlobalBg ? "animate-bounce text-primary" : "text-primary"} />
                <span>{uploadingGlobalBg ? "Uploading..." : "Upload Global Background"}</span>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/jpg"
                  className="hidden"
                  disabled={uploadingGlobalBg}
                  onChange={handleGlobalBgUpload}
                />
              </label>

              {sections.hero?.bg_image && (
                <button
                  type="button"
                  onClick={() =>
                    setSections((prev) => ({
                      ...prev,
                      hero: { ...prev.hero, bg_image: "" },
                    }))
                  }
                  className="p-2 rounded-lg border border-border text-red-500 hover:bg-red-50 hover:border-red-200 transition-all cursor-pointer"
                  title="Remove global fallback"
                >
                  <FiTrash2 size={14} />
                </button>
              )}
            </div>
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

                    {/* Slide Background Image Control */}
                    <div className="md:col-span-2 p-3.5 rounded-xl border border-border bg-surface space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-text-primary flex items-center gap-2">
                          <FiImage className="text-primary" size={16} />
                          <span>Slide Background Image</span>
                        </label>
                        {slide.image ? (
                          <span className="text-[10px] font-bold text-emerald-600 bg-emerald-500/10 px-2.5 py-0.5 rounded-md border border-emerald-500/20">
                            Custom Image Set
                          </span>
                        ) : (
                          <span className="text-[10px] font-medium text-text-secondary bg-surface-hover px-2 py-0.5 rounded-md border border-border">
                            Using Default Hero Image
                          </span>
                        )}
                      </div>

                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                        {/* Thumbnail Preview */}
                        <div className="relative w-32 h-20 rounded-lg overflow-hidden border border-border bg-slate-900 shrink-0 group shadow-xs">
                          {slide.image ? (
                            <img
                              src={slide.image}
                              alt="Slide Background Preview"
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.target.src = "https://placehold.co/600x400?text=Preview+Error";
                              }}
                            />
                          ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center text-text-secondary text-[10px] p-2 text-center bg-surface-hover">
                              <FiImage size={20} className="mb-1 opacity-40 text-primary" />
                              <span className="text-[9px] font-medium">Default Solar Villa</span>
                            </div>
                          )}
                          {slide.image && (
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <a
                                href={slide.image}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-white text-[10px] font-bold bg-black/70 px-2 py-1 rounded flex items-center gap-1 hover:bg-black"
                              >
                                <FiEye size={12} /> Preview
                              </a>
                            </div>
                          )}
                        </div>

                        {/* URL input and upload button */}
                        <div className="flex-1 w-full space-y-2">
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              value={slide.image || ""}
                              onChange={(e) => handleUpdateSlide(sIdx, "image", e.target.value)}
                              placeholder="Paste image URL (https://... or Cloudinary link) or click Upload"
                              className="flex-1 px-3 py-2 bg-surface border border-border rounded-lg text-xs text-text-primary focus:border-primary outline-none"
                            />

                            <label
                              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-primary text-white hover:opacity-95 text-xs font-bold cursor-pointer transition-all shadow-xs shrink-0 ${
                                uploadingSlideIdx === sIdx ? "opacity-60 pointer-events-none" : ""
                              }`}
                            >
                              <FiUploadCloud size={14} className={uploadingSlideIdx === sIdx ? "animate-bounce" : ""} />
                              <span>{uploadingSlideIdx === sIdx ? "Uploading..." : "Upload Image"}</span>
                              <input
                                type="file"
                                accept="image/png,image/jpeg,image/webp,image/jpg"
                                className="hidden"
                                disabled={uploadingSlideIdx === sIdx}
                                onChange={(e) => handleSlideImageUpload(sIdx, e)}
                              />
                            </label>

                            {slide.image && (
                              <button
                                type="button"
                                onClick={() => handleUpdateSlide(sIdx, "image", "")}
                                className="p-2 rounded-lg border border-border text-red-500 hover:bg-red-50 hover:border-red-200 transition-all cursor-pointer"
                                title="Remove custom image (reset to default)"
                              >
                                <FiTrash2 size={14} />
                              </button>
                            )}
                          </div>

                          <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-text-secondary">
                            <span>Recommended: 1920x800px or 16:9 banner (JPG, PNG, WEBP).</span>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-[10px]">Image Opacity:</span>
                              <select
                                value={slide.image_opacity || "30"}
                                onChange={(e) => handleUpdateSlide(sIdx, "image_opacity", e.target.value)}
                                className="bg-surface border border-border rounded px-2 py-1 text-xs text-text-primary font-semibold"
                              >
                                <option value="15">15% (Very Subtle)</option>
                                <option value="20">20%</option>
                                <option value="30">30% (Recommended)</option>
                                <option value="40">40%</option>
                                <option value="50">50% (Balanced)</option>
                                <option value="60">60%</option>
                                <option value="80">80% (Vibrant)</option>
                              </select>
                            </div>
                          </div>
                        </div>
                      </div>
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

          {/* Hero Quick Save Button */}
          <div className="pt-2 flex justify-end">
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl gradient-primary text-white text-xs font-bold shadow-md shadow-primary/20 hover:opacity-95 transition-all cursor-pointer disabled:opacity-50"
            >
              <FiSave size={14} />
              <span>{saving ? "Saving Changes..." : "Save Hero Carousel & Background"}</span>
            </button>
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