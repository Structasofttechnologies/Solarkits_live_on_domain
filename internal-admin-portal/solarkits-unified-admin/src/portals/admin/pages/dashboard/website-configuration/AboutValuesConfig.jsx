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
  FiShield,
  FiAward
} from "react-icons/fi";
import { HiOutlineInformationCircle, HiSparkles } from "react-icons/hi";
import { Leaf, Sparkles, Users, ShieldCheck, Zap, Heart, Award, Eye, Flag, Shield } from "lucide-react";

// Mapping string representation of icons to Lucide components
const ICON_COMPONENTS = {
  Leaf: Leaf,
  Sparkles: Sparkles,
  Users: Users,
  ShieldCheck: ShieldCheck,
  Zap: Zap,
  Heart: Heart,
  Award: Award,
  Eye: Eye,
  Flag: Flag,
  Shield: Shield
};

const DEFAULT_CONFIG = {
  valuesTitle: "Our Values",
  values: [
    { icon: "Leaf", title: "Sustainability", description: "Committed to environmental stewardship" },
    { icon: "Sparkles", title: "Innovation", description: "Pushing boundaries in solar technology" },
    { icon: "Users", title: "Customer First", description: "Your satisfaction is our priority" },
    { icon: "ShieldCheck", title: "Quality", description: "Highest standards in every installation" }
  ],
  stats: [
    { value: "10K+", label: "Installations" },
    { value: "15+", label: "Years Experience" },
    { value: "50MW+", label: "Solar Capacity" },
    { value: "98%", label: "Customer Satisfaction" }
  ],
  status: true,
};

const BASE_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

function AboutValuesConfig() {
  const [formData, setFormData] = useState(DEFAULT_CONFIG);
  const [previewMode, setPreviewMode] = useState("desktop"); // "desktop" | "mobile"
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    fetchAboutDetails();
  }, []);

  const fetchAboutDetails = async () => {
    try {
      const response = await axios.get(
        `${BASE_URL}/api/website/v1/about-details/get?t=${Date.now()}`
      );
      if (response.data?.data) {
        const data = response.data.data;
        setFormData({
          ...DEFAULT_CONFIG,
          ...data,
          values: data.values && data.values.length > 0 ? data.values : DEFAULT_CONFIG.values,
          stats: data.stats && data.stats.length > 0 ? data.stats : DEFAULT_CONFIG.stats,
        });
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

  const handleValueChange = (index, field, value) => {
    setFormData((prev) => {
      const newValues = [...(prev.values || [])];
      newValues[index] = { ...newValues[index], [field]: value };
      return { ...prev, values: newValues };
    });
    setSavedSuccess(false);
  };

  const handleStatChange = (index, field, value) => {
    setFormData((prev) => {
      const newStats = [...(prev.stats || [])];
      newStats[index] = { ...newStats[index], [field]: value };
      return { ...prev, stats: newStats };
    });
    setSavedSuccess(false);
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
        response = await axios.patch(
          `${BASE_URL}/api/website/v1/about-details/update/${formData._id}`,
          formData
        );
      } else {
        response = await axios.post(
          `${BASE_URL}/api/website/v1/about-details/create`,
          formData
        );
      }

      if (response.data?.data) {
        const data = response.data.data;
        setFormData({
          ...DEFAULT_CONFIG,
          ...data,
          values: data.values && data.values.length > 0 ? data.values : DEFAULT_CONFIG.values,
          stats: data.stats && data.stats.length > 0 ? data.stats : DEFAULT_CONFIG.stats,
        });
      }
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 4000);
    } catch (error) {
      console.error("Failed to save Values configuration:", error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen pb-12">
      {/* Page Header */}
      <PageHeader
        title="Our Values & Stats Configuration"
        subtitle="Manage and customize the Core Values cards and bottom Stats Counter."
        icon={HiOutlineInformationCircle}
        stats={[
          {
            label: "Status",
            value: formData.status ? "Active" : "Disabled",
            description: formData.status ? "Visible on live site" : "Hidden from site",
          },
          {
            label: "Values Cards",
            value: `${formData.values ? formData.values.length : 0}`,
            description: "Number of core value cards",
          },
          {
            label: "Stats Counters",
            value: `${formData.stats ? formData.stats.length : 0}`,
            description: "Number of stats counters",
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
                <p className="font-semibold text-sm">Our Values & Stats configuration saved successfully!</p>
                <p className="text-xs opacity-80">The Values and Stats sections have been updated.</p>
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
                    <h2 className="text-xl font-bold text-text">Our Values & Stats</h2>
                    <p className="text-xs text-text/60">Customize Section Title, Values list, and Stats</p>
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
                {/* 1. Our Values Section */}
                <div className="border border-border/40 rounded-xl p-5 bg-bg/20 space-y-4">
                  <h3 className="text-sm font-bold text-text/90 uppercase tracking-wider flex items-center gap-2 border-b border-border/30 pb-2">
                    <FiAward className="text-amber-500 text-base" /> Our Values Section
                  </h3>
                  <div>
                    <label className="text-xs font-semibold text-text/80 block mb-1.5">Values Section Title</label>
                    <input
                      type="text"
                      name="valuesTitle"
                      value={formData.valuesTitle || "Our Values"}
                      onChange={handleChange}
                      maxLength={60}
                      className="w-full bg-bg/50 border border-border/70 rounded-xl px-4 py-2.5 text-sm font-semibold text-text focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition"
                    />
                  </div>

                  <div className="space-y-4 pt-2">
                    <label className="text-xs font-bold text-text/70 uppercase">Values Cards (Max 4)</label>
                    {(formData.values || []).map((val, idx) => (
                      <div key={idx} className="border border-border/30 rounded-lg p-4 bg-bg/30 space-y-3">
                        <div className="grid grid-cols-12 gap-3">
                          {/* Icon Dropdown */}
                          <div className="col-span-4">
                            <label className="text-[10px] font-semibold text-text/60 block mb-1">Icon</label>
                            <select
                              value={val.icon}
                              onChange={(e) => handleValueChange(idx, "icon", e.target.value)}
                              className="w-full bg-bg/50 border border-border/70 rounded-lg px-2 py-1.5 text-xs text-text focus:outline-none focus:ring-1 focus:ring-primary"
                            >
                              {Object.keys(ICON_COMPONENTS).map((ico) => (
                                <option key={ico} value={ico}>
                                  {ico}
                                </option>
                              ))}
                            </select>
                          </div>
                          {/* Card Title */}
                          <div className="col-span-8">
                            <label className="text-[10px] font-semibold text-text/60 block mb-1">Card Title</label>
                            <input
                              type="text"
                              value={val.title}
                              onChange={(e) => handleValueChange(idx, "title", e.target.value)}
                              maxLength={40}
                              className="w-full bg-bg/50 border border-border/70 rounded-lg px-3 py-1.5 text-xs text-text focus:outline-none focus:ring-1 focus:ring-primary"
                            />
                          </div>
                        </div>
                        {/* Card Description */}
                        <div>
                          <label className="text-[10px] font-semibold text-text/60 block mb-1">Card Description</label>
                          <input
                            type="text"
                            value={val.description}
                            onChange={(e) => handleValueChange(idx, "description", e.target.value)}
                            maxLength={100}
                            className="w-full bg-bg/50 border border-border/70 rounded-lg px-3 py-1.5 text-xs text-text focus:outline-none focus:ring-1 focus:ring-primary"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 2. Stats counters Section */}
                <div className="border border-border/40 rounded-xl p-5 bg-bg/20 space-y-4">
                  <h3 className="text-sm font-bold text-text/90 uppercase tracking-wider flex items-center gap-2 border-b border-border/30 pb-2">
                    <HiOutlineInformationCircle className="text-emerald-500 text-base" /> Stats Counter Section
                  </h3>
                  <div className="space-y-4">
                    <label className="text-xs font-bold text-text/70 uppercase">Counters (Max 4)</label>
                    <div className="grid sm:grid-cols-2 gap-4">
                      {(formData.stats || []).map((st, idx) => (
                        <div key={idx} className="border border-border/30 rounded-lg p-3.5 bg-bg/30 space-y-2">
                          <div>
                            <label className="text-[10px] font-semibold text-text/60 block mb-0.5">Value (e.g. 10K+)</label>
                            <input
                              type="text"
                              value={st.value}
                              onChange={(e) => handleStatChange(idx, "value", e.target.value)}
                              maxLength={12}
                              className="w-full bg-bg/50 border border-border/70 rounded-lg px-2.5 py-1 text-xs font-bold text-text focus:outline-none focus:ring-1 focus:ring-primary"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-semibold text-text/60 block mb-0.5">Label</label>
                            <input
                              type="text"
                              value={st.label}
                              onChange={(e) => handleStatChange(idx, "label", e.target.value)}
                              maxLength={35}
                              className="w-full bg-bg/50 border border-border/70 rounded-lg px-2.5 py-1 text-xs text-text focus:outline-none focus:ring-1 focus:ring-primary"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
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
                          Toggle whether these sections are displayed on the live website.
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

              {/* Live Preview Content Area */}
              <div
                className={`bg-white text-slate-950 p-4 md:p-6 overflow-y-auto max-h-[500px] text-left transition-opacity duration-300 ${!formData.status ? "opacity-40 grayscale" : ""
                  }`}
              >
                {/* 1. Our Values Section */}
                <div className="space-y-4 mb-8">
                  <h4 className="text-sm font-bold text-gray-900 text-left">
                    {formData.valuesTitle || "Our Values"}
                  </h4>
                  <div className={`grid gap-3 ${previewMode === "desktop" ? "grid-cols-2" : "grid-cols-1"}`}>
                    {(formData.values || []).map((val, idx) => {
                      const IconComponent = ICON_COMPONENTS[val.icon] || Sparkles;
                      return (
                        <div key={idx} className="rounded-xl bg-white p-4 border border-slate-100 flex flex-col items-center text-center space-y-2 shadow-sm">
                          <IconComponent className="h-6 w-6 text-blue-700" />
                          <h5 className="text-xs font-bold text-gray-900">{val.title}</h5>
                          <p className="text-[9px] text-gray-600 leading-relaxed">{val.description}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 2. Stats Counter Bar */}
                <div className="w-full bg-blue-50 rounded-xl p-4 flex justify-around gap-4 text-center border border-blue-100 shadow-sm">
                  {(formData.stats || []).map((st, idx) => (
                    <div key={idx} className="space-y-1">
                      <span className="block text-sm font-extrabold text-blue-700">{st.value}</span>
                      <span className="block text-[8px] font-semibold text-gray-600">{st.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Disabled Overlay Banner if Section Disabled */}
              {!formData.status && (
                <div className="bg-rose-500/10 border-t border-rose-500/30 p-2 text-center">
                  <span className="text-[10px] font-semibold text-rose-500 flex items-center justify-center gap-1">
                    <FiXCircle /> Sections Disabled - Hidden on Website
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

export default AboutValuesConfig;
