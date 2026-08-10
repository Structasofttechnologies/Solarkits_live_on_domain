import axios from "axios";
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import PageHeader from "@/components/PageHeader";
import {
  FiSave,
  FiRotateCcw,
  FiEye,
  FiCheckCircle,
  FiXCircle,
  FiSmartphone,
  FiMonitor,
  FiType,
  FiInfo,
  FiShield,
  FiImage,
  FiExternalLink,
  FiUploadCloud,
  FiLink,
  FiTrash2
} from "react-icons/fi";
import { HiOutlineInformationCircle, HiSparkles } from "react-icons/hi";

const DEFAULT_CONFIG = {
  title: "About Our Company",
  description:
    "We are committed to providing innovative solar energy solutions that power a sustainable future. With years of expertise in renewable energy, we help homes and businesses transition to clean, reliable solar power.",
  primaryBtnText: "Get Started",
  secondaryBtnText: "Learn More",
  imageUrl:
    "https://images.unsplash.com/photo-1509391365360-2e959784a276?q=80&w=1000&auto=format&fit=crop",
  status: true,
};

const BASE_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

function AboutUsConfig() {
  const [formData, setFormData] = useState(DEFAULT_CONFIG);
  const [previewMode, setPreviewMode] = useState("desktop"); // "desktop" | "mobile"
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    fetchAboutUs();
  }, []);

  const fetchAboutUs = async () => {
    try {
      // API Call: GET /api/website/v1/about-us/get - Fetch About Us configuration
      const response = await axios.get(
        `${BASE_URL}/api/website/v1/about-us/get?t=${Date.now()}`
      );
      if (response.data?.data) {
        setFormData(response.data.data);
      }
    } catch (error) {
      console.log("Using default configuration or API endpoint pending:", error.message);
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
      setFormData((prev) => ({
        ...prev,
        imageUrl: reader.result,
      }));
      setSavedSuccess(false);
    };
    reader.readAsDataURL(file);
  };

  const handleToggleStatus = () => {
    setFormData((prev) => ({ ...prev, status: !prev.status }));
    setSavedSuccess(false);
  };

  const handleReset = () => {
    setFormData(DEFAULT_CONFIG);
    setSavedSuccess(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setIsSaving(true);
      let response;
      if (formData._id && formData._id.length === 24) {
        // API Call: PATCH /api/website/v1/about-us/update/:id - Update About Us configuration
        response = await axios.patch(
          `${BASE_URL}/api/website/v1/about-us/update/${formData._id}`,
          formData
        );
      } else {
        // API Call: POST /api/website/v1/about-us/create - Create About Us configuration
        response = await axios.post(
          `${BASE_URL}/api/website/v1/about-us/create`,
          formData
        );
      }

      if (response.data?.data) {
        setFormData(response.data.data);
      }
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 4000);
    } catch (error) {
      console.error("Failed to save About Us configuration:", error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen pb-12">
      {/* Page Header */}
      <PageHeader
        title="About Us Configuration"
        subtitle="Manage and customize your website's About Our Company section."
        icon={HiOutlineInformationCircle}
        stats={[
          {
            label: "Status",
            value: formData.status ? "Active" : "Disabled",
            description: formData.status ? "Visible on live site" : "Hidden from site",
          },
          {
            label: "Title Length",
            value: `${formData.title ? formData.title.length : 0} chars`,
            description: "Main title count",
          },
          {
            label: "Description Length",
            value: `${formData.description ? formData.description.length : 0} chars`,
            description: "Description character count",
          },
        ]}
      />

      {/* Success Notification Alert */}
      <AnimatePresence>
        {savedSuccess && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mb-6 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-between shadow-lg backdrop-blur-md"
          >
            <div className="flex items-center gap-3">
              <FiCheckCircle className="text-xl shrink-0" />
              <div>
                <p className="font-semibold text-sm">About Us configuration saved successfully!</p>
                <p className="text-xs opacity-80">Your website About Us section has been updated.</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setSavedSuccess(false)}
              className="text-xs font-semibold px-3 py-1 bg-emerald-500/20 hover:bg-emerald-500/30 rounded-lg transition"
            >
              Dismiss
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid lg:grid-cols-12 gap-5 lg:gap-8 items-start">
        {/* Left Form (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="bg-card border border-border/60 rounded-2xl p-6 md:p-8 shadow-xl backdrop-blur-md relative overflow-hidden">
              <div className="flex items-center justify-between pb-5 mb-6 border-b border-border/50">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
                    <HiSparkles className="text-xl" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-text">About Us Content</h2>
                    <p className="text-xs text-text/60">Customize About Our Company text, buttons, and image</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, status: !prev.status }))}
                    className={`relative flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all duration-300 cursor-pointer select-none ${formData.status ? "bg-primary border-primary" : "bg-bg/60 border-border/60"}`}
                  >
                    <span className={`relative inline-block w-8 h-4 rounded-full transition-colors duration-300 ${formData.status ? "bg-white/30" : "bg-border/60"}`}>
                      <span className={`absolute top-0.5 left-0.5 w-3 h-3 rounded-full bg-white shadow-sm transition-transform duration-300 ${formData.status ? "translate-x-4" : "translate-x-0"}`} />
                    </span>
                    <span className={`text-xs font-bold transition-colors duration-300 ${formData.status ? "text-white" : "text-text/50"}`}>
                      {formData.status ? "Enabled" : "Disabled"}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={handleReset}
                    className="flex items-center gap-1.5 text-xs text-text/60 hover:text-primary transition font-medium px-3 py-1.5 rounded-lg border border-border/40 hover:bg-primary/5"
                    title="Reset to default content"
                  >
                    <FiRotateCcw className="text-xs" /> Reset
                  </button>
                </div>
              </div>

              <div className="space-y-5">
                {/* Main Title */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-semibold uppercase tracking-wider text-text/80 flex items-center gap-1.5">
                      <FiType className="text-primary text-sm" /> Section Title
                    </label>
                    <span className="text-[11px] text-text/40">{formData.title.length} / 80</span>
                  </div>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    maxLength={80}
                    placeholder="e.g. About Our Company"
                    className="w-full bg-bg/50 border border-border/70 rounded-xl px-4 py-3 text-sm font-semibold text-text focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition"
                  />
                </div>

                {/* Description */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-semibold uppercase tracking-wider text-text/80 flex items-center gap-1.5">
                      <FiInfo className="text-primary text-sm" /> Description
                    </label>
                    <span className="text-[11px] text-text/40">{formData.description.length} / 400</span>
                  </div>
                  <textarea
                    rows={4}
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    maxLength={400}
                    placeholder="Write company description..."
                    className="w-full bg-bg/50 border border-border/70 rounded-xl px-4 py-3 text-sm text-text leading-relaxed resize-none focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition"
                  />
                </div>

                {/* Buttons Grid */}
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-xs font-semibold uppercase tracking-wider text-text/80 flex items-center gap-1.5">
                        <FiExternalLink className="text-primary text-sm" /> Primary Button Label
                      </label>
                      <span className="text-[11px] text-text/40">{formData.primaryBtnText.length} / 30</span>
                    </div>
                    <input
                      type="text"
                      name="primaryBtnText"
                      value={formData.primaryBtnText}
                      onChange={handleChange}
                      maxLength={30}
                      placeholder="e.g. Get Started"
                      className="w-full bg-bg/50 border border-border/70 rounded-xl px-4 py-3 text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-xs font-semibold uppercase tracking-wider text-text/80 flex items-center gap-1.5">
                        <FiExternalLink className="text-primary text-sm" /> Secondary Button Label
                      </label>
                      <span className="text-[11px] text-text/40">{formData.secondaryBtnText.length} / 30</span>
                    </div>
                    <input
                      type="text"
                      name="secondaryBtnText"
                      value={formData.secondaryBtnText}
                      onChange={handleChange}
                      maxLength={30}
                      placeholder="e.g. Learn More"
                      className="w-full bg-bg/50 border border-border/70 rounded-xl px-4 py-3 text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition"
                    />
                  </div>
                </div>

                {/* Section Image: File Upload & URL Input */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-semibold uppercase tracking-wider text-text/80 flex items-center gap-1.5">
                      <FiImage className="text-primary text-sm" /> Section Image
                    </label>
                    <span className="text-[11px] text-text/40">Upload image or enter URL</span>
                  </div>

                  <div className="space-y-3">
                    {/* File Upload Box with Drag & Drop Event Handlers */}
                    <div
                      onDragOver={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setIsDragging(true);
                      }}
                      onDragLeave={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setIsDragging(false);
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setIsDragging(false);
                        const file = e.dataTransfer.files && e.dataTransfer.files[0];
                        if (file) processImageFile(file);
                      }}
                      className={`relative border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all duration-300 ${isDragging
                        ? "border-primary bg-primary/15 scale-[1.01] shadow-lg shadow-primary/20"
                        : "border-border/70 hover:border-primary/60 bg-bg/40 hover:bg-primary/5"
                        }`}
                    >
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files && e.target.files[0];
                          if (file) processImageFile(file);
                        }}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                      />
                      <div className="flex flex-col items-center gap-2 pointer-events-none">
                        <div
                          className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm transition-transform duration-300 ${isDragging ? "bg-primary text-white scale-110" : "bg-primary/10 text-primary"
                            }`}
                        >
                          <FiUploadCloud className="text-2xl" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-text">
                            {isDragging ? "Drop image here now!" : "Click to upload image"}{" "}
                            <span className="text-text/50 font-normal">{!isDragging && "or drag & drop"}</span>
                          </p>
                          <p className="text-[10px] text-text/40 mt-1">PNG, JPG, WEBP up to 5MB</p>
                        </div>
                      </div>
                    </div>

                    {/* URL Input Divider */}
                    <div className="flex items-center gap-2">
                      <div className="relative flex-1">
                        <FiLink className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text/40 text-xs" />
                        <input
                          type="url"
                          name="imageUrl"
                          value={formData.imageUrl}
                          onChange={handleChange}
                          placeholder="Or paste image URL (https://...)"
                          className="w-full bg-bg/50 border border-border/70 rounded-xl pl-9 pr-4 py-2.5 text-xs text-text focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition"
                        />
                      </div>
                      {formData.imageUrl && (
                        <button
                          type="button"
                          onClick={() => setFormData((prev) => ({ ...prev, imageUrl: "" }))}
                          className="p-2.5 text-rose-500 hover:bg-rose-500/10 rounded-xl border border-rose-500/20 text-xs transition"
                          title="Remove Image"
                        >
                          <FiTrash2 />
                        </button>
                      )}
                    </div>

                    {/* Image Thumbnail Preview Badge */}
                    {formData.imageUrl && (
                      <div className="flex items-center gap-3 p-2 bg-bg/60 border border-border/60 rounded-xl">
                        <img
                          src={formData.imageUrl}
                          alt="Uploaded Preview"
                          className="w-12 h-10 object-cover rounded-lg border border-border/40"
                          onError={(e) => {
                            e.target.style.display = "none";
                          }}
                        />
                        <div className="flex-1 truncate">
                          <p className="text-xs font-semibold text-text truncate">Image Selected</p>
                          <p className="text-[10px] text-text/50 truncate">Live preview updated on right</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Status Switch Card */}
                <div className="pt-2">
                  <div
                    onClick={handleToggleStatus}
                    className={`cursor-pointer border rounded-2xl p-4 md:p-5 flex items-center justify-between transition-all duration-300 ${formData.status
                      ? "bg-primary/5 border-primary/40 shadow-sm"
                      : "bg-bg/40 border-border/60 opacity-80"
                      }`}
                  >
                    <div className="flex items-center gap-3.5">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${formData.status ? "bg-primary text-white" : "bg-border/40 text-text/50"
                          }`}
                      >
                        <FiShield className="text-lg" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold text-sm text-text">About Us Section Visibility</h4>
                          <span
                            className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${formData.status
                              ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
                              : "bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30"
                              }`}
                          >
                            {formData.status ? "Enabled" : "Disabled"}
                          </span>
                        </div>
                        <p className="text-xs text-text/60 mt-0.5">
                          Toggle whether this section is displayed on the live website.
                        </p>
                      </div>
                    </div>

                    <div
                      className={`relative w-12 h-6 rounded-full transition-colors duration-300 ${formData.status ? "bg-primary" : "bg-border"
                        }`}
                    >
                      <div
                        className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform duration-300 ${formData.status ? "translate-x-6" : "translate-x-0"
                          }`}
                      />
                    </div>
                  </div>
                </div>

                {/* Save Button */}
                <div className="pt-4 flex items-center justify-end gap-3">
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="flex items-center justify-center gap-2 bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-700 text-white px-8 py-3.5 rounded-xl font-semibold text-sm shadow-lg shadow-primary/25 hover:shadow-primary/40 active:scale-[0.98] transition-all disabled:opacity-50"
                  >
                    {isSaving ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Saving Changes...
                      </>
                    ) : (
                      <>
                        <FiSave className="text-base" /> Save Configuration
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </form>
        </div>

        {/* Right Preview Card (5 cols) */}
        <div className="lg:col-span-5 lg:sticky lg:top-6">
          <div className="bg-card border border-border/60 rounded-2xl p-5 md:p-6 shadow-xl backdrop-blur-md">
            {/* Header & Controls */}
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-border/50">
              <div className="flex items-center gap-2">
                <FiEye className="text-primary text-lg" />
                <h3 className="text-base font-bold text-text">Live Preview</h3>
              </div>

              {/* Desktop / Mobile Switcher */}
              <div className="flex items-center bg-bg/80 border border-border/50 p-1 rounded-xl gap-1">
                <button
                  type="button"
                  onClick={() => setPreviewMode("desktop")}
                  className={`flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg transition ${previewMode === "desktop"
                    ? "bg-primary text-white shadow-sm"
                    : "text-text/60 hover:text-text"
                    }`}
                  title="Desktop View"
                >
                  <FiMonitor className="text-xs" /> Desktop
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewMode("mobile")}
                  className={`flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg transition ${previewMode === "mobile"
                    ? "bg-primary text-white shadow-sm"
                    : "text-text/60 hover:text-text"
                    }`}
                  title="Mobile View"
                >
                  <FiSmartphone className="text-xs" /> Mobile
                </button>
              </div>
            </div>

            {/* Mock Viewport Container */}
            <div
              className={`mx-auto transition-all duration-300 overflow-hidden ${previewMode === "mobile"
                ? "max-w-[320px] rounded-3xl border-4 border-slate-700 shadow-2xl"
                : "w-full rounded-2xl border border-border/60"
                }`}
            >
              {/* Browser/Device Top Bar */}
              <div className="bg-slate-900 px-4 py-2 flex items-center justify-between border-b border-slate-800">
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                </div>
                <span className="text-[10px] text-slate-400 font-mono tracking-tight truncate max-w-[180px]">
                  solarkits.com/about
                </span>
                <div className="flex items-center gap-1">
                  <span
                    className={`w-2 h-2 rounded-full ${formData.status ? "bg-emerald-400 animate-pulse" : "bg-rose-500"
                      }`}
                  />
                </div>
              </div>

              {/* Exact Mock Canvas matching the screenshot design */}
              <div
                className={`relative bg-gradient-to-br from-slate-50 to-blue-50/30 text-slate-900 p-6 md:p-8 overflow-hidden min-h-[340px] flex flex-col justify-center transition-opacity ${!formData.status ? "opacity-40 grayscale" : ""
                  }`}
              >
                {/* Content Layout */}
                <div
                  className={`grid gap-6 items-center ${previewMode === "desktop" ? "grid-cols-12" : "grid-cols-1"
                    }`}
                >
                  {/* Left Side: Title, Description, Buttons */}
                  <div className={previewMode === "desktop" ? "col-span-7 space-y-4" : "space-y-3"}>
                    <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight leading-tight">
                      {formData.title || "About Our Company"}
                    </h2>

                    {formData.description && (
                      <p className="text-slate-600 text-xs md:text-sm leading-relaxed">
                        {formData.description}
                      </p>
                    )}

                    <div className="pt-2 flex flex-wrap items-center gap-3">
                      {formData.primaryBtnText && (
                        <button
                          type="button"
                          disabled
                          className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-5 py-2.5 rounded-lg shadow-md shadow-blue-500/20 pointer-events-none transition"
                        >
                          {formData.primaryBtnText}
                        </button>
                      )}
                      {formData.secondaryBtnText && (
                        <button
                          type="button"
                          disabled
                          className="bg-white border border-blue-600 text-blue-600 text-xs font-semibold px-5 py-2.5 rounded-lg shadow-sm pointer-events-none transition"
                        >
                          {formData.secondaryBtnText}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Right Side: Rounded Featured Image */}
                  <div className={previewMode === "desktop" ? "col-span-5" : "w-full"}>
                    <div className="relative rounded-2xl overflow-hidden shadow-md border border-slate-200/80 bg-slate-200 aspect-[4/3] flex items-center justify-center">
                      {formData.imageUrl ? (
                        <img
                          src={formData.imageUrl}
                          alt="About Our Company"
                          className="w-full h-full object-cover rounded-2xl"
                          onError={(e) => {
                            e.target.style.display = "none";
                          }}
                        />
                      ) : (
                        <div className="p-6 text-center text-slate-400">
                          <FiImage className="mx-auto text-2xl mb-1" />
                          <span className="text-xs">No Image Provided</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Disabled Overlay Banner if Section Disabled */}
              {!formData.status && (
                <div className="bg-rose-500/10 border-t border-rose-500/30 p-3 text-center">
                  <span className="text-xs font-semibold text-rose-400 flex items-center justify-center gap-1.5">
                    <FiXCircle /> Section Disabled - Hidden on Website
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AboutUsConfig;
