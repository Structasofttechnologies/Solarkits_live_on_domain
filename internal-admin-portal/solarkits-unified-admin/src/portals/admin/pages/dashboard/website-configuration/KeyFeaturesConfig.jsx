import axios from "axios";
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import PageHeader from "@/components/PageHeader";
import {
  FiCheckCircle,
  FiXCircle,
  FiSmartphone,
  FiMonitor,
  FiEdit2,
  FiTrash2,
  FiPlus,
  FiGrid,
  FiX,
  FiStar,
  FiZap,
  FiShield,
  FiBarChart2,
  FiRefreshCw,
  FiHelpCircle,
  FiSmartphone as FiMobile,
  FiBookOpen,
  FiCloud,
  FiLock,
  FiSliders,
  FiCpu,
  FiCheckSquare
} from "react-icons/fi";
import { HiSparkles } from "react-icons/hi";

const AVAILABLE_ICONS = [
  { name: "CloudCheck", label: "Cloud", icon: FiCloud },
  { name: "ShieldCheck", label: "Security / Shield", icon: FiShield },
  { name: "BarChart3", label: "Analytics / Chart", icon: FiBarChart2 },
  { name: "RefreshCw", label: "Sync / Refresh", icon: FiRefreshCw },
  { name: "HelpCircle", label: "Support / Help", icon: FiHelpCircle },
  { name: "Sun", label: "Mobile / Device", icon: FiMobile },
  { name: "GraduationCap", label: "Training / Education", icon: FiBookOpen },
  { name: "Lock", label: "Lock / Safety", icon: FiLock },
  { name: "Sliders", label: "Sliders / Controls", icon: FiSliders },
  { name: "Cpu", label: "CPU / Tech", icon: FiCpu },
  { name: "CheckSquare", label: "Checkmark", icon: FiCheckSquare },
];

const COLOR_OPTIONS = [
  { label: "Blue", value: "bg-blue-50 text-blue-600" },
  { label: "Green", value: "bg-green-50 text-green-600" },
  { label: "Purple", value: "bg-purple-50 text-purple-600" },
  { label: "Orange", value: "bg-orange-50 text-orange-600" },
  { label: "Teal", value: "bg-teal-50 text-teal-600" },
  { label: "Indigo", value: "bg-indigo-50 text-indigo-600" },
  { label: "Amber", value: "bg-amber-50 text-amber-600" },
  { label: "Rose", value: "bg-rose-50 text-rose-600" },
  { label: "Emerald", value: "bg-emerald-50 text-emerald-600" },
];

const INITIAL_KEY_FEATURES = [
  { id: "feat-1", order: 1, title: "Cloud-Based", desc: "Access your business data anytime, anywhere from any device", icon: "CloudCheck", color: "bg-blue-50 text-blue-600", status: "Active" },
  { id: "feat-2", order: 2, title: "Enterprise Security", desc: "Bank-level security with role-based access control", icon: "ShieldCheck", color: "bg-green-50 text-green-600", status: "Active" },
  { id: "feat-3", order: 3, title: "Real-Time Analytics", desc: "Live dashboards and customizable reports", icon: "BarChart3", color: "bg-purple-50 text-purple-600", status: "Active" },
  { id: "feat-4", order: 4, title: "Seamless Integration", desc: "Integrates with third-party applications and services", icon: "RefreshCw", color: "bg-orange-50 text-orange-600", status: "Active" },
  { id: "feat-5", order: 5, title: "Scalable", desc: "Grows with your business from startup to enterprise", icon: "BarChart3", color: "bg-teal-50 text-teal-600", status: "Active" },
  { id: "feat-6", order: 6, title: "24/7 Support", desc: "Dedicated support team available round the clock", icon: "HelpCircle", color: "bg-indigo-50 text-indigo-600", status: "Active" },
  { id: "feat-7", order: 7, title: "Mobile App", desc: "Full-featured mobile application for on-the-go access", icon: "Sun", color: "bg-amber-50 text-amber-600", status: "Active" },
  { id: "feat-8", order: 8, title: "Regular Updates", desc: "Continuous improvements and new features", icon: "RefreshCw", color: "bg-rose-50 text-rose-600", status: "Active" },
  { id: "feat-9", order: 9, title: "Training Included", desc: "Comprehensive training and onboarding support", icon: "GraduationCap", color: "bg-emerald-50 text-emerald-600", status: "Active" }
];

const DEFAULT_CONFIG = {
  sectionTitle: "Key Features",
  subTitle: "Powerful capabilities to transform your business",
  enableSection: true,
  features: INITIAL_KEY_FEATURES,
  lastUpdated: new Date().toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" })
};

const BASE_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

export default function KeyFeaturesConfig() {
  const [formData, setFormData] = useState(DEFAULT_CONFIG);
  const [previewMode, setPreviewMode] = useState("desktop");
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFeature, setEditingFeature] = useState(null);
  const [modalForm, setModalForm] = useState({
    title: "",
    desc: "",
    icon: "CloudCheck",
    color: "bg-blue-50 text-blue-600",
    order: 1,
    status: "Active"
  });

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      // API Call: GET /api/website/v1/key-features/get - Fetch Key Features configuration
      const response = await axios.get(`${BASE_URL}/api/website/v1/key-features/get?t=${Date.now()}`);
      if (response.data?.data) {
        const dbFeatures = response.data.data.features;
        setFormData((prev) => ({
          ...prev,
          ...response.data.data,
          features: (Array.isArray(dbFeatures) && dbFeatures.length > 0)
            ? dbFeatures
            : INITIAL_KEY_FEATURES
        }));
      }
    } catch (error) {
      console.log("Using default key features configuration:", error.message);
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

  const handleOpenAddModal = () => {
    setEditingFeature(null);
    setModalForm({
      title: "",
      desc: "",
      icon: "CloudCheck",
      color: "bg-blue-50 text-blue-600",
      order: formData.features.length + 1,
      status: "Active"
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (item) => {
    setEditingFeature(item);
    setModalForm({
      title: item.title || "",
      desc: item.desc || "",
      icon: item.icon || "CloudCheck",
      color: item.color || "bg-blue-50 text-blue-600",
      order: item.order || 1,
      status: item.status || "Active"
    });
    setIsModalOpen(true);
  };

  const handleDeleteFeature = (id) => {
    if (confirm("Are you sure you want to delete this feature card?")) {
      setFormData((prev) => ({
        ...prev,
        features: prev.features.filter((item) => item.id !== id)
      }));
      setSavedSuccess(false);
    }
  };

  const toggleFeatureStatus = (id) => {
    setFormData((prev) => ({
      ...prev,
      features: prev.features.map((item) =>
        item.id === id
          ? { ...item, status: item.status === "Active" ? "Inactive" : "Active" }
          : item
      )
    }));
    setSavedSuccess(false);
  };

  const handleSaveModal = (e) => {
    e.preventDefault();
    if (!modalForm.title.trim()) return;

    if (editingFeature) {
      setFormData((prev) => ({
        ...prev,
        features: prev.features.map((item) =>
          item.id === editingFeature.id ? { ...item, ...modalForm } : item
        )
      }));
    } else {
      const newFeature = {
        id: `feat-${Date.now()}`,
        ...modalForm
      };
      setFormData((prev) => ({
        ...prev,
        features: [...prev.features, newFeature]
      }));
    }
    setIsModalOpen(false);
    setSavedSuccess(false);
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
      // API Call: POST /api/website/v1/key-features/save - Save/Update Key Features configuration
      const response = await axios.post(`${BASE_URL}/api/website/v1/key-features/save`, payload);
      if (response.data?.success) {
        if (response.data.data) {
          setFormData((prev) => ({
            ...prev,
            ...response.data.data
          }));
        }
        setSavedSuccess(true);
        setTimeout(() => setSavedSuccess(false), 3000);
      }
    } catch (error) {
      console.error("Failed to save Key Features config:", error);
      alert("Failed to save configuration: " + (error.response?.data?.message || error.message));
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    if (window.confirm("Reset to default configuration?")) {
      setFormData(DEFAULT_CONFIG);
      setSavedSuccess(false);
    }
  };

  const renderIcon = (iconName, extraClass = "w-5 h-5") => {
    const found = AVAILABLE_ICONS.find((i) => i.name === iconName);
    const Comp = found ? found.icon : FiZap;
    return <Comp className={extraClass} />;
  };

  return (
    <div className="min-h-screen pb-12">
      <PageHeader
        title="Website Configuration → Header → Key Features"
        subTitle="Manage Key Features section displayed on the SolarKits ERP landing page"
      />

      {/* Success alert */}
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
                Key Features section configuration updated and published successfully!
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
            {/* Section Header Settings */}
            <div className="bg-card border border-border/60 rounded-2xl p-6 shadow-xl backdrop-blur-md space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-border/50">
                <div className="flex items-center space-x-2 text-text">
                  <FiZap className="w-5 h-5 text-indigo-600" />
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
                    placeholder="e.g. Key Features"
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
                    placeholder="e.g. Powerful capabilities to transform your business"
                    className="w-full px-3.5 py-2.5 bg-bg/50 border border-border/70 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-semibold text-text placeholder:text-text/40 shadow-xs"
                  />
                </div>
              </div>
            </div>

            {/* Feature Cards Management */}
            <div className="bg-card border border-border/60 rounded-2xl p-6 shadow-xl backdrop-blur-md space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-border/50">
                <div>
                  <h4 className="font-bold text-sm text-text">
                    Feature Cards ({formData.features?.length || 0})
                  </h4>
                  <p className="text-xs text-text/60">Add, edit, reorder or disable feature cards</p>
                </div>
                <button
                  type="button"
                  onClick={handleOpenAddModal}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all shadow-xs"
                >
                  <FiPlus className="w-4 h-4" />
                  <span>Add Feature</span>
                </button>
              </div>

              <div className="grid grid-cols-1 gap-3 max-h-[480px] overflow-y-auto pr-1">
                {formData.features?.map((item) => (
                  <div
                    key={item.id}
                    className="p-3.5 rounded-xl border border-border/70 bg-bg/50 hover:bg-bg/85 hover:shadow-xs transition-all flex items-center justify-between space-x-3"
                  >
                    <div className="flex items-center space-x-3 overflow-hidden">
                      <div className={`p-2.5 rounded-xl flex-shrink-0 ${item.color || "bg-blue-50/10 text-blue-500"}`}>
                        {renderIcon(item.icon)}
                      </div>
                      <div className="truncate">
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-sm text-text truncate">{item.title}</span>
                          <span className="text-[10px] bg-bg border border-border text-text/60 font-bold px-1.5 py-0.5 rounded">
                            #{item.order}
                          </span>
                        </div>
                        <p className="text-xs text-text/60 truncate">{item.desc}</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-1 flex-shrink-0">
                      <button
                        type="button"
                        onClick={() => toggleFeatureStatus(item.id)}
                        className={`p-1.5 rounded-md text-xs font-semibold ${
                          item.status === "Active"
                            ? "text-emerald-600 bg-emerald-500/10 hover:bg-emerald-500/20"
                            : "text-text/40 bg-bg hover:bg-border/30"
                        }`}
                      >
                        {item.status}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleOpenEditModal(item)}
                        className="p-1.5 text-text/60 hover:text-indigo-600 hover:bg-bg rounded-md transition-all"
                      >
                        <FiEdit2 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteFeature(item.id)}
                        className="p-1.5 text-text/40 hover:text-rose-600 hover:bg-bg rounded-md transition-all"
                      >
                        <FiTrash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={handleReset}
                className="px-4 py-2.5 border border-border/80 rounded-xl text-xs font-bold text-text/70 hover:bg-bg/60 transition-all flex items-center space-x-2"
              >
                <span>Reset Default</span>
              </button>

              <button
                type="submit"
                disabled={isSaving}
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center space-x-2 shadow-md transition-all disabled:opacity-50 cursor-pointer"
              >
                <span>{isSaving ? "Saving..." : "Save Changes"}</span>
              </button>
            </div>
          </form>
        </div>

        {/* Live Preview Column */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between bg-card p-3 rounded-2xl border border-border/60 shadow-xl backdrop-blur-md">
            <span className="text-xs font-bold text-text uppercase tracking-wider flex items-center space-x-2">
              <HiSparkles className="w-4 h-4 text-amber-500" />
              <span>Live Website Preview</span>
            </span>

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

          <div className="bg-slate-200/70 p-4 rounded-3xl border border-slate-300 flex justify-center overflow-hidden">
            <div
              className={`bg-gradient-to-br from-blue-50 via-white to-orange-50 rounded-2xl border border-slate-200 p-6 transition-all duration-300 shadow-inner overflow-y-auto ${
                previewMode === "mobile" ? "w-[340px] text-center" : "w-full text-center"
              }`}
              style={{ maxHeight: "680px" }}
            >
              {!formData.enableSection ? (
                <div className="p-8 text-center text-slate-400">
                  <FiXCircle className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                  <p className="text-xs font-bold uppercase tracking-wider">Section is Disabled</p>
                  <p className="text-[11px] mt-1">This section will not be visible on the website.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-xl font-bold tracking-tight text-gray-800">
                      {formData.sectionTitle || "Key Features"}
                    </h2>
                    <p className="mt-1 text-xs text-gray-600">
                      {formData.subTitle || "Powerful capabilities to transform your business"}
                    </p>
                  </div>

                  <div
                    className={`grid gap-3 ${
                      previewMode === "mobile" ? "grid-cols-1" : "grid-cols-2"
                    }`}
                  >
                    {formData.features
                      ?.filter((f) => f.status === "Active")
                      .sort((a, b) => (a.order || 0) - (b.order || 0))
                      .map((feat) => (
                        <div
                          key={feat.id}
                          className="bg-white rounded-xl p-3 text-left shadow-xs border border-gray-100 flex gap-3 items-start"
                        >
                          <div className={`rounded-lg p-2.5 flex-shrink-0 ${feat.color || "bg-blue-50 text-blue-600"}`}>
                            {renderIcon(feat.icon, "h-4 w-4")}
                          </div>
                          <div>
                            <h3 className="text-xs font-bold text-gray-800">{feat.title}</h3>
                            <p className="mt-1 text-[11px] text-gray-500 leading-snug line-clamp-2">
                              {feat.desc}
                            </p>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* EDIT / ADD MODAL */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-card rounded-2xl shadow-xl w-full max-w-md border border-border/60 overflow-hidden"
            >
              <div className="p-5 border-b border-border/50 flex items-center justify-between">
                <h4 className="font-bold text-text text-sm">
                  {editingFeature ? "Edit Feature Card" : "Add New Feature Card"}
                </h4>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="text-text/60 hover:text-text p-1"
                >
                  <FiX className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveModal} className="p-5 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-text/80 mb-1">Feature Title</label>
                  <input
                    type="text"
                    required
                    value={modalForm.title}
                    onChange={(e) => setModalForm({ ...modalForm, title: e.target.value })}
                    placeholder="e.g. Cloud-Based"
                    className="w-full px-3 py-2 bg-bg/50 border border-border/70 rounded-lg text-sm font-semibold text-text focus:outline-none focus:border-indigo-500 shadow-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-text/80 mb-1">Description</label>
                  <textarea
                    rows={2}
                    value={modalForm.desc}
                    onChange={(e) => setModalForm({ ...modalForm, desc: e.target.value })}
                    placeholder="e.g. Access your business data anytime, anywhere..."
                    className="w-full px-3 py-2 bg-bg/50 border border-border/70 rounded-lg text-sm font-semibold text-text focus:outline-none focus:border-indigo-500 shadow-xs"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-text/80 mb-1">Icon</label>
                    <select
                      value={modalForm.icon}
                      onChange={(e) => setModalForm({ ...modalForm, icon: e.target.value })}
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
                      value={modalForm.color}
                      onChange={(e) => setModalForm({ ...modalForm, color: e.target.value })}
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
                      value={modalForm.order}
                      onChange={(e) => setModalForm({ ...modalForm, order: Number(e.target.value) })}
                      className="w-full px-3 py-2 bg-bg/50 border border-border/70 rounded-lg text-sm font-semibold text-text focus:outline-none focus:border-indigo-500 shadow-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-text/80 mb-1">Status</label>
                    <select
                      value={modalForm.status}
                      onChange={(e) => setModalForm({ ...modalForm, status: e.target.value })}
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
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 border border-border/80 rounded-lg text-xs font-bold text-text/70 hover:bg-bg/60"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-700 shadow-xs"
                  >
                    Save Feature
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
