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
  FiMapPin,
  FiPlus,
  FiTrash2,
  FiType,
  FiBookOpen
} from "react-icons/fi";
import { HiOutlineMail, HiSparkles } from "react-icons/hi";

const DEFAULT_FAQ = {
  q: "New Question",
  a: "New Answer",
};

const DEFAULT_CONFIG = {
  mapTitle: "Map View",
  mapSubtitle: "Interactive map integrations will load in this canvas",
  mapStatus: true,
  faqTitle: "Frequently Asked Questions",
  faqStatus: true,
  faqs: [
    { q: "How long does a solar installation take?", a: "Residential installations typically take 2-4 days, while commercial projects vary depending on scale and planning compliance." },
    { q: "What is the lifespan of solar panels?", a: "High-quality solar panels have an active lifespan of 25-30 years, often with linear power warranties up to 25 years." },
    { q: "Do you offer solar warranties?", a: "Yes! We offer a full workmanship warranty alongside standard manufacture product warranties for materials, inverters, and battery banks." },
    { q: "How can I calculate my ROI?", a: "Our consultants will analyze your billing, property size, and sun exposure profile to calculate a accurate ROI payoff schedule." }
  ],
};

const BASE_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

export default function ContactMapFaqConfig() {
  const [formData, setFormData] = useState(DEFAULT_CONFIG);
  const [previewMode, setPreviewMode] = useState("desktop"); // "desktop" | "mobile"
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchContactMapFaq();
  }, []);

  const fetchContactMapFaq = async () => {
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
          mapTitle: data.mapTitle !== undefined ? data.mapTitle : DEFAULT_CONFIG.mapTitle,
          mapSubtitle: data.mapSubtitle !== undefined ? data.mapSubtitle : DEFAULT_CONFIG.mapSubtitle,
          mapStatus: data.mapStatus !== undefined ? data.mapStatus : DEFAULT_CONFIG.mapStatus,
          faqTitle: data.faqTitle !== undefined ? data.faqTitle : DEFAULT_CONFIG.faqTitle,
          faqStatus: data.faqStatus !== undefined ? data.faqStatus : DEFAULT_CONFIG.faqStatus,
          faqs: data.faqs && data.faqs.length > 0 ? data.faqs : DEFAULT_CONFIG.faqs,
        }));
      }
    } catch (error) {
      console.log("Using default contact map & FAQ configuration or API pending:", error.message);
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

  const handleToggleStatus = (field) => {
    setFormData((prev) => ({ ...prev, [field]: !prev[field] }));
    setSavedSuccess(false);
  };

  const handleFaqChange = (index, field, value) => {
    setFormData((prev) => {
      const updatedFaqs = [...prev.faqs];
      updatedFaqs[index] = {
        ...updatedFaqs[index],
        [field]: value,
      };
      return {
        ...prev,
        faqs: updatedFaqs,
      };
    });
    setSavedSuccess(false);
  };

  const handleAddFaq = () => {
    setFormData((prev) => ({
      ...prev,
      faqs: [...prev.faqs, { ...DEFAULT_FAQ }],
    }));
    setSavedSuccess(false);
  };

  const handleRemoveFaq = (index) => {
    if (window.confirm("Are you sure you want to remove this FAQ?")) {
      setFormData((prev) => ({
        ...prev,
        faqs: prev.faqs.filter((_, idx) => idx !== index),
      }));
      setSavedSuccess(false);
    }
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
      console.error("Failed to save Contact Map & FAQ configuration:", error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen pb-12">
      {/* Page Header */}
      <PageHeader
        title="Contact Map & FAQs Configuration"
        subtitle="Manage and customize the map view block and FAQs list displayed at the bottom of the Contact Us page."
        icon={HiOutlineMail}
        stats={[
          {
            label: "Map Status",
            value: formData.mapStatus ? "Active" : "Disabled",
            description: formData.mapStatus ? "Map section visible" : "Map section hidden",
          },
          {
            label: "FAQs Status",
            value: formData.faqStatus ? "Active" : "Disabled",
            description: formData.faqStatus ? "FAQs visible" : "FAQs hidden",
          },
          {
            label: "Total Q&As",
            value: `${formData.faqs ? formData.faqs.length : 0}`,
            description: "Count of FAQ items",
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
                <p className="font-semibold text-sm">Contact Map & FAQs configuration saved successfully!</p>
                <p className="text-xs opacity-80">Your website's Map and FAQs sections have been updated.</p>
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
                    <h2 className="text-xl font-bold text-text">Sections Configurations</h2>
                    <p className="text-xs text-text/60">Customize Map and Frequently Asked Questions</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleReset}
                  className="flex items-center gap-1.5 text-xs text-text/60 hover:text-primary transition font-medium px-3 py-1.5 rounded-lg border border-border/40 hover:bg-primary/5"
                  title="Reset to default content"
                >
                  <FiRotateCcw className="text-xs" /> Reset
                </button>
              </div>

              <div className="space-y-6">
                
                {/* 1. Contact Map Section */}
                <div className="border border-border/40 rounded-xl p-5 bg-bg/20 space-y-4">
                  <h3 className="text-xs font-bold text-text/90 uppercase tracking-wider pb-2 border-b border-border/30 flex items-center justify-between">
                    <span>Contact Map Section</span>
                    <button
                      type="button"
                      onClick={() => {
                        setFormData(prev => ({ ...prev, mapStatus: !prev.mapStatus }));
                        setSavedSuccess(false);
                      }}
                      className={`relative flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all duration-300 cursor-pointer select-none ${formData.mapStatus ? "bg-primary border-primary" : "bg-bg/60 border-border/60"}`}
                    >
                      <span className={`relative inline-block w-8 h-4 rounded-full transition-colors duration-300 ${formData.mapStatus ? "bg-white/30" : "bg-border/60"}`}>
                        <span className={`absolute top-0.5 left-0.5 w-3 h-3 rounded-full bg-white shadow-sm transition-transform duration-300 ${formData.mapStatus ? "translate-x-4" : "translate-x-0"}`} />
                      </span>
                      <span className={`text-xs font-bold transition-colors duration-300 ${formData.mapStatus ? "text-white" : "text-text/50"}`}>
                        {formData.mapStatus ? "Enabled" : "Disabled"}
                      </span>
                    </button>
                  </h3>

                  <div>
                    <label className="text-xs font-semibold text-text/80 block mb-1.5">Map Section Title</label>
                    <div className="relative">
                      <FiType className="absolute left-3 top-3 text-text/40" />
                      <input
                        type="text"
                        name="mapTitle"
                        value={formData.mapTitle}
                        onChange={handleChange}
                        maxLength={60}
                        required
                        className="w-full bg-bg/50 border border-border/70 rounded-xl pl-10 pr-4 py-2 text-sm font-semibold text-text focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-text/80 block mb-1.5">Map Section Subtitle</label>
                    <textarea
                      rows={2}
                      name="mapSubtitle"
                      value={formData.mapSubtitle}
                      onChange={handleChange}
                      maxLength={200}
                      required
                      className="w-full bg-bg/50 border border-border/70 rounded-xl px-4 py-2 text-sm text-text leading-relaxed resize-none focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition"
                    />
                  </div>
                </div>

                {/* 2. Customer FAQs Section */}
                <div className="border border-border/40 rounded-xl p-5 bg-bg/20 space-y-4">
                  <h3 className="text-xs font-bold text-text/90 uppercase tracking-wider pb-2 border-b border-border/30 flex items-center justify-between">
                    <span>Customer FAQs Section</span>
                    <button
                      type="button"
                      onClick={() => {
                        setFormData(prev => ({ ...prev, faqStatus: !prev.faqStatus }));
                        setSavedSuccess(false);
                      }}
                      className={`relative flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all duration-300 cursor-pointer select-none ${formData.faqStatus ? "bg-primary border-primary" : "bg-bg/60 border-border/60"}`}
                    >
                      <span className={`relative inline-block w-8 h-4 rounded-full transition-colors duration-300 ${formData.faqStatus ? "bg-white/30" : "bg-border/60"}`}>
                        <span className={`absolute top-0.5 left-0.5 w-3 h-3 rounded-full bg-white shadow-sm transition-transform duration-300 ${formData.faqStatus ? "translate-x-4" : "translate-x-0"}`} />
                      </span>
                      <span className={`text-xs font-bold transition-colors duration-300 ${formData.faqStatus ? "text-white" : "text-text/50"}`}>
                        {formData.faqStatus ? "Enabled" : "Disabled"}
                      </span>
                    </button>
                  </h3>

                  <div>
                    <label className="text-xs font-semibold text-text/80 block mb-1.5">FAQ Section Title</label>
                    <div className="relative">
                      <FiType className="absolute left-3 top-3 text-text/40" />
                      <input
                        type="text"
                        name="faqTitle"
                        value={formData.faqTitle}
                        onChange={handleChange}
                        maxLength={80}
                        required
                        className="w-full bg-bg/50 border border-border/70 rounded-xl pl-10 pr-4 py-2 text-sm font-semibold text-text focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition"
                      />
                    </div>
                  </div>

                  <div className="space-y-4 pt-2">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-bold text-text/60 uppercase">Q&A list</label>
                      <button
                        type="button"
                        onClick={handleAddFaq}
                        className="flex items-center gap-0.5 px-2 py-0.5 bg-primary text-white text-[10px] font-bold rounded hover:bg-primary/95 transition shadow-sm"
                      >
                        <FiPlus /> Add Item
                      </button>
                    </div>

                    <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                      {formData.faqs.map((faq, idx) => (
                        <div key={idx} className="border border-border/30 rounded-lg p-3 bg-bg/30 relative space-y-2 shadow-sm">
                          <button
                            type="button"
                            onClick={() => handleRemoveFaq(idx)}
                            className="absolute top-2 right-2 text-rose-500 hover:text-rose-700 transition p-1 hover:bg-rose-500/5 rounded"
                            title="Remove Q&A"
                          >
                            <FiTrash2 className="text-[11px]" />
                          </button>

                          <div className="pr-6 space-y-2">
                            <div>
                              <input
                                type="text"
                                placeholder={`Question #${idx + 1}`}
                                value={faq.q}
                                onChange={(e) => handleFaqChange(idx, "q", e.target.value)}
                                required
                                className="w-full bg-bg/50 border border-border/70 rounded px-2.5 py-1 text-xs text-text focus:outline-none focus:ring-1 focus:ring-primary font-semibold"
                              />
                            </div>
                            <div>
                              <textarea
                                rows={2}
                                placeholder="Answer text..."
                                value={faq.a}
                                onChange={(e) => handleFaqChange(idx, "a", e.target.value)}
                                required
                                className="w-full bg-bg/50 border border-border/70 rounded px-2.5 py-1 text-xs text-text focus:outline-none focus:ring-1 focus:ring-primary leading-relaxed resize-none"
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Save Button */}
                <div className="pt-2 flex items-center justify-end">
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
                        <FiSave className="text-base" /> Save Configurations
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
              <div className="p-4 space-y-6 max-h-[450px] overflow-y-auto">
                {/* 1. Map Preview */}
                {formData.mapStatus ? (
                  <div className="p-6 text-center bg-gray-100/50 border border-gray-200 rounded-2xl shadow-inner flex flex-col items-center min-h-[160px] justify-center">
                    <FiMapPin className="h-10 w-10 text-blue-700 mb-1" />
                    <h3 className="text-sm font-bold text-gray-800">
                      {formData.mapTitle || "Map View"}
                    </h3>
                    <p className="text-[10px] text-gray-500 mt-0.5 max-w-xs mx-auto">
                      {formData.mapSubtitle}
                    </p>
                  </div>
                ) : (
                  <div className="p-6 text-center text-text/40 bg-bg/20 border border-dashed border-border rounded-2xl italic text-[11px]">
                    Map section is currently disabled.
                  </div>
                )}

                {/* 2. FAQ Preview */}
                {formData.faqStatus ? (
                  <div className="p-5 text-left bg-orange-50/5 text-gray-900 border border-orange-100/30 rounded-2xl shadow-sm space-y-4">
                    <h2 className="text-sm font-bold text-gray-900 text-center border-b border-border/30 pb-2">
                      {formData.faqTitle || "Frequently Asked Questions"}
                    </h2>
                    <div className="grid gap-2.5 text-[10px]">
                      {formData.faqs.map((faq, idx) => (
                        <div key={idx} className="rounded-lg border border-gray-150 bg-white p-3 shadow-sm space-y-1">
                          <h4 className="font-bold text-gray-800 flex gap-1 items-start">
                            <FiBookOpen className="text-blue-700 text-[11px] shrink-0 mt-0.5" />
                            <span>{faq.q}</span>
                          </h4>
                          <p className="text-gray-500 leading-relaxed text-[9px]">
                            {faq.a}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="p-6 text-center text-text/40 bg-bg/20 border border-dashed border-border rounded-2xl italic text-[11px]">
                    FAQs section is currently disabled.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
