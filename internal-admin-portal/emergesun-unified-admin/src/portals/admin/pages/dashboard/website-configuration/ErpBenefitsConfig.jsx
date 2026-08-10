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
  FiX,
  FiZap,
  FiShield,
  FiBarChart2,
  FiRefreshCw,
  FiHelpCircle,
  FiSmartphone as FiMobile,
  FiCloud,
  FiLock,
  FiSliders,
  FiCpu,
  FiCheckSquare,
  FiTrendingUp,
  FiEye,
  FiRepeat,
  FiClipboard,
  FiCreditCard,
  FiDollarSign,
  FiUsers,
  FiLayers,
  FiCheck
} from "react-icons/fi";
import { HiSparkles } from "react-icons/hi";

const AVAILABLE_ICONS = [
  { name: "TrendingUp", label: "Trending Up / Growth", icon: FiTrendingUp },
  { name: "Eye", label: "Eye / Visibility", icon: FiEye },
  { name: "ArrowLeftRight", label: "Streamlined / Sync", icon: FiRepeat },
  { name: "ClipboardList", label: "Compliance / Clipboard", icon: FiClipboard },
  { name: "Wallet", label: "Wallet / Cost", icon: FiCreditCard },
  { name: "DollarSign", label: "Finance / Money", icon: FiDollarSign },
  { name: "Shield", label: "Security / Shield", icon: FiShield },
  { name: "BarChart3", label: "Analytics / Chart", icon: FiBarChart2 },
  { name: "Zap", label: "Speed / Performance", icon: FiZap },
  { name: "Users", label: "Team / Users", icon: FiUsers },
  { name: "Cloud", label: "Cloud / Online", icon: FiCloud },
  { name: "CheckSquare", label: "Checkmark", icon: FiCheckSquare },
  { name: "Layers", label: "Layers / Modules", icon: FiLayers },
  { name: "Lock", label: "Lock / Safety", icon: FiLock },
  { name: "Sliders", label: "Sliders / Control", icon: FiSliders }
];

const COLOR_OPTIONS = [
  { label: "Purple", value: "bg-purple-50 text-purple-700" },
  { label: "Indigo", value: "bg-indigo-50 text-indigo-700" },
  { label: "Blue", value: "bg-blue-50 text-blue-700" },
  { label: "Green", value: "bg-green-50 text-green-700" },
  { label: "Orange", value: "bg-orange-50 text-orange-700" },
  { label: "Teal", value: "bg-teal-50 text-teal-700" },
  { label: "Amber", value: "bg-amber-50 text-amber-700" },
  { label: "Rose", value: "bg-rose-50 text-rose-700" },
  { label: "Emerald", value: "bg-emerald-50 text-emerald-700" }
];

const INITIAL_BENEFITS = [
  {
    id: "benefit-1",
    order: 1,
    title: "Increased Efficiency",
    desc: "Automate manual processes and reduce operational costs by up to 30%",
    icon: "TrendingUp",
    color: "bg-purple-50 text-purple-700",
    status: "Active"
  },
  {
    id: "benefit-2",
    order: 2,
    title: "Better Visibility",
    desc: "Real-time insights into all business operations and performance metrics",
    icon: "Eye",
    color: "bg-indigo-50 text-indigo-700",
    status: "Active"
  },
  {
    id: "benefit-3",
    order: 3,
    title: "Streamlined Operations",
    desc: "Seamless data flow between departments eliminating silos",
    icon: "ArrowLeftRight",
    color: "bg-blue-50 text-blue-700",
    status: "Active"
  },
  {
    id: "benefit-4",
    order: 4,
    title: "Improved Compliance",
    desc: "Automated compliance tracking and audit trails",
    icon: "ClipboardList",
    color: "bg-green-50 text-green-700",
    status: "Active"
  },
  {
    id: "benefit-5",
    order: 5,
    title: "Cost Reduction",
    desc: "Reduce IT costs, eliminate redundant systems, and optimize resources",
    icon: "Wallet",
    color: "bg-orange-50 text-orange-700",
    status: "Active"
  }
];

const DEFAULT_CONFIG = {
  sectionTitle: "Benefits of Our ERP System",
  enableSection: true,
  benefits: INITIAL_BENEFITS,
  rightCard: {
    title: "BUSINESS GROWTH",
    icon: "TrendingUp",
    color: "text-purple-300",
    textColor: "text-purple-400"
  },
  lastUpdated: new Date().toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" })
};

const BASE_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

export default function ErpBenefitsConfig() {
  const [formData, setFormData] = useState(DEFAULT_CONFIG);
  const [previewMode, setPreviewMode] = useState("desktop");
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBenefit, setEditingBenefit] = useState(null);
  const [modalForm, setModalForm] = useState({
    title: "",
    desc: "",
    icon: "TrendingUp",
    color: "bg-purple-50 text-purple-700",
    order: 1,
    status: "Active"
  });

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      // API Call: GET /api/website/v1/erp-benefits/get - Fetch ERP Benefits configuration
      const response = await axios.get(`${BASE_URL}/api/website/v1/erp-benefits/get?t=${Date.now()}`);
      if (response.data?.data) {
        const dbBenefits = response.data.data.benefits;
        setFormData((prev) => ({
          ...prev,
          ...response.data.data,
          benefits: (Array.isArray(dbBenefits) && dbBenefits.length > 0)
            ? dbBenefits
            : INITIAL_BENEFITS,
          rightCard: response.data.data.rightCard || DEFAULT_CONFIG.rightCard
        }));
      }
    } catch (error) {
      console.log("Using default ERP benefits configuration:", error.message);
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

  const handleRightCardChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      rightCard: {
        ...prev.rightCard,
        [name]: value
      }
    }));
    setSavedSuccess(false);
  };

  const handleOpenAddModal = () => {
    setEditingBenefit(null);
    setModalForm({
      title: "",
      desc: "",
      icon: "TrendingUp",
      color: "bg-purple-50 text-purple-700",
      order: formData.benefits.length + 1,
      status: "Active"
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (item) => {
    setEditingBenefit(item);
    setModalForm({
      title: item.title || "",
      desc: item.desc || "",
      icon: item.icon || "TrendingUp",
      color: item.color || "bg-purple-50 text-purple-700",
      order: item.order || 1,
      status: item.status || "Active"
    });
    setIsModalOpen(true);
  };

  const handleModalSave = () => {
    if (!modalForm.title.trim()) return;

    setFormData((prev) => {
      let updatedBenefits;
      if (editingBenefit) {
        updatedBenefits = prev.benefits.map((item) =>
          item.id === editingBenefit.id ? { ...item, ...modalForm } : item
        );
      } else {
        const newItem = {
          id: `benefit-${Date.now()}`,
          ...modalForm
        };
        updatedBenefits = [...prev.benefits, newItem];
      }
      return { ...prev, benefits: updatedBenefits };
    });

    setIsModalOpen(false);
    setSavedSuccess(false);
  };

  const handleDeleteBenefit = (id) => {
    setFormData((prev) => ({
      ...prev,
      benefits: prev.benefits.filter((item) => item.id !== id)
    }));
    setSavedSuccess(false);
  };

  const handleToggleStatus = (id) => {
    setFormData((prev) => ({
      ...prev,
      benefits: prev.benefits.map((item) =>
        item.id === id
          ? { ...item, status: item.status === "Active" ? "Inactive" : "Active" }
          : item
      )
    }));
    setSavedSuccess(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setSavedSuccess(false);

    try {
      const payload = {
        ...formData,
        lastUpdated: new Date().toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" })
      };

      // API Call: POST /api/website/v1/erp-benefits/save - Save/Update ERP Benefits configuration
      const response = await axios.post(`${BASE_URL}/api/website/v1/erp-benefits/save`, payload);
      if (response.data?.success) {
        setSavedSuccess(true);
        if (response.data.data) {
          setFormData((prev) => ({ ...prev, ...response.data.data }));
        }
      }
    } catch (error) {
      console.error("Failed to save ERP Benefits config:", error);
      alert("Failed to save configuration: " + (error.response?.data?.message || error.message));
    } finally {
      setIsSaving(false);
    }
  };

  const renderIcon = (iconName, className = "w-5 h-5") => {
    const iconObj = AVAILABLE_ICONS.find((i) => i.name === iconName);
    const Component = iconObj ? iconObj.icon : FiTrendingUp;
    return <Component className={className} />;
  };

  return (
    <div className="min-h-screen pb-12">
      <PageHeader
        title="Website Configuration → Header → ERP Benefits"
        subTitle="Manage the Benefits of Our ERP System section displayed on the Emergesun ERP landing page"
      />

      {savedSuccess && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 flex items-center gap-3 rounded-2xl bg-emerald-50 border border-emerald-200 p-4 text-emerald-800 shadow-sm"
        >
          <FiCheckCircle className="h-6 w-6 text-emerald-600 flex-shrink-0" />
          <div>
            <p className="font-semibold">Published Successfully!</p>
            <p className="text-sm text-emerald-700">ERP Benefits configuration updated and live on website.</p>
          </div>
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-8">
        {/* Left Column: Form & Management */}
        <div className="lg:col-span-7 space-y-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* General Section Settings */}
            <div className="bg-card border border-border/60 rounded-2xl p-6 shadow-xl backdrop-blur-md">
              <div className="flex items-center justify-between border-b border-border/50 pb-4 mb-6">
                <div>
                  <h3 className="text-lg font-bold text-text flex items-center gap-2">
                    <HiSparkles className="text-purple-600" /> Section Settings
                  </h3>
                  <p className="text-xs text-text/60">Configure header title and section visibility</p>
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

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-text/80 mb-1">
                    Section Main Title
                  </label>
                  <input
                    type="text"
                    name="sectionTitle"
                    value={formData.sectionTitle}
                    onChange={handleChange}
                    placeholder="e.g. Benefits of Our ERP System"
                    className="w-full bg-bg/50 rounded-xl border border-border/70 px-4 py-2.5 text-sm text-text focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-100 transition"
                  />
                </div>
              </div>
            </div>

            {/* Right Graphic Card Settings */}
            <div className="bg-card border border-border/60 rounded-2xl p-6 shadow-xl backdrop-blur-md">
              <div className="border-b border-border/50 pb-4 mb-6">
                <h3 className="text-lg font-bold text-text flex items-center gap-2">
                  <FiTrendingUp className="text-purple-600" /> Right Graphic Card Customization
                </h3>
                <p className="text-xs text-text/60">Customize the visual card displayed alongside the benefits</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-text/80 mb-1">
                    Card Title
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={formData.rightCard?.title || ""}
                    onChange={handleRightCardChange}
                    placeholder="e.g. BUSINESS GROWTH"
                    className="w-full bg-bg/50 rounded-xl border border-border/70 px-4 py-2.5 text-sm text-text focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-100 transition"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-text/80 mb-1">
                    Card Icon
                  </label>
                  <select
                    name="icon"
                    value={formData.rightCard?.icon || "TrendingUp"}
                    onChange={handleRightCardChange}
                    className="w-full bg-bg/50 rounded-xl border border-border/70 px-4 py-2.5 text-sm text-text focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-100 transition"
                  >
                    {AVAILABLE_ICONS.map((i) => (
                      <option key={i.name} value={i.name}>
                        {i.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Benefits List Management */}
            <div className="bg-card border border-border/60 rounded-2xl p-6 shadow-xl backdrop-blur-md">
              <div className="flex items-center justify-between border-b border-border/50 pb-4 mb-6">
                <div>
                  <h3 className="text-lg font-bold text-text flex items-center gap-2">
                    <FiCheckCircle className="text-purple-600" /> Benefits List ({formData.benefits.length})
                  </h3>
                  <p className="text-xs text-text/60">Add, edit, or disable individual ERP benefits</p>
                </div>

                <button
                  type="button"
                  onClick={handleOpenAddModal}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-50 text-purple-700 font-semibold text-sm hover:bg-purple-100 transition"
                >
                  <FiPlus /> Add Benefit
                </button>
              </div>

              <div className="space-y-3">
                {formData.benefits.map((item, idx) => (
                  <div
                    key={item.id || idx}
                    className={`flex items-center justify-between p-4 rounded-xl border transition ${
                      item.status === "Active"
                        ? "border-border/70 bg-bg/50"
                        : "border-border/50 bg-bg/20 opacity-60"
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className={`p-2.5 rounded-full flex-shrink-0 ${item.color || "bg-purple-50 text-purple-700"}`}>
                        {renderIcon(item.icon, "w-4 h-4")}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-text truncate">{item.title}</span>
                          <span
                            className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded-full ${
                              item.status === "Active"
                                ? "bg-emerald-100 text-emerald-700"
                                : "bg-bg text-text/60"
                            }`}
                          >
                            {item.status}
                          </span>
                        </div>
                        <p className="text-xs text-text/60 truncate mt-0.5">{item.desc}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 ml-4">
                      <button
                        type="button"
                        onClick={() => handleToggleStatus(item.id)}
                        className={`p-2 rounded-lg text-xs font-semibold transition ${
                          item.status === "Active"
                            ? "bg-amber-50 text-amber-700 hover:bg-amber-100"
                            : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                        }`}
                        title="Toggle Active/Inactive"
                      >
                        {item.status === "Active" ? "Deactivate" : "Activate"}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleOpenEditModal(item)}
                        className="p-2 rounded-lg bg-bg border border-border/80 text-text/70 hover:bg-bg/60 transition"
                        title="Edit"
                      >
                        <FiEdit2 className="w-4 h-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteBenefit(item.id)}
                        className="p-2 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 transition"
                        title="Delete"
                      >
                        <FiTrash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Save Button */}
            <div className="flex items-center justify-between pt-4">
              <span className="text-xs text-text/40">
                Last published: {formData.lastUpdated || "N/A"}
              </span>

              <button
                type="submit"
                disabled={isSaving}
                className="flex items-center gap-2 px-8 py-3 rounded-xl bg-purple-600 text-white font-bold text-sm hover:bg-purple-700 shadow-lg shadow-purple-600/20 disabled:opacity-50 transition"
              >
                {isSaving ? (
                  <>
                    <FiRefreshCw className="animate-spin" /> Saving...
                  </>
                ) : (
                  <>
                    <FiCheck /> Save & Publish Configuration
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Right Column: Live Preview */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-card border border-border/60 rounded-2xl p-6 shadow-xl backdrop-blur-md lg:sticky lg:top-6">
            <div className="flex items-center justify-between border-b border-border/50 pb-4 mb-4">
              <h3 className="font-bold text-text text-sm flex items-center gap-2">
                <FiMonitor className="text-purple-600" /> Live Landing Page Preview
              </h3>

              <div className="flex items-center gap-1 bg-bg/80 border border-border/50 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setPreviewMode("desktop")}
                  className={`px-3 py-1 text-xs font-semibold rounded-lg transition ${
                    previewMode === "desktop" ? "bg-primary text-white shadow-sm" : "text-text/60 hover:text-text"
                  }`}
                >
                  <FiMonitor className="inline mr-1" /> Desktop
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewMode("mobile")}
                  className={`px-3 py-1 text-xs font-semibold rounded-lg transition ${
                    previewMode === "mobile" ? "bg-primary text-white shadow-sm" : "text-text/60 hover:text-text"
                  }`}
                >
                  <FiSmartphone className="inline mr-1" /> Mobile
                </button>
              </div>
            </div>

            {/* Preview Box */}
            <div
              className={`mx-auto border border-border/60 rounded-2xl overflow-hidden bg-gradient-to-br from-blue-50/50 via-bg to-orange-50/50 transition-all ${
                previewMode === "mobile" ? "max-w-[340px] p-4" : "w-full p-6"
              }`}
            >
              {!formData.enableSection ? (
                <div className="p-8 text-center text-text/40 text-sm font-medium">
                  Section is currently disabled.
                </div>
              ) : (
                <div className={`flex flex-col gap-6 ${previewMode === "mobile" ? "" : "lg:flex-row lg:items-center"}`}>
                  {/* Left Column in Preview */}
                  <div className="flex-1 space-y-4">
                    <h2 className="text-xl font-extrabold text-text tracking-tight">
                      {formData.sectionTitle || "Benefits of Our ERP System"}
                    </h2>

                    <div className="space-y-3">
                      {formData.benefits
                        .filter((b) => b.status === "Active")
                        .map((item, idx) => (
                          <div key={idx} className="flex gap-3 items-start">
                            <div className={`rounded-full p-2 flex-shrink-0 ${item.color || "bg-purple-50 text-purple-700"}`}>
                              {renderIcon(item.icon, "h-4 h-4")}
                            </div>
                            <div>
                              <h4 className="text-xs font-bold text-text">{item.title}</h4>
                              <p className="text-[11px] text-text/60 leading-normal mt-0.5">{item.desc}</p>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>

                  {/* Right Column Graphic Card in Preview */}
                  <div className={`${previewMode === "mobile" ? "w-full" : "w-full lg:w-44 flex-shrink-0"}`}>
                    <div className="h-44 w-full rounded-2xl bg-gradient-to-br from-blue-50/80 via-bg to-orange-50/80 flex flex-col items-center justify-center p-4 shadow-md text-center border border-border/50">
                      {renderIcon(formData.rightCard?.icon || "TrendingUp", "h-16 w-16 text-purple-300 animate-pulse")}
                      <h4 className="mt-3 text-xs font-black text-purple-400 tracking-wide uppercase">
                        {formData.rightCard?.title || "BUSINESS GROWTH"}
                      </h4>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal for Add / Edit Benefit */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-card rounded-2xl border border-border/60 p-6 w-full max-w-lg shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between border-b border-border/50 pb-3">
                <h3 className="font-bold text-text text-base">
                  {editingBenefit ? "Edit Benefit Item" : "Add New Benefit Item"}
                </h3>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-1 rounded-lg text-text/40 hover:text-text hover:bg-bg/60"
                >
                  <FiX className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-text/80 mb-1">Benefit Title</label>
                  <input
                    type="text"
                    value={modalForm.title}
                    onChange={(e) => setModalForm({ ...modalForm, title: e.target.value })}
                    placeholder="e.g. Increased Efficiency"
                    className="w-full bg-bg/50 rounded-xl border border-border/70 px-3.5 py-2 text-sm text-text focus:border-purple-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-text/80 mb-1">Description</label>
                  <textarea
                    rows={2}
                    value={modalForm.desc}
                    onChange={(e) => setModalForm({ ...modalForm, desc: e.target.value })}
                    placeholder="e.g. Automate manual processes and reduce operational costs..."
                    className="w-full bg-bg/50 rounded-xl border border-border/70 px-3.5 py-2 text-sm text-text focus:border-purple-500 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-text/80 mb-1">Icon</label>
                    <select
                      value={modalForm.icon}
                      onChange={(e) => setModalForm({ ...modalForm, icon: e.target.value })}
                      className="w-full bg-bg/50 rounded-xl border border-border/70 px-3.5 py-2 text-sm text-text focus:border-purple-500 focus:outline-none"
                    >
                      {AVAILABLE_ICONS.map((i) => (
                        <option key={i.name} value={i.name}>
                          {i.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-text/80 mb-1">Color Palette</label>
                    <select
                      value={modalForm.color}
                      onChange={(e) => setModalForm({ ...modalForm, color: e.target.value })}
                      className="w-full bg-bg/50 rounded-xl border border-border/70 px-3.5 py-2 text-sm text-text focus:border-purple-500 focus:outline-none"
                    >
                      {COLOR_OPTIONS.map((c) => (
                        <option key={c.value} value={c.value}>
                          {c.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-text/80 mb-1">Order</label>
                    <input
                      type="number"
                      value={modalForm.order}
                      onChange={(e) => setModalForm({ ...modalForm, order: Number(e.target.value) })}
                      className="w-full bg-bg/50 rounded-xl border border-border/70 px-3.5 py-2 text-sm text-text focus:border-purple-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-text/80 mb-1">Status</label>
                    <select
                      value={modalForm.status}
                      onChange={(e) => setModalForm({ ...modalForm, status: e.target.value })}
                      className="w-full bg-bg/50 rounded-xl border border-border/70 px-3.5 py-2 text-sm text-text focus:border-purple-500 focus:outline-none"
                    >
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-border/50">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-text/75 font-semibold text-xs hover:bg-bg/60"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleModalSave}
                  className="px-5 py-2 rounded-xl bg-purple-600 text-white font-bold text-xs hover:bg-purple-700"
                >
                  {editingBenefit ? "Save Changes" : "Add Benefit"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
