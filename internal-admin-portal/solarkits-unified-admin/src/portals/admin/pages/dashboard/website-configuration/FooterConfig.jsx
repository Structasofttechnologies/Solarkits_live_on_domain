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
  FiFacebook,
  FiTwitter,
  FiLinkedin,
  FiInstagram,
  FiPlus,
  FiTrash2,
  FiSun,
  FiLayout
} from "react-icons/fi";
import { HiSparkles, HiOutlineTemplate } from "react-icons/hi";

const DEFAULT_QUICK_LINKS = [
  { id: "q-1", label: "Services", url: "/services" },
  { id: "q-2", label: "About Us", url: "/about" },
  { id: "q-3", label: "Contact", url: "/contact" },
  { id: "q-4", label: "FAQ", url: "/faq" }
];

const DEFAULT_CONFIG = {
  brandName: "SolarKits",
  tagline: "Your partner in sustainable energy since 2020.",
  quickLinksTitle: "Quick Links",
  quickLinks: DEFAULT_QUICK_LINKS,
  contactTitle: "Contact",
  address: "123 Solar Ave, Green City, 45678",
  email: "info@solarsolutions.com",
  phone: "+91 98765 43210",
  facebookUrl: "https://facebook.com",
  instagramUrl: "https://instagram.com",
  twitterUrl: "https://twitter.com",
  linkedinUrl: "https://linkedin.com",
  copyrightText: "© 2026 Solar Solutions. All rights reserved.",
  status: true
};

const BASE_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

function FooterConfig() {
  const [formData, setFormData] = useState(DEFAULT_CONFIG);
  const [previewMode, setPreviewMode] = useState("desktop"); // "desktop" | "mobile"
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Quick link inputs state
  const [newLinkLabel, setNewLinkLabel] = useState("");
  const [newLinkUrl, setNewLinkUrl] = useState("");

  useEffect(() => {
    fetchFooterInfo();
  }, []);

  const fetchFooterInfo = async () => {
    try {
      // API Call: GET /api/website/v1/footer/get - Fetch Footer configuration
      const response = await axios.get(
        `${BASE_URL}/api/website/v1/footer/get?t=${Date.now()}`
      );
      if (response.data?.data) {
        setFormData((prev) => ({ ...prev, ...response.data.data }));
      }
    } catch (error) {
      console.log("Using default footer configuration or API pending:", error.message);
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

  const handleAddQuickLink = () => {
    if (!newLinkLabel.trim()) return;
    const newLink = {
      id: `q-${Date.now()}`,
      label: newLinkLabel.trim(),
      url: newLinkUrl.trim() || `/${newLinkLabel.toLowerCase().replace(/\s+/g, "-")}`
    };
    setFormData((prev) => ({
      ...prev,
      quickLinks: [...prev.quickLinks, newLink]
    }));
    setNewLinkLabel("");
    setNewLinkUrl("");
    setSavedSuccess(false);
  };

  const handleDeleteQuickLink = (linkId) => {
    setFormData((prev) => ({
      ...prev,
      quickLinks: prev.quickLinks.filter((l) => l.id !== linkId)
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
        // API Call: PATCH /api/website/v1/footer/update/:id - Update Footer configuration
        response = await axios.patch(
          `${BASE_URL}/api/website/v1/footer/update/${formData._id}`,
          formData
        );
      } else {
        // API Call: POST /api/website/v1/footer/create - Create Footer configuration
        response = await axios.post(
          `${BASE_URL}/api/website/v1/footer/create`,
          formData
        );
      }

      if (response.data?.data) {
        setFormData((prev) => ({ ...prev, ...response.data.data }));
      }
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 4000);
    } catch (error) {
      console.error("Failed to save footer configuration:", error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen pb-12">
      {/* Page Header */}
      <PageHeader
        title="Footer Configuration"
        subtitle="Manage footer brand logo, tagline, quick links, contact info, social handles, and copyright notice."
        icon={HiOutlineTemplate}
        stats={[
          {
            label: "Status",
            value: formData.status ? "Active" : "Disabled",
            description: formData.status ? "Visible on live site" : "Hidden from site"
          },
          {
            label: "Quick Links",
            value: `${formData.quickLinks.length} Links`,
            description: "Navigation items"
          },
          {
            label: "Brand Name",
            value: formData.brandName || "SolarKits",
            description: "Footer brand title"
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
                <p className="font-semibold text-sm">Footer configuration saved successfully!</p>
                <p className="text-xs opacity-80">Your website footer details have been updated live.</p>
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
          {/* Card 1: Brand Logo & Tagline */}
          <div className="bg-card border border-border/60 rounded-2xl p-6 md:p-8 shadow-xl backdrop-blur-md relative overflow-hidden">
            <div className="flex items-center justify-between pb-5 mb-6 border-b border-border/50">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
                  <HiSparkles className="text-xl" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-text">Brand & Tagline</h2>
                  <p className="text-xs text-text/60">Configure company title and footer tagline text</p>
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
              {/* Brand Name */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-text/80 flex items-center gap-1.5">
                    <FiType className="text-primary text-sm" /> Brand Name
                  </label>
                  <span className="text-[11px] text-text/40">{formData.brandName.length} / 40</span>
                </div>
                <input
                  type="text"
                  name="brandName"
                  value={formData.brandName}
                  onChange={handleChange}
                  maxLength={40}
                  placeholder="e.g. SolarKits"
                  className="w-full bg-bg/50 border border-border/70 rounded-xl px-4 py-3 text-sm font-semibold text-text focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition"
                />
              </div>

              {/* Tagline */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-text/80 flex items-center gap-1.5">
                    <FiInfo className="text-primary text-sm" /> Tagline / Bio Text
                  </label>
                  <span className="text-[11px] text-text/40">{formData.tagline.length} / 120</span>
                </div>
                <input
                  type="text"
                  name="tagline"
                  value={formData.tagline}
                  onChange={handleChange}
                  maxLength={120}
                  placeholder="e.g. Your partner in sustainable energy since 2020."
                  className="w-full bg-bg/50 border border-border/70 rounded-xl px-4 py-3 text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition"
                />
              </div>
            </div>
          </div>

          {/* Card 2: Quick Links Management */}
          <div className="bg-card border border-border/60 rounded-2xl p-6 md:p-8 shadow-xl backdrop-blur-md relative overflow-hidden">
            <div className="flex items-center justify-between pb-5 mb-6 border-b border-border/50">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
                  <FiLayout className="text-xl" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-text">Quick Links Menu</h2>
                  <p className="text-xs text-text/60">Customize footer navigation links</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              {/* Column Title */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-text/80 mb-2">
                  Column Title
                </label>
                <input
                  type="text"
                  name="quickLinksTitle"
                  value={formData.quickLinksTitle}
                  onChange={handleChange}
                  placeholder="e.g. Quick Links"
                  className="w-full bg-bg/50 border border-border/70 rounded-xl px-4 py-3 text-sm font-semibold text-text focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition"
                />
              </div>

              {/* Add New Link Bar */}
              <div className="grid sm:grid-cols-12 gap-2 pt-2">
                <div className="sm:col-span-5">
                  <input
                    type="text"
                    value={newLinkLabel}
                    onChange={(e) => setNewLinkLabel(e.target.value)}
                    placeholder="Link Label (e.g. FAQ)"
                    className="w-full bg-bg/50 border border-border/70 rounded-xl px-3.5 py-2.5 text-xs text-text focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition"
                  />
                </div>
                <div className="sm:col-span-5">
                  <input
                    type="text"
                    value={newLinkUrl}
                    onChange={(e) => setNewLinkUrl(e.target.value)}
                    placeholder="URL (e.g. /faq)"
                    className="w-full bg-bg/50 border border-border/70 rounded-xl px-3.5 py-2.5 text-xs text-text focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition"
                  />
                </div>
                <div className="sm:col-span-2">
                  <button
                    type="button"
                    onClick={handleAddQuickLink}
                    className="w-full bg-primary hover:bg-primary/90 text-white font-bold text-xs py-2.5 rounded-xl transition flex items-center justify-center gap-1 shadow-md shadow-primary/20"
                  >
                    <FiPlus className="text-sm" /> Add
                  </button>
                </div>
              </div>

              {/* Existing Quick Links List */}
              <div className="space-y-2 pt-2">
                {formData.quickLinks.map((link) => (
                  <div
                    key={link.id}
                    className="flex items-center justify-between p-3 bg-bg/50 border border-border/60 rounded-xl"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-bold text-text">{link.label}</span>
                      <span className="text-[11px] text-text/40 font-mono">{link.url}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDeleteQuickLink(link.id)}
                      className="text-rose-500 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-500/10 transition text-xs"
                      title="Remove link"
                    >
                      <FiTrash2 />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Card 3: Contact Details & Social Links */}
          <div className="bg-card border border-border/60 rounded-2xl p-6 md:p-8 shadow-xl backdrop-blur-md relative overflow-hidden">
            <div className="flex items-center justify-between pb-5 mb-6 border-b border-border/50">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
                  <FiMail className="text-xl" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-text">Footer Contact & Socials</h2>
                  <p className="text-xs text-text/60">Configure address, email, phone & social media icons</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              {/* Contact Column Title */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-text/80 mb-2">
                  Contact Column Title
                </label>
                <input
                  type="text"
                  name="contactTitle"
                  value={formData.contactTitle}
                  onChange={handleChange}
                  placeholder="e.g. Contact"
                  className="w-full bg-bg/50 border border-border/70 rounded-xl px-4 py-3 text-sm font-semibold text-text focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition"
                />
              </div>

              {/* Address, Email, Phone */}
              <div>
                <label className="block text-xs font-semibold text-text/80 mb-1.5 flex items-center gap-1.5">
                  <FiMapPin className="text-primary" /> Office Address
                </label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="123 Solar Ave, Green City, 45678"
                  className="w-full bg-bg/50 border border-border/70 rounded-xl px-4 py-2.5 text-xs text-text focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition"
                />
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-text/80 mb-1.5 flex items-center gap-1.5">
                    <FiMail className="text-primary" /> Contact Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="info@solarsolutions.com"
                    className="w-full bg-bg/50 border border-border/70 rounded-xl px-4 py-2.5 text-xs text-text focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-text/80 mb-1.5 flex items-center gap-1.5">
                    <FiPhone className="text-primary" /> Contact Phone
                  </label>
                  <input
                    type="text"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="+91 98765 43210"
                    className="w-full bg-bg/50 border border-border/70 rounded-xl px-4 py-2.5 text-xs text-text focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition"
                  />
                </div>
              </div>

              {/* Social Links */}
              <div className="grid sm:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-xs font-semibold text-text/80 mb-1.5 flex items-center gap-1.5">
                    <FiFacebook className="text-blue-500" /> Facebook URL
                  </label>
                  <input
                    type="url"
                    name="facebookUrl"
                    value={formData.facebookUrl}
                    onChange={handleChange}
                    placeholder="https://facebook.com"
                    className="w-full bg-bg/50 border border-border/70 rounded-xl px-4 py-2.5 text-xs text-text focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-text/80 mb-1.5 flex items-center gap-1.5">
                    <FiInstagram className="text-pink-500" /> Instagram URL
                  </label>
                  <input
                    type="url"
                    name="instagramUrl"
                    value={formData.instagramUrl}
                    onChange={handleChange}
                    placeholder="https://instagram.com"
                    className="w-full bg-bg/50 border border-border/70 rounded-xl px-4 py-2.5 text-xs text-text focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-text/80 mb-1.5 flex items-center gap-1.5">
                    <FiTwitter className="text-sky-400" /> Twitter / X URL
                  </label>
                  <input
                    type="url"
                    name="twitterUrl"
                    value={formData.twitterUrl}
                    onChange={handleChange}
                    placeholder="https://twitter.com"
                    className="w-full bg-bg/50 border border-border/70 rounded-xl px-4 py-2.5 text-xs text-text focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-text/80 mb-1.5 flex items-center gap-1.5">
                    <FiLinkedin className="text-blue-600" /> LinkedIn URL
                  </label>
                  <input
                    type="url"
                    name="linkedinUrl"
                    value={formData.linkedinUrl}
                    onChange={handleChange}
                    placeholder="https://linkedin.com"
                    className="w-full bg-bg/50 border border-border/70 rounded-xl px-4 py-2.5 text-xs text-text focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition"
                  />
                </div>
              </div>

              {/* Copyright Text */}
              <div className="pt-2">
                <label className="block text-xs font-semibold uppercase tracking-wider text-text/80 mb-2">
                  Copyright Notice Text
                </label>
                <input
                  type="text"
                  name="copyrightText"
                  value={formData.copyrightText}
                  onChange={handleChange}
                  placeholder="© 2026 Solar Solutions. All rights reserved."
                  className="w-full bg-bg/50 border border-border/70 rounded-xl px-4 py-3 text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition"
                />
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
                        <h4 className="font-semibold text-sm text-text">Footer Visibility</h4>
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
                        Toggle whether the website footer is displayed.
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

        {/* Right Live Preview Panel (5 cols) (Exact Match of User Screenshot!) */}
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

            {/* Viewport Canvas (Dark Theme Footer matching user image!) */}
            <div
              className={`mx-auto transition-all duration-300 overflow-hidden ${previewMode === "mobile"
                  ? "max-w-[320px] rounded-3xl border-4 border-slate-800 shadow-2xl"
                  : "w-full rounded-2xl border border-slate-800"
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
                  solarkits.com
                </span>
                <div className="flex items-center gap-1">
                  <span
                    className={`w-2 h-2 rounded-full ${formData.status ? "bg-emerald-400 animate-pulse" : "bg-rose-500"
                      }`}
                  />
                </div>
              </div>

              {/* Exact Dark Navy Footer Canvas matching user screenshot! */}
              <div
                className={`relative bg-[#0B0F19] text-white p-6 md:p-8 overflow-hidden min-h-[360px] flex flex-col justify-between transition-opacity ${!formData.status ? "opacity-40 grayscale" : ""
                  }`}
              >
                {/* Footer Main Grid */}
                <div
                  className={`grid gap-6 items-start ${previewMode === "desktop" ? "grid-cols-12" : "grid-cols-1"
                    }`}
                >
                  {/* Column 1: Logo, Tagline, Social Icons */}
                  <div className={previewMode === "desktop" ? "col-span-5 space-y-4" : "space-y-3"}>
                    {/* Brand Logo */}
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-white text-slate-900 flex items-center justify-center">
                        <FiSun className="text-xs text-slate-900" />
                      </div>
                      <span className="font-extrabold text-sm text-white tracking-tight">
                        {formData.brandName || "SolarKits"}
                      </span>
                    </div>

                    {/* Tagline */}
                    <p className="text-slate-400 text-xs leading-relaxed max-w-xs">
                      {formData.tagline}
                    </p>

                    {/* Round Colorful Social Media Icons (Exact Match of Screenshot!) */}
                    <div className="flex items-center gap-2 pt-1">
                      {formData.facebookUrl && (
                        <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold shadow-md cursor-pointer hover:scale-110 transition">
                          <FiFacebook className="text-xs" />
                        </div>
                      )}
                      {formData.instagramUrl && (
                        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 text-white flex items-center justify-center text-xs font-bold shadow-md cursor-pointer hover:scale-110 transition">
                          <FiInstagram className="text-xs" />
                        </div>
                      )}
                      {formData.twitterUrl && (
                        <div className="w-8 h-8 rounded-full bg-sky-500 text-white flex items-center justify-center text-xs font-bold shadow-md cursor-pointer hover:scale-110 transition">
                          <FiTwitter className="text-xs" />
                        </div>
                      )}
                      {formData.linkedinUrl && (
                        <div className="w-8 h-8 rounded-full bg-blue-700 text-white flex items-center justify-center text-xs font-bold shadow-md cursor-pointer hover:scale-110 transition">
                          <FiLinkedin className="text-xs" />
                        </div>
                      )}
                      <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-rose-500 to-amber-500 text-white flex items-center justify-center text-xs font-bold shadow-md cursor-pointer hover:scale-110 transition">
                        <FiInstagram className="text-xs" />
                      </div>
                    </div>
                  </div>

                  {/* Column 2: Quick Links */}
                  <div className={previewMode === "desktop" ? "col-span-3 space-y-2.5" : "space-y-2"}>
                    <h4 className="font-extrabold text-xs text-white uppercase tracking-wider">
                      {formData.quickLinksTitle || "Quick Links"}
                    </h4>
                    <ul className="space-y-2 text-xs text-slate-400 font-medium">
                      {formData.quickLinks.map((link) => (
                        <li key={link.id} className="hover:text-white transition cursor-pointer">
                          {link.label}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Column 3: Contact Details */}
                  <div className={previewMode === "desktop" ? "col-span-4 space-y-2.5" : "space-y-2"}>
                    <h4 className="font-extrabold text-xs text-white uppercase tracking-wider">
                      {formData.contactTitle || "Contact"}
                    </h4>
                    <div className="space-y-2 text-xs text-slate-400 font-medium">
                      {formData.address && (
                        <div className="flex items-start gap-2">
                          <FiMapPin className="text-xs text-slate-400 shrink-0 mt-0.5" />
                          <span>{formData.address}</span>
                        </div>
                      )}
                      {formData.email && (
                        <div className="flex items-center gap-2">
                          <FiMail className="text-xs text-slate-400 shrink-0" />
                          <span>{formData.email}</span>
                        </div>
                      )}
                      {formData.phone && (
                        <div className="flex items-center gap-2">
                          <FiPhone className="text-xs text-slate-400 shrink-0" />
                          <span>{formData.phone}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Bottom Divider & Copyright Notice */}
                <div className="pt-6 mt-6 border-t border-slate-800/80 text-center">
                  <p className="text-[11px] text-slate-500 font-medium">
                    {formData.copyrightText}
                  </p>
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

export default FooterConfig;
