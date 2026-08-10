import axios from "axios";
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import PageHeader from "@/components/PageHeader";
import {
  FiCheckCircle,
  FiXCircle,
  FiSmartphone,
  FiMonitor,
  FiType,
  FiInfo,
  FiImage,
  FiRotateCcw,
  FiUploadCloud,
  FiSun,
  FiTag
} from "react-icons/fi";
import { HiSparkles } from "react-icons/hi";

const DEFAULT_CONFIG = {
  badge: "welcome to solarkits",
  title: "Powering a Sustainable Future with Smart Solar Solutions",
  subtitle: "Trusted Solar EPC Partner for Residential, Commercial & Industrial Projects",
  description:
    "SolarKits is committed to delivering reliable, efficient, and affordable solar energy solutions for homes, businesses, and industries. Our experienced team specializes in solar EPC services, rooftop solar installations, system design, engineering, procurement, installation, and long-term maintenance",
  primaryBtnText: "Request Demo",
  secondaryBtnText: "Contact Sales",
  imageUrl:
    "https://images.unsplash.com/photo-1509391366360-2e959784a276?q=80&w=1000&auto=format&fit=crop",
  enableSection: true,
};

const BASE_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

export default function HeroSectionConfig() {
  const [formData, setFormData] = useState(DEFAULT_CONFIG);
  const [previewMode, setPreviewMode] = useState("desktop"); // "desktop" | "mobile"
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      // API Call: GET /api/website/v1/hero-section/get - Fetch Hero Section configuration
      const response = await axios.get(
        `${BASE_URL}/api/website/v1/hero-section/get?t=${Date.now()}`
      );
      if (response.data?.data) {
        setFormData((prev) => ({ ...prev, ...response.data.data }));
      }
    } catch (error) {
      console.log("Using default hero section configuration:", error.message);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    setSavedSuccess(false);
  };

  const processImageFile = (file) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      alert("Please select a valid image file (PNG, JPG, WEBP).");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert("File size exceeds 5MB limit.");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData((prev) => ({ ...prev, imageUrl: reader.result }));
      setSavedSuccess(false);
    };
    reader.readAsDataURL(file);
  };

  const handleReset = () => {
    setFormData(DEFAULT_CONFIG);
    setSavedSuccess(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setSavedSuccess(false);

    try {
      // API Call: POST /api/website/v1/hero-section/save - Save Hero Section configuration
      const response = await axios.post(
        `${BASE_URL}/api/website/v1/hero-section/save`,
        formData
      );
      if (response.data?.success && response.data?.data) {
        setFormData((prev) => ({ ...prev, ...response.data.data }));
        setSavedSuccess(true);
        setTimeout(() => setSavedSuccess(false), 4000);
      }
    } catch (error) {
      console.error("Failed to save Hero Section configuration:", error);
      alert("Failed to save configuration: " + (error.response?.data?.message || error.message));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen pb-12">
      <PageHeader
        title="Website Configuration → Hero Section"
        subTitle="Manage and customize the main Hero Section displayed on the website landing page"
      />

      <AnimatePresence>
        {savedSuccess && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center justify-between shadow-sm"
          >
            <div className="flex items-center gap-3">
              <FiCheckCircle className="text-xl text-emerald-600 shrink-0" />
              <div>
                <p className="font-semibold text-sm">Hero Section configuration saved successfully!</p>
                <p className="text-xs text-emerald-700">Changes are now live on the website.</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setSavedSuccess(false)}
              className="text-xs font-semibold px-3 py-1 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 rounded-lg transition"
            >
              Dismiss
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid lg:grid-cols-12 gap-5 lg:gap-8 items-start">
        {/* Left Column: Form Settings (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="bg-card border border-border/60 rounded-2xl p-6 md:p-8 shadow-xl backdrop-blur-md">
              <div className="flex items-center justify-between pb-5 mb-6 border-b border-border/50">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-orange-500/10 text-orange-500">
                    <HiSparkles className="text-xl" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-text">Hero Section Settings</h2>
                    <p className="text-xs text-text/60">Customize title, subtitle, description, buttons and banner image</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, enableSection: !prev.enableSection }))}
                  className={`relative flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all duration-300 cursor-pointer select-none ${formData.enableSection ? "bg-primary border-primary" : "bg-bg/60 border-border/60"}`}
                >
                  <span className={`relative inline-block w-8 h-4 rounded-full transition-colors duration-300 ${formData.enableSection ? "bg-white/30" : "bg-border/60"}`}>
                    <span className={`absolute top-0.5 left-0.5 w-3 h-3 rounded-full bg-white shadow-sm transition-transform duration-300 ${formData.enableSection ? "translate-x-4" : "translate-x-0"}`} />
                  </span>
                  <span className={`text-xs font-bold transition-colors duration-300 ${formData.enableSection ? "text-white" : "text-text/50"}`}>
                    {formData.enableSection ? "Enabled" : "Disabled"}
                  </span>
                </button>
                </div>
              </div>

              <div className="space-y-5">
                {/* Badge Text */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-text/85 mb-1 flex items-center gap-1.5">
                    <FiTag className="text-orange-500" /> Top Badge / Tagline
                  </label>
                  <input
                    type="text"
                    name="badge"
                    value={formData.badge || ""}
                    onChange={handleChange}
                    placeholder="e.g. welcome to solarkits"
                    className="w-full bg-bg/50 border border-border/70 rounded-xl px-4 py-2.5 text-sm font-medium text-text focus:outline-none focus:ring-2 focus:ring-orange-500/40"
                  />
                </div>

                {/* Main Heading */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-text/85 mb-1 flex items-center gap-1.5">
                    <FiType className="text-orange-500" /> Main Heading (Title)
                  </label>
                  <textarea
                    rows={2}
                    name="title"
                    value={formData.title || ""}
                    onChange={handleChange}
                    placeholder="e.g. Powering a Sustainable Future with Smart Solar Solutions"
                    className="w-full bg-bg/50 border border-border/70 rounded-xl px-4 py-2.5 text-sm font-bold text-text focus:outline-none focus:ring-2 focus:ring-orange-500/40 resize-none"
                  />
                </div>

                {/* Subtitle */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-text/85 mb-1 flex items-center gap-1.5">
                    <FiInfo className="text-orange-500" /> Sub-Heading (Subtitle)
                  </label>
                  <input
                    type="text"
                    name="subtitle"
                    value={formData.subtitle || ""}
                    onChange={handleChange}
                    placeholder="e.g. Trusted Solar EPC Partner for Residential..."
                    className="w-full bg-bg/50 border border-border/70 rounded-xl px-4 py-2.5 text-sm font-semibold text-text focus:outline-none focus:ring-2 focus:ring-orange-500/40"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-text/85 mb-1 flex items-center gap-1.5">
                    <FiInfo className="text-orange-500" /> Description Paragraph
                  </label>
                  <textarea
                    rows={4}
                    name="description"
                    value={formData.description || ""}
                    onChange={handleChange}
                    placeholder="Write detailed paragraph..."
                    className="w-full bg-bg/50 border border-border/70 rounded-xl px-4 py-2.5 text-sm text-text focus:outline-none focus:ring-2 focus:ring-orange-500/40 resize-none"
                  />
                </div>

                {/* Buttons Config */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-text/85 mb-1">
                      Primary Button Text
                    </label>
                    <input
                      type="text"
                      name="primaryBtnText"
                      value={formData.primaryBtnText || ""}
                      onChange={handleChange}
                      placeholder="e.g. Request Demo"
                      className="w-full bg-bg/50 border border-border/70 rounded-xl px-4 py-2.5 text-sm font-semibold text-text focus:outline-none focus:ring-2 focus:ring-orange-500/40"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-text/85 mb-1">
                      Secondary Button Text
                    </label>
                    <input
                      type="text"
                      name="secondaryBtnText"
                      value={formData.secondaryBtnText || ""}
                      onChange={handleChange}
                      placeholder="e.g. Contact Sales"
                      className="w-full bg-bg/50 border border-border/70 rounded-xl px-4 py-2.5 text-sm font-semibold text-text focus:outline-none focus:ring-2 focus:ring-orange-500/40"
                    />
                  </div>
                </div>

                {/* Banner Image URL / Upload */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-text/85 mb-1 flex items-center gap-1.5">
                    <FiImage className="text-orange-500" /> Hero Section Image
                  </label>
                  <input
                    type="text"
                    name="imageUrl"
                    value={formData.imageUrl || ""}
                    onChange={handleChange}
                    placeholder="Image URL (e.g. https://...)"
                    className="w-full bg-bg/50 border border-border/70 rounded-xl px-4 py-2.5 text-sm text-text focus:outline-none focus:ring-2 focus:ring-orange-500/40 mb-3"
                  />
                  <div className="flex items-center gap-4">
                    <label className="cursor-pointer px-4 py-2.5 bg-bg/50 hover:bg-bg/80 border border-border/70 rounded-xl text-xs font-bold text-text flex items-center gap-2 transition">
                      <FiUploadCloud className="text-base" /> Upload Image File
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => processImageFile(e.target.files[0])}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-6 mt-6 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleReset}
                  className="px-4 py-2.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition flex items-center gap-1.5"
                >
                  <FiRotateCcw className="text-xs" /> Reset Default
                </button>

                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-6 py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold shadow-md transition disabled:opacity-50 cursor-pointer"
                >
                  {isSaving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* Right Column: Live Website Preview (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between bg-white p-3 rounded-2xl border border-slate-200 shadow-sm">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
              <HiSparkles className="w-4 h-4 text-amber-500" />
              <span>Live Website Preview</span>
            </span>

            <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-lg">
              <button
                type="button"
                onClick={() => setPreviewMode("desktop")}
                className={`p-1.5 rounded-md text-xs font-semibold flex items-center space-x-1 transition-all ${
                  previewMode === "desktop" ? "bg-white text-orange-600 shadow-sm" : "text-slate-500"
                }`}
              >
                <FiMonitor className="w-3.5 h-3.5" />
                <span>Desktop</span>
              </button>
              <button
                type="button"
                onClick={() => setPreviewMode("mobile")}
                className={`p-1.5 rounded-md text-xs font-semibold flex items-center space-x-1 transition-all ${
                  previewMode === "mobile" ? "bg-white text-orange-600 shadow-sm" : "text-slate-500"
                }`}
              >
                <FiSmartphone className="w-3.5 h-3.5" />
                <span>Mobile</span>
              </button>
            </div>
          </div>

          <div className="bg-slate-200/70 p-4 rounded-3xl border border-slate-300 flex justify-center overflow-hidden">
            <div
              className={`bg-gradient-to-br from-blue-50/40 via-white to-amber-50/40 rounded-2xl border border-slate-200 p-6 transition-all duration-300 shadow-inner overflow-y-auto ${
                previewMode === "mobile" ? "w-[340px]" : "w-full"
              }`}
              style={{ maxHeight: "680px" }}
            >
              {!formData.enableSection ? (
                <div className="p-8 text-center text-slate-400">
                  <FiXCircle className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                  <p className="text-xs font-bold uppercase tracking-wider">Section is Disabled</p>
                  <p className="text-[11px] mt-1">This section will not be visible on the website.</p>
                </div>
              ) : (
                <div className={`flex flex-col ${previewMode === "mobile" ? "gap-6" : "gap-8"} items-center text-left`}>
                  {/* Text Content */}
                  <div className="space-y-4 w-full">
                    {/* Badge */}
                    {formData.badge && (
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-orange-500 to-amber-500 text-white text-[11px] font-bold shadow-sm">
                        <FiSun className="w-3 h-3" />
                        <span>{formData.badge}</span>
                      </div>
                    )}

                    {/* Main Title */}
                    <h1 className="text-2xl lg:text-3xl font-extrabold text-slate-900 leading-tight">
                      {formData.title || "Powering a Sustainable Future"}
                    </h1>

                    {/* Subtitle */}
                    {formData.subtitle && (
                      <p className="text-sm font-bold text-blue-900 leading-snug">
                        {formData.subtitle}
                      </p>
                    )}

                    {/* Description */}
                    {formData.description && (
                      <p className="text-xs text-slate-600 leading-relaxed">
                        {formData.description}
                      </p>
                    )}

                    {/* Buttons */}
                    <div className="flex flex-wrap gap-2.5 pt-2">
                      {formData.primaryBtnText && (
                        <button className="px-5 py-2.5 rounded-xl bg-orange-500 text-white text-xs font-bold shadow-md">
                          {formData.primaryBtnText}
                        </button>
                      )}
                      {formData.secondaryBtnText && (
                        <button className="px-5 py-2.5 rounded-xl border border-orange-500 text-orange-600 text-xs font-bold bg-white">
                          {formData.secondaryBtnText}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Image Card */}
                  <div className="w-full rounded-2xl bg-white p-3 border border-slate-200/80 shadow-md">
                    <img
                      src={formData.imageUrl || "https://images.unsplash.com/photo-1509391366360-2e959784a276?q=80&w=1000&auto=format&fit=crop"}
                      alt="Hero Preview"
                      className="w-full h-44 object-cover rounded-xl"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
