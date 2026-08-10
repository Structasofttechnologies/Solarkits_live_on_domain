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
  FiShield,
  FiType
} from "react-icons/fi";
import { HiOutlineMail, HiSparkles } from "react-icons/hi";

const DEFAULT_CONFIG = {
  heroTitle: "Get In Touch",
  heroSubtitle: "We're here to help you with all your solar energy needs. Contact us for free consultations and quotes.",
  status: true,
};

const BASE_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

export default function ContactHeroConfig() {
  const [formData, setFormData] = useState(DEFAULT_CONFIG);
  const [previewMode, setPreviewMode] = useState("desktop"); // "desktop" | "mobile"
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchContactHero();
  }, []);

  const fetchContactHero = async () => {
    setLoading(true);
    try {
      const response = await axios.get(
        `${BASE_URL}/api/website/v1/contact/get?t=${Date.now()}`
      );
      if (response.data?.data) {
        const data = response.data.data;
        setFormData((prev) => ({
          ...prev,
          _id: data._id,
          heroTitle: data.heroTitle !== undefined ? data.heroTitle : DEFAULT_CONFIG.heroTitle,
          heroSubtitle: data.heroSubtitle !== undefined ? data.heroSubtitle : DEFAULT_CONFIG.heroSubtitle,
          status: data.status !== undefined ? data.status : DEFAULT_CONFIG.status,
        }));
      }
    } catch (error) {
      console.log("Using default contact hero configuration or API pending:", error.message);
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

  const handleToggleStatus = () => {
    setFormData((prev) => ({ ...prev, status: !prev.status }));
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
      if (formData._id && formData._id.length === 24) {
        response = await axios.patch(
          `${BASE_URL}/api/website/v1/contact/update/${formData._id}`,
          formData
        );
      } else {
        response = await axios.post(
          `${BASE_URL}/api/website/v1/contact/create`,
          formData
        );
      }

      if (response.data?.data) {
        const data = response.data.data;
        setFormData((prev) => ({
          ...prev,
          ...data,
        }));
      }
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 4000);
    } catch (error) {
      console.error("Failed to save Contact Hero configuration:", error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen pb-12">
      {/* Page Header */}
      <PageHeader
        title="Get In Touch Configuration"
        subtitle="Manage and customize the 'Get In Touch' hero banner section displayed at the top of the Contact Us page."
        icon={HiOutlineMail}
        stats={[
          {
            label: "Banner Status",
            value: formData.status ? "Active" : "Disabled",
            description: formData.status ? "Visible on Contact page" : "Hidden from Contact page",
          },
          {
            label: "Title Words",
            value: `${formData.heroTitle ? formData.heroTitle.split(" ").length : 0}`,
            description: "Number of words in title",
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
                <p className="font-semibold text-sm">Get In Touch configuration saved successfully!</p>
                <p className="text-xs opacity-80">Your website's Contact Us Hero section has been updated.</p>
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
                    <h2 className="text-xl font-bold text-text">Banner Configuration</h2>
                    <p className="text-xs text-text/60">Customize the hero title and description text</p>
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

              <div className="space-y-6">
                {/* Text Fields */}
                <div className="border border-border/40 rounded-xl p-5 bg-bg/20 space-y-4">
                  <div>
                    <label className="text-xs font-semibold text-text/80 block mb-1.5 uppercase tracking-wider">Hero Title</label>
                    <div className="relative">
                      <FiType className="absolute left-3 top-3.5 text-text/40" />
                      <input
                        type="text"
                        name="heroTitle"
                        value={formData.heroTitle}
                        onChange={handleChange}
                        maxLength={100}
                        required
                        className="w-full bg-bg/50 border border-border/70 rounded-xl pl-10 pr-4 py-2.5 text-sm font-semibold text-text focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition"
                        placeholder="e.g., Get In Touch"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-text/80 block mb-1.5 uppercase tracking-wider">Hero Subtitle</label>
                    <textarea
                      rows={3}
                      name="heroSubtitle"
                      value={formData.heroSubtitle}
                      onChange={handleChange}
                      maxLength={300}
                      required
                      className="w-full bg-bg/50 border border-border/70 rounded-xl px-4 py-2.5 text-sm text-text leading-relaxed resize-none focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition"
                      placeholder="e.g., We're here to help you..."
                    />
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
                          <h4 className="font-semibold text-sm text-text">Visibility</h4>
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
                          Toggle whether this hero banner section is displayed on the live website.
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
              className={`mx-auto transition-all duration-300 overflow-hidden bg-white ${previewMode === "mobile"
                ? "max-w-[320px] rounded-3xl border-4 border-slate-700 shadow-2xl"
                : "w-full rounded-2xl border border-border/60"
                }`}
            >
              {/* Content Preview */}
              {formData.status ? (
                <div className="p-8 text-center space-y-4 max-w-2xl mx-auto bg-gradient-to-br from-blue-50 to-green-50 border border-blue-100/50 rounded-2xl my-4 mx-4 shadow-sm">
                  <h1 className="text-2xl font-extrabold text-gray-900 leading-tight">
                    {formData.heroTitle || "Get In Touch"}
                  </h1>
                  {formData.heroSubtitle && (
                    <p className="text-xs text-gray-600 leading-relaxed max-w-xl mx-auto">
                      {formData.heroSubtitle}
                    </p>
                  )}
                </div>
              ) : (
                <div className="p-12 text-center text-text/40 bg-bg/20 italic text-sm">
                  The Get In Touch hero banner is currently disabled and won't be displayed on the Contact page.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
