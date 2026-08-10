import axios from "axios";
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import PageHeader from "@/components/PageHeader";
import {
  FiSave,
  FiRotateCcw,
  FiEye,
  FiCheckCircle,
  FiSmartphone,
  FiMonitor,
  FiLayers,
  FiImage,
  FiUploadCloud,
  FiLink,
  FiTrash2
} from "react-icons/fi";

const DEFAULT_CONFIG = {
  heroTitle: "Solar Installer Marketplace",
  heroDescription: "Connect with verified solar installers, compare quotes, and find the best deals for your solar projects. Our marketplace brings together top-rated installers and customers in one platform.",
  buttonText: "Sign Up / Login",
  buttonLink: "/login",
  imageUrl: "/logo.png",
  enableSection: true
};

const BASE_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

export default function SolarShopMarketplace() {
  const [formData, setFormData] = useState(DEFAULT_CONFIG);
  const [previewMode, setPreviewMode] = useState("desktop"); // "desktop" | "mobile"
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    fetchMarketplaceConfig();
  }, []);

  const fetchMarketplaceConfig = async () => {
    setLoading(true);
    try {
      const response = await axios.get(
        `${BASE_URL}/api/website/v1/marketplace/get?t=${Date.now()}`
      );
      if (response.data?.data) {
        const data = response.data.data;
        setFormData((prev) => {
          const merged = { ...prev };
          for (const key in DEFAULT_CONFIG) {
            if (data[key] !== undefined && data[key] !== null) {
              merged[key] = data[key];
            }
          }
          return merged;
        });
      }
    } catch (error) {
      console.log("Using default configuration or API endpoint pending:", error.message);
    } finally {
      setLoading(false);
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

  const handleReset = () => {
    if (window.confirm("Are you sure you want to reset Marketplace fields to default values?")) {
      setFormData(DEFAULT_CONFIG);
      setSavedSuccess(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setSavedSuccess(false);

    try {
      const now = new Date();
      const updatedTimeStr = `${now.getDate()} ${now.toLocaleString('default', { month: 'short' })} ${now.getFullYear()} ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
      
      const payload = {
        ...formData,
        lastUpdated: updatedTimeStr
      };

      await axios.patch(
        `${BASE_URL}/api/website/v1/marketplace/update`,
        payload
      );
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (error) {
      console.error("Save error:", error);
      alert("Failed to save configuration: " + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        <p className="text-text/60 font-semibold text-sm">Loading Marketplace Configuration...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-12">
      <PageHeader
        title="Solar Installer Marketplace"
        description="Configure titles, descriptions, buttons, redirect actions, and states of the Solar Installer Marketplace page"
      />

      <div className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Form panel */}
        <form onSubmit={handleSubmit} className="lg:col-span-7 bg-card border border-border/40 shadow-xl rounded-2xl p-6 space-y-6">
          
          <div className="border border-border/40 rounded-xl p-5 bg-bg/20 space-y-4">
            <div className="flex items-center justify-between border-b border-border/25 pb-3">
              <h3 className="text-sm font-bold text-text flex items-center gap-2">
                <FiLayers className="text-primary" /> Hero Contents Configuration
              </h3>
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
            
            {/* Title */}
            <div>
              <label className="text-xs font-semibold text-text/80 block mb-1.5 uppercase tracking-wider">Hero Title</label>
              <input
                type="text"
                name="heroTitle"
                value={formData.heroTitle}
                onChange={handleChange}
                required
                className="w-full bg-bg/50 border border-border/70 rounded-xl px-4 py-2.5 text-sm font-semibold text-text focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition"
              />
            </div>

            {/* Description */}
            <div>
              <label className="text-xs font-semibold text-text/80 block mb-1.5 uppercase tracking-wider">Hero Description / Subtitle</label>
              <textarea
                rows={4}
                name="heroDescription"
                value={formData.heroDescription}
                onChange={handleChange}
                required
                className="w-full bg-bg/50 border border-border/70 rounded-xl px-4 py-2.5 text-sm font-semibold text-text focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition resize-none"
              />
            </div>

            {/* Button Settings */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-text/80 block mb-1.5 uppercase tracking-wider">Button Text</label>
                <input
                  type="text"
                  name="buttonText"
                  value={formData.buttonText}
                  onChange={handleChange}
                  required
                  className="w-full bg-bg/50 border border-border/70 rounded-xl px-4 py-2.5 text-sm font-semibold text-text focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-text/80 block mb-1.5 uppercase tracking-wider">Button Redirect Link</label>
                <input
                  type="text"
                  name="buttonLink"
                  value={formData.buttonLink}
                  onChange={handleChange}
                  required
                  className="w-full bg-bg/50 border border-border/70 rounded-xl px-4 py-2.5 text-sm font-semibold text-text focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition"
                />
              </div>
            </div>

            {/* Image Selection - Drag & Drop / URL */}
            <div className="pt-2">
              <label className="text-xs font-semibold text-text/80 block mb-2 uppercase tracking-wider">Marketplace Hero Image / Logo</label>
              
              <div className="space-y-3">
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
                  className={`relative border-2 border-dashed rounded-2xl p-5 text-center cursor-pointer transition-all duration-300 ${isDragging
                    ? "border-primary bg-primary/15 scale-[1.01]"
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
                  <div className="flex flex-col items-center gap-1.5 pointer-events-none">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-primary/10 text-primary">
                      <FiUploadCloud className="text-xl" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-text">
                        {isDragging ? "Drop image here now!" : "Click to upload image"}{" "}
                        <span className="text-text/50 font-normal">{!isDragging && "or drag & drop"}</span>
                      </p>
                      <p className="text-[9px] text-text/40 mt-0.5">PNG, JPG, WEBP up to 5MB</p>
                    </div>
                  </div>
                </div>

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
                  {formData.imageUrl && formData.imageUrl !== "/logo.png" && (
                    <button
                      type="button"
                      onClick={() => setFormData((prev) => ({ ...prev, imageUrl: "/logo.png" }))}
                      className="p-2.5 text-rose-500 hover:bg-rose-500/10 rounded-xl border border-rose-500/20 text-xs transition cursor-pointer"
                      title="Reset Image"
                    >
                      <FiTrash2 />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-between items-center pt-4 border-t border-border/20">
            <button
              type="button"
              onClick={handleReset}
              className="px-5 py-2.5 rounded-xl border border-border/70 text-text/80 hover:bg-bg/40 font-bold text-sm transition flex items-center gap-2 cursor-pointer"
            >
              <FiRotateCcw /> Reset Form
            </button>
            
            <button
              type="submit"
              disabled={isSaving}
              className="px-6 py-2.5 rounded-xl bg-primary hover:bg-primary-dark text-white font-bold text-sm shadow-lg shadow-primary/20 hover:shadow-primary/30 transition flex items-center gap-2 disabled:opacity-55 cursor-pointer"
            >
              <FiSave /> {isSaving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>

        {/* Live Mockup Preview Panel */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-card border border-border/40 rounded-2xl p-5 shadow-xl sticky top-6">
            <div className="flex items-center justify-between border-b border-border/25 pb-4 mb-6">
              <h3 className="text-sm font-bold text-text flex items-center gap-2">
                <FiEye className="text-primary" /> Live Mockup Preview
              </h3>
              <div className="flex items-center bg-bg/50 border border-border/50 rounded-lg p-0.5">
                <button
                  onClick={() => setPreviewMode("desktop")}
                  className={`p-1.5 rounded-md transition ${
                    previewMode === "desktop" ? "bg-card text-primary shadow" : "text-text/60"
                  }`}
                  title="Desktop View"
                >
                  <FiMonitor className="text-sm" />
                </button>
                <button
                  onClick={() => setPreviewMode("mobile")}
                  className={`p-1.5 rounded-md transition ${
                    previewMode === "mobile" ? "bg-card text-primary shadow" : "text-text/60"
                  }`}
                  title="Mobile View"
                >
                  <FiSmartphone className="text-sm" />
                </button>
              </div>
            </div>

            <div className="flex justify-center bg-bg/35 border border-border/30 rounded-xl p-4 overflow-hidden">
              <div
                className={`bg-gradient-to-br from-blue-50 via-white to-orange-50 text-gray-800 transition-all duration-300 overflow-hidden shadow-inner ${
                  previewMode === "mobile" ? "w-[340px] min-h-[350px] p-6" : "w-full min-h-[255px] p-8"
                }`}
                style={{ fontSize: previewMode === "mobile" ? "10px" : "12px" }}
              >
                <div className={`flex items-center gap-6 ${previewMode === "mobile" ? "flex-col" : "flex-row"}`}>
                  <div className="flex-1 text-left space-y-4">
                    <h1 className="text-base font-extrabold text-gray-800 leading-tight">
                      {formData.heroTitle}
                    </h1>
                    <p className="text-[9px] text-gray-500 leading-relaxed">
                      {formData.heroDescription}
                    </p>
                    <div>
                      <span className="inline-block rounded-lg bg-orange text-white font-bold text-[10px] px-5 py-2.5 shadow-md shadow-orange/30 cursor-pointer">
                        {formData.buttonText}
                      </span>
                    </div>
                  </div>

                  <div className={`w-full max-w-[150px] ${previewMode === "mobile" ? "mt-4" : ""}`}>
                    <div className="border border-orange-100 bg-orange-50/40 p-4 rounded-xl flex flex-col items-center justify-center shadow-md min-h-[120px]">
                      {formData.imageUrl && formData.imageUrl !== "/logo.png" ? (
                        <img src={formData.imageUrl} className="max-h-[100px] w-auto object-contain rounded-lg" alt="Custom Logo" />
                      ) : (
                        <>
                          <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center mb-2">
                            <FiImage className="text-amber-500" />
                          </div>
                          <span className="text-[10px] font-black text-gray-800 tracking-tight">EmergeSun</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Save Success Alert Portal */}
      <AnimatePresence>
        {savedSuccess && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="fixed bottom-6 right-6 z-55 flex items-center gap-3 bg-green-550 text-white px-5 py-3.5 rounded-xl shadow-2xl border border-white/10"
          >
            <FiCheckCircle className="text-xl" />
            <div>
              <h4 className="font-bold text-sm">Marketplace Saved</h4>
              <p className="text-xs text-white/90">Marketplace hero updated successfully</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
