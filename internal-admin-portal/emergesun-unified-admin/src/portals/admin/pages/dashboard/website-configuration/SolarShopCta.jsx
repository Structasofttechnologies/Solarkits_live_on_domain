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
  FiX,
  FiInfo
} from "react-icons/fi";

const DEFAULT_CONFIG = {
  ctaTitle: "Ready to Power Your Solar Business?",
  ctaDescription: "Join EmergeSun today and gain complete control over your project lifecycle, supplier contracts, and sales dashboards.",
  ctaButtonText: "Get Started Now",
  ctaButtonLink: "/login",
  enableSection: true,
};

const BASE_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

export default function SolarShopCta() {
  const [formData, setFormData] = useState(DEFAULT_CONFIG);
  const [previewMode, setPreviewMode] = useState("desktop"); // "desktop" | "mobile"
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSolarShopCta();
  }, []);

  const fetchSolarShopCta = async () => {
    setLoading(true);
    try {
      const response = await axios.get(
        `${BASE_URL}/api/website/v1/solar-shop/get?t=${Date.now()}`
      );
      if (response.data?.data) {
        const data = response.data.data;
        setFormData((prev) => {
          const merged = { ...prev };
          for (const key in DEFAULT_CONFIG) {
            if (data[key] !== undefined && data[key] !== null && data[key] !== "") {
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
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setSavedSuccess(false);
  };

  const handleReset = () => {
    if (window.confirm("Are you sure you want to reset CTA fields to default values?")) {
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
        `${BASE_URL}/api/website/v1/solar-shop/update`,
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
        <p className="text-text/60 font-semibold text-sm">Loading CTA Configuration...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-12">
      <PageHeader
        title="Solar Shop - Call To Action"
        description="Configure titles, descriptions, button texts, and redirect links for the landing CTA banner"
      />

      <div className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Form panel */}
        <form onSubmit={handleSubmit} className="lg:col-span-7 bg-card border border-border/40 shadow-xl rounded-2xl p-6 space-y-6">
          
          <div className="border border-border/40 rounded-xl p-5 bg-bg/20 space-y-4">
            <div className="flex items-center justify-between border-b border-border/25 pb-3 mb-1">
              <h3 className="text-sm font-bold text-text flex items-center gap-2">
                <FiLayers className="text-primary" /> Call To Action Contents
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
              <label className="text-xs font-semibold text-text/80 block mb-1.5 uppercase tracking-wider">CTA Title</label>
              <input
                type="text"
                name="ctaTitle"
                value={formData.ctaTitle}
                onChange={handleChange}
                required
                className="w-full bg-bg/50 border border-border/70 rounded-xl px-4 py-2.5 text-sm font-semibold text-text focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition"
              />
            </div>

            {/* Description */}
            <div>
              <label className="text-xs font-semibold text-text/80 block mb-1.5 uppercase tracking-wider">CTA Description</label>
              <textarea
                rows={4}
                name="ctaDescription"
                value={formData.ctaDescription}
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
                  name="ctaButtonText"
                  value={formData.ctaButtonText}
                  onChange={handleChange}
                  required
                  className="w-full bg-bg/50 border border-border/70 rounded-xl px-4 py-2.5 text-sm font-semibold text-text focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-text/80 block mb-1.5 uppercase tracking-wider">Button Redirect Link</label>
                <input
                  type="text"
                  name="ctaButtonLink"
                  value={formData.ctaButtonLink}
                  onChange={handleChange}
                  required
                  className="w-full bg-bg/50 border border-border/70 rounded-xl px-4 py-2.5 text-sm font-semibold text-text focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-between items-center pt-4 border-t border-border/20">
            <button
              type="button"
              onClick={handleReset}
              className="px-5 py-2.5 rounded-xl border border-border/70 text-text/80 hover:bg-bg/40 font-bold text-sm transition flex items-center gap-2 cursor-pointer"
            >
              <FiRotateCcw /> Reset Banner
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
                className={`bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-800 text-white transition-all duration-300 overflow-hidden shadow-inner flex items-center justify-center ${
                  previewMode === "mobile" ? "w-[340px] min-h-[220px] p-6" : "w-full min-h-[200px] p-10"
                }`}
                style={{ fontSize: previewMode === "mobile" ? "10px" : "12px" }}
              >
                <div className="text-center space-y-4">
                  <h2 className="text-base font-extrabold tracking-tight leading-tight">
                    {formData.ctaTitle}
                  </h2>

                  <p className="text-[10px] text-white/80 max-w-sm mx-auto leading-relaxed">
                    {formData.ctaDescription}
                  </p>

                  <div className="pt-2">
                    <span className="inline-block rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs px-6 py-2.5 shadow-md shadow-orange/20 cursor-pointer">
                      {formData.ctaButtonText}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
