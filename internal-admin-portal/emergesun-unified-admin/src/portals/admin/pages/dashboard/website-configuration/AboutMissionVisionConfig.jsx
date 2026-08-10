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
  FiFlag,
  FiBookOpen
} from "react-icons/fi";
import { HiOutlineInformationCircle, HiSparkles } from "react-icons/hi";

const DEFAULT_CONFIG = {
  missionTitle: "Our Mission",
  missionDescription:
    "To make solar energy accessible and affordable for everyone, driving the transition to renewable energy and creating a sustainable future for generations to come.",
  visionTitle: "Our Vision",
  visionDescription:
    "A world powered entirely by renewable energy, where every home and business contributes to a cleaner, greener planet through solar power adoption.",
  storyTitle: "Our Story",
  storyParagraph1:
    "Founded in 2015, our journey began with a simple vision: to make solar energy accessible to all. What started as a small team of passionate engineers has grown into a leading solar solutions provider serving thousands of satisfied customers across the country.",
  storyParagraph2:
    "We believe in the power of renewable energy to transform communities and protect our planet. Every solar panel we install brings us one step closer to a sustainable future.",
  status: true,
};

const BASE_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

function AboutMissionVisionConfig() {
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
        setFormData((prev) => ({ ...prev, ...response.data.data }));
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
        setFormData((prev) => ({ ...prev, ...response.data.data }));
      }
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 4000);
    } catch (error) {
      console.error("Failed to save About Details configuration:", error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen pb-12">
      {/* Page Header */}
      <PageHeader
        title="Mission, Vision & Story Configuration"
        subtitle="Manage and customize your website's Mission, Vision, and Our Story sections."
        icon={HiOutlineInformationCircle}
        stats={[
          {
            label: "Status",
            value: formData.status ? "Active" : "Disabled",
            description: formData.status ? "Visible on live site" : "Hidden from site",
          },
          {
            label: "Mission Words",
            value: `${formData.missionDescription ? formData.missionDescription.split(" ").length : 0}`,
            description: "Mission description length",
          },
          {
            label: "Story Length",
            value: `${(formData.storyParagraph1 || "").length + (formData.storyParagraph2 || "").length} chars`,
            description: "Story paragraphs length",
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
                <p className="font-semibold text-sm">About Details configuration saved successfully!</p>
                <p className="text-xs opacity-80">Your website Mission, Vision & Story sections have been updated.</p>
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
                    <h2 className="text-xl font-bold text-text">Content Configuration</h2>
                    <p className="text-xs text-text/60">Customize Our Mission, Our Vision, and Our Story</p>
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
                {/* 1. Our Mission Section */}
                <div className="border border-border/40 rounded-xl p-5 bg-bg/20 space-y-4">
                  <h3 className="text-sm font-bold text-text/90 uppercase tracking-wider flex items-center gap-2 border-b border-border/30 pb-2">
                    <FiFlag className="text-blue-500 text-base" /> Our Mission Section
                  </h3>
                  <div>
                    <label className="text-xs font-semibold text-text/80 block mb-1.5">Mission Title</label>
                    <input
                      type="text"
                      name="missionTitle"
                      value={formData.missionTitle}
                      onChange={handleChange}
                      maxLength={60}
                      className="w-full bg-bg/50 border border-border/70 rounded-xl px-4 py-2.5 text-sm font-semibold text-text focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-text/80 block mb-1.5">Mission Description</label>
                    <textarea
                      rows={3}
                      name="missionDescription"
                      value={formData.missionDescription}
                      onChange={handleChange}
                      maxLength={300}
                      className="w-full bg-bg/50 border border-border/70 rounded-xl px-4 py-2.5 text-sm text-text leading-relaxed resize-none focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition"
                    />
                  </div>
                </div>

                {/* 2. Our Vision Section */}
                <div className="border border-border/40 rounded-xl p-5 bg-bg/20 space-y-4">
                  <h3 className="text-sm font-bold text-text/90 uppercase tracking-wider flex items-center gap-2 border-b border-border/30 pb-2">
                    <FiEye className="text-emerald-500 text-base" /> Our Vision Section
                  </h3>
                  <div>
                    <label className="text-xs font-semibold text-text/80 block mb-1.5">Vision Title</label>
                    <input
                      type="text"
                      name="visionTitle"
                      value={formData.visionTitle}
                      onChange={handleChange}
                      maxLength={60}
                      className="w-full bg-bg/50 border border-border/70 rounded-xl px-4 py-2.5 text-sm font-semibold text-text focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-text/80 block mb-1.5">Vision Description</label>
                    <textarea
                      rows={3}
                      name="visionDescription"
                      value={formData.visionDescription}
                      onChange={handleChange}
                      maxLength={300}
                      className="w-full bg-bg/50 border border-border/70 rounded-xl px-4 py-2.5 text-sm text-text leading-relaxed resize-none focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition"
                    />
                  </div>
                </div>

                {/* 3. Our Story Section */}
                <div className="border border-border/40 rounded-xl p-5 bg-bg/20 space-y-4">
                  <h3 className="text-sm font-bold text-text/90 uppercase tracking-wider flex items-center gap-2 border-b border-border/30 pb-2">
                    <FiBookOpen className="text-indigo-500 text-base" /> Our Story Section
                  </h3>
                  <div>
                    <label className="text-xs font-semibold text-text/80 block mb-1.5">Story Title</label>
                    <input
                      type="text"
                      name="storyTitle"
                      value={formData.storyTitle}
                      onChange={handleChange}
                      maxLength={60}
                      className="w-full bg-bg/50 border border-border/70 rounded-xl px-4 py-2.5 text-sm font-semibold text-text focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-text/80 block mb-1.5">Story Paragraph 1</label>
                    <textarea
                      rows={3}
                      name="storyParagraph1"
                      value={formData.storyParagraph1}
                      onChange={handleChange}
                      maxLength={500}
                      className="w-full bg-bg/50 border border-border/70 rounded-xl px-4 py-2.5 text-sm text-text leading-relaxed resize-none focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-text/80 block mb-1.5">Story Paragraph 2</label>
                    <textarea
                      rows={3}
                      name="storyParagraph2"
                      value={formData.storyParagraph2}
                      onChange={handleChange}
                      maxLength={500}
                      className="w-full bg-bg/50 border border-border/70 rounded-xl px-4 py-2.5 text-sm text-text leading-relaxed resize-none focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition"
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
                  emergesun.com/about
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
                {/* 1. Mission and Vision Cards */}
                <div className={`grid gap-4 mb-8 ${previewMode === "desktop" ? "grid-cols-2" : "grid-cols-1"}`}>
                  {/* Mission Card */}
                  <div className="rounded-xl bg-blue-50/70 border border-blue-100/50 p-4 flex flex-col space-y-1.5">
                    <FiFlag className="h-6 w-6 text-blue-700" />
                    <h4 className="text-xs font-bold text-gray-900">{formData.missionTitle}</h4>
                    <p className="text-[10px] text-gray-700 leading-relaxed">
                      {formData.missionDescription}
                    </p>
                  </div>

                  {/* Vision Card */}
                  <div className="rounded-xl bg-green-50/70 border border-green-100/50 p-4 flex flex-col space-y-1.5">
                    <FiEye className="h-6 w-6 text-blue-700" />
                    <h4 className="text-xs font-bold text-gray-900">{formData.visionTitle}</h4>
                    <p className="text-[10px] text-gray-700 leading-relaxed">
                      {formData.visionDescription}
                    </p>
                  </div>
                </div>

                {/* 2. Our Story Section */}
                <div className="text-center max-w-xl mx-auto space-y-2">
                  <h4 className="text-sm font-bold text-gray-900">{formData.storyTitle}</h4>
                  <div className="mx-auto h-0.5 w-12 bg-blue-700 rounded-full" />
                  <p className="text-[10px] text-gray-700 leading-relaxed">
                    {formData.storyParagraph1}
                  </p>
                  {formData.storyParagraph2 && (
                    <p className="text-[10px] text-gray-700 leading-relaxed">
                      {formData.storyParagraph2}
                    </p>
                  )}
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

export default AboutMissionVisionConfig;
