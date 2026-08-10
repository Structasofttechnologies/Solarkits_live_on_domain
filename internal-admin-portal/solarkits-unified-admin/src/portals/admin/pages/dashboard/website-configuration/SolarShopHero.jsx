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
  FiType,
  FiVideo,
} from "react-icons/fi";
import { Sun, Play, CheckCircle } from "lucide-react";

const DEFAULT_CONFIG = {
  welcomeTag: "Welcome to Solar Business Platform",
  heroTitle: "One Stop Shop For Solar Material Kit",
  heroSubtitle: "Made Solarkits",
  heroDescription: "Premium quality solar kits for residential and commercial use. Transform your solar business with our multi-branded solutions. Experience the future of solar energy management.",
  features: ["Free Delivery", "Multi-Brand Solar Kits", "Quick Delivery Time", "Free Service"],
  videoTitle: "How It Works",
  videoSubtitle: "Watch our platform demo",
  videoDuration: "2:30 min",
  videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
  enableSection: true,
};

const BASE_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

export default function SolarShopHero() {
  const [formData, setFormData] = useState(DEFAULT_CONFIG);
  const [previewMode, setPreviewMode] = useState("desktop"); // "desktop" | "mobile"
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSolarShopHero();
  }, []);

  const fetchSolarShopHero = async () => {
    setLoading(true);
    try {
      const response = await axios.get(
        `${BASE_URL}/api/website/v1/solar-shop/get?t=${Date.now()}`
      );
      if (response.data?.data) {
        const data = response.data.data;
        setFormData((prev) => {
          const merged = { ...prev };
          for (const key in data) {
            if (key === "features") continue;
            if (data[key] !== undefined && data[key] !== null && data[key] !== "") {
              merged[key] = data[key];
            }
          }
          if (Array.isArray(data.features) && data.features.length > 0) {
            merged.features = data.features;
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

  const handleFeatureChange = (index, value) => {
    const updatedFeatures = [...formData.features];
    updatedFeatures[index] = value;
    setFormData((prev) => ({
      ...prev,
      features: updatedFeatures
    }));
    setSavedSuccess(false);
  };

  const handleReset = () => {
    if (window.confirm("Are you sure you want to reset Hero fields to default values?")) {
      setFormData({
        ...formData,
        ...DEFAULT_CONFIG,
      });
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
        <p className="text-text/60 font-semibold text-sm">Loading Hero Configuration...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-12">
      <PageHeader
        title="Solar Shop - Hero & Video Section"
        description="Configure titles, subtitles, welcome badges, features checklist, and promotional video on the Solar Shop page"
      />

      <div className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Form panel */}
        <form onSubmit={handleSubmit} className="lg:col-span-7 bg-card border border-border/40 shadow-xl rounded-2xl p-6 space-y-6">
          
          <div className="border border-border/40 rounded-xl p-5 bg-bg/20 space-y-4">
            <div className="flex items-center justify-between border-b border-border/25 pb-3 mb-1">
              <h3 className="text-sm font-bold text-text flex items-center gap-2">
                <FiType className="text-primary" /> Hero Headings
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
            
            <div>
              <label className="text-xs font-semibold text-text/80 block mb-1.5 uppercase tracking-wider">Welcome Tag</label>
              <input
                type="text"
                name="welcomeTag"
                value={formData.welcomeTag}
                onChange={handleChange}
                required
                className="w-full bg-bg/50 border border-border/70 rounded-xl px-4 py-2.5 text-sm font-semibold text-text focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition"
                placeholder="e.g., Welcome to Solar Business Platform"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-text/80 block mb-1.5 uppercase tracking-wider">Hero Title</label>
              <input
                type="text"
                name="heroTitle"
                value={formData.heroTitle}
                onChange={handleChange}
                required
                className="w-full bg-bg/50 border border-border/70 rounded-xl px-4 py-2.5 text-sm font-semibold text-text focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition"
                placeholder="e.g., One Stop Shop For Solar Material Kit"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-text/80 block mb-1.5 uppercase tracking-wider">Hero Subtitle</label>
              <input
                type="text"
                name="heroSubtitle"
                value={formData.heroSubtitle}
                onChange={handleChange}
                required
                className="w-full bg-bg/50 border border-border/70 rounded-xl px-4 py-2.5 text-sm font-semibold text-text focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition"
                placeholder="e.g., Made Solarkits"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-text/80 block mb-1.5 uppercase tracking-wider">Hero Description</label>
              <textarea
                rows={4}
                name="heroDescription"
                value={formData.heroDescription}
                onChange={handleChange}
                required
                className="w-full bg-bg/50 border border-border/70 rounded-xl px-4 py-2.5 text-sm font-semibold text-text focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition resize-none"
                placeholder="Provide a detailed introduction..."
              />
            </div>
          </div>

          <div className="border border-border/40 rounded-xl p-5 bg-bg/20 space-y-4">
            <h3 className="text-sm font-bold text-text mb-2 flex items-center gap-2">
              <FiCheckCircle className="text-primary" /> Hero Feature Bullets (Max 4)
            </h3>
            <div className="grid sm:grid-cols-2 gap-4">
              {formData.features.map((feature, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <span className="text-xs font-bold text-primary shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    #{idx + 1}
                  </span>
                  <input
                    type="text"
                    value={feature}
                    onChange={(e) => handleFeatureChange(idx, e.target.value)}
                    required
                    className="w-full bg-bg/50 border border-border/70 rounded-xl px-4 py-2 text-sm font-semibold text-text focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition"
                    placeholder={`Feature #${idx + 1}`}
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="border border-border/40 rounded-xl p-5 bg-bg/20 space-y-4">
            <h3 className="text-sm font-bold text-text mb-2 flex items-center gap-2">
              <FiVideo className="text-primary" /> Promotional Video Details
            </h3>

            <div>
              <label className="text-xs font-semibold text-text/80 block mb-1.5 uppercase tracking-wider">Video Title</label>
              <input
                type="text"
                name="videoTitle"
                value={formData.videoTitle}
                onChange={handleChange}
                required
                className="w-full bg-bg/50 border border-border/70 rounded-xl px-4 py-2.5 text-sm font-semibold text-text focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-text/80 block mb-1.5 uppercase tracking-wider">Video Subtitle</label>
              <input
                type="text"
                name="videoSubtitle"
                value={formData.videoSubtitle}
                onChange={handleChange}
                required
                className="w-full bg-bg/50 border border-border/70 rounded-xl px-4 py-2.5 text-sm font-semibold text-text focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-text/80 block mb-1.5 uppercase tracking-wider">Video Duration</label>
                <input
                  type="text"
                  name="videoDuration"
                  value={formData.videoDuration}
                  onChange={handleChange}
                  required
                  className="w-full bg-bg/50 border border-border/70 rounded-xl px-4 py-2.5 text-sm font-semibold text-text focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition"
                  placeholder="e.g., 2:30 min"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-text/80 block mb-1.5 uppercase tracking-wider">Video URL (Embed Link)</label>
                <input
                  type="text"
                  name="videoUrl"
                  value={formData.videoUrl}
                  onChange={handleChange}
                  required
                  className="w-full bg-bg/50 border border-border/70 rounded-xl px-4 py-2.5 text-sm font-semibold text-text focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition"
                  placeholder="Embed URL for your marketing video..."
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
              <FiRotateCcw /> Reset Hero
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
                className={`bg-white text-gray-800 transition-all duration-300 overflow-hidden shadow-inner ${
                  previewMode === "mobile" ? "w-[340px] min-h-[500px]" : "w-full min-h-[380px]"
                }`}
                style={{ fontSize: previewMode === "mobile" ? "10px" : "12px" }}
              >
                <div className="p-6 bg-gradient-to-br from-blue-50/70 via-white to-orange-50/70 relative">
                  
                  <div className="inline-flex items-center gap-1 bg-gradient-to-r from-orange-500 to-red-500 px-3 py-1 rounded-full text-white text-[9px] font-extrabold uppercase mb-4">
                    <Sun className="w-3 h-3 animate-spin" />
                    <span>{formData.welcomeTag}</span>
                  </div>

                  <h1 className="text-lg font-black leading-tight text-gray-800 tracking-tight">
                    {formData.heroTitle}
                  </h1>

                  <h2 className="text-sm font-bold text-gray-600 mt-2">
                    Our <span className="text-blue-600 font-extrabold border-b-2 border-blue-600/30 pb-0.5">
                      {formData.heroSubtitle ? formData.heroSubtitle.replace(/^our\s+/i, "") : ""}
                    </span>
                  </h2>

                  <p className="text-xs text-gray-500 mt-3 leading-relaxed max-w-md">
                    {formData.heroDescription}
                  </p>

                  <div className="grid grid-cols-2 gap-2 mt-4 max-w-sm">
                    {formData.features.map((feat, i) => (
                      <div key={i} className="flex items-center gap-1.5 text-gray-600 font-bold text-[9px]">
                        <CheckCircle className="w-3.5 h-3.5 text-green-500" />
                        <span>{feat}</span>
                      </div>
                    ))}
                  </div>

                  <div className="mt-6 border border-white/20 rounded-2xl bg-gradient-to-br from-blue-600 to-purple-600 p-4 text-white relative shadow-lg h-44 flex flex-col justify-between overflow-hidden">
                    <div className="absolute inset-0 bg-white/5 pointer-events-none" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-12 h-12 rounded-full bg-white/20 border border-white/40 flex items-center justify-center text-white backdrop-blur">
                        <Play className="w-6 h-6 fill-white ml-0.5" />
                      </div>
                    </div>
                    <div className="mt-auto flex items-center justify-between bg-black/35 backdrop-blur-md rounded-xl p-2.5 border border-white/10">
                      <div className="text-left">
                        <h4 className="font-extrabold text-[9px] text-white">{formData.videoTitle}</h4>
                        <p className="text-[7px] text-gray-200">{formData.videoSubtitle}</p>
                      </div>
                      <span className="bg-white/20 px-2 py-0.5 rounded-full text-[8px] font-bold">{formData.videoDuration}</span>
                    </div>
                  </div>

                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

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
              <h4 className="font-bold text-sm">Hero Configurations Saved</h4>
              <p className="text-xs text-white/90">Solar Shop page updated successfully</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
