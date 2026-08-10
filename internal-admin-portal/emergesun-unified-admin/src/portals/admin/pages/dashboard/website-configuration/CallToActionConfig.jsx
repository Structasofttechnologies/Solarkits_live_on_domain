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
  FiLink,
} from "react-icons/fi";
import { HiSparkles } from "react-icons/hi";
import { FaPhoneAlt } from "react-icons/fa";

const DEFAULT_CONFIG = {
  title: "Ready to Transform Your Business?",
  subtitle: "Join hundreds of businesses that have streamlined their operations with our ERP system",
  primaryButtonText: "Get Started Free",
  primaryButtonLink: "/login",
  secondaryButtonText: "Schedule Demo",
  secondaryButtonLink: "/demo",
  loginText: "Already have an account? Sign In",
  loginLink: "/login",
  status: true,
};

const BASE_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

export default function CallToActionConfig() {
  const [formData, setFormData] = useState(DEFAULT_CONFIG);
  const [previewMode, setPreviewMode] = useState("desktop"); // "desktop" | "mobile"
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCTA();
  }, []);

  const fetchCTA = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${BASE_URL}/api/website/v1/call-to-action/get?t=${Date.now()}`);
      if (response.data?.data && response.data.data.length > 0) {
        setFormData(response.data.data[0]); // Get the latest CTA configuration
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

  const handleReset = () => {
    if (window.confirm("Are you sure you want to reset all fields to default values?")) {
      setFormData({
        ...DEFAULT_CONFIG,
        _id: formData._id, // retain ID if it exists
      });
      setSavedSuccess(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setSavedSuccess(false);

    try {
      let response;
      if (formData._id) {
        response = await axios.put(
          `${BASE_URL}/api/website/v1/call-to-action/update/${formData._id}`,
          formData
        );
      } else {
        response = await axios.post(
          `${BASE_URL}/api/website/v1/call-to-action/create`,
          formData
        );
      }

      if (response.data?.data) {
        setFormData(response.data.data);
      }
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 4000);
    } catch (error) {
      console.error("Failed to save Call To Action configuration:", error);
      alert("Failed to save configuration. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-32 flex-col gap-3 min-h-screen">
        <div className="h-10 w-10 rounded-full border-4 border-slate-200 border-t-primary animate-spin"></div>
        <span className="text-sm text-text/60 font-semibold">Loading CTA Configuration...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-12">
      {/* Page Header */}
      <PageHeader
        title="Call To Action Configuration"
        subtitle="Manage and customize the 'Ready to Transform Your Business' CTA section on the website."
        icon={HiSparkles}
        stats={[
          {
            label: "Visibility Status",
            value: formData.status ? "Active" : "Disabled",
            description: formData.status ? "Visible on live site" : "Hidden from site",
          },
          {
            label: "Primary Button Text",
            value: formData.primaryButtonText || "Get Started Free",
            description: "Main CTA action text",
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
                <p className="font-semibold text-sm">Call To Action configuration saved successfully!</p>
                <p className="text-xs opacity-80">Your website CTA section has been updated live.</p>
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
            {/* Content Details Card */}
            <div className="bg-card border border-border/60 rounded-2xl p-6 md:p-8 shadow-xl backdrop-blur-md relative overflow-hidden">
              <div className="flex items-center justify-between pb-5 mb-6 border-b border-border/50">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
                    <HiSparkles className="text-xl" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-text">CTA Section Content</h2>
                    <p className="text-xs text-text/60">Customize title, subtitle and redirect links</p>
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
                {/* Title */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-semibold uppercase tracking-wider text-text/80 flex items-center gap-1.5">
                      <FiType className="text-primary text-sm" /> Title Text
                    </label>
                  </div>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    required
                    placeholder="e.g. Ready to Transform Your Business?"
                    className="w-full bg-bg/50 border border-border/70 rounded-xl px-4 py-3 text-sm font-semibold text-text focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition"
                  />
                </div>

                {/* Subtitle */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-semibold uppercase tracking-wider text-text/80 flex items-center gap-1.5">
                      <FiInfo className="text-primary text-sm" /> Subtitle Text
                    </label>
                  </div>
                  <textarea
                    rows={3}
                    name="subtitle"
                    value={formData.subtitle}
                    onChange={handleChange}
                    required
                    placeholder="e.g. Join hundreds of businesses..."
                    className="w-full bg-bg/50 border border-border/70 rounded-xl px-4 py-3 text-sm text-text leading-relaxed resize-none focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition"
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-5 pt-2">
                  {/* Primary Button Text */}
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-text/80 mb-2">
                      Primary Button Text
                    </label>
                    <input
                      type="text"
                      name="primaryButtonText"
                      value={formData.primaryButtonText}
                      onChange={handleChange}
                      required
                      placeholder="e.g. Get Started Free"
                      className="w-full bg-bg/50 border border-border/70 rounded-xl px-4 py-3 text-sm font-semibold text-text focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition"
                    />
                  </div>

                  {/* Primary Button Link */}
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-text/80 mb-2">
                      Primary Button Link
                    </label>
                    <input
                      type="text"
                      name="primaryButtonLink"
                      value={formData.primaryButtonLink}
                      onChange={handleChange}
                      required
                      placeholder="e.g. /login"
                      className="w-full bg-bg/50 border border-border/70 rounded-xl px-4 py-3 text-sm font-semibold text-text focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition"
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-5 pt-2">
                  {/* Secondary Button Text */}
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-text/80 mb-2">
                      Secondary Button Text
                    </label>
                    <input
                      type="text"
                      name="secondaryButtonText"
                      value={formData.secondaryButtonText}
                      onChange={handleChange}
                      required
                      placeholder="e.g. Schedule Demo"
                      className="w-full bg-bg/50 border border-border/70 rounded-xl px-4 py-3 text-sm font-semibold text-text focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition"
                    />
                  </div>

                  {/* Secondary Button Link */}
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-text/80 mb-2">
                      Secondary Button Link
                    </label>
                    <input
                      type="text"
                      name="secondaryButtonLink"
                      value={formData.secondaryButtonLink}
                      onChange={handleChange}
                      required
                      placeholder="e.g. /demo"
                      className="w-full bg-bg/50 border border-border/70 rounded-xl px-4 py-3 text-sm font-semibold text-text focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition"
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-5 pt-2">
                  {/* Login Link Text */}
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-text/80 mb-2">
                      Footer Text / Login Text
                    </label>
                    <input
                      type="text"
                      name="loginText"
                      value={formData.loginText}
                      onChange={handleChange}
                      required
                      placeholder="Already have an account? Sign In"
                      className="w-full bg-bg/50 border border-border/70 rounded-xl px-4 py-3 text-sm font-semibold text-text focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition"
                    />
                  </div>

                  {/* Login Link */}
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-text/80 mb-2">
                      Footer Link / Login Link
                    </label>
                    <input
                      type="text"
                      name="loginLink"
                      value={formData.loginLink}
                      onChange={handleChange}
                      required
                      placeholder="e.g. /login"
                      className="w-full bg-bg/50 border border-border/70 rounded-xl px-4 py-3 text-sm font-semibold text-text focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition"
                    />
                  </div>
                </div>

                {/* Section Visibility Status */}
                <div className="pt-4 border-t border-border/50">
                  <div
                    onClick={() =>
                      setFormData((prev) => ({ ...prev, status: !prev.status }))
                    }
                    className={`cursor-pointer border rounded-2xl p-4 md:p-5 flex items-center justify-between transition-all duration-300 ${
                      formData.status
                        ? "bg-primary/5 border-primary/40 shadow-sm"
                        : "bg-bg/40 border-border/60 opacity-80"
                    }`}
                  >
                    <div className="flex items-center gap-3.5">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                          formData.status ? "bg-primary text-white" : "bg-border/40 text-text/50"
                        }`}
                      >
                        <FiShield className="text-lg" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold text-sm text-text">Section Visibility</h4>
                          <span
                            className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                              formData.status
                                ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
                                : "bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30"
                            }`}
                          >
                            {formData.status ? "Enabled" : "Disabled"}
                          </span>
                        </div>
                        <p className="text-xs text-text/60 mt-0.5">
                          Toggle whether this CTA section is displayed on the live website.
                        </p>
                      </div>
                    </div>

                    <div
                      className={`relative w-12 h-6 rounded-full transition-colors duration-300 ${
                        formData.status ? "bg-primary" : "bg-border"
                      }`}
                    >
                      <div
                        className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform duration-300 ${
                          formData.status ? "translate-x-6" : "translate-x-0"
                        }`}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={isSaving}
                className="flex items-center gap-2 bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-700 text-white px-8 py-3.5 rounded-xl font-bold text-sm shadow-lg active:scale-[0.98] transition-all disabled:opacity-50"
              >
                <FiSave className="text-lg" />
                {isSaving ? "Saving..." : "Save CTA Settings"}
              </button>
            </div>
          </form>
        </div>

        {/* Right Preview Column (5 cols) */}
        <div className="lg:col-span-5 lg:sticky lg:top-6">
          <div className="bg-card border border-border/60 rounded-2xl p-5 md:p-6 shadow-xl backdrop-blur-md">
            {/* Live Preview Header */}
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-border/50">
              <div className="flex items-center gap-2">
                <FiEye className="text-primary text-lg" />
                <h3 className="text-base font-bold text-text">Live Preview</h3>
              </div>

              {/* Viewport switcher */}
              <div className="flex items-center bg-bg/80 border border-border/50 p-1 rounded-xl gap-1">
                <button
                  type="button"
                  onClick={() => setPreviewMode("desktop")}
                  className={`flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg transition ${
                    previewMode === "desktop"
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
                  className={`flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg transition ${
                    previewMode === "mobile"
                      ? "bg-primary text-white shadow-sm"
                      : "text-text/60 hover:text-text"
                  }`}
                  title="Mobile View"
                >
                  <FiSmartphone className="text-xs" /> Mobile
                </button>
              </div>
            </div>

            {/* Mock Screen Canvas */}
            <div
              className={`mx-auto transition-all duration-300 overflow-hidden ${
                previewMode === "mobile"
                  ? "max-w-[320px] rounded-3xl border-4 border-slate-700 shadow-2xl"
                  : "w-full rounded-2xl border border-border/60"
              }`}
            >
              {/* Browser Bar */}
              <div className="bg-slate-900 px-4 py-2 flex items-center justify-between border-b border-slate-800">
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                </div>
                <span className="text-[10px] text-slate-400 font-mono tracking-tight truncate max-w-[180px]">
                  emergesun.com
                </span>
                <span
                  className={`w-2 h-2 rounded-full ${
                    formData.status ? "bg-emerald-400 animate-pulse" : "bg-rose-500"
                  }`}
                />
              </div>

              {/* Exact Mock Canvas matching the CTA layout and color scheme */}
              <div
                className={`relative bg-gradient-to-br from-amber-100/50 via-amber-50/30 to-orange-100/40 p-8 text-center border-t border-orange-100/50 min-h-[300px] flex flex-col items-center justify-center transition-all ${
                  !formData.status ? "opacity-40 grayscale" : ""
                }`}
              >
                <div className="max-w-md mx-auto space-y-5">
                  <h2 className="text-lg md:text-xl font-extrabold text-gray-800 tracking-tight leading-tight">
                    {formData.title || "Ready to Transform Your Business?"}
                  </h2>
                  <p className="text-[11px] text-gray-600 leading-relaxed">
                    {formData.subtitle || "Join hundreds of businesses that have streamlined their operations with our ERP system"}
                  </p>

                  <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                    <button
                      type="button"
                      className="w-full sm:w-auto px-5 py-2.5 bg-orange-500 text-white font-bold rounded-xl text-[11px] shadow-md transition-all active:scale-95"
                      style={{ backgroundColor: "#f97316" }}
                    >
                      {formData.primaryButtonText || "Get Started Free"}
                    </button>
                    <button
                      type="button"
                      className="w-full sm:w-auto px-5 py-2.5 border border-orange-500 text-orange-500 font-bold rounded-xl text-[11px] bg-transparent transition-all active:scale-95"
                      style={{ borderColor: "#f97316", color: "#f97316" }}
                    >
                      {formData.secondaryButtonText || "Schedule Demo"}
                    </button>
                  </div>

                  <div className="pt-2">
                    <span className="text-[10px] font-semibold text-gray-500 underline cursor-pointer">
                      {formData.loginText || "Already have an account? Sign In"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Disabled Overlay Alert */}
            {!formData.status && (
              <div className="bg-rose-500/10 border-t border-rose-500/30 p-2.5 text-center mt-3 rounded-lg">
                <span className="text-[10px] font-semibold text-rose-500 flex items-center justify-center gap-1.5">
                  <FiXCircle /> CTA Section is Hidden on Live Website
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
