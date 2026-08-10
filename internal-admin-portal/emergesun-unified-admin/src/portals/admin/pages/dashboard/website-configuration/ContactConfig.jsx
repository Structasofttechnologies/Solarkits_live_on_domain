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
  FiMail,
  FiPhone,
  FiMapPin,
  FiClock,
  FiSend,
  FiFacebook,
  FiTwitter,
  FiLinkedin,
  FiInstagram,
  FiGlobe
} from "react-icons/fi";
import { HiSparkles, HiOutlineMail } from "react-icons/hi";

const DEFAULT_CONFIG = {
  heroTitle: "Get In Touch",
  heroSubtitle:
    "We're here to help you with all your solar energy needs. Contact us for free consultations and quotes.",
  sectionTitle: "Contact Information",
  sectionDesc:
    "Fill out the form or reach out to us through any of the channels below. Our team is ready to assist you with your solar journey.",
  officeAddress: "123 Solar Street, Green City, GC 12345, United States",
  phone1: "+1 (555) 123-4567",
  phone2: "+1 (555) 765-4321",
  email1: "info@solarcompany.com",
  email2: "support@solarcompany.com",
  businessHours:
    "Monday - Friday: 8:00 AM - 6:00 PM\nSaturday: 9:00 AM - 2:00 PM\nSunday: Closed",
  facebookUrl: "https://facebook.com",
  twitterUrl: "https://twitter.com",
  linkedinUrl: "https://linkedin.com",
  instagramUrl: "https://instagram.com",
  formTitle: "Send us a Message",
  submitBtnText: "Submit Message",
  status: true
};

const BASE_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

function ContactConfig() {
  const [formData, setFormData] = useState(DEFAULT_CONFIG);
  const [previewMode, setPreviewMode] = useState("desktop"); // "desktop" | "mobile"
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    fetchContactInfo();
  }, []);

  const fetchContactInfo = async () => {
    try {
      // API Call: GET /api/website/v1/contact/get - Fetch Contact configuration
      const response = await axios.get(
        `${BASE_URL}/api/website/v1/contact/get?t=${Date.now()}`
      );
      if (response.data?.data) {
        setFormData((prev) => ({ ...prev, ...response.data.data }));
      }
    } catch (error) {
      console.log("Using default contact configuration or API pending:", error.message);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value
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
        // API Call: PATCH /api/website/v1/contact/update/:id - Update Contact configuration
        response = await axios.patch(
          `${BASE_URL}/api/website/v1/contact/update/${formData._id}`,
          formData
        );
      } else {
        // API Call: POST /api/website/v1/contact/create - Create Contact configuration
        response = await axios.post(
          `${BASE_URL}/api/website/v1/contact/create`,
          formData
        );
      }

      if (response.data?.data) {
        setFormData((prev) => ({ ...prev, ...response.data.data }));
      }
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 4000);
    } catch (error) {
      console.error("Failed to save contact configuration:", error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen pb-12">
      {/* Page Header */}
      <PageHeader
        title="Contact Us Configuration"
        subtitle="Manage contact information, office address, phone numbers, email IDs, business hours & live contact form."
        icon={HiOutlineMail}
        stats={[
          {
            label: "Status",
            value: formData.status ? "Active" : "Disabled",
            description: formData.status ? "Visible on live site" : "Hidden from site"
          },
          {
            label: "Primary Email",
            value: formData.email1 ? formData.email1.split("@")[0] : "Not set",
            description: formData.email1 || "Email ID"
          },
          {
            label: "Primary Phone",
            value: formData.phone1 || "Not set",
            description: "Contact phone number"
          }
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
                <p className="font-semibold text-sm">Contact configuration saved successfully!</p>
                <p className="text-xs opacity-80">Your website Contact Us page details have been updated live.</p>
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

      <form onSubmit={handleSubmit} className="grid lg:grid-cols-12 gap-5 lg:gap-8 items-start">
        {/* Left Form (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Card 1: Section Titles */}
          <div className="bg-card border border-border/60 rounded-2xl p-6 md:p-8 shadow-xl backdrop-blur-md relative overflow-hidden">
            <div className="flex items-center justify-between pb-5 mb-6 border-b border-border/50">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
                  <HiSparkles className="text-xl" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-text">Contact Section Titles</h2>
                  <p className="text-xs text-text/60">Customize the information section intro copy</p>
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

            <div className="space-y-4">
              {/* Section Title */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-text/80 flex items-center gap-1.5">
                    <FiType className="text-primary text-sm" /> Information Section Title
                  </label>
                  <span className="text-[11px] text-text/40">{formData.sectionTitle.length} / 60</span>
                </div>
                <input
                  type="text"
                  name="sectionTitle"
                  value={formData.sectionTitle}
                  onChange={handleChange}
                  maxLength={60}
                  placeholder="e.g. Contact Information"
                  className="w-full bg-bg/50 border border-border/70 rounded-xl px-4 py-3 text-sm font-semibold text-text focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition"
                />
              </div>

              {/* Section Description */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-text/80 flex items-center gap-1.5">
                    <FiInfo className="text-primary text-sm" /> Section Sub-description
                  </label>
                  <span className="text-[11px] text-text/40">{formData.sectionDesc.length} / 250</span>
                </div>
                <textarea
                  rows={2}
                  name="sectionDesc"
                  value={formData.sectionDesc}
                  onChange={handleChange}
                  maxLength={250}
                  placeholder="Fill out the form or reach out to us through any of the channels below..."
                  className="w-full bg-bg/50 border border-border/70 rounded-xl px-4 py-3 text-sm text-text leading-relaxed resize-none focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition"
                />
              </div>
            </div>
          </div>

          {/* Card 2: Contact Details (Office, Phone, Email, Hours) */}
          <div className="bg-card border border-border/60 rounded-2xl p-6 md:p-8 shadow-xl backdrop-blur-md relative overflow-hidden">
            <div className="flex items-center justify-between pb-5 mb-6 border-b border-border/50">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
                  <FiMapPin className="text-xl" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-text">Office & Channel Details</h2>
                  <p className="text-xs text-text/60">Configure physical address, phone numbers & support emails</p>
                </div>
              </div>
            </div>

            <div className="space-y-5">
              {/* Office Address */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-text/80 mb-2 flex items-center gap-1.5">
                  <FiMapPin className="text-primary text-sm" /> Our Office Address
                </label>
                <input
                  type="text"
                  name="officeAddress"
                  value={formData.officeAddress}
                  onChange={handleChange}
                  placeholder="123 Solar Street, Green City, GC 12345, United States"
                  className="w-full bg-bg/50 border border-border/70 rounded-xl px-4 py-3 text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition"
                />
              </div>

              {/* Phone Numbers */}
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-text/80 mb-2 flex items-center gap-1.5">
                    <FiPhone className="text-primary text-sm" /> Phone Number 1
                  </label>
                  <input
                    type="text"
                    name="phone1"
                    value={formData.phone1}
                    onChange={handleChange}
                    placeholder="+1 (555) 123-4567"
                    className="w-full bg-bg/50 border border-border/70 rounded-xl px-4 py-3 text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-text/80 mb-2 flex items-center gap-1.5">
                    <FiPhone className="text-primary text-sm" /> Phone Number 2
                  </label>
                  <input
                    type="text"
                    name="phone2"
                    value={formData.phone2}
                    onChange={handleChange}
                    placeholder="+1 (555) 765-4321"
                    className="w-full bg-bg/50 border border-border/70 rounded-xl px-4 py-3 text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition"
                  />
                </div>
              </div>

              {/* Emails */}
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-text/80 mb-2 flex items-center gap-1.5">
                    <FiMail className="text-primary text-sm" /> Email Address 1
                  </label>
                  <input
                    type="email"
                    name="email1"
                    value={formData.email1}
                    onChange={handleChange}
                    placeholder="info@solarcompany.com"
                    className="w-full bg-bg/50 border border-border/70 rounded-xl px-4 py-3 text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-text/80 mb-2 flex items-center gap-1.5">
                    <FiMail className="text-primary text-sm" /> Email Address 2
                  </label>
                  <input
                    type="email"
                    name="email2"
                    value={formData.email2}
                    onChange={handleChange}
                    placeholder="support@solarcompany.com"
                    className="w-full bg-bg/50 border border-border/70 rounded-xl px-4 py-3 text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition"
                  />
                </div>
              </div>

              {/* Business Hours */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-text/80 mb-2 flex items-center gap-1.5">
                  <FiClock className="text-primary text-sm" /> Business Hours
                </label>
                <textarea
                  rows={3}
                  name="businessHours"
                  value={formData.businessHours}
                  onChange={handleChange}
                  placeholder="Monday - Friday: 8:00 AM - 6:00 PM..."
                  className="w-full bg-bg/50 border border-border/70 rounded-xl px-4 py-3 text-sm text-text leading-relaxed resize-none focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition font-mono text-xs"
                />
              </div>
            </div>
          </div>

          {/* Card 3: Social Links & Form Titles */}
          <div className="bg-card border border-border/60 rounded-2xl p-6 md:p-8 shadow-xl backdrop-blur-md relative overflow-hidden">
            <div className="flex items-center justify-between pb-5 mb-6 border-b border-border/50">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
                  <FiGlobe className="text-xl" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-text">Social Links & Contact Form Settings</h2>
                  <p className="text-xs text-text/60">Configure social handles and message box labels</p>
                </div>
              </div>
            </div>

            <div className="space-y-5">
              {/* Form Title & Button */}
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-text/80 mb-2">
                    Message Form Title
                  </label>
                  <input
                    type="text"
                    name="formTitle"
                    value={formData.formTitle}
                    onChange={handleChange}
                    placeholder="Send us a Message"
                    className="w-full bg-bg/50 border border-border/70 rounded-xl px-4 py-3 text-sm font-semibold text-text focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-text/80 mb-2">
                    Submit Button Label
                  </label>
                  <input
                    type="text"
                    name="submitBtnText"
                    value={formData.submitBtnText}
                    onChange={handleChange}
                    placeholder="Submit Message"
                    className="w-full bg-bg/50 border border-border/70 rounded-xl px-4 py-3 text-sm font-semibold text-text focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition"
                  />
                </div>
              </div>

              {/* Social Links Grid */}
              <div className="grid sm:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-xs font-semibold text-text/80 mb-1.5 flex items-center gap-1.5">
                    <FiFacebook className="text-blue-500" /> Facebook Link
                  </label>
                  <input
                    type="url"
                    name="facebookUrl"
                    value={formData.facebookUrl}
                    onChange={handleChange}
                    placeholder="https://facebook.com/..."
                    className="w-full bg-bg/50 border border-border/70 rounded-xl px-4 py-2.5 text-xs text-text focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-text/80 mb-1.5 flex items-center gap-1.5">
                    <FiTwitter className="text-sky-400" /> Twitter / X Link
                  </label>
                  <input
                    type="url"
                    name="twitterUrl"
                    value={formData.twitterUrl}
                    onChange={handleChange}
                    placeholder="https://twitter.com/..."
                    className="w-full bg-bg/50 border border-border/70 rounded-xl px-4 py-2.5 text-xs text-text focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-text/80 mb-1.5 flex items-center gap-1.5">
                    <FiLinkedin className="text-blue-600" /> LinkedIn Link
                  </label>
                  <input
                    type="url"
                    name="linkedinUrl"
                    value={formData.linkedinUrl}
                    onChange={handleChange}
                    placeholder="https://linkedin.com/..."
                    className="w-full bg-bg/50 border border-border/70 rounded-xl px-4 py-2.5 text-xs text-text focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-text/80 mb-1.5 flex items-center gap-1.5">
                    <FiInstagram className="text-pink-500" /> Instagram Link
                  </label>
                  <input
                    type="url"
                    name="instagramUrl"
                    value={formData.instagramUrl}
                    onChange={handleChange}
                    placeholder="https://instagram.com/..."
                    className="w-full bg-bg/50 border border-border/70 rounded-xl px-4 py-2.5 text-xs text-text focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition"
                  />
                </div>
              </div>

              {/* Status Switch Card */}
              <div className="pt-4 border-t border-border/50">
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
                        <h4 className="font-semibold text-sm text-text">Contact Section Visibility</h4>
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
                        Toggle whether the Contact Us section is displayed on the live website.
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
        </div>

        {/* Right Live Preview Panel (5 cols) (Matching Screenshot!) */}
        <div className="lg:col-span-5 lg:sticky lg:top-6">
          <div className="bg-card border border-border/60 rounded-2xl p-5 md:p-6 shadow-xl backdrop-blur-md">
            {/* Header & Device Switcher */}
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-border/50">
              <div className="flex items-center gap-2">
                <FiEye className="text-primary text-lg" />
                <h3 className="text-base font-bold text-text">Live Preview</h3>
              </div>

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
              {/* Device Top Bar */}
              <div className="bg-slate-900 px-4 py-2 flex items-center justify-between border-b border-slate-800">
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                </div>
                <span className="text-[10px] text-slate-400 font-mono tracking-tight truncate max-w-[180px]">
                  emergesun.com/contact
                </span>
                <div className="flex items-center gap-1">
                  <span
                    className={`w-2 h-2 rounded-full ${formData.status ? "bg-emerald-400 animate-pulse" : "bg-rose-500"
                      }`}
                  />
                </div>
              </div>

              {/* Exact Mock Contact Section Canvas matching user's image! */}
              <div
                className={`relative bg-slate-50 text-slate-900 p-5 md:p-6 overflow-hidden min-h-[460px] flex flex-col justify-start transition-opacity ${!formData.status ? "opacity-40 grayscale" : ""
                  }`}
              >
                {/* 1. Top Hero Banner Box (Matching Light Curved Card in Image!) */}
                <div className="bg-emerald-50/60 border border-emerald-100 rounded-3xl p-6 text-center max-w-xl mx-auto mb-8 shadow-sm">
                  <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight mb-2">
                    {formData.heroTitle || "Get In Touch"}
                  </h2>
                  <p className="text-slate-600 text-xs md:text-sm leading-relaxed max-w-md mx-auto">
                    {formData.heroSubtitle}
                  </p>
                </div>

                {/* 2. Grid: Contact Information (Left) vs Send Us a Message Form Card (Right) */}
                <div className={`grid gap-6 items-start ${previewMode === "desktop" ? "grid-cols-12" : "grid-cols-1"}`}>
                  {/* Left Column: Contact Information */}
                  <div className={previewMode === "desktop" ? "col-span-6 space-y-4" : "space-y-4"}>
                    <div>
                      <h3 className="text-lg font-black text-slate-900 tracking-tight">
                        {formData.sectionTitle || "Contact Information"}
                      </h3>
                      {formData.sectionDesc && (
                        <p className="text-slate-500 text-xs leading-relaxed mt-1">
                          {formData.sectionDesc}
                        </p>
                      )}
                    </div>

                    <div className="space-y-4 pt-1">
                      {/* Office */}
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-100/80 text-blue-600 flex items-center justify-center shrink-0 mt-0.5">
                          <FiMapPin className="text-xs" />
                        </div>
                        <div>
                          <h5 className="text-xs font-bold text-slate-900">Our Office</h5>
                          <p className="text-slate-600 text-[11px] leading-snug">
                            {formData.officeAddress}
                          </p>
                        </div>
                      </div>

                      {/* Phone */}
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-100/80 text-blue-600 flex items-center justify-center shrink-0 mt-0.5">
                          <FiPhone className="text-xs" />
                        </div>
                        <div>
                          <h5 className="text-xs font-bold text-slate-900">Phone Number</h5>
                          <p className="text-slate-600 text-[11px]">
                            {formData.phone1}
                          </p>
                          {formData.phone2 && (
                            <p className="text-slate-600 text-[11px]">{formData.phone2}</p>
                          )}
                        </div>
                      </div>

                      {/* Email */}
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-100/80 text-blue-600 flex items-center justify-center shrink-0 mt-0.5">
                          <FiMail className="text-xs" />
                        </div>
                        <div>
                          <h5 className="text-xs font-bold text-slate-900">Email Address</h5>
                          <p className="text-slate-600 text-[11px]">
                            {formData.email1}
                          </p>
                          {formData.email2 && (
                            <p className="text-slate-600 text-[11px]">{formData.email2}</p>
                          )}
                        </div>
                      </div>

                      {/* Business Hours */}
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-100/80 text-blue-600 flex items-center justify-center shrink-0 mt-0.5">
                          <FiClock className="text-xs" />
                        </div>
                        <div>
                          <h5 className="text-xs font-bold text-slate-900">Business Hours</h5>
                          <div className="text-slate-600 text-[11px] whitespace-pre-line leading-relaxed">
                            {formData.businessHours}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Social Media Links */}
                    <div className="pt-2">
                      <h5 className="text-[11px] font-bold text-slate-800 mb-2">Follow Us</h5>
                      <div className="flex items-center gap-2">
                        {formData.facebookUrl && (
                          <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs cursor-pointer hover:bg-blue-600 hover:text-white transition">
                            <FiFacebook className="text-xs" />
                          </div>
                        )}
                        {formData.twitterUrl && (
                          <div className="w-7 h-7 rounded-full bg-sky-100 text-sky-500 flex items-center justify-center text-xs cursor-pointer hover:bg-sky-500 hover:text-white transition">
                            <FiTwitter className="text-xs" />
                          </div>
                        )}
                        {formData.linkedinUrl && (
                          <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs cursor-pointer hover:bg-blue-700 hover:text-white transition">
                            <FiLinkedin className="text-xs" />
                          </div>
                        )}
                        {formData.instagramUrl && (
                          <div className="w-7 h-7 rounded-full bg-pink-100 text-pink-600 flex items-center justify-center text-xs cursor-pointer hover:bg-pink-600 hover:text-white transition">
                            <FiInstagram className="text-xs" />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Send Us a Message Form Card */}
                  <div className={previewMode === "desktop" ? "col-span-6 bg-white rounded-2xl p-5 border border-slate-200 shadow-md space-y-3" : "bg-white rounded-xl p-4 border border-slate-200 shadow-md space-y-3"}>
                    <h4 className="font-extrabold text-sm text-slate-900">
                      {formData.formTitle || "Send us a Message"}
                    </h4>

                    <div className="space-y-2.5">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-700 mb-1">Full Name</label>
                          <input
                            type="text"
                            disabled
                            placeholder="Enter your full name"
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-[10px] pointer-events-none"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-700 mb-1">Email Address</label>
                          <input
                            type="email"
                            disabled
                            placeholder="Enter your email"
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-[10px] pointer-events-none"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-700 mb-1">Phone Number</label>
                          <input
                            type="text"
                            disabled
                            placeholder="Enter your phone number"
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-[10px] pointer-events-none"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-700 mb-1">Subject</label>
                          <input
                            type="text"
                            disabled
                            placeholder="Enter message subject"
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-[10px] pointer-events-none"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-700 mb-1">Message</label>
                        <textarea
                          rows={3}
                          disabled
                          placeholder="Tell us about your solar needs..."
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-[10px] resize-none pointer-events-none"
                        />
                      </div>

                      <button
                        type="button"
                        disabled
                        className="w-full bg-blue-600 text-white text-xs font-bold py-2 rounded-lg shadow-md flex items-center justify-center gap-1.5 pointer-events-none"
                      >
                        <FiSend className="text-xs" />
                        <span>{formData.submitBtnText || "Submit Message"}</span>
                      </button>
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
      </form>
    </div>
  );
}

export default ContactConfig;
