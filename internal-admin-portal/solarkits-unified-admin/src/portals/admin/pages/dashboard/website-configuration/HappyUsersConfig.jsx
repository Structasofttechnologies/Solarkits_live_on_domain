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
  FiEdit2,
  FiTrash2,
  FiPlus,
  FiGrid,
  FiUploadCloud,
  FiShield,
  FiTag,
  FiType,
  FiLayers,
  FiX,
  FiUserCheck,
  FiStar,
  FiAward
} from "react-icons/fi";
import { HiSparkles, HiUsers } from "react-icons/hi";
import {
  FaUsers,
  FaBriefcase,
  FaSun,
  FaChartBar,
  FaWallet,
  FaShoppingCart,
  FaIndustry,
  FaShieldAlt,
  FaCheckCircle,
  FaAward,
  FaSmile
} from "react-icons/fa";

const AVAILABLE_ICONS = [
  { name: "Users", label: "Users / People", icon: FaUsers },
  { name: "Briefcase", label: "Briefcase / Companies", icon: FaBriefcase },
  { name: "Sun", label: "Sun / Solar", icon: FaSun },
  { name: "BarChart3", label: "Chart / Analytics", icon: FaChartBar },
  { name: "Wallet", label: "Wallet / Finance", icon: FaWallet },
  { name: "ShoppingCart", label: "Cart / Procurement", icon: FaShoppingCart },
  { name: "Factory", label: "Factory / Production", icon: FaIndustry },
  { name: "ShieldCheck", label: "Shield / Security", icon: FaShieldAlt },
  { name: "CheckCircle", label: "Check Circle", icon: FaCheckCircle },
  { name: "Award", label: "Award / Trophy", icon: FaAward },
  { name: "Smile", label: "Smile / Happy", icon: FaSmile },
];

const COLOR_OPTIONS = [
  { label: "Blue", value: "text-blue-500 bg-blue-50" },
  { label: "Green", value: "text-green-500 bg-green-50" },
  { label: "Orange", value: "text-orange-500 bg-orange-50" },
  { label: "Purple", value: "text-purple-500 bg-purple-50" },
  { label: "Teal", value: "text-teal-500 bg-teal-50" },
  { label: "Red", value: "text-red-500 bg-red-50" },
  { label: "Indigo", value: "text-indigo-500 bg-indigo-50" },
  { label: "Pink", value: "text-pink-500 bg-pink-50" },
];

const INITIAL_STATS = [
  { id: "stat-1", order: 1, label: "Active Users", value: "5000+", icon: "Users", color: "text-blue-500 bg-blue-50", status: "Active" },
  { id: "stat-2", order: 2, label: "Companies", value: "1000+", icon: "Briefcase", color: "text-green-500 bg-green-50", status: "Active" },
  { id: "stat-3", order: 3, label: "Projects Managed", value: "15000+", icon: "Sun", color: "text-orange-500 bg-orange-50", status: "Active" },
  { id: "stat-4", order: 4, label: "MW Installed", value: "500+", icon: "BarChart3", color: "text-purple-500 bg-purple-50", status: "Active" }
];

const INITIAL_TESTIMONIALS = [
  { id: "test-1", order: 1, name: "Rajesh Kumar", company: "SunPower Solutions", position: "CEO", testimonial: "This ERP system has transformed our solar business completely. We've seen a 40% increase in operational efficiency.", status: "Active" },
  { id: "test-2", order: 2, name: "Priya Sharma", company: "Green Energy Systems", position: "Operations Director", testimonial: "The solar-specific features like panel performance tracking and installation scheduling have made our workflow seamless.", status: "Active" }
];

const INITIAL_COMPANIES = [
  "Tata Power Solar",
  "Adani Green",
  "Waaree",
  "Vikram Solar",
  "Solex Energy",
  "Renew Power"
];

const DEFAULT_CONFIG = {
  sectionTitle: "Our Happy Users",
  subTitle: "Trusted by solar businesses across India",
  enableSection: true,
  stats: INITIAL_STATS,
  testimonials: INITIAL_TESTIMONIALS,
  trustedCompanies: INITIAL_COMPANIES,
  lastUpdated: new Date().toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" })
};

const BASE_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

export default function HappyUsersConfig() {
  const [formData, setFormData] = useState(DEFAULT_CONFIG);
  const [activeTab, setActiveTab] = useState("stats"); // "stats" | "testimonials" | "companies"
  const [previewMode, setPreviewMode] = useState("desktop"); // "desktop" | "mobile"
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [newCompanyInput, setNewCompanyInput] = useState("");

  // Stat Modal state
  const [isStatModalOpen, setIsStatModalOpen] = useState(false);
  const [editingStat, setEditingStat] = useState(null);
  const [statForm, setStatForm] = useState({
    label: "",
    value: "",
    icon: "Users",
    color: "text-blue-500 bg-blue-50",
    order: 1,
    status: "Active"
  });

  // Testimonial Modal state
  const [isTestimonialModalOpen, setIsTestimonialModalOpen] = useState(false);
  const [editingTestimonial, setEditingTestimonial] = useState(null);
  const [testimonialForm, setTestimonialForm] = useState({
    name: "",
    company: "",
    position: "",
    testimonial: "",
    order: 1,
    status: "Active"
  });

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      // API Call: GET /api/website/v1/happy-users/get - Fetch Happy Users configuration
      const response = await axios.get(`${BASE_URL}/api/website/v1/happy-users/get?t=${Date.now()}`);
      if (response.data?.data) {
        setFormData((prev) => ({
          ...prev,
          ...response.data.data,
          stats: Array.isArray(response.data.data.stats) && response.data.data.stats.length > 0
            ? response.data.data.stats
            : INITIAL_STATS,
          testimonials: Array.isArray(response.data.data.testimonials) && response.data.data.testimonials.length > 0
            ? response.data.data.testimonials
            : INITIAL_TESTIMONIALS,
          trustedCompanies: Array.isArray(response.data.data.trustedCompanies) && response.data.data.trustedCompanies.length > 0
            ? response.data.data.trustedCompanies
            : INITIAL_COMPANIES
        }));
      }
    } catch (error) {
      console.log("Using default Happy Users configuration:", error.message);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value
    }));
  };

  // Stat handlers
  const openStatModal = (stat = null) => {
    if (stat) {
      setEditingStat(stat);
      setStatForm({ ...stat });
    } else {
      setEditingStat(null);
      setStatForm({
        label: "",
        value: "",
        icon: "Users",
        color: "text-blue-500 bg-blue-50",
        order: (formData.stats?.length || 0) + 1,
        status: "Active"
      });
    }
    setIsStatModalOpen(true);
  };

  const saveStatModal = (e) => {
    e.preventDefault();
    if (!statForm.label || !statForm.value) return;

    if (editingStat) {
      setFormData((prev) => ({
        ...prev,
        stats: prev.stats.map((item) =>
          item.id === editingStat.id ? { ...statForm, id: item.id } : item
        )
      }));
    } else {
      const newStat = {
        ...statForm,
        id: `stat-${Date.now()}`
      };
      setFormData((prev) => ({
        ...prev,
        stats: [...prev.stats, newStat]
      }));
    }
    setIsStatModalOpen(false);
  };

  const deleteStat = (id) => {
    if (window.confirm("Are you sure you want to delete this stat card?")) {
      setFormData((prev) => ({
        ...prev,
        stats: prev.stats.filter((item) => item.id !== id)
      }));
    }
  };

  const toggleStatStatus = (id) => {
    setFormData((prev) => ({
      ...prev,
      stats: prev.stats.map((item) =>
        item.id === id
          ? { ...item, status: item.status === "Active" ? "Inactive" : "Active" }
          : item
      )
    }));
  };

  // Testimonial handlers
  const openTestimonialModal = (item = null) => {
    if (item) {
      setEditingTestimonial(item);
      setTestimonialForm({ ...item });
    } else {
      setEditingTestimonial(null);
      setTestimonialForm({
        name: "",
        company: "",
        position: "",
        testimonial: "",
        order: (formData.testimonials?.length || 0) + 1,
        status: "Active"
      });
    }
    setIsTestimonialModalOpen(true);
  };

  const saveTestimonialModal = (e) => {
    e.preventDefault();
    if (!testimonialForm.name || !testimonialForm.testimonial) return;

    if (editingTestimonial) {
      setFormData((prev) => ({
        ...prev,
        testimonials: prev.testimonials.map((t) =>
          t.id === editingTestimonial.id ? { ...testimonialForm, id: t.id } : t
        )
      }));
    } else {
      const newTestimonial = {
        ...testimonialForm,
        id: `test-${Date.now()}`
      };
      setFormData((prev) => ({
        ...prev,
        testimonials: [...prev.testimonials, newTestimonial]
      }));
    }
    setIsTestimonialModalOpen(false);
  };

  const deleteTestimonial = (id) => {
    if (window.confirm("Are you sure you want to delete this testimonial?")) {
      setFormData((prev) => ({
        ...prev,
        testimonials: prev.testimonials.filter((t) => t.id !== id)
      }));
    }
  };

  const toggleTestimonialStatus = (id) => {
    setFormData((prev) => ({
      ...prev,
      testimonials: prev.testimonials.map((t) =>
        t.id === id
          ? { ...t, status: t.status === "Active" ? "Inactive" : "Active" }
          : t
      )
    }));
  };

  // Trusted Companies handlers
  const addCompany = () => {
    const trimmed = newCompanyInput.trim();
    if (trimmed && !formData.trustedCompanies.includes(trimmed)) {
      setFormData((prev) => ({
        ...prev,
        trustedCompanies: [...prev.trustedCompanies, trimmed]
      }));
      setNewCompanyInput("");
    }
  };

  const deleteCompany = (name) => {
    setFormData((prev) => ({
      ...prev,
      trustedCompanies: prev.trustedCompanies.filter((c) => c !== name)
    }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setSavedSuccess(false);

    const payload = {
      ...formData,
      lastUpdated: new Date().toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" })
    };

    try {
      // API Call: POST /api/website/v1/happy-users/save - Save/Update Happy Users configuration
      const response = await axios.post(`${BASE_URL}/api/website/v1/happy-users/save`, payload);
      if (response.data?.success) {
        setFormData((prev) => ({
          ...prev,
          ...response.data.data
        }));
        setSavedSuccess(true);
        setTimeout(() => setSavedSuccess(false), 3000);
      }
    } catch (error) {
      console.error("Failed to save Happy Users config:", error);
      alert("Failed to save configuration: " + (error.response?.data?.message || error.message));
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    if (window.confirm("Reset to default configuration?")) {
      setFormData(DEFAULT_CONFIG);
    }
  };

  const renderIcon = (iconName) => {
    const found = AVAILABLE_ICONS.find((i) => i.name === iconName);
    const Comp = found ? found.icon : FaUsers;
    return <Comp className="w-5 h-5" />;
  };

  return (
    <div className="min-h-screen pb-12">
      <PageHeader
        title="Website Configuration → Header → Happy Users"
        subTitle="Manage user stats, testimonials, and trusted brand logos displayed on the SolarKits website"
      />

      {/* Success alert banner */}
      <AnimatePresence>
        {savedSuccess && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mb-6 p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl flex items-center justify-between shadow-sm"
          >
            <div className="flex items-center space-x-3">
              <FiCheckCircle className="w-5 h-5 text-emerald-600" />
              <span className="font-semibold text-sm">
                Happy Users section configuration updated and published successfully!
              </span>
            </div>
            <span className="text-xs text-emerald-600 bg-emerald-100 px-2.5 py-1 rounded-md">
              Live on website
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Form Controls Column */}
        <div className="lg:col-span-7 space-y-6">
          <form onSubmit={handleSave} className="space-y-6">
            {/* Section Settings Header */}
            <div className="bg-card border border-border/60 rounded-2xl p-6 shadow-xl backdrop-blur-md space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-border/50">
                <div className="flex items-center space-x-2 text-text">
                  <HiUsers className="w-5 h-5 text-indigo-600" />
                  <h3 className="font-bold text-base">Section Settings</h3>
                </div>
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

              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-text/80 uppercase tracking-wider mb-1">
                    Section Main Title
                  </label>
                  <input
                    type="text"
                    name="sectionTitle"
                    value={formData.sectionTitle}
                    onChange={handleChange}
                    placeholder="e.g. Our Happy Users"
                    className="w-full px-3.5 py-2.5 bg-bg/50 border border-border/70 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-semibold text-text placeholder:text-text/40 shadow-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-text/80 uppercase tracking-wider mb-1">
                    Section Subtitle
                  </label>
                  <input
                    type="text"
                    name="subTitle"
                    value={formData.subTitle}
                    onChange={handleChange}
                    placeholder="e.g. Trusted by solar businesses across India"
                    className="w-full px-3.5 py-2.5 bg-bg/50 border border-border/70 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-semibold text-text placeholder:text-text/40 shadow-xs"
                  />
                </div>
              </div>
            </div>

            {/* Tabbed Content Management */}
            <div className="bg-card border border-border/60 rounded-2xl shadow-xl backdrop-blur-md overflow-hidden">
              <div className="flex border-b border-border/50 bg-bg/40 p-2 space-x-2">
                <button
                  type="button"
                  onClick={() => setActiveTab("stats")}
                  className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-2 ${
                    activeTab === "stats"
                      ? "bg-bg text-indigo-500 shadow-sm border border-border/60"
                      : "text-text/60 hover:text-text"
                  }`}
                >
                  <FiGrid className="w-4 h-4" />
                  <span>Stat Cards ({formData.stats?.length || 0})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("testimonials")}
                  className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-2 ${
                    activeTab === "testimonials"
                      ? "bg-bg text-indigo-500 shadow-sm border border-border/60"
                      : "text-text/60 hover:text-text"
                  }`}
                >
                  <FiStar className="w-4 h-4" />
                  <span>Testimonials ({formData.testimonials?.length || 0})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("companies")}
                  className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-2 ${
                    activeTab === "companies"
                      ? "bg-bg text-indigo-500 shadow-sm border border-border/60"
                      : "text-text/60 hover:text-text"
                  }`}
                >
                  <FiAward className="w-4 h-4" />
                  <span>Brands ({formData.trustedCompanies?.length || 0})</span>
                </button>
              </div>

              <div className="p-6">
                {/* TAB 1: STAT CARDS */}
                {activeTab === "stats" && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-text/60 font-medium">
                        Cards displayed in counter grid section
                      </span>
                      <button
                        type="button"
                        onClick={() => openStatModal()}
                        className="px-3 py-1.5 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-all"
                      >
                        <FiPlus className="w-3.5 h-3.5" />
                        <span>Add Stat Card</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {formData.stats?.map((stat) => (
                        <div
                          key={stat.id}
                          className="p-4 bg-bg/50 border border-border/70 rounded-xl flex items-center justify-between hover:border-indigo-500/40 transition-all"
                        >
                          <div className="flex items-center space-x-3">
                            <div className={`p-2.5 rounded-lg ${stat.color}`}>
                              {renderIcon(stat.icon)}
                            </div>
                            <div>
                              <div className="font-bold text-text text-sm">{stat.value}</div>
                              <div className="text-xs text-text/60 font-medium">{stat.label}</div>
                            </div>
                          </div>

                          <div className="flex items-center space-x-1">
                            <button
                              type="button"
                              onClick={() => toggleStatStatus(stat.id)}
                              className={`p-1.5 rounded-md text-xs font-semibold ${
                                stat.status === "Active"
                                  ? "text-emerald-600 bg-emerald-500/10 hover:bg-emerald-500/20"
                                  : "text-text/40 bg-bg hover:bg-border/30"
                              }`}
                            >
                              {stat.status}
                            </button>
                            <button
                              type="button"
                              onClick={() => openStatModal(stat)}
                              className="p-1.5 text-text/60 hover:text-indigo-600 hover:bg-bg rounded-md transition-all"
                            >
                              <FiEdit2 className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => deleteStat(stat.id)}
                              className="p-1.5 text-text/40 hover:text-rose-600 hover:bg-bg rounded-md transition-all"
                            >
                              <FiTrash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* TAB 2: TESTIMONIALS */}
                {activeTab === "testimonials" && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-text/60 font-medium">
                        Customer review quotes in carousel
                      </span>
                      <button
                        type="button"
                        onClick={() => openTestimonialModal()}
                        className="px-3 py-1.5 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-all"
                      >
                        <FiPlus className="w-3.5 h-3.5" />
                        <span>Add Testimonial</span>
                      </button>
                    </div>

                    <div className="space-y-3">
                      {formData.testimonials?.map((t) => (
                        <div
                          key={t.id}
                          className="p-4 bg-bg/50 border border-border/70 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-indigo-500/40 transition-all"
                        >
                          <div className="space-y-1">
                            <div className="flex items-center space-x-2">
                              <span className="font-bold text-text text-sm">{t.name}</span>
                              <span className="text-xs text-text/60 font-medium">
                                • {t.position}, {t.company}
                              </span>
                            </div>
                            <p className="text-xs text-text/60 italic line-clamp-2">"{t.testimonial}"</p>
                          </div>

                          <div className="flex items-center space-x-1 self-end sm:self-center">
                            <button
                              type="button"
                              onClick={() => toggleTestimonialStatus(t.id)}
                              className={`p-1.5 rounded-md text-xs font-semibold ${
                                t.status === "Active"
                                  ? "text-emerald-600 bg-emerald-500/10 hover:bg-emerald-500/20"
                                  : "text-text/40 bg-bg hover:bg-border/30"
                              }`}
                            >
                              {t.status}
                            </button>
                            <button
                              type="button"
                              onClick={() => openTestimonialModal(t)}
                              className="p-1.5 text-text/60 hover:text-indigo-600 hover:bg-bg rounded-md transition-all"
                            >
                              <FiEdit2 className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => deleteTestimonial(t.id)}
                              className="p-1.5 text-text/40 hover:text-rose-600 hover:bg-bg rounded-md transition-all"
                            >
                              <FiTrash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* TAB 3: TRUSTED BRAND COMPANIES */}
                {activeTab === "companies" && (
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={newCompanyInput}
                        onChange={(e) => setNewCompanyInput(e.target.value)}
                        placeholder="Add company name (e.g. Tata Power Solar)"
                        className="flex-1 px-3.5 py-2 bg-bg/50 border border-border/70 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-semibold text-text placeholder:text-text/40 shadow-xs"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            addCompany();
                          }
                        }}
                      />
                      <button
                        type="button"
                        onClick={addCompany}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 transition-all"
                      >
                        Add Brand
                      </button>
                    </div>

                    <div className="flex flex-wrap gap-2 pt-2">
                      {formData.trustedCompanies?.map((company) => (
                        <div
                          key={company}
                          className="px-3 py-1.5 bg-bg/50 border border-border/70 rounded-lg text-xs font-bold text-text/80 flex items-center space-x-2"
                        >
                          <span>{company}</span>
                          <button
                            type="button"
                            onClick={() => deleteCompany(company)}
                            className="text-text/40 hover:text-rose-600 transition-colors"
                          >
                            <FiX className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Action Bar */}
            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={handleReset}
                className="px-4 py-2.5 border border-border/80 text-text/70 hover:bg-bg/60 rounded-xl text-xs font-bold flex items-center space-x-2 transition-all"
              >
                <FiRotateCcw className="w-4 h-4" />
                <span>Reset Default</span>
              </button>

              <button
                type="submit"
                disabled={isSaving}
                className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white rounded-xl text-xs font-bold flex items-center space-x-2 shadow-md shadow-indigo-200 transition-all disabled:opacity-50"
              >
                <FiSave className="w-4 h-4" />
                <span>{isSaving ? "Saving Configuration..." : "Save Changes"}</span>
              </button>
            </div>
          </form>
        </div>

        {/* Live Preview Column */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-card rounded-2xl p-4 border border-border/60 shadow-xl backdrop-blur-md flex items-center justify-between">
            <div className="flex items-center space-x-2 text-text">
              <FiEye className="w-4 h-4 text-indigo-600" />
              <span className="font-bold text-xs uppercase tracking-wider">Live Section Preview</span>
            </div>

            <div className="flex items-center space-x-1 bg-bg/80 border border-border/50 p-1 rounded-lg">
              <button
                type="button"
                onClick={() => setPreviewMode("desktop")}
                className={`p-1.5 rounded-md text-xs font-semibold flex items-center space-x-1 transition-all ${
                  previewMode === "desktop" ? "bg-primary text-white shadow-sm" : "text-text/60 hover:text-text"
                }`}
              >
                <FiMonitor className="w-3.5 h-3.5" />
                <span>Desktop</span>
              </button>
              <button
                type="button"
                onClick={() => setPreviewMode("mobile")}
                className={`p-1.5 rounded-md text-xs font-semibold flex items-center space-x-1 transition-all ${
                  previewMode === "mobile" ? "bg-primary text-white shadow-sm" : "text-text/60 hover:text-text"
                }`}
              >
                <FiSmartphone className="w-3.5 h-3.5" />
                <span>Mobile</span>
              </button>
            </div>
          </div>

          {/* Device Mockup */}
          <div className="bg-slate-200/70 p-4 rounded-3xl border border-slate-300 flex justify-center overflow-hidden">
            <div
              className={`bg-gradient-to-br from-orange-50/80 via-white to-blue-50/80 rounded-2xl border border-slate-200 p-6 transition-all duration-300 shadow-inner overflow-y-auto ${
                previewMode === "mobile" ? "w-[320px] text-center" : "w-full text-center"
              }`}
              style={{ maxHeight: "680px" }}
            >
              {!formData.enableSection ? (
                <div className="p-8 text-center text-slate-400">
                  <FiXCircle className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                  <p className="text-xs font-bold uppercase tracking-wider">Section is Disabled</p>
                  <p className="text-[11px] mt-1">This section will not be visible on the public website.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Title & Subtitle */}
                  <div>
                    <h2 className="text-xl font-bold tracking-tight text-gray-800">
                      {formData.sectionTitle || "Our Happy Users"}
                    </h2>
                    <p className="mt-1 text-xs text-gray-600">
                      {formData.subTitle || "Trusted by solar businesses across India"}
                    </p>
                  </div>

                  {/* Stat Cards */}
                  <div
                    className={`grid gap-3 ${
                      previewMode === "mobile" ? "grid-cols-1" : "grid-cols-2"
                    }`}
                  >
                    {formData.stats
                      ?.filter((s) => s.status === "Active")
                      .map((stat) => (
                        <div
                          key={stat.id}
                          className="rounded-xl bg-white p-3 shadow-xs border border-gray-100 flex flex-col items-center"
                        >
                          <div className={`rounded-full p-2.5 ${stat.color}`}>
                            {renderIcon(stat.icon)}
                          </div>
                          <span className="mt-2 text-base font-extrabold text-gray-800">{stat.value}</span>
                          <span className="mt-0.5 text-[10px] font-semibold text-gray-500">{stat.label}</span>
                        </div>
                      ))}
                  </div>

                  {/* Testimonial Sample */}
                  {formData.testimonials?.filter((t) => t.status === "Active").length > 0 && (
                    <div className="rounded-xl bg-white p-4 shadow-xs border border-gray-100 text-center">
                      <div className="flex justify-center space-x-0.5 mb-2 text-amber-400">
                        {"★".repeat(5)}
                      </div>
                      <p className="text-xs italic text-gray-700">
                        "{formData.testimonials.filter((t) => t.status === "Active")[0]?.testimonial}"
                      </p>
                      <div className="mt-2 text-[11px]">
                        <span className="font-bold text-gray-900 block">
                          {formData.testimonials.filter((t) => t.status === "Active")[0]?.name}
                        </span>
                        <span className="text-gray-400 text-[10px]">
                          {formData.testimonials.filter((t) => t.status === "Active")[0]?.position},{" "}
                          {formData.testimonials.filter((t) => t.status === "Active")[0]?.company}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Trusted Companies */}
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                      Trusted by leading solar companies
                    </p>
                    <div className="mt-3 flex flex-wrap justify-center items-center gap-3 opacity-60">
                      {formData.trustedCompanies?.map((c) => (
                        <span key={c} className="text-xs font-black text-gray-500">
                          {c}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* STAT MODAL */}
      <AnimatePresence>
        {isStatModalOpen && (
          <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-card rounded-2xl shadow-xl w-full max-w-md border border-border/60 overflow-hidden"
            >
              <div className="p-5 border-b border-border/50 flex items-center justify-between">
                <h4 className="font-bold text-text text-sm">
                  {editingStat ? "Edit Stat Card" : "Add New Stat Card"}
                </h4>
                <button
                  onClick={() => setIsStatModalOpen(false)}
                  className="text-text/60 hover:text-text p-1"
                >
                  <FiX className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={saveStatModal} className="p-5 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-text/80 mb-1">
                    Label (e.g. Active Users)
                  </label>
                  <input
                    type="text"
                    required
                    value={statForm.label}
                    onChange={(e) => setStatForm({ ...statForm, label: e.target.value })}
                    className="w-full px-3 py-2 bg-bg/50 border border-border/70 rounded-lg text-sm font-semibold text-text focus:outline-none focus:border-indigo-500 shadow-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-text/80 mb-1">
                    Value (e.g. 5000+)
                  </label>
                  <input
                    type="text"
                    required
                    value={statForm.value}
                    onChange={(e) => setStatForm({ ...statForm, value: e.target.value })}
                    className="w-full px-3 py-2 bg-bg/50 border border-border/70 rounded-lg text-sm font-semibold text-text focus:outline-none focus:border-indigo-500 shadow-xs"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-text/80 mb-1">Icon</label>
                    <select
                      value={statForm.icon}
                      onChange={(e) => setStatForm({ ...statForm, icon: e.target.value })}
                      className="w-full px-3 py-2 bg-bg/50 border border-border/70 rounded-lg text-xs font-semibold text-text focus:outline-none focus:border-indigo-500 shadow-xs"
                    >
                      {AVAILABLE_ICONS.map((i) => (
                        <option key={i.name} value={i.name}>
                          {i.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-text/80 mb-1">Color Theme</label>
                    <select
                      value={statForm.color}
                      onChange={(e) => setStatForm({ ...statForm, color: e.target.value })}
                      className="w-full px-3 py-2 bg-bg/50 border border-border/70 rounded-lg text-xs font-semibold text-text focus:outline-none focus:border-indigo-500 shadow-xs"
                    >
                      {COLOR_OPTIONS.map((c) => (
                        <option key={c.label} value={c.value}>
                          {c.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-text/80 mb-1">Sort Order</label>
                    <input
                      type="number"
                      value={statForm.order}
                      onChange={(e) => setStatForm({ ...statForm, order: Number(e.target.value) })}
                      className="w-full px-3 py-2 bg-bg/50 border border-border/70 rounded-lg text-sm font-semibold text-text focus:outline-none focus:border-indigo-500 shadow-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-text/80 mb-1">Status</label>
                    <select
                      value={statForm.status}
                      onChange={(e) => setStatForm({ ...statForm, status: e.target.value })}
                      className="w-full px-3 py-2 bg-bg/50 border border-border/70 rounded-lg text-xs font-semibold text-text focus:outline-none focus:border-indigo-500 shadow-xs"
                    >
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </div>
                </div>

                <div className="pt-2 flex justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => setIsStatModalOpen(false)}
                    className="px-4 py-2 border border-border/80 rounded-lg text-xs font-bold text-text/70 hover:bg-bg/60"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-700"
                  >
                    Save Stat Card
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* TESTIMONIAL MODAL */}
      <AnimatePresence>
        {isTestimonialModalOpen && (
          <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-card rounded-2xl shadow-xl w-full max-w-md border border-border/60 overflow-hidden"
            >
              <div className="p-5 border-b border-border/50 flex items-center justify-between">
                <h4 className="font-bold text-text text-sm">
                  {editingTestimonial ? "Edit Testimonial" : "Add New Testimonial"}
                </h4>
                <button
                  onClick={() => setIsTestimonialModalOpen(false)}
                  className="text-text/60 hover:text-text p-1"
                >
                  <FiX className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={saveTestimonialModal} className="p-5 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-text/80 mb-1">
                    Customer Name
                  </label>
                  <input
                    type="text"
                    required
                    value={testimonialForm.name}
                    onChange={(e) => setTestimonialForm({ ...testimonialForm, name: e.target.value })}
                    className="w-full px-3 py-2 bg-bg/50 border border-border/70 rounded-lg text-sm font-semibold text-text focus:outline-none focus:border-indigo-500 shadow-xs"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-text/80 mb-1">Company</label>
                    <input
                      type="text"
                      value={testimonialForm.company}
                      onChange={(e) => setTestimonialForm({ ...testimonialForm, company: e.target.value })}
                      className="w-full px-3 py-2 bg-bg/50 border border-border/70 rounded-lg text-sm font-semibold text-text focus:outline-none focus:border-indigo-500 shadow-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-text/80 mb-1">Position</label>
                    <input
                      type="text"
                      value={testimonialForm.position}
                      onChange={(e) => setTestimonialForm({ ...testimonialForm, position: e.target.value })}
                      className="w-full px-3 py-2 bg-bg/50 border border-border/70 rounded-lg text-sm font-semibold text-text focus:outline-none focus:border-indigo-500 shadow-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-text/80 mb-1">Testimonial Quote</label>
                  <textarea
                    rows={3}
                    required
                    value={testimonialForm.testimonial}
                    onChange={(e) => setTestimonialForm({ ...testimonialForm, testimonial: e.target.value })}
                    className="w-full px-3 py-2 bg-bg/50 border border-border/70 rounded-lg text-sm font-semibold text-text focus:outline-none focus:border-indigo-500 shadow-xs"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-text/80 mb-1">Sort Order</label>
                    <input
                      type="number"
                      value={testimonialForm.order}
                      onChange={(e) => setTestimonialForm({ ...testimonialForm, order: Number(e.target.value) })}
                      className="w-full px-3 py-2 bg-bg/50 border border-border/70 rounded-lg text-sm font-semibold text-text focus:outline-none focus:border-indigo-500 shadow-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-text/80 mb-1">Status</label>
                    <select
                      value={testimonialForm.status}
                      onChange={(e) => setTestimonialForm({ ...testimonialForm, status: e.target.value })}
                      className="w-full px-3 py-2 bg-bg/50 border border-border/70 rounded-lg text-xs font-semibold text-text focus:outline-none focus:border-indigo-500 shadow-xs"
                    >
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </div>
                </div>

                <div className="pt-2 flex justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => setIsTestimonialModalOpen(false)}
                    className="px-4 py-2 border border-border/80 rounded-lg text-xs font-bold text-text/70 hover:bg-bg/60"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-700"
                  >
                    Save Testimonial
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
